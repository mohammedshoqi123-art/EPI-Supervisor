import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import 'map/map_helpers.dart';
import 'map/map_controls.dart';

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  bool _showStats = true;
  double _currentZoom = 6.0;
  MapViewMode _viewMode = MapViewMode.aggregated;
  Map<String, dynamic>? _selectedSubmission;
  Map<String, dynamic>? _selectedCluster;

  late AnimationController _fabAnimController;
  late Animation<double> _fabAnimation;

  static const _yemenCenter = LatLng(15.5527, 48.5164);

  // ─── RBAC shortcuts ──────────────────────────────────────────

  UserRole? get _role => ref.read(authStateProvider).valueOrNull?.role ?? UserRole.data_entry;
  bool get _canViewFullCoords => MapHelpers.canViewFullCoords(_role);
  bool get _canViewAllGovernorates => MapHelpers.canViewAllGovernorates(_role);
  String? get _userGovId => ref.read(authStateProvider).valueOrNull?.governorateId;
  String? get _userDistId => ref.read(authStateProvider).valueOrNull?.districtId;

  @override
  void initState() {
    super.initState();
    _fabAnimController = AnimationController(duration: const Duration(milliseconds: 300), vsync: this);
    _fabAnimation = CurvedAnimation(parent: _fabAnimController, curve: Curves.easeInOut);
    _fabAnimController.forward();
  }

  @override
  void dispose() {
    _fabAnimController.dispose();
    super.dispose();
  }

  // ─── Actions ─────────────────────────────────────────────────

  void _toggleMode() {
    setState(() {
      _selectedSubmission = null;
      _selectedCluster = null;
      _viewMode = _viewMode == MapViewMode.aggregated ? MapViewMode.individual : MapViewMode.aggregated;
    });
  }

  void _refresh() {
    HapticFeedback.mediumImpact();
    ref.invalidate(submissionsProvider(SubmissionsFilter(campaignType: ref.read(campaignProvider).value)));
    ref.invalidate(governoratesProvider);
  }

  void _fitAllMarkers() {
    HapticFeedback.lightImpact();
    final subs = ref.read(submissionsProvider(SubmissionsFilter(campaignType: ref.read(campaignProvider).value))).valueOrNull ?? [];
    final points = subs
        .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
        .map((s) => LatLng(s['gps_lat'] as double, s['gps_lng'] as double))
        .toList();

    if (points.isEmpty) {
      _mapController.move(_yemenCenter, 6.0);
      return;
    }
    if (points.length == 1) {
      _mapController.move(points.first, 12.0);
      return;
    }

    double minLat = points.first.latitude, maxLat = points.first.latitude;
    double minLng = points.first.longitude, maxLng = points.first.longitude;
    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    _mapController.move(LatLng((minLat + maxLat) / 2, (minLng + maxLng) / 2), MapHelpers.calculateFitZoom(points));
  }

  // ─── Build ───────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildMap(),
          MapControls.buildHeaderOverlay(),
          MapControls.buildTopBar(
            context: context,
            viewMode: _viewMode,
            showStats: _showStats,
            canViewFullCoords: _canViewFullCoords,
            onToggleMode: _toggleMode,
            onRefresh: _refresh,
            onToggleStats: () => setState(() => _showStats = !_showStats),
          ),
          if (_showStats) _buildStatsOverlay(),
          if (_selectedSubmission != null) _buildSelectedPanel(),
          if (_selectedCluster != null) _buildClusterPanel(),
          MapControls.buildFABs(
            fabAnimation: _fabAnimation,
            onFitAll: _fitAllMarkers,
            onMyLocation: () => _mapController.move(_yemenCenter, 6.0),
            onZoomIn: () {
              setState(() => _currentZoom = (_currentZoom + 1).clamp(4.0, 18.0));
              _mapController.move(_mapController.camera.center, _currentZoom);
            },
            onZoomOut: () {
              setState(() => _currentZoom = (_currentZoom - 1).clamp(4.0, 18.0));
              _mapController.move(_mapController.camera.center, _currentZoom);
            },
          ),
        ],
      ),
    );
  }

  // ─── Stats Overlay ───────────────────────────────────────────

  Widget _buildStatsOverlay() {
    final subs = ref.watch(submissionsProvider(SubmissionsFilter(campaignType: ref.read(campaignProvider).value))).valueOrNull ?? [];
    final withGps = subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length;
    final drafts = subs.where((s) => s['status'] == 'draft').length;
    final govCount = ref.watch(governoratesProvider).valueOrNull?.length ?? 0;

    return MapControls.buildStatsOverlay(totalSubs: subs.length, withGps: withGps, drafts: drafts, govCount: govCount);
  }

  // ─── Map ─────────────────────────────────────────────────────

  Widget _buildMap() {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _yemenCenter,
        initialZoom: _currentZoom,
        minZoom: 4.0,
        maxZoom: 18.0,
        onPositionChanged: (pos, _) => setState(() => _currentZoom = pos.zoom ?? _currentZoom),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.epi.supervisor',
        ),
        _viewMode == MapViewMode.aggregated ? _buildAggregatedLayer() : _buildIndividualLayer(),
      ],
    );
  }

  // ─── Aggregated Layer ────────────────────────────────────────

  Widget _buildAggregatedLayer() {
    final subs = ref.watch(submissionsProvider(SubmissionsFilter(campaignType: ref.read(campaignProvider).value))).valueOrNull ?? [];

    final grouped = <String, List<Map<String, dynamic>>>{};
    final govMeta = <String, Map<String, dynamic>>{};

    for (final sub in subs) {
      final govId = sub['governorate_id'] as String?;
      if (govId == null) continue;
      if (!_canViewAllGovernorates && _userGovId != null && govId != _userGovId) continue;
      grouped.putIfAbsent(govId, () => []).add(sub);
      if (!govMeta.containsKey(govId)) {
        govMeta[govId] = {
          'name': sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '',
          'lat': sub['gps_lat'],
          'lng': sub['gps_lng'],
        };
      }
    }

    final markers = <Marker>[];
    for (final entry in grouped.entries) {
      final meta = govMeta[entry.key]!;
      final lat = meta['lat'] as double?;
      final lng = meta['lng'] as double?;
      if (lat == null || lng == null) continue;

      final count = entry.value.length;
      final color = MapHelpers.clusterColor(count);

      markers.add(Marker(
        point: LatLng(lat, lng),
        width: 56, height: 56,
        child: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() {
              _selectedSubmission = null;
              _selectedCluster = {'name': meta['name'], 'submissions': entry.value, 'lat': lat, 'lng': lng};
            });
          },
          child: Container(
            decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2.5), boxShadow: [BoxShadow(color: color.withValues(alpha: 0.45), blurRadius: 14, spreadRadius: 2)]),
            child: Center(child: Text('$count', style: const TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white))),
          ),
        ),
      ));
    }

    return MarkerLayer(markers: markers);
  }

  // ─── Individual Layer ────────────────────────────────────────

  Widget _buildIndividualLayer() {
    var subs = ref.watch(submissionsProvider(SubmissionsFilter(campaignType: ref.read(campaignProvider).value))).valueOrNull ?? [];
    subs = subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).toList();

    if (!_canViewAllGovernorates) {
      subs = subs.where((s) {
        if (_role == UserRole.governorate) return s['governorate_id'] == _userGovId;
        if (_role == UserRole.district) return s['district_id'] == _userDistId;
        if (_role == UserRole.data_entry) return s['submitted_by'] == ref.read(authStateProvider).valueOrNull?.userId;
        return true;
      }).toList();
    }

    final markers = subs.map((sub) {
      final lat = (sub['gps_lat'] as num).toDouble();
      final lng = (sub['gps_lng'] as num).toDouble();
      final status = sub['status'] as String? ?? 'draft';
      final color = MapHelpers.statusColor(status);
      final isSelected = _selectedSubmission?['id'] == sub['id'];

      return Marker(
        point: LatLng(lat, lng),
        width: isSelected ? 28 : 14,
        height: isSelected ? 36 : 14,
        child: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() {
              _selectedCluster = null;
              _selectedSubmission = sub;
            });
          },
          child: Container(
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: isSelected ? 2 : 1.5),
              boxShadow: [BoxShadow(color: color.withValues(alpha: isSelected ? 0.5 : 0.3), blurRadius: isSelected ? 10 : 4)],
            ),
            child: isSelected ? const Icon(Icons.place, color: Colors.white, size: 14) : null,
          ),
        ),
      );
    }).toList();

    return MarkerLayer(markers: markers);
  }

  // ─── Selected Submission Panel ───────────────────────────────

  Widget _buildSelectedPanel() {
    final sub = _selectedSubmission!;
    final lat = sub['gps_lat'] as double?;
    final lng = sub['gps_lng'] as double?;
    final status = sub['status'] as String? ?? 'draft';
    final govName = sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '';
    final distName = sub['districts']?['name_ar'] ?? sub['district_name'] ?? '';
    final createdAt = sub['created_at'] as String? ?? '';

    return Positioned(
      bottom: 90, left: 16, right: 16,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 20, offset: const Offset(0, 8))]),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(width: 10, height: 10, decoration: BoxDecoration(color: MapHelpers.statusColor(status), shape: BoxShape.circle)),
                const SizedBox(width: 10),
                Expanded(child: Text(govName.isNotEmpty ? govName : 'إرسالية', style: const TextStyle(fontFamily: 'Cairo', fontSize: 16, fontWeight: FontWeight.w700))),
                GestureDetector(onTap: () => setState(() => _selectedSubmission = null), child: const Icon(Icons.close_rounded, size: 18, color: Colors.grey)),
              ],
            ),
            if (lat != null && lng != null) ...[
              const SizedBox(height: 10),
              Text(_canViewFullCoords ? '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}' : '${lat.toStringAsFixed(2)}°, ${lng.toStringAsFixed(2)}°',
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, color: Color(0xFF00897B))),
            ],
            const SizedBox(height: 8),
            Wrap(spacing: 6, children: [
              if (distName.isNotEmpty) _chip(Icons.location_on_rounded, distName),
              _chip(Icons.circle, MapHelpers.statusColor(status) == const Color(0xFF3B82F6) ? 'مرسلة' : 'مسودة', color: MapHelpers.statusColor(status)),
              if (createdAt.isNotEmpty) _chip(Icons.access_time_rounded, MapHelpers.formatDate(createdAt)),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _chip(IconData icon, String label, {Color? color}) {
    final c = color ?? const Color(0xFF64748B);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(icon, size: 12, color: c), const SizedBox(width: 4), Text(label, style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, fontWeight: FontWeight.w600, color: c))]),
    );
  }

  // ─── Cluster Panel ───────────────────────────────────────────

  Widget _buildClusterPanel() {
    final cluster = _selectedCluster!;
    final name = cluster['name'] as String? ?? '';
    final subs = cluster['submissions'] as List<Map<String, dynamic>>;
    final byStatus = <String, int>{};
    for (final s in subs) {
      final st = s['status'] as String? ?? 'draft';
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }

    return Positioned(
      bottom: 90, left: 16, right: 16,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 20, offset: const Offset(0, 8))]),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 44, height: 44,
                  decoration: BoxDecoration(gradient: LinearGradient(colors: [MapHelpers.clusterColor(subs.length), MapHelpers.clusterColor(subs.length).withValues(alpha: 0.7)]), borderRadius: BorderRadius.circular(14)),
                  child: Center(child: Text('${subs.length}', style: const TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white))),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(name.isNotEmpty ? name : 'إرساليات', style: const TextStyle(fontFamily: 'Cairo', fontSize: 18, fontWeight: FontWeight.w700))),
                GestureDetector(onTap: () => setState(() => _selectedCluster = null), child: const Icon(Icons.close_rounded, size: 18, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 16),
            ...byStatus.entries.map((e) {
              final pct = subs.isEmpty ? 0.0 : e.value / subs.length;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    SizedBox(width: 60, child: Text(MapHelpers.statusLabel(e.key), style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: Color(0xFF64748B)))),
                    Expanded(child: ClipRRect(borderRadius: BorderRadius.circular(4), child: LinearProgressIndicator(value: pct, backgroundColor: Colors.grey.shade100, valueColor: AlwaysStoppedAnimation(MapHelpers.statusColor(e.key)), minHeight: 8))),
                    const SizedBox(width: 8),
                    SizedBox(width: 30, child: Text('${e.value}', textAlign: TextAlign.end, style: TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700, color: MapHelpers.statusColor(e.key)))),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
