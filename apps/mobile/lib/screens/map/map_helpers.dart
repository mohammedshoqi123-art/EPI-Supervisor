import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';
import 'package:epi_core/epi_core.dart';

/// Map utility helpers — colors, formatting, cluster logic
class MapHelpers {
  MapHelpers._();

  static Color statusColor(String? status) {
    switch (status) {
      case 'approved':
        return const Color(0xFF10B981);
      case 'submitted':
        return const Color(0xFF3B82F6);
      case 'reviewed':
        return const Color(0xFF8B5CF6);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'draft':
        return const Color(0xFFFB8C00);
      default:
        return const Color(0xFF6B7280);
    }
  }

  static String statusLabel(String? status) {
    switch (status) {
      case 'approved':
        return 'معتمدة';
      case 'submitted':
        return 'مرسلة';
      case 'reviewed':
        return 'تمت المراجعة';
      case 'rejected':
        return 'مرفوضة';
      case 'draft':
        return 'مسودة';
      default:
        return 'غير معروف';
    }
  }

  static Color clusterColor(int count) {
    if (count >= 50) return const Color(0xFF059669);
    if (count >= 20) return const Color(0xFF10B981);
    if (count >= 10) return const Color(0xFF3B82F6);
    if (count >= 5) return const Color(0xFFF59E0B);
    if (count > 0) return const Color(0xFFF97316);
    return const Color(0xFFCBD5E1);
  }

  static String formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return '';
    }
  }

  static bool canViewFullCoords(UserRole? role) {
    return role == UserRole.admin ||
        role == UserRole.central ||
        role == UserRole.governorate;
  }

  static bool canViewAllGovernorates(UserRole? role) {
    return role == UserRole.admin || role == UserRole.central;
  }

  static double calculateFitZoom(List<LatLng> points) {
    if (points.length <= 1) return 12.0;

    double minLat = points.first.latitude;
    double maxLat = points.first.latitude;
    double minLng = points.first.longitude;
    double maxLng = points.first.longitude;

    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    final maxDiff = (maxLat - minLat) > (maxLng - minLng)
        ? (maxLat - minLat)
        : (maxLng - minLng);

    if (maxDiff < 0.5) return 12.0;
    if (maxDiff < 1) return 10.0;
    if (maxDiff < 2) return 9.0;
    if (maxDiff < 4) return 8.0;
    if (maxDiff < 8) return 7.0;
    return 6.0;
  }
}
