import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// PhotoViewerPage — عارض صور بملء الشاشة (مستخدم في المعرض + تفاصيل الإرسالية)
///
/// المدخل: قائمة صور base64 (بدون بادئة data:image) + فهرس البداية.
/// الميزات: تقريب بالإصبعين (InteractiveViewer)، تمرير بين الصور (PageView)،
/// عداد الصور، زر إغلاق، ونسخ إحداثيات GPS إن وُجدت.
/// ═══════════════════════════════════════════════════════════════════════
class PhotoViewerPage extends StatefulWidget {
  final List<String> photos; // base64 strings (raw or data-URI prefixed)
  final int initialIndex;
  final String? title;
  final String? subtitle;
  final double? gpsLat;
  final double? gpsLng;

  const PhotoViewerPage({
    super.key,
    required this.photos,
    this.initialIndex = 0,
    this.title,
    this.subtitle,
    this.gpsLat,
    this.gpsLng,
  });

  /// فك ترميز base64 بأمان — يقبل صيغة data-URI أو base64 خام.
  static Uint8List? decodePhoto(String raw) {
    try {
      var b64 = raw.trim();
      final commaIdx = b64.indexOf(',');
      if (b64.startsWith('data:image/') && commaIdx != -1) {
        b64 = b64.substring(commaIdx + 1);
      }
      b64 = b64.replaceAll(RegExp(r'\s'), '');
      return base64Decode(b64);
    } catch (_) {
      return null;
    }
  }

  @override
  State<PhotoViewerPage> createState() => _PhotoViewerPageState();
}

class _PhotoViewerPageState extends State<PhotoViewerPage> {
  late final PageController _pageController;
  late int _index;

  @override
  void initState() {
    super.initState();
    _index = widget.initialIndex.clamp(0, widget.photos.isEmpty ? 0 : widget.photos.length - 1);
    _pageController = PageController(initialPage: _index);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.title != null)
              Text(
                widget.title!,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            if (widget.subtitle != null)
              Text(
                widget.subtitle!,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 11,
                  color: Colors.white.withValues(alpha: 0.6),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        actions: [
          if (widget.photos.length > 1)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text(
                  '${_index + 1} / ${widget.photos.length}',
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.photos.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) {
              final bytes = PhotoViewerPage.decodePhoto(widget.photos[i]);
              if (bytes == null) {
                return const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.broken_image_rounded, color: Colors.white38, size: 56),
                      SizedBox(height: 12),
                      Text(
                        'تعذر عرض هذه الصورة',
                        style: TextStyle(fontFamily: 'Tajawal', color: Colors.white54),
                      ),
                    ],
                  ),
                );
              }
              return Center(
                child: InteractiveViewer(
                  maxScale: 5.0,
                  minScale: 0.5,
                  child: Image.memory(
                    bytes,
                    fit: BoxFit.contain,
                    gaplessPlayback: true,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.broken_image_rounded,
                      color: Colors.white38,
                      size: 56,
                    ),
                  ),
                ),
              );
            },
          ),
          // GPS chip — copy coordinates
          if (widget.gpsLat != null && widget.gpsLng != null)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Center(
                child: InkWell(
                  borderRadius: BorderRadius.circular(24),
                  onTap: () {
                    Clipboard.setData(
                      ClipboardData(text: '${widget.gpsLat}, ${widget.gpsLng}'),
                    );
                    HapticFeedback.selectionClick();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('تم نسخ الإحداثيات 📍',
                            style: TextStyle(fontFamily: 'Tajawal')),
                        behavior: SnackBarBehavior.floating,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white24),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.location_on_rounded,
                            color: Colors.tealAccent, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          '${widget.gpsLat!.toStringAsFixed(5)}, ${widget.gpsLng!.toStringAsFixed(5)}',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Icon(Icons.copy_rounded,
                            color: Colors.white.withValues(alpha: 0.7), size: 14),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
