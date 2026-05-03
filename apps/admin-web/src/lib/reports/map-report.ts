/**
 * ═══════════════════════════════════════════════════════════════
 *  تقرير الخريطة — مواقع المشرفين GPS
 *  Map Report — Supervisor GPS Locations
 * ═══════════════════════════════════════════════════════════════
 */

import { supabase } from '../supabase'
import { bulkFetch } from '../bulk-fetch'
import { BRAND } from '../pdf-brand'

// ─── Yemen center & governorate approximate centers ──────────

const YEMEN_CENTER: [number, number] = [15.5, 48.5]

const GOV_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  'عدن': { center: [12.78, 45.02], zoom: 11 },
  'تعز': { center: [13.58, 44.02], zoom: 11 },
  'الحديدة': { center: [14.80, 42.95], zoom: 11 },
  'البيضاء': { center: [13.98, 45.57], zoom: 11 },
  'مأرب': { center: [15.47, 45.33], zoom: 10 },
  'الجوف': { center: [16.78, 45.58], zoom: 10 },
  'حجة': { center: [15.69, 43.60], zoom: 10 },
  'أبين': { center: [13.43, 45.37], zoom: 11 },
  'لحج': { center: [13.05, 44.88], zoom: 11 },
  'شبوة': { center: [14.88, 46.83], zoom: 10 },
  'المهرة': { center: [15.80, 51.50], zoom: 9 },
  'المكلا': { center: [14.53, 49.13], zoom: 11 },
  'سيئون': { center: [15.97, 48.78], zoom: 10 },
  'الضالع': { center: [13.70, 44.73], zoom: 11 },
  'سقطرى': { center: [12.47, 53.87], zoom: 9 },
  'حضرموت': { center: [15.40, 49.00], zoom: 9 },
}

// ═══════════════════════════════════════════════════════════════
// MAIN REPORT
// ═══════════════════════════════════════════════════════════════

