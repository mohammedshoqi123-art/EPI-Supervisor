import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';

/// ═══════════════════════════════════════════════════════════════════════
/// Realtime Sync Service
/// ي listens for changes in Supabase tables
/// DOES NOT auto-refresh — just notifies user that data changed
/// User presses sync button to update
/// ═══════════════════════════════════════════════════════════════════════

class RealtimeSyncService {
  final Ref _ref;
  RealtimeChannel? _formsChannel;
  RealtimeChannel? _referencesChannel;
  RealtimeChannel? _profilesChannel;
  RealtimeChannel? _governoratesChannel;
  RealtimeChannel? _districtsChannel;
  bool _isListening = false;

  /// Stream of change events — UI can listen to show "data changed" indicator
  final _changeController = StreamController<String>.broadcast();
  Stream<String> get onChange => _changeController.stream;

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
          _changeController.add('forms');
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
          _changeController.add('references');
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
          debugPrint(
              '[RealtimeSync] Governorates changed: ${payload.eventType}');
          _changeController.add('governorates');
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
          _changeController.add('districts');
        },
      );
      _districtsChannel!.subscribe();

      _isListening = true;
      debugPrint('[RealtimeSync] ✅ Started listening for changes');
    } catch (e) {
      debugPrint('[RealtimeSync] ❌ Failed to start: $e');
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
        debugPrint(
            '[RealtimeSync] ⚠️ Current user deactivated — forcing logout');
        Supabase.instance.client.auth.signOut();
      }
    } catch (e) {
      debugPrint('[RealtimeSync] Active check error: $e');
    }
  }

  /// Stop listening for changes
  void dispose() {
    _formsChannel?.unsubscribe();
    _referencesChannel?.unsubscribe();
    _profilesChannel?.unsubscribe();
    _governoratesChannel?.unsubscribe();
    _districtsChannel?.unsubscribe();
    _changeController.close();
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
