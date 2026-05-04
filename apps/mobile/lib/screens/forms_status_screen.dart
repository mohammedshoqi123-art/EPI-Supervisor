import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import '../providers/app_providers.dart';

/// Comprehensive forms status dashboard showing:
/// - Stats cards (drafts, submitted, synced, unsynced)
/// - Draft list with continue/edit actions
/// - Pending sync queue
/// - Recently submitted forms
class FormsStatusScreen extends ConsumerStatefulWidget {
  const FormsStatusScreen({super.key});

  @override
  ConsumerState<FormsStatusScreen> createState() => _FormsStatusScreenState();
}

class _FormsStatusScreenState extends ConsumerState<FormsStatusScreen> {
  StreamSubscription? _syncSub;
  int _refreshKey = 0;

  // ═══ FIX #4: Search & filter state ═══
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _filterFormId;
  String? _filterGovernorate;
  String? _filterDistrict;
  String? _filterSupervisorRole;
  String? _filterSupervisorName;
  bool _showFilters = false;

  bool get _hasActiveFilters =>
      _filterFormId != null ||
      _filterGovernorate != null ||
      _filterDistrict != null ||
      _filterSupervisorRole != null ||
      _filterSupervisorName != null;

  int get _activeFilterCount {
    int c = 0;
    if (_filterFormId != null) c++;
    if (_filterGovernorate != null) c++;
    if (_filterDistrict != null) c++;
    if (_filterSupervisorRole != null) c++;
    if (_filterSupervisorName != null) c++;
    return c;
  }

  @override
  void initState() {
    super.initState();
    _listenForSyncCompletion();

    // ═══ FIX #1: Auto-refresh when internet returns ═══
    ref.listen(connectivityProvider, (prev, next) {
      final wasOffline = prev?.valueOrNull == false;
      final isNowOnline = next.valueOrNull == true;
      if (wasOffline && isNowOnline && mounted) {
        ref.invalidate(submissionsProvider(
          SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
        ));
        ref.invalidate(formsProvider);
        ref.invalidate(dashboardAnalyticsProvider(
          AnalyticsFilter(campaignType: ref.read(campaignProvider).value),
        ));
        setState(() => _refreshKey++);
      }
    });
  }

