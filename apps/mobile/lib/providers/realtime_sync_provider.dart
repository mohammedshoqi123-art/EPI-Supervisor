import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:epi_core/epi_core.dart';
import 'app_providers.dart' show formStatsProvider;

/// ═══════════════════════════════════════════════════════════════════════
/// Realtime Sync Service
/// ي listens for changes in Supabase tables
/// DOES NOT auto-refresh — just notifies user that data changed
/// User presses sync button to update
/// ═══════════════════════════════════════════════════════════════════════

class RealtimeSyncService {
  final Ref _ref;
  RealtimeChannel? _channel;  // ═══ PERFORMANCE: Single channel instead of 5 ═══
  bool _isListening = false;
  Timer? _debounceTimer;
  final Set<String> _pendingInvalidations = {};

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

      // ═══ PERFORMANCE FIX: Single channel for all tables ═══
      // Reduces from 5 WebSocket connections to 1
      _channel = client.channel('mobile-sync');

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'forms',
        callback: (payload) {
          debugPrint('[RealtimeSync] Forms changed: ${payload.eventType}');
          _changeController.add('forms');
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'doc_references',
        callback: (payload) {
          debugPrint('[RealtimeSync] References changed: ${payload.eventType}');
          _changeController.add('references');
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'profiles',
        callback: (payload) {
          debugPrint('[RealtimeSync] Profile updated: ${payload.newRecord}');
          _checkCurrentUserActive(payload.newRecord);
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'governorates',
        callback: (payload) {
          debugPrint(
              '[RealtimeSync] Governorates changed: ${payload.eventType}');
          _changeController.add('governorates');
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'districts',
        callback: (payload) {
          debugPrint('[RealtimeSync] Districts changed: ${payload.eventType}');
          _changeController.add('districts');
        },
      );

      // ═══ FIX P1-5: Subscribe to form_submissions for realtime updates ═══
      // Previously: other users never saw new submissions in realtime
      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'form_submissions',
        callback: (payload) {
          debugPrint('[RealtimeSync] New submission: ${payload.newRecord['id']}');
          _changeController.add('form_submissions');
          _scheduleInvalidation('form_submissions');
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'form_submissions',
        callback: (payload) {
          debugPrint('[RealtimeSync] Submission updated: ${payload.newRecord['id']}');
          _changeController.add('form_submissions');
          _scheduleInvalidation('form_submissions');
        },
      );

      // ═══ FIX: Subscribe to feedback_tickets and official_memos ═══
      // Previously: changes by other users required manual refresh
      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'feedback_tickets',
        callback: (payload) {
          debugPrint('[RealtimeSync] Feedback ticket changed: ${payload.eventType}');
          _changeController.add('feedback_tickets');
          _scheduleInvalidation('feedback_tickets');
        },
      );

      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'official_memos',
        callback: (payload) {
          debugPrint('[RealtimeSync] Official memo changed: ${payload.eventType}');
          _changeController.add('official_memos');
          _scheduleInvalidation('official_memos');
        },
      );

      // ═══ FIX: Also subscribe to supply_shortages ═══
      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.insert,
        schema: 'public',
        table: 'supply_shortages',
        callback: (payload) {
          debugPrint('[RealtimeSync] New shortage: ${payload.newRecord['id']}');
          _changeController.add('supply_shortages');
        },
      );

      _channel!.subscribe();
      _isListening = true;
      debugPrint('[RealtimeSync] ✅ Started listening (single channel)');
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

  /// Debounced provider invalidation — batches rapid changes
  void _scheduleInvalidation(String table) {
    _pendingInvalidations.add(table);
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      for (final t in _pendingInvalidations) {
        if (t == 'form_submissions' || t == 'feedback_tickets' || t == 'official_memos') {
          _ref.invalidate(formStatsProvider);
        }
      }
      _pendingInvalidations.clear();
    });
  }

  /// Stop listening for changes
  void dispose() {
    _debounceTimer?.cancel();
    _channel?.unsubscribe();
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
