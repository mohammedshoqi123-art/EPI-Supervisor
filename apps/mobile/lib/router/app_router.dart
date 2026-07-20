import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// Hide AuthState from supabase_flutter to avoid conflict with epi_core's AuthState
import 'package:supabase_flutter/supabase_flutter.dart' hide AuthState;
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
    '/chat': 1, // everyone (memos + feedback + channels + brief)
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

      // ═══ FIX: Try to read session directly from Supabase — works even when
      // the auth stream hasn't emitted yet (offline case) ═══
      bool hasStoredSession = false;
      try {
        final client = Supabase.instance.client;
        hasStoredSession = client.auth.currentSession != null;
      } catch (_) {
        // Supabase not initialized yet — proceed
      }

      // ═══ Decision matrix ═══
      // 1. Authenticated (stream) OR has stored session → allow access
      //    - But if on /login, redirect to /dashboard
      // 2. Not authenticated AND no stored session
      //    - If on /login, allow
      //    - Otherwise, redirect to /login
      final effectiveAuth = isAuthenticated || hasStoredSession;

      if (effectiveAuth && isLoginRoute) return '/dashboard';
      if (!effectiveAuth && !isLoginRoute) return '/login';

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
            builder: (context, state) {
              // ═══ Support ?tab=reports deep-link from Dashboard quick action ═══
              final tab = state.uri.queryParameters['tab'];
              int initialTab = 0;
              if (tab == 'reports') initialTab = 4;
              return AnalyticsScreen(initialTab: initialTab);
            },
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
            builder: (context, state) {
              // Support ?tab=memos|channels|feedback|brief deep-link
              final tab = state.uri.queryParameters['tab'];
              int initialTab = 0;
              if (tab == 'channels') initialTab = 1;
              if (tab == 'feedback') initialTab = 2;
              if (tab == 'brief') initialTab = 3;
              return ChatScreen(initialTab: initialTab);
            },
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
  final _scaffoldKey = GlobalKey<ScaffoldState>();
  DateTime? _lastNavTap;

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
            GestureDetector(
              onTap: () async {
                // ═══ FIX: اسمح للمستخدم بإعادة فحص الاتصال يدوياً ═══
                HapticFeedback.lightImpact();
                final online = await ConnectivityUtils.recheckNow();
                if (mounted && online) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('عاد الاتصال بالإنترنت ✅',
                          style: TextStyle(fontFamily: 'Tajawal')),
                      behavior: SnackBarBehavior.floating,
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              },
              child: ConnectivityBanner(
                  isOnline: isOnline, pendingCount: pendingCount),
            ),
          Expanded(child: widget.child),
        ],
      ),
      // ⚠️ PERF: Single GoRouterState.of call — was 4 calls per build
      floatingActionButton: Builder(builder: (context) {
        final location = GoRouterState.of(context).matchedLocation;
        final hideFab = location.startsWith('/ai') || location.startsWith('/chat');
        if (hideFab) return const SizedBox.shrink();
        return Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            FloatingActionButton.small(
              heroTag: 'menu_fab',
              onPressed: () => _scaffoldKey.currentState?.openDrawer(),
              backgroundColor: AppTheme.primaryDark,
              foregroundColor: Colors.white,
              elevation: 4,
              child: const Icon(Icons.menu_rounded, size: 22),
            ),
            _AiFab(onTap: () => context.go('/ai')),
          ],
        );
      }),
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
    // ═══ Debounce: prevent rapid navigation taps ═══
    final now = DateTime.now();
    if (_lastNavTap != null && now.difference(_lastNavTap!) < const Duration(milliseconds: 400)) return;
    _lastNavTap = now;

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
  String _syncProgress = '';
  DateTime? _lastNavTap;

  /// مزامنة ذكية — تستخدم full_sync_provider
  Future<void> _syncConfig() async {
    if (_isSyncingConfig) return;

    // ═══ SAFETY: Don't sync if offline ═══
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

    setState(() {
      _isSyncingConfig = true;
      _syncProgress = 'جاري المزامنة...';
    });

    try {
      // استخدام المزامنة الذكية
      final result = await ref.read(fullSyncProvider.notifier).syncAll(
        onProgress: (step, current, total) {
          if (mounted) {
            setState(() {
              _syncProgress = '$step ($current/$total)';
            });
          }
        },
      ).timeout(
        const Duration(seconds: 90),
        onTimeout: () => const FullSyncResult(error: 'انتهت مهلة المزامنة'),
      );

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
                result.summary,
                style: const TextStyle(fontFamily: 'Tajawal'),
              ),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 4),
            ),
          );
        }
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
      if (mounted) {
        setState(() {
          _isSyncingConfig = false;
          _syncProgress = '';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // ═══ PERFORMANCE: Use .select() to minimize rebuild scope ═══
    final authState = ref.watch(authStateProvider.select((v) => v.valueOrNull));
    final campaign = ref.watch(campaignProvider);
    final campaignRound = ref.watch(campaignRoundProvider);
    // ═══ Filter campaigns by visibility ═══
    final visibleCampaigns = CampaignType.visibleValues;

    return EpiDrawer(
      currentRoute: GoRouterState.of(context).matchedLocation,
      userName: authState?.fullName ?? 'مستخدم',
      userRole: authState?.role?.nameAr,
      userRoleLevel: authState?.role?.hierarchyLevel ?? 1,
      onNavigate: (route) {
        // ═══ Debounce: prevent rapid drawer navigation ═══
        final now = DateTime.now();
        if (_lastNavTap != null && now.difference(_lastNavTap!) < const Duration(milliseconds: 400)) return;
        _lastNavTap = now;
        context.go(route);
      },
      onLogout: () async {
        await ref.read(authRepositoryProvider).signOut();
      },
      onSyncConfig: _syncConfig,
      isSyncingConfig: _isSyncingConfig,
      syncProgress: _syncProgress,
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
      visibleCampaigns: visibleCampaigns.map((c) => c.value).toList(),
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
