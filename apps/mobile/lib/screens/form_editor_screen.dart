import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

  // Schema: flat fields OR sections
  List<Map<String, dynamic>> _fields = [];
  List<Map<String, dynamic>> _sections = [];
  bool _useSections = false;

  // Field type definitions
  static const _fieldTypes = {
    'text': {
      'label': 'نص',
      'icon': Icons.text_fields_rounded,
      'color': Colors.blue
    },
    'number': {
      'label': 'رقم',
      'icon': Icons.numbers_rounded,
      'color': Colors.indigo
    },
    'phone': {
      'label': 'جوال',
      'icon': Icons.phone_rounded,
      'color': Colors.green
    },
    'textarea': {
      'label': 'نص طويل',
      'icon': Icons.notes_rounded,
      'color': Colors.teal
    },
    'select': {
      'label': 'قائمة اختيار',
      'icon': Icons.arrow_drop_down_circle_rounded,
      'color': Colors.purple
    },
    'multiselect': {
      'label': 'اختيار متعدد',
      'icon': Icons.checklist_rounded,
      'color': Colors.deepPurple
    },
    'yesno': {
      'label': 'نعم / لا',
      'icon': Icons.toggle_on_rounded,
      'color': Colors.orange
    },
    'date': {
      'label': 'تاريخ',
      'icon': Icons.calendar_today_rounded,
      'color': Colors.cyan
    },
    'gps': {
      'label': 'موقع GPS',
      'icon': Icons.location_on_rounded,
      'color': Colors.red
    },
    'photo': {
      'label': 'صورة',
      'icon': Icons.camera_alt_rounded,
      'color': Colors.amber
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

      final schema = f['schema'] as Map<String, dynamic>? ?? {};
      final sections = schema['sections'] as List? ?? [];
      final flatFields = schema['fields'] as List? ?? [];

      if (sections.isNotEmpty) {
        _useSections = true;
        _sections =
            sections.map((s) => Map<String, dynamic>.from(s as Map)).toList();
      } else {
        _useSections = false;
        _fields =
            flatFields.map((f) => Map<String, dynamic>.from(f as Map)).toList();
      }
    }
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
            content:
                Text('العنوان مطلوب', style: TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: AppTheme.errorColor),
      );
      return;
    }

    final schema = _useSections
        ? {
            'sections': _sections
                .map((s) => Map<String, dynamic>.from(s)..remove('expanded'))
                .toList()
          }
        : {'fields': _fields};

    Navigator.pop(context, {
      'title_ar': _titleArController.text.trim(),
      'title_en': _titleEnController.text.trim(),
      'description_ar': _descArController.text.trim(),
      'schema': schema,
      'requires_gps': _requiresGps,
      'requires_photo': _requiresPhoto,
      'max_photos': _maxPhotos,
    });
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

  void _deleteField(int fieldIndex, {int? sectionIndex}) {
    setState(() {
      if (sectionIndex != null) {
        final fields = (_sections[sectionIndex]['fields'] as List)
            .cast<Map<String, dynamic>>();
        fields.removeAt(fieldIndex);
      } else {
        _fields.removeAt(fieldIndex);
      }
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

    final keyController =
        TextEditingController(text: existingField?['key'] ?? '');
    final labelController =
        TextEditingController(text: existingField?['label_ar'] ?? '');
    final hintController =
        TextEditingController(text: existingField?['hint'] ?? '');
    String selectedType = existingField?['type'] ?? 'text';
    bool isRequired = existingField?['required'] ?? false;
    final List<String> options =
        List<String>.from(existingField?['options'] ?? []);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Directionality(
          textDirection: TextDirection.rtl,
          child: Padding(
            padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20),
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
                              borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 16),
                  Text(isEdit ? 'تعديل الحقل' : 'إضافة حقل جديد',
                      style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 20,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(height: 20),

                  // Field Key
                  TextField(
                    controller: keyController,
                    decoration: const InputDecoration(
                        labelText: 'مفتاح الحقل (بالإنجليزي)',
                        prefixIcon: Icon(Icons.vpn_key_rounded),
                        border: OutlineInputBorder(),
                        helperText: 'مثال: patient_name'),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Label Arabic
                  TextField(
                    controller: labelController,
                    decoration: const InputDecoration(
                        labelText: 'التسمية (عربي)',
                        prefixIcon: Icon(Icons.label_rounded),
                        border: OutlineInputBorder()),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Hint
                  TextField(
                    controller: hintController,
                    decoration: const InputDecoration(
                        labelText: 'نص المساعدة (اختياري)',
                        prefixIcon: Icon(Icons.help_outline_rounded),
                        border: OutlineInputBorder()),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),

                  // Type selector
                  const Text('نوع الحقل:',
                      style: TextStyle(
                          fontFamily: 'Tajawal', fontWeight: FontWeight.w600)),
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
                              horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (info['color'] as Color)
                                    .withValues(alpha: 0.15)
                                : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                                color: isSelected
                                    ? info['color'] as Color
                                    : Colors.grey.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(info['icon'] as IconData,
                                  size: 18,
                                  color: isSelected
                                      ? info['color'] as Color
                                      : Colors.grey),
                              const SizedBox(width: 6),
                              Text(info['label'] as String,
                                  style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 13,
                                      color: isSelected
                                          ? info['color'] as Color
                                          : Colors.grey.shade700,
                                      fontWeight: isSelected
                                          ? FontWeight.w600
                                          : FontWeight.normal)),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Required toggle
                  SwitchListTile(
                    title: const Text('حقل مطلوب',
                        style: TextStyle(fontFamily: 'Tajawal')),
                    subtitle: const Text('يجب ملء هذا الحقل عند الإرسال',
                        style: TextStyle(fontFamily: 'Tajawal', fontSize: 12)),
                    value: isRequired,
                    onChanged: (v) => setModalState(() => isRequired = v),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade300)),
                  ),
                  const SizedBox(height: 8),

                  // Options (for select/multiselect)
                  if (selectedType == 'select' ||
                      selectedType == 'multiselect') ...[
                    const Text('الخيارات:',
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    ...options.asMap().entries.map((entry) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller:
                                      TextEditingController(text: entry.value),
                                  decoration: InputDecoration(
                                      labelText: 'خيار ${entry.key + 1}',
                                      border: const OutlineInputBorder(),
                                      isDense: true),
                                  style: const TextStyle(fontFamily: 'Tajawal'),
                                  onChanged: (v) => options[entry.key] = v,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline,
                                    color: AppTheme.errorColor),
                                onPressed: () => setModalState(
                                    () => options.removeAt(entry.key)),
                              ),
                            ],
                          ),
                        )),
                    OutlinedButton.icon(
                      onPressed: () => setModalState(() => options.add('')),
                      icon: const Icon(Icons.add_rounded),
                      label: const Text('إضافة خيار',
                          style: TextStyle(fontFamily: 'Tajawal')),
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
                                content: Text('المفتاح والتسمية مطلوبان',
                                    style: TextStyle(fontFamily: 'Tajawal')),
                                backgroundColor: AppTheme.errorColor),
                          );
                          return;
                        }

                        final field = <String, dynamic>{
                          'key': keyController.text.trim(),
                          'type': selectedType,
                          'label_ar': labelController.text.trim(),
                          'required': isRequired,
                        };
                        if (hintController.text.trim().isNotEmpty)
                          field['hint'] = hintController.text.trim();
                        if (selectedType == 'select' ||
                            selectedType == 'multiselect') {
                          field['options'] = options
                              .where((o) => o.trim().isNotEmpty)
                              .toList();
                        }

                        setState(() {
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
                          color: Colors.white),
                      label: Text(isEdit ? 'حفظ التعديل' : 'إضافة الحقل',
                          style: const TextStyle(
                              fontFamily: 'Tajawal',
                              fontWeight: FontWeight.w600,
                              color: Colors.white)),
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primaryColor,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14))),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
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
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('قسم جديد', style: TextStyle(fontFamily: 'Cairo')),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
                labelText: 'عنوان القسم', border: OutlineInputBorder()),
            style: const TextStyle(fontFamily: 'Tajawal'),
            autofocus: true,
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('إلغاء',
                    style: TextStyle(fontFamily: 'Tajawal'))),
            ElevatedButton(
              onPressed: () {
                if (controller.text.trim().isNotEmpty) {
                  setState(() {
                    _sections.add({
                      'title': controller.text.trim(),
                      'fields': <Map<String, dynamic>>[],
                      'expanded': true,
                    });
                  });
                }
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor),
              child: const Text('إضافة',
                  style: TextStyle(fontFamily: 'Tajawal', color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _editSectionTitle(int index) {
    final controller =
        TextEditingController(text: _sections[index]['title'] ?? '');
    showDialog(
      context: context,
      builder: (ctx) => Directionality(
        textDirection: TextDirection.rtl,
        child: AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('تعديل عنوان القسم',
              style: TextStyle(fontFamily: 'Cairo')),
          content: TextField(
            controller: controller,
            decoration: const InputDecoration(
                labelText: 'عنوان القسم', border: OutlineInputBorder()),
            style: const TextStyle(fontFamily: 'Tajawal'),
            autofocus: true,
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('إلغاء',
                    style: TextStyle(fontFamily: 'Tajawal'))),
            ElevatedButton(
              onPressed: () {
                if (controller.text.trim().isNotEmpty) {
                  setState(() {
                    _sections[index]['title'] = controller.text.trim();
                  });
                }
                Navigator.pop(ctx);
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor),
              child: const Text('حفظ',
                  style: TextStyle(fontFamily: 'Tajawal', color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _deleteSection(int index) {
    setState(() {
      _sections.removeAt(index);
    });
  }

  // ═══════════════════════════════════════
  // BUILD
  // ═══════════════════════════════════════

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'تعديل النموذج' : 'نموذج جديد',
            style: const TextStyle(
                fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
        centerTitle: true,
        actions: [
          TextButton.icon(
            onPressed: _save,
            icon: const Icon(Icons.save_rounded, color: AppTheme.primaryColor),
            label: const Text('حفظ',
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w700)),
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
                  border: OutlineInputBorder()),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _titleEnController,
              decoration: const InputDecoration(
                  labelText: 'العنوان (إنجليزي)',
                  prefixIcon: Icon(Icons.title_rounded),
                  border: OutlineInputBorder()),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descArController,
              maxLines: 3,
              decoration: const InputDecoration(
                  labelText: 'الوصف',
                  prefixIcon: Icon(Icons.description_rounded),
                  border: OutlineInputBorder()),
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            const SizedBox(height: 16),

            // ═══ Settings ═══
            _sectionTitle('⚙️ الإعدادات'),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('📍 يتطلب GPS',
                  style: TextStyle(fontFamily: 'Tajawal')),
              value: _requiresGps,
              onChanged: (v) => setState(() => _requiresGps = v),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade300)),
            ),
            const SizedBox(height: 4),
            SwitchListTile(
              title: const Text('📷 يتطلب صورة',
                  style: TextStyle(fontFamily: 'Tajawal')),
              subtitle: _requiresPhoto
                  ? Text('حد أقصى $_maxPhotos صور',
                      style:
                          const TextStyle(fontFamily: 'Tajawal', fontSize: 12))
                  : null,
              value: _requiresPhoto,
              onChanged: (v) => setState(() => _requiresPhoto = v),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: Colors.grey.shade300)),
            ),
            if (_requiresPhoto) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Text('عدد الصور الأقصى:',
                      style: TextStyle(fontFamily: 'Tajawal')),
                  const SizedBox(width: 12),
                  DropdownButton<int>(
                    value: _maxPhotos,
                    items: [1, 2, 3, 5, 10]
                        .map((n) =>
                            DropdownMenuItem(value: n, child: Text('$n')))
                        .toList(),
                    onChanged: (v) => setState(() => _maxPhotos = v ?? 5),
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
                      onTap: () => setState(() => _useSections = false),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: !_useSections
                              ? AppTheme.primaryColor
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text('حقول مباشرة',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontWeight: FontWeight.w600,
                                color: !_useSections
                                    ? Colors.white
                                    : Colors.grey)),
                      ),
                    ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () => setState(() => _useSections = true),
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _useSections
                              ? AppTheme.primaryColor
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(' مقسم بأقسام',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                                fontFamily: 'Tajawal',
                                fontWeight: FontWeight.w600,
                                color:
                                    _useSections ? Colors.white : Colors.grey)),
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
                label: const Text('إضافة حقل',
                    style: TextStyle(fontFamily: 'Tajawal')),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.primaryColor,
                  side: const BorderSide(color: AppTheme.primaryColor),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ] else ...[
              _sectionTitle('📂 الأقسام (${_sections.length})'),
              const SizedBox(height: 8),
              ..._sections
                  .asMap()
                  .entries
                  .map((entry) => _buildSectionCard(entry.key, entry.value)),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: _addSection,
                icon: const Icon(Icons.create_new_folder_rounded),
                label: const Text('إضافة قسم',
                    style: TextStyle(fontFamily: 'Tajawal')),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.teal,
                  side: const BorderSide(color: Colors.teal),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
            const SizedBox(height: 40),
          ],
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
                borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Text(title,
            style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 16,
                fontWeight: FontWeight.w700)),
      ],
    );
  }

  Widget _buildFieldsList(List<Map<String, dynamic>> fields,
      {int? sectionIndex}) {
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
            Text('لا توجد حقول بعد',
                style:
                    TextStyle(fontFamily: 'Tajawal', color: AppTheme.textHint)),
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

  Widget _buildFieldTile(Map<String, dynamic> field, int index,
      {int? sectionIndex}) {
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
          child: Icon(typeInfo['icon'] as IconData,
              color: typeInfo['color'] as Color, size: 22),
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(field['label_ar'] ?? field['key'] ?? '—',
                  style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontWeight: FontWeight.w600,
                      fontSize: 14)),
            ),
            if (isRequired)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                    color: AppTheme.errorColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4)),
                child: const Text('مطلوب',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: AppTheme.errorColor)),
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
              icon: const Icon(Icons.edit_rounded,
                  size: 20, color: AppTheme.primaryColor),
              onPressed: () => _editField(index, sectionIndex: sectionIndex),
            ),
            IconButton(
              icon: const Icon(Icons.delete_outline_rounded,
                  size: 20, color: AppTheme.errorColor),
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
                bottom: isExpanded ? Radius.zero : const Radius.circular(16)),
            onTap: () => setState(
                () => _sections[sectionIndex]['expanded'] = !isExpanded),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                        color: Colors.teal.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.folder_rounded,
                        color: Colors.teal, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(section['title'] ?? '—',
                            style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 15,
                                fontWeight: FontWeight.w700)),
                        Text('${fields.length} حقل',
                            style: const TextStyle(
                                fontFamily: 'Tajawal',
                                fontSize: 12,
                                color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                  IconButton(
                      icon: const Icon(Icons.edit_rounded,
                          size: 20, color: AppTheme.primaryColor),
                      onPressed: () => _editSectionTitle(sectionIndex)),
                  IconButton(
                      icon: const Icon(Icons.delete_outline_rounded,
                          size: 20, color: AppTheme.errorColor),
                      onPressed: () => _deleteSection(sectionIndex)),
                  Icon(
                      isExpanded
                          ? Icons.expand_less_rounded
                          : Icons.expand_more_rounded,
                      color: AppTheme.textHint),
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
                    label: const Text('إضافة حقل لهذا القسم',
                        style: TextStyle(fontFamily: 'Tajawal')),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.teal,
                      side: const BorderSide(color: Colors.teal),
                      minimumSize: const Size(double.infinity, 40),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
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
