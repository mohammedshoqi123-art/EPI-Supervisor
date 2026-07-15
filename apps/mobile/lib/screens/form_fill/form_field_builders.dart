import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:epi_shared/epi_shared.dart';
import 'governorate_dropdown.dart';
import 'district_dropdown.dart';
import 'health_facility_dropdown.dart';
import 'photo_picker_field.dart';
import 'compact_yesno_table.dart';
import 'compact_numbers_grid.dart';

/// Builds section headers for grouped form fields.
List<Widget> buildFormSections({
  required List<dynamic> sections,
  required Map<String, dynamic> formData,
  required Map<String, TextEditingController> textControllers,
  required bool isGettingLocation,
  required double? gpsLat,
  required double? gpsLng,
  required List<dynamic> flatFields,
  required VoidCallback markChanged,
  required VoidCallback getLocation,
  required void Function(VoidCallback) runSetState,
  required Map<String, dynamic>? formSchema,
  required Map<String, List<XFile>> photosByField,
}) {
  final widgets = <Widget>[];

  final sortedSections = List.from(sections);
  sortedSections.sort(
    (a, b) => (a['order'] as int? ?? 0).compareTo(b['order'] as int? ?? 0),
  );

  for (int secIdx = 0; secIdx < sortedSections.length; secIdx++) {
    final section = sortedSections[secIdx];
    final title = section['title_ar'] as String? ?? '';
    final fields =
        (section['fields'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    // ═══ تجميع الحقول المتشابهة في مجموعات مع دعم showIf ═══
    // المجموعة 1: yesno fields → CompactYesNoTable
    // المجموعة 2: number fields → CompactNumbersGrid
    // المجموعة 3: باقي الحقول → عرض فردي

    // فصل الحقول إلى مجموعات مع تطبيق showIf
    final yesNoFields = <Map<String, dynamic>>[];
    final numberFields = <Map<String, dynamic>>[];
    final otherFields = <Map<String, dynamic>>[];

    for (final field in fields) {
      final type = field['type'] as String? ?? 'text';

      // ═══ دعم الإظهار الشرطي (showIf) ═══
      final showIf = field['showIf'] as Map<String, dynamic>?;
      if (showIf != null) {
        final condField = showIf['field'] as String?;
        final condValue = showIf['value'];
        if (condField != null) {
          final currentValue = formData[condField];
          // إذا القيمة لا تطابق الشرط، لا نضمّن الحقل
          if (currentValue != condValue) {
            continue;
          }
        }
      }

      if (type == 'yesno') {
        yesNoFields.add(field);
      } else if (type == 'number') {
        numberFields.add(field);
      } else {
        otherFields.add(field);
      }
    }

    // عرض عنوان القسم
    widgets.add(
      Container(
        margin: const EdgeInsets.only(bottom: 12, top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 4,
              height: 24,
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );

    // عرض حقول نعم/لا كجدول مدمج
    if (yesNoFields.isNotEmpty) {
      widgets.add(CompactYesNoTable(
        sectionTitle: title,
        sectionNumber: secIdx + 1,
        items: yesNoFields
            .map((f) => YesNoItem(
                  key: f['key'] as String,
                  label: f['label_ar'] as String? ?? '',
                  required: f['required'] as bool? ?? false,
                ))
            .toList(),
        formData: formData,
        onChanged: (key, value) {
          formData[key] = value;
        },
        markChanged: markChanged,
      ));
    }

    // عرض حقول الأعداد كشبكة مدمجة
    if (numberFields.isNotEmpty) {
      widgets.add(CompactNumbersGrid(
        sectionTitle: title,
        sectionNumber: secIdx + 1,
        items: numberFields
            .map((f) => NumberItem(
                  key: f['key'] as String,
                  label: f['label_ar'] as String? ?? '',
                  required: f['required'] as bool? ?? false,
                ))
            .toList(),
        formData: formData,
        textControllers: textControllers,
        onChanged: (key, value) {
          formData[key] = value;
        },
        markChanged: markChanged,
      ));
    }

    // عرض باقي الحقول فردياً مع دعم showIf
    for (final field in otherFields) {
      // ═══ دعم الإظهار الشرطي (showIf) ═══
      final showIf = field['showIf'] as Map<String, dynamic>?;
      if (showIf != null) {
        final condField = showIf['field'] as String?;
        final condValue = showIf['value'];
        if (condField != null) {
          final currentValue = formData[condField];
          // إذا القيمة لا تطابق الشرط، لا تعرض الحقل
          if (currentValue != condValue) {
            continue; // تخطي هذا الحقل
          }
        }
      }

      widgets.add(
        buildFormField(
          field: field,
          formData: formData,
          textControllers: textControllers,
          isGettingLocation: isGettingLocation,
          gpsLat: gpsLat,
          gpsLng: gpsLng,
          markChanged: markChanged,
          getLocation: getLocation,
          runSetState: runSetState,
          formSchema: formSchema,
          photosByField: photosByField,
        ),
      );
    }

    widgets.add(const SizedBox(height: 8));
  }

  return widgets;
}

/// Builds a single form field widget based on its type.
Widget buildFormField({
  required Map<String, dynamic> field,
  required Map<String, dynamic> formData,
  required Map<String, TextEditingController> textControllers,
  required bool isGettingLocation,
  required double? gpsLat,
  required double? gpsLng,
  required VoidCallback markChanged,
  required VoidCallback getLocation,
  required void Function(VoidCallback) runSetState,
  required Map<String, dynamic>? formSchema,
  required Map<String, List<XFile>> photosByField,
}) {
  final key = field['key'] as String? ?? '';
  final type = field['type'] as String? ?? 'text';
  final label = field['label_ar'] as String? ?? key;
  final isRequired = field['required'] == true;
  final hint = field['hint'] as String?;

  return Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (isRequired)
              const Text(' *', style: TextStyle(color: AppTheme.errorColor)),
          ],
        ),
        const SizedBox(height: 8),
        _buildFieldInput(
          field: field,
          key: key,
          type: type,
          hint: hint,
          isRequired: isRequired,
          formData: formData,
          textControllers: textControllers,
          isGettingLocation: isGettingLocation,
          gpsLat: gpsLat,
          gpsLng: gpsLng,
          markChanged: markChanged,
          getLocation: getLocation,
          runSetState: runSetState,
          formSchema: formSchema,
          photosByField: photosByField,
        ),
      ],
    ),
  );
}

