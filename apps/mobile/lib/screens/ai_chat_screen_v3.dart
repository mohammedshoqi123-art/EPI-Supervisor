import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../services/dynamic_bot_knowledge_service.dart';
import 'ai_chat_models.dart';
import 'ai_provider_badge.dart';
import 'citation_widgets.dart';
import 'epi_studio_screen.dart';

// AI CHAT SCREEN V3 — Premium 3-Tab Edition
// ═══════════════════════════════════════════════════════════

class AiChatScreenV3 extends ConsumerStatefulWidget {
  /// When true, renders without its own AppBar (used when embedded in another screen's tab)
  final bool embedded;

  const AiChatScreenV3({super.key, this.embedded = false});

  @override
  ConsumerState<AiChatScreenV3> createState() => _AiChatScreenV3State();
}

class _AiChatScreenV3State extends ConsumerState<AiChatScreenV3>
    with TickerProviderStateMixin {
  final _ctrl = TextEditingController();
  final _scroll = ScrollController();
  final List<ChatMsg> _msgs = [];
  bool _loading = false;
  bool _mounted = true;
  DateTime? _lastSend;
  late AnimationController _typingAnimCtrl;
  bool _showWelcome = true;

  // ═══ Bot state (unified local→AI) ═══
  final _botCtrl = TextEditingController();
  final _botScroll = ScrollController();
  late BotEngine _botEngine;
  final List<BotMessage> _botMsgs = [];
  bool _botLoading = false;

  @override
  void initState() {
    super.initState();
    _typingAnimCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    // Fix: only start typing animation when loading — don't repeat infinitely
    _restore();
    _botEngine = BotEngine();
    _botEngine.initialize();
  }

  @override
  void dispose() {
    _mounted = false;
    _ctrl.dispose();
    _scroll.dispose();
    _botCtrl.dispose();
    _botScroll.dispose();
    _typingAnimCtrl.dispose();
    super.dispose();
  }

  Future<void> _restore() async {
    final saved = await ChatStore.load();
    if (saved.isNotEmpty && _mounted) {
      setState(() {
        _msgs.addAll(saved);
        _showWelcome = false;
      });
    }
  }

  void _scrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.animateTo(
          _scroll.position.maxScrollExtent + 80,
          duration: const Duration(milliseconds: 350),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  // ═══ SEND MESSAGE ═══

  Future<void> _send(String text, {String? template}) async {
    if (text.trim().isEmpty || _loading) return;

    final now = DateTime.now();
    if (_lastSend != null &&
        now.difference(_lastSend!) < const Duration(seconds: 1)) return;
    _lastSend = now;

    _ctrl.clear();
    setState(() {
      _showWelcome = false;
      _msgs.add(ChatMsg(role: 'user', content: text));
      _loading = true;
    });
    // Start typing animation only during loading
    _typingAnimCtrl.repeat();
    _scrollDown();
    unawaited(ChatStore.save(_msgs));

    try {
      // ═══ OFFLINE FALLBACK: Use local BotEngine when no internet ═══
      if (!ConnectivityUtils.isOnline) {
        final localResp = _botEngine.sendMessage(text);
        if (_mounted && localResp != null) {
          setState(() {
            _msgs.add(ChatMsg(
              role: 'assistant',
              content: localResp.text,
              source: 'offline',
            ));
            _loading = false;
      _typingAnimCtrl.stop();
          });
          unawaited(ChatStore.save(_msgs));
        } else if (_mounted) {
          setState(() => _loading = false);
        }
        return;
      }

      final api = ref.read(apiClientProvider);
      final modelSelection = ref.read(aiModelSelectionProvider);

      // Determine which provider to use
      String selectedProvider = modelSelection.provider;
      if (modelSelection.autoSelect) {
        final notifier = ref.read(aiModelSelectionProvider.notifier);
        selectedProvider = notifier.selectBestProvider(text);
      }

      // Try client-side AI providers first (Z AI, OpenRouter) before Edge Function
      if (selectedProvider == 'zai') {
        final zai = ref.read(zaiServiceProvider);
        if (zai != null) {
          try {
            final kbCtx = EpiKnowledgeBase.getRelevantContext(text);
            final systemPrompt =
                _buildSystemPrompt() + (kbCtx.isNotEmpty ? '\n\n$kbCtx' : '');
            final resp = await zai
                .chat(text, systemPrompt: systemPrompt, maxTokens: 800)
                .timeout(const Duration(seconds: 45));
            if (_mounted) {
              setState(() {
                _msgs.add(
                    ChatMsg(role: 'assistant', content: resp, source: 'zai'));
                _loading = false;
      _typingAnimCtrl.stop();
              });
              unawaited(ChatStore.save(_msgs));
            }
            return;
          } catch (_) {
            // Fall through to Edge Function
          }
        }
      }

      if (selectedProvider == 'openrouter') {
        final orService = ref.read(openRouterServiceProvider);
        if (orService != null) {
          try {
            final kbCtx = EpiKnowledgeBase.getRelevantContext(text);
            final systemPrompt =
                _buildSystemPrompt() + (kbCtx.isNotEmpty ? '\n\n$kbCtx' : '');
            final resp = await orService
                .chat(text, systemPrompt: systemPrompt, maxTokens: 800)
                .timeout(const Duration(seconds: 60));
            if (_mounted) {
              setState(() {
                _msgs.add(ChatMsg(
                    role: 'assistant', content: resp, source: 'openrouter'));
                _loading = false;
      _typingAnimCtrl.stop();
              });
              unawaited(ChatStore.save(_msgs));
            }
            return;
          } catch (_) {
            // Fall through to Edge Function
          }
        }
      }

      // Default: Edge Function (ai-chat-v3) with streaming
      final history =
          _msgs.length > 6 ? _msgs.sublist(_msgs.length - 6) : _msgs;
      final historyJson = history
          .map((m) => {
                'role': m.role,
                'content': m.content.length > 500
                    ? '${m.content.substring(0, 500)}...'
                    : m.content,
              })
          .toList();

      setState(() {
        _msgs.add(ChatMsg(role: 'assistant', content: '', source: 'streaming'));
      });

      final buffer = StringBuffer();
      bool gotAnyText = false;

      // ═══ Pass active campaign round to AI so it filters data correctly ═══
      final activeRound = ref.read(campaignRoundProvider);
      final activeCampaign = ref.read(campaignProvider).value;

      await for (final chunk in api.callFunctionStream('ai-chat-v3', {
        'message': text,
        'history': historyJson,
        'stream': true,
        if (template != null) 'template': template,
        if (activeCampaign == 'integrated_activity') 'campaign_round': activeRound,
      }).timeout(const Duration(seconds: 60), onTimeout: (sink) {
        sink.close();
        throw TimeoutException('انتهت مهلة الطلب');
      })) {
        if (!_mounted) return;
        gotAnyText = true;
        buffer.write(chunk);
        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: buffer.toString(),
              source: 'streaming',
            );
          }
        });
        _scrollDown();
      }

      if (!_mounted) return;

      if (!gotAnyText) {
        final resp = await api.callFunction('ai-chat-v3', {
          'message': text,
          'history': historyJson,
          if (template != null) 'template': template,
          if (activeCampaign == 'integrated_activity') 'campaign_round': activeRound,
        }).timeout(const Duration(seconds: 45));
        final reply =
            resp['reply'] as String? ?? resp['message'] as String? ?? '';
        final source = resp['source'] as String? ?? 'unknown';
        // Extract AI Gateway metadata for the new badge
        final provider = resp['provider'] as String?;
        final providerTier = resp['provider_tier'] as int?;
        final providerConfidence = resp['provider_confidence'] as int?;
        final latencyMs = resp['latency_ms'] as int?;
        final raced = resp['raced'] as bool?;
        final attemptedProviders = resp['attempted_providers'] != null
            ? List<String>.from(resp['attempted_providers'])
            : null;
        final toolsUsed = resp['tools_used'] != null
            ? List<String>.from(resp['tools_used'])
            : null;

        // ─── New: Grounding sources (NotebookLM-style) ───
        final groundedInSources = resp['grounded_in_sources'] as int?;
        final groundingSources = resp['grounding_sources'] != null
            ? (resp['grounding_sources'] as List)
                .map((s) => GroundingSource.fromJson(Map<String, dynamic>.from(s)))
                .toList()
            : null;
        final suggestedFollowups = resp['suggested_followups'] != null
            ? List<String>.from(resp['suggested_followups'])
            : null;
        final ungrounded = resp['ungrounded'] as bool?;

        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: reply.isNotEmpty ? reply : '⚠️ تم استلام رد فارغ.',
              source: source,
              provider: provider,
              providerTier: providerTier,
              providerConfidence: providerConfidence,
              latencyMs: latencyMs,
              raced: raced,
              attemptedProviders: attemptedProviders,
              toolsUsed: toolsUsed,
              groundedInSources: groundedInSources,
              groundingSources: groundingSources,
              suggestedFollowups: suggestedFollowups,
              ungrounded: ungrounded,
            );
          }
          _loading = false;
      _typingAnimCtrl.stop();
        });
      } else {
        HapticFeedback.lightImpact();
        setState(() {
          if (_msgs.isNotEmpty && _msgs.last.role == 'assistant') {
            _msgs[_msgs.length - 1] = ChatMsg(
              role: 'assistant',
              content: buffer.toString(),
              source: 'groq_stream',
              provider: 'groq',
              providerTier: 2,
              providerConfidence: 85,
              latencyMs: DateTime.now().millisecondsSinceEpoch - _lastSend!.millisecondsSinceEpoch,
              raced: true,
              attemptedProviders: const ['groq', 'pollinations', 'zai'],
            );
          }
          _loading = false;
      _typingAnimCtrl.stop();
        });
      }
      unawaited(ChatStore.save(_msgs));
    } on TimeoutException {
      if (!_mounted) return;
      setState(() {
        _msgs.add(ChatMsg(
          role: 'assistant',
          content: '⏱️ انتهت مهلة الطلب. حاول مرة أخرى أو اسأل سؤالاً أقصر.',
          source: 'error',
        ));
        _loading = false;
      _typingAnimCtrl.stop();
      });
      unawaited(ChatStore.save(_msgs));
    } catch (e) {
      if (!_mounted) return;
      final errorMsg = e.toString();

      // ═══ OFFLINE FALLBACK: If network error, use local BotEngine ═══
      if (errorMsg.contains('Network') ||
          errorMsg.contains('Socket') ||
          errorMsg.contains('Timeout') ||
          errorMsg.contains('timeout') ||
          errorMsg.contains('Failed host') ||
          errorMsg.contains('Internet')) {
        final localResp = _botEngine.sendMessage(text);
        if (localResp != null) {
          setState(() {
            _msgs.add(ChatMsg(
              role: 'assistant',
              content:
                  '${localResp.text}\n\n_📡 تم الرد من الذاكرة المحلية (أوفلاين)_',
              source: 'offline',
            ));
            _loading = false;
      _typingAnimCtrl.stop();
          });
        } else {
          setState(() {
            _msgs.add(ChatMsg(
              role: 'assistant',
              content: '📡 لا يوجد اتصال بالإنترنت. حاول مرة أخرى لاحقاً.',
              source: 'offline',
            ));
            _loading = false;
      _typingAnimCtrl.stop();
          });
        }
        unawaited(ChatStore.save(_msgs));
        _scrollDown();
        return;
      }

      String userMessage;
      if (errorMsg.contains('Unauthorized') || errorMsg.contains('401')) {
        userMessage = '🔒 انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.';
      } else if (errorMsg.contains('429')) {
        userMessage = '⏳ أرسلت رسائل كثيرة. انتظر دقيقة وحاول مرة أخرى.';
      } else {
        userMessage = '⚠️ حدث خطأ. حاول مرة أخرى.';
      }
      setState(() {
        _msgs.add(
            ChatMsg(role: 'assistant', content: userMessage, source: 'error'));
        _loading = false;
      _typingAnimCtrl.stop();
      });
      unawaited(ChatStore.save(_msgs));
    }
    _scrollDown();
  }

  String _buildSystemPrompt() {
    return '''أنت "مساعد EPI" — متخصص في برنامج التطعيم الموسع في اليمن ومنصة مشرف EPI.
التطعيمات: BCG, OPV/IPV, Penta, PCV, Rotavirus, MR, HepB.
المؤشرات: Penta3=وصول, Dropout=استمرارية, الحصبة=حماية جماعية.
قواعد: مختصر (≤120 كلمة). أرقام من البيانات. توصيات عملية. العربية.''';
  }

  Future<void> _clearChat() async {
    HapticFeedback.mediumImpact();
    final ok = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _buildDeleteSheet(ctx),
    );
    if (ok != true || !_mounted) return;
    setState(() {
      _msgs.clear();
      _showWelcome = true;
    });
    Future.microtask(() async => await ChatStore.clear());
  }

  void _copyMessage(ChatMsg msg) {
    HapticFeedback.lightImpact();
    Clipboard.setData(ClipboardData(text: msg.content));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Row(children: [
          Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
          SizedBox(width: 8),
          Text('تم النسخ!', style: TextStyle(fontFamily: 'Tajawal')),
        ]),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        backgroundColor: const Color(0xFF00897B),
      ),
    );
  }

  String _sourceLabel(String s) => switch (s) {
        'groq' || 'groq_stream' => '⚡ Groq AI',
        'zai' => '🤖 Z AI',
        'openrouter' => '🌐 OpenRouter/DeepSeek',
        'mimo' => '📡 MiMo AI',
        'function_call' => '📊 من بيانات النظام',
        'rag' => '📚 من قاعدة المعرفة',
        'local' => '📱 محلي',
        _ => '',
      };

  // ═══ BUILD ═══

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    // ═══ Embedded mode: no AppBar, just the body ═══
    if (widget.embedded) {
      return DefaultTabController(
        length: 4,
        child: Container(
          color: cs.surface,
          child: Column(
            children: [
              if (!ConnectivityUtils.isOnline)
                Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  color: Colors.orange.shade700,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.wifi_off, color: Colors.white, size: 14),
                      SizedBox(width: 8),
                      Text(
                        'أوفلاين — مستشار التحصين يعمل محلياً',
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            color: Colors.white),
                      ),
                    ],
                  ),
                ),
              Material(
                color: cs.primary,
                child: _buildTabBar(cs),
              ),
              Expanded(
                child: TabBarView(
                  children: [
                    _buildBotTab(cs),
                    _buildChatTab(cs),
                    _buildStudioTab(cs),
                    _buildAlertsTab(cs),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: cs.surface,
        appBar: _buildAppBar(cs),
        body: Column(
          children: [
            // ═══ Offline indicator ═══
            if (!ConnectivityUtils.isOnline)
              Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                color: Colors.orange.shade700,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.wifi_off, color: Colors.white, size: 14),
                    SizedBox(width: 8),
                    Text(
                      'أوفلاين — مستشار التحصين يعمل محلياً',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: Colors.white),
                    ),
                  ],
                ),
              ),
            _buildTabBar(cs),
            Expanded(
              child: TabBarView(
                children: [
                  _buildBotTab(cs),
                  _buildChatTab(cs),
                  _buildStudioTab(cs),
                  _buildAlertsTab(cs),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══ APP BAR ═══

  PreferredSizeWidget _buildAppBar(ColorScheme cs) {
    return AppBar(
      elevation: 0,
      backgroundColor: cs.primary,
      foregroundColor: cs.onPrimary,
      flexibleSpace: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [cs.primary, cs.tertiary],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
        ),
      ),
      title: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: cs.onPrimary.withValues(alpha: 0.2), width: 1),
            ),
            child: Stack(children: [
              Center(
                  child: Icon(Icons.auto_awesome_rounded,
                      size: 20, color: cs.onPrimary)),
              Positioned(
                bottom: 2,
                right: 2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: const Color(0xFF4CAF50),
                    shape: BoxShape.circle,
                    border: Border.all(color: cs.primary, width: 1.5),
                  ),
                ),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('المساعد الذكي',
                  style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Cairo')),
              Text('متعدد النماذج + بيانات النظام',
                  style: TextStyle(
                      fontSize: 10,
                      fontFamily: 'Tajawal',
                      color: cs.onPrimary.withValues(alpha: 0.7))),
            ],
          ),
        ],
      ),
      actions: [
        // ─── Studio access button (NotebookLM-style content generator) ───
        Container(
          margin: const EdgeInsets.only(left: 4),
          decoration: BoxDecoration(
            color: cs.onPrimary.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: IconButton(
            icon: const Icon(Icons.auto_awesome_rounded, size: 20),
            onPressed: () => context.go('/studio'),
            tooltip: 'استوديو المحتوى',
          ),
        ),
        if (_msgs.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              color: cs.onPrimary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: IconButton(
              icon: const Icon(Icons.delete_outline_rounded, size: 20),
              onPressed: _clearChat,
              tooltip: 'مسح المحادثة',
            ),
          ),
      ],
      bottom: null,
    );
  }

  // ═══ TAB BAR ═══

  Widget _buildTabBar(ColorScheme cs) {
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(
            bottom:
                BorderSide(color: cs.outlineVariant.withValues(alpha: 0.3))),
      ),
      child: TabBar(
        labelColor: cs.primary,
        unselectedLabelColor: cs.onSurfaceVariant,
        indicatorColor: cs.primary,
        indicatorSize: TabBarIndicatorSize.label,
        labelStyle: const TextStyle(
            fontFamily: 'Cairo', fontWeight: FontWeight.w700, fontSize: 13),
        unselectedLabelStyle: const TextStyle(
            fontFamily: 'Cairo', fontWeight: FontWeight.w500, fontSize: 12),
        tabs: const [
          Tab(
              text: 'مستشار التحصين',
              icon: Icon(Icons.vaccines_rounded, size: 20)),
          Tab(
              text: 'مساعد النظام',
              icon: Icon(Icons.smart_toy_rounded, size: 20)),
          Tab(
              text: 'استوديو ✨',
              icon: Icon(Icons.auto_awesome_rounded, size: 20)),
          Tab(
              text: 'تنبيهات ذكية',
              icon: Icon(Icons.notifications_active_rounded, size: 20)),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════

  Widget _buildChatTab(ColorScheme cs) {
    return Column(
      children: [
        // Model selector
        _buildModelSelector(cs),
        // ─── New: Gateway Status Indicator (real-time AI health) ───
        _buildGatewayStatusBar(cs),
        Expanded(
          child: _showWelcome && _msgs.isEmpty
              ? _buildWelcome(cs)
              : _buildMessages(cs),
        ),
        if (_loading) _buildTypingIndicator(cs),
        _buildInputBar(cs),
      ],
    );
  }

  /// New: Fetches and displays real-time gateway health
  Widget _buildGatewayStatusBar(ColorScheme cs) {
    return FutureBuilder<Map<String, dynamic>?>(
      future: _fetchGatewayHealth(),
      builder: (context, snapshot) {
        if (!snapshot.hasData || snapshot.data == null) {
          return const SizedBox.shrink();
        }
        final data = snapshot.data!;
        final healthy = data['healthy'] as int? ?? 0;
        final total = data['total_providers'] as int? ?? 0;
        final blocked = (data['blocked'] as List?)?.cast<String>() ?? [];

        if (total == 0) return const SizedBox.shrink();

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          color: cs.surfaceContainerLow,
          child: Row(
            children: [
              GatewayStatusIndicator(
                cs: cs,
                healthyProviders: healthy,
                totalProviders: total,
                blockedProviders: blocked,
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => _refreshGatewayHealth(),
                child: Icon(
                  Icons.refresh_rounded,
                  size: 14,
                  color: cs.onSurfaceVariant.withValues(alpha: 0.5),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<Map<String, dynamic>?> _fetchGatewayHealth() async {
    try {
      final api = ref.read(apiClientProvider);
      final resp = await api.callFunction('ai-chat-v3', {
        'mode': 'gateway_health',
      }).timeout(const Duration(seconds: 5));
      return resp;
    } catch (_) {
      return null;
    }
  }

  void _refreshGatewayHealth() {
    setState(() {}); // triggers FutureBuilder rebuild
  }

  Widget _buildModelSelector(ColorScheme cs) {
    final modelSelection = ref.watch(aiModelSelectionProvider);
    final providers = [
      _ModelOption('auto', '🤖 تلقائي', null),
      _ModelOption('groq', '⚡ Groq', null),
      _ModelOption('zai', '🤖 Z AI', null),
      _ModelOption('openrouter', '🌐 OpenRouter', 'deepseek/deepseek-chat'),
      _ModelOption('pollinations', '🌸 Pollinations', null),
      _ModelOption('local', '📱 محلي', null),
    ];

    return Container(
      height: 44,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: providers.length,
        separatorBuilder: (_, __) => const SizedBox(width: 6),
        itemBuilder: (context, i) {
          final p = providers[i];
          final isSelected = p.id == 'auto'
              ? modelSelection.autoSelect
              : (!modelSelection.autoSelect && modelSelection.provider == p.id);
          return ChoiceChip(
            label: Text(p.label,
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 11,
                    fontWeight:
                        isSelected ? FontWeight.w700 : FontWeight.w500)),
            selected: isSelected,
            onSelected: (_) {
              HapticFeedback.lightImpact();
              if (p.id == 'auto') {
                ref.read(aiModelSelectionProvider.notifier).toggleAutoSelect();
              } else {
                ref
                    .read(aiModelSelectionProvider.notifier)
                    .selectProvider(p.id);
                if (p.model != null)
                  ref
                      .read(aiModelSelectionProvider.notifier)
                      .selectModel(p.model!);
              }
            },
            selectedColor: cs.primaryContainer,
            backgroundColor: cs.surfaceContainerHigh,
            side: BorderSide(
                color: isSelected
                    ? cs.primary
                    : cs.outlineVariant.withValues(alpha: 0.3)),
            visualDensity: VisualDensity.compact,
            padding: const EdgeInsets.symmetric(horizontal: 8),
          );
        },
      ),
    );
  }

  /// NEW: Studio promo banner — NotebookLM-style content generator
  Widget _buildStudioPromo(ColorScheme cs) {
    return GestureDetector(
      onTap: () => context.go('/studio'),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [cs.tertiary, cs.primary],
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: cs.tertiary.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '✨ استوديو المحتوى الذكي',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'ولّد تقارير، أسئلة شائعة، خرائط ذهنية، وبودكاست صوتي من بياناتك',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: Colors.white.withValues(alpha: 0.9),
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_back_ios_rounded,
              color: Colors.white,
              size: 14,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcome(ColorScheme cs) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.0, end: 1.0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.easeOutBack,
          builder: (context, value, child) =>
              Transform.scale(scale: value, child: child),
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                  colors: [cs.primary, cs.tertiary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(22),
              boxShadow: [
                BoxShadow(
                    color: cs.primary.withValues(alpha: 0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8))
              ],
            ),
            child:
                Icon(Icons.auto_awesome_rounded, size: 36, color: cs.onPrimary),
          ),
        ),
        const SizedBox(height: 16),
        Text('مرحباً بك أيها المشرف الداعم 👋',
            style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                fontFamily: 'Cairo',
                color: cs.onSurface)),
        const SizedBox(height: 6),
        Text('اسألني عن بيانات النظام، التغطية، أو أدلة سير العمل',
            style: TextStyle(
                fontSize: 12,
                fontFamily: 'Tajawal',
                color: cs.onSurfaceVariant)),
        const SizedBox(height: 24),

        // ─── NEW: Studio promo banner ───
        _buildStudioPromo(cs),
        const SizedBox(height: 18),

        // Quick queries
        _sectionLabel('📊 التحصين والبيانات', cs),
        const SizedBox(height: 10),
        _quickCard(cs, Icons.bar_chart_rounded, 'التغطية والجرعة الصفرية',
            'ما هي مؤشرات التغطية والجرعة الصفرية؟', const Color(0xFF2196F3)),
        _quickCard(cs, Icons.vaccines_rounded, 'حملات التطعيم',
            'حلل أداء حملات شلل الأطفال الأخيرة', const Color(0xFF9C27B0)),
        _quickCard(cs, Icons.warning_amber_rounded, 'الإمداد والنواقص',
            'أين توجد نواقص حرجة في المستلزمات؟', const Color(0xFFFF5722)),

        const SizedBox(height: 18),
        _sectionLabel('📋 الإشراف الداعم', cs),
        const SizedBox(height: 10),
        _quickCard(
            cs,
            Icons.assignment_turned_in_rounded,
            'مؤشرات الإشراف',
            'كيف أقيم نموذج استمارة الإشراف الميداني؟',
            const Color(0xFF4CAF50)),
        _quickCard(cs, Icons.people_alt_rounded, 'الرفض المجتمعي',
            'كيف نعالج الرفض المجتمعي والشائعات؟', const Color(0xFFFF9800)),
        _quickCard(
            cs,
            Icons.medical_information_rounded,
            'الأحداث الضارة',
            'أخبرني عن أنواع الأحداث الضارة بعد التطعيم',
            const Color(0xFF00897B)),
        const SizedBox(height: 28),
      ]),
    );
  }

  Widget _sectionLabel(String text, ColorScheme cs) {
    return Align(
        alignment: Alignment.centerRight,
        child: Text(text,
            style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                fontFamily: 'Cairo',
                color: cs.onSurface)));
  }

  Widget _quickCard(
      ColorScheme cs, IconData icon, String title, String query, Color accent) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => _send(query),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                    color: accent.withValues(alpha: 0.12), width: 1)),
            child: Row(children: [
              Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12)),
                  child: Icon(icon, size: 20, color: accent)),
              const SizedBox(width: 12),
              Expanded(
                  child: Text(title,
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface))),
              Icon(Icons.arrow_back_ios_rounded,
                  size: 12, color: cs.onSurfaceVariant.withValues(alpha: 0.35)),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildMessages(ColorScheme cs) {
    return ListView.builder(
      controller: _scroll,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: _msgs.length,
      itemBuilder: (context, i) => _buildBubble(_msgs[i], cs),
    );
  }

  Widget _buildBubble(ChatMsg msg, ColorScheme cs) {
    final isUser = msg.role == 'user';
    final isError = msg.source == 'error';
    final isData = msg.source == 'function_call';
    final isStreaming = msg.source == 'streaming' && _loading;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    colors: isError
                        ? [cs.errorContainer, cs.error.withValues(alpha: 0.3)]
                        : [cs.primaryContainer, cs.tertiaryContainer]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                  isError
                      ? Icons.warning_rounded
                      : isData
                          ? Icons.analytics_rounded
                          : Icons.auto_awesome_rounded,
                  size: 16,
                  color: isError ? cs.error : cs.primary),
            ),
            const SizedBox(width: 10),
          ],
          Flexible(
              child: Column(
            crossAxisAlignment:
                isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onLongPress: () => _copyMessage(msg),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? cs.primary
                        : isError
                            ? cs.errorContainer
                            : isData
                                ? cs.primaryContainer.withValues(alpha: 0.5)
                                : cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isUser ? 20 : 6),
                      bottomRight: Radius.circular(isUser ? 6 : 20),
                    ),
                    boxShadow: [
                      BoxShadow(
                          color: (isUser ? cs.primary : Colors.black)
                              .withValues(alpha: isUser ? 0.15 : 0.05),
                          blurRadius: 12,
                          offset: const Offset(0, 3))
                    ],
                  ),
                  child: isStreaming && msg.content.isEmpty
                      ? _buildTypingDots(cs)
                      : (msg.groundingSources != null && msg.groundingSources!.isNotEmpty
                          ? RichTextWithCitations(
                              text: msg.content,
                              sources: msg.groundingSources!,
                              baseStyle: TextStyle(
                                fontFamily: 'Tajawal',
                                color: isUser
                                    ? cs.onPrimary
                                    : isError
                                        ? cs.onErrorContainer
                                        : cs.onSurface,
                                fontSize: 14,
                                height: 1.8,
                              ),
                              boldStyle: TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.w800,
                                color: isUser
                                    ? cs.onPrimary
                                    : isError
                                        ? cs.onErrorContainer
                                        : cs.onSurface,
                                fontSize: 14,
                                height: 1.8,
                              ),
                              cs: cs,
                              textColor: isUser
                                  ? cs.onPrimary
                                  : isError
                                      ? cs.onErrorContainer
                                      : cs.onSurface,
                            )
                          : SelectableText.rich(
                              TextSpan(children: [
                                ..._parseMarkdown(
                                    msg.content,
                                    TextStyle(
                                        fontFamily: 'Tajawal',
                                        color: isUser
                                            ? cs.onPrimary
                                            : isError
                                                ? cs.onErrorContainer
                                                : cs.onSurface,
                                        fontSize: 14,
                                        height: 1.8),
                                    TextStyle(
                                        fontFamily: 'Cairo',
                                        fontWeight: FontWeight.w800,
                                        color: isUser
                                            ? cs.onPrimary
                                            : isError
                                                ? cs.onErrorContainer
                                                : cs.onSurface,
                                        fontSize: 14,
                                        height: 1.8),
                                    cs),
                                if (isStreaming)
                                  WidgetSpan(
                                      child: _StreamingCursor(
                                          color: isUser
                                              ? cs.onPrimary
                                              : cs.onSurface)),
                              ]),
                              textDirection: TextDirection.rtl,
                            )),
                ),
              ),
              if (!isUser &&
                  msg.source != null &&
                  msg.source != 'error' &&
                  msg.source != 'streaming')
                // ─── New: AI Provider Badge with confidence + latency ───
                AiProviderBadge(msg: msg, cs: cs, compact: true),
              // ─── New: Grounding Banner (NotebookLM-style) ───
              if (!isUser && msg.isGrounded && msg.groundingSources != null)
                GroundingBanner(
                  sourceCount: msg.groundedInSources ?? 0,
                  sources: msg.groundingSources!,
                  cs: cs,
                ),
              // ─── New: Suggested Follow-ups ───
              if (!isUser && msg.suggestedFollowups != null && msg.suggestedFollowups!.isNotEmpty)
                SuggestedFollowups(
                  followups: msg.suggestedFollowups!,
                  cs: cs,
                  onTap: (q) => _send(q),
                ),
              // ─── New: Low confidence warning ───
              if (!isUser && msg.isLowConfidence)
                LowConfidenceBanner(msg: msg, cs: cs),
            ],
          )),
          if (isUser) ...[
            const SizedBox(width: 10),
            Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [
                      cs.tertiaryContainer,
                      cs.tertiary.withValues(alpha: 0.2)
                    ]),
                    borderRadius: BorderRadius.circular(10)),
                child:
                    Icon(Icons.person_rounded, size: 16, color: cs.tertiary)),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingDots(ColorScheme cs) {
    return Row(
        mainAxisSize: MainAxisSize.min,
        children: List.generate(3, (i) {
          return AnimatedBuilder(
            animation: _typingAnimCtrl,
            builder: (context, _) {
              final progress = (_typingAnimCtrl.value + i * 0.3) % 1.0;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: 8 + (progress * 4),
                height: 8 + (progress * 4),
                decoration: BoxDecoration(
                    color: cs.primary.withValues(alpha: 0.3 + progress * 0.7),
                    shape: BoxShape.circle),
              );
            },
          );
        }));
  }

  List<TextSpan> _parseMarkdown(
      String text, TextStyle baseStyle, TextStyle boldStyle, ColorScheme cs) {
    final spans = <TextSpan>[];
    final exp = RegExp(r'(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)');
    int start = 0;
    for (final match in exp.allMatches(text)) {
      if (match.start > start)
        spans.add(TextSpan(
            text: text.substring(start, match.start), style: baseStyle));
      final matched = match.group(0)!;
      if (matched.startsWith('**') && matched.endsWith('**')) {
        spans.add(TextSpan(
            text: matched.substring(2, matched.length - 2), style: boldStyle));
      } else if (matched.startsWith('_') && matched.endsWith('_')) {
        spans.add(TextSpan(
            text: matched.substring(1, matched.length - 1),
            style: baseStyle.copyWith(fontStyle: FontStyle.italic)));
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        spans.add(TextSpan(
            text: matched.substring(1, matched.length - 1),
            style: baseStyle.copyWith(
                fontFamily: 'monospace',
                backgroundColor: cs.onSurface.withValues(alpha: 0.05),
                color: cs.primary)));
      }
      start = match.end;
    }
    if (start < text.length)
      spans.add(TextSpan(text: text.substring(start), style: baseStyle));
    return spans;
  }

  Widget _buildTypingIndicator(ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(children: [
        Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
                gradient: LinearGradient(
                    colors: [cs.primaryContainer, cs.tertiaryContainer]),
                borderRadius: BorderRadius.circular(10)),
            child:
                Icon(Icons.auto_awesome_rounded, size: 16, color: cs.primary)),
        const SizedBox(width: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
              color: cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(18)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            _buildDot(cs.primary, 0),
            const SizedBox(width: 4),
            _buildDot(cs.primary, 150),
            const SizedBox(width: 4),
            _buildDot(cs.primary, 300),
          ]),
        ),
      ]),
    );
  }

  Widget _buildDot(Color color, int delay) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.4, end: 1.0),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
      builder: (context, value, child) => Opacity(opacity: value, child: child),
      child: Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    );
  }

  Widget _buildInputBar(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      decoration: BoxDecoration(
          color: cs.surface,
          border: Border(
              top:
                  BorderSide(color: cs.outlineVariant.withValues(alpha: 0.2)))),
      child: SafeArea(
        top: false,
        child: Row(children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh,
                  borderRadius: BorderRadius.circular(24)),
              child: TextField(
                controller: _ctrl,
                textDirection: TextDirection.rtl,
                style: TextStyle(
                    fontFamily: 'Tajawal', fontSize: 14, color: cs.onSurface),
                decoration: InputDecoration(
                  hintText: 'اسأل المساعد الذكي...',
                  hintStyle: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 14,
                      color: cs.onSurfaceVariant.withValues(alpha: 0.5)),
                  border: InputBorder.none,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
                onSubmitted: (text) => _send(text),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Container(
            decoration: BoxDecoration(
                gradient: LinearGradient(colors: [cs.primary, cs.tertiary]),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                      color: cs.primary.withValues(alpha: 0.3),
                      blurRadius: 12,
                      offset: const Offset(0, 4))
                ]),
            child: IconButton(
              icon: _loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send_rounded,
                      color: Colors.white, size: 20),
              onPressed: _loading ? null : () => _send(_ctrl.text),
            ),
          ),
        ]),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TAB: EPI STUDIO (NotebookLM-Inspired Content Generator)
  // ═══════════════════════════════════════════════════════════

  Widget _buildStudioTab(ColorScheme cs) {
    return const EpiStudioScreen(embedded: true);
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 3: VACCINATION BOT (Unified Local → AI)
  // ═══════════════════════════════════════════════════════════

  Widget _buildBotTab(ColorScheme cs) {
    return Column(
      children: [
        // Source indicator bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF00897B).withValues(alpha: 0.08),
            border: Border(
                bottom: BorderSide(
                    color: cs.outlineVariant.withValues(alpha: 0.2))),
          ),
          child: Row(
            children: [
              const Text('💉', style: TextStyle(fontSize: 16)),
              const SizedBox(width: 8),
              Expanded(
                  child: Text('محلي أولاً ← ذكاء اصطناعي تلقائياً',
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: cs.onSurfaceVariant))),
              if (_botEngine.isAIEnabled)
                Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                        color: const Color(0xFF4CAF50).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8)),
                    child: const Text('AI ✓',
                        style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF2E7D32)))),
            ],
          ),
        ),
        Expanded(
            child: _botMsgs.isEmpty
                ? _buildBotWelcome(cs)
                : _buildBotMessages(cs)),
        if (_botLoading) _buildBotTyping(cs),
        _buildBotInputBar(cs),
      ],
    );
  }

  Widget _buildBotWelcome(ColorScheme cs) {
    final topics = [
      ('💉', 'وش تطعيمات طفلي؟', 'حسب عمر الطفل', const Color(0xFF00897B)),
      (
        '⚠️',
        'وش الآثار الجانبية؟',
        'حرارة، تورم، تشنجات',
        const Color(0xFFFF5722)
      ),
      ('💰', 'هل مجاني؟', 'معلومات التكلفة', const Color(0xFF4CAF50)),
      ('🚫', 'هل يسبب أوتيزم؟', 'الرد على الأساطير', const Color(0xFF9C27B0)),
      ('🔍', 'الأشراف الداعم', 'زيارات وتقييم', const Color(0xFF2196F3)),
      ('🏢', 'إدارة المستوى الوسيط', 'تخطيط ومؤشرات', const Color(0xFFFF9800)),
      ('📋', 'جدول التحصين الكامل', 'كل التطعيمات', const Color(0xFF00897B)),
      ('❄️', 'سلسلة التبريد', 'VVM والتخزين', const Color(0xFF03A9F4)),
    ];
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        const SizedBox(height: 8),
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 0.8, end: 1.0),
          duration: const Duration(milliseconds: 800),
          curve: Curves.elasticOut,
          builder: (c, v, child) => Transform.scale(scale: v, child: child),
          child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF00897B), Color(0xFF00695C)]),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                        color: const Color(0xFF00897B).withValues(alpha: 0.3),
                        blurRadius: 20)
                  ]),
              child: const Center(
                  child: Text('💉🇾🇪', style: TextStyle(fontSize: 36)))),
        ),
        const SizedBox(height: 16),
        Text('مستشار التحصين الذكي',
            style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: cs.onSurface)),
        const SizedBox(height: 4),
        Text('180+ موضوع — محلي أولاً ← AI تلقائياً',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: cs.onSurfaceVariant,
                height: 1.5)),
        const SizedBox(height: 24),
        Text('📌 مواضيع شائعة',
            style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: cs.onSurface)),
        const SizedBox(height: 12),
        ...topics.map((t) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(14),
                child: InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _sendBotMessage(t.$2),
                  child: Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border:
                              Border.all(color: t.$4.withValues(alpha: 0.12))),
                      child: Row(children: [
                        Text(t.$1, style: const TextStyle(fontSize: 22)),
                        const SizedBox(width: 12),
                        Expanded(
                            child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                              Text(t.$2,
                                  style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                      color: cs.onSurface)),
                              Text(t.$3,
                                  style: TextStyle(
                                      fontFamily: 'Tajawal',
                                      fontSize: 11,
                                      color: cs.onSurfaceVariant)),
                            ])),
                        Icon(Icons.arrow_back_ios_rounded,
                            size: 12,
                            color: cs.onSurfaceVariant.withValues(alpha: 0.35)),
                      ])),
                ),
              ),
            )),
        const SizedBox(height: 20),
      ]),
    );
  }

  Widget _buildBotMessages(ColorScheme cs) {
    return ListView.builder(
      controller: _botScroll,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      itemCount: _botMsgs.length,
      itemBuilder: (context, i) {
        final msg = _botMsgs[i];
        final isMe = !msg.isBot;
        return Padding(
          padding: EdgeInsets.only(
              bottom: 10, left: isMe ? 48 : 0, right: isMe ? 0 : 48),
          child: Column(
              crossAxisAlignment:
                  isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                if (!isMe)
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(
                            gradient: const LinearGradient(
                                colors: [Color(0xFF00897B), Color(0xFF00695C)]),
                            borderRadius: BorderRadius.circular(10)),
                        child: const Center(
                            child: Text('💉', style: TextStyle(fontSize: 14)))),
                    const SizedBox(width: 8),
                    Flexible(child: _botBubbleContent(msg, isMe, cs)),
                  ])
                else
                  _botBubbleContent(msg, isMe, cs),
                if (msg.isBot &&
                    msg.quickReplies != null &&
                    msg.quickReplies!.isNotEmpty)
                  Container(
                      margin: const EdgeInsets.only(top: 6, right: 38),
                      child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: msg.quickReplies!
                              .map((qr) => GestureDetector(
                                  onTap: () => _sendBotMessage(qr.text),
                                  child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 12, vertical: 7),
                                      decoration: BoxDecoration(
                                          color: const Color(0xFFE0F2F1),
                                          borderRadius:
                                              BorderRadius.circular(18),
                                          border: Border.all(
                                              color: const Color(0xFF00897B)
                                                  .withValues(alpha: 0.25))),
                                      child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text(qr.emoji,
                                                style: const TextStyle(
                                                    fontSize: 13)),
                                            const SizedBox(width: 4),
                                            Text(qr.text,
                                                style: const TextStyle(
                                                    fontFamily: 'Tajawal',
                                                    fontSize: 12,
                                                    color: Color(0xFF00695C),
                                                    fontWeight:
                                                        FontWeight.w600)),
                                          ]))))
                              .toList())),
              ]),
        );
      },
    );
  }

  Widget _botBubbleContent(BotMessage msg, bool isMe, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? cs.primary : cs.surfaceContainerLow,
        borderRadius: BorderRadius.only(
            topLeft: Radius.circular(isMe ? 16 : 4),
            topRight: Radius.circular(isMe ? 4 : 16),
            bottomLeft: const Radius.circular(16),
            bottomRight: const Radius.circular(16)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)
        ],
      ),
      child: SelectableText(msg.text,
          style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 14,
              height: 1.6,
              color: isMe ? cs.onPrimary : cs.onSurface),
          textDirection: TextDirection.rtl),
    );
  }

  Widget _buildBotTyping(ColorScheme cs) {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        alignment: Alignment.centerRight,
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                  color: const Color(0xFF00897B).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: const Center(
                  child: Text('💉', style: TextStyle(fontSize: 12)))),
          const SizedBox(width: 8),
          Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                  color: cs.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8)
                  ]),
              child: AnimatedBuilder(
                  animation: _typingAnimCtrl,
                  builder: (c, _) => Row(
                      mainAxisSize: MainAxisSize.min,
                      children: List.generate(3, (i) {
                        final v = ((_typingAnimCtrl.value + i * 0.3) % 1.0);
                        final o = (v < 0.5) ? v * 2 : (1 - v) * 2;
                        return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            width: 7,
                            height: 7,
                            decoration: BoxDecoration(
                                color: Color.lerp(
                                    const Color(0xFF00897B)
                                        .withValues(alpha: 0.2),
                                    const Color(0xFF00897B),
                                    o),
                                shape: BoxShape.circle));
                      })))),
        ]));
  }

  Widget _buildBotInputBar(ColorScheme cs) {
    return Container(
      padding: EdgeInsets.only(
          left: 12,
          right: 12,
          top: 10,
          bottom: MediaQuery.of(context).padding.bottom + 8),
      decoration: BoxDecoration(color: cs.surface, boxShadow: [
        BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, -2))
      ]),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        GestureDetector(
            onTap: _botLoading ? null : () => _sendBotMessage(_botCtrl.text),
            child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                    gradient: _botCtrl.text.trim().isNotEmpty
                        ? const LinearGradient(
                            colors: [Color(0xFF00897B), Color(0xFF00695C)])
                        : null,
                    color: _botCtrl.text.trim().isNotEmpty
                        ? null
                        : cs.surfaceContainerHigh,
                    borderRadius: BorderRadius.circular(14)),
                child: _botLoading
                    ? Padding(
                        padding: const EdgeInsets.all(12),
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: cs.onPrimary))
                    : Icon(Icons.send_rounded,
                        color: _botCtrl.text.trim().isNotEmpty
                            ? cs.onPrimary
                            : cs.onSurfaceVariant,
                        size: 20))),
        const SizedBox(width: 10),
        Expanded(
            child: Container(
                constraints: const BoxConstraints(maxHeight: 100),
                decoration: BoxDecoration(
                    color: cs.surfaceContainerHighest,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: cs.outlineVariant.withValues(alpha: 0.3))),
                child: TextField(
                    controller: _botCtrl,
                    textDirection: TextDirection.rtl,
                    maxLines: 3,
                    minLines: 1,
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 14,
                        color: cs.onSurface),
                    decoration: InputDecoration(
                        hintText: 'اسأل عن التطعيمات...',
                        hintStyle: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 13,
                            color: cs.onSurfaceVariant),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10)),
                    onChanged: (_) => setState(() {}),
                    onSubmitted: (v) => _sendBotMessage(v)))),
      ]),
    );
  }

  /// ═══ UNIFIED: Local first → AI fallback ═══
  Future<void> _sendBotMessage(String text) async {
    if (text.trim().isEmpty || _botLoading) return;
    HapticFeedback.lightImpact();
    _botCtrl.clear();
    setState(() {
      _botMsgs.add(BotMessage(
          id: '${DateTime.now().millisecondsSinceEpoch}',
          text: text,
          isBot: false,
          timestamp: DateTime.now()));
      _botLoading = true;
    });
    _botScrollDown();

    try {
      // Step 1: Local engine
      final localResp = _botEngine.sendMessage(text);
      if (localResp != null && !_isGenericResponse(localResp.text)) {
        setState(() {
          _botMsgs.add(localResp);
          _botLoading = false;
        });
        _botScrollDown();
        return;
      }
      if (localResp != null) setState(() => _botMsgs.add(localResp));

      // Step 2: AI fallback
      try {
        final api = ref.read(apiClientProvider);
        final hist = _botMsgs.length > 6
            ? _botMsgs.sublist(_botMsgs.length - 6)
            : _botMsgs;
        final histJson = hist
            .map((m) => {
                  'role': m.isBot ? 'assistant' : 'user',
                  'content': m.text.length > 300
                      ? '${m.text.substring(0, 300)}...'
                      : m.text
                })
            .toList();
        // ═══ Pass active campaign round to AI for vaccination context ═══
        final activeRound = ref.read(campaignRoundProvider);
        final activeCampaign = ref.read(campaignProvider).value;

        final resp = await api.callFunction('ai-chat-v3', {
          'message': text,
          'history': histJson,
          'template': 'vaccination',
          if (activeCampaign == 'integrated_activity') 'campaign_round': activeRound,
        }).timeout(const Duration(seconds: 30));
        final reply = resp['reply'] as String? ?? '';
        if (reply.isNotEmpty && _mounted) {
          if (localResp != null && _botMsgs.isNotEmpty && _botMsgs.last.isBot)
            _botMsgs.removeLast();
          setState(() {
            _botMsgs.add(BotMessage(
                id: '${DateTime.now().millisecondsSinceEpoch}',
                text: reply,
                isBot: true,
                timestamp: DateTime.now(),
                quickReplies: _botSuggestions(text)));
            _botLoading = false;
          });
        } else {
          setState(() => _botLoading = false);
        }
      } catch (_) {
        setState(() => _botLoading = false);
      }
    } catch (_) {
      setState(() {
        _botMsgs.add(BotMessage(
            id: '${DateTime.now().millisecondsSinceEpoch}',
            text: '⚠️ حدث خطأ. حاول مرة أخرى.',
            isBot: true,
            timestamp: DateTime.now(),
            quickReplies: const [
              BotQuickReply(text: 'وش تطعيمات طفلي؟', emoji: '💉'),
              BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️')
            ]));
        _botLoading = false;
      });
    }

    // ═══ Save conversation context to DB (memory across sessions) ═══
    _saveBotConversationContext(text);

    _botScrollDown();
  }

  /// Save conversation context so the bot remembers across sessions
  Future<void> _saveBotConversationContext(String lastUserMessage) async {
    try {
      final service = ref.read(dynamicBotKnowledgeServiceProvider);
      // Generate title from first user message (truncate)
      final title = lastUserMessage.length > 40
          ? '${lastUserMessage.substring(0, 40)}...'
          : lastUserMessage;

      await service.saveConversation(
        title: title,
        lastTopic: _botEngine.messages.isNotEmpty
            ? _botEngine.messages.last.text.substring(0, 50)
            : null,
      );
    } catch (_) {}
  }

  bool _isGenericResponse(String t) =>
      t.contains('🤖 أقدر أساعدك') ||
      t.contains('مش فاهم قصدك') ||
      t.contains('جرب تسأل') ||
      t.contains('أو اختر من الاقتراحات') ||
      t.contains('أهلاً! أنا مستشار التحصين الذكي');

  List<BotQuickReply> _botSuggestions(String lastMsg) {
    final n = SmartNLP.normalize(lastMsg);
    if (n.contains('حرار') || n.contains('سخون'))
      return const [
        BotQuickReply(text: 'متى أخاف؟', emoji: '🚨'),
        BotQuickReply(text: 'متى أروح للطبيب؟', emoji: '🏥')
      ];
    if (n.contains('تطعيم') || n.contains('لقاح'))
      return const [
        BotQuickReply(text: 'وش الآثار الجانبية؟', emoji: '⚠️'),
        BotQuickReply(text: 'كم جرعة؟', emoji: '🔢')
      ];
    return const [
      BotQuickReply(text: 'وش تطعيمات طفلي؟', emoji: '💉'),
      BotQuickReply(text: 'وش الآثار؟', emoji: '⚠️'),
      BotQuickReply(text: 'هل مجاني؟', emoji: '💰')
    ];
  }

  void _botScrollDown() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_botScroll.hasClients)
        _botScroll.animateTo(_botScroll.position.maxScrollExtent + 100,
            duration: const Duration(milliseconds: 350),
            curve: Curves.easeOutCubic);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // TAB 4: SMART ALERTS
  // ═══════════════════════════════════════════════════════════

  Widget _buildAlertsTab(ColorScheme cs) {
    // ═══ OFFLINE: Skip network provider entirely when offline ═══
    if (!ConnectivityUtils.isOnline) {
      return _buildAlertsContent(cs, {});
    }

    try {
      final analyticsAsync =
          ref.watch(dashboardAnalyticsProvider(const AnalyticsFilter()));

      return analyticsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _buildAlertsContent(cs, {}),
        data: (analytics) => _buildAlertsContent(cs, analytics),
      );
    } catch (_) {
      return _buildAlertsContent(cs, {});
    }
  }

  Widget _buildAlertsContent(ColorScheme cs, Map<String, dynamic> analytics) {
    // Build data map for SmartAlertsEngine (without shortages)
    final data = <String, dynamic>{
      ...analytics,
    };

    final alerts = SmartAlertsEngine.analyzeAlerts(data);
    final briefing = SmartAlertsEngine.generateBriefing(data);
    final supervisionPriorities =
        SmartAlertsEngine.getSupervisionPriorities(data);

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Executive Briefing
          if (briefing.summary.isNotEmpty) ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  cs.primaryContainer.withValues(alpha: 0.5),
                  cs.tertiaryContainer.withValues(alpha: 0.2)
                ], begin: Alignment.topRight, end: Alignment.bottomLeft),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: cs.primary.withValues(alpha: 0.1)),
              ),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Icon(Icons.auto_awesome_rounded,
                          color: cs.primary, size: 22),
                      const SizedBox(width: 10),
                      Text('الملخص التنفيذي',
                          style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: cs.onSurface)),
                      const Spacer(),
                      if (briefing.criticalAlerts > 0)
                        Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                                color: cs.error,
                                borderRadius: BorderRadius.circular(12)),
                            child: Text('${briefing.criticalAlerts} حرج',
                                style: const TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: Colors.white))),
                    ]),
                    const SizedBox(height: 12),
                    SelectableText(briefing.summary,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 13,
                            color: cs.onSurface,
                            height: 1.8)),
                  ]),
            ),
            const SizedBox(height: 24),
          ],

          // Alerts List
          if (alerts.isNotEmpty) ...[
            Text('🔔 التنبيهات النشطة (${alerts.length})',
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface)),
            const SizedBox(height: 12),
            ...alerts.map((alert) => _buildAlertCard(cs, alert)),
            const SizedBox(height: 24),
          ] else ...[
            Center(
                child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(children: [
                Icon(Icons.check_circle_outline,
                    size: 48, color: cs.primary.withValues(alpha: 0.5)),
                const SizedBox(height: 12),
                Text('لا توجد تنبيهات حالياً',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurfaceVariant)),
                Text('النظام يعمل بشكل طبيعي ✅',
                    style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: cs.onSurfaceVariant)),
              ]),
            )),
          ],

          // Supervision Priorities
          if (supervisionPriorities.isNotEmpty) ...[
            Text('📋 أولويات الزيارات الإشرافية',
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface)),
            const SizedBox(height: 12),
            ...supervisionPriorities
                .take(5)
                .map((p) => _buildPriorityCard(cs, p)),
            const SizedBox(height: 24),
          ],

          // Recommendations
          if (briefing.recommendations.isNotEmpty) ...[
            Text('💡 التوصيات',
                style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface)),
            const SizedBox(height: 12),
            ...briefing.recommendations.take(5).map((rec) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                            margin: const EdgeInsets.only(top: 6),
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                                color: cs.primary, shape: BoxShape.circle)),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Text(rec,
                                style: TextStyle(
                                    fontFamily: 'Tajawal',
                                    fontSize: 13,
                                    color: cs.onSurface,
                                    height: 1.6))),
                      ]),
                )),
          ],
        ],
      ),
    );
  }

  Widget _buildAlertCard(ColorScheme cs, SmartAlert alert) {
    final severityColor = switch (alert.severity) {
      AlertSeverity.critical => const Color(0xFFD32F2F),
      AlertSeverity.high => const Color(0xFFFF5722),
      AlertSeverity.medium => const Color(0xFF2196F3),
      AlertSeverity.low => const Color(0xFF7B1FA2),
      AlertSeverity.info => const Color(0xFF388E3C),
    };

    final severityText = switch (alert.severity) {
      AlertSeverity.critical => 'حرج',
      AlertSeverity.high => 'عالي',
      AlertSeverity.medium => 'متوسط',
      AlertSeverity.low => 'منخفض',
      AlertSeverity.info => 'إيجابي',
    };

    final iconData = switch (alert.type) {
      'critical_shortage' => Icons.inventory_2_rounded,
      'low_coverage' => Icons.trending_down_rounded,
      'high_dropout' => Icons.person_remove_rounded,
      'anomaly_detected' => Icons.search_rounded,
      'cold_chain_breach' => Icons.ac_unit_rounded,
      'supervision_overdue' => Icons.assignment_late_rounded,
      'campaign_risk' => Icons.campaign_rounded,
      'data_quality' => Icons.error_outline_rounded,
      'outbreak_risk' => Icons.coronavirus_rounded,
      'positive_trend' => Icons.trending_up_rounded,
      _ => Icons.notifications_rounded,
    };

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
                color: severityColor.withValues(alpha: 0.15), width: 1),
          ),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                      color: severityColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12)),
                  child: Icon(iconData, size: 20, color: severityColor)),
              const SizedBox(width: 12),
              Expanded(
                  child: Text(alert.title,
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface))),
              Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                      color: severityColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12)),
                  child: Text(severityText,
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: severityColor))),
            ]),
            const SizedBox(height: 10),
            Text(alert.message,
                style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 13,
                    color: cs.onSurface,
                    height: 1.6)),
            if (alert.action != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                    color: severityColor.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(10)),
                child: Row(children: [
                  Icon(Icons.lightbulb_outline_rounded,
                      size: 16, color: severityColor),
                  const SizedBox(width: 8),
                  Expanded(
                      child: Text(alert.action!,
                          style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 12,
                              color: cs.onSurface,
                              height: 1.5))),
                ]),
              ),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _buildPriorityCard(ColorScheme cs, SupervisionPriority p) {
    final urgencyColor = p.urgencyScore >= 5
        ? const Color(0xFFD32F2F)
        : p.urgencyScore >= 3
            ? const Color(0xFFFF9800)
            : const Color(0xFF2196F3);
    final daysLeft = p.suggestedDate.difference(DateTime.now()).inDays;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                  color: urgencyColor.withValues(alpha: 0.12), width: 1)),
          child: Row(children: [
            Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                    color: urgencyColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10)),
                child:
                    Icon(Icons.place_rounded, size: 18, color: urgencyColor)),
            const SizedBox(width: 12),
            Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  Text(p.governorate,
                      style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: cs.onSurface)),
                  Text(p.reason,
                      style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: cs.onSurfaceVariant),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ])),
            Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                    color: urgencyColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8)),
                child: Text(daysLeft <= 1 ? 'غداً' : '$daysLeft أيام',
                    style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: urgencyColor))),
          ]),
        ),
      ),
    );
  }

  // ═══ DELETE SHEET ═══

  Widget _buildDeleteSheet(BuildContext ctx) {
    final cs = Theme.of(ctx).colorScheme;
    return Container(
      decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24))),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
                color: cs.onSurfaceVariant.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 20),
        Container(
            width: 56,
            height: 56,
            decoration:
                BoxDecoration(color: cs.errorContainer, shape: BoxShape.circle),
            child:
                Icon(Icons.delete_outline_rounded, size: 28, color: cs.error)),
        const SizedBox(height: 16),
        Text('مسح المحادثة',
            style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: cs.onSurface)),
        const SizedBox(height: 8),
        Text('سيتم حذف جميع الرسائل نهائياً.',
            textAlign: TextAlign.center,
            style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: cs.onSurfaceVariant,
                height: 1.6)),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(
              child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14))),
                  child: Text('إلغاء',
                      style: TextStyle(
                          fontFamily: 'Cairo', color: cs.onSurface)))),
          const SizedBox(width: 12),
          Expanded(
              child: FilledButton(
                  onPressed: () => Navigator.pop(ctx, true),
                  style: FilledButton.styleFrom(
                      backgroundColor: cs.error,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14))),
                  child: const Text('مسح',
                      style: TextStyle(fontFamily: 'Cairo')))),
        ]),
      ]),
    );
  }
}

// ═══════════════════════════════════════════════════════════
// HELPER WIDGETS & MODELS
// ═══════════════════════════════════════════════════════════

class _StreamingCursor extends StatefulWidget {
  final Color color;
  const _StreamingCursor({required this.color});

  @override
  State<_StreamingCursor> createState() => _StreamingCursorState();
}

class _StreamingCursorState extends State<_StreamingCursor>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 530))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _ctrl,
      child: Text('▎', style: TextStyle(color: widget.color, fontSize: 14)),
    );
  }
}

class _ModelOption {
  final String id;
  final String label;
  final String? model;
  const _ModelOption(this.id, this.label, this.model);
}
