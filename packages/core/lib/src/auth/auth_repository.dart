import 'dart:async';
import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
import '../config/supabase_config.dart';
import 'auth_state.dart' as app_auth;

class AuthRepository {
  SupabaseClient? _client;
  bool _isConfigured = false;
  Timer? _sessionRefreshTimer;
  final _authStateController = StreamController<app_auth.AuthState>.broadcast();

  Stream<app_auth.AuthState> get authStateChanges => _authStateController.stream;
  app_auth.AuthState _currentState = const app_auth.AuthState();
  app_auth.AuthState get currentState => _currentState;

  AuthRepository() {
    _init();
  }

  void _init() {
    // Safe initialization — don't crash if Supabase is not set up
    try {
      if (!SupabaseConfig.isConfigured) {
        _isConfigured = false;
        _currentState = const app_auth.AuthState(
          error: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.',
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

    // Restore session on app start — emit immediately
    try {
      final session = _client!.auth.currentSession;
      if (session != null) {
        _loadProfile(session.user.id);
      }
    } catch (e) {
      // Session restore failed — user will need to login
    }

    _client!.auth.onAuthStateChange.listen((data) async {
      final event = data.event;
      final session = data.session;

      if ((event == AuthChangeEvent.signedIn ||
               event == AuthChangeEvent.initialSession) &&
              session != null) {
        await _loadProfile(session.user.id);
      } else if (event == AuthChangeEvent.signedOut) {
        _currentState = const app_auth.AuthState();
        _authStateController.add(_currentState);
      } else if (event == AuthChangeEvent.tokenRefreshed && session != null) {
        // Token was refreshed — reload profile to keep state in sync
        await _loadProfile(session.user.id);
      } else if (event == AuthChangeEvent.passwordRecovery && session != null) {
        await _loadProfile(session.user.id);
      }
    });

    // Proactive session refresh: check every 4 minutes if token is near expiry
    _sessionRefreshTimer = Timer.periodic(const Duration(minutes: 4), (_) async {
      try {
        final session = _client?.auth.currentSession;
        if (session == null) return;
        final expiresAt = DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000);
        if (DateTime.now().isAfter(expiresAt.subtract(const Duration(minutes: 10)))) {
          await _client?.auth.refreshSession();
        }
      } catch (_) {
        // Silent fail — the next API call will trigger a retry
      }
    });
  }

  /// Loads profile from DB. If missing, creates one automatically.
  /// FIX: Emit authenticated state FIRST, then load profile in background.
  /// This prevents the user from being stuck on login while profile loads.
  Future<void> _loadProfile(String userId) async {
    if (!_isConfigured || _client == null) return;

    final user = _client!.auth.currentUser;
    if (user == null) return;

    // ═══ CRITICAL: Emit authenticated state IMMEDIATELY ═══
    // Don't wait for profile — the user is authenticated regardless.
    // Profile details can load in background and update the state later.
    _currentState = app_auth.AuthState(
      isAuthenticated: true,
      userId: userId,
      email: user.email,
      fullName: user.userMetadata?['full_name'] ?? user.email?.split('@').first,
    );
    _authStateController.add(_currentState);

    // Now load profile in background (non-blocking)
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
        // Profile missing — use Edge Function to create (avoids RLS race condition)
        // The handle_new_user trigger should have created it, but if it didn't,
        // we use a safe RPC call that runs with SECURITY DEFINER privileges.
        try {
          final rpcResult = await _client!.rpc('ensure_profile').timeout(
                const Duration(seconds: 10),
              );

          if (rpcResult != null) {
            final profileData = rpcResult as Map<String, dynamic>;
            _currentState = app_auth.AuthState(
              isAuthenticated: true,
              userId: userId,
              email: profileData['email'] ?? user.email,
              role: _parseRole(profileData['role']),
              governorateId: profileData['governorate_id'],
              districtId: profileData['district_id'],
              fullName: profileData['full_name'],
              phone: profileData['phone'],
              avatarUrl: profileData['avatar_url'],
              nationalId: profileData['national_id'],
            );
          }
        } catch (_) {
          // RPC not available (migration not applied) — fall back to basic auth state
          debugPrint('[AuthRepository] ensure_profile RPC not available');
        }
      }
    } catch (e) {
      // Profile load failed — but user is still authenticated with basic info
      debugPrint('[AuthRepository] Profile load failed (non-critical): $e');
      // Keep the initial authenticated state with basic info
    }

    _authStateController.add(_currentState);
  }

  /// Safely parse a role string from the DB into [UserRole].
  /// Enum names now match SQL ENUM values directly.
  static app_auth.UserRole? _parseRole(String? role) {
    if (role == null) return null;
    const roleMap = {
      'admin': app_auth.UserRole.admin,
      'central': app_auth.UserRole.central,
      'governorate': app_auth.UserRole.governorate,
      'district': app_auth.UserRole.district,
      'data_entry': app_auth.UserRole.data_entry,
      'teamLead': app_auth.UserRole.data_entry, // backward compat
    };
    return roleMap[role];
  }

  Future<AuthResponse> signIn(String email, String password) async {
    if (!_isConfigured || _client == null) {
      throw StateError('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY.');
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
      _currentState = _currentState.copyWith(isLoading: false, error: e.toString());
      _authStateController.add(_currentState);
      rethrow;
    }
  }

  Future<void> signOut() async {
    if (!_isConfigured || _client == null) return;
    await _client!.auth.signOut();
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

  /// Update the current user's profile fields in the database and refresh local state.
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

    // Refresh local state
    _currentState = _currentState.copyWith(
      fullName: fullName ?? _currentState.fullName,
      phone: phone ?? _currentState.phone,
      nationalId: nationalId ?? _currentState.nationalId,
      avatarUrl: avatarUrl ?? _currentState.avatarUrl,
    );
    _authStateController.add(_currentState);
  }

  /// Upload avatar image to Supabase Storage and return the public URL.
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
          fileOptions: FileOptions(
            contentType: 'image/$ext',
            upsert: true,
          ),
        );

    final publicUrl = _client!.storage.from('avatars').getPublicUrl(storagePath);

    // Update profile with new avatar URL
    await updateProfile(avatarUrl: publicUrl);

    return publicUrl;
  }

  void dispose() {
    _sessionRefreshTimer?.cancel();
    _authStateController.close();
  }
}
