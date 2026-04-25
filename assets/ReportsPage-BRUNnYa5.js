import{j as e}from"./data-vendor-C69A2NXF.js";import{a as Z}from"./react-vendor-CD31eg2q.js";import{c as gt,N as F,O as kt,o as Nt,X as Dt,u as Rt,l as Ft,r as Ct,a9 as Pt,a2 as Et,k as Tt,b0 as Mt,aq as Lt,b1 as At,E as oe,U as de,I as Ze,P as Ee,f as Je,T as et,w as tt,h as at,C as le,i as ne,at as zt,y as Gt,Q as Te,g as pe,R as It,Z as st,ax as $e,e as Re,ab as qt,a as Q,b as fe,d as be,am as Me,x as Ut,b2 as Bt,b3 as Ot,b4 as Wt,b5 as ve,b6 as Ht,b7 as Yt,b8 as Kt,b9 as Qt,ba as Vt,bb as Xt,v as Zt}from"./index-C0iCrd1N.js";import{S as ue}from"./skeleton-D8myjHfU.js";import{P as Jt}from"./progress-Dmo-sM5S.js";import{S as ea,a as ta,b as aa,c as sa,d as rt}from"./select-DYN2ha79.js";import{T as ra,a as ia,b as Le,c as Ae}from"./tabs-CT4TPUvj.js";import{H as la}from"./header-CCuWfReo.js";import{A as _e}from"./activity-f_rD8Y_8.js";import{M as we}from"./map-pin-DVx9AXRP.js";import{C as it}from"./chart-pie-CQFtjFdK.js";import{F as xe}from"./file-text-CMUJyHOt.js";import{F as je}from"./file-down-DMYUZhbg.js";import{T as na}from"./target-OZaAigbx.js";import{C as lt}from"./circle-check-C5bL64vA.js";import{T as pt}from"./trending-up-CYwTJy5l.js";import{T as ht}from"./trending-down-B8-mJpiF.js";import{R as Se,A as oa,C as nt,X as ot,Y as dt,T as ke,L as da,a as ct,i as mt,j as ut,h as ze,B as ca,b as ma}from"./chart-vendor-D3B4tswT.js";import{I as ua}from"./info-cEcG14z9.js";import{A as ga}from"./arrow-up-right-zT3Eo8_U.js";import{L as Ge}from"./loader-circle-DmaBG1pq.js";import"./ui-vendor-YxdKkPR8.js";import"./chevron-down-ZciBR3Py.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pa=gt("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ha=gt("ScrollText",[["path",{d:"M15 12h-5",key:"r7krc0"}],["path",{d:"M15 8h-5",key:"1khuty"}],["path",{d:"M19 17V5a2 2 0 0 0-2-2H4",key:"zz82l3"}],["path",{d:"M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3",key:"1ph1d7"}]]),s={primary:"#1565C0",primaryDark:"#0D47A1",accent:"#E53935",success:"#2E7D32",warning:"#F57F17",info:"#0277BD",bgLight:"#F5F7FA",textDark:"#212121",textMuted:"#616161",border:"#E0E0E0"};function ye(u){const d=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${u.getDate()} ${d[u.getMonth()]} ${u.getFullYear()}`}function fa(u){return u.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function S(u){const d=document.createElement("div");return d.textContent=u,d.innerHTML}function ee(u,d,p){return`
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon">💉</div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${ye(new Date)}</div>
          <div class="meta-item">🕐 ${fa(new Date)}</div>
          ${p?`<div class="meta-item">📊 ${S(p)}</div>`:""}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${S(u)}</h1>
        <p>${S(d)}</p>
      </div>
    </div>
  `}function te(){return`
    <div class="report-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>منصة مشرف EPI — تقرير تلقائي</span>
        <span>سري — للاستخدام الداخلي فقط</span>
        <span class="page-number"></span>
      </div>
    </div>
  `}function f(u,d,p,D,h){return`
    <div class="kpi-card" style="border-top: 4px solid ${D}">
      <div class="kpi-icon">${p}</div>
      <div class="kpi-value" style="color: ${D}">${d}</div>
      <div class="kpi-label">${S(u)}</div>
      ${h?`<div class="kpi-sub">${S(h)}</div>`:""}
    </div>
  `}function E(u,d,p){return`
    <div class="section-title">
      <span class="section-icon">${u}</span>
      <span>${S(d)}</span>
      ${p?`<span class="section-badge">${S(p)}</span>`:""}
    </div>
  `}function I(u,d){return`
    <table class="data-table">
      <thead>
        <tr>${u.map(p=>`<th>${S(p)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${d.map(p=>`<tr>${p.map(D=>`<td>${D}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `}function ce(u,d,p,D){const h=p>0?Math.round(d/p*100):0;return`
    <div class="progress-item">
      <div class="progress-header">
        <span>${S(u)}</span>
        <span class="progress-value">${h}% (${d}/${p})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(h,100)}%; background: ${D}"></div>
      </div>
    </div>
  `}function ae(){return`
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap');
      
      * { margin: 0; padding: 0; box-sizing: border-box; }
      
      @page {
        size: A4;
        margin: 15mm 20mm;
      }
      
      body {
        font-family: 'Cairo', 'Segoe UI', sans-serif;
        direction: rtl;
        color: ${s.textDark};
        background: white;
        font-size: 11px;
        line-height: 1.6;
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
        background: linear-gradient(135deg, ${s.primaryDark}, ${s.primary});
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
        font-size: 14px;
        font-weight: 800;
      }
      .brand-sub {
        font-size: 10px;
        opacity: 0.85;
      }
      .header-meta {
        text-align: left;
        font-size: 9px;
        opacity: 0.9;
      }
      .meta-item { margin-bottom: 2px; }
      .header-title-section {
        text-align: center;
        padding: 10px;
        background: ${s.bgLight};
        border-radius: 8px;
        border-right: 4px solid ${s.primary};
      }
      .header-title-section h1 {
        font-size: 18px;
        font-weight: 800;
        color: ${s.primaryDark};
        margin-bottom: 4px;
      }
      .header-title-section p {
        font-size: 11px;
        color: ${s.textMuted};
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
        border: 1px solid ${s.border};
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .kpi-icon { font-size: 20px; margin-bottom: 4px; }
      .kpi-value { font-size: 22px; font-weight: 900; }
      .kpi-label { font-size: 9px; color: ${s.textMuted}; margin-top: 2px; }
      .kpi-sub { font-size: 8px; color: ${s.textMuted}; margin-top: 1px; }
      
      /* ─── Section Title ─── */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: ${s.primaryDark};
        margin: 18px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${s.primary};
        page-break-after: avoid;
      }
      .section-icon { font-size: 16px; }
      .section-badge {
        font-size: 9px;
        background: ${s.primary};
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
        font-size: 10px;
      }
      .data-table th {
        background: ${s.primary};
        color: white;
        padding: 8px 10px;
        text-align: right;
        font-weight: 600;
        font-size: 9px;
      }
      .data-table td {
        padding: 6px 10px;
        border-bottom: 1px solid ${s.border};
      }
      .data-table tr:nth-child(even) { background: ${s.bgLight}; }
      .data-table tr:hover { background: #E3F2FD; }
      .data-table .num { font-weight: 700; direction: ltr; text-align: center; }
      
      /* ─── Progress ─── */
      .progress-item { margin: 6px 0; }
      .progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        margin-bottom: 3px;
      }
      .progress-value { font-weight: 700; color: ${s.primary}; }
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
        padding: 10px 14px;
        border-radius: 8px;
        margin: 10px 0;
        font-size: 10px;
        border-right: 4px solid;
      }
      .alert-success { background: #E8F5E9; border-color: ${s.success}; color: ${s.success}; }
      .alert-warning { background: #FFF8E1; border-color: ${s.warning}; color: #E65100; }
      .alert-danger { background: #FFEBEE; border-color: ${s.accent}; color: ${s.accent}; }
      .alert-info { background: #E1F5FE; border-color: ${s.info}; color: ${s.info}; }
      
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
        background: linear-gradient(90deg, ${s.primary}, ${s.accent});
        margin-bottom: 6px;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        font-size: 8px;
        color: ${s.textMuted};
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
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: 600;
      }
      .status-ready { background: #E8F5E9; color: ${s.success}; }
      .status-partial { background: #FFF8E1; color: #F57F17; }
      .status-not-ready { background: #FFEBEE; color: ${s.accent}; }
    </style>
  `}async function ba(u){const d=u==null?void 0:u.dateFrom,p=u==null?void 0:u.dateTo,D=d&&p?`من ${d} إلى ${p}`:"آخر 30 يوم",[h,y,i,C,x]=await Promise.allSettled([F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),F.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(1e4),F.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null),F.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),F.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null)]),v=h.status==="fulfilled"?h.value.data||[]:[],b=y.status==="fulfilled"?y.value.data||[]:[],_=i.status==="fulfilled"?i.value.data||[]:[],w=C.status==="fulfilled"?C.value.data||[]:[],T=x.status==="fulfilled"?x.value.data||[]:[],o=b.length,l=b.filter(m=>m.status==="submitted").length,c=b.filter(m=>m.status==="draft").length,t=_.filter(m=>m.is_active).length,g=T.filter(m=>!m.is_resolved).length,r=T.filter(m=>!m.is_resolved&&m.severity==="critical").length,n=v.map(m=>{const k=b.filter(M=>M.governorate_id===m.id),z=_.filter(M=>M.governorate_id===m.id&&M.is_active),P=T.filter(M=>M.governorate_id===m.id&&!M.is_resolved);return{name:m.name_ar,submissions:k.length,submitted:k.filter(M=>M.status==="submitted").length,draft:k.filter(M=>M.status==="draft").length,users:z.length,shortages:P.length,gps:k.filter(M=>M.gps_lat).length,photos:k.filter(M=>M.photos&&M.photos.length>0).length}}).sort((m,k)=>k.submissions-m.submissions),R=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("التقرير المركزي الشامل","نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين",D)}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${E("📊","ملخص المؤشرات الرئيسية","KPIs")}
      <div class="kpi-grid">
        ${f("إجمالي الإرساليات",o,"📋",s.primary,`${l} مرسلة / ${c} مسودة`)}
        ${f("معدل الإرسال",`${o>0?Math.round(l/o*100):0}%`,"✅",s.success)}
        ${f("المحافظات النشطة",v.length,"🏛️",s.info,`${n.filter(m=>m.submissions>0).length} لها بيانات`)}
        ${f("المستخدمين النشطين",t,"👥","#7B1FA2")}
        ${f("النماذج النشطة",w.length,"📝",s.warning)}
        ${f("النواقص المعلقة",g,"⚠️",s.accent,`${r} حرجة`)}
        ${f("تغطية GPS",`${o>0?Math.round(b.filter(m=>m.gps_lat).length/o*100):0}%`,"📍",s.info)}
        ${f("تغطية الصور",`${o>0?Math.round(b.filter(m=>{var k;return((k=m.photos)==null?void 0:k.length)>0}).length/o*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${E("🏛️","أداء المحافظات",`${v.length} محافظة`)}
      ${I(["#","المحافظة","الإرساليات","مرسلة","مسودة","المستخدمين","النواقص","GPS","معدل الإرسال"],n.map((m,k)=>[`${k+1}`,`<strong>${S(m.name)}</strong>`,`<span class="num">${m.submissions}</span>`,`<span class="num">${m.submitted}</span>`,`<span class="num">${m.draft}</span>`,`<span class="num">${m.users}</span>`,`<span class="num">${m.shortages>0?`<span style="color:${s.accent}">${m.shortages}</span>`:"0"}</span>`,`<span class="num">${m.submissions>0?Math.round(m.gps/m.submissions*100):0}%</span>`,`<span class="num">${m.submissions>0?Math.round(m.submitted/m.submissions*100):0}%</span>`]))}

      <!-- ═══ Coverage Analysis ═══ -->
      ${E("📈","تحليل التغطية")}
      ${n.map(m=>ce(m.name,m.submissions,Math.max(...n.map(k=>k.submissions)),m.submissions>0?s.primary:"#BDBDBD")).join("")}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${E("📝","ملخص النماذج")}
      ${I(["#","النموذج","الحملة","الإرساليات","معدل الإنجاز"],w.map((m,k)=>{const z=b.filter(M=>M.form_id===m.id),P=z.filter(M=>M.status==="submitted").length;return[`${k+1}`,S(m.title_ar),m.campaign_type==="polio_campaign"?"💉 شلل أطفال":"🏥 إيصالي تكاملي",`<span class="num">${z.length}</span>`,`<span class="num">${z.length>0?Math.round(P/z.length*100):0}%</span>`]}))}

      <!-- ═══ Shortages Alert ═══ -->
      ${g>0?`
        ${E("⚠️","تنبيهات النواقص",`${g} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${g}</strong> نقص معلق منها <strong>${r}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${I(["النقص","المحافظة","الخطورة","الكمية المطلوبة"],T.filter(m=>!m.is_resolved).slice(0,15).map(m=>{var k;return[S(m.item_name),S(((k=m.governorates)==null?void 0:k.name_ar)||"—"),`<span class="status-badge ${m.severity==="critical"?"status-not-ready":m.severity==="high"?"status-partial":"status-ready"}">${m.severity==="critical"?"حرج":m.severity==="high"?"عالي":m.severity==="medium"?"متوسط":"منخفض"}</span>`,`<span class="num">${m.quantity_needed||"—"}</span>`]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${E("👥","توزيع المستخدمين")}
      <div class="three-col">
        ${["admin","central","governorate","district","data_entry"].map(m=>{const k=_.filter(M=>M.role===m&&M.is_active).length,z={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},P={admin:"🔴",central:"🟣",governorate:"🔵",district:"🟢",data_entry:"⚪"};return f(z[m]||m,k,P[m]||"👤",s.primary)}).join("")}
      </div>

      ${te()}
    </body>
    </html>
  `;se(R)}async function va(u,d){const[p,D,h,y,i]=await Promise.allSettled([F.from("governorates").select("*").eq("id",u).single(),F.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)").eq("governorate_id",u).is("deleted_at",null).order("created_at",{ascending:!1}),F.from("profiles").select("*, districts(name_ar)").eq("governorate_id",u).is("deleted_at",null),F.from("districts").select("*").eq("governorate_id",u).eq("is_active",!0).is("deleted_at",null).order("name_ar"),F.from("supply_shortages").select("*").eq("governorate_id",u).is("deleted_at",null)]),C=p.status==="fulfilled"?p.value.data:null,x=D.status==="fulfilled"?D.value.data||[]:[],v=h.status==="fulfilled"?h.value.data||[]:[],b=y.status==="fulfilled"?y.value.data||[]:[],_=i.status==="fulfilled"?i.value.data||[]:[];if(!C){alert("المحافظة غير موجودة");return}const w=x.length,T=x.filter(t=>t.status==="submitted").length,o=v.filter(t=>t.is_active).length,l=b.map(t=>{const g=x.filter(n=>n.district_id===t.id),r=v.filter(n=>n.district_id===t.id&&n.is_active);return{name:t.name_ar,submissions:g.length,submitted:g.filter(n=>n.status==="submitted").length,users:r.length,gps:g.filter(n=>n.gps_lat).length}}).sort((t,g)=>g.submissions-t.submissions),c=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${S(C.name_ar)} — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee(`تقرير محافظة ${C.name_ar}`,`تحليل شامل لأداء المحافظة — ${b.length} مديرية`,d!=null&&d.dateFrom?`من ${d.dateFrom} إلى ${d.dateTo}`:void 0)}

      ${E("📊","مؤشرات المحافظة")}
      <div class="kpi-grid">
        ${f("الإرساليات",w,"📋",s.primary,`${T} مرسلة`)}
        ${f("معدل الإرسال",`${w>0?Math.round(T/w*100):0}%`,"✅",s.success)}
        ${f("المديريات",b.length,"🏘️",s.info,`${l.filter(t=>t.submissions>0).length} نشطة`)}
        ${f("المستخدمين",o,"👥","#7B1FA2")}
        ${f("النواقص",_.filter(t=>!t.is_resolved).length,"⚠️",s.accent)}
        ${f("تغطية GPS",`${w>0?Math.round(x.filter(t=>t.gps_lat).length/w*100):0}%`,"📍",s.info)}
      </div>

      ${E("🏘️","أداء المديريات",`${b.length} مديرية`)}
      ${I(["#","المديرية","الإرساليات","مرسلة","المستخدمين","GPS","معدل الإنجاز"],l.map((t,g)=>[`${g+1}`,`<strong>${S(t.name)}</strong>`,`<span class="num">${t.submissions}</span>`,`<span class="num">${t.submitted}</span>`,`<span class="num">${t.users}</span>`,`<span class="num">${t.submissions>0?Math.round(t.gps/t.submissions*100):0}%</span>`,`<span class="num">${t.submissions>0?Math.round(t.submitted/t.submissions*100):0}%</span>`]))}

      ${E("📈","مخطط أداء المديريات")}
      ${l.map(t=>ce(t.name,t.submissions,Math.max(...l.map(g=>g.submissions),1),s.primary)).join("")}

      ${E("👥","المستخدمون في المحافظة")}
      ${I(["#","الاسم","الدور","المديرية","آخر دخول"],v.filter(t=>t.is_active).map((t,g)=>{var r;return[`${g+1}`,S(t.full_name),t.role==="governorate"?"🔵 محافظة":t.role==="district"?"🟢 مديرية":"⚪ إدخال بيانات",S(((r=t.districts)==null?void 0:r.name_ar)||"—"),t.last_login?new Date(t.last_login).toLocaleDateString("ar-SA"):"—"]}))}

      ${_.filter(t=>!t.is_resolved).length>0?`
        ${E("⚠️","النواقص المعلقة")}
        ${I(["النقص","الخطورة","الكمية","ملاحظات"],_.filter(t=>!t.is_resolved).map(t=>[S(t.item_name),`<span class="status-badge ${t.severity==="critical"?"status-not-ready":"status-partial"}">${t.severity==="critical"?"حرج":"عالي"}</span>`,`<span class="num">${t.quantity_needed||"—"}</span>`,S(t.notes||"—")]))}
      `:""}

      ${te()}
    </body>
    </html>
  `;se(c,`تقرير_محافظة_${C.name_ar}`)}async function xa(u,d){const[p,D,h]=await Promise.allSettled([F.from("forms").select("*").eq("id",u).single(),F.from("form_submissions").select("*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").eq("form_id",u).is("deleted_at",null).order("created_at",{ascending:!1}),F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),y=p.status==="fulfilled"?p.value.data:null,i=D.status==="fulfilled"?D.value.data||[]:[],C=h.status==="fulfilled"?h.value.data||[]:[];if(!y){alert("النموذج غير موجود");return}const x=i.length,v=i.filter(r=>r.status==="submitted").length,b=i.filter(r=>r.status==="draft").length;let _={};try{_=typeof y.schema=="string"?JSON.parse(y.schema):y.schema}catch{}const w=(_==null?void 0:_.sections)||[],T=w.flatMap(r=>r.fields||[]),o=C.map(r=>{const n=i.filter(R=>R.governorate_id===r.id);return{name:r.name_ar,total:n.length,submitted:n.filter(R=>R.status==="submitted").length,draft:n.filter(R=>R.status==="draft").length}}).filter(r=>r.total>0).sort((r,n)=>n.total-r.total),l=T.map(r=>{const n=r.name||r.id||r.label_ar;let R=0,m=0;return i.forEach(k=>{var P;const z=(P=k.data)==null?void 0:P[n];z!=null&&z!==""&&z!==0?R++:m++}),{label:r.label_ar||n,type:r.type,filled:R,empty:m,rate:x>0?Math.round(R/x*100):0}});i.forEach(r=>{r.created_at.split("T")[0]});const c=Array.from({length:24},(r,n)=>({hour:`${n.toString().padStart(2,"0")}:00`,count:i.filter(R=>new Date(R.created_at).getHours()===n).length})),t=y.campaign_type==="polio_campaign"?"💉 حملة شلل الأطفال":"🏥 النشاط الإيصالي التكاملي",g=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${S(y.title_ar)} — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("تقرير تحليل النموذج",y.title_ar,t)}

      ${E("📊","ملخص النموذج")}
      <div class="kpi-grid">
        ${f("إجمالي الإرساليات",x,"📋",s.primary)}
        ${f("مرسلة",v,"✅",s.success,`${x>0?Math.round(v/x*100):0}%`)}
        ${f("مسودة",b,"📝",s.warning,`${x>0?Math.round(b/x*100):0}%`)}
        ${f("المحافظات المشمولة",o.length,"🏛️",s.info)}
        ${f("الحقول",T.length,"🔤","#7B1FA2")}
        ${f("الأقسام",w.length,"📂","#00897B")}
        ${f("تغطية GPS",`${x>0?Math.round(i.filter(r=>r.gps_lat).length/x*100):0}%`,"📍",s.info)}
        ${f("تغطية الصور",`${x>0?Math.round(i.filter(r=>{var n;return((n=r.photos)==null?void 0:n.length)>0}).length/x*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Description ═══ -->
      ${y.description_ar?`
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${S(y.description_ar)}
        </div>
      `:""}

      <!-- ═══ Settings ═══ -->
      ${E("⚙️","إعدادات النموذج")}
      <div class="two-col">
        <div class="alert-box alert-info">
          <strong>GPS إلزامي:</strong> ${y.requires_gps?"نعم ✅":"لا ❌"}
        </div>
        <div class="alert-box alert-info">
          <strong>صورة إلزامية:</strong> ${y.requires_photo?"نعم ✅":"لا ❌"}
        </div>
      </div>

      <!-- ═══ Governorate Breakdown ═══ -->
      <div class="page-break"></div>
      ${E("🏛️","الإرساليات حسب المحافظة",`${o.length} محافظة`)}
      ${I(["#","المحافظة","الإجمالي","مرسلة","مسودة","معدل الإرسال"],o.map((r,n)=>[`${n+1}`,`<strong>${S(r.name)}</strong>`,`<span class="num">${r.total}</span>`,`<span class="num">${r.submitted}</span>`,`<span class="num">${r.draft}</span>`,`<span class="num">${r.total>0?Math.round(r.submitted/r.total*100):0}%</span>`]))}

      ${o.map(r=>ce(r.name,r.total,Math.max(...o.map(n=>n.total),1),s.primary)).join("")}

      <!-- ═══ Field Analysis ═══ -->
      ${l.length>0?`
        ${E("🔤","تحليل الحقول",`${l.length} حقل`)}
        ${I(["#","الحقل","النوع","مُملأ","فارغ","نسبة التعبئة"],l.map((r,n)=>[`${n+1}`,`<strong>${S(r.label)}</strong>`,r.type||"—",`<span class="num">${r.filled}</span>`,`<span class="num" style="color:${r.empty>0?s.accent:s.success}">${r.empty}</span>`,`<span class="num" style="color:${r.rate>=80?s.success:r.rate>=50?s.warning:s.accent}">${r.rate}%</span>`]))}
        ${l.map(r=>ce(r.label,r.filled,x,r.rate>=80?s.success:r.rate>=50?s.warning:s.accent)).join("")}
      `:""}

      <!-- ═══ Sections Analysis ═══ -->
      ${w.length>0?`
        ${E("📂","تحليل الأقسام")}
        ${I(["#","القسم","عدد الحقول"],w.map((r,n)=>[`${n+1}`,S(r.title_ar||`قسم ${n+1}`),`<span class="num">${(r.fields||[]).length}</span>`]))}
      `:""}

      <!-- ═══ Time Analysis ═══ -->
      ${E("⏰","تحليل التوقيت")}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${i.length>0?new Date(i[i.length-1].created_at).toLocaleDateString("ar-SA"):"—"} |
        <strong>آخر إرسالية:</strong> ${i.length>0?new Date(i[0].created_at).toLocaleDateString("ar-SA"):"—"}
      </div>

      ${I(["الساعة","عدد الإرساليات"],c.filter(r=>r.count>0).map(r=>[r.hour,`<span class="num">${r.count}</span>`]))}

      <!-- ═══ Recent Submissions ═══ -->
      ${E("📋","آخر الإرساليات","آخر 10")}
      ${I(["#","المحافظة","المديرية","المُرسل","الحالة","التاريخ"],i.slice(0,10).map((r,n)=>{var R,m,k;return[`${n+1}`,S(((R=r.governorates)==null?void 0:R.name_ar)||"—"),S(((m=r.districts)==null?void 0:m.name_ar)||"—"),S(((k=r.profiles)==null?void 0:k.full_name)||"—"),`<span class="status-badge ${r.status==="submitted"?"status-ready":"status-partial"}">${r.status==="submitted"?"مرسلة":"مسودة"}</span>`,new Date(r.created_at).toLocaleDateString("ar-SA")]}))}

      ${te()}
    </body>
    </html>
  `;se(g,`تحليل_${y.title_ar}`)}function se(u,d){const p=window.open("","_blank");if(!p){alert("يرجى السماح بالنوافذ المنبثقة لتصدير التقرير");return}p.document.write(u),p.document.close(),setTimeout(()=>{p.print()},500)}async function $a(u){const[d,p,D]=await Promise.allSettled([F.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}),F.from("form_submissions").select("*, forms(title_ar), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(2e4),F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),h=d.status==="fulfilled"?d.value.data||[]:[],y=p.status==="fulfilled"?p.value.data||[]:[];D.status==="fulfilled"&&D.value.data;const i=["data_entry","district","governorate"],x=h.filter(t=>i.includes(t.role)&&t.is_active).map(t=>{const g=y.filter(Y=>Y.submitted_by===t.id),r=g.filter(Y=>Y.status==="submitted").length,n=g.filter(Y=>Y.status==="draft").length,R=g.filter(Y=>Y.gps_lat).length,m=g.filter(Y=>{var V;return((V=Y.photos)==null?void 0:V.length)>0}).length,k=g.length>0?g[0].created_at:null,z=t.last_login,P=k?Math.floor((Date.now()-new Date(k).getTime())/864e5):999,M=z?Math.floor((Date.now()-new Date(z).getTime())/864e5):999;let O=0;return g.length>0&&(O+=30),r>0&&(O+=25),R>0&&(O+=15),m>0&&(O+=15),P<=3?O+=15:P<=7?O+=10:P<=14&&(O+=5),{...t,totalSubs:g.length,submitted:r,draft:n,withGps:R,withPhotos:m,lastSub:k,lastLogin:z,daysSinceLastSub:P,daysSinceLastLogin:M,gpsRate:g.length>0?Math.round(R/g.length*100):0,photoRate:g.length>0?Math.round(m/g.length*100):0,score:O}}).sort((t,g)=>g.score-t.score),v=x.filter(t=>t.daysSinceLastSub<=7).length,b=x.filter(t=>t.daysSinceLastSub>14).length,_=x.length>0?Math.round(x.reduce((t,g)=>t+g.score,0)/x.length):0,w={data_entry:"إدخال بيانات",district:"مديرية",governorate:"محافظة"},T={data_entry:"⚪",district:"🟢",governorate:"🔵"};function o(t){return t>=70?s.success:t>=40?s.warning:s.accent}function l(t){return t>=80?"ممتاز":t>=60?"جيد":t>=40?"متوسط":t>=20?"ضعيف":"غير نشط"}const c=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أداء المشرفين — EPI Supervisor</title>
      ${ae()}
      <style>
        .score-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          color: white;
        }
        .activity-dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          margin-left: 4px;
        }
        .supervisor-card {
          border: 1px solid ${s.border};
          border-radius: 8px;
          padding: 12px;
          margin: 8px 0;
          background: white;
          page-break-inside: avoid;
        }
        .supervisor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid ${s.border};
        }
        .supervisor-name { font-size: 12px; font-weight: 700; }
        .supervisor-meta { font-size: 9px; color: ${s.textMuted}; }
        .supervisor-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
        }
        .stat-box {
          background: ${s.bgLight};
          border-radius: 6px;
          padding: 6px;
        }
        .stat-value { font-size: 16px; font-weight: 800; }
        .stat-label { font-size: 8px; color: ${s.textMuted}; }
      </style>
    </head>
    <body>
      ${ee("تقرير أداء المشرفين الميدانيين","تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية")}

      ${E("📊","ملخص الأداء")}
      <div class="kpi-grid">
        ${f("إجمالي المشرفين",x.length,"👥",s.primary)}
        ${f("نشط (آخر 7 أيام)",v,"🟢",s.success,`${x.length>0?Math.round(v/x.length*100):0}%`)}
        ${f("غير نشط (+14 يوم)",b,"🔴",s.accent,`${x.length>0?Math.round(b/x.length*100):0}%`)}
        ${f("متوسط الأداء",`${_}/100`,"📊",_>=60?s.success:s.warning)}
      </div>

      ${E("🏆","ترتيب المشرفين حسب الأداء",`${x.length} مشرف`)}
      ${I(["#","المشرف","الدور","المحافظة/المديرية","الإرساليات","مرسلة","GPS","النشاط","التقييم"],x.map((t,g)=>{var r,n;return[`${g+1}`,`<strong>${S(t.full_name)}</strong>`,`${T[t.role]||"👤"} ${w[t.role]||t.role}`,S(((r=t.governorates)==null?void 0:r.name_ar)||((n=t.districts)==null?void 0:n.name_ar)||"—"),`<span class="num">${t.totalSubs}</span>`,`<span class="num">${t.submitted}</span>`,`<span class="num">${t.gpsRate}%</span>`,t.daysSinceLastSub<=3?'<span class="activity-dot" style="background:#4CAF50"></span> نشط':t.daysSinceLastSub<=7?'<span class="activity-dot" style="background:#FF9800"></span> متوسط':t.daysSinceLastSub<=14?'<span class="activity-dot" style="background:#F44336"></span> ضعيف':'<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',`<span class="score-badge" style="background:${o(t.score)}">${t.score} — ${l(t.score)}</span>`]}))}

      <!-- ═══ Top Performers ═══ -->
      ${x.filter(t=>t.score>=60).length>0?`
        ${E("⭐","المشرفون المتميزون",`${x.filter(t=>t.score>=60).length} متميز`)}
        ${x.filter(t=>t.score>=60).slice(0,10).map(t=>{var g,r;return`
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${T[t.role]} ${S(t.full_name)}</div>
                <div class="supervisor-meta">${w[t.role]} — ${S(((g=t.governorates)==null?void 0:g.name_ar)||((r=t.districts)==null?void 0:r.name_ar)||"—")}</div>
              </div>
              <span class="score-badge" style="background:${o(t.score)}">${t.score} ${l(t.score)}</span>
            </div>
            <div class="supervisor-stats">
              <div class="stat-box">
                <div class="stat-value" style="color:${s.primary}">${t.totalSubs}</div>
                <div class="stat-label">إجمالي</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${s.success}">${t.submitted}</div>
                <div class="stat-label">مرسلة</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${s.info}">${t.gpsRate}%</div>
                <div class="stat-label">GPS</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:#7B1FA2">${t.photoRate}%</div>
                <div class="stat-label">صور</div>
              </div>
            </div>
          </div>
        `}).join("")}
      `:""}

      <!-- ═══ Inactive Supervisors ═══ -->
      ${x.filter(t=>t.daysSinceLastSub>14).length>0?`
        ${E("🚨","مشرفون غير نشطين — يحتاجون متابعة",`${x.filter(t=>t.daysSinceLastSub>14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${x.filter(t=>t.daysSinceLastSub>14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${I(["#","المشرف","الدور","المحافظة","آخر إرسالية","منذ يوم"],x.filter(t=>t.daysSinceLastSub>14).map((t,g)=>{var r,n;return[`${g+1}`,`<strong>${S(t.full_name)}</strong>`,w[t.role]||t.role,S(((r=t.governorates)==null?void 0:r.name_ar)||((n=t.districts)==null?void 0:n.name_ar)||"—"),t.lastSub?new Date(t.lastSub).toLocaleDateString("ar-SA"):"لم يرسل أبداً",`<span style="color:${s.accent};font-weight:700">${t.daysSinceLastSub} يوم</span>`]}))}
      `:""}

      ${te()}
    </body>
    </html>
  `;se(c)}async function ya(){const[u,d,p,D]=await Promise.allSettled([F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),F.from("districts").select("*, governorates(name_ar)").eq("is_active",!0).is("deleted_at",null),F.from("form_submissions").select("governorate_id, district_id, created_at").is("deleted_at",null),F.from("profiles").select("governorate_id, district_id, role, is_active").is("deleted_at",null)]),h=u.status==="fulfilled"?u.value.data||[]:[],y=d.status==="fulfilled"?d.value.data||[]:[],i=p.status==="fulfilled"?p.value.data||[]:[],C=D.status==="fulfilled"?D.value.data||[]:[],x=h.map(o=>{const l=i.filter(R=>R.governorate_id===o.id),c=y.filter(R=>R.governorate_id===o.id),t=c.filter(R=>i.some(m=>m.district_id===R.id)),g=C.filter(R=>R.governorate_id===o.id&&R.is_active),r=l.length>0?l.sort((R,m)=>new Date(m.created_at).getTime()-new Date(R.created_at).getTime())[0].created_at:null,n=r?Math.floor((Date.now()-new Date(r).getTime())/864e5):999;return{name:o.name_ar,id:o.id,totalDistricts:c.length,coveredDistricts:t.length,gapDistricts:c.length-t.length,submissions:l.length,users:g.length,lastSub:r,daysSinceLast:n,coverageRate:c.length>0?Math.round(t.length/c.length*100):0}}),v=x.filter(o=>o.coverageRate===100),b=x.filter(o=>o.coverageRate>0&&o.coverageRate<100),_=x.filter(o=>o.coverageRate===0),w=y.filter(o=>!i.some(l=>l.district_id===o.id)),T=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الفجوة التغطية — EPI Supervisor</title>
      ${ae()}
      <style>
        .gap-card {
          border: 1px solid ${s.border};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 6px 0;
          page-break-inside: avoid;
        }
        .gap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .coverage-bar {
          height: 10px;
          background: #E0E0E0;
          border-radius: 5px;
          overflow: hidden;
          margin: 4px 0;
        }
        .coverage-fill {
          height: 100%;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      ${ee("تقرير الفجوة في التغطية","تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون")}

      ${E("📊","نظرة عامة على التغطية")}
      <div class="kpi-grid">
        ${f("المحافظات",h.length,"🏛️",s.primary)}
        ${f("مغطاة بالكامل",v.length,"✅",s.success)}
        ${f("غطاء جزئي",b.length,"⚠️",s.warning)}
        ${f("بدون تغطية",_.length,"🔴",s.accent)}
        ${f("المديريات",y.length,"🏘️",s.info)}
        ${f("مديريات بلا بيانات",w.length,"🚨",s.accent)}
        ${f("نسبة التغطية",`${h.length>0?Math.round((h.length-_.length)/h.length*100):0}%`,"📈",s.primary)}
        ${f("المستخدمين",C.filter(o=>o.is_active).length,"👥","#7B1FA2")}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${_.length>0?`
        ${E("🚨","محافظات بدون أي تغطية",`${_.length} محافظة`)}
        <div class="alert-box alert-danger">
          <strong>تنبيه:</strong> يوجد ${_.length} محافظة لم تسجل أي إرسالية. هذه المناطق تحتاج تدخل فوري.
        </div>
        ${_.map(o=>`
          <div class="gap-card" style="border-right: 4px solid ${s.accent}">
            <div class="gap-header">
              <strong>🔴 ${S(o.name)}</strong>
              <span style="color:${s.accent};font-weight:700">${o.totalDistricts} مديرية — 0 إرسالية</span>
            </div>
            <div style="font-size:10px;color:${s.textMuted}">
              ${o.users>0?`${o.users} مستخدم مسجل`:"لا يوجد مستخدمين"}
              ${o.lastSub?` — آخر نشاط: ${new Date(o.lastSub).toLocaleDateString("ar-SA")}`:" — لم يسبق العمل هنا"}
            </div>
          </div>
        `).join("")}
      `:`
        <div class="alert-box alert-success">✅ جميع المحافظات لها تغطية على الأقل جزئية</div>
      `}

      <!-- ═══ Partial Coverage ═══ -->
      ${b.length>0?`
        <div class="page-break"></div>
        ${E("⚠️","محافظات بتغطية جزئية",`${b.length} محافظة`)}
        ${b.map(o=>`
          <div class="gap-card" style="border-right: 4px solid ${s.warning}">
            <div class="gap-header">
              <strong>🟡 ${S(o.name)}</strong>
              <span>${o.coveredDistricts}/${o.totalDistricts} مديرية (${o.coverageRate}%)</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width:${o.coverageRate}%;background:${o.coverageRate>=60?s.success:s.warning}"></div>
            </div>
            <div style="font-size:9px;color:${s.textMuted};margin-top:4px">
              ${o.submissions} إرسالية — ${o.users} مستخدم — مديريات بلا بيانات: ${o.gapDistricts}
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ All Governorates Summary ═══ -->
      ${E("📋","جدول التغطية الشامل")}
      ${I(["#","المحافظة","المديريات","مغطاة","فجوة","الإرساليات","المستخدمين","نسبة التغطية"],x.map((o,l)=>[`${l+1}`,`<strong>${S(o.name)}</strong>`,`<span class="num">${o.totalDistricts}</span>`,`<span class="num">${o.coveredDistricts}</span>`,`<span class="num" style="color:${o.gapDistricts>0?s.accent:s.success}">${o.gapDistricts}</span>`,`<span class="num">${o.submissions}</span>`,`<span class="num">${o.users}</span>`,`<span class="num" style="color:${o.coverageRate>=80?s.success:o.coverageRate>=40?s.warning:s.accent}">${o.coverageRate}%</span>`]))}

      ${x.map(o=>ce(o.name,o.coveredDistricts,o.totalDistricts,o.coverageRate>=80?s.success:o.coverageRate>=40?s.warning:s.accent)).join("")}

      <!-- ═══ Districts Without Data ═══ -->
      ${w.length>0?`
        <div class="page-break"></div>
        ${E("🏘️","مديريات بدون أي بيانات",`${w.length} مديرية`)}
        ${I(["#","المديرية","المحافظة"],w.map((o,l)=>{var c;return[`${l+1}`,S(o.name_ar),S(((c=o.governorates)==null?void 0:c.name_ar)||"—")]}))}
      `:""}

      ${te()}
    </body>
    </html>
  `;se(T)}async function _a(){const[u,d,p]=await Promise.allSettled([F.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").is("deleted_at",null).limit(2e4),F.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),D=u.status==="fulfilled"?u.value.data||[]:[],h=d.status==="fulfilled"?d.value.data||[]:[],y=p.status==="fulfilled"?p.value.data||[]:[],C=[{id:"polio_campaign",label:"حملة شلل الأطفال",icon:"💉",color:"#1565C0"},{id:"integrated_activity",label:"النشاط الإيصالي التكاملي",icon:"🏥",color:"#2E7D32"}].map(v=>{const b=h.filter(r=>r.campaign_type===v.id),_=b.map(r=>r.id),w=D.filter(r=>_.includes(r.form_id)),T=w.filter(r=>r.status==="submitted").length,o=w.filter(r=>r.status==="draft").length,l=w.filter(r=>r.gps_lat).length,c=w.filter(r=>{var n;return((n=r.photos)==null?void 0:n.length)>0}).length,t=new Set(w.map(r=>r.governorate_id).filter(Boolean)),g=y.map(r=>({name:r.name_ar,submissions:w.filter(n=>n.governorate_id===r.id).length,submitted:w.filter(n=>n.governorate_id===r.id&&n.status==="submitted").length}));return{...v,forms:b.length,totalSubs:w.length,submitted:T,draft:o,withGps:l,withPhotos:c,govsWithData:t.size,gpsRate:w.length>0?Math.round(l/w.length*100):0,photoRate:w.length>0?Math.round(c/w.length*100):0,submitRate:w.length>0?Math.round(T/w.length*100):0,govBreakdown:g}}),x=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مقارنة الحملات — EPI Supervisor</title>
      ${ae()}
      <style>
        .campaign-card {
          border: 1px solid ${s.border};
          border-radius: 10px;
          padding: 16px;
          margin: 10px 0;
          page-break-inside: avoid;
        }
        .campaign-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid;
        }
        .campaign-icon { font-size: 28px; }
        .campaign-name { font-size: 15px; font-weight: 800; }
        .vs-divider {
          text-align: center;
          font-size: 18px;
          font-weight: 900;
          color: ${s.textMuted};
          margin: 14px 0;
          position: relative;
        }
        .vs-divider::before, .vs-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 2px;
          background: ${s.border};
        }
        .vs-divider::before { right: 0; }
        .vs-divider::after { left: 0; }
      </style>
    </head>
    <body>
      ${ee("تقرير مقارنة الحملات","مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي")}

      ${C.map((v,b)=>`
        ${b===1?'<div class="vs-divider">VS</div>':""}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${v.color}">
            <span class="campaign-icon">${v.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${v.color}">${S(v.label)}</div>
              <div style="font-size:10px;color:${s.textMuted}">${v.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${f("الإرساليات",v.totalSubs,"📋",v.color)}
            ${f("مرسلة",v.submitted,"✅",s.success,`${v.submitRate}%`)}
            ${f("مسودة",v.draft,"📝",s.warning)}
            ${f("GPS",`${v.gpsRate}%`,"📍",s.info)}
            ${f("صور",`${v.photoRate}%`,"📷","#00897B")}
            ${f("محافظات",`${v.govsWithData}/${y.length}`,"🏛️",v.color)}
          </div>
          ${I(["#","المحافظة","الإرساليات","مرسلة","معدل الإرسال"],v.govBreakdown.sort((_,w)=>w.submissions-_.submissions).map((_,w)=>[`${w+1}`,S(_.name),`<span class="num">${_.submissions}</span>`,`<span class="num">${_.submitted}</span>`,`<span class="num">${_.submissions>0?Math.round(_.submitted/_.submissions*100):0}%</span>`]))}
        </div>
      `).join("")}

      ${te()}
    </body>
    </html>
  `;se(x)}async function wa(){const u=new Date,d=u.toISOString().split("T")[0],p=new Date(u.getTime()-864e5).toISOString().split("T")[0],[D,h,y]=await Promise.allSettled([F.from("form_submissions").select("*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)").gte("created_at",`${d}T00:00:00`).is("deleted_at",null).order("created_at",{ascending:!1}),F.from("profiles").select("*").is("deleted_at",null),F.from("notifications").select("*").gte("created_at",`${d}T00:00:00`).order("created_at",{ascending:!1})]),i=D.status==="fulfilled"?D.value.data||[]:[],C=h.status==="fulfilled"?h.value.data||[]:[],x=y.status==="fulfilled"?y.value.data||[]:[],[v]=await Promise.allSettled([F.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",`${p}T00:00:00`).lt("created_at",`${d}T00:00:00`).is("deleted_at",null)]),b=v.status==="fulfilled"&&v.value.count||0,_=i.filter(r=>r.status==="submitted").length,w=i.filter(r=>r.status==="draft").length,T=new Set(i.map(r=>r.submitted_by)).size,o=C.filter(r=>r.is_active).length,l=Array.from({length:24},(r,n)=>({hour:`${n.toString().padStart(2,"0")}:00`,count:i.filter(R=>new Date(R.created_at).getHours()===n).length})),c=i.length-b,t=b>0?Math.round(c/b*100):i.length>0?100:0,g=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${ye(u)}</title>
      ${ae()}
    </head>
    <body>
      ${ee("تقرير النشاط اليومي",`نشاط اليوم — ${ye(u)}`)}

      ${E("📊","مؤشرات اليوم")}
      <div class="kpi-grid">
        ${f("إرساليات اليوم",i.length,"📋",s.primary,`أمس: ${b} (${c>=0?"+":""}${t}%)`)}
        ${f("مرسلة",_,"✅",s.success)}
        ${f("مسودة",w,"📝",s.warning)}
        ${f("مشرفين نشطين",T,"👥","#7B1FA2",`من ${o}`)}
        ${f("إشعارات",x.length,"🔔",s.info)}
        ${f("مقارنة بأمس",`${c>=0?"📈":"📉"} ${Math.abs(t)}%`,c>=0?"📈":"📉",c>=0?s.success:s.accent)}
      </div>

      ${E("⏰","النشاط بالساعة")}
      ${I(["الساعة","عدد الإرساليات","النشاط"],l.filter(r=>r.count>0).map(r=>[`<strong>${r.hour}</strong>`,`<span class="num">${r.count}</span>`,"█".repeat(Math.min(r.count,20))]))}

      ${i.length>0?`
        ${E("📋","إرساليات اليوم",`${i.length} إرسالية`)}
        ${I(["#","الوقت","النموذج","المُرسل","المحافظة","الحالة"],i.slice(0,30).map((r,n)=>{var R,m,k;return[`${n+1}`,new Date(r.created_at).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"}),S(((R=r.forms)==null?void 0:R.title_ar)||"—"),S(((m=r.profiles)==null?void 0:m.full_name)||"—"),S(((k=r.governorates)==null?void 0:k.name_ar)||"—"),`<span class="status-badge ${r.status==="submitted"?"status-ready":"status-partial"}">${r.status==="submitted"?"مرسلة":"مسودة"}</span>`]}))}
      `:`
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${T<o?`
        ${E("🚨","مشرفين لم يرسلوا اليوم")}
        <div class="alert-box alert-danger">
          ${o-T} من ${o} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      `:`
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${te()}
    </body>
    </html>
  `;se(g)}async function ja(){const[u,d]=await Promise.allSettled([F.from("form_submissions").select("*, forms(title_ar, schema), governorates(name_ar)").is("deleted_at",null).limit(2e4),F.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),p=u.status==="fulfilled"?u.value.data||[]:[],D=d.status==="fulfilled"?d.value.data||[]:[],h=p.length,y=p.filter(l=>l.gps_lat).length,i=h-y,C=p.filter(l=>{var c;return((c=l.photos)==null?void 0:c.length)>0}).length,x=h-C,v=p.filter(l=>l.notes&&l.notes.trim()).length,b=p.filter(l=>l.governorate_id).length,_=h-b,w=D.map(l=>{const c=p.filter(k=>k.form_id===l.id),t=c.filter(k=>k.gps_lat).length,g=c.filter(k=>{var z;return((z=k.photos)==null?void 0:z.length)>0}).length,r=c.filter(k=>k.governorate_id).length;let n={};try{n=typeof l.schema=="string"?JSON.parse(l.schema):l.schema}catch{}const m=((n==null?void 0:n.sections)||[]).flatMap(k=>k.fields||[]).map(k=>{const z=k.name||k.id||k.label_ar,P=c.filter(M=>{var Y;const O=(Y=M.data)==null?void 0:Y[z];return O!=null&&O!==""&&O!==0}).length;return{label:k.label_ar||z,type:k.type,filled:P,total:c.length,rate:c.length>0?Math.round(P/c.length*100):0}});return{name:l.title_ar,total:c.length,gpsRate:c.length>0?Math.round(t/c.length*100):0,photoRate:c.length>0?Math.round(g/c.length*100):0,govRate:c.length>0?Math.round(r/c.length*100):0,fieldCompleteness:m,overallQuality:c.length>0?Math.round((t+g+r)/(c.length*3)*100):0}});function T(l){return l>=80?s.success:l>=50?s.warning:s.accent}const o=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("تقرير جودة البيانات","تحليل شامل لاكتمال وجودة البيانات المدخلة")}

      ${E("📊","مؤشرات جودة البيانات")}
      <div class="kpi-grid">
        ${f("إجمالي الإرساليات",h,"📋",s.primary)}
        ${f("مع GPS",`${Math.round(y/h*100)}%`,"📍",T(Math.round(y/h*100)),`${y}/${h}`)}
        ${f("مع صور",`${Math.round(C/h*100)}%`,"📷",T(Math.round(C/h*100)),`${C}/${h}`)}
        ${f("مع محافظة",`${Math.round(b/h*100)}%`,"🏛️",T(Math.round(b/h*100)),`${b}/${h}`)}
        ${f("بلا GPS",i,"⚠️",s.accent)}
        ${f("بلا صور",x,"⚠️",s.accent)}
        ${f("بلا محافظة",_,"⚠️",s.accent)}
        ${f("ملاحظات مكتوبة",v,"📝",s.info)}
      </div>

      ${i>0?`<div class="alert-box alert-warning">⚠️ ${i} إرسالية (${Math.round(i/h*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>`:""}
      ${_>0?`<div class="alert-box alert-danger">🚨 ${_} إرسالية (${Math.round(_/h*100)}%) بلا محافظة — يجب إصلاحها</div>`:""}

      ${E("📝","جودة البيانات حسب النموذج")}
      ${I(["#","النموذج","الإرساليات","GPS","صور","محافظة","الجودة الإجمالية"],w.map((l,c)=>[`${c+1}`,`<strong>${S(l.name)}</strong>`,`<span class="num">${l.total}</span>`,`<span class="num" style="color:${T(l.gpsRate)}">${l.gpsRate}%</span>`,`<span class="num" style="color:${T(l.photoRate)}">${l.photoRate}%</span>`,`<span class="num" style="color:${T(l.govRate)}">${l.govRate}%</span>`,`<span class="score-badge" style="background:${T(l.overallQuality)}">${l.overallQuality}%</span>`]))}

      ${w.filter(l=>l.fieldCompleteness.length>0).map(l=>`
        ${E("🔤",`تحليل حقول: ${l.name}`)}
        ${I(["الحقل","النسبة","مُملأ/الإجمالي"],l.fieldCompleteness.sort((c,t)=>c.rate-t.rate).map(c=>[S(c.label),`<span style="color:${T(c.rate)};font-weight:700">${c.rate}%</span>`,`<span class="num">${c.filled}/${c.total}</span>`]))}
        ${l.fieldCompleteness.map(c=>ce(c.label,c.filled,c.total,T(c.rate))).join("")}
      `).join("")}

      ${te()}
    </body>
    </html>
  `;se(o)}async function Sa(){const[u,d]=await Promise.allSettled([F.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null).order("created_at",{ascending:!1}),F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),p=u.status==="fulfilled"?u.value.data||[]:[],D=d.status==="fulfilled"?d.value.data||[]:[],h=p.filter(l=>!l.is_resolved),y=p.filter(l=>l.is_resolved),i=h.filter(l=>l.severity==="critical"),C=h.filter(l=>l.severity==="high"),x=h.filter(l=>l.severity==="medium"),v=h.filter(l=>l.severity==="low"),b=D.map(l=>{const c=p.filter(g=>g.governorate_id===l.id),t=c.filter(g=>!g.is_resolved);return{name:l.name_ar,total:c.length,unresolved:t.length,critical:t.filter(g=>g.severity==="critical").length,high:t.filter(g=>g.severity==="high").length}}).filter(l=>l.total>0).sort((l,c)=>c.unresolved-l.unresolved),_={};h.forEach(l=>{const c=l.item_category||"أخرى";_[c]=(_[c]||0)+1});const w={critical:"🔴 حرج",high:"🟠 عالي",medium:"🟡 متوسط",low:"🟢 منخفض"},T={critical:s.accent,high:"#E65100",medium:s.warning,low:s.success},o=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("تقرير النواقص والاحتياجات","تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات")}

      ${E("📊","ملخص النواقص")}
      <div class="kpi-grid">
        ${f("إجمالي النواقص",p.length,"📦",s.primary)}
        ${f("غير محلولة",h.length,"⚠️",s.accent)}
        ${f("محلولة",y.length,"✅",s.success)}
        ${f("حرجة",i.length,"🚨",s.accent)}
        ${f("عالية",C.length,"🟠","#E65100")}
        ${f("متوسطة",x.length,"🟡",s.warning)}
        ${f("منخفضة",v.length,"🟢",s.success)}
        ${f("معدل الحل",`${p.length>0?Math.round(y.length/p.length*100):0}%`,"📈",s.info)}
      </div>

      ${i.length>0?`
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${i.length} نقص حرج يحتاج تدخل فوري!
        </div>
      `:""}

      ${h.length>0?`
        ${E("⚠️","النواقص غير المحلولة",`${h.length} نقص`)}
        ${I(["#","النقص","الفئة","المحافظة","الخطورة","الكمية","المُبلّغ","التاريخ"],h.map((l,c)=>{var t,g;return[`${c+1}`,`<strong>${S(l.item_name)}</strong>`,S(l.item_category||"—"),S(((t=l.governorates)==null?void 0:t.name_ar)||"—"),`<span style="color:${T[l.severity]||s.textMuted};font-weight:700">${w[l.severity]||l.severity}</span>`,`<span class="num">${l.quantity_needed||"—"}</span>`,S(((g=l.profiles)==null?void 0:g.full_name)||"—"),new Date(l.created_at).toLocaleDateString("ar-SA")]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${b.length>0?`
        ${E("🏛️","النواقص حسب المحافظة")}
        ${I(["#","المحافظة","الإجمالي","غير محلولة","حرجة","عالية"],b.map((l,c)=>[`${c+1}`,`<strong>${S(l.name)}</strong>`,`<span class="num">${l.total}</span>`,`<span class="num" style="color:${l.unresolved>0?s.accent:s.success}">${l.unresolved}</span>`,`<span class="num" style="color:${s.accent}">${l.critical}</span>`,`<span class="num" style="color:#E65100">${l.high}</span>`]))}
      `:""}

      ${Object.keys(_).length>0?`
        ${E("📂","النواقص حسب الفئة")}
        ${I(["الفئة","العدد"],Object.entries(_).sort((l,c)=>c[1]-l[1]).map(([l,c])=>[S(l),`<span class="num">${c}</span>`]))}
      `:""}

      ${y.length>0?`
        <div class="page-break"></div>
        ${E("✅","النواقص المحلولة",`${y.length} نقص`)}
        ${I(["#","النقص","المحافظة","تاريخ الحل"],y.slice(0,20).map((l,c)=>{var t;return[`${c+1}`,S(l.item_name),S(((t=l.governorates)==null?void 0:t.name_ar)||"—"),l.resolved_at?new Date(l.resolved_at).toLocaleDateString("ar-SA"):"—"]}))}
      `:""}

      ${te()}
    </body>
    </html>
  `;se(o)}async function ka(){const u=new Date,d=new Date(u.getTime()-7*864e5),p=new Date(u.getTime()-14*864e5),[D,h,y,i]=await Promise.allSettled([F.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",d.toISOString()).is("deleted_at",null),F.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",p.toISOString()).lt("created_at",d.toISOString()).is("deleted_at",null),F.from("profiles").select("*").is("deleted_at",null),F.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),C=D.status==="fulfilled"?D.value.data||[]:[],x=h.status==="fulfilled"&&h.value.count||0,v=y.status==="fulfilled"?y.value.data||[]:[],b=i.status==="fulfilled"?i.value.data||[]:[],_=C.filter(n=>n.status==="submitted").length,w=C.filter(n=>n.status==="draft").length,T=new Set(C.map(n=>n.submitted_by)).size,o=new Set(C.map(n=>n.governorate_id).filter(Boolean)).size,l=C.length-x,c=x>0?Math.round(l/x*100):0,t=Array.from({length:7},(n,R)=>{const m=new Date(d.getTime()+R*864e5),k=m.toISOString().split("T")[0],z=m.toLocaleDateString("ar-SA",{weekday:"long"}),P=C.filter(M=>M.created_at.startsWith(k));return{day:z,date:k,count:P.length,submitted:P.filter(M=>M.status==="submitted").length}}),g=b.map(n=>({name:n.name_ar,count:C.filter(R=>R.governorate_id===n.id).length})).sort((n,R)=>R.count-n.count).filter(n=>n.count>0),r=`
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("التقرير الأسبوعي",`ملخص الأسبوع — ${ye(d)} إلى ${ye(u)}`)}

      ${E("📊","مؤشرات الأسبوع")}
      <div class="kpi-grid">
        ${f("إرساليات الأسبوع",C.length,"📋",s.primary,`${l>=0?"+":""}${c}% vs الأسبوع السابق`)}
        ${f("مرسلة",_,"✅",s.success,`${C.length>0?Math.round(_/C.length*100):0}%`)}
        ${f("مسودة",w,"📝",s.warning)}
        ${f("مشرفين نشطين",T,"👥","#7B1FA2",`من ${v.filter(n=>n.is_active).length}`)}
        ${f("محافظات نشطة",o,"🏛️",s.info,`من ${b.length}`)}
        ${f("متوسط يومي",Math.round(C.length/7),"📊",s.primary)}
      </div>

      ${E("📅","النشاط اليومي")}
      ${I(["اليوم","التاريخ","الإرساليات","مرسلة"],t.map(n=>[n.day,n.date,`<span class="num">${n.count}</span>`,`<span class="num">${n.submitted}</span>`]))}

      ${g.length>0?`
        ${E("🏛️","أداء المحافظات هذا الأسبوع")}
        ${g.map(n=>ce(n.name,n.count,Math.max(...g.map(R=>R.count),1),s.primary)).join("")}
      `:""}

      ${l<0?`
        <div class="alert-box alert-warning">
          ⚠️ انخفاض الإرساليات بنسبة ${Math.abs(c)}% مقارنة بالأسبوع السابق. يجب متابعة المشرفين.
        </div>
      `:l>0?`
        <div class="alert-box alert-success">
          ✅ زيادة الإرساليات بنسبة ${c}% مقارنة بالأسبوع السابق. أداء ممتاز!
        </div>
      `:""}

      ${te()}
    </body>
    </html>
  `;se(r)}async function Na(){const[u,d]=await Promise.allSettled([F.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("last_login",{ascending:!1}),F.from("form_submissions").select("submitted_by, created_at").is("deleted_at",null)]),p=u.status==="fulfilled"?u.value.data||[]:[],D=d.status==="fulfilled"?d.value.data||[]:[],h={admin:"🔴 مدير النظام",central:"🟣 مركزي",governorate:"🔵 محافظة",district:"🟢 مديرية",data_entry:"⚪ إدخال بيانات"},y=p.map(b=>{const _=D.filter(o=>o.submitted_by===b.id),w=_.length>0?_.sort((o,l)=>new Date(l.created_at).getTime()-new Date(o.created_at).getTime())[0].created_at:null,T=b.last_login?Math.floor((Date.now()-new Date(b.last_login).getTime())/864e5):999;return{...b,totalSubs:_.length,lastSub:w,daysSinceLogin:T}}),i=y.filter(b=>b.is_active&&b.daysSinceLogin<=7),C=y.filter(b=>b.is_active&&b.daysSinceLogin>30),x=y.filter(b=>!b.last_login),v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${ae()}
    </head>
    <body>
      ${ee("تقرير نشاط المستخدمين","تحليل شامل لنشاط ودخول المستخدمين")}

      ${E("📊","ملخص المستخدمين")}
      <div class="kpi-grid">
        ${f("إجمالي المستخدمين",p.length,"👥",s.primary)}
        ${f("نشطين",i.length,"🟢",s.success)}
        ${f("خاملين (+30 يوم)",C.length,"🟡",s.warning)}
        ${f("لم يدخلوا أبداً",x.length,"🔴",s.accent)}
      </div>

      ${E("👥","قائمة المستخدمين",`${p.length} مستخدم`)}
      ${I(["#","الاسم","البريد","الدور","المحافظة/المديرية","الإرساليات","آخر دخول","الحالة"],y.map((b,_)=>{var w,T;return[`${_+1}`,`<strong>${S(b.full_name)}</strong>`,S(b.email),h[b.role]||b.role,S(((w=b.governorates)==null?void 0:w.name_ar)||((T=b.districts)==null?void 0:T.name_ar)||"—"),`<span class="num">${b.totalSubs}</span>`,b.last_login?new Date(b.last_login).toLocaleDateString("ar-SA"):"لم يدخل",b.is_active?b.daysSinceLogin<=7?"🟢 نشط":b.daysSinceLogin<=30?"🟡 خامل":"🔴 متوقف":"⚫ معطل"]}))}

      ${x.length>0?`
        ${E("🚨","مستخدمون لم يدخلوا أبداً")}
        <div class="alert-box alert-warning">
          ${x.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      `:""}

      ${te()}
    </body>
    </html>
  `;se(v)}const ge=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];function K(u){return["admin","central"].includes(u)}function Ne(u){return["admin","central","governorate"].includes(u)}function De({active:u,payload:d,label:p}){return!u||!(d!=null&&d.length)?null:e.jsxs("div",{className:"bg-white/95 backdrop-blur-sm border border-gray-200/60 rounded-xl shadow-xl p-3 min-w-[140px]",children:[e.jsx("p",{className:"text-xs font-medium text-gray-500 mb-2",children:p}),d.map((D,h)=>e.jsxs("div",{className:"flex items-center justify-between gap-4 text-sm",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx("div",{className:"w-2.5 h-2.5 rounded-full",style:{backgroundColor:D.color}}),e.jsx("span",{className:"text-gray-600",children:D.name})]}),e.jsx("span",{className:"font-bold tabular-nums",children:D.value})]},h))]})}function Da({icon:u,title:d,subtitle:p,value:D,trend:h,color:y,gradient:i,onClick:C,loading:x,badge:v}){return e.jsxs(le,{className:"group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden",onClick:C,children:[e.jsx("div",{className:Q("absolute top-0 left-0 right-0 h-1",i)}),e.jsx("div",{className:Q("absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500",y.replace("text-","bg-"))}),e.jsxs(ne,{className:"p-5 relative",children:[e.jsxs("div",{className:"flex items-start justify-between mb-4",children:[e.jsx("div",{className:Q("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",y.replace("text-","bg-").replace("600","50")),children:e.jsx(u,{className:Q("w-6 h-6",y)})}),e.jsxs("div",{className:"flex items-center gap-2",children:[v&&e.jsx(Re,{variant:"secondary",className:"text-[10px] px-2",children:v}),h!==void 0&&e.jsxs("span",{className:Q("flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",h>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[h>=0?e.jsx(pt,{className:"w-3 h-3"}):e.jsx(ht,{className:"w-3 h-3"}),Math.abs(h),"%"]})]})]}),D&&e.jsx("p",{className:"text-3xl font-heading font-bold mb-1 tabular-nums",children:D}),e.jsx("h3",{className:"font-bold font-heading text-sm mb-0.5",children:d}),e.jsx("p",{className:"text-xs text-muted-foreground",children:p}),e.jsxs("div",{className:"flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity",children:[e.jsx("span",{children:"تصدير التقرير"}),e.jsx(ga,{className:"w-3.5 h-3.5"})]})]}),x&&e.jsx("div",{className:"absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10",children:e.jsx(Ge,{className:"w-6 h-6 animate-spin text-primary"})})]})}function Ra({form:u,submissionCount:d,onExport:p,exporting:D}){const h=(d==null?void 0:d.total)||0,y=(d==null?void 0:d.submitted)||0,i=(d==null?void 0:d.draft)||0,C=h>0?Math.round(y/h*100):0;return e.jsxs(le,{className:Q("group hover:shadow-lg transition-all duration-200 relative overflow-hidden",!u.is_active&&"opacity-50"),children:[e.jsx("div",{className:Q("absolute top-0 left-0 right-0 h-1",u.is_active?"bg-emerald-500":"bg-gray-400")}),e.jsxs(ne,{className:"p-4 pt-5",children:[e.jsxs("div",{className:"flex items-start gap-3 mb-3",children:[e.jsx("div",{className:"p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100",children:e.jsx($e,{className:"w-5 h-5 text-emerald-600"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("h3",{className:"font-bold text-sm truncate",children:u.title_ar}),e.jsx("p",{className:"text-xs text-muted-foreground truncate",children:u.title_en})]}),u.campaign_type&&e.jsx(Re,{variant:"outline",className:Q("text-[10px] shrink-0",u.campaign_type==="polio_campaign"?"text-blue-600 border-blue-200":"text-emerald-600 border-emerald-200"),children:u.campaign_type==="polio_campaign"?"💉":"🏥"})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-2 mb-3",children:[e.jsxs("div",{className:"text-center p-2 rounded-lg bg-muted/50",children:[e.jsx("p",{className:"text-lg font-bold",children:h}),e.jsx("p",{className:"text-[10px] text-muted-foreground",children:"إجمالي"})]}),e.jsxs("div",{className:"text-center p-2 rounded-lg bg-emerald-50",children:[e.jsx("p",{className:"text-lg font-bold text-emerald-600",children:y}),e.jsx("p",{className:"text-[10px] text-emerald-700",children:"مرسل"})]}),e.jsxs("div",{className:"text-center p-2 rounded-lg bg-amber-50",children:[e.jsx("p",{className:"text-lg font-bold text-amber-600",children:i}),e.jsx("p",{className:"text-[10px] text-amber-700",children:"مسودة"})]})]}),e.jsxs("div",{className:"mb-3",children:[e.jsxs("div",{className:"flex justify-between text-[10px] text-muted-foreground mb-1",children:[e.jsx("span",{children:"نسبة الإرسال"}),e.jsxs("span",{children:[C,"%"]})]}),e.jsx(Jt,{value:C,className:"h-1.5"})]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsxs(pe,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",onClick:()=>p(u,"xlsx"),disabled:D||h===0,children:[D?e.jsx(Ge,{className:"w-3 h-3 animate-spin"}):e.jsx($e,{className:"w-3 h-3"}),"Excel"]}),e.jsxs(pe,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",onClick:()=>p(u,"csv"),disabled:D||h===0,children:[D?e.jsx(Ge,{className:"w-3 h-3 animate-spin"}):e.jsx(Zt,{className:"w-3 h-3"}),"CSV"]})]})]})]})}function Ja(){var Qe;const{data:u}=kt(),d=((Qe=u==null?void 0:u.profile)==null?void 0:Qe.role)||"data_entry",{campaign:p,labelAr:D,isFiltered:h}=Nt(),{toast:y}=Dt(),{data:i,isLoading:C,refetch:x}=Rt(p),{data:v,isLoading:b}=Ft(p),{data:_,isLoading:w,refetch:T}=Ct({campaignType:p}),{data:o}=Pt(p),{data:l}=Et(),{data:c,isLoading:t}=Tt(p),{data:g}=Mt(),{data:r}=Lt({page:1}),n=(_==null?void 0:_.data)||[],[R,m]=Z.useState("analytics"),[k,z]=Z.useState(null),[P,M]=Z.useState(null),[O,Y]=Z.useState(""),[V,Ie]=Z.useState(""),[ie,qe]=Z.useState(""),[he,Ue]=Z.useState("all"),Be=Z.useMemo(()=>n.filter(a=>{if(O){const $=O.toLowerCase();return a.title_ar.toLowerCase().includes($)||a.title_en.toLowerCase().includes($)}return!0}),[n,O]),q=Z.useCallback(async(a,$)=>{M(a);try{await $(),y({title:"تم تصدير التقرير بنجاح ✅",variant:"success"})}catch(j){console.error(j),y({title:"فشل التصدير",variant:"destructive"})}finally{M(null)}},[y]),ft=()=>q("dashboard",()=>{i&&Bt(i)}),Oe=()=>q("governorates",()=>{v&&Ot(v.map(a=>({name_ar:a.name,submissions:a.submissions,completion_rate:v.length>0?Math.round(a.submissions/Math.max(...v.map($=>$.submissions),1)*100):0,active_users:0,last_submission:null})))}),bt=()=>q("users",async()=>{const{data:a,error:$}=await F.from("profiles").select("full_name, email, role, is_active, created_at, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1});if($)throw $;Wt((a||[]).map(j=>{var U;return{full_name:j.full_name,email:j.email,role:j.role,is_active:j.is_active,governorate:(U=j.governorates)==null?void 0:U.name_ar,created_at:j.created_at}}))}),We=()=>q("submissions",async()=>{let a=F.from("form_submissions").select(`
      id, status, data, notes, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar), districts(name_ar)
    `).is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);V&&(a=a.gte("created_at",V)),ie&&(a=a.lte("created_at",ie+"T23:59:59")),he!=="all"&&(a=a.eq("governorate_id",he));const{data:$,error:j}=await a;if(j)throw j;const U=[{header:"#",key:"index",width:6},{header:"النموذج",key:"form",width:22},{header:"الحالة",key:"status",width:12},{header:"المُرسل",key:"submitted_by",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"النشاط",key:"campaign",width:15},{header:"التاريخ",key:"date",width:18}],H=($||[]).map((L,G)=>{var N,A,B,X,re;return{index:G+1,form:((N=L.forms)==null?void 0:N.title_ar)||"",status:L.status==="submitted"?"مرسلة":"مسودة",submitted_by:((A=L.profiles)==null?void 0:A.full_name)||"",governorate:((B=L.governorates)==null?void 0:B.name_ar)||"",district:((X=L.districts)==null?void 0:X.name_ar)||"",campaign:((re=L.forms)==null?void 0:re.campaign_type)==="polio_campaign"?"شلل أطفال":"إيصالي",date:new Date(L.created_at).toLocaleDateString("ar-SA")}});ve({sheetName:"إرساليات النماذج",title:"تقرير الإرساليات الشامل — EPI Supervisor",subtitle:`تصدير: ${new Date().toLocaleDateString("ar-SA")} — ${H.length} سجل`,columns:U,data:H,fileName:`submissions_report_${new Date().toISOString().split("T")[0]}`})}),vt=()=>q("shortages",async()=>{const{data:a,error:$}=await F.from("supply_shortages").select(`
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name), governorates(name_ar), districts(name_ar)
    `).is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);if($)throw $;const j={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},U=[{header:"#",key:"index",width:6},{header:"الصنف",key:"item",width:22},{header:"الفئة",key:"category",width:15},{header:"المطلوب",key:"needed",width:12},{header:"المتاح",key:"available",width:10},{header:"الخطورة",key:"severity",width:12},{header:"محلول",key:"resolved",width:10},{header:"المُبلّغ",key:"by",width:18},{header:"المحافظة",key:"gov",width:15},{header:"التاريخ",key:"date",width:16}],H=(a||[]).map((L,G)=>{var N,A;return{index:G+1,item:L.item_name,category:L.item_category||"",needed:L.quantity_needed||"",available:L.quantity_available||0,severity:j[L.severity]||L.severity,resolved:L.is_resolved?"نعم":"لا",by:((N=L.profiles)==null?void 0:N.full_name)||"",gov:((A=L.governorates)==null?void 0:A.name_ar)||"",date:new Date(L.created_at).toLocaleDateString("ar-SA")}});ve({sheetName:"النواقص",title:"تقرير النواقص — EPI Supervisor",subtitle:`${H.length} سجل`,columns:U,data:H,fileName:`shortages_report_${new Date().toISOString().split("T")[0]}`})}),He=()=>q("timeline",()=>{if(!c)return;const a=[{header:"التاريخ",key:"date",width:14},{header:"مرسلة",key:"submitted",width:10},{header:"مسودة",key:"draft",width:10},{header:"الإجمالي",key:"total",width:10}],$=c.map(j=>({date:j.date,submitted:j.submitted||0,draft:j.draft||0,total:(j.submitted||0)+(j.draft||0)}));ve({sheetName:"الإرساليات - خط زمني",title:"تقرير الإرساليات الزمني — EPI Supervisor",columns:a,data:$,fileName:`timeline_report_${new Date().toISOString().split("T")[0]}`})}),xt=()=>q("roles",()=>{if(!g)return;ve({sheetName:"توزيع الأدوار",title:"تقرير توزيع الأدوار — EPI Supervisor",columns:[{header:"الدور",key:"name",width:20},{header:"العدد",key:"value",width:10}],data:g,fileName:`roles_report_${new Date().toISOString().split("T")[0]}`})}),Ye=()=>q("audit",async()=>{let a=F.from("audit_logs").select(`
      id, action, table_name, record_id, ip_address, created_at,
      profiles(full_name, email, role)
    `).order("created_at",{ascending:!1}).limit(5e3);V&&(a=a.gte("created_at",V)),ie&&(a=a.lte("created_at",ie+"T23:59:59"));const{data:$,error:j}=await a;if(j)throw j;const U={create:"إنشاء",update:"تعديل",delete:"حذف",login:"تسجيل دخول",logout:"تسجيل خروج"},H={profiles:"المستخدمين",form_submissions:"الإرساليات",forms:"النماذج",supply_shortages:"النواقص",governorates:"المحافظات",districts:"المديريات",notifications:"الإشعارات"},L=[{header:"#",key:"index",width:6},{header:"الإجراء",key:"action",width:14},{header:"الجدول",key:"table",width:16},{header:"المستخدم",key:"user",width:22},{header:"البريد",key:"email",width:25},{header:"الدور",key:"role",width:14},{header:"IP",key:"ip",width:14},{header:"التاريخ",key:"date",width:18}],G=($||[]).map((N,A)=>{var B,X,re;return{index:A+1,action:U[N.action]||N.action,table:H[N.table_name]||N.table_name,user:((B=N.profiles)==null?void 0:B.full_name)||"",email:((X=N.profiles)==null?void 0:X.email)||"",role:((re=N.profiles)==null?void 0:re.role)||"",ip:N.ip_address||"",date:new Date(N.created_at).toLocaleString("ar-SA")}});ve({sheetName:"سجل التدقيق",title:"تقرير سجل التدقيق — EPI Supervisor",subtitle:`تصدير: ${new Date().toLocaleDateString("ar-SA")} — ${G.length} سجل`,columns:L,data:G,fileName:`audit_report_${new Date().toISOString().split("T")[0]}`})}),$t=()=>q("pdf",async()=>{var L;const{data:a}=await F.from("governorates").select("name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar"),{data:$}=await F.from("form_submissions").select("governorate_id, status, governorates(name_ar)").is("deleted_at",null).gte("created_at",new Date(Date.now()-720*60*60*1e3).toISOString()),j=new Map;for(const G of $||[]){const N=((L=G.governorates)==null?void 0:L.name_ar)||"غير محدد",A=j.get(N)||{name:N,count:0};A.count++,j.set(N,A)}const{data:U}=await F.from("form_submissions").select("status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(20),H={submitted:"مرسلة",draft:"مسودة",approved:"معتمدة",rejected:"مرفوضة"};Ht({total:(i==null?void 0:i.total_submissions)||0,submitted:((i==null?void 0:i.total_submissions)||0)-((i==null?void 0:i.draft_submissions)||0),draft:(i==null?void 0:i.draft_submissions)||0,today:(i==null?void 0:i.submissions_today)||0,byGovernorate:Array.from(j.values()).sort((G,N)=>N.count-G.count).slice(0,15),byStatus:{submitted:((i==null?void 0:i.total_submissions)||0)-((i==null?void 0:i.draft_submissions)||0),draft:(i==null?void 0:i.draft_submissions)||0},recentSubmissions:(U||[]).map(G=>{var N,A,B;return{form:((N=G.forms)==null?void 0:N.title_ar)||"—",submitter:((A=G.profiles)==null?void 0:A.full_name)||"—",governorate:((B=G.governorates)==null?void 0:B.name_ar)||"—",status:H[G.status]||G.status,date:new Date(G.created_at).toLocaleDateString("ar-SA")}})})}),yt=()=>q("gov-pdf",async()=>{v&&Yt({governorates:v.map(a=>({name:a.name,submissions:a.submissions,submitted:Math.round(a.submissions*.7),draft:Math.round(a.submissions*.3),districts:0,facilities:0,users:0}))})}),_t=()=>q("users-pdf",async()=>{const{data:a}=await F.from("profiles").select("full_name, email, role, is_active, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),$={};for(const j of a||[])$[j.role]=($[j.role]||0)+1;Kt({total:(a==null?void 0:a.length)||0,byRole:$,users:(a||[]).map(j=>{var U;return{name:j.full_name,email:j.email,role:j.role==="admin"?"مسؤول":j.role==="central"?"مركزي":j.role==="governorate"?"محافظة":j.role==="district"?"مديرية":j.role,governorate:((U=j.governorates)==null?void 0:U.name_ar)||"—",active:j.is_active}})})}),wt=()=>q("shortages-pdf",async()=>{const{data:a}=await F.from("supply_shortages").select("item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200);Qt({total:(a==null?void 0:a.length)||0,critical:(a==null?void 0:a.filter($=>$.severity==="critical").length)||0,resolved:(a==null?void 0:a.filter($=>$.is_resolved).length)||0,shortages:(a||[]).map($=>{var j;return{item:$.item_name,severity:$.severity,needed:$.quantity_needed||0,available:$.quantity_available||0,governorate:((j=$.governorates)==null?void 0:j.name_ar)||"—",resolved:$.is_resolved}})})}),jt=()=>q("full-pdf",async()=>{const a=[];i&&a.push({title:"ملخص المؤشرات الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"إجمالي المستخدمين",value:i.total_users,icon:"👥",color:"#1E88E5"},{label:"إرساليات اليوم",value:i.submissions_today,icon:"📋",color:"#43A047"},{label:"المسودات",value:i.draft_submissions,icon:"📝",color:"#FB8C00"},{label:"النماذج النشطة",value:i.active_forms,icon:"📄",color:"#E53935"},{label:"المحافظات",value:(v==null?void 0:v.length)??0,icon:"🗺️",color:"#00897B"},{label:"معدل الأداء",value:`${i.approval_rate.toFixed(1)}%`,icon:"📈",color:"#8E24AA"}]}),v!=null&&v.length&&a.push({title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"name",label:"المحافظة"},{key:"submissions",label:"إرساليات"}],rows:v.map($=>({name:$.name,submissions:$.submissions}))}),i&&a.push({title:"توزيع الحالات",icon:"📈",type:"summary",items:[{label:"مرسلة",value:i.total_submissions-i.draft_submissions,color:"#10b981"},{label:"مسودة",value:i.draft_submissions,color:"#f59e0b"},{label:"معدل الإنجاز",value:`${i.approval_rate.toFixed(1)}%`,color:"#00897B"}]}),Vt({title:"التقرير الشامل — EPI Supervisor",subtitle:"جميع البيانات والإحصائيات",period:"آخر 30 يوم",sections:a})}),St=async(a,$)=>{z(a.id);try{const j=a.schema,U=[];j!=null&&j.fields&&j.fields.forEach(N=>U.push({label_ar:N.label_ar||N.label||"",key:N.id||N.key||""})),j!=null&&j.sections&&j.sections.forEach(N=>{var A;return(A=N.fields)==null?void 0:A.forEach(B=>U.push({label_ar:B.label_ar||B.label||"",key:B.id||B.key||""}))});const{data:H,error:L}=await F.from("form_submissions").select(`
        id, status, data, created_at,
        profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)
      `).eq("form_id",a.id).is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);if(L)throw L;const G=(H||[]).map(N=>{var A,B,X;return{id:N.id,status:N.status,submitted_by:((A=N.profiles)==null?void 0:A.full_name)||"",governorate:((B=N.governorates)==null?void 0:B.name_ar)||"",district:((X=N.districts)==null?void 0:X.name_ar)||"",created_at:N.created_at,data:N.data||{}}});if(G.length===0){y({title:"لا توجد إرساليات",variant:"destructive"});return}if($==="csv"){const N=["#","الحالة","المُرسل","المحافظة","التاريخ",...U.map(J=>J.label_ar)],A=G.map((J,Pe)=>[Pe+1,J.status==="submitted"?"مرسلة":"مسودة",J.submitted_by,J.governorate,new Date(J.created_at).toLocaleDateString("ar-SA"),...U.map(me=>{var Xe;const Ve=(Xe=J.data)==null?void 0:Xe[me.key];return Ve==null?"":String(Ve)})]),B=[N.join(","),...A.map(J=>J.map(Pe=>{const me=String(Pe);return me.includes(",")||me.includes('"')?`"${me.replace(/"/g,'""')}"`:me}).join(","))].join(`
`),X=new Blob(["\uFEFF"+B],{type:"text/csv;charset=utf-8;"}),re=URL.createObjectURL(X),W=document.createElement("a");W.href=re,W.download=`${a.title_ar}.csv`,W.click(),URL.revokeObjectURL(re)}else Xt(a.title_ar,U,G);y({title:`تم تصدير ${G.length} إرسالية ✅`,variant:"success"})}catch{y({title:"فشل التصدير",variant:"destructive"})}finally{z(null)}},Fe=Z.useMemo(()=>{const a=[];Ne(d)&&a.push({icon:At,title:"ملخص المؤشرات",subtitle:"KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء",value:i?oe(i.total_submissions):void 0,trend:i==null?void 0:i.submissions_trend,color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:ft,loading:P==="dashboard",badge:"KPIs"}),a.push({icon:_e,title:"الإرساليات — خط زمني",subtitle:"تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)",value:i?oe(i.submissions_today):void 0,color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:He,loading:P==="timeline",badge:"30 يوم"}),K(d)&&a.push({icon:we,title:"أداء المحافظات",subtitle:"مقارنة الإرساليات والتغطية الجغرافية بين المحافظات",value:v?oe(v.length)+" محافظة":void 0,color:"text-purple-600",gradient:"bg-gradient-to-r from-purple-500 to-purple-600",onClick:Oe,loading:P==="governorates"}),a.push({icon:it,title:"توزيع الحالات",subtitle:"نسبة الإرساليات المرسلة مقابل المسودات",value:i?`${i.approval_rate.toFixed(1)}%`:void 0,color:"text-amber-600",gradient:"bg-gradient-to-r from-amber-500 to-amber-600",onClick:We,loading:P==="submissions",badge:"تحليل"}),K(d)&&a.push({icon:de,title:"توزيع المستخدمين",subtitle:"المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات",value:g?oe(g.reduce((W,J)=>W+J.value,0)):void 0,color:"text-cyan-600",gradient:"bg-gradient-to-r from-cyan-500 to-cyan-600",onClick:xt,loading:P==="roles"}),a.push({icon:Ze,title:"تقرير الإرساليات الشامل",subtitle:"جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات",value:i?oe(i.total_submissions):void 0,color:"text-indigo-600",gradient:"bg-gradient-to-r from-indigo-500 to-indigo-600",onClick:We,loading:P==="submissions",badge:"شامل"}),K(d)&&a.push({icon:de,title:"تقرير المستخدمين",subtitle:"قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم",color:"text-rose-600",gradient:"bg-gradient-to-r from-rose-500 to-rose-600",onClick:bt,loading:P==="users"}),Ne(d)&&a.push({icon:Ee,title:"تقرير النواقص",subtitle:"نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل",color:"text-orange-600",gradient:"bg-gradient-to-r from-orange-500 to-orange-600",onClick:vt,loading:P==="shortages"}),K(d)&&a.push({icon:ha,title:"سجل التدقيق",subtitle:"جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم",color:"text-slate-600",gradient:"bg-gradient-to-r from-slate-500 to-slate-600",onClick:Ye,loading:P==="audit",badge:"audit"}),a.push({icon:xe,title:"📄 PDF — تقرير الإرساليات",subtitle:"تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-500 to-red-600",onClick:$t,loading:P==="pdf",badge:"PDF"}),K(d)&&a.push({icon:we,title:"📄 PDF — أداء المحافظات",subtitle:"تقرير PDF مقارن لأداء المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-600 to-rose-600",onClick:yt,loading:P==="gov-pdf",badge:"PDF"}),K(d)&&a.push({icon:de,title:"📄 PDF — المستخدمين",subtitle:"تقرير PDF للمستخدمين والأدوار",color:"text-red-600",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:_t,loading:P==="users-pdf",badge:"PDF"}),Ne(d)&&a.push({icon:Ee,title:"📄 PDF — النواقص",subtitle:"تقرير PDF لنواقص الإمدادات",color:"text-red-600",gradient:"bg-gradient-to-r from-orange-500 to-red-500",onClick:wt,loading:P==="shortages-pdf",badge:"PDF"}),K(d)&&a.push({icon:je,title:"📄 PDF — التقرير الشامل",subtitle:"تقرير PDF شامل بكل البيانات والإحصائيات",color:"text-white",gradient:"bg-gradient-to-r from-red-700 to-red-900",onClick:jt,loading:P==="full-pdf",badge:"PDF شامل"});const $=()=>q("central-report",async()=>{await ba({dateFrom:V||void 0,dateTo:ie||void 0})}),j=W=>q("gov-detail-"+W,async()=>{await va(W,{dateFrom:V||void 0,dateTo:ie||void 0})}),U=W=>q("form-analysis-"+W,async()=>{await xa(W)});K(d)&&a.push({icon:Je,title:"🏛️ التقرير المركزي الشامل",subtitle:"تقرير احترافي شامل — جميع المحافظات، المستخدمين، النماذج، النواقص، التغطية",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:$,loading:P==="central-report",badge:"احترافي"}),K(d)&&l&&l.forEach(W=>{a.push({icon:we,title:`🏛️ تقرير محافظة ${W.name_ar}`,subtitle:"تقرير تفصيلي — المديريات، المستخدمين، الإرساليات، النواقص",color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:()=>j(W.id),loading:P==="gov-detail-"+W.id,badge:"محافظة"})}),n&&n.forEach(W=>{a.push({icon:xe,title:`📊 تحليل: ${W.title_ar}`,subtitle:"تقرير تفصيلي — تحليل كل حقل، التغطية حسب المحافظة، التوقيت، الإرساليات",color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:()=>U(W.id),loading:P==="form-analysis-"+W.id,badge:"تحليل نموذج"})});const H=()=>q("supervisor-report",async()=>{await $a()}),L=()=>q("coverage-gap",async()=>{await ya()}),G=()=>q("campaign-comparison",async()=>{await _a()}),N=()=>q("daily-activity",async()=>{await wa()}),A=()=>q("data-quality",async()=>{await ja()}),B=()=>q("shortages-detailed",async()=>{await Sa()}),X=()=>q("weekly-report",async()=>{await ka()}),re=()=>q("user-activity",async()=>{await Na()});return K(d)&&a.push({icon:de,title:"👥 تقرير أداء المشرفين",subtitle:"تقييم شامل — كل مشرف وكم أرسل، التقييم، النشاط، جودة البيانات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:H,loading:P==="supervisor-report",badge:"مشرفين"}),K(d)&&a.push({icon:et,title:"🎯 تقرير الفجوة التغطية",subtitle:"أين البيانات ناقصة — محافظات ومديريات بدون تغطية",color:"text-white",gradient:"bg-gradient-to-r from-red-600 to-rose-700",onClick:L,loading:P==="coverage-gap",badge:"فجوة"}),K(d)&&a.push({icon:na,title:"⚖️ تقرير مقارنة الحملات",subtitle:"شلل أطفال vs الإيصالي التكاملي — مقارنة شاملة",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:G,loading:P==="campaign-comparison",badge:"مقارنة"}),a.push({icon:tt,title:"📅 تقرير النشاط اليومي",subtitle:"نشاط اليوم — إرساليات، دخول، مقارنة بأمس",color:"text-white",gradient:"bg-gradient-to-r from-cyan-600 to-teal-700",onClick:N,loading:P==="daily-activity",badge:"يومي"}),K(d)&&a.push({icon:at,title:"✨ تقرير جودة البيانات",subtitle:"تحليل اكتمال البيانات — GPS، صور، حقول فارغة",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-orange-600",onClick:A,loading:P==="data-quality",badge:"جودة"}),a.push({icon:Ee,title:"📦 تقرير النواقص التفصيلي",subtitle:"تحليل شامل — حرج/عالي/متوسط، حسب المحافظة والفئة",color:"text-white",gradient:"bg-gradient-to-r from-red-500 to-pink-600",onClick:B,loading:P==="shortages-detailed",badge:"نواقص"}),a.push({icon:_e,title:"📊 التقرير الأسبوعي",subtitle:"ملخص الأسبوع — مقارنة بالسابق، نشاط يومي، أداء المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-green-700",onClick:X,loading:P==="weekly-report",badge:"أسبوعي"}),K(d)&&a.push({icon:de,title:"🔐 تقرير نشاط المستخدمين",subtitle:"دخول، نشاط، مستخدمين خاملين — من دخل ومتى",color:"text-white",gradient:"bg-gradient-to-r from-slate-600 to-gray-700",onClick:re,loading:P==="user-activity",badge:"نشاط"}),a},[d,i,v,c,g,P,V,ie,he,p]),Ke=Z.useMemo(()=>v?v.slice(0,10).map(a=>({name:a.name,الإرساليات:a.submissions})):[],[v]),Ce=Z.useMemo(()=>i?[{name:"مرسلة",value:i.total_submissions-i.draft_submissions,color:"#10b981"},{name:"مسودة",value:i.draft_submissions,color:"#f59e0b"}]:[],[i]);return e.jsxs("div",{className:"page-enter",children:[e.jsx(la,{title:"التقارير والبيانات",subtitle:h?`تحليلات وتصدير — ${D}`:"تحليلات ذكية وتصدير احترافي للبيانات",onRefresh:()=>{x(),T()}}),e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsx(le,{className:"border-0 shadow-md",children:e.jsx(ne,{className:"p-4",children:e.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium",children:[e.jsx(zt,{className:"w-4 h-4 text-muted-foreground"}),"فلاتر"]}),e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(Gt,{className:"w-3.5 h-3.5 text-muted-foreground"}),e.jsx(Te,{type:"date",value:V,onChange:a=>Ie(a.target.value),className:"w-[140px] h-9 text-xs"}),e.jsx("span",{className:"text-xs text-muted-foreground",children:"—"}),e.jsx(Te,{type:"date",value:ie,onChange:a=>qe(a.target.value),className:"w-[140px] h-9 text-xs"})]}),Ne(d)&&e.jsxs(ea,{value:he,onValueChange:Ue,children:[e.jsxs(ta,{className:"w-[160px] h-9",children:[e.jsx(we,{className:"w-3.5 h-3.5 ml-2 text-muted-foreground"}),e.jsx(aa,{placeholder:"المحافظة"})]}),e.jsxs(sa,{children:[e.jsx(rt,{value:"all",children:"كل المحافظات"}),(l||[]).map(a=>e.jsx(rt,{value:a.id,children:a.name_ar},a.id))]})]}),(V||ie||he!=="all")&&e.jsxs(pe,{variant:"ghost",size:"sm",onClick:()=>{Ie(""),qe(""),Ue("all")},className:"h-9 gap-1 text-muted-foreground",children:[e.jsx(It,{className:"w-3 h-3"})," مسح"]})]})})}),e.jsxs(ra,{value:R,onValueChange:m,children:[e.jsxs(ia,{className:"w-full justify-start gap-1 bg-transparent p-0 h-auto",children:[e.jsxs(Le,{value:"analytics",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[e.jsx(at,{className:"w-4 h-4"})," التحليلات"]}),e.jsxs(Le,{value:"quick-reports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[e.jsx(st,{className:"w-4 h-4"})," التقارير السريعة"]}),e.jsxs(Le,{value:"form-exports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[e.jsx($e,{className:"w-4 h-4"})," تصدير النماذج",e.jsx(Re,{variant:"secondary",className:"text-[10px] px-1.5",children:n.length})]})]}),e.jsx(qt,{className:"my-4"}),e.jsxs(Ae,{value:"analytics",className:"mt-0 space-y-6",children:[e.jsx("div",{className:"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4",children:C?Array.from({length:6}).map((a,$)=>e.jsx(ue,{className:"h-28 rounded-xl"},$)):i&&[{icon:de,label:"المستخدمون",value:i.total_users,sub:`${i.active_users} نشط`,color:"text-blue-600",bg:"bg-blue-50"},{icon:Ze,label:"إرساليات اليوم",value:i.submissions_today,sub:`من ${oe(i.total_submissions)} إجمالي`,color:"text-emerald-600",bg:"bg-emerald-50",trend:i.submissions_trend},{icon:xe,label:"المسودات",value:i.draft_submissions,sub:"قيد الإعداد",color:"text-amber-600",bg:"bg-amber-50"},{icon:lt,label:"معدل الاعتماد",value:`${i.approval_rate.toFixed(1)}%`,sub:"نسبة الإرسال",color:"text-purple-600",bg:"bg-purple-50"},{icon:xe,label:"النماذج النشطة",value:i.active_forms,sub:`من ${i.total_forms}`,color:"text-cyan-600",bg:"bg-cyan-50"},{icon:tt,label:"إرساليات الأسبوع",value:i.submissions_this_week,sub:"آخر 7 أيام",color:"text-rose-600",bg:"bg-rose-50"}].map((a,$)=>{const j=a.icon;return e.jsxs(le,{className:"border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group",children:[e.jsx("div",{className:Q("absolute top-0 left-0 right-0 h-1",a.color.replace("text-","bg-"))}),e.jsxs(ne,{className:"p-4",children:[e.jsxs("div",{className:"flex items-start justify-between mb-3",children:[e.jsx("div",{className:Q("p-2 rounded-xl",a.bg),children:e.jsx(j,{className:Q("w-5 h-5",a.color)})}),a.trend!==void 0&&e.jsxs("span",{className:Q("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",a.trend>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[a.trend>=0?e.jsx(pt,{className:"w-2.5 h-2.5"}):e.jsx(ht,{className:"w-2.5 h-2.5"}),Math.abs(a.trend),"%"]})]}),e.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:oe(a.value)}),e.jsx("p",{className:"text-xs font-medium mt-0.5",children:a.label}),e.jsx("p",{className:"text-[10px] text-muted-foreground",children:a.sub})]})]},$)})}),e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[e.jsxs(le,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[e.jsxs(fe,{className:"flex flex-row items-center justify-between pb-2",children:[e.jsxs("div",{children:[e.jsxs(be,{className:"text-base font-heading flex items-center gap-2",children:[e.jsx(_e,{className:"w-5 h-5 text-primary"}),"حركة الإرساليات"]}),e.jsx(Me,{className:"text-xs",children:"آخر 30 يوم"})]}),e.jsxs(pe,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:He,children:[e.jsx(je,{className:"w-3.5 h-3.5"})," تصدير"]})]}),e.jsx(ne,{className:"pt-0",children:t?e.jsx(ue,{className:"w-full h-[280px]"}):e.jsx(Se,{width:"100%",height:280,children:e.jsxs(oa,{data:c||[],children:[e.jsxs("defs",{children:[e.jsxs("linearGradient",{id:"gSubmitted",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"5%",stopColor:"#10b981",stopOpacity:.3}),e.jsx("stop",{offset:"95%",stopColor:"#10b981",stopOpacity:0})]}),e.jsxs("linearGradient",{id:"gDraft",x1:"0",y1:"0",x2:"0",y2:"1",children:[e.jsx("stop",{offset:"5%",stopColor:"#f59e0b",stopOpacity:.3}),e.jsx("stop",{offset:"95%",stopColor:"#f59e0b",stopOpacity:0})]})]}),e.jsx(nt,{strokeDasharray:"3 3",stroke:"#e5e7eb"}),e.jsx(ot,{dataKey:"date",tick:{fontSize:10,fill:"#6b7280"},tickFormatter:a=>a.slice(5),stroke:"#d1d5db"}),e.jsx(dt,{tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),e.jsx(ke,{content:e.jsx(De,{})}),e.jsx(da,{formatter:a=>e.jsx("span",{className:"text-xs",children:a})}),e.jsx(ct,{type:"monotone",dataKey:"submitted",name:"مرسلة",stroke:"#10b981",fill:"url(#gSubmitted)",strokeWidth:2.5,dot:!1}),e.jsx(ct,{type:"monotone",dataKey:"draft",name:"مسودة",stroke:"#f59e0b",fill:"url(#gDraft)",strokeWidth:2.5,dot:!1})]})})})]}),e.jsxs(le,{className:"border-0 shadow-md overflow-hidden",children:[e.jsx(fe,{className:"pb-2",children:e.jsxs(be,{className:"text-base font-heading flex items-center gap-2",children:[e.jsx(it,{className:"w-5 h-5 text-primary"}),"توزيع الحالات"]})}),e.jsx(ne,{children:C?e.jsx(ue,{className:"w-full h-[260px]"}):e.jsxs(e.Fragment,{children:[e.jsx(Se,{width:"100%",height:180,children:e.jsxs(mt,{children:[e.jsx(ut,{data:Ce,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:Ce.map((a,$)=>e.jsx(ze,{fill:a.color},$))}),e.jsx(ke,{content:e.jsx(De,{})})]})}),e.jsx("div",{className:"space-y-2 mt-2",children:Ce.map((a,$)=>e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:a.color}}),e.jsx("span",{className:"text-muted-foreground text-xs",children:a.name})]}),e.jsx("span",{className:"font-bold tabular-nums text-xs",children:oe(a.value)})]},$))})]})})]})]}),e.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[e.jsxs(le,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[e.jsxs(fe,{className:"flex flex-row items-center justify-between pb-2",children:[e.jsxs("div",{children:[e.jsxs(be,{className:"text-base font-heading flex items-center gap-2",children:[e.jsx(Ut,{className:"w-5 h-5 text-primary"}),"الإرساليات حسب المحافظة"]}),e.jsx(Me,{className:"text-xs",children:"أعلى 10 محافظات"})]}),e.jsxs(pe,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:Oe,children:[e.jsx(je,{className:"w-3.5 h-3.5"})," تصدير"]})]}),e.jsx(ne,{className:"pt-0",children:b?e.jsx(ue,{className:"w-full h-[280px]"}):e.jsx(Se,{width:"100%",height:280,children:e.jsxs(ca,{data:Ke,layout:"vertical",children:[e.jsx(nt,{strokeDasharray:"3 3",stroke:"#e5e7eb",horizontal:!1}),e.jsx(ot,{type:"number",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),e.jsx(dt,{dataKey:"name",type:"category",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db",width:70}),e.jsx(ke,{content:e.jsx(De,{})}),e.jsx(ma,{dataKey:"الإرساليات",radius:[0,8,8,0],children:Ke.map((a,$)=>e.jsx(ze,{fill:ge[$%ge.length]},$))})]})})})]}),e.jsxs(le,{className:"border-0 shadow-md overflow-hidden",children:[e.jsx(fe,{className:"pb-2",children:e.jsxs(be,{className:"text-base font-heading flex items-center gap-2",children:[e.jsx(de,{className:"w-5 h-5 text-primary"}),"توزيع الأدوار"]})}),e.jsx(ne,{children:g?e.jsxs(e.Fragment,{children:[e.jsx(Se,{width:"100%",height:180,children:e.jsxs(mt,{children:[e.jsx(ut,{data:g,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:g.map((a,$)=>e.jsx(ze,{fill:ge[$%ge.length]},$))}),e.jsx(ke,{content:e.jsx(De,{})})]})}),e.jsx("div",{className:"space-y-2 mt-2",children:g.map((a,$)=>e.jsxs("div",{className:"flex items-center justify-between text-sm",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:ge[$%ge.length]}}),e.jsx("span",{className:"text-muted-foreground text-xs",children:a.name})]}),e.jsx("span",{className:"font-bold tabular-nums text-xs",children:a.value})]},$))})]}):e.jsx(ue,{className:"w-full h-[260px]"})})]})]}),r&&r.data&&r.data.length>0&&e.jsxs(le,{className:"border-0 shadow-md overflow-hidden",children:[e.jsxs(fe,{className:"flex flex-row items-center justify-between pb-2",children:[e.jsxs("div",{children:[e.jsxs(be,{className:"text-base font-heading flex items-center gap-2",children:[e.jsx(pa,{className:"w-5 h-5 text-primary"}),"آخر النشاطات"]}),e.jsx(Me,{className:"text-xs",children:"آخر العمليات المسجلة في النظام"})]}),e.jsxs(pe,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:Ye,children:[e.jsx(je,{className:"w-3.5 h-3.5"})," تصدير السجل"]})]}),e.jsx(ne,{className:"pt-0",children:e.jsx("div",{className:"space-y-0",children:r.data.slice(0,8).map((a,$)=>{var B;const j={create:{icon:lt,color:"text-emerald-600 bg-emerald-50"},update:{icon:_e,color:"text-blue-600 bg-blue-50"},delete:{icon:et,color:"text-red-600 bg-red-50"},login:{icon:de,color:"text-purple-600 bg-purple-50"}},U={create:"إنشاء",update:"تعديل",delete:"حذف",login:"دخول",logout:"خروج"},H={profiles:"المستخدمين",form_submissions:"الإرساليات",forms:"النماذج",supply_shortages:"النواقص",notifications:"الإشعارات"},L=j[a.action]||{icon:ua,color:"text-gray-600 bg-gray-50"},G=L.icon,N=Date.now()-new Date(a.created_at).getTime();let A;return N<6e4?A="الآن":N<36e5?A=`منذ ${Math.floor(N/6e4)} د`:N<864e5?A=`منذ ${Math.floor(N/36e5)} س`:A=`منذ ${Math.floor(N/864e5)} يوم`,e.jsxs("div",{className:Q("flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors",$<r.data.length-1&&"border-b"),children:[e.jsx("div",{className:Q("p-2 rounded-lg",L.color),children:e.jsx(G,{className:"w-4 h-4"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("p",{className:"text-sm font-medium truncate",children:[((B=a.profiles)==null?void 0:B.full_name)||"النظام"," — ",U[a.action]||a.action]}),e.jsxs("p",{className:"text-xs text-muted-foreground",children:[H[a.table_name]||a.table_name,a.ip_address&&` • ${a.ip_address}`]})]}),e.jsx("span",{className:"text-[11px] text-muted-foreground shrink-0",children:A})]},a.id)})})})]})]}),e.jsxs(Ae,{value:"quick-reports",className:"mt-0 space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[e.jsx(st,{className:"w-5 h-5 text-amber-500"}),"التقارير السريعة"]}),e.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"اضغط على أي تقرير لتصديره فوراً بصيغة Excel"})]}),e.jsxs(Re,{variant:"outline",className:"text-xs",children:[Fe.length," تقرير"]})]}),Fe.length===0?e.jsxs("div",{className:"text-center py-16",children:[e.jsx(Je,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),e.jsx("h3",{className:"text-lg font-medium",children:"لا توجد تقارير متاحة"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"تواصل مع مدير النظام للحصول على صلاحيات"})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5",children:Fe.map((a,$)=>e.jsx(Da,{...a},$))})]}),e.jsxs(Ae,{value:"form-exports",className:"mt-0 space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[e.jsx($e,{className:"w-5 h-5 text-emerald-500"}),"تصدير النماذج"]}),e.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"تصدير إرساليات كل نموذج بشكل منفصل"})]}),e.jsxs("div",{className:"relative w-64",children:[e.jsx(xe,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),e.jsx(Te,{placeholder:"بحث...",value:O,onChange:a=>Y(a.target.value),className:"pr-10 h-9 text-sm"})]})]}),w?e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:Array.from({length:6}).map((a,$)=>e.jsx(ue,{className:"h-56 rounded-xl"},$))}):Be.length===0?e.jsxs("div",{className:"text-center py-16",children:[e.jsx($e,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),e.jsx("h3",{className:"text-lg font-medium",children:O?"لا توجد نتائج":"لا توجد نماذج"})]}):e.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:Be.map(a=>e.jsx(Ra,{form:a,submissionCount:o==null?void 0:o[a.id],onExport:St,exporting:k===a.id},a.id))})]})]})]})]})}export{Ja as default};
//# sourceMappingURL=ReportsPage-BRUNnYa5.js.map
