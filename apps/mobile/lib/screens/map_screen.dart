import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_shared/epi_shared.dart';
import '../providers/app_providers.dart';

// ═══════════════════════════════════════════════════════════════════════════
// MAP SCREEN — Decomposed into isolated widgets with RepaintBoundary
// ═══════════════════════════════════════════════════════════════════════════

class MapScreen extends ConsumerStatefulWidget {
  const MapScreen({super.key});

  @override
  ConsumerState<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends ConsumerState<MapScreen>
    with TickerProviderStateMixin {
  final MapController _mapController = MapController();
  bool _showStats = true;
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
          // Map — isolated in its own RepaintBoundary
          RepaintBoundary(
            child: _MapWidget(
              controller: _mapController,
              center: _yemenCenter,
              showIndividual: _showIndividual,
              selectedSubmission: _selectedSubmission,
              statusColor: _statusColor,
              onSubmissionTap: (sub) {
                HapticFeedback.lightImpact();
                setState(() => _selectedSubmission = sub);
              },
            ),
          ),

          // Static header gradient — never rebuilds
          const RepaintBoundary(child: _HeaderOverlay()),

          // Top bar — only rebuilds on toggle
          RepaintBoundary(
            child: _TopBar(
              showIndividual: _showIndividual,
              showStats: _showStats,
              onToggleIndividual: () =>
                  setState(() => _showIndividual = !_showIndividual),
              onToggleStats: () => setState(() => _showStats = !_showStats),
              onRefresh: () {
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
          ),

          // Stats overlay — isolated consumer
          if (_showStats)
            RepaintBoundary(child: _StatsOverlay(campaignRef: ref)),

          // Selected submission detail panel
          if (_selectedSubmission != null)
            _SelectedSubmissionPanel(
              submission: _selectedSubmission!,
              statusColor: _statusColor,
              statusLabel: _statusLabel,
              onClose: () => setState(() => _selectedSubmission = null),
            ),

          // FABs
          RepaintBoundary(
            child: _MapFabs(
              fabAnimation: _fabAnimation,
              onFitAll: () => _fitAllMarkers(),
              onMyLocation: () => _mapController.move(_yemenCenter, 6.0),
              onZoomIn: () {
                final z = (_mapController.camera.zoom + 1).clamp(4.0, 18.0);
                _mapController.move(_mapController.camera.center, z);
              },
              onZoomOut: () {
                final z = (_mapController.camera.zoom - 1).clamp(4.0, 18.0);
                _mapController.move(_mapController.camera.center, z);
              },
            ),
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
    final maxDiff = (maxLat - minLat) > (maxLng - minLng)
        ? (maxLat - minLat)
        : (maxLng - minLng);
    double zoom = 6.0;
    if (maxDiff < 0.5) zoom = 12.0;
    if (maxDiff < 1) zoom = 10.0;
    if (maxDiff < 2) zoom = 9.0;
    if (maxDiff < 4) zoom = 8.0;
    if (maxDiff < 8) zoom = 7.0;

    _mapController.move(center, zoom);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ISOLATED MAP WIDGET — No setState, no ColorFiltered
// ═══════════════════════════════════════════════════════════════════════════

class _MapWidget extends StatelessWidget {
  final MapController controller;
  final LatLng center;
  final bool showIndividual;
  final Map<String, dynamic>? selectedSubmission;
  final Color Function(String?) statusColor;
  final ValueChanged<Map<String, dynamic>> onSubmissionTap;

  const _MapWidget({
    required this.controller,
    required this.center,
    required this.showIndividual,
    required this.selectedSubmission,
    required this.statusColor,
    required this.onSubmissionTap,
  });

  @override
  Widget build(BuildContext context) {
    return FlutterMap(
      mapController: controller,
      options: MapOptions(
        initialCenter: center,
        initialZoom: 6.0,
        minZoom: 4.0,
        maxZoom: 18.0,
        // NO onPositionChanged → no setState on every gesture
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.epi.supervisor',
          // NO tileBuilder → no ColorFiltered per tile → GPU relief
        ),
        // Markers — separate consumer so only markers rebuild
        Consumer(
          builder: (context, ref, _) {
            if (showIndividual) {
              return _IndividualMarkers(
                ref: ref,
                selectedSubmission: selectedSubmission,
                statusColor: statusColor,
                onTap: onSubmissionTap,
              );
            }
            return _ClusterMarkers(ref: ref);
          },
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INDIVIDUAL MARKERS — Isolated
// ═══════════════════════════════════════════════════════════════════════════

class _IndividualMarkers extends StatelessWidget {
  final WidgetRef ref;
  final Map<String, dynamic>? selectedSubmission;
  final Color Function(String?) statusColor;
  final ValueChanged<Map<String, dynamic>> onTap;

  const _IndividualMarkers({
    required this.ref,
    required this.selectedSubmission,
    required this.statusColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
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

        if (withGps.isEmpty) {
          return _GovernorateMarkers(ref: ref);
        }

        final markers = withGps.map((sub) {
          final lat = (sub['gps_lat'] as num).toDouble();
          final lng = (sub['gps_lng'] as num).toDouble();
          final status = sub['status'] as String? ?? 'draft';
          final color = statusColor(status);
          final isSelected = selectedSubmission?['id'] == sub['id'];

          return Marker(
            point: LatLng(lat, lng),
            width: isSelected ? 52 : 40,
            height: isSelected ? 52 : 40,
            child: GestureDetector(
              onTap: () => onTap(sub),
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
}

// ═══════════════════════════════════════════════════════════════════════════
// CLUSTER MARKERS — Isolated
// ═══════════════════════════════════════════════════════════════════════════

class _ClusterMarkers extends StatelessWidget {
  final WidgetRef ref;
  const _ClusterMarkers({required this.ref});

  @override
  Widget build(BuildContext context) {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );

    return submissionsAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (submissions) {
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

        if (grouped.isEmpty) return _GovernorateMarkers(ref: ref);

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
        }

        if (markers.isEmpty) return _GovernorateMarkers(ref: ref);
        return MarkerLayer(markers: markers);
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GOVERNORATE MARKERS — Isolated fallback
// ═══════════════════════════════════════════════════════════════════════════

class _GovernorateMarkers extends StatelessWidget {
  final WidgetRef ref;
  const _GovernorateMarkers({required this.ref});

  @override
  Widget build(BuildContext context) {
    final governoratesAsync = ref.watch(governoratesProvider);

    return governoratesAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (governorates) {
        final markers = governorates
            .where((g) => g['center_lat'] != null && g['center_lng'] != null)
            .map((gov) {
          final lat = (gov['center_lat'] as num).toDouble();
          final lng = (gov['center_lng'] as num).toDouble();
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
          );
        }).toList();

        return MarkerLayer(markers: markers);
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER OVERLAY — Static, never rebuilds
// ═══════════════════════════════════════════════════════════════════════════

class _HeaderOverlay extends StatelessWidget {
  const _HeaderOverlay();

  @override
  Widget build(BuildContext context) {
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
}

// ═══════════════════════════════════════════════════════════════════════════
// TOP BAR — Only rebuilds on toggle
// ═══════════════════════════════════════════════════════════════════════════

class _TopBar extends StatelessWidget {
  final bool showIndividual;
  final bool showStats;
  final VoidCallback onToggleIndividual;
  final VoidCallback onToggleStats;
  final VoidCallback onRefresh;

  const _TopBar({
    required this.showIndividual,
    required this.showStats,
    required this.onToggleIndividual,
    required this.onToggleStats,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
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
                  _iconButton(
                    showIndividual
                        ? Icons.layers_rounded
                        : Icons.layers_outlined,
                    onTap: onToggleIndividual,
                  ),
                  const SizedBox(width: 8),
                  _iconButton(Icons.refresh_rounded, onTap: onRefresh),
                  const SizedBox(width: 8),
                  _iconButton(
                    showStats ? Icons.info_rounded : Icons.info_outline_rounded,
                    onTap: onToggleStats,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          showIndividual
                              ? Icons.place_rounded
                              : Icons.scatter_plot_rounded,
                          size: 16,
                          color: const Color(0xFF00695C),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          showIndividual ? 'عرض فردي' : 'تجميعي',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF00695C),
                          ),
                        ),
                      ],
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

  static Widget _iconButton(IconData icon, {VoidCallback? onTap}) {
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
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS OVERLAY — Isolated Consumer
// ═══════════════════════════════════════════════════════════════════════════

class _StatsOverlay extends ConsumerWidget {
  final WidgetRef campaignRef;
  const _StatsOverlay({required this.campaignRef});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );
    final governoratesAsync = ref.watch(governoratesProvider);

    final subs = submissionsAsync.valueOrNull ?? [];
    final withGps =
        subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length;
    final govCount = governoratesAsync.valueOrNull?.length ?? 0;

    return Positioned(
      top: 155,
      left: 16,
      right: 16,
      child: Row(
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
      ),
    );
  }

  static Widget _statCard(
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
}

// ═══════════════════════════════════════════════════════════════════════════
// SELECTED SUBMISSION PANEL
// ═══════════════════════════════════════════════════════════════════════════

class _SelectedSubmissionPanel extends StatelessWidget {
  final Map<String, dynamic> submission;
  final Color Function(String?) statusColor;
  final String Function(String?) statusLabel;
  final VoidCallback onClose;

  const _SelectedSubmissionPanel({
    required this.submission,
    required this.statusColor,
    required this.statusLabel,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final sub = submission;
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
              Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: statusColor(status),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: statusColor(status).withValues(alpha: 0.4),
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
                  GestureDetector(
                    onTap: onClose,
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
              if (lat != null && lng != null) ...[
                const SizedBox(height: 12),
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
              ],
              const SizedBox(height: 10),
              Row(
                children: [
                  if (distName.isNotEmpty) ...[
                    _infoChip(Icons.location_on_rounded, distName),
                    const SizedBox(width: 8),
                  ],
                  _infoChip(
                    Icons.circle,
                    statusLabel(status),
                    color: statusColor(status),
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

  static Widget _infoChip(IconData icon, String label, {Color? color}) {
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

  static String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAP FABS — Isolated, SafeArea-aware
// ═══════════════════════════════════════════════════════════════════════════

class _MapFabs extends StatelessWidget {
  final Animation<double> fabAnimation;
  final VoidCallback onFitAll;
  final VoidCallback onMyLocation;
  final VoidCallback onZoomIn;
  final VoidCallback onZoomOut;

  const _MapFabs({
    required this.fabAnimation,
    required this.onFitAll,
    required this.onMyLocation,
    required this.onZoomIn,
    required this.onZoomOut,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: MediaQuery.of(context).padding.bottom + 24,
      right: 16,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: fabAnimation,
            child: _fabMini(
              Icons.fit_screen_rounded,
              const Color(0xFF00897B),
              onFitAll,
            ),
          ),
          const SizedBox(height: 8),
          ScaleTransition(
            scale: fabAnimation,
            child: _fabMini(
              Icons.my_location_rounded,
              const Color(0xFF3B82F6),
              onMyLocation,
            ),
          ),
          const SizedBox(height: 8),
          ScaleTransition(
            scale: fabAnimation,
            child: _fabMini(
              Icons.add_rounded,
              Colors.white,
              onZoomIn,
              iconColor: const Color(0xFF1A2332),
            ),
          ),
          const SizedBox(height: 8),
          ScaleTransition(
            scale: fabAnimation,
            child: _fabMini(
              Icons.remove_rounded,
              Colors.white,
              onZoomOut,
              iconColor: const Color(0xFF1A2332),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _fabMini(
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
}
