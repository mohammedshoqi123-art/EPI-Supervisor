import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../router/app_router.dart';
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
  MapViewMode _viewMode = MapViewMode.individual;
  Map<String, dynamic>? _selectedSubmission;
  Map<String, dynamic>? _selectedCluster;
  MapColorMode _colorMode =
      MapColorMode.level; // ═══ ألوان حسب المستوى الإداري (افتراضي) ═══

  // ─── Filter state ────────────────────────────────────────────
  String? _filterFormId;
  String? _filterSupervisorId;
  String? _filterLevel; // مركزي/محافظة/مديرية/ميداني
  bool _showFilters = false;
  final TextEditingController _searchCtrl = TextEditingController();

  // ═══ P0-1: Memoize _getFilteredSubmissions — was called 5x per build (25,000 filter ops)
  // Now cached and only recomputed when filters or data actually change
  List<Map<String, dynamic>>? _cachedFilteredSubs;
  String? _cachedFilterSignature;
  int? _cachedDataHash;

  // ═══ P0-2: Debounce search input — was triggering setState on every keystroke
  Timer? _searchDebounce;

  late AnimationController _fabAnimController;
  late Animation<double> _fabAnimation;

  static const _yemenCenter = LatLng(15.5527, 48.5164);

  // ─── RBAC shortcuts ──────────────────────────────────────────

  UserRole? get _role =>
      ref.read(authStateProvider).valueOrNull?.role ?? UserRole.data_entry;
  bool get _canViewFullCoords => MapHelpers.canViewFullCoords(_role);
  bool get _canViewAllGovernorates => MapHelpers.canViewAllGovernorates(_role);
  String? get _userGovId =>
      ref.read(authStateProvider).valueOrNull?.governorateId;
  String? get _userDistId =>
      ref.read(authStateProvider).valueOrNull?.districtId;
  String? get _userId => ref.read(authStateProvider).valueOrNull?.userId;

  @override
  void initState() {
    super.initState();
    _fabAnimController = AnimationController(
        duration: const Duration(milliseconds: 300), vsync: this);
    _fabAnimation =
        CurvedAnimation(parent: _fabAnimController, curve: Curves.easeInOut);
    _fabAnimController.forward();

    // ═══ NO auto-refresh — user presses sync button ═══
  }

  @override
  void dispose() {
    _fabAnimController.dispose();
    _searchCtrl.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  // ─── Actions ─────────────────────────────────────────────────

  void _toggleMode() {
    // Aggregated mode removed — always individual
  }

  void _refresh() {
    HapticFeedback.mediumImpact();
    // ═══ FIX #3: Invalidate with current filter so map re-fetches ═══
    ref.invalidate(submissionsProvider(SubmissionsFilter(
      campaignType: ref.read(campaignProvider).value,
      campaignRound: ref.read(campaignRoundProvider),
      limit: 2000,
      lean: true,  // ═══ P0: Match the lean query used in _getFilteredSubmissions
    )));
    ref.invalidate(governoratesProvider);
  }

  void _resetFilters() {
    setState(() {
      _filterFormId = null;
      _filterSupervisorId = null;
      _filterLevel = null;
      _searchCtrl.clear();
      _invalidateFilterCache();
    });
  }

  int get _activeFilterCount {
    int c = 0;
    if (_filterFormId != null) c++;
    if (_filterSupervisorId != null) c++;
    if (_filterLevel != null) c++;
    if (_searchCtrl.text.isNotEmpty) c++;
    return c;
  }

  void _fitAllMarkers() {
    HapticFeedback.lightImpact();
    final subs = _getFilteredSubmissions();
    final points = subs
        .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
        .map((s) => LatLng((s['gps_lat'] as num?)?.toDouble() ?? 0, (s['gps_lng'] as num?)?.toDouble() ?? 0))
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
    _mapController.move(LatLng((minLat + maxLat) / 2, (minLng + maxLng) / 2),
        MapHelpers.calculateFitZoom(points));
  }

  // ─── Data helpers ────────────────────────────────────────────

  List<Map<String, dynamic>> _getFilteredSubmissions() {
    // ═══ P0-1: Memoize — was called 5x per build, each doing 25,000 filter ops
    // Now: compute once, cache, return cached on subsequent calls in same build cycle
    // ═══ PERFORMANCE: Use .select() for campaign to minimize rebuild scope ═══
    final campaign = ref.watch(campaignProvider.select((c) => c.value));
    final round = ref.watch(campaignRoundProvider);
    final allSubsAsync = ref.watch(submissionsProvider(SubmissionsFilter(
      campaignType: campaign,
      campaignRound: round,
      limit: 2000,
      lean: true,  // ═══ P0: Skip 'data' column — 5.5MB→0.86MB (84% reduction)
    )));
    final allSubs = allSubsAsync.valueOrNull ?? [];

    // Build signature: if filters + data length haven't changed, return cache
    final sig = '${_filterFormId ?? ''}|${_filterSupervisorId ?? ''}|'
        '${_filterLevel ?? ''}|${_searchCtrl.text}|${allSubs.length}';
    final dataHash = allSubs.length; // Quick hash — length is sufficient for change detection

    if (_cachedFilterSignature == sig &&
        _cachedDataHash == dataHash &&
        _cachedFilteredSubs != null) {
      return _cachedFilteredSubs!;
    }

    // Compute filtered results (only when something changed)
    final result = allSubs.where((s) {
      // Form filter
      if (_filterFormId != null && s['form_id'] != _filterFormId) return false;
      // Supervisor filter
      if (_filterSupervisorId != null &&
          s['submitted_by'] != _filterSupervisorId) return false;
      // Level filter (مركزي/محافظة/مديرية/ميداني)
      if (_filterLevel != null) {
        final role = (s['profiles']?['role'] ?? s['submitter_role'] ?? '').toString();
        final level = MapHelpers.levelLabel(role);
        if (level != _filterLevel) return false;
      }
      // Search
      if (_searchCtrl.text.isNotEmpty) {
        final q = _searchCtrl.text.toLowerCase();
        final name = (s['profiles']?['full_name'] ?? s['submitter_name'] ?? '')
            .toString()
            .toLowerCase();
        final gov =
            (s['governorates']?['name_ar'] ?? s['governorate_name'] ?? '')
                .toString()
                .toLowerCase();
        final form = (s['forms']?['title_ar'] ?? s['form_title'] ?? '')
            .toString()
            .toLowerCase();
        if (!name.contains(q) && !gov.contains(q) && !form.contains(q)) {
          return false;
        }
      }
      // RBAC
      if (!_canViewAllGovernorates) {
        final govId = s['governorate_id'] as String?;
        final distId = s['district_id'] as String?;
        final subBy = s['submitted_by'] as String?;
        if (_role == UserRole.governorate && govId != _userGovId) return false;
        if (_role == UserRole.district && distId != _userDistId) return false;
        if (_role == UserRole.data_entry && subBy != _userId) return false;
      }
      return true;
    }).toList();

    // Cache the result
    _cachedFilteredSubs = result;
    _cachedFilterSignature = sig;
    _cachedDataHash = dataHash;

    return result;
  }

  /// Invalidate cache — call when filters change externally
  void _invalidateFilterCache() {
    _cachedFilteredSubs = null;
    _cachedFilterSignature = null;
  }

  /// Build unique supervisor list from all submissions
  List<Map<String, String>> _getSupervisors(List<Map<String, dynamic>> subs) {
    final map = <String, String>{};
    for (final s in subs) {
      final id = s['submitted_by'] as String?;
      final name = s['profiles']?['full_name'] ?? s['submitter_name'];
      if (id != null && name != null) map[id] = name.toString();
    }
    return map.entries.map((e) => {'id': e.key, 'name': e.value}).toList()
      ..sort((a, b) => a['name']!.compareTo(b['name']!));
  }

  // ─── Build ───────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          _buildMap(),
          MapControls.buildHeaderOverlay(),
          _buildTopBarWithFilters(),
          if (_showStats) _buildStatsOverlay(),
          if (_selectedSubmission != null) _buildSelectedPanel(),
          if (_selectedCluster != null) _buildClusterPanel(),
          MapControls.buildFABs(
            fabAnimation: _fabAnimation,
            onFitAll: _fitAllMarkers,
            onMyLocation: () => _mapController.move(_yemenCenter, 6.0),
            onZoomIn: () {
              setState(
                  () => _currentZoom = (_currentZoom + 1).clamp(4.0, 18.0));
              _mapController.move(_mapController.camera.center, _currentZoom);
            },
            onZoomOut: () {
              setState(
                  () => _currentZoom = (_currentZoom - 1).clamp(4.0, 18.0));
              _mapController.move(_mapController.camera.center, _currentZoom);
            },
          ),
        ],
      ),
    );
  }

  // ─── Top Bar with Filter Toggle ──────────────────────────────

  Widget _buildTopBarWithFilters() {
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
                    child: const Icon(Icons.map_rounded,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('خريطة البيانات',
                            style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 20,
                                fontWeight: FontWeight.w700,
                                color: Colors.white)),
                        Text(
                          'عرض فردي — دبابيس الإرساليات',
                          style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  // Filter button with badge
                  GestureDetector(
                    onTap: () => setState(() => _showFilters = !_showFilters),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _activeFilterCount > 0
                            ? const Color(0xFF3B82F6).withValues(alpha: 0.3)
                            : Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          const Icon(Icons.filter_list_rounded,
                              color: Colors.white, size: 20),
                          if (_activeFilterCount > 0)
                            Positioned(
                              top: -4,
                              left: -4,
                              child: Container(
                                width: 16,
                                height: 16,
                                decoration: const BoxDecoration(
                                    color: Color(0xFFEF4444),
                                    shape: BoxShape.circle),
                                child: Center(
                                    child: Text('$_activeFilterCount',
                                        style: const TextStyle(
                                            fontSize: 9,
                                            color: Colors.white,
                                            fontWeight: FontWeight.w700))),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _iconBtn(Icons.refresh_rounded, onTap: _refresh),
                  const SizedBox(width: 8),
                  // ═══ Toggle color mode: level ↔ status ═══
                  GestureDetector(
                    onTap: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _colorMode = _colorMode == MapColorMode.level
                            ? MapColorMode.status
                            : MapColorMode.level;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: _colorMode == MapColorMode.level
                            ? const Color(0xFF3B82F6).withValues(alpha: 0.3)
                            : Colors.white.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _colorMode == MapColorMode.level
                                ? Icons.layers_rounded
                                : Icons.flag_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _colorMode == MapColorMode.level
                                ? 'المستوى'
                                : 'الحالة',
                            style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _iconBtn(
                      _showStats
                          ? Icons.info_rounded
                          : Icons.info_outline_rounded,
                      onTap: () => setState(() => _showStats = !_showStats)),
                ],
              ),
              const SizedBox(height: 12),
              // GPS accuracy badge
              if (_canViewFullCoords) ...[
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color:
                                const Color(0xFF10B981).withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.gps_fixed,
                              size: 12, color: Color(0xFF10B981)),
                          SizedBox(width: 4),
                          Text('إحداثيات كاملة',
                              style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF10B981))),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
              // ─── Expandable Filter Bar ────────────────────────
              if (_showFilters) ...[
                const SizedBox(height: 12),
                _buildFilterBar(),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ─── Filter Bar ──────────────────────────────────────────────

  Widget _buildFilterBar() {
    // ═══ FIX #2: Load all submissions for map filters ═══
    // ═══ FIX #3: Use ref.watch instead of ref.read so map updates on campaign/round change ═══
    // ═══ PERFORMANCE: Use .select() for campaign to minimize rebuild scope ═══
    final campaignValue = ref.watch(campaignProvider.select((c) => c.value));
    final round = ref.watch(campaignRoundProvider);
    final allSubs = ref
            .watch(submissionsProvider(SubmissionsFilter(
              campaignType: campaignValue,
              campaignRound: round,
              limit: 2000,
              lean: true,  // ═══ P0: Skip 'data' column — filter bar only needs metadata
            )))
            .valueOrNull ??
        [];
    final supervisors = _getSupervisors(allSubs);
    final forms = ref.read(formsProvider).valueOrNull ?? [];

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        children: [
          // Search
          TextField(
            controller: _searchCtrl,
            onChanged: (_) {
              // ═══ P0-2: Debounce search — was triggering setState on every keystroke
              // causing 25,000 filter ops per character. Now waits 300ms after typing stops.
              _searchDebounce?.cancel();
              _searchDebounce = Timer(const Duration(milliseconds: 300), () {
                _invalidateFilterCache();
                setState(() {});
              });
            },
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
            decoration: InputDecoration(
              hintText: 'بحث: اسم مشرف، محافظة، نموذج...',
              hintStyle: const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
              prefixIcon: const Icon(Icons.search_rounded,
                  size: 20, color: Color(0xFF9CA3AF)),
              suffixIcon: _searchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18),
                      onPressed: () {
                        _searchCtrl.clear();
                        _invalidateFilterCache();
                        setState(() {});
                      })
                  : null,
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none),
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          // Dropdowns row 1: نموذج + المستوى
          Row(
            children: [
              // Form filter
              Expanded(
                child: _filterDropdown(
                  value: _filterFormId,
                  hint: 'النموذج',
                  icon: Icons.description_rounded,
                  items: forms
                      .map((f) => DropdownMenuItem(
                            value: f['id'] as String? ?? '',
                            child: Text(f['title_ar'] as String? ?? '',
                                style: const TextStyle(
                                    fontFamily: 'Tajawal', fontSize: 12),
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() { _filterFormId = v; _invalidateFilterCache(); }),
                ),
              ),
              const SizedBox(width: 8),
              // Level filter (مركزي/محافظة/مديرية/ميداني)
              Expanded(
                child: _filterDropdown(
                  value: _filterLevel,
                  hint: 'المستوى',
                  icon: Icons.layers_rounded,
                  items: const [
                    DropdownMenuItem(
                        value: 'مركزي',
                        child: Text('مركزي',
                            style: TextStyle(
                                fontFamily: 'Tajawal', fontSize: 12))),
                    DropdownMenuItem(
                        value: 'محافظة',
                        child: Text('محافظة',
                            style: TextStyle(
                                fontFamily: 'Tajawal', fontSize: 12))),
                    DropdownMenuItem(
                        value: 'مديرية',
                        child: Text('مديرية',
                            style: TextStyle(
                                fontFamily: 'Tajawal', fontSize: 12))),
                    DropdownMenuItem(
                        value: 'ميداني',
                        child: Text('ميداني',
                            style: TextStyle(
                                fontFamily: 'Tajawal', fontSize: 12))),
                  ],
                  onChanged: (v) => setState(() { _filterLevel = v; _invalidateFilterCache(); }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Dropdowns row 2: المشرف
          Row(
            children: [
              // Supervisor filter
              Expanded(
                child: _filterDropdown(
                  value: _filterSupervisorId,
                  hint: 'المشرف',
                  icon: Icons.person_rounded,
                  items: supervisors
                      .map((s) => DropdownMenuItem(
                            value: s['id'],
                            child: Text(s['name']!,
                                style: const TextStyle(
                                    fontFamily: 'Tajawal', fontSize: 12),
                                overflow: TextOverflow.ellipsis),
                          ))
                      .toList(),
                  onChanged: (v) => setState(() { _filterSupervisorId = v; _invalidateFilterCache(); }),
                ),
              ),
              const SizedBox(width: 8),
              // Reset button
              if (_activeFilterCount > 0)
                GestureDetector(
                  onTap: _resetFilters,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.refresh_rounded,
                            size: 16, color: Color(0xFFEF4444)),
                        SizedBox(width: 4),
                        Text('مسح',
                            style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFEF4444))),
                      ],
                    ),
                  ),
                ),
              const Spacer(),
              // Active count
              Text(
                '${_getFilteredSubmissions().where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length} نقطة',
                style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: Color(0xFF9CA3AF)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _filterDropdown({
    required String? value,
    required String hint,
    required IconData icon,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: value != null
            ? Border.all(color: const Color(0xFF3B82F6).withValues(alpha: 0.3))
            : null,
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          hint: Row(
            children: [
              Icon(icon, size: 16, color: const Color(0xFF9CA3AF)),
              const SizedBox(width: 6),
              Text(hint,
                  style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: Color(0xFF9CA3AF))),
            ],
          ),
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              size: 18, color: Color(0xFF9CA3AF)),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, {VoidCallback? onTap}) {
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

  // ─── Stats Overlay ───────────────────────────────────────────

  Widget _buildStatsOverlay() {
    final subs = _getFilteredSubmissions();
    final withGps =
        subs.where((s) => s['gps_lat'] != null && s['gps_lng'] != null).length;

    // ═══ Show stats by admin level (مركزي/محافظة/مديرية) ═══
    final central = subs.where((s) {
      final role = (s['profiles']?['role'] ?? s['submitter_role'] ?? '').toString();
      return role == 'admin' || role == 'central';
    }).length;
    final gov = subs.where((s) {
      final role = (s['profiles']?['role'] ?? s['submitter_role'] ?? '').toString();
      return role == 'governorate';
    }).length;
    final dist = subs.where((s) {
      final role = (s['profiles']?['role'] ?? s['submitter_role'] ?? '').toString();
      return role == 'district';
    }).length;

    return Positioned(
      top: _showFilters ? 340 : 155,
      left: 16,
      right: 16,
      child: Row(
        children: [
          _statCard('مركزي', '$central', Icons.account_balance_rounded,
              const Color(0xFFEF4444)),
          const SizedBox(width: 8),
          _statCard('محافظة', '$gov', Icons.location_city_rounded,
              const Color(0xFF3B82F6)),
          const SizedBox(width: 8),
          _statCard('مديرية', '$dist', Icons.map_rounded,
              const Color(0xFF10B981)),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color color) {
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
                offset: const Offset(0, 3))
          ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: color)),
            Text(label,
                style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 9,
                    color: Color(0xFF9CA3AF)),
                maxLines: 1,
                overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
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
        // ═══ PROPOSAL 4: No setState on pan/zoom — just update the variable ═══
        // Previously: every pan/zoom triggered setState → full rebuild → 6× filter + 500 markers
        // Now: just update _currentZoom without rebuild. Markers don't depend on zoom.
        onPositionChanged: (pos, _) {
          _currentZoom = pos.zoom ?? _currentZoom;
        },
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.epi.supervisor',
        ),
        _buildIndividualLayer(),
      ],
    );
  }

  // ─── Aggregated Layer ────────────────────────────────────────

  Widget _buildAggregatedLayer() {
    final subs = _getFilteredSubmissions();

    final grouped = <String, List<Map<String, dynamic>>>{};
    final govMeta = <String, Map<String, dynamic>>{};

    for (final sub in subs) {
      final govId = sub['governorate_id'] as String?;
      if (govId == null) continue;
      grouped.putIfAbsent(govId, () => []).add(sub);
      if (!govMeta.containsKey(govId)) {
        govMeta[govId] = {
          'name':
              sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '',
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
        width: 56,
        height: 56,
        child: GestureDetector(
          onTap: () {
            HapticFeedback.lightImpact();
            setState(() {
              _selectedSubmission = null;
              _selectedCluster = {
                'name': meta['name'],
                'submissions': entry.value,
                'lat': lat,
                'lng': lng,
              };
            });
          },
          child: Container(
            decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2.5),
                boxShadow: [
                  BoxShadow(
                      color: color.withValues(alpha: 0.45),
                      blurRadius: 14,
                      spreadRadius: 2)
                ]),
            child: Center(
                child: Text('$count',
                    style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Colors.white))),
          ),
        ),
      ));
    }

    return MarkerLayer(markers: markers);
  }

  // ─── Individual Layer ────────────────────────────────────────

  Widget _buildIndividualLayer() {
    var subs = _getFilteredSubmissions();
    subs = subs
        .where((s) => s['gps_lat'] != null && s['gps_lng'] != null)
        .toList();

    // ═══ PERFORMANCE: Limit markers to prevent UI freeze ═══
    // flutter_map slows down with 1000+ markers
    const maxMarkers = 500;
    final bool isLimited = subs.length > maxMarkers;
    if (isLimited) {
      // Show most recent markers only
      subs.sort((a, b) => (b['created_at'] ?? '').toString().compareTo((a['created_at'] ?? '').toString()));
      subs = subs.sublist(0, maxMarkers);
    }

    final markers = subs.map((sub) {
      final lat = (sub['gps_lat'] as num).toDouble();
      final lng = (sub['gps_lng'] as num).toDouble();
      final status = sub['status'] as String? ?? 'draft';
      final role =
          (sub['profiles']?['role'] ?? sub['submitter_role'] ?? '').toString();
      // ═══ Color by mode: level (default), status, or role ═══
      final color = _colorMode == MapColorMode.level
          ? MapHelpers.levelColor(role)
          : _colorMode == MapColorMode.role
              ? MapHelpers.roleColor(role)
              : MapHelpers.statusColor(status);
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
              border:
                  Border.all(color: Colors.white, width: isSelected ? 2 : 1.5),
              boxShadow: [
                BoxShadow(
                    color: color.withValues(alpha: isSelected ? 0.5 : 0.3),
                    blurRadius: isSelected ? 10 : 4)
              ],
            ),
            child: isSelected
                ? const Icon(Icons.place, color: Colors.white, size: 14)
                : null,
          ),
        ),
      );
    }).toList();

    return MarkerLayer(markers: markers);
  }

  // ─── Selected Submission Panel ───────────────────────────────

  Widget _buildSelectedPanel() {
    final sub = _selectedSubmission!;
    final lat = (sub['gps_lat'] as num?)?.toDouble();
    final lng = (sub['gps_lng'] as num?)?.toDouble();
    final status = sub['status'] as String? ?? 'draft';
    final role =
        (sub['profiles']?['role'] ?? sub['submitter_role'] ?? '').toString();
    final govName =
        sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '';
    final distName = sub['districts']?['name_ar'] ?? sub['district_name'] ?? '';
    final formTitle = sub['forms']?['title_ar'] ?? sub['form_title'] ?? '';
    final supervisorName =
        sub['profiles']?['full_name'] ?? sub['submitter_name'] ?? '';
    final createdAt = sub['created_at'] as String? ?? '';
    final data = sub['data'] as Map<String, dynamic>? ?? {};

    return Positioned(
      bottom: 90,
      left: 16,
      right: 16,
      child: GestureDetector(
        onTap: () => _showSubmissionDetailSheet(sub),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 8))
              ]),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header row
              Row(
                children: [
                  Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                          color: _colorMode == MapColorMode.level
                              ? MapHelpers.levelColor(role)
                              : _colorMode == MapColorMode.role
                                  ? MapHelpers.roleColor(role)
                                  : MapHelpers.statusColor(status),
                          shape: BoxShape.circle)),
                  const SizedBox(width: 10),
                  Expanded(
                      child: Text(
                          formTitle.isNotEmpty
                              ? formTitle
                              : (govName.isNotEmpty ? govName : 'إرسالية'),
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w700))),
                  // Level/Status badge
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: (_colorMode == MapColorMode.level
                              ? MapHelpers.levelColor(role)
                              : _colorMode == MapColorMode.role
                                  ? MapHelpers.roleColor(role)
                                  : MapHelpers.statusColor(status))
                          .withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                        _colorMode == MapColorMode.level
                            ? MapHelpers.levelLabel(role)
                            : _colorMode == MapColorMode.role
                                ? MapHelpers.roleLabel(role)
                                : MapHelpers.statusLabel(status),
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _colorMode == MapColorMode.level
                                ? MapHelpers.levelColor(role)
                                : _colorMode == MapColorMode.role
                                    ? MapHelpers.roleColor(role)
                                    : MapHelpers.statusColor(status))),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                      onTap: () => setState(() => _selectedSubmission = null),
                      child: const Icon(Icons.close_rounded,
                          size: 18, color: Colors.grey)),
                ],
              ),
              const SizedBox(height: 8),
              // Supervisor
              if (supervisorName.isNotEmpty)
                _infoRow(Icons.person_rounded, 'المشرف: $supervisorName'),
              // Location
              if (govName.isNotEmpty)
                _infoRow(Icons.location_on_rounded,
                    distName.isNotEmpty ? '$govName — $distName' : govName),
              // GPS
              if (lat != null && lng != null)
                _infoRow(
                    Icons.gps_fixed_rounded,
                    _canViewFullCoords
                        ? '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}'
                        : '${lat.toStringAsFixed(2)}°, ${lng.toStringAsFixed(2)}°'),
              // Date
              if (createdAt.isNotEmpty)
                _infoRow(Icons.access_time_rounded,
                    MapHelpers.formatDate(createdAt)),
              // Data preview (first 2 fields)
              if (data.isNotEmpty) ...[
                const SizedBox(height: 8),
                ...data.entries.take(2).map((e) => Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Row(
                        children: [
                          Expanded(
                              child: Text(e.key,
                                  style: const TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 10,
                                      color: Color(0xFF9CA3AF)))),
                          Flexible(
                              child: Text('${e.value}',
                                  style: const TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600),
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.end)),
                        ],
                      ),
                    )),
              ],
              // Tap hint
              const SizedBox(height: 6),
              Center(
                child: Text('اضغط لعرض التفاصيل والانتقال للاستمارة',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: const Color(0xFF00897B).withValues(alpha: 0.7))),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(icon, size: 13, color: const Color(0xFF9CA3AF)),
          const SizedBox(width: 6),
          Expanded(
              child: Text(text,
                  style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: Color(0xFF64748B)),
                  overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  // ─── Submission Detail Bottom Sheet ──────────────────────────

  void _showSubmissionDetailSheet(Map<String, dynamic> sub) {
    final status = sub['status'] as String? ?? 'draft';
    final formTitle =
        sub['forms']?['title_ar'] ?? sub['form_title'] ?? 'إرسالية';
    final supervisorName =
        sub['profiles']?['full_name'] ?? sub['submitter_name'] ?? '';
    final govName =
        sub['governorates']?['name_ar'] ?? sub['governorate_name'] ?? '';
    final distName = sub['districts']?['name_ar'] ?? sub['district_name'] ?? '';
    final lat = (sub['gps_lat'] as num?)?.toDouble();
    final lng = (sub['gps_lng'] as num?)?.toDouble();
    final createdAt = sub['created_at'] as String? ?? '';
    final data = sub['data'] as Map<String, dynamic>? ?? {};
    final notes = sub['notes'] as String? ?? '';
    final reviewNotes = sub['review_notes'] as String? ?? '';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints:
            BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.75),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2)),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title + Status
                    Row(
                      children: [
                        Expanded(
                            child: Text(formTitle,
                                style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700))),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: MapHelpers.statusColor(status)
                                .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(MapHelpers.statusLabel(status),
                              style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: MapHelpers.statusColor(status))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Info grid
                    _detailRow(Icons.person_rounded, 'المشرف',
                        supervisorName.isNotEmpty ? supervisorName : '—'),
                    _detailRow(
                        Icons.location_on_rounded,
                        'المحافظة',
                        govName.isNotEmpty
                            ? (distName.isNotEmpty
                                ? '$govName — $distName'
                                : govName)
                            : '—'),
                    if (lat != null && lng != null)
                      _detailRow(
                          Icons.gps_fixed_rounded,
                          'الإحداثيات',
                          _canViewFullCoords
                              ? '${lat.toStringAsFixed(6)}, ${lng.toStringAsFixed(6)}'
                              : '${lat.toStringAsFixed(2)}°, ${lng.toStringAsFixed(2)}°'),
                    if (createdAt.isNotEmpty)
                      _detailRow(Icons.access_time_rounded, 'التاريخ',
                          MapHelpers.formatDate(createdAt)),

                    // Form data
                    if (data.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Text('بيانات الاستمارة',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1A2332))),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Column(
                          children: data.entries
                              .map((e) => Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        SizedBox(
                                            width: 100,
                                            child: Text(e.key,
                                                style: const TextStyle(
                                                    fontFamily: 'Tajawal',
                                                    fontSize: 11,
                                                    color: Color(0xFF9CA3AF)))),
                                        Expanded(
                                            child: Text('${e.value}',
                                                style: const TextStyle(
                                                    fontFamily: 'Tajawal',
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.w600))),
                                      ],
                                    ),
                                  ))
                              .toList(),
                        ),
                      ),
                    ],

                    // Notes
                    if (notes.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Text('ملاحظات',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(notes,
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 12)),
                    ],

                    // Review notes
                    if (reviewNotes.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      const Text('ملاحظات المراجعة',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(reviewNotes,
                          style: const TextStyle(
                              fontFamily: 'Tajawal', fontSize: 12)),
                    ],

                    const SizedBox(height: 20),

                    // Go to form button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(ctx);
                          context.go('/submission/${sub['id']}');
                        },
                        icon: const Icon(Icons.open_in_new_rounded, size: 18),
                        label: const Text('فتح الاستمارة كاملة',
                            style: TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.w700)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00897B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF00897B)),
          const SizedBox(width: 8),
          SizedBox(
              width: 80,
              child: Text(label,
                  style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: Color(0xFF9CA3AF)))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  Widget _chip(IconData icon, String label, {Color? color}) {
    final c = color ?? const Color(0xFF64748B);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
          color: c.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 12, color: c),
        const SizedBox(width: 4),
        Text(label,
            style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: c))
      ]),
    );
  }

  // ─── Cluster Panel ───────────────────────────────────────────

  Widget _buildClusterPanel() {
    final cluster = _selectedCluster!;
    final name = cluster['name'] as String? ?? '';
    final subs = cluster['submissions'] as List<Map<String, dynamic>>;
    final byStatus = <String, int>{};
    final supervisors = <String>{};
    for (final s in subs) {
      final st = s['status'] as String? ?? 'draft';
      byStatus[st] = (byStatus[st] ?? 0) + 1;
      final supName = s['profiles']?['full_name'] ?? s['submitter_name'];
      if (supName != null) supervisors.add(supName.toString());
    }

    return Positioned(
      bottom: 90,
      left: 16,
      right: 16,
      child: GestureDetector(
        onTap: () => _showClusterDetailSheet(cluster),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 8))
              ]),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [
                          MapHelpers.clusterColor(subs.length),
                          MapHelpers.clusterColor(subs.length)
                              .withValues(alpha: 0.7)
                        ]),
                        borderRadius: BorderRadius.circular(14)),
                    child: Center(
                        child: Text('${subs.length}',
                            style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.white))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                      child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name.isNotEmpty ? name : 'إرساليات',
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 18,
                              fontWeight: FontWeight.w700)),
                      if (supervisors.isNotEmpty)
                        Text('${supervisors.length} مشرف',
                            style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 11,
                                color: Color(0xFF9CA3AF))),
                    ],
                  )),
                  GestureDetector(
                      onTap: () => setState(() => _selectedCluster = null),
                      child: const Icon(Icons.close_rounded,
                          size: 18, color: Colors.grey)),
                ],
              ),
              const SizedBox(height: 16),
              ...byStatus.entries.map((e) {
                final pct = subs.isEmpty ? 0.0 : e.value / subs.length;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      SizedBox(
                          width: 60,
                          child: Text(MapHelpers.statusLabel(e.key),
                              style: const TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 12,
                                  color: Color(0xFF64748B)))),
                      Expanded(
                          child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                  value: pct,
                                  backgroundColor: Colors.grey.shade100,
                                  valueColor: AlwaysStoppedAnimation(
                                      MapHelpers.statusColor(e.key)),
                                  minHeight: 8))),
                      const SizedBox(width: 8),
                      SizedBox(
                          width: 30,
                          child: Text('${e.value}',
                              textAlign: TextAlign.end,
                              style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: MapHelpers.statusColor(e.key)))),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 8),
              // Tap hint
              Center(
                child: Text('اضغط لعرض الإرساليات والمشرفين',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: const Color(0xFF00897B).withValues(alpha: 0.7))),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ─── Cluster Detail Bottom Sheet ─────────────────────────────

  void _showClusterDetailSheet(Map<String, dynamic> cluster) {
    final name = cluster['name'] as String? ?? '';
    final subs = cluster['submissions'] as List<Map<String, dynamic>>;

    // Group by supervisor
    final bySupervisor = <String, List<Map<String, dynamic>>>{};
    for (final s in subs) {
      final supName =
          s['profiles']?['full_name'] ?? s['submitter_name'] ?? 'غير معروف';
      bySupervisor.putIfAbsent(supName, () => []).add(s);
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints:
            BoxConstraints(maxHeight: MediaQuery.of(ctx).size.height * 0.75),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  Expanded(
                      child: Text('إرساليات ${name.isNotEmpty ? name : ''}',
                          style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 18,
                              fontWeight: FontWeight.w700))),
                  Text('${subs.length} إرسالية',
                      style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                          color: Color(0xFF9CA3AF))),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  // By supervisor section
                  const Text('حسب المشرف',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A2332))),
                  const SizedBox(height: 8),
                  ...bySupervisor.entries.map((e) => Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.person_rounded,
                                size: 18, color: Color(0xFF00897B)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(e.key,
                                      style: const TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600)),
                                  Text('${e.value.length} إرسالية',
                                      style: const TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 11,
                                          color: Color(0xFF9CA3AF))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 12),

                  // Individual submissions
                  const Text('الإرساليات',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A2332))),
                  const SizedBox(height: 8),
                  ...subs.map((s) {
                    final status = s['status'] as String? ?? 'draft';
                    final formTitle =
                        s['forms']?['title_ar'] ?? s['form_title'] ?? '';
                    final supName = s['profiles']?['full_name'] ??
                        s['submitter_name'] ??
                        '';
                    final date = s['created_at'] as String? ?? '';

                    return GestureDetector(
                      onTap: () {
                        Navigator.pop(ctx);
                        context.go('/submission/${s['id']}');
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                  color: MapHelpers.statusColor(status),
                                  shape: BoxShape.circle),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                      formTitle.isNotEmpty
                                          ? formTitle
                                          : 'إرسالية',
                                      style: const TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600)),
                                  Text(
                                      '$supName${date.isNotEmpty ? ' — ${MapHelpers.formatDate(date)}' : ''}',
                                      style: const TextStyle(
                                          fontFamily: 'Tajawal',
                                          fontSize: 10,
                                          color: Color(0xFF9CA3AF))),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: MapHelpers.statusColor(status)
                                    .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(MapHelpers.statusLabel(status),
                                  style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 9,
                                      fontWeight: FontWeight.w600,
                                      color: MapHelpers.statusColor(status))),
                            ),
                            const SizedBox(width: 6),
                            const Icon(Icons.arrow_forward_ios_rounded,
                                size: 14, color: Color(0xFFCBD5E1)),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
