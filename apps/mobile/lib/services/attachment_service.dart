import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as p;
import 'package:mime/mime.dart';

/// ═══════════════════════════════════════════════════════════
/// AttachmentType — نوع المرفق
/// ═══════════════════════════════════════════════════════════

enum AttachmentType {
  image,
  pdf,
  excel,
  word,
  text,
  csv,
  other,
}

extension AttachmentTypeX on AttachmentType {
  String get label {
    switch (this) {
      case AttachmentType.image:
        return 'صورة';
      case AttachmentType.pdf:
        return 'PDF';
      case AttachmentType.excel:
        return 'Excel';
      case AttachmentType.word:
        return 'Word';
      case AttachmentType.text:
        return 'نص';
      case AttachmentType.csv:
        return 'CSV';
      case AttachmentType.other:
        return 'ملف';
    }
  }

  String get emoji {
    switch (this) {
      case AttachmentType.image:
        return '🖼️';
      case AttachmentType.pdf:
        return '📄';
      case AttachmentType.excel:
        return '📊';
      case AttachmentType.word:
        return '📝';
      case AttachmentType.text:
        return '📃';
      case AttachmentType.csv:
        return '📈';
      case AttachmentType.other:
        return '📎';
    }
  }

  int get color {
    switch (this) {
      case AttachmentType.image:
        return 0xFF7C3AED;
      case AttachmentType.pdf:
        return 0xFFEF4444;
      case AttachmentType.excel:
        return 0xFF22C55E;
      case AttachmentType.word:
        return 0xFF2563EB;
      case AttachmentType.text:
        return 0xFF6B7280;
      case AttachmentType.csv:
        return 0xFFF59E0B;
      case AttachmentType.other:
        return 0xFF9CA3AF;
    }
  }

  IconData get icon {
    switch (this) {
      case AttachmentType.image:
        return Icons.image_rounded;
      case AttachmentType.pdf:
        return Icons.picture_as_pdf_rounded;
      case AttachmentType.excel:
        return Icons.table_chart_rounded;
      case AttachmentType.word:
        return Icons.description_rounded;
      case AttachmentType.text:
        return Icons.text_snippet_rounded;
      case AttachmentType.csv:
        return Icons.table_rows_rounded;
      case AttachmentType.other:
        return Icons.attach_file_rounded;
    }
  }

  static AttachmentType fromMimeType(String? mimeType) {
    if (mimeType == null) return AttachmentType.other;
    final mt = mimeType.toLowerCase();
    if (mt.startsWith('image/')) return AttachmentType.image;
    if (mt == 'application/pdf') return AttachmentType.pdf;
    if (mt.contains('spreadsheet') || mt.contains('excel') || mt.contains('csv')) {
      return AttachmentType.csv;
    }
    if (mt.contains('word') || mt.contains('document')) return AttachmentType.word;
    if (mt.startsWith('text/')) return AttachmentType.text;
    return AttachmentType.other;
  }
}

/// ═══════════════════════════════════════════════════════════
/// Attachment — Model
/// ═══════════════════════════════════════════════════════════

class Attachment {
  final String? id;
  final String filePath;
  final String fileName;
  final String fileType;
  final int fileSize;
  final String? thumbnailPath;
  final DateTime? createdAt;
  final AttachmentType type;

  Attachment({
    this.id,
    required this.filePath,
    required this.fileName,
    required this.fileType,
    required this.fileSize,
    this.thumbnailPath,
    this.createdAt,
    AttachmentType? type,
  }) : type = type ?? AttachmentTypeX.fromMimeType(fileType);

  factory Attachment.fromMap(Map<String, dynamic> m) {
    return Attachment(
      id: m['id'] as String?,
      filePath: m['file_path'] as String? ?? '',
      fileName: m['file_name'] as String? ?? '',
      fileType: m['file_type'] as String? ?? '',
      fileSize: (m['file_size'] as num?)?.toInt() ?? 0,
      thumbnailPath: m['thumbnail_path'] as String?,
      createdAt: m['created_at'] != null
          ? DateTime.tryParse(m['created_at'].toString())
          : null,
    );
  }

  /// File size formatted (e.g. "2.3 MB")
  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

/// ═══════════════════════════════════════════════════════════
/// AttachmentService — Service layer
/// ═══════════════════════════════════════════════════════════

class AttachmentService {
  static const _bucket = 'attachments';

  /// Pick an image from gallery or camera
  static Future<XFile?> pickImage({ImageSource source = ImageSource.gallery}) async {
    try {
      final picker = ImagePicker();
      return await picker.pickImage(source: source, imageQuality: 80, maxWidth: 1920);
    } catch (e) {
      debugPrint('[AttachmentService] pickImage error: $e');
      return null;
    }
  }

  /// Pick a file (PDF, Excel, Word, etc.)
  static Future<FilePickerResult?> pickFile({List<String>? allowedExtensions}) async {
    try {
      return await FilePicker.platform.pickFiles(
        type: allowedExtensions != null ? FileType.custom : FileType.any,
        allowedExtensions: allowedExtensions,
        allowMultiple: false,
      );
    } catch (e) {
      debugPrint('[AttachmentService] pickFile error: $e');
      return null;
    }
  }

