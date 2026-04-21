import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum MapViewMode { aggregated, individual }

/// Map overlay widgets — header, stats, FABs, mode chips
class MapControls {
  MapControls._();

  static Widget buildHeaderOverlay() {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: IgnorePointer(
        child: Container(
          height: 140,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                const Color(0xFF004D40).withValues(alpha: 0.88),
                const Color(0xFF004D40).withValues(alpha: 0.35),
                Colors.transparent,
              ],
            ),
          ),
        ),
      ),
    );
  }

  static Widget buildTopBar({
    required BuildContext context,
    required MapViewMode viewMode,
    required bool showStats,
    required bool canViewFullCoords,
    required VoidCallback onToggleMode,
    required VoidCallback onRefresh,
    required VoidCallback onToggleStats,
  }) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.map_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('خريطة البيانات', style: TextStyle(fontFamily: 'Cairo', fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                        Text(
                          viewMode == MapViewMode.aggregated ? 'عرض تجميعي — حسب المحافظات' : 'عرض فردي — دبابيس الإرساليات',
                          style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  _iconButton(
                    viewMode == MapViewMode.aggregated ? Icons.scatter_plot_rounded : Icons.layers_rounded,
                    onTap: onToggleMode,
                  ),
                  const SizedBox(width: 8),
                  _iconButton(Icons.refresh_rounded, onTap: onRefresh),
                  const SizedBox(width: 8),
                  _iconButton(showStats ? Icons.info_rounded : Icons.info_outline_rounded, onTap: onToggleStats),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _modeChip(MapViewMode.aggregated, 'تجميعي', Icons.bubble_chart_rounded, viewMode, onToggleMode),
                  const SizedBox(width: 8),
                  _modeChip(MapViewMode.individual, 'فردي', Icons.place_rounded, viewMode, onToggleMode),
                  if (canViewFullCoords) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.gps_fixed, size: 12, color: Color(0xFF10B981)),
                          SizedBox(width: 4),
                          Text('إحداثيات كاملة', style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF10B981))),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static Widget _modeChip(MapViewMode mode, String label, IconData icon, MapViewMode currentMode, VoidCallback onTap) {
    final isSelected = currentMode == mode;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        onTap();
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.2),
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected ? [BoxShadow(color: const Color(0xFF00897B).withValues(alpha: 0.2), blurRadius: 8, offset: const Offset(0, 2))] : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: isSelected ? const Color(0xFF00695C) : Colors.white),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontFamily: 'Tajawal', fontSize: 13, fontWeight: FontWeight.w700, color: isSelected ? const Color(0xFF00695C) : Colors.white)),
          ],
        ),
      ),
    );
  }

  static Widget _iconButton(IconData icon, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  static Widget buildStatsOverlay({
    required int totalSubs,
    int withGps = 0,
    int drafts = 0,
    int govCount = 0,
  }) {
    return Positioned(
      top: 155,
      left: 16,
      right: 16,
      child: Row(
        children: [
          _statCard('الإرساليات', '$totalSubs', Icons.description_rounded, const Color(0xFF3B82F6)),
          const SizedBox(width: 8),
          _statCard('بإحداثيات', '$withGps', Icons.gps_fixed_rounded, const Color(0xFF10B981)),
          const SizedBox(width: 8),
          _statCard('مسودات', '$drafts', Icons.edit_note_rounded, const Color(0xFFFB8C00)),
          const SizedBox(width: 8),
          _statCard('محافظات', '$govCount', Icons.location_city_rounded, const Color(0xFF00897B)),
        ],
      ),
    );
  }

  static Widget _statCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: color.withValues(alpha: 0.12), blurRadius: 10, offset: const Offset(0, 3))],
        ),
        child: Column(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontFamily: 'Cairo', fontSize: 15, fontWeight: FontWeight.w700, color: color)),
            Text(label, style: const TextStyle(fontFamily: 'Tajawal', fontSize: 9, color: Color(0xFF9CA3AF)), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  static Widget buildFABs({
    required Animation<double> fabAnimation,
    required VoidCallback onFitAll,
    required VoidCallback onMyLocation,
    required VoidCallback onZoomIn,
    required VoidCallback onZoomOut,
  }) {
    return Positioned(
      bottom: 24,
      right: 16,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(scale: fabAnimation, child: _fabMini(Icons.fit_screen_rounded, const Color(0xFF00897B), onFitAll)),
          const SizedBox(height: 8),
          ScaleTransition(scale: fabAnimation, child: _fabMini(Icons.my_location_rounded, const Color(0xFF3B82F6), onMyLocation)),
          const SizedBox(height: 8),
          ScaleTransition(scale: fabAnimation, child: _fabMini(Icons.add_rounded, Colors.white, onZoomIn, iconColor: const Color(0xFF1A2332))),
          const SizedBox(height: 8),
          ScaleTransition(scale: fabAnimation, child: _fabMini(Icons.remove_rounded, Colors.white, onZoomOut, iconColor: const Color(0xFF1A2332))),
        ],
      ),
    );
  }

  static Widget _fabMini(IconData icon, Color bgColor, VoidCallback onTap, {Color iconColor = Colors.white}) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.12), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Icon(icon, color: iconColor, size: 22),
      ),
    );
  }
}
