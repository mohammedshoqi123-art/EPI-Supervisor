import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/src/auth/auth_state.dart';
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
  MapViewMode _viewMode = MapViewMode.aggregated;
  Map<String, dynamic>? _selectedSubmission;
  Map<String, dynamic>? _selectedCluster;

  late AnimationController _fabAnimController;
  late Animation<double> _fabAnimation;

  static const _yemenCenter = LatLng(15.5527, 48.5164);

  // ─── RBAC ──────────────────────────────────────────────────────────

  UserRole? get _role =>
      ref.read(authStateProvider).valueOrNull?.role ?? UserRole.data_entry;

  bool get _canViewFullCoords {
    final r = _role;
    return r == UserRole.admin ||
        r == UserRole.central ||
        r == UserRole.governorate;
  }

  bool get _canViewAllGovernorates {
    final r = _role;
    return r == UserRole.admin || r == UserRole.central;
  }

  String? get _userGovId =>
      ref.read(authStateProvider).valueOrNull?.governorateId;
  String? get _userDistId =>
      ref.read(authStateProvider).valueOrNull?.districtId;

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

  // ─── Color helpers ─────────────────────────────────────────────────

  Color _statusColor(String? status) {
    switch (status) {
      case 'submitted':
        return const Color(0xFF3B82F6);
      case 'draft':
        return const Color(0xFFFB8C00);
      default:
        return const Color(0xFF6B7280);
    }
  }

  String _statusLabel(String? status) {
    switch (status) {
      case 'submitted':
        return 'مرسلة';
      case 'draft':
        return 'مسودة';
      default:
        return 'غير معروف';
    }
  }

  Color _clusterColor(int count) {
    if (count >= 50) return const Color(0xFF059669);
    if (count >= 20) return const Color(0xFF10B981);
    if (count >= 10) return const Color(0xFF3B82F6);
    if (count >= 5) return const Color(0xFFF59E0B);
    if (count > 0) return const Color(0xFFF97316);
    return const Color(0xFFCBD5E1);
  }

  // ─── Build ─────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildMap(),
          _buildHeaderOverlay(),
          _buildTopBar(),
          if (_showStats) _buildStatsOverlay(),
          if (_selectedSubmission != null) _buildSelectedPanel(),
          if (_selectedCluster != null) _buildClusterPanel(),
          _buildFABs(),
        ],
      ),
    );
  }

  // ─── Header ────────────────────────────────────────────────────────

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
                const Color(0xFF004D40).withValues(alpha: 0.88),
                const Color(0xFF004D40).withValues(alpha: 0.35),
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
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'خريطة البيانات',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          _viewMode == MapViewMode.aggregated
                              ? 'عرض تجميعي — حسب المحافظات'
                              : 'عرض فردي — دبابيس الإرساليات',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _iconButton(
                    _viewMode == MapViewMode.aggregated
                        ? Icons.scatter_plot_rounded
                        : Icons.layers_rounded,
                    onTap: () => setState(() {
                      _selectedSubmission = null;
                      _selectedCluster = null;
                      _viewMode = _viewMode == MapViewMode.aggregated
                          ? MapViewMode.individual
                          : MapViewMode.aggregated;
                    }),
                  ),
                  const SizedBox(width: 8),
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
                  _iconButton(
                    _showStats
                        ? Icons.info_rounded
                        : Icons.info_outline_rounded,
                    onTap: () => setState(() => _showStats = !_showStats),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Mode selector chips
              Row(
                children: [
                  _modeChip(
                    MapViewMode.aggregated,
                    'تجميعي',
                    Icons.bubble_chart_rounded,
                  ),
                  const SizedBox(width: 8),
                  _modeChip(
                    MapViewMode.individual,
                    'فردي',
                    Icons.place_rounded,
                  ),
                  if (_canViewFullCoords) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color:
                              const Color(0xFF10B981).withValues(alpha: 0.3),
                        ),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.gps_fixed, size: 12, color: Color(0xFF10B981)),
                          SizedBox(width: 4),
                          Text(
                            'إحداثيات كاملة',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF10B981),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _modeChip(MapViewMode mode, String label, IconData icon) {
    final isSelected = _viewMode == mode;
    return GestureDetector(
      onTap: () => setState(() {
        _selectedSubmission = null;
        _selectedCluster = null;
        _viewMode = mode;
      }),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF00897B).withValues(alpha: 0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: isSelected
                  ? const Color(0xFF00695C)
                  : Colors.white,
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color:
                    isSelected ? const Color(0xFF00695C) : Colors.white,
              ),
            ),
          ],
        ),
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

  // ─── Stats Overlay ─────────────────────────────────────────────────

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
          final drafts =
              subs.where((s) => s['status'] == 'draft').length;
          final govCount = governoratesAsync.valueOrNull?.length ?? 0;

          return Row(
            children: [
              _statCard(
                'الإرساليات',
                '${subs.length}',
                Icons.description_rounded,
                const Color(0xFF3B82F6),
              ),
              const SizedBox(width: 8),
              _statCard(
                'بإحداثيات',
                '$withGps',
                Icons.gps_fixed_rounded,
                const Color(0xFF10B981),
              ),
              const SizedBox(width: 8),
              _statCard(
                'مسودات',
                '$drafts',
                Icons.edit_note_rounded,
                const Color(0xFFFB8C00),
              ),
              const SizedBox(width: 8),
              _statCard(
                'محافظات',
                '$govCount',
                Icons.location_city_rounded,
                const Color(0xFF00897B),
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
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.12),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 9,
                color: Color(0xFF9CA3AF),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ─── Selected Submission Panel ──────────────────────────────────────

  Widget _buildSelectedPanel() {
    final sub = _selectedSubmission!;
    final lat = sub['gps_lat'] as double?;
    final lng = sub['gps_lng'] as double?;
    final accuracy = sub['gps_accuracy'] as double?;
    final status = sub['status'] as String? ?? 'draft';
    final govName =
        sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '';
    final distName =
        sub['districts']?['name_ar'] ?? sub['district_name'] ?? '';
    final createdAt = sub['created_at'] as String? ?? '';
    final formTitle = sub['forms']?['title_ar'] ?? sub['form_title'] ?? '';

    // RBAC: show full coords only for privileged roles
    final showFullCoords = _canViewFullCoords;

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
              // Header
              Row(
                children: [
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
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          govName.isNotEmpty ? govName : 'إرسالية',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (formTitle.isNotEmpty)
                          Text(
                            formTitle,
                            style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                      ],
                    ),
                  ),
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

              // Coordinates — full for privileged, masked for others
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
                            Icons.gps_fixed_rounded,
                            size: 14,
                            color: Color(0xFF00897B),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            showFullCoords
                                ? 'الإحداثيات الكاملة'
                                : 'الإحداثيات',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      if (showFullCoords) ...[
                        // Full coordinates for admin/central/governorate
                        _coordRow(
                          'خط العرض',
                          lat.toStringAsFixed(6),
                          Icons.north_rounded,
                        ),
                        const SizedBox(height: 4),
                        _coordRow(
                          'خط الطول',
                          lng.toStringAsFixed(6),
                          Icons.east_rounded,
                        ),
                      ] else ...[
                        // Masked for district/data_entry
                        _coordRow(
                          'خط العرض',
                          '${lat.toStringAsFixed(2)}°',
                          Icons.north_rounded,
                        ),
                        const SizedBox(height: 4),
                        _coordRow(
                          'خط الطول',
                          '${lng.toStringAsFixed(2)}°',
                          Icons.east_rounded,
                        ),
                      ],
                      if (accuracy != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'الدقة: ${accuracy.toStringAsFixed(0)} متر',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              const SizedBox(height: 10),

              // Tags
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  if (distName.isNotEmpty)
                    _infoChip(Icons.location_on_rounded, distName),
                  _infoChip(
                    Icons.circle,
                    _statusLabel(status),
                    color: _statusColor(status),
                  ),
                  if (createdAt.isNotEmpty)
                    _infoChip(
                      Icons.access_time_rounded,
                      _formatDate(createdAt),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _coordRow(String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: const Color(0xFF00897B)),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 12,
            color: Color(0xFF64748B),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: Color(0xFF0F172A),
              letterSpacing: 0.5,
            ),
          ),
        ),
        GestureDetector(
          onTap: () {
            Clipboard.setData(ClipboardData(text: value));
            HapticFeedback.lightImpact();
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('تم نسخ $label'),
                duration: const Duration(seconds: 1),
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            );
          },
          child: const Icon(
            Icons.copy_rounded,
            size: 14,
            color: Color(0xFF94A3B8),
          ),
        ),
      ],
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

  // ─── Cluster Panel (Aggregated view) ───────────────────────────────

  Widget _buildClusterPanel() {
    final cluster = _selectedCluster!;
    final name = cluster['name'] as String? ?? '';
    final subs = cluster['submissions'] as List<Map<String, dynamic>>;
    final lat = cluster['lat'] as double?;
    final lng = cluster['lng'] as double?;

    final byStatus = <String, int>{};
    for (final s in subs) {
      final st = s['status'] as String? ?? 'draft';
      byStatus[st] = (byStatus[st] ?? 0) + 1;
    }

    final withGps =
        subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length;

    final showFullCoords = _canViewFullCoords;

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
          padding: const EdgeInsets.all(20),
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
              // Header
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          _clusterColor(subs.length),
                          _clusterColor(subs.length).withValues(alpha: 0.7),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: _clusterColor(subs.length)
                              .withValues(alpha: 0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 3),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        '${subs.length}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name.isNotEmpty ? name : 'إرساليات',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '$withGps / ${subs.length} بإحداثيات',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _selectedCluster = null),
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
              const SizedBox(height: 16),

              // Coordinates — if privileged
              if (showFullCoords && lat != null && lng != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0FDFA),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: const Color(0xFF00897B).withValues(alpha: 0.15),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.place_rounded,
                        size: 14,
                        color: Color(0xFF00897B),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        '${lat.toStringAsFixed(4)}, ${lng.toStringAsFixed(4)}',
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              if (showFullCoords && lat != null) const SizedBox(height: 12),

              // Status breakdown — horizontal bars
              ...byStatus.entries.map((e) {
                final pct = subs.isEmpty ? 0.0 : e.value / subs.length;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 80,
                        child: Text(
                          _statusLabel(e.key),
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ),
                      Expanded(
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: pct,
                            backgroundColor: Colors.grey.shade100,
                            valueColor: AlwaysStoppedAnimation(
                              _statusColor(e.key),
                            ),
                            minHeight: 8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        width: 30,
                        child: Text(
                          '${e.value}',
                          textAlign: TextAlign.end,
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(e.key),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  // ─── FABs ──────────────────────────────────────────────────────────

  Widget _buildFABs() {
    return Positioned(
      bottom: 24,
      right: 16,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(
              Icons.fit_screen_rounded,
              const Color(0xFF00897B),
              () => _fitAllMarkers(),
            ),
          ),
          const SizedBox(height: 8),
          ScaleTransition(
            scale: _fabAnimation,
            child: _fabMini(
              Icons.my_location_rounded,
              const Color(0xFF3B82F6),
              () => _mapController.move(_yemenCenter, 6.0),
            ),
          ),
          const SizedBox(height: 8),
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

  // ─── Map ───────────────────────────────────────────────────────────

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
        _viewMode == MapViewMode.aggregated
            ? _buildAggregatedLayer()
            : _buildIndividualLayer(),
      ],
    );
  }

  Widget _darkTileBuilder(
    BuildContext context,
    Widget tileWidget,
    TileImage tile,
  ) {
    return ColorFiltered(
      colorFilter: const ColorFilter.matrix([
        0.85, 0, 0, 0, 10,
        0, 0.9, 0, 0, 8,
        0, 0, 0.95, 0, 5,
        0, 0, 0, 1, 0,
      ]),
      child: tileWidget,
    );
  }

  // ─── Aggregated Layer ──────────────────────────────────────────────

  Widget _buildAggregatedLayer() {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );
    final governoratesAsync = ref.watch(governoratesProvider);

    return submissionsAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => _buildGovernorateFallback(),
      data: (submissions) {
        // Group by governorate
        final grouped = <String, List<Map<String, dynamic>>>{};
        final govMeta = <String, Map<String, dynamic>>{};

        for (final sub in submissions) {
          final govId = sub['governorate_id'] as String?;
          if (govId == null) continue;

          // RBAC filtering
          if (!_canViewAllGovernorates) {
            if (_userGovId != null && govId != _userGovId) continue;
            if (_role == UserRole.district &&
                _userDistId != null &&
                sub['district_id'] != _userDistId) continue;
            if (_role == UserRole.data_entry) continue;
          }

          grouped.putIfAbsent(govId, () => []).add(sub);
          if (!govMeta.containsKey(govId)) {
            final govData = sub['governorates'];
            govMeta[govId] = {
              'name': govData?['name_ar'] ?? sub['governorate_name'] ?? '',
              'lat': sub['gps_lat'],
              'lng': sub['gps_lng'],
            };
          }
        }

        if (grouped.isEmpty) return _buildGovernorateFallback();

        final markers = <Marker>[];
        for (final entry in grouped.entries) {
          final govId = entry.key;
          final subs = entry.value;
          final meta = govMeta[govId]!;
          final lat = meta['lat'] as double?;
          final lng = meta['lng'] as double?;
          if (lat == null || lng == null) continue;

          final count = subs.length;
          final color = _clusterColor(count);

          markers.add(
            Marker(
              point: LatLng(lat, lng),
              width: _currentZoom > 10 ? 64 : 56,
              height: _currentZoom > 10 ? 64 : 56,
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  setState(() {
                    _selectedSubmission = null;
                    _selectedCluster = {
                      'name': meta['name'],
                      'submissions': subs,
                      'lat': lat,
                      'lng': lng,
                    };
                  });
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2.5),
                    boxShadow: [
                      BoxShadow(
                        color: color.withValues(alpha: 0.45),
                        blurRadius: 14,
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
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1.0,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }

        if (markers.isEmpty) return _buildGovernorateFallback();
        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Individual Layer (tiny pins) ──────────────────────────────────

  Widget _buildIndividualLayer() {
    final submissionsAsync = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );

    return submissionsAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (submissions) {
        List<Map<String, dynamic>> filtered = submissions
            .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
            .toList();

        // RBAC filtering
        if (!_canViewAllGovernorates) {
          filtered = filtered.where((s) {
            if (_role == UserRole.governorate) {
              return s['governorate_id'] == _userGovId;
            }
            if (_role == UserRole.district) {
              return s['district_id'] == _userDistId;
            }
            if (_role == UserRole.data_entry) {
              return s['submitted_by'] ==
                  ref.read(authStateProvider).valueOrNull?.userId;
            }
            return true;
          }).toList();
        }

        if (filtered.isEmpty) return _buildGovernorateFallback();

        final markers = filtered.map((sub) {
          final lat = (sub['gps_lat'] as num).toDouble();
          final lng = (sub['gps_lng'] as num).toDouble();
          final status = sub['status'] as String? ?? 'draft';
          final color = _statusColor(status);
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
              child: isSelected
                  // Selected: slightly bigger pin with shadow
                  ? Container(
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: color.withValues(alpha: 0.5),
                            blurRadius: 10,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: const Icon(
                        Icons.place,
                        color: Colors.white,
                        size: 14,
                      ),
                    )
                  // Normal: very tiny dot
                  : Container(
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.8),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: color.withValues(alpha: 0.3),
                            blurRadius: 4,
                            spreadRadius: 0.5,
                          ),
                        ],
                      ),
                    ),
            ),
          );
        }).toList();

        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Governorate Fallback (when no GPS submissions) ────────────────

  Widget _buildGovernorateFallback() {
    final governoratesAsync = ref.watch(governoratesProvider);

    return governoratesAsync.when(
      loading: () => const MarkerLayer(markers: []),
      error: (_, __) => const MarkerLayer(markers: []),
      data: (governorates) {
        // RBAC filtering
        var filtered = governorates;
        if (!_canViewAllGovernorates && _userGovId != null) {
          filtered =
              governorates.where((g) => g['id'] == _userGovId).toList();
        }

        final markers = filtered
            .where(
              (g) => g['center_lat'] != null && g['center_lng'] != null,
            )
            .map((gov) {
          final lat = (gov['center_lat'] as num).toDouble();
          final lng = (gov['center_lng'] as num).toDouble();
          final name = gov['name_ar'] ?? '';
          final count =
              (gov['submission_count'] as num?)?.toInt() ?? 0;
          final color = _clusterColor(count);

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
                  border: Border.all(color: Colors.white, width: 2.5),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.4),
                      blurRadius: 12,
                      offset: const Offset(0, 3),
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
                    Text(
                      name.length > 3 ? name.substring(0, 3) : name,
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 7,
                        color: Colors.white70,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ),
          );
        }).toList();

        return MarkerLayer(markers: markers);
      },
    );
  }

  // ─── Governorate Info Sheet ────────────────────────────────────────

  void _showGovernorateInfo(Map<String, dynamic> gov) {
    final name = gov['name_ar'] ?? '';
    final nameEn = gov['name_en'] ?? '';
    final count = (gov['submission_count'] as num?)?.toInt() ?? 0;
    final lat = gov['center_lat'];
    final lng = gov['center_lng'];
    final showFullCoords = _canViewFullCoords;

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
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _clusterColor(count),
                    _clusterColor(count).withValues(alpha: 0.7),
                  ],
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: _clusterColor(count).withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  '$count',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                  ),
                ),
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
            if (showFullCoords && lat != null && lng != null)
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
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _govStatBox(
                  'إرساليات',
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

// ─── View Mode Enum ──────────────────────────────────────────────────

enum MapViewMode { aggregated, individual }
