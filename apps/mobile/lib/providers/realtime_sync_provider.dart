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
  RealtimeChannel? _channel;
  bool _isListening = false;
  Timer? _debounceTimer;
  Timer? _reconnectTimer;
  int _reconnectAttempts = 0;
  static const _maxReconnectAttempts = 10;
  static const _reconnectDelays = [5, 10, 15, 30, 60, 60, 60, 60, 60, 60];
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
      // ═══ PERFORMANCE: Only subscribe to tables that need realtime updates ═══
      // Reference data (forms, references, governorates, districts) is refreshed
      // via manual sync button, not realtime — reduces WebSocket overhead.
      _channel = client.channel('mobile-sync');

      // Keep: Profile updates — needed for user deactivation check
      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.update,
        schema: 'public',
        table: 'profiles',
        callback: (payload) {
          debugPrint('[RealtimeSync] Profile updated: ${payload.newRecord}');
          _checkCurrentUserActive(payload.newRecord);
        },
      );

      // Keep: Submissions — most important for sync status and dashboard updates
      _channel!.onPostgresChanges(
        event: PostgresChangeEvent.all,
        schema: 'public',
        table: 'form_submissions',
        callback: (payload) {
          debugPrint('[RealtimeSync] Submission ${payload.eventType}: ${payload.newRecord['id']}');
          _changeController.add('form_submissions');
          _scheduleInvalidation('form_submissions');
        },
      );

      // Keep: Feedback tickets — for notification badge
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

      // Keep: Official memos — for notification badge
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

      // Removed: forms, doc_references, governorates, districts, supply_shortages
      // These are reference data — refreshed via manual sync button

      _channel!.subscribe((status, [error]) {
        if (status == RealtimeSubscribeStatus.subscribed) {
          _reconnectAttempts = 0;
        } else if (status == RealtimeSubscribeStatus.channelError ||
            status == RealtimeSubscribeStatus.closed) {
          _isListening = false;
          _scheduleReconnect();
        }
      });
      _isListening = true;
      debugPrint('[RealtimeSync] ✅ Started listening (4 essential listeners)');
    } catch (e) {
      debugPrint('[RealtimeSync] ❌ Failed to start: $e');
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    if (_reconnectAttempts >= _maxReconnectAttempts) return;
    final delay = _reconnectDelays[_reconnectAttempts];
    _reconnectAttempts++;
    debugPrint('[RealtimeSync] 🔄 Reconnect in ${delay}s (#$_reconnectAttempts)');
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(seconds: delay), () {
      if (!_isListening) {
        _channel?.unsubscribe();
        _channel = null;
        startListening();
      }
    });
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
    _reconnectTimer?.cancel();
    _channel?.unsubscribe();
    _changeController.close();
    _isListening = false;
    _reconnectAttempts = 0;
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
