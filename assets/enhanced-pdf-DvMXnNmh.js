const u={primary:"#1565C0",primaryDark:"#0D47A1",accent:"#E53935",success:"#2E7D32",warning:"#F57F17",info:"#0277BD",bgLight:"#F5F7FA",textDark:"#212121",textMuted:"#616161",border:"#E0E0E0"},r=u,x=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];function p(t){return`${t.getDate()} ${x[t.getMonth()]} ${t.getFullYear()}`}function c(t){return t.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function a(t){const e=document.createElement("div");return e.textContent=t,e.innerHTML}function d(t){return t==null?"—":typeof t=="number"?t.toLocaleString("ar-SA"):typeof t=="boolean"?t?"نعم":"لا":a(String(t))}function m(t,e){const i=new Date;return`
    <div class="report-header-bar">
      <div class="header-right">
        <div class="brand-mark">💉 EPI</div>
        <div class="brand-text">
          <div class="brand-title">برنامج التحصين الصحي الموسع</div>
          <div class="brand-sub">وزارة الصحة العامة والسكان — الجمهورية اليمنية</div>
        </div>
      </div>
      <div class="header-left">
        <div class="header-meta">📅 ${p(i)}</div>
        <div class="header-meta">🕐 ${c(i)}</div>
      </div>
    </div>
    <div class="report-title-block">
      <h1>${a(t)}</h1>
      ${e?`<p>${a(e)}</p>`:""}
    </div>
  `}function f(){return`
    <div class="report-footer-bar">
      <span>EPI Supervisor's — تقرير تلقائي</span>
      <span>سري — للاستخدام الداخلي فقط</span>
      <span class="page-num"></span>
    </div>
  `}function h(t){return t!=null&&t.length?`
    <div class="kpi-grid">
      ${t.map(e=>`
        <div class="kpi-card" style="border-top: 4px solid ${e.color||r.primary}">
          <div class="kpi-icon">${e.icon||"📊"}</div>
          <div class="kpi-value" style="color: ${e.color||r.primary}">${d(e.value)}</div>
          <div class="kpi-label">${a(e.label)}</div>
          ${e.sub?`<div class="kpi-sub">${a(e.sub)}</div>`:""}
        </div>
      `).join("")}
    </div>
  `:""}function v(t){return t!=null&&t.length?`
    <div class="summary-grid">
      ${t.map(e=>`
        <div class="summary-item">
          <span class="summary-label">${a(e.label)}</span>
          <span class="summary-value" style="color: ${e.color||r.primary}">${d(e.value)}</span>
        </div>
      `).join("")}
    </div>
  `:""}function y(t,e){return!(t!=null&&t.length)||!(e!=null&&e.length)?'<div class="empty-state">لا توجد بيانات</div>':`
    <div class="table-wrapper">
      <table>
        <thead>
          <tr>${t.map(i=>`<th style="${i.width?`width:${i.width}px`:""}">${a(i.label)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${e.map((i,o)=>`
            <tr class="${o%2===0?"row-even":"row-odd"}">
              ${t.map(n=>`<td>${d(i[n.key])}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `}function $(t){return t!=null&&t.length?`
    <div class="progress-list">
      ${t.map(e=>{const i=e.max>0?Math.round(e.value/e.max*100):0,o=e.color||r.primary;return`
          <div class="progress-item">
            <div class="progress-header">
              <span>${a(e.label)}</span>
              <span class="progress-stats">${i}% (${e.value.toLocaleString("ar-SA")}/${e.max.toLocaleString("ar-SA")})</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(i,100)}%; background: ${o}"></div>
            </div>
          </div>
        `}).join("")}
    </div>
  `:""}function w(t){return t!=null&&t.length?`
    <ul class="report-list">
      ${t.map(e=>`
        <li>
          <strong>${a(e.label)}:</strong>
          <span style="color: ${e.color||r.textDark}">${d(e.value)}</span>
        </li>
      `).join("")}
    </ul>
  `:""}function k(t){let e="";switch(t.type){case"kpi-grid":e=h(t.kpis);break;case"summary":e=v(t.items);break;case"table":e=y(t.columns,t.rows);break;case"text":e=`<div class="text-block">${t.text||""}</div>`;break;case"list":e=w(t.items);break;case"progress":e=$(t.progressItems);break;case"chart-desc":e=`<div class="chart-desc">${t.text||""}</div>`;break}return`
    <div class="section">
      <div class="section-title">
        <span class="section-icon">${t.icon||"📋"}</span>
        <span>${a(t.title)}</span>
      </div>
      <div class="section-body">${e}</div>
    </div>
  `}function b(t){const e=t.sections.map(k).join(""),i=new Date;return p(i),c(i),`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${a(t.title)} — EPI Supervisor</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 12mm 15mm;
    }

    html, body {
      font-family: 'Cairo', 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
      color: ${r.textDark};
      background: #fff;
      line-height: 1.6;
      direction: rtl;
      font-size: 13px;
      -webkit-font-smoothing: antialiased;
    }

    /* ═══ Header ═══ */
    .report-header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 3px solid ${r.primary};
      margin-bottom: 16px;
    }
    .header-right { display: flex; align-items: center; gap: 10px; }
    .brand-mark {
      background: ${r.primary};
      color: white;
      padding: 6px 14px;
      border-radius: 8px;
      font-weight: 900;
      font-size: 14px;
      letter-spacing: 1px;
    }
    .brand-title { font-size: 11px; font-weight: 700; color: ${r.primary}; }
    .brand-sub { font-size: 9px; color: ${r.textMuted}; }
    .header-left { text-align: left; }
    .header-meta { font-size: 10px; color: ${r.textMuted}; margin-bottom: 2px; }

    /* ═══ Title Block ═══ */
    .report-title-block {
      text-align: center;
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(21,101,192,0.03), rgba(21,101,192,0.08));
      border-radius: 12px;
      border: 1px solid rgba(21,101,192,0.12);
    }
    .report-title-block h1 {
      font-size: 22px;
      font-weight: 900;
      color: ${r.primary};
      margin-bottom: 4px;
    }
    .report-title-block p {
      font-size: 12px;
      color: ${r.textMuted};
    }

    /* ═══ Sections ═══ */
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: ${r.bgLight};
      border-radius: 8px;
      border-right: 4px solid ${r.primary};
      font-size: 14px;
      font-weight: 700;
    }
    .section-icon { font-size: 18px; }

    /* ═══ KPI Grid ═══ */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
    }
    .kpi-card {
      background: ${r.bgLight};
      border-radius: 10px;
      padding: 14px 10px;
      text-align: center;
    }
    .kpi-icon { font-size: 22px; margin-bottom: 4px; }
    .kpi-value { font-size: 24px; font-weight: 900; }
    .kpi-label { font-size: 10px; color: ${r.textMuted}; margin-top: 2px; }
    .kpi-sub { font-size: 9px; color: ${r.textMuted}; opacity: 0.7; margin-top: 2px; }

    /* ═══ Summary ═══ */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: ${r.bgLight};
      border-radius: 6px;
    }
    .summary-label { font-size: 11px; color: ${r.textMuted}; }
    .summary-value { font-size: 14px; font-weight: 700; }

    /* ═══ Tables ═══ */
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    thead th {
      background: ${r.primary};
      color: white;
      padding: 8px 10px;
      text-align: right;
      font-weight: 600;
      font-size: 10px;
      white-space: nowrap;
    }
    tbody td { padding: 7px 10px; border-bottom: 1px solid #E0E0E0; }
    .row-even { background: ${r.bgLight}; }
    .row-odd { background: white; }
    tbody tr:hover { background: #E3F2FD; }

    /* ═══ Progress ═══ */
    .progress-list { display: flex; flex-direction: column; gap: 10px; }
    .progress-item { background: ${r.bgLight}; border-radius: 8px; padding: 10px 14px; }
    .progress-header { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
    .progress-stats { font-weight: 700; color: ${r.primary}; font-size: 10px; }
    .progress-bar { height: 8px; background: #E0E0E0; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }

    /* ═══ Text & List ═══ */
    .text-block { font-size: 12px; line-height: 1.8; }
    .chart-desc { font-size: 11px; color: ${r.textMuted}; font-style: italic; }
    .report-list { list-style: none; padding: 0; }
    .report-list li { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 11px; }
    .report-list li strong { color: ${r.primary}; }

    .empty-state {
      text-align: center; color: ${r.textMuted};
      padding: 24px; font-size: 13px;
    }

    /* ═══ Footer ═══ */
    .report-footer-bar {
      margin-top: 24px;
      padding: 10px 0;
      border-top: 2px solid ${r.border};
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: ${r.textMuted};
    }

    /* ═══ Print ═══ */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  ${m(t.title,t.subtitle)}
  ${e}
  ${f()}
</body>
</html>`}function z(t){return b(t)}function j(t){var n;const e=b(t),i=document.createElement("iframe");i.style.position="fixed",i.style.top="-9999px",i.style.left="-9999px",i.style.width="210mm",i.style.height="297mm",document.body.appendChild(i);const o=i.contentDocument||((n=i.contentWindow)==null?void 0:n.document);if(!o){document.body.removeChild(i);const s=new Blob([e],{type:"text/html"}),g=URL.createObjectURL(s),l=document.createElement("a");l.href=g,l.download=`${t.title.replace(/\s+/g,"_")}.html`,l.click(),URL.revokeObjectURL(g);return}o.open(),o.write(e),o.close(),setTimeout(()=>{var s;(s=i.contentWindow)==null||s.print(),setTimeout(()=>{document.body.contains(i)&&document.body.removeChild(i)},1e4)},500)}const E=Object.freeze(Object.defineProperty({__proto__:null,PDF_BRAND:r,formatDateArabic:p,formatTimeArabic:c,generateReportHTML:z,printReport:j},Symbol.toStringTag,{value:"Module"}));export{u as B,E as e,z as g};
//# sourceMappingURL=enhanced-pdf-DvMXnNmh.js.map
