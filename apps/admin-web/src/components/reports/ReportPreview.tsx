/**
 * ═══════════════════════════════════════════════════════════════
 *  Report Preview — Modal preview before PDF download
 *  معاينة التقرير — نافذة معاينة قبل تحميل PDF
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Download, Printer, X, Loader2, ZoomIn, ZoomOut,
  FileText, Maximize2, Minimize2, ExternalLink
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ReportPreviewProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  html: string
  onDownload?: () => void
  onPrint?: () => void
  downloading?: boolean
}

export function ReportPreview({
  open,
  onClose,
  title,
  subtitle,
  html,
  onDownload,
  onPrint,
  downloading = false,
}: ReportPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Write HTML to iframe when it changes
  useEffect(() => {
    if (iframeRef.current && html && open) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(html)
        doc.close()

        // Force-reload any external CSS (Google Fonts) after write
        const links = doc.querySelectorAll('link[rel="stylesheet"]')
        links.forEach(link => {
          const href = link.getAttribute('href')
          if (href) {
            link.setAttribute('href', href + '?t=' + Date.now())
          }
        })

        // Inject base styles for iframe context
        const style = doc.createElement('style')
        style.textContent = `
          html, body { margin: 0; padding: 16px; background: white; }
          @media screen {
            body { max-width: 210mm; margin: 0 auto; padding: 20px; }
          }
        `
        doc.head.appendChild(style)
      }
    }
  }, [html, open])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 10, 150))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 10, 50))
  }, [])

  const handlePrint = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print()
    }
    onPrint?.()
  }, [onPrint])

  const handleOpenExternal = useCallback(() => {
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }, [html])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={cn(
          'p-0 gap-0 transition-all duration-300',
          isFullscreen
            ? 'max-w-[100vw] max-h-[100vh] w-[100vw] h-[100vh] rounded-none'
            : 'max-w-5xl max-h-[90vh]'
        )}
      >
        {/* Header */}
        <DialogHeader className="px-5 py-3 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm font-heading truncate">{title}</DialogTitle>
                {subtitle && (
                  <DialogDescription className="text-[10px] truncate">{subtitle}</DialogDescription>
                )}
              </div>
              <Badge variant="outline" className="text-[9px] shrink-0">معاينة</Badge>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              {/* Zoom controls */}
              <div className="flex items-center gap-1 mr-2">
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="h-7 w-7"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <span className="text-[10px] font-mono tabular-nums w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 150}
                  className="h-7 w-7"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Fullscreen */}
              <Button
                variant="ghost" size="icon-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-7 w-7"
                title={isFullscreen ? 'تصغير' : 'تكبير'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>

              {/* Open in new tab */}
              <Button
                variant="ghost" size="icon-sm"
                onClick={handleOpenExternal}
                className="h-7 w-7"
                title="فتح في نافذة جديدة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <Separator orientation="vertical" className="h-6" />

              {/* Print */}
              <Button
                variant="outline" size="sm"
                onClick={handlePrint}
                className="h-7 gap-1.5 text-xs"
              >
                <Printer className="w-3 h-3" />
                طباعة
              </Button>

              {/* Download */}
              {onDownload && (
                <Button
                  size="sm"
                  onClick={onDownload}
                  disabled={downloading}
                  className="h-7 gap-1.5 text-xs"
                >
                  {downloading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  تحميل PDF
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Preview iframe */}
        <div className="relative bg-gray-100 overflow-auto" style={{ height: isFullscreen ? 'calc(100vh - 52px)' : '70vh' }}>
          <div
            className="mx-auto my-4 bg-white shadow-lg"
            style={{
              width: `${zoom}%`,
              maxWidth: '210mm',
              minHeight: '297mm',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              ref={iframeRef}
              className="w-full border-0"
              style={{ minHeight: '297mm', height: '100%' }}
              title="معاينة التقرير"
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// Hook: useReportPreview
// ═══════════════════════════════════════════════════════════════

export function useReportPreview() {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewHTML, setPreviewHTML] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewSubtitle, setPreviewSubtitle] = useState<string | undefined>()
  const [downloading, setDownloading] = useState(false)

  const openPreview = useCallback((title: string, html: string, subtitle?: string) => {
    setPreviewTitle(title)
    setPreviewHTML(html)
    setPreviewSubtitle(subtitle)
    setPreviewOpen(true)
  }, [])

  const closePreview = useCallback(() => {
    setPreviewOpen(false)
  }, [])

  const previewProps = {
    open: previewOpen,
    onClose: closePreview,
    title: previewTitle,
    subtitle: previewSubtitle,
    html: previewHTML,
    downloading,
  }

  return {
    previewOpen,
    previewProps,
    openPreview,
    closePreview,
    setDownloading,
  }
}
