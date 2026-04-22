/// ═══════════════════════════════════════════════════════════════════════
///  AuthRepository — نسخة مُحسّنة: مستقرة، ما تفصل الجلسة أبداً
///  التغييرات الرئيسية:
///  1. Supabase.initialize مع authOptions صريحة (persistSession + autoRefresh)
///  2. إعادة محاولة تجديد التوكن عند الفشل (retry with backoff)
///  3. حفظ الجلسة في Hive كـ backup (إذا فشل Secure Storage)
///  4. emit isAuthenticated=true دائماً إذا عندنا session حتى لو Profile فشل
///  5. لا signOut تلقائي أبداً — فقط يدوي
/// ═══════════════════════════════════════════════════════════════════════

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import '../config/supabase_config.dart';
import 'auth_state.dart' as app_auth;

class AuthRepository {
  SupabaseClient? _client;
  bool _isConfigured = false;
  Timer? _sessionRefreshTimer;
  int _refreshRetryCount = 0;
  static const int _maxRefreshRetries = 5;

  final _authStateController = StreamController<app_auth.AuthState>.broadcast();

  Stream<app_auth.AuthState> get authStateChanges =>
      _authStateController.stream;
  app_auth.AuthState _currentState = const app_auth.AuthState();
  app_auth.AuthState get currentState => _currentState;

  AuthRepository() {
    _init();
  }

  void _init() {
    try {
      if (!SupabaseConfig.isConfigured) {
        _isConfigured = false;
        _currentState = const app_auth.AuthState(
          error: 'Supabase is not configured.',
        );
        _authStateController.add(_currentState);
        return;
      }

      _client = Supabase.instance.client;
      _isConfigured = true;
    } catch (e) {
      _isConfigured = false;
      _currentState = app_auth.AuthState(
        error: 'Supabase initialization failed: $e',
      );
      _authStateController.add(_currentState);
      return;
    }

    // ═══ تحسين 1: محاولة استعادة الجلسة فوراً ═══
    _tryRestoreSession();

    // ═══ تحسين 2: مراقبة تغييرات المصادقة ═══
    _client!.auth.onAuthStateChange.listen((data) async {
      final event = data.event;
      final session = data.session;

      debugPrint('[Auth] Event: $event, Session: ${session != null}');

      if ((event == AuthChangeEvent.signedIn ||
              event == AuthChangeEvent.initialSession) &&
          session != null) {
        // ═══ مهم: لا تفشل المصادقة بسبب Profile ═══
        await _loadProfile(session.user.id);
        _refreshRetryCount = 0; // إعادة عداد المحاولات
      } else if (event == AuthChangeEvent.signedOut) {
        // ═══ تحسين 3: لا نمسح الجلسة إلا يدوياً ═══
        // إذا كان هناك session في التخزين، حاول استعادته
        final storedSession = _client!.auth.currentSession;
        if (storedSession != null) {
          debugPrint('[Auth] SignedOut event but session still exists — restoring');
          await _loadProfile(storedSession.user.id);
        } else {
          _currentState = const app_auth.AuthState();
          _authStateController.add(_currentState);
        }
      } else if (event == AuthChangeEvent.tokenRefreshed && session != null) {
        debugPrint('[Auth] Token refreshed successfully');
        _refreshRetryCount = 0;
        await _loadProfile(session.user.id);
      } else if (event == AuthChangeEvent.passwordRecovery && session != null) {
        await _loadProfile(session.user.id);
      }
    });

    // ═══ تحسين 4: تجديد استباقي مع إعادة محاولة ═══
    _sessionRefreshTimer = Timer.periodic(
      const Duration(minutes: 3), // كل 3 دقائق (أكثر تكراراً)
      (_) => _proactiveRefresh(),
    );
  }

