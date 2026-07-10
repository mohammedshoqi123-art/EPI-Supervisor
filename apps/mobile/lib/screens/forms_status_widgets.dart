import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:epi_shared/epi_shared.dart';

/// ═══════════════════════════════════════════════════════════
/// Forms Status — Summary Cards (top of screen)
/// 3 cards: Drafts / Pending / Submitted — tappable to switch tabs
/// ═══════════════════════════════════════════════════════════

class StatusSummaryCards extends StatelessWidget {
  final int draftCount;
  final int pendingCount;
  final int submittedCount;
  final int selectedIndex;
  final Function(int) onTap;

  const StatusSummaryCards({
    super.key,
    required this.draftCount,
    required this.pendingCount,
    required this.submittedCount,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _card(
            0, 'مسودة', draftCount,
            const Color(0xFFF59E0B), Icons.edit_note_rounded,
          ),
          const SizedBox(width: 8),
          _card(
            1, 'مزامنة', pendingCount,
            const Color(0xFF3B82F6), Icons.cloud_sync_rounded,
          ),
          const SizedBox(width: 8),
          _card(
            2, 'مرسلة', submittedCount,
            const Color(0xFF22C55E), Icons.check_circle_rounded,
          ),
        ],
      ),
    );
  }

  Widget _card(int index, String label, int count, Color color, IconData icon) {
    final isSelected = selectedIndex == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap(index);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? color : Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: isSelected ? 0.3 : 0.1),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : color),
              const SizedBox(height: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: isSelected ? Colors.white : color,
                ),
              ),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 10,
                  color: isSelected ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF9CA3AF),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Level Filter Chips — الكل / إرسالياتي / أعلى / أدنى
/// ═══════════════════════════════════════════════════════════

class LevelFilterChips extends StatelessWidget {
  final String selected;
  final Function(String) onChanged;
  final String userRole;

  const LevelFilterChips({
    super.key,
    required this.selected,
    required this.onChanged,
    required this.userRole,
  });

