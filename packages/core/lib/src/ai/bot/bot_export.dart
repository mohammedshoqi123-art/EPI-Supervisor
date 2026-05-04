/// Bot Export — تصدير وحدات البوت
/// نتجنب التعارض مع الفئات الموجودة في epi_nlp_engine و child_context_manager
library bot_export;

export 'vaccine_model.dart' hide QuickReply;
export 'vaccination_service.dart';
// smart_nlp.dart يحتوي IntentResult الذي يتعارض مع epi_nlp_engine.dart
// نصدر فقط ما نحتاجه
export 'smart_nlp.dart' hide IntentResult;
export 'context_manager.dart' hide ChildProfile, ConversationTurn, ConversationPhase;
export 'knowledge_base.dart';
export 'real_data_kb.dart';
export 'advanced_immunization_kb.dart';
export 'intermediate_management_kb.dart';
export 'analytics_engine.dart';
export 'deep_analytics_engine.dart';
export 'analytics_kb.dart';
export 'bot_llm_service.dart';
export 'bot_engine.dart';
