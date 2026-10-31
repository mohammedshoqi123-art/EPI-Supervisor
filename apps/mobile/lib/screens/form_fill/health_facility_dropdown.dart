import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import '../../providers/app_providers.dart';

/// المرفق الصحي dropdown — depends on selected district.
/// Shows placeholder if no district is selected.
/// When [allowCustom] is true, offers "أخرى" to add a facility
/// that is not in the list (stored as its name in form data).
class HealthFacilityDropdown extends ConsumerWidget {
  final String? districtId;
  final String? value;
  final ValueChanged<String?> onChanged;
  final bool isRequired;
  final bool allowCustom;

  const HealthFacilityDropdown({
    super.key,
    required this.districtId,
    required this.value,
    required this.onChanged,
    required this.isRequired,
    this.allowCustom = false,
  });

  /// Custom values are free text (facility names), never UUIDs.
  bool get _isCustomValue =>
      value != null && value!.isNotEmpty && !_isUuid(value!);

  static bool _isUuid(String s) {
    return RegExp(
            r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$')
        .hasMatch(s);
  }

  Future<void> _showCustomDialog(BuildContext context) async {
    final controller = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة مرفق صحي آخر',
            style: TextStyle(fontFamily: 'Tajawal', fontSize: 17)),
        content: TextField(
          controller: controller,
          autofocus: true,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(
            hintText: 'اكتب اسم المرفق الصحي',
            border: OutlineInputBorder(),
          ),
          style: const TextStyle(fontFamily: 'Tajawal'),
          onSubmitted: (v) => Navigator.of(ctx).pop(v),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('إلغاء', style: TextStyle(fontFamily: 'Tajawal')),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(ctx).pop(controller.text.trim()),
            child: const Text('إضافة', style: TextStyle(fontFamily: 'Tajawal')),
          ),
        ],
      ),
    );
    if (name != null && name.isNotEmpty) {
      onChanged(name);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (districtId == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          'اختر المديرية أولاً',
          style: TextStyle(fontFamily: 'Tajawal', color: Colors.grey.shade500),
        ),
      );
    }

    final facilitiesAsync = ref.watch(healthFacilitiesProvider(districtId));

    return facilitiesAsync.when(
      loading: () => const LinearProgressIndicator(),
      error: (e, _) =>
          Text('خطأ: $e', style: const TextStyle(color: Colors.red)),
      data: (facilities) {
        if (facilities.isEmpty && !allowCustom) {
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'لا توجد مرافق صحية لهذه المديرية',
              style: TextStyle(
                fontFamily: 'Tajawal',
                color: Colors.grey.shade500,
              ),
            ),
          );
        }
        final items = <DropdownMenuItem<String>>[];
        // عرض القيمة المخصصة المحفوظة (اسم مرفق غير موجود بالقائمة)
        if (_isCustomValue) {
          items.add(DropdownMenuItem(
            value: value,
            child: Text(
              '📌 $value',
              style: const TextStyle(fontFamily: 'Tajawal'),
              overflow: TextOverflow.ellipsis,
            ),
          ));
        }
        for (final f in facilities) {
          final typeIcon = f['type'] == 'hospital' ? '🏥' : '🏩';
          items.add(DropdownMenuItem(
            value: f['id'] as String,
            child: Text(
              '$typeIcon ${f['name_ar']}',
              style: const TextStyle(fontFamily: 'Tajawal'),
              overflow: TextOverflow.ellipsis,
            ),
          ));
        }
        if (allowCustom) {
          items.add(const DropdownMenuItem(
            value: '__other__',
            child: Text(
              '➕ أخرى — إضافة مرفق غير موجود بالقائمة',
              style: TextStyle(fontFamily: 'Tajawal'),
              overflow: TextOverflow.ellipsis,
            ),
          ));
        }
        return EpiDropdown<String>(
          hint: 'اختر المرفق الصحي',
          value: value,
          items: items,
          onChanged: (v) {
            if (v == '__other__') {
              _showCustomDialog(context);
            } else {
              onChanged(v);
            }
          },
          validator:
              isRequired ? (v) => v == null ? AppStrings.required : null : null,
        );
      },
    );
  }
}
