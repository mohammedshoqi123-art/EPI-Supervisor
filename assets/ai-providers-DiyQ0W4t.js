import{W as a}from"./index-DXJVuI-U.js";async function l(s,t=[],e){const m=Date.now(),{data:{session:n}}=await a.auth.getSession();if(!n)return{text:"⚠️ يرجى تسجيل الدخول أولاً.",provider:"groq",model:"none",latencyMs:0,error:"Not authenticated"};const{data:r,error:c}=await a.functions.invoke("ai-chat-v3",{body:{message:s,history:t.filter(y=>y.role!=="system").slice(-10),template:(e==null?void 0:e.template)||void 0,system_prompt:(e==null?void 0:e.systemPrompt)||void 0,stream:(e==null?void 0:e.stream)||!1}});if(c)return{text:"⚠️ عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي.",provider:"groq",model:"none",latencyMs:Date.now()-m,error:c.message};const u=(r==null?void 0:r.reply)||(r==null?void 0:r.text)||"عذراً، لم أتمكن من المعالجة.",o=(r==null?void 0:r.source)||"groq";return{text:u,provider:o,model:(r==null?void 0:r.model)||"unknown",latencyMs:Date.now()-m,tokensUsed:r==null?void 0:r.tokensUsed}}async function $(s,t=[],e){return l(s,t,{template:e==null?void 0:e.template,systemPrompt:e==null?void 0:e.systemPrompt})}async function f(s,t){const e=`
إحصائيات النظام:
- إجمالي الإرساليات: ${s.total_submissions}
- إرساليات اليوم: ${s.submissions_today}
- إرساليات هذا الأسبوع: ${s.submissions_this_week}
- معدل الاعتماد: ${s.approval_rate.toFixed(1)}%
- إجمالي المستخدمين: ${s.total_users}
- المستخدمين النشطين: ${s.active_users}
- إجمالي الاستمارات: ${s.total_forms}
- الاستمارات النشطة: ${s.active_forms}
${t?`
أداء المحافظات:
${t.map(r=>`- ${r.name}: ${r.submissions} إرسالية`).join(`
`)}`:""}
`;return(await l(e,[],{systemPrompt:`أنت محلل بيانات صحية خبير في برنامج التوسع في التطعيم (EPI).
حلل البيانات التالية وقدّم:
1. تقييم الوضع الحالي (جيد/متوسط/ضعيف)
2. المشاكل المحتملة والأسباب
3. 3-5 توصيات عملية وقابلة للتنفيذ
4. تنبؤ قصير المدى (الأسبوع القادم)

كن مختصراً ومباشراً. استخدم الإيموجي بشكل مناسب. أجب بالعربية.`})).text}export{f as g,$ as q};
//# sourceMappingURL=ai-providers-DiyQ0W4t.js.map
