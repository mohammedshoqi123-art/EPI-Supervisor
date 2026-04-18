import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// ═══════════════════════════════════════════════════════════════════
///  إدارة نماذج الذكاء الاصطناعي — AI Models Management
/// ═══════════════════════════════════════════════════════════════════

class AiModelsScreen extends ConsumerStatefulWidget {
  const AiModelsScreen({super.key});

  @override
  ConsumerState<AiModelsScreen> createState() => _AiModelsScreenState();
}

class _AiModelsScreenState extends ConsumerState<AiModelsScreen> {
  List<Map<String, dynamic>> _models = [];
  List<Map<String, dynamic>> _recentUsage = [];
  Map<String, dynamic>? _currentConfig;
  Map<String, dynamic> _availableKeys = {};
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final client = Supabase.instance.client;

      // Load models from ai_models table
      final modelsResp = await client
          .from('ai_models')
          .select('*')
          .order('priority', ascending: true);

      // Load recent usage
      final usageResp = await client
          .from('ai_model_usage')
          .select('model_id, success, latency_ms, created_at')
          .order('created_at', ascending: false)
          .limit(30);

      // Load settings
      final settingsResp = await client
          .from('app_settings')
          .select('key, value')
          .inFilter('key', [
            'ai_enabled',
            'ai_default_model',
            'ai_fallback_enabled',
            'ai_stream_enabled',
            'ai_max_history',
            'ai_rate_limit',
          ]);

      // Also get model status via Edge Function
      Map<String, dynamic>? statusResp;
      try {
        final resp = await client.functions.invoke(
          'ai-chat-v3',
          body: {'mode': 'model_status'},
        );
        if (resp.status == 200) {
          statusResp = Map<String, dynamic>.from(resp.data);
        }
      } catch (_) {}

