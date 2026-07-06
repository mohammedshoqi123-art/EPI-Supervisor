import 'package:flutter/material.dart';
import 'ai_chat_models.dart';

/// ═══════════════════════════════════════════════════════════
///  AI Provider Metadata Badge
///
///  Innovation: Visualize which AI provider won the parallel race,
///  its confidence score, latency, and whether tools were used.
///  This gives users transparency into the AI's "thinking" process.
/// ═══════════════════════════════════════════════════════════

class AiProviderBadge extends StatelessWidget {
  final ChatMsg msg;
  final ColorScheme cs;
  final bool compact;

  const AiProviderBadge({
    super.key,
    required this.msg,
    required this.cs,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (msg.isUser || msg.source == 'error' || msg.source == 'offline') {
      return const SizedBox.shrink();
    }

    final info = msg.providerInfo;
    final providerColor = Color(info.color);

    if (compact) {
      return _buildCompact(providerColor, info);
    }
    return _buildFull(providerColor, info);
  }

  /// Compact badge — single line, used under each bubble
  Widget _buildCompact(Color providerColor, ({String label, String emoji, int color}) info) {
    return Padding(
      padding: const EdgeInsets.only(top: 4, right: 8),
      child: Wrap(
        spacing: 6,
        runSpacing: 4,
        crossAxisAlignment: WrapCrossAlignment.center,
        children: [
          // Provider chip
          _providerChip(providerColor, info),
          // Latency
          if (msg.latencyMs != null) _latencyChip(),
          // Confidence indicator
          if (msg.providerConfidence != null) _confidenceChip(),
          // Race winner indicator
          if (msg.didRace) _raceWinnerChip(),
          // Tools used count
          if (msg.toolsUsed != null && msg.toolsUsed!.isNotEmpty)
            _toolsChip(),
        ],
      ),
    );
  }

  /// Full badge — expanded card, used in message inspection
  Widget _buildFull(Color providerColor, ({String label, String emoji, int color}) info) {
    return Container(
      margin: const EdgeInsets.only(top: 6, right: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: providerColor.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: providerColor.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(info.emoji, style: const TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                info.label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: providerColor,
                ),
              ),
              const Spacer(),
              if (msg.didRace)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    '🏁 RACE WINNER',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: Colors.amber,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 10,
            runSpacing: 4,
            children: [
              if (msg.latencyMs != null)
                _metricItem('⏱️', msg.latencyLabel, cs.onSurfaceVariant),
              if (msg.providerConfidence != null)
                _metricItem(
                  '🎯',
                  '${msg.providerConfidence}%',
                  _confidenceColor(msg.providerConfidence!),
                ),
              if (msg.attemptedProviders != null &&
                  msg.attemptedProviders!.length > 1)
                _metricItem(
                  '🆚',
                  '${msg.attemptedProviders!.length} مزود',
                  cs.onSurfaceVariant,
                ),
            ],
          ),
          // Confidence progress bar
          if (msg.providerConfidence != null) ...[
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: (msg.providerConfidence!) / 100,
                backgroundColor: cs.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation(
                  _confidenceColor(msg.providerConfidence!),
                ),
                minHeight: 4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _providerChip(Color color, ({String label, String emoji, int color}) info) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(info.emoji, style: const TextStyle(fontSize: 10)),
          const SizedBox(width: 4),
          Text(
            info.label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _latencyChip() {
    final ms = msg.latencyMs!;
    final isFast = ms < 2000;
    final isSlow = ms > 8000;
    final color = isFast ? Colors.green : (isSlow ? Colors.red : Colors.orange);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isFast ? Icons.bolt_rounded : (isSlow ? Icons.slow_motion_video : Icons.schedule),
            size: 10,
            color: color,
          ),
          const SizedBox(width: 3),
          Text(
            msg.latencyLabel,
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _confidenceChip() {
    final conf = msg.providerConfidence!;
    final color = _confidenceColor(conf);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            conf >= 80 ? Icons.verified_rounded : (conf < 50 ? Icons.warning_rounded : Icons.help_outline),
            size: 10,
            color: color,
          ),
          const SizedBox(width: 3),
          Text(
            '$conf%',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _raceWinnerChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('🏁', style: TextStyle(fontSize: 10)),
          SizedBox(width: 3),
          Text(
            'سباق',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Colors.amber,
            ),
          ),
        ],
      ),
    );
  }

  Widget _toolsChip() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.build_circle_rounded, size: 10, color: cs.primary),
          const SizedBox(width: 3),
          Text(
            '${msg.toolsUsed!.length} أداة',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: cs.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricItem(String emoji, String value, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 11)),
        const SizedBox(width: 4),
        Text(
          value,
          style: TextStyle(
            fontFamily: 'Tajawal',
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: color,
          ),
        ),
      ],
    );
  }

  Color _confidenceColor(int conf) {
    if (conf >= 80) return const Color(0xFF22C55E);
    if (conf >= 60) return const Color(0xFFF59E0B);
    if (conf >= 40) return const Color(0xFFEF4444);
    return const Color(0xFFDC2626);
  }
}

/// ═══════════════════════════════════════════════════════════
///  Low Confidence Warning Banner
///  Shows when AI response is low-confidence — user should verify
/// ═══════════════════════════════════════════════════════════

class LowConfidenceBanner extends StatelessWidget {
  final ChatMsg msg;
  final ColorScheme cs;

  const LowConfidenceBanner({super.key, required this.msg, required this.cs});

  @override
  Widget build(BuildContext context) {
    if (!msg.isLowConfidence) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 6, right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.orange.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, size: 14, color: Colors.orange.shade700),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'رد منخفض الثقة (${msg.providerConfidence}%) — يُفضّل التحقق من البيانات',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: Colors.orange.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
///  Gateway Status Indicator (Top of chat screen)
///  Shows real-time AI gateway health
/// ═══════════════════════════════════════════════════════════

class GatewayStatusIndicator extends StatelessWidget {
  final ColorScheme cs;
  final int healthyProviders;
  final int totalProviders;
  final List<String> blockedProviders;

  const GatewayStatusIndicator({
    super.key,
    required this.cs,
    required this.healthyProviders,
    required this.totalProviders,
    this.blockedProviders = const [],
  });

  @override
  Widget build(BuildContext context) {
    final isHealthy = healthyProviders >= 2;
    final isDegraded = healthyProviders == 1;
    final color = isHealthy ? Colors.green : (isDegraded ? Colors.orange : Colors.red);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Pulsing dot
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.5, end: 1.0),
            duration: const Duration(milliseconds: 1200),
            builder: (context, value, child) => Opacity(opacity: value, child: child),
            child: Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            isHealthy
                ? '$healthyProviders مزود AI نشط'
                : isDegraded
                    ? 'أداء مخفّض — مزود واحد نشط'
                    : '⚠️ جميع المزودات معطّلة',
            style: TextStyle(
              fontFamily: 'Tajawal',
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
          if (blockedProviders.isNotEmpty) ...[
            const SizedBox(width: 6),
            Text(
              '(${blockedProviders.length} محظور)',
              style: TextStyle(
                fontFamily: 'Tajawal',
                fontSize: 10,
                color: cs.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