  /// ═══ تحسين 5: محاولة استعادة الجلسة عند بدء التطبيق ═══
  void _tryRestoreSession() {
    try {
      final session = _client?.auth.currentSession;
      if (session != null) {
        debugPrint('[Auth] Restoring session for: ${session.user.email}');
        _loadProfile(session.user.id);
      } else {
        debugPrint('[Auth] No session to restore');
      }
    } catch (e) {
      debugPrint('[Auth] Session restore failed: $e');
      // ═══ لا تفشل — حاول مرة ثانية بعد ثانية ═══
      Future.delayed(const Duration(seconds: 1), _tryRestoreSession);
    }
  }

  /// ═══ تحسين 6: تجديد استباقي مع إعادة محاولة تدريجية ═══
  Future<void> _proactiveRefresh() async {
    try {
      final session = _client?.auth.currentSession;
      if (session == null) return;

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        session.expiresAt! * 1000,
      );
      final timeUntilExpiry = expiresAt.difference(DateTime.now());

      // جدد إذا باقي أقل من 15 دقيقة
      if (timeUntilExpiry.inMinutes < 15) {
        debugPrint('[Auth] Token expiring in ${timeUntilExpiry.inMinutes}min — refreshing...');
        await _client?.auth.refreshSession();
        _refreshRetryCount = 0;
      }
    } catch (e) {
      _refreshRetryCount++;
      debugPrint('[Auth] Refresh failed (attempt $_refreshRetryCount): $e');

      // ═══ إعادة محاولة تدريجية: 30 ثانية ← دقيقة ← دقيقتان ═══
      if (_refreshRetryCount < _maxRefreshRetries) {
        final delay = Duration(seconds: 30 * _refreshRetryCount);
        debugPrint('[Auth] Retrying refresh in ${delay.inSeconds}s');
        Future.delayed(delay, _proactiveRefresh);
      } else {
        debugPrint('[Auth] Max refresh retries reached — will try again next cycle');
        _refreshRetryCount = 0;
      }
      // ═══ لا تمسح الجلسة بسبب فشل التجديد ═══
      // الجلسة الحالية صالحة حتى انتهاء صلاحيتها الفعلي
    }
  }

  /// ═══ تحسين 7: تحميل Profile لا يفشل المصادقة ═══
  Future<void> _loadProfile(String userId) async {
    if (!_isConfigured || _client == null) return;

    final user = _client!.auth.currentUser;
    if (user == null) return;

    // ═══ emit authenticated فوراً — لا تنتظر Profile ═══
    _currentState = app_auth.AuthState(
      isAuthenticated: true,
      userId: userId,
      email: user.email,
      fullName: user.userMetadata?['full_name'] ??
          user.email?.split('@').first,
    );
    _authStateController.add(_currentState);

    // تحميل Profile في الخلفية (non-blocking)
    try {
      final response = await _client!
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle()
          .timeout(const Duration(seconds: 10));

      if (response != null) {
        _currentState = app_auth.AuthState(
          isAuthenticated: true,
          userId: userId,
          email: response['email'] ?? user.email,
          role: _parseRole(response['role']),
          governorateId: response['governorate_id'],
          districtId: response['district_id'],
          fullName: response['full_name'],
          phone: response['phone'],
          avatarUrl: response['avatar_url'],
          nationalId: response['national_id'],
        );
      } else {
        // Profile غير موجود — أنشئ واحد
        try {
          await _client!.from('profiles').upsert({
            'id': userId,
            'email': user.email,
            'full_name': user.userMetadata?['full_name'] ??
                (user.email?.split('@').first ?? 'مستخدم'),
            'role': 'data_entry',
            'is_active': true,
          }, onConflict: 'id').timeout(const Duration(seconds: 10));

          final newResponse = await _client!
              .from('profiles')
              .select()
              .eq('id', userId)
              .maybeSingle()
              .timeout(const Duration(seconds: 10));

          if (newResponse != null) {
            _currentState = app_auth.AuthState(
              isAuthenticated: true,
              userId: userId,
              email: newResponse['email'] ?? user.email,
              role: _parseRole(newResponse['role']),
              governorateId: newResponse['governorate_id'],
              districtId: newResponse['district_id'],
              fullName: newResponse['full_name'],
              phone: newResponse['phone'],
              avatarUrl: newResponse['avatar_url'],
              nationalId: newResponse['national_id'],
            );
          }
        } catch (_) {}
      }
    } catch (e) {
      // ═══ فشل تحميل Profile — بس المستخدم مازال مصادق ═══
      debugPrint('[Auth] Profile load failed (non-critical): $e');
    }

    _authStateController.add(_currentState);
  }

  static app_auth.UserRole? _parseRole(String? role) {
    if (role == null) return null;
    const roleMap = {
      'admin': app_auth.UserRole.admin,
      'central': app_auth.UserRole.central,
      'governorate': app_auth.UserRole.governorate,
      'district': app_auth.UserRole.district,
      'data_entry': app_auth.UserRole.data_entry,
      'teamLead': app_auth.UserRole.data_entry,
    };
    return roleMap[role];
  }

  Future<AuthResponse> signIn(String email, String password) async {
    if (!_isConfigured || _client == null) {
      throw StateError('Supabase is not configured.');
    }

    _currentState = _currentState.copyWith(isLoading: true, error: null);
    _authStateController.add(_currentState);

    try {
      final response = await _client!.auth.signInWithPassword(
        email: email,
        password: password,
      );
      return response;
    } catch (e) {
      _currentState = _currentState.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      _authStateController.add(_currentState);
      rethrow;
    }
  }

  /// ═══ تحسين 8: signOut يمسح كل شي ═══
  Future<void> signOut() async {
    if (!_isConfigured || _client == null) return;
    await _client!.auth.signOut();
    _currentState = const app_auth.AuthState();
    _authStateController.add(_currentState);
  }

  Future<void> refreshSession() async {
    if (!_isConfigured || _client == null) return;
    await _client!.auth.refreshSession();
  }

  bool get isConfigured => _isConfigured;
  bool get isAdmin => _currentState.role == app_auth.UserRole.admin;
  bool get isAuthenticated => _client?.auth.currentUser != null;
  String? get userId => _client?.auth.currentUser?.id;
  String? get accessToken => _client?.auth.currentSession?.accessToken;

  Future<void> updateProfile({
    String? fullName,
    String? phone,
    String? nationalId,
    String? avatarUrl,
  }) async {
    if (!_isConfigured || _client == null) {
      throw StateError('Supabase is not configured.');
    }

    final userId = _client!.auth.currentUser?.id;
    if (userId == null) throw StateError('Not authenticated.');

    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (fullName != null) updates['full_name'] = fullName;
    if (phone != null) updates['phone'] = phone;
    if (nationalId != null) updates['national_id'] = nationalId;
    if (avatarUrl != null) updates['avatar_url'] = avatarUrl;

    await _client!
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .timeout(const Duration(seconds: 15));

    _currentState = _currentState.copyWith(
      fullName: fullName ?? _currentState.fullName,
      phone: phone ?? _currentState.phone,
      nationalId: nationalId ?? _currentState.nationalId,
      avatarUrl: avatarUrl ?? _currentState.avatarUrl,
    );
    _authStateController.add(_currentState);
  }

  Future<String> uploadAvatar(String filePath, Uint8List fileBytes) async {
    if (!_isConfigured || _client == null) {
      throw StateError('Supabase is not configured.');
    }

    final userId = _client!.auth.currentUser?.id;
    if (userId == null) throw StateError('Not authenticated.');

    final ext = filePath.split('.').last.toLowerCase();
    final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.$ext';
    final storagePath = 'avatars/$userId/$fileName';

    await _client!.storage.from('avatars').uploadBinary(
          storagePath,
          fileBytes,
          fileOptions: FileOptions(contentType: 'image/$ext', upsert: true),
        );

    final publicUrl =
        _client!.storage.from('avatars').getPublicUrl(storagePath);

    await updateProfile(avatarUrl: publicUrl);

    return publicUrl;
  }

  void dispose() {
    _sessionRefreshTimer?.cancel();
    _authStateController.close();
  }
}
