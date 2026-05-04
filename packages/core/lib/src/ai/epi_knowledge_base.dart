/// EPI Knowledge Base — Comprehensive Yemen EPI knowledge for the Supervisor system
/// Ported and enhanced from EPI-Bot's multiple knowledge bases
/// Covers: Vaccines, schedules, supervision, management, campaigns, cold chain, AEFI

import 'epi_nlp_engine.dart';

class EpiKnowledgeBase {
  // ═══════════════════════════════════════════════════════════
  // VACCINATION SCHEDULE — Yemen National Schedule
  // ═══════════════════════════════════════════════════════════

  static const List<Map<String, dynamic>> vaccinationSchedule = [
    {
      'vaccine': 'BCG',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'السل (الدرن)',
      'route': 'عبر الجلد',
      'site': 'الذراع الأيمن',
      'dose': '0.05 مل',
    },
    {
      'vaccine': 'OPV-0',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'شلل الأطفال',
      'route': 'فموي',
      'site': 'الفم',
      'dose': '2 نقطة',
    },
    {
      'vaccine': 'HepB-0',
      'age': 'عند الولادة',
      'ageMonths': 0,
      'disease': 'التهاب الكبد B',
      'route': 'عضلي',
      'site': 'الفخذ الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'OPV-1 + Penta-1 + PCV-1 + Rota-1',
      'age': 'شهران',
      'ageMonths': 2,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + الروتا',
      'route': 'فموي + عضلي + عضلي + فموي',
      'site': 'الفم + الفخذ + الفخذ + الفم',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 1.5 مل',
    },
    {
      'vaccine': 'OPV-2 + Penta-2 + PCV-2 + Rota-2',
      'age': '4 أشهر',
      'ageMonths': 4,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + الروتا',
      'route': 'فموي + عضلي + عضلي + فموي',
      'site': 'الفم + الفخذ + الفخذ + الفم',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 1.5 مل',
    },
    {
      'vaccine': 'OPV-3 + Penta-3 + PCV-3 + IPV',
      'age': '6 أشهر',
      'ageMonths': 6,
      'disease': 'شلل الأطفال + الخماسي + الرئوي + شلل حقن',
      'route': 'فموي + عضلي + عضلي + عضلي',
      'site': 'الفم + الفخذ + الفخذ + الفخذ',
      'dose': '2 نقطة + 0.5 مل + 0.5 مل + 0.5 مل',
    },
    {
      'vaccine': 'MR-1',
      'age': '9 أشهر',
      'ageMonths': 9,
      'disease': 'الحصبة + الحصبة الألمانية',
      'route': 'تحت الجلد',
      'site': 'الذراع الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'MR-2',
      'age': '18 شهر',
      'ageMonths': 18,
      'disease': 'الحصبة + الحصبة الألمانية (جرعة تعزيزية)',
      'route': 'تحت الجلد',
      'site': 'الذراع الأيسر',
      'dose': '0.5 مل',
    },
    {
      'vaccine': 'Td',
      'age': '6 سنوات (الصف الأول)',
      'ageMonths': 72,
      'disease': 'الكزاز + الدفتيريا',
      'route': 'عضلي',
      'site': 'الذراع',
      'dose': '0.5 مل',
    },
  ];

