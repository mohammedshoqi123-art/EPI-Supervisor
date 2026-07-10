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
