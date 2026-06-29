import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:epi_shared/epi_shared.dart';

/// Photo picker field — camera or gallery, with auto-compression.
/// Default: 1 photo max. Compresses to ~200-500KB before storing.
class PhotoPickerField extends StatelessWidget {
  final List<XFile> photos;
  final int maxPhotos;
  final ValueChanged<List<XFile>> onPhotosChanged;
  final bool isRequired;

  const PhotoPickerField({
    super.key,
    required this.photos,
    required this.maxPhotos,
    required this.onPhotosChanged,
    required this.isRequired,
  });

  Future<void> _pickImage(BuildContext context, ImageSource source) async {
    final picker = ImagePicker();
    try {
      // ═══ FIX F4: Better image compression — smaller files, prevents payload rejection ═══
      final picked = await picker.pickImage(
        source: source,
        maxWidth: 1280,  // Was 1920 — 1280 is sufficient for field documentation
        maxHeight: 1280, // Was 1080 — square max for consistent compression
        imageQuality: 85, // Was 95 — 85% is visually identical but much smaller
      );
      if (picked == null) return;

      // Compress the image
      final compressed = await _compressImage(picked);
      final finalFile =
          compressed ?? picked; // Fallback to original if compression fails

      // ═══ FIX F4: Check file size — warn if still too large ═══
      try {
        final fileSize = await finalFile.length();
        if (fileSize > 2 * 1024 * 1024) { // > 2MB
          if (context.mounted) {
            context.showWarning('حجم الصورة كبير (${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB). قد يتأخر الإرسال.');
          }
        }
      } catch (_) {}

      final updated = List<XFile>.from(photos)..add(finalFile);
      onPhotosChanged(updated);
    } catch (e) {
      // ═══ FIX F3: Better error message for permission denial ═══
      final errMsg = e.toString().toLowerCase();
      if (errMsg.contains('permission') || errMsg.contains('denied') || errMsg.contains('camera_access')) {
        if (context.mounted) {
          context.showError('تم رفض إذن الكاميرا. فعّله من إعدادات التطبيق.');
        }
      } else {
        if (context.mounted) context.showError('فشل التقاط الصورة: ${e.toString()}');
      }
    }
  }

  /// Compress image to ~200-500KB while maintaining readable quality.
  /// Returns null if compression fails (caller should use original file).
  static Future<XFile?> _compressImage(XFile file) async {
    try {
      final filePath = file.path;
      final lastIndex = filePath.lastIndexOf('.');
      final ext = lastIndex != -1
          ? filePath.substring(lastIndex).toLowerCase()
          : '.jpg';
      final targetPath = '${filePath}_compressed$ext';

      // ═══ FIX F4: Stronger compression — was 75% / minWidth 1024, now 70% / maxWidth 1280 ═══
      final result = await FlutterImageCompress.compressAndGetFile(
        filePath,
        targetPath,
        quality: 70, // Was 75 — 70% produces ~30% smaller files with minimal quality loss
        minWidth: 800,  // Was 1024 — 800px is sufficient for field documentation photos
        minHeight: 800, // Was 1024 — reduces file size significantly
        format: ext.contains('png') ? CompressFormat.png : CompressFormat.jpeg,
      );

      return result; // XFile? in flutter_image_compress v2
    } catch (e) {
      // Compression failed — use original
      return null;
    }
  }

  void _showPickerOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(
                Icons.camera_alt,
                color: AppTheme.primaryColor,
              ),
              title: const Text(
                'الكاميرا',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickImage(context, ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library,
                color: AppTheme.primaryColor,
              ),
              title: const Text(
                'المعرض',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
              onTap: () {
                Navigator.pop(context);
                _pickImage(context, ImageSource.gallery);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasPhoto = photos.isNotEmpty;
    final canAddMore = photos.length < maxPhotos;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Photo preview
        if (hasPhoto)
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: photos.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Stack(
                    children: [
                      XFileImage(
                        file: photos[index],
                        width: 100,
                        height: 100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () {
                            final updated = List<XFile>.from(photos)
                              ..removeAt(index);
                            onPhotosChanged(updated);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: AppTheme.errorColor,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              size: 14,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        if (hasPhoto) const SizedBox(height: 8),
        // Add button — hidden if max reached
        if (canAddMore)
          InkWell(
            onTap: () => _showPickerOptions(context),
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isRequired && !hasPhoto
                      ? AppTheme.errorColor
                      : Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(12),
                color: isRequired && !hasPhoto
                    ? AppTheme.errorColor.withValues(alpha: 0.05)
                    : null,
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.add_a_photo,
                    size: 32,
                    color: isRequired && !hasPhoto
                        ? AppTheme.errorColor
                        : AppTheme.primaryColor,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    hasPhoto
                        ? 'إضافة صورة أخرى (${photos.length}/$maxPhotos)'
                        : 'انقر لإرفاق صورة',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      color: isRequired && !hasPhoto
                          ? AppTheme.errorColor
                          : Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