  /// Upload a file to storage and return the Attachment object
  static Future<Attachment?> uploadFile({
    required File file,
    required String folder, // e.g. "memos", "feedback", "chat"
    String? customName,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      final fileName = customName ?? p.basename(file.path);
      final mimeType = lookupMimeType(file.path);
      final fileExt = p.extension(file.path);
      final uniqueName = '${DateTime.now().millisecondsSinceEpoch}$fileExt';
      final storagePath = '$folder/$userId/$uniqueName';

      // Upload to storage
      await client.storage.from(_bucket).upload(
            storagePath,
            file,
            fileOptions: FileOptions(
              contentType: mimeType,
              upsert: false,
            ),
          );

      // Get file size
      final fileSize = await file.length();

      return Attachment(
        filePath: storagePath,
        fileName: fileName,
        fileType: mimeType ?? 'application/octet-stream',
        fileSize: fileSize,
      );
    } catch (e) {
      debugPrint('[AttachmentService] uploadFile error: $e');
      return null;
    }
  }

  /// Upload an XFile (from image picker)
  static Future<Attachment?> uploadXFile({
    required XFile xfile,
    required String folder,
    String? customName,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      final fileName = customName ?? xfile.name;
      final mimeType = xfile.mimeType ?? lookupMimeType(xfile.path) ?? 'image/jpeg';
      final fileExt = p.extension(xfile.path);
      final uniqueName = '${DateTime.now().millisecondsSinceEpoch}$fileExt';
      final storagePath = '$folder/$userId/$uniqueName';

      // Upload bytes directly
      final bytes = await xfile.readAsBytes();
      await client.storage.from(_bucket).uploadBinary(
            storagePath,
            bytes,
            fileOptions: FileOptions(
              contentType: mimeType,
              upsert: false,
            ),
          );

      return Attachment(
        filePath: storagePath,
        fileName: fileName,
        fileType: mimeType,
        fileSize: bytes.length,
      );
    } catch (e) {
      debugPrint('[AttachmentService] uploadXFile error: $e');
      return null;
    }
  }

  /// Get a signed URL for downloading/viewing a file
  static Future<String?> getSignedUrl(String filePath, {int expiresIn = 3600}) async {
    try {
      final client = Supabase.instance.client;
      return await client.storage.from(_bucket).createSignedUrl(filePath, expiresIn);
    } catch (e) {
      debugPrint('[AttachmentService] getSignedUrl error: $e');
      return null;
    }
  }

  /// Download a file and return the local path
  static Future<String?> downloadFile(String filePath, String fileName) async {
    try {
      final client = Supabase.instance.client;
      final bytes = await client.storage.from(_bucket).download(filePath);

      // Save to temp directory
      final tempDir = await _getTempDir();
      final localPath = '$tempDir/$fileName';
      final localFile = File(localPath);
      await localFile.writeAsBytes(bytes);
      return localPath;
    } catch (e) {
      debugPrint('[AttachmentService] downloadFile error: $e');
      return null;
    }
  }

  /// Delete a file from storage
  static Future<bool> deleteFile(String filePath) async {
    try {
      final client = Supabase.instance.client;
      await client.storage.from(_bucket).remove([filePath]);
      return true;
    } catch (e) {
      debugPrint('[AttachmentService] deleteFile error: $e');
      return false;
    }
  }

  /// Save attachment metadata to database
  static Future<String?> saveAttachmentMetadata({
    required Attachment attachment,
    String? messageId,
    String? memoId,
    String? feedbackTicketId,
    String? feedbackResponseId,
  }) async {
    try {
      final client = Supabase.instance.client;
      final userId = client.auth.currentUser?.id;
      if (userId == null) return null;

      final response = await client.from('message_attachments').insert({
        'message_id': messageId,
        'memo_id': memoId,
        'feedback_ticket_id': feedbackTicketId,
        'feedback_response_id': feedbackResponseId,
        'file_path': attachment.filePath,
        'file_name': attachment.fileName,
        'file_type': attachment.fileType,
        'file_size': attachment.fileSize,
        'uploaded_by': userId,
      }).select('id').single();

      return response['id'] as String?;
    } catch (e) {
      debugPrint('[AttachmentService] saveMetadata error: $e');
      return null;
    }
  }

  /// Fetch attachments for a message
  static Future<List<Attachment>> getAttachments({
    String? messageId,
    String? memoId,
    String? feedbackTicketId,
    String? feedbackResponseId,
  }) async {
    try {
      final client = Supabase.instance.client;
      var query = client.from('message_attachments').select('*');

      if (messageId != null) {
        query = query.eq('message_id', messageId);
      } else if (memoId != null) {
        query = query.eq('memo_id', memoId);
      } else if (feedbackTicketId != null) {
        query = query.eq('feedback_ticket_id', feedbackTicketId);
      } else if (feedbackResponseId != null) {
        query = query.eq('feedback_response_id', feedbackResponseId);
      } else {
        return [];
      }

      final response = await query.order('created_at', ascending: true);
      return (response as List)
          .map((e) => Attachment.fromMap(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('[AttachmentService] getAttachments error: $e');
      return [];
    }
  }

  /// Get temporary directory (cross-platform)
  static Future<String> _getTempDir() async {
    if (kIsWeb) {
      return '/tmp';
    }
    final tempDir = await Directory.systemTemp.createTemp('epi_attachment');
    return tempDir.path;
  }
}

/// ═══════════════════════════════════════════════════════════
/// Riverpod Provider
/// ═══════════════════════════════════════════════════════════

final attachmentServiceProvider = Provider<AttachmentService>((ref) {
  return AttachmentService();
});
