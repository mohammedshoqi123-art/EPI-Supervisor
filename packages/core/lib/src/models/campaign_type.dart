/// Campaign/activity types supported by EPI Supervisor.
/// ═══ Now supports dynamic visibility from Supabase campaign_types table ═══
enum CampaignType {
  polioCampaign('polio_campaign', 'حملة شلل الأطفال', '🧬'),
  integratedActivity('integrated_activity', 'النشاط الإيصالي التكاملي', '📋'),
  measlesCampaign('measles_campaign', 'حملة الحصبة', '🦠');

  final String value;
  final String labelAr;
  final String emoji;

  const CampaignType(this.value, this.labelAr, this.emoji);

  static CampaignType fromString(String value) {
    return CampaignType.values.firstWhere(
      (c) => c.value == value,
      orElse: () => CampaignType.polioCampaign,
    );
  }

  /// Returns a display string with emoji.
  String get displayLabel => '$emoji $labelAr';

  /// ═══ Visibility cache — loaded from Supabase campaign_types table ═══
  static final Map<String, bool> _visibilityCache = {};

  /// Check if this campaign type is visible (defaults to true if not yet loaded)
  bool get isVisible => _visibilityCache[value] ?? true;

  /// Load visibility from Supabase campaign_types table
  /// Call this at app startup or when admin changes visibility
  static Future<void> loadVisibility(Map<String, bool> visibilityMap) async {
    _visibilityCache.clear();
    _visibilityCache.addAll(visibilityMap);
  }

  /// Get only visible campaign types
  static List<CampaignType> get visibleValues =>
      values.where((c) => c.isVisible).toList();
}
