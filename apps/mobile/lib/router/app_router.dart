import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

import '../providers/app_providers.dart';
import '../providers/full_sync_provider.dart';
import '../screens/splash_screen.dart';
import '../screens/login_screen.dart';
import '../screens/dashboard_screen.dart';
import '../screens/forms_screen.dart';
import '../screens/map_screen.dart';
import '../screens/ai_chat_screen_v3.dart';
import '../screens/epi_studio_screen.dart';
import '../screens/submission_detail_screen.dart';
import '../screens/form_fill/form_fill_screen.dart';
import '../screens/forms_status_screen.dart';
import '../screens/notifications_screen.dart';
import '../screens/references_screen.dart';
import '../screens/chat_screen.dart';

import '../screens/profile_screen.dart';
import '../screens/users_screen.dart';
import '../screens/forms_management_screen.dart';
import '../screens/references_management_screen.dart';
import '../screens/analytics_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authAsync = ref.watch(authStateProvider);

  // Minimum role level required per route — RBAC guards
  const routeMinRole = {
    '/ai': 1, // everyone
    '/references': 1, // everyone can view references
    '/users': 4, // admin + central only
    '/forms-management': 4, // admin + central only
    '/references-management': 4, // admin + central only
    '/analytics': 3, // governorate+ can view analytics
    '/map': 1, // everyone
    '/submissions': 1, // everyone (RLS filters by role)
    '/forms-status': 1, // everyone
    '/notifications': 1, // everyone
    '/profile': 1, // everyone
  };

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: kDebugMode,
    refreshListenable: GoRouterRefreshStream(
      ref.watch(authRepositoryProvider).authStateChanges,
    ),
    redirect: (context, state) {
      final isLoginRoute = state.matchedLocation == '/login';
      final isSplash = state.matchedLocation == '/splash';

      if (isSplash) return null;

      // If Supabase is not configured, go to login (it shows the warning)
      if (!SupabaseConfig.isConfigured) {
        if (isLoginRoute) return null;
        return '/login';
      }

      // Get auth state — may be null if stream hasn't emitted yet
      final authState = authAsync.valueOrNull;
      final isAuthenticated = authState?.isAuthenticated ?? false;

      // ═══ FIX: When offline, don't redirect to login if auth state is unknown ═══
      // The auth stream may not have emitted yet when offline.
      // Allow navigation to proceed — pages handle their own offline state.
      final isOffline = !ConnectivityUtils.isOnline;
      if (isOffline && authState == null && !isLoginRoute) {
        return null; // Let the user through — don't block on missing auth when offline
      }

      // Not authenticated and not on login page -> redirect to login
      if (!isAuthenticated && !isLoginRoute) return '/login';
      // Authenticated and on login page -> redirect to dashboard
      if (isAuthenticated && isLoginRoute) return '/dashboard';

      // Role-based route guards
      if (isAuthenticated) {
        final userLevel = authState?.role?.hierarchyLevel ?? 0;
        final requiredLevel = routeMinRole[state.matchedLocation];

        if (requiredLevel != null && userLevel < requiredLevel) {
          return '/dashboard'; // Redirect unauthorized users
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/forms',
            builder: (context, state) => const FormsScreen(),
            routes: [
              GoRoute(
                path: 'fill/:formId',
                builder: (context, state) => FormFillScreen(
                  formId: state.pathParameters['formId']!,
                  draftId: state.uri.queryParameters['draftId'],
                ),
              ),
              GoRoute(
                path: 'status',
                builder: (context, state) => const FormsStatusScreen(),
                routes: [
                  GoRoute(
                    path: 'submission/:id',
                    builder: (context, state) =>
                        SubmissionDetailScreen(id: state.pathParameters['id']!),
                  ),
                ],
              ),
            ],
          ),
          GoRoute(path: '/map', builder: (context, state) => const MapScreen()),
          GoRoute(
            path: '/analytics',
            builder: (context, state) => const AnalyticsScreen(),
          ),
          GoRoute(
            path: '/ai',
            builder: (context, state) => const AiChatScreenV3(),
          ),
          GoRoute(
            path: '/studio',
            builder: (context, state) {
              final topic = state.uri.queryParameters['topic'];
              return EpiStudioScreen(initialTopic: topic);
            },
          ),
          GoRoute(
            path: '/references',
            builder: (context, state) => const ReferencesScreen(),
          ),
          GoRoute(
            path: '/notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/chat',
            builder: (context, state) => const ChatScreen(),
          ),
          GoRoute(
            path: '/profile',
            builder: (context, state) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/users',
            builder: (context, state) => const UsersScreen(),
          ),
          GoRoute(
            path: '/forms-management',
            builder: (context, state) => const FormsManagementScreen(),
          ),
          GoRoute(
            path: '/references-management',
            builder: (context, state) => const ReferencesManagementScreen(),
          ),
        ],
      ),
    ],
  );
});

