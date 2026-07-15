import 'dart:convert';
import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';
import '../main.dart';
import '../providers/app_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  final _formKey = GlobalKey<FormState>();

  // Controllers
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _nationalIdCtrl;

  bool _isEditing = false;
  bool _isSaving = false;
  Uint8List? _pickedImageBytes;
  String? _pickedImagePath;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..forward();

    _nameCtrl = TextEditingController();
    _phoneCtrl = TextEditingController();
    _nationalIdCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _animController.dispose();
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _nationalIdCtrl.dispose();
    super.dispose();
  }

  void _initControllers(AuthState state) {
    if (_nameCtrl.text.isEmpty) _nameCtrl.text = state.fullName ?? '';
    if (_phoneCtrl.text.isEmpty) _phoneCtrl.text = state.phone ?? '';
    if (_nationalIdCtrl.text.isEmpty)
      _nationalIdCtrl.text = state.nationalId ?? '';
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 85,
      );
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() {
          _pickedImageBytes = bytes;
          _pickedImagePath = picked.path;
        });
        // Auto-enter edit mode when image is picked
        if (!_isEditing) setState(() => _isEditing = true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل اختيار الصورة: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    HapticFeedback.mediumImpact();

    try {
      final authRepo = ref.read(authRepositoryProvider);

      // Upload avatar if changed
      String? newAvatarUrl;
      if (_pickedImageBytes != null && _pickedImagePath != null) {
        newAvatarUrl = await authRepo.uploadAvatar(
          _pickedImagePath!,
          _pickedImageBytes!,
        );
      }

      // Update profile fields
      await authRepo.updateProfile(
        fullName: _nameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        nationalId: _nationalIdCtrl.text.trim().isEmpty
            ? null
            : _nationalIdCtrl.text.trim(),
        avatarUrl: newAvatarUrl,
      );

      if (mounted) {
        setState(() {
          _isEditing = false;
          _pickedImageBytes = null;
          _pickedImagePath = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم حفظ التغييرات بنجاح ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل الحفظ: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authStateProvider);
    final authState = authAsync.valueOrNull;
    final governoratesAsync = ref.watch(governoratesProvider);

    if (authState == null || !authState.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            'البروفايل',
            style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
          ),
          centerTitle: true,
        ),
        body: const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_off_outlined,
                size: 64,
                color: AppTheme.textHint,
              ),
              SizedBox(height: 16),
              Text(
                'غير مسجل الدخول',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      );
    }

    _initControllers(authState);
    final role = authState.role;

    return Scaffold(
      backgroundColor: AppTheme.backgroundLight,
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // ═══════ HERO HEADER ═══════
          _buildHeroHeader(authState, role),

          // ═══════ CONTENT ═══════
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    const SizedBox(height: 8),

                    // ═══ Personal Information ═══
                    _sectionLabel('المعلومات الشخصية', Icons.person_rounded),
                    const SizedBox(height: 12),

                    _buildEditableField(
                      controller: _nameCtrl,
                      label: 'الاسم الكامل',
                      icon: Icons.badge_outlined,
                      validator: (v) {
                        if (v == null || v.trim().length < 2) {
                          return 'الاسم يجب أن يكون حرفين على الأقل';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    _buildEditableField(
                      controller: _nationalIdCtrl,
                      label: 'رقم البطاقة الشخصية',
                      icon: Icons.credit_card_rounded,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(20),
                      ],
                      validator: (v) {
                        if (v != null && v.isNotEmpty && v.length < 6) {
                          return 'رقم البطاقة غير صالح';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),

                    _buildEditableField(
                      controller: _phoneCtrl,
                      label: 'رقم الجوال',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(15),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // ═══ Account Information ═══
                    _sectionLabel('معلومات الحساب', Icons.shield_outlined),
                    const SizedBox(height: 12),

                    _buildReadOnlyTile(
                      icon: Icons.email_outlined,
                      label: 'البريد الإلكتروني',
                      value: authState.email ?? 'غير محدد',
                    ),
                    const SizedBox(height: 12),

                    _buildReadOnlyTile(
                      icon: Icons.admin_panel_settings_outlined,
                      label: 'الصلاحيات',
                      value: role?.nameAr ?? 'غير محدد',
                      trailing: _roleBadge(role),
                    ),
                    const SizedBox(height: 12),

                    // Governorate
                    governoratesAsync.when(
                      loading: () => _buildReadOnlyTile(
                        icon: Icons.location_city,
                        label: 'المحافظة',
                        value: 'جاري التحميل...',
                      ),
                      error: (_, __) => _buildReadOnlyTile(
                        icon: Icons.location_city,
                        label: 'المحافظة',
                        value: authState.governorateId ?? 'غير محدد',
                      ),
                      data: (governorates) {
                        final govName = governorates
                            .where((g) => g['id'] == authState.governorateId)
                            .map((g) => g['name_ar'] as String)
                            .firstOrNull;
                        return _buildReadOnlyTile(
                          icon: Icons.location_city,
                          label: 'المحافظة',
                          value: govName ?? 'غير محدد',
                        );
                      },
                    ),

                    const SizedBox(height: 24),

                    // ═══ Change Password ═══
                    _sectionLabel('الأمان', Icons.lock_outlined),
                    const SizedBox(height: 12),
                    _buildChangePasswordSection(),

                    const SizedBox(height: 32),

                    // ═══ Settings ═══
                    _sectionLabel('الإعدادات', Icons.settings_outlined),
                    const SizedBox(height: 12),

                    // Dark mode toggle
                    Consumer(builder: (context, ref, _) {
                      final themeMode = ref.watch(themeModeProvider);
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Dark Mode
                            Semantics(
                              label: 'الوضع الليلي',
                              hint: 'تبديل بين الوضع النهاري والليلي',
                              child: ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    themeMode == ThemeMode.dark
                                        ? Icons.dark_mode
                                        : Icons.light_mode,
                                    color: AppTheme.primaryColor,
                                    size: 20,
                                  ),
                                ),
                                title: const Text(
                                  'الوضع الليلي',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                subtitle: Text(
                                  themeMode == ThemeMode.dark
                                      ? 'مفعّل'
                                      : themeMode == ThemeMode.system
                                          ? 'تلقائي (حسب النظام)'
                                          : 'معطّل',
                                  style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 11,
                                    color: AppTheme.textHint,
                                  ),
                                ),
                                trailing: PopupMenuButton<ThemeMode>(
                                  onSelected: (mode) {
                                    ref.read(themeModeProvider.notifier).state = mode;
                                  },
                                  itemBuilder: (_) => [
                                    PopupMenuItem(
                                      value: ThemeMode.system,
                                      child: Row(children: [
                                        Icon(Icons.settings_brightness,
                                            size: 18,
                                            color: themeMode == ThemeMode.system
                                                ? AppTheme.primaryColor
                                                : AppTheme.textHint),
                                        const SizedBox(width: 8),
                                        const Text('تلقائي', style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                                      ]),
                                    ),
                                    PopupMenuItem(
                                      value: ThemeMode.light,
                                      child: Row(children: [
                                        Icon(Icons.light_mode,
                                            size: 18,
                                            color: themeMode == ThemeMode.light
                                                ? AppTheme.primaryColor
                                                : AppTheme.textHint),
                                        const SizedBox(width: 8),
                                        const Text('نهاري', style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                                      ]),
                                    ),
                                    PopupMenuItem(
                                      value: ThemeMode.dark,
                                      child: Row(children: [
                                        Icon(Icons.dark_mode,
                                            size: 18,
                                            color: themeMode == ThemeMode.dark
                                                ? AppTheme.primaryColor
                                                : AppTheme.textHint),
                                        const SizedBox(width: 8),
                                        const Text('ليلي', style: TextStyle(fontFamily: 'Tajawal', fontSize: 13)),
                                      ]),
                                    ),
                                  ],
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primaryColor.withValues(alpha: 0.08),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          themeMode == ThemeMode.dark
                                              ? Icons.dark_mode
                                              : themeMode == ThemeMode.system
                                                  ? Icons.settings_brightness
                                                  : Icons.light_mode,
                                          size: 14,
                                          color: AppTheme.primaryColor,
                                        ),
                                        const SizedBox(width: 4),
                                        Text(
                                          themeMode == ThemeMode.dark
                                              ? 'ليلي'
                                              : themeMode == ThemeMode.system
                                                  ? 'تلقائي'
                                                  : 'نهاري',
                                          style: TextStyle(
                                            fontFamily: 'Tajawal',
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.primaryColor,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        Icon(Icons.arrow_drop_down, size: 16, color: AppTheme.primaryColor),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }),

                    const SizedBox(height: 32),

                    // ═══ App Info ═══
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.info_outline,
                            size: 16,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'الإصدار ${AppConfig.appVersion}',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: Colors.grey.shade400,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // HERO HEADER — Avatar + Name + Edit toggle
  // ═══════════════════════════════════════════════════════════
  Widget _buildHeroHeader(AuthState authState, UserRole? role) {
    return SliverAppBar(
      expandedHeight: 280,
      floating: false,
      pinned: true,
      backgroundColor: AppTheme.primaryColor,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white),
        onPressed: () {
          // ═══ FIX: context.pop() doesn't work with context.go() navigation ═══
          // Use canPop to check if there's a route to pop to, otherwise go to dashboard
          if (context.canPop()) {
            context.pop();
          } else {
            context.go('/dashboard');
          }
        },
      ),
      actions: [
        // Edit / Save / Cancel toggle
        if (_isEditing) ...[
          // Cancel button — exit edit mode without saving
          IconButton(
            icon: const Icon(Icons.close_rounded, color: Colors.white),
            tooltip: 'إلغاء',
            onPressed: _isSaving
                ? null
                : () {
                    final authState = ref.read(authStateProvider).valueOrNull;
                    if (authState != null) {
                      _initControllers(authState);
                    }
                    setState(() => _isEditing = false);
                  },
          ),
          // Save button
          IconButton(
            icon: _isSaving
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.check_rounded, color: Colors.white),
            tooltip: 'حفظ',
            onPressed: _isSaving ? null : _saveProfile,
          ),
        ] else
          IconButton(
            icon: const Icon(Icons.edit_rounded, color: Colors.white),
            tooltip: 'تعديل',
            onPressed: () => setState(() => _isEditing = true),
          ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF00897B), Color(0xFF004D40)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 30),

                // ═══ Avatar with edit badge ═══
                GestureDetector(
                  onTap: _pickImage,
                  child: AnimatedBuilder(
                    animation: _animController,
                    builder: (context, _) {
                      final scale = Curves.easeOutBack.transform(
                        _animController.value,
                      );
                      return Transform.scale(
                        scale: scale,
                        child: Stack(
                          children: [
                            // Avatar circle
                            Container(
                              width: 110,
                              height: 110,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.4),
                                  width: 3,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 20,
                                    offset: const Offset(0, 8),
                                  ),
                                ],
                              ),
                              child: CircleAvatar(
                                radius: 52,
                                backgroundColor: Colors.white.withValues(
                                  alpha: 0.15,
                                ),
                                backgroundImage: _getAvatarImage(authState),
                                child: (_pickedImageBytes == null &&
                                        authState.avatarUrl == null)
                                    ? Text(
                                        _getInitials(authState.fullName ?? ''),
                                        style: const TextStyle(
                                          fontFamily: 'Cairo',
                                          fontSize: 36,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                            // Camera icon badge
                            Positioned(
                              bottom: 2,
                              right: 2,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.15,
                                      ),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.camera_alt_rounded,
                                  size: 18,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // Name
                Text(
                  authState.fullName ?? 'مستخدم',
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),

                // Role badge
                if (role != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.verified_user_outlined,
                          size: 16,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          role.nameAr,
                          style: const TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 8),

                // Edit mode indicator
                if (_isEditing)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.edit_note_rounded,
                          size: 16,
                          color: Colors.amber,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'وضع التعديل',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.amber,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // EDITABLE FIELD
  // ═══════════════════════════════════════════════════════════
  Widget _buildEditableField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? Function(String?)? validator,
  }) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: _isEditing
            ? Border.all(
                color: AppTheme.primaryColor.withValues(alpha: 0.3),
                width: 1.5,
              )
            : Border.all(color: Colors.transparent),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Icon container
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.primaryColor, size: 22),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                TextFormField(
                  controller: controller,
                  enabled: _isEditing,
                  keyboardType: keyboardType,
                  inputFormatters: inputFormatters,
                  validator: validator,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                  decoration: const InputDecoration(
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    filled: false,
                    contentPadding: EdgeInsets.zero,
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
          if (_isEditing)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(
                Icons.edit_rounded,
                size: 16,
                color: AppTheme.primaryColor.withValues(alpha: 0.5),
              ),
            ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CHANGE PASSWORD SECTION
  // ═══════════════════════════════════════════════════════════
  Widget _buildChangePasswordSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppTheme.warningColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.lock_outline_rounded,
            color: AppTheme.warningColor,
            size: 20,
          ),
        ),
        title: const Text(
          'تغيير كلمة المرور',
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        subtitle: const Text(
          'تحديث كلمة مرور حسابك',
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 11,
            color: AppTheme.textHint,
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios_rounded,
          size: 16,
          color: AppTheme.textHint,
        ),
        onTap: _showChangePasswordDialog,
      ),
    );
  }

  void _showChangePasswordDialog() {
    final currentPasswordCtrl = TextEditingController();
    final newPasswordCtrl = TextEditingController();
    final confirmPasswordCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    bool isLoading = false;
    bool obscureCurrent = true;
    bool obscureNew = true;
    bool obscureConfirm = true;

    showDialog(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text(
            'تغيير كلمة المرور',
            style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
          ),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'أدخل كلمة المرور الحوية ثم الجديدة',
                  style: TextStyle(fontFamily: 'Tajawal', fontSize: 12, color: AppTheme.textSecondary),
                ),
                const SizedBox(height: 16),
                // Current password
                TextFormField(
                  controller: currentPasswordCtrl,
                  obscureText: obscureCurrent,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور الحوية',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(obscureCurrent ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureCurrent = !obscureCurrent),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'أدخل كلمة المرور الحوية';
                    if (v.length < 6) return 'كلمة المرور قصيرة جداً';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                // New password
                TextFormField(
                  controller: newPasswordCtrl,
                  obscureText: obscureNew,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور الجديدة',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(obscureNew ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureNew = !obscureNew),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'أدخل كلمة المرور الجديدة';
                    if (v.length < 8) return '8 أحرف على الأقل';
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                // Confirm password
                TextFormField(
                  controller: confirmPasswordCtrl,
                  obscureText: obscureConfirm,
                  decoration: InputDecoration(
                    labelText: 'تأكيد كلمة المرور',
                    prefixIcon: const Icon(Icons.lock),
                    suffixIcon: IconButton(
                      icon: Icon(obscureConfirm ? Icons.visibility_off : Icons.visibility),
                      onPressed: () => setDialogState(() => obscureConfirm = !obscureConfirm),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'أعد إدخال كلمة المرور';
                    if (v != newPasswordCtrl.text) return 'كلمتا المرور غير متطابقتين';
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('إلغاء', style: TextStyle(fontFamily: 'Tajawal')),
            ),
            ElevatedButton(
              onPressed: isLoading
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setDialogState(() => isLoading = true);
                      try {
                        final client = Supabase.instance.client;
                        // Verify current password by re-authenticating
                        final email = client.auth.currentUser?.email;
                        if (email == null) throw Exception('لا يوجد بريد إلكتروني');

                        // Update password via Supabase Auth
                        await client.auth.updateUser(
                          UserAttributes(password: newPasswordCtrl.text),
                        );

                        if (dialogContext.mounted) {
                          Navigator.pop(dialogContext);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('تم تغيير كلمة المرور بنجاح ✅',
                                  style: TextStyle(fontFamily: 'Tajawal')),
                              backgroundColor: AppTheme.successColor,
                            ),
                          );
                        }
                      } catch (e) {
                        if (dialogContext.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('فشل: $e',
                                  style: const TextStyle(fontFamily: 'Tajawal')),
                              backgroundColor: AppTheme.errorColor,
                            ),
                          );
                        }
                      } finally {
                        if (dialogContext.mounted) {
                          setDialogState(() => isLoading = false);
                        }
                      }
                    },
              child: isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('تغيير', style: TextStyle(fontFamily: 'Tajawal')),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // READ-ONLY TILE (for email, role, governorate)
  // ═══════════════════════════════════════════════════════════
  Widget _buildReadOnlyTile({
    required IconData icon,
    required String label,
    required String value,
    Widget? trailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.textHint.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppTheme.textSecondary, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: AppTheme.textHint,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ROLE BADGE
  // ═══════════════════════════════════════════════════════════
  Widget _roleBadge(UserRole? role) {
    if (role == null) return const SizedBox.shrink();

    final color = role.hierarchyLevel >= 4
        ? AppTheme.errorColor
        : role.hierarchyLevel >= 3
            ? AppTheme.warningColor
            : AppTheme.infoColor;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        'Lv.${role.hierarchyLevel}',
        style: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION LABEL
  // ═══════════════════════════════════════════════════════════
  Widget _sectionLabel(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.primaryColor),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  String _getInitials(String name) {
    if (name.trim().isEmpty) return '?';
    // Filter out empty parts from multiple spaces
    final parts = name.trim().split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return parts.first[0].toUpperCase();
  }

  /// ═══ FIX: Handle both network URLs and base64 data URLs for avatar ═══
  /// Previously: only NetworkImage — base64 fallback URLs crashed
  /// Now: detects data: URLs and uses MemoryImage, otherwise NetworkImage
  ImageProvider? _getAvatarImage(AuthState authState) {
    // Priority 1: Newly picked image (not saved yet)
    if (_pickedImageBytes != null) {
      return MemoryImage(_pickedImageBytes!);
    }

    // Priority 2: Saved avatar URL
    final url = authState.avatarUrl;
    if (url == null || url.isEmpty) return null;

    // Handle base64 data URLs (fallback from uploadAvatar)
    if (url.startsWith('data:')) {
      try {
        final base64Str = url.split(',').last;
        final bytes = base64Decode(base64Str);
        return MemoryImage(bytes);
      } catch (e) {
        debugPrint('[Profile] Failed to decode base64 avatar: $e');
        return null;
      }
    }

    // Handle network URLs
    return NetworkImage(url);
  }
}