  // ═══════════════════════════════════════════════════════════
  // VACCINE DETAILS
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> vaccineDetails = {
    'BCG': {
      'nameAr': 'لقاح السل',
      'type': 'حي مضعف',
      'disease': 'السل (الدرن)',
      'storage': '2-8 درجة مئوية',
      'reconstitution': 'مذيب SSG خاص',
      'openVial': 'لا يمكن إعادة استخدامة بعد فتحه',
      'sideEffects': 'تقرح موضعي طبيعي خلال 2-4 أسابيع',
      'contraindications': 'نقص المناعة، أقل من 2000 جرام',
    },
    'OPV': {
      'nameAr': 'لقاح شلل الأطفال الفموي',
      'type': 'حي مضعف',
      'disease': 'شلل الأطفال',
      'storage': '-20 درجة (طويل) أو 2-8 درجة (قصير)',
      'openVial': 'يمكن استخدامه في جلسة التطعيم',
      'sideEffects': 'VAPP نادر جداً (1 من 2.4 مليون)',
      'contraindications': 'نقص المناعة الشديد',
    },
    'Penta': {
      'nameAr': 'اللقاح الخماسي',
      'type': 'مقتول + توكسويد',
      'components': ['DPT', 'HepB', 'Hib'],
      'disease': 'الدفتيريا + السعال الديكي + الكزاز + الكبد B + المستدمية',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'حمى خفيفة، ألم موضعي',
      'contraindications': 'حساسية شديدة سابقة',
    },
    'PCV': {
      'nameAr': 'لقاح المكورات الرئوية',
      'type': 'مقترن',
      'disease': 'الالتهاب الرئوي + التهاب السحايا',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'حمى خفيفة، احمرار',
      'contraindications': 'حساسية سابقة للقاح',
    },
    'Rotavirus': {
      'nameAr': 'لقاح الروتا',
      'type': 'حي مضعف',
      'disease': 'إسهال الروتا',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يستخدم فوراً - لا يمكن حفظه',
      'sideEffects': 'إسهال خفيف، حمى',
      'contraindications': 'انفتال الأمعاء سابقاً، نقص المناعة',
      'maxAge': 'الجرعة الأولى قبل 15 أسبوع، الأخيرة قبل سنتين (24 شهر)',
    },
    'MR': {
      'nameAr': 'لقاح الحصبة والحصبة الألمانية',
      'type': 'حي مضعف',
      'disease': 'الحصبة + الحصبة الألمانية (روبيلا)',
      'storage': '2-8 درجة مئوية أو -20 درجة',
      'reconstitution': 'مذيب معقم',
      'openVial': 'يستخدم خلال 6 ساعات',
      'sideEffects': 'حمى بعد 5-12 يوم، طفح جلدي خفيف',
      'contraindications': 'نقص المناعة الشديد، حمل',
    },
    'IPV': {
      'nameAr': 'لقاح شلل الأطفال الحقن',
      'type': 'مقتول',
      'disease': 'شلل الأطفال',
      'storage': '2-8 درجة مئوية',
      'openVial': 'يمكن استخدامه خلال 6 ساعات',
      'sideEffects': 'ألم موضعي',
      'contraindications': 'حساسية للستريبتومايسين/البوليميكسين',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // EPI QUALITY INDICATORS
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> qualityIndicators = {
    'Penta1': {
      'nameAr': 'تغطية الجرعة الأولى الخماسي',
      'target': 90,
      'meaning': 'وصول الخدمة — نسبة الأطفال الذين تلقوا الجرعة الأولى',
      'calculation': '(عدد Penta1 / الفئة المستهدفة) × 100',
    },
    'Penta3': {
      'nameAr': 'تغطية الجرعة الثالثة الخماسي',
      'target': 90,
      'meaning': 'اكتمال التحصين — الأطفال الذين أكملوا الجرعات الثلاث',
      'calculation': '(عدد Penta3 / الفئة المستهدفة) × 100',
    },
    'Dropout': {
      'nameAr': 'معدل التسرب',
      'target': '< 10%',
      'meaning': 'نسبة الأطفال الذين بدأوا ولم يكملوا',
      'calculation': '((Penta1 - Penta3) / Penta1) × 100',
      'interpretation': {
        '<10%': 'ممتاز',
        '10-20%': 'متوسط - يحتاج متابعة',
        '>20%': 'ضعيف - يحتاج تدخل فوري',
      },
    },
    'BCG': {
      'nameAr': 'تغطية لقاح السل',
      'target': 90,
      'meaning': 'مؤشر الوصول عند الولادة',
      'calculation': '(عدد BCG / الولادات المتوقعة) × 100',
    },
    'MR1': {
      'nameAr': 'تغطية جرعة الحصبة الأولى',
      'target': 90,
      'meaning': 'مؤشر الحماية الجماعية من الحصبة',
      'calculation': '(عدد MR1 / الفئة المستهدفة) × 100',
    },
    'MR2': {
      'nameAr': 'تغطية جرعة الحصبة الثانية',
      'target': 95,
      'meaning': 'مؤشر اكتمال المناعة ضد الحصبة',
      'calculation': '(عدد MR2 / الفئة المستهدفة) × 100',
    },
    'DPT1_to_DPT3': {
      'nameAr': 'معدل الاحتفاظ',
      'target': '> 90%',
      'meaning': 'نسبة الأطفال الذين أكملوا السلسلة من الذين بدأوها',
      'calculation': '(Penta3 / Penta1) × 100',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // SUPERVISION CHECKLIST
  // ═══════════════════════════════════════════════════════════

  static const Map<String, List<Map<String, String>>> supervisionChecklist = {
    'سلسلة التبريد': [
      {'item': 'درجة حرارة الثلاجة', 'standard': '2-8 درجة مئوية', 'method': 'قراءة الثرمومتر مرتين يومياً'},
      {'item': 'ترتيب اللقاحات', 'standard': 'BCG و MR في الرف العلوي، البقية في الرف السفلي', 'method': 'فحص بصري'},
      {'item': 'حالة VVM', 'standard': 'جميع القوارير في المرحلة 1 أو 2', 'method': 'فحص كل قارورة'},
      {'item': 'سجل درجات الحرارة', 'standard': 'مسجل يومياً بدون انقطاع', 'method': 'مراجعة السجل'},
      {'item': 'الطوارئ', 'standard': 'خطة طوارئ مكتوبة ومعلنة', 'method': 'توثيق الخطة'},
    ],
    'جلسة التطعيم': [
      {'item': 'تاريخ انتهاء اللقاح', 'standard': 'جميع اللقاحات صالحة', 'method': 'فحص كل قارورة'},
      {'item': 'الأدوات المعقمة', 'standard': 'سرنجات AD أو عادية معقمة', 'method': 'فحص بصري'},
      {'item': 'طريقة الحقن', 'standard': 'الطريقة الصحيحة حسب اللقاح', 'method': 'ملاحظة مباشرة'},
      {'item': 'التخلص من النفايات', 'method': 'صناديق أمان مملوءة < 3/4', 'standard': 'فحص الصناديق'},
      {'item': 'مراقبة ما بعد التطعيم', 'standard': '30 دقيقة مراقبة بعد التطعيم', 'method': 'ملاحظة'},
    ],
    'التسجيل والبيانات': [
      {'item': 'سجل التطعيم', 'standard': 'مسجل بشكل كامل ودقيق', 'method': 'مراجعة عينات'},
      {'item': 'بطاقة التطعيم', 'standard': 'معطاة للأم ومحدثة', 'method': 'سؤال الأمهات'},
      {'item': 'التقرير الشهري', 'standard': 'مرسل في الوقت المحدد', 'method': 'مراجعة السجلات'},
      {'item': 'متابعة المتسربين', 'standard': 'قائمة محدثة ونشطة', 'method': 'مراجعة القائمة'},
    ],
    'التواصل المجتمعي': [
      {'item': 'التثقيف الصحي', 'standard': 'جلسات توعية منتظمة', 'method': 'سؤال الأمهات'},
      {'item': 'معالجة الرفض', 'standard': 'خطة محلية للتعامل مع الرفض', 'method': 'مراجعة الوثائق'},
      {'item': 'تنسيق مع المجتمع', 'standard': 'علاقة فعالة مع القيادات', 'method': 'مقابلة القيادات'},
    ],
  };

  // ═══════════════════════════════════════════════════════════
  // AEFI — Adverse Events Following Immunization
  // ═══════════════════════════════════════════════════════════

  static const Map<String, Map<String, dynamic>> aefiTypes = {
    'minor': {
      'nameAr': 'أعراض بسيطة (طبيعية)',
      'examples': ['حمى خفيفة (< 38°C)', 'ألم واحمرار مكان الحقن', 'تورم خفيف', 'بكاء الطفل'],
      'management': 'كمادات باردة، خافض حرارة (باراسيتامول)، طمأنة الأم',
      'urgency': 'عادي — لا يحتاج إبلاغ فوري',
    },
    'moderate': {
      'nameAr': 'أعراض متوسطة',
      'examples': ['حمى مرتفعة (> 39°C)', 'بكاء مستمر > 3 ساعات', 'تورم كبير > 5 سم', 'طفح جلدي'],
      'management': 'فحص طبي، باراسيتامول، مراقبة لمدة 24 ساعة',
      'urgency': 'يحتاج إبلاغ خلال 24 ساعة',
    },
    'severe': {
      'nameAr': 'أعراض شديدة',
      'examples': ['تشنجات', 'غيبوبة', 'صدمة تأقية', 'شلل', 'انفتال الأمعاء'],
      'management': 'إسعاف فوري → نقل للمستشفى → إبلاغ فوري',
      'urgency': 'إبلاغ فوري خلال ساعة!',
    },
  };

  // ═══════════════════════════════════════════════════════════
  // YEMEN GOVERNORATES — EPI related data
  // ═══════════════════════════════════════════════════════════

  static const List<String> governorates = [
    'أمانة العاصمة', 'عدن', 'تعز', 'الحديدة', 'إب', 'حضرموت',
    'المهرة', 'شبوة', 'حجة', 'صعدة', 'الجوف', 'مأرب',
    'الضالع', 'لحج', 'أبين', 'ريمة', 'صنعاء', 'ذمار',
    'البيضاء', 'عمران', 'المحويت', 'سقطرى',
  ];

  // ═══════════════════════════════════════════════════════════
  // TOPICS — Textual knowledge for consultations
  // ═══════════════════════════════════════════════════════════

  static const Map<String, String> _topics = {
    'تعريف التطعيم':
        '💉 ما هو التطعيم؟\n\n'
        'التطعيم طريقة بسيطة وآمنة وفعالة لحماية الأشخاص من الأمراض الخطيرة.\n\n'
        '🔬 كيف يعمل:\n'
        '• يستخدم وسائل الدفاع الطبيعية لجسمك\n'
        '• يبني مناعة ضد أمراض محددة\n'
        '• يقوي جهازك المناعي\n\n'
        '⚠️ اللقاحات تحتوي على أشكال ميتة أو ضعيفة من الجراثيم — لا تسبب المرض!',

    'آثار جانبية':
        '📋 الآثار الجانبية للتطعيمات:\n\n'
        '✅ طبيعية وتزول خلال 1-3 أيام:\n'
        '• ألم واحمرار مكان الحقن\n'
        '• حرارة خفيفة (أقل من 38.5°)\n'
        '• تورم بسيط مكان الحقن\n'
        '• بكاء أو نعاس\n\n'
        '⚠️ اطلب المساعدة الطبية إذا:\n'
        '• حرارة أكثر من 39° لا تنخفض\n'
        '• بكاء مستمر أكثر من 3 ساعات\n\n'
        '🚨 اطلب طبيب فوراً:\n'
        '• تشنجات أو صعوبة تنفس\n'
        '• تورم الوجه أو الحلق\n'
        '• طفح جلدي شديد\n'
        '⏰ انتظر 15-30 دقيقة بعد التطعيم في المركز',

    'آثار الخماسي':
        '5️⃣ آثار الخماسي الجانبية:\n\n'
        '✅ طبيعية (1-3 أيام):\n'
        '• ألم واحمرار مكان الحقن\n'
        '• حرارة خفيفة\n'
        '• تورم بسيط\n\n'
        '⚠️ نادر: بكاء غير معتاد\n'
        '🚨 نادر جداً: تشنجات (أقل من 1 لكل 100,000)',

    'آثار الحصبة':
        '🔴 آثار الحصبة الجانبية:\n\n'
        '✅ طبيعية (بعد 5-12 يوم):\n'
        '• حرارة (5-12 يوم بعد التطعيم — طبيعي!)\n'
        '• طفح جلدي خفيف\n'
        '• ألم مكان الحقن\n\n'
        '💡 الحرارة بعد MR بعد 5-12 يوم — هذا طبيعي ويدل على استجابة المناعة',

    'حالات الطوارئ':
        '🚨 متى تذهب للطبيب فوراً:\n\n'
        '• تشنجات أو نوبات\n'
        '• صعوبة في التنفس\n'
        '• تورم الوجه أو الحلق أو اللسان\n'
        '• طفح جلدي شديد أو شرى\n'
        '• شحوب شديد أو ضعف\n'
        '• حرارة عالية جداً (أكثر من 40°)\n'
        '• بكاء مستمر أكثر من 3 ساعات\n'
        '• فقدان الوعي\n\n'
        '⏰ انتظر 15-30 دقيقة بعد التطعيم في المركز الصحي',

    'هل أطعم وهو مريض':
        '🤒 هل أطعم طفلي وهو مريض؟\n\n'
        '✅ نعم في معظم الحالات:\n'
        '• زكام خفيف أو سعال\n'
        '• إسهال خفيف بدون جفاف\n'
        '• حرارة أقل من 38.5°\n\n'
        '⚠️ أجل التطعيم إذا:\n'
        '• حرارة عالية (أكثر من 38.5°)\n'
        '• مرض حاد شديد\n'
        '• يتناول أدوية كبت المناعة\n\n'
        '💡 سخونه خفيفه مو سبب لتأخير التطعيم!',

    'التطعيم والتوحد':
        '🚫 هل التطعيم يسبب التوحد؟\n\n'
        '❌ لا! هذا أسطورة مُدحضة تماماً\n\n'
        '📚 الأدلة العلمية:\n'
        '• دراسة 2019 على 650,000 طفل — لا علاقة\n'
        '• دراسة 2014 على 1.2 مليون طفل — لا علاقة\n'
        '• الدراسة الأصلية (Wakefield 1998) سُحبت بسبب تزوير\n'
        '• WHO, UNICEF, كل الأكاديميات الطبية تؤكد السلامة\n\n'
        '💡 التوحد يظهر في نفس الفترة الزمنية التي يبدأ فيها التطعيم — هذا صدفة وليس سببية',

    'التطعيم والعقم':
        '🚫 هل التطعيم يسبب العقم؟\n\n'
        '❌ لا! أسطورة بلا أساس علمي\n\n'
        '📚 الحقائق:\n'
        '• التطعيمات لا تحتوي على مواد مضرة للخصوبة\n'
        '• ملايين الأطفال المطعمين أنجبوا أطفالاً أصحاء\n'
        '• WHO تؤكد: لا علاقة بين التطعيم والعقم\n'
        '• التطعيمات تحمي الحوامل وأطفالهن',

    'هل التطعيم يضر':
        '❓ هل التطعيمات مضرة؟\n\n'
        '✅ التطعيمات آمنة جداً:\n'
        '• تمر بتجارب سريرية مكثفة\n'
        '• تراقبها WHO و UNICEF\n'
        '• ملايين الجرعات تُعطى سنوياً بأمان\n\n'
        '📊 مخاطر المرض أكبر بكثير من مخاطر التطعيم:\n'
        '• الحصبة: 1 من كل 500 يموت (بدون تطعيم)\n'
        '• الكزاز الوليدي: أكثر من 50% يموت\n'
        '• الآثار الجانبية للتطعيم: 99% خفيفة ومؤقتة',

    'أساطير':
        '📚 أساطير شائعة مُدحضة:\n\n'
        '❌ "التطعيم يسبب التوحد" → مُدحض علمياً\n'
        '❌ "التطعيم يسبب العقم" → بلا أساس\n'
        '❌ "التطعيمات تحتوي مواد ضارة" → غير صحيح\n'
        '❌ "الطبيعي أفضل من التطعيم" → خطر!\n'
        '❌ "التطعيم واحد يكفي" → الجرعات متعددة لسبب\n\n'
        '💡 المصادر الموثوقة: WHO, UNICEF, وزارة الصحة اليمنية',

    'مجاناً':
        '💰 هل التطعيم مجاني؟\n\n'
        '✅ نعم! جميع التطعيمات مجانية 100%\n\n'
        '• في المراكز الصحية الحكومية\n'
        '• خلال الحملات الوطنية\n'
        '• حتى في المناطق النائية\n\n'
        '🚫 أي شخص يطلب فلوس مقابل التطعيم → اشتكِ عليه!',

    'أماكن التطعيم':
        '📍 وين تطعم طفلك:\n\n'
        '• جميع المراكز الصحية الحكومية\n'
        '• الوحدات الصحية\n'
        '• خلال الحملات الوطنية (في المدارس والأسواق)\n\n'
        '✅ التطعيم مجاني في كل الأماكن\n'
        '💡 اسأل أقرب مركز صحي منك عن مواعيد التطعيم',

    'حملات التطعيم':
        '🚐 حملات التطعيم الوطنية:\n\n'
        '• حملات شلل الأطفال (OPV) — سنوياً\n'
        '• حملة MR (الحصبة) — حسب الحاجة\n'
        '• أيام التحصين الوطني (NIDs)\n\n'
        '📅 الحملات تعلن عبر الإعلام والمساجد\n'
        '✅ التطعيم مجاني خلال الحملات',

    'أنواع التطعيمات':
        '💉 أنواع اللقاحات:\n\n'
        '🔴 لقاحات حية مضعفة: BCG, OPV, MR, Rota\n'
        '🟡 لقاحات مقتولة: IPV, PCV\n'
        '🟢 لقاحات مركبة: الخماسي (DPT+HepB+Hib)\n\n'
        '💡 كل نوع له طريقة تخزين وإعطاء مختلفة',

    'كم جرعة':
        '🔢 عدد الجرعات:\n\n'
        '• BCG: جرعة واحدة عند الولادة\n'
        '• OPV: 6 جرعات (0, 6, 10, 14 أسبوع + 9 شهر + 18 شهر)\n'
        '• الخماسي: 4 جرعات (6, 10, 14 أسبوع + 18 شهر)\n'
        '• PCV: 3 جرعات (6, 10, 14 أسبوع)\n'
        '• Rota: 2 جرعتين (6, 10 أسابيع)\n'
        '• MR: جرعتان (9 أشهر + 18 شهر)\n'
        '• IPV: جرعتان (14 أسبوع + 9 أشهر)',

    'الإشراف الداعم':
        '🏥 الإشراف الداعم (Supportive Supervision):\n\n'
        '📌 ما هو؟ زيارات منظمة لدعم وتحسين أداء الفرق الصحية\n\n'
        '🎯 الأهداف:\n'
        '• تحسين جودة الخدمة\n'
        '• حل المشاكل الميدانية\n'
        '• بناء قدرات الكوادر\n'
        '• ضمان اتباع البروتوكولات\n\n'
        '📋 أدوات:\n'
        '• قوائم مراجعة (Checklists)\n'
        '• تغذية راجعة بناءة\n'
        '• تتبع التحسينات',

    'أمراض التحصين':
        '🦠 الأمراض التي تحمي منها التطعيمات:\n\n'
        '🔴 السل (BCG) — التهاب رئوي مزمن\n'
        '🟢 شلل الأطفال (OPV/IPV) — شلل دائم\n'
        '🟡 الخناق (DTP) — اختناق\n'
        '🟡 الكزاز (DTP) — تقلصات عضلية قاتلة\n'
        '🟡 السعال الديكي (DTP) — سعال شديد\n'
        '🔵 التهاب الكبد B (HepB) — فشل كبدي\n'
        '🟡 Hib (خماسي) — التهاب سحايا\n'
        '🔴 الحصبة (MR) — التهاب رئوي/دماغ\n'
        '🟣 المكورات الرئوية (PCV) — التهاب رئة\n'
        '🔵 الروتا — إسهال شديد',

    'سلسلة التبريد':
        '❄️ سلسلة التبريد:\n\n'
        '🔧 ما هي؟ نظام تخزين ونقل اللقاحات في درجة حرارة مناسبة\n\n'
        '📌 درجات الحرارة:\n'
        '• معظم اللقاحات: 2-8 درجة مئوية\n'
        '• لا تجمّد! التجميد يفسد اللقاح\n'
        '• لا تترك في الشمس أو الحرارة\n\n'
        '🌡️ VVM (مؤشر حرارة اللقاح):\n'
        '• مربع صغير على القارورة يغيّر لونه\n'
        '• إذا وصل اللون للداخل → اللقاح صالح\n'
        '• إذا تساوى اللونين → لا تستخدم!',

    'تطعيمات السفر':
        '✈️ تطعيمات السفر:\n\n'
        '📋 تطعيمات قد تُطلب عند السفر:\n'
        '• الحمى الصفراء (إفريقيا/أمريكا الجنوبية)\n'
        '• التهاب السحايا (الحج)\n'
        '• التيفويد (جنوب شرق آسيا)\n'
        '• التهاب كبدي أ (المنطقة الرمادية)\n\n'
        '💡 تأكد من متطلبات البلد قبل السفر بـ 4-6 أسابيع',

    'تاريخ التحصين في اليمن':
        '🇾🇪 تاريخ التحصين في اليمن:\n\n'
        '📅 بدأ برنامج التحصين عام 1978\n'
        '✅ إنجازات:\n'
        '• خلو اليمن من شلل الأطفال (2006)\n'
        '• تغطية BCG أكثر من 90%\n'
        '• توسيع البرنامج ليشمل Rota و PCV\n\n'
        '⚠️ التحديات:\n'
        '• المناطق النائية\n'
        '• النزاعات المسلحة\n'
        '• ضعف البنية التحتية',

    'فوائد التطعيم':
        '💪 فوائد التطعيم:\n\n'
        '🛡️ للطفل:\n'
        '• حماية من أمراض خطيرة\n'
        '• مناعة قوية\n'
        '• نمو صحي\n\n'
        '👨‍👩‍👧 للمجتمع:\n'
        '• مناعة جماعية\n'
        '• تقليل الأمراض\n'
        '• حماية الأضعف\n\n'
        '💰 اقتصادياً:\n'
        '• تقليل تكاليف العلاج\n'
        '• أطفال أصحاء = مستقبل أفضل',

    'التغذية والتطعيم':
        '🍼 التغذية والتطعيم:\n\n'
        '✅ التغذية الجيدة تقوي استجابة المناعة\n\n'
        '📌 نصائح:\n'
        '• الرضاعة الطبيعية حصرية 6 أشهر\n'
        '• لا تؤخر التطعيم بسبب سوء التغذية\n'
        '• فيتامين أ يقوي المناعة\n\n'
        '💡 الأطفال سوء التغذية يحتاجون التطعيم أكثر!',

    'للأطفال المبتسرين':
        '👶 تطعيم الأطفال المبتسرين (الخدّج):\n\n'
        '✅ نعم! المبتسرون يحتاجون التطعيم أكثر!\n\n'
        '📌 القواعد:\n'
        '• يعطون الجدول حسب العمر الزمني (وليس حسب تاريخ الولادة)\n'
        '• BCG: يُعطى حتى لو مبتسراً\n'
        '• OPV: يُعطى عند الولادة\n'
        '• الخماسي+PCV+Rota: تبدأ في عمر 6 أسابيع حسب العمر الزمني\n\n'
        '⚠️ قد يؤجل BCG إذا كان وزنه أقل من 2 كغ\n'
        '💡 المبتسرون أكثر عرضة للعدوى — لا تؤخر التطعيم!',

    'الحوامل':
        '👩 تطعيمات الحوامل:\n\n'
        '💉 Td (الكزاز والخناق):\n'
        '• 5 جرعات توفر حماية مدى الحياة\n'
        '• يحمي الأم والجنين من الكزاز الوليدي\n\n'
        '💡 التطعيم أثناء الحمل آمن:\n'
        '• Td آمن في أي وقت أثناء الحمل\n'
        '• يحمي الجنين عبر الأجسام المضادة\n\n'
        '⚠️ تجنّب تطعيمات الحية المضعفة أثناء الحمل',

    'الأطفال المصابين بالسكري':
        '💉 تطعيمات الأطفال المصابين بالسكري:\n\n'
        '✅ نعم! يحتاجون التطعيم أكثر من غيرهم!\n\n'
        '📌 نقاط مهمة:\n'
        '• كل التطعيمات الروتينية آمنة\n'
        '• يحتاجون تطعيم الإنفلونزا سنوياً\n'
        '• يحتاجون تطعيم الكبد أ (HepA)\n'
        '• لا تؤخر التطعيم بسبب السكري\n\n'
        '⚠️ استشر الطبيب إذا كان السكري غير مسيطر عليه',

    'الأطفال المصابين بالقلب':
        '💉 تطعيمات الأطفال المصابين بأمراض القلب:\n\n'
        '✅ كل التطعيمات الروتينية آمنة!\n\n'
        '📌 توصيات إضافية:\n'
        '• تطعيم الإنفلونزا سنوياً\n'
        '• تطعيم PCV (المكورات الرئوية) — مهم جداً\n'
        '• تطعيم pneumococcal إضافي حسب توصية الطبيب\n\n'
        '⚠️ إذا كان الطفل على أدوية قلب — استشر الطبيب',

    'تطعيم الأطفال المصابين بـ HIV':
        '💉 تطعيمات الأطفال المصابين بـ HIV:\n\n'
        '⚠️ مهم جداً — يحتاجون تقييم طبي دقيق\n\n'
        '📌 القواعد:\n'
        '• الأطفال على علاج ARV: يمكنهم أخذ التطعيمات الحية\n'
        '• الأطفال بدون علاج: يجب تقييم المناعة أولاً\n'
        '• OPV: قد يُستبدل بـ IPV\n'
        '• BCG: يؤجل في حالات ضعف المناعة الشديد\n\n'
        '💡 استشر الطبيب المختص دائماً',

    'الرضاعة والتطعيم':
        '🍼 الرضاعة الطبيعية والتطعيم:\n\n'
        '✅ الرضاعة الطبيعية لا تمنع أي تطعيم!\n\n'
        '📌 الفوائد:\n'
        '• تمرر أجسام مضادة للرضيع\n'
        '• تقوي المناعة الطبيعية\n'
        '• تحمي من العدوى\n\n'
        '💡 استمر بالرضاعة حتى أثناء التطعيم — تهدّي الطفل',
  };

  /// جلب موضوع بناءً على المفتاح
  String? getTopic(String key) => _topics[key];

  /// جميع مفاتيح الموضوعات
  List<String> getAllTopicKeys() => _topics.keys.toList();

  // ═══════════════════════════════════════════════════════════
  // VACCINES BY AGE — For consultation
  // ═══════════════════════════════════════════════════════════

  /// التطعيمات المطلوبة حسب العمر الحالي
  List<Map<String, String>> getVaccinesByAge(int months, int weeks) {
    if (months == 0 && weeks == 0) {
      return [
        {'name': 'BCG', 'description': 'ضد السل — يُعطى عند الولادة', 'emoji': '🔴'},
        {'name': 'OPV0', 'description': 'شلل الأطفال (قطرات فموية)', 'emoji': '💧'},
        {'name': 'HepB0', 'description': 'التهاب كبدي ب — جرعة الولادة', 'emoji': '💉'},
      ];
    }

    if (months < 2 || (months == 0 && weeks >= 6)) {
      return [
        {'name': 'OPV1', 'description': 'شلل الأطفال — الجرعة الأولى', 'emoji': '💧'},
        {'name': 'الخماسي 1', 'description': '5 أمراض بجرعة واحدة', 'emoji': '5️⃣'},
        {'name': 'PCV1', 'description': 'التطعيم الرئوي', 'emoji': '🫁'},
        {'name': 'Rota1', 'description': 'الروتا فيروس (فموي)', 'emoji': '🦠'},
      ];
    }

    if (months < 4) {
      return [
        {'name': 'OPV2', 'description': 'شلل الأطفال — الجرعة الثانية', 'emoji': '💧'},
        {'name': 'الخماسي 2', 'description': 'الجرعة الثانية', 'emoji': '5️⃣'},
        {'name': 'PCV2', 'description': 'الرئوي — الجرعة الثانية', 'emoji': '🫁'},
        {'name': 'Rota2', 'description': 'الروتا — الجرعة الثانية', 'emoji': '🦠'},
      ];
    }

    if (months < 6) {
      return [
        {'name': 'OPV3', 'description': 'شلل الأطفال — الجرعة الثالثة', 'emoji': '💧'},
        {'name': 'الخماسي 3', 'description': 'الجرعة الثالثة (مكتملة)', 'emoji': '5️⃣'},
        {'name': 'PCV3', 'description': 'الرئوي — الجرعة الثالثة', 'emoji': '🫁'},
        {'name': 'IPV', 'description': 'شلل حقني — جرعتان (14 أسبوع + 9 أشهر)', 'emoji': '💉'},
      ];
    }

    if (months < 9) {
      return [
        {'name': 'MR1', 'description': 'الحصبة — الجرعة الأولى (9 أشهر)', 'emoji': '🔴'},
        {'name': 'OPV4', 'description': 'شلل الأطفال — الجرعة الرابعة', 'emoji': '💧'},
        {'name': 'IPV2', 'description': 'شلل حقني — الجرعة الثانية', 'emoji': '💉'},
        {'name': 'فيتامين أ', 'description': 'كبسولة زرقاء 100,000 و.د (9 أشهر)', 'emoji': '🌟'},
      ];
    }

    if (months < 18) {
      return [
        {'name': 'MR2', 'description': 'الحصبة — الجرعة الثانية (18 شهر)', 'emoji': '🔴'},
        {'name': 'Penta4', 'description': 'خماسي تعزيزية', 'emoji': '💪'},
        {'name': 'OPV5', 'description': 'شلل الأطفال — الجرعة الخامسة', 'emoji': '💧'},
        {'name': 'فيتامين أ', 'description': 'كبسولة حمراء 200,000 و.د (18 شهر)', 'emoji': '🌟'},
      ];
    }

    if (months < 72) {
      return [
        {'name': 'Td المدرسة', 'description': 'جرعة تعزيزية عند دخول المدرسة', 'emoji': '🏫'},
        {'name': 'MR المدرسة', 'description': 'الحصبة — جرعة المدرسة', 'emoji': '🔴'},
        {'name': 'فيتامين أ', 'description': 'كبسولة حمراء 200,000 و.د (6 سنوات)', 'emoji': '🌟'},
      ];
    }

    return [];
  }

  /// التطعيمات المستحقة (القادمة)
  List<Map<String, String>> getDueVaccines(int currentMonths) {
    final due = <Map<String, String>>[];
    for (final v in vaccinationSchedule) {
      final ageMonths = v['ageMonths'] as int;
      if (ageMonths >= currentMonths) {
        due.add({
          'name': v['vaccine'].toString(),
          'description': 'يُعطى في عمر ${_ageLabel(ageMonths)}',
          'emoji': '💉',
        });
      }
    }
    return due;
  }

  String _ageLabel(int months) {
    if (months == 0) return 'الولادة';
    if (months == 2) return 'شهرين';
    if (months == 4) return '4 أشهر';
    if (months == 6) return '6 أشهر';
    if (months == 9) return '9 أشهر';
    if (months == 12) return '12 شهر';
    if (months == 18) return '18 شهر';
    if (months == 72) return '6 سنوات';
    return '$months أشهر';
  }

  /// الجدول الكامل
  String getFullSchedule() {
    final buf = StringBuffer();
    buf.writeln('📅 الجدول الزمني للتطعيمات في اليمن (2025):\n');
    buf.writeln('🟢 عند الولادة:');
    buf.writeln('   • BCG (ضد السل)');
    buf.writeln('   • HepB0 (جرعة ولادة التهاب الكبد B)');
    buf.writeln('   • OPV0 (شلل الأطفال الفموي)');
    buf.writeln('');
    buf.writeln('🟡 عمر 6 أسابيع:');
    buf.writeln('   • OPV1 + الخماسي 1 + الرئوي 1 + الروتا 1');
    buf.writeln('');
    buf.writeln('🟠 عمر 10 أسابيع:');
    buf.writeln('   • OPV2 + الخماسي 2 + الرئوي 2 + الروتا 2');
    buf.writeln('');
    buf.writeln('🔴 عمر 14 أسبوع:');
    buf.writeln('   • OPV3 + الخماسي 3 + الرئوي 3 + IPV');
    buf.writeln('');
    buf.writeln('🟣 عمر 9 أشهر:');
    buf.writeln('   • MR1 (الحصبة) + OPV4');
    buf.writeln('');
    buf.writeln('🌟 عمر 9 أشهر: فيتامين أ (100,000 و.د)');
    buf.writeln('');
    buf.writeln('💪 عمر 18 شهر:');
    buf.writeln('   • MR2 + Penta4 (خماسي تعزيزية) + OPV5 + فيتامين أ');
    buf.writeln('');
    buf.writeln('🏫 عمر 6 سنوات (دخول المدرسة):');
    buf.writeln('   • Td + MR تعزيزية + فيتامين أ');
    buf.writeln('');
    buf.writeln('⏰ لا تتأخر! كل تأخير يعرض طفلك للخطر');
    return buf.toString();
  }

  // ═══════════════════════════════════════════════════════════
  // SEARCH — Find relevant knowledge entries
  // ═══════════════════════════════════════════════════════════

  /// Search knowledge base for relevant information
  static List<KnowledgeEntry> search(String query) {
    final normalized = EpiNLPEngine.normalize(query);
    final results = <KnowledgeEntry>[];
    double score;

    // Search vaccination schedule
    for (final entry in vaccinationSchedule) {
      score = _calculateRelevance(normalized, [
        entry['vaccine'] as String,
        entry['disease'] as String,
        entry['age'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'جدول التطعيم',
          title: 'لقاح ${entry['vaccine']}',
          content: '${entry['vaccine']} — العمر: ${entry['age']}\n'
              'المرض: ${entry['disease']}\n'
              'الطريقة: ${entry['route']}\n'
              'الموقع: ${entry['site']}\n'
              'الجرعة: ${entry['dose']}',
          relevance: score,
        ));
      }
    }

    // Search vaccine details
    for (final entry in vaccineDetails.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        details['disease'] as String,
        details['type'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'تفاصيل اللقاح',
          title: details['nameAr'] as String,
          content: '${details['nameAr']} (${entry.key})\n'
              'النوع: ${details['type']}\n'
              'المرض: ${details['disease']}\n'
              'التخزين: ${details['storage']}\n'
              'الآثار الجانبية: ${details['sideEffects']}\n'
              'موانع الاستعمال: ${details['contraindications']}',
          relevance: score,
        ));
      }
    }

    // Search quality indicators
    for (final entry in qualityIndicators.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        details['meaning'] as String,
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'مؤشرات الجودة',
          title: details['nameAr'] as String,
          content: '${details['nameAr']} (${entry.key})\n'
              'المعنى: ${details['meaning']}\n'
              'المستهدف: ${details['target']}\n'
              'الحساب: ${details['calculation']}',
          relevance: score,
        ));
      }
    }

