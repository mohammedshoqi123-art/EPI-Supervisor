import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

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
