import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════
/// Dashboard Filter Bar — campaign + round filter chips
/// Visible at top of dashboard (was hidden in drawer)
/// ═══════════════════════════════════════════════════════════

class DashboardFilterBar extends StatelessWidget {
  final String campaignLabel;
  final int? campaignRound;
  final bool showRoundFilter;
  final VoidCallback onCampaignTap;
  final VoidCallback onRoundTap;
  final VoidCallback onRefresh;

  const DashboardFilterBar({
    super.key,
    required this.campaignLabel,
    this.campaignRound,
    this.showRoundFilter = false,
    required this.onCampaignTap,
    required this.onRoundTap,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          // Campaign filter chip
          _filterChip(
            label: campaignLabel,
            icon: Icons.campaign_rounded,
            onTap: onCampaignTap,
            color: AppTheme.primaryColor,
          ),
          const SizedBox(width: 8),
          // Round filter chip (only for integrated_activity)
          if (showRoundFilter && campaignRound != null)
            _filterChip(
              label: 'الجولة $campaignRound',
              icon: Icons.repeat_rounded,
              onTap: onRoundTap,
              color: AppTheme.secondaryColor,
            ),
          const Spacer(),
          // Refresh button
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            onPressed: () {
              HapticFeedback.lightImpact();
              onRefresh();
            },
            visualDensity: VisualDensity.compact,
            style: IconButton.styleFrom(
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.08),
              foregroundColor: AppTheme.primaryColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
    required Color color,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: color),
          ],
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Sync Status Bar — shows pending sync items
/// ═══════════════════════════════════════════════════════════

class SyncStatusBar extends StatelessWidget {
  final int pendingCount;
  final bool isSyncing;
  final VoidCallback onSync;

  const SyncStatusBar({
    super.key,
    required this.pendingCount,
    this.isSyncing = false,
    required this.onSync,
  });

  @override
  Widget build(BuildContext context) {
    if (pendingCount == 0 && !isSyncing) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isSyncing
            ? AppTheme.infoColor.withValues(alpha: 0.1)
            : AppTheme.warningColor.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isSyncing
              ? AppTheme.infoColor.withValues(alpha: 0.3)
              : AppTheme.warningColor.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          if (isSyncing)
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: AppTheme.infoColor,
              ),
            )
          else
            Icon(Icons.cloud_sync_rounded, size: 18, color: AppTheme.warningColor),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isSyncing
                  ? 'جاري المزامنة...'
                  : '$pendingCount عنصر بانتظار المزامنة',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSyncing ? AppTheme.infoColor : AppTheme.warningColor,
              ),
            ),
          ),
          if (!isSyncing)
            TextButton(
              onPressed: onSync,
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.warningColor,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              ),
              child: const Text(
                'مزامنة',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ),
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Governorate Ranking Chart — horizontal bar chart
/// Shows top 5 governorates by submission count
/// ═══════════════════════════════════════════════════════════

class GovernorateRankingChart extends StatelessWidget {
  final List<MapEntry<String, int>> governorateData;
  final Color? primaryColor;

  const GovernorateRankingChart({
    super.key,
    required this.governorateData,
    this.primaryColor,
  });

