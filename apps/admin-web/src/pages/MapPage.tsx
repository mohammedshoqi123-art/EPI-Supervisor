// ═══════════════════════════════════════════════════════════
// Map Page — Enhanced with Role Colors + PDF Export
// الخريطة التفاعلية — ألوان حسب المستوى + تصدير PDF
// ═══════════════════════════════════════════════════════════

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  MapPin, Filter, Layers, User, FileText, Eye, ExternalLink,
  RotateCcw, ChevronDown, ChevronUp, Calendar, Search, Globe,
  BarChart3, Target, Users, Clock, Navigation, ZoomIn, ZoomOut,
  Maximize2, X, FileDown, Loader2, Printer, Building, Landmark,
  MapPinned
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { useSubmissions, useForms, useGovernorates, useUsers, useDashboardStats } from '@/hooks/useApi'
import { formatDateTime, formatRelativeTime, formatNumber, cn } from '@/lib/utils'
import { useCampaign } from '@/lib/campaign-context'
import { STATUS_LABELS, STATUS_COLORS, type SubmissionStatus } from '@/types/database'
import { useNavigate } from 'react-router-dom'
import { useToast } from '@/hooks/useToast'
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ═══ Role-Based Color System ═══
const ROLE_COLORS = {
  admin: { bg: '#7c3aed', light: '#ede9fe', text: '#7c3aed', label: 'مدير النظام', icon: '🔴' },
  central: { bg: '#2563eb', light: '#dbeafe', text: '#2563eb', label: 'مركزي', icon: '🟣' },
  governorate: { bg: '#059669', light: '#d1fae5', text: '#059669', label: 'محافظة', icon: '🔵' },
  district: { bg: '#d97706', light: '#fef3c7', text: '#d97706', label: 'مديرية', icon: '🟢' },
  data_entry: { bg: '#6b7280', light: '#f3f4f6', text: '#6b7280', label: 'إدخال بيانات', icon: '⚪' },
}

// ═══ Custom marker icons ═══
function createRoleIcon(role: string, isSelected: boolean) {
  const colors: Record<string, string> = {
    admin: '#7c3aed',
    central: '#2563eb',
    governorate: '#059669',
    district: '#d97706',
    data_entry: '#6b7280',
  }
  const color = colors[role] || '#6b7280'
  const size = isSelected ? 18 : 12
  const borderW = isSelected ? 3 : 2

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${borderW}px solid white;
      box-shadow:0 2px 8px ${color}80;
      ${isSelected ? 'transform:scale(1.3);' : ''}
      transition:all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createStatusIcon(status: string, isSelected: boolean) {
  const colors: Record<string, string> = {
    draft: '#f59e0b',
    submitted: '#10b981',
    approved: '#3b82f6',
    rejected: '#ef4444',
  }
  const color = colors[status] || '#6b7280'
  const size = isSelected ? 16 : 10
  const borderW = isSelected ? 3 : 2

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${borderW}px solid white;
      box-shadow:0 2px 8px ${color}80;
      ${isSelected ? 'transform:scale(1.3);' : ''}
      transition:all 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createClusterIcon(count: number, color?: string) {
  const c = color || (count >= 50 ? '#059669' : count >= 20 ? '#10b981' : count >= 10 ? '#3b82f6' : count >= 5 ? '#f59e0b' : '#f97316')
  const size = count >= 50 ? 48 : count >= 20 ? 42 : count >= 10 ? 36 : 30

  return L.divIcon({
    className: 'cluster-marker',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${c};border:3px solid white;
      box-shadow:0 3px 12px ${c}60;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:800;font-size:${size > 40 ? 16 : 13}px;
      font-family:Cairo,sans-serif;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

// ─── Map controller component ───
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])
  return null
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
    } else if (points.length === 1) {
      map.setView(points[0], 12)
    }
  }, [points, map])
  return null
}

// ═══ PDF Export Helper with Map Images ═══

