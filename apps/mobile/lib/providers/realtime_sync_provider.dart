import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// Realtime Sync Service
/// ي listens for changes in Supabase tables and invalidates local cache
/// ensures that admin dashboard changes are reflected in mobile app instantly
/// ═══════════════════════════════════════════════════════════════════════

class RealtimeSyncService {
  final Ref _ref;
  RealtimeChannel? _formsChannel;
  RealtimeChannel? _referencesChannel;
  RealtimeChannel? _profilesChannel;
  RealtimeChannel? _governoratesChannel;
  RealtimeChannel? _districtsChannel;
  bool _isListening = false;

  RealtimeSyncService(this._ref);

  /// Start listening for realtime changes on key tables
  void startListening() {
    if (_isListening) return;
    if (!SupabaseConfig.isConfigured) return;

    try {
      final client = Supabase.instance.client;

      // ═══ Listen for FORMS changes ═══
      _formsChannel = client.channel('mobile-forms-sync');
      _formsChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'forms',
        callback: (payload) {
          debugPrint('[RealtimeSync] Forms changed: ${payload.eventType}');
          _invalidateFormsCache();
        },
      );
      _formsChannel!.subscribe();

      // ═══ Listen for REFERENCES changes ═══
      _referencesChannel = client.channel('mobile-references-sync');
      _referencesChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'doc_references',
        callback: (payload) {
          debugPrint('[RealtimeSync] References changed: ${payload.eventType}');
          _invalidateReferencesCache();
        },
      );
      _referencesChannel!.subscribe();

      // ═══ Listen for PROFILES changes (user active/inactive) ═══
      _profilesChannel = client.channel('mobile-profiles-sync');
      _profilesChannel!.onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'profiles',
        callback: (payload) {
          debugPrint('[RealtimeSync] Profile updated: ${payload.newRecord}');
          _checkCurrentUserActive(payload.newRecord);
        },
      );
      _profilesChannel!.subscribe();

      // ═══ Listen for GOVERNORATES changes ═══
      _governoratesChannel = client.channel('mobile-govs-sync');
      _governoratesChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'governorates',
        callback: (payload) {
          debugPrint('[RealtimeSync] Governorates changed: ${payload.eventType}');
          _invalidateGovernoratesCache();
        },
      );
      _governoratesChannel!.subscribe();

      // ═══ Listen for DISTRICTS changes ═══
      _districtsChannel = client.channel('mobile-districts-sync');
      _districtsChannel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'districts',
        callback: (payload) {
          debugPrint('[RealtimeSync] Districts changed: ${payload.eventType}');
          _invalidateDistrictsCache();
        },
      );
      _districtsChannel!.subscribe();

      _isListening = true;
      debugPrint('[RealtimeSync] ✅ Started listening for changes');
    } catch (e) {
      debugPrint('[RealtimeSync] ❌ Failed to start: $e');
    }
  }

  /// Invalidate forms cache — forces mobile to re-fetch from server
  void _invalidateFormsCache() {
    try {
      _ref.invalidate(formsProvider);
      _ref.invalidate(formStatsProvider);
      // Also clear offline cache
      _clearOfflineCache('forms');
      debugPrint('[RealtimeSync] Forms cache invalidated');
    } catch (e) {
      debugPrint('[RealtimeSync] Forms invalidation error: $e');
    }
  }

  /// Invalidate references cache
  void _invalidateReferencesCache() {
    // References screen loads directly from Supabase, no Riverpod provider
    // The screen will refresh on next visit
    debugPrint('[RealtimeSync] References changed — will refresh on next visit');
  }

  /// Invalidate governorates cache
  void _invalidateGovernoratesCache() {
    try {
      _ref.invalidate(governoratesProvider);
      _clearOfflineCache('governorates');
      debugPrint('[RealtimeSync] Governorates cache invalidated');
    } catch (e) {
      debugPrint('[RealtimeSync] Governorates invalidation error: $e');
    }
  }

  /// Invalidate districts cache
  void _invalidateDistrictsCache() {
    try {
      _ref.invalidate(districtsProvider);
      _clearOfflineCache('districts');
      debugPrint('[RealtimeSync] Districts cache invalidated');
    } catch (e) {
      debugPrint('[RealtimeSync] Districts invalidation error: $e');
    }
  }

  /// Check if current user was deactivated — force logout if so
  void _checkCurrentUserActive(Map<String, dynamic> record) {
    try {
      final currentUser = SupabaseConfig.currentUser;
      if (currentUser == null) return;

      final recordId = record['id'] as String?;
      if (recordId != currentUser.id) return;

      final isActive = record['is_active'] as bool? ?? true;
      if (!isActive) {
        debugPrint('[RealtimeSync] ⚠️ Current user deactivated — forcing logout');
        Supabase.instance.client.auth.signOut();
      }
    } catch (e) {
      debugPrint('[RealtimeSync] Active check error: $e');
    }
  }

  /// Clear specific cache key from offline storage
  Future<void> _clearOfflineCache(String prefix) async {
    try {
      final cache = await _ref.read(offlineDataCacheProvider.future);
      // Clear all cache keys that start with the prefix
      await cache.forceInvalidate(prefix);
      // Also clear campaign-specific forms cache
      final campaign = _ref.read(campaignProvider);
      if (prefix == 'forms') {
        await cache.forceInvalidate('forms_${campaign.value}');
        await cache.forceInvalidate('forms_all');
      }
    } catch (e) {
      debugPrint('[RealtimeSync] Cache clear error: $e');
    }
  }

  /// Stop listening for changes
  void dispose() {
    _formsChannel?.unsubscribe();
    _referencesChannel?.unsubscribe();
    _profilesChannel?.unsubscribe();
    _governoratesChannel?.unsubscribe();
    _districtsChannel?.unsubscribe();
    _isListening = false;
    debugPrint('[RealtimeSync] Stopped listening');
  }
}

/// Provider for the Realtime Sync Service
final realtimeSyncProvider = Provider<RealtimeSyncService>((ref) {
  final service = RealtimeSyncService(ref);
  service.startListening();
  ref.onDispose(service.dispose);
  return service;
});