  @override
  Widget build(BuildContext context) {
    final color = primaryColor ?? AppTheme.primaryColor;

    if (governorateData.isEmpty) {
      return Container(
        height: 180,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: Text(
            'لا توجد بيانات للمحافظات',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 13,
              color: AppTheme.textHint.withValues(alpha: 0.5),
            ),
          ),
        ),
      );
    }

    final top5 = governorateData.take(5).toList();
    final maxValue = top5.isNotEmpty ? top5.first.value : 1;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.leaderboard_rounded, size: 18, color: color),
              const SizedBox(width: 8),
              const Text(
                'ترتيب المحافظات',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ...top5.asMap().entries.map((entry) {
            final i = entry.key;
            final gov = entry.value;
            final percent = (gov.value / maxValue).clamp(0.0, 1.0);
            final barColor = _getColorForRank(i);

            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                children: [
                  // Rank number
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: barColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Center(
                      child: Text(
                        '${i + 1}',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: barColor,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Governorate name
                  Expanded(
                    child: Text(
                      gov.key,
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  // Bar
                  Expanded(
                    flex: 2,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: percent,
                          backgroundColor: barColor.withValues(alpha: 0.08),
                          valueColor: AlwaysStoppedAnimation(barColor),
                          minHeight: 10,
                        ),
                      ),
                    ),
                  ),
                  // Count
                  SizedBox(
                    width: 45,
                    child: Text(
                      '${gov.value}',
                      textAlign: TextAlign.left,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: barColor,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Color _getColorForRank(int index) {
    const colors = [
      Color(0xFF00897B), // teal
      Color(0xFF1E88E5), // blue
      Color(0xFF8E24AA), // purple
      Color(0xFFFF8F00), // amber
      Color(0xFFE53935), // red
    ];
    return colors[index % colors.length];
  }
}

/// ═══════════════════════════════════════════════════════════
/// Submissions Status Donut Chart — shows status distribution
/// ═══════════════════════════════════════════════════════════

class SubmissionsStatusDonut extends StatelessWidget {
  final int submitted;
  final int draft;
  final int total;

  const SubmissionsStatusDonut({
    super.key,
    required this.submitted,
    required this.draft,
    required this.total,
  });

  @override
  Widget build(BuildContext context) {
    if (total == 0) {
      return Container(
        height: 160,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: const Center(
          child: Text('لا توجد بيانات', style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
        ),
      );
    }

    final submittedPercent = total > 0 ? (submitted / total * 100).round() : 0;
    final draftPercent = total > 0 ? (draft / total * 100).round() : 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.pie_chart_rounded, size: 18, color: AppTheme.primaryColor),
              const SizedBox(width: 8),
              const Text(
                'توزيع الحالات',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // Donut chart
              SizedBox(
                width: 100,
                height: 100,
                child: Stack(
                  children: [
                    // Background ring
                    CircularProgressIndicator(
                      value: 1.0,
                      strokeWidth: 12,
                      backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.08),
                      valueColor: AlwaysStoppedAnimation(AppTheme.primaryColor.withValues(alpha: 0.08)),
                    ),
                    // Submitted portion
                    Transform.rotate(
                      angle: -1.5708, // -90 degrees
                      child: CircularProgressIndicator(
                        value: total > 0 ? submitted / total : 0,
                        strokeWidth: 12,
                        backgroundColor: Colors.transparent,
                        valueColor: const AlwaysStoppedAnimation(Color(0xFF22C55E)),
                      ),
                    ),
                    // Center text
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$total',
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            'إجمالي',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 9,
                              color: AppTheme.textHint,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              // Legend
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _legendItem(
                      color: const Color(0xFF22C55E),
                      label: 'مرسلة',
                      count: submitted,
                      percent: submittedPercent,
                    ),
                    const SizedBox(height: 10),
                    _legendItem(
                      color: const Color(0xFFF59E0B),
                      label: 'مسودة',
                      count: draft,
                      percent: draftPercent,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _legendItem({
    required Color color,
    required String label,
    required int count,
    required int percent,
  }) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
          ),
        ),
        Text(
          '$count ($percent%)',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Submissions By Level Chart — shows submission breakdown by admin level
/// Categories: إرسالياتي (mine) / مركزي / محافظة / مديرية
/// ═══════════════════════════════════════════════════════════

class SubmissionsByLevelChart extends ConsumerStatefulWidget {
  final AsyncValue<AuthState> authState;
  final String? campaignType;
  final int? campaignRound;

  const SubmissionsByLevelChart({
    super.key,
    required this.authState,
    this.campaignType,
    this.campaignRound,
  });

  @override
  ConsumerState<SubmissionsByLevelChart> createState() =>
      _SubmissionsByLevelChartState();
}

class _SubmissionsByLevelChartState
    extends ConsumerState<SubmissionsByLevelChart> {
  List<Map<String, dynamic>> _submissions = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  @override
  void didUpdateWidget(SubmissionsByLevelChart oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.campaignType != widget.campaignType ||
        oldWidget.campaignRound != widget.campaignRound) {
      _fetchData();
    }
  }

  Future<void> _fetchData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final db = ref.read(databaseServiceProvider);
      final data = await db.getSubmissions(
        campaignType: widget.campaignType,
        campaignRound: widget.campaignRound,
        status: 'submitted',
        limit: 10000,
      );
      if (mounted) {
        setState(() {
          _submissions = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Container(
        height: 200,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Container(
        height: 160,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: Text(
            'تعذّر تحميل البيانات',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 13,
              color: AppTheme.textHint.withValues(alpha: 0.5),
            ),
          ),
        ),
      );
    }

    // ═══ Compute level breakdown ═══
    final authState = widget.authState.valueOrNull;
    final userId = authState?.userId;

    int mineCount = 0;
    int centralCount = 0;
    int governorateCount = 0;
    int districtCount = 0;

    for (final s in _submissions) {
      final submitterId = s['submitted_by'] as String?;
      final role = (s['profiles'] as Map?)?['role'] as String? ?? '';

      // Count user's own submissions
      if (userId != null && submitterId == userId) {
        mineCount++;
      }

      // Count by admin level
      switch (role) {
        case 'admin':
        case 'central':
          centralCount++;
          break;
        case 'governorate':
          governorateCount++;
          break;
        case 'district':
        case 'data_entry':
          districtCount++;
          break;
      }
    }

    final total = centralCount + governorateCount + districtCount;
    final displayTotal = total > 0 ? total : 1;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ═══ Horizontal bar chart ═══
          if (total == 0)
            Container(
              height: 120,
              alignment: Alignment.center,
              child: Text(
                'لا توجد إرساليات',
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 13,
                  color: AppTheme.textHint.withValues(alpha: 0.5),
                ),
              ),
            )
          else
            _buildBarChart(
              mineCount: mineCount,
              centralCount: centralCount,
              governorateCount: governorateCount,
              districtCount: districtCount,
              total: displayTotal,
            ),
          const SizedBox(height: 16),
          // ═══ Legend with counts ═══
          _legendItem(
            color: const Color(0xFF00897B),
            label: 'إرسالياتي',
            count: mineCount,
            percent: total > 0 ? (mineCount / total * 100).round() : 0,
            icon: Icons.person_rounded,
          ),
          const SizedBox(height: 8),
          _legendItem(
            color: const Color(0xFFEF4444),
            label: 'مركزي',
            count: centralCount,
            percent:
                total > 0 ? (centralCount / total * 100).round() : 0,
            icon: Icons.admin_panel_settings_rounded,
          ),
          const SizedBox(height: 8),
          _legendItem(
            color: const Color(0xFF3B82F6),
            label: 'محافظة',
            count: governorateCount,
            percent: total > 0
                ? (governorateCount / total * 100).round()
                : 0,
            icon: Icons.account_balance_rounded,
          ),
          const SizedBox(height: 8),
          _legendItem(
            color: const Color(0xFF10B981),
            label: 'مديرية',
            count: districtCount,
            percent:
                total > 0 ? (districtCount / total * 100).round() : 0,
            icon: Icons.location_city_rounded,
          ),
        ],
      ),
    );
  }

  /// ═══ Stacked horizontal bar showing relative proportions ═══
  Widget _buildBarChart({
    required int mineCount,
    required int centralCount,
    required int governorateCount,
    required int districtCount,
    required int total,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Total count
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'الإجمالي: $total إرسالية',
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
            const Text(
              'بحسب المستوى الإداري',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Stacked horizontal bar
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: 32,
            child: Row(
              children: [
                if (mineCount > 0)
                  Expanded(
                    flex: mineCount,
                    child: Container(
                      color: const Color(0xFF00897B),
                      child: Center(
                        child: Text(
                          '$mineCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                  ),
                if (centralCount > 0)
                  Expanded(
                    flex: centralCount,
                    child: Container(
                      color: const Color(0xFFEF4444),
                      child: Center(
                        child: Text(
                          '$centralCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                  ),
                if (governorateCount > 0)
                  Expanded(
                    flex: governorateCount,
                    child: Container(
                      color: const Color(0xFF3B82F6),
                      child: Center(
                        child: Text(
                          '$governorateCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                  ),
                if (districtCount > 0)
                  Expanded(
                    flex: districtCount,
                    child: Container(
                      color: const Color(0xFF10B981),
                      child: Center(
                        child: Text(
                          '$districtCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _legendItem({
    required Color color,
    required String label,
    required int count,
    required int percent,
    required IconData icon,
  }) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 10),
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            label,
            style: const TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Text(
          '$count ($percent%)',
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }
}