/** Download and composite OSM tiles into a single image with GPS markers */
async function generateStaticMapImage(
  centerLat: number, centerLng: number, zoom: number = 10,
  markers: Array<{ lat: number; lng: number; name: string; role: string }> = []
): Promise<string | null> {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const n = Math.pow(2, zoom)
    const centerTileX = Math.floor((centerLng + 180) / 360 * n)
    const centerTileY = Math.floor((1 - Math.log(Math.tan(centerLat * Math.PI / 180) + 1 / Math.cos(centerLat * Math.PI / 180)) / Math.PI) / 2 * n)

    const tileSize = 256
    const gridSize = 5 // 5x5 grid for more area coverage
    canvas.width = tileSize * gridSize
    canvas.height = tileSize * gridSize

    // Load tiles
    const promises: Promise<void>[] = []
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const tx = centerTileX + dx
        const ty = centerTileY + dy
        if (tx < 0 || ty < 0 || tx >= n || ty >= n) continue

        const promise = new Promise<void>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            ctx.drawImage(img, (dx + 2) * tileSize, (dy + 2) * tileSize, tileSize, tileSize)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`
        })
        promises.push(promise)
      }
    }

    await Promise.all(promises)

    // Convert GPS coordinates to pixel positions on the canvas
    const roleColors: Record<string, string> = {
      admin: '#7c3aed',
      central: '#2563eb',
      governorate: '#059669',
      district: '#d97706',
      data_entry: '#6b7280',
    }

    // Draw markers
    markers.forEach((marker, idx) => {
      // Convert lat/lng to tile coordinates
      const markerTileX = (marker.lng + 180) / 360 * n
      const markerTileY = (1 - Math.log(Math.tan(marker.lat * Math.PI / 180) + 1 / Math.cos(marker.lat * Math.PI / 180)) / Math.PI) / 2 * n

      // Convert to pixel position on canvas (relative to center tiles)
      const pixelX = (markerTileX - (centerTileX - 2)) * tileSize
      const pixelY = (markerTileY - (centerTileY - 2)) * tileSize

      // Only draw if within canvas bounds
      if (pixelX >= 0 && pixelX <= canvas.width && pixelY >= 0 && pixelY <= canvas.height) {
        const color = roleColors[marker.role] || '#6b7280'

        // Shadow
        ctx.beginPath()
        ctx.arc(pixelX, pixelY + 1, 7, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.fill()

        // Marker circle
        ctx.beginPath()
        ctx.arc(pixelX, pixelY, 6, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()

        // Label (name) — only for first 15 markers to avoid clutter
        if (idx < 15 && marker.name) {
          ctx.font = 'bold 9px Cairo, sans-serif'
          const textWidth = ctx.measureText(marker.name).width

          // Background (with roundRect fallback for older browsers)
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          const labelX = pixelX - textWidth / 2 - 3
          const labelY = pixelY - 20
          const labelW = textWidth + 6
          const labelH = 13
          const labelR = 2
          if (ctx.roundRect) {
            ctx.roundRect(labelX, labelY, labelW, labelH, labelR)
          } else {
            ctx.rect(labelX, labelY, labelW, labelH)
          }
          ctx.fill()

          // Text
          ctx.fillStyle = '#1f2937'
          ctx.textAlign = 'center'
          ctx.fillText(marker.name, pixelX, pixelY - 10)
        }
      }
    })

    // If no markers, add a center dot
    if (markers.length === 0) {
      const cx = canvas.width / 2
      const cy = canvas.height / 2
      ctx.beginPath()
      ctx.arc(cx, cy, 8, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 3
      ctx.stroke()
    }

    // Add legend if markers exist
    if (markers.length > 0) {
      const legendX = 10
      const legendY = canvas.height - 10 - Object.keys(roleColors).length * 16

      // Legend background (with roundRect fallback)
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      const lgX = legendX, lgY = legendY - 5, lgW = 110, lgH = Object.keys(roleColors).length * 16 + 10
      if (ctx.roundRect) {
        ctx.roundRect(lgX, lgY, lgW, lgH, 4)
      } else {
        ctx.rect(lgX, lgY, lgW, lgH)
      }
      ctx.fill()
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.stroke()

      // Legend items
      let ly = legendY + 6
      Object.entries(roleColors).forEach(([role, color]) => {
        ctx.beginPath()
        ctx.arc(legendX + 10, ly, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        ctx.font = '9px Cairo, sans-serif'
        ctx.fillStyle = '#374151'
        ctx.textAlign = 'right'
        const roleLabels: Record<string, string> = {
          admin: 'مدير النظام', central: 'مركزي', governorate: 'محافظة',
          district: 'مديرية', data_entry: 'إدخال بيانات'
        }
        ctx.fillText(roleLabels[role] || role, legendX + 105, ly + 3)
        ly += 16
      })
    }

    return canvas.toDataURL('image/jpeg', 0.85)
  } catch (err) {
    console.warn('Static map generation failed:', err)
    return null
  }
}

/** Generate a single overview map image covering all GPS points */
async function generateOverviewMapImage(
  allMarkers: Array<{ lat: number; lng: number; name: string; role: string }>
): Promise<string | null> {
  if (allMarkers.length === 0) return null

  try {
    // Calculate bounding box
    const lats = allMarkers.map(m => m.lat)
    const lngs = allMarkers.map(m => m.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const centerLat = (minLat + maxLat) / 2
    const centerLng = (minLng + maxLng) / 2

    // Estimate zoom level from bounding box span
    const latSpan = maxLat - minLat
    const lngSpan = maxLng - minLng
    const maxSpan = Math.max(latSpan, lngSpan)
    let zoom = 10
    if (maxSpan > 10) zoom = 5
    else if (maxSpan > 5) zoom = 6
    else if (maxSpan > 2) zoom = 7
    else if (maxSpan > 1) zoom = 8
    else if (maxSpan > 0.5) zoom = 9

    return await generateStaticMapImage(centerLat, centerLng, zoom, allMarkers.slice(0, 100))
  } catch (err) {
    console.warn('Overview map generation failed:', err)
    return null
  }
}

async function generateMapPDF(
  stats: { total: number; governorates: number; supervisors: number; submitted: number },
  allMarkers: Array<{ lat: number; lng: number; name: string; role: string }>,
  govData: Array<{
    name: string; submissions: number; supervisors: string[];
    byStatus: Record<string, number>; lat: number; lng: number;
    submissionData?: Array<{ gps_lat?: number; gps_lng?: number; profiles?: { full_name?: string; role?: string } }>
  }>,
  toast: (opts: { title: string; variant?: 'default' | 'destructive' | 'success' | 'warning' | null }) => void
) {
  toast({ title: 'جاري إنشاء التقرير مع صور الخريطة...', variant: 'default' })

  try {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageW = 297
    const pageH = 210

    // ── Generate overview map covering ALL GPS points (not a screen capture) ──
    const mapImage = await generateOverviewMapImage(allMarkers)

    // ── Page 1: Overview ──
    // Header
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageW, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text('منصة مشرف EPI - تقرير الخريطة', pageW / 2, 15, { align: 'center' })
    doc.setFontSize(11)
    doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-SA')}`, pageW / 2, 25, { align: 'center' })

    // Map image (if captured)
    if (mapImage) {
      try {
        doc.addImage(mapImage, 'JPEG', 15, 38, pageW - 30, 70)
        // Add label over map
        doc.setGState(new (doc as any).GState({ opacity: 0.6 }))
        doc.roundedRect(15, 38, 80, 8, 2, 2, 'F')
        doc.setGState(new (doc as any).GState({ opacity: 1 }))
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.text('خريطة عامة — جميع الإرساليات', 55, 43.5, { align: 'center' })
      } catch { /* ignore image errors */ }
    }

    // Stats cards (below map or at top if no map)
    const cardY = mapImage ? 112 : 45
    const cardW = 60
    const cardH = 30
    const cardGap = 10
    const startX = (pageW - (cardW * 4 + cardGap * 3)) / 2

    const statCards = [
      { label: 'نقاط GPS', value: stats.total.toString(), color: [37, 99, 235] },
      { label: 'محافظة', value: stats.governorates.toString(), color: [5, 150, 105] },
      { label: 'مشرف نشط', value: stats.supervisors.toString(), color: [124, 58, 237] },
      { label: 'مُرسلة', value: stats.submitted.toString(), color: [16, 185, 129] },
    ]

    statCards.forEach((card, i) => {
      const x = startX + i * (cardW + cardGap)
      doc.setFillColor(...card.color as [number, number, number])
      doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text(card.value, x + cardW / 2, cardY + 14, { align: 'center' })
      doc.setFontSize(8)
      doc.text(card.label, x + cardW / 2, cardY + 23, { align: 'center' })
    })

    // Governorate table
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.text('ملخص المحافظات', pageW - 15, 85, { align: 'right' })

    // Table header
    const tableY = 92
    const colWidths = [15, 80, 40, 40, 40, 50]
    const colX = [15]
    for (let i = 1; i < colWidths.length; i++) colX.push(colX[i - 1] + colWidths[i - 1])

    doc.setFillColor(243, 244, 246)
    doc.rect(15, tableY, pageW - 30, 8, 'F')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    const headers = ['#', 'المحافظة', 'الإرساليات', 'المشرفون', 'مُرسلة', 'التغطية']
    headers.forEach((h, i) => {
      doc.text(h, colX[i] + colWidths[i] / 2, tableY + 5.5, { align: 'center' })
    })

    // Table rows
    const totalSubs = govData.reduce((s, g) => s + g.submissions, 0)
    govData.slice(0, 15).forEach((gov, idx) => {
      const rowY = tableY + 8 + idx * 7
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(15, rowY, pageW - 30, 7, 'F')
      }
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(7)
      const coverage = totalSubs > 0 ? ((gov.submissions / totalSubs) * 100).toFixed(1) + '%' : '0%'
      const rowData = [
        (idx + 1).toString(),
        gov.name,
        gov.submissions.toString(),
        gov.supervisors.length.toString(),
        (gov.byStatus['submitted'] || 0).toString(),
        coverage,
      ]
      rowData.forEach((val, i) => {
        doc.text(val, colX[i] + colWidths[i] / 2, rowY + 5, { align: 'center' })
      })
    })

    // Footer
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)
    doc.text('منصة مشرف EPI — تقرير تلقائي', pageW / 2, pageH - 5, { align: 'center' })
    doc.text(`صفحة 1 من ${govData.length + 1}`, pageW - 15, pageH - 5, { align: 'right' })

    // ── Pages 2+: One per governorate (with map images) ──
    for (let govIdx = 0; govIdx < govData.length; govIdx++) {
      const gov = govData[govIdx]
      doc.addPage('a4', 'landscape')

      // Generate static map image for this governorate with supervisor markers
      const govMarkers = (gov.submissionData || [])
        .filter((s) => s.gps_lat && s.gps_lng)
        .map((s) => ({
          lat: s.gps_lat!,
          lng: s.gps_lng!,
          name: s.profiles?.full_name || '',
          role: s.profiles?.role || 'data_entry',
        }))
      // Limit to 50 markers to avoid performance issues
      const govMapImage = await generateStaticMapImage(gov.lat, gov.lng, 10, govMarkers.slice(0, 50))

      // Header bar with governorate color
      const colors: [number, number, number][] = [
        [37, 99, 235], [5, 150, 105], [124, 58, 237], [217, 119, 6],
        [220, 38, 38], [6, 182, 212], [236, 72, 153], [132, 204, 22],
        [249, 115, 22], [99, 102, 241], [16, 185, 129], [245, 158, 11],
        [239, 68, 68], [168, 85, 247], [14, 165, 233],
      ]
      const color = colors[govIdx % colors.length]
      doc.setFillColor(...color)
      doc.rect(0, 0, pageW, 25, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text(gov.name, pageW / 2, 12, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`تقرير المحافظة — ${gov.submissions} إرسالية`, pageW / 2, 20, { align: 'center' })

      // Map image (left side) + Stats (right side)
      const mapX = 15
      const mapY = 30
      const mapW = 130
      const mapH = 80

      if (govMapImage) {
        try {
          // Map background
          doc.setFillColor(229, 231, 235)
          doc.roundedRect(mapX, mapY, mapW, mapH, 3, 3, 'F')
          doc.addImage(govMapImage, 'JPEG', mapX + 2, mapY + 2, mapW - 4, mapH - 4)

          // Label overlay
          doc.setFillColor(0, 0, 0)
          doc.setGState(new (doc as any).GState({ opacity: 0.5 }))
          doc.roundedRect(mapX + 2, mapY + 2, 60, 7, 1, 1, 'F')
          doc.setGState(new (doc as any).GState({ opacity: 1 }))
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(7)
          doc.text(`${gov.name} — عرض مُكبّر`, mapX + 32, mapY + 6.5, { align: 'center' })

          // Marker at center
          doc.setFillColor(239, 68, 68)
          doc.circle(mapX + mapW / 2, mapY + mapH / 2, 3, 'F')
          doc.setFillColor(255, 255, 255)
          doc.circle(mapX + mapW / 2, mapY + mapH / 2, 1.5, 'F')
        } catch { /* ignore */ }
      } else {
        // Fallback: placeholder
        doc.setFillColor(243, 244, 246)
        doc.roundedRect(mapX, mapY, mapW, mapH, 3, 3, 'F')
        doc.setTextColor(156, 163, 175)
        doc.setFontSize(10)
        doc.text('الخريطة غير متاحة', mapX + mapW / 2, mapY + mapH / 2, { align: 'center' })
      }

      // Stats cards (right side of map)
      const statsX = 155
      const statCardsGov = [
        { label: 'الإجمالي', value: gov.submissions.toString(), color: color },
        { label: 'المشرفون', value: gov.supervisors.length.toString(), color: [124, 58, 237] as [number, number, number] },
        { label: 'مُرسلة', value: (gov.byStatus['submitted'] || 0).toString(), color: [16, 185, 129] as [number, number, number] },
        { label: 'مسودات', value: (gov.byStatus['draft'] || 0).toString(), color: [245, 158, 11] as [number, number, number] },
      ]

      statCardsGov.forEach((card, i) => {
        const y = mapY + i * 20
        doc.setFillColor(...card.color)
        doc.roundedRect(statsX, y, 125, 17, 2, 2, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(16)
        doc.text(card.value, statsX + 100, y + 8, { align: 'center' })
        doc.setFontSize(8)
        doc.text(card.label, statsX + 100, y + 14, { align: 'center' })
      })

      // Coverage bar
      const barY = 115
      const coverage = totalSubs > 0 ? (gov.submissions / totalSubs) * 100 : 0
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(9)
      doc.text(`التغطية: ${coverage.toFixed(1)}% من إجمالي الإرساليات`, pageW - 15, barY, { align: 'right' })
      doc.setFillColor(229, 231, 235)
      doc.roundedRect(15, barY + 3, pageW - 30, 6, 2, 2, 'F')
      doc.setFillColor(...color)
      doc.roundedRect(15, barY + 3, Math.max(2, (pageW - 30) * coverage / 100), 6, 2, 2, 'F')

      // Supervisors list
      const listY = 80
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text('المشرفون', pageW - 15, listY, { align: 'right' })

      doc.setFontSize(8)
      gov.supervisors.forEach((name, i) => {
        if (i < 20) {
          const rowY = listY + 8 + i * 6
          doc.setFillColor(i % 2 === 0 ? 249 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 251 : 255)
          doc.rect(15, rowY - 3, pageW - 30, 6, 'F')
          doc.setTextColor(0, 0, 0)
          doc.text(`${i + 1}. ${name}`, 20, rowY)
        }
      })

      if (gov.supervisors.length > 20) {
        doc.setTextColor(156, 163, 175)
        doc.text(`+ ${gov.supervisors.length - 20} آخرين`, 20, listY + 8 + 20 * 6)
      }

      // Status distribution
      const distY = listY + 8 + Math.min(gov.supervisors.length, 20) * 6 + 15
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      doc.text('توزيع الحالات', pageW - 15, distY, { align: 'right' })

      const statusEntries = Object.entries(gov.byStatus)
      const STATUS_LABELS_AR: Record<string, string> = { submitted: 'مُرسلة', draft: 'مسودة', approved: 'مقبولة', rejected: 'مرفوضة' }
      statusEntries.forEach(([status, count], i) => {
        const x = 20 + i * 80
        const barW = 60
        const pct = gov.submissions > 0 ? (count as number / gov.submissions) * 100 : 0
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text(`${STATUS_LABELS_AR[status] || status}: ${count}`, x, distY + 8)
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(x, distY + 10, barW, 4, 1, 1, 'F')
        const barColor: [number, number, number] = status === 'submitted' ? [16, 185, 129] : [245, 158, 11]
        doc.setFillColor(...barColor)
        doc.roundedRect(x, distY + 10, Math.max(1, barW * pct / 100), 4, 1, 1, 'F')
      })

      // Footer
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.text('منصة مشرف EPI — تقرير تلقائي', pageW / 2, pageH - 5, { align: 'center' })
      doc.text(`صفحة ${govIdx + 2} من ${govData.length + 1}`, pageW - 15, pageH - 5, { align: 'right' })
    }

    // Save
    const date = new Date().toISOString().split('T')[0]
    doc.save(`EPI_Map_Report_${date}.pdf`)
    toast({ title: 'تم إنشاء التقرير بنجاح', variant: 'success' })
  } catch (err) {
    console.error('PDF generation error:', err)
    toast({ title: 'فشل إنشاء التقرير', variant: 'destructive' })
  }
}

