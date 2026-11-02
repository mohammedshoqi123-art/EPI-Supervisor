// ═══════════════════════════════════════════════════════════════════════════
//  OFFLINE CACHED TILE PROVIDER — مزوّد بلاطات الخريطة مع تخزين محلي
// ═══════════════════════════════════════════════════════════════════════════
//
//  المشكلة السابقة: الخريطة كانت تعتمد كلياً على شبكة OSM — أوفلاين كانت
//  تظهر بيضاء تماماً حتى لو كانت الإرساليات مخزنة.
//
//  الحل: مزوّد بلاطات يخزّن كل بلاطة تُحمّل أونلاين في مجلد محلي،
//  وعند الانقطاع يقرأ من المخزن. البلاطة غير الموجودة إطلاقاً
//  تُستبدل ببلاطة شفافة (بدون استثناءات ظاهرة) — الإرساليات تبقى مرئية.
//
//  التوافق: flutter_map ^6.1.0 — TileProvider.getImage(TileCoordinates, TileLayer)
// ═══════════════════════════════════════════════════════════════════════════

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:path_provider/path_provider.dart';

import 'package:epi_core/epi_core.dart';

/// مزوّد بلاطات مع ذاكرة قرص: أونلاين يحمّل ويحفظ، أوفلاين يقرأ المخزن.
class OfflineCachedTileProvider extends TileProvider {
  OfflineCachedTileProvider() : super(headers: const {'User-Agent': 'com.epi.supervisor'});

  @override
  ImageProvider getImage(TileCoordinates coordinates, TileLayer tileLayer) {
    final url = getTileUrl(coordinates, tileLayer);
    return CachedTileImage(url: url);
  }
}

/// ImageProvider يحاول: القرص ← الشبكة (+ حفظ) ← بلاطة شفافة.
class CachedTileImage extends ImageProvider<CachedTileImage> {
  final String url;
  const CachedTileImage({required this.url});

  @override
  Future<CachedTileImage> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture<CachedTileImage>(this);
  }

  @override
  ImageStreamCompleter loadImage(CachedTileImage key, ImageDecoderCallback decode) {
    return MultiFrameImageStreamCompleter(
      codec: _loadAsync(key, decode),
      scale: 1.0,
    );
  }

  Future<ui.Codec> _loadAsync(CachedTileImage key, ImageDecoderCallback decode) async {
    Uint8List? bytes;

    // 1) ذاكرة القرص
    final cachedFile = await TileDiskCache.fileForUrl(key.url);
    if (cachedFile != null && await cachedFile.exists()) {
      try {
        bytes = await cachedFile.readAsBytes();
        if (bytes.isEmpty) bytes = null;
      } catch (_) {
        bytes = null;
      }
    }

    // 2) الشبكة (أونلاين فقط)
    if (bytes == null && ConnectivityUtils.isOnline) {
      bytes = await _download(key.url);
      if (bytes != null) {
        unawaited(TileDiskCache.saveForUrl(key.url, bytes));
      }
    }

    // 3) بلاطة شفافة — الخريطة تبقى قابلة للاستخدام أوفلاين
    bytes ??= TileProvider.transparentImage;

    try {
      final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
      return await decode(buffer);
    } catch (_) {
      // بيانات تالفة — أعد البلاطة الشفافة
      final fallback = await ui.ImmutableBuffer.fromUint8List(TileProvider.transparentImage);
      return await decode(fallback);
    }
  }

  static final HttpClient _httpClient = HttpClient()
    ..connectionTimeout = const Duration(seconds: 8)
    ..userAgent = 'com.epi.supervisor';

  Future<Uint8List?> _download(String url) async {
    try {
      final req = await _httpClient.getUrl(Uri.parse(url));
      final resp = await req.close().timeout(const Duration(seconds: 10));
      if (resp.statusCode == 200) {
        final bytes = await consolidateHttpClientResponseBytes(resp).timeout(
          const Duration(seconds: 15),
          onTimeout: () => Uint8List(0),
        );
        return bytes.isEmpty ? null : bytes;
      }
      // إغلاق الاستجابات غير الناجحة لتحرير الاتصال
      unawaited(resp.listen(null).cancel());
    } catch (_) {}
    return null;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) || other is CachedTileImage && other.url == url;

  @override
  int get hashCode => url.hashCode;
}

/// تخزين البلاطات على القرص مع حد أقصى لعدد الملفات (تنظيف الأقدم أولاً).
class TileDiskCache {
  TileDiskCache._();

  static const int maxFiles = 4000; // ≈ 4000 × ~15KB ≈ 60MB
  static Directory? _dir;

  static Future<Directory?> _ensureDir() async {
    if (_dir != null) return _dir;
    try {
      final docs = await getApplicationDocumentsDirectory();
      final dir = Directory('${docs.path}/maptiles');
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      _dir = dir;
      return dir;
    } catch (_) {
      return null;
    }
  }

  /// اسم ملف آمن من الرابط — هاش بسيط ثابت.
  static String _fileName(String url) {
    return url.hashCode.toUnsigned(63).toRadixString(36) +
        url.length.toRadixString(36);
  }

  static Future<File?> fileForUrl(String url) async {
    final dir = await _ensureDir();
    if (dir == null) return null;
    return File('${dir.path}/${_fileName(url)}');
  }

  static Future<void> saveForUrl(String url, Uint8List bytes) async {
    try {
      final dir = await _ensureDir();
      if (dir == null) return;
      final file = File('${dir.path}/${_fileName(url)}');
      await file.writeAsBytes(bytes, flush: false);
      unawaited(_trimIfNeeded(dir));
    } catch (_) {}
  }

  /// تنظيف دوري — يُنفّذ باحتمال منخفض حتى لا يكلف كل حفظ.
  static Future<void> _trimIfNeeded(Directory dir) async {
    try {
      // 1 من كل 40 حفظاً فقط نفحص
      if (DateTime.now().millisecondsSinceEpoch % 40 != 0) return;
      final entities = await dir.list().toList();
      if (entities.length <= maxFiles) return;
      final files = entities.whereType<File>().toList();
      if (files.length <= maxFiles) return;
      files.sort((a, b) =>
          a.statSync().modified.isBefore(b.statSync().modified) ? -1 : 1);
      final toDelete = files.length - maxFiles;
      for (int i = 0; i < toDelete; i++) {
        try {
          await files[i].delete();
        } catch (_) {}
      }
    } catch (_) {}
  }
}
