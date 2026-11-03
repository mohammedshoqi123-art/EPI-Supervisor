import 'package:flutter/material.dart';
import 'package:epi_core/epi_core.dart';
import 'package:epi_shared/epi_shared.dart';

class FormEditorScreen extends StatefulWidget {
  final Map<String, dynamic>? existingForm;
  const FormEditorScreen({super.key, this.existingForm});

  @override
  State<FormEditorScreen> createState() => _FormEditorScreenState();
}

class _FormEditorScreenState extends State<FormEditorScreen> {
  final _titleArController = TextEditingController();
  final _titleEnController = TextEditingController();
  final _descArController = TextEditingController();
  bool _requiresGps = false;
  bool _requiresPhoto = false;
  int _maxPhotos = 5;
  // ═══ Campaign type — was missing entirely: every new form silently landed
  // in polio_campaign (admin-only visible) and field users never saw it.
  String _campaignType = CampaignType.measlesCampaign.value;

  // Schema: flat fields OR sections
  List<Map<String, dynamic>> _fields = [];
  List<Map<String, dynamic>> _sections = [];
  bool _useSections = false;
  // ═══ FIX: تتبّع التعديلات غير المحفوظة — لحرس الخروج (PopScope) ═══
  bool _dirty = false;

  // Field type definitions
  static const _fieldTypes = {
    'text': {
      'label': 'نص',
      'icon': Icons.text_fields_rounded,
      'color': Colors.blue,
    },
    'number': {
      'label': 'رقم',
      'icon': Icons.numbers_rounded,
      'color': Colors.indigo,
    },
    'phone': {
      'label': 'جوال',
      'icon': Icons.phone_rounded,
      'color': Colors.green,
    },
    'textarea': {
      'label': 'نص طويل',
      'icon': Icons.notes_rounded,
      'color': Colors.teal,
    },
    'select': {
      'label': 'قائمة اختيار',
      'icon': Icons.arrow_drop_down_circle_rounded,
      'color': Colors.purple,
    },
    'multiselect': {
      'label': 'اختيار متعدد',
      'icon': Icons.checklist_rounded,
      'color': Colors.deepPurple,
    },
    'yesno': {
      'label': 'نعم / لا',
      'icon': Icons.toggle_on_rounded,
      'color': Colors.orange,
    },
    'date': {
      'label': 'تاريخ',
      'icon': Icons.calendar_today_rounded,
      'color': Colors.cyan,
    },
    'gps': {
      'label': 'موقع GPS',
      'icon': Icons.location_on_rounded,
      'color': Colors.red,
    },
    'photo': {
      'label': 'صورة',
      'icon': Icons.camera_alt_rounded,
      'color': Colors.amber,
    },
    // ═══ FIX: أنواع يدعمها محرك التعبئة وكانت مفقودة من قائمة المحرر ═══
    'email': {
      'label': 'بريد إلكتروني',
      'icon': Icons.email_rounded,
      'color': Colors.blueGrey,
    },
    'time': {
      'label': 'وقت',
      'icon': Icons.access_time_rounded,
      'color': Colors.brown,
    },
    'governorate': {
      'label': 'المحافظة',
      'icon': Icons.public_rounded,
      'color': Colors.green,
    },
    'district': {
      'label': 'القضاء',
      'icon': Icons.location_city_rounded,
      'color': Colors.lightGreen,
    },
    'health_facility': {
      'label': 'منشأة صحية',
      'icon': Icons.local_hospital_rounded,
      'color': Colors.redAccent,
    },
  };

  bool get _isEditing => widget.existingForm != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final f = widget.existingForm!;
      _titleArController.text = f['title_ar'] ?? '';
      _titleEnController.text = f['title_en'] ?? '';
      _descArController.text = f['description_ar'] ?? '';
      _requiresGps = f['requires_gps'] ?? false;
      _requiresPhoto = f['requires_photo'] ?? false;
      _maxPhotos = f['max_photos'] ?? 5;
      _campaignType = f['campaign_type'] as String? ??
          CampaignType.measlesCampaign.value;

      final schema = f['schema'] as Map<String, dynamic>? ?? {};
      final sections = schema['sections'] as List? ?? [];
      final flatFields = schema['fields'] as List? ?? [];