    // Search AEFI
    for (final entry in aefiTypes.entries) {
      final details = entry.value;
      score = _calculateRelevance(normalized, [
        entry.key,
        details['nameAr'] as String,
        ...(details['examples'] as List).cast<String>(),
      ]);
      if (score > 0.3) {
        results.add(KnowledgeEntry(
          category: 'الأحداث الضارة',
          title: details['nameAr'] as String,
          content: '${details['nameAr']}\n'
              'الأمثلة: ${(details['examples'] as List).join('، ')}\n'
              'التعامل: ${details['management']}\n'
              'الإلحاح: ${details['urgency']}',
          relevance: score,
        ));
      }
    }

    results.sort((a, b) => b.relevance.compareTo(a.relevance));
    return results;
  }

  /// Get context string for AI prompts
  static String getRelevantContext(String query, {int maxEntries = 3}) {
    final results = search(query);
    if (results.isEmpty) return '';

    final buffer = StringBuffer('معلومات من قاعدة المعرفة:\n');
    for (int i = 0; i < results.length && i < maxEntries; i++) {
      buffer.writeln('\n[${results[i].category}] ${results[i].title}:');
      buffer.writeln(results[i].content);
    }
    return buffer.toString();
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER
  // ═══════════════════════════════════════════════════════════

  static double _calculateRelevance(String normalizedQuery, List<String> fields) {
    final queryWords = normalizedQuery.split(' ');
    int totalMatches = 0;
    int totalWords = 0;

    for (final word in queryWords) {
      if (word.length < 2) continue;
      totalWords++;
      for (final field in fields) {
        final normalizedField = EpiNLPEngine.normalize(field);
        if (normalizedField.contains(word)) {
          totalMatches++;
          break;
        }
        // Fuzzy match
        final fieldWords = normalizedField.split(' ');
        for (final fw in fieldWords) {
          if (EpiNLPEngine.fuzzyMatch(word, fw) > 0.8) {
            totalMatches++;
            break;
          }
        }
      }
    }

    return totalWords > 0 ? totalMatches / totalWords : 0.0;
  }
}

// ═══════════════════════════════════════════════════════════
// DATA MODELS
// ═══════════════════════════════════════════════════════════

class KnowledgeEntry {
  final String category;
  final String title;
  final String content;
  final double relevance;

  const KnowledgeEntry({
    required this.category,
    required this.title,
    required this.content,
    required this.relevance,
  });
}
