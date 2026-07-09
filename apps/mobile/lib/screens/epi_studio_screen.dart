import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_core/epi_core.dart';
import '../providers/app_providers.dart';
import '../services/epi_audio_service.dart';
import 'citation_widgets.dart';

/// ═══════════════════════════════════════════════════════════
///  EPI Studio — NotebookLM-Inspired Content Generator
///
///  Generates 5 types of artifacts from grounded sources:
///  1. 📋 Briefing Doc (executive summary)
///  2. 📚 Study Guide (organized learning material)
///  3. ❓ FAQ (frequently asked questions)
///  4. 🧠 Mind Map (branching topic diagram)
///  5. 🎧 Audio Overview (podcast-style script)
/// ═══════════════════════════════════════════════════════════

class StudioArtifact {
  final String type;
  final String title;
  final String content;
  final List<GroundingSource> sources;
  final Map<String, dynamic>? structuredData;
  final int groundedInSources;
  final String? provider;
  final int latencyMs;

  StudioArtifact({
    required this.type,
    required this.title,
    required this.content,
    required this.sources,
    this.structuredData,
    required this.groundedInSources,
    this.provider,
    required this.latencyMs,
  });

  factory StudioArtifact.fromJson(Map<String, dynamic> j) {
    final metadata = j['metadata'] as Map<String, dynamic>? ?? {};
    return StudioArtifact(
      type: j['type'] as String? ?? '',
      title: j['title'] as String? ?? '',
      content: j['content'] as String? ?? '',
      sources: (j['sources'] as List?)
              ?.map((s) => GroundingSource.fromJson(Map<String, dynamic>.from(s)))
              .toList() ??
          [],
      structuredData: {
        if (j['mind_map_nodes'] != null) 'mind_map_nodes': j['mind_map_nodes'],
        if (j['faq_items'] != null) 'faq_items': j['faq_items'],
        if (j['study_guide_sections'] != null)
          'study_guide_sections': j['study_guide_sections'],
        if (j['audio_script'] != null) 'audio_script': j['audio_script'],
      },
      groundedInSources: metadata['grounded_in_sources'] as int? ?? 0,
      provider: metadata['provider'] as String?,
      latencyMs: metadata['latency_ms'] as int? ?? 0,
    );
  }

  IconData get icon => switch (type) {
        'briefing_doc' => Icons.description_rounded,
        'study_guide' => Icons.menu_book_rounded,
        'faq' => Icons.quiz_rounded,
        'mind_map' => Icons.account_tree_rounded,
        'audio_overview' => Icons.graphic_eq_rounded,
        _ => Icons.auto_awesome_rounded,
      };

  Color get color => switch (type) {
        'briefing_doc' => const Color(0xFF3B82F6),
        'study_guide' => const Color(0xFF22C55E),
        'faq' => const Color(0xFFF59E0B),
        'mind_map' => const Color(0xFF8B5CF6),
        'audio_overview' => const Color(0xFFEC4899),
        _ => const Color(0xFF6B7280),
      };
}

/// ═══════════════════════════════════════════════════════════
///  Studio Screen — main entry point
/// ═══════════════════════════════════════════════════════════

class EpiStudioScreen extends ConsumerStatefulWidget {
  final String? initialTopic;
  final bool embedded; // true = no AppBar (used as tab inside another Scaffold)

  const EpiStudioScreen({super.key, this.initialTopic, this.embedded = false});

  @override
  ConsumerState<EpiStudioScreen> createState() => _EpiStudioScreenState();
}

class _EpiStudioScreenState extends ConsumerState<EpiStudioScreen> {
  final _topicCtrl = TextEditingController();
  StudioArtifact? _artifact;
  bool _loading = false;
  String? _selectedType;
  bool _saving = false;
  bool _showLibrary = false;
  List<Map<String, dynamic>> _savedArtifacts = [];

  final EpiAudioService _audio = EpiAudioService();
  PlaybackState _playbackState = PlaybackState.stopped;
  int _currentSegment = 0;

