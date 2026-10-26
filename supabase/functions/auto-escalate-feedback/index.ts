// ═══════════════════════════════════════════════════════════════════════════
// auto-escalate-feedback — Edge Function للتصعيد التلقائي للتغذية الراجعة
//
//  تُشغَّل عبر cron كل ساعة، وتفحص التذاكر:
//   1. المتأخرة عن SLA (sla_deadline < now()) → تصعيد للمستوى الأعلى
//   2. تصعيد المستوى 1: بعد تجاوز SLA → تُرحّل لمستوى أعلى
//   3. تصعيد المستوى 2: بعد SLA + 50% → تُرحّل لمستوى أعلى آخر
//
//  التصعيد يعني:
//   - تغيير status إلى 'escalated'
//   - زيادة escalation_level
//   - تحديث to_role للمستوى الأعلى
//   - إدراج feedback_response بنوع 'escalation'
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.error("[auto-escalate] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

/// خريطة التصعيد: كل دور يتصعد للدور الأعلى منه
const ESCALATION_MAP: Record<string, string> = {
  data_entry: "district",
  district: "governorate",
  governorate: "central",
  central: "admin",
  admin: "admin", // الأدمن لا يتصعد
};

/// التصعيد الرئيسي
async function escalateOverdueTickets() {
  console.log("[auto-escalate] Starting escalation scan...");

  // 1) جلب التذاكر المتأخرة عن SLA ولم تُحل بعد
  const { data: overdueTickets, error: fetchError } = await supabase
    .from("feedback_tickets")
    .select("*")
    .in("status", ["sent", "received", "in_progress"])
    .lt("sla_deadline", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error("[auto-escalate] Error fetching overdue tickets:", fetchError);
    return { escalated: 0, error: fetchError.message };
  }

  if (!overdueTickets || overdueTickets.length === 0) {
    console.log("[auto-escalate] No overdue tickets found.");
    return { escalated: 0 };
  }

  console.log(`[auto-escalate] Found ${overdueTickets.length} overdue tickets.`);

  let escalatedCount = 0;
  const now = new Date().toISOString();

  for (const ticket of overdueTickets) {
    // التحقق من مستوى التصعيد الحالي
    const currentLevel = ticket.escalation_level || 0;

    // المستوى 0 → تصعيد للمستوى 1
    // المستوى 1 (بعد SLA + 50%) → تصعيد للمستوى 2
    // المستوى 2 → لا مزيد من التصعيد
    if (currentLevel >= 2) {
      continue;
    }

    // التحقق من الوقت: المستوى 1 بعد SLA مباشرة، المستوى 2 بعد SLA + 50% من SLA
    const slaMs = ticket.sla_hours * 60 * 60 * 1000;
    const overdueMs = Date.now() - new Date(ticket.sla_deadline).getTime();
    const requiredOverdueMs = currentLevel === 0 ? 0 : slaMs * 0.5;

    if (overdueMs < requiredOverdueMs) {
      continue;
    }

    // تحديد الدور الجديد للتصعيد
    const newToRole = ESCALATION_MAP[ticket.to_role] || ticket.to_role;

    // لا تصعيد إذا كان الدور الحالي هو الأدمن
    if (newToRole === ticket.to_role && currentLevel > 0) {
      continue;
    }

    console.log(
      `[auto-escalate] Escalating ticket ${ticket.ticket_number} (level ${currentLevel} → ${currentLevel + 1})`
    );

    // 1) تحديث التذكرة
    const { error: updateError } = await supabase
      .from("feedback_tickets")
      .update({
        status: "escalated",
        escalation_level: currentLevel + 1,
        escalated_at: now,
        to_role: newToRole,
        updated_at: now,
      })
      .eq("id", ticket.id);

    if (updateError) {
      console.error(
        `[auto-escalate] Error updating ticket ${ticket.ticket_number}:`,
        updateError
      );
      continue;
    }

    // 2) إدراج رد تصعيد
    const escalationMessage =
      currentLevel === 0
        ? `⚠️ تم تصعيد هذه التذكرة تلقائياً لتجاوز SLA (${ticket.sla_hours} ساعة). تم ترحيلها لمستوى: ${newToRole}.`
        : `🚨 تصعيد ثاني المستوى — التذكرة لا تزال دون حل. تم ترحيلها لمستوى: ${newToRole}.`;

    await supabase.from("feedback_responses").insert({
      ticket_id: ticket.id,
      responder_id: ticket.issued_by || ticket.from_user_id,
      responder_name: "نظام التصعيد التلقائي",
      responder_role: "admin",
      body: escalationMessage,
      response_type: "escalation",
      new_status: "escalated",
    });

    // 3) إرسال إشعار للمستخدم الأصلي (ليعرف أن تذكرته تم تصعيدها)
    await supabase.from("notifications").insert({
      recipient_id: ticket.from_user_id,
      title: "تصعيد تلقائي للتغذية الراجعة",
      body: `تم تصعيد تذكرتك ${ticket.ticket_number} لتجاوز موعد الاستجابة`,
      type: "warning",
      category: "feedback_escalation",
      data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number },
    });

    escalatedCount++;
  }

  console.log(`[auto-escalate] Escalated ${escalatedCount} tickets.`);
  return { escalated: escalatedCount };
}

/// توليد بورد الإنجازات الأسبوعي (يُشغَّل يوم الأحد)
async function generateWeeklyAchievements() {
  console.log("[auto-escalate] Generating weekly achievements...");

  // 1) أعلى محافظة في نسبة الالتزام
  // (هذا يحتاج تحليل supervision_submissions — نضع placeholder للاختبار)
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // 2) أسرع رد على التغذية الراجعة
  const { data: fastReplies, error: replyError } = await supabase
    .from("feedback_tickets")
    .select(`
      ticket_number,
      from_name,
      sla_deadline,
      resolved_at,
      sla_hours
    `)
    .not("resolved_at", "is", null)
    .gte("resolved_at", weekStart.toISOString())
    .order("resolved_at", { ascending: true })
    .limit(5);

  if (replyError) {
    console.error("[auto-escalate] Error fetching fast replies:", replyError);
  } else if (fastReplies && fastReplies.length > 0) {
    const fastest = fastReplies[0];
    const responseTimeMs =
      new Date(fastest.resolved_at).getTime() -
      new Date(fastest.sla_deadline).getTime() +
      fastest.sla_hours * 60 * 60 * 1000;
    const responseHours = Math.round(responseTimeMs / (60 * 60 * 1000));

    await supabase.from("achievements").insert({
      achievement_type: "fastest_response",
      period_type: "weekly",
      period_start: weekStart.toISOString().split("T")[0],
      period_end: now.toISOString().split("T")[0],
      recipient_type: "user",
      recipient_id: "auto",
      recipient_name: fastest.from_name,
      metric_value: responseHours,
      metric_unit: "hours",
      description: `أسرع رد على التغذية الراجعة (${fastest.ticket_number})`,
    });
  }

  console.log("[auto-escalate] Weekly achievements generated.");
}

Deno.serve(async (_req) => {
  try {
    const result = await escalateOverdueTickets();

    // توليد الإنجازات فقط يوم الأحد (0 = Sunday in JS)
    const today = new Date().getDay();
    if (today === 0) {
      await generateWeeklyAchievements();
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ...result,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("[auto-escalate] Unhandled error:", e);
    return new Response(
      JSON.stringify({ ok: false, error: String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
