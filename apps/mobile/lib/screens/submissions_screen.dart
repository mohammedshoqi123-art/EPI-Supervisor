import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

class SubmissionsScreen extends ConsumerStatefulWidget {
  const SubmissionsScreen({super.key});

  @override
  ConsumerState<SubmissionsScreen> createState() => _SubmissionsScreenState();
}

class _SubmissionsScreenState extends ConsumerState<SubmissionsScreen> {
  String? _statusFilter;
  String _searchQuery = '';
  final _searchController = TextEditingController();

  // ═══ Page-based pagination state ═══
  static const int _pageSize = 20;
  List<Map<String, dynamic>> _allItems = [];
  List<Map<String, dynamic>> _pageItems = [];
  int _currentPage = 0;
  bool _isLoading = false;
  String? _error;

  // ═══ Sort state ═══
  String _sortBy = 'date_desc';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// Load all data from provider
  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final campaign = ref.read(campaignProvider);
      final round = ref.read(campaignRoundProvider);
      // ═══ PERFORMANCE: Cache-first — sync populates cache, this reads from it ═══
      // Client-side pagination on cached data (fast after first sync)
      final filter = SubmissionsFilter(
        status: _statusFilter,
        campaignType: campaign.value,
        campaignRound: campaign.value == 'integrated_activity' ? round : null,
        limit: 5000, // Was 500, caused silent truncation
        offset: 0,
      );

      final data = await ref.read(submissionsProvider(filter).future);

      setState(() {
        _allItems = data;
        _isLoading = false;
        _currentPage = 0;
      });