// ─── View mode type ───
type ViewMode = 'individual' | 'aggregated'
type ColorMode = 'role' | 'status'

export default function MapPage() {
  const navigate = useNavigate()
  const { campaign, labelAr, isFiltered } = useCampaign()
  const { toast } = useToast()
  const { data: dashboardStats } = useDashboardStats()

  // ── Filter state ──
  const [selectedForm, setSelectedForm] = useState<string>('all')
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedGov, setSelectedGov] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('individual')
  const [colorMode, setColorMode] = useState<ColorMode>('role')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<Record<string, any> | null>(null)
  const [selectedCluster, setSelectedCluster] = useState<Record<string, any> | null>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([15.5527, 48.5164])
  const [mapZoom, setMapZoom] = useState(6)
  const [shouldFitBounds, setShouldFitBounds] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // ── Data fetching ──
  const { data: submissionsData, isLoading, refetch } = useSubmissions({
    formId: selectedForm !== 'all' ? selectedForm : undefined,
    status: selectedStatus !== 'all' ? (selectedStatus as SubmissionStatus) : undefined,
    governorateId: selectedGov !== 'all' ? selectedGov : undefined,
    pageSize: 5000,
    campaignType: campaign,
  })
  const { data: formsResult } = useForms({ campaignType: campaign })
  const { data: governorates } = useGovernorates()
  const { data: users } = useUsers()

  const forms = formsResult?.data || []
  const allSubmissions = submissionsData?.data || []

  // ── Supervisors list ──
  const supervisors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; role: string }>()
    allSubmissions.forEach((s: any) => {
      if (s.submitted_by && s.profiles?.full_name) {
        map.set(s.submitted_by, {
          id: s.submitted_by,
          name: s.profiles.full_name,
          email: s.profiles.email || '',
          role: s.profiles?.role || 'data_entry',
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [allSubmissions])

  // ── Filtered submissions with GPS ──
  const gpsSubmissions = useMemo(() => {
    return allSubmissions.filter((s: any) => {
      if (!s.gps_lat || !s.gps_lng) return false
      if (selectedSupervisor !== 'all' && s.submitted_by !== selectedSupervisor) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const name = (s.profiles?.full_name || '').toLowerCase()
        const gov = (s.governorates?.name_ar || '').toLowerCase()
        const form = (s.forms?.title_ar || '').toLowerCase()
        if (!name.includes(q) && !gov.includes(q) && !form.includes(q)) return false
      }
      return true
    })
  }, [allSubmissions, selectedSupervisor, searchQuery])

  // ── Aggregated data by governorate ──
  const aggregatedData = useMemo(() => {
    const groups = new Map<string, {
      name: string; lat: number; lng: number;
      submissions: any[]; byStatus: Record<string, number>;
      supervisors: Set<string>; supervisorRoles: Record<string, string>
    }>()

    gpsSubmissions.forEach((s: any) => {
      const govId = s.governorate_id || 'unknown'
      const govName = s.governorates?.name_ar || 'غير معروف'

      if (!groups.has(govId)) {
        groups.set(govId, {
          name: govName,
          lat: s.gps_lat,
          lng: s.gps_lng,
          submissions: [],
          byStatus: {},
          supervisors: new Set(),
          supervisorRoles: {},
        })
      }

      const group = groups.get(govId)!
      group.submissions.push(s)
      const status = s.status || 'draft'
      group.byStatus[status] = (group.byStatus[status] || 0) + 1
      if (s.profiles?.full_name) {
        group.supervisors.add(s.profiles.full_name)
        group.supervisorRoles[s.profiles.full_name] = s.profiles?.role || 'data_entry'
      }
    })

    return Array.from(groups.entries()).map(([id, data]) => ({
      id,
      ...data,
      count: data.submissions.length,
      supervisorList: Array.from(data.supervisors),
    })).sort((a, b) => b.count - a.count)
  }, [gpsSubmissions])

  // ── Points for fitBounds ──
  const allPoints = useMemo<[number, number][]>(() => {
    if (viewMode === 'aggregated') {
      return aggregatedData.map(g => [g.lat, g.lng])
    }
    return gpsSubmissions.map((s: any) => [s.gps_lat, s.gps_lng])
  }, [viewMode, aggregatedData, gpsSubmissions])

  // ── Stats ──
  const stats = useMemo(() => {
    const withGps = gpsSubmissions.length
    const uniqueGovs = new Set(gpsSubmissions.map((s: any) => s.governorate_id).filter(Boolean)).size
    const uniqueSupervisors = new Set(gpsSubmissions.map((s: any) => s.submitted_by).filter(Boolean)).size
    const byStatus: Record<string, number> = {}
    const byRole: Record<string, number> = {}
    gpsSubmissions.forEach((s: any) => {
      const st = s.status || 'draft'
      byStatus[st] = (byStatus[st] || 0) + 1
      const role = s.profiles?.role || 'data_entry'
      byRole[role] = (byRole[role] || 0) + 1
    })
    return { withGps, uniqueGovs, uniqueSupervisors, byStatus, byRole }
  }, [gpsSubmissions])

  // ── Active filters count ──
  const activeFiltersCount = useMemo(() => {
    let c = 0
    if (selectedForm !== 'all') c++
    if (selectedSupervisor !== 'all') c++
    if (selectedStatus !== 'all') c++
    if (selectedGov !== 'all') c++
    if (searchQuery) c++
    return c
  }, [selectedForm, selectedSupervisor, selectedStatus, selectedGov, searchQuery])

  const resetFilters = () => {
    setSelectedForm('all')
    setSelectedSupervisor('all')
    setSelectedStatus('all')
    setSelectedGov('all')
    setSearchQuery('')
  }

  const fitAllMarkers = useCallback(() => {
    if (allPoints.length > 0) {
      setShouldFitBounds(true)
      setTimeout(() => setShouldFitBounds(false), 100)
    }
  }, [allPoints])

  // ── PDF Export handler ──
  const handleExportPDF = useCallback(async () => {
    setExportingPDF(true)
    try {
      // Collect all GPS markers with role info
      const allMarkers = gpsSubmissions
        .filter((s: any) => s.gps_lat && s.gps_lng)
        .map((s: any) => ({
          lat: s.gps_lat,
          lng: s.gps_lng,
          name: s.profiles?.full_name || '',
          role: s.profiles?.role || 'data_entry',
        }))

      await generateMapPDF(
        {
          total: stats.withGps,
          governorates: stats.uniqueGovs,
          supervisors: stats.uniqueSupervisors,
          submitted: stats.byStatus['submitted'] || 0,
        },
        allMarkers,
        aggregatedData.map(g => ({
          name: g.name,
          submissions: g.count,
          supervisors: g.supervisorList,
          byStatus: g.byStatus,
          lat: g.lat,
          lng: g.lng,
          submissionData: g.submissions,
        })),
        toast
      )
    } finally {
      setExportingPDF(false)
    }
  }, [stats, aggregatedData, gpsSubmissions, toast])

  return (
    <div className="page-enter">
      <Header
        title="الخريطة التفاعلية"
        subtitle={isFiltered ? `${stats.withGps} نقطة — ${labelAr}` : `${stats.withGps} نقطة على الخريطة`}
        onRefresh={() => refetch()}
      />

      <div className="p-4 sm:p-6 space-y-4">
        {/* ═══ Filter Bar ═══ */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">الفلاتر</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{activeFiltersCount}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
                    <RotateCcw className="w-3 h-3" /> مسح
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)} className="h-7">
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث (اسم، محافظة، نموذج)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 h-9 text-sm"
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                    <button
                      onClick={() => setViewMode('individual')}
                      className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        viewMode === 'individual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <MapPin className="w-3 h-3 inline ml-1" /> فردي
                    </button>
                    <button
                      onClick={() => setViewMode('aggregated')}
                      className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        viewMode === 'aggregated' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <BarChart3 className="w-3 h-3 inline ml-1" /> تجميعي
                    </button>
                  </div>

                  {/* Color Mode Toggle */}
                  <div className="flex items-center rounded-lg border bg-muted/50 p-0.5">
                    <button
                      onClick={() => setColorMode('role')}
                      className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        colorMode === 'role' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Users className="w-3 h-3 inline ml-1" /> حسب الدور
                    </button>
                    <button
                      onClick={() => setColorMode('status')}
                      className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                        colorMode === 'status' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Layers className="w-3 h-3 inline ml-1" /> حسب الحالة
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Select value={selectedForm} onValueChange={setSelectedForm}>
                    <SelectTrigger className="w-[200px] h-9 text-xs">
                      <FileText className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="النموذج" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل النماذج</SelectItem>
                      {forms.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.title_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedGov} onValueChange={setSelectedGov}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                      <MapPinned className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المحافظات</SelectItem>
                      {governorates?.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name_ar}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                    <SelectTrigger className="w-[200px] h-9 text-xs">
                      <User className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="المشرف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل المشرفين</SelectItem>
                      {supervisors.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px] h-9 text-xs">
                      <Layers className="w-3.5 h-3.5 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الحالات</SelectItem>
                      <SelectItem value="submitted">مرسلة</SelectItem>
                      <SelectItem value="draft">مسودة</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={fitAllMarkers}>
                    <Maximize2 className="w-3.5 h-3.5" /> تكبير الكل
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ═══ Stats Row + Export ═══ */}
        <div className="flex items-start gap-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50"><MapPin className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <p className="text-xl font-heading font-bold">{stats.withGps}</p>
                  <p className="text-[10px] text-muted-foreground">نقطة GPS</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50"><Globe className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <p className="text-xl font-heading font-bold">{stats.uniqueGovs}</p>
                  <p className="text-[10px] text-muted-foreground">محافظة</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50"><Users className="w-4 h-4 text-violet-600" /></div>
                <div>
                  <p className="text-xl font-heading font-bold">{stats.uniqueSupervisors}</p>
                  <p className="text-[10px] text-muted-foreground">مشرف نشط</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50"><Target className="w-4 h-4 text-amber-600" /></div>
                <div>
                  <p className="text-xl font-heading font-bold">{stats.byStatus['submitted'] || 0}</p>
                  <p className="text-[10px] text-muted-foreground">مرسلة</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PDF Export Button */}
          <Button
            onClick={handleExportPDF}
            disabled={exportingPDF || aggregatedData.length === 0}
            className="gap-2 shrink-0 h-auto py-3 px-5 flex-col"
            variant="outline"
          >
            {exportingPDF ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <FileDown className="w-5 h-5" />
            )}
            <span className="text-xs font-medium">تصدير PDF</span>
            <span className="text-[9px] text-muted-foreground">{aggregatedData.length} صفحة</span>
          </Button>
        </div>

        {/* ═══ Role Legend (when colorMode = role) ═══ */}
        {colorMode === 'role' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">دليل الألوان — حسب الدور:</span>
                {Object.entries(ROLE_COLORS).map(([role, config]) => (
                  <div key={role} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: config.bg }} />
                    <span className="text-[11px]">{config.label}</span>
                    <span className="text-[10px] text-muted-foreground">({stats.byRole[role] || 0})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ═══ Map ═══ */}
        <Card className="overflow-hidden border-0 shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton className="w-full h-[600px]" />
            ) : (
              <div className="relative" style={{ height: '600px' }}>
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  {shouldFitBounds && <FitBounds points={allPoints} />}

                  {viewMode === 'individual' ? (
                    gpsSubmissions.map((sub: any) => (
                      <Marker
                        key={sub.id}
                        position={[sub.gps_lat, sub.gps_lng]}
                        icon={colorMode === 'role'
                          ? createRoleIcon(sub.profiles?.role || 'data_entry', selectedSubmission?.id === sub.id)
                          : createStatusIcon(sub.status || 'draft', selectedSubmission?.id === sub.id)
                        }
                        eventHandlers={{ click: () => { setSelectedCluster(null); setSelectedSubmission(sub) } }}
                      >
                        <Popup className="custom-popup">
                          <div className="min-w-[220px] font-[Cairo]" dir="rtl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={cn('w-3 h-3 rounded-full',
                                colorMode === 'role'
                                  ? `bg-[${ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.bg || '#6b7280'}]`
                                  : sub.status === 'submitted' ? 'bg-emerald-500' : 'bg-amber-500'
                              )} style={colorMode === 'role' ? { background: ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.bg } : undefined} />
                              <span className="font-bold text-sm">{sub.forms?.title_ar || 'إرسالية'}</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>📍 {sub.governorates?.name_ar || '—'}</p>
                              <p>👤 {sub.profiles?.full_name || '—'}</p>
                              <p>📅 {formatRelativeTime(sub.created_at)}</p>
                              {colorMode === 'role' && (
                                <Badge className="text-[9px]" style={{ background: ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.light, color: ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.text }}>
                                  {ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.label}
                                </Badge>
                              )}
                            </div>
                            <button
                              onClick={() => { setSelectedSubmission(sub) }}
                              className="mt-2 w-full text-xs bg-primary text-white px-2 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                            >
                              <Eye className="w-3 h-3 inline ml-1" /> عرض التفاصيل
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  ) : (
                    aggregatedData.map((cluster) => (
                      <Marker
                        key={cluster.id}
                        position={[cluster.lat, cluster.lng]}
                        icon={createClusterIcon(cluster.count)}
                        eventHandlers={{ click: () => { setSelectedSubmission(null); setSelectedCluster(cluster) } }}
                      >
                        <Popup className="custom-popup">
                          <div className="min-w-[220px] font-[Cairo]" dir="rtl">
                            <div className="flex items-center gap-2 mb-2">
                              <BarChart3 className="w-4 h-4 text-primary" />
                              <span className="font-bold text-sm">{cluster.name}</span>
                            </div>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">الإرساليات:</span>
                                <span className="font-bold">{cluster.count}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">المشرفون:</span>
                                <span className="font-bold">{cluster.supervisorList.length}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {Object.entries(cluster.byStatus).map(([status, count]) => (
                                  <span key={status} className={cn('px-1.5 py-0.5 rounded-full text-[10px]',
                                    STATUS_COLORS[status as SubmissionStatus] || 'bg-gray-100'
                                  )}>
                                    {STATUS_LABELS[status as SubmissionStatus] || status}: {count}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedCluster(cluster)}
                              className="mt-2 w-full text-xs bg-primary text-white px-2 py-1.5 rounded-md hover:bg-primary/90"
                            >
                              عرض التفاصيل ({cluster.count})
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))
                  )}
                </MapContainer>

                {/* Status Legend */}
                <div className="absolute bottom-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2">
                    {colorMode === 'role' ? 'الأدوار' : 'الحالات'}
                  </p>
                  <div className="space-y-1.5">
                    {colorMode === 'role' ? (
                      Object.entries(ROLE_COLORS).map(([role, config]) => (
                        <div key={role} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: config.bg }} />
                          <span className="text-[10px]">{config.label}</span>
                          <span className="text-[10px] text-muted-foreground mr-auto">{stats.byRole[role] || 0}</span>
                        </div>
                      ))
                    ) : (
                      [
                        { status: 'submitted', label: 'مرسلة', color: '#10b981' },
                        { status: 'draft', label: 'مسودة', color: '#f59e0b' },
                      ].map(item => (
                        <div key={item.status} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                          <span className="text-[10px]">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground mr-auto">{stats.byStatus[item.status] || 0}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══ Submission Detail Dialog ═══ */}
      {selectedSubmission && (
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> تفاصيل الإرسالية
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">النموذج</p>
                  <p className="font-heading font-bold">{selectedSubmission.forms?.title_ar || '—'}</p>
                </div>
                <Badge className={cn('text-xs', STATUS_COLORS[selectedSubmission.status as SubmissionStatus])}>
                  {STATUS_LABELS[selectedSubmission.status as SubmissionStatus]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> المشرف</p>
                  <p className="text-sm font-medium">{selectedSubmission.profiles?.full_name || '—'}</p>
                  {selectedSubmission.profiles?.role && (
                    <Badge className="text-[9px] mt-1" style={{ background: ROLE_COLORS[(selectedSubmission.profiles.role) as keyof typeof ROLE_COLORS]?.light, color: ROLE_COLORS[(selectedSubmission.profiles.role) as keyof typeof ROLE_COLORS]?.text }}>
                      {ROLE_COLORS[(selectedSubmission.profiles.role) as keyof typeof ROLE_COLORS]?.label}
                    </Badge>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> التاريخ</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedSubmission.created_at)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3" /> الموقع</p>
                <p className="text-sm font-medium">
                  {selectedSubmission.governorates?.name_ar || '—'}
                  {selectedSubmission.districts?.name_ar ? ` — ${selectedSubmission.districts.name_ar}` : ''}
                </p>
                {selectedSubmission.gps_lat && selectedSubmission.gps_lng && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5" dir="ltr">
                    📍 {selectedSubmission.gps_lat.toFixed(6)}, {selectedSubmission.gps_lng.toFixed(6)}
                  </p>
                )}
              </div>
              {selectedSubmission.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedSubmission.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedSubmission(null)}>إغلاق</Button>
              <Button className="flex-1 gap-2" onClick={() => navigate(`/submissions?id=${selectedSubmission.id}`)}>
                <ExternalLink className="w-4 h-4" /> فتح الاستمارة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ═══ Cluster Detail Dialog ═══ */}
      {selectedCluster && (
        <Dialog open={!!selectedCluster} onOpenChange={() => setSelectedCluster(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> إرساليات {selectedCluster.name}
              </DialogTitle>
              <DialogDescription>
                {selectedCluster.count} إرسالية — {selectedCluster.supervisorList.length} مشرف
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(selectedCluster.byStatus).map(([status, count]) => (
                <Badge key={status} className={cn('text-xs', STATUS_COLORS[status as SubmissionStatus])}>
                  {STATUS_LABELS[status as SubmissionStatus]}: {count as number}
                </Badge>
              ))}
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {selectedCluster.submissions.map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => { setSelectedCluster(null); setSelectedSubmission(sub) }}
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: ROLE_COLORS[(sub.profiles?.role || 'data_entry') as keyof typeof ROLE_COLORS]?.bg }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sub.forms?.title_ar || 'إرسالية'}</p>
                    <p className="text-[10px] text-muted-foreground">{sub.profiles?.full_name || '—'} — {formatRelativeTime(sub.created_at)}</p>
                  </div>
                  <Badge className={cn('text-[10px] shrink-0', STATUS_COLORS[sub.status as SubmissionStatus])}>
                    {STATUS_LABELS[sub.status as SubmissionStatus]}
                  </Badge>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedCluster(null)}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
