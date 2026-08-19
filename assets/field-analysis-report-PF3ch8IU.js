import{aX as o,J as k}from"./index-CZYDGgom.js";import{E as ce}from"./epi-logo-DIY43m-y.js";function Z(i){const s=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${i.getDate()} ${s[i.getMonth()]} ${i.getFullYear()}`}const pe={1:"الجولة الأولى",2:"الجولة الثانية",3:"الجولة الثالثة",4:"الجولة الرابعة",5:"الجولة الخامسة",6:"الجولة السادسة",7:"الجولة السابعة",8:"الجولة الثامنة",9:"الجولة التاسعة",10:"الجولة العاشرة"};function ge(i){return!i||i<=0?null:pe[i]||`الجولة ${i}`}function fe(i){const s=ge(i);return s?` — ${s}`:""}function we(i,s){return s&&s>0?i.eq("campaign_round",s):i}function me(i){return i.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function g(i){const s=document.createElement("div");return s.textContent=i,s.innerHTML}function be(i,s,l){return`
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon"><img src="${ce}" alt="شعار التحصين" style="width:40px;height:40px;object-fit:contain;border-radius:8px" /></div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${Z(new Date)}</div>
          <div class="meta-item">🕐 ${me(new Date)}</div>
          ${l?`<div class="meta-item">📊 ${g(l)}</div>`:""}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${g(i)}</h1>
        <p>${g(s)}</p>
      </div>
    </div>
  `}function ue(){return`
    <div class="report-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>منصة مشرف EPI — تقرير تلقائي</span>
        <span>سري — للاستخدام الداخلي فقط</span>
        <span class="page-number"></span>
      </div>
    </div>
  `}function b(i,s,l,r,d){return`
    <div class="kpi-card" style="border-top: 4px solid ${r}">
      <div class="kpi-icon">${l}</div>
      <div class="kpi-value" style="color: ${r}">${s}</div>
      <div class="kpi-label">${g(i)}</div>
      ${d?`<div class="kpi-sub">${g(d)}</div>`:""}
    </div>
  `}function B(i,s,l){return`
    <div class="section-title">
      <span class="section-icon">${i}</span>
      <span>${g(s)}</span>
      ${l?`<span class="section-badge">${g(l)}</span>`:""}
    </div>
  `}function V(i,s){return`
    <table class="data-table">
      <thead>
        <tr>${i.map(l=>`<th>${g(l)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${s.map(l=>`<tr>${l.map(r=>`<td>${r}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `}function Fe(i,s,l,r){const d=l>0?Math.round(s/l*100):0;return`
    <div class="progress-item">
      <div class="progress-header">
        <span>${g(i)}</span>
        <span class="progress-value">${d}% (${s}/${l})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(d,100)}%; background: ${r}"></div>
      </div>
    </div>
  `}function ve(){return`
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      
      html, body {
        font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
        direction: rtl;
        color: ${o.textDark};
        background: white;
        font-size: 14px;
        line-height: 1.7;
        -webkit-font-smoothing: antialiased;
      }
      
      /* ─── Header ─── */
      .report-header {
        margin-bottom: 20px;
        page-break-after: avoid;
      }
      .header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, ${o.primaryDark}, ${o.primary});
        border-radius: 8px;
        color: white;
        margin-bottom: 12px;
      }
      .header-brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .brand-icon {
        font-size: 28px;
        background: rgba(255,255,255,0.2);
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .brand-title {
        font-size: 16px;
        font-weight: 800;
      }
      .brand-sub {
        font-size: 12px;
        opacity: 0.85;
      }
      .header-meta {
        text-align: left;
        font-size: 11px;
        opacity: 0.9;
      }
      .meta-item { margin-bottom: 2px; }
      .header-title-section {
        text-align: center;
        padding: 10px;
        background: ${o.bgLight};
        border-radius: 8px;
        border-right: 4px solid ${o.primary};
      }
      .header-title-section h1 {
        font-size: 22px;
        font-weight: 800;
        color: ${o.primaryDark};
        margin-bottom: 4px;
      }
      .header-title-section p {
        font-size: 13px;
        color: ${o.textMuted};
      }
      
      /* ─── KPI Grid ─── */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 14px 0;
      }
      .kpi-card {
        background: white;
        border: 1px solid ${o.border};
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .kpi-icon { font-size: 24px; margin-bottom: 4px; }
      .kpi-value { font-size: 28px; font-weight: 900; }
      .kpi-label { font-size: 11px; color: ${o.textMuted}; margin-top: 2px; }
      .kpi-sub { font-size: 10px; color: ${o.textMuted}; margin-top: 1px; }
      
      /* ─── Section Title ─── */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: ${o.primaryDark};
        margin: 18px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${o.primary};
        page-break-after: avoid;
      }
      .section-icon { font-size: 18px; }
      .section-badge {
        font-size: 11px;
        background: ${o.primary};
        color: white;
        padding: 2px 8px;
        border-radius: 10px;
        margin-right: auto;
      }
      
      /* ─── Table ─── */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 8px 0;
        font-size: 12px;
      }
      .data-table th {
        background: ${o.primary};
        color: white;
        padding: 10px 12px;
        text-align: right;
        font-weight: 700;
        font-size: 11px;
      }
      .data-table td {
        padding: 8px 12px;
        border-bottom: 1px solid ${o.border};
      }
      .data-table tr:nth-child(even) { background: ${o.bgLight}; }
      .data-table tr:hover { background: #E3F2FD; }
      .data-table .num { font-weight: 700; direction: ltr; text-align: center; }
      
      /* ─── Progress ─── */
      .progress-item { margin: 6px 0; }
      .progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        margin-bottom: 3px;
      }
      .progress-value { font-weight: 700; color: ${o.primary}; }
      .progress-bar {
        height: 8px;
        background: #E8EAF6;
        border-radius: 4px;
        overflow: hidden;
      }
      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }
      
      /* ─── Alert Box ─── */
      .alert-box {
        padding: 12px 16px;
        border-radius: 8px;
        margin: 10px 0;
        font-size: 12px;
        border-right: 4px solid;
      }
      .alert-success { background: #E8F5E9; border-color: ${o.success}; color: ${o.success}; }
      .alert-warning { background: #FFF8E1; border-color: ${o.warning}; color: #E65100; }
      .alert-danger { background: #FFEBEE; border-color: ${o.accent}; color: ${o.accent}; }
      .alert-info { background: #E1F5FE; border-color: ${o.info}; color: ${o.info}; }
      
      /* ─── Two Column ─── */
      .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
      
      /* ─── Footer ─── */
      .report-footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px 0;
      }
      .footer-line {
        height: 2px;
        background: linear-gradient(90deg, ${o.primary}, ${o.accent});
        margin-bottom: 6px;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: ${o.textMuted};
      }
      
      /* ─── Print ─── */
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
      }
      
      /* ─── Page Break ─── */
      .page-break { page-break-before: always; }
      
      /* ─── Highlight Row ─── */
      .highlight-row { background: #E3F2FD !important; font-weight: 600; }
      
      /* ─── Status Badges ─── */
      .status-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 700;
      }
      .status-ready { background: #E8F5E9; color: ${o.success}; }
      .status-partial { background: #FFF8E1; color: #F57F17; }
      .status-not-ready { background: #FFEBEE; color: ${o.accent}; }
    </style>
  `}let H=!1,L="",Y=0;function Ee(){return H=!0,L="",Y++,Y}function Re(i){if(i!==void 0&&i!==Y)return"";H=!1;const s=L;return L="",s}function xe(i,s,l){var h;if(H)return L=i,i;const r=document.createElement("iframe");r.style.position="fixed",r.style.top="-9999px",r.style.left="-9999px",r.style.width="210mm",r.style.height="297mm",document.body.appendChild(r);const d=r.contentDocument||((h=r.contentWindow)==null?void 0:h.document);if(!d){document.body.removeChild(r);const _=new Blob([i],{type:"text/html"}),w=URL.createObjectURL(_),F=document.createElement("a");F.href=w,F.download=`${s||"تقرير"}.html`,F.click(),URL.revokeObjectURL(w);return}d.open(),d.write(i),d.close(),setTimeout(()=>{var _;(_=r.contentWindow)==null||_.print(),setTimeout(()=>{document.body.contains(r)&&document.body.removeChild(r)},1e4)},600)}const A=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟"},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟"},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟"}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟"},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟"},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟"},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟"},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟"}]},{id:"records",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟"},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟"},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟"},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟"}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟"},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟"},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟"},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟"},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟"}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟"},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟"},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟"}]},{id:"supplies",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟"},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟"},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟"},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟"},{key:"scale",label:"هل يوجد ميزان؟"},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟"}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",invertLogic:!0,fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟"},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟"},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟"},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟"}]},{id:"catch_up",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟"},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟"},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟"},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟"},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟"}]},{id:"defaulter",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟"},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟"}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟"},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟"}]}],he=["تحدي","صعوب","مشكل","عائق","معوق","challeng","difficult","problem"],ye=["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action"],$e=["توصي","اقتراح","ينصح","propose","recommend"];function q(i,s){if(!i||typeof i!="object")return null;for(const[l,r]of Object.entries(i))if(typeof r=="string"&&r.trim().length>2){for(const d of s)if(l.toLowerCase().includes(d.toLowerCase()))return r.trim()}if(i.data&&typeof i.data=="object"){for(const[l,r]of Object.entries(i.data))if(typeof r=="string"&&r.trim().length>2){for(const d of s)if(l.toLowerCase().includes(d.toLowerCase()))return r.trim()}}for(const[,l]of Object.entries(i))if(typeof l=="string"&&l.trim().length>20){for(const r of s)if(l.toLowerCase().includes(r.toLowerCase()))return l.trim()}return null}function R(i){return i>=80?{label:"ممتاز",color:o.success,emoji:"✅"}:i>=60?{label:"جيد",color:"#FF9800",emoji:"👍"}:i>=40?{label:"متوسط",color:o.warning,emoji:"⚠️"}:{label:"ضعيف",color:o.accent,emoji:"❌"}}async function ze(i){const s=i!=null&&i.campaignRound&&i.campaignRound>0?i.campaignRound:null,l=new Date().toISOString().split("T")[0],r=Z(new Date);let d=[];try{const{data:e,error:t}=await k.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).eq("campaign_round",s??-1).order("created_at",{ascending:!1}).limit(5e3);if(t?console.error("[FieldAnalysis] YesNo round query error:",t.message):d=e||[],d.length===0){const{data:a,error:n}=await k.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);n||(d=a||[])}if(d.length===0){const{data:a,error:n}=await k.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);n||(d=a||[])}}catch(e){console.error("[FieldAnalysis] YesNo exception:",e.message)}let h=[];try{const{data:e,error:t}=await k.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).eq("campaign_round",s??-1).order("created_at",{ascending:!1}).limit(5e3);if(t?console.error("[FieldAnalysis] Challenges round error:",t.message):h=e||[],h.length===0){const{data:a,error:n}=await k.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);n||(h=a||[])}}catch(e){console.error("[FieldAnalysis] Challenges exception:",e.message)}const{data:_}=await k.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar"),w=new Map;for(const e of _||[])w.set(e.id,e.name_ar);const F=A.flatMap(e=>e.fields.map(t=>t.key));new Set(A.filter(e=>e.invertLogic).flatMap(e=>e.fields.map(t=>t.key)));const z=new Map;for(const e of F)z.set(e,{yes:0,no:0,total:0,govStats:new Map});for(const e of d){const t=e.data||{},a=e.governorate_id||"";for(const n of F){const p=t[n],m=z.get(n);if(!m)continue;const c=m.govStats.get(a)||{yes:0,no:0};p===!0||p==="yes"||p==="نعم"?(m.yes++,m.total++,c.yes++):(p===!1||p==="no"||p==="لا")&&(m.no++,m.total++,c.no++),m.govStats.set(a,c)}}const y=A.map(e=>{const t=!!e.invertLogic,a=e.fields.map(c=>{const f=z.get(c.key)||{yes:0,no:0,total:0,govStats:new Map},x=t?f.no:f.yes,E=f.total>0?Math.round(x/f.total*100):0;return{...c,...f,positiveRate:E,positiveCount:x,isInverted:t}}),n=a.reduce((c,f)=>c+f.positiveCount,0),p=a.reduce((c,f)=>c+f.total,0),m=p>0?Math.round(n/p*100):0;return{...e,fields:a,totalPositive:n,totalAll:p,avgRate:m,isInverted:t}}),K=new Set;for(const[,e]of z)for(const[t]of e.govStats)K.add(t);const C=[...K].map(e=>{const t=w.get(e)||"غير محدد",a=A.map(c=>{const f=!!c.invertLogic;let x=0,E=0;for(const re of c.fields){const Q=z.get(re.key);if(!Q)continue;const D=Q.govStats.get(e);if(!D)continue;const le=D.yes+D.no,de=f?D.no:D.yes;x+=de,E+=le}const ne=E>0?Math.round(x/E*100):0;return{sectionId:c.id,title:c.title,icon:c.icon,rate:ne,totalAll:E}}),n=a.reduce((c,f)=>c+f.rate,0),p=a.filter(c=>c.totalAll>0).length,m=p>0?Math.round(n/p):0;return{govId:e,govName:t,sectionResults:a,overallRate:m,totalSubs:d.filter(c=>c.governorate_id===e).length}}).sort((e,t)=>t.overallRate-e.overallRate),U=y.reduce((e,t)=>e+t.fields.reduce((a,n)=>a+(t.isInverted?n.no:n.yes),0),0),ee=y.reduce((e,t)=>e+t.fields.reduce((a,n)=>a+(t.isInverted?n.yes:n.no),0),0),G=U+ee,S=G>0?Math.round(U/G*100):0,I=y.flatMap(e=>e.fields.filter(t=>t.total>0)),te=[...I].sort((e,t)=>t.positiveRate-e.positiveRate).slice(0,5),N=[...I].sort((e,t)=>e.positiveRate-t.positiveRate).slice(0,5),u=I.filter(e=>e.positiveRate<40).sort((e,t)=>e.positiveRate-t.positiveRate),oe=await k.from("profiles").select("id, full_name").is("deleted_at",null),W=new Map;for(const e of oe.data||[])W.set(e.id,e.full_name);const j=new Map;for(const e of h){const t=e.data||{},a=q(t,he),n=q(t,ye),p=q(t,$e);if(!a&&!n&&!p)continue;const m=e.governorate_id||"",c=w.get(m)||"غير محدد";j.has(m)||j.set(m,{govName:c,challenges:[],actions:[],recommendations:[],supervisorNames:new Set,count:0});const f=j.get(m);f.count++,a&&f.challenges.push(a),n&&f.actions.push(n),p&&f.recommendations.push(p);const x=W.get(e.submitted_by||"");x&&f.supervisorNames.add(x)}const v=[...j.values()].sort((e,t)=>t.count-e.count),M=v.reduce((e,t)=>e+t.count,0),T=v.reduce((e,t)=>e+t.challenges.length,0),J=v.reduce((e,t)=>e+t.actions.length,0),X=v.reduce((e,t)=>e+t.recommendations.length,0),$=[];if(N.length>0){const e=N.slice(0,3);for(const t of e){const a=y.find(n=>n.fields.some(p=>p.key===t.key));a&&$.push(`تحسين "${t.label}" — النسبة الحالية ${t.positiveRate}% (مجال "${a.title}"). يتطلب تدخل عاجل.`)}}if(u.length>3&&$.push(`هناك ${u.length} مؤشرات تحت 40% — يُنصح بخطة تحسين شاملة للفريق الميداني.`),v.length>0){const e=v[0];e.challenges.length>2&&$.push(`محافظة "${e.govName}" تسجل أعلى عدد تحديات (${e.challenges.length}) — تحتاج جلسة متابعة ميدانية.`)}if(C.length>0){const e=C.filter(t=>t.overallRate<50&&t.totalSubs>0);e.length>0&&$.push(`${e.length} محافظات بأداء تحت 50%: ${e.map(t=>t.govName).join("، ")}.`)}function ie(e,t=!1){const a=e>=80?o.success:e>=60?"#FF9800":e>=40?o.warning:o.accent,n=t?`${e}% (لا)`:`${e}%`;return`
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${e}%;height:100%;background:${a};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${a};min-width:36px;text-align:left;">${n}</span>
      </div>
    `}function O(e,t){if(t.length===0)return"";const a={challenges:{label:"تحديات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"إجراءات",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"توصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}}[e];return`
      <div style="margin:6px 0;">
        <div style="font-size:11px;font-weight:700;color:${a.color};margin-bottom:4px;">${a.icon} ${a.label} (${t.length})</div>
        <div style="background:${a.bg};border:1px solid ${a.border};border-radius:8px;padding:8px 10px;">
          ${t.slice(0,5).map((n,p)=>`
            <div style="font-size:10px;line-height:1.6;color:${o.textDark};${p>0?`border-top:1px solid ${a.border};padding-top:4px;`:""}">
              ${p+1}. ${g(n.length>150?n.slice(0,150)+"...":n)}
            </div>
          `).join("")}
          ${t.length>5?`<div style="font-size:9px;color:${o.textMuted};margin-top:4px;">... و ${t.length-5} نقطة أخرى</div>`:""}
        </div>
      </div>
    `}const P=R(S),ae=`النسبة الإيجابية الكلية ${S}% — ${P.label}. ${u.length>0?`هناك ${u.length} مؤشرات حرجة تحتاج تدخل فوري. `:"لا توجد مؤشرات حرجة. "}${v.length>0?`${M} استمارة تحديات ميدانية مُسجّلة.`:"لا توجد تحديات مُسجّلة."}`,se=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل المتابعة الميدانية — ${r}</title>
      ${ve()}
      <style>
        .master-section {
          margin: 20px 0;
          page-break-inside: avoid;
        }
        .master-section-header {
          background: linear-gradient(135deg, ${o.primary}, ${o.primaryDark});
          color: white;
          padding: 12px 18px;
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .master-section-title { font-size: 15px; font-weight: 800; }
        .master-section-badge {
          background: rgba(255,255,255,0.2);
          padding: 4px 12px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 700;
        }
        .master-section-body {
          border: 1px solid ${o.border};
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 14px;
          background: white;
        }
        .yesno-section-card {
          border: 1px solid ${o.border};
          border-radius: 8px;
          margin: 8px 0;
          overflow: hidden;
        }
        .yesno-section-header {
          background: ${o.bgLight};
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${o.border};
        }
        .yesno-field-row {
          display: flex;
          align-items: center;
          padding: 5px 12px;
          border-bottom: 1px solid #F5F5F5;
          gap: 8px;
        }
        .yesno-field-row:last-child { border-bottom: none; }
        .challenge-card {
          border: 1px solid ${o.border};
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .challenge-header {
          background: linear-gradient(135deg, ${o.primary}15, ${o.primary}08);
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${o.border};
        }
        .top-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .top-bottom-card {
          border: 1px solid ${o.border};
          border-radius: 8px;
          padding: 10px;
        }
        .alert-box {
          background: #FFF5F5;
          border: 1px solid #FFCDD2;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 8px 0;
        }
        .alert-item {
          font-size: 11px;
          padding: 4px 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .recommendation-box {
          background: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 8px;
          padding: 10px 14px;
          margin: 8px 0;
        }
        .recommendation-item {
          font-size: 11px;
          padding: 4px 0;
          line-height: 1.6;
        }
        .gov-perf-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 10px;
          margin: 10px 0;
        }
        .gov-perf-card {
          border: 1px solid ${o.border};
          border-radius: 8px;
          padding: 10px;
          border-top: 3px solid ${o.primary};
        }
      </style>
    </head>
    <body>
      ${be("تحليل المتابعة الميدانية","تحليل حقول نعم/لا + تحديات الإشراف الميداني"+fe(s),r)}

      <!-- ═══ KPIs الرئيسية ═══ -->
      ${B("📊","مؤشرات الأداء الرئيسية")}
      <div class="kpi-grid">
        ${b("إجمالي الاستمارات",d.length,"📋",o.primary)}
        ${b("النسبة الإيجابية الكلية",`${S}%`,"🎯",P.color,P.label)}
        ${b("مؤشرات حرجة",u.length,"🚨",u.length>0?o.accent:o.success,u.length>0?"تحتاج تدخل":"ممتاز")}
        ${b("تحديات ميدانية",M,"⚠️","#E53935",`${T} نقطة`)}
        ${b("إجراءات متخذة",J,"📋","#1565C0")}
        ${b("توصيات",X,"💡","#2E7D32")}
      </div>

      <!-- ═══ الملخص التنفيذي ═══ -->
      ${B("📝","الملخص التنفيذي")}
      <div style="background:${o.bgLight};border:1px solid ${o.border};border-radius:10px;padding:14px 18px;margin:10px 0;">
        <div style="font-size:13px;line-height:1.8;color:${o.textDark};">
          ${g(ae)}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تحليل حقول نعم/لا -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📊 القسم 1: تحليل حقول نعم/لا</div>
          <div class="master-section-badge">${d.length} استمارة | ${S}% إيجابي</div>
        </div>
        <div class="master-section-body">

          <!-- تنبيهات حرجة -->
          ${u.length>0?`
            <div class="alert-box">
              <div style="font-size:12px;font-weight:800;color:#E53935;margin-bottom:6px;">🚨 تنبيهات حرجة — مؤشرات تحت 40%</div>
              ${u.map(e=>{const t=y.find(a=>a.fields.some(n=>n.key===e.key));return`
                  <div class="alert-item">
                    <span style="color:#E53935;font-weight:700;">⚠️</span>
                    <span style="flex:1;">${g(e.label)}</span>
                    <span style="font-weight:800;color:#E53935;">${e.positiveRate}%</span>
                    <span style="font-size:9px;color:${o.textMuted};">(${(t==null?void 0:t.icon)||""} ${(t==null?void 0:t.title)||""})</span>
                  </div>
                `}).join("")}
            </div>
          `:`
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px 14px;margin:8px 0;">
              <div style="font-size:12px;font-weight:700;color:#2E7D32;">✅ لا توجد مؤشرات حرجة — جميع المؤشرات فوق 40%</div>
            </div>
          `}

          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${o.success};">
              <div style="font-size:11px;font-weight:800;color:${o.success};margin-bottom:6px;">✅ أعلى 5 مؤشرات</div>
              ${te.map((e,t)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${t+1}.</span>
                  <span style="flex:1;">${g(e.label)}</span>
                  <span style="font-weight:800;color:${o.success};">${e.positiveRate}%</span>
                </div>
              `).join("")}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${o.accent};">
              <div style="font-size:11px;font-weight:800;color:${o.accent};margin-bottom:6px;">❌ أقل 5 مؤشرات</div>
              ${N.map((e,t)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${t+1}.</span>
                  <span style="flex:1;">${g(e.label)}${e.isInverted?' <span style="font-size:8px;color:#1565C0;">(معكوس)</span>':""}</span>
                  <span style="font-weight:800;color:${o.accent};">${e.positiveRate}%</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${V(["القسم","الحقول","النسبة","التقييم","ملاحظة"],y.map(e=>{const t=R(e.avgRate);return[`${e.icon} ${g(e.title)}`,`${e.fields.length}`,`<span style="color:${t.color};font-weight:800;">${e.avgRate}%</span>`,`<span style="color:${t.color};font-weight:700;">${t.emoji} ${t.label}</span>`,e.isInverted?'<span style="font-size:9px;color:#1565C0;font-weight:700;">🔄 نسبة "لا" = إيجابي</span>':"—"]}))}

          <!-- تفاصيل الأقسام -->
          ${y.map(e=>`
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${o.primaryDark};">
                  ${e.icon} ${g(e.title)}
                  ${e.isInverted?'<span style="font-size:9px;color:#1565C0;margin-right:6px;">🔄 معكوس (لا = إيجابي)</span>':""}
                </span>
                <span style="font-size:14px;font-weight:900;color:${R(e.avgRate).color};">${e.avgRate}%</span>
              </div>
              ${e.fields.map(t=>`
                <div class="yesno-field-row">
                  <span style="flex:1;font-size:11px;">${g(t.label)}</span>
                  <span style="flex:1.2;">${ie(t.positiveRate,e.isInverted)}</span>
                  <span style="font-size:9px;color:${o.textMuted};min-width:60px;text-align:left;">
                    ${e.isInverted?`✓${t.no} ✗${t.yes}`:`✓${t.yes} ✗${t.no}`}
                  </span>
                </div>
              `).join("")}
            </div>
          `).join("")}

          <!-- تحليل المحافظات -->
          ${C.length>0?`
            ${B("🗺️","تحليل حسب المحافظة")}
            ${V(["المحافظة","الاستمارات","النسبة الكلية","التقييم"],C.map(e=>{const t=R(e.overallRate);return[g(e.govName),`${e.totalSubs}`,`<span style="color:${t.color};font-weight:800;">${e.overallRate}%</span>`,`<span style="color:${t.color};font-weight:700;">${t.emoji} ${t.label}</span>`]}))}

            <div class="gov-perf-grid">
              ${C.filter(e=>e.totalSubs>0).map(e=>`
                <div class="gov-perf-card">
                  <div style="font-size:12px;font-weight:800;color:${o.primaryDark};margin-bottom:6px;">🏛️ ${g(e.govName)}</div>
                  <div style="font-size:10px;color:${o.textMuted};margin-bottom:8px;">${e.totalSubs} استمارة | النسبة الكلية: <span style="font-weight:800;color:${R(e.overallRate).color};">${e.overallRate}%</span></div>
                  ${e.sectionResults.filter(t=>t.totalAll>0).map(t=>`
                    <div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px;">
                      <span style="min-width:20px;">${t.icon}</span>
                      <span style="flex:1;">${g(t.title)}</span>
                      <span style="font-weight:700;color:${R(t.rate).color};">${t.rate}%</span>
                    </div>
                  `).join("")}
                </div>
              `).join("")}
            </div>
          `:""}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 2: تحديات الإشراف الميداني -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">⚠️ القسم 2: تحديات الإشراف الميداني</div>
          <div class="master-section-badge">${M} استمارة | ${T} تحدي</div>
        </div>
        <div class="master-section-body">
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${b("استمارات مُعبأة",M,"📋",o.primary)}
            ${b("تحديات",T,"⚠️","#E53935")}
            ${b("إجراءات",J,"📋","#1565C0")}
            ${b("توصيات",X,"💡","#2E7D32")}
          </div>

          ${v.length===0?`
            <div style="text-align:center;padding:20px;color:${o.textMuted};font-size:12px;">لا توجد تحديات مُسجّلة</div>
          `:""}

          ${v.map(e=>`
            <div class="challenge-card">
              <div class="challenge-header">
                <div>
                  <div style="font-size:13px;font-weight:800;color:${o.primaryDark};">🏛️ ${g(e.govName)}</div>
                  <div style="font-size:10px;color:${o.textMuted};">📝 ${e.count} استمارة | 👥 ${e.supervisorNames.size} مشرف</div>
                </div>
                <div style="display:flex;gap:8px;font-size:10px;">
                  <span style="background:#FFF5F5;color:#E53935;padding:2px 8px;border-radius:8px;">⚠️ ${e.challenges.length}</span>
                  <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;">📋 ${e.actions.length}</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;">💡 ${e.recommendations.length}</span>
                </div>
              </div>
              <div style="padding:10px 14px;">
                ${O("challenges",e.challenges)}
                ${O("actions",e.actions)}
                ${O("recommendations",e.recommendations)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- التوصيات الذكية -->
      <!-- ═══════════════════════════════════════════ -->
      ${$.length>0?`
        <div class="master-section">
          <div class="master-section-header" style="background: linear-gradient(135deg, #2E7D32, #1B5E20);">
            <div class="master-section-title">💡 التوصيات الذكية</div>
            <div class="master-section-badge">${$.length} توصية</div>
          </div>
          <div class="master-section-body">
            <div class="recommendation-box">
              ${$.map((e,t)=>`
                <div class="recommendation-item">
                  <span style="font-weight:700;color:#2E7D32;">${t+1}.</span> ${g(e)}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `:""}

      ${ue()}
    </body>
    </html>
  `;xe(se,`تحليل_المتابعة_الميدانية_${l}`)}export{B as a,be as b,b as c,V as d,g as e,Fe as f,ve as g,ue as h,we as i,Z as j,Re as k,Ee as l,ze as m,xe as p,fe as r};
