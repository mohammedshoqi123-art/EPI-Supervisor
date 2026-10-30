import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/src/utils/connectivity_utils.dart';

import '../providers/app_providers.dart';
import 'photo_viewer.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// GalleryScreen — معرض صور الإشراف
///
/// يعرض الصور التوثيقية المرفقة بالإرساليات (مخزنة base64 داخل data JSONB)
/// عبر دوال RPC آمنة ترث صلاحيات RLS — كل مستخدم يرى ما يُسمح له به فقط.
///
/// الميزات:
/// - شبكة صور مع تحميل تدريجي (8 إرساليات/صفحة)
/// - فلتر حسب الاستمارة
/// - النقر → عارض بملء الشاشة مع كل صور الإرسالية + GPS
/// - أوفلاين: الصفحة الأولى مخزنة محلياً وتُعرض عند انقطاع الاتصال
/// ═══════════════════════════════════════════════════════════════════════

class GalleryScreen extends ConsumerStatefulWidget {
  const GalleryScreen({super.key});

  @override
  ConsumerState<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends ConsumerState<GalleryScreen> {
  static const int _pageSize = 8;

  final ScrollController _scrollController = ScrollController();
  List<Map<String, dynamic>> _items = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _totalCount = 0;
  String? _error;
  String? _formFilter; // null = الكل
  bool _fromCache = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _initialLoad();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 400) {
      _loadMore();
    }
  }

  String get _cacheKey => 'photos_gallery${_formFilter == null ? '' : '_$_formFilter'}';

  Future<void> _initialLoad() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _fromCache = false;
    });

    // 1) عدد الصور الإجمالي (سريع — لا يجلب الصور)
    try {
      final db = ref.read(databaseServiceProvider);
      _totalCount = await db.countPhotoSubmissions().timeout(
            const Duration(seconds: 10),
          );
    } catch (_) {
      _totalCount = 0;
    }

    // 2) الكاش أولاً — عرض فوري حتى بدون إنترنت
    List<Map<String, dynamic>>? cached;
    try {
      final cache = await ref.read(offlineDataCacheProvider.future);
      cached = cache.getCachedDataList(_cacheKey);
    } catch (_) {}

    if (cached != null && cached.isNotEmpty && mounted) {
      setState(() {
        _items = cached;
        _isLoading = false;
        _hasMore = true;
        _fromCache = !ConnectivityUtils.isOnline;
      });
      // تحديث صامت من الشبكة إن كنا متصلين
      if (ConnectivityUtils.isOnline) _fetchPage(refresh: true);
      return;
    }

    // 3) لا كاش — جلب من الشبكة
    await _fetchPage(refresh: true);
  }

  Future<void> _fetchPage({bool refresh = false}) async {
    if (_isLoadingMore) return;
    if (!refresh && !_hasMore) return;

    if (!ConnectivityUtils.isOnline) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
          if (_items.isEmpty) {
            _error = 'لا يوجد اتصال بالإنترنت — افتح المعرض مرة أخرى عند توفر الاتصال لتحميل الصور';
          }
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        if (refresh) {
          _isLoading = _items.isEmpty;
        } else {
          _isLoadingMore = true;
        }
        _error = null;
      });
    }

    try {
      final db = ref.read(databaseServiceProvider);
      final offset = refresh ? 0 : _items.length;
      final page = await db.listPhotoSubmissions(
        limit: _pageSize,
        offset: offset,
        formId: _formFilter,
      ).timeout(const Duration(seconds: 45));

      // فلترة صفوف بلا صور (احتياط)
      final valid = page.where((r) {
        final photos = r['photos'];
        return photos is List && photos.isNotEmpty;
      }).toList();

      final cache = await ref.read(offlineDataCacheProvider.future);
      if (refresh) {
        await cache.putList(_cacheKey, valid);
        if (mounted) {
          setState(() {
            _items = valid;
            _hasMore = page.length >= _pageSize;
            _isLoading = false;
            _isLoadingMore = false;
            _fromCache = false;
          });
        }
      } else {
        await cache.putList('$_cacheKey${offset ~/ _pageSize}', valid);
        if (mounted) {
          setState(() {
            _items.addAll(valid);
            _hasMore = page.length >= _pageSize;
            _isLoadingMore = false;
          });
        }
      }
    } catch (e) {
      debugPrint('[Gallery] fetch failed: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
          if (_items.isEmpty) {
            _error = ConnectivityUtils.isOnline
                ? 'فشل تحميل الصور — اسحب للتحديث للمحاولة مجدداً'
                : 'لا يوجد اتصال بالإنترنت';
          }
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_isLoading || _isLoadingMore || !_hasMore || _items.isEmpty) return;
    await _fetchPage(refresh: false);
  }

  Future<void> _refresh() async {
    _hasMore = true;
    await _fetchPage(refresh: true);
  }

  void _onFormFilterChanged(String? formId) {
    if (formId == _formFilter) return;
    setState(() {
      _formFilter = formId;
      _items = [];
      _hasMore = true;
    });
    _initialLoad();
  }

  void _openViewer(Map<String, dynamic> item, int photoIndex) {
    final photos = (item['photos'] as List?) ?? [];
    if (photos.isEmpty) return;
    Navigator.of(context).push(MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => PhotoViewerPage(
        photos: photos.cast<String>(),
        initialIndex: photoIndex,
        title: item['form_title']?.toString() ?? 'صورة إشراف',
        subtitle:
            '${item['submitter_name'] ?? '—'} • ${_formatDate(item['created_at'])}',
        gpsLat: (item['gps_lat'] as num?)?.toDouble(),
        gpsLng: (item['gps_lng'] as num?)?.toDouble(),
      ),
    ));
  }

  String _formatDate(dynamic dateStr) {
    final d = DateTime.tryParse(dateStr?.toString() ?? '');
    if (d == null) return '';
    return '${d.year}/${d.month}/${d.day}';
  }

  @override
  Widget build(BuildContext context) {
    final formsAsync = ref.watch(formsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'معرض صور الإشراف 📷',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'تحديث',
            onPressed: _isLoading ? null : _refresh,
          ),
        ],
      ),
      body: _isLoading && _items.isEmpty
          ? _buildSkeleton()
          : _error != null && _items.isEmpty
              ? _buildError()
              : _buildBody(formsAsync),
    );
  }

  Widget _buildSkeleton() {
    return GridView.builder(
      padding: const EdgeInsets.all(12),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => Card(
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Container(
          decoration: BoxDecoration(
            color: AppTheme.primarySurface,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _error!.contains('اتصال')
                  ? Icons.wifi_off_rounded
                  : Icons.photo_library_outlined,
              size: 64,
              color: AppTheme.textHint,
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 14,
                color: AppTheme.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 24),
            EpiButton(
              text: 'إعادة المحاولة',
              icon: Icons.refresh_rounded,
              onPressed: _refresh,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(AsyncValue<List<Map<String, dynamic>>> formsAsync) {
    final forms = formsAsync.valueOrNull ?? const [];

    return RefreshIndicator(
      onRefresh: _refresh,
      child: CustomScrollView(
        controller: _scrollController,
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // Header — count + filter
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_fromCache)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        color: AppTheme.warningColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppTheme.warningColor.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.offline_bolt_rounded,
                              size: 16, color: AppTheme.warningColor),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'معروض من التخزين المحلي — اتصل بالإنترنت لتحميل أحدث الصور',
                              style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 12,
                                  color: AppTheme.warningColor),
                            ),
                          ),
                        ],
                      ),
                    ),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$_totalCount إرسالية موثقة بالصور',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.primaryColor,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  // Filter — استمارة
                  if (forms.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.primarySurface.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: AppTheme.primaryColor.withValues(alpha: 0.2)),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String?>(
                          value: _formFilter,
                          isExpanded: true,
                          hint: const Text(
                            'كل الاستمارات',
                            style: TextStyle(
                                fontFamily: 'Tajawal', fontSize: 13),
                          ),
                          icon: const Icon(Icons.filter_list_rounded, size: 18),
                          items: [
                            const DropdownMenuItem<String?>(
                              value: null,
                              child: Text('كل الاستمارات',
                                  style: TextStyle(
                                      fontFamily: 'Tajawal', fontSize: 13)),
                            ),
                            ...forms.map((f) => DropdownMenuItem<String?>(
                                  value: f['id']?.toString(),
                                  child: Text(
                                    f['title_ar']?.toString() ?? 'استمارة',
                                    style: const TextStyle(
                                        fontFamily: 'Tajawal', fontSize: 13),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                )),
                          ],
                          onChanged: _onFormFilterChanged,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Grid
          if (_items.isEmpty)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.photo_camera_back_rounded,
                        size: 64, color: AppTheme.textHint),
                    SizedBox(height: 16),
                    Text(
                      'لا توجد صور بعد',
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textSecondary),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'ستظهر هنا الصور التوثيقية المرفقة بالإرساليات',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 13,
                          color: AppTheme.textHint),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(12),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 0.72,
                ),
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final item = _items[index];
                    return _PhotoCard(
                      item: item,
                      dateLabel: _formatDate(item['created_at']),
                      onTap: () => _openViewer(item, 0),
                      onOpenAt: (i) => _openViewer(item, i),
                    );
                  },
                  childCount: _items.length,
                ),
              ),
            ),

          // Footer — loading more / end
          if (_items.isNotEmpty)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Center(
                  child: _isLoadingMore
                      ? const Column(
                          children: [
                            CircularProgressIndicator(strokeWidth: 2),
                            SizedBox(height: 8),
                            Text('جاري تحميل المزيد...',
                                style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 12,
                                    color: AppTheme.textHint)),
                          ],
                        )
                      : _hasMore
                          ? TextButton.icon(
                              onPressed: _loadMore,
                              icon: const Icon(Icons.expand_more_rounded),
                              label: const Text('تحميل المزيد',
                                  style: TextStyle(fontFamily: 'Tajawal')),
                            )
                          : Text(
                              '— نهاية المعرض ($_items إرسالية معروضة) —',
                              style: const TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 12,
                                  color: AppTheme.textHint),
                            ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// بطاقة صورة في الشبكة — تعرض أول صورة + شارة عدد الصور