      _applyFiltersAndSort();
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  /// Apply search, sort, and paginate
  void _applyFiltersAndSort() {
    var filtered = _allItems;

    // Search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((sub) {
        final formTitle =
            (sub['forms']?['title_ar'] ?? '').toString().toLowerCase();
        final userName =
            (sub['profiles']?['full_name'] ?? '').toString().toLowerCase();
        final status = (sub['status'] ?? '').toString().toLowerCase();
        return formTitle.contains(_searchQuery) ||
            userName.contains(_searchQuery) ||
            status.contains(_searchQuery);
      }).toList();
    }

    // Sort
    filtered = _applySorting(filtered);

    // Paginate
    final totalPages = (filtered.length / _pageSize).ceil();
    final safePage = _currentPage.clamp(0, (totalPages - 1).clamp(0, 9999));
    final start = safePage * _pageSize;
    final end = (start + _pageSize).clamp(0, filtered.length);
    final pageItems = start < filtered.length
        ? filtered.sublist(start, end).cast<Map<String, dynamic>>()
        : <Map<String, dynamic>>[];

    setState(() {
      _pageItems = pageItems;
      _currentPage = safePage;
    });
  }

  List<Map<String, dynamic>> _applySorting(List<Map<String, dynamic>> items) {
    final sorted = List<Map<String, dynamic>>.from(items);
    sorted.sort((a, b) {
      switch (_sortBy) {
        case 'date_desc':
          final da = DateTime.tryParse(a['created_at'] ?? '') ?? DateTime(2000);
          final db = DateTime.tryParse(b['created_at'] ?? '') ?? DateTime(2000);
          return db.compareTo(da);
        case 'date_asc':
          final da = DateTime.tryParse(a['created_at'] ?? '') ?? DateTime(2000);
          final db = DateTime.tryParse(b['created_at'] ?? '') ?? DateTime(2000);
          return da.compareTo(db);
        case 'name_asc':
          final na = (a['forms']?['title_ar'] ?? '').toString().toLowerCase();
          final nb = (b['forms']?['title_ar'] ?? '').toString().toLowerCase();
          return na.compareTo(nb);
        case 'name_desc':
          final na = (a['forms']?['title_ar'] ?? '').toString().toLowerCase();
          final nb = (b['forms']?['title_ar'] ?? '').toString().toLowerCase();
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

  /// Pull-to-refresh
  Future<void> _refresh() async {
    HapticFeedback.mediumImpact();
    if (!ConnectivityUtils.isOnline) return;
    final campaign = ref.read(campaignProvider);
    final filter = SubmissionsFilter(
      status: _statusFilter,
      campaignType: campaign.value,
    );
    await ref.read(forceRefreshProvider)(filter.cacheKey);
    ref.invalidate(submissionsProvider(filter));
    await _loadData();
  }

  /// Filter changed
  void _onFilterChanged(String? status) {
    HapticFeedback.selectionClick();
    setState(() {
      _statusFilter = status;
      _currentPage = 0;
    });
    _loadData();
  }

  /// Get total filtered count
  int get _totalFilteredCount {
    if (_searchQuery.isEmpty) return _allItems.length;
    return _allItems.where((sub) {
      final formTitle =
          (sub['forms']?['title_ar'] ?? '').toString().toLowerCase();
      final userName =
          (sub['profiles']?['full_name'] ?? '').toString().toLowerCase();
      final status = (sub['status'] ?? '').toString().toLowerCase();
      return formTitle.contains(_searchQuery) ||
          userName.contains(_searchQuery) ||
          status.contains(_searchQuery);
    }).length;
  }

  @override
  Widget build(BuildContext context) {
    final totalPages = (_totalFilteredCount / _pageSize).ceil();

    return Scaffold(
      appBar: EpiAppBar(
        title: AppStrings.submissions,
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
          // Filter button
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              HapticFeedback.lightImpact();
              _showFilterSheet();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: EpiSearchBar(
              controller: _searchController,
              hint: 'بحث في الإرساليات...',
              onChanged: (query) {
                setState(() {
                  _searchQuery = query.toLowerCase();
                  _currentPage = 0;
                });
                _applyFiltersAndSort();
              },
            ),
          ),

          // Active filter chip
          if (_statusFilter != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  EpiStatusChip(status: _statusFilter!),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _onFilterChanged(null),
                    child: const Icon(
                      Icons.close,
                      size: 18,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),

          // Sort indicator
          if (_sortBy != 'date_desc')
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
                      _applyFiltersAndSort();
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

          // List
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    // Loading
    if (_isLoading && _allItems.isEmpty) {
      return const EpiLoading.shimmer();
    }

    // Error
    if (_error != null && _allItems.isEmpty) {
      return EpiErrorWidget(message: _error!, onRetry: _loadData);
    }

    // Empty
    if (_pageItems.isEmpty) {
      return ListView(
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.2),
          EpiEmptyState(
            icon: Icons.upload_file,
            title: _searchQuery.isNotEmpty
                ? 'لا توجد نتائج للبحث'
                : 'لا توجد إرساليات',
            subtitle: _searchQuery.isNotEmpty
                ? 'جرّب كلمات بحث مختلفة'
                : 'لم يتم إرسال أي نماذج بعد',
          ),
        ],
      );
    }

    final totalPages = (_totalFilteredCount / _pageSize).ceil();

    return Column(
      children: [
        // List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _pageItems.length,
            itemBuilder: (context, index) {
              final sub = _pageItems[index];
              final status = sub['status'] ?? 'draft';
              final canPdf = status != 'draft';

              return _SubmissionTile(
                title: sub['forms']?['title_ar'] ?? 'نموذج',
                status: status,
                date: sub['created_at'],
                userName: sub['profiles']?['full_name'],
                onTap: () =>
                    context.go('/forms/status/submission/${sub['id']}'),
                onPdf: canPdf ? () => _quickGeneratePdf(sub) : null,
              );
            },
          ),
        ),

        // Pagination controls
        if (totalPages > 1)
          _buildPaginationControls(
            currentPage: _currentPage,
            totalPages: totalPages,
            totalItems: _totalFilteredCount,
          ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGINATION CONTROLS
  // ═══════════════════════════════════════════════════════════════

  Widget _buildPaginationControls({
    required int currentPage,
    required int totalPages,
    required int totalItems,
  }) {
    final hasPrev = currentPage > 0;
    final hasNext = currentPage < totalPages - 1;

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
            // Previous
            _NavButton(
              icon: Icons.arrow_forward_ios,
              label: 'السابق',
              enabled: hasPrev,
              onTap: () {
                setState(() => _currentPage--);
                _applyFiltersAndSort();
              },
            ),

            // Page info + jump
            Expanded(
              child: GestureDetector(
                onTap: () => _showPagePicker(
                  currentPage: currentPage,
                  totalPages: totalPages,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'صفحة ${currentPage + 1} من $totalPages',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      '$totalItems إرسالية',
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

            // Next
            _NavButton(
              icon: Icons.arrow_back_ios,
              label: 'التالي',
              enabled: hasNext,
              onTap: () {
                setState(() => _currentPage++);
                _applyFiltersAndSort();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showPagePicker({
    required int currentPage,
    required int totalPages,
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
                      ((index + 1) * _pageSize).clamp(0, _totalFilteredCount);
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
                      setState(() => _currentPage = index);
                      _applyFiltersAndSort();
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
  // SORT
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
        _applyFiltersAndSort();
      },
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // FILTER SHEET
  // ═══════════════════════════════════════════════════════════════

  void _showFilterSheet() {
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
              'تصفية حسب الحالة',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                'draft',
                'submitted',
              ].map((s) {
                return ChoiceChip(
                  label: EpiStatusChip(status: s, small: true),
                  selected: _statusFilter == s,
                  onSelected: (selected) {
                    _onFilterChanged(selected ? s : null);
                    Navigator.pop(context);
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PDF GENERATION
  // ═══════════════════════════════════════════════════════════════

  Future<void> _quickGeneratePdf(Map<String, dynamic> sub) async {
    HapticFeedback.lightImpact();

    try {
      final form = sub['forms'] as Map<String, dynamic>? ?? {};
      final file = await FormReportGenerator.generate(
        form: form,
        submissions: [sub],
        period:
            'إرسال واحدة — ${(sub['created_at'] ?? '').toString().substring(0, 10)}',
      );

      if (!mounted) return;

      await SharePlus.instance.share(
        ShareParams(
          files: [XFile(file.path)],
          subject: 'تقرير استمارة EPI — ${form['title_ar'] ?? ''}',
        ),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم إنشاء التقرير ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل إنشاء التقرير: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV BUTTON
// ═══════════════════════════════════════════════════════════════════════════

class _NavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  const _NavButton({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: enabled
              ? AppTheme.primaryColor.withValues(alpha: 0.1)
              : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: enabled
                ? AppTheme.primaryColor.withValues(alpha: 0.3)
                : Colors.grey.shade200,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: enabled ? AppTheme.primaryColor : AppTheme.textHint,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: enabled ? AppTheme.primaryColor : AppTheme.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMISSION TILE
// ═══════════════════════════════════════════════════════════════════════════

class _SubmissionTile extends StatelessWidget {
  final String title;
  final String status;
  final String? date;
  final String? userName;
  final VoidCallback onTap;
  final VoidCallback? onPdf;

  const _SubmissionTile({
    required this.title,
    required this.status,
    this.date,
    this.userName,
    required this.onTap,
    this.onPdf,
  });

  @override
  Widget build(BuildContext context) {
    return EpiCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.statusColor(status).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.description, color: AppTheme.statusColor(status)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                if (userName != null)
                  Text(
                    userName!,
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                if (date != null)
                  Text(
                    _formatDate(date!),
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: AppTheme.textHint,
                    ),
                  ),
              ],
            ),
          ),
          // PDF Button
          if (onPdf != null)
            GestureDetector(
              onTap: onPdf,
              child: Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFE53935).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.picture_as_pdf_rounded,
                  color: Color(0xFFE53935),
                  size: 20,
                ),
              ),
            ),
          const SizedBox(width: 4),
          EpiStatusChip(status: status, small: true),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year}';
  }
}