  @override
  Widget build(BuildContext context) {
    // Determine which chips to show based on user role
    final chips = <(String value, String label, IconData icon)>[];

    chips.add(('all', 'الكل', Icons.list_rounded));
    chips.add(('mine', 'إرسالياتي', Icons.person_rounded));

    // "أعلى" — show if user is NOT admin/central
    if (userRole != 'admin' && userRole != 'central') {
      chips.add(('above', 'أعلى', Icons.arrow_upward_rounded));
    }

    // "أدنى" — show if user is NOT data_entry
    if (userRole != 'data_entry') {
      chips.add(('below', 'أدنى', Icons.arrow_downward_rounded));
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: chips.map((chip) {
            final isSelected = selected == chip.$1;
            return Padding(
              padding: const EdgeInsets.only(left: 6),
              child: GestureDetector(
                onTap: () {
                  HapticFeedback.lightImpact();
                  onChanged(chip.$1);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primaryColor : AppTheme.primaryColor.withValues(alpha: 0.06),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? AppTheme.primaryColor : AppTheme.primaryColor.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(chip.$3, size: 14, color: isSelected ? Colors.white : AppTheme.primaryColor),
                      const SizedBox(width: 4),
                      Text(
                        chip.$2,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : AppTheme.primaryColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Improved Draft Card — with progress bar + 3 action buttons
/// ═══════════════════════════════════════════════════════════

class DraftCard extends StatelessWidget {
  final Map<String, dynamic> draft;
  final VoidCallback onContinue;
  final VoidCallback onDelete;
  final VoidCallback onSubmit;

  const DraftCard({
    super.key,
    required this.draft,
    required this.onContinue,
    required this.onDelete,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final formTitle = draft['form_title'] as String? ?? 'استمارة';
    final savedAt = draft['saved_at'] as String? ?? '';
    final data = draft['data'] as Map<String, dynamic>? ?? {};

    // Calculate completion percentage
    final totalFields = data.length;
    final filledFields = data.values.where((v) {
      if (v == null) return false;
      if (v is String) return v.isNotEmpty;
      if (v is List) return v.isNotEmpty;
      if (v is bool) return true;
      return v != null;
    }).length;
    final completion = totalFields > 0 ? (filledFields / totalFields * 100).round() : 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.edit_note_rounded, color: Color(0xFFF59E0B), size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(formTitle, style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                      if (savedAt.isNotEmpty)
                        Text('📅 ${savedAt.split('T').first}', style: const TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: Color(0xFF9CA3AF))),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            // Progress bar
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: completion / 100,
                      backgroundColor: const Color(0xFFF59E0B).withValues(alpha: 0.08),
                      valueColor: const AlwaysStoppedAnimation(Color(0xFFF59E0B)),
                      minHeight: 6,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text('$completion%', style: const TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B))),
              ],
            ),
            const SizedBox(height: 10),
            // Action buttons
            Row(
              children: [
                Expanded(
                  child: _actionBtn('متابعة', Icons.edit_rounded, AppTheme.primaryColor, onContinue),
                ),
                const SizedBox(width: 6),
                _actionBtn('إرسال', Icons.send_rounded, const Color(0xFF22C55E), onSubmit),
                const SizedBox(width: 6),
                _actionBtn('حذف', Icons.delete_outline_rounded, const Color(0xFFEF4444), onDelete),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionBtn(String label, IconData icon, Color color, VoidCallback onTap) {
    if (label == 'متابعة') {
      return FilledButton.icon(
        onPressed: onTap,
        style: FilledButton.styleFrom(
          backgroundColor: color,
          padding: const EdgeInsets.symmetric(vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
        icon: Icon(icon, size: 14),
        label: Text(label, style: const TextStyle(fontFamily: 'Cairo', fontSize: 11, fontWeight: FontWeight.w600)),
      );
    }
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Icon(icon, size: 14, color: color),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Improved Submitted Card — with supervisor name + level badge
/// ═══════════════════════════════════════════════════════════

class SubmittedCard extends StatelessWidget {
  final Map<String, dynamic> submission;
  final VoidCallback onTap;

  const SubmittedCard({
    super.key,
    required this.submission,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final formTitle = (submission['forms']?['title_ar'] ?? submission['form_title'] ?? 'استمارة') as String;
    final createdAt = (submission['created_at'] as String? ?? '').split('T').first;
    final govName = (submission['governorates']?['name_ar'] ?? submission['governorate_name'] ?? '') as String;
    final distName = (submission['districts']?['name_ar'] ?? submission['district_name'] ?? '') as String;
    final submitterName = (submission['profiles']?['full_name'] ?? submission['submitter_name'] ?? '') as String;
    final submitterRole = (submission['profiles']?['role'] ?? submission['submitter_role'] ?? '') as String;

    // Level badge
    final (levelLabel, levelColor) = _getLevelInfo(submitterRole);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFF22C55E).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.check_circle_rounded, color: Color(0xFF22C55E), size: 18),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(formTitle, style: const TextStyle(fontFamily: 'Cairo', fontSize: 13, fontWeight: FontWeight.w700),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text('📅 $createdAt', style: const TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: Color(0xFF9CA3AF))),
                      ],
                    ),
                  ),
                  // Level badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: levelColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: levelColor.withValues(alpha: 0.2)),
                    ),
                    child: Text(levelLabel, style: TextStyle(fontFamily: 'Cairo', fontSize: 9, fontWeight: FontWeight.w700, color: levelColor)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Info row
              Row(
                children: [
                  if (submitterName.isNotEmpty) ...[
                    Icon(Icons.person_rounded, size: 12, color: Colors.grey[400]),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(submitterName, style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: Colors.grey[600]),
                        maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                  if (govName.isNotEmpty) ...[
                    const SizedBox(width: 10),
                    Icon(Icons.location_on_rounded, size: 12, color: Colors.grey[400]),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        distName.isNotEmpty ? '$govName — $distName' : govName,
                        style: TextStyle(fontFamily: 'Tajawal', fontSize: 11, color: Colors.grey[600]),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
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

  (String, Color) _getLevelInfo(String role) {
    switch (role) {
      case 'admin':
      case 'central':
        return ('مركزي', const Color(0xFFEF4444));
      case 'governorate':
        return ('محافظة', const Color(0xFF3B82F6));
      case 'district':
        return ('مديرية', const Color(0xFF10B981));
      case 'data_entry':
        return ('ميداني', const Color(0xFFF59E0B));
      default:
        return ('—', const Color(0xFF6B7280));
    }
  }
}

/// ═══════════════════════════════════════════════════════════
/// Search Bar — shared across all tabs
/// ═══════════════════════════════════════════════════════════

class StatusSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onChanged;

  const StatusSearchBar({
    super.key,
    required this.controller,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: TextField(
        controller: controller,
        onChanged: (_) => onChanged(),
        style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
        decoration: InputDecoration(
          hintText: 'بحث: نموذج، محافظة، مشرف...',
          hintStyle: const TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: Color(0xFF9CA3AF)),
          prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF9CA3AF)),
          suffixIcon: controller.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear_rounded, size: 18),
                  onPressed: () { controller.clear(); onChanged(); },
                )
              : null,
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════════
///  Forms Status Screen — Extracted Widgets
///
///  These widgets were extracted from forms_status_screen.dart
///  to reduce file size and improve maintainability.
///  The screen logic remains in forms_status_screen.dart.
/// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// STAT CARD — بطاقة الإحصائيات في أعلى الشاشة
// ═══════════════════════════════════════════════════════════════════════════

class FormsStatCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final Color color;
  final LinearGradient gradient;
  final VoidCallback? onTap;

  const FormsStatCard({
    super.key,
    required this.title,
    required this.count,
    required this.icon,
    required this.color,
    required this.gradient,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: onTap != null,
      label: '$title: $count',
      hint: onTap != null ? 'انقر للتفاصيل' : null,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            gradient: gradient,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: color.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Icon(icon, color: Colors.white, size: 22),
              const SizedBox(height: 8),
              Text(
                '$count',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 10,
                  color: Colors.white.withValues(alpha: 0.9),
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// NAV BUTTON — أزرار التالي/السابق للترقيم
// ═══════════════════════════════════════════════════════════════════════════

class FormsNavButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onTap;

  const FormsNavButton({
    super.key,
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      child: GestureDetector(
        onTap: enabled ? onTap : null,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: enabled
                ? AppTheme.primaryColor.withValues(alpha: 0.1)
                : AppTheme.backgroundLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: enabled
                  ? AppTheme.primaryColor.withValues(alpha: 0.3)
                  : Colors.grey.shade200,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 14,
                color: enabled ? AppTheme.primaryColor : AppTheme.textHint,
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: enabled ? AppTheme.primaryColor : AppTheme.textHint,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAFT TILE — عنصر المسودة في قائمة المسودات
// ═══════════════════════════════════════════════════════════════════════════

class DraftTile extends StatelessWidget {
  final String title;
  final String formId;
  final String? date;
  final VoidCallback onTap;

  const DraftTile({
    super.key,
    required this.title,
    required this.formId,
    this.date,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'مسودة: $title',
      hint: 'انقر للتعديل',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
          border: Border.all(
            color: AppTheme.warningColor.withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.warningColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.edit_note,
                    color: AppTheme.warningColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const EpiStatusChip(status: 'draft', small: true),
                          if (date != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              FormsStatusDateUtils.formatDateTime(date!),
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 10,
                                color: AppTheme.textHint,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primarySurface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.edit,
                    size: 16,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PENDING TILE — عنصر قيد المزامنة في قائمة المزامنة
// ═══════════════════════════════════════════════════════════════════════════

class PendingTile extends StatelessWidget {
  final String title;
  final String status;
  final String? date;
  final int retryCount;
  final VoidCallback onTap;

  const PendingTile({
    super.key,
    required this.title,
    required this.status,
    this.date,
    required this.retryCount,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: 'قيد المزامنة: $title',
      hint: retryCount > 0 ? 'محاولة $retryCount' : 'بانتظار المزامنة',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
          border: Border.all(
            color: AppTheme.infoColor.withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.infoColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      color: AppTheme.infoColor,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.infoColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.sync,
                                    size: 12, color: AppTheme.infoColor),
                                SizedBox(width: 4),
                                Text(
                                  'بانتظار المزامنة',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 11,
                                    color: AppTheme.infoColor,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (retryCount > 0) ...[
                            const SizedBox(width: 8),
                            Text(
                              'محاولة $retryCount',
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 10,
                                color: AppTheme.errorColor,
                              ),
                            ),
                          ],
                          if (date != null) ...[
                            const SizedBox(width: 8),
                            Text(
                              FormsStatusDateUtils.formatDate(date!),
                              style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 10,
                                color: AppTheme.textHint,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: AppTheme.textHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBMITTED TILE — عنصر الإرسالية في قائمة المرسلة
// ═══════════════════════════════════════════════════════════════════════════

class SubmittedTile extends StatelessWidget {
  final String title;
  final String status;
  final String? date;
  final String? userName;
  final bool isOffline;
  final VoidCallback onTap;

  const SubmittedTile({
    super.key,
    required this.title,
    required this.status,
    this.date,
    this.userName,
    this.isOffline = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '$title — ${_statusLabel(status)}',
      hint: 'انقر للتفاصيل',
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
          border: Border.all(
            color: AppTheme.statusColor(status).withValues(alpha: 0.2),
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: AppTheme.statusColor(status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    _statusIcon(status),
                    color: AppTheme.statusColor(status),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              title,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          if (isOffline)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.orange.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.wifi_off,
                                    size: 10,
                                    color: Colors.orange,
                                  ),
                                  SizedBox(width: 3),
                                  Text(
                                    'أوفلاين',
                                    style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 9,
                                      color: Colors.orange,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          EpiStatusChip(status: status, small: true),
                          if (userName != null) ...[
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                userName!,
                                style: const TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 11,
                                  color: AppTheme.textSecondary,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ],
                      ),
                      if (date != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          FormsStatusDateUtils.formatDateTime(date!),
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: AppTheme.textHint,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(
                  Icons.arrow_forward_ios,
                  size: 14,
                  color: AppTheme.textHint,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'approved':
        return Icons.check_circle;
      case 'rejected':
        return Icons.cancel;
      case 'submitted':
        return Icons.send;
      case 'reviewed':
        return Icons.rate_review;
      case 'draft':
        return Icons.edit_note;
      default:
        return Icons.description;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'approved':
        return 'معتمد';
      case 'rejected':
        return 'مرفوض';
      case 'submitted':
        return 'مرسل';
      case 'reviewed':
        return 'مراجَع';
      case 'draft':
        return 'مسودة';
      default:
        return status;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PICKER SHEET — قائمة اختيار منسدلة
// ═══════════════════════════════════════════════════════════════════════════

class PickerItem {
  final String? id;
  final String label;

  const PickerItem({required this.id, required this.label});
}

class PickerSheet extends StatelessWidget {
  final String title;
  final List<PickerItem> items;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  const PickerSheet({
    super.key,
    required this.title,
    required this.items,
    required this.selectedId,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          Flexible(
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: items.length,
              itemBuilder: (context, index) {
                final item = items[index];
                final isSelected = item.id == selectedId;
                return Semantics(
                  button: true,
                  selected: isSelected,
                  label: item.label,
                  child: ListTile(
                    title: Text(
                      item.label,
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 14,
                        fontWeight:
                            isSelected ? FontWeight.w700 : FontWeight.normal,
                        color: isSelected
                            ? AppTheme.primaryColor
                            : AppTheme.textPrimary,
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle,
                            color: AppTheme.primaryColor)
                        : null,
                    onTap: () => onSelected(item.id),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE UTILS — أدوات تنسيق التاريخ
// ═══════════════════════════════════════════════════════════════════════════

class FormsStatusDateUtils {
  /// Format date as: DD/MM/YYYY - HH:MM
  static String formatDateTime(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year} - '
        '${d.hour.toString().padLeft(2, '0')}:'
        '${d.minute.toString().padLeft(2, '0')}';
  }

  /// Format date as: DD/MM/YYYY
  static String formatDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day}/${d.month}/${d.year}';
  }
}