  /// Auto-refresh stats when sync completes — so submitted forms appear immediately.
  void _listenForSyncCompletion() {
    ref.read(syncServiceProvider.future).then((service) {
      _syncSub = service.syncState.listen((state) {
        // When sync finishes (isSyncing goes false after a sync), refresh everything
        if (!state.isSyncing && mounted) {
          // Invalidate cached providers so fresh data is fetched
          ref.invalidate(submissionsProvider);
          ref.invalidate(formsProvider);
          setState(() => _refreshKey++);
        }
      });
    }).catchError((_) {});
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: EpiAppBar(
        title: 'حالة الاستمارات',
        showBackButton: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(
                submissionsProvider(
                  SubmissionsFilter(
                    campaignType: ref.read(campaignProvider).value,
                  ),
                ),
              );
              ref.invalidate(formsProvider);
              setState(() {}); // Force stats rebuild
            },
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats summary cards
          _buildStatsSection(),

          // ═══ Search bar + Filter toggle ═══
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: EpiSearchBar(
                    controller: _searchController,
                    hint: 'بحث في الاستمارات...',
                    onChanged: (query) {
                      setState(() {
                        _searchQuery = query.toLowerCase();
                        _refreshKey++;
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () =>
                      setState(() => _showFilters = !_showFilters),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: _hasActiveFilters
                          ? AppTheme.primaryColor
                              .withValues(alpha: 0.15)
                          : AppTheme.backgroundLight,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _hasActiveFilters
                            ? AppTheme.primaryColor
                            : Colors.grey.shade300,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.tune_rounded,
                          size: 18,
                          color: _hasActiveFilters
                              ? AppTheme.primaryColor
                              : AppTheme.textSecondary,
                        ),
                        if (_activeFilterCount > 0) ...[
                          const SizedBox(width: 4),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$_activeFilterCount',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ═══ Advanced filter panel ═══
          if (_showFilters) _buildAdvancedFilter(),

          // ═══ Submissions list (direct — no tabs) ═══
          Expanded(
            child: _SubmittedTab(
              searchQuery: _searchQuery,
              filterFormId: _filterFormId,
              filterGovernorate: _filterGovernorate,
              filterDistrict: _filterDistrict,
              filterSupervisorRole: _filterSupervisorRole,
              filterSupervisorName: _filterSupervisorName,
            ),
          ),
        ],
      ),
    );
  }

  // ═══ FIX #4: Advanced filter panel ═══
  Widget _buildAdvancedFilter() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with clear all
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'فلاتر متقدمة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              if (_hasActiveFilters)
                GestureDetector(
                  onTap: _clearAllFilters,
                  child: const Text(
                    'مسح الكل',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: AppTheme.errorColor,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Form filter
          _buildFormDropdown(),
          const SizedBox(height: 10),

          // Governorate filter
          _buildGovernorateDropdown(),
          const SizedBox(height: 10),

          // District filter
          _buildDistrictDropdown(),
          const SizedBox(height: 10),

          // Supervisor role filter
          _buildSupervisorRoleDropdown(),
          const SizedBox(height: 10),

          // Supervisor name search
          _buildSupervisorNameSearch(),
        ],
      ),
    );
  }

  Widget _buildFormDropdown() {
    final formsAsync = ref.watch(formsProvider);
    return formsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (forms) {
        return _filterChip(
          label: 'النموذج',
          value: _filterFormId != null
              ? forms
                  .firstWhere((f) => f['id'] == _filterFormId,
                      orElse: () => {'title_ar': 'كل النماذج'})
                  .values
                  .first
              : null,
          onTap: () => _showFormPicker(forms),
          onClear: _filterFormId != null
              ? () => setState(() {
                    _filterFormId = null;
                    _refreshKey++;
                  })
              : null,
        );
      },
    );
  }

  Widget _buildGovernorateDropdown() {
    final govsAsync = ref.watch(governoratesProvider);
    return govsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (govs) {
        return _filterChip(
          label: 'المحافظة',
          value: _filterGovernorate,
          onTap: () => _showGovPicker(govs),
          onClear: _filterGovernorate != null
              ? () => setState(() {
                    _filterGovernorate = null;
                    _filterDistrict = null;
                    _refreshKey++;
                  })
              : null,
        );
      },
    );
  }

  Widget _buildDistrictDropdown() {
    final districtsAsync = ref.watch(districtsProvider(_filterGovernorate));
    return districtsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (districts) {
        return _filterChip(
          label: 'المديرية',
          value: _filterDistrict,
          onTap: () => _showDistrictPicker(districts),
          onClear: _filterDistrict != null
              ? () => setState(() {
                    _filterDistrict = null;
                    _refreshKey++;
                  })
              : null,
        );
      },
    );
  }

  Widget _buildSupervisorRoleDropdown() {
    const roles = [
      'admin',
      'central',
      'governorate',
      'district',
      'data_entry',
    ];
    return _filterChip(
      label: 'صفة المشرف',
      value: _filterSupervisorRole,
      onTap: () => _showRolePicker(roles),
      onClear: _filterSupervisorRole != null
          ? () => setState(() {
                _filterSupervisorRole = null;
                _refreshKey++;
              })
          : null,
    );
  }

  Widget _buildSupervisorNameSearch() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppTheme.backgroundLight,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.person_search,
              size: 18, color: AppTheme.textSecondary),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'اسم المشرف...',
                hintStyle:
                    TextStyle(fontFamily: 'Tajawal', fontSize: 13),
                border: InputBorder.none,
                isDense: true,
                contentPadding: EdgeInsets.zero,
              ),
              style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
              onChanged: (value) {
                setState(() {
                  _filterSupervisorName =
                      value.isEmpty ? null : value.toLowerCase();
                  _refreshKey++;
                });
              },
            ),
          ),
          if (_filterSupervisorName != null)
            GestureDetector(
              onTap: () => setState(() {
                _filterSupervisorName = null;
                _refreshKey++;
              }),
              child: const Icon(Icons.close,
                  size: 16, color: AppTheme.errorColor),
            ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    String? value,
    required VoidCallback onTap,
    VoidCallback? onClear,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: value != null
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: value != null
                ? AppTheme.primaryColor.withValues(alpha: 0.3)
                : Colors.grey.shade300,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: AppTheme.textHint,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value ?? 'الكل',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      fontWeight:
                          value != null ? FontWeight.w600 : FontWeight.normal,
                      color: value != null
                          ? AppTheme.primaryColor
                          : AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (onClear != null)
              GestureDetector(
                onTap: onClear,
                child: const Icon(Icons.close,
                    size: 16, color: AppTheme.errorColor),
              )
            else
              const Icon(Icons.arrow_drop_down,
                  color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }

  void _clearAllFilters() {
    setState(() {
      _filterFormId = null;
      _filterGovernorate = null;
      _filterDistrict = null;
      _filterSupervisorRole = null;
      _filterSupervisorName = null;
      _searchController.clear();
      _searchQuery = '';
      _refreshKey++;
    });
  }

  void _showFormPicker(List<Map<String, dynamic>> forms) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PickerSheet(
        title: 'اختر النموذج',
        items: [
          const _PickerItem(id: null, label: 'الكل'),
          ...forms.map(
              (f) => _PickerItem(id: f['id'], label: f['title_ar'] ?? 'نموذج')),
        ],
        selectedId: _filterFormId,
        onSelected: (id) {
          setState(() {
            _filterFormId = id;
            _refreshKey++;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showGovPicker(List<Map<String, dynamic>> govs) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PickerSheet(
        title: 'اختر المحافظة',
        items: [
          const _PickerItem(id: null, label: 'الكل'),
          ...govs.map((g) =>
              _PickerItem(id: g['id'], label: g['name_ar'] ?? 'محافظة')),
        ],
        selectedId: _filterGovernorate,
        onSelected: (id) {
          setState(() {
            _filterGovernorate = id;
            _filterDistrict = null; // Reset district when gov changes
            _refreshKey++;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showDistrictPicker(List<Map<String, dynamic>> districts) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PickerSheet(
        title: 'اختر المديرية',
        items: [
          const _PickerItem(id: null, label: 'الكل'),
          ...districts.map((d) =>
              _PickerItem(id: d['id'], label: d['name_ar'] ?? 'مديرية')),
        ],
        selectedId: _filterDistrict,
        onSelected: (id) {
          setState(() {
            _filterDistrict = id;
            _refreshKey++;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  void _showRolePicker(List<String> roles) {
    final roleNames = {
      'admin': 'مدير النظام',
      'central': 'مركزي',
      'governorate': 'محافظة',
      'district': 'مديرية',
      'data_entry': 'إدخال بيانات',
    };
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _PickerSheet(
        title: 'اختر الصفة',
        items: [
          const _PickerItem(id: null, label: 'الكل'),
          ...roles.map(
              (r) => _PickerItem(id: r, label: roleNames[r] ?? r)),
        ],
        selectedId: _filterSupervisorRole,
        onSelected: (id) {
          setState(() {
            _filterSupervisorRole = id;
            _refreshKey++;
          });
          Navigator.pop(context);
        },
      ),
    );
  }

  // ═══ FIX #4: Form filter dropdown (old — replaced by advanced) ═══
  Widget _buildFormFilter() {
    final formsAsync = ref.watch(formsProvider);
    return formsAsync.when(
      loading: () => const SizedBox.shrink(),
      error: (_, __) => const SizedBox.shrink(),
      data: (forms) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              isExpanded: true,
              value: _filterFormId,
              hint: const Text(
                'اختر النموذج...',
                style: TextStyle(fontFamily: 'Tajawal', fontSize: 13),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('الكل',
                      style: TextStyle(fontFamily: 'Tajawal')),
                ),
                ...forms.map((f) => DropdownMenuItem<String>(
                      value: f['id'] as String,
                      child: Text(
                        f['title_ar'] ?? 'نموذج',
                        style: const TextStyle(
                            fontFamily: 'Tajawal', fontSize: 13),
                      ),
                    )),
              ],
              onChanged: (value) {
                setState(() {
                  _filterFormId = value;
                  _refreshKey++;
                });
              },
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatsSection() {
    return FutureBuilder<Map<String, int>>(
      key: ValueKey('stats_$_refreshKey'),
      future: _loadStats(),
      builder: (context, snapshot) {
        final stats =
            snapshot.data ?? {'drafts': 0, 'pending': 0, 'submitted': 0};
        return Container(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'المسودات',
                  count: stats['drafts']!,
                  icon: Icons.edit_note,
                  color: AppTheme.warningColor,
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFB8C00), Color(0xFFF57C00)],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  title: 'قيد المزامنة',
                  count: stats['pending']!,
                  icon: Icons.sync,
                  color: AppTheme.infoColor,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _StatCard(
                  title: 'المرسلة',
                  count: stats['submitted']!,
                  icon: Icons.check_circle,
                  color: AppTheme.successColor,
                  gradient: const LinearGradient(
                    colors: [Color(0xFF43A047), Color(0xFF2E7D32)],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// FIX: Use analytics API (same source as dashboard) for submitted count.
  /// Local cache for drafts/pending, server for submitted — matches dashboard.
  Future<Map<String, int>> _loadStats() async {
    int drafts = 0, pending = 0, submitted = 0;
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
            const Duration(seconds: 5),
            onTimeout: () => throw Exception('timeout'),
          );
      pending = offline.pendingCount;

      // Drafts from local storage
      final draftIds = offline.getDraftFormIds();
      drafts = draftIds.length;

      // Submitted count from analytics (same source as dashboard)
      try {
        final campaign = ref.read(campaignProvider);
        final analytics = await ref
            .read(
              dashboardAnalyticsProvider(
                AnalyticsFilter(campaignType: campaign.value),
              ).future,
            )
            .timeout(
              const Duration(seconds: 5),
              onTimeout: () => throw Exception('timeout'),
            );
        final subs = analytics['submissions'] as Map<String, dynamic>? ?? {};
        final byStatus = subs['byStatus'] as Map<String, dynamic>? ?? {};
        submitted = (byStatus['submitted'] as int? ?? 0) +
            (byStatus['reviewed'] as int? ?? 0) +
            (byStatus['approved'] as int? ?? 0) +
            (byStatus['rejected'] as int? ?? 0);
      } catch (_) {
        // Fallback: try local cache
        final cache = await ref.read(offlineDataCacheProvider.future).timeout(
              const Duration(seconds: 3),
              onTimeout: () => throw Exception('timeout'),
            );
        final campaign = ref.read(campaignProvider);
        final allFilter = SubmissionsFilter(
          campaignType: campaign.value,
          limit: 100,
          offset: 0,
        );
        final cachedSubs = cache.getCachedDataList(allFilter.cacheKey) ??
            cache.getCachedDataList('submissions');
        if (cachedSubs != null) {
          submitted = cachedSubs
              .where(
                (s) =>
                    s['status'] == 'submitted' ||
                    s['status'] == 'reviewed' ||
                    s['status'] == 'approved' ||
                    s['status'] == 'rejected',
              )
              .length;
        }
      }
    } catch (e) {
      debugPrint('[FormsStatusScreen] Stats load error: $e');
    }

    return {'drafts': drafts, 'pending': pending, 'submitted': submitted};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════════════════

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;

  const _StatCard({
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 22),
          const SizedBox(height: 8),
          Text(
            '$count',
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 22,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 10,
              color: Colors.white.withValues(alpha: 0.9),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMISSIONS LIST
// ═══════════════════════════════════════════════════════════════════════════

class _SubmittedTab extends ConsumerWidget {
  final String searchQuery;
  final String? filterFormId;
  final String? filterGovernorate;
  final String? filterDistrict;
  final String? filterSupervisorRole;
  final String? filterSupervisorName;

  const _SubmittedTab({
    this.searchQuery = '',
    this.filterFormId,
    this.filterGovernorate,
    this.filterDistrict,
    this.filterSupervisorRole,
    this.filterSupervisorName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final submissions = ref.watch(
      submissionsProvider(
        SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
      ),
    );

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(
        submissionsProvider(
          SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
        ),
      ),
      child: submissions.when(
        loading: () => const EpiLoading.shimmer(),
        error: (e, _) => EpiErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(
            submissionsProvider(
              SubmissionsFilter(campaignType: ref.read(campaignProvider).value),
            ),
          ),
        ),
        data: (data) {
          final submitted = data
              .where(
                (s) =>
                    s['status'] == 'submitted' ||
                    s['status'] == 'reviewed' ||
                    s['status'] == 'approved' ||
                    s['status'] == 'rejected',
              )
              .toList();

          // ═══ FIX #4: Apply all filters ═══
          var filtered = submitted;

          // Filter by form ID
          if (filterFormId != null) {
            filtered =
                filtered.where((s) => s['form_id'] == filterFormId).toList();
          }

          // Filter by governorate
          if (filterGovernorate != null) {
            filtered = filtered
                .where((s) => s['governorate_id'] == filterGovernorate)
                .toList();
          }

          // Filter by district
          if (filterDistrict != null) {
            filtered = filtered
                .where((s) => s['district_id'] == filterDistrict)
                .toList();
          }

          // Filter by supervisor role
          if (filterSupervisorRole != null) {
            filtered = filtered.where((s) {
              final role =
                  (s['profiles']?['role'] ?? '').toString().toLowerCase();
              return role == filterSupervisorRole;
            }).toList();
          }

          // Filter by supervisor name
          if (filterSupervisorName != null && filterSupervisorName!.isNotEmpty) {
            filtered = filtered.where((s) {
              final name =
                  (s['profiles']?['full_name'] ?? '').toString().toLowerCase();
              return name.contains(filterSupervisorName!);
            }).toList();
          }

          // Filter by search query (title + userName)
          if (searchQuery.isNotEmpty) {
            filtered = filtered.where((s) {
              final title =
                  (s['forms']?['title_ar'] ?? '').toString().toLowerCase();
              final userName =
                  (s['profiles']?['full_name'] ?? '').toString().toLowerCase();
              return title.contains(searchQuery) ||
                  userName.contains(searchQuery);
            }).toList();
          }

          if (filtered.isEmpty) {
            return ListView(
              children: const [
                SizedBox(height: 120),
                EpiEmptyState(
                  icon: Icons.send,
                  title: 'لا توجد إرساليات',
                  subtitle: 'الاستمارات المُرسلة ستظهر هنا',
                ),
              ],
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            itemBuilder: (context, index) {
              final sub = filtered[index];
              return _SubmittedTile(
                title: sub['forms']?['title_ar'] ?? 'نموذج',
                status: sub['status'] ?? 'submitted',
                date: sub['submitted_at'] ?? sub['created_at'],
                userName: sub['profiles']?['full_name'],
                isOffline: sub['is_offline'] == true,
                onTap: () =>
                    context.go('/forms/status/submission/${sub['id']}'),
              );
            },
          );
        },
      ),
    );
  }
}

// WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

class _SubmittedTile extends StatelessWidget {
  final String title;
  final String status;
  final String? date;
  final String? userName;
  final bool isOffline;
  final VoidCallback onTap;

  const _SubmittedTile({
    required this.title,
    required this.status,
    this.date,
    this.userName,
    this.isOffline = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
        border: Border.all(
          color: AppTheme.statusColor(status).withValues(alpha: 0.2),
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppTheme.statusColor(status).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  _statusIcon(status),
                  color: AppTheme.statusColor(status),
                  size: 24,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        if (isOffline)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.orange.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.wifi_off,
                                  size: 10,
                                  color: Colors.orange,
                                ),
                                SizedBox(width: 3),
                                Text(
                                  'أوفلاين',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 9,
                                    color: Colors.orange,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        EpiStatusChip(status: status, small: true),
                        if (userName != null) ...[
                          const SizedBox(width: 8),
                          Flexible(
                            child: Text(
                              userName!,
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 11,
                                color: AppTheme.textSecondary,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (date != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        _formatDate(date!),
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 10,
                          color: AppTheme.textHint,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(
                Icons.arrow_forward_ios,
                size: 14,
                color: AppTheme.textHint,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'submitted':
        return Icons.send;
      case 'reviewed':
        return Icons.rate_review;
      case 'draft':
        return Icons.edit_note;
      default:
        return Icons.description;
    }
  }

  String _formatDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year} - ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PICKER SHEET — Reusable bottom sheet for filter selection
// ═══════════════════════════════════════════════════════════════════════════

class _PickerItem {
  final String? id;
  final String label;

  const _PickerItem({required this.id, required this.label});
}

class _PickerSheet extends StatelessWidget {
  final String title;
  final List<_PickerItem> items;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  const _PickerSheet({
    required this.title,
    required this.items,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final isSelected = item.id == selectedId;
                return ListTile(
                  title: Text(
                    item.label,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                      fontWeight:
                          isSelected ? FontWeight.w700 : FontWeight.normal,
                      color: isSelected
                          ? AppTheme.primaryColor
                          : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: isSelected
                      ? const Icon(Icons.check_circle,
                          color: AppTheme.primaryColor)
                      : null,
                  onTap: () => onSelected(item.id),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