      if (sections.isNotEmpty) {
        _useSections = true;
        _sections = sections.map((s) {
          final m = Map<String, dynamic>.from(s as Map);
          // ✅ FIX: المحرك يقرأ title_ar — اعتمده احتياطياً من title القديم
          if ((m['title_ar'] as String? ?? '').trim().isEmpty) {
            m['title_ar'] = m['title'] ?? '';
          }
          return m;
        }).toList();
      } else {
        _useSections = false;
        _fields =
            flatFields.map((f) => Map<String, dynamic>.from(f as Map)).toList();
      }
    }
    // ═══ FIX: أي تعديل نصي يفعّل حرس التغييرات غير المحفوظة ═══
    _titleArController.addListener(_markDirty);
    _titleEnController.addListener(_markDirty);
    _descArController.addListener(_markDirty);
  }

  void _markDirty() {
    if (!_dirty) setState(() => _dirty = true);
  }

  @override
  void dispose() {
    _titleArController.dispose();
    _titleEnController.dispose();
    _descArController.dispose();
    super.dispose();
  }

  void _save() {
    if (_titleArController.text.trim().length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'العنوان مطلوب',
            style: TextStyle(fontFamily: 'Tajawal'),
          ),
          backgroundColor: AppTheme.errorColor,
        ),
      );
      return;
    }

    // ═══ FIX: ممنوع حفظ قائمة نشطة فارغة بينما الهيكل الآخر يحتوي محتوى —
    // كان التحويل بعد الإدخال يُفرغ الاستمارة كلياً عند الحفظ (فقدان بيانات) ═══
    final activeEmpty = _useSections ? _sections.isEmpty : _fields.isEmpty;
    final otherHasContent = _useSections
        ? _fields.isNotEmpty
        : _sections.any(
            (s) => ((s['fields'] as List?)?.isNotEmpty ?? false),
          );
    if (activeEmpty && otherHasContent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'يوجد محتوى في الهيكل الآخر — استخدم زر التحويل لنقله قبل الحفظ',
            style: TextStyle(fontFamily: 'Tajawal'),
          ),
          backgroundColor: AppTheme.errorColor,
          duration: Duration(seconds: 4),
        ),
      );
      return;
    }

    // ═══ FIX: تحقق شامل قبل الحفظ — مفاتيح مكررة / استمارة فارغة /
    // تسميات ناقصة / قوائم اختيار بلا خيارات ═══
    final problem = _validateForm();
    if (problem != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            problem,
            style: const TextStyle(fontFamily: 'Tajawal'),
          ),
          backgroundColor: AppTheme.errorColor,
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    // صريح النوع: ندمج لاحقاً مفاتيح قديمة + version (int) فلا يجوز
    // أن يُستنتج نوعه كـ Map<String, List<Map<...>>>
    final Map<String, dynamic> schema = _useSections
        ? {
            'sections': [
              for (int i = 0; i < _sections.length; i++)
                _sectionForSave(_sections[i], i),
            ],
          }
        : {'fields': _fields};

    // ═══ FIX: احتفظ بمفاتيح schema العليا الموجودة مسبقاً (إعدادات gps...) ═══
    Map<String, dynamic> oldSchema = {};
    if (_isEditing) {
      final raw = widget.existingForm!['schema'];
      if (raw is Map) oldSchema = Map<String, dynamic>.from(raw);
      oldSchema.forEach((k, v) {
        if (k != 'sections' && k != 'fields') {
          schema.putIfAbsent(k.toString(), () => v);
        }
      });
    }
    // ═══ FIX: version لم يكن يُكتب عند الإنشاء إطلاقاً — 1 عند الإنشاء
    // وزيادة عند التعديل (>= 1 دائماً) ═══
    schema['version'] = ((oldSchema['version'] as num?)?.toInt() ?? 0) + 1;

    Navigator.pop(context, {
      'title_ar': _titleArController.text.trim(),
      'title_en': _titleEnController.text.trim(),
      'description_ar': _descArController.text.trim(),
      'schema': schema,
      'requires_gps': _requiresGps,
      'requires_photo': _requiresPhoto,
      'max_photos': _maxPhotos,
      'campaign_type': _campaignType,
    });
  }

  // ═══ يجهّز القسم للحفظ: يحفظ كل المفاتيح غير المعروضة (id,
  // visible_roles...) ويكتب title_ar + title معاً (المحرك يقرأ title_ar)
  // ويعيد ترقيم order حسب موقع القسم ═══
  Map<String, dynamic> _sectionForSave(Map<String, dynamic> section, int i) {
    final out = Map<String, dynamic>.from(section)..remove('expanded');
    final title = (out['title_ar'] ?? out['title'] ?? '').toString();
    out['title_ar'] = title;
    out['title'] = title;
    out['order'] = i + 1;
    return out;
  }

  // ═══ FIX: تحقق من صلاحية الاستمارة — يعيد رسالة المشكلة أو null ═══
  String? _validateForm() {
    final allFields = <Map<String, dynamic>>[..._fields];
    for (final s in _sections) {
      final list = s['fields'] as List?;
      if (list == null) continue;
      allFields.addAll(
        list.map((f) => Map<String, dynamic>.from(f as Map)),
      );
    }

    if (allFields.isEmpty) {
      return 'لا يمكن حفظ استمارة فارغة — أضف حقلاً واحداً على الأقل';
    }

    // مفاتيح مكررة (غير حساسة لحالة الأحرف) عبر كل الاستمارة
    final seen = <String>{};
    final duplicates = <String>{};
    for (final f in allFields) {
      final key = (f['key'] as String? ?? '').trim();
      if (key.isEmpty) continue;
      final lower = key.toLowerCase();
      if (seen.contains(lower)) {
        duplicates.add(key);
      } else {
        seen.add(lower);
      }
    }
    if (duplicates.isNotEmpty) {
      return 'مفاتيح حقول مكررة: ${duplicates.join('، ')} — يجب أن يكون المفتاح فريداً لكل حقل';
    }

    for (int i = 0; i < allFields.length; i++) {
      final f = allFields[i];
      final key = (f['key'] as String? ?? '').trim();
      final label = (f['label_ar'] as String? ?? '').trim();
      if (label.isEmpty) {
        return 'الحقل رقم ${i + 1}${key.isNotEmpty ? ' ($key)' : ''} بدون تسمية عربية';
      }
      final type = f['type'] as String? ?? 'text';
      if (type == 'select' || type == 'multiselect') {
        final validOptions = ((f['options'] as List?) ?? [])
            .where((o) => o.toString().trim().isNotEmpty)
            .length;
        if (validOptions < 2) {
          return 'الحقل «$label» (قائمة اختيار) يحتاج خيارين صحيحين على الأقل';
        }
      }
    }
    return null;
  }

  // ═══ FIX: حرس التغييرات غير المحفوظة — خروج مع تأكيد ═══
  Future<void> _confirmExitWithUnsavedChanges() async {
    // تحقق عند الخروج أيضاً — أظهر المشكلة بدقة قبل سؤال التأكيد
    final problem = _validateForm();
    if (problem != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            problem,
            style: const TextStyle(fontFamily: 'Tajawal'),
          ),
          backgroundColor: AppTheme.warningColor,
          duration: const Duration(seconds: 4),
        ),
      );
    }
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppTheme.warningColor),
              SizedBox(width: 8),
              Text(
                'تغييرات غير محفوظة',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
              ),
            ],
          ),
          content: const Text(
            'لديك تغييرات غير محفوظة — الخروج سيؤدي إلى فقدانها؟',
            style: TextStyle(fontFamily: 'Tajawal'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text(
                'مواصلة التعديل',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text(
                'خروج',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
    if (leave == true && mounted) {
      setState(() => _dirty = false);
      Navigator.of(context).pop();
    }
  }

  // ═══════════════════════════════════════
  // FIELD OPERATIONS
  // ═══════════════════════════════════════

  void _addField({int? sectionIndex}) {
    _showFieldEditor(null, sectionIndex: sectionIndex);
  }

  void _editField(int fieldIndex, {int? sectionIndex}) {
    _showFieldEditor(fieldIndex, sectionIndex: sectionIndex);
  }

  Future<void> _deleteField(int fieldIndex, {int? sectionIndex}) async {
    Map<String, dynamic> field;
    if (sectionIndex != null) {
      field = ((_sections[sectionIndex]['fields'] as List?) ?? [])
          .cast<Map<String, dynamic>>()[fieldIndex];
    } else {
      field = _fields[fieldIndex];
    }
    final label = (field['label_ar'] ?? field['key'] ?? '—').toString();
    // ═══ FIX: تأكيد قبل الحذف — كان يُحذف فوراً بلا سؤال ═══
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppTheme.errorColor),
              SizedBox(width: 8),
              Text(
                'حذف الحقل',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
              ),
            ],
          ),
          content: Text(
            'سيتم حذف الحقل «$label» نهائياً من الاستمارة. هل أنت متأكد؟',
            style: const TextStyle(fontFamily: 'Tajawal'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text(
                'إلغاء',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text(
                'حذف',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true) return;
    setState(() {
      if (sectionIndex != null) {
        final fields = (_sections[sectionIndex]['fields'] as List)
            .cast<Map<String, dynamic>>();
        fields.removeAt(fieldIndex);
      } else {
        _fields.removeAt(fieldIndex);
      }
      _dirty = true;
    });
  }

  void _moveField(int oldIndex, int newIndex, {int? sectionIndex}) {
    setState(() {
      if (sectionIndex != null) {
        final fields = (_sections[sectionIndex]['fields'] as List)
            .cast<Map<String, dynamic>>();
        if (newIndex > oldIndex) newIndex--;
        final item = fields.removeAt(oldIndex);
        fields.insert(newIndex, item);
      } else {
        if (newIndex > oldIndex) newIndex--;
        final item = _fields.removeAt(oldIndex);
        _fields.insert(newIndex, item);
      }
      _dirty = true;
    });
  }

  void _showFieldEditor(int? fieldIndex, {int? sectionIndex}) {
    final isEdit = fieldIndex != null;
    Map<String, dynamic>? existingField;
    if (isEdit) {
      if (sectionIndex != null) {
        existingField = (_sections[sectionIndex]['fields'] as List)[fieldIndex]
            as Map<String, dynamic>;
      } else {
        existingField = _fields[fieldIndex];
      }
    }

    final keyController = TextEditingController(
      text: existingField?['key'] ?? '',
    );
    final labelController = TextEditingController(
      text: existingField?['label_ar'] ?? '',
    );
    final hintController = TextEditingController(
      text: existingField?['hint'] ?? '',
    );
    String selectedType = existingField?['type'] ?? 'text';
    bool isRequired = existingField?['required'] ?? false;

    // ✅ FIX: Create controllers ONCE for options, not inline per rebuild
    final List<String> options = List<String>.from(
      existingField?['options'] ?? [],
    );
    final List<TextEditingController> optionControllers =
        options.map((o) => TextEditingController(text: o)).toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Directionality(
          textDirection: TextDirection.rtl,
          child: Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    isEdit ? 'تعديل الحقل' : 'إضافة حقل جديد',
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Field Key
                  TextField(
                    controller: keyController,
                    decoration: const InputDecoration(
                      labelText: 'مفتاح الحقل (بالإنجليزي)',
                      prefixIcon: Icon(Icons.vpn_key_rounded),
                      border: OutlineInputBorder(),
                      helperText: 'مثال: patient_name',
                    ),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Label Arabic
                  TextField(
                    controller: labelController,
                    decoration: const InputDecoration(
                      labelText: 'التسمية (عربي)',
                      prefixIcon: Icon(Icons.label_rounded),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Hint
                  TextField(
                    controller: hintController,
                    decoration: const InputDecoration(
                      labelText: 'نص المساعدة (اختياري)',
                      prefixIcon: Icon(Icons.help_outline_rounded),
                      border: OutlineInputBorder(),
                    ),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Type selector
                  const Text(
                    'نوع الحقل:',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fieldTypes.entries.map((e) {
                      final isSelected = selectedType == e.key;
                      final info = e.value;
                      return InkWell(
                        onTap: () => setModalState(() => selectedType = e.key),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (info['color'] as Color).withValues(
                                    alpha: 0.15,
                                  )
                                : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected
                                  ? info['color'] as Color
                                  : Colors.grey.shade300,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                info['icon'] as IconData,
                                size: 18,
                                color: isSelected
                                    ? info['color'] as Color
                                    : Colors.grey,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                info['label'] as String,
                                style: TextStyle(
                                  fontFamily: 'Tajawal',
                                  fontSize: 13,
                                  color: isSelected
                                      ? info['color'] as Color
                                      : Colors.grey.shade700,
                                  fontWeight: isSelected
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Required toggle
                  SwitchListTile(
                    title: const Text(
                      'حقل مطلوب',
                      style: TextStyle(fontFamily: 'Tajawal'),
                    ),
                    subtitle: const Text(
                      'يجب ملء هذا الحقل عند الإرسال',
                      style: TextStyle(fontFamily: 'Tajawal', fontSize: 12),
                    ),
                    value: isRequired,
                    onChanged: (v) => setModalState(() => isRequired = v),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Options (for select/multiselect)
                  if (selectedType == 'select' ||
                      selectedType == 'multiselect') ...[
                    const Text(
                      'الخيارات:',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...options.asMap().entries.map(
                          (entry) => Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: optionControllers[entry.key],
                                    decoration: InputDecoration(
                                      labelText: 'خيار ${entry.key + 1}',
                                      border: const OutlineInputBorder(),
                                      isDense: true,
                                    ),
                                    style:
                                        const TextStyle(fontFamily: 'Tajawal'),
                                    onChanged: (v) => options[entry.key] = v,
                                  ),
                                ),
                                IconButton(
                                  icon: const Icon(
                                    Icons.remove_circle_outline,
                                    color: AppTheme.errorColor,
                                  ),
                                  onPressed: () => setModalState(() {
                                    optionControllers[entry.key].dispose();
                                    optionControllers.removeAt(entry.key);
                                    options.removeAt(entry.key);
                                  }),
                                ),
                              ],
                            ),
                          ),
                        ),
                    OutlinedButton.icon(
                      onPressed: () => setModalState(() {
                        options.add('');
                        optionControllers.add(TextEditingController());
                      }),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text(
                        'إضافة خيار',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        if (keyController.text.trim().isEmpty ||
                            labelController.text.trim().isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'المفتاح والتسمية مطلوبان',
                                style: TextStyle(fontFamily: 'Tajawal'),
                              ),
                              backgroundColor: AppTheme.errorColor,
                            ),
                          );
                          return;
                        }

                        // ✅ FIX: احتفظ بكل المفاتيح الموجودة مسبقاً (show_if,
                        // auto_fill, label_en, visible_roles, config...) — كان
                        // يُعاد بناء الخريطة من الصفر فتُفقد بلا رجعة
                        final field = existingField != null
                            ? Map<String, dynamic>.from(existingField)
                            : <String, dynamic>{};
                        field['key'] = keyController.text.trim();
                        field['type'] = selectedType;
                        field['label_ar'] = labelController.text.trim();
                        field['required'] = isRequired;
                        final hint = hintController.text.trim();
                        if (hint.isNotEmpty) {
                          field['hint'] = hint;
                        } else {
                          field.remove('hint');
                        }
                        if (selectedType == 'select' ||
                            selectedType == 'multiselect') {
                          // ✅ FIX: Read from controllers to get actual typed values
                          final savedOptions = optionControllers
                              .map((c) => c.text.trim())
                              .where((o) => o.isNotEmpty)
                              .toList();
                          field['options'] = savedOptions;
                        }

                        setState(() {
                          _dirty = true;
                          if (sectionIndex != null) {
                            final fields =
                                (_sections[sectionIndex]['fields'] as List)
                                    .cast<Map<String, dynamic>>();
                            if (isEdit) {
                              fields[fieldIndex] = field;
                            } else {
                              fields.add(field);
                            }
                          } else {
                            if (isEdit) {
                              _fields[fieldIndex] = field;
                            } else {
                              _fields.add(field);
                            }
                          }
                        });
                        Navigator.pop(ctx);
                      },
                      icon: Icon(
                        isEdit ? Icons.save_rounded : Icons.add_rounded,
                        color: Colors.white,
                      ),
                      label: Text(
                        isEdit ? 'حفظ التعديل' : 'إضافة الحقل',
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    ).whenComplete(() {
      // ✅ FIX: Dispose all option controllers when dialog closes
      for (final c in optionControllers) {
        c.dispose();
      }
    });
  }

  // ═══════════════════════════════════════
  // SECTION OPERATIONS
  // ═══════════════════════════════════════

  void _addSection() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('قسم جديد', style: TextStyle(fontFamily: 'Cairo')),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'عنوان القسم',
              border: OutlineInputBorder(),
            ),
            style: const TextStyle(fontFamily: 'Tajawal'),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(
                'إلغاء',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                if (controller.text.trim().isNotEmpty) {
                  setState(() {
                    // ✅ FIX: المحرك يقرأ title_ar — اكتب المفتاحين معاً
                    _sections.add({
                      'title_ar': controller.text.trim(),
                      'title': controller.text.trim(),
                      'order': _sections.length + 1,
                      'fields': <Map<String, dynamic>>[],
                      'expanded': true,
                    });
                    _dirty = true;
                  });
                }
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: const Text(
                'إضافة',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _editSectionTitle(int index) {
    final controller = TextEditingController(
      // ✅ FIX: اقرأ title_ar أولاً (المحرك يقرؤه) مع احتياطي title القديم
      text: _sections[index]['title_ar'] ?? _sections[index]['title'] ?? '',
    );
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text(
            'تعديل عنوان القسم',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
              labelText: 'عنوان القسم',
              border: OutlineInputBorder(),
            ),
            style: const TextStyle(fontFamily: 'Tajawal'),
            autofocus: true,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(
                'إلغاء',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                if (controller.text.trim().isNotEmpty) {
                  setState(() {
                    // ✅ FIX: اكتب المفتاحين معاً حتى تُعرض في كل المحركات
                    _sections[index]['title_ar'] = controller.text.trim();
                    _sections[index]['title'] = controller.text.trim();
                    _dirty = true;
                  });
                }
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: const Text(
                'حفظ',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteSection(int index) async {
    final title =
        (_sections[index]['title_ar'] ?? _sections[index]['title'] ?? '—')
            .toString();
    final fieldCount = ((_sections[index]['fields'] as List?)?.length ?? 0);
    // ═══ FIX: تأكيد قبل الحذف — كان يُحذف القسم فوراً بلا سؤال ═══
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: AppTheme.errorColor),
              SizedBox(width: 8),
              Text(
                'حذف القسم',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
              ),
            ],
          ),
          content: Text(
            'سيتم حذف القسم «$title» و$fieldCount حقل داخله. هل أنت متأكد؟',
            style: const TextStyle(fontFamily: 'Tajawal'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text(
                'إلغاء',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.errorColor,
              ),
              child: const Text(
                'حذف',
                style: TextStyle(fontFamily: 'Tajawal', color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
    if (confirmed != true) return;
    setState(() {
      _sections.removeAt(index);
      _dirty = true;
    });
  }

  // ═══ FIX: إعادة ترتيب الأقسام — المحرك يفرز بـ order فنعيد الترقيم ═══
  void _moveSection(int index, int direction) {
    final newIndex = index + direction;
    if (newIndex < 0 || newIndex >= _sections.length) return;
    setState(() {
      final section = _sections.removeAt(index);
      _sections.insert(newIndex, section);
      for (int i = 0; i < _sections.length; i++) {
        _sections[i]['order'] = i + 1;
      }
      _dirty = true;
    });
  }

  // ═══ FIX: التحويل بين «حقول مباشرة» و«مقسم بأقسام» — كان يترك القائمة
  // الأخرى كما هي والحفظ يكتب النشطة فقط فيُتلف المحتوى. الآن نرحّل
  // المحتوى (مع تأكيد) فلا يُفقد شيء ═══
  Future<void> _switchStructureMode(bool toSections) async {
    if (_useSections == toSections) return;

    final converting =
        toSections ? _fields.isNotEmpty : _sections.isNotEmpty;
    if (converting) {
      final fieldCount = toSections
          ? _fields.length
          : _sections.fold<int>(
              0,
              (n, s) => n + ((s['fields'] as List?)?.length ?? 0),
            );
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (ctx) => Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Row(
              children: [
                Icon(Icons.swap_horiz_rounded, color: AppTheme.warningColor),
                SizedBox(width: 8),
                Text(
                  'تحويل هيكل الاستمارة',
                  style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
                ),
              ],
            ),
            content: Text(
              toSections
                  ? 'سيتم نقل الحقول الـ $fieldCount الحالية إلى قسم واحد بعنوان «محتوى الاستمارة». هل تريد المتابعة؟'
                  : 'سيتم دمج حقول الأقسام ($fieldCount حقل) في قائمة واحدة مع الحفاظ على ترتيبها. هل تريد المتابعة؟',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text(
                  'إلغاء',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                ),
                child: const Text(
                  'متابعة',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
      if (confirmed != true) return;
    }

    setState(() {
      if (toSections) {
        if (_fields.isNotEmpty) {
          _sections.add({
            'title_ar': 'محتوى الاستمارة',
            'title': 'محتوى الاستمارة',
            'order': _sections.length + 1,
            'fields': List<Map<String, dynamic>>.from(_fields),
            'expanded': true,
          });
          _fields = [];
        }
      } else {
        if (_sections.isNotEmpty) {
          final sorted = [..._sections]..sort(
              (a, b) => ((a['order'] as num?)?.toInt() ?? 0)
                  .compareTo((b['order'] as num?)?.toInt() ?? 0),
            );
          // نسخ كل حقل كخريطة String→dynamic — عناصر jsonb قد تكون
          // Map<dynamic, dynamic> فالمعالجة الخام ستكسر وقت التشغيل
          _fields = [
            for (final s in sorted)
              ...(((s['fields'] as List?) ?? []).map(
                (f) => Map<String, dynamic>.from(f as Map),
              )),
          ];
          _sections = [];
        }
      }
      _useSections = toSections;
      _dirty = true;
    });
  }

  // ═══════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    // ═══ FIX: PopScope — منع الخروج العرضي مع تغييرات غير محفوظة ═══
    return PopScope(
      canPop: !_dirty,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _confirmExitWithUnsavedChanges();
      },
      child: Scaffold(
      appBar: AppBar(
        title: Text(
          _isEditing ? 'تعديل النموذج' : 'نموذج جديد',
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontWeight: FontWeight.w700,
          ),
        ),
        centerTitle: true,
        actions: [
          TextButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.save_rounded, color: AppTheme.primaryColor),
            label: const Text(
              'حفظ',
              style: TextStyle(
                fontFamily: 'Tajawal',
                color: AppTheme.primaryColor,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ═══ Basic Info ═══
            _sectionTitle('📋 المعلومات الأساسية'),
            const SizedBox(height: 12),
            TextField(
              controller: _titleArController,
              decoration: const InputDecoration(
                labelText: 'العنوان (عربي) *',
                prefixIcon: Icon(Icons.title_rounded),
                border: OutlineInputBorder(),
              ),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _titleEnController,
              decoration: const InputDecoration(
                labelText: 'العنوان (إنجليزي)',
                prefixIcon: Icon(Icons.title_rounded),
                border: OutlineInputBorder(),
              ),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descArController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'الوصف',
                prefixIcon: Icon(Icons.description_rounded),
                border: OutlineInputBorder(),
              ),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 12),
            // ═══ Campaign selector — determines visibility for all roles ═══
            DropdownButtonFormField<String>(
              value: _campaignType,
              decoration: const InputDecoration(
                labelText: 'النشاط / الحملة *',
                prefixIcon: Icon(Icons.campaign_rounded),
                border: OutlineInputBorder(),
                helperText: 'حدد النشاط الذي ينتمي إليه النموذج — يتحكم في ظهوره لكل المستويات',
              ),
              items: CampaignType.values
                  .map((c) => DropdownMenuItem(
                        value: c.value,
                        child: Text(
                          c.displayLabel,
                          style: const TextStyle(fontFamily: 'Tajawal'),
                        ),
                      ))
                  .toList(),
              onChanged: (v) => setState(() {
                _campaignType = v ?? _campaignType;
                _dirty = true;
              }),
            ),
            const SizedBox(height: 16),

            // ═══ Settings ═══
            _sectionTitle('⚙️ الإعدادات'),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text(
                '📍 يتطلب GPS',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
              value: _requiresGps,
              onChanged: (v) => setState(() {
                _requiresGps = v;
                _dirty = true;
              }),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade300),
              ),
            ),
            const SizedBox(height: 4),
            SwitchListTile(
              title: const Text(
                '📷 يتطلب صورة',
                style: TextStyle(fontFamily: 'Tajawal'),
              ),
              subtitle: _requiresPhoto
                  ? Text(
                      'حد أقصى $_maxPhotos صور',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                      ),
                    )
                  : null,
              value: _requiresPhoto,
              onChanged: (v) => setState(() {
                _requiresPhoto = v;
                _dirty = true;
              }),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade300),
              ),
            ),
            if (_requiresPhoto) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Text(
                    'عدد الصور الأقصى:',
                    style: TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(width: 12),
                  DropdownButton<int>(
                    value: _maxPhotos,
                    items: [1, 2, 3, 5, 10]
                        .map(
                          (n) => DropdownMenuItem(value: n, child: Text('$n')),
                        )
                        .toList(),
                    onChanged: (v) => setState(() {
                      _maxPhotos = v ?? 5;
                      _dirty = true;
                    }),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),

            // ═══ Schema Structure Toggle ═══
            _sectionTitle('🏗️ هيكل الحقول'),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: InkWell(
                      // ═══ FIX: تحويل مع ترحيل المحتوى + تأكيد ═══
                      onTap: () => _switchStructureMode(false),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: !_useSections
                              ? AppTheme.primaryColor
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          'حقول مباشرة',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontWeight: FontWeight.w600,
                            color: !_useSections ? Colors.white : Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      // ═══ FIX: تحويل مع ترحيل المحتوى + تأكيد ═══
                      onTap: () => _switchStructureMode(true),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _useSections
                              ? AppTheme.primaryColor
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          ' مقسم بأقسام',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontWeight: FontWeight.w600,
                            color: _useSections ? Colors.white : Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ═══ Fields / Sections Editor ═══
            if (!_useSections) ...[
              _sectionTitle('📝 الحقول (${_fields.length})'),
              const SizedBox(height: 8),
              _buildFieldsList(_fields),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => _addField(),
                icon: const Icon(Icons.add_rounded),
                label: const Text(
                  'إضافة حقل',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryColor,
                  side: const BorderSide(color: AppTheme.primaryColor),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ] else ...[
              _sectionTitle('📂 الأقسام (${_sections.length})'),
              const SizedBox(height: 8),
              ..._sections.asMap().entries.map(
                    (entry) => _buildSectionCard(entry.key, entry.value),
                  ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _addSection,
                icon: const Icon(Icons.create_new_folder_rounded),
                label: const Text(
                  'إضافة قسم',
                  style: TextStyle(fontFamily: 'Tajawal'),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.teal,
                  side: const BorderSide(color: Colors.teal),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  Widget _buildFieldsList(
    List<Map<String, dynamic>> fields, {
    int? sectionIndex,
  }) {
    if (fields.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Colors.grey.shade50,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: const Column(
          children: [
            Icon(Icons.inbox_rounded, size: 48, color: AppTheme.textHint),
            SizedBox(height: 8),
            Text(
              'لا توجد حقول بعد',
              style: TextStyle(fontFamily: 'Tajawal', color: AppTheme.textHint),
            ),
          ],
        ),
      );
    }

    return ReorderableListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: fields.length,
      onReorder: (oldIndex, newIndex) =>
          _moveField(oldIndex, newIndex, sectionIndex: sectionIndex),
      itemBuilder: (context, i) =>
          _buildFieldTile(fields[i], i, sectionIndex: sectionIndex),
    );
  }

  Widget _buildFieldTile(
    Map<String, dynamic> field,
    int index, {
    int? sectionIndex,
  }) {
    final type = field['type'] as String? ?? 'text';
    final typeInfo = _fieldTypes[type] ?? _fieldTypes['text']!;
    final isRequired = field['required'] == true;
    final options = field['options'] as List?;

    return Card(
      key: ValueKey('field_$index'),
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: (typeInfo['color'] as Color).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            typeInfo['icon'] as IconData,
            color: typeInfo['color'] as Color,
            size: 22,
          ),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                field['label_ar'] ?? field['key'] ?? '—',
                style: const TextStyle(
                  fontFamily: 'Tajawal',
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
            if (isRequired)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.errorColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'مطلوب',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 10,
                    color: AppTheme.errorColor,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Text(
          '${typeInfo['label']}${options != null ? ' (${options.length} خيارات)' : ''}${field['key'] != null ? ' — ${field['key']}' : ''}',
          style: const TextStyle(fontFamily: 'Tajawal', fontSize: 12),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(
                Icons.edit_rounded,
                size: 20,
                color: AppTheme.primaryColor,
              ),
              onPressed: () => _editField(index, sectionIndex: sectionIndex),
            ),
            IconButton(
              icon: const Icon(
                Icons.delete_outline_rounded,
                size: 20,
                color: AppTheme.errorColor,
              ),
              onPressed: () => _deleteField(index, sectionIndex: sectionIndex),
            ),
            const Icon(Icons.drag_handle_rounded, color: AppTheme.textHint),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard(int sectionIndex, Map<String, dynamic> section) {
    final isExpanded = section['expanded'] == true;
    final fields =
        (section['fields'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          InkWell(
            borderRadius: BorderRadius.vertical(
              top: const Radius.circular(16),
              bottom: isExpanded ? Radius.zero : const Radius.circular(16),
            ),
            onTap: () => setState(
              () => _sections[sectionIndex]['expanded'] = !isExpanded,
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.teal.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.folder_rounded,
                      color: Colors.teal,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          section['title_ar'] ?? section['title'] ?? '—',
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          '${fields.length} حقل',
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // ═══ FIX: أزرار ترتيب الأقسام — المحرك يفرز بـ order ═══
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_upward_rounded,
                      size: 18,
                      color: AppTheme.textSecondary,
                    ),
                    tooltip: 'نقل القسم لأعلى',
                    visualDensity: VisualDensity.compact,
                    onPressed: sectionIndex > 0
                        ? () => _moveSection(sectionIndex, -1)
                        : null,
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.arrow_downward_rounded,
                      size: 18,
                      color: AppTheme.textSecondary,
                    ),
                    tooltip: 'نقل القسم لأسفل',
                    visualDensity: VisualDensity.compact,
                    onPressed: sectionIndex < _sections.length - 1
                        ? () => _moveSection(sectionIndex, 1)
                        : null,
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.edit_rounded,
                      size: 20,
                      color: AppTheme.primaryColor,
                    ),
                    onPressed: () => _editSectionTitle(sectionIndex),
                  ),
                  IconButton(
                    icon: const Icon(
                      Icons.delete_outline_rounded,
                      size: 20,
                      color: AppTheme.errorColor,
                    ),
                    onPressed: () => _deleteSection(sectionIndex),
                  ),
                  Icon(
                    isExpanded
                        ? Icons.expand_less_rounded
                        : Icons.expand_more_rounded,
                    color: AppTheme.textHint,
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                children: [
                  _buildFieldsList(fields, sectionIndex: sectionIndex),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => _addField(sectionIndex: sectionIndex),
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text(
                      'إضافة حقل لهذا القسم',
                      style: TextStyle(fontFamily: 'Tajawal'),
                    ),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.teal,
                      side: const BorderSide(color: Colors.teal),
                      minimumSize: const Size(double.infinity, 40),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
