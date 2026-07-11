// ═══════════════════════════════════════════════════════════════════════════
// seed-bot-knowledge — Edge Function لنقل المواضيع الثابتة لقاعدة البيانات
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

const SEED_TOPICS = [
  {
    topic: "تعريف التطعيم",
    title: "ما هو التطعيم؟",
    content: "💉 التطعيم طريقة بسيطة وآمنة وفعالة لحماية الأشخاص من الأمراض الخطيرة قبل التعرض لها.\n\n🔬 كيف يعمل:\n• يستخدم وسائل الدفاع الطبيعية لجسمك\n• يبني القدرة على مقاومة أمراض محددة\n• يقوي جهازك المناعي\n\n📋 أنواع اللقاحات المتوفرة في اليمن:\n• حية مضعفة: bOPV, MR, Rota, BCG\n• ميتة/غير نشطة: IPV, السعال الديكي\n• سموم معالجة: الكزاز والخناق\n• سكريات متعددة مقترنة: PCV, Hib\n• مصنعة بالهندسة الوراثية: Hep B",
    category: "definitions",
    keywords: ["تطعيم", "لقاح", "تحصين", "تعريف"],
    priority: 90,
  },
  {
    topic: "الآثار الجانبية",
    title: "الآثار الجانبية للتطعيم",
    content: "⚠️ الآثار الجانبية الشائعة:\n\n🔸 حرارة خفيفة (38-39°)\n• مدة: 1-2 يوم\n• العلاج: خافض حرارة (باراسيتامول)\n\n🔸 تورم أو احمرار مكان الحقن\n• مدة: 2-3 أيام\n• العلاج: كمادات باردة\n\n🔸 بكاء مستمر\n• مدة: ساعات قليلة\n\n⚠️ آثار تستدعي الطبيب فوراً:\n• حرارة عالية (> 40°)\n• تشنجات\n• صعوبة تنفس\n• فقدان الوعي",
    category: "side_effects",
    keywords: ["آثار", "جانبي", "حرارة", "تورم", "تشنج", "بكاء"],
    priority: 95,
  },
  {
    topic: "جدول التحصين",
    title: "جدول التحصين اليمني",
    content: "📅 جدول التحصين الروتيني في اليمن:\n\n👶 عند الولادة:\n• BCG (الدرن)\n• HepB0 (الجرعة الصفرية للتهاب الكبد B)\n• OPV0 (شلل الأطفال)\n\n👶 6 أسابيع:\n• OPV1 + IPV1 + Penta1 + PCV1 + Rota1\n\n👶 10 أسابيع:\n• OPV2 + Penta2 + PCV2 + Rota2\n\n👶 14 أسبوع:\n• OPV3 + IPV2 + Penta3 + PCV3\n\n👶 9 أشهر:\n• MR1 (الحصبة والحصبة الألمانية)\n\n👶 18 شهر:\n• MR2 (جرعة معززة)",
    category: "schedule",
    keywords: ["جدول", "مواعيد", "عمر", "تطعيمات"],
    priority: 100,
  },
  {
    topic: "سلسلة التبريد",
    title: "سلسلة التبريد و VVM",
    content: "❄️ سلسلة التبريد:\n\n🌡️ درجة الحرارة المثالية:\n• +2° إلى +8° مئوية للقاحات الروتينية\n• -15° إلى -25° للبوليو (OPV)\n\n📋 VVM (Vaccine Vial Monitor):\n• مربع داخلي داخل دائرة خارجية\n• اللون الأولي: أبيض\n• إذا غمق المربع عن الدائرة = اللقاح تالف\n\n✅ قواعد التخزين:\n• لا تلمس الجدار الخلفي للثلاجة\n• اترك مسافة بين العبوات",
    category: "cold_chain",
    keywords: ["تبريد", "ثلاجة", "VVM", "حرارة", "تخزين"],
    priority: 85,
  },
  {
    topic: "التطعيم والتوحد",
    title: "هل يسبب التطعيم التوحد؟",
    content: "🚫 لا — التطعيم لا يسبب التوحد.\n\n📋 الحقائق العلمية:\n\n1️⃣ الدراسة الأصلية (1998) سُحبت عام 2010 — كانت مزيفة\n\n2️⃣ دراسات ضخمة أثبتت عدم الربط:\n• دراسة دنماركية (657,461 طفل) — 2019\n• دراسة يابانية (30,000 طفل)\n• دراسة أمريكية (95,000 طفل)\n\n3️⃣ سبب زيادة تشخيص التوحد: تحسن أدوات التشخيص + زيادة الوعي\n\n✅ الخلاصة: التطعيم آمن ولا يسبب التوحد",
    category: "myths",
    keywords: ["توحد", "أوتيزم", "أسطورة", "خوف"],
    priority: 90,
  },
  {
    topic: "تكلفة التطعيم",
    title: "هل التطعيم مجاني؟",
    content: "💰 نعم — التطعيم مجاني تماماً في اليمن.\n\n📍 أماكن التطعيم المجانية:\n• المراكز الصحية الحكومية\n• المستشفيات الحكومية\n• الوحدات الصحية الريفية\n• نقاط التطعيم المتنقلة\n\n✅ ما يشمله المجاني:\n• اللقاحات نفسها\n• خدمات التطعيم\n• بطاقة التحصين\n• المتابعة\n\n💡 نصيحة: احتفظ ببطاقة التحصيم في مكان آمن!",
    category: "general",
    keywords: ["مجاني", "تكلفة", "بلاش", "سعر", "فلوس"],
    priority: 80,
  },
  {
    topic: "حالات خاصة",
    title: "التطعيم في الحالات الخاصة",
    content: "🏥 حالات تحتاج استشارة طبية قبل التطعيم:\n\n👶 الأطفال المبتسرين:\n• يُطعمون حسب العمر الزمني\n• الجرعات نفسها والأعمار نفسها\n\n🤒 الطفل المريض:\n• حرارة بسيطة = يمكن التطعيم\n• حرارة عالية (> 38.5°) = أجّل التطعيم\n\n💊 حساسية شديدة:\n• حساسية من بروتين البيض → تجنب الإنفلونزا والحصبة\n• أخبر الطبيب قبل التطعيم\n\n🫀 أمراض مزمنة:\n• أمراض القلب → التطعيم مهم جداً\n• نقص المناعة → تجنب اللقاحات الحية",
    category: "special_cases",
    keywords: ["مبتسر", "مريض", "حساسية", "خديج", "خاص"],
    priority: 85,
  },
  {
    topic: "الإشراف الداعم",
    title: "الإشراف الداعم",
    content: "🏥 الإشراف الداعم في التحصين:\n\n📋 أهدافه:\n• ضمان جودة خدمات التحصين\n• دعم الكوادر الصحية\n• تحسين التغطية\n\n🔍 مكونات الزيارة الإشرافية:\n1️⃣ مراجعة السجلات\n2️⃣ تقييم الممارسات (حقن آمن، نفايات)\n3️⃣ مراقبة الجودة (VVM، سلسلة باردة)\n4️⃣ الدعم والتغذية الراجعة",
    category: "supervision",
    keywords: ["إشراف", "داعم", "زيارة", "تقييم", "متابعة"],
    priority: 75,
  },
];

Deno.serve(async (_req) => {
  try {
    let inserted = 0;
    let skipped = 0;

    for (const topic of SEED_TOPICS) {
      const { error } = await supabase
        .from("bot_knowledge")
        .upsert(
          {
            topic: topic.topic,
            title: topic.title,
            content: topic.content,
            category: topic.category,
            keywords: topic.keywords,
            priority: topic.priority,
            source: "imported",
            is_active: true,
          },
          { onConflict: "topic" }
        );

      if (error) {
        console.error(`[seed] Error inserting "${topic.topic}":`, error.message);
        skipped++;
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inserted,
        skipped,
        total: SEED_TOPICS.length,
        message: `تم إدراج ${inserted} موضوع، تخطي ${skipped}`,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