      if (!mounted) return;
      setState(() {
        _models = List<Map<String, dynamic>>.from(modelsResp);
        _recentUsage = List<Map<String, dynamic>>.from(usageResp);
        _currentConfig = _parseSettings(
          List<Map<String, dynamic>>.from(settingsResp),
        );
        if (statusResp != null) {
          _availableKeys = Map<String, dynamic>.from(
            statusResp['availableKeys'] ?? {},
          );
        }
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'فشل تحميل البيانات: $e';
        _loading = false;
      });
    }
  }

  Map<String, dynamic> _parseSettings(List<Map<String, dynamic>> settings) {
    final map = <String, dynamic>{};
    for (final s in settings) {
      map[s['key']] = s['value'];
    }
    return map;
  }

  Future<void> _setDefaultModel(String modelId) async {
    HapticFeedback.mediumImpact();
    try {
      final client = Supabase.instance.client;

      // Clear all defaults
      await client
          .from('ai_models')
          .update({
            'is_default': false,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .neq('id', '');

      // Set new default
      await client
          .from('ai_models')
          .update({
            'is_default': true,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', modelId);

      // Update app_settings too
      await client.from('app_settings').upsert({
        'key': 'ai_default_model',
        'value': '"$modelId"',
      });

      await _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تم تغيير النموذج الافتراضي ✅',
              style: TextStyle(fontFamily: 'Tajawal'),
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _toggleModel(String modelId, bool isActive) async {
    HapticFeedback.lightImpact();
    try {
      await Supabase.instance.client
          .from('ai_models')
          .update({
            'is_active': isActive,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', modelId);

      await _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _updateSetting(String key, dynamic value) async {
    try {
      await Supabase.instance.client.from('app_settings').upsert({
        'key': key,
        'value': value,
      });
      await _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('خطأ: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'إدارة النماذج الذكية',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _loadData,
            tooltip: 'تحديث',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError(cs)
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildStatusCard(cs),
                    const SizedBox(height: 16),
                    _buildGlobalSettings(cs),
                    const SizedBox(height: 16),
                    _buildModelsList(cs),
                    const SizedBox(height: 16),
                    _buildUsageStats(cs),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildError(ColorScheme cs) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline_rounded, size: 48, color: cs.error),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'Tajawal', color: cs.error),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STATUS CARD
  // ═══════════════════════════════════════════════════════════

  Widget _buildStatusCard(ColorScheme cs) {
    final enabledModels = _models.where((m) => m['is_active'] == true).length;
    final defaultModel = _models
        .where((m) => m['is_default'] == true)
        .firstOrNull;
    final totalUsage = _models.fold<int>(
      0,
      (sum, m) => sum + ((m['usage_count'] as int?) ?? 0),
    );

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.primary, cs.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: cs.primary.withOpacity(0.2),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cs.onPrimary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  Icons.auto_awesome_rounded,
                  color: cs.onPrimary,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'حالة النظام الذكي',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: cs.onPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$enabledModels نموذج نشط • $totalUsage استخدام',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 12,
                        color: cs.onPrimary.withOpacity(0.8),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (defaultModel != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: cs.onPrimary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle_rounded,
                    color: cs.onPrimary,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'الافتراضي: ${defaultModel['name_ar']}',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: cs.onPrimary,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          // API Keys status
          Row(
            children: [
              _buildKeyChip('Groq', _availableKeys['groq'] == true, cs),
              const SizedBox(width: 8),
              _buildKeyChip('MiMo', _availableKeys['mimo'] == true, cs),
              const SizedBox(width: 8),
              _buildKeyChip('HF', _availableKeys['huggingface'] == true, cs),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildKeyChip(String label, bool available, ColorScheme cs) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: available
            ? Colors.green.withOpacity(0.2)
            : cs.onPrimary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: available
              ? Colors.green.withOpacity(0.4)
              : cs.onPrimary.withOpacity(0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            available ? Icons.check_circle_rounded : Icons.cancel_rounded,
            size: 12,
            color: available
                ? Colors.greenAccent
                : cs.onPrimary.withOpacity(0.5),
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              color: cs.onPrimary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GLOBAL SETTINGS
  // ═══════════════════════════════════════════════════════════

  Widget _buildGlobalSettings(ColorScheme cs) {
    final enabled = _currentConfig?['ai_enabled'] == true;
    final fallback = _currentConfig?['ai_fallback_enabled'] == true;
    final streaming = _currentConfig?['ai_stream_enabled'] == true;

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.tune_rounded, color: cs.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'إعدادات عامة',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          _buildSwitchTile(
            icon: Icons.power_settings_new_rounded,
            title: 'تفعيل المساعد الذكي',
            subtitle: 'تشغيل/إيقاف خدمة AI بالكامل',
            value: enabled,
            onChanged: (v) => _updateSetting('ai_enabled', v),
            cs: cs,
          ),
          _buildSwitchTile(
            icon: Icons.swap_horiz_rounded,
            title: 'التراجع التلقائي',
            subtitle: 'تبديل النموذج تلقائياً عند الفشل',
            value: fallback,
            onChanged: (v) => _updateSetting('ai_fallback_enabled', v),
            cs: cs,
          ),
          _buildSwitchTile(
            icon: Icons.stream_rounded,
            title: 'الكتابة التدريجية',
            subtitle: 'عرض النص كلمة بكلمة أثناء التوليد',
            value: streaming,
            onChanged: (v) => _updateSetting('ai_stream_enabled', v),
            cs: cs,
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
    required ColorScheme cs,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          Icon(icon, color: cs.onSurfaceVariant, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontFamily: 'Tajawal', fontSize: 14),
                ),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontFamily: 'Tajawal',
                    fontSize: 11,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Switch(value: value, activeColor: cs.primary, onChanged: onChanged),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MODELS LIST
  // ═══════════════════════════════════════════════════════════

  Widget _buildModelsList(ColorScheme cs) {
    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(Icons.psychology_rounded, color: cs.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                  'النماذج المتاحة',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          ..._models.map((model) => _buildModelTile(model, cs)),
        ],
      ),
    );
  }

  Widget _buildModelTile(Map<String, dynamic> model, ColorScheme cs) {
    final isDefault = model['is_default'] == true;
    final isActive = model['is_active'] == true;
    final provider = model['provider'] as String? ?? '';
    final usageCount = (model['usage_count'] as int?) ?? 0;

    IconData providerIcon;
    Color providerColor;
    switch (provider) {
      case 'groq':
        providerIcon = Icons.bolt_rounded;
        providerColor = const Color(0xFFFF6D00);
        break;
      case 'mimo':
        providerIcon = Icons.smart_toy_rounded;
        providerColor = const Color(0xFF2196F3);
        break;
      case 'gemini':
        providerIcon = Icons.auto_awesome_rounded;
        providerColor = const Color(0xFF4CAF50);
        break;
      case 'huggingface':
        providerIcon = Icons.face_rounded;
        providerColor = const Color(0xFFFFD600);
        break;
      case 'local':
        providerIcon = Icons.phone_android_rounded;
        providerColor = const Color(0xFF9E9E9E);
        break;
      default:
        providerIcon = Icons.circle_rounded;
        providerColor = cs.outline;
    }

    return InkWell(
      onTap: () => _showModelDetails(model),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isDefault ? cs.primaryContainer.withOpacity(0.15) : null,
          border: Border(
            bottom: BorderSide(color: cs.outlineVariant.withOpacity(0.3)),
          ),
        ),
        child: Row(
          children: [
            // Provider icon
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: providerColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: isDefault
                    ? Border.all(color: providerColor, width: 2)
                    : null,
              ),
              child: Icon(providerIcon, color: providerColor, size: 22),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          model['name_ar'] ?? '',
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 14,
                            fontWeight: isDefault
                                ? FontWeight.w700
                                : FontWeight.w500,
                            color: isActive
                                ? cs.onSurface
                                : cs.onSurfaceVariant,
                          ),
                        ),
                      ),
                      if (isDefault)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: cs.primary,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'افتراضي',
                            style: TextStyle(
                              fontFamily: 'Tajawal',
                              fontSize: 10,
                              color: cs.onPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(
                    model['model_id'] ?? '',
                    style: TextStyle(
                      fontFamily: 'Tajawal',
                      fontSize: 11,
                      color: cs.onSurfaceVariant,
                    ),
                  ),
                  if (usageCount > 0)
                    Text(
                      '$usageCount استخدام',
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 10,
                        color: cs.primary,
                      ),
                    ),
                ],
              ),
            ),
            // Actions
            if (!isDefault && isActive)
              IconButton(
                icon: Icon(
                  Icons.radio_button_unchecked_rounded,
                  color: cs.outline,
                  size: 22,
                ),
                onPressed: () => _setDefaultModel(model['id']),
                tooltip: 'تعيين كافتراضي',
              ),
            Switch(
              value: isActive,
              activeColor: cs.primary,
              onChanged: provider == 'local'
                  ? null // Local AI can't be disabled
                  : (v) => _toggleModel(model['id'], v),
            ),
          ],
        ),
      ),
    );
  }

  void _showModelDetails(Map<String, dynamic> model) {
    final cs = Theme.of(context).colorScheme;
    final caps = (model['capabilities'] as List?)?.cast<String>() ?? [];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        margin: const EdgeInsets.all(16),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    model['name_ar'] ?? '',
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            Text(
              model['name'] ?? '',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                color: cs.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            _detailRow('المعرّف', model['id'] ?? '', cs),
            _detailRow('المزود', model['provider'] ?? '', cs),
            _detailRow('نموذج المزود', model['model_id'] ?? '', cs),
            _detailRow('أقصى توكن', '${model['max_tokens'] ?? 0}', cs),
            _detailRow('درجة الحرارة', '${model['temperature'] ?? 0}', cs),
            _detailRow('الأولوية', '${model['priority'] ?? 0}', cs),
            _detailRow('الاستخدامات', '${model['usage_count'] ?? 0}', cs),
            if (model['description_ar'] != null) ...[
              const SizedBox(height: 8),
              Text(
                'الوصف:',
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurfaceVariant,
                ),
              ),
              Text(
                model['description_ar'],
                style: const TextStyle(fontFamily: 'Tajawal', fontSize: 13),
              ),
            ],
            if (caps.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                'القدرات:',
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: caps
                    .map(
                      (c) => Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: cs.primaryContainer,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          c,
                          style: TextStyle(
                            fontFamily: 'Tajawal',
                            fontSize: 11,
                            color: cs.onPrimaryContainer,
                          ),
                        ),
                      ),
                    )
                    .toList(),
              ),
            ],
            const SizedBox(height: 16),
            if (model['is_active'] == true && model['is_default'] != true)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    _setDefaultModel(model['id']);
                    Navigator.pop(ctx);
                  },
                  icon: const Icon(Icons.check_rounded),
                  label: const Text(
                    'تعيين كافتراضي',
                    style: TextStyle(fontFamily: 'Tajawal'),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value, ColorScheme cs) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 12,
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // USAGE STATS
  // ═══════════════════════════════════════════════════════════

  Widget _buildUsageStats(ColorScheme cs) {
    if (_recentUsage.isEmpty) return const SizedBox.shrink();

    final successCount = _recentUsage.where((u) => u['success'] == true).length;
    final failCount = _recentUsage.length - successCount;
    final avgLatency = _recentUsage
        .where((u) => u['latency_ms'] != null)
        .map((u) => u['latency_ms'] as int)
        .fold<int>(0, (a, b) => a + b);
    final avgLat = _recentUsage.isNotEmpty
        ? (avgLatency / _recentUsage.length).toStringAsFixed(0)
        : '0';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bar_chart_rounded, color: cs.primary, size: 20),
              const SizedBox(width: 8),
              Text(
                'آخر ${_recentUsage.length} طلبات',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: cs.onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _statChip('✅ نجح', '$successCount', Colors.green, cs),
              const SizedBox(width: 8),
              _statChip('❌ فشل', '$failCount', Colors.red, cs),
              const SizedBox(width: 8),
              _statChip('⏱ متوسط', '${avgLat}ms', cs.primary, cs),
            ],
          ),
        ],
      ),
    );
  }

  Widget _statChip(String label, String value, Color color, ColorScheme cs) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
