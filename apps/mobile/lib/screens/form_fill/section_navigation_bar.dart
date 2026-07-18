import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// شريط التنقل بين الأقسام — احترافي وتفاعلي
/// ═══════════════════════════════════════════════════════════
class SectionNavigationBar extends StatefulWidget {
  final List<SectionNavItem> sections;
  final int currentIndex;
  final ValueChanged<int> onSectionTap;
  final VoidCallback? onNext;
  final VoidCallback? onPrevious;

  const SectionNavigationBar({
    super.key,
    required this.sections,
    required this.currentIndex,
    required this.onSectionTap,
    this.onNext,
    this.onPrevious,
  });

  @override
  State<SectionNavigationBar> createState() => _SectionNavigationBarState();
}

class _SectionNavigationBarState extends State<SectionNavigationBar>
    with SingleTickerProviderStateMixin {
  late ScrollController _scrollController;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _scrollToIndex(int index) {
    if (!_scrollController.hasClients) return;
    final targetOffset = (index * 72.0) - (MediaQuery.of(context).size.width / 2) + 36;
    _scrollController.animateTo(
      targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  void didUpdateWidget(SectionNavigationBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.currentIndex != widget.currentIndex) {
      _scrollToIndex(widget.currentIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Container(
      height: 72,
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // زر السابق
          _buildNavButton(
            icon: Icons.chevron_right_rounded, // RTL: right = previous
            onTap: widget.currentIndex > 0 ? widget.onPrevious : null,
            cs: cs,
          ),
          // شريط الأقسام
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              itemCount: widget.sections.length,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              itemBuilder: (context, index) {
                return _buildSectionChip(widget.sections[index], index, cs);
              },
            ),
          ),
          // زر التالي
          _buildNavButton(
            icon: Icons.chevron_left_rounded, // RTL: left = next
            onTap: widget.currentIndex < widget.sections.length - 1
                ? widget.onNext
                : null,
            cs: cs,
          ),
        ],
      ),
    );
  }

  Widget _buildSectionChip(SectionNavItem section, int index, ColorScheme cs) {
    final isActive = index == widget.currentIndex;
    final isCompleted = section.isCompleted;
    final isPartial = section.isPartial;
    final hasError = section.hasRequiredMissing;

    Color chipColor;
    Color textColor;
    Color iconBg;
    IconData statusIcon;

    if (isActive) {
      chipColor = AppTheme.primaryColor;
      textColor = Colors.white;
      iconBg = Colors.white.withValues(alpha: 0.25);
      statusIcon = Icons.edit_rounded;
    } else if (hasError) {
      chipColor = AppTheme.errorColor.withValues(alpha: 0.1);
      textColor = AppTheme.errorColor;
      iconBg = AppTheme.errorColor.withValues(alpha: 0.15);
      statusIcon = Icons.error_outline_rounded;
    } else if (isCompleted) {
      chipColor = AppTheme.successColor.withValues(alpha: 0.1);
      textColor = AppTheme.successColor;
      iconBg = AppTheme.successColor.withValues(alpha: 0.15);
      statusIcon = Icons.check_rounded;
    } else if (isPartial) {
      chipColor = Colors.amber.withValues(alpha: 0.1);
      textColor = Colors.amber.shade700;
      iconBg = Colors.amber.withValues(alpha: 0.15);
      statusIcon = Icons.edit_note_rounded;
    } else {
      chipColor = cs.surfaceContainerHighest.withValues(alpha: 0.5);
      textColor = cs.onSurfaceVariant;
      iconBg = cs.primaryContainer.withValues(alpha: 0.3);
      statusIcon = Icons.circle_outlined;
    }

    return GestureDetector(
      onTap: () => widget.onSectionTap(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        margin: const EdgeInsets.symmetric(horizontal: 3),
        padding: EdgeInsets.symmetric(
          horizontal: isActive ? 14 : 10,
          vertical: 6,
        ),
        decoration: BoxDecoration(
          color: chipColor,
          borderRadius: BorderRadius.circular(20),
          border: isActive
              ? Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.5), width: 1.5)
              : hasError
                  ? Border.all(color: AppTheme.errorColor.withValues(alpha: 0.3), width: 1)
                  : null,
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppTheme.primaryColor.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            // رقم القسم مع أيقونة الحالة
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Center(
                child: isActive
                    ? Icon(statusIcon, size: 14, color: textColor)
                    : Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: textColor,
                          fontFamily: 'Cairo',
                        ),
                      ),
              ),
            ),
            if (isActive) ...[
              const SizedBox(width: 8),
              // عنوان القسم (يظهر فقط للقسم النشط)
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 120),
                child: Text(
                  section.title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: textColor,
                    fontFamily: 'Tajawal',
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNavButton({
    required IconData icon,
    required VoidCallback? onTap,
    required ColorScheme cs,
  }) {
    final isEnabled = onTap != null;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: 40,
          height: 40,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: isEnabled
                ? AppTheme.primaryColor.withValues(alpha: 0.1)
                : cs.surfaceContainerHighest.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(
            icon,
            size: 22,
            color: isEnabled ? AppTheme.primaryColor : cs.onSurfaceVariant.withValues(alpha: 0.3),
          ),
        ),
      ),
    );
  }
}

/// بيانات عنصر التنقل
class SectionNavItem {
  final String key;
  final String title;
  final int totalFields;
  final int filledFields;
  final int requiredFields;
  final int filledRequiredFields;
  final int yesNoFields;
  final int yesCount;

  const SectionNavItem({
    required this.key,
    required this.title,
    required this.totalFields,
    required this.filledFields,
    required this.requiredFields,
    required this.filledRequiredFields,
    this.yesNoFields = 0,
    this.yesCount = 0,
  });

  /// هل القسم مكتمل (كل الحقول المطلوبة معبأة)
  bool get isCompleted =>
      requiredFields > 0 && filledRequiredFields == requiredFields;

  /// هل القسم معبأ جزئياً
  bool get isPartial => filledFields > 0 && !isCompleted;

  /// هل يوجد حقول مطلوبة ناقصة
  bool get hasRequiredMissing =>
      requiredFields > 0 && filledRequiredFields < requiredFields;

  /// نسبة الإكمال
  double get completionRate =>
      totalFields > 0 ? filledFields / totalFields : 0;

  /// نسبة الالتزام (للأقسام التي تحتوي yes/no)
  int get complianceRate =>
      yesNoFields > 0 ? (yesCount / yesNoFields * 100).round() : 0;
}
