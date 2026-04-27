// ═══════════════════════════════════════════════════════════
// EPI Copilot — EPI Knowledge Base (loaded per-intent)
// ═══════════════════════════════════════════════════════════

export const EPI_VACCINATION_KNOWLEDGE = `
== معرفة EPI ==
• BCG (السل) — عند الولادة
• OPV0 — عند الولادة | OPV1/OPV2/OPV3 — 6/10/14 أسبوع
• Penta1/2/3 (الخماسي: DPT+HepB+Hib) — 6/10/14 أسبوع
• PCV1/2/3 (الرئة) — 6/10/14 أسبوع
• MR1 — 9 أشهر | MR2 — 18 شهر
• Vitamin A — 6 شهر و 12 شهر
• Dropout = (Penta1 - Penta3) / Penta1 × 100 — المقبول <10%
• Coverage = Penta3 / Target × 100 — المستهدف 95%+
• OPV3 ≈ Penta3 (يجب متساويين)
• MR1 vs MR2 = فجوة بين الجرعتين`

export const GOVERNORATE_KNOWLEDGE = `
== تحليل المحافظات ==
• 15 محافظة نشطة: أبين، البيضاء، الجوف، الحديدة، الضالع، المكلا، المهرة، حضرموت، إب، لحج، مأرب، ريمة، صنعاء، تعز، عمران
• قارن أداء المحافظات حسب: عدد الإرساليات، نسبة القبول، التغطية
• المحافظات الضعيفة: <10 إرساليات/أسبوع تحتاج تدخل عاجل`

export const REPORT_KNOWLEDGE = `
== التقارير ==
• أنواع: يومي/أسبوعي/شهري/حسب المحافظة/حسب الحملة
• اعرض: ملخص أرقام + اتجاه + أفضل/أسوأ + توصيات
• استخدم الأدوات: get_submissions, get_governorate_performance, export_report`

export const DATA_QUALITY_KNOWLEDGE = `
== جودة البيانات ==
• نسبة الرفض: المقبول <5%
• اكتمال الحقول: المقبول >90%
• الإرساليات الفارغة: مؤشر على مشكلة في الإدخال
• المقارنة بين المحافظات تكشف الفجوات`

export const SYSTEM_INFO = `
== النظام ==
• 22 محافظة يمنية، ~330 مديرية
• حملات: شلل الأطفال (polio_campaign) + إيصالي تكاملي (integrated_activity)
• 5 أدوار: admin, central, governorate, district, data_entry`