  static final _artifactTypes = [
    (
      type: 'briefing_doc',
      icon: Icons.description_rounded,
      label: 'وثيقة موجزة',
      desc: 'ملخص تنفيذي للمديرين',
      color: const Color(0xFF3B82F6),
    ),
    (
      type: 'study_guide',
      icon: Icons.menu_book_rounded,
      label: 'دليل دراسي',
      desc: 'مفاهيم + أرقام + أسئلة',
      color: const Color(0xFF22C55E),
    ),
    (
      type: 'faq',
      icon: Icons.quiz_rounded,
      label: 'أسئلة شائعة',
      desc: '8-12 سؤال مع إجابات',
      color: const Color(0xFFF59E0B),
    ),
    (
      type: 'mind_map',
      icon: Icons.account_tree_rounded,
      label: 'خريطة ذهنية',
      desc: 'فروع وتفاصيل مرئية',
      color: const Color(0xFF8B5CF6),
    ),
    (
      type: 'audio_overview',
      icon: Icons.graphic_eq_rounded,
      label: 'بودكاست صوتي',
      desc: 'حوار بصوتين عن الموضوع',
      color: const Color(0xFFEC4899),
    ),
  ];

  @override
  void initState() {
    super.initState();
    if (widget.initialTopic != null) {
      _topicCtrl.text = widget.initialTopic!;
    }
    _audio.onStateChanged = (s) {
      if (mounted) setState(() => _playbackState = s);
    };
    _audio.onSegmentChanged = (i) {
      if (mounted) setState(() => _currentSegment = i);
    };
    _audio.init();
    _loadSavedArtifacts();
  }

