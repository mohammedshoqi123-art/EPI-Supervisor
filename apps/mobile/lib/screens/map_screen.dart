import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_shared/epi_shared.dart';
import '../providers/app_providers.dart';

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
  bool _showIndividual = false;
  Map<String, dynamic>? _selectedSubmission;

  late AnimationController _fabAnimController;
  late Animation<double> _fabAnimation;

  static const _yemenCenter = LatLng(15.5527, 48.5164);

  @override
  void initState() {
    super.initState();
    _fabAnimController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fabAnimation = CurvedAnimation(
      parent: _fabAnimController,
      curve: Curves.easeInOut,
    );
    _fabAnimController.forward();
  }

  @override
  void dispose() {
    _fabAnimController.dispose();
    super.dispose();
  }

  // ─── Color helpers ────────────────────────────────────────────────────

  Color _statusColor(String? status) {
    switch (status) {
      case 'approved':
        return const Color(0xFF10B981);
      case 'submitted':
        return const Color(0xFF3B82F6);
      case 'reviewed':
        return const Color(0xFFF59E0B);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'draft':
        return const Color(0xFF94A3B8);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'approved':
        return 'معتمدة';
      case 'submitted':
        return 'مرسلة';
      case 'reviewed':
        return 'تمت المراجعة';
      case 'rejected':
        return 'مرفوضة';
      case 'draft':
        return 'مسودة';
      default:
        return 'غير معروف';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          _buildMap(),

          // Gradient header overlay
          _buildHeaderOverlay(),

          // Title & mode selector
          _buildTopBar(),

          // Stats overlay
          if (_showStats) _buildStatsOverlay(),

          // Selected submission detail panel
          if (_selectedSubmission != null) _buildSelectedPanel(),

          // FABs
          _buildFABs(),
        ],
      ),
    );
  }

  // ─── Top Bar ──────────────────────────────────────────────────────────

  Widget _buildHeaderOverlay() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF004D40).withValues(alpha: 0.85),
                const Color(0xFF004D40).withValues(alpha: 0.4),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.map_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'خريطة البيانات',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'اليمن — مراية شاملة',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // Toggle individual/grouped
                  _iconButton(
                    _showIndividual
                        ? Icons.layers_rounded
                        : Icons.layers_outlined,
                    onTap: () =>
                        setState(() => _showIndividual = !_showIndividual),
                  ),
                  const SizedBox(width: 8),
                  // Refresh
                  _iconButton(
                    Icons.refresh_rounded,
                    onTap: () {
                      ref.invalidate(
                        submissionsProvider(
                          SubmissionsFilter(
                            campaignType: ref.read(campaignProvider).value,
                          ),
                        ),
                      );
                      ref.invalidate(governoratesProvider);
                    },
                  ),
                  const SizedBox(width: 8),
                  // Toggle stats
                  _iconButton(
                    _showStats
                        ? Icons.info_rounded
                        : Icons.info_outline_rounded,
                    onTap: () => setState(() => _showStats = !_showStats),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Mode chips
              Row(
                children: [
                  _modeChip(
                    'submissions',
                    _showIndividual ? 'عرض فردي' : 'تجميعي',
                    _showIndividual
                        ? Icons.place_rounded
                        : Icons.scatter_plot_rounded,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeChip(String mode, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: const Color(0xFF00695C)),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF00695C),
            ),
          ),
        ],
      ),
    );
  }

  Widget _iconButton(IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  // ─── Stats Overlay ───────────────────────────────────────────────────

  Widget _buildStatsOverlay() {
    return Positioned(
      top: 155,
      left: 16,
      right: 16,
      child: Consumer(
        builder: (context, ref, _) {
          final submissionsAsync = ref.watch(
            submissionsProvider(
              SubmissionsFilter(
                campaignType: ref.read(campaignProvider).value,
              ),
            ),
          );
          final governoratesAsync = ref.watch(governoratesProvider);

          final subs = submissionsAsync.valueOrNull ?? [];
          final withGps = subs
              .where(
                (s) => s['gps_lat'] != null && s['gps_lng'] != null,
              )
              .length;
          final govCount = governoratesAsync.valueOrNull?.length ?? 0;

          return Row(
            children: [
              _statCard(
                'بإحداثيات',
                '$withGps',
                Icons.gps_fixed_rounded,
                const Color(0xFF3B82F6),
              ),
              const SizedBox(width: 8),
              _statCard(
                'محافظات',
                '$govCount',
                Icons.location_city_rounded,
                const Color(0xFF10B981),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _statCard(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1A2332),
                    ),
                  ),
                  Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: Color(0xFF9CA3AF),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Selected Submission Panel ────────────────────────────────────────

  Widget _buildSelectedPanel() {
    final sub = _selectedSubmission!;
    final lat = sub['gps_lat'] as double?;
    final lng = sub['gps_lng'] as double?;
    final accuracy = sub['gps_accuracy'] as double?;
    final status = sub['status'] as String? ?? 'draft';
    final govName =
        sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '';
    final distName = sub['districts']?['name_ar'] ?? sub['district_name'] ?? '';
    final createdAt = sub['created_at'] as String? ?? '';

    return Positioned(
      bottom: 90,
      left: 16,
      right: 16,
      child: TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        builder: (context, value, child) => Opacity(
          opacity: value,
          child: Transform.translate(
            offset: Offset(0, (1 - value) * 30),
            child: child,
          ),
        ),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header row
              Row(
                children: [
                  // Status indicator
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: _statusColor(status),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: _statusColor(status).withValues(alpha: 0.4),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      govName.isNotEmpty ? govName : 'إرسالية',
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  // Close button
                  GestureDetector(
                    onTap: () => setState(() => _selectedSubmission = null),
                    child: Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(
                        Icons.close_rounded,
                        size: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Coordinates display
              if (lat != null && lng != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDFA),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF00897B).withValues(alpha: 0.2),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Latitude
                      Row(
                        children: [
                          const Icon(
                            Icons.north_rounded,
                            size: 16,
                            color: Color(0xFF00897B),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'خط العرض: ',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              lat.toStringAsFixed(6),
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(
                                ClipboardData(text: lat.toStringAsFixed(6)),
                              );
                              HapticFeedback.lightImpact();
                            },
                            child: const Icon(
                              Icons.copy_rounded,
                              size: 14,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      // Longitude
                      Row(
                        children: [
                          const Icon(
                            Icons.east_rounded,
                            size: 16,
                            color: Color(0xFF00897B),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'خط الطول: ',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          Expanded(
                            child: Text(
                              lng.toStringAsFixed(6),
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          GestureDetector(
                            onTap: () {
                              Clipboard.setData(
                                ClipboardData(text: lng.toStringAsFixed(6)),
                              );
                              HapticFeedback.lightImpact();
                            },
                            child: const Icon(
                              Icons.copy_rounded,
                              size: 14,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        ],
                      ),
                      if (accuracy != null) ...[
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(
                              Icons.gps_not_fixed_rounded,
                              size: 16,
                              color: Color(0xFF94A3B8),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'الدقة: ${accuracy.toStringAsFixed(0)} متر',
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                color: Color(0xFF94A3B8),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 10),
              ],

              // Info row
              Row(
                children: [
                  if (distName.isNotEmpty) ...[
                    _infoChip(Icons.location_on_rounded, distName),
                    const SizedBox(width: 8),
                  ],
                  _infoChip(
                    Icons.circle,
                    _statusLabel(status),
                    color: _statusColor(status),
                  ),
                  const Spacer(),
                  if (createdAt.isNotEmpty)
                    Text(
                      _formatDate(createdAt),
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String label, {Color? color}) {
    final c = color ?? const Color(0xFF64748B);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: c),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: c,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  // ─── FABs ─────────────────────────────────────────────────────────────

  Widget _buildFABs() {
    return Positioned(
      bottom: 24,
      right: 16,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Fit all markers
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(
              Icons.fit_screen_rounded,
              const Color(0xFF00897B),
              () => _fitAllMarkers(),
            ),
          ),
          const SizedBox(height: 8),
          // My location
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(
              Icons.my_location_rounded,
              const Color(0xFF3B82F6),
              () => _mapController.move(_yemenCenter, 6.0),
            ),
          ),
          const SizedBox(height: 8),
          // Zoom in
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(Icons.add_rounded, Colors.white, () {
              setState(
                () => _currentZoom = (_currentZoom + 1).clamp(4.0, 18.0),
              );
              _mapController.move(
                _mapController.camera.center,
                _currentZoom,
              );
            }, iconColor: const Color(0xFF1A2332)),
          ),
          const SizedBox(height: 8),
          // Zoom out
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(Icons.remove_rounded, Colors.white, () {
              setState(
                () => _currentZoom = (_currentZoom - 1).clamp(4.0, 18.0),
              );
              _mapController.move(
                _mapController.camera.center,
                _currentZoom,
              );
            }, iconColor: const Color(0xFF1A2332)),
          ),
        ],
      ),
    );
  }

  void _fitAllMarkers() {
    final submissionsAsync = ref.read(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );
    final subs = submissionsAsync.valueOrNull ?? [];
    final points = subs
        .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
        .map(
          (s) => LatLng(s['gps_lat'] as double, s['gps_lng'] as double),
        )
        .toList();

    if (points.isEmpty) {
      _mapController.move(_yemenCenter, 6.0);
      return;
    }

    if (points.length == 1) {
      _mapController.move(points.first, 12.0);
      return;
    }

    // Calculate bounds
    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;
    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    final center = LatLng((minLat + maxLat) / 2, (minLng + maxLng) / 2);
    // Estimate zoom from bounds
    final latDiff = maxLat - minLat;
    final lngDiff = maxLng - minLng;
    final maxDiff = latDiff > lngDiff ? latDiff : lngDiff;
    double zoom = 6.0;
    if (maxDiff < 0.5) zoom = 12.0;
    if (maxDiff < 1) zoom = 10.0;
    if (maxDiff < 2) zoom = 9.0;
    if (maxDiff < 4) zoom = 8.0;
    if (maxDiff < 8) zoom = 7.0;

    _mapController.move(center, zoom);
  }

  Widget _fabMini(
    IconData icon,
    Color bgColor,
    VoidCallback onTap, {
    Color iconColor = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
    );
  }

  // ─── Map Layers ──────────────────────────────────────────────────────

  Widget _buildMap() {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: _yemenCenter,
        initialZoom: _currentZoom,
        minZoom: 4.0,
        maxZoom: 18.0,
        onPositionChanged: (pos, _) {
          setState(() => _currentZoom = pos.zoom ?? _currentZoom);
        },
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.epi.supervisor',
          tileBuilder: _darkTileBuilder,
        ),
        _showIndividual
            ? _buildIndividualMarkersLayer()
            : _buildSubmissionsClusterLayer(),
      ],
    );
  }

  // Dark tile overlay for better marker visibility
  Widget _darkTileBuilder(
    BuildContext context,
    Widget tileWidget,
    TileImage tile,
  ) {
    return ColorFiltered(
      colorFilter: const ColorFilter.matrix([
        0.85,
        0,
        0,
        0,
        10,
        0,
        0.9,
        0,
        0,
        8,
        0,
        0,
        0.95,
        0,
        5,
        0,
        0,
        0,
        1,
        0,
      ]),
      child: tileWidget,
    );
  }

  // ─── Individual Markers Layer ─────────────────────────────────────────

  Widget _buildIndividualMarkersLayer() {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );

    return submissionsAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (submissions) {
        final withGps = submissions
            .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
            .toList();

        if (withGps.isEmpty) return _buildGovernorateMarkers();

        final markers = withGps.map((sub) {
          final lat = (sub['gps_lat'] as num).toDouble();
          final lng = (sub['gps_lng'] as num).toDouble();
          final status = sub['status'] as String? ?? 'draft';
          final color = _statusColor(status);
          final isSelected = _selectedSubmission?['id'] == sub['id'];

          return Marker(
            point: LatLng(lat, lng),
            width: isSelected ? 52 : 40,
            height: isSelected ? 52 : 40,
            child: GestureDetector(
              onTap: () {
                HapticFeedback.lightImpact();
                setState(() => _selectedSubmission = sub);
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: isSelected ? 3 : 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.4),
                      blurRadius: isSelected ? 14 : 8,
                      spreadRadius: isSelected ? 2 : 1,
                    ),
                  ],
                ),
                child: isSelected
                    ? const Icon(
                        Icons.place_rounded,
                        color: Colors.white,
                        size: 24,
                      )
                    : null,
              ),
            ),
          );
        }).toList();

        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Submissions Cluster Layer ───────────────────────────────────────

  Widget _buildSubmissionsClusterLayer() {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );

    return submissionsAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (submissions) {
        // Group submissions by governorate
        final grouped = <String, List<Map<String, dynamic>>>{};
        final govInfo = <String, Map<String, dynamic>>{};

        for (final sub in submissions) {
          final govId = sub['governorate_id'] as String?;
          if (govId == null) continue;
          grouped.putIfAbsent(govId, () => []).add(sub);
          if (!govInfo.containsKey(govId)) {
            govInfo[govId] = {
              'name': sub['governorates']?['name_ar'] ?? '',
              'lat': sub['gps_lat'],
              'lng': sub['gps_lng'],
            };
          }
        }

        if (grouped.isEmpty) return _buildGovernorateMarkers();

        final markers = <Marker>[];
        for (final entry in grouped.entries) {
          final govId = entry.key;
          final subs = entry.value;
          final info = govInfo[govId]!;
          final lat = info['lat'] as double?;
          final lng = info['lng'] as double?;
          if (lat == null || lng == null) continue;

          final count = subs.length;
          final color = count > 20
              ? const Color(0xFF10B981)
              : count > 5
                  ? const Color(0xFF3B82F6)
                  : count > 0
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFF94A3B8);

          markers.add(
            Marker(
              point: LatLng(lat, lng),
              width: 56,
              height: 56,
              child: GestureDetector(
                onTap: () => _showGroupInfo(info['name'] as String, subs),
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.4),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$count',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        if (markers.isEmpty) return _buildGovernorateMarkers();
        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Governorate Markers ─────────────────────────────────────────────

  Widget _buildGovernorateMarkers() {
    final governoratesAsync = ref.watch(governoratesProvider);

    return governoratesAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (governorates) {
        final markers = governorates
            .where(
          (g) => g['center_lat'] != null && g['center_lng'] != null,
        )
            .map((gov) {
          final lat = (gov['center_lat'] as num).toDouble();
          final lng = (gov['center_lng'] as num).toDouble();
          final name = gov['name_ar'] ?? '';
          final count = (gov['submission_count'] as num?)?.toInt() ?? 0;

          final color = count > 20
              ? const Color(0xFF10B981)
              : count > 5
                  ? const Color(0xFF3B82F6)
                  : count > 0
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFF94A3B8);

          return Marker(
            point: LatLng(lat, lng),
            width: 56,
            height: 56,
            child: GestureDetector(
              onTap: () => _showGovernorateInfo(gov),
              child: Container(
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.4),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Text(
                  '$count',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          );
        }).toList();

        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Info Bottom Sheets ──────────────────────────────────────────────

  void _showGroupInfo(String govName, List<Map<String, dynamic>> subs) {
    final byStatus = <String, int>{};
    for (final s in subs) {
      final st = s['status'] as String? ?? 'draft';
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }

    // Count GPS-equipped
    final withGps =
        subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                govName.isNotEmpty ? govName : 'إرساليات',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${subs.length} إرسالية — $withGps بإحداثيات',
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  color: Color(0xFF9CA3AF),
                ),
              ),
              const SizedBox(height: 16),
              // Status breakdown
              ...byStatus.entries.map(
                (e) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      EpiStatusChip(status: e.key, small: true),
                      const Spacer(),
                      Text(
                        '${e.value}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'إغلاق',
                    style: TextStyle(fontFamily: 'Tajawal'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showGovernorateInfo(Map<String, dynamic> gov) {
    final name = gov['name_ar'] ?? '';
    final nameEn = gov['name_en'] ?? '';
    final count = (gov['submission_count'] as num?)?.toInt() ?? 0;
    final lat = gov['center_lat'];
    final lng = gov['center_lng'];

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            // Avatar circle
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF00897B), Color(0xFF00695C)],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00897B).withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: const Icon(
                Icons.location_city_rounded,
                color: Colors.white,
                size: 32,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              name,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            if (nameEn.isNotEmpty)
              Text(
                nameEn,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 14,
                  color: Color(0xFF9CA3AF),
                ),
              ),
            const SizedBox(height: 12),

            // Coordinates
            if (lat != null && lng != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0FDFA),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFF00897B).withValues(alpha: 0.2),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.place_rounded,
                          size: 16,
                          color: Color(0xFF00897B),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'إحداثيات المركز',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(lat as num).toStringAsFixed(6)}, ${(lng as num).toStringAsFixed(6)}',
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),

            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _govStatBox(
                  'الإرساليات',
                  '$count',
                  Icons.description_rounded,
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'إغلاق',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _govStatBox(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FA),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF00897B), size: 24),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1A2332),
            ),
          ),
          Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              color: Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }
}
