import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// القفز السريع بين الأقسام — قائمة منسدلة للقفز لأي قسم
/// Quick Section Jump — dropdown menu to jump to any section
/// ═══════════════════════════════════════════════════════════

class QuickSectionJump extends StatelessWidget {
  final List<QuickSection> sections;
  final int currentSection;
  final void Function(int index) onJump;

  const QuickSectionJump({
    super.key,
    required this.sections,
    required this.currentSection,
    required this.onJump,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showJumpPanel(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.primaryColor.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          children: [
            Icon(
              Icons.menu_book_rounded,
              size: 18,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                '${currentSection + 1}. ${sections[currentSection].title}',
                style: TextStyle(
                  fontSize: 13,
                  fontFamily: 'Tajawal',
                  fontWeight: FontWeight.w600,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 20,
              color: AppTheme.primaryColor,
            ),
          ],
        ),
      ),
    );
  }

  void _showJumpPanel(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        height: MediaQuery.of(ctx).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Title
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.menu_book_rounded,
                      size: 20, color: AppTheme.primaryColor),
                  const SizedBox(width: 8),
                  const Text(
                    'الانتقال السريع',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Sections list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: sections.length,
                itemBuilder: (ctx, i) {
                  final s = sections[i];
                  final isCurrent = i == currentSection;

                  return GestureDetector(
                    onTap: () {
                      Navigator.pop(ctx);
                      onJump(i);
                    },
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 6),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isCurrent
                            ? AppTheme.primaryColor.withValues(alpha: 0.08)
                            : s.isComplete
                                ? AppTheme.successColor.withValues(alpha: 0.04)
                                : null,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isCurrent
                              ? AppTheme.primaryColor.withValues(alpha: 0.3)
                              : Colors.grey.shade200,
                        ),
                      ),
                      child: Row(
                        children: [
                          // Number badge
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? AppTheme.primaryColor
                                  : s.isComplete
                                      ? AppTheme.successColor
                                          .withValues(alpha: 0.15)
                                      : Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Center(
                              child: Text(
                                '${i + 1}',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                  color: isCurrent
                                      ? Colors.white
                                      : s.isComplete
                                          ? AppTheme.successColor
                                          : Colors.grey.shade600,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          // Title
                          Expanded(
                            child: Text(
                              s.title,
                              style: TextStyle(
                                fontSize: 13,
                                fontFamily: 'Tajawal',
                                fontWeight:
                                    isCurrent ? FontWeight.bold : FontWeight.normal,
                                color: isCurrent
                                    ? AppTheme.primaryColor
                                    : Colors.black87,
                              ),
                            ),
                          ),
                          // Status
                          if (s.isComplete)
                            Icon(Icons.check_circle,
                                size: 18, color: AppTheme.successColor)
                          else if (isCurrent)
                            Icon(Icons.arrow_left_rounded,
                                size: 22, color: AppTheme.primaryColor)
                          else
                            Icon(Icons.circle_outlined,
                                size: 16, color: Colors.grey.shade300),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// ═══ Quick Section model ═══
class QuickSection {
  final String id;
  final String title;
  final bool isComplete;

  const QuickSection({
    required this.id,
    required this.title,
    this.isComplete = false,
  });
}