  @override
  void dispose() {
    _audio.dispose();
    _topicCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSavedArtifacts() async {
    try {
      final api = ref.read(apiClientProvider);
      final resp = await api.callFunction('ai-chat-v3', {
        'mode': 'studio_list',
      }).timeout(const Duration(seconds: 10));
      if (mounted) {
        setState(() {
          _savedArtifacts = (resp['artifacts'] as List?)
                  ?.map((e) => Map<String, dynamic>.from(e))
                  .toList() ??
              [];
        });
      }
    } catch (_) {}
  }

  Future<void> _saveArtifact() async {
    if (_artifact == null) return;
    setState(() => _saving = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.callFunction('ai-chat-v3', {
        'mode': 'studio_save',
        'artifact_type': _artifact!.type,
        'title': _artifact!.title,
        'topic': _topicCtrl.text,
        'content': _artifact!.content,
        'sources': _artifact!.sources
            .map((s) => {
                  'id': s.id,
                  'type': s.type,
                  'summary': s.summary,
                  'quote': s.quote,
                  'metadata': s.metadata,
                })
            .toList(),
        'structured_data': _artifact!.structuredData ?? {},
        'metadata': {
          'generatedAt': DateTime.now().toIso8601String(),
          'groundedInSources': _artifact!.groundedInSources,
          'provider': _artifact!.provider,
          'latencyMs': _artifact!.latencyMs,
        },
      }).timeout(const Duration(seconds: 10));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(children: [
              Icon(Icons.check_circle, color: Colors.white, size: 16),
              SizedBox(width: 8),
              Text('تم حفظ المحتوى في مكتبتك', style: TextStyle(fontFamily: 'Tajawal')),
            ]),
            behavior: SnackBarBehavior.floating,
            backgroundColor: Colors.green.shade700,
          ),
        );
        _loadSavedArtifacts();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل الحفظ: $e')),
        );
      }
    }
    if (mounted) setState(() => _saving = false);
  }

  Future<void> _loadSavedArtifact(Map<String, dynamic> saved) async {
    final artifact = StudioArtifact(
      type: saved['artifact_type'] as String? ?? '',
      title: saved['title'] as String? ?? '',
      content: saved['content'] as String? ?? '',
      sources: (saved['sources'] as List?)
              ?.map((s) => GroundingSource.fromJson(Map<String, dynamic>.from(s)))
              .toList() ??
          [],
      structuredData: saved['structured_data'] as Map<String, dynamic>?,
      groundedInSources: (saved['metadata'] as Map?)?['groundedInSources'] as int? ?? 0,
      provider: (saved['metadata'] as Map?)?['provider'] as String?,
      latencyMs: (saved['metadata'] as Map?)?['latencyMs'] as int? ?? 0,
    );
    setState(() {
      _artifact = artifact;
      _showLibrary = false;
    });
  }

  Future<void> _generate(String type) async {
    final topic = _topicCtrl.text.trim();
    if (topic.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('اكتب موضوعاً أولاً'),
          behavior: SnackBarBehavior.floating,
          backgroundColor: Colors.red.shade700,
        ),
      );
      return;
    }

    setState(() {
      _loading = true;
      _selectedType = type;
      _artifact = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final activeRound = ref.read(campaignRoundProvider);
      final activeCampaign = ref.read(campaignProvider).value;

      final resp = await api.callFunction('ai-chat-v3', {
        'mode': 'studio_generate',
        'artifact_type': type,
        'topic': topic,
        'message': topic,
        if (activeCampaign == 'integrated_activity') 'campaign_round': activeRound,
      }).timeout(const Duration(seconds: 90));

      final artifactJson = resp['artifact'] as Map<String, dynamic>?;
      if (artifactJson != null && mounted) {
        setState(() {
          _artifact = StudioArtifact.fromJson(artifactJson);
          _loading = false;
        });
        HapticFeedback.mediumImpact();
      } else if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('فشل توليد المحتوى. حاول مرة أخرى.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('خطأ: ${e.toString().split('(').first}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    // When embedded (as a tab), don't render another Scaffold — just the body
    if (widget.embedded) {
      return _buildStudioBody(cs);
    }
    return Scaffold(
      appBar: AppBar(
        title: const Text('استوديو المحتوى', style: TextStyle(fontFamily: 'Cairo')),
        backgroundColor: cs.primary,
        foregroundColor: cs.onPrimary,
        elevation: 0,
        actions: [
          if (_artifact != null && !_loading)
            IconButton(
              icon: _saving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.bookmark_add_rounded, size: 22),
              onPressed: _saving ? null : _saveArtifact,
              tooltip: 'حفظ',
            ),
          IconButton(
            icon: Badge(
              isLabelVisible: _savedArtifacts.isNotEmpty,
              label: Text('${_savedArtifacts.length}'),
              child: const Icon(Icons.folder_rounded, size: 22),
            ),
            onPressed: () => setState(() => _showLibrary = !_showLibrary),
            tooltip: 'مكتبتي',
          ),
        ],
      ),
      body: _buildStudioBody(cs),
    );
  }

  Widget _buildStudioBody(ColorScheme cs) {
    return Column(
      children: [
        // When embedded, show save + library buttons inline (no AppBar)
        if (widget.embedded && _artifact != null && !_loading)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            color: cs.surfaceContainerLow,
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'استوديو المحتوى',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: cs.onSurface,
                    ),
                  ),
                ),
                IconButton(
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.bookmark_add_rounded, size: 20),
                  onPressed: _saving ? null : _saveArtifact,
                  tooltip: 'حفظ',
                ),
                IconButton(
                  icon: Badge(
                    isLabelVisible: _savedArtifacts.isNotEmpty,
                    label: Text('${_savedArtifacts.length}'),
                    child: const Icon(Icons.folder_rounded, size: 20),
                  ),
                  onPressed: () => setState(() => _showLibrary = !_showLibrary),
                  tooltip: 'مكتبتي',
                ),
              ],
            ),
          ),
        // Topic input
        _buildTopicInput(cs),
          // Library panel (collapsible)
          if (_showLibrary) _buildLibraryPanel(cs),
          // Artifact type selector
          _buildTypeSelector(cs),
          // Loading indicator
          if (_loading) _buildLoading(cs),
          // Artifact display
          if (_artifact != null && !_loading)
            Expanded(child: _buildArtifactView(cs)),
          if (_artifact == null && !_loading)
            Expanded(child: _buildEmpty(cs)),
        ],
      );
  }

  Widget _buildLibraryPanel(ColorScheme cs) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.folder_rounded, size: 18, color: cs.primary),
              const SizedBox(width: 6),
              Text(
                'المحتوى المحفوظ (${_savedArtifacts.length})',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.close_rounded, size: 16, color: cs.onSurfaceVariant),
                onPressed: () => setState(() => _showLibrary = false),
                visualDensity: VisualDensity.compact,
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_savedArtifacts.isEmpty)
            Padding(
              padding: const EdgeInsets.all(20),
              child: Center(
                child: Text(
                  'لا يوجد محتوى محفوظ بعد',
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 250),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _savedArtifacts.length,
                itemBuilder: (context, i) {
                  final s = _savedArtifacts[i];
                  final type = s['artifact_type'] as String? ?? '';
                  final icon = switch (type) {
                    'briefing_doc' => Icons.description_rounded,
                    'study_guide' => Icons.menu_book_rounded,
                    'faq' => Icons.quiz_rounded,
                    'mind_map' => Icons.account_tree_rounded,
                    'audio_overview' => Icons.graphic_eq_rounded,
                    _ => Icons.auto_awesome_rounded,
                  };
                  return ListTile(
                    leading: Icon(icon, color: cs.primary, size: 20),
                    title: Text(
                      s['title'] as String? ?? '',
                      style: TextStyle(fontFamily: 'Cairo', fontSize: 12, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      (s['created_at'] as String?)?.split('T').first ?? '',
                      style: TextStyle(fontFamily: 'Tajawal', fontSize: 10, color: cs.onSurfaceVariant),
                    ),
                    trailing: s['is_favorite'] == true
                        ? Icon(Icons.star_rounded, size: 16, color: Colors.amber)
                        : null,
                    onTap: () => _loadSavedArtifact(s),
                    visualDensity: VisualDensity.compact,
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTopicInput(ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        border: Border(bottom: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.2))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'موضوع المحتوى',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _topicCtrl,
            textDirection: TextDirection.rtl,
            style: TextStyle(fontFamily: 'Tajawal', fontSize: 14, color: cs.onSurface),
            decoration: InputDecoration(
              hintText: 'مثال: تحليل أداء حملة شلل الأطفال في تعز',
              hintStyle: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: cs.onSurfaceVariant.withValues(alpha: 0.5),
              ),
              filled: true,
              fillColor: cs.surfaceContainerHigh,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
            onSubmitted: (_) => _selectedType != null ? _generate(_selectedType!) : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTypeSelector(ColorScheme cs) {
    return Container(
      height: 120,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _artifactTypes.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final t = _artifactTypes[i];
          final isSelected = _selectedType == t.type;
          return GestureDetector(
            onTap: () => _generate(t.type),
            child: Container(
              width: 110,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected ? t.color : t.color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? t.color : t.color.withValues(alpha: 0.3),
                  width: isSelected ? 2 : 1,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(t.icon, size: 26, color: isSelected ? Colors.white : t.color),
                  const SizedBox(height: 6),
                  Text(
                    t.label,
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isSelected ? Colors.white : t.color,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    t.desc,
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 9,
                      color: isSelected ? Colors.white.withValues(alpha: 0.8) : cs.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLoading(ColorScheme cs) {
    final typeLabel = _artifactTypes
        .where((t) => t.type == _selectedType)
        .firstOrNull?.label;
    return Container(
      padding: const EdgeInsets.all(40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            typeLabel != null ? 'جاري توليد $typeLabel...' : 'جاري التوليد...',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 13,
              color: cs.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'يستغرق 10-30 ثانية',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              color: cs.onSurfaceVariant.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty(ColorScheme cs) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_awesome_rounded, size: 64, color: cs.primary.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            'استوديو المحتوى الذكي',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: cs.onSurface,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'اكتب موضوعاً واختر نوع المحتوى\nسيتم توليده من بيانات النظام وقاعدة المعرفة',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 12,
              color: cs.onSurfaceVariant,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArtifactView(ColorScheme cs) {
    final artifact = _artifact!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Header card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: artifact.color.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: artifact.color.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: artifact.color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(artifact.icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      artifact.title,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.verified_rounded, size: 12, color: artifact.color),
                        const SizedBox(width: 4),
                        Text(
                          'مستند إلى ${artifact.groundedInSources} مصدر',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: artifact.color,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(Icons.bolt_rounded, size: 12, color: cs.onSurfaceVariant),
                        const SizedBox(width: 2),
                        Text(
                          artifact.latencyMs < 1000
                              ? '${artifact.latencyMs}ms'
                              : '${(artifact.latencyMs / 1000).toStringAsFixed(1)}s',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        // Type-specific content
        if (artifact.type == 'audio_overview')
          _buildAudioScriptView(cs, artifact)
        else if (artifact.type == 'mind_map')
          _buildMindMapView(cs, artifact)
        else if (artifact.type == 'faq')
          _buildFaqView(cs, artifact)
        else
          _buildMarkdownView(cs, artifact),
        // Sources
        if (artifact.sources.isNotEmpty) ...[
          const SizedBox(height: 16),
          _buildSourcesSection(cs, artifact),
        ],
      ],
    );
  }

  Widget _buildMarkdownView(ColorScheme cs, StudioArtifact artifact) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: RichTextWithCitations(
        text: artifact.content,
        sources: artifact.sources,
        baseStyle: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 13,
          height: 1.8,
          color: cs.onSurface,
        ),
        boldStyle: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 13,
          fontWeight: FontWeight.w800,
          height: 1.8,
          color: cs.onSurface,
        ),
        cs: cs,
      ),
    );
  }

  Widget _buildFaqView(ColorScheme cs, StudioArtifact artifact) {
    final items = (artifact.structuredData?['faq_items'] as List?) ?? [];
    if (items.isEmpty) return _buildMarkdownView(cs, artifact);

    return Column(
      children: items.map<Widget>((raw) {
        final item = Map<String, dynamic>.from(raw);
        final citations = (item['citations'] as List?)?.cast<int>() ?? [];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(14),
            border: Border(
              right: BorderSide(color: artifact.color, width: 3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.help_outline_rounded, size: 16, color: artifact.color),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      item['question'] as String? ?? '',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              RichTextWithCitations(
                text: item['answer'] as String? ?? '',
                sources: artifact.sources,
                baseStyle: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  height: 1.7,
                  color: cs.onSurface,
                ),
                boldStyle: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
                cs: cs,
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildMindMapView(ColorScheme cs, StudioArtifact artifact) {
    final nodes = (artifact.structuredData?['mind_map_nodes'] as List?) ?? [];
    if (nodes.isEmpty) return _buildMarkdownView(cs, artifact);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: artifact.color.withValues(alpha: 0.3)),
      ),
      child: _buildMindMapNode(nodes.first as Map<String, dynamic>, cs, artifact, 0),
    );
  }

  Widget _buildMindMapNode(
    Map<String, dynamic> node,
    ColorScheme cs,
    StudioArtifact artifact,
    int depth,
  ) {
    final label = node['label'] as String? ?? '';
    final citation = node['citation'] as int?;
    final children = (node['children'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 8 + (depth * 4),
              height: 8 + (depth * 4),
              decoration: BoxDecoration(
                color: artifact.color.withValues(alpha: 0.3 + (depth * 0.15)),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: RichTextWithCitations(
                text: citation != null ? '$label [$citation]' : label,
                sources: artifact.sources,
                baseStyle: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13 - (depth * 0.5).clamp(0, 3),
                  fontWeight: depth < 2 ? FontWeight.w700 : FontWeight.w500,
                  color: cs.onSurface,
                ),
                boldStyle: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13 - (depth * 0.5).clamp(0, 3),
                  fontWeight: FontWeight.w800,
                  color: cs.onSurface,
                ),
                cs: cs,
              ),
            ),
          ],
        ),
        if (children.isNotEmpty)
          Padding(
            padding: EdgeInsets.only(right: 16 + (depth * 8), top: 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children
                  .map<Widget>((c) => _buildMindMapNode(
                        Map<String, dynamic>.from(c as Map),
                        cs,
                        artifact,
                        depth + 1,
                      ))
                  .toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildAudioScriptView(ColorScheme cs, StudioArtifact artifact) {
    final segments = (artifact.structuredData?['audio_script'] as List?) ?? [];
    if (segments.isEmpty) return _buildMarkdownView(cs, artifact);

    // Load script into audio service
    final audioSegments = segments
        .map((s) => AudioSegment.fromJson(Map<String, dynamic>.from(s as Map)))
        .toList();
    if (_audio.totalSegments != audioSegments.length) {
      _audio.loadScript(audioSegments);
    }

    return Column(
      children: [
        // ─── Real Audio Player with TTS controls ───
        Container(
          padding: const EdgeInsets.all(16),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [artifact.color, artifact.color.withValues(alpha: 0.7)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.graphic_eq_rounded, color: Colors.white, size: 28),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'بودكاست تعليمي',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          '${segments.length} مقطع • مدة تقديرية ${segments.length ~/ 2} دقيقة',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'TTS جاهز',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // ─── Playback controls ───
              Row(
                children: [
                  // Previous
                  IconButton(
                    icon: const Icon(Icons.skip_previous_rounded, color: Colors.white, size: 22),
                    onPressed: _currentSegment > 0 ? () => _audio.skipPrevious() : null,
                  ),
                  // Play/Pause
                  GestureDetector(
                    onTap: () {
                      if (_playbackState == PlaybackState.playing) {
                        _audio.pause();
                      } else {
                        _audio.play();
                      }
                    },
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        _playbackState == PlaybackState.playing
                            ? Icons.pause_rounded
                            : Icons.play_arrow_rounded,
                        color: artifact.color,
                        size: 32,
                      ),
                    ),
                  ),
                  // Stop
                  IconButton(
                    icon: const Icon(Icons.stop_rounded, color: Colors.white, size: 20),
                    onPressed: _audio.stop,
                  ),
                  // Next
                  IconButton(
                    icon: const Icon(Icons.skip_next_rounded, color: Colors.white, size: 22),
                    onPressed: _currentSegment < segments.length - 1
                        ? () => _audio.skipNext()
                        : null,
                  ),
                  const SizedBox(width: 8),
                  // Progress
                  Expanded(
                    child: Column(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: LinearProgressIndicator(
                            value: segments.isEmpty
                                ? 0
                                : (_currentSegment + 1) / segments.length,
                            backgroundColor: Colors.white.withValues(alpha: 0.2),
                            valueColor: const AlwaysStoppedAnimation(Colors.white),
                            minHeight: 4,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_currentSegment + 1} / ${segments.length}',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 10,
                            color: Colors.white.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        // Script segments
        ...segments.asMap().entries.map<Widget>((entry) {
          final i = entry.key;
          final raw = entry.value;
          final s = Map<String, dynamic>.from(raw as Map);
          final isHost1 = s['speaker'] == 'host1';
          final speaker = isHost1 ? 'أحمد' : 'فاطمة';
          final emotion = s['emotion'] as String? ?? 'neutral';
          final emotionEmoji = switch (emotion) {
            'enthusiastic' => '😊',
            'serious' => '😌',
            'curious' => '🤔',
            _ => '💬',
          };
          final isCurrent = i == _currentSegment && _playbackState == PlaybackState.playing;

          return GestureDetector(
            onTap: () => _audio.skipToSegment(i),
            child: Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isCurrent
                    ? artifact.color.withValues(alpha: 0.15)
                    : isHost1
                        ? artifact.color.withValues(alpha: 0.08)
                        : cs.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
                border: Border(
                  right: BorderSide(
                    color: isHost1 ? artifact.color : cs.outlineVariant,
                    width: 3,
                  ),
                ),
                boxShadow: isCurrent
                    ? [
                        BoxShadow(
                          color: artifact.color.withValues(alpha: 0.3),
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ]
                    : null,
              ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: isHost1 ? artifact.color : cs.tertiary,
                      child: Text(
                        isHost1 ? 'أ' : 'ف',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '$speaker $emotionEmoji',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: isHost1 ? artifact.color : cs.tertiary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                RichTextWithCitations(
                  text: s['text'] as String? ?? '',
                  sources: artifact.sources,
                  baseStyle: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 12,
                    height: 1.7,
                    color: cs.onSurface,
                  ),
                  boldStyle: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                  cs: cs,
                ),
              ],
            ),
          ),
          );
        }),
      ],
    );
  }

  Widget _buildSourcesSection(ColorScheme cs, StudioArtifact artifact) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.source_rounded, size: 16, color: cs.primary),
              const SizedBox(width: 6),
              Text(
                'المصادر (${artifact.sources.length})',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: cs.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...artifact.sources.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: s.color,
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Center(
                        child: Text(
                          '${s.id}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        s.summary,
                        style: TextStyle(
                          fontFamily: 'Tajawal',
                          fontSize: 11,
                          color: cs.onSurfaceVariant,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