TextEditingController _getController(
  Map<String, TextEditingController> controllers,
  String key, {
  String? initialValue,
}) {
  if (!controllers.containsKey(key)) {
    controllers[key] = TextEditingController(text: initialValue ?? '');
  }
  return controllers[key]!;
}

Widget _buildFieldInput({
  required Map<String, dynamic> field,
  required String key,
  required String type,
  required String? hint,
  required bool isRequired,
  required Map<String, dynamic> formData,
  required Map<String, TextEditingController> textControllers,
  required bool isGettingLocation,
  required double? gpsLat,
  required double? gpsLng,
  required VoidCallback markChanged,
  required VoidCallback getLocation,
  required void Function(VoidCallback) runSetState,
  required Map<String, dynamic>? formSchema,
  required Map<String, List<XFile>> photosByField,
}) {
  switch (type) {
    case 'text':
      return EpiTextField(
        controller: _getController(
          textControllers,
          key,
          initialValue: formData[key]?.toString(),
        ),
        hint: hint,
        onChanged: (v) {
          formData[key] = v;
          markChanged();
        },
        validator: isRequired
            ? (v) => (v == null || v.isEmpty) ? AppStrings.required : null
            : null,
      );

    case 'phone':
      return EpiTextField(
        controller: _getController(
          textControllers,
          key,
          initialValue: formData[key]?.toString(),
        ),
        hint: hint ?? '7XXXXXXXX',
        keyboardType: TextInputType.phone,
        onChanged: (v) {
          formData[key] = v;
          markChanged();
        },
        validator: isRequired
            ? (v) {
                if (v == null || v.isEmpty) return AppStrings.required;
                if (!RegExp(r'^7\d{8}$').hasMatch(v))
                  return 'رقم الجوال غير صحيح — يجب أن يبدأ بـ 7 ويتكون من 9 أرقام';
                return null;
              }
            : null,
      );

    case 'textarea':
      return EpiTextField(
        controller: _getController(
          textControllers,
          key,
          initialValue: formData[key]?.toString(),
        ),
        hint: hint,
        maxLines: 4,
        onChanged: (v) {
          formData[key] = v;
          markChanged();
        },
        validator: isRequired
            ? (v) => (v == null || v.isEmpty) ? AppStrings.required : null
            : null,
      );

    case 'number':
      return EpiTextField(
        controller: _getController(
          textControllers,
          key,
          initialValue: formData[key]?.toString(),
        ),
        hint: hint,
        keyboardType: TextInputType.number,
        onChanged: (v) {
          formData[key] = num.tryParse(v);
          markChanged();
        },
        validator: isRequired
            ? (v) => (v == null || v.isEmpty) ? AppStrings.required : null
            : null,
      );

    case 'select':
      final options = (field['options'] as List?)?.cast<String>() ?? [];
      return EpiDropdown<String>(
        hint: hint,
        value: formData[key],
        items: options
            .map(
              (o) => DropdownMenuItem(
                value: o,
                child: Text(o, style: const TextStyle(fontFamily: 'Tajawal')),
              ),
            )
            .toList(),
        onChanged: (v) => runSetState(() {
          formData[key] = v;
          markChanged();
        }),
        validator:
            isRequired ? (v) => v == null ? AppStrings.required : null : null,
      );

    case 'multiselect':
      final options = (field['options'] as List?)?.cast<String>() ?? [];
      final selected = (formData[key] as List?)?.cast<String>() ?? [];
      return Wrap(
        spacing: 8,
        runSpacing: 4,
        children: options.map((o) {
          final isSelected = selected.contains(o);
          return FilterChip(
            label: Text(o, style: const TextStyle(fontFamily: 'Tajawal')),
            selected: isSelected,
            selectedColor: AppTheme.primaryColor.withValues(alpha: 0.2),
            checkmarkColor: AppTheme.primaryColor,
            onSelected: (sel) {
              runSetState(() {
                if (sel) {
                  selected.add(o);
                } else {
                  selected.remove(o);
                }
                formData[key] = selected;
                markChanged();
              });
            },
          );
        }).toList(),
      );

    case 'yesno':
      final currentValue = formData[key] as bool?;
      return Container(
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: InkWell(
                onTap: () => runSetState(() {
                  formData[key] = true;
                  markChanged();
                }),
                borderRadius: const BorderRadius.horizontal(
                  right: Radius.circular(12),
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: currentValue == true
                        ? AppTheme.successColor.withValues(alpha: 0.15)
                        : null,
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(11),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        currentValue == true
                            ? Icons.check_circle
                            : Icons.circle_outlined,
                        color: currentValue == true
                            ? AppTheme.successColor
                            : Colors.grey,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'نعم',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontWeight: currentValue == true
                              ? FontWeight.bold
                              : FontWeight.normal,
                          color: currentValue == true
                              ? AppTheme.successColor
                              : Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Container(width: 1, height: 40, color: Colors.grey.shade300),
            Expanded(
              child: InkWell(
                onTap: () => runSetState(() {
                  formData[key] = false;
                  markChanged();
                }),
                borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(12),
                ),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: currentValue == false
                        ? AppTheme.errorColor.withValues(alpha: 0.15)
                        : null,
                    borderRadius: const BorderRadius.horizontal(
                      left: Radius.circular(11),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        currentValue == false
                            ? Icons.cancel
                            : Icons.circle_outlined,
                        color: currentValue == false
                            ? AppTheme.errorColor
                            : Colors.grey,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'لا',
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontWeight: currentValue == false
                              ? FontWeight.bold
                              : FontWeight.normal,
                          color: currentValue == false
                              ? AppTheme.errorColor
                              : Colors.grey.shade700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      );

    case 'date':
      final dateValue = formData[key] as String?;
      return Builder(
        builder: (context) => InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(2020),
              lastDate: DateTime(2030),
              locale: const Locale('ar'),
            );
            if (date != null) {
              runSetState(() {
                formData[key] = date.toIso8601String().split('T')[0];
                markChanged();
              });
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              hintText: hint ?? 'اختر التاريخ',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              suffixIcon: const Icon(Icons.calendar_today, size: 20),
            ),
            child: Text(
              dateValue ?? hint ?? 'اختر التاريخ',
              style: TextStyle(
                fontFamily: 'Tajawal',
                color: dateValue != null ? Colors.black : Colors.grey,
              ),
            ),
          ),
        ),
      );

    case 'time':
      final timeValue = formData[key] as String?;
      return Builder(
        builder: (context) => InkWell(
          onTap: () async {
            final time = await showTimePicker(
              context: context,
              initialTime: TimeOfDay.now(),
            );
            if (time != null) {
              runSetState(() {
                formData[key] =
                    '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
                markChanged();
              });
            }
          },
          child: InputDecorator(
            decoration: InputDecoration(
              hintText: hint ?? 'اختر الوقت',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              suffixIcon: const Icon(Icons.access_time, size: 20),
            ),
            child: Text(
              timeValue ?? hint ?? 'اختر الوقت',
              style: TextStyle(
                fontFamily: 'Tajawal',
                color: timeValue != null ? Colors.black : Colors.grey,
              ),
            ),
          ),
        ),
      );

    case 'gps':
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.primarySurface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: AppTheme.primaryColor.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          children: [
            const Icon(Icons.location_on, color: AppTheme.primaryColor),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    gpsLat != null ? 'تم تحديد الموقع ✓' : 'انقر لتحديد الموقع',
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  if (gpsLat != null)
                    Text(
                      '${gpsLat.toStringAsFixed(6)}, ${gpsLng!.toStringAsFixed(6)}',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                ],
              ),
            ),
            isGettingLocation
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: AppTheme.primaryColor,
                    ),
                  )
                : IconButton(
                    icon: const Icon(
                      Icons.my_location,
                      color: AppTheme.primaryColor,
                    ),
                    onPressed: getLocation,
                    tooltip: 'تحديد الموقع',
                  ),
          ],
        ),
      );

    case 'governorate':
      return GovernorateDropdown(
        value: formData[key],
        onChanged: (v) => runSetState(() {
          formData[key] = v;
          formData['district_id'] = null;
          formData['district'] = null;
          markChanged();
        }),
        isRequired: isRequired,
      );

    case 'district':
      return DistrictDropdown(
        governorateId: formData['governorate_id'] as String?,
        value: formData[key],
        onChanged: (v) => runSetState(() {
          formData[key] = v;
          markChanged();
        }),
        isRequired: isRequired,
      );

    case 'health_facility':
      return HealthFacilityDropdown(
        districtId: formData['district_id'] as String?,
        value: formData[key],
        onChanged: (v) => runSetState(() {
          formData[key] = v;
          markChanged();
        }),
        isRequired: isRequired,
      );

    case 'photo':
      // ═══ FIX F1: Use per-field photo list instead of shared list ═══
      return PhotoPickerField(
        key: ValueKey('photo_$key'),
        photos: photosByField[key] ?? [],
        maxPhotos: (formSchema?['max_photos'] as int?) ?? 1,
        onPhotosChanged: (photos) {
          runSetState(() {
            photosByField[key] = List<XFile>.from(photos);
            formData[key] = photos.map((p) => p.path).toList();
            markChanged();
          });
        },
        isRequired: isRequired,
      );

    default:
      return EpiTextField(
        controller: _getController(
          textControllers,
          key,
          initialValue: formData[key]?.toString(),
        ),
        hint: hint,
        onChanged: (v) {
          formData[key] = v;
          markChanged();
        },
      );
  }
}
