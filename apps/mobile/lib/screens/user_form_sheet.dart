import 'package:flutter/material.dart';
import 'package:epi_shared/epi_shared.dart';

class UserFormSheet extends StatefulWidget {
  final List<Map<String, dynamic>> governorates;
  final List<Map<String, dynamic>> districts;
  final String title;
  final Map<String, dynamic>? existingUser;

  const UserFormSheet({
    required this.governorates,
    required this.districts,
    required this.title,
    this.existingUser,
  });

  @override
  State<UserFormSheet> createState() => UserFormSheetState();
}

class UserFormSheetState extends State<UserFormSheet> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nationalIdController = TextEditingController();
  String _selectedRole = 'data_entry';
  String? _selectedGovernorateId;
  String? _selectedDistrictId;
  bool _obscurePassword = true;

  bool get _isEditing => widget.existingUser != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final u = widget.existingUser!;
      _nameController.text = u['full_name'] ?? '';
      _emailController.text = u['email'] ?? '';
      _phoneController.text = u['phone'] ?? '';
      _nationalIdController.text = u['national_id'] ?? '';
      _selectedRole = u['role'] ?? 'data_entry';
      _selectedGovernorateId = u['governorate_id'];
      _selectedDistrictId = u['district_id'];
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _nationalIdController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> get _filteredDistricts {
    if (_selectedGovernorateId == null) return [];
    return widget.districts
        .where((d) => d['governorate_id'] == _selectedGovernorateId)
        .toList();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    Navigator.pop(context, {
      'full_name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
      'password': _passwordController.text,
      'national_id': _nationalIdController.text.trim(),
      'role': _selectedRole,
      'governorate_id': _selectedGovernorateId,
      'district_id': _selectedDistrictId,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
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
                  widget.title,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 20),

                // Full Name
                TextFormField(
                  controller: _nameController,
                  decoration: _inputDecoration(
                    'الاسم الكامل',
                    Icons.person_rounded,
                  ),
                  validator: (v) =>
                      (v == null || v.trim().length < 2) ? 'الاسم مطلوب' : null,
                  style: const TextStyle(fontFamily: 'Tajawal'),
                ),
                const SizedBox(height: 14),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: _inputDecoration(
                    'البريد الإلكتروني',
                    Icons.email_rounded,
                  ),
                  enabled: !_isEditing, // Can't change email when editing
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'البريد مطلوب';
                    if (!RegExp(
                      r'^[\w.+-]+@[\w-]+\.[\w.]+$',
                    ).hasMatch(v.trim()))
                      return 'البريد غير صحيح';
                    return null;
                  },
                  style: const TextStyle(fontFamily: 'Tajawal'),
                ),
                const SizedBox(height: 14),

                // Password (only for add)
                if (!_isEditing) ...[
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      labelText: 'كلمة المرور',
                      prefixIcon: const Icon(Icons.lock_rounded),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    validator: (v) => (v == null || v.length < 8)
                        ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
                        : null,
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  const SizedBox(height: 14),
                ],

                // Phone
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: _inputDecoration(
                    'رقم الجوال',
                    Icons.phone_rounded,
                  ),
                  validator: (v) {
                    if (v != null &&
                        v.isNotEmpty &&
                        !RegExp(r'^7\d{8}$').hasMatch(v))
                      return 'رقم غير صحيح — يجب أن يبدأ بـ 7 (9 أرقام)';
                    return null;
                  },
                  style: const TextStyle(fontFamily: 'Tajawal'),
                ),
                const SizedBox(height: 14),

                // National ID
                TextFormField(
                  controller: _nationalIdController,
                  decoration: _inputDecoration(
                    'الرقم الوطني (اختياري)',
                    Icons.badge_rounded,
                  ),
                  style: const TextStyle(fontFamily: 'Tajawal'),
                ),
                const SizedBox(height: 14),

                // Role
                DropdownButtonFormField<String>(
                  value: _selectedRole,
                  decoration: _inputDecoration(
                    'الدور',
                    Icons.admin_panel_settings_rounded,
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: 'data_entry',
                      child: Text(
                        'إدخال بيانات',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'district',
                      child: Text(
                        'مديرية',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'governorate',
                      child: Text(
                        'محافظة',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'central',
                      child: Text(
                        'مركزي',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'admin',
                      child: Text(
                        'مدير النظام',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                  ],
                  onChanged: (v) =>
                      setState(() => _selectedRole = v ?? 'data_entry'),
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 14),

                // Governorate
                DropdownButtonFormField<String>(
                  value: _selectedGovernorateId,
                  decoration: _inputDecoration(
                    'المحافظة (اختياري)',
                    Icons.location_city_rounded,
                  ),
                  items: [
                    const DropdownMenuItem(
                      value: null,
                      child: Text(
                        '— بدون —',
                        style: TextStyle(fontFamily: 'Tajawal'),
                      ),
                    ),
                    ...widget.governorates.map(
                      (g) => DropdownMenuItem(
                        value: g['id'] as String,
                        child: Text(
                          g['name_ar'],
                          style: const TextStyle(fontFamily: 'Tajawal'),
                        ),
                      ),
                    ),
                  ],
                  onChanged: (v) => setState(() {
                    _selectedGovernorateId = v;
                    _selectedDistrictId = null;
                  }),
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 14),

                // District
                if (_selectedGovernorateId != null) ...[
                  DropdownButtonFormField<String>(
                    value: _selectedDistrictId,
                    decoration: _inputDecoration(
                      'المديرية (اختياري)',
                      Icons.location_on_rounded,
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text(
                          '— بدون —',
                          style: TextStyle(fontFamily: 'Tajawal'),
                        ),
                      ),
                      ..._filteredDistricts.map(
                        (d) => DropdownMenuItem(
                          value: d['id'] as String,
                          child: Text(
                            d['name_ar'],
                            style: const TextStyle(fontFamily: 'Tajawal'),
                          ),
                        ),
                      ),
                    ],
                    onChanged: (v) => setState(() => _selectedDistrictId = v),
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 14),
                ],

                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: _submit,
                    icon: Icon(
                      _isEditing
                          ? Icons.save_rounded
                          : Icons.person_add_rounded,
                      color: Colors.white,
                    ),
                    label: Text(
                      _isEditing ? 'حفظ التعديلات' : 'إضافة المستخدم',
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
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}
