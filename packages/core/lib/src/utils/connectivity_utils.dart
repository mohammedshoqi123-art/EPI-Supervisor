import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;

/// Utility for monitoring internet connectivity status.
/// Single source of truth — all other listeners should read from here.
///
/// ═══ CRITICAL FIX ═══
/// Previous version only used connectivity_plus which reports "wifi connected"
/// even when there's NO INTERNET (captive portal, router offline, DNS failure).
/// This caused the app to think it was "online" while actually offline,
/// then hang on every network call for 30-90 seconds.
///
/// NEW STRATEGY:
/// 1. connectivity_plus reports link status (wifi/mobile/none)
/// 2. If link is up, do a quick HTTP HEAD to a known reliable endpoint
///    to verify actual internet access (8s timeout, fast fail)
/// 3. Emit true ONLY if both link is up AND HTTP probe succeeds
/// 4. On link change, re-probe immediately
/// 5. Periodic recheck every 30s when "online" to catch captive portals
class ConnectivityUtils {
  static final Connectivity _connectivity = Connectivity();
  static final StreamController<bool> _controller =
      StreamController<bool>.broadcast();

  static bool _isOnline = false;
  static StreamSubscription? _subscription;
  static Timer? _recheckTimer;
  static DateTime? _lastEmit;
  static DateTime? _lastProbe;
  static bool _probing = false;

  /// Probe targets — tried in order, first success wins.
  /// All endpoints must respond quickly (HEAD request, 8s timeout).
  static const List<String> _probeUrls = [
    'https://www.google.com/generate_204',
    'https://clients3.google.com/generate_204',
    'https://supabase.co',
    'https://www.cloudflare.com/cdn-cgi/trace',
  ];

  /// Minimum interval between state emissions to prevent event storms
  static const Duration _minEmitInterval = Duration(milliseconds: 800);

  /// How often to recheck when "online" (catches captive portal / wifi-no-internet)
  static const Duration _onlineRecheckInterval = Duration(seconds: 30);

  /// Call once at app startup to start monitoring.
  /// On web: assumes online and skips connectivity_plus listeners (they can hang).
  static Future<void> initialize() async {
    // ═══ FIX: On web, skip connectivity_plus entirely ═══
    if (kIsWeb) {
      _isOnline = true;
      _startWebProbe();
      return;
    }

    try {
      final result = await _connectivity.checkConnectivity().timeout(
            const Duration(seconds: 3),
            onTimeout: () => <ConnectivityResult>[],
          );
      final linkUp = _isConnected(result);
      if (linkUp) {
        // Link is up — verify actual internet access
        _isOnline = await _probeInternet();
      } else {
        _isOnline = false;
      }
    } catch (_) {
      _isOnline = false;
    }

    // Listen for link changes (e.g., user toggles airplane mode)
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final online = _isConnected(results);
      _handleLinkChange(online);
    });

    // Periodic recheck when online
    _startRecheckTimer();
  }

  static void _handleLinkChange(bool linkUp) {
    if (linkUp) {
      // Link came up — probe to verify real internet
      _probeAndEmit();
    } else {
      // Link definitely down — emit offline immediately
      _emitIfChanged(false);
    }
  }

  static void _startRecheckTimer() {
    _recheckTimer?.cancel();
    _recheckTimer = Timer.periodic(_onlineRecheckInterval, (_) {
      if (_isOnline && !_probing) {
        _probeAndEmit();
      }
    });
  }

  static void _startWebProbe() {
    // On web, navigator.onLine is unreliable too — do periodic HTTP probe
    _recheckTimer?.cancel();
    _recheckTimer = Timer.periodic(_onlineRecheckInterval, (_) {
      _probeAndEmit();
    });
    _probeAndEmit();
  }

  /// Probe internet by trying HTTP HEAD to known reliable endpoints.
  /// Returns true if ANY probe succeeds (fast fail).
  static Future<bool> _probeInternet() async {
    if (_probing) return _isOnline;
    _probing = true;
    _lastProbe = DateTime.now();

    try {
      // Try each probe URL with a short timeout — first success wins
      for (final url in _probeUrls) {
        try {
          final response = await http
              .head(Uri.parse(url))
              .timeout(const Duration(seconds: 4));
          // 2xx or 3xx or even 4xx means we have internet (server responded)
          // Only network errors (no response) mean offline
          if (response.statusCode < 500) {
            return true;
          }
        } on TimeoutException {
          continue;
        } on SocketException {
          continue;
        } catch (_) {
          continue;
        }
      }
      // All probes failed — no real internet
      return false;
    } finally {
      _probing = false;
    }
  }

  static void _probeAndEmit() {
    _probeInternet().then((online) {
      _emitIfChanged(online);
    });
  }

  static void _emitIfChanged(bool online) {
    if (online != _isOnline) {
      _isOnline = online;
      _throttledEmit(_isOnline);
    }
  }

  static void _throttledEmit(bool value) {
    final now = DateTime.now();
    if (_lastEmit != null && now.difference(_lastEmit!) < _minEmitInterval) {
      return;
    }
    _lastEmit = now;
    if (!_controller.isClosed) {
      _controller.add(value);
    }
  }

  static bool _isConnected(List<ConnectivityResult> results) {
    return results.isNotEmpty &&
        results.any((r) => r != ConnectivityResult.none);
  }

  /// Current connectivity status (verified by HTTP probe, not just link status)
  static bool get isOnline => _isOnline;
  static bool get isOffline => !_isOnline;

  /// ═══ FIX: Stream that emits current state immediately on subscription,
  /// then subsequent changes. This ensures Riverpod providers get the initial value. ═══
  static Stream<bool> get onConnectivityChanged {
    return Stream.multi((controller) {
      controller.add(_isOnline);
      final sub = _controller.stream.listen(
        controller.add,
        onError: controller.addError,
        onDone: controller.close,
      );
      controller.onCancel = () => sub.cancel();
    }, isBroadcast: true);
  }

  /// Force a recheck — useful when user manually taps "retry" or "sync"
  static Future<bool> recheckNow() async {
    final online = await _probeInternet();
    _emitIfChanged(online);
    return online;
  }

  /// Wait until device is online (useful before sync attempts)
  static Future<void> waitForConnection({
    Duration timeout = const Duration(minutes: 5),
  }) async {
    if (_isOnline) return;

    await onConnectivityChanged.firstWhere((online) => online).timeout(timeout);
  }

  static void dispose() {
    _subscription?.cancel();
    _recheckTimer?.cancel();
    _controller.close();
  }
}

extension ConnectivityExtension on List<ConnectivityResult> {
  bool get hasConnection => any((r) => r != ConnectivityResult.none);
  bool get hasWifi => contains(ConnectivityResult.wifi);
  bool get hasMobile => contains(ConnectivityResult.mobile);
}
