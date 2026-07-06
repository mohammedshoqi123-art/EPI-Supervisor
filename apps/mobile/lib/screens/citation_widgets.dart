import 'package:flutter/material.dart';
import 'ai_chat_models.dart';

/// ═══════════════════════════════════════════════════════════
///  Citation Chip — NotebookLM-Style Inline Reference
///
///  Renders [1], [2], [3] as tappable chips inside the AI response.
///  Tapping opens a bottom sheet showing the actual source data.
/// ═══════════════════════════════════════════════════════════

class GroundingSource {
  final int id;
  final String type;          // 'db_row' | 'aggregate' | 'knowledge_chunk'
  final String summary;
  final String? quote;
  final Map<String, dynamic>? metadata;

  GroundingSource({
    required this.id,
    required this.type,
    required this.summary,
    this.quote,
    this.metadata,
  });

  factory GroundingSource.fromJson(Map<String, dynamic> j) => GroundingSource(
    id: j['id'] as int,
    type: j['type'] as String? ?? 'unknown',
    summary: j['summary'] as String? ?? '',
    quote: j['quote'] as String?,
    metadata: j['metadata'] as Map<String, dynamic>?,
  );

  IconData get icon => switch (type) {
    'db_row' => Icons.table_rows_rounded,
    'aggregate' => Icons.bar_chart_rounded,
    'knowledge_chunk' => Icons.menu_book_rounded,
    _ => Icons.source_rounded,
  };

  Color get color => switch (type) {
    'db_row' => const Color(0xFF3B82F6),       // blue
    'aggregate' => const Color(0xFF22C55E),     // green
    'knowledge_chunk' => const Color(0xFF8B5CF6), // purple
    _ => const Color(0xFF6B7280),
  };

  String get typeLabel => switch (type) {
    'db_row' => 'سجل قاعدة بيانات',
    'aggregate' => 'تجميع إحصائي',
    'knowledge_chunk' => 'قاعدة المعرفة',
    _ => 'مصدر',
  };
}

/// ═══════════════════════════════════════════════════════════
///  Parsed Rich Text with Inline Citations
///
///  Parses AI response containing [1], [2], etc. and renders them
///  as tappable citation chips inline with the text.
/// ═══════════════════════════════════════════════════════════

class RichTextWithCitations extends StatelessWidget {
  final String text;
  final List<GroundingSource> sources;
  final TextStyle baseStyle;
  final TextStyle boldStyle;
  final ColorScheme cs;
  final Color? textColor;

  const RichTextWithCitations({
    super.key,
    required this.text,
    required this.sources,
    required this.baseStyle,
    required this.boldStyle,
    required this.cs,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return SelectableText.rich(
      TextSpan(
        children: _parseTextWithCitations(text),
        style: baseStyle.copyWith(color: textColor ?? cs.onSurface),
      ),
      textDirection: TextDirection.rtl,
    );
  }

  List<InlineSpan> _parseTextWithCitations(String input) {
    final spans = <InlineSpan>[];
    final citationRegex = RegExp(r'\[(\d+)\]');
    int start = 0;

    for (final match in citationRegex.allMatches(input)) {
      // Add text before citation
      if (match.start > start) {
        final textBefore = input.substring(start, match.start);
        spans.addAll(_parseMarkdownInline(textBefore));
      }

      // Find the citation source
      final citationNum = int.parse(match.group(1)!);
      final source = sources.where((s) => s.id == citationNum).firstOrNull;

      if (source != null) {
        spans.add(WidgetSpan(
          alignment: PlaceholderAlignment.middle,
          child: CitationChip(
            number: citationNum,
            source: source,
            cs: cs,
          ),
        ));
      } else {
        // Invalid citation — render as plain text
        spans.add(TextSpan(text: match.group(0)));
      }

      start = match.end;
    }

    // Add remaining text
    if (start < input.length) {
      spans.addAll(_parseMarkdownInline(input.substring(start)));
    }

    return spans;
  }

  List<InlineSpan> _parseMarkdownInline(String text) {
    final spans = <InlineSpan>[];
    final exp = RegExp(r'(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`)');
    int start = 0;

    for (final match in exp.allMatches(text)) {
      if (match.start > start) {
        spans.add(TextSpan(text: text.substring(start, match.start)));
      }
      final matched = match.group(0)!;
      if (matched.startsWith('**') && matched.endsWith('**')) {
        spans.add(TextSpan(
          text: matched.substring(2, matched.length - 2),
          style: boldStyle,
        ));
      } else if (matched.startsWith('_') && matched.endsWith('_')) {
        spans.add(TextSpan(
          text: matched.substring(1, matched.length - 1),
          style: baseStyle.copyWith(fontStyle: FontStyle.italic),
        ));
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        spans.add(TextSpan(
          text: matched.substring(1, matched.length - 1),
          style: baseStyle.copyWith(
            fontFamily: 'monospace',
            backgroundColor: cs.primary.withValues(alpha: 0.08),
            color: cs.primary,
          ),
        ));
      }
      start = match.end;
    }
    if (start < text.length) {
      spans.add(TextSpan(text: text.substring(start)));
    }
    return spans;
  }
}

/// ═══════════════════════════════════════════════════════════
///  Citation Chip — the [1] tappable badge
/// ═══════════════════════════════════════════════════════════

class CitationChip extends StatelessWidget {
  final int number;
  final GroundingSource source;
  final ColorScheme cs;

