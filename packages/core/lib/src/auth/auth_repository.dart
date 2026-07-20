/// ═══════════════════════════════════════════════════════════════════════
///  AuthRepository — نسخة نهائية مستقرة
///  القواعد الذهبية:
///  1. لا signOut تلقائي أبداً — فقط يدوياً من المستخدم
///  2. لا مسح الجلسة بسبب فشل تجديد أو فشل Profile
///  3. إعادة محاولة ذكية مع backoff
///  4. Profile فشل ≠ فشل مصادقة
/// ═══════════════════════════════════════════════════════════════════════

import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';
import 'package:connectivity_plus/connectivity_plus.dart';
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
  int _restoreRetryCount = 0;
  static const int _maxRestoreRetries = 3;

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
      // ═══ FIX: لا تفشل — Supabase ممكن يكون لسه يتهيأ ═══
      _isConfigured = false;
      debugPrint('[Auth] Client not ready yet: $e — will retry');
      _currentState = app_auth.AuthState(
        error: 'Supabase initializing...',
      );
      _authStateController.add(_currentState);

      // ═══ FIX: Retry with exponential backoff — 2s, 5s, 10s ═══
      // Previously: single retry after 2s — not enough for slow devices
      // Now: 3 retries with increasing delays
      _retryInitWithBackoff(0);
      return;
    }

    _listenToAuthChanges();
    _tryRestoreSession();
    _startRefreshTimer();
  }

  /// ═══ FIX: Retry initialization with exponential backoff ═══
  static const _retryDelays = [2, 5, 10]; // seconds

  void _retryInitWithBackoff(int attempt) {
    if (attempt >= _retryDelays.length) {
      debugPrint('[Auth] Max retry attempts reached — will try on next app launch');
      return;
    }

    Future.delayed(Duration(seconds: _retryDelays[attempt]), () {
      try {
        _client = Supabase.instance.client;
        _isConfigured = true;
        _currentState = const app_auth.AuthState();
        _authStateController.add(_currentState);
        _tryRestoreSession();
        _startRefreshTimer();
        _listenToAuthChanges();
        debugPrint('[Auth] ✅ Client retry succeeded (attempt ${attempt + 1})');
      } catch (retryErr) {
        debugPrint('[Auth] Client retry ${attempt + 1}/${_retryDelays.length} failed: $retryErr');
        _retryInitWithBackoff(attempt + 1);
      }
    });
  }

  /// ═══ مراقبة تغييرات المصادقة ═══
  void _listenToAuthChanges() {
    _client?.auth.onAuthStateChange.listen((data) async {
      final event = data.event;
      final session = data.session;

      debugPrint('[Auth] Event: $event, Session: ${session != null}');

      if ((event == AuthChangeEvent.signedIn ||
              event == AuthChangeEvent.initialSession) &&
          session != null) {
        await _loadProfile(session.user.id);
        _refreshRetryCount = 0;
      } else if (event == AuthChangeEvent.signedOut) {
        // ═══ القاعدة الذهبية: لا نمسح الجلسة إلا يدوياً ═══
        // إذا كان هناك session في التخزين، حاول استعادته
        final storedSession = _client?.auth.currentSession;
        if (storedSession != null) {
          debugPrint('[Auth] SignedOut event but session exists — restoring');
          await _loadProfile(storedSession.user.id);
        } else {
          // فقط في حالة عدم وجود session محفوظ
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
  }

  /// ═══ بدء مؤقت التجديد الاستباقي ═══
  void _startRefreshTimer() {
    _sessionRefreshTimer?.cancel();
    _sessionRefreshTimer = Timer.periodic(
      const Duration(minutes: 3),
      (_) => _proactiveRefresh(),
    );
  }

  /// ═══ محاولة استعادة الجلسة مع حد أقصى ═══
  void _tryRestoreSession() {
    if (_restoreRetryCount >= _maxRestoreRetries) {
      debugPrint('[Auth] Max restore retries reached — waiting for user login');
      return;
    }

    try {
      final session = _client?.auth.currentSession;
      if (session != null) {
        debugPrint('[Auth] Restoring session for: ${session.user.email}');
        _restoreRetryCount = 0;
        _loadProfile(session.user.id);
      } else {
        debugPrint('[Auth] No session to restore');
      }
    } catch (e) {
      _restoreRetryCount++;
      debugPrint(
          '[Auth] Session restore failed (attempt $_restoreRetryCount): $e');
      // ═══ FIX: إعادة محاولة محدودة بدلاً من recursion لا نهائي ═══
      if (_restoreRetryCount < _maxRestoreRetries) {
        Future.delayed(
          Duration(seconds: 2 * _restoreRetryCount),
          _tryRestoreSession,
        );
      }
    }
  }

  /// ═══ تجديد استباقي مع إعادة محاولة تدريجية ═══
  Future<void> _proactiveRefresh() async {
    // ═══ FIX: Skip refresh when offline — saves battery and CPU ═══
    // Previously: tried to refresh every 3min even when offline → 5 failed attempts
    // Now: check connectivity first, skip if offline
    try {
      final isOnline = await _checkConnectivityQuick();
      if (!isOnline) {
        if (kDebugMode) debugPrint('[Auth] Offline — skipping proactive refresh');
        return;
      }
    } catch (_) {
      // Can't check connectivity — proceed with refresh attempt
    }

    try {
      final session = _client?.auth.currentSession;
      if (session == null) return;

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        session.expiresAt! * 1000,
      );
      final timeUntilExpiry = expiresAt.difference(DateTime.now());

      if (timeUntilExpiry.inMinutes < 15) {
        debugPrint(
            '[Auth] Token expiring in ${timeUntilExpiry.inMinutes}min — refreshing...');
        // ═══ FIX: إضافة timeout على refreshSession — لا يعلق indefinitely ═══
        try {
          await _client?.auth.refreshSession().timeout(
            const Duration(seconds: 10),
            onTimeout: () {
              debugPrint('[Auth] Session refresh timed out');
              throw TimeoutException('Session refresh timed out');
            },
          );
        } catch (refreshError) {
          debugPrint('[Auth] Session refresh error: $refreshError');
          rethrow;
        }
        _refreshRetryCount = 0;
      }
    } catch (e) {
      _refreshRetryCount++;
      debugPrint('[Auth] Refresh failed (attempt $_refreshRetryCount): $e');

      if (_refreshRetryCount < _maxRefreshRetries) {
        final delay = Duration(seconds: 30 * _refreshRetryCount);
        debugPrint('[Auth] Retrying refresh in ${delay.inSeconds}s');
        Future.delayed(delay, _proactiveRefresh);
      } else {
        debugPrint('[Auth] Max refresh retries — will try next cycle');
        _refreshRetryCount = 0;
      }
      // ═══ القاعدة الذهبية: لا تمسح الجلسة ═══
    }
  }

  /// ═══ تحميل Profile — فشله لا يُخرج المستخدم ═══
  Future<void> _loadProfile(String userId) async {
    if (!_isConfigured || _client == null) return;

    final user = _client!.auth.currentUser;
    if (user == null) return;

    // ═══ emit authenticated فوراً — لا تنتظر Profile ═══
    _currentState = app_auth.AuthState(
      isAuthenticated: true,
      userId: userId,
      email: user.email,
      fullName: user.userMetadata?['full_name'] ?? user.email?.split('@').first,
    );
    _authStateController.add(_currentState);

    // تحميل Profile في الخلفية (non-blocking)
    try {
      final response = await _client!
          .from('profiles')
          .select()
          .eq('id', userId)
          .maybeSingle()
          .timeout(const Duration(seconds: 15));

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
          position: response['position'],
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
          }, onConflict: 'id').timeout(const Duration(seconds: 15));

          final newResponse = await _client!
              .from('profiles')
              .select()
              .eq('id', userId)
              .maybeSingle()
              .timeout(const Duration(seconds: 15));

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
              position: newResponse['position'],
            );
          }
        } catch (createErr) {
          debugPrint('[Auth] Profile create failed (non-critical): $createErr');
        }
      }
    } catch (e) {
      // ═══ فشل Profile ≠ فشل مصادقة ═══
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

  /// ═══ signOut يمسح كل شي — فقط يدوياً ═══
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
      throw StateError('Not configured.');
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
      throw StateError('Not configured.');
    }

    final userId = _client!.auth.currentUser?.id;
    if (userId == null) throw StateError('Not authenticated.');

    final ext = filePath.split('.').last.toLowerCase();
    final fileName = 'avatar_${DateTime.now().millisecondsSinceEpoch}.$ext';
    final storagePath = 'avatars/$userId/$fileName';

    try {
      // ═══ FIX #3: Try uploading to Supabase Storage ═══
      await _client!.storage.from('avatars').uploadBinary(
            storagePath,
            fileBytes,
            fileOptions: FileOptions(contentType: 'image/$ext', upsert: true),
          );

      final publicUrl =
          _client!.storage.from('avatars').getPublicUrl(storagePath);

      await updateProfile(avatarUrl: publicUrl);
      return publicUrl;
    } catch (e) {
      // ═══ FIX: No base64 fallback — throw clear error ═══
      // Previously: stored base64 data URL in profiles table → bloated every query
      // Now: throw error so user knows upload failed
      debugPrint('[Auth] Storage upload failed: $e');
      throw FileStorageException(
        'فشل رفع الصورة. تحقق من اتصالك بالإنترنت وأعد المحاولة. '
        'خطأ: ${e.runtimeType}',
      );
    }
  }

  /// Quick connectivity check — uses cached state from ConnectivityUtils
  Future<bool> _checkConnectivityQuick() async {
    // Use the cached state from ConnectivityUtils (no HTTP probe)
    // This is fast (< 1ms) and doesn't drain battery
    try {
      final connectivity = Connectivity();
      final result = await connectivity.checkConnectivity().timeout(
        const Duration(seconds: 2),
        onTimeout: () => <ConnectivityResult>[],
      );
      return result.isNotEmpty && result.any((r) => r != ConnectivityResult.none);
    } catch (_) {
      return true; // Assume online if check fails
    }
  }

  void dispose() {
    _sessionRefreshTimer?.cancel();
    _authStateController.close();
  }
}
