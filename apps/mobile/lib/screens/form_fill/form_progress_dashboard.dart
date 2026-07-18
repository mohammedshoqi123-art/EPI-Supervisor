import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// Dashboard التقدم الحي — يعرض إحصائيات النموذج لحظياً
/// ═══════════════════════════════════════════════════════════
class FormProgressDashboard extends StatefulWidget {
  final int totalFields;
  final int filledFields;
  final int requiredFields;
  final int filledRequiredFields;
  final int totalYesNo;
  final int yesCount;
  final int photosCount;
  final bool hasGps;
  final int currentSection;
  final int totalSections;

  const FormProgressDashboard({
    super.key,
    required this.totalFields,
    required this.filledFields,
    required this.requiredFields,
    required this.filledRequiredFields,
    required this.totalYesNo,
    required this.yesCount,
    required this.photosCount,
    required this.hasGps,
    required this.currentSection,
    required this.totalSections,
  });

  @override
  State<FormProgressDashboard> createState() => _FormProgressDashboardState();
}

class _FormProgressDashboardState extends State<FormProgressDashboard>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;
  late Animation<double> _progressAnimation;
  double _oldProgress = 0;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _progressAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.easeOutCubic),
    );
  }

  @override
  void didUpdateWidget(FormProgressDashboard oldWidget) {
    super.didUpdateWidget(oldWidget);
    final newProgress = widget.totalFields > 0
        ? widget.filledFields / widget.totalFields
        : 0.0;
    if ((newProgress - _oldProgress).abs() > 0.01) {
      _progressAnimation = Tween<double>(
        begin: _oldProgress,
        end: newProgress,
      ).animate(
        CurvedAnimation(
          parent: _progressController,
          curve: Curves.easeOutCubic,
        ),
      );
      _progressController.forward(from: 0);
      _oldProgress = newProgress;
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final completionRate = widget.totalFields > 0
        ? (widget.filledFields / widget.totalFields * 100).round()
        : 0;
    final complianceRate = widget.totalYesNo > 0
        ? (widget.yesCount / widget.totalYesNo * 100).round()
        : 0;
    final requiredComplete = widget.requiredFields > 0 &&
        widget.filledRequiredFields == widget.requiredFields;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primaryColor.withValues(alpha: 0.08),
            AppTheme.primaryColor.withValues(alpha: 0.03),
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppTheme.primaryColor.withValues(alpha: 0.15),
        ),
      ),
      child: Column(
        children: [
          // الصف الرئيسي: دائرة التقدم + الإحصائيات
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                // دائرة التقدم الكبيرة
                _buildProgressCircle(completionRate, cs),
                const SizedBox(width: 16),
                // الإحصائيات
                Expanded(
                  child: _buildStatsGrid(cs, completionRate, complianceRate, requiredComplete),
                ),
              ],
            ),
          ),
          // شريط حالة الأقسام
          if (widget.totalSections > 1) _buildSectionIndicator(cs),
        ],
      ),
    );
  }

  Widget _buildProgressCircle(int completionRate, ColorScheme cs) {
    final color = completionRate >= 80
        ? AppTheme.successColor
        : completionRate >= 50
            ? Colors.amber
            : AppTheme.primaryColor;

    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // الدائرة الخارجية
          AnimatedBuilder(
            animation: _progressAnimation,
            builder: (context, child) {
              return SizedBox(
                width: 80,
                height: 80,
                child: CircularProgressIndicator(
                  value: _progressAnimation.value,
                  strokeWidth: 7,
                  backgroundColor: cs.outline.withValues(alpha: 0.1),
                  valueColor: AlwaysStoppedAnimation(color),
                  strokeCap: StrokeCap.round,
                ),
              );
            },
          ),
          // النسبة المئوية
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$completionRate%',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: color,
                  fontFamily: 'Cairo',
                ),
              ),
              Text(
                'إكمال',
                style: TextStyle(
                  fontSize: 9,
                  color: cs.onSurfaceVariant,
                  fontFamily: 'Tajawal',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(
    ColorScheme cs,
    int completionRate,
    int complianceRate,
    bool requiredComplete,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // الصف الأول: الحقول
        Row(
          children: [
            _buildStatChip(
              icon: Icons.edit_rounded,
              label: '${widget.filledFields}/${widget.totalFields}',
              sublabel: 'حقل',
              color: AppTheme.primaryColor,
              cs: cs,
            ),
            const SizedBox(width: 8),
            _buildStatChip(
              icon: Icons.check_circle_outline_rounded,
              label: '${widget.filledRequiredFields}/${widget.requiredFields}',
              sublabel: 'مطلوب',
              color: requiredComplete ? AppTheme.successColor : AppTheme.errorColor,
              cs: cs,
            ),
          ],
        ),
        const SizedBox(height: 8),
        // الصف الثاني: الالتزام + الصور
        Row(
          children: [
            if (widget.totalYesNo > 0) ...[
              _buildStatChip(
                icon: Icons.analytics_outlined,
                label: '$complianceRate%',
                sublabel: 'التزام',
                color: complianceRate >= 80
                    ? AppTheme.successColor
                    : complianceRate >= 50
                        ? Colors.amber
                        : AppTheme.errorColor,
                cs: cs,
              ),
              const SizedBox(width: 8),
            ],
            if (widget.photosCount > 0) ...[
              _buildStatChip(
                icon: Icons.camera_alt_rounded,
                label: '${widget.photosCount}',
                sublabel: 'صورة',
                color: AppTheme.primaryColor,
                cs: cs,
              ),
              const SizedBox(width: 8),
            ],
            if (widget.hasGps)
              _buildStatChip(
                icon: Icons.location_on_rounded,
                label: '✓',
                sublabel: 'GPS',
                color: AppTheme.successColor,
                cs: cs,
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatChip({
    required IconData icon,
    required String label,
    required String sublabel,
    required Color color,
    required ColorScheme cs,
  }) {
    return Flexible(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.15)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 6),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: color,
                      fontFamily: 'Cairo',
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    sublabel,
                    style: TextStyle(
                      fontSize: 9,
                      color: cs.onSurfaceVariant,
                      fontFamily: 'Tajawal',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionIndicator(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: cs.outline.withValues(alpha: 0.08)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.layers_rounded, size: 14, color: cs.onSurfaceVariant),
              const SizedBox(width: 6),
              Text(
                'القسم ${widget.currentSection + 1} من ${widget.totalSections}',
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'Tajawal',
                  color: cs.onSurfaceVariant,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // شريط الأقسام
          Row(
            children: List.generate(widget.totalSections, (index) {
              final isCurrent = index == widget.currentSection;
              final isPast = index < widget.currentSection;

              return Expanded(
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  height: 4,
                  margin: EdgeInsets.only(
                    right: index < widget.totalSections - 1 ? 4 : 0,
                  ),
                  decoration: BoxDecoration(
                    color: isCurrent
                        ? AppTheme.primaryColor
                        : isPast
                            ? AppTheme.successColor
                            : cs.outline.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(2),
                    boxShadow: isCurrent
                        ? [
                            BoxShadow(
                              color: AppTheme.primaryColor.withValues(alpha: 0.4),
                              blurRadius: 4,
                            ),
                          ]
                        : null,
                  ),
                ),
              );
            }),
          ),
        ],
      ),
    );
  }
}