  const CitationChip({
    super.key,
    required this.number,
    required this.source,
    required this.cs,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _showSourceDetails(context),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 1),
        padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
        decoration: BoxDecoration(
          color: source.color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(4),
          border: Border.all(color: source.color.withValues(alpha: 0.4), width: 0.8),
        ),
        child: Text(
          '$number',
          style: TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w700,
            color: source.color,
            fontFamily: 'Cairo',
          ),
        ),
      ),
    );
  }

  void _showSourceDetails(BuildContext context) {
    HapticFeedback.selectionClick();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => _SourceDetailSheet(source: source, cs: cs),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
///  Source Detail Sheet — shown when user taps a citation
/// ═══════════════════════════════════════════════════════════

class _SourceDetailSheet extends StatelessWidget {
  final GroundingSource source;
  final ColorScheme cs;

  const _SourceDetailSheet({required this.source, required this.cs});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: source.color.withValues(alpha: 0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: source.color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(source.icon, color: source.color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      source.typeLabel,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: source.color,
                      ),
                    ),
                    Text(
                      source.summary,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: source.color,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text(
                    '${source.id}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ),
            ],
          ),
          const Divider(height: 24),
          // Quote
          if (source.quote != null) ...[
            Row(
              children: [
                Icon(Icons.format_quote_rounded, size: 16, color: cs.onSurfaceVariant),
                const SizedBox(width: 6),
                Text(
                  'المحتوى الأصلي',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurfaceVariant,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: cs.surfaceContainerHigh,
                borderRadius: BorderRadius.circular(12),
                border: Border(
                  right: BorderSide(color: source.color, width: 3),
                ),
              ),
              child: SelectableText(
                source.quote!,
                style: TextStyle(
                  fontFamily: 'Tajawal',
                  fontSize: 12,
                  height: 1.7,
                  color: cs.onSurface,
                ),
                textDirection: TextDirection.rtl,
              ),
            ),
          ],
          // Metadata
          if (source.metadata != null && source.metadata!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                if (source.metadata!['governorate'] != null)
                  _metaChip('🗺️', source.metadata!['governorate'].toString()),
                if (source.metadata!['date'] != null)
                  _metaChip('📅', source.metadata!['date'].toString().split('T').first),
                if (source.metadata!['campaign_type'] != null)
                  _metaChip('💉', source.metadata!['campaign_type'].toString()),
                if (source.metadata!['source_doc'] != null)
                  _metaChip('📚', source.metadata!['source_doc'].toString()),
              ],
            ),
          ],
          const SizedBox(height: 16),
          // Close button
          SizedBox(
            width: double.infinity,
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              style: TextButton.styleFrom(
                backgroundColor: source.color.withValues(alpha: 0.1),
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'إغلاق',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: source.color,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaChip(String emoji, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: cs.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        '$emoji $text',
        style: TextStyle(
          fontFamily: 'Tajawal',
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: cs.onSurfaceVariant,
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
///  Grounding Sources Banner — "This response is grounded in N sources"
/// ═══════════════════════════════════════════════════════════

class GroundingBanner extends StatelessWidget {
  final int sourceCount;
  final List<GroundingSource> sources;
  final ColorScheme cs;

  const GroundingBanner({
    super.key,
    required this.sourceCount,
    required this.sources,
    required this.cs,
  });

  @override
  Widget build(BuildContext context) {
    if (sourceCount == 0) return const SizedBox.shrink();

    final dbCount = sources.where((s) => s.type == 'db_row').length;
    final aggCount = sources.where((s) => s.type == 'aggregate').length;
    final kbCount = sources.where((s) => s.type == 'knowledge_chunk').length;

    return Container(
      margin: const EdgeInsets.only(top: 8, right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: cs.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(Icons.verified_rounded, size: 14, color: cs.primary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'مستند إلى $sourceCount مصدر' + (sourceCount > 1 ? '/sources' : ''),
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: cs.primary,
              ),
            ),
          ),
          if (dbCount > 0) _countChip('سجلات', dbCount, const Color(0xFF3B82F6)),
          if (aggCount > 0) _countChip('إحصاءات', aggCount, const Color(0xFF22C55E)),
          if (kbCount > 0) _countChip('معرفة', kbCount, const Color(0xFF8B5CF6)),
        ],
      ),
    );
  }

  Widget _countChip(String label, int count, Color color) {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$count $label',
        style: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 9,
          fontWeight: FontWeight.w700,
          color: color,
        ),
      ),
    );
  }
}

/// ═══════════════════════════════════════════════════════════
///  Suggested Follow-ups — tappable question chips
/// ═══════════════════════════════════════════════════════════

class SuggestedFollowups extends StatelessWidget {
  final List<String> followups;
  final ColorScheme cs;
  final void Function(String) onTap;

  const SuggestedFollowups({
    super.key,
    required this.followups,
    required this.cs,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    if (followups.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(top: 8, right: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.lightbulb_outline_rounded, size: 12, color: cs.tertiary),
              const SizedBox(width: 4),
              Text(
                'أسئلة مقترحة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: cs.tertiary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: followups.map((q) => GestureDetector(
              onTap: () => onTap(q),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: cs.tertiary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: cs.tertiary.withValues(alpha: 0.25)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.add_rounded, size: 12, color: cs.tertiary),
                    const SizedBox(width: 4),
                    Text(
                      q,
                      style: TextStyle(
                        fontFamily: 'Tajawal',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: cs.tertiary,
                      ),
                    ),
                  ],
                ),
              ),
            )).toList(),
          ),
        ],
      ),
    );
  }
}
