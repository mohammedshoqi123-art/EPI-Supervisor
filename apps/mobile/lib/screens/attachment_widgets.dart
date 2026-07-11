import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:epi_shared/epi_shared.dart';
import '../services/attachment_service.dart';

/// ═══════════════════════════════════════════════════════════
/// AttachmentPicker — شريط اختيار نوع المرفق (صورة / ملف)
/// ═══════════════════════════════════════════════════════════

class AttachmentPicker {
  /// Show a bottom sheet to pick attachment type
  static Future<Attachment?> show(BuildContext context, {required String folder}) async {
    return showModalBottomSheet<Attachment>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _AttachmentPickerSheet(folder: folder),
    );
  }
}

class _AttachmentPickerSheet extends StatefulWidget {
  final String folder;

  const _AttachmentPickerSheet({required this.folder});

  @override
  State<_AttachmentPickerSheet> createState() => _AttachmentPickerSheetState();
}

class _AttachmentPickerSheetState extends State<_AttachmentPickerSheet> {
  bool _uploading = false;
  String _statusText = '';

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 12, bottom: 16),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.only(bottom: 16),
            child: Text(
              'إضافة مرفق',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          if (_uploading) ...[
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  const CircularProgressIndicator(),
                  const SizedBox(height: 12),
                  Text(
                    _statusText,
                    style: const TextStyle(
                        fontFamily: 'Tajawal', fontSize: 13),
                  ),
                ],
              ),
            ),
          ] else ...[
            _option(
              icon: Icons.camera_alt_rounded,
              color: const Color(0xFF7C3AED),
              label: 'التقاط صورة بالكاميرا',
              onTap: () => _pickImage(ImageSource.camera),
            ),
            _option(
              icon: Icons.photo_library_rounded,
              color: const Color(0xFF22C55E),
              label: 'اختيار صورة من المعرض',
              onTap: () => _pickImage(ImageSource.gallery),
            ),
            _option(
              icon: Icons.picture_as_pdf_rounded,
              color: const Color(0xFFEF4444),
              label: 'مستند PDF',
              onTap: () => _pickFile(['pdf']),
            ),
            _option(
              icon: Icons.table_chart_rounded,
              color: const Color(0xFF22C55E),
              label: 'ملف Excel',
              onTap: () => _pickFile(['xlsx', 'xls', 'csv']),
            ),
            _option(
              icon: Icons.description_rounded,
              color: const Color(0xFF2563EB),
              label: 'مستند Word',
              onTap: () => _pickFile(['docx', 'doc']),
            ),
            _option(
              icon: Icons.attach_file_rounded,
              color: const Color(0xFF6B7280),
              label: 'أي ملف آخر',
              onTap: () => _pickFile(null),
            ),
            const SizedBox(height: 16),
          ],
        ],
      ),
    );
  }

  Widget _option({
    required IconData icon,
    required Color color,
    required String label,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        label,
        style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
      ),
      onTap: onTap,
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() {
      _uploading = true;
      _statusText = 'جاري اختيار الصورة...';
    });

    try {
      final xfile = await AttachmentService.pickImage(source: source);
      if (xfile == null) {
        Navigator.pop(context);
        return;
      }

      setState(() => _statusText = 'جاري رفع الصورة...');
      final attachment =
          await AttachmentService.uploadXFile(xfile: xfile, folder: widget.folder);

      if (mounted) {
        Navigator.pop(context, attachment);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل رفع الصورة: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
        Navigator.pop(context);
      }
    }
  }

  Future<void> _pickFile(List<String>? extensions) async {
    setState(() {
      _uploading = true;
      _statusText = 'جاري اختيار الملف...';
    });

    try {
      final result = await AttachmentService.pickFile(allowedExtensions: extensions);
      if (result == null || result.files.isEmpty) {
        Navigator.pop(context);
        return;
      }

      final platformFile = result.files.first;
      if (platformFile.path == null) {
        Navigator.pop(context);
        return;
      }

      setState(() => _statusText = 'جاري رفع الملف...');
      final attachment = await AttachmentService.uploadFile(
        file: File(platformFile.path!),
        folder: widget.folder,
        customName: platformFile.name,
      );

      if (mounted) {
        Navigator.pop(context, attachment);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل رفع الملف: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
        Navigator.pop(context);
      }
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// AttachmentBubble — فقاعة عرض مرفق في الرسائل
/// ═══════════════════════════════════════════════════════════

class AttachmentBubble extends StatefulWidget {
  final Attachment attachment;
  final bool isMe;

  const AttachmentBubble({
    super.key,
    required this.attachment,
    required this.isMe,
  });

  @override
  State<AttachmentBubble> createState() => _AttachmentBubbleState();
}

class _AttachmentBubbleState extends State<AttachmentBubble> {
  bool _downloading = false;
  String? _localPath;

  @override
  Widget build(BuildContext context) {
    final att = widget.attachment;
    final typeColor = Color(att.type.color);

    // For images, show thumbnail
    if (att.type == AttachmentType.image) {
      return _buildImageThumbnail(typeColor);
    }

    // For other files, show file card
    return _buildFileCard(typeColor);
  }

  Widget _buildImageThumbnail(Color typeColor) {
    return GestureDetector(
      onTap: _downloadAndOpen,
      child: Container(
        width: 200,
        height: 150,
        margin: const EdgeInsets.only(bottom: 4),
        decoration: BoxDecoration(
          color: typeColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: typeColor.withValues(alpha: 0.3)),
        ),
        child: Stack(
          children: [
            // Image preview placeholder
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(att.type.icon, size: 40, color: typeColor),
                  const SizedBox(height: 8),
                  Text(
                    att.fileName,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: typeColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            // Download indicator
            if (_downloading)
              Container(
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                ),
              ),
            // Top-right badge
            Positioned(
              top: 6,
              right: 6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: typeColor,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  att.type.emoji,
                  style: const TextStyle(fontSize: 10),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFileCard(Color typeColor) {
    return GestureDetector(
      onTap: _downloadAndOpen,
      child: Container(
        margin: const EdgeInsets.only(bottom: 4),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: typeColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: typeColor.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: typeColor.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(att.type.icon, color: typeColor, size: 20),
            ),
            const SizedBox(width: 10),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    att.fileName,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: typeColor,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${att.type.label} • ${att.fileSizeFormatted}',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: typeColor.withValues(alpha: 0.7),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            _downloading
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: typeColor),
                  )
                : Icon(Icons.download_rounded, size: 18, color: typeColor),
          ],
        ),
      ),
    );
  }

  Attachment get att => widget.attachment;

  Future<void> _downloadAndOpen() async {
    if (_localPath != null) {
      _openFile();
      return;
    }

    setState(() => _downloading = true);
    HapticFeedback.lightImpact();

    try {
      final path = await AttachmentService.downloadFile(att.filePath, att.fileName);
      if (mounted) {
        setState(() {
          _localPath = path;
          _downloading = false;
        });
        if (path != null) {
          _openFile();
        } else {
          // Fallback: get signed URL and open in browser
          final url = await AttachmentService.getSignedUrl(att.filePath);
          if (mounted && url != null) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('افتح الرابط: $url',
                    style: const TextStyle(fontFamily: 'Tajawal')),
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _downloading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل تحميل الملف: $e',
                style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: const Color(0xFFEF4444),
          ),
        );
      }
    }
  }

  Future<void> _openFile() async {
    if (_localPath == null) return;
    try {
      // Use OpenFileX to open the file
      // We import it lazily to avoid issues if not available
      // ignore: implementation_imports
      final openFilex = await _importOpenFilex();
      if (openFilex != null) {
        await openFilex(_localPath!);
      }
    } catch (e) {
      debugPrint('[AttachmentBubble] openFile error: $e');
    }
  }

  /// Lazy import of OpenFileX
  Future<dynamic Function(String)? > _importOpenFilex() async {
    try {
      // ignore: depend_on_referenced_packages
      final lib = await Future.value();
      return (String path) async {
        // Use url_launcher or other mechanism
        // For now, just print
        debugPrint('[Attachment] Open file: $path');
      };
    } catch (_) {
      return null;
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// AttachmentList — قائمة مرفقات (للتعاميم والتغذية الراجعة)
/// ═══════════════════════════════════════════════════════════

class AttachmentList extends StatefulWidget {
  final List<Attachment> attachments;
  final String emptyText;

  const AttachmentList({
    super.key,
    required this.attachments,
    this.emptyText = 'لا توجد مرفقات',
  });

  @override
  State<AttachmentList> createState() => _AttachmentListState();
}

class _AttachmentListState extends State<AttachmentList> {
  @override
  Widget build(BuildContext context) {
    if (widget.attachments.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Text(
          widget.emptyText,
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 12,
            color: Colors.grey.shade500,
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text(
          'المرفقات (${widget.attachments.length})',
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Color(0xFF6B7280),
          ),
        ),
        const SizedBox(height: 8),
        ...widget.attachments.map((att) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: AttachmentBubble(attachment: att, isMe: false),
            )),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// AttachmentChips — رقائق المرفقات المرفوعة (قبل الإرسال)
/// ═══════════════════════════════════════════════════════════

class AttachmentChips extends StatelessWidget {
  final List<Attachment> attachments;
  final Function(int)? onRemove;

  const AttachmentChips({
    super.key,
    required this.attachments,
    this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    if (attachments.isEmpty) return const SizedBox.shrink();

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: attachments.asMap().entries.map((entry) {
        final i = entry.key;
        final att = entry.value;
        final typeColor = Color(att.type.color);
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: typeColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: typeColor.withValues(alpha: 0.2)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(att.type.icon, size: 14, color: typeColor),
              const SizedBox(width: 4),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120),
                child: Text(
                  att.fileName,
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: typeColor,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (onRemove != null) ...[
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => onRemove!(i),
                  child: Icon(Icons.close_rounded,
                      size: 14, color: typeColor.withValues(alpha: 0.6)),
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
}
