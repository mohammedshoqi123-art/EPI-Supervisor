import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../router/app_router.dart';
import 'user_form_sheet.dart';

/// إدارة المستخدمين — User Management (Add + Edit + Delete)
class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  final _searchController = TextEditingController();
  String? _filterRole;
  bool? _filterActive;
  bool _isLoading = true;
  List<Map<String, dynamic>> _users = [];
  List<Map<String, dynamic>> _governorates = [];
  List<Map<String, dynamic>> _districts = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAll();

    // ═══ NO auto-refresh — user presses sync button ═══
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final client = Supabase.instance.client;
      // Load users
      var query = client
          .from('profiles')
          .select('*, governorates(name_ar), districts(name_ar)');
      if (_searchController.text.isNotEmpty) {
        query = query.or(
          'full_name.ilike.%${_searchController.text}%,email.ilike.%${_searchController.text}%',
        );
      }
      if (_filterRole != null) query = query.eq('role', _filterRole!);
      if (_filterActive != null) query = query.eq('is_active', _filterActive!);
      final response =
          await query.order('created_at', ascending: false).limit(10000);

      // Load governorates for the form
      final govs = await client
          .from('governorates')
          .select('id, name_ar')
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name_ar');
      final districts = await client
          .from('districts')
          .select('id, name_ar, governorate_id')
          .eq('is_active', true)
          .isFilter('deleted_at', null)
          .order('name_ar');

      setState(() {
        _users = (response as List<dynamic>).cast<Map<String, dynamic>>();
        _governorates = (govs as List<dynamic>).cast<Map<String, dynamic>>();
        _districts = (districts as List<dynamic>).cast<Map<String, dynamic>>();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  // ═══════════════════════════════════════
  // ADD USER
  // ═══════════════════════════════════════
  Future<void> _addUser() async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => UserFormSheet(
        governorates: _governorates,
        districts: _districts,
        title: 'إضافة مستخدم جديد',
      ),
    );
    if (result == null) return;

    try {
      final client = Supabase.instance.client;
      // Create auth user via Edge Function
      await client.functions.invoke(
        'create-admin',
        body: {
          'email': result['email'],
          'password': result['password'],
          'full_name': result['full_name'],
          'role': result['role'],
          'phone': result['phone'],
          'governorate_id': result['governorate_id'],
          'district_id': result['district_id'],
          'national_id': result['national_id'],
          'secret': '',
        },
      );

      _loadAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم إضافة المستخدم بنجاح ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل الإضافة: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  // ═══════════════════════════════════════
  // EDIT USER
  // ═══════════════════════════════════════
  Future<void> _editUser(Map<String, dynamic> user) async {
    final result = await showModalBottomSheet<Map<String, dynamic>>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => UserFormSheet(
        governorates: _governorates,
        districts: _districts,
        title: 'تعديل المستخدم',
        existingUser: user,
      ),
    );
    if (result == null) return;

    try {
      final client = Supabase.instance.client;
      final updateData = <String, dynamic>{
        'full_name': result['full_name'],
        'role': result['role'],
        'phone': result['phone'],
        'governorate_id': result['governorate_id'],
        'district_id': result['district_id'],
        'national_id': result['national_id'],
      };
      await client.from('profiles').update(updateData).eq('id', user['id']);
      _loadAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم تحديث المستخدم ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل التحديث: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  // ═══════════════════════════════════════
  // DELETE USER
  // ═══════════════════════════════════════
  Future<void> _deleteUser(Map<String, dynamic> user) async {
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
                'حذف المستخدم',
                style: TextStyle(fontFamily: 'Cairo', fontSize: 18),
              ),
            ],
          ),
          content: Text(
            'هل أنت متأكد من حذف "${user['full_name']}"؟\nلا يمكن التراجع عن هذا الإجراء.',
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

    try {
      final client = Supabase.instance.client;
      // Soft delete
      await client
          .from('profiles')
          .update({'deleted_at': DateTime.now().toIso8601String()}).eq(
              'id', user['id']);
      _loadAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم حذف المستخدم ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشل الحذف: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: AppTheme.errorColor,
          ),
        );
      }
    }
  }

  // ═══════════════════════════════════════
  // TOGGLE ACTIVE
  // ═══════════════════════════════════════
  Future<void> _toggleUserActive(Map<String, dynamic> user) async {
    try {
      final client = Supabase.instance.client;
      final newStatus = !(user['is_active'] as bool? ?? true);
      await client
          .from('profiles')
          .update({'is_active': newStatus}).eq('id', user['id']);
      _loadAll();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newStatus ? 'تم تفعيل المستخدم ✅' : 'تم تعطيل المستخدم ⚠️',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'خطأ: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'إدارة المستخدمين',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        centerTitle: true,
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [AppTheme.primaryColor, AppTheme.primaryDark],
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded),
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _addUser,
        backgroundColor: AppTheme.primaryColor,
        icon: const Icon(Icons.person_add_rounded, color: Colors.white),
        label: const Text(
          'إضافة',
          style: TextStyle(
            fontFamily: 'Tajawal',
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'بحث بالاسم أو البريد...',
                hintStyle: const TextStyle(fontFamily: 'Tajawal'),
                prefixIcon: const Icon(Icons.search_rounded),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey.shade100,
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadAll();
                        },
                      )
                    : null,
              ),
              onChanged: (_) => _loadAll(),
              textInputAction: TextInputAction.search,
            ),
          ),
          // Active filters
          if (_filterRole != null || _filterActive != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  if (_filterRole != null)
                    Chip(
                      label: Text(
                        _roleNameAr(_filterRole!),
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                        ),
                      ),
                      onDeleted: () {
                        setState(() => _filterRole = null);
                        _loadAll();
                      },
                      backgroundColor: AppTheme.primaryColor.withValues(
                        alpha: 0.1,
                      ),
                    ),
                  const SizedBox(width: 8),
                  if (_filterActive != null)
                    Chip(
                      label: Text(
                        _filterActive! ? 'مفعل' : 'معطل',
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 12,
                        ),
                      ),
                      onDeleted: () {
                        setState(() => _filterActive = null);
                        _loadAll();
                      },
                      backgroundColor: AppTheme.primaryColor.withValues(
                        alpha: 0.1,
                      ),
                    ),
                ],
              ),
            ),
          // User count
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                Text(
                  'إجمالي: ${_users.length} مستخدم',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          // Content
          Expanded(child: _buildContent()),
          const SizedBox(height: 80), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) return const Center(child: EpiLoading.shimmer());
    if (_error != null)
      return Center(
        child: EpiErrorWidget(message: _error!, onRetry: _loadAll),
      );
    if (_users.isEmpty)
      return Center(
        child: EpiEmptyState(
          icon: Icons.people_outline_rounded,
          title: 'لا توجد مستخدمين',
          actionText: 'إعادة تحميل',
          onAction: _loadAll,
        ),
      );

    return RefreshIndicator(
      onRefresh: _loadAll,
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _users.length,
        itemBuilder: (context, i) => _buildUserCard(_users[i]),
      ),
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final isActive = user['is_active'] as bool? ?? true;
    final role = user['role'] as String? ?? 'data_entry';
    final gov = user['governorates'] as Map<String, dynamic>?;
    final dist = user['districts'] as Map<String, dynamic>?;

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => _showUserActions(user),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              CircleAvatar(
                radius: 26,
                backgroundColor: isActive
                    ? AppTheme.primaryColor.withValues(alpha: 0.1)
                    : Colors.grey.shade200,
                child: Text(
                  (user['full_name'] ?? 'م')[0],
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: isActive ? AppTheme.primaryColor : Colors.grey,
                  ),
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
                            user['full_name'] ?? '—',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: isActive ? null : Colors.grey,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: _roleColor(role).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _roleNameAr(role),
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 11,
                              color: _roleColor(role),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user['email'] ?? '',
                      style: const TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    if (gov != null)
                      Text(
                        '${gov['name_ar']}${dist != null ? ' — ${dist['name_ar']}' : ''}',
                        style: const TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: AppTheme.textHint,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Column(
                children: [
                  Switch(
                    value: isActive,
                    onChanged: (_) => _toggleUserActive(user),
                    activeColor: AppTheme.successColor,
                  ),
                  Text(
                    isActive ? 'مفعل' : 'معطل',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 10,
                      color: isActive
                          ? AppTheme.successColor
                          : AppTheme.errorColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showUserActions(Map<String, dynamic> user) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            CircleAvatar(
              radius: 32,
              backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
              child: Text(
                (user['full_name'] ?? 'م')[0],
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primaryColor,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              user['full_name'] ?? '—',
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              user['email'] ?? '',
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            _actionTile(
              Icons.edit_rounded,
              'تعديل البيانات',
              AppTheme.primaryColor,
              () {
                Navigator.pop(ctx);
                _editUser(user);
              },
            ),
            _actionTile(
              Icons.toggle_on_rounded,
              (user['is_active'] as bool? ?? true)
                  ? 'تعطيل الحساب'
                  : 'تفعيل الحساب',
              AppTheme.warningColor,
              () {
                Navigator.pop(ctx);
                _toggleUserActive(user);
              },
            ),
            _actionTile(
              Icons.delete_forever_rounded,
              'حذف المستخدم',
              AppTheme.errorColor,
              () {
                Navigator.pop(ctx);
                _deleteUser(user);
              },
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _actionTile(
    IconData icon,
    String title,
    Color color,
    VoidCallback onTap,
  ) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 22),
      ),
      title: Text(
        title,
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontWeight: FontWeight.w500,
          color: color,
        ),
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onTap: onTap,
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'تصفية',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'الدور:',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                null,
                'admin',
                'central',
                'governorate',
                'district',
                'data_entry',
              ].map((r) {
                final selected = _filterRole == r;
                return ChoiceChip(
                  label: Text(
                    r == null ? 'الكل' : _roleNameAr(r),
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  selected: selected,
                  onSelected: (_) {
                    setState(() => _filterRole = r);
                    Navigator.pop(ctx);
                    _loadAll();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
            const Text(
              'الحالة:',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [null, true, false].map((v) {
                final selected = _filterActive == v;
                return ChoiceChip(
                  label: Text(
                    v == null
                        ? 'الكل'
                        : v
                            ? 'مفعل'
                            : 'معطل',
                    style: const TextStyle(fontFamily: 'Tajawal'),
                  ),
                  selected: selected,
                  onSelected: (_) {
                    setState(() => _filterActive = v);
                    Navigator.pop(ctx);
                    _loadAll();
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  String _roleNameAr(String role) {
    const roles = {
      'admin': 'مدير النظام',
      'central': 'مركزي',
      'governorate': 'محافظة',
      'district': 'مديرية',
      'data_entry': 'إدخال بيانات',
    };
    return roles[role] ?? role;
  }

  Color _roleColor(String role) {
    const colors = {
      'admin': Color(0xFFD32F2F),
      'central': Color(0xFF7B1FA2),
      'governorate': Color(0xFF1565C0),
      'district': Color(0xFF00838F),
      'data_entry': Color(0xFF43A047),
    };
    return colors[role] ?? Colors.grey;
  }
}

// ═══════════════════════════════════════════════════════════
// USER FORM SHEET — Add/Edit
// ═══════════════════════════════════════════════════════════
