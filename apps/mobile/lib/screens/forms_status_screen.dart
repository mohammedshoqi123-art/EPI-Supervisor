import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../router/app_router.dart';
import 'forms_status_widgets.dart';

/// ═══ Forms Status Dashboard ═══
/// Shows 3 tabs: المسودات (Drafts) | قيد المزامنة (Pending Sync) | المرسلة (Submitted)
/// Each tab has page-based pagination (20 per page) with next/prev navigation.
class FormsStatusScreen extends ConsumerStatefulWidget {
  const FormsStatusScreen({super.key});

  @override
  ConsumerState<FormsStatusScreen> createState() => _FormsStatusScreenState();
}

class _FormsStatusScreenState extends ConsumerState<FormsStatusScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  StreamSubscription? _syncSub;
  int _refreshKey = 0;

  // Search & filter state
  final _searchController = TextEditingController();
  String _searchQuery = '';
  String? _filterFormId;
  String? _filterGovernorate;
  String? _filterDistrict;
  String? _filterSupervisorRole;
  String? _filterSupervisorName;
  bool _showFilters = false;

  // ═══ Sort state ═══
  String _sortBy =
      'date_desc'; // date_desc, date_asc, name_asc, name_desc, status

  // ═══ Pagination state per tab ═══
  static const int _pageSize = 20;
  // Drafts tab
  List<Map<String, dynamic>> _draftItems = [];
  int _draftPage = 0;
  bool _draftLoading = false;
  int _draftTotal = 0;
  // Pending sync tab
  List<Map<String, dynamic>> _pendingItems = [];
  int _pendingPage = 0;
  bool _pendingLoading = false;
  int _pendingTotal = 0;
  // Submitted tab
  List<Map<String, dynamic>> _submittedItems = [];
  int _submittedPage = 0;
  bool _submittedLoading = false;
  int _submittedTotal = 0;

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
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _listenForSyncCompletion();

    // ═══ NO auto-refresh on connectivity — user presses sync button ═══

    // Load initial data for the first tab
    _loadDraftsPage(0);
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) return;
    HapticFeedback.selectionClick();
    // Load data for the new tab if empty
    switch (_tabController.index) {
      case 0:
        if (_draftItems.isEmpty) _loadDraftsPage(0);
        break;
      case 1:
        if (_pendingItems.isEmpty) _loadPendingPage(0);
        break;
      case 2:
        if (_submittedItems.isEmpty) _loadSubmittedPage(0);
        break;
    }
  }

  void _listenForSyncCompletion() {
    ref.read(syncServiceProvider.future).then((service) {
      _syncSub = service.syncState.listen((state) {
        if (!state.isSyncing && mounted) {
          _refreshAll();
        }
      });
    }).catchError((_) {});
  }

  void _refreshAll() {
    ref.invalidate(formsProvider);
    ref.invalidate(formStatsProvider);
    setState(() {
      _refreshKey++;
      _draftItems.clear();
      _pendingItems.clear();
      _submittedItems.clear();
      _draftPage = 0;
      _pendingPage = 0;
      _submittedPage = 0;
    });
    // Reload current tab
    switch (_tabController.index) {
      case 0:
        _loadDraftsPage(0);
        break;
      case 1:
        _loadPendingPage(0);
        break;
      case 2:
        _loadSubmittedPage(0);
        break;
    }
  }

  @override
  void dispose() {
    _syncSub?.cancel();
    _searchDebounce?.cancel();
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA LOADING — Drafts (from local Hive storage)
  // ═══════════════════════════════════════════════════════════════

  Future<void> _loadDraftsPage(int page) async {
    setState(() => _draftLoading = true);
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
            const Duration(seconds: 5),
            onTimeout: () => throw Exception('timeout'),
          );
      final allDrafts = offline.getAllDrafts();

      // Enrich drafts with form titles from forms provider
      List<Map<String, dynamic>> forms = [];
      try {
        forms = await ref.read(formsProvider.future);
      } catch (_) {}

      final enrichedDrafts = allDrafts.map((draft) {
        final formId = draft['form_id'] ?? '';
        final form = forms.firstWhere(
          (f) => f['id'] == formId,
          orElse: () => {'title_ar': 'مسودة'},
        );
        return {
          ...draft,
          'form_title': form['title_ar'] ?? 'مسودة',
          'formId': formId,
        };
      }).toList();

      // Apply filters
      var filtered = _applyFilters(enrichedDrafts);
      _draftTotal = filtered.length;

      // Apply sorting
      filtered = _applySorting(filtered);

      // Paginate
      final start = page * _pageSize;
      final end = (start + _pageSize).clamp(0, filtered.length);
      final pageItems = start < filtered.length
          ? filtered.sublist(start, end).cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];

      setState(() {
        _draftItems = pageItems;
        _draftPage = page;
        _draftLoading = false;
      });
    } catch (e) {
      setState(() => _draftLoading = false);
      debugPrint('[FormsStatusScreen] Drafts load error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA LOADING — Pending Sync (from offline queue)
  // ═══════════════════════════════════════════════════════════════

  Future<void> _loadPendingPage(int page) async {
    setState(() => _pendingLoading = true);
    try {
      final offline = await ref.read(offlineManagerProvider.future).timeout(
            const Duration(seconds: 5),
            onTimeout: () => throw Exception('timeout'),
          );
      final allPending = await offline.getPendingItems();

      // Apply filters
      var filtered = _applyFilters(allPending);
      _pendingTotal = filtered.length;

      // Apply sorting
      filtered = _applySorting(filtered);

      // Paginate
      final start = page * _pageSize;
      final end = (start + _pageSize).clamp(0, filtered.length);
      final pageItems = start < filtered.length
          ? filtered.sublist(start, end).cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];

      setState(() {
        _pendingItems = pageItems;
        _pendingPage = page;
        _pendingLoading = false;
      });
    } catch (e) {
      setState(() => _pendingLoading = false);
      debugPrint('[FormsStatusScreen] Pending load error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // DATA LOADING — Submitted (from Supabase)
  // ═══════════════════════════════════════════════════════════════

  Future<void> _loadSubmittedPage(int page) async {
    setState(() => _submittedLoading = true);
    try {
      final campaign = ref.read(campaignProvider);
      // ═══ PERFORMANCE: Use reasonable limit — cached data is reused ═══
      final filter = SubmissionsFilter(
        campaignType: campaign.value,
        limit: 500, // ═══ PERFORMANCE: Reduced, cache handles rest ═══
        offset: 0,
      );
      final data = await ref.read(submissionsProvider(filter).future);

      // Filter only submitted/reviewed/approved/rejected
      var allSubmitted = data
          .where((s) =>
              s['status'] == 'submitted' ||
              s['status'] == 'reviewed' ||
              s['status'] == 'approved' ||
              s['status'] == 'rejected')
          .toList();

      // Apply filters
      var filtered = _applyServerFilters(allSubmitted);
      _submittedTotal = filtered.length;

      // Apply sorting
      filtered = _applySorting(filtered);

      // Paginate
      final start = page * _pageSize;
      final end = (start + _pageSize).clamp(0, filtered.length);
      final pageItems = start < filtered.length
          ? filtered.sublist(start, end).cast<Map<String, dynamic>>()
          : <Map<String, dynamic>>[];

      setState(() {
        _submittedItems = pageItems;
        _submittedPage = page;
        _submittedLoading = false;
      });
    } catch (e) {
      setState(() => _submittedLoading = false);
      debugPrint('[FormsStatusScreen] Submitted load error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FILTERING & SORTING
  // ═══════════════════════════════════════════════════════════════

  List<Map<String, dynamic>> _applyFilters(List<Map<String, dynamic>> items) {
    var result = items;

    // Search query
    if (_searchQuery.isNotEmpty) {
      result = result.where((item) {
        final title = (item['form_title'] ?? item['forms']?['title_ar'] ?? '')
            .toString()
            .toLowerCase();
        final userName =
            (item['profiles']?['full_name'] ?? item['user_name'] ?? '')
                .toString()
                .toLowerCase();
        return title.contains(_searchQuery) || userName.contains(_searchQuery);
      }).toList();
    }

    // Form filter
    if (_filterFormId != null) {
      result = result
          .where((item) =>
              item['form_id'] == _filterFormId ||
              item['formId'] == _filterFormId)
          .toList();
    }

    // Supervisor name filter
    if (_filterSupervisorName != null && _filterSupervisorName!.isNotEmpty) {
      result = result.where((item) {
        final name = (item['profiles']?['full_name'] ?? item['user_name'] ?? '')
            .toString()
            .toLowerCase();
        return name.contains(_filterSupervisorName!);
      }).toList();
    }

    return result;
  }

  List<Map<String, dynamic>> _applyServerFilters(
      List<Map<String, dynamic>> items) {
    var result = items;

    // Search query
    if (_searchQuery.isNotEmpty) {
      result = result.where((item) {
        final title =
            (item['forms']?['title_ar'] ?? '').toString().toLowerCase();
        final userName =
            (item['profiles']?['full_name'] ?? '').toString().toLowerCase();
        return title.contains(_searchQuery) || userName.contains(_searchQuery);
      }).toList();
    }

    // Form filter
    if (_filterFormId != null) {
      result = result.where((s) => s['form_id'] == _filterFormId).toList();
    }

    // Governorate filter
    if (_filterGovernorate != null) {
      result = result
          .where((s) => s['governorate_id'] == _filterGovernorate)
          .toList();
    }

    // District filter
    if (_filterDistrict != null) {
      result =
          result.where((s) => s['district_id'] == _filterDistrict).toList();
    }

    // Supervisor role filter
    if (_filterSupervisorRole != null) {
      result = result.where((s) {
        final role = (s['profiles']?['role'] ?? '').toString().toLowerCase();
        return role == _filterSupervisorRole;
      }).toList();
    }

    // Supervisor name filter
    if (_filterSupervisorName != null && _filterSupervisorName!.isNotEmpty) {
      result = result.where((s) {
        final name =
            (s['profiles']?['full_name'] ?? '').toString().toLowerCase();
        return name.contains(_filterSupervisorName!);
      }).toList();
    }

    return result;
  }

  List<Map<String, dynamic>> _applySorting(List<Map<String, dynamic>> items) {
    final sorted = List<Map<String, dynamic>>.from(items);
    sorted.sort((a, b) {
      switch (_sortBy) {
        case 'date_desc':
          final da = _parseDate(a['created_at'] ?? a['submitted_at'] ?? '');
          final db = _parseDate(b['created_at'] ?? b['submitted_at'] ?? '');
          return db.compareTo(da);
        case 'date_asc':
          final da = _parseDate(a['created_at'] ?? a['submitted_at'] ?? '');
          final db = _parseDate(b['created_at'] ?? b['submitted_at'] ?? '');
          return da.compareTo(db);
        case 'name_asc':
          final na = (a['forms']?['title_ar'] ?? a['form_title'] ?? '')
              .toString()
              .toLowerCase();
          final nb = (b['forms']?['title_ar'] ?? b['form_title'] ?? '')
              .toString()
              .toLowerCase();
          return na.compareTo(nb);
        case 'name_desc':
          final na = (a['forms']?['title_ar'] ?? a['form_title'] ?? '')
              .toString()
              .toLowerCase();
          final nb = (b['forms']?['title_ar'] ?? b['form_title'] ?? '')
              .toString()
              .toLowerCase();
          return nb.compareTo(na);
        case 'status':
          final sa = (a['status'] ?? '').toString();
          final sb = (b['status'] ?? '').toString();
          return sa.compareTo(sb);
        default:
          return 0;
      }
    });
    return sorted;
  }

  DateTime _parseDate(String dateStr) {
    return DateTime.tryParse(dateStr) ?? DateTime(2000);
  }

  // Debounce timer for search — prevents reload on every keystroke
  Timer? _searchDebounce;

  void _onSearchChanged(String query) {
    // Update search query immediately for visual feedback
    setState(() {
      _searchQuery = query.toLowerCase();
    });
    // Debounce the reload — wait 300ms after last keystroke
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), () {
      _reloadCurrentTab();
    });
  }

  void _reloadCurrentTab() {
    switch (_tabController.index) {
      case 0:
        _loadDraftsPage(0);
        break;
      case 1:
        _loadPendingPage(0);
        break;
      case 2:
        _loadSubmittedPage(0);
        break;
    }
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
    _reloadCurrentTab();
  }

  // ═══════════════════════════════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: EpiAppBar(
        title: 'حالة الاستمارات',
        showBackButton: false,
        actions: [
          // Sort button
          IconButton(
            icon: const Icon(Icons.sort_rounded),
            onPressed: () {
              HapticFeedback.lightImpact();
              _showSortSheet();
            },
            tooltip: 'ترتيب',
          ),
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshAll,
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: Column(
        children: [
          // ═══ Stats summary cards ═══
          _buildStatsSection(),

          // ═══ Tab Bar ═══
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppTheme.backgroundLight,
              borderRadius: BorderRadius.circular(14),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: Colors.white,
              unselectedLabelColor: AppTheme.textSecondary,
              labelStyle: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
              unselectedLabelStyle: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
              indicator: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryColor, AppTheme.primaryDark],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              dividerColor: Colors.transparent,
              splashBorderRadius: BorderRadius.circular(12),
              tabs: [
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.edit_note, size: 18),
                      const SizedBox(width: 6),
                      const Text('المسودات'),
                      if (_draftTotal > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$_draftTotal',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.sync, size: 18),
                      const SizedBox(width: 6),
                      const Text('المزامنة'),
                      if (_pendingTotal > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$_pendingTotal',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Tab(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.send, size: 18),
                      const SizedBox(width: 6),
                      const Text('المرسلة'),
                      if (_submittedTotal > 0) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 1),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '$_submittedTotal',
                            style: const TextStyle(fontSize: 10),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ═══ Search bar + Filter toggle ═══
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Expanded(
                  child: EpiSearchBar(
                    controller: _searchController,
                    hint: 'بحث في الاستمارات...',
                    onChanged: _onSearchChanged,
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () => setState(() => _showFilters = !_showFilters),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: _hasActiveFilters
                          ? AppTheme.primaryColor.withValues(alpha: 0.15)
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

          // ═══ Active sort indicator ═══
          if (_sortBy != 'date_desc')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  Icon(Icons.sort, size: 14, color: AppTheme.textHint),
                  const SizedBox(width: 4),
                  Text(
                    'ترتيب: ${_getSortLabel()}',
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: AppTheme.textHint,
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () {
                      setState(() => _sortBy = 'date_desc');
                      _reloadCurrentTab();
                    },
                    child: const Text(
                      'إعادة',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: AppTheme.errorColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),

          // ═══ Tab Content ═══
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Tab 1: Drafts
                _buildDraftsTab(),
                // Tab 2: Pending Sync
                _buildPendingTab(),
                // Tab 3: Submitted
                _buildSubmittedTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: DRAFTS
  // ═══════════════════════════════════════════════════════════════

  Widget _buildDraftsTab() {
    if (_draftLoading && _draftItems.isEmpty) {
      return const EpiLoading.shimmer();
    }

    if (_draftItems.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 80),
          EpiEmptyState(
            icon: Icons.edit_note,
            title: 'لا توجد مسودات',
            subtitle: 'الاستمارات المحفوظة محلياً ستظهر هنا',
          ),
        ],
      );
    }

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _loadDraftsPage(0),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _draftItems.length,
              itemBuilder: (context, index) {
                final draft = _draftItems[index];
                return DraftTile(
                  title: draft['form_title'] ?? 'مسودة',
                  formId: draft['formId'] ?? draft['form_id'] ?? '',
                  date: draft['saved_at'] ?? draft['created_at'],
                  onTap: () {
                    final draftId = draft['draft_id'];
                    final formId = draft['formId'] ?? draft['form_id'];
                    if (draftId != null && formId != null) {
                      context.go('/forms/fill/$formId?draftId=$draftId');
                    }
                  },
                );
              },
            ),
          ),
        ),
        // Pagination controls
        _buildPaginationControls(
          currentPage: _draftPage,
          totalItems: _draftTotal,
          isLoading: _draftLoading,
          onNext: () => _loadDraftsPage(_draftPage + 1),
          onPrev: () => _loadDraftsPage(_draftPage - 1),
          onPage: (p) => _loadDraftsPage(p),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: PENDING SYNC
  // ═══════════════════════════════════════════════════════════════

  Widget _buildPendingTab() {
    if (_pendingLoading && _pendingItems.isEmpty) {
      return const EpiLoading.shimmer();
    }

    if (_pendingItems.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 80),
          EpiEmptyState(
            icon: Icons.cloud_done,
            title: 'لا توجد عناصر للمزامنة',
            subtitle: 'الاستمارات بانتظار المزامنة ستظهر هنا',
          ),
        ],
      );
    }

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _loadPendingPage(0),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _pendingItems.length,
              itemBuilder: (context, index) {
                final item = _pendingItems[index];
                return PendingTile(
                  title: item['form_title'] ??
                      item['forms']?['title_ar'] ??
                      'استمارة',
                  status: item['status'] ?? 'pending',
                  date: item['created_at'],
                  retryCount: item['retry_count'] ?? 0,
                  onTap: () {
                    // Show details or retry
                  },
                );
              },
            ),
          ),
        ),
        _buildPaginationControls(
          currentPage: _pendingPage,
          totalItems: _pendingTotal,
          isLoading: _pendingLoading,
          onNext: () => _loadPendingPage(_pendingPage + 1),
          onPrev: () => _loadPendingPage(_pendingPage - 1),
          onPage: (p) => _loadPendingPage(p),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB: SUBMITTED
  // ═══════════════════════════════════════════════════════════════

  Widget _buildSubmittedTab() {
    if (_submittedLoading && _submittedItems.isEmpty) {
      return const EpiLoading.shimmer();
    }

    if (_submittedItems.isEmpty) {
      return ListView(
        children: const [
          SizedBox(height: 80),
          EpiEmptyState(
            icon: Icons.send,
            title: 'لا توجد إرساليات',
            subtitle: 'الاستمارات المُرسلة ستظهر هنا',
          ),
        ],
      );
    }

    return Column(
      children: [
        Expanded(
          child: RefreshIndicator(
            onRefresh: () => _loadSubmittedPage(0),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _submittedItems.length,
              itemBuilder: (context, index) {
                final sub = _submittedItems[index];
                return SubmittedTile(
                  title: sub['forms']?['title_ar'] ?? 'نموذج',
                  status: sub['status'] ?? 'submitted',
                  date: sub['submitted_at'] ?? sub['created_at'],
                  userName: sub['profiles']?['full_name'],
                  isOffline: sub['is_offline'] == true,
                  onTap: () =>
                      context.go('/forms/status/submission/${sub['id']}'),
                );
              },
            ),
          ),
        ),
        _buildPaginationControls(
          currentPage: _submittedPage,
          totalItems: _submittedTotal,
          isLoading: _submittedLoading,
          onNext: () => _loadSubmittedPage(_submittedPage + 1),
          onPrev: () => _loadSubmittedPage(_submittedPage - 1),
          onPage: (p) => _loadSubmittedPage(p),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGINATION CONTROLS — عشرين بالصفحة + التالي/السابق
  // ═══════════════════════════════════════════════════════════════

  Widget _buildPaginationControls({
    required int currentPage,
    required int totalItems,
    required bool isLoading,
    required VoidCallback onNext,
    required VoidCallback onPrev,
    required ValueChanged<int> onPage,
  }) {
    final totalPages = (totalItems / _pageSize).ceil();
    final hasPrev = currentPage > 0;
    final hasNext = currentPage < totalPages - 1;

    if (totalPages <= 1) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            // Previous button
            FormsNavButton(
              icon: Icons.arrow_forward_ios,
              label: 'السابق',
              enabled: hasPrev && !isLoading,
              onTap: onPrev,
            ),

            // Page indicator + quick jump
            Expanded(
              child: GestureDetector(
                onTap: () => _showPagePicker(
                  currentPage: currentPage,
                  totalPages: totalPages,
                  onPage: onPage,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (isLoading)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    else
                      Text(
                        'صفحة ${currentPage + 1} من $totalPages',
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    Text(
                      '$totalItems استمارة',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: AppTheme.textHint,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Next button
            FormsNavButton(
              icon: Icons.arrow_back_ios,
              label: 'التالي',
              enabled: hasNext && !isLoading,
              onTap: onNext,
            ),
          ],
        ),
      ),
    );
  }

  void _showPagePicker({
    required int currentPage,
    required int totalPages,
    required ValueChanged<int> onPage,
  }) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'اختر الصفحة',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: totalPages,
                itemBuilder: (context, index) {
                  final isCurrent = index == currentPage;
                  final startItem = index * _pageSize + 1;
                  final endItem =
                      ((index + 1) * _pageSize).clamp(0, _submittedTotal);
                  return ListTile(
                    leading: Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? AppTheme.primaryColor
                            : AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w700,
                            color:
                                isCurrent ? Colors.white : AppTheme.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    title: Text(
                      'صفحة ${index + 1}',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontWeight:
                            isCurrent ? FontWeight.w700 : FontWeight.normal,
                        color: isCurrent
                            ? AppTheme.primaryColor
                            : AppTheme.textPrimary,
                      ),
                    ),
                    subtitle: Text(
                      '$startItem - $endItem',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        color: AppTheme.textHint,
                      ),
                    ),
                    trailing: isCurrent
                        ? const Icon(Icons.check_circle,
                            color: AppTheme.primaryColor)
                        : null,
                    onTap: () {
                      Navigator.pop(context);
                      onPage(index);
                    },
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SORT SHEET
  // ═══════════════════════════════════════════════════════════════

  String _getSortLabel() {
    switch (_sortBy) {
      case 'date_desc':
        return 'الأحدث أولاً';
      case 'date_asc':
        return 'الأقدم أولاً';
      case 'name_asc':
        return 'الاسم (أ-ي)';
      case 'name_desc':
        return 'الاسم (ي-أ)';
      case 'status':
        return 'حسب الحالة';
      default:
        return 'الأحدث أولاً';
    }
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ترتيب حسب',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            _buildSortOption('date_desc', Icons.access_time, 'الأحدث أولاً'),
            _buildSortOption(
                'date_asc', Icons.access_time_filled, 'الأقدم أولاً'),
            _buildSortOption('name_asc', Icons.sort_by_alpha, 'الاسم (أ-ي)'),
            _buildSortOption('name_desc', Icons.sort_by_alpha, 'الاسم (ي-أ)'),
            _buildSortOption('status', Icons.category, 'حسب الحالة'),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildSortOption(String value, IconData icon, String label) {
    final isSelected = _sortBy == value;
    return ListTile(
      leading: Icon(
        icon,
        color: isSelected ? AppTheme.primaryColor : AppTheme.textSecondary,
      ),
      title: Text(
        label,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 15,
          fontWeight: isSelected ? FontWeight.w700 : FontWeight.normal,
          color: isSelected ? AppTheme.primaryColor : AppTheme.textPrimary,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_circle, color: AppTheme.primaryColor)
          : null,
      onTap: () {
        setState(() => _sortBy = value);
        Navigator.pop(context);
        _reloadCurrentTab();
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STATS SECTION
  // ═══════════════════════════════════════════════════════════════

  Widget _buildStatsSection() {
    // ═══ PERFORMANCE: Use dedicated stats provider — no full data load ═══
    final statsAsync = ref.watch(formStatsProvider);
    final stats = statsAsync.valueOrNull ?? const FormStats();

    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: FormsStatCard(
              title: 'المسودات',
              count: stats.drafts,
              icon: Icons.edit_note,
              color: AppTheme.warningColor,
              gradient: const LinearGradient(
                colors: [Color(0xFFFB8C00), Color(0xFFF57C00)],
              ),
              onTap: () {
                _tabController.animateTo(0);
                _draftTotal = stats.drafts;
              },
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: FormsStatCard(
              title: 'قيد المزامنة',
              count: stats.pending,
              icon: Icons.sync,
              color: AppTheme.infoColor,
              gradient: const LinearGradient(
                colors: [Color(0xFF1E88E5), Color(0xFF1565C0)],
              ),
              onTap: () {
                _tabController.animateTo(1);
                _pendingTotal = stats.pending;
              },
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: FormsStatCard(
              title: 'المرسلة',
              count: stats.submitted,
              icon: Icons.check_circle,
              color: AppTheme.successColor,
              gradient: const LinearGradient(
                colors: [Color(0xFF43A047), Color(0xFF2E7D32)],
              ),
              onTap: () {
                _tabController.animateTo(2);
                _submittedTotal = stats.submitted;
              },
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ADVANCED FILTER PANEL
  // ═══════════════════════════════════════════════════════════════

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
          _buildFormDropdown(),
          const SizedBox(height: 10),
          _buildGovernorateDropdown(),
          const SizedBox(height: 10),
          _buildDistrictDropdown(),
          const SizedBox(height: 10),
          _buildSupervisorRoleDropdown(),
          const SizedBox(height: 10),
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
              ? forms.firstWhere((f) => f['id'] == _filterFormId,
                  orElse: () => {'title_ar': 'كل النماذج'})['title_ar']
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
    const roles = ['admin', 'central', 'governorate', 'district', 'data_entry'];
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
                hintStyle: TextStyle(fontFamily: 'Tajawal', fontSize: 13),
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
                _reloadCurrentTab();
              },
            ),
          ),
          if (_filterSupervisorName != null)
            GestureDetector(
              onTap: () => setState(() {
                _filterSupervisorName = null;
                _refreshKey++;
              }),
              child:
                  const Icon(Icons.close, size: 16, color: AppTheme.errorColor),
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
              const Icon(Icons.arrow_drop_down, color: AppTheme.textSecondary),
          ],
        ),
      ),
    );
  }

  void _showFormPicker(List<Map<String, dynamic>> forms) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => PickerSheet(
        title: 'اختر النموذج',
        items: [
          const PickerItem(id: null, label: 'الكل'),
          ...forms.map(
              (f) => PickerItem(id: f['id'], label: f['title_ar'] ?? 'نموذج')),
        ],
        selectedId: _filterFormId,
        onSelected: (id) {
          setState(() {
            _filterFormId = id;
            _refreshKey++;
          });
          Navigator.pop(context);
          _reloadCurrentTab();
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
      builder: (_) => PickerSheet(
        title: 'اختر المحافظة',
        items: [
          const PickerItem(id: null, label: 'الكل'),
          ...govs.map(
              (g) => PickerItem(id: g['id'], label: g['name_ar'] ?? 'محافظة')),
        ],
        selectedId: _filterGovernorate,
        onSelected: (id) {
          setState(() {
            _filterGovernorate = id;
            _filterDistrict = null;
            _refreshKey++;
          });
          Navigator.pop(context);
          _reloadCurrentTab();
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
      builder: (_) => PickerSheet(
        title: 'اختر المديرية',
        items: [
          const PickerItem(id: null, label: 'الكل'),
          ...districts.map(
              (d) => PickerItem(id: d['id'], label: d['name_ar'] ?? 'مديرية')),
        ],
        selectedId: _filterDistrict,
        onSelected: (id) {
          setState(() {
            _filterDistrict = id;
            _refreshKey++;
          });
          Navigator.pop(context);
          _reloadCurrentTab();
        },
      ),
    );
  }

  void _showRolePicker(List<String> roles) {
    final roleNames = {
      'admin': 'مدير النظام',
      'central': 'ركزي',
      'governorate': 'محافظة',
      'district': 'مديرية',
      'data_entry': 'إدخال بيانات',
    };
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => PickerSheet(
        title: 'اختر الصفة',
        items: [
          const PickerItem(id: null, label: 'الكل'),
          ...roles.map((r) => PickerItem(id: r, label: roleNames[r] ?? r)),
        ],
        selectedId: _filterSupervisorRole,
        onSelected: (id) {
          setState(() {
            _filterSupervisorRole = id;
            _refreshKey++;
          });
          Navigator.pop(context);
          _reloadCurrentTab();
        },
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD — مع دعم الضغط للانتقال للتبويب