/// Reactive connectivity provider — watches ConnectivityUtils stream
/// so the UI rebuilds when connectivity changes.
final connectivityProvider = StreamProvider<bool>((ref) {
  return ConnectivityUtils.onConnectivityChanged.distinct();
});

class MainShell extends ConsumerStatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  ConsumerState<MainShell> createState() => _MainShellState();
}

class _MainShellState extends ConsumerState<MainShell> {
  bool _isSyncing = false;
  final _scaffoldKey = GlobalKey<ScaffoldState>();

  /// ═══ مزامنة شاملة — تجلب ALL data من السيرفر وتحفظها بالكاش ═══
  /// ═══ PERFORMANCE FIX: Uses microtask to avoid blocking UI ═══
  Future<void> _triggerFullSync() async {
    if (_isSyncing) return;
    if (!ConnectivityUtils.isOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'لا يمكن المزامنة بدون إنترنت 🔌',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.orange,
          ),
        );
      }
      return;
    }

    setState(() => _isSyncing = true);
    HapticFeedback.mediumImpact();

    try {
      // ═══ PERFORMANCE: Yield to UI thread before heavy work ═══
      await Future.delayed(const Duration(milliseconds: 50));

      final result = await ref.read(fullSyncProvider.notifier).syncAll();

      if (mounted) {
        if (result.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'فشلت المزامنة: ${result.error}',
                style: const TextStyle(fontFamily: 'Tajawal'),
              ),
              backgroundColor: Colors.red,
              duration: const Duration(seconds: 3),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'تمت المزامنة ✅ ${result.forms} نموذج، ${result.submissions} إرسالية، ${result.governorates} محافظة',
                style: const TextStyle(fontFamily: 'Tajawal'),
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 3),
            ),
          );
        }
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
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // ═══ PERFORMANCE: use .select() to minimize rebuild scope ═══
    final isOnline = ref.watch(
      connectivityProvider
          .select((v) => v.valueOrNull ?? ConnectivityUtils.isOnline),
    );
    final pendingCount = ref.watch(
      syncPendingCountProvider.select((v) => v.valueOrNull ?? 0),
    );

    return Scaffold(
      key: _scaffoldKey,
      body: Column(
        children: [
          // Offline/Online status banner
          if (!isOnline || pendingCount > 0)
            ConnectivityBanner(isOnline: isOnline, pendingCount: pendingCount),
          Expanded(child: widget.child),
        ],
      ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // ═══ Drawer menu button ═══
          FloatingActionButton.small(
            heroTag: 'menu_fab',
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
            backgroundColor: AppTheme.primaryDark,
            foregroundColor: Colors.white,
            elevation: 4,
            child: const Icon(Icons.menu_rounded, size: 22),
          ),
          const SizedBox(height: 10),
          // ═══ زرار المزامنة الشامل — دائماً ظاهر ═══
          FloatingActionButton.extended(
            heroTag: 'sync_fab',
            onPressed: _isSyncing ? null : _triggerFullSync,
            backgroundColor: _isSyncing
                ? Colors.grey
                : isOnline
                    ? AppTheme.primaryColor
                    : Colors.orange,
            foregroundColor: Colors.white,
            elevation: 6,
            icon: _isSyncing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.cloud_sync_rounded, size: 20),
            label: Text(
              _isSyncing ? 'جاري المزامنة...' : 'مزامنة',
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (pendingCount > 0) ...[
            const SizedBox(height: 8),
            // ═══ Pending uploads badge ═══
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.orange.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.cloud_upload_rounded,
                      size: 14, color: Colors.white),
                  const SizedBox(width: 6),
                  Text(
                    '$pendingCount في الانتظار',
                    style: const TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
          // ═══ AI Assistant — hidden on /ai page ═══
          if (!GoRouterState.of(context).matchedLocation.startsWith('/ai'))
            _AiFab(onTap: () => context.go('/ai')),
        ],
      ),
      bottomNavigationBar: EpiBottomNav(
        currentIndex: _getSelectedIndex(context),
        onTap: (index) => _onItemTapped(context, index),
      ),
      drawer: const AppDrawer(),
    );
  }

  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/dashboard')) return 0;
    if (location == '/forms/status') return 2; // حالة الاستمارات
    if (location.startsWith('/forms')) return 1; // النماذج
    if (location.startsWith('/analytics')) return 3; // التحليلات
    if (location.startsWith('/map')) return 4; // الخريطة
    return 0;
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/forms');
        break;
      case 2:
        context.go('/forms/status');
        break;
      case 3:
        context.go('/analytics');
        break;
      case 4:
        context.go('/map');
        break;
    }
  }
}