export async function generateMapReport(options?: {
  dateFrom?: string
  dateTo?: string
  governorateId?: string
}): Promise<void> {
  const today = new Date().toISOString().split('T')[0]
  const dateFrom = options?.dateFrom || today
  const dateTo = options?.dateTo || today

  // ── Fetch submissions with GPS (paginated) ──
  async function fetchAllSubmissions() {
    const allData: any[] = []
    let offset = 0
    const pageSize = 1000
    while (true) {
      let q = supabase
        .from('form_submissions')
        .select(`
          id, gps_lat, gps_lng, created_at, status, data,
          profiles:submitted_by(full_name, role),
          governorates(name_ar),
          districts(name_ar)
        `)
        .eq('form_id', '97a4f2b3-c573-4812-b58c-5b0acf814e24')
        .is('deleted_at', null)
        .not('gps_lat', 'is', null)
        .not('gps_lng', 'is', null)
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

      if (options?.governorateId && options.governorateId !== 'all') {
        q = q.eq('governorate_id', options.governorateId)
      }

      const { data, error } = await q
      if (error || !data || data.length === 0) break
      allData.push(...data)
      if (data.length < pageSize) break
      offset += pageSize
      if (allData.length >= 100000) break
    }
    return allData
  }

  const submissions = await fetchAllSubmissions()
  const subs = (submissions || []).filter((s: any) =>
    s.gps_lat && s.gps_lng &&
    typeof s.gps_lat === 'number' && typeof s.gps_lng === 'number' &&
    s.gps_lat !== 0 && s.gps_lng !== 0
  )

  // ── Group by governorate ──
  const govGroups = new Map<string, typeof subs>()
  for (const sub of subs) {
    const govName = (sub as any).governorates?.name_ar || 'غير محدد'
    if (!govGroups.has(govName)) govGroups.set(govName, [])
    govGroups.get(govName)!.push(sub)
  }

  // ── Build markers JSON ──
  const allMarkers = subs.map((s: any) => ({
    lat: s.gps_lat,
    lng: s.gps_lng,
    name: s.profiles?.full_name || '—',
    role: s.profiles?.role || '',
    gov: s.governorates?.name_ar || '',
    dist: s.districts?.name_ar || '',
    date: s.created_at,
    status: s.status,
  }))

  const govMarkers: Record<string, typeof allMarkers> = {}
  for (const [govName, govSubs] of govGroups) {
    govMarkers[govName] = govSubs.map((s: any) => ({
      lat: s.gps_lat,
      lng: s.gps_lng,
      name: s.profiles?.full_name || '—',
      role: s.profiles?.role || '',
      gov: s.governorates?.name_ar || '',
      dist: s.districts?.name_ar || '',
      date: s.created_at,
      status: s.status,
    }))
  }

  const markersJson = JSON.stringify(allMarkers)
  const govMarkersJson = JSON.stringify(govMarkers)
  const govCentersJson = JSON.stringify(GOV_CENTERS)

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير الخريطة — مواقع المشرفين</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: #f5f5f5;
      color: #333;
    }
    .report-header {
      background: linear-gradient(135deg, #1a5276, #2e86c1);
      color: white;
      padding: 24px 32px;
      text-align: center;
    }
    .report-header h1 { font-size: 24px; font-weight: 900; }
    .report-header p { font-size: 13px; opacity: 0.9; margin-top: 4px; }

    .stats-bar {
      display: flex;
      gap: 12px;
      padding: 16px 32px;
      background: white;
      border-bottom: 2px solid #e0e0e0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .stat-chip {
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .map-section {
      margin: 20px 32px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .map-section-header {
      padding: 14px 20px;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .map-section-title {
      font-size: 16px;
      font-weight: 800;
      color: #1a5276;
    }
    .map-section-count {
      font-size: 12px;
      color: #666;
      font-weight: 600;
    }
    .map-container {
      height: 500px;
      width: 100%;
    }
    .map-container.gov-map {
      height: 400px;
    }

    .supervisor-list {
      padding: 12px 20px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .supervisor-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 600;
    }
    .supervisor-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .print-btn {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 10px 24px;
      background: #1a5276;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .print-btn:hover { background: #2e86c1; }

    @media print {
      .print-btn { display: none; }
      .map-section { page-break-inside: avoid; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ طباعة PDF</button>

  <div class="report-header">
    <h1>🗺️ تقرير الخريطة — مواقع المشرفين</h1>
    <p>استمارة الاشراف للنشاط الايصالي التكاملي — ${dateFrom === dateTo ? dateFrom : dateFrom + ' إلى ' + dateTo}</p>
  </div>

  <div class="stats-bar">
    <div class="stat-chip" style="background:#E3F2FD;color:#1565C0;">📍 إجمالي النقاط: ${subs.length}</div>
    <div class="stat-chip" style="background:#E8F5E9;color:#2E7D32;">🏛️ المحافظات: ${govGroups.size}</div>
    <div class="stat-chip" style="background:#FFF3E0;color:#E65100;">👥 المشرفين: ${new Set(subs.map((s: any) => s.submitted_by)).size}</div>
  </div>

  <!-- ═══ الخريطة الكاملة لليمن ═══ -->
  <div class="map-section">
    <div class="map-section-header">
      <div class="map-section-title">🇾🇪 الخريطة الكاملة — جميع المواقع</div>
      <div class="map-section-count">${subs.length} موقع</div>
    </div>
    <div id="map-yemen" class="map-container"></div>
    <div class="supervisor-list">
      ${[...govGroups.entries()].map(([gov, govSubs]) => {
        const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#16a085','#c0392b','#8e44ad','#2980b9','#27ae60','#d35400','#2c3e50','#7f8c8d']
        const idx = [...govGroups.keys()].indexOf(gov)
        const color = colors[idx % colors.length]
        return `<span class="supervisor-tag"><span class="supervisor-dot" style="background:${color}"></span>${gov} (${govSubs.length})</span>`
      }).join('')}
    </div>
  </div>

  <!-- ═══ خرائط المحافظات ═══ -->
  ${[...govGroups.entries()].map(([gov, govSubs]) => `
    <div class="map-section">
      <div class="map-section-header">
        <div class="map-section-title">🏛️ ${gov}</div>
        <div class="map-section-count">${govSubs.length} موقع — ${new Set(govSubs.map((s: any) => s.submitted_by)).size} مشرف</div>
      </div>
      <div id="map-${gov.replace(/\s/g, '_')}" class="map-container gov-map"></div>
      <div class="supervisor-list">
        ${[...new Set(govSubs.map((s: any) => s.profiles?.full_name || '—'))].map(name => {
          const count = govSubs.filter((s: any) => s.profiles?.full_name === name).length
          return `<span class="supervisor-tag">👤 ${name} (${count})</span>`
        }).join('')}
      </div>
    </div>
  `).join('')}

  <script>
    // ═══ Data ═══
    const allMarkers = ${markersJson};
    const govMarkers = ${govMarkersJson};
    const govCenters = ${govCentersJson};

    // ═══ Color palette per governorate ═══
    const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#16a085','#c0392b','#8e44ad','#2980b9','#27ae60','#d35400','#2c3e50','#7f8c8d'];
    const govNames = Object.keys(govMarkers);
    const govColorMap = {};
    govNames.forEach((g, i) => govColorMap[g] = colors[i % colors.length]);

    function createIcon(color) {
      return L.divIcon({
        className: 'custom-marker',
        html: '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }

    function popupContent(m) {
      const d = new Date(m.date).toLocaleDateString('ar-YE');
      return '<div style="direction:rtl;font-size:12px;line-height:1.6;">' +
        '<strong>' + m.name + '</strong><br>' +
        'الصفة: ' + m.role + '<br>' +
        'المحافظة: ' + m.gov + '<br>' +
        'المديرية: ' + m.dist + '<br>' +
        'التاريخ: ' + d + '<br>' +
        'الحالة: ' + (m.status === 'submitted' ? '✅ مرسلة' : '📝 مسودة') +
        '</div>';
    }

    // ═══ Yemen Full Map ═══
    const yemenMap = L.map('map-yemen').setView([15.5, 48.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(yemenMap);

    allMarkers.forEach(m => {
      const color = govColorMap[m.gov] || '#333';
      L.marker([m.lat, m.lng], { icon: createIcon(color) })
        .addTo(yemenMap)
        .bindPopup(popupContent(m));
    });

    // Fit bounds
    if (allMarkers.length > 0) {
      const bounds = allMarkers.map(m => [m.lat, m.lng]);
      yemenMap.fitBounds(bounds, { padding: [30, 30] });
    }

    // ═══ Governorate Maps ═══
    govNames.forEach(gov => {
      const mapId = 'map-' + gov.replace(/\\s/g, '_');
      const el = document.getElementById(mapId);
      if (!el) return;

      const markers = govMarkers[gov] || [];
      const center = govCenters[gov] || { center: [15.5, 48.5], zoom: 10 };

      const map = L.map(mapId).setView(center.center, center.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      markers.forEach(m => {
        L.marker([m.lat, m.lng], { icon: createIcon(govColorMap[gov] || '#333') })
          .addTo(map)
          .bindPopup(popupContent(m));
      });

      if (markers.length > 0) {
        const bounds = markers.map(m => [m.lat, m.lng]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    });
  <\/script>
</body>
</html>`

  // Open in new window
  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