class _PhotoCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final String dateLabel;
  final VoidCallback onTap;
  final ValueChanged<int> onOpenAt;

  const _PhotoCard({
    required this.item,
    required this.dateLabel,
    required this.onTap,
    required this.onOpenAt,
  });

  @override
  Widget build(BuildContext context) {
    final photos = (item['photos'] as List?)?.cast<String>() ?? const [];
    final photoCount = (item['photo_count'] as num?)?.toInt() ?? photos.length;
    final title = item['form_title']?.toString() ?? 'استمارة';
    final submitter = item['submitter_name']?.toString() ?? '';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Card(
        elevation: 2,
        shadowColor: Colors.black26,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        clipBehavior: Clip.antiAlias,
        margin: EdgeInsets.zero,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Photo area
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImage(photos),
                  if (photoCount > 1)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: Colors.black54,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.photo_library_rounded,
                                color: Colors.white, size: 12),
                            const SizedBox(width: 4),
                            Text(
                              '$photoCount',
                              style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                    ),
                  // Mini thumbnails for direct access
                  if (photos.length > 1)
                    Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: Container(
                        height: 34,
                        color: Colors.black38,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 4),
                          itemCount: photos.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 4),
                          itemBuilder: (context, i) => GestureDetector(
                            onTap: () => onOpenAt(i),
                            child: CircleAvatar(
                              radius: 13,
                              backgroundColor: Colors.white24,
                              backgroundImage:
                                  _decodeProvider(photos[i], cacheWidth: 80),
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Meta
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.textPrimary,
                      height: 1.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      const Icon(Icons.person_rounded,
                          size: 12, color: AppTheme.textHint),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          submitter,
                          style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: AppTheme.textSecondary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 11, color: AppTheme.textHint),
                      const SizedBox(width: 3),
                      Text(
                        dateLabel,
                        style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10.5,
                            color: AppTheme.textHint),
                      ),
                      if (item['gps_lat'] != null) ...[
                        const Spacer(),
                        const Icon(Icons.location_on_rounded,
                            size: 12, color: AppTheme.primaryColor),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  ImageProvider<Object>? _decodeProvider(String raw, {int? cacheWidth}) {
    final bytes = PhotoViewerPage.decodePhoto(raw);
    if (bytes == null) return null;
    return ResizeImage(
      MemoryImage(bytes),
      width: cacheWidth,
      policy: ResizeImagePolicy.exact,
      allowUpscaling: false,
    );
  }

  Widget _buildImage(List<String> photos) {
    if (photos.isEmpty) {
      return Container(
        color: AppTheme.primarySurface,
        child: const Icon(Icons.broken_image_rounded,
            color: AppTheme.textHint, size: 40),
      );
    }
    final bytes = PhotoViewerPage.decodePhoto(photos.first);
    if (bytes == null) {
      return Container(
        color: AppTheme.primarySurface,
        child: const Icon(Icons.broken_image_rounded,
            color: AppTheme.textHint, size: 40),
      );
    }
    return Image.memory(
      bytes,
      fit: BoxFit.cover,
      cacheWidth: 500, // حد الذاكرة — الصورة الكاملة تُفك في العارض فقط
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) => Container(
        color: AppTheme.primarySurface,
        child: const Icon(Icons.broken_image_rounded,
            color: AppTheme.textHint, size: 40),
      ),
    );
  }
}