class AppDrawer extends ConsumerStatefulWidget {
  const AppDrawer({super.key});

  @override
  ConsumerState<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends ConsumerState<AppDrawer> {
  bool _isSyncingConfig = false;

  Future<void> _syncConfig() async {
    if (_isSyncingConfig) return;

    // ═══ SAFETY: Don't clear cache if offline — user will lose all data ═══
    if (!ConnectivityUtils.isOnline) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'لا يمكن المزامنة بدون إنترنت. اتصلك حالياً غير متاح.',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.orange,
            duration: Duration(seconds: 3),
          ),
        );
      }
      return;
    }

    setState(() => _isSyncingConfig = true);

    try {
      // 1. مسح كاش النماذج والاستمارات فقط
      final cache = await ref.read(offlineDataCacheProvider.future);
      final campaign = ref.read(campaignProvider);
      await cache.forceInvalidate('forms_${campaign.value}');
      await cache.forceInvalidate('forms_all');

      // 2. طلب بيانات جديدة من السيرفر
      ref.invalidate(formsProvider);

      // 3. رفع الإرساليات المحفوظة محلياً
      final syncService = await ref.read(syncServiceProvider.future);
      final result = await syncService.sync();

      if (mounted) {
        final msg = result.synced > 0
            ? 'تم تحديث النماذج ومزامنة ${result.synced} إرسالية ✅'
            : 'تم جلب أحدث النماذج من السيرفر ✅';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(msg, style: const TextStyle(fontFamily: 'Tajawal')),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'فشلت المزامنة: $e',
              style: const TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSyncingConfig = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authStateProvider);
    final authState = authAsync.valueOrNull;
    final campaign = ref.watch(campaignProvider);
    final campaignRound = ref.watch(campaignRoundProvider);
    return EpiDrawer(
      currentRoute: GoRouterState.of(context).matchedLocation,
      userName: authState?.fullName ?? 'مستخدم',
      userRole: authState?.role?.nameAr,
      userRoleLevel: authState?.role?.hierarchyLevel ?? 1,
      onNavigate: (route) => context.go(route),
      onLogout: () async {
        await ref.read(authRepositoryProvider).signOut();
      },
      onSyncConfig: _syncConfig,
      isSyncingConfig: _isSyncingConfig,
      activeCampaign: campaign.value,
      onCampaignChanged: (v) {
        ref
            .read(campaignProvider.notifier)
            .selectCampaign(CampaignType.fromString(v));
      },
      activeCampaignRound: campaignRound,
      onCampaignRoundChanged: (round) {
        ref.read(campaignRoundProvider.notifier).selectRound(round);
      },
    );
  }
}

/// Makes GoRouter rebuild ONLY when auth status actually changes
/// (login/logout), not on every profile metadata update.
class GoRouterRefreshStream extends ChangeNotifier {
  StreamSubscription? _subscription;
  bool? _lastIsAuth;
  String? _lastUserId;

  GoRouterRefreshStream(Stream<dynamic> stream) {
    _subscription = stream.asBroadcastStream().listen((event) {
      bool isAuth = false;
      String? userId;
      if (event is AuthState) {
        isAuth = event.isAuthenticated;
        userId = event.userId;
      } else {
        try {
          isAuth = (event as dynamic).isAuthenticated as bool? ?? false;
          userId = (event as dynamic).userId as String?;
        } catch (_) {
          notifyListeners();
          return;
        }
      }
      final changed = isAuth != _lastIsAuth || userId != _lastUserId;
      if (changed) {
        _lastIsAuth = isAuth;
        _lastUserId = userId;
        notifyListeners();
      }
    });
    notifyListeners();
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }
}

/// ═══ AI Assistant Floating Button — always visible, animated, interactive ═══
class _AiFab extends StatefulWidget {
  final VoidCallback onTap;
  const _AiFab({required this.onTap});

  @override
  State<_AiFab> createState() => _AiFabState();
}

class _AiFabState extends State<_AiFab> with SingleTickerProviderStateMixin {
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _isPressed = true),
      onTapUp: (_) {
        setState(() => _isPressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _isPressed = false),
      child: AnimatedScale(
        scale: _isPressed ? 0.9 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [Color(0xFFFF8F00), Color(0xFFFF6D00)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFFF8F00).withValues(alpha: 0.35),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: const Icon(
            Icons.auto_awesome_rounded,
            color: Colors.white,
            size: 28,
          ),
        ),
      ),
    );
  }
}
