import{j as s}from"./data-vendor-CInkegrm.js";import{a as ce,k as Bs}from"./react-vendor-CSqLrF-f.js";import{c as ka,C as Be,a as $e,i as qe,e as st,L as Gt,af as St,g as We,n as qs,I as U,Q as Xa,u as Zt,p as Rt,T as It,b as gt,d as ut,ac as Ja,q as Qa,N as pt,a3 as Za,v as _t,X as es,R as fa,a4 as Us,aT as Ys,aU as ts,aV as t,J as Ws,aW as Ta,aX as Hs,aY as Ks,aZ as sa,a_ as Vs,s as tt,U as Ve,x as ra,P as oa,a$ as Xs,t as nt,f as na,o as Ea,h as Tt,F as Js,Z as Ca,a6 as la,K as Qs,an as Zs}from"./index-BjPe54Hs.js";import{S as dt}from"./skeleton-BxDx3t_1.js";import{S as va,a as ba,b as xa,c as ya,d as At}from"./select-De5qaO_p.js";import{T as er,a as tr,b as Bt,c as qt}from"./tabs-Ndxr2L-2.js";import{H as ar}from"./header-iEMGExnE.js";import{P as sr}from"./progress-W4hhXu4b.js";import{S as as}from"./star-zQZEDBQo.js";import{T as Fa}from"./trending-up-z4Pd0UZS.js";import{T as ea}from"./trending-down-B1adMesD.js";import{A as rr}from"./arrow-up-right-CxGvAAJR.js";import{u as ss,R as rs}from"./ReportPreview-C6XwQYOp.js";import{C as $a}from"./circle-check-C7aPbyYn.js";import{C as or}from"./circle-x-Dl2B8Z9G.js";import{F as mt}from"./file-down-BQi5Ndlq.js";import{S as nr}from"./section-error-boundary-E_X_D7_h.js";import{T as _a}from"./target-sabzt85d.js";import{A as lr}from"./award-BsP9iK0z.js";import{D as os,a as ns,b as ls,c as is,d as ir}from"./dialog-xzAZXRLk.js";import{T as cr,a as dr,b as Na,c as gr,d as ur,e as pr}from"./table-BGIjtTQG.js";import{u as cs}from"./governorates-BhcdJhTz.js";import{u as mr,b as hr,a as fr,d as vr}from"./dashboard-B3UpmK7C.js";import{u as br,d as xr}from"./forms-Ccfmxyer.js";import{u as yr}from"./audit-8XtWaocw.js";import{u as xt,w as $r,P as ta}from"./export-vendor-CeQm8jP5.js";import{E as aa,g as Et}from"./enhanced-pdf-49i5Qr_-.js";import{g as _r}from"./campaign-BGwGq_tH.js";import{G as wr}from"./gauge-uvVvebET.js";import{A as Ct}from"./activity-DE8MvDD7.js";import{C as Ma}from"./chart-pie-CFK9zPFs.js";import{B as za}from"./building-2-CetnjZ1K.js";import{P as Sr}from"./palette-BSqk7e-8.js";import{R as Ut,A as kr,C as Pa,X as Ia,Y as Aa,T as Yt,L as Fr,a as La,i as Ga,j as Oa,h as ia,B as Rr,b as Dr}from"./chart-vendor-aV12ZcRF.js";import{I as jr}from"./info-B2T0KKIS.js";import"./ui-vendor-SYVzqSV-.js";import"./chevron-down-DrRqYTOz.js";import"./external-link-xx_pUXVh.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=ka("ArrowLeftRight",[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tr=ka("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Er=ka("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);function Wt({active:e,payload:r,label:c}){return!e||!(r!=null&&r.length)?null:s.jsxs("div",{className:"bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[140px]",children:[s.jsx("p",{className:"text-xs font-medium text-muted-foreground mb-2",children:c}),r.map((n,m)=>s.jsxs("div",{className:"flex items-center justify-between gap-4 text-sm",children:[s.jsxs("div",{className:"flex items-center gap-1.5",children:[s.jsx("div",{className:"w-2.5 h-2.5 rounded-full",style:{backgroundColor:n.color}}),s.jsx("span",{className:"text-muted-foreground",children:n.name})]}),s.jsx("span",{className:"font-bold tabular-nums",children:n.value})]},m))]})}const Ht={pdf:{label:"PDF",color:"text-red-700",bg:"bg-red-50 border-red-200"},excel:{label:"Excel",color:"text-emerald-700",bg:"bg-emerald-50 border-emerald-200"},pptx:{label:"PPTX",color:"text-orange-700",bg:"bg-orange-50 border-orange-200"}};function Cr({icon:e,title:r,subtitle:c,value:n,trend:m,color:S,gradient:C,onClick:k,loading:u,badge:T,format:P,favorite:D,onToggleFavorite:R}){return s.jsxs(Be,{className:"group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden",onClick:k,children:[s.jsx("div",{className:$e("absolute top-0 left-0 right-0 h-1",C)}),s.jsx("div",{className:$e("absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500",S.replace("text-","bg-"))}),R&&s.jsx("button",{onClick:F=>{F.stopPropagation(),R()},className:"absolute top-3 left-3 z-10 p-1 rounded-full transition-all hover:scale-125",title:D?"إزالة من المفضلة":"إضافة للمفضلة",children:s.jsx(as,{className:$e("w-4 h-4 transition-colors",D?"fill-amber-400 text-amber-400":"text-muted-foreground/30 hover:text-amber-400")})}),s.jsxs(qe,{className:"p-5 relative",children:[s.jsxs("div",{className:"flex items-start justify-between mb-4",children:[s.jsx("div",{className:$e("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",S.replace("text-","bg-").replace("600","50")),children:s.jsx(e,{className:$e("w-6 h-6",S)})}),s.jsxs("div",{className:"flex items-center gap-2",children:[P&&Ht[P]&&s.jsx("span",{className:$e("text-[9px] font-bold px-1.5 py-0.5 rounded border",Ht[P].color,Ht[P].bg),children:Ht[P].label}),T&&s.jsx(st,{variant:"secondary",className:"text-[10px] px-2",children:T}),m!==void 0&&s.jsxs("span",{className:$e("flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",m>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[m>=0?s.jsx(Fa,{className:"w-3 h-3"}):s.jsx(ea,{className:"w-3 h-3"}),Math.abs(m),"%"]})]})]}),n&&s.jsx("p",{className:"text-3xl font-heading font-bold mb-1 tabular-nums",children:n}),s.jsx("h3",{className:"font-bold font-heading text-sm mb-0.5",children:r}),s.jsx("p",{className:"text-xs text-muted-foreground",children:c}),s.jsxs("div",{className:"flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity",children:[s.jsx("span",{children:"تصدير التقرير"}),s.jsx(rr,{className:"w-3.5 h-3.5"})]})]}),u&&s.jsx("div",{className:"absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10",children:s.jsx(Gt,{className:"w-6 h-6 animate-spin text-primary"})})]})}function Nr({form:e,submissionCount:r,onExport:c,exporting:n}){const m=(r==null?void 0:r.total)||0,S=(r==null?void 0:r.submitted)||0,C=(r==null?void 0:r.draft)||0,k=m>0?Math.round(S/m*100):0;return s.jsxs(Be,{className:$e("group hover:shadow-lg transition-all duration-200 relative overflow-hidden",!e.is_active&&"opacity-50"),children:[s.jsx("div",{className:$e("absolute top-0 left-0 right-0 h-1",e.is_active?"bg-emerald-500":"bg-gray-400")}),s.jsxs(qe,{className:"p-4 pt-5",children:[s.jsxs("div",{className:"flex items-start gap-3 mb-3",children:[s.jsx("div",{className:"p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100",children:s.jsx(St,{className:"w-5 h-5 text-emerald-600"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsx("h3",{className:"font-bold text-sm truncate",children:e.title_ar}),s.jsx("p",{className:"text-xs text-muted-foreground truncate",children:e.title_en})]}),e.campaign_type&&s.jsx(st,{variant:"outline",className:$e("text-[10px] shrink-0",e.campaign_type==="polio_campaign"?"text-blue-600 border-blue-200":"text-emerald-600 border-emerald-200"),children:e.campaign_type==="polio_campaign"?"💉":"🏥"})]}),s.jsxs("div",{className:"grid grid-cols-3 gap-2 mb-3",children:[s.jsxs("div",{className:"text-center p-2 rounded-lg bg-muted/50",children:[s.jsx("p",{className:"text-lg font-bold",children:m}),s.jsx("p",{className:"text-[10px] text-muted-foreground",children:"إجمالي"})]}),s.jsxs("div",{className:"text-center p-2 rounded-lg bg-emerald-50",children:[s.jsx("p",{className:"text-lg font-bold text-emerald-600",children:S}),s.jsx("p",{className:"text-[10px] text-emerald-700",children:"مرسل"})]}),s.jsxs("div",{className:"text-center p-2 rounded-lg bg-amber-50",children:[s.jsx("p",{className:"text-lg font-bold text-amber-600",children:C}),s.jsx("p",{className:"text-[10px] text-amber-700",children:"مسودة"})]})]}),s.jsxs("div",{className:"mb-3",children:[s.jsxs("div",{className:"flex justify-between text-[10px] text-muted-foreground mb-1",children:[s.jsx("span",{children:"نسبة الإرسال"}),s.jsxs("span",{children:[k,"%"]})]}),s.jsx(sr,{value:k,className:"h-1.5"})]}),s.jsxs("div",{className:"flex gap-2",children:[s.jsxs(We,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",onClick:()=>c(e,"xlsx"),disabled:n||m===0,children:[n?s.jsx(Gt,{className:"w-3 h-3 animate-spin"}):s.jsx(St,{className:"w-3 h-3"}),"Excel"]}),s.jsxs(We,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",onClick:()=>c(e,"csv"),disabled:n||m===0,children:[n?s.jsx(Gt,{className:"w-3 h-3 animate-spin"}):s.jsx(qs,{className:"w-3 h-3"}),"CSV"]})]})]})]})}function Mr({status:e,message:r,progress:c,total:n,className:m}){if(e==="idle")return null;const S=n&&c?Math.round(c/n*100):null;return s.jsxs("div",{className:$e("flex items-center gap-3 p-3 rounded-xl border transition-all",e==="error"?"bg-red-50 border-red-200":e==="done"?"bg-emerald-50 border-emerald-200":"bg-blue-50 border-blue-200",m),children:[s.jsx("div",{className:$e("p-2 rounded-lg shrink-0",e==="error"?"bg-red-100":e==="done"?"bg-emerald-100":"bg-blue-100"),children:e==="fetching"||e==="generating"?s.jsx(Gt,{className:"w-4 h-4 text-blue-600 animate-spin"}):e==="done"?s.jsx($a,{className:"w-4 h-4 text-emerald-600"}):e==="error"?s.jsx(or,{className:"w-4 h-4 text-red-600"}):s.jsx(mt,{className:"w-4 h-4 text-blue-600"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:"text-xs font-medium",children:e==="fetching"?"جاري تحميل البيانات...":e==="generating"?"جاري إنشاء التقرير...":e==="done"?"تم التصدير بنجاح ✅":e==="error"?"فشل التصدير":""}),S!==null&&s.jsxs("span",{className:"text-[10px] font-mono tabular-nums text-muted-foreground",children:[S,"%"]})]}),r&&s.jsx("p",{className:"text-[10px] text-muted-foreground mt-0.5 truncate",children:r}),S!==null&&s.jsx("div",{className:"mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden",children:s.jsx("div",{className:$e("h-full rounded-full transition-all duration-300",e==="error"?"bg-red-500":"bg-blue-500"),style:{width:`${Math.min(S,100)}%`}})}),c!==void 0&&n!==void 0&&s.jsxs("p",{className:"text-[9px] text-muted-foreground/70 mt-1",children:[c.toLocaleString("ar-SA")," / ",n.toLocaleString("ar-SA")," سجل"]})]})]})}function zr(){const[e,r]=ce.useState("idle"),[c,n]=ce.useState(),[m,S]=ce.useState(),[C,k]=ce.useState(),u=ce.useCallback(N=>{r("fetching"),n("جاري تحميل البيانات من قاعدة البيانات..."),S(0),k(N)},[]),T=ce.useCallback((N,M)=>{S(N),M&&k(M),n(`تم تحميل ${N.toLocaleString("ar-SA")} سجل...`)},[]),P=ce.useCallback(()=>{r("generating"),n("جاري إنشاء الملف...")},[]),D=ce.useCallback(N=>{r("done"),n(N||"تم التحميل بنجاح"),setTimeout(()=>{r("idle"),n(void 0),S(void 0),k(void 0)},3e3)},[]),R=ce.useCallback(N=>{r("error"),n(N||"حدث خطأ أثناء التصدير"),setTimeout(()=>{r("idle"),n(void 0),S(void 0),k(void 0)},5e3)},[]),F=ce.useCallback(()=>{r("idle"),n(void 0),S(void 0),k(void 0)},[]);return{status:e,message:c,progress:m,total:C,startFetch:u,updateFetchProgress:T,startGenerate:P,done:D,error:R,reset:F,isActive:e!=="idle"}}function Nt(e,r){const c=e-r,n=r>0?Math.round(c/r*100):e>0?100:0;return{diff:c,pct:n,direction:c>0?"up":c<0?"down":"same"}}async function Ba(e,r,c,n){var p;let m=null;if(n&&n!=="all"){const{data:v}=await U.from("forms").select("id").eq("campaign_type",n).is("deleted_at",null);m=(v==null?void 0:v.map(o=>o.id))||null}let S=U.from("form_submissions").select("id, status, governorate_id, created_at, governorates(name_ar)").is("deleted_at",null).gte("created_at",e).lte("created_at",r);m&&m.length>0&&(S=S.in("form_id",m));const[C,k,u,T]=await Promise.allSettled([S,U.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).lte("created_at",r),U.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).eq("is_active",!0).lte("created_at",r),U.from("supply_shortages").select("id, severity",{count:"exact"}).is("deleted_at",null).gte("created_at",e).lte("created_at",r)]),P=C.status==="fulfilled"?C.value.data||[]:[],D=P.filter(v=>v.status==="submitted").length,R=P.filter(v=>v.status==="draft").length,F=new Map;for(const v of P){const o=((p=v.governorates)==null?void 0:p.name_ar)||"غير محدد";F.set(o,(F.get(o)||0)+1)}const N=Array.from(F.entries()).map(([v,o])=>({name:v,count:o})).sort((v,o)=>o.count-v.count),M=new Map;for(const v of P){const o=new Date(v.created_at).toISOString().split("T")[0];M.set(o,(M.get(o)||0)+1)}const j=Array.from(M.entries()).map(([v,o])=>({date:v,count:o})).sort((v,o)=>v.date.localeCompare(o.date)),x=T.status==="fulfilled"?T.value.data||[]:[],i=x.filter(v=>v.severity==="critical").length;return{label:c,dateFrom:e,dateTo:r,submissions:P.length,submitted:D,draft:R,users:k.status==="fulfilled"&&k.value.count||0,activeUsers:u.status==="fulfilled"&&u.value.count||0,shortages:x.length,criticalShortages:i,byGovernorate:N,byDay:j}}async function Pr(e,r,c,n,m){const[S,C]=await Promise.all([Ba(e,r,"الفترة الحالية",m),Ba(c,n,"الفترة السابقة",m)]),k={submissions:Nt(S.submissions,C.submissions),submitted:Nt(S.submitted,C.submitted),draft:Nt(S.draft,C.draft),users:Nt(S.users,C.users),shortages:Nt(S.shortages,C.shortages)},u=S.byGovernorate.map(D=>{const R=C.byGovernorate.find(j=>j.name===D.name),F=S.submissions>0?D.count/S.submissions*100:0,N=(R==null?void 0:R.count)||0,M=C.submissions>0?N/C.submissions*100:0;return{name:D.name,currentPct:Math.round(F),previousPct:Math.round(M),change:Math.round(F-M)}}),T=u.filter(D=>D.change>0).sort((D,R)=>R.change-D.change).slice(0,5),P=u.filter(D=>D.change<0).sort((D,R)=>D.change-R.change).slice(0,5);return{current:S,previous:C,changes:k,topImproved:T,topDeclined:P}}const qa=[{id:"this_week_vs_last",label:"هذا الأسبوع vs الماضي",icon:"📅",getCurrent:()=>{const e=new Date,r=e.getDay(),c=new Date(e);c.setDate(e.getDate()-r),c.setHours(0,0,0,0);const n=new Date(e);n.setHours(23,59,59,999);const m=new Date(c);m.setDate(m.getDate()-7);const S=new Date(c);return S.setDate(S.getDate()-1),S.setHours(23,59,59,999),{currentFrom:c.toISOString(),currentTo:n.toISOString(),previousFrom:m.toISOString(),previousTo:S.toISOString()}}},{id:"this_month_vs_last",label:"هذا الشهر vs الماضي",icon:"📆",getCurrent:()=>{const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),1),c=new Date(e.getFullYear(),e.getMonth()+1,0,23,59,59,999),n=new Date(e.getFullYear(),e.getMonth()-1,1),m=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{currentFrom:r.toISOString(),currentTo:c.toISOString(),previousFrom:n.toISOString(),previousTo:m.toISOString()}}},{id:"today_vs_yesterday",label:"اليوم vs أمس",icon:"📊",getCurrent:()=>{const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),e.getDate()),c=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999),n=new Date(r);n.setDate(n.getDate()-1);const m=new Date(n);return m.setHours(23,59,59,999),{currentFrom:r.toISOString(),currentTo:c.toISOString(),previousFrom:n.toISOString(),previousTo:m.toISOString()}}}];function Je(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}const kt=["#1565C0","#2E7D32","#F57F17","#E53935","#7B1FA2","#00838F","#E65100","#283593","#558B2F","#AD1457"];function Ir(e,r){if(!e.length)return"";const c=(r==null?void 0:r.maxValue)||Math.max(...e.map(m=>m.value),1),n=(r==null?void 0:r.showValues)!==!1;return`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Je(r.title)}</div>`:""}
      <div class="bar-chart">
        ${e.map((m,S)=>{const C=Math.round(m.value/c*100),k=m.color||kt[S%kt.length];return`
            <div class="bar-row">
              <div class="bar-label">${Je(m.label)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${C}%; background: ${k}"></div>
              </div>
              ${n?`<div class="bar-value">${m.value.toLocaleString("ar-SA")}</div>`:""}
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Ar(e,r){if(!e.length)return"";const c=e.reduce((k,u)=>k+u.value,0);if(c===0)return"";const n=(r==null?void 0:r.size)||160,m=(r==null?void 0:r.showLegend)!==!1;let S=[],C=0;return e.forEach((k,u)=>{const P=k.value/c*100/100*360,D=k.color||kt[u%kt.length];S.push(`${D} ${C}deg ${C+P}deg`),C+=P}),`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Je(r.title)}</div>`:""}
      <div class="donut-container" style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
        <div class="donut-wrapper" style="position: relative; width: ${n}px; height: ${n}px;">
          <div class="donut" style="
            width: ${n}px; height: ${n}px;
            border-radius: 50%;
            background: conic-gradient(${S.join(", ")});
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: ${n*.6}px; height: ${n*.6}px;
              border-radius: 50%; background: white;
              display: flex; align-items: center; justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 20px; font-weight: 900; color: #212121;">${c.toLocaleString("ar-SA")}</div>
              <div style="font-size: 10px; color: #757575;">إجمالي</div>
            </div>
          </div>
        </div>
        ${m?`
          <div class="donut-legend" style="flex: 1; min-width: 140px;">
            ${e.map((k,u)=>{const T=c>0?Math.round(k.value/c*100):0;return`
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 3px; background: ${k.color||kt[u%kt.length]}; flex-shrink: 0;"></div>
                  <div style="flex: 1; font-size: 12px; color: #616161;">${Je(k.label)}</div>
                  <div style="font-size: 12px; font-weight: 700; color: #212121;">${T}%</div>
                </div>
              `}).join("")}
          </div>
        `:""}
      </div>
    </div>
  `}function Lr(e,r){if(!e.length)return"";const c=Math.max(...e.map(S=>Math.max(S.current,S.previous)),1),n=(r==null?void 0:r.currentColor)||"#1565C0",m=(r==null?void 0:r.previousColor)||"#BDBDBD";return`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Je(r.title)}</div>`:""}
      <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${n};"></div>
          <span>${Je((r==null?void 0:r.currentLabel)||"الحالية")}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${m};"></div>
          <span>${Je((r==null?void 0:r.previousLabel)||"السابقة")}</span>
        </div>
      </div>
      <div class="comparison-chart">
        ${e.map(S=>{const C=Math.round(S.current/c*100),k=Math.round(S.previous/c*100),u=S.current-S.previous,T=S.previous>0?Math.round(u/S.previous*100):0,P=u>0?"#2E7D32":u<0?"#E53935":"#757575",D=u>0?"↑":u<0?"↓":"→";return`
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 600;">${Je(S.label)}</span>
                <span style="font-size: 11px; color: ${P}; font-weight: 700;">
                  ${D} ${T>0?"+":""}${T}%
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">حالي</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${C}%; height: 100%; background: ${n}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${S.current.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">سابق</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${k}%; height: 100%; background: ${m}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${S.previous.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Ua(e,r,c){const n=r>0?Math.min(Math.round(e/r*100),100):0,m=(c==null?void 0:c.color)||(n>=90?"#2E7D32":n>=70?"#F57F17":"#E53935"),S=(c==null?void 0:c.size)||120,C=c==null?void 0:c.target,k=(S-20)/2,u=2*Math.PI*k,T=u-n/100*u;return`
    <div class="pdf-chart" style="text-align: center;">
      ${c!=null&&c.title?`<div class="chart-title">${Je(c.title)}</div>`:""}
      <div style="display: inline-block; position: relative; width: ${S}px; height: ${S}px;">
        <svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
          <!-- Background arc -->
          <circle cx="${S/2}" cy="${S/2}" r="${k}" fill="none" stroke="#E0E0E0" stroke-width="10" />
          <!-- Value arc -->
          <circle cx="${S/2}" cy="${S/2}" r="${k}" fill="none" stroke="${m}" stroke-width="10"
            stroke-dasharray="${u}" stroke-dashoffset="${T}"
            stroke-linecap="round" transform="rotate(-90 ${S/2} ${S/2})" />
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: ${m};">${n}%</div>
          ${c!=null&&c.label?`<div style="font-size: 10px; color: #757575;">${Je(c.label)}</div>`:""}
        </div>
      </div>
      ${C?`
        <div style="font-size: 10px; color: #9E9E9E; margin-top: 8px;">
          الهدف: ${C}% | الحالي: ${n}%
        </div>
      `:""}
    </div>
  `}function Gr(){return`
    <style>
      .pdf-chart { margin-bottom: 16px; page-break-inside: avoid; }
      .chart-title {
        font-size: 13px; font-weight: 700; color: #212121;
        margin-bottom: 10px; padding-bottom: 6px;
        border-bottom: 1px solid #E0E0E0;
      }
      .bar-chart { display: flex; flex-direction: column; gap: 8px; }
      .bar-row { display: flex; align-items: center; gap: 10px; }
      .bar-label { width: 100px; font-size: 11px; color: #616161; text-align: right; flex-shrink: 0; }
      .bar-track { flex: 1; height: 20px; background: #F5F7FA; border-radius: 4px; overflow: hidden; }
      .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; min-width: 2px; }
      .bar-value { width: 50px; font-size: 11px; font-weight: 700; color: #212121; text-align: left; }
    </style>
  `}function Or({direction:e,pct:r,diff:c}){const n=e==="up"?Fa:e==="down"?ea:Er,m=e==="up"?"text-emerald-600 bg-emerald-50":e==="down"?"text-red-600 bg-red-50":"text-gray-500 bg-gray-50";return s.jsxs("div",{className:$e("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",m),children:[s.jsx(n,{className:"w-3 h-3"}),s.jsxs("span",{children:[r>0?"+":"",r,"%"]}),s.jsxs("span",{className:"opacity-60",children:["(",c>0?"+":"",c,")"]})]})}function Kt({label:e,current:r,previous:c,icon:n,color:m}){const S=r-c,C=c>0?Math.round(S/c*100):r>0?100:0,k=S>0?"up":S<0?"down":"same";return s.jsx(Be,{className:"border-0 shadow-sm hover:shadow-md transition-all",children:s.jsxs(qe,{className:"p-4",children:[s.jsxs("div",{className:"flex items-start justify-between mb-3",children:[s.jsx("div",{className:$e("p-2 rounded-xl",m.replace("text-","bg-").replace("600","50")),children:s.jsx(n,{className:$e("w-4 h-4",m)})}),s.jsx(Or,{direction:k,pct:C,diff:S})]}),s.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:r.toLocaleString("ar-SA")}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:e}),s.jsxs("p",{className:"text-[10px] text-muted-foreground/60 mt-1",children:["السابق: ",c.toLocaleString("ar-SA")]})]})})}function Br({onExportPDF:e,onExportExcel:r}){const{toast:c}=Xa(),{campaign:n}=Zt(),{previewProps:m,openPreview:S}=ss(),[C,k]=ce.useState(!1),[u,T]=ce.useState(null),[P,D]=ce.useState("this_week_vs_last"),R=ce.useCallback(async N=>{const M=qa.find(j=>j.id===(N||P));if(M){k(!0);try{const j=M.getCurrent(),x=await Pr(j.currentFrom,j.currentTo,j.previousFrom,j.previousTo,n!=="all"?n:void 0);T(x)}catch(j){console.error(j),c({title:"فشل تحميل المقارنة",variant:"destructive"})}finally{k(!1)}}},[P,n,c]),F=ce.useCallback(()=>{if(!u)return;const N=[{label:"الإرساليات",current:u.current.submissions,previous:u.previous.submissions},{label:"المرسلة",current:u.current.submitted,previous:u.previous.submitted},{label:"المسودات",current:u.current.draft,previous:u.previous.draft},{label:"النواقص",current:u.current.shortages,previous:u.previous.shortages}],M=u.current.byGovernorate.slice(0,10).map(p=>({label:p.name,value:p.count})),j=[{label:"مرسلة",value:u.current.submitted,color:"#2E7D32"},{label:"مسودة",value:u.current.draft,color:"#F57F17"}],i=`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head><meta charset="UTF-8"><title>تقرير المقارنة</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Cairo', sans-serif; direction: rtl; color: #212121; padding: 20px; }
        .section { margin-bottom: 24px; page-break-inside: avoid; }
        .section-title {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; background: #F5F7FA; border-radius: 8px;
          border-right: 4px solid #1565C0; font-size: 14px; font-weight: 700;
          margin-bottom: 12px;
        }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      </head>
      <body>${`
      ${Gr()}
      <div class="section">
        <div class="section-title"><span>📊</span><span>مؤشرات الأداء — مقارنة</span></div>
        <div class="section-body">
          ${Lr(N,{title:"مقارنة الإرساليات",currentLabel:u.current.label,previousLabel:u.previous.label})}
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span>🎯</span><span>نسبة الإنجاز</span></div>
        <div class="section-body" style="display: flex; gap: 24px; flex-wrap: wrap;">
          ${Ua(u.current.submitted,u.current.submissions,{title:"الحالية",target:95,size:120})}
          ${Ua(u.previous.submitted,u.previous.submissions,{title:"السابقة",target:95,size:120,color:"#BDBDBD"})}
        </div>
      </div>
      ${M.length>0?`
        <div class="section">
          <div class="section-title"><span>🗺️</span><span>الإرساليات حسب المحافظة</span></div>
          <div class="section-body">
            ${Ir(M,{title:"أعلى 10 محافظات"})}
          </div>
        </div>
      `:""}
      ${j.some(p=>p.value>0)?`
        <div class="section">
          <div class="section-title"><span>📈</span><span>توزيع الحالات</span></div>
          <div class="section-body">
            ${Ar(j,{title:"الحالية"})}
          </div>
        </div>
      `:""}
      ${u.topImproved.length>0?`
        <div class="section">
          <div class="section-title"><span>🏆</span><span>الأكثر تحسّناً</span></div>
          <div class="section-body">
            ${u.topImproved.map(p=>`
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                <span>${p.name}</span>
                <span style="color: #2E7D32; font-weight: 700;">+${p.change}%</span>
              </div>
            `).join("")}
          </div>
        </div>
      `:""}
    `}</body></html>
    `;S("تقرير المقارنة",i,`${u.current.label} vs ${u.previous.label}`)},[u,S]);return s.jsxs("div",{className:"space-y-4",children:[s.jsx(Be,{className:"border-0 shadow-sm",children:s.jsxs(qe,{className:"p-4",children:[s.jsx("div",{className:"flex items-center justify-between mb-3",children:s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(wa,{className:"w-4 h-4 text-primary"}),s.jsx("span",{className:"text-sm font-heading font-bold",children:"مقارنة الفترات"})]})}),s.jsx("div",{className:"grid grid-cols-3 gap-2",children:qa.map(N=>s.jsxs("button",{onClick:()=>{D(N.id),R(N.id)},className:$e("flex items-center gap-2 p-3 rounded-xl border text-right text-xs transition-all",P===N.id?"border-primary bg-primary/5 font-medium shadow-sm":"border-border hover:bg-muted/50"),children:[s.jsx("span",{className:"text-lg",children:N.icon}),s.jsx("span",{className:"flex-1",children:N.label}),P===N.id&&s.jsx("div",{className:"w-2 h-2 rounded-full bg-primary shrink-0"})]},N.id))}),s.jsxs(We,{onClick:()=>R(),disabled:C,className:"mt-3 gap-2 w-full",children:[C?s.jsx(Gt,{className:"w-4 h-4 animate-spin"}):s.jsx(Rt,{className:"w-4 h-4"}),C?"جاري التحليل...":"تشغيل المقارنة"]})]})}),C&&s.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:Array.from({length:4}).map((N,M)=>s.jsx(dt,{className:"h-32 rounded-xl"},M))}),u&&!C&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:[s.jsx(Kt,{label:"الإرساليات",current:u.current.submissions,previous:u.previous.submissions,icon:Rt,color:"text-blue-600"}),s.jsx(Kt,{label:"المرسلة",current:u.current.submitted,previous:u.previous.submitted,icon:_a,color:"text-emerald-600"}),s.jsx(Kt,{label:"المسودات",current:u.current.draft,previous:u.previous.draft,icon:It,color:"text-amber-600"}),s.jsx(Kt,{label:"النواقص",current:u.current.shortages,previous:u.previous.shortages,icon:It,color:"text-red-600"})]}),(u.topImproved.length>0||u.topDeclined.length>0)&&s.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[u.topImproved.length>0&&s.jsxs(Be,{className:"border-0 shadow-sm border-t-4 border-t-emerald-500",children:[s.jsx(gt,{className:"pb-2",children:s.jsxs(ut,{className:"text-sm flex items-center gap-2",children:[s.jsx(lr,{className:"w-4 h-4 text-emerald-600"}),"الأكثر تحسّناً"]})}),s.jsx(qe,{className:"space-y-2",children:u.topImproved.map(N=>s.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[s.jsx("span",{className:"font-medium",children:N.name}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsxs("span",{className:"text-muted-foreground",children:[N.previousPct,"%"]}),s.jsxs("span",{className:"text-emerald-600 font-bold",children:["→ ",N.currentPct,"%"]}),s.jsxs(st,{variant:"outline",className:"text-[9px] text-emerald-600 border-emerald-300",children:["+",N.change,"%"]})]})]},N.name))})]}),u.topDeclined.length>0&&s.jsxs(Be,{className:"border-0 shadow-sm border-t-4 border-t-red-500",children:[s.jsx(gt,{className:"pb-2",children:s.jsxs(ut,{className:"text-sm flex items-center gap-2",children:[s.jsx(ea,{className:"w-4 h-4 text-red-600"}),"الأكثر انخفاضاً"]})}),s.jsx(qe,{className:"space-y-2",children:u.topDeclined.map(N=>s.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[s.jsx("span",{className:"font-medium",children:N.name}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsxs("span",{className:"text-muted-foreground",children:[N.previousPct,"%"]}),s.jsxs("span",{className:"text-red-600 font-bold",children:["→ ",N.currentPct,"%"]}),s.jsxs(st,{variant:"outline",className:"text-[9px] text-red-600 border-red-300",children:[N.change,"%"]})]})]},N.name))})]})]}),s.jsxs("div",{className:"flex gap-2",children:[s.jsxs(We,{variant:"outline",onClick:F,className:"gap-2 flex-1",children:[s.jsx(mt,{className:"w-4 h-4"}),"تصدير PDF مع رسوم بيانية"]}),s.jsxs(We,{variant:"outline",onClick:()=>r==null?void 0:r(u),className:"gap-2 flex-1",children:[s.jsx(mt,{className:"w-4 h-4"}),"تصدير Excel"]})]})]}),s.jsx(rs,{...m})]})}function qr({filter:e,onChange:r,onRefresh:c,refreshing:n}){const{data:m}=cs(),{campaign:S,visibleOptions:C,setCampaign:k}=Zt();return s.jsx(Be,{className:"border-0 shadow-sm",children:s.jsx(qe,{className:"p-3",children:s.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[s.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-medium text-muted-foreground",children:[s.jsx(Ja,{className:"w-3.5 h-3.5"}),"فلاتر"]}),s.jsxs("div",{className:"flex items-center gap-1",children:[s.jsx(Qa,{className:"w-3 h-3 text-muted-foreground"}),s.jsx(pt,{type:"date",value:e.dateFrom,onChange:u=>r({...e,dateFrom:u.target.value}),className:"w-[130px] h-8 text-[11px]"})]}),s.jsx("span",{className:"text-[10px] text-muted-foreground",children:"—"}),s.jsx(pt,{type:"date",value:e.dateTo,onChange:u=>r({...e,dateTo:u.target.value}),className:"w-[130px] h-8 text-[11px]"}),s.jsx(Za,{orientation:"vertical",className:"h-6"}),s.jsxs(va,{value:e.governorateId,onValueChange:u=>r({...e,governorateId:u}),children:[s.jsxs(ba,{className:"w-[140px] h-8 text-[11px]",children:[s.jsx(_t,{className:"w-3 h-3 ml-1 text-muted-foreground"}),s.jsx(xa,{placeholder:"المحافظة"})]}),s.jsxs(ya,{children:[s.jsx(At,{value:"all",children:"كل المحافظات"}),(m||[]).map(u=>s.jsx(At,{value:u.id,children:u.name_ar},u.id))]})]}),s.jsxs(va,{value:S,onValueChange:u=>k(u),children:[s.jsx(ba,{className:"w-[140px] h-8 text-[11px]",children:s.jsx(xa,{placeholder:"الحملة"})}),s.jsx(ya,{children:C.map(u=>s.jsx(At,{value:u.id,children:s.jsxs("span",{className:"flex items-center gap-1.5",children:[s.jsx("span",{children:u.icon})," ",u.labelAr]})},u.id))})]}),(e.dateFrom||e.dateTo||e.governorateId!=="all")&&s.jsxs(We,{variant:"ghost",size:"sm",onClick:()=>r({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),className:"h-8 gap-1 text-[11px] text-muted-foreground",children:[s.jsx(es,{className:"w-3 h-3"})," مسح"]}),s.jsxs(We,{variant:"outline",size:"sm",onClick:c,disabled:n,className:"h-8 gap-1.5 text-[11px] mr-auto",children:[s.jsx(fa,{className:$e("w-3 h-3",n&&"animate-spin")}),"تحديث"]})]})})})}function Ur({open:e,onClose:r,data:c}){const[n,m]=ce.useState(null),[S,C]=ce.useState("desc"),[k,u]=ce.useState("");if(!c)return null;const T=D=>{n===D?C(R=>R==="asc"?"desc":"asc"):(m(D),C("desc"))};let P=c.data;if(k){const D=k.toLowerCase();P=P.filter(R=>Object.values(R).some(F=>String(F).toLowerCase().includes(D)))}return n&&(P=[...P].sort((D,R)=>{const F=D[n],N=R[n];return typeof F=="number"&&typeof N=="number"?S==="asc"?F-N:N-F:S==="asc"?String(F).localeCompare(String(N)):String(N).localeCompare(String(F))})),s.jsx(os,{open:e,onOpenChange:D=>!D&&r(),children:s.jsxs(ns,{className:"max-w-4xl max-h-[85vh]",children:[s.jsxs(ls,{children:[s.jsxs(is,{className:"font-heading flex items-center gap-2",children:[s.jsx(Us,{className:"w-5 h-5 text-primary"}),c.title]}),c.subtitle&&s.jsx(ir,{children:c.subtitle})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(pt,{placeholder:"بحث...",value:k,onChange:D=>u(D.target.value),className:"h-8 text-xs"}),s.jsxs(st,{variant:"outline",className:"text-[10px] shrink-0",children:[P.length," سجل"]})]}),s.jsx("div",{className:"overflow-auto max-h-[60vh]",children:s.jsxs(cr,{children:[s.jsx(dr,{children:s.jsx(Na,{className:"bg-muted/30",children:c.columns.map(D=>s.jsx(gr,{className:$e("text-xs cursor-pointer hover:bg-muted/50 select-none",n===D.key&&"bg-primary/10"),onClick:()=>D.sortable!==!1&&T(D.key),children:s.jsxs("div",{className:"flex items-center gap-1",children:[D.label,n===D.key&&s.jsx("span",{className:"text-[9px]",children:S==="asc"?"↑":"↓"})]})},D.key))})}),s.jsx(ur,{children:P.map((D,R)=>s.jsx(Na,{className:"hover:bg-muted/20",children:c.columns.map(F=>s.jsx(pr,{className:"text-xs",children:Yr(D[F.key])},F.key))},R))})]})})]})})}function Yr(e){return e==null?"—":typeof e=="boolean"?e?"نعم":"لا":typeof e=="number"?e.toLocaleString("ar-SA"):String(e)}function Wr({open:e,onClose:r,title:c,children:n}){return s.jsx(os,{open:e,onOpenChange:m=>!m&&r(),children:s.jsxs(ns,{className:"max-w-6xl max-h-[90vh]",children:[s.jsx(ls,{children:s.jsxs(is,{className:"font-heading flex items-center gap-2",children:[s.jsx(Rt,{className:"w-5 h-5 text-primary"}),c]})}),s.jsx("div",{className:"h-[70vh]",children:n})]})})}function Ya(e,r){if(e==null)return"";if(r==="percent"){const c=typeof e=="number"?e:parseFloat(String(e));return isNaN(c)?String(e):c}if(r==="number"){const c=typeof e=="number"?e:parseFloat(String(e));return isNaN(c)?String(e):c}return String(e)}function Hr(e){if(e==="number")return"#,##0";if(e==="percent")return"0.0%"}function Kr(e){const r=e.replace("#",""),c=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return c?{r:parseInt(c[1],16),g:parseInt(c[2],16),b:parseInt(c[3],16)}:{r:0,g:0,b:0}}function Mt(e,r){const{r:c,g:n,b:m}=Kr(e),S=Math.min(255,c+r),C=Math.min(255,n+r),k=Math.min(255,m+r);return[S,C,k].map(u=>u.toString(16).padStart(2,"0")).join("")}function ht(e){const{sheets:r,fileName:c,themeId:n}=e,m=n?Ys(n):ts(),S=xt.book_new();for(const C of r){const{title:k,subtitle:u,columns:T,data:P,showTotal:D,totalColumns:R,rowColor:F}=C,N=T.map($=>$.header),M=P.map($=>T.map(y=>Ya($[y.key],y.numFmt)));let j=null;D&&R&&R.length>0&&(j=T.map($=>{if($.key===T[0].key)return"الإجمالي";if(R.includes($.key)){const y=P.reduce((a,l)=>{const f=l[$.key];return a+(typeof f=="number"?f:0)},0);return Ya(y,$.numFmt)}return""}));const x=[];let i=0;k&&(x.push([k]),i++),u&&(x.push([u]),i++),(k||u)&&(x.push([]),i++),x.push(N),x.push(...M),j&&x.push(j);const p=xt.aoa_to_sheet(x);p["!cols"]=T.map($=>({wch:$.width||Math.min(Math.max($.header.length*1.5,10),30)}));const v=[];if(k&&v.push({s:{r:0,c:0},e:{r:0,c:T.length-1}}),u&&v.push({s:{r:1,c:0},e:{r:1,c:T.length-1}}),p["!merges"]=v,P.length>0){const $=i;p["!autofilter"]={ref:xt.encode_range({s:{r:$,c:0},e:{r:$+P.length,c:T.length-1}})}}if(p["!freeze"]={xSplit:0,ySplit:i+1},k){const $=p.A1;$&&($.s={font:{bold:!0,sz:16,color:{rgb:m.primaryDark}},alignment:{horizontal:"center",vertical:"center"},fill:{fgColor:{rgb:Mt(m.primary,180)}}})}if(u){const $=p.A2;$&&($.s={font:{sz:11,color:{rgb:m.borderColor}},alignment:{horizontal:"center"}})}const o=i;for(let $=0;$<T.length;$++){const y=xt.encode_cell({r:o,c:$}),a=p[y];a&&(a.s={font:{bold:!0,sz:11,color:{rgb:m.headerText}},fill:{fgColor:{rgb:m.headerBg}},alignment:{horizontal:T[$].align||"right",vertical:"center",wrapText:!0},border:{top:{style:"thin",color:{rgb:Mt(m.primary,40)}},bottom:{style:"thin",color:{rgb:Mt(m.primary,40)}}}})}for(let $=o+1;$<x.length;$++){const y=$-o-1,a=y%2===0,l=j&&$===x.length-1,f=P[y];let d=a?m.rowEven:m.rowOdd;if(l)d=Mt(m.primary,180);else if(f&&F){const h=F(f);h&&(d=Mt(h,200))}for(let h=0;h<T.length;h++){const b=xt.encode_cell({r:$,c:h}),O=p[b];if(!O)continue;const g=Hr(T[h].numFmt),w={alignment:{horizontal:T[h].align||"right",vertical:"center"},fill:{fgColor:{rgb:d}},border:{bottom:{style:"thin",color:{rgb:m.borderColor}}}};l&&(w.font={bold:!0,sz:11},w.border={top:{style:"medium",color:{rgb:m.primary}},bottom:{style:"medium",color:{rgb:m.primary}}}),g&&(w.numFmt=g),typeof O.v=="number"&&!l&&(w.font={bold:!0});const E=String(O.v||"").toLowerCase();(T[h].key==="severity"||T[h].key==="status")&&(["حرج","critical","غير نشط","مرفوض"].includes(E)?w.font={bold:!0,color:{rgb:"C62828"}}:["نشط","مرسلة","محلول","نجح"].includes(E)?w.font={bold:!0,color:{rgb:"2E7D32"}}:["عالي","high","مسودة"].includes(E)&&(w.font={bold:!0,color:{rgb:"F57F17"}})),O.s=w}}xt.book_append_sheet(S,p,C.name.slice(0,31))}$r(S,`${c}.xlsx`)}function Vr(e,r){const c=new Date().toLocaleDateString("ar-SA");ht({fileName:`dashboard_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"ملخص لوحة التحكم",title:"📊 ملخص المؤشرات — EPI Supervisor",subtitle:`📅 ${c}`,columns:[{header:"المؤشر",key:"label",width:30,align:"right"},{header:"القيمة",key:"value",width:15,align:"center"}],data:[{label:"👥 إجمالي المستخدمين",value:e.total_users},{label:"✅ المستخدمين النشطين",value:e.active_users},{label:"📋 إجمالي الإرساليات",value:e.total_submissions},{label:"📤 الإرساليات المرسلة",value:e.submitted_submissions},{label:"📝 المسودات",value:e.draft_submissions},{label:"📅 إرساليات اليوم",value:e.submissions_today},{label:"📈 إرساليات الأسبوع",value:e.submissions_this_week},{label:"📄 إجمالي النماذج",value:e.total_forms},{label:"✅ النماذج النشطة",value:e.active_forms},{label:"🎯 معدل الإنجاز",value:`${e.approval_rate.toFixed(1)}%`},{label:"📊 الاتجاه الأسبوعي",value:`${e.submissions_trend>0?"+":""}${e.submissions_trend.toFixed(1)}%`}]}]})}function Xr(e,r){const c=Math.max(...e.map(n=>n.submissions),1);ht({fileName:`governorates_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"أداء المحافظات",title:"🗺️ تقرير أداء المحافظات — EPI Supervisor",subtitle:`${e.length} محافظة — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"rank",width:6,align:"center"},{header:"المحافظة",key:"name",width:22,align:"right"},{header:"الإرساليات",key:"submissions",width:14,align:"center",numFmt:"number"},{header:"نسبة التغطية",key:"rate",width:14,align:"center"},{header:"مستوى الأداء",key:"level",width:14,align:"center"}],data:e.map((n,m)=>{const S=c>0?Math.round(n.submissions/c*100):0;return{rank:m+1,name:n.name,submissions:n.submissions,rate:`${S}%`,level:S>=80?"🟢 ممتاز":S>=50?"🟡 جيد":S>=20?"🟠 متوسط":"🔴 ضعيف"}}),showTotal:!0,totalColumns:["submissions"],rowColor:n=>{const m=c>0?n.submissions/c:0;return m>=.8?"2E7D32":m>=.5?"0277BD":m>=.2?"F57F17":"E53935"}}]})}function Jr(e,r){ht({fileName:`timeline_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"الإرساليات — خط زمني",title:"📈 تطور الإرساليات — آخر 30 يوم",subtitle:`📅 ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"التاريخ",key:"date",width:14,align:"center"},{header:"مرسلة",key:"submitted",width:12,align:"center",numFmt:"number"},{header:"مسودة",key:"draft",width:12,align:"center",numFmt:"number"},{header:"الإجمالي",key:"total",width:12,align:"center",numFmt:"number"},{header:"معدل الإرسال",key:"rate",width:14,align:"center"}],data:e.map(c=>({date:c.date,submitted:c.submitted,draft:c.draft,total:c.submitted+c.draft,rate:c.submitted+c.draft>0?`${Math.round(c.submitted/(c.submitted+c.draft)*100)}%`:"—"})),showTotal:!0,totalColumns:["submitted","draft","total"]}]})}function Qr(e,r){ht({fileName:`submissions_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"إرساليات النماذج",title:"📋 تقرير الإرساليات الشامل — EPI Supervisor",subtitle:`${e.length} إرسالية — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"النموذج",key:"form",width:22},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المُرسل",key:"submitted_by",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"النشاط",key:"campaign",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:c=>c.status==="مرسلة"?"2E7D32":c.status==="مسودة"?"F57F17":null}]})}function Zr(e,r){ht({fileName:`shortages_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"نواقص الإمدادات",title:"📦 تقرير النواقص — EPI Supervisor",subtitle:`${e.length} نقص — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الصنف",key:"item",width:22},{header:"الفئة",key:"category",width:15},{header:"المطلوب",key:"needed",width:10,align:"center",numFmt:"number"},{header:"المتاح",key:"available",width:10,align:"center",numFmt:"number"},{header:"الخطورة",key:"severity",width:12,align:"center"},{header:"محلول",key:"resolved",width:10,align:"center"},{header:"المُبلّغ",key:"by",width:18},{header:"المحافظة",key:"gov",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:c=>{const n=String(c.severity).toLowerCase();return n==="حرج"||n==="critical"?"C62828":n==="عالي"||n==="high"?"F57F17":null}}]})}function eo(e,r){const c={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"};ht({fileName:`users_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"المستخدمين",title:"👥 تقرير المستخدمين — EPI Supervisor",subtitle:`${e.length} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الاسم",key:"full_name",width:22},{header:"البريد",key:"email",width:25},{header:"الدور",key:"role",width:14,align:"center"},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المحافظة",key:"governorate",width:15},{header:"تاريخ الإنشاء",key:"created_at",width:14,align:"center"}],data:e.map((n,m)=>({index:m+1,full_name:n.full_name,email:n.email,role:c[n.role]||n.role,status:n.is_active?"نشط":"غير نشط",governorate:n.governorate||"—",created_at:new Date(n.created_at).toLocaleDateString("ar-SA")})),rowColor:n=>n.status==="نشط"?"2E7D32":"E53935"}]})}function to(e,r){const c=e.reduce((n,m)=>n+m.value,0);ht({fileName:`roles_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"توزيع الأدوار",title:"👥 توزيع المستخدمين حسب الدور",subtitle:`${c} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"الدور",key:"name",width:22,align:"right"},{header:"العدد",key:"value",width:12,align:"center",numFmt:"number"},{header:"النسبة",key:"percent",width:14,align:"center"}],data:e.map(n=>({name:n.name,value:n.value,percent:c>0?`${(n.value/c*100).toFixed(1)}%`:"0%"})),showTotal:!0,totalColumns:["value"]}]})}async function Dt(e){const{table:r,select:c,maxRows:n=5e4,pageSize:m=1e3,orderBy:S="created_at",orderDirection:C="desc",onProgress:k}=e,u=Date.now(),T=[];let P=0,D=null,R=!1;try{const{count:F}=await U.from(r).select("id",{count:"exact",head:!0});D=F}catch{}for(;;){let F=U.from(r).select(c).order(S,{ascending:C==="asc"}).range(P,P+m-1);e.applyFilters&&(F=e.applyFilters(F));const{data:N,error:M}=await F;if(M){console.error(`[BulkFetch] Error fetching ${r}:`,M);break}if(!N||N.length===0)break;if(T.push(...N),k==null||k(T.length,D),T.length>=n){R=!0;break}if(N.length<m)break;P+=m,await new Promise(j=>setTimeout(j,50))}return{data:T,totalCount:D||T.length,fetchedCount:T.length,truncated:R,elapsed:Date.now()-u}}async function ao(e){return Dt({table:"form_submissions",select:`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:5e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),e!=null&&e.formId&&(r=r.eq("form_id",e.formId)),e!=null&&e.status&&e.status!=="all"&&(r=r.eq("status",e.status)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(r=r.eq("governorate_id",e.governorateId)),e!=null&&e.dateFrom&&(r=r.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(r=r.lte("created_at",e.dateTo+"T23:59:59")),r)})}async function so(e){return Dt({table:"profiles",select:`
      id, full_name, email, role, is_active, phone,
      governorates(name_ar),
      districts(name_ar),
      created_at, updated_at
    `,maxRows:1e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),r)})}async function ro(e){return Dt({table:"supply_shortages",select:`
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:1e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),r)})}function Pe(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}const oo={1:"الجولة الأولى",2:"الجولة الثانية",3:"الجولة الثالثة",4:"الجولة الرابعة",5:"الجولة الخامسة",6:"الجولة السادسة",7:"الجولة السابعة",8:"الجولة الثامنة",9:"الجولة التاسعة",10:"الجولة العاشرة"};function no(e){return!e||e<=0?null:oo[e]||`الجولة ${e}`}function De(e){const r=no(e);return r?` — ${r}`:""}function rt(e,r){return r&&r>0?e.eq("campaign_round",r):e}function lo(e){return e.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function L(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}function je(e,r,c){return`
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon"><img src="${aa}" alt="شعار التحصين" style="width:40px;height:40px;object-fit:contain;border-radius:8px" /></div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${Pe(new Date)}</div>
          <div class="meta-item">🕐 ${lo(new Date)}</div>
          ${c?`<div class="meta-item">📊 ${L(c)}</div>`:""}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${L(e)}</h1>
        <p>${L(r)}</p>
      </div>
    </div>
  `}function Te(){return`
    <div class="report-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>منصة مشرف EPI — تقرير تلقائي</span>
        <span>سري — للاستخدام الداخلي فقط</span>
        <span class="page-number"></span>
      </div>
    </div>
  `}function I(e,r,c,n,m){return`
    <div class="kpi-card" style="border-top: 4px solid ${n}">
      <div class="kpi-icon">${c}</div>
      <div class="kpi-value" style="color: ${n}">${r}</div>
      <div class="kpi-label">${L(e)}</div>
      ${m?`<div class="kpi-sub">${L(m)}</div>`:""}
    </div>
  `}function H(e,r,c){return`
    <div class="section-title">
      <span class="section-icon">${e}</span>
      <span>${L(r)}</span>
      ${c?`<span class="section-badge">${L(c)}</span>`:""}
    </div>
  `}function ge(e,r){return`
    <table class="data-table">
      <thead>
        <tr>${e.map(c=>`<th>${L(c)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${r.map(c=>`<tr>${c.map(n=>`<td>${n}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `}function Qe(e,r,c,n){const m=c>0?Math.round(r/c*100):0;return`
    <div class="progress-item">
      <div class="progress-header">
        <span>${L(e)}</span>
        <span class="progress-value">${m}% (${r}/${c})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(m,100)}%; background: ${n}"></div>
      </div>
    </div>
  `}function Ee(){return`
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
        color: ${t.textDark};
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
        background: linear-gradient(135deg, ${t.primaryDark}, ${t.primary});
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
        background: ${t.bgLight};
        border-radius: 8px;
        border-right: 4px solid ${t.primary};
      }
      .header-title-section h1 {
        font-size: 22px;
        font-weight: 800;
        color: ${t.primaryDark};
        margin-bottom: 4px;
      }
      .header-title-section p {
        font-size: 13px;
        color: ${t.textMuted};
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
        border: 1px solid ${t.border};
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      }
      .kpi-icon { font-size: 24px; margin-bottom: 4px; }
      .kpi-value { font-size: 28px; font-weight: 900; }
      .kpi-label { font-size: 11px; color: ${t.textMuted}; margin-top: 2px; }
      .kpi-sub { font-size: 10px; color: ${t.textMuted}; margin-top: 1px; }
      
      /* ─── Section Title ─── */
      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 700;
        color: ${t.primaryDark};
        margin: 18px 0 10px;
        padding-bottom: 6px;
        border-bottom: 2px solid ${t.primary};
        page-break-after: avoid;
      }
      .section-icon { font-size: 18px; }
      .section-badge {
        font-size: 11px;
        background: ${t.primary};
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
        background: ${t.primary};
        color: white;
        padding: 10px 12px;
        text-align: right;
        font-weight: 700;
        font-size: 11px;
      }
      .data-table td {
        padding: 8px 12px;
        border-bottom: 1px solid ${t.border};
      }
      .data-table tr:nth-child(even) { background: ${t.bgLight}; }
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
      .progress-value { font-weight: 700; color: ${t.primary}; }
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
      .alert-success { background: #E8F5E9; border-color: ${t.success}; color: ${t.success}; }
      .alert-warning { background: #FFF8E1; border-color: ${t.warning}; color: #E65100; }
      .alert-danger { background: #FFEBEE; border-color: ${t.accent}; color: ${t.accent}; }
      .alert-info { background: #E1F5FE; border-color: ${t.info}; color: ${t.info}; }
      
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
        background: linear-gradient(90deg, ${t.primary}, ${t.accent});
        margin-bottom: 6px;
      }
      .footer-content {
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: ${t.textMuted};
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
      .status-ready { background: #E8F5E9; color: ${t.success}; }
      .status-partial { background: #FFF8E1; color: #F57F17; }
      .status-not-ready { background: #FFEBEE; color: ${t.accent}; }
    </style>
  `}let Ra=!1,Qt="",Sa=0;function io(){return Ra=!0,Qt="",Sa++,Sa}function Wa(e){if(e!==void 0&&e!==Sa)return"";Ra=!1;const r=Qt;return Qt="",r}function Ce(e,r,c){var S;if(Ra)return Qt=e,e;const n=document.createElement("iframe");n.style.position="fixed",n.style.top="-9999px",n.style.left="-9999px",n.style.width="210mm",n.style.height="297mm",document.body.appendChild(n);const m=n.contentDocument||((S=n.contentWindow)==null?void 0:S.document);if(!m){document.body.removeChild(n);const C=new Blob([e],{type:"text/html"}),k=URL.createObjectURL(C),u=document.createElement("a");u.href=k,u.download=`${r||"تقرير"}.html`,u.click(),URL.revokeObjectURL(k);return}m.open(),m.write(e),m.close(),setTimeout(()=>{var C;(C=n.contentWindow)==null||C.print(),setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},1e4)},600)}async function co(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,m=c&&n?`من ${c} إلى ${n}`:"آخر 30 يوم";async function S(){const a=[];let l=0;const f=1e3;for(;;){let d=U.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(l,l+f-1);c&&(d=d.gte("created_at",c)),n&&(d=d.lte("created_at",n+"T23:59:59")),r&&(d=d.eq("campaign_round",r));const{data:h,error:b}=await d;if(b||!h||h.length===0||(a.push(...h),h.length<f)||(l+=f,a.length>=1e5))break}return a}const[C,k,u,T,P]=await Promise.allSettled([U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),S(),U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).gte("created_at",c||"").lte("created_at",(n||"")+"T23:59:59")]),D=C.status==="fulfilled"?C.value.data||[]:[],R=k.status==="fulfilled"?k.value||[]:[],F=u.status==="fulfilled"?u.value.data||[]:[],N=T.status==="fulfilled"?T.value.data||[]:[],M=P.status==="fulfilled"?P.value.data||[]:[],j=R.length,x=R.filter(a=>a.status==="submitted").length,i=R.filter(a=>a.status==="draft").length,p=F.filter(a=>a.is_active).length,v=M.filter(a=>!a.is_resolved).length,o=M.filter(a=>!a.is_resolved&&a.severity==="critical").length,$=D.map(a=>{const l=R.filter(h=>h.governorate_id===a.id),f=F.filter(h=>h.governorate_id===a.id&&h.is_active),d=M.filter(h=>h.governorate_id===a.id&&!h.is_resolved);return{name:a.name_ar,submissions:l.length,submitted:l.filter(h=>h.status==="submitted").length,draft:l.filter(h=>h.status==="draft").length,users:f.length,shortages:d.length,gps:l.filter(h=>h.gps_lat).length,photos:l.filter(h=>h.photos&&h.photos.length>0).length}}).sort((a,l)=>l.submissions-a.submissions),y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("التقرير المركزي الشامل","نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين"+De(r),m)}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${H("📊","ملخص المؤشرات الرئيسية","KPIs")}
      <div class="kpi-grid">
        ${I("إجمالي الإرساليات",j,"📋",t.primary,`${x} مرسلة / ${i} مسودة`)}
        ${I("معدل الإرسال",`${j>0?Math.round(x/j*100):0}%`,"✅",t.success)}
        ${I("المحافظات النشطة",D.length,"🏛️",t.info,`${$.filter(a=>a.submissions>0).length} لها بيانات`)}
        ${I("المستخدمين النشطين",p,"👥","#7B1FA2")}
        ${I("النماذج النشطة",N.length,"📝",t.warning)}
        ${I("النواقص المعلقة",v,"⚠️",t.accent,`${o} حرجة`)}
        ${I("تغطية GPS",`${j>0?Math.round(R.filter(a=>a.gps_lat).length/j*100):0}%`,"📍",t.info)}
        ${I("تغطية الصور",`${j>0?Math.round(R.filter(a=>{var l;return((l=a.photos)==null?void 0:l.length)>0}).length/j*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${H("🏛️","أداء المحافظات",`${D.length} محافظة`)}
      ${ge(["#","المحافظة","الإرساليات","مرسلة","مسودة","المستخدمين","النواقص","GPS","معدل الإرسال"],$.map((a,l)=>[`${l+1}`,`<strong>${L(a.name)}</strong>`,`<span class="num">${a.submissions}</span>`,`<span class="num">${a.submitted}</span>`,`<span class="num">${a.draft}</span>`,`<span class="num">${a.users}</span>`,`<span class="num">${a.shortages>0?`<span style="color:${t.accent}">${a.shortages}</span>`:"0"}</span>`,`<span class="num">${a.submissions>0?Math.round(a.gps/a.submissions*100):0}%</span>`,`<span class="num">${a.submissions>0?Math.round(a.submitted/a.submissions*100):0}%</span>`]))}

      <!-- ═══ Coverage Analysis ═══ -->
      ${H("📈","تحليل التغطية")}
      ${$.map(a=>Qe(a.name,a.submissions,Math.max(...$.map(l=>l.submissions)),a.submissions>0?t.primary:"#BDBDBD")).join("")}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${H("📝","ملخص النماذج")}
      ${ge(["#","النموذج","الحملة","الإرساليات","معدل الإنجاز"],N.map((a,l)=>{const f=R.filter(h=>h.form_id===a.id),d=f.filter(h=>h.status==="submitted").length;return[`${l+1}`,L(a.title_ar),a.campaign_type==="polio_campaign"?"💉 شلل أطفال":"🏥 إيصالي تكاملي",`<span class="num">${f.length}</span>`,`<span class="num">${f.length>0?Math.round(d/f.length*100):0}%</span>`]}))}

      <!-- ═══ Shortages Alert ═══ -->
      ${v>0?`
        ${H("⚠️","تنبيهات النواقص",`${v} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${v}</strong> نقص معلق منها <strong>${o}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${ge(["النقص","المحافظة","الخطورة","الكمية المطلوبة"],M.filter(a=>!a.is_resolved).slice(0,15).map(a=>{var l;return[L(a.item_name),L(((l=a.governorates)==null?void 0:l.name_ar)||"—"),`<span class="status-badge ${a.severity==="critical"?"status-not-ready":a.severity==="high"?"status-partial":"status-ready"}">${a.severity==="critical"?"حرج":a.severity==="high"?"عالي":a.severity==="medium"?"متوسط":"منخفض"}</span>`,`<span class="num">${a.quantity_needed||"—"}</span>`]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${H("👥","توزيع المستخدمين")}
      <div class="three-col">
        ${["admin","central","governorate","district","data_entry"].map(a=>{const l=F.filter(h=>h.role===a&&h.is_active).length,f={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},d={admin:"🔴",central:"🟣",governorate:"🔵",district:"🟢",data_entry:"⚪"};return I(f[a]||a,l,d[a]||"👤",t.primary)}).join("")}
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(y,"التقرير_Mركزي_الشامل")}async function go(e,r){const c=r!=null&&r.campaignRound&&r.campaignRound>0?r.campaignRound:null,n=r==null?void 0:r.dateFrom,m=r==null?void 0:r.dateTo,S=y=>(n&&(y=y.gte("created_at",n)),m&&(y=y.lte("created_at",m+"T23:59:59")),y),C=S(rt(U.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),c)).order("created_at",{ascending:!1}),k=S(U.from("supply_shortages").select("*").eq("governorate_id",e).is("deleted_at",null)),[u,T,P,D,R]=await Promise.allSettled([U.from("governorates").select("*").eq("id",e).single(),C,U.from("profiles").select("*, districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),U.from("districts").select("*").eq("governorate_id",e).eq("is_active",!0).is("deleted_at",null).order("name_ar"),k]),F=u.status==="fulfilled"?u.value.data:null,N=T.status==="fulfilled"?T.value.data||[]:[],M=P.status==="fulfilled"?P.value.data||[]:[],j=D.status==="fulfilled"?D.value.data||[]:[],x=R.status==="fulfilled"?R.value.data||[]:[];if(!F){console.warn("[Report] المحافظة غير موجودة");return}const i=N.length,p=N.filter(y=>y.status==="submitted").length,v=M.filter(y=>y.is_active).length,o=j.map(y=>{const a=N.filter(f=>f.district_id===y.id),l=M.filter(f=>f.district_id===y.id&&f.is_active);return{name:y.name_ar,submissions:a.length,submitted:a.filter(f=>f.status==="submitted").length,users:l.length,gps:a.filter(f=>f.gps_lat).length}}).sort((y,a)=>a.submissions-y.submissions),$=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${L(F.name_ar)} — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je(`تقرير محافظة ${F.name_ar}`,`تحليل شامل لأداء المحافظة — ${j.length} مديرية${De(c)}`,r!=null&&r.dateFrom?`من ${r.dateFrom} إلى ${r.dateTo}`:void 0)}

      ${H("📊","مؤشرات المحافظة")}
      <div class="kpi-grid">
        ${I("الإرساليات",i,"📋",t.primary,`${p} مرسلة`)}
        ${I("معدل الإرسال",`${i>0?Math.round(p/i*100):0}%`,"✅",t.success)}
        ${I("المديريات",j.length,"🏘️",t.info,`${o.filter(y=>y.submissions>0).length} نشطة`)}
        ${I("المستخدمين",v,"👥","#7B1FA2")}
        ${I("النواقص",x.filter(y=>!y.is_resolved).length,"⚠️",t.accent)}
        ${I("تغطية GPS",`${i>0?Math.round(N.filter(y=>y.gps_lat).length/i*100):0}%`,"📍",t.info)}
      </div>

      ${H("🏘️","أداء المديريات",`${j.length} مديرية`)}
      ${ge(["#","المديرية","الإرساليات","مرسلة","المستخدمين","GPS","معدل الإنجاز"],o.map((y,a)=>[`${a+1}`,`<strong>${L(y.name)}</strong>`,`<span class="num">${y.submissions}</span>`,`<span class="num">${y.submitted}</span>`,`<span class="num">${y.users}</span>`,`<span class="num">${y.submissions>0?Math.round(y.gps/y.submissions*100):0}%</span>`,`<span class="num">${y.submissions>0?Math.round(y.submitted/y.submissions*100):0}%</span>`]))}

      ${H("📈","مخطط أداء المديريات")}
      ${o.map(y=>Qe(y.name,y.submissions,Math.max(...o.map(a=>a.submissions),1),t.primary)).join("")}

      ${H("👥","المستخدمون في المحافظة")}
      ${ge(["#","الاسم","الدور","المديرية","آخر دخول"],M.filter(y=>y.is_active).map((y,a)=>{var l;return[`${a+1}`,L(y.full_name),y.role==="governorate"?"🔵 محافظة":y.role==="district"?"🟢 مديرية":"⚪ إدخال بيانات",L(((l=y.districts)==null?void 0:l.name_ar)||"—"),y.last_login?new Date(y.last_login).toLocaleDateString("ar-SA"):"—"]}))}

      ${x.filter(y=>!y.is_resolved).length>0?`
        ${H("⚠️","النواقص المعلقة")}
        ${ge(["النقص","الخطورة","الكمية","ملاحظات"],x.filter(y=>!y.is_resolved).map(y=>[L(y.item_name),`<span class="status-badge ${y.severity==="critical"?"status-not-ready":"status-partial"}">${y.severity==="critical"?"حرج":"عالي"}</span>`,`<span class="num">${y.quantity_needed||"—"}</span>`,L(y.notes||"—")]))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce($,`تقرير_محافظة_${F.name_ar}`)}async function uo(e,r){const c=r!=null&&r.campaignRound&&r.campaignRound>0?r.campaignRound:null,n=r==null?void 0:r.dateFrom,m=r==null?void 0:r.dateTo,C=(a=>(n&&(a=a.gte("created_at",n)),m&&(a=a.lte("created_at",m+"T23:59:59")),a))(rt(U.from("form_submissions").select("*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").eq("form_id",e).is("deleted_at",null),c)).order("created_at",{ascending:!1}),[k,u,T]=await Promise.allSettled([U.from("forms").select("*").eq("id",e).single(),C,U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),P=k.status==="fulfilled"?k.value.data:null,D=u.status==="fulfilled"?u.value.data||[]:[],R=T.status==="fulfilled"?T.value.data||[]:[];if(!P){console.warn("[Report] النموذج غير موجود");return}const F=D.length,N=D.filter(a=>a.status==="submitted").length,M=D.filter(a=>a.status==="draft").length;let j={};try{j=typeof P.schema=="string"?JSON.parse(P.schema):P.schema}catch(a){console.warn("[form-analysis] Failed to parse form schema:",a)}const x=(j==null?void 0:j.sections)||[],i=x.flatMap(a=>a.fields||[]),p=R.map(a=>{const l=D.filter(f=>f.governorate_id===a.id);return{name:a.name_ar,total:l.length,submitted:l.filter(f=>f.status==="submitted").length,draft:l.filter(f=>f.status==="draft").length}}).filter(a=>a.total>0).sort((a,l)=>l.total-a.total),v=i.map(a=>{const l=a.name||a.id||a.label_ar;let f=0,d=0;return D.forEach(h=>{var O;const b=(O=h.data)==null?void 0:O[l];b!=null&&b!==""&&b!==0?f++:d++}),{label:a.label_ar||l,type:a.type,filled:f,empty:d,rate:F>0?Math.round(f/F*100):0}});D.forEach(a=>{a.created_at.split("T")[0]});const o=Array.from({length:24},(a,l)=>({hour:`${l.toString().padStart(2,"0")}:00`,count:D.filter(f=>new Date(f.created_at).getHours()===l).length})),$=P.campaign_type==="polio_campaign"?"💉 حملة شلل الأطفال":"🏥 النشاط الإيصالي التكاملي",y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${L(P.title_ar)} — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير تحليل النموذج",P.title_ar+De(c),$)}

      ${H("📊","ملخص النموذج")}
      <div class="kpi-grid">
        ${I("إجمالي الإرساليات",F,"📋",t.primary)}
        ${I("مرسلة",N,"✅",t.success,`${F>0?Math.round(N/F*100):0}%`)}
        ${I("مسودة",M,"📝",t.warning,`${F>0?Math.round(M/F*100):0}%`)}
        ${I("المحافظات المشمولة",p.length,"🏛️",t.info)}
        ${I("الحقول",i.length,"🔤","#7B1FA2")}
        ${I("الأقسام",x.length,"📂","#00897B")}
        ${I("تغطية GPS",`${F>0?Math.round(D.filter(a=>a.gps_lat).length/F*100):0}%`,"📍",t.info)}
        ${I("تغطية الصور",`${F>0?Math.round(D.filter(a=>{var l;return((l=a.photos)==null?void 0:l.length)>0}).length/F*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Description ═══ -->
      ${P.description_ar?`
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${L(P.description_ar)}
        </div>
      `:""}

      <!-- ═══ Settings ═══ -->
      ${H("⚙️","إعدادات النموذج")}
      <div class="two-col">
        <div class="alert-box alert-info">
          <strong>GPS إلزامي:</strong> ${P.requires_gps?"نعم ✅":"لا ❌"}
        </div>
        <div class="alert-box alert-info">
          <strong>صورة إلزامية:</strong> ${P.requires_photo?"نعم ✅":"لا ❌"}
        </div>
      </div>

      <!-- ═══ Governorate Breakdown ═══ -->
      <div class="page-break"></div>
      ${H("🏛️","الإرساليات حسب المحافظة",`${p.length} محافظة`)}
      ${ge(["#","المحافظة","الإجمالي","مرسلة","مسودة","معدل الإرسال"],p.map((a,l)=>[`${l+1}`,`<strong>${L(a.name)}</strong>`,`<span class="num">${a.total}</span>`,`<span class="num">${a.submitted}</span>`,`<span class="num">${a.draft}</span>`,`<span class="num">${a.total>0?Math.round(a.submitted/a.total*100):0}%</span>`]))}

      ${p.map(a=>Qe(a.name,a.total,Math.max(...p.map(l=>l.total),1),t.primary)).join("")}

      <!-- ═══ Field Analysis ═══ -->
      ${v.length>0?`
        ${H("🔤","تحليل الحقول",`${v.length} حقل`)}
        ${ge(["#","الحقل","النوع","مُملأ","فارغ","نسبة التعبئة"],v.map((a,l)=>[`${l+1}`,`<strong>${L(a.label)}</strong>`,a.type||"—",`<span class="num">${a.filled}</span>`,`<span class="num" style="color:${a.empty>0?t.accent:t.success}">${a.empty}</span>`,`<span class="num" style="color:${a.rate>=80?t.success:a.rate>=50?t.warning:t.accent}">${a.rate}%</span>`]))}
        ${v.map(a=>Qe(a.label,a.filled,F,a.rate>=80?t.success:a.rate>=50?t.warning:t.accent)).join("")}
      `:""}

      <!-- ═══ Sections Analysis ═══ -->
      ${x.length>0?`
        ${H("📂","تحليل الأقسام")}
        ${ge(["#","القسم","عدد الحقول"],x.map((a,l)=>[`${l+1}`,L(a.title_ar||`قسم ${l+1}`),`<span class="num">${(a.fields||[]).length}</span>`]))}
      `:""}

      <!-- ═══ Time Analysis ═══ -->
      ${H("⏰","تحليل التوقيت")}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${D.length>0?new Date(D[D.length-1].created_at).toLocaleDateString("ar-SA"):"—"} |
        <strong>آخر إرسالية:</strong> ${D.length>0?new Date(D[0].created_at).toLocaleDateString("ar-SA"):"—"}
      </div>

      ${ge(["الساعة","عدد الإرساليات"],o.filter(a=>a.count>0).map(a=>[a.hour,`<span class="num">${a.count}</span>`]))}

      <!-- ═══ Recent Submissions ═══ -->
      ${H("📋","آخر الإرساليات","آخر 10")}
      ${ge(["#","المحافظة","المديرية","المُرسل","الحالة","التاريخ"],D.slice(0,10).map((a,l)=>{var f,d,h;return[`${l+1}`,L(((f=a.governorates)==null?void 0:f.name_ar)||"—"),L(((d=a.districts)==null?void 0:d.name_ar)||"—"),L(((h=a.profiles)==null?void 0:h.full_name)||"—"),`<span class="status-badge ${a.status==="submitted"?"status-ready":"status-partial"}">${a.status==="submitted"?"مرسلة":"مسودة"}</span>`,new Date(a.created_at).toLocaleDateString("ar-SA")]}))}

      ${Te()}
    </body>
    </html>
  `;Ce(y,`تحليل_${P.title_ar}`)}async function po(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,m=e==null?void 0:e.governorateId,[S,C]=await Promise.allSettled([U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),k=await Dt({table:"form_submissions",select:"*, forms(title_ar), governorates(name_ar), districts(name_ar)",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:o=>(o=o.is("deleted_at",null),c&&(o=o.gte("created_at",c)),n&&(o=o.lte("created_at",n+"T23:59:59")),m&&m!=="all"&&(o=o.eq("governorate_id",m)),r&&(o=o.eq("campaign_round",r)),o)}),u=S.status==="fulfilled"?S.value.data||[]:[],T=k.data;C.status==="fulfilled"&&C.value.data;const P=["data_entry","district","governorate"],R=u.filter(o=>P.includes(o.role)&&o.is_active).map(o=>{const $=T.filter(w=>w.submitted_by===o.id),y=$.filter(w=>w.status==="submitted").length,a=$.filter(w=>w.status==="draft").length,l=$.filter(w=>w.gps_lat).length,f=$.filter(w=>{var E;return((E=w.photos)==null?void 0:E.length)>0}).length,d=$.length>0?$[0].created_at:null,h=o.last_login,b=d?Math.floor((Date.now()-new Date(d).getTime())/864e5):999,O=h?Math.floor((Date.now()-new Date(h).getTime())/864e5):999;let g=0;return $.length>0&&(g+=30),y>0&&(g+=25),l>0&&(g+=15),f>0&&(g+=15),b<=3?g+=15:b<=7?g+=10:b<=14&&(g+=5),{...o,totalSubs:$.length,submitted:y,draft:a,withGps:l,withPhotos:f,lastSub:d,lastLogin:h,daysSinceLastSub:b,daysSinceLastLogin:O,gpsRate:$.length>0?Math.round(l/$.length*100):0,photoRate:$.length>0?Math.round(f/$.length*100):0,score:g}}).sort((o,$)=>$.score-o.score),F=R.filter(o=>o.daysSinceLastSub<=7).length,N=R.filter(o=>o.daysSinceLastSub>14).length,M=R.length>0?Math.round(R.reduce((o,$)=>o+$.score,0)/R.length):0,j={data_entry:"إدخال بيانات",district:"مديرية",governorate:"محافظة"},x={data_entry:"⚪",district:"🟢",governorate:"🔵"};t.success,t.info;function i(o){return o>=70?t.success:o>=40?t.warning:t.accent}function p(o){return o>=80?"ممتاز":o>=60?"جيد":o>=40?"متوسط":o>=20?"ضعيف":"غير نشط"}const v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أداء المشرفين — EPI Supervisor</title>
      ${Ee()}
      <style>
        .score-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 12px;
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
          border: 1px solid ${t.border};
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
          border-bottom: 1px solid ${t.border};
        }
        .supervisor-name { font-size: 12px; font-weight: 700; }
        .supervisor-meta { font-size: 11px; color: ${t.textMuted}; }
        .supervisor-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          text-align: center;
        }
        .stat-box {
          background: ${t.bgLight};
          border-radius: 6px;
          padding: 6px;
        }
        .stat-value { font-size: 16px; font-weight: 800; }
        .stat-label { font-size: 12px; color: ${t.textMuted}; }
      </style>
    </head>
    <body>
      ${je("تقرير أداء المشرفين الميدانيين","تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية"+De(r))}

      ${H("📊","ملخص الأداء")}
      <div class="kpi-grid">
        ${I("إجمالي المشرفين",R.length,"👥",t.primary)}
        ${I("نشط (آخر 7 أيام)",F,"🟢",t.success,`${R.length>0?Math.round(F/R.length*100):0}%`)}
        ${I("غير نشط (+14 يوم)",N,"🔴",t.accent,`${R.length>0?Math.round(N/R.length*100):0}%`)}
        ${I("متوسط الأداء",`${M}/100`,"📊",M>=60?t.success:t.warning)}
      </div>

      ${H("🏆","ترتيب المشرفين حسب الأداء",`${R.length} مشرف`)}
      ${ge(["#","المشرف","الدور","المحافظة/المديرية","الإرساليات","مرسلة","GPS","النشاط","التقييم"],R.map((o,$)=>{var y,a;return[`${$+1}`,`<strong>${L(o.full_name)}</strong>`,`${x[o.role]||"👤"} ${j[o.role]||o.role}`,L(((y=o.governorates)==null?void 0:y.name_ar)||((a=o.districts)==null?void 0:a.name_ar)||"—"),`<span class="num">${o.totalSubs}</span>`,`<span class="num">${o.submitted}</span>`,`<span class="num">${o.gpsRate}%</span>`,o.daysSinceLastSub<=3?'<span class="activity-dot" style="background:#4CAF50"></span> نشط':o.daysSinceLastSub<=7?'<span class="activity-dot" style="background:#FF9800"></span> متوسط':o.daysSinceLastSub<=14?'<span class="activity-dot" style="background:#F44336"></span> ضعيف':'<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',`<span class="score-badge" style="background:${i(o.score)}">${o.score} — ${p(o.score)}</span>`]}))}

      <!-- ═══ Top Performers ═══ -->
      ${R.filter(o=>o.score>=60).length>0?`
        ${H("⭐","المشرفون المتميزون",`${R.filter(o=>o.score>=60).length} متميز`)}
        ${R.filter(o=>o.score>=60).slice(0,10).map(o=>{var $,y;return`
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${x[o.role]} ${L(o.full_name)}</div>
                <div class="supervisor-meta">${j[o.role]} — ${L((($=o.governorates)==null?void 0:$.name_ar)||((y=o.districts)==null?void 0:y.name_ar)||"—")}</div>
              </div>
              <span class="score-badge" style="background:${i(o.score)}">${o.score} ${p(o.score)}</span>
            </div>
            <div class="supervisor-stats">
              <div class="stat-box">
                <div class="stat-value" style="color:${t.primary}">${o.totalSubs}</div>
                <div class="stat-label">إجمالي</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${t.success}">${o.submitted}</div>
                <div class="stat-label">مرسلة</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${t.info}">${o.gpsRate}%</div>
                <div class="stat-label">GPS</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:#7B1FA2">${o.photoRate}%</div>
                <div class="stat-label">صور</div>
              </div>
            </div>
          </div>
        `}).join("")}
      `:""}

      <!-- ═══ Inactive Supervisors ═══ -->
      ${R.filter(o=>o.daysSinceLastSub>14).length>0?`
        ${H("🚨","مشرفون غير نشطين — يحتاجون متابعة",`${R.filter(o=>o.daysSinceLastSub>14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${R.filter(o=>o.daysSinceLastSub>14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${ge(["#","المشرف","الدور","المحافظة","آخر إرسالية","منذ يوم"],R.filter(o=>o.daysSinceLastSub>14).map((o,$)=>{var y,a;return[`${$+1}`,`<strong>${L(o.full_name)}</strong>`,j[o.role]||o.role,L(((y=o.governorates)==null?void 0:y.name_ar)||((a=o.districts)==null?void 0:a.name_ar)||"—"),o.lastSub?new Date(o.lastSub).toLocaleDateString("ar-SA"):"لم يرسل أبداً",`<span style="color:${t.accent};font-weight:700">${o.daysSinceLastSub} يوم</span>`]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(v,"تقرير_أداء_المشرفين")}async function mo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,m=e==null?void 0:e.governorateId,S=o=>(c&&(o=o.gte("created_at",c)),n&&(o=o.lte("created_at",n+"T23:59:59")),o),C=o=>(m&&m!=="all"&&(o=o.eq("governorate_id",m)),o),[k,u,T,P]=await Promise.allSettled([U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),U.from("districts").select("*, governorates(name_ar)").eq("is_active",!0).is("deleted_at",null),S(C(rt(U.from("form_submissions").select("governorate_id, district_id, created_at").is("deleted_at",null),r))),U.from("profiles").select("governorate_id, district_id, role, is_active").is("deleted_at",null)]),D=k.status==="fulfilled"?k.value.data||[]:[],R=u.status==="fulfilled"?u.value.data||[]:[],F=T.status==="fulfilled"?T.value.data||[]:[],N=P.status==="fulfilled"?P.value.data||[]:[],M=D.map(o=>{const $=F.filter(h=>h.governorate_id===o.id),y=R.filter(h=>h.governorate_id===o.id),a=y.filter(h=>F.some(b=>b.district_id===h.id)),l=N.filter(h=>h.governorate_id===o.id&&h.is_active),f=$.length>0?$.sort((h,b)=>new Date(b.created_at).getTime()-new Date(h.created_at).getTime())[0].created_at:null,d=f?Math.floor((Date.now()-new Date(f).getTime())/864e5):999;return{name:o.name_ar,id:o.id,totalDistricts:y.length,coveredDistricts:a.length,gapDistricts:y.length-a.length,submissions:$.length,users:l.length,lastSub:f,daysSinceLast:d,coverageRate:y.length>0?Math.round(a.length/y.length*100):0}}),j=M.filter(o=>o.coverageRate===100),x=M.filter(o=>o.coverageRate>0&&o.coverageRate<100),i=M.filter(o=>o.coverageRate===0),p=R.filter(o=>!F.some($=>$.district_id===o.id)),v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الفجوة التغطية — EPI Supervisor</title>
      ${Ee()}
      <style>
        .gap-card {
          border: 1px solid ${t.border};
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
      ${je("تقرير الفجوة في التغطية","تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون"+De(r))}

      ${H("📊","نظرة عامة على التغطية")}
      <div class="kpi-grid">
        ${I("المحافظات",D.length,"🏛️",t.primary)}
        ${I("مغطاة بالكامل",j.length,"✅",t.success)}
        ${I("غطاء جزئي",x.length,"⚠️",t.warning)}
        ${I("بدون تغطية",i.length,"🔴",t.accent)}
        ${I("المديريات",R.length,"🏘️",t.info)}
        ${I("مديريات بلا بيانات",p.length,"🚨",t.accent)}
        ${I("نسبة التغطية",`${D.length>0?Math.round((D.length-i.length)/D.length*100):0}%`,"📈",t.primary)}
        ${I("المستخدمين",N.filter(o=>o.is_active).length,"👥","#7B1FA2")}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${i.length>0?`
        ${H("🚨","محافظات بدون أي تغطية",`${i.length} محافظة`)}
        <div class="alert-box alert-danger">
          <strong>تنبيه:</strong> يوجد ${i.length} محافظة لم تسجل أي إرسالية. هذه المناطق تحتاج تدخل فوري.
        </div>
        ${i.map(o=>`
          <div class="gap-card" style="border-right: 4px solid ${t.accent}">
            <div class="gap-header">
              <strong>🔴 ${L(o.name)}</strong>
              <span style="color:${t.accent};font-weight:700">${o.totalDistricts} مديرية — 0 إرسالية</span>
            </div>
            <div style="font-size:10px;color:${t.textMuted}">
              ${o.users>0?`${o.users} مستخدم مسجل`:"لا يوجد مستخدمين"}
              ${o.lastSub?` — آخر نشاط: ${new Date(o.lastSub).toLocaleDateString("ar-SA")}`:" — لم يسبق العمل هنا"}
            </div>
          </div>
        `).join("")}
      `:`
        <div class="alert-box alert-success">✅ جميع المحافظات لها تغطية على الأقل جزئية</div>
      `}

      <!-- ═══ Partial Coverage ═══ -->
      ${x.length>0?`
        <div class="page-break"></div>
        ${H("⚠️","محافظات بتغطية جزئية",`${x.length} محافظة`)}
        ${x.map(o=>`
          <div class="gap-card" style="border-right: 4px solid ${t.warning}">
            <div class="gap-header">
              <strong>🟡 ${L(o.name)}</strong>
              <span>${o.coveredDistricts}/${o.totalDistricts} مديرية (${o.coverageRate}%)</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width:${o.coverageRate}%;background:${o.coverageRate>=60?t.success:t.warning}"></div>
            </div>
            <div style="font-size:9px;color:${t.textMuted};margin-top:4px">
              ${o.submissions} إرسالية — ${o.users} مستخدم — مديريات بلا بيانات: ${o.gapDistricts}
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ All Governorates Summary ═══ -->
      ${H("📋","جدول التغطية الشامل")}
      ${ge(["#","المحافظة","المديريات","مغطاة","فجوة","الإرساليات","المستخدمين","نسبة التغطية"],M.map((o,$)=>[`${$+1}`,`<strong>${L(o.name)}</strong>`,`<span class="num">${o.totalDistricts}</span>`,`<span class="num">${o.coveredDistricts}</span>`,`<span class="num" style="color:${o.gapDistricts>0?t.accent:t.success}">${o.gapDistricts}</span>`,`<span class="num">${o.submissions}</span>`,`<span class="num">${o.users}</span>`,`<span class="num" style="color:${o.coverageRate>=80?t.success:o.coverageRate>=40?t.warning:t.accent}">${o.coverageRate}%</span>`]))}

      ${M.map(o=>Qe(o.name,o.coveredDistricts,o.totalDistricts,o.coverageRate>=80?t.success:o.coverageRate>=40?t.warning:t.accent)).join("")}

      <!-- ═══ Districts Without Data ═══ -->
      ${p.length>0?`
        <div class="page-break"></div>
        ${H("🏘️","مديريات بدون أي بيانات",`${p.length} مديرية`)}
        ${ge(["#","المديرية","المحافظة"],p.map((o,$)=>{var y;return[`${$+1}`,L(o.name_ar),L(((y=o.governorates)==null?void 0:y.name_ar)||"—")]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(v,"تقرير_الفجوة_التغطية")}async function ho(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo;async function m(){const N=[];let M=0;const j=1e3;for(;;){let x=U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(M,M+j-1);c&&(x=x.gte("created_at",c)),n&&(x=x.lte("created_at",n+"T23:59:59")),r&&(x=x.eq("campaign_round",r));const{data:i,error:p}=await x;if(p||!i||i.length===0||(N.push(...i),i.length<j)||(M+=j,N.length>=1e5))break}return N}const[S,C,k]=await Promise.allSettled([m(),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),u=S.status==="fulfilled"?S.value||[]:[],T=C.status==="fulfilled"?C.value.data||[]:[],P=k.status==="fulfilled"?k.value.data||[]:[],R=[{id:"polio_campaign",label:"حملة شلل الأطفال",icon:"💉",color:"#1565C0"},{id:"integrated_activity",label:"النشاط الإيصالي التكاملي",icon:"🏥",color:"#2E7D32"}].map(N=>{const M=T.filter(a=>a.campaign_type===N.id),j=M.map(a=>a.id),x=u.filter(a=>j.includes(a.form_id)),i=x.filter(a=>a.status==="submitted").length,p=x.filter(a=>a.status==="draft").length,v=x.filter(a=>a.gps_lat).length,o=x.filter(a=>{var l;return((l=a.photos)==null?void 0:l.length)>0}).length,$=new Set(x.map(a=>a.governorate_id).filter(Boolean)),y=P.map(a=>({name:a.name_ar,submissions:x.filter(l=>l.governorate_id===a.id).length,submitted:x.filter(l=>l.governorate_id===a.id&&l.status==="submitted").length}));return{...N,forms:M.length,totalSubs:x.length,submitted:i,draft:p,withGps:v,withPhotos:o,govsWithData:$.size,gpsRate:x.length>0?Math.round(v/x.length*100):0,photoRate:x.length>0?Math.round(o/x.length*100):0,submitRate:x.length>0?Math.round(i/x.length*100):0,govBreakdown:y}}),F=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مقارنة الحملات — EPI Supervisor</title>
      ${Ee()}
      <style>
        .campaign-card {
          border: 1px solid ${t.border};
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
          color: ${t.textMuted};
          margin: 14px 0;
          position: relative;
        }
        .vs-divider::before, .vs-divider::after {
          content: '';
          position: absolute;
          top: 50%;
          width: 35%;
          height: 2px;
          background: ${t.border};
        }
        .vs-divider::before { right: 0; }
        .vs-divider::after { left: 0; }
      </style>
    </head>
    <body>
      ${je("تقرير مقارنة الحملات","مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي"+De(r))}

      ${R.map((N,M)=>`
        ${M===1?'<div class="vs-divider">VS</div>':""}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${N.color}">
            <span class="campaign-icon">${N.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${N.color}">${L(N.label)}</div>
              <div style="font-size:10px;color:${t.textMuted}">${N.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${I("الإرساليات",N.totalSubs,"📋",N.color)}
            ${I("مرسلة",N.submitted,"✅",t.success,`${N.submitRate}%`)}
            ${I("مسودة",N.draft,"📝",t.warning)}
            ${I("GPS",`${N.gpsRate}%`,"📍",t.info)}
            ${I("صور",`${N.photoRate}%`,"📷","#00897B")}
            ${I("محافظات",`${N.govsWithData}/${P.length}`,"🏛️",N.color)}
          </div>
          ${ge(["#","المحافظة","الإرساليات","مرسلة","معدل الإرسال"],N.govBreakdown.sort((j,x)=>x.submissions-j.submissions).map((j,x)=>[`${x+1}`,L(j.name),`<span class="num">${j.submissions}</span>`,`<span class="num">${j.submitted}</span>`,`<span class="num">${j.submissions>0?Math.round(j.submitted/j.submissions*100):0}%</span>`]))}
        </div>
      `).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(F,"تقرير_مقارنة_الحملات")}async function fo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date,n=c.toISOString().split("T")[0],m=new Date(c.getTime()-864e5).toISOString().split("T")[0],[S,C,k]=await Promise.allSettled([rt(U.from("form_submissions").select("*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)").gte("created_at",`${n}T00:00:00`).is("deleted_at",null).order("created_at",{ascending:!1}),r),U.from("profiles").select("*").is("deleted_at",null),U.from("notifications").select("*").gte("created_at",`${n}T00:00:00`).order("created_at",{ascending:!1})]),u=S.status==="fulfilled"?S.value.data||[]:[],T=C.status==="fulfilled"?C.value.data||[]:[],P=k.status==="fulfilled"?k.value.data||[]:[],[D]=await Promise.allSettled([rt(U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",`${m}T00:00:00`).lt("created_at",`${n}T00:00:00`).is("deleted_at",null),r)]),R=D.status==="fulfilled"&&D.value.count||0,F=u.filter(o=>o.status==="submitted").length,N=u.filter(o=>o.status==="draft").length,M=new Set(u.map(o=>o.submitted_by)).size,j=T.filter(o=>o.is_active).length,x=Array.from({length:24},(o,$)=>({hour:`${$.toString().padStart(2,"0")}:00`,count:u.filter(y=>new Date(y.created_at).getHours()===$).length})),i=u.length-R,p=R>0?Math.round(i/R*100):u.length>0?100:0,v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${Pe(c)}</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير النشاط اليومي",`نشاط اليوم — ${Pe(c)}${De(r)}`)}

      ${H("📊","مؤشرات اليوم")}
      <div class="kpi-grid">
        ${I("إرساليات اليوم",u.length,"📋",t.primary,`أمس: ${R} (${i>=0?"+":""}${p}%)`)}
        ${I("مرسلة",F,"✅",t.success)}
        ${I("مسودة",N,"📝",t.warning)}
        ${I("مشرفين نشطين",M,"👥","#7B1FA2",`من ${j}`)}
        ${I("إشعارات",P.length,"🔔",t.info)}
        ${I("مقارنة بأمس",`${i>=0?"📈":"📉"} ${Math.abs(p)}%`,i>=0?"📈":"📉",i>=0?t.success:t.accent)}
      </div>

      ${H("⏰","النشاط بالساعة")}
      ${ge(["الساعة","عدد الإرساليات","النشاط"],x.filter(o=>o.count>0).map(o=>[`<strong>${o.hour}</strong>`,`<span class="num">${o.count}</span>`,"█".repeat(Math.min(o.count,20))]))}

      ${u.length>0?`
        ${H("📋","إرساليات اليوم",`${u.length} إرسالية`)}
        ${ge(["#","الوقت","النموذج","المُرسل","المحافظة","الحالة"],u.slice(0,30).map((o,$)=>{var y,a,l;return[`${$+1}`,new Date(o.created_at).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"}),L(((y=o.forms)==null?void 0:y.title_ar)||"—"),L(((a=o.profiles)==null?void 0:a.full_name)||"—"),L(((l=o.governorates)==null?void 0:l.name_ar)||"—"),`<span class="status-badge ${o.status==="submitted"?"status-ready":"status-partial"}">${o.status==="submitted"?"مرسلة":"مسودة"}</span>`]}))}
      `:`
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${M<j?`
        ${H("🚨","مشرفين لم يرسلوا اليوم")}
        <div class="alert-box alert-danger">
          ${j-M} من ${j} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      `:`
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${Te()}
    </body>
    </html>
  `;Ce(v,`تقرير_النشاط_اليومي_${n}`)}async function vo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo;async function m(){const v=[];let o=0;const $=1e3;for(;;){let y=U.from("form_submissions").select("*, forms(title_ar, schema), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(o,o+$-1);c&&(y=y.gte("created_at",c)),n&&(y=y.lte("created_at",n+"T23:59:59")),r&&(y=y.eq("campaign_round",r));const{data:a,error:l}=await y;if(l||!a||a.length===0||(v.push(...a),a.length<$)||(o+=$,v.length>=1e5))break}return v}const[S,C]=await Promise.allSettled([m(),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),k=S.status==="fulfilled"?S.value||[]:[],u=C.status==="fulfilled"?C.value.data||[]:[],T=k.length,P=k.filter(v=>v.gps_lat).length,D=T-P,R=k.filter(v=>{var o;return((o=v.photos)==null?void 0:o.length)>0}).length,F=T-R,N=k.filter(v=>v.notes&&v.notes.trim()).length,M=k.filter(v=>v.governorate_id).length,j=T-M,x=u.map(v=>{const o=k.filter(h=>h.form_id===v.id),$=o.filter(h=>h.gps_lat).length,y=o.filter(h=>{var b;return((b=h.photos)==null?void 0:b.length)>0}).length,a=o.filter(h=>h.governorate_id).length;let l={};try{l=typeof v.schema=="string"?JSON.parse(v.schema):v.schema}catch(h){console.warn("[data-quality] Failed to parse form schema:",h)}const d=((l==null?void 0:l.sections)||[]).flatMap(h=>h.fields||[]).map(h=>{const b=h.name||h.id||h.label_ar,O=o.filter(g=>{var E;const w=(E=g.data)==null?void 0:E[b];return w!=null&&w!==""&&w!==0}).length;return{label:h.label_ar||b,type:h.type,filled:O,total:o.length,rate:o.length>0?Math.round(O/o.length*100):0}});return{name:v.title_ar,total:o.length,gpsRate:o.length>0?Math.round($/o.length*100):0,photoRate:o.length>0?Math.round(y/o.length*100):0,govRate:o.length>0?Math.round(a/o.length*100):0,fieldCompleteness:d,overallQuality:o.length>0?Math.round(($+y+a)/(o.length*3)*100):0}});function i(v){return v>=80?t.success:v>=50?t.warning:t.accent}const p=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير جودة البيانات","تحليل شامل لاكتمال وجودة البيانات المدخلة"+De(r))}

      ${H("📊","مؤشرات جودة البيانات")}
      <div class="kpi-grid">
        ${I("إجمالي الإرساليات",T,"📋",t.primary)}
        ${I("مع GPS",`${Math.round(P/T*100)}%`,"📍",i(Math.round(P/T*100)),`${P}/${T}`)}
        ${I("مع صور",`${Math.round(R/T*100)}%`,"📷",i(Math.round(R/T*100)),`${R}/${T}`)}
        ${I("مع محافظة",`${Math.round(M/T*100)}%`,"🏛️",i(Math.round(M/T*100)),`${M}/${T}`)}
        ${I("بلا GPS",D,"⚠️",t.accent)}
        ${I("بلا صور",F,"⚠️",t.accent)}
        ${I("بلا محافظة",j,"⚠️",t.accent)}
        ${I("ملاحظات مكتوبة",N,"📝",t.info)}
      </div>

      ${D>0?`<div class="alert-box alert-warning">⚠️ ${D} إرسالية (${Math.round(D/T*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>`:""}
      ${j>0?`<div class="alert-box alert-danger">🚨 ${j} إرسالية (${Math.round(j/T*100)}%) بلا محافظة — يجب إصلاحها</div>`:""}

      ${H("📝","جودة البيانات حسب النموذج")}
      ${ge(["#","النموذج","الإرساليات","GPS","صور","محافظة","الجودة الإجمالية"],x.map((v,o)=>[`${o+1}`,`<strong>${L(v.name)}</strong>`,`<span class="num">${v.total}</span>`,`<span class="num" style="color:${i(v.gpsRate)}">${v.gpsRate}%</span>`,`<span class="num" style="color:${i(v.photoRate)}">${v.photoRate}%</span>`,`<span class="num" style="color:${i(v.govRate)}">${v.govRate}%</span>`,`<span class="score-badge" style="background:${i(v.overallQuality)}">${v.overallQuality}%</span>`]))}

      ${x.filter(v=>v.fieldCompleteness.length>0).map(v=>`
        ${H("🔤",`تحليل حقول: ${v.name}`)}
        ${ge(["الحقل","النسبة","مُملأ/الإجمالي"],v.fieldCompleteness.sort((o,$)=>o.rate-$.rate).map(o=>[L(o.label),`<span style="color:${i(o.rate)};font-weight:700">${o.rate}%</span>`,`<span class="num">${o.filled}/${o.total}</span>`]))}
        ${v.fieldCompleteness.map(o=>Qe(o.label,o.filled,o.total,i(o.rate))).join("")}
      `).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(p,"تقرير_جودة_البيانات")}async function bo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,m=e==null?void 0:e.governorateId,S=o=>(c&&(o=o.gte("created_at",c)),n&&(o=o.lte("created_at",n+"T23:59:59")),m&&m!=="all"&&(o=o.eq("governorate_id",m)),o),[C,k]=await Promise.allSettled([S(U.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null)).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),u=C.status==="fulfilled"?C.value.data||[]:[],T=k.status==="fulfilled"?k.value.data||[]:[],P=u.filter(o=>!o.is_resolved),D=u.filter(o=>o.is_resolved),R=P.filter(o=>o.severity==="critical"),F=P.filter(o=>o.severity==="high"),N=P.filter(o=>o.severity==="medium"),M=P.filter(o=>o.severity==="low"),j=T.map(o=>{const $=u.filter(a=>a.governorate_id===o.id),y=$.filter(a=>!a.is_resolved);return{name:o.name_ar,total:$.length,unresolved:y.length,critical:y.filter(a=>a.severity==="critical").length,high:y.filter(a=>a.severity==="high").length}}).filter(o=>o.total>0).sort((o,$)=>$.unresolved-o.unresolved),x={};P.forEach(o=>{const $=o.item_category||"أخرى";x[$]=(x[$]||0)+1});const i={critical:"🔴 حرج",high:"🟠 عالي",medium:"🟡 متوسط",low:"🟢 منخفض"},p={critical:t.accent,high:"#E65100",medium:t.warning,low:t.success},v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير النواقص والاحتياجات","تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات"+De(r))}

      ${H("📊","ملخص النواقص")}
      <div class="kpi-grid">
        ${I("إجمالي النواقص",u.length,"📦",t.primary)}
        ${I("غير محلولة",P.length,"⚠️",t.accent)}
        ${I("محلولة",D.length,"✅",t.success)}
        ${I("حرجة",R.length,"🚨",t.accent)}
        ${I("عالية",F.length,"🟠","#E65100")}
        ${I("متوسطة",N.length,"🟡",t.warning)}
        ${I("منخفضة",M.length,"🟢",t.success)}
        ${I("معدل الحل",`${u.length>0?Math.round(D.length/u.length*100):0}%`,"📈",t.info)}
      </div>

      ${R.length>0?`
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${R.length} نقص حرج يحتاج تدخل فوري!
        </div>
      `:""}

      ${P.length>0?`
        ${H("⚠️","النواقص غير المحلولة",`${P.length} نقص`)}
        ${ge(["#","النقص","الفئة","المحافظة","الخطورة","الكمية","المُبلّغ","التاريخ"],P.map((o,$)=>{var y,a;return[`${$+1}`,`<strong>${L(o.item_name)}</strong>`,L(o.item_category||"—"),L(((y=o.governorates)==null?void 0:y.name_ar)||"—"),`<span style="color:${p[o.severity]||t.textMuted};font-weight:700">${i[o.severity]||o.severity}</span>`,`<span class="num">${o.quantity_needed||"—"}</span>`,L(((a=o.profiles)==null?void 0:a.full_name)||"—"),new Date(o.created_at).toLocaleDateString("ar-SA")]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${j.length>0?`
        ${H("🏛️","النواقص حسب المحافظة")}
        ${ge(["#","المحافظة","الإجمالي","غير محلولة","حرجة","عالية"],j.map((o,$)=>[`${$+1}`,`<strong>${L(o.name)}</strong>`,`<span class="num">${o.total}</span>`,`<span class="num" style="color:${o.unresolved>0?t.accent:t.success}">${o.unresolved}</span>`,`<span class="num" style="color:${t.accent}">${o.critical}</span>`,`<span class="num" style="color:#E65100">${o.high}</span>`]))}
      `:""}

      ${Object.keys(x).length>0?`
        ${H("📂","النواقص حسب الفئة")}
        ${ge(["الفئة","العدد"],Object.entries(x).sort((o,$)=>$[1]-o[1]).map(([o,$])=>[L(o),`<span class="num">${$}</span>`]))}
      `:""}

      ${D.length>0?`
        <div class="page-break"></div>
        ${H("✅","النواقص المحلولة",`${D.length} نقص`)}
        ${ge(["#","النقص","المحافظة","تاريخ الحل"],D.slice(0,20).map((o,$)=>{var y;return[`${$+1}`,L(o.item_name),L(((y=o.governorates)==null?void 0:y.name_ar)||"—"),o.resolved_at?new Date(o.resolved_at).toLocaleDateString("ar-SA"):"—"]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(v,"تقرير_النواقص_التفصيلي")}async function xo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date,n=new Date(c.getTime()-7*864e5),m=new Date(c.getTime()-14*864e5),[S,C,k,u]=await Promise.allSettled([rt(U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",n.toISOString()).is("deleted_at",null),r),rt(U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",m.toISOString()).lt("created_at",n.toISOString()).is("deleted_at",null),r),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),T=S.status==="fulfilled"?S.value.data||[]:[],P=C.status==="fulfilled"&&C.value.count||0,D=k.status==="fulfilled"?k.value.data||[]:[],R=u.status==="fulfilled"?u.value.data||[]:[],F=T.filter($=>$.status==="submitted").length,N=T.filter($=>$.status==="draft").length,M=new Set(T.map($=>$.submitted_by)).size,j=new Set(T.map($=>$.governorate_id).filter(Boolean)).size,x=T.length-P,i=P>0?Math.round(x/P*100):0,p=Array.from({length:7},($,y)=>{const a=new Date(n.getTime()+y*864e5),l=a.toISOString().split("T")[0],f=a.toLocaleDateString("ar-SA",{weekday:"long"}),d=T.filter(h=>h.created_at.startsWith(l));return{day:f,date:l,count:d.length,submitted:d.filter(h=>h.status==="submitted").length}}),v=R.map($=>({name:$.name_ar,count:T.filter(y=>y.governorate_id===$.id).length})).sort(($,y)=>y.count-$.count).filter($=>$.count>0),o=`
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("التقرير الأسبوعي",`ملخص الأسبوع — ${Pe(n)} إلى ${Pe(c)}${De(r)}`)}

      ${H("📊","مؤشرات الأسبوع")}
      <div class="kpi-grid">
        ${I("إرساليات الأسبوع",T.length,"📋",t.primary,`${x>=0?"+":""}${i}% vs الأسبوع السابق`)}
        ${I("مرسلة",F,"✅",t.success,`${T.length>0?Math.round(F/T.length*100):0}%`)}
        ${I("مسودة",N,"📝",t.warning)}
        ${I("مشرفين نشطين",M,"👥","#7B1FA2",`من ${D.filter($=>$.is_active).length}`)}
        ${I("محافظات نشطة",j,"🏛️",t.info,`من ${R.length}`)}
        ${I("متوسط يومي",Math.round(T.length/7),"📊",t.primary)}
      </div>

      ${H("📅","النشاط اليومي")}
      ${ge(["اليوم","التاريخ","الإرساليات","مرسلة"],p.map($=>[$.day,$.date,`<span class="num">${$.count}</span>`,`<span class="num">${$.submitted}</span>`]))}

      ${v.length>0?`
        ${H("🏛️","أداء المحافظات هذا الأسبوع")}
        ${v.map($=>Qe($.name,$.count,Math.max(...v.map(y=>y.count),1),t.primary)).join("")}
      `:""}

      ${x<0?`
        <div class="alert-box alert-warning">
          ⚠️ انخفاض الإرساليات بنسبة ${Math.abs(i)}% مقارنة بالأسبوع السابق. يجب متابعة المشرفين.
        </div>
      `:x>0?`
        <div class="alert-box alert-success">
          ✅ زيادة الإرساليات بنسبة ${i}% مقارنة بالأسبوع السابق. أداء ممتاز!
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(o,"التقرير_الأسبوعي")}async function yo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,m=M=>(c&&(M=M.gte("created_at",c)),n&&(M=M.lte("created_at",n+"T23:59:59")),M),[S,C]=await Promise.allSettled([U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("last_login",{ascending:!1}),m(rt(U.from("form_submissions").select("submitted_by, created_at").is("deleted_at",null),r))]),k=S.status==="fulfilled"?S.value.data||[]:[],u=C.status==="fulfilled"?C.value.data||[]:[],T={admin:"🔴 مدير النظام",central:"🟣 مركزي",governorate:"🔵 محافظة",district:"🟢 مديرية",data_entry:"⚪ إدخال بيانات"},P=k.map(M=>{const j=u.filter(p=>p.submitted_by===M.id),x=j.length>0?j.sort((p,v)=>new Date(v.created_at).getTime()-new Date(p.created_at).getTime())[0].created_at:null,i=M.last_login?Math.floor((Date.now()-new Date(M.last_login).getTime())/864e5):999;return{...M,totalSubs:j.length,lastSub:x,daysSinceLogin:i}}),D=P.filter(M=>M.is_active&&M.daysSinceLogin<=7),R=P.filter(M=>M.is_active&&M.daysSinceLogin>30),F=P.filter(M=>!M.last_login),N=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير نشاط المستخدمين","تحليل شامل لنشاط ودخول المستخدمين"+De(r))}

      ${H("📊","ملخص المستخدمين")}
      <div class="kpi-grid">
        ${I("إجمالي المستخدمين",k.length,"👥",t.primary)}
        ${I("نشطين",D.length,"🟢",t.success)}
        ${I("خاملين (+30 يوم)",R.length,"🟡",t.warning)}
        ${I("لم يدخلوا أبداً",F.length,"🔴",t.accent)}
      </div>

      ${H("👥","قائمة المستخدمين",`${k.length} مستخدم`)}
      ${ge(["#","الاسم","البريد","الدور","المحافظة/المديرية","الإرساليات","آخر دخول","الحالة"],P.map((M,j)=>{var x,i;return[`${j+1}`,`<strong>${L(M.full_name)}</strong>`,L(M.email),T[M.role]||M.role,L(((x=M.governorates)==null?void 0:x.name_ar)||((i=M.districts)==null?void 0:i.name_ar)||"—"),`<span class="num">${M.totalSubs}</span>`,M.last_login?new Date(M.last_login).toLocaleDateString("ar-SA"):"لم يدخل",M.is_active?M.daysSinceLogin<=7?"🟢 نشط":M.daysSinceLogin<=30?"🟡 خامل":"🔴 متوقف":"⚫ معطل"]}))}

      ${F.length>0?`
        ${H("🚨","مستخدمون لم يدخلوا أبداً")}
        <div class="alert-box alert-warning">
          ${F.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(N,"تقرير_نشاط_المستخدمين")}t.accent,t.warning,t.success;t.success,t.warning,t.accent,t.info;async function $o(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date;async function n(_,A,G){const Y=[];let X=0;const V=1e3;for(;;){let le=U.from(_).select(A).is("deleted_at",null).order("created_at",{ascending:!1}).range(X,X+V-1);G&&(le=G(le));const{data:de,error:be}=await le;if(be||!de||de.length===0||(Y.push(...de),de.length<V)||(X+=V,Y.length>=1e5))break}return Y}await U.auth.getSession();async function m(){const _=`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, phone),
      governorates(id, name_ar),
      districts(id, name_ar)
    `;let A=await n("form_submissions",_,G=>r?G.eq("campaign_round",r):G);return A.length===0&&r&&(console.warn(`[ChallengesReport] No data for round ${r}, retrying without round filter`),A=await n("form_submissions",_)),A}const S=await m(),[C,k,u,T,P]=await Promise.allSettled([U.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("*").eq("is_active",!0).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),n("audit_logs","*, profiles(full_name)",_=>_.in("action",["create","update","delete"]))]),D=S||[],R=C.status==="fulfilled"?C.value.data||[]:[],F=k.status==="fulfilled"?k.value.data||[]:[],N=u.status==="fulfilled"?u.value.data||[]:[],M=T.status==="fulfilled"?T.value.data||[]:[],j=P.status==="fulfilled"?P.value||[]:[];let x=D;e!=null&&e.dateFrom&&(x=x.filter(_=>_.created_at>=e.dateFrom)),e!=null&&e.dateTo&&(x=x.filter(_=>_.created_at<=e.dateTo+"T23:59:59")),e!=null&&e.governorateId&&e.governorateId!=="all"&&(x=x.filter(_=>{var A,G;return((G=(A=_.governorates)==null?void 0:A[0])==null?void 0:G.id)||e.governorateId===""}));const i=new Set(x.map(_=>{var A,G;return((G=(A=_.governorates)==null?void 0:A[0])==null?void 0:G.id)||""}).filter(Boolean)),p=F.filter(_=>!i.has(_.id)),v=new Set(x.map(_=>{var A,G;return((G=(A=_.districts)==null?void 0:A[0])==null?void 0:G.id)||""}).filter(Boolean)),o=N.filter(_=>!v.has(_.id)),$=["data_entry","district","governorate"],y=M.filter(_=>$.includes(_.role)&&_.is_active);c.toDateString();const a=new Set(x.filter(_=>new Date(_.created_at).getTime()>c.getTime()-7*864e5).map(_=>{var A,G;return((G=(A=_.profiles)==null?void 0:A[0])==null?void 0:G.full_name)||""})),l=y.filter(_=>!a.has(_.id)),f=F.map(_=>{const A=x.filter(V=>{var le,de;return((de=(le=V.governorates)==null?void 0:le[0])==null?void 0:de.id)||_.id===""}),G=A.filter(V=>V.status==="submitted").length,Y=A.filter(V=>V.status==="draft").length,X=A.length;return{gov:_,total:X,submitted:G,draft:Y,completionRate:X>0?Math.round(G/X*100):0,draftRate:X>0?Math.round(Y/X*100):0}}).filter(_=>_.total>0),d=x.filter(_=>_.gps_lat&&_.gps_lng),h=x.length>0?Math.round(d.length/x.length*100):0,b=x.filter(_=>_.photos&&_.photos.length>0),O=x.length>0?Math.round(b.length/x.length*100):0,g=R.filter(_=>!_.is_resolved),w=g.filter(_=>_.severity==="critical"),E=g.filter(_=>_.severity==="high"),W=[];x.forEach(_=>{var G,Y,X,V,le,de;const A=[];(!_.gps_lat||!_.gps_lng)&&A.push("بدون إحداثيات GPS"),(!_.photos||_.photos.length===0)&&A.push("بدون صور"),_.status==="draft"&&A.push("مسودة غير مُرسلة"),A.length>0&&W.push({gov:((Y=(G=_.governorates)==null?void 0:G[0])==null?void 0:Y.name_ar)||"—",dist:((V=(X=_.districts)==null?void 0:X[0])==null?void 0:V.name_ar)||"—",team:((de=(le=_.profiles)==null?void 0:le[0])==null?void 0:de.full_name)||"—",issue:A.join("، "),severity:_.status==="draft"?"medium":"low",gps:_.gps_lat&&_.gps_lng?`${_.gps_lat.toFixed(4)}, ${_.gps_lng.toFixed(4)}`:"غير متوفر"})}),N.map(_=>{const A=x.filter(G=>{var Y,X;return((X=(Y=G.districts)==null?void 0:Y[0])==null?void 0:X.id)||_.id===""});return{dist:_,gov:F.find(G=>{var Y,X;return G.id===((X=(Y=_.governorates)==null?void 0:Y[0])==null?void 0:X.id)||""}),total:A.length,submitted:A.filter(G=>G.status==="submitted").length}}).filter(_=>_.total===0||_.submitted===0);const te=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير التحديات والصعوبات — EPI Supervisor</title>
      ${Ee()}
      <style>
        .challenge-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 16px;
          margin: 12px 0;
          background: white;
          page-break-inside: avoid;
          border-right: 5px solid;
        }
        .challenge-card.severity-critical { border-right-color: ${t.accent}; background: #FFF5F5; }
        .challenge-card.severity-high { border-right-color: #E65100; background: #FFF8F0; }
        .challenge-card.severity-medium { border-right-color: ${t.warning}; background: #FFFEF5; }
        .challenge-card.severity-low { border-right-color: ${t.success}; background: #F5FFF5; }
        .challenge-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid ${t.border};
        }
        .challenge-title { font-size: 13px; font-weight: 800; color: ${t.textDark}; }
        .challenge-meta { font-size: 11px; color: ${t.textMuted}; display: flex; gap: 12px; flex-wrap: wrap; }
        .challenge-meta-item { display: flex; align-items: center; gap: 4px; }
        .challenge-body { font-size: 11px; line-height: 1.8; color: ${t.textDark}; }
        .challenge-section { margin-top: 10px; }
        .challenge-section-title { font-size: 11px; font-weight: 700; color: ${t.primary}; margin-bottom: 6px; }
        .tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          margin: 2px;
        }
        .tag-gov { background: #E3F2FD; color: #1565C0; }
        .tag-dist { background: #F3E5F5; color: #7B1FA2; }
        .tag-gps { background: #E0F7FA; color: #00695C; }
        .tag-status { background: #FFF3E0; color: #E65100; }
        .action-box {
          background: #E8F5E9;
          border: 1px solid #C8E6C9;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 12px;
        }
        .action-box strong { color: ${t.success}; }
        .recommendation-box {
          background: #E3F2FD;
          border: 1px solid #BBDEFB;
          border-radius: 8px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 12px;
        }
        .recommendation-box strong { color: ${t.primary}; }
        .gps-coord {
          font-family: monospace;
          font-size: 12px;
          color: #00695C;
          background: #E0F7FA;
          padding: 2px 6px;
          border-radius: 4px;
          direction: ltr;
          display: inline-block;
        }
      </style>
    </head>
    <body>
      ${je("تقرير التحديات والصعوبات","تحليل شامل — التحديات، الإجراءات المتخذة، التوصيات"+De(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${H("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${I("إجمالي الإرساليات",x.length,"📋",t.primary)}
        ${I("محافظات بدون تغطية",p.length,"🏛️",p.length>0?t.accent:t.success)}
        ${I("مديريات بدون تغطية",o.length,"📍",o.length>0?t.accent:t.success)}
        ${I("مشرفين غير نشطين",l.length,"👥",l.length>0?t.warning:t.success)}
        ${I("نواقص حرجة",w.length,"🚨",w.length>0?t.accent:t.success)}
        ${I("معدل GPS",`${h}%`,"📡",h>=80?t.success:t.warning)}
        ${I("معدل الصور",`${O}%`,"📷",O>=80?t.success:t.warning)}
        ${I("معدل الإنجاز",`${f.length>0?Math.round(f.reduce((_,A)=>_+A.completionRate,0)/f.length):0}%`,"🎯",t.info)}
      </div>

      <!-- ═══ 1. التحديات الجغرافية ═══ -->
      ${p.length>0||o.length>0?`
        ${H("🗺️","التحديات الجغرافية — فجوات التغطية")}

        ${p.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">⚠️ محافظات بدون أي تغطية</div>
              <span class="tag tag-status">${p.length} محافظة</span>
            </div>
            <div class="challenge-body">
              <p>المحافظات التالية لم تسجل أي إرساليات في الفترة المحددة:</p>
              <div style="margin-top: 8px;">
                ${p.map(_=>`<span class="tag tag-gov">${L(_.name_ar)}</span>`).join(" ")}
              </div>
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> رفع تقرير للمديرية العامة بخصوص المحافظات غير النشطة. التواصل مع مدراء مكاتب الصحة في هذه المحافظات لتحديد المعوقات.
              </div>
              <div class="recommendation-box">
                <strong>💡 التوصية:</strong> إرسال فرق دعم ميداني للمحافظات غير المغطاة. تحديد موعد نهائي لإطلاق حملات التغطية. تفعيل آلية المتابعة اليومية.
              </div>
            </div>
          </div>
        `:""}

        ${o.length>0?`
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">📍 مديريات بدون تغطية</div>
              <span class="tag tag-status">${o.length} مديرية</span>
            </div>
            <div class="challenge-body">
              <p>المديريات التالية لم تسجل أي إرساليات:</p>
              <div style="margin-top: 8px; max-height: 200px; overflow-y: auto;">
                ${o.slice(0,20).map(_=>{const A=F.find(G=>{var Y,X;return G.id===((X=(Y=_.governorates)==null?void 0:Y[0])==null?void 0:X.id)||""});return`<span class="tag tag-dist">${L(_.name_ar)}</span> <span class="tag tag-gov">${L((A==null?void 0:A.name_ar)||"—")}</span>`}).join("<br>")}
                ${o.length>20?`<p style="color:${t.textMuted};font-size:10px;margin-top:4px;">... و ${o.length-20} مديرية أخرى</p>`:""}
              </div>
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 2. التحديات اللوجستية — النواقص ═══ -->
      ${g.length>0?`
        ${H("📦","التحديات اللوجستية — النواقص المعلقة")}

        ${w.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">🚨 نواقص حرجة — تحتاج تدخل فوري</div>
              <span class="tag tag-status">${w.length} نقص حرج</span>
            </div>
            <div class="challenge-body">
              ${ge(["النقص","الفئة","المحافظة","المديرية","المطلوب","المتاح","المُبلّغ"],w.map(_=>{var A,G,Y,X,V,le;return[`<strong>${L(_.item_name)}</strong>`,L(_.item_category||"—"),L(((G=(A=_.governorates)==null?void 0:A[0])==null?void 0:G.name_ar)||"—"),L(((X=(Y=_.districts)==null?void 0:Y[0])==null?void 0:X.name_ar)||"—"),`${_.quantity_needed||"—"}`,`${_.quantity_available||0}`,L(((le=(V=_.profiles)==null?void 0:V[0])==null?void 0:le.full_name)||"—")]}))}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> رفع طلب عاجل لهيئة التوريدات الطبية. التواصل مع المنظمات الشريكة (UNICEF, WHO) لتوفير النواقص الحرجة. تفعيل نظام الإقراض المؤقت بين المحافظات.
              </div>
              <div class="recommendation-box">
                <strong>💡 التوصية:</strong> إنشاء مخزون طوارئ استراتيجي. تفعيل نظام الإنذار المبكر للنواقص. مراجعة دورة التوريد وتحديد العوائق.
              </div>
            </div>
          </div>
        `:""}

        ${E.length>0?`
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">🟠 نواقص عالية الأولوية</div>
              <span class="tag tag-status">${E.length} نقص</span>
            </div>
            <div class="challenge-body">
              ${ge(["النقص","المحافظة","المطلوب","المتاح","الفرق"],E.slice(0,10).map(_=>{var A,G;return[L(_.item_name),L(((G=(A=_.governorates)==null?void 0:A[0])==null?void 0:G.name_ar)||"—"),`${_.quantity_needed||"—"}`,`${_.quantity_available||0}`,`<span style="color:${t.accent};font-weight:700">${Math.max(0,(_.quantity_needed||0)-(_.quantity_available||0))}</span>`]}))}
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 3. التحديات البشرية ═══ -->
      ${l.length>0?`
        ${H("👥","التحديات البشرية — المشرفين غير النشطين")}
        <div class="challenge-card severity-medium">
          <div class="challenge-header">
            <div class="challenge-title">⚠️ مشرفون لم يرسلوا بيانات منذ أكثر من 7 أيام</div>
            <span class="tag tag-status">${l.length} مشرف</span>
          </div>
          <div class="challenge-body">
            ${ge(["المشرف","الدور","المحافظة/المديرية","الهاتف","آخر دخول"],l.slice(0,15).map(_=>{var A,G,Y,X;return[`<strong>${L(_.full_name)}</strong>`,_.role==="data_entry"?"إدخال بيانات":_.role==="district"?"مديرية":"محافظة",L(((G=(A=_.governorates)==null?void 0:A[0])==null?void 0:G.name_ar)||((X=(Y=_.districts)==null?void 0:Y[0])==null?void 0:X.name_ar)||"—"),_.phone||"—",_.last_login?new Date(_.last_login).toLocaleDateString("ar-SA"):"لم يدخل"]}))}
            ${l.length>15?`<p style="color:${t.textMuted};font-size:10px;margin-top:8px;">... و ${l.length-15} مشرف آخر</p>`:""}
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> إرسال تنبيهات SMS/WhatsApp للمشرفين غير النشطين. التواصل المباشر مع مدراء المحافظات لمتابعة أسباب عدم النشاط. تفعيل نظام المكافأة والمحاسبة.
            </div>
            <div class="recommendation-box">
              <strong>💡 التوصية:</strong> تدريب مكثف للمشرفين الجدد. تبسيط عملية الإدخال. توفير أجهزة لوحي للمشرفين. تفعيل نظام المتابعة اليومية.
            </div>
          </div>
        </div>
      `:""}

      <!-- ═══ 4. تحديات جودة البيانات ═══ -->
      ${H("📊","تحديات جودة البيانات")}

      <div class="challenge-card severity-${h<80?"high":"low"}">
        <div class="challenge-header">
          <div class="challenge-title">📡 تغطية نظام تحديد المواقع (GPS)</div>
          <span class="tag tag-gps">${h}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${Qe("إحداثيات GPS",d.length,x.length,h>=80?t.success:h>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${d.length} من ${x.length} إرسالية تحتوي إحداثيات GPS
          </p>
          ${h<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل GPS الإجباري في التطبيق. تدريب المشرفين على استخدام نظام تحديد المواقع. مراجعة إعدادات الأجهزة.
            </div>
          `:""}
        </div>
      </div>

      <div class="challenge-card severity-${O<80?"high":"low"}">
        <div class="challenge-header">
          <div class="challenge-title">📷 تغطية الصور الميدانية</div>
          <span class="tag tag-gps">${O}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${Qe("صور مرفقة",b.length,x.length,O>=80?t.success:O>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${b.length} من ${x.length} إرسالية تحتوي صور
          </p>
          ${O<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل رفع الصور الإجباري. توفير كاميرات للمشرفين. تبسيط عملية رفع الصور.
            </div>
          `:""}
        </div>
      </div>

      <!-- ═══ 5. تحديات الإنجاز ═══ -->
      ${f.filter(_=>_.draftRate>30).length>0?`
        ${H("📝","تحديات الإنجاز — محافظات بنسب مسودات عالية")}
        ${f.filter(_=>_.draftRate>30).map(_=>`
          <div class="challenge-card severity-medium">
            <div class="challenge-header">
              <div class="challenge-title">📝 ${L(_.gov.name_ar)} — نسبة المسودات ${_.draftRate}%</div>
              <span class="tag tag-gov">${_.total} إرسالية</span>
            </div>
            <div class="challenge-body">
              <div style="display:flex;gap:16px;margin-bottom:8px;">
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مرسلة:</span>
                  <span style="font-weight:700;color:${t.success}">${_.submitted}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مسودة:</span>
                  <span style="font-weight:700;color:${t.warning}">${_.draft}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">نسبة الإنجاز:</span>
                  <span style="font-weight:700;color:${_.completionRate>=70?t.success:t.accent}">${_.completionRate}%</span>
                </div>
              </div>
              ${Qe("نسبة الإرسال",_.submitted,_.total,_.completionRate>=70?t.success:t.warning)}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> متابعة مشرفي ${L(_.gov.name_ar)} لاعتماد المسودات المعلقة. تحديد الأسباب (مشاكل تقنية، نقص تدريب، ضعف إنترنت).
              </div>
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ 6. أحداث ميدانية — من سجل التدقيق ═══ -->
      ${j.length>0?`
        ${H("📋","أحدث ميدانية مسجلة")}
        ${ge(["التاريخ","المستخدم","الإجراء","الجدول","IP"],j.slice(0,15).map(_=>{var A,G;return[new Date(_.created_at).toLocaleDateString("ar-SA"),L(((G=(A=_.profiles)==null?void 0:A[0])==null?void 0:G.full_name)||"النظام"),_.action==="create"?"✅ إنشاء":_.action==="update"?"📝 تعديل":"🗑️ حذف",_.table_name==="form_submissions"?"إرساليات":_.table_name==="supply_shortages"?"نواقص":_.table_name,_.ip_address||"—"]}))}
      `:""}

      <!-- ═══ 7. ملخص التوصيات ═══ -->
      ${H("💡","ملخص التوصيات والإجراءات الاستراتيجية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="recommendation-box">
          <strong>🎯 التغطية الجغرافية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${p.length>0?`<li>تفعيل ${p.length} محافظة غير نشطة</li>`:""}
            ${o.length>0?`<li>تغطية ${o.length} مديرية فارغة</li>`:""}
            <li>نشر فرق دعم ميداني للمناطق النائية</li>
            <li>تفعيل حملات التحصين المتنقلة</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>👥 الموارد البشرية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${l.length>0?`<li>متابعة ${l.length} مشرف غير نشط</li>`:""}
            <li>برامج تدريب مكثفة</li>
            <li>تفعيل نظام الحوافز</li>
            <li>توفير أجهزة وإنترنت</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📦 اللوجستيات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${w.length>0?`<li>معالجة ${w.length} نقص حرج فوراً</li>`:""}
            <li>إنشاء مخزون طوارئ</li>
            <li>تحسين سلسلة التوريد</li>
            <li>شراكات مع المنظمات الدولية</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📊 جودة البيانات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${h<80?`<li>رفع معدل GPS من ${h}% إلى 90%</li>`:""}
            ${O<80?`<li>رفع معدل الصور من ${O}% إلى 85%</li>`:""}
            <li>مراجعة وإعتماد المسودات المعلقة</li>
            <li>تفعيل المزامنة التلقائية</li>
          </ul>
        </div>
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(te,"تقرير_التحديات_والصعوبات")}const at={team_info:{title:"أ — معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"],target:100},work_environment:{title:"ب — بيئة العمل والتنسيق",icon:"🏥",fields:["suitable_location","community_coordination","has_speaker","has_transport","previous_visit"],target:100},records_docs:{title:"ج — السجلات والوثائق",icon:"📋",fields:["complete_records","daily_work_forms","correct_data_entry","next_visit_noted"],target:100},vaccination_cards:{title:"د — بطاقات التحصين",icon:"💳",fields:["child_vaccination_cards","women_vaccination_cards"],target:100},service_quality:{title:"هـ — جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","respiratory_rate_check","muac_measurement","ors_provision","clean_delivery_kit","nutrition_assessment"],target:100},vitamins_referral:{title:"و — الفيتامينات والإحالة",icon:"💊",fields:["vitamin_a_children","vitamin_a_women","facility_referral","correct_medication","nutrition_counseling"],target:100},vaccine_handling:{title:"ز — التعامل مع اللقاحات",icon:"💉",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"],target:100},supplies_equipment:{title:"ح — الإمدادات والمعدات",icon:"📦",fields:["family_planning_available","folic_iron_stock","fetal_stethoscope","bp_device","muac_tape","height_board","thermometer","scale","daily_supply_tracking"],target:100},catch_up_policy:{title:"ط — سياسة الالتحاق بالركب",icon:"🎯",fields:["has_vaccine_carrier","vaccines_sufficient","correct_vaccine_site","catch_up_knowledge","catch_up_training","catch_up_2to5_registration","team_target_knowledge"],target:100},defaulter_tracking:{title:"ي — تتبع المتخلفين",icon:"🔍",fields:["has_defaulter_mechanism","has_previous_vaccination_records"],target:95},aefi:{title:"ك — الآثار الجانبية",icon:"⚠️",fields:["aefi_knowledge","aefi_mothers_info"],target:100}},ca={has_activity_plan:"لدى الفريق خطة وخارطة القرى المستهدفة",has_doctor_or_trained:"أحد أعضاء الفريق طبيب أو فني مدرب",wearing_uniform:"يلتزم الفريق بلبس الزي (البالطو)",suitable_location:"المكان مناسب ويضمن الخصوصية",community_coordination:"تم التنسيق المسبق مع المجتمع",has_speaker:"يتوفر مع الفريق مكبر صوت",has_transport:"توجد وسيلة نقل مناسبة",previous_visit:"تمت زيارة الفريق من المستوى الأعلى",complete_records:"تتوفر سجلات مكتملة",daily_work_forms:"توجد استمارات العمل اليومي",correct_data_entry:"يتم تدوين البيانات بشكل صحيح",next_visit_noted:"يتم تدوين العودة للزيارة القادمة",child_vaccination_cards:"يتم صرف بطاقة تحصين للأطفال",women_vaccination_cards:"يتم صرف بطاقة تحصين للنساء",good_acceptance:"يوجد إقبال جيد على الخدمة",safe_vaccination:"يتم ممارسة التطعيم الآمن",respiratory_rate_check:"يتم احتساب سرعة التنفس",muac_measurement:"يتم قياس محيط منتصف الذراع",ors_provision:"يتم إعطاء محلول الإرواء",clean_delivery_kit:"يتم تزويد الحوامل بعلبة الولادة النظيفة",nutrition_assessment:"يقوم العامل بتقييم مشاكل التغذية",vitamin_a_children:"يعطي فيتامين أ للأطفال وفق البروتوكول",vitamin_a_women:"يعطي فيتامين أ للنساء وفق البروتوكول",facility_referral:"يتم الإحالة للمرفق الصحي",correct_medication:"يتم إعطاء الأدوية بطريقة سليمة",nutrition_counseling:"يقوم العامل بالنصح حول التغذية",vaccine_disposal:"يتم التخلص من اللقاحات في الفترة المحددة",safety_box_usage:"يتم استخدام صندوق الأمان بصورة صحيحة",cold_chain_proper:"اللقاحات محفوظة بطريقة سليمة",family_planning_available:"تتوفر وسائل تنظيم الأسرة",folic_iron_stock:"لدى الفريق إمداد كافي من حمض الفوليك والحديد",fetal_stethoscope:"توجد لدى الفريق سماعة جنين",bp_device:"يتوفر سماعة فحص وجهاز ضغط الدم",muac_tape:"لدى الفريق أشرطة قياس محيط الذراع",height_board:"لدى الفريق أشرطة قياس الطول",thermometer:"لدى الفريق ترمومتر",scale:"يوجد مع الفريق ميزان",daily_supply_tracking:"يقوم الفريق بتدوين حركة الإمداد يومياً",has_vaccine_carrier:"لدى المطعم حافظة لقاح مع قوالب ثلج",vaccines_sufficient:"اللقاحات والمستلزمات متوفرة وكافية",correct_vaccine_site:"يتم إعطاء اللقاح في الموضع المناسب",catch_up_knowledge:"لدى العاملين معرفة بسياسة الالتحاق بالركب",catch_up_training:"تلقى العاملين التدريب الكافي",catch_up_2to5_registration:"يقوم المطعم بالتطعيم للأطفال 2-5 سنوات",team_target_knowledge:"لدى الفريق معرفة بالمستهدف",has_defaulter_mechanism:"يوجد آلية لتتبع المتخلفين",has_previous_vaccination_records:"يوجد سجل التطعيم للجولات السابقة",aefi_knowledge:"لدى العامل معرفة بالآثار الجانبية",aefi_mothers_info:"يقدم المطعم معلومات للأمهات حول الآثار"};function _o(e,r){const c=[r,`q_${r}`,`section_${r}`,r.toLowerCase()];for(const n of c){const m=e==null?void 0:e[n];if(m!=null&&m!==""){const S=Number(m);if(!isNaN(S))return S;if(m===!0||m==="نعم"||m==="yes")return 100;if(m===!1||m==="لا"||m==="no")return 0}}return null}function wo(e,r){return e===null?"⬜":e>=r?"✅":e>=r*.8?"⚠️":"🔴"}function da(e,r){return e===null?t.textMuted:e>=r?t.success:e>=r*.8?t.warning:t.accent}async function So(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null;await U.auth.getSession();async function c(a){let f=[],d=0;for(;;){let h=U.from("form_submissions").select("id, status, data, notes, gps_lat, gps_lng, photos, created_at, submitted_by, governorate_id, district_id, form_id").is("deleted_at",null).order("created_at",{ascending:!1}).range(d,d+1e3-1);e!=null&&e.formId&&(h=h.eq("form_id",e.formId)),e!=null&&e.dateFrom&&(h=h.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(h=h.lte("created_at",e.dateTo+"T23:59:59")),a&&(h=h.eq("campaign_round",a));const{data:b,error:O}=await h;if(O){console.error("[SupFormReport] fetch error:",O.message);break}if(!b||b.length===0||(f.push(...b),b.length<1e3)||(d+=1e3,f.length>=1e5))break}return f}let n=await c(r);n.length===0&&r&&(console.warn(`[SupFormReport] No data for round ${r}, retrying without round filter`),n=await c(null));const m={data:n},[{data:S},{data:C},{data:k},{data:u}]=await Promise.all([U.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null),U.from("forms").select("id, title_ar, campaign_type").is("deleted_at",null)]),T=new Map;for(const a of u||[])T.set(a.id,a);const P=m.data.map(a=>({...a,forms:T.get(a.form_id)||null})),D=new Map;for(const a of S||[])D.set(a.id,a);const R=new Map;for(const a of C||[])R.set(a.id,a);const F=new Map;for(const a of k||[])F.set(a.id,a);let M=(P||[]).map(a=>{const l=a.submitted_by?D.get(a.submitted_by):null,f=a.governorate_id?R.get(a.governorate_id):null,d=a.district_id?F.get(a.district_id):null;return{...a,profiles:l?[l]:[],governorates:f?[f]:[],districts:d?[d]:[]}});e!=null&&e.governorateId&&e.governorateId!=="all"&&(M=M.filter(a=>a.governorate_id===e.governorateId));const j=M.map(a=>{const l=a.data||{},f={};let d=0,h=0,b=0;for(const[g,w]of Object.entries(at)){const E=w.fields.map(_=>{const A=_o(l,_),G=wo(A,w.target);return d++,A!==null&&A<w.target&&h++,A!==null&&(b+=A),{field:_,label:ca[_]||_,value:A,target:w.target,status:G}}),W=E.filter(_=>_.value!==null),te=W.length>0?Math.round(W.reduce((_,A)=>_+(A.value||0),0)/W.length):-1;f[g]={fields:E,avgScore:te,challengeCount:E.filter(_=>_.value!==null&&_.value<w.target).length}}const O=d>0?Math.round(b/d):0;return{sub:a,sectionResults:f,overallScore:O,totalChallenges:h,totalFields:d,hasData:Object.keys(l).length>0}}).filter(a=>a.hasData),x=j.length,i=x>0?Math.round(j.reduce((a,l)=>a+l.overallScore,0)/x):0,p={};for(const a of Object.keys(at)){const l=j.filter(f=>{var d;return((d=f.sectionResults[a])==null?void 0:d.avgScore)>=0});p[a]=l.length>0?Math.round(l.reduce((f,d)=>f+d.sectionResults[a].avgScore,0)/l.length):0}const v={};j.forEach(a=>{for(const[l,f]of Object.entries(a.sectionResults))f.fields.forEach(d=>{if(d.value!==null&&d.value<d.target){const h=`${l}||${d.field}`;v[h]=(v[h]||0)+1}})});const o=Object.entries(v).sort((a,l)=>l[1]-a[1]).slice(0,10).map(([a,l])=>{var h;const[f,d]=a.split("||");return{section:((h=at[f])==null?void 0:h.title)||f,field:ca[d]||d,count:l,pct:x>0?Math.round(l/x*100):0}}),$=[...j].sort((a,l)=>l.totalChallenges-a.totalChallenges).slice(0,15),y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير استمارة الإشراف — النشاط الإيصالي التكاملي</title>
      ${Ee()}
      <style>
        .supervision-card {
          border: 1px solid ${t.border};
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          background: white;
          page-break-inside: avoid;
          border-right: 5px solid ${t.primary};
        }
        .supervision-card.worst { border-right-color: ${t.accent}; background: #FFF5F5; }
        .supervision-card.good { border-right-color: ${t.success}; background: #F5FFF5; }
        .supervision-card.warning { border-right-color: ${t.warning}; background: #FFFEF5; }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid ${t.border};
        }
        .card-title { font-size: 14px; font-weight: 800; color: ${t.textDark}; }
        .card-subtitle { font-size: 12px; color: ${t.textMuted}; margin-top: 4px; }
        .card-score {
          font-size: 28px; font-weight: 900; line-height: 1;
          padding: 8px 16px; border-radius: 12px; text-align: center;
        }
        .card-meta {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 12px; font-size: 12px; color: ${t.textMuted};
        }
        .meta-item { display: flex; align-items: center; gap: 4px; }
        .meta-icon { font-size: 12px; }
        .section-bar {
          display: flex; align-items: center; gap: 8px;
          padding: 6px 10px; margin: 4px 0;
          border-radius: 6px; font-size: 12px;
        }
        .section-bar.good { background: #E8F5E9; }
        .section-bar.warning { background: #FFF8E1; }
        .section-bar.danger { background: #FFEBEE; }
        .section-bar.neutral { background: #F5F5F5; }
        .section-icon { font-size: 14px; width: 20px; text-align: center; }
        .section-name { flex: 1; font-weight: 600; }
        .section-score { font-weight: 800; font-size: 11px; }
        .challenge-item {
          display: flex; align-items: center; gap: 6px;
          padding: 4px 8px; margin: 2px 0;
          border-radius: 4px; font-size: 11px;
        }
        .challenge-item.fail { background: #FFEBEE; }
        .challenge-item.warn { background: #FFF8E1; }
        .challenge-item.pass { background: #E8F5E9; }
        .gps-tag {
          font-family: monospace; font-size: 11px;
          color: #00695C; background: #E0F7FA;
          padding: 2px 6px; border-radius: 4px;
          direction: ltr; display: inline-block;
        }
        .team-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 12px; font-weight: 700;
          background: #E3F2FD; color: #1565C0;
        }
        .gov-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 12px; font-weight: 700;
          background: #F3E5F5; color: #7B1FA2;
        }
        .dist-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 12px;
          font-size: 12px; font-weight: 700;
          background: #E0F7FA; color: #00695C;
        }
      </style>
    </head>
    <body>
      ${je("تقرير استمارة الإشراف — النشاط الإيصالي التكاملي","تحليل تحديات 8 أقسام إشرافية × 33 مؤشر"+De(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${H("📊","ملخص الإشراف")}
      <div class="kpi-grid">
        ${I("إجمالي الاستمارات",x,"📋",t.primary)}
        ${I("متوسط الأداء العام",`${i}%`,"🎯",i>=90?t.success:i>=70?t.warning:t.accent)}
        ${I("استمارات ممتازة (90%+)",j.filter(a=>a.overallScore>=90).length,"⭐",t.success)}
        ${I("استمارات تحتاج تحسين (<70%)",j.filter(a=>a.overallScore<70).length,"⚠️",j.filter(a=>a.overallScore<70).length>0?t.accent:t.success)}
        ${I("متوسط التحديات/استمارة",x>0?(j.reduce((a,l)=>a+l.totalChallenges,0)/x).toFixed(1):"0","📉",t.warning)}
      </div>

      <!-- ═══ Section Averages — Radar-like view ═══ -->
      ${H("📈","متوسط أداء الأقسام الثمانية")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${Object.entries(at).map(([a,l])=>{const f=p[a];return`
            <div class="section-bar ${f>=90?"good":f>=70?"warning":"danger"}">
              <span class="section-icon">${l.icon}</span>
              <span class="section-name">${l.title}</span>
              <span class="section-score" style="color:${da(f,l.target)}">${f}%</span>
            </div>
          `}).join("")}
      </div>

      <!-- ═══ Top Challenges ═══ -->
      ${o.length>0?`
        ${H("🚨","أكثر التحديات تكراراً")}
        ${ge(["#","القسم","المؤشر","عدد الاستمارات","النسبة"],o.map((a,l)=>[`${l+1}`,L(a.section),`<strong>${L(a.field)}</strong>`,`${a.count}`,`<span style="color:${a.pct>50?t.accent:a.pct>25?t.warning:t.textMuted};font-weight:700">${a.pct}%</span>`]))}
      `:""}

      <!-- ═══ Worst Submissions — Detailed Cards ═══ -->
      ${$.length>0?`
        <div class="page-break"></div>
        ${H("📋","الاستمارات التي تحتاج متابعة",`${$.length} استمارة`)}

        ${$.map((a,l)=>{var g,w,E,W,te,_,A,G,Y,X,V,le,de,be;const{sub:f,sectionResults:d,overallScore:h,totalChallenges:b}=a;return`
            <div class="supervision-card ${h>=80?"warning":"worst"}">
              <div class="card-header">
                <div>
                  <div class="card-title">${l+1}. ${L(((w=(g=f.profiles)==null?void 0:g[0])==null?void 0:w.full_name)||"مشرف مجهول")}</div>
                  <div class="card-subtitle">${L(((W=(E=f.forms)==null?void 0:E[0])==null?void 0:W.title_ar)||"استمارة إشراف")}</div>
                  <div class="card-meta">
                    <span class="gov-badge">🏛️ ${L(((_=(te=f.governorates)==null?void 0:te[0])==null?void 0:_.name_ar)||"—")}</span>
                    <span class="dist-badge">📍 ${L(((G=(A=f.districts)==null?void 0:A[0])==null?void 0:G.name_ar)||"—")}</span>
                    <span class="team-badge">👥 ${L(((X=(Y=f.profiles)==null?void 0:Y[0])==null?void 0:X.full_name)||"—")}</span>
                    ${f.gps_lat&&f.gps_lng?`<span class="gps-tag">📡 ${f.gps_lat.toFixed(4)}, ${f.gps_lng.toFixed(4)}</span>`:'<span style="color:'+t.accent+';font-size:9px">⚠️ بدون GPS</span>'}
                    <span class="meta-item"><span class="meta-icon">📅</span> ${new Date(f.created_at).toLocaleDateString("ar-SA")}</span>
                    ${(le=(V=f.profiles)==null?void 0:V[0])!=null&&le.phone?`<span class="meta-item"><span class="meta-icon">📱</span> ${(be=(de=f.profiles)==null?void 0:de[0])==null?void 0:be.phone}</span>`:""}
                  </div>
                </div>
                <div class="card-score" style="color:${da(h,80)};background:${h>=80?"#E8F5E9":"#FFEBEE"}">
                  ${h}%
                </div>
              </div>

              <!-- Section breakdown -->
              ${Object.entries(at).map(([Se,_e])=>{const we=d[Se];if(!we)return"";const ze=we.avgScore;return`
                  <div class="section-bar ${ze>=90?"good":ze>=70?"warning":ze>=0?"danger":"neutral"}">
                    <span class="section-icon">${_e.icon}</span>
                    <span class="section-name">${_e.title}</span>
                    <span class="section-score" style="color:${da(ze,_e.target)}">
                      ${ze>=0?`${ze}%`:"—"}
                    </span>
                    ${we.challengeCount>0?`<span style="font-size:8px;color:${t.accent}">(${we.challengeCount} تحدي)</span>`:""}
                  </div>
                `}).join("")}

              <!-- Challenge details -->
              ${b>0?`
                <div style="margin-top:10px;">
                  <div style="font-size:10px;font-weight:700;color:${t.accent};margin-bottom:6px;">⚠️ التحديات المحددة:</div>
                  ${Object.entries(d).map(([Se,_e])=>_e.fields.filter(we=>we.value!==null&&we.value<we.target).map(we=>{var ze,He;return`
                        <div class="challenge-item fail">
                          <span>${((ze=at[Se])==null?void 0:ze.icon)||"•"}</span>
                          <span style="flex:1">${(He=at[Se])==null?void 0:He.title} — ${we.label}</span>
                          <span style="font-weight:700;color:${t.accent}">${we.value}%</span>
                          <span style="color:${t.textMuted}">(الهدف: ${we.target}%)</span>
                        </div>
                      `}).join("")).join("")}
                </div>
              `:""}

              <!-- Notes -->
              ${f.notes?`
                <div style="margin-top:8px;padding:8px;background:${t.bgLight};border-radius:6px;font-size:10px;">
                  <strong>📝 ملاحظات:</strong> ${L(f.notes)}
                </div>
              `:""}
            </div>
          `}).join("")}
      `:""}

      <!-- ═══ Recommendations ═══ -->
      ${H("💡","التوصيات الإصلاحية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${Object.entries(at).map(([a,l])=>{const f=p[a];return f>=90?`
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px;">
              <strong>${l.icon} ${l.title}:</strong>
              <span style="color:${t.success};font-weight:700">ممتاز (${f}%)</span>
              <p style="font-size:9px;color:${t.textMuted};margin-top:4px;">استمرار المتابعة والتحسين</p>
            </div>
          `:`
            <div style="background:${f>=70?"#FFF8E1":"#FFEBEE"};border:1px solid ${f>=70?"#FFECB3":"#FFCDD2"};border-radius:8px;padding:10px;">
              <strong>${l.icon} ${l.title}:</strong>
              <span style="color:${f>=70?t.warning:t.accent};font-weight:700">${f>=70?"يحتاج تحسين":"يتدخل فوري"} (${f}%)</span>
              <ul style="font-size:9px;margin:4px 0;padding-right:14px;">
                ${l.fields.map(d=>{const h=j.filter(b=>{const O=b.sectionResults[a];return O&&O.fields.find(g=>g.field===d&&g.value!==null&&g.value<l.target)}).length;return h>0?`<li>${ca[d]} — ${h} استمارة</li>`:""}).filter(Boolean).join("")}
              </ul>
            </div>
          `}).join("")}
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(y,"تقرير_استمارة_الإشراف")}const ko={challenges:{label:"التحديات والصعوبات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"الإجراءات المتخذة",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"التوصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}},ds={challenges:["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem","مشكلة","صعوبة","تحديات","صعوبات","مشاكل","عوائق"],actions:["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action","measure","إجراءات","اجراءات","تدابير","خطوات","ما تم"],recommendations:["توصي","اقتراح","ينصح","propose","recommend","توصيات","توصية","اقتراحات","يجب","من الضروري","ينبغي"]};function ga(e,r){if(!e||typeof e!="object")return null;const c=ds[r];for(const[n,m]of Object.entries(e))if(typeof m=="string"&&m.trim().length>2){for(const S of c)if(n.toLowerCase().includes(S.toLowerCase()))return m.trim()}if(e.data&&typeof e.data=="object"){for(const[n,m]of Object.entries(e.data))if(typeof m=="string"&&m.trim().length>2){for(const S of c)if(n.toLowerCase().includes(S.toLowerCase()))return m.trim()}}for(const[n,m]of Object.entries(e))if(typeof m=="string"&&m.trim().length>20){for(const S of c)if(m.toLowerCase().includes(S.toLowerCase()))return m.trim()}return null}function ua(e,r){if(!e||typeof e!="object")return null;const c=ds[r];function n(m,S=0){if(S>3)return null;for(const[C,k]of Object.entries(m)){if(typeof k=="string"&&k.trim().length>10){for(const u of c)if(C.toLowerCase().includes(u.toLowerCase())||k.toLowerCase().includes(u.toLowerCase()))return k.trim()}if(typeof k=="object"&&k!==null&&!Array.isArray(k)){const u=n(k,S+1);if(u)return u}if(Array.isArray(k)){for(const u of k)if(typeof u=="object"&&u!==null){const T=n(u,S+1);if(T)return T}}}return null}return n(e)}async function Fo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null;await U.auth.getSession();async function c(a){let f=[],d=0;for(;;){let h=U.from("form_submissions").select("id, status, data, notes, gps_lat, gps_lng, created_at, submitted_by, governorate_id, district_id").is("deleted_at",null).order("created_at",{ascending:!1}).range(d,d+1e3-1);e!=null&&e.dateFrom&&(h=h.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(h=h.lte("created_at",e.dateTo+"T23:59:59")),a&&(h=h.eq("campaign_round",a));const{data:b,error:O}=await h;if(O){console.error("[SupChallengesReport] fetch error:",O.message);break}if(!b||b.length===0||(f.push(...b),b.length<1e3)||(d+=1e3,f.length>=1e5))break}return f}let n=await c(r);n.length===0&&r&&(console.warn(`[SupChallengesReport] No data for round ${r}, retrying without round filter`),n=await c(null));const m={data:n},[{data:S},{data:C},{data:k}]=await Promise.all([U.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null)]),u=m.data,T=new Map;for(const a of S||[])T.set(a.id,a);const P=new Map;for(const a of C||[])P.set(a.id,a);const D=new Map;for(const a of k||[])D.set(a.id,a);const R=(u||[]).map(a=>{const l=a.data||{},f=ga(l,"challenges")||ua(l,"challenges"),d=ga(l,"actions")||ua(l,"actions"),h=ga(l,"recommendations")||ua(l,"recommendations"),b=a.submitted_by?T.get(a.submitted_by):null,O=a.governorate_id?P.get(a.governorate_id):null,g=a.district_id?D.get(a.district_id):null;return{challenges:f,actions:d,recommendations:h,hasAny:!!(f||d||h),hasAll:!!(f&&d&&h),govName:(O==null?void 0:O.name_ar)||"غير محدد",govId:a.governorate_id||"",distName:(g==null?void 0:g.name_ar)||"غير محدد",supervisorName:(b==null?void 0:b.full_name)||"مشرف مجهول",date:a.created_at}}),F=R.filter(a=>a.hasAny),N=new Map;for(const a of F){const l=a.govId||a.govName;N.has(l)||N.set(l,{govName:a.govName,total:0,complete:0,challengesList:[],actionsList:[],recommendationsList:[],supervisors:new Set,districts:new Set});const f=N.get(l);f.total++,a.hasAll&&f.complete++,f.supervisors.add(a.supervisorName),f.districts.add(a.distName),a.challenges&&f.challengesList.push(a.challenges),a.actions&&f.actionsList.push(a.actions),a.recommendations&&f.recommendationsList.push(a.recommendations)}const M=[...N.values()].sort((a,l)=>l.total-a.total),j=R.length,x=F.length,i=F.filter(a=>a.hasAll).length,p=F.filter(a=>a.challenges).length,v=F.filter(a=>a.actions).length,o=F.filter(a=>a.recommendations).length;function $(a,l){const f=ko[a];return l.length===0?"":`
      <div style="margin:8px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;font-weight:700;color:${f.color};">
          <span>${f.icon}</span>
          <span>${f.label}</span>
          <span style="font-size:9px;color:${t.textMuted};font-weight:400">(${l.length} نقطة)</span>
        </div>
        <div style="background:${f.bg};border:1px solid ${f.border};border-radius:8px;padding:10px 12px;">
          ${l.map((d,h)=>`
            <div style="font-size:11px;line-height:1.8;color:${t.textDark};padding:4px 0;${h>0?`border-top:1px solid ${f.border};`:""}">
              <span style="color:${t.textMuted};font-size:9px;">${h+1}.</span> ${L(d)}
            </div>
          `).join("")}
        </div>
      </div>
    `}const y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تحديات الإشراف الميداني</title>
      ${Ee()}
      <style>
        .gov-card {
          border: 1px solid ${t.border};
          border-radius: 12px;
          margin: 16px 0;
          background: white;
          page-break-inside: avoid;
          overflow: hidden;
        }
        .gov-card-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
          color: white;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .gov-card-name { font-size: 16px; font-weight: 800; }
        .gov-card-stats { font-size: 12px; opacity: 0.9; display: flex; gap: 12px; flex-wrap: wrap; margin-top: 4px; }
        .gov-card-badge {
          font-size: 22px; font-weight: 900;
          background: rgba(255,255,255,0.2);
          padding: 6px 14px; border-radius: 10px;
          text-align: center; min-width: 50px;
        }
        .gov-card-body { padding: 14px 18px; }
        .gov-meta-row {
          display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 12px; font-size: 11px;
        }
        .gov-meta-tag {
          display: inline-flex; align-items: center; gap: 3px;
          background: ${t.bgLight}; padding: 3px 10px; border-radius: 10px;
          color: ${t.textMuted};
        }
        .stat-row {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
          margin-bottom: 14px; text-align: center;
        }
        .stat-item {
          background: ${t.bgLight}; border-radius: 8px; padding: 8px;
        }
        .stat-value { font-size: 18px; font-weight: 800; }
        .stat-label { font-size: 12px; color: ${t.textMuted}; }
      </style>
    </head>
    <body>
      ${je("تقرير تحديات الإشراف الميداني","النشاط الإيصالي التكاملي — مجمّع حسب المحافظة"+De(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${H("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${I("إجمالي الاستمارات",j,"📋",t.primary)}
        ${I("مُعبأة",x,"✅",t.success,`${j>0?Math.round(x/j*100):0}%`)}
        ${I("مكتملة (3/3)",i,"⭐",t.success)}
        ${I("تحديات",p,"⚠️","#E53935",`${x>0?Math.round(p/x*100):0}%`)}
        ${I("إجراءات",v,"📋","#1565C0",`${x>0?Math.round(v/x*100):0}%`)}
        ${I("توصيات",o,"💡","#2E7D32",`${x>0?Math.round(o/x*100):0}%`)}
      </div>

      ${M.length===0?`
        <div style="text-align:center;padding:40px;color:${t.textMuted};">
          <p style="font-size:18px;">📋 لا توجد استمارات مُعبأة</p>
        </div>
      `:""}

      <!-- ═══ Cards by Governorate ═══ -->
      ${M.map(a=>{const l=a.total>0?Math.round(a.complete/a.total*100):0;return`
          <div class="gov-card">
            <div class="gov-card-header">
              <div>
                <div class="gov-card-name">🏛️ ${L(a.govName)}</div>
                <div class="gov-card-stats">
                  <span>📝 ${a.total} استمارة</span>
                  <span>👥 ${a.supervisors.size} مشرف</span>
                  <span>📍 ${a.districts.size} مديرية</span>
                </div>
              </div>
              <div class="gov-card-badge" style="color:${l>=80?"#C8E6C9":l>=50?"#FFECB3":"#FFCDD2"}">
                ${l}%
              </div>
            </div>
            <div class="gov-card-body">
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.accent}">${a.challengesList.length}</div>
                  <div class="stat-label">تحديات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.primary}">${a.actionsList.length}</div>
                  <div class="stat-label">إجراءات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.success}">${a.recommendationsList.length}</div>
                  <div class="stat-label">توصيات</div>
                </div>
              </div>

              <div class="gov-meta-row">
                ${[...a.supervisors].slice(0,8).map(f=>`<span class="gov-meta-tag">👤 ${L(f)}</span>`).join("")}
                ${a.supervisors.size>8?`<span class="gov-meta-tag">... و ${a.supervisors.size-8} آخرين</span>`:""}
              </div>

              ${$("challenges",a.challengesList)}
              ${$("actions",a.actionsList)}
              ${$("recommendations",a.recommendationsList)}
            </div>
          </div>
        `}).join("")}

      <!-- ═══ ملخص جدول ═══ -->
      ${M.length>0?`
        ${H("📍","ملخص حسب المحافظة")}
        ${ge(["المحافظة","الاستمارات","مكتملة","التحديات","الإجراءات","التوصيات","الاكتمال"],M.map(a=>[L(a.govName),`${a.total}`,`${a.complete}`,`${a.challengesList.length}`,`${a.actionsList.length}`,`${a.recommendationsList.length}`,`<span style="color:${a.total>0&&a.complete/a.total>=.8?t.success:t.warning};font-weight:700">${a.total>0?Math.round(a.complete/a.total*100):0}%</span>`]))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(y,"تقرير_تحديات_الإشراف_الميداني")}function gs(e){const r=(e||"").trim();return r.includes("مدير عام مكتب الصحة العامة والسكان بالمحافظة")?!0:["عبدالحكيم محمد احمد عيناء"].some(n=>r.includes(n))}function Ro(){return new Date().toISOString().split("T")[0]}function Do(e){return new Date(e).toLocaleDateString("ar-SA",{weekday:"long"})}const jo=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];function To(e){return`${e.getDate()} ${jo[e.getMonth()]} ${e.getFullYear()}`}async function us(e){const r=(e==null?void 0:e.date)||Ro(),c=`${r}T00:00:00`,n=`${r}T23:59:59`,m=Do(r),S=To(new Date(r)),C=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[k,u,T]=await Promise.allSettled([U.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),P=await Dt({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:p=>{let v=p.is("deleted_at",null).gte("created_at",c).lte("created_at",n);return C&&(v=v.eq("campaign_round",C)),v}}),D=k.status==="fulfilled"?k.value.data||[]:[],R=P.data,F=u.status==="fulfilled"?u.value.data||[]:[],N=T.status==="fulfilled"?T.value.data||[]:[],M=new Map;for(const p of F)M.set(p.id,p);const j=new Map;for(const p of N)j.set(p.id,p);const x=D.filter(p=>p.is_active).map(p=>{const v=R.filter(f=>f.submitted_by===p.id),o=v.filter(f=>f.status==="submitted").length,$=v.filter(f=>f.status==="draft").length,y=v.length,a=p.governorate_id?M.get(p.governorate_id):null,l=p.district_id?j.get(p.district_id):null;return{...p,totalToday:y,submittedToday:o,draftToday:$,isGenSupervisor:gs(p.full_name||""),govName:(a==null?void 0:a.name_ar)||"",govId:p.governorate_id||"",distName:(l==null?void 0:l.name_ar)||""}}),i=new Map;for(const p of F){const v=x.filter(y=>y.govId===p.id),o=v.filter(y=>y.role==="governorate"||y.role==="central"||y.role==="admin").sort((y,a)=>{const l={central:0,admin:0,governorate:1};return(l[y.role]??9)-(l[a.role]??9)}),$=new Map;for(const y of v.filter(a=>a.role==="district"||a.role==="data_entry")){const a=y.district_id||"_no_district";$.has(a)||$.set(a,[]),$.get(a).push(y)}i.set(p.id,{gov:p,allUsers:v,govLevelUsers:o,districts:$})}return{users:D,subs:R,govs:F,dists:N,enriched:x,govGroups:i,targetDate:r,dayName:m,dateArabic:S}}async function Da(e){var x,i;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[c,n,m]=await Promise.allSettled([U.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),S=await Dt({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:p=>{let v=p.is("deleted_at",null);return r&&(v=v.eq("campaign_round",r)),v}}),C=c.status==="fulfilled"?c.value.data||[]:[],k=S.data,u=n.status==="fulfilled"?n.value.data||[]:[],T=m.status==="fulfilled"?m.value.data||[]:[];let P="",D="",R=0;if(k.length>0&&(P=((x=k[0].created_at)==null?void 0:x.split("T")[0])||"",D=((i=k[k.length-1].created_at)==null?void 0:i.split("T")[0])||"",P&&D)){const p=new Date(P),v=new Date(D);R=Math.ceil((v.getTime()-p.getTime())/(1e3*60*60*24))+1}const F=new Map;for(const p of u)F.set(p.id,p);const N=new Map;for(const p of T)N.set(p.id,p);const M=C.filter(p=>p.is_active).map(p=>{const v=k.filter(f=>f.submitted_by===p.id),o=v.filter(f=>f.status==="submitted").length,$=v.filter(f=>f.status==="draft").length,y=v.length,a=p.governorate_id?F.get(p.governorate_id):null,l=p.district_id?N.get(p.district_id):null;return{...p,totalToday:y,submittedToday:o,draftToday:$,isGenSupervisor:gs(p.full_name||""),govName:(a==null?void 0:a.name_ar)||"",govId:p.governorate_id||"",distName:(l==null?void 0:l.name_ar)||""}}),j=new Map;for(const p of u){const v=M.filter(y=>y.govId===p.id),o=v.filter(y=>y.role==="governorate"||y.role==="central"||y.role==="admin").sort((y,a)=>{const l={central:0,admin:0,governorate:1};return(l[y.role]??9)-(l[a.role]??9)}),$=new Map;for(const y of v.filter(a=>a.role==="district"||a.role==="data_entry")){const a=y.district_id||"_no_district";$.has(a)||$.set(a,[]),$.get(a).push(y)}j.set(p.id,{gov:p,allUsers:v,govLevelUsers:o,districts:$})}return{users:C,subs:k,govs:u,dists:T,enriched:M,govGroups:j,dateRange:{from:P,to:D},totalDays:R}}const Eo={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function Co(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=await us(e),{enriched:n,govs:m,dists:S,subs:C,targetDate:k,dayName:u,dateArabic:T,govGroups:P}=c,D=n.filter(b=>(b.role==="central"||b.role==="admin")&&b.govId),R=[...n.filter(b=>["governorate","district","data_entry"].includes(b.role)),...D];e!=null&&e.governorateId&&e.governorateId!=="all"&&(m.filter(b=>b.id===e.governorateId),R.filter(b=>b.govId===e.governorateId));const F=R.length,N=R.filter(b=>b.totalToday>0).length,M=R.filter(b=>b.totalToday===0&&!b.isGenSupervisor).length,j=R.filter(b=>b.isGenSupervisor).length,x=C.length,i=C.filter(b=>b.status==="submitted").length,p=C.filter(b=>b.status==="draft").length,o=new Set(R.map(b=>b.govId).filter(Boolean)).size,$=m.length,y=R.filter(b=>b.role==="district"||b.role==="data_entry"),l=new Set(y.map(b=>b.district_id).filter(Boolean)).size,f=S.length;function d(b,O){let g;b.isGenSupervisor?g='<span class="status-badge status-general">إشراف عام</span>':b.totalToday>0?g='<span class="status-badge status-active">✅ نشط</span>':g='<span class="status-badge status-inactive">❌ غير نشط</span>';let w;return b.role==="central"||b.role==="admin"?w="مركزي":b.role==="governorate"?w="مشرف محافظة":b.role==="district"?w="مديرية":w="إدخال بيانات",`
      <tr class="${b.totalToday===0&&!b.isGenSupervisor?"row-inactive":""}">
        <td class="num">${O+1}</td>
        <td>
          <div class="user-name">${Eo[b.role]||"👤"} ${L(b.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${b.role}">${w}</span></td>
        <td>${L(b.govName||"—")}</td>
        <td>${L(b.distName||"—")}</td>
        <td class="num">${b.totalToday}</td>
        <td class="num num-success">${b.submittedToday}</td>
        <td class="num num-warning">${b.draftToday}</td>
        <td>${g}</td>
      </tr>
    `}const h=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين اليومي — ${T}</title>
      ${Ee()}
      <style>
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-active { background: #E8F5E9; color: ${t.success}; }
        .status-inactive { background: #FFEBEE; color: ${t.accent}; }
        .status-general { background: #E3F2FD; color: #1565C0; }

        .role-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .role-admin { background: #E3F2FD; color: #0D47A1; }
        .role-central { background: #E8EAF6; color: #283593; }
        .role-governorate { background: #E8F5E9; color: #1B5E20; }
        .role-district { background: #FFF8E1; color: #E65100; }
        .role-data_entry { background: #F5F5F5; color: #616161; }

        .user-name {
          font-weight: 700;
          font-size: 11px;
          white-space: nowrap;
        }
        .row-inactive { opacity: 0.55; }

        .gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .gov-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }

        .dist-header {
          background: ${t.bgLight};
          border-right: 4px solid ${t.info};
          padding: 8px 14px;
          border-radius: 6px;
          margin: 10px 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: ${t.primaryDark};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dist-count {
          font-size: 12px;
          color: ${t.textMuted};
          font-weight: 400;
        }

        .summary-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${t.success}; }
        .chip-inactive { background: #FFEBEE; color: ${t.accent}; }
        .chip-general { background: #E3F2FD; color: #1565C0; }
        .chip-total { background: ${t.bgLight}; color: ${t.textDark}; }
        .chip-gov { background: #E8EAF6; color: #283593; }
        .chip-dist { background: #FFF8E1; color: #E65100; }

        .day-banner {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
          border-radius: 10px;
          margin: 14px 0;
          border: 2px solid ${t.primary};
        }
        .day-banner .day-name {
          font-size: 20px;
          font-weight: 900;
          color: ${t.primaryDark};
        }
        .day-banner .day-date {
          font-size: 12px;
          color: ${t.textMuted};
          margin-top: 2px;
        }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: ${t.textMuted};
          font-size: 11px;
        }

        /* ─── ملخص المديريات — مجموعات بالمحافظة ─── */
        .dist-summary-group {
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .dist-summary-gov-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
          color: white;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
        }
        .dist-summary-gov-header .gov-sub {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.85;
        }
        .dist-summary-gov-total {
          background: ${t.bgLight};
          border: 2px solid ${t.primary};
          border-top: none;
          padding: 10px 16px;
          border-radius: 0 0 8px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 800;
          color: ${t.primaryDark};
        }
        .dist-summary-gov-total .total-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
        }
        .dist-summary-gov-total .total-stats span {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }

        .coverage-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 12px 0;
        }
        .coverage-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .coverage-card.good { border-top: 4px solid ${t.success}; }
        .coverage-card.warn { border-top: 4px solid ${t.warning}; }
        .coverage-card.bad { border-top: 4px solid ${t.accent}; }
        .coverage-value { font-size: 28px; font-weight: 900; }
        .coverage-label { font-size: 12px; color: ${t.textMuted}; margin-top: 4px; }
        .coverage-sub { font-size: 11px; color: ${t.textMuted}; }
      </style>
    </head>
    <body>
      ${je("تقييم أداء المشرفين اليومي","استمارة الإشراف للنشاط الإيصالي التكاملي"+De(r),`${u} — ${T}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${u} — ${T}</div>
        <div class="day-date">تقرير تقييم أداء المشرفين اليومي</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${H("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${I("إجمالي المشرفين",F,"👥",t.primary)}
        ${I("نشط اليوم",N,"✅",t.success,`${F>0?Math.round(N/F*100):0}%`)}
        ${I("غير نشط",M,"❌",t.accent,`${F>0?Math.round(M/F*100):0}%`)}
        ${I("إشراف عام",j,"🏛️","#1565C0",`${F>0?Math.round(j/F*100):0}%`)}
        ${I("إجمالي الاستمارات",x,"📋",t.info,`مرسلة: ${i} | مسودة: ${p}`)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${H("📈","نسب الإشراف الإجمالية")}
      <div class="kpi-grid">
        ${(()=>{const b=Math.max(F-j,1),O=Math.round(N/b*100);return I("نسبة النشاط الكلية",`${O}%`,"🎯",O>=70?t.success:O>=40?t.warning:t.accent)})()}
        ${(()=>{const b=$>0?Math.round(o/$*100):0;return I("تغطية إشراف المحافظات",`${b}%`,"🏛️",b>=80?t.success:b>=50?t.warning:t.accent,`${o}/${$}`)})()}
        ${(()=>{const b=f>0?Math.round(l/f*100):0;return I("تغطية إشراف المديريات",`${b}%`,"📍",b>=80?t.success:b>=50?t.warning:t.accent,`${l}/${f}`)})()}
        ${(()=>{const b=x>0?Math.round(i/x*100):0;return I("نسبة الإرسال",`${b}%`,"📤",b>=80?t.success:b>=50?t.warning:t.accent,`${i}/${x}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${F}</span>
        <span class="summary-chip chip-active">✅ نشط: ${N}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${M}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${j}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${H("📊","ملخص المحافظات")}
      ${ge(["المحافظة","المشرفين","نشط","غير نشط","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[...P.values()].map(b=>{const O=b.allUsers.filter(_=>_.totalToday>0&&!_.isGenSupervisor).length,g=b.allUsers.filter(_=>_.totalToday===0&&!_.isGenSupervisor).length,w=b.allUsers.filter(_=>_.isGenSupervisor).length,E=b.allUsers.reduce((_,A)=>_+A.totalToday,0),W=b.allUsers.length,te=W>0?Math.round(O/Math.max(W-w,1)*100):0;return[L(b.gov.name_ar),`${W}`,`<span style="color:${t.success};font-weight:700">${O}</span>`,`<span style="color:${g>0?t.accent:t.textMuted}">${g}</span>`,`${w}`,`${b.districts.size}`,`${E}`,`<span style="color:${te>=70?t.success:te>=40?t.warning:t.accent};font-weight:700">${te}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${H("📍","ملخص المديريات")}
      ${[...P.values()].map(b=>{if(b.districts.size===0)return"";const O=b.allUsers.filter(A=>A.role==="district"||A.role==="data_entry").length,g=b.allUsers.filter(A=>(A.role==="district"||A.role==="data_entry")&&A.totalToday>0).length,w=O-g,E=b.allUsers.filter(A=>A.role==="district"||A.role==="data_entry").reduce((A,G)=>A+G.totalToday,0),W=[...b.districts.values()].filter(A=>A.some(G=>G.totalToday>0)).length,te=O>0?Math.round(g/O*100):0,_=[...b.districts.entries()].sort((A,G)=>{const Y=A[1].reduce((V,le)=>V+le.totalToday,0);return G[1].reduce((V,le)=>V+le.totalToday,0)-Y}).map(([A,G])=>{var be;const Y=((be=G[0])==null?void 0:be.distName)||"غير محدد",X=G.filter(Se=>Se.totalToday>0).length,V=G.filter(Se=>Se.totalToday===0).length,le=G.reduce((Se,_e)=>Se+_e.totalToday,0),de=G.length>0?Math.round(X/G.length*100):0;return[L(Y),`${G.length}`,`<span style="color:${t.success};font-weight:700">${X}</span>`,`<span style="color:${V>0?t.accent:t.textMuted}">${V}</span>`,`${le}`,`<span style="color:${de>=70?t.success:de>=40?t.warning:t.accent};font-weight:700">${de}%</span>`]});return`
          <div class="dist-summary-group">
            <!-- header المحافظة -->
            <div class="dist-summary-gov-header">
              <span>🏛️ ${L(b.gov.name_ar)}</span>
              <span class="gov-sub">${b.districts.size} مديرية | ${O} مشرف</span>
            </div>

            <!-- جدول مديريات المحافظة -->
            ${ge(["المديرية","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],_)}

            <!-- إجمالي المحافظة -->
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${L(b.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${O} مشرف</span>
                <span style="color:${t.success}">✅ ${g} نشط</span>
                ${w>0?`<span style="color:${t.accent}">❌ ${w} غير نشط</span>`:""}
                <span>📋 ${E} استمارة</span>
                <span>📍 ${W}/${b.districts.size} مديرية</span>
                <span style="color:${te>=70?t.success:te>=40?t.warning:t.accent}">🎯 ${te}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...P.values()].map(b=>{const O=b.allUsers.filter(te=>te.totalToday>0).length,g=b.allUsers.length,w=b.allUsers.reduce((te,_)=>te+_.totalToday,0),E=b.districts.size,W=[...b.districts.values()].filter(te=>te.some(_=>_.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(b.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${g} مشرف | نشط: ${O} | غير نشط: ${g-O} |
                  مديريات: ${W}/${E}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${w}</strong>
              </div>
            </div>

            ${b.allUsers.length===0?'<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>':""}

            <!-- مشرفي المحافظة + المركزي -->
            ${b.govLevelUsers.length>0?`
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${b.govLevelUsers.length} مشرف</span>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>الصفة</th>
                    <th>المحافظة</th>
                    <th>المديرية</th>
                    <th>استمارات</th>
                    <th>مرسلة</th>
                    <th>مسودة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${b.govLevelUsers.map((te,_)=>d(te,_)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...b.districts.entries()].sort((te,_)=>_[1].length-te[1].length).map(([te,_])=>{var X;const A=((X=_[0])==null?void 0:X.distName)||"غير محدد",G=_.filter(V=>V.totalToday>0).length,Y=_.reduce((V,le)=>V+le.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${L(A)}</span>
                    <span class="dist-count">${_.length} مشرف | نشط: ${G} | استمارات: ${Y}</span>
                  </div>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الصفة</th>
                        <th>المحافظة</th>
                        <th>المديرية</th>
                        <th>استمارات</th>
                        <th>مرسلة</th>
                        <th>مسودة</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${_.sort((V,le)=>(V.role==="district"?0:1)-(le.role==="district"?0:1)||le.totalToday-V.totalToday).map((V,le)=>d(V,le)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(h,`تقييم_أداء_المشرفين_اليومي_${k}`)}const No={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function Mo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=await Da(e),{enriched:n,govs:m,dists:S,subs:C,govGroups:k,dateRange:u,totalDays:T}=c,P=n.filter(g=>(g.role==="central"||g.role==="admin")&&g.govId),D=[...n.filter(g=>["governorate","district","data_entry"].includes(g.role)),...P];e!=null&&e.governorateId&&e.governorateId!=="all"&&(m.filter(g=>g.id===e.governorateId),D.filter(g=>g.govId===e.governorateId));const R=D.length,F=D.filter(g=>g.totalToday>0).length,N=D.filter(g=>g.totalToday===0&&!g.isGenSupervisor).length,M=D.filter(g=>g.isGenSupervisor).length,j=C.length,x=C.filter(g=>g.status==="submitted").length,i=C.filter(g=>g.status==="draft").length,v=new Set(D.map(g=>g.govId).filter(Boolean)).size,o=m.length,$=D.filter(g=>g.role==="district"||g.role==="data_entry"),a=new Set($.map(g=>g.district_id).filter(Boolean)).size,l=S.length,f=u.from?Pe(new Date(u.from)):"—",d=u.to?Pe(new Date(u.to)):"—";function h(g,w){let E;g.isGenSupervisor?E='<span class="status-badge status-general">إشراف عام</span>':g.totalToday>0?E=`<span class="status-badge status-active">✅ ${g.totalToday} استمارة</span>`:E='<span class="status-badge status-inactive">❌ لا إرساليات</span>';let W;return g.role==="central"||g.role==="admin"?W="مركزي":g.role==="governorate"?W="مشرف محافظة":g.role==="district"?W="مديرية":W="إدخال بيانات",`
      <tr class="${g.totalToday===0&&!g.isGenSupervisor?"row-inactive":""}">
        <td class="num">${w+1}</td>
        <td>
          <div class="user-name">${No[g.role]||"👤"} ${L(g.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${g.role}">${W}</span></td>
        <td>${L(g.govName||"—")}</td>
        <td>${L(g.distName||"—")}</td>
        <td class="num">${g.totalToday}</td>
        <td class="num num-success">${g.submittedToday}</td>
        <td class="num num-warning">${g.draftToday}</td>
        <td>${E}</td>
      </tr>
    `}const b=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين الشامل — ${f} إلى ${d}</title>
      ${Ee()}
      <style>
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-active { background: #E8F5E9; color: ${t.success}; }
        .status-inactive { background: #FFEBEE; color: ${t.accent}; }
        .status-general { background: #E3F2FD; color: #1565C0; }

        .role-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
        }
        .role-admin { background: #E3F2FD; color: #0D47A1; }
        .role-central { background: #E8EAF6; color: #283593; }
        .role-governorate { background: #E8F5E9; color: #1B5E20; }
        .role-district { background: #FFF8E1; color: #E65100; }
        .role-data_entry { background: #F5F5F5; color: #616161; }

        .user-name {
          font-weight: 700;
          font-size: 11px;
          white-space: nowrap;
        }
        .row-inactive { opacity: 0.55; }

        .gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .gov-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }

        .dist-header {
          background: ${t.bgLight};
          border-right: 4px solid ${t.info};
          padding: 8px 14px;
          border-radius: 6px;
          margin: 10px 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: ${t.primaryDark};
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .dist-count {
          font-size: 12px;
          color: ${t.textMuted};
          font-weight: 400;
        }

        .summary-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${t.success}; }
        .chip-inactive { background: #FFEBEE; color: ${t.accent}; }
        .chip-general { background: #E3F2FD; color: #1565C0; }
        .chip-total { background: ${t.bgLight}; color: ${t.textDark}; }

        .range-banner {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #E8EAF6, #C5CAE9);
          border-radius: 10px;
          margin: 14px 0;
          border: 2px solid ${t.primary};
        }
        .range-banner .range-title {
          font-size: 20px;
          font-weight: 900;
          color: ${t.primaryDark};
        }
        .range-banner .range-detail {
          font-size: 12px;
          color: ${t.textMuted};
          margin-top: 2px;
        }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: ${t.textMuted};
          font-size: 11px;
        }

        /* ─── ملخص المديريات — مجموعات بالمحافظة ─── */
        .dist-summary-group {
          margin-bottom: 14px;
          page-break-inside: avoid;
        }
        .dist-summary-gov-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
          color: white;
          padding: 10px 16px;
          border-radius: 8px 8px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
        }
        .dist-summary-gov-header .gov-sub {
          font-size: 12px;
          font-weight: 400;
          opacity: 0.85;
        }
        .dist-summary-gov-total {
          background: ${t.bgLight};
          border: 2px solid ${t.primary};
          border-top: none;
          padding: 10px 16px;
          border-radius: 0 0 8px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          font-weight: 800;
          color: ${t.primaryDark};
        }
        .dist-summary-gov-total .total-stats {
          display: flex;
          gap: 16px;
          font-size: 11px;
        }
        .dist-summary-gov-total .total-stats span {
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
      </style>
    </head>
    <body>
      ${je("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي"+De(r),`${f} — ${d} (${T} يوم)`)}

      <!-- ═══ نطاق التاريخ ═══ -->
      <div class="range-banner">
        <div class="range-title">📊 تقرير شامل — جميع الاستمارات</div>
        <div class="range-detail">
          📅 من ${f} إلى ${d} — ${T} يوم — ${j} استمارة
        </div>
      </div>

      <!-- ═══ ملخص شامل ═══ -->
      ${H("📊","الملخص الشامل")}
      <div class="kpi-grid">
        ${I("إجمالي المشرفين",R,"👥",t.primary)}
        ${I("نشط (له استمارات)",F,"✅",t.success,`${R>0?Math.round(F/R*100):0}%`)}
        ${I("بدون إرساليات",N,"❌",t.accent,`${R>0?Math.round(N/R*100):0}%`)}
        ${I("إشراف عام",M,"🏛️","#1565C0",`${R>0?Math.round(M/R*100):0}%`)}
        ${I("إجمالي الاستمارات",j,"📋",t.info,`مرسلة: ${x} | مسودة: ${i}`)}
        ${I("متوسط الاستمارات/مشرف",R>0?Math.round(j/R):0,"📈",t.primary)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${H("📈","نسب الإشراف")}
      <div class="kpi-grid">
        ${(()=>{const g=Math.max(R-M,1),w=Math.round(F/g*100);return I("نسبة النشاط الكلية",`${w}%`,"🎯",w>=70?t.success:w>=40?t.warning:t.accent)})()}
        ${(()=>{const g=o>0?Math.round(v/o*100):0;return I("تغطية المحافظات",`${g}%`,"🏛️",g>=80?t.success:g>=50?t.warning:t.accent,`${v}/${o}`)})()}
        ${(()=>{const g=l>0?Math.round(a/l*100):0;return I("تغطية المديريات",`${g}%`,"📍",g>=80?t.success:g>=50?t.warning:t.accent,`${a}/${l}`)})()}
        ${(()=>{const g=j>0?Math.round(x/j*100):0;return I("نسبة الإرسال",`${g}%`,"📤",g>=80?t.success:g>=50?t.warning:t.accent,`${x}/${j}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${R}</span>
        <span class="summary-chip chip-active">✅ نشط: ${F}</span>
        <span class="summary-chip chip-inactive">❌ بدون إرساليات: ${N}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${M}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${H("📊","ملخص المحافظات")}
      ${ge(["المحافظة","المشرفين","نشط","بدون إرساليات","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[...k.values()].map(g=>{const w=g.allUsers.filter(G=>G.totalToday>0&&!G.isGenSupervisor).length,E=g.allUsers.filter(G=>G.totalToday===0&&!G.isGenSupervisor).length,W=g.allUsers.filter(G=>G.isGenSupervisor).length,te=g.allUsers.reduce((G,Y)=>G+Y.totalToday,0),_=g.allUsers.length,A=_>0?Math.round(w/Math.max(_-W,1)*100):0;return[L(g.gov.name_ar),`${_}`,`<span style="color:${t.success};font-weight:700">${w}</span>`,`<span style="color:${E>0?t.accent:t.textMuted}">${E}</span>`,`${W}`,`${g.districts.size}`,`${te}`,`<span style="color:${A>=70?t.success:A>=40?t.warning:t.accent};font-weight:700">${A}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${H("📍","ملخص المديريات")}
      ${[...k.values()].map(g=>{if(g.districts.size===0)return"";const w=g.allUsers.filter(Y=>Y.role==="district"||Y.role==="data_entry").length,E=g.allUsers.filter(Y=>(Y.role==="district"||Y.role==="data_entry")&&Y.totalToday>0).length,W=w-E,te=g.allUsers.filter(Y=>Y.role==="district"||Y.role==="data_entry").reduce((Y,X)=>Y+X.totalToday,0),_=[...g.districts.values()].filter(Y=>Y.some(X=>X.totalToday>0)).length,A=w>0?Math.round(E/w*100):0,G=[...g.districts.entries()].sort((Y,X)=>{const V=Y[1].reduce((de,be)=>de+be.totalToday,0);return X[1].reduce((de,be)=>de+be.totalToday,0)-V}).map(([Y,X])=>{var _e;const V=((_e=X[0])==null?void 0:_e.distName)||"غير محدد",le=X.filter(we=>we.totalToday>0).length,de=X.filter(we=>we.totalToday===0).length,be=X.reduce((we,ze)=>we+ze.totalToday,0),Se=X.length>0?Math.round(le/X.length*100):0;return[L(V),`${X.length}`,`<span style="color:${t.success};font-weight:700">${le}</span>`,`<span style="color:${de>0?t.accent:t.textMuted}">${de}</span>`,`${be}`,`<span style="color:${Se>=70?t.success:Se>=40?t.warning:t.accent};font-weight:700">${Se}%</span>`]});return`
          <div class="dist-summary-group">
            <div class="dist-summary-gov-header">
              <span>🏛️ ${L(g.gov.name_ar)}</span>
              <span class="gov-sub">${g.districts.size} مديرية | ${w} مشرف</span>
            </div>
            ${ge(["المديرية","المشرفين","نشط","بدون إرساليات","الاستمارات","النشاط"],G)}
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${L(g.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${w} مشرف</span>
                <span style="color:${t.success}">✅ ${E} نشط</span>
                ${W>0?`<span style="color:${t.accent}">❌ ${W} بدون إرساليات</span>`:""}
                <span>📋 ${te} استمارة</span>
                <span>📍 ${_}/${g.districts.size} مديرية</span>
                <span style="color:${A>=70?t.success:A>=40?t.warning:t.accent}">🎯 ${A}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...k.values()].map(g=>{const w=g.allUsers.filter(A=>A.totalToday>0).length,E=g.allUsers.length,W=g.allUsers.reduce((A,G)=>A+G.totalToday,0),te=g.districts.size,_=[...g.districts.values()].filter(A=>A.some(G=>G.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(g.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${E} مشرف | نشط: ${w} | بدون إرساليات: ${E-w} |
                  مديريات: ${_}/${te}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                إجمالي الاستمارات: <strong>${W}</strong>
              </div>
            </div>

            ${g.allUsers.length===0?'<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>':""}

            <!-- مشرفي المحافظة + المركزي -->
            ${g.govLevelUsers.length>0?`
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${g.govLevelUsers.length} مشرف</span>
              </div>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الاسم</th>
                    <th>الصفة</th>
                    <th>المحافظة</th>
                    <th>المديرية</th>
                    <th>استمارات</th>
                    <th>مرسلة</th>
                    <th>مسودة</th>
                    <th>الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  ${g.govLevelUsers.map((A,G)=>h(A,G)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...g.districts.entries()].sort((A,G)=>G[1].length-A[1].length).map(([A,G])=>{var le;const Y=((le=G[0])==null?void 0:le.distName)||"غير محدد",X=G.filter(de=>de.totalToday>0).length,V=G.reduce((de,be)=>de+be.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${L(Y)}</span>
                    <span class="dist-count">${G.length} مشرف | نشط: ${X} | استمارات: ${V}</span>
                  </div>
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>الصفة</th>
                        <th>المحافظة</th>
                        <th>المديرية</th>
                        <th>استمارات</th>
                        <th>مرسلة</th>
                        <th>مسودة</th>
                        <th>الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${G.sort((de,be)=>(de.role==="district"?0:1)-(be.role==="district"?0:1)||be.totalToday-de.totalToday).map((de,be)=>h(de,be)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Te()}
    </body>
    </html>
  `,O=new Date().toISOString().split("T")[0];Ce(b,`تقييم_أداء_المشرفين_الشامل_${O}`)}const Ha=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟"},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟"},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟"}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟"},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟"},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟"},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟"},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟"}]},{id:"records",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟"},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟"},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟"},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟"}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟"},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟"},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟"},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟"},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟"}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟"},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟"},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟"}]},{id:"supplies",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟"},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟"},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟"},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟"},{key:"scale",label:"هل يوجد ميزان؟"},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟"}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟"},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟"},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟"},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟"}]},{id:"catch_up",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟"},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟"},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟"},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟"},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟"}]},{id:"defaulter",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟"},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟"}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟"},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟"}]}],zo=["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem"],Po=["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action"],Io=["توصي","اقتراح","ينصح","propose","recommend"];function pa(e,r){if(!e||typeof e!="object")return null;for(const[c,n]of Object.entries(e))if(typeof n=="string"&&n.trim().length>2){for(const m of r)if(c.toLowerCase().includes(m.toLowerCase()))return n.trim()}if(e.data&&typeof e.data=="object"){for(const[c,n]of Object.entries(e.data))if(typeof n=="string"&&n.trim().length>2){for(const m of r)if(c.toLowerCase().includes(m.toLowerCase()))return n.trim()}}for(const[,c]of Object.entries(e))if(typeof c=="string"&&c.trim().length>20){for(const n of r)if(c.toLowerCase().includes(n.toLowerCase()))return c.trim()}return null}async function Ao(e){var He,ft;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date().toISOString().split("T")[0],n=Pe(new Date),m=await Da(e),{data:S}=await U.auth.getSession();console.log("[MasterReport] Auth user:",((ft=(He=S.session)==null?void 0:He.user)==null?void 0:ft.id)||"NONE"),console.log("[MasterReport] Campaign round:",r);let C=[];try{const{data:z,error:K}=await U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).eq("campaign_round",r??-1).order("created_at",{ascending:!1}).limit(5e3);if(K?console.error("[MasterReport] Section2 round query error:",K.message):C=z||[],console.log(`[MasterReport] Section2 with round ${r}: ${C.length} rows`),C.length===0){const{data:se,error:ie}=await U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);ie?console.error("[MasterReport] Section2 no-round error:",ie.message):C=se||[],console.log(`[MasterReport] Section2 without round: ${C.length} rows`)}if(C.length===0){const{data:se,error:ie}=await U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);ie?console.error("[MasterReport] Section2 minimal error:",ie.message):C=se||[],console.log(`[MasterReport] Section2 minimal filter: ${C.length} rows`)}}catch(z){console.error("[MasterReport] Section2 exception:",z.message)}let k=[];try{const{data:z,error:K}=await U.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).eq("campaign_round",r??-1).order("created_at",{ascending:!1}).limit(5e3);if(K?console.error("[MasterReport] Section3 round error:",K.message):k=z||[],console.log(`[MasterReport] Section3 with round ${r}: ${k.length} rows`),k.length===0){const{data:se,error:ie}=await U.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);ie?console.error("[MasterReport] Section3 no-round error:",ie.message):k=se||[],console.log(`[MasterReport] Section3 without round: ${k.length} rows`)}}catch(z){console.error("[MasterReport] Section3 exception:",z.message)}const u={value:{data:C}},T={value:{data:k}},P=new Map;for(const z of m.govs)P.set(z.id,z.name_ar);const{enriched:D,govs:R,dists:F,subs:N,govGroups:M}=m,j=D.filter(z=>(z.role==="central"||z.role==="admin")&&z.govId),x=[...D.filter(z=>["governorate","district","data_entry"].includes(z.role)),...j];let i=M;if(e!=null&&e.governorateId&&e.governorateId!=="all"){const z=new Map,K=M.get(e.governorateId);K&&z.set(e.governorateId,K),i=z}const p=x.length,v=x.filter(z=>z.totalToday>0).length,o=x.filter(z=>z.totalToday===0&&!z.isGenSupervisor).length,$=x.filter(z=>z.isGenSupervisor).length,y=N.length,a=N.filter(z=>z.status==="submitted").length;N.filter(z=>z.status==="draft").length;const l=u.value.data||[],f=Ha.flatMap(z=>z.fields.map(K=>K.key)),d=new Map;for(const z of f)d.set(z,{yes:0,no:0,total:0});for(const z of l){const K=z.data||{};for(const se of f){const ie=K[se],ve=d.get(se);ve&&(ie===!0||ie==="yes"||ie==="نعم"?(ve.yes++,ve.total++):(ie===!1||ie==="no"||ie==="لا")&&(ve.no++,ve.total++))}}const h=Ha.map(z=>{const K=z.fields.map(Ne=>{const xe=d.get(Ne.key)||{yes:0,no:0,total:0};return{...Ne,...xe,yesRate:xe.total>0?Math.round(xe.yes/xe.total*100):0}}),se=K.reduce((Ne,xe)=>Ne+xe.yes,0),ie=K.reduce((Ne,xe)=>Ne+xe.no,0),ve=se+ie,ee=ve>0?Math.round(se/ve*100):0;return{...z,fields:K,totalYes:se,totalNo:ie,total:ve,avgRate:ee}}),b=h.reduce((z,K)=>z+K.totalYes,0),O=h.reduce((z,K)=>z+K.totalNo,0),g=b+O,w=g>0?Math.round(b/g*100):0,E=h.flatMap(z=>z.fields.filter(K=>K.total>0)),W=[...E].sort((z,K)=>K.yesRate-z.yesRate).slice(0,5),te=[...E].sort((z,K)=>z.yesRate-K.yesRate).slice(0,5),_=T.value.data||[],A=await U.from("profiles").select("id, full_name").is("deleted_at",null),G=new Map;for(const z of A.data||[])G.set(z.id,z.full_name);const Y=new Map;for(const z of _){const K=z.data||{},se=pa(K,zo),ie=pa(K,Po),ve=pa(K,Io);if(!se&&!ie&&!ve)continue;const ee=z.governorate_id||"",Ne=P.get(ee)||"غير محدد";Y.has(ee)||Y.set(ee,{govName:Ne,challenges:[],actions:[],recommendations:[],supervisorNames:new Set,count:0});const xe=Y.get(ee);xe.count++,se&&xe.challenges.push(se),ie&&xe.actions.push(ie),ve&&xe.recommendations.push(ve);const Ze=G.get(z.submitted_by||"");Ze&&xe.supervisorNames.add(Ze)}const X=[...Y.values()].sort((z,K)=>K.count-z.count),V=X.reduce((z,K)=>z+K.count,0),le=X.reduce((z,K)=>z+K.challenges.length,0),de=X.reduce((z,K)=>z+K.actions.length,0),be=X.reduce((z,K)=>z+K.recommendations.length,0);function Se(z){const K=z>=80?t.success:z>=60?t.warning:z>=40?"#FF9800":t.accent;return`
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${z}%;height:100%;background:${K};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${K};min-width:28px;text-align:left;">${z}%</span>
      </div>
    `}function _e(z,K){if(K.length===0)return"";const se={challenges:{label:"تحديات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"إجراءات",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"توصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}}[z];return`
      <div style="margin:6px 0;">
        <div style="font-size:11px;font-weight:700;color:${se.color};margin-bottom:4px;">${se.icon} ${se.label} (${K.length})</div>
        <div style="background:${se.bg};border:1px solid ${se.border};border-radius:8px;padding:8px 10px;">
          ${K.slice(0,5).map((ie,ve)=>`
            <div style="font-size:10px;line-height:1.6;color:${t.textDark};${ve>0?`border-top:1px solid ${se.border};padding-top:4px;`:""}">
              ${ve+1}. ${L(ie.length>150?ie.slice(0,150)+"...":ie)}
            </div>
          `).join("")}
          ${K.length>5?`<div style="font-size:9px;color:${t.textMuted};margin-top:4px;">... و ${K.length-5} نقطة أخرى</div>`:""}
        </div>
      </div>
    `}function we(z,K){let se;z.isGenSupervisor?se='<span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">إشراف عام</span>':z.totalToday>0?se=`<span style="background:#E8F5E9;color:${t.success};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">✅ ${z.totalToday}</span>`:se='<span style="background:#FFEBEE;color:#E53935;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">❌ 0</span>';const ie=z.role==="central"||z.role==="admin"?"مركزي":z.role==="governorate"?"محافظة":z.role==="district"?"مديرية":"إدخال";return`
      <tr style="${z.totalToday===0&&!z.isGenSupervisor?"opacity:0.5;":""}">
        <td style="font-size:10px;text-align:center;">${K+1}</td>
        <td style="font-size:10px;font-weight:700;">${L(z.full_name||"—")}</td>
        <td style="font-size:10px;">${ie}</td>
        <td style="font-size:10px;">${L(z.distName||"—")}</td>
        <td style="font-size:10px;text-align:center;font-weight:700;">${z.totalToday}</td>
        <td style="font-size:10px;text-align:center;color:${t.success};">${z.submittedToday}</td>
        <td style="font-size:10px;text-align:center;">${se}</td>
      </tr>
    `}const ze=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الشامل للمشرفين — ${n}</title>
      ${Ee()}
      <style>
        .master-section {
          margin: 20px 0;
          page-break-inside: avoid;
        }
        .master-section-header {
          background: linear-gradient(135deg, ${t.primary}, ${t.primaryDark});
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
          border: 1px solid ${t.border};
          border-top: none;
          border-radius: 0 0 10px 10px;
          padding: 14px;
          background: white;
        }

        .yesno-section-card {
          border: 1px solid ${t.border};
          border-radius: 8px;
          margin: 8px 0;
          overflow: hidden;
        }
        .yesno-section-header {
          background: ${t.bgLight};
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${t.border};
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
          border: 1px solid ${t.border};
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .challenge-header {
          background: linear-gradient(135deg, ${t.primary}15, ${t.primary}08);
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${t.border};
        }

        .top-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        .top-bottom-card {
          border: 1px solid ${t.border};
          border-radius: 8px;
          padding: 10px;
        }

        .gov-perf-row {
          display: flex;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid #F5F5F5;
          gap: 8px;
          font-size: 11px;
        }
        .gov-perf-row:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      ${je("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات — تقرير مدمج"+De(r),n)}

      <!-- ═══════════════════════════════════════════ -->
      <!-- KPIs الرئيسية -->
      <!-- ═══════════════════════════════════════════ -->
      ${H("📊","مؤشرات الأداء الرئيسية")}
      <div class="kpi-grid">
        ${I("إجمالي المشرفين",p,"👥",t.primary)}
        ${I("نشط (له استمارات)",v,"✅",t.success,`${p>0?Math.round(v/p*100):0}%`)}
        ${I("بدون إرساليات",o,"❌",t.accent)}
        ${I("إشراف عام",$,"🏛️","#1565C0")}
        ${I("إجمالي الاستمارات",y,"📋",t.info,`مرسلة: ${a}`)}
        ${I("نسبة نعم الكلية",`${w}%`,"🎯",w>=70?t.success:t.warning,`${b}/${g}`)}
        ${I("تحديات ميدانية",V,"⚠️","#E53935",`${le} نقطة`)}
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تقييم أداء المشرفين -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📋 القسم 1: تقييم أداء المشرفين الشامل</div>
          <div class="master-section-badge">${p} مشرف | ${y} استمارة</div>
        </div>
        <div class="master-section-body">
          <!-- نسب الإشراف -->
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${(()=>{const z=Math.max(p-$,1),K=Math.round(v/z*100);return I("نسبة النشاط",`${K}%`,"🎯",K>=70?t.success:K>=40?t.warning:t.accent)})()}
            ${(()=>{const z=new Set(x.map(se=>se.govId).filter(Boolean)).size,K=R.length>0?Math.round(z/R.length*100):0;return I("تغطية المحافظات",`${K}%`,"🏛️",K>=80?t.success:t.warning,`${z}/${R.length}`)})()}
            ${(()=>{const z=new Set(x.filter(se=>se.role==="district"||se.role==="data_entry").map(se=>se.district_id).filter(Boolean)).size,K=F.length>0?Math.round(z/F.length*100):0;return I("تغطية المديريات",`${K}%`,"📍",K>=80?t.success:t.warning,`${z}/${F.length}`)})()}
            ${(()=>{const z=y>0?Math.round(a/y*100):0;return I("نسبة الإرسال",`${z}%`,"📤",z>=80?t.success:t.warning)})()}
          </div>

          <!-- ملخص المحافظات -->
          ${ge(["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],[...i.values()].map(z=>{const K=z.allUsers.filter(xe=>xe.totalToday>0&&!xe.isGenSupervisor).length,se=z.allUsers.filter(xe=>xe.totalToday===0&&!xe.isGenSupervisor).length,ie=z.allUsers.filter(xe=>xe.isGenSupervisor).length,ve=z.allUsers.reduce((xe,Ze)=>xe+Ze.totalToday,0),ee=z.allUsers.length,Ne=ee>0?Math.round(K/Math.max(ee-ie,1)*100):0;return[L(z.gov.name_ar),`${ee}`,`<span style="color:${t.success};font-weight:700">${K}</span>`,`<span style="color:${se>0?t.accent:t.textMuted}">${se}</span>`,`${ve}`,`<span style="color:${Ne>=70?t.success:Ne>=40?t.warning:t.accent};font-weight:700">${Ne}%</span>`]}))}

          <!-- تفاصيل المحافظات -->
          ${[...i.values()].map(z=>{const K=z.allUsers.filter(ve=>ve.totalToday>0).length,se=z.allUsers.length,ie=z.allUsers.reduce((ve,ee)=>ve+ee.totalToday,0);return`
              <div style="margin-top:14px;page-break-inside:avoid;">
                <div style="background:linear-gradient(135deg,${t.primary},${t.primaryDark});color:white;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div>
                    <div style="font-size:14px;font-weight:800;">🏛️ ${L(z.gov.name_ar)}</div>
                    <div style="font-size:10px;opacity:0.9;">${se} مشرف | نشط: ${K} | استمارات: ${ie}</div>
                  </div>
                </div>
                ${z.allUsers.length>0?`
                  <table class="data-table" style="font-size:10px;">
                    <thead><tr><th>#</th><th>الاسم</th><th>الصفة</th><th>المديرية</th><th>استمارات</th><th>مرسلة</th><th>الحالة</th></tr></thead>
                    <tbody>
                      ${z.allUsers.sort((ve,ee)=>(ve.isGenSupervisor?0:1)-(ee.isGenSupervisor?0:1)||ee.totalToday-ve.totalToday).map((ve,ee)=>we(ve,ee)).join("")}
                    </tbody>
                  </table>
                `:'<div style="text-align:center;padding:12px;color:#999;font-size:11px;">لا يوجد مشرفين</div>'}
              </div>
            `}).join("")}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 2: تحليل حقول نعم/لا -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📊 القسم 2: تحليل حقول نعم/لا</div>
          <div class="master-section-badge">${l.length} استمارة | ${w}% نعم</div>
        </div>
        <div class="master-section-body">
          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${t.success};">
              <div style="font-size:11px;font-weight:800;color:${t.success};margin-bottom:6px;">✅ أعلى 5 حقول</div>
              ${W.map((z,K)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${K+1}.</span>
                  <span style="flex:1;">${L(z.label)}</span>
                  <span style="font-weight:800;color:${t.success};">${z.yesRate}%</span>
                </div>
              `).join("")}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${t.accent};">
              <div style="font-size:11px;font-weight:800;color:${t.accent};margin-bottom:6px;">❌ أقل 5 حقول</div>
              ${te.map((z,K)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${K+1}.</span>
                  <span style="flex:1;">${L(z.label)}</span>
                  <span style="font-weight:800;color:${t.accent};">${z.yesRate}%</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${ge(["القسم","الحقول","النسبة","التقييم"],h.map(z=>{const K=z.avgRate>=80?"ممتاز ✅":z.avgRate>=60?"جيد 👍":z.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",se=z.avgRate>=80?t.success:z.avgRate>=60?"#FF9800":z.avgRate>=40?t.warning:t.accent;return[`${z.icon} ${L(z.title)}`,`${z.fields.length}`,`<span style="color:${se};font-weight:800;">${z.avgRate}%</span>`,`<span style="color:${se};font-weight:700;">${K}</span>`]}))}

          <!-- تفاصيل الأقسام -->
          ${h.map(z=>`
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${t.primaryDark};">${z.icon} ${L(z.title)}</span>
                <span style="font-size:14px;font-weight:900;color:${z.avgRate>=70?t.success:z.avgRate>=50?t.warning:t.accent};">${z.avgRate}%</span>
              </div>
              ${z.fields.map(K=>`
                <div class="yesno-field-row">
                  <span style="flex:1;font-size:11px;">${L(K.label)}</span>
                  <span style="flex:1.2;">${Se(K.yesRate)}</span>
                  <span style="font-size:9px;color:${t.textMuted};min-width:50px;text-align:left;">✓${K.yes} ✗${K.no}</span>
                </div>
              `).join("")}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 3: تحديات الإشراف الميداني -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">⚠️ القسم 3: تحديات الإشراف الميداني</div>
          <div class="master-section-badge">${V} استمارة | ${le} تحدي</div>
        </div>
        <div class="master-section-body">
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${I("استمارات مُعبأة",V,"📋",t.primary)}
            ${I("تحديات",le,"⚠️","#E53935")}
            ${I("إجراءات",de,"📋","#1565C0")}
            ${I("توصيات",be,"💡","#2E7D32")}
          </div>

          ${X.length===0?`
            <div style="text-align:center;padding:20px;color:${t.textMuted};font-size:12px;">لا توجد تحديات مُسجّلة</div>
          `:""}

          ${X.map(z=>`
            <div class="challenge-card">
              <div class="challenge-header">
                <div>
                  <div style="font-size:13px;font-weight:800;color:${t.primaryDark};">🏛️ ${L(z.govName)}</div>
                  <div style="font-size:10px;color:${t.textMuted};">📝 ${z.count} استمارة | 👥 ${z.supervisorNames.size} مشرف</div>
                </div>
                <div style="display:flex;gap:8px;font-size:10px;">
                  <span style="background:#FFF5F5;color:#E53935;padding:2px 8px;border-radius:8px;">⚠️ ${z.challenges.length}</span>
                  <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;">📋 ${z.actions.length}</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;">💡 ${z.recommendations.length}</span>
                </div>
              </div>
              <div style="padding:10px 14px;">
                ${_e("challenges",z.challenges)}
                ${_e("actions",z.actions)}
                ${_e("recommendations",z.recommendations)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(ze,`التقرير_الشامل_المشرفين_${c}`)}const ma="🏛️";async function Lo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=await us(e),{enriched:n,govs:m,targetDate:S,dayName:C,dateArabic:k}=c,u=n.filter(d=>d.isGenSupervisor);let T=u,P=m;e!=null&&e.governorateId&&e.governorateId!=="all"&&(P=m.filter(d=>d.id===e.governorateId),T=u.filter(d=>d.govId===e.governorateId));const D=new Map;for(const d of T){const h=d.govId||"_no_gov";D.has(h)||D.set(h,{govName:d.govName||"غير محدد",govId:d.govId,users:[]}),D.get(h).users.push(d)}const R=T.filter(d=>!d.govId);T.filter(d=>d.govId);const F=T.length,N=T.filter(d=>d.totalToday>0).length,M=T.filter(d=>d.totalToday===0).length,j=T.reduce((d,h)=>d+h.totalToday,0),x=T.reduce((d,h)=>d+h.submittedToday,0),i=T.reduce((d,h)=>d+h.draftToday,0),p=[...D.values()].filter(d=>d.users.some(h=>h.totalToday>0)).length,v=F>0?Math.round(N/F*100):0,o=T.filter(d=>d.totalToday>=5).length,$=T.filter(d=>d.totalToday>=2&&d.totalToday<5).length,y=T.filter(d=>d.totalToday===1).length,a=T.filter(d=>d.totalToday===0).length;function l(d,h){let b;d.totalToday===0?b='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?b='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?b='<span class="perf-badge perf-good">✅ جيد</span>':b='<span class="perf-badge perf-weak">⚠️ ضعيف</span>';const O=d.totalToday>0?Math.round(d.submittedToday/d.totalToday*100):0;return`
      <tr class="${d.totalToday===0?"row-inactive":""}">
        <td class="num">${h+1}</td>
        <td>
          <div class="user-name">${ma} ${L(d.full_name||"—")}</div>
        </td>
        <td>${L(d.govName||"—")}</td>
        <td class="num">${d.totalToday}</td>
        <td class="num num-success">${d.submittedToday}</td>
        <td class="num num-warning">${d.draftToday}</td>
        <td class="num" style="color:${O>=80?t.success:O>=50?t.warning:t.accent};font-weight:700">${O}%</td>
        <td>${b}</td>
      </tr>
    `}const f=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف عام — ${k}</title>
      ${Ee()}
      <style>
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        .status-active { background: #E8F5E9; color: ${t.success}; }
        .status-inactive { background: #FFEBEE; color: ${t.accent}; }

        .perf-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .perf-excellent { background: #E8F5E9; color: #1B5E20; }
        .perf-good { background: #E3F2FD; color: #0D47A1; }
        .perf-weak { background: #FFF8E1; color: #E65100; }
        .perf-inactive { background: #FFEBEE; color: ${t.accent}; }

        .user-name {
          font-weight: 700;
          font-size: 11px;
          white-space: nowrap;
        }
        .row-inactive { opacity: 0.55; }

        .gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
        }
        .gov-header {
          background: linear-gradient(135deg, #1565C0, #0D47A1);
          color: white;
          padding: 14px 18px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        .gov-name { font-size: 16px; font-weight: 800; }
        .gov-stats { font-size: 11px; opacity: 0.9; }

        .day-banner {
          text-align: center;
          padding: 12px;
          background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
          border-radius: 10px;
          margin: 14px 0;
          border: 2px solid #1565C0;
        }
        .day-banner .day-name {
          font-size: 20px;
          font-weight: 900;
          color: #0D47A1;
        }
        .day-banner .day-date {
          font-size: 12px;
          color: ${t.textMuted};
          margin-top: 2px;
        }

        .summary-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin: 10px 0;
        }
        .summary-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
        }
        .chip-active { background: #E8F5E9; color: ${t.success}; }
        .chip-inactive { background: #FFEBEE; color: ${t.accent}; }
        .chip-total { background: ${t.bgLight}; color: ${t.textDark}; }
        .chip-no-gov { background: #FFF3E0; color: #E65100; }
        .chip-excellent { background: #E8F5E9; color: #1B5E20; }
        .chip-good { background: #E3F2FD; color: #0D47A1; }
        .chip-weak { background: #FFF8E1; color: #E65100; }

        .no-data-msg {
          text-align: center;
          padding: 20px;
          color: ${t.textMuted};
          font-size: 11px;
        }

        .no-gov-section {
          margin-top: 20px;
          page-break-inside: avoid;
          border: 2px dashed #FF8F00;
          border-radius: 10px;
          padding: 14px;
          background: #FFF8E1;
        }
        .no-gov-title {
          font-size: 14px;
          font-weight: 800;
          color: #E65100;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .perf-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin: 12px 0;
        }
        .perf-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .perf-card.excellent { border-top: 4px solid #1B5E20; }
        .perf-card.good { border-top: 4px solid #0D47A1; }
        .perf-card.weak { border-top: 4px solid #E65100; }
        .perf-card.inactive-card { border-top: 4px solid ${t.accent}; }
        .perf-value { font-size: 28px; font-weight: 900; }
        .perf-label { font-size: 12px; color: ${t.textMuted}; margin-top: 4px; }
        .perf-sub { font-size: 11px; color: ${t.textMuted}; }

        .ranking-table .rank-gold { background: linear-gradient(135deg, #FFF8E1, #FFE082); }
        .ranking-table .rank-silver { background: linear-gradient(135deg, #F5F5F5, #E0E0E0); }
        .ranking-table .rank-bronze { background: linear-gradient(135deg, #FBE9E7, #FFCCBC); }
      </style>
    </head>
    <body>
      ${je("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي"+De(r),`${C} — ${k}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${C} — ${k}</div>
        <div class="day-date">تقرير تقييم إشراف عام — المشرفين العامين</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${H("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${I("إجمالي إشراف عام",F,"🏛️","#1565C0")}
        ${I("نشط اليوم",N,"✅",t.success,`${v}%`)}
        ${I("غير نشط",M,"❌",t.accent,`${F>0?Math.round(M/F*100):0}%`)}
        ${I("محافظات مغطاة",`${p}/${P.length}`,"📍",t.info)}
        ${I("إجمالي الاستمارات",j,"📋",t.info,`مرسلة: ${x} | مسودة: ${i}`)}
      </div>

      <!-- ═══ توزيع مستوى الأداء ═══ -->
      ${H("📈","توزيع مستوى الأداء")}
      <div class="perf-grid">
        <div class="perf-card excellent">
          <div class="perf-value" style="color:#1B5E20">${o}</div>
          <div class="perf-label">⭐ ممتاز</div>
          <div class="perf-sub">5+ استمارات</div>
        </div>
        <div class="perf-card good">
          <div class="perf-value" style="color:#0D47A1">${$}</div>
          <div class="perf-label">✅ جيد</div>
          <div class="perf-sub">2-4 استمارات</div>
        </div>
        <div class="perf-card weak">
          <div class="perf-value" style="color:#E65100">${y}</div>
          <div class="perf-label">⚠️ ضعيف</div>
          <div class="perf-sub">استمارة واحدة</div>
        </div>
        <div class="perf-card inactive-card">
          <div class="perf-value" style="color:${t.accent}">${a}</div>
          <div class="perf-label">❌ غير نشط</div>
          <div class="perf-sub">لا استمارات</div>
        </div>
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${F}</span>
        <span class="summary-chip chip-active">✅ نشط: ${N}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${M}</span>
        <span class="summary-chip chip-excellent">⭐ ممتاز: ${o}</span>
        <span class="summary-chip chip-good">✅ جيد: ${$}</span>
        <span class="summary-chip chip-weak">⚠️ ضعيف: ${y}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${D.size>0?`
        ${H("📊","ملخص المحافظات")}
        ${ge(["المحافظة","إشراف عام","نشط","غير نشط","الاستمارات","نسبة النشاط"],[...D.values()].filter(d=>d.govId).map(d=>{const h=d.users.filter(w=>w.totalToday>0).length,b=d.users.filter(w=>w.totalToday===0).length,O=d.users.reduce((w,E)=>w+E.totalToday,0),g=d.users.length>0?Math.round(h/d.users.length*100):0;return[L(d.govName),`${d.users.length}`,`<span style="color:${t.success};font-weight:700">${h}</span>`,`<span style="color:${b>0?t.accent:t.textMuted}">${b}</span>`,`${O}`,`<span style="color:${g>=70?t.success:g>=40?t.warning:t.accent};font-weight:700">${g}%</span>`]}))}
      `:""}

      <!-- ═══ ترتيب المشرفين العامين ═══ -->
      ${T.length>0?`
        ${H("🏆","ترتيب المشرفين العامين")}
        <table class="data-table ranking-table">
          <thead>
            <tr><th>الترتيب</th><th>الاسم</th><th>المحافظة</th><th>الاستمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
          </thead>
          <tbody>
            ${[...T].sort((d,h)=>h.totalToday-d.totalToday).map((d,h)=>{const b=h===0?"rank-gold":h===1?"rank-silver":h===2?"rank-bronze":"",O=h===0?"🥇":h===1?"🥈":h===2?"🥉":`${h+1}`,g=d.totalToday>0?Math.round(d.submittedToday/d.totalToday*100):0;let w;return d.totalToday===0?w='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?w='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?w='<span class="perf-badge perf-good">✅ جيد</span>':w='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                  <tr class="${b} ${d.totalToday===0?"row-inactive":""}">
                    <td class="num" style="font-size:14px;font-weight:900">${O}</td>
                    <td><div class="user-name">${ma} ${L(d.full_name||"—")}</div></td>
                    <td>${L(d.govName||"—")}</td>
                    <td class="num" style="font-weight:800;font-size:13px">${d.totalToday}</td>
                    <td class="num num-success">${d.submittedToday}</td>
                    <td class="num num-warning">${d.draftToday}</td>
                    <td class="num" style="color:${g>=80?t.success:g>=50?t.warning:t.accent};font-weight:700">${g}%</td>
                    <td>${w}</td>
                  </tr>
                `}).join("")}
          </tbody>
        </table>
      `:""}

      <!-- ═══ تفاصيل حسب المحافظة ═══ -->
      ${[...D.values()].filter(d=>d.govId).map(d=>{const h=d.users.filter(g=>g.totalToday>0).length,b=d.users.reduce((g,w)=>g+w.totalToday,0),O=d.users.length>0?Math.round(h/d.users.length*100):0;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(d.govName)}</div>
                <div class="gov-stats">${d.users.length} إشراف عام | نشط: ${h} | غير نشط: ${d.users.length-h}</div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${b}</strong> | نسبة النشاط: <strong style="color:${O>=70?"#A5D6A7":O>=40?"#FFE082":"#EF9A9A"}">${O}%</strong>
              </div>
            </div>

            ${d.users.length===0?'<div class="no-data-msg">لا يوجد مشرفين عامين في هذه المحافظة</div>':`
              <table class="data-table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
                </thead>
                <tbody>
                  ${d.users.sort((g,w)=>w.totalToday-g.totalToday).map((g,w)=>l(g,w)).join("")}
                </tbody>
              </table>
            `}
          </div>
        `}).join("")}

      <!-- ═══ المشرفون العامون بدون محافظة ═══ -->
      ${R.length>0?`
        <div class="no-gov-section">
          <div class="no-gov-title">⚠️ إشراف عام بدون محافظة مسجّلة (${R.length})</div>
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>التقييم</th></tr>
            </thead>
            <tbody>
              ${R.sort((d,h)=>h.totalToday-d.totalToday).map((d,h)=>{let b;return d.totalToday===0?b='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?b='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?b='<span class="perf-badge perf-good">✅ جيد</span>':b='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                    <tr class="${d.totalToday===0?"row-inactive":""}">
                      <td class="num">${h+1}</td>
                      <td><div class="user-name">${ma} ${L(d.full_name||"—")}</div></td>
                      <td class="num">${d.totalToday}</td>
                      <td class="num num-success">${d.submittedToday}</td>
                      <td class="num num-warning">${d.draftToday}</td>
                      <td>${b}</td>
                    </tr>
                  `}).join("")}
            </tbody>
          </table>
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(f,`تقييم_إشراف_عام_${S}`)}const yt=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟",required:!0},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟",required:!0},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟",required:!0}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟",required:!0},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟",required:!0},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟",required:!0},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟",required:!0},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟",required:!0}]},{id:"records_and_docs",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟",required:!0},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟",required:!0},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟",required:!0},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟",required:!0}]},{id:"vaccination_cards",title:"بطاقات التحصين",icon:"💉",fields:[{key:"child_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للأطفال؟",required:!0},{key:"women_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للنساء؟",required:!0}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟",required:!0},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟",required:!0},{key:"respiratory_rate_check",label:"هل يتم احتساب سرعة التنفس للأطفال؟",required:!1},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟",required:!1},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟",required:!1},{key:"clean_delivery_kit",label:"هل يتم تزويد الحوامل بعلبة الولادة النظيفة؟",required:!1},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟",required:!1}]},{id:"vitamins_and_referral",title:"الفيتامينات والإحالة",icon:"💊",fields:[{key:"vitamin_a_children",label:"هل يُعطي فيتامين أ للأطفال؟",required:!1},{key:"vitamin_a_women",label:"هل يُعطي فيتامين أ للنساء؟",required:!1},{key:"facility_referral",label:"هل يتم الإحالة للمرفق الصحي؟",required:!1},{key:"correct_medication",label:"هل يتم إعطاء الأدوية بطريقة سليمة؟",required:!1},{key:"nutrition_counseling",label:"هل يتم النصح والإرشاد الغذائي؟",required:!1}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟",required:!0},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟",required:!0},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟",required:!0}]},{id:"supplies_equipment",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟",required:!0},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟",required:!0},{key:"fetal_stethoscope",label:"هل توجد سماعة جنين؟",required:!0},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟",required:!0},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟",required:!0},{key:"height_board",label:"هل يوجد شريط قياس الطول؟",required:!0},{key:"thermometer",label:"هل يوجد ترمومتر؟",required:!0},{key:"scale",label:"هل يوجد ميزان؟",required:!0},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟",required:!0}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟",required:!0},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟",required:!0},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟",required:!0},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟",required:!0}]},{id:"catch_up_policy",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟",required:!0},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟",required:!0},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟",required:!0},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟",required:!0},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟",required:!0},{key:"catch_up_2to5_registration",label:"هل يتم تطعيم أطفال 2-5 سنوات وتسجيلهم؟",required:!0},{key:"team_target_knowledge",label:"هل لدى الفريق معرفة بالمستهدفين؟",required:!0}]},{id:"defaulter_tracking",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟",required:!0},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟",required:!0}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟",required:!0},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟",required:!0}]}];async function Go(e){var O;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date().toISOString().split("T")[0],n=(e==null?void 0:e.dateFrom)||c,m=(e==null?void 0:e.dateTo)||c,S=`${n}T00:00:00`,C=`${m}T23:59:59`;await U.auth.getSession();async function k(g,w=!0){let W=[],te=0;for(;;){let _=U.from("form_submissions").select("id, data, governorate_id, submitted_by, created_at").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").is("deleted_at",null).gte("created_at",S).lte("created_at",C).order("created_at",{ascending:!1}).range(te,te+1e3-1);w&&(_=_.eq("status","submitted")),e!=null&&e.governorateId&&e.governorateId!=="all"&&(_=_.eq("governorate_id",e.governorateId)),g&&(_=_.eq("campaign_round",g));const{data:A,error:G}=await _;if(G){console.error("[YesNoReport] fetch error:",G.message);break}if(!A||A.length===0||(W.push(...A),A.length<1e3))break;te+=1e3}return W}let u=await k(r);u.length===0&&r&&(console.warn(`[YesNoReport] No data for round ${r}, retrying without round`),u=await k(null)),u.length===0&&(console.warn("[YesNoReport] No data, retrying without status filter"),u=await k(null,!1));const T={data:u},P=await U.from("profiles").select("id, full_name, role").is("deleted_at",null),D=new Map;for(const g of P.data||[])D.set(g.id,{name:g.full_name,role:g.role});const R=await U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),F=new Map;for(const g of R.data||[])F.set(g.id,g.name_ar);const N=T.data.map(g=>({...g,profiles:D.get(g.submitted_by)||null,governorates:g.governorate_id?{name_ar:F.get(g.governorate_id)||"غير محدد"}:null})),M=N.length,j=yt.flatMap(g=>g.fields.map(w=>w.key)),x=new Map;for(const g of yt)for(const w of g.fields)x.set(w.key,{yes:0,no:0,total:0,label:w.label,sectionId:g.id});const i=new Map;for(const g of N){const w=g.data||{},E=((O=g.governorates)==null?void 0:O.name_ar)||"غير محدد";if(!i.has(E)){i.set(E,new Map);for(const W of j)i.get(E).set(W,{yes:0,no:0,total:0})}for(const W of j){const te=w[W],_=x.get(W);_&&(te===!0||te==="yes"||te==="نعم"?(_.yes++,_.total++,i.get(E).get(W).yes++,i.get(E).get(W).total++):(te===!1||te==="no"||te==="لا")&&(_.no++,_.total++,i.get(E).get(W).no++,i.get(E).get(W).total++))}}const p=yt.map(g=>{const w=g.fields.map(A=>({...A,...x.get(A.key),yesRate:x.get(A.key).total>0?Math.round(x.get(A.key).yes/x.get(A.key).total*100):0})),E=w.reduce((A,G)=>A+G.yes,0),W=w.reduce((A,G)=>A+G.no,0),te=E+W,_=te>0?Math.round(E/te*100):0;return{...g,fields:w,totalYes:E,totalNo:W,total:te,avgRate:_}}),v=p.reduce((g,w)=>g+w.totalYes,0),o=p.reduce((g,w)=>g+w.totalNo,0),$=v+o,y=$>0?Math.round(v/$*100):0,a=p.flatMap(g=>g.fields.filter(w=>w.total>0)),l=[...a].sort((g,w)=>w.yesRate-g.yesRate).slice(0,5),f=[...a].sort((g,w)=>g.yesRate-w.yesRate).slice(0,5),d=n===m?Pe(new Date(n)):`${Pe(new Date(n))} — ${Pe(new Date(m))}`;function h(g,w="sm"){const E=g>=80?t.success:g>=60?t.warning:g>=40?"#FF9800":t.accent,W=w==="lg"?"14px":"8px";return`
      <div style="display:flex;align-items:center;gap:6px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:${W};height:${W};overflow:hidden;">
          <div style="width:${g}%;height:100%;background:${E};border-radius:${W};transition:width 0.3s;"></div>
        </div>
        <span style="font-size:${w==="lg"?"11px":"9px"};font-weight:700;color:${E};min-width:35px;text-align:left;">${g}%</span>
      </div>
    `}const b=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل حقول نعم/لا — ${d}</title>
      ${Ee()}
      <style>
        .section-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          margin: 12px 0;
          overflow: hidden;
          page-break-inside: avoid;
        }
        .section-card-header {
          background: linear-gradient(135deg, ${t.primary}15, ${t.primary}08);
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${t.border};
        }
        .section-card-title {
          font-size: 13px;
          font-weight: 800;
          color: ${t.primaryDark};
        }
        .section-card-rate {
          font-size: 18px;
          font-weight: 900;
        }
        .field-row {
          display: flex;
          align-items: center;
          padding: 8px 16px;
          border-bottom: 1px solid #F5F5F5;
          gap: 10px;
        }
        .field-row:last-child { border-bottom: none; }
        .field-label {
          flex: 1;
          font-size: 12px;
          font-weight: 600;
          color: ${t.textDark};
        }
        .field-stats {
          display: flex;
          gap: 8px;
          font-size: 11px;
          font-weight: 600;
          min-width: 100px;
          justify-content: flex-end;
        }
        .stat-yes { color: ${t.success}; }
        .stat-no { color: ${t.accent}; }
        .stat-total { color: ${t.textMuted}; }

        .top-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 12px 0;
        }
        .top-bottom-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          padding: 14px;
        }
        .top-bottom-title {
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .top-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;
        }
        .top-item-rate {
          font-weight: 800;
          min-width: 35px;
          text-align: left;
        }
        .top-item-label {
          flex: 1;
          font-weight: 500;
        }

        .gov-table-wrap {
          margin: 12px 0;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      ${je("تحليل حقول نعم/لا","استمارة الاشراف للنشاط الايصالي التكاملي"+De(r),d)}

      <!-- ═══ KPIs ═══ -->
      ${H("📊","ملخص التحليل")}
      <div class="kpi-grid">
        ${I("إجمالي الاستمارات",M,"📋",t.primary)}
        ${I("نسبة نعم الكلية",`${y}%`,"✅",y>=70?t.success:y>=50?t.warning:t.accent,`${v}/${$}`)}
        ${I("نسبة لا الكلية",`${100-y}%`,"❌",t.accent,`${o}/${$}`)}
        ${I("عدد الأقسام",yt.length,"📑",t.info)}
        ${I("عدد الحقول",j.length,"📝","#6366f1")}
      </div>

      <!-- ═══ أفضل وأسوأ 5 حقول ═══ -->
      <div class="top-bottom-grid">
        <div class="top-bottom-card" style="border-top: 4px solid ${t.success};">
          <div class="top-bottom-title" style="color:${t.success};">✅ أعلى 5 حقول (نعم)</div>
          ${l.map((g,w)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${w+1}.</span>
              <span class="top-item-label">${L(g.label)}</span>
              <span class="top-item-rate" style="color:${t.success};">${g.yesRate}%</span>
            </div>
          `).join("")}
        </div>
        <div class="top-bottom-card" style="border-top: 4px solid ${t.accent};">
          <div class="top-bottom-title" style="color:${t.accent};">❌ أقل 5 حقول (نعم)</div>
          ${f.map((g,w)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${w+1}.</span>
              <span class="top-item-label">${L(g.label)}</span>
              <span class="top-item-rate" style="color:${t.accent};">${g.yesRate}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ═══ تفصيل حسب القسم ═══ -->
      ${H("📑","تحليل حسب القسم")}
      ${p.map(g=>`
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">${g.icon} ${L(g.title)} (${g.fields.length} حقل)</div>
            <div class="section-card-rate" style="color:${g.avgRate>=70?t.success:g.avgRate>=50?t.warning:t.accent};">${g.avgRate}%</div>
          </div>
          ${g.fields.map(w=>{const E=w.yesRate;return`
              <div class="field-row">
                <div class="field-label">${L(w.label)}</div>
                <div style="flex:1.5;">${h(E)}</div>
                <div class="field-stats">
                  <span class="stat-yes">✓ ${w.yes}</span>
                  <span class="stat-no">✗ ${w.no}</span>
                  <span class="stat-total">(${w.total})</span>
                </div>
              </div>
            `}).join("")}
        </div>
      `).join("")}

      <!-- ═══ ملخص حسب المحافظة ═══ -->
      ${H("🏛️","ملخص حسب المحافظة")}
      <div class="gov-table-wrap">
        ${ge(["المحافظة","الاستمارات","نسبة نعم الكلية",...yt.slice(0,6).map(g=>g.icon+" "+g.title.slice(0,8))],[...i.entries()].map(([g,w])=>{const E=N.filter(G=>{var Y;return((Y=G.governorates)==null?void 0:Y.name_ar)===g}).length;let W=0,te=0;for(const[,G]of w)W+=G.yes,te+=G.total;const _=te>0?Math.round(W/te*100):0,A=yt.slice(0,6).map(G=>{let Y=0,X=0;for(const le of G.fields){const de=w.get(le.key);de&&(Y+=de.yes,X+=de.total)}const V=X>0?Math.round(Y/X*100):0;return`<span style="color:${V>=70?t.success:V>=50?t.warning:t.accent};font-weight:700;">${V}%</span>`});return[L(g),`${E}`,`<span style="color:${_>=70?t.success:_>=50?t.warning:t.accent};font-weight:800;font-size:12px;">${_}%</span>`,...A]}))}
      </div>

      <!-- ═══ ملخص حسب القسم ═══ -->
      ${H("📈","مقارنة الأقسام")}
      ${ge(["القسم","الحقول","نعم","لا","المجموع","النسبة","التقييم"],p.map(g=>{const w=g.avgRate>=80?"ممتاز ✅":g.avgRate>=60?"جيد 👍":g.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",E=g.avgRate>=80?t.success:g.avgRate>=60?"#FF9800":g.avgRate>=40?t.warning:t.accent;return[`${g.icon} ${L(g.title)}`,`${g.fields.length}`,`<span style="color:${t.success};font-weight:700;">${g.totalYes}</span>`,`<span style="color:${t.accent};font-weight:700;">${g.totalNo}</span>`,`${g.total}`,`<span style="color:${E};font-weight:800;">${g.avgRate}%</span>`,`<span style="color:${E};font-weight:700;">${w}</span>`]}))}

      ${Te()}
    </body>
    </html>
  `;Ce(b,`تحليل_نعم_لا_${n}_${m}`)}const Oo={عدن:{center:[12.78,45.02],zoom:11},تعز:{center:[13.58,44.02],zoom:11},الحديدة:{center:[14.8,42.95],zoom:11},البيضاء:{center:[13.98,45.57],zoom:11},مأرب:{center:[15.47,45.33],zoom:10},الجوف:{center:[16.78,45.58],zoom:10},حجة:{center:[15.69,43.6],zoom:10},أبين:{center:[13.43,45.37],zoom:11},لحج:{center:[13.05,44.88],zoom:11},شبوة:{center:[14.88,46.83],zoom:10},المهرة:{center:[15.8,51.5],zoom:9},المكلا:{center:[14.53,49.13],zoom:11},سيئون:{center:[15.97,48.78],zoom:10},الضالع:{center:[13.7,44.73],zoom:11},سقطرى:{center:[12.47,53.87],zoom:9},حضرموت:{center:[15.4,49],zoom:9}};async function Bo(e){var j;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date().toISOString().split("T")[0],n=(e==null?void 0:e.dateFrom)||c,m=(e==null?void 0:e.dateTo)||c;async function S(){const x=await _r(e==null?void 0:e.campaignType),i=[];let p=0;const v=1e3;for(;;){let o=U.from("form_submissions").select(`
          id, gps_lat, gps_lng, created_at, status, data,
          forms(title_ar, campaign_type),
          profiles:submitted_by(full_name, role),
          governorates(name_ar),
          districts(name_ar)
        `).is("deleted_at",null).not("gps_lat","is",null).not("gps_lng","is",null).gte("created_at",`${n}T00:00:00`).lte("created_at",`${m}T23:59:59`).order("created_at",{ascending:!1}).range(p,p+v-1);x&&x.length>0&&(o=o.in("form_id",x)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(o=o.eq("governorate_id",e.governorateId)),r&&(o=o.eq("campaign_round",r));const{data:$,error:y}=await o;if(y||!$||$.length===0||(i.push(...$),$.length<v)||(p+=v,i.length>=1e5))break}return i}const k=(await S()||[]).filter(x=>x.gps_lat&&x.gps_lng&&typeof x.gps_lat=="number"&&typeof x.gps_lng=="number"&&x.gps_lat!==0&&x.gps_lng!==0),u=new Map;for(const x of k){const i=((j=x.governorates)==null?void 0:j.name_ar)||"غير محدد";u.has(i)||u.set(i,[]),u.get(i).push(x)}const T=k.map(x=>{var i,p,v,o;return{lat:x.gps_lat,lng:x.gps_lng,name:((i=x.profiles)==null?void 0:i.full_name)||"—",role:((p=x.profiles)==null?void 0:p.role)||"",gov:((v=x.governorates)==null?void 0:v.name_ar)||"",dist:((o=x.districts)==null?void 0:o.name_ar)||"",date:x.created_at,status:x.status}}),P={};for(const[x,i]of u)P[x]=i.map(p=>{var v,o,$,y;return{lat:p.gps_lat,lng:p.gps_lng,name:((v=p.profiles)==null?void 0:v.full_name)||"—",role:((o=p.profiles)==null?void 0:o.role)||"",gov:(($=p.governorates)==null?void 0:$.name_ar)||"",dist:((y=p.districts)==null?void 0:y.name_ar)||"",date:p.created_at,status:p.status}});const D=JSON.stringify(T),R=JSON.stringify(P),F=JSON.stringify(Oo),N=`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير الخريطة — مواقع المشرفين</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, sans-serif;
      background: #f5f5f5;
      color: #333;
    }
    .report-header {
      background: linear-gradient(135deg, #1a5276, #2e86c1);
      color: white;
      padding: 24px 32px;
      text-align: center;
    }
    .report-header h1 { font-size: 24px; font-weight: 900; }
    .report-header p { font-size: 13px; opacity: 0.9; margin-top: 4px; }

    .stats-bar {
      display: flex;
      gap: 12px;
      padding: 16px 32px;
      background: white;
      border-bottom: 2px solid #e0e0e0;
      flex-wrap: wrap;
      justify-content: center;
    }
    .stat-chip {
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .map-section {
      margin: 20px 32px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .map-section-header {
      padding: 14px 20px;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .map-section-title {
      font-size: 16px;
      font-weight: 800;
      color: #1a5276;
    }
    .map-section-count {
      font-size: 12px;
      color: #666;
      font-weight: 600;
    }
    .map-container {
      height: 500px;
      width: 100%;
    }
    .map-container.gov-map {
      height: 400px;
    }

    .supervisor-list {
      padding: 12px 20px;
      background: #fafafa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .supervisor-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: white;
      border: 1px solid #dee2e6;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 600;
    }
    .supervisor-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .print-btn {
      position: fixed;
      top: 16px;
      left: 16px;
      padding: 10px 24px;
      background: #1a5276;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .print-btn:hover { background: #2e86c1; }

    @media print {
      .print-btn { display: none; }
      .map-section { page-break-inside: avoid; }
      body { background: white; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ طباعة PDF</button>

  <div class="report-header">
    <h1>🗺️ تقرير الخريطة — مواقع المشرفين</h1>
    <p>استمارة الاشراف للنشاط الايصالي التكاملي — ${n===m?n:n+" إلى "+m}</p>
  </div>

  <div class="stats-bar">
    <div class="stat-chip" style="background:#E3F2FD;color:#1565C0;">📍 إجمالي النقاط: ${k.length}</div>
    <div class="stat-chip" style="background:#E8F5E9;color:#2E7D32;">🏛️ المحافظات: ${u.size}</div>
    <div class="stat-chip" style="background:#FFF3E0;color:#E65100;">👥 المشرفين: ${new Set(k.map(x=>x.submitted_by)).size}</div>
  </div>

  <!-- ═══ الخريطة الكاملة لليمن ═══ -->
  <div class="map-section">
    <div class="map-section-header">
      <div class="map-section-title">🇾🇪 الخريطة الكاملة — جميع المواقع</div>
      <div class="map-section-count">${k.length} موقع</div>
    </div>
    <div id="map-yemen" class="map-container"></div>
    <div class="supervisor-list">
      ${[...u.entries()].map(([x,i])=>{const p=["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#34495e","#16a085","#c0392b","#8e44ad","#2980b9","#27ae60","#d35400","#2c3e50","#7f8c8d"],v=[...u.keys()].indexOf(x);return`<span class="supervisor-tag"><span class="supervisor-dot" style="background:${p[v%p.length]}"></span>${x} (${i.length})</span>`}).join("")}
    </div>
  </div>

  <!-- ═══ خرائط المحافظات ═══ -->
  ${[...u.entries()].map(([x,i])=>`
    <div class="map-section">
      <div class="map-section-header">
        <div class="map-section-title">🏛️ ${x}</div>
        <div class="map-section-count">${i.length} موقع — ${new Set(i.map(p=>p.submitted_by)).size} مشرف</div>
      </div>
      <div id="map-${x.replace(/\s/g,"_")}" class="map-container gov-map"></div>
      <div class="supervisor-list">
        ${[...new Set(i.map(p=>{var v;return((v=p.profiles)==null?void 0:v.full_name)||"—"}))].map(p=>{const v=i.filter(o=>{var $;return(($=o.profiles)==null?void 0:$.full_name)===p}).length;return`<span class="supervisor-tag">👤 ${p} (${v})</span>`}).join("")}
      </div>
    </div>
  `).join("")}

  <script>
    // ═══ Data ═══
    const allMarkers = ${D};
    const govMarkers = ${R};
    const govCenters = ${F};

    // ═══ Color palette per governorate ═══
    const colors = ['#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6','#1abc9c','#e67e22','#34495e','#16a085','#c0392b','#8e44ad','#2980b9','#27ae60','#d35400','#2c3e50','#7f8c8d'];
    const govNames = Object.keys(govMarkers);
    const govColorMap = {};
    govNames.forEach((g, i) => govColorMap[g] = colors[i % colors.length]);

    function createIcon(color) {
      return L.divIcon({
        className: 'custom-marker',
        html: '<div style="width:12px;height:12px;border-radius:50%;background:' + color + ';border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    }

    function popupContent(m) {
      const d = new Date(m.date).toLocaleDateString('ar-YE');
      return '<div style="direction:rtl;font-size:12px;line-height:1.6;">' +
        '<strong>' + m.name + '</strong><br>' +
        'الصفة: ' + m.role + '<br>' +
        'المحافظة: ' + m.gov + '<br>' +
        'المديرية: ' + m.dist + '<br>' +
        'التاريخ: ' + d + '<br>' +
        'الحالة: ' + (m.status === 'submitted' ? '✅ مرسلة' : '📝 مسودة') +
        '</div>';
    }

    // ═══ Yemen Full Map ═══
    const yemenMap = L.map('map-yemen').setView([15.5, 48.5], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(yemenMap);

    allMarkers.forEach(m => {
      const color = govColorMap[m.gov] || '#333';
      L.marker([m.lat, m.lng], { icon: createIcon(color) })
        .addTo(yemenMap)
        .bindPopup(popupContent(m));
    });

    // Fit bounds
    if (allMarkers.length > 0) {
      const bounds = allMarkers.map(m => [m.lat, m.lng]);
      yemenMap.fitBounds(bounds, { padding: [30, 30] });
    }

    // ═══ Governorate Maps ═══
    govNames.forEach(gov => {
      const mapId = 'map-' + gov.replace(/\\s/g, '_');
      const el = document.getElementById(mapId);
      if (!el) return;

      const markers = govMarkers[gov] || [];
      const center = govCenters[gov] || { center: [15.5, 48.5], zoom: 10 };

      const map = L.map(mapId).setView(center.center, center.zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(map);

      markers.forEach(m => {
        L.marker([m.lat, m.lng], { icon: createIcon(govColorMap[gov] || '#333') })
          .addTo(map)
          .bindPopup(popupContent(m));
      });

      if (markers.length > 0) {
        const bounds = markers.map(m => [m.lat, m.lng]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    });
  <\/script>
</body>
</html>`,M=window.open("","_blank");M&&(M.document.write(N),M.document.close())}const qo="606b5093-9a8f-47d6-a6c9-b0429ce4a9f6",lt=[{key:"has_defaulter_list",label:"قائمة المتخلفين",icon:"📋",category:"التخطيط"},{key:"has_village_list",label:"قائمة القرى المستهدفة",icon:"🏘️",category:"التخطيط"},{key:"has_updated_plan",label:"خطة عمل محدّثة",icon:"📅",category:"التخطيط"},{key:"has_population_data",label:"البيانات السكانية",icon:"👥",category:"التخطيط"},{key:"has_coverage_plan",label:"خطة التغطية",icon:"📊",category:"التخطيط"},{key:"plan_reviewed_by_higher_level",label:"مراجعة الخطة من المستوى الأعلى",icon:"✅",category:"المراجعة"},{key:"has_reverse_coverage",label:"التغطية الراجعة",icon:"🔄",category:"التغطية"},{key:"has_higher_level_visit",label:"زيارة من المستوى الأعلى",icon:"🏥",category:"المراجعة"},{key:"routine_coverage_above_85",label:"نسبة التغطية الروتينية >85%",icon:"📈",category:"التغطية"}];async function Uo(e){var a;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,c=new Date().toISOString().split("T")[0],n=Pe(new Date);async function m(l){let d=[],h=0;for(;;){let b=U.from("form_submissions").select(`
          id, status, data, created_at, governorate_id, district_id, submitted_by,
          profiles:submitted_by(full_name),
          governorates(name_ar),
          districts(name_ar)
        `).eq("form_id",qo).is("deleted_at",null).order("created_at",{ascending:!1}).range(h,h+1e3-1);l&&(b=b.eq("campaign_round",l)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(b=b.eq("governorate_id",e.governorateId));const{data:O,error:g}=await b;if(g){console.error("[HFAReport] fetch error:",g.message);break}if(!O||O.length===0||(d.push(...O),O.length<1e3))break;h+=1e3}return d}let S=await m(r);S.length===0&&r&&(console.warn(`[HFAReport] No data for round ${r}, retrying without round filter`),S=await m(null));const{data:C}=await U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),k=new Map;for(const l of C||[])k.set(l.id,l.name_ar);const u=S.length,T=S.filter(l=>l.status==="submitted").length,P=S.filter(l=>l.status==="draft").length,D=lt.map(l=>{var d;let f=0;for(const h of S){const b=(d=h.data)==null?void 0:d[l.key];(b===!0||b==="yes"||b==="نعم")&&f++}return{...l,yes:f,no:u-f,percentage:u>0?Math.round(f/u*100):0}}),R=D.reduce((l,f)=>l+f.yes,0),F=u*lt.length,N=F>0?Math.round(R/F*100):0,M=[...D].sort((l,f)=>f.percentage-l.percentage),j=M.slice(0,3),x=M.slice(-3).reverse(),i=new Map;for(const l of S){const f=l.governorate_id||"",d=k.get(f)||"غير محدد";i.has(f)||i.set(f,{name:d,total:0,yesSum:0});const h=i.get(f);h.total++;for(const b of lt){const O=(a=l.data)==null?void 0:a[b.key];(O===!0||O==="yes"||O==="نعم")&&h.yesSum++}}const p=[...i.values()].map(l=>({...l,score:l.total>0?Math.round(l.yesSum/(l.total*lt.length)*100):0})).sort((l,f)=>f.score-l.score),o=[...new Set(lt.map(l=>l.category))].map(l=>{const f=D.filter(b=>b.category===l),d=f.reduce((b,O)=>b+O.yes,0),h=f.reduce((b,O)=>b+O.yes+O.no,0);return{category:l,metrics:f,score:h>0?Math.round(d/h*100):0,count:f.length}});function $(l){const f=l>=80?t.success:l>=60?t.warning:l>=40?"#FF9800":t.accent;return`
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:8px;overflow:hidden;">
          <div style="width:${l}%;height:100%;background:${f};border-radius:6px;"></div>
        </div>
        <span style="font-size:10px;font-weight:700;color:${f};min-width:32px;text-align:left;">${l}%</span>
      </div>
    `}const y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تقييم المرافق الصحية — ${n}</title>
      ${Ee()}
      <style>
        .metric-card {
          border: 1px solid ${t.border};
          border-radius: 8px;
          padding: 10px 14px;
          margin: 6px 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .metric-icon { font-size: 20px; }
        .metric-info { flex: 1; }
        .metric-label { font-size: 12px; font-weight: 700; color: ${t.textDark}; }
        .metric-bar { margin-top: 4px; }
        .metric-count { font-size: 10px; color: ${t.textMuted}; }
        .category-card {
          border: 1px solid ${t.border};
          border-radius: 10px;
          margin: 10px 0;
          overflow: hidden;
        }
        .category-header {
          background: ${t.bgLight};
          padding: 10px 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${t.border};
        }
        .gov-row {
          display: flex;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #F5F5F5;
          gap: 10px;
        }
        .gov-row:last-child { border-bottom: none; }
      </style>
    </head>
    <body>
      ${je("تقرير تقييم المرافق الصحية","تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية"+De(r),n)}

      <!-- KPIs -->
      ${H("📊","مؤشرات الأداء الرئيسية")}
      <div class="kpi-grid">
        ${I("إجمالي التقييمات",u,"🏥",t.primary)}
        ${I("مُرسلة",T,"✅",t.success,u>0?`${Math.round(T/u*100)}%`:"0%")}
        ${I("مسودات",P,"📝",t.warning)}
        ${I("مؤشر الجاهزية العام",`${N}%`,"🎯",N>=70?t.success:N>=50?t.warning:t.accent,`${R}/${F}`)}
      </div>

      <!-- Overall Score -->
      ${H("🎯","مؤشر الجاهزية العام")}
      <div style="background:white;border:1px solid ${t.border};border-radius:12px;padding:16px;margin:10px 0;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:60px;height:60px;border-radius:50%;background:${N>=70?t.success:N>=50?t.warning:t.accent};display:flex;align-items:center;justify-content:center;color:white;font-size:22px;font-weight:900;">
            ${N}
          </div>
          <div>
            <div style="font-size:16px;font-weight:800;color:${t.textDark};">
              ${N>=80?"ممتاز ✅":N>=60?"جيد 👍":N>=40?"متوسط ⚠️":"يحتاج تحسين ❌"}
            </div>
            <div style="font-size:11px;color:${t.textMuted};">من ${u} تقييم | ${lt.length} مؤشر</div>
          </div>
        </div>
        ${$(N)}
      </div>

      <!-- Best & Worst -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0;">
        <div style="border:1px solid ${t.border};border-radius:10px;padding:12px;border-top:3px solid ${t.success};">
          <div style="font-size:12px;font-weight:800;color:${t.success};margin-bottom:8px;">✅ أعلى المؤشرات</div>
          ${j.map((l,f)=>`
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;">
              <span style="color:#999;font-weight:700;">${f+1}.</span>
              <span style="flex:1;">${l.icon} ${L(l.label)}</span>
              <span style="font-weight:800;color:${t.success};">${l.percentage}%</span>
            </div>
          `).join("")}
        </div>
        <div style="border:1px solid ${t.border};border-radius:10px;padding:12px;border-top:3px solid ${t.accent};">
          <div style="font-size:12px;font-weight:800;color:${t.accent};margin-bottom:8px;">❌ أقل المؤشرات</div>
          ${x.map((l,f)=>`
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;">
              <span style="color:#999;font-weight:700;">${f+1}.</span>
              <span style="flex:1;">${l.icon} ${L(l.label)}</span>
              <span style="font-weight:800;color:${t.accent};">${l.percentage}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Metrics by Category -->
      ${H("📋","تحليل المؤشرات حسب الفئة")}
      ${o.map(l=>`
        <div class="category-card">
          <div class="category-header">
            <span style="font-size:13px;font-weight:800;color:${t.primaryDark};">${l.category} (${l.count} مؤشرات)</span>
            <span style="font-size:16px;font-weight:900;color:${l.score>=70?t.success:l.score>=50?t.warning:t.accent};">${l.score}%</span>
          </div>
          <div style="padding:8px 14px;">
            ${l.metrics.map(f=>`
              <div class="metric-card">
                <span class="metric-icon">${f.icon}</span>
                <div class="metric-info">
                  <div class="metric-label">${L(f.label)}</div>
                  <div class="metric-bar">${$(f.percentage)}</div>
                  <div class="metric-count">✓ ${f.yes} نعم | ✗ ${f.no} لا</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}

      <!-- All Metrics Summary Table -->
      ${H("📊","ملخص جميع المؤشرات")}
      ${ge(["المؤشر","الفئة","نعم","لا","النسبة","التقييم"],D.map(l=>{const f=l.percentage>=80?"ممتاز ✅":l.percentage>=60?"جيد 👍":l.percentage>=40?"متوسط ⚠️":"ضعيف ❌",d=l.percentage>=80?t.success:l.percentage>=60?"#FF9800":l.percentage>=40?t.warning:t.accent;return[`${l.icon} ${L(l.label)}`,L(l.category),`<span style="color:${t.success};font-weight:700;">${l.yes}</span>`,`<span style="color:${t.accent};font-weight:700;">${l.no}</span>`,`<span style="color:${d};font-weight:800;">${l.percentage}%</span>`,`<span style="color:${d};font-weight:700;">${f}</span>`]}))}

      <!-- Governorate Breakdown -->
      ${H("🏛️","أداء المحافظات")}
      ${p.length===0?`<div style="text-align:center;padding:20px;color:${t.textMuted};font-size:12px;">لا توجد بيانات</div>`:ge(["المحافظة","التقييمات","مؤشر الجاهزية","التقييم"],p.map(l=>{const f=l.score>=80?"ممتاز ✅":l.score>=60?"جيد 👍":l.score>=40?"متوسط ⚠️":"ضعيف ❌",d=l.score>=80?t.success:l.score>=60?"#FF9800":l.score>=40?t.warning:t.accent;return[L(l.name),`${l.total}`,`<span style="color:${d};font-weight:800;">${l.score}%</span>`,`<span style="color:${d};font-weight:700;">${f}</span>`]}))}

      <!-- Governorate Detail Cards -->
      ${p.map(l=>`
        <div style="border:1px solid ${t.border};border-radius:10px;margin:10px 0;overflow:hidden;page-break-inside:avoid;">
          <div style="background:linear-gradient(135deg,${t.primary},${t.primaryDark});color:white;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:800;">🏛️ ${L(l.name)}</div>
              <div style="font-size:10px;opacity:0.9;">${l.total} تقييم | مؤشر الجاهزية: ${l.score}%</div>
            </div>
            <div style="background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;">
              ${l.score}%
            </div>
          </div>
          <div style="padding:10px 14px;">
            ${(()=>{const f=S.filter(h=>{const b=h.governorate_id||"";return k.get(b)===l.name});return lt.map(h=>{var g;let b=0;for(const w of f){const E=(g=w.data)==null?void 0:g[h.key];(E===!0||E==="yes"||E==="نعم")&&b++}const O=f.length>0?Math.round(b/f.length*100):0;return{...h,yes:b,percentage:O}}).map(h=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;">
                  <span style="width:20px;text-align:center;">${h.icon}</span>
                  <span style="flex:1;">${L(h.label)}</span>
                  ${$(h.percentage)}
                </div>
              `).join("")})()}
          </div>
        </div>
      `).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(y,`تقييم_المرافق_الصحية_${c}`)}function Yo(){var ja;const{data:e}=Ws(),r=((ja=e==null?void 0:e.profile)==null?void 0:ja.role)||"data_entry",{campaign:c,labelAr:n,isFiltered:m,campaignRound:S,showRoundFilter:C}=Zt(),{toast:k}=Xa(),{previewProps:u,openPreview:T,closePreview:P}=ss(),D=zr(),R=C?S:void 0,{data:F,isLoading:N,refetch:M}=mr(c,R),{data:j,isLoading:x}=hr(c,R),{data:i,isLoading:p,refetch:v}=br({campaignType:c}),{data:o}=xr(c,R),{data:$}=cs(),{data:y,isLoading:a}=fr(c,R),{data:l}=vr(),{data:f}=yr({page:1}),d=(i==null?void 0:i.data)||[],[h,b]=ce.useState("analytics"),[O]=Bs();ce.useEffect(()=>{const q=O.get("tab");q&&["analytics","quick-reports","form-exports","comparison"].includes(q)&&b(q)},[O]);const[g,w]=ce.useState(null),[E,W]=ce.useState(null),[te,_]=ce.useState(""),[A,G]=ce.useState(""),[Y,X]=ce.useState(""),[V,le]=ce.useState("all"),[de,be]=ce.useState({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),[Se,_e]=ce.useState(!1),[we,ze]=ce.useState(null),[He,ft]=ce.useState(null),[z,K]=ce.useState(""),[se,ie]=ce.useState("all"),ve=ce.useMemo(()=>d.filter(q=>{if(te){const me=te.toLowerCase();return q.title_ar.toLowerCase().includes(me)||q.title_en.toLowerCase().includes(me)}return!0}),[d,te]),ee=ce.useCallback(async(q,me)=>{W(q);try{await me(),k({title:"تم تصدير التقرير بنجاح ✅",variant:"success"})}catch(ae){console.error(ae),k({title:"فشل التصدير",variant:"destructive"})}finally{W(null)}},[k]),Ne=()=>ee("dashboard",()=>{F&&Vr(F)}),xe=()=>ee("governorates",()=>{j&&Xr(j.map(q=>({name:q.name,submissions:q.submissions})))}),Ze=()=>ee("users",async()=>{D.startFetch();const q=await so();D.updateFetchProgress(q.fetchedCount,q.totalCount),D.startGenerate(),eo((q.data||[]).map(me=>{var ae;return{full_name:me.full_name,email:me.email,role:me.role,is_active:me.is_active,governorate:(ae=me.governorates)==null?void 0:ae.name_ar,created_at:me.created_at}})),D.done(`تم تصدير ${q.fetchedCount} مستخدم`)}),B=()=>ee("submissions",async()=>{D.startFetch();const q=await ao({governorateId:V!=="all"?V:void 0,dateFrom:A||void 0,dateTo:Y||void 0});D.updateFetchProgress(q.fetchedCount,q.totalCount),D.startGenerate();const me=q.data.map((ae,re)=>{var oe,he,Ge,ke,ue;return{index:re+1,form:((oe=ae.forms)==null?void 0:oe.title_ar)||"",status:ae.status==="submitted"?"مرسلة":"مسودة",submitted_by:((he=ae.profiles)==null?void 0:he.full_name)||"",governorate:((Ge=ae.governorates)==null?void 0:Ge.name_ar)||"",district:((ke=ae.districts)==null?void 0:ke.name_ar)||"",campaign:((ue=ae.forms)==null?void 0:ue.campaign_type)==="polio_campaign"?"شلل أطفال":"إيصالي",date:new Date(ae.created_at).toLocaleDateString("ar-SA")}});Qr(me),D.done(`تم تصدير ${me.length} إرسالية${q.truncated?" (مُقتطع)":""}`)}),J=()=>ee("shortages",async()=>{D.startFetch();const q=await ro();D.updateFetchProgress(q.fetchedCount,q.totalCount),D.startGenerate();const me={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ae=q.data.map((re,oe)=>{var he,Ge;return{index:oe+1,item:re.item_name,category:re.item_category||"",needed:re.quantity_needed||"",available:re.quantity_available||0,severity:me[re.severity]||re.severity,resolved:re.is_resolved?"نعم":"لا",by:((he=re.profiles)==null?void 0:he.full_name)||"",gov:((Ge=re.governorates)==null?void 0:Ge.name_ar)||"",date:new Date(re.created_at).toLocaleDateString("ar-SA")}});Zr(ae),D.done(`تم تصدير ${ae.length} نقص`)}),ne=()=>ee("timeline",()=>{y&&Jr(y)}),fe=()=>ee("roles",()=>{l&&to(l.map(q=>({name:q.name,value:q.value})))}),ye=()=>ee("audit",()=>{if(!(f!=null&&f.data))return;const q=[{header:"#",key:"index",width:6},{header:"العملية",key:"action",width:15},{header:"الجدول",key:"table",width:15},{header:"المستخدم",key:"user",width:20},{header:"التفاصيل",key:"details",width:30},{header:"التاريخ",key:"date",width:18}],me=f.data.map((ae,re)=>{var oe;return{index:re+1,action:ae.action,table:ae.table_name||"",user:((oe=ae.profiles)==null?void 0:oe.full_name)||"",details:JSON.stringify(ae.new_data||{}).slice(0,100),date:new Date(ae.created_at).toLocaleDateString("ar-SA")}});Ta({sheetName:"سجل التدقيق",title:"سجل التدقيق — EPI Supervisor",subtitle:`${me.length} عملية`,columns:q,data:me,fileName:`audit_log_${new Date().toISOString().split("T")[0]}`})}),Ke=()=>ee("health-facility-assessment",async()=>{D.startFetch();const{data:q,error:me}=await U.from("form_submissions").select(`
        id, status, data, created_at,
        profiles:submitted_by(full_name, email),
        governorates(name_ar),
        districts(name_ar)
      `).eq("form_id","606b5093-9a8f-47d6-a6c9-b0429ce4a9f6").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);if(me)throw me;D.updateFetchProgress((q==null?void 0:q.length)||0,(q==null?void 0:q.length)||0),D.startGenerate();const ae=he=>he===!0||he==="yes"?"نعم":"لا",re=(q||[]).map((he,Ge)=>{var ke,ue,Me,Le,ot,Ot,jt,vt,Oe,Ue,bt,et;return{index:Ge+1,status:he.status==="submitted"?"مرسلة":"مسودة",supervisor:((ke=he.profiles)==null?void 0:ke.full_name)||"",governorate:((ue=he.governorates)==null?void 0:ue.name_ar)||"",district:((Me=he.districts)==null?void 0:Me.name_ar)||"",date:new Date(he.created_at).toLocaleDateString("ar-SA"),defaulter_list:ae((Le=he.data)==null?void 0:Le.has_defaulter_list),village_list:ae((ot=he.data)==null?void 0:ot.has_village_list),updated_plan:ae((Ot=he.data)==null?void 0:Ot.has_updated_plan),population_data:ae((jt=he.data)==null?void 0:jt.has_population_data),coverage_plan:ae((vt=he.data)==null?void 0:vt.has_coverage_plan),plan_reviewed:ae((Oe=he.data)==null?void 0:Oe.plan_reviewed_by_higher_level),reverse_coverage:ae((Ue=he.data)==null?void 0:Ue.has_reverse_coverage),higher_visit:ae((bt=he.data)==null?void 0:bt.has_higher_level_visit),routine_coverage_85:ae((et=he.data)==null?void 0:et.routine_coverage_above_85)}}),oe=[{header:"#",key:"index",width:5},{header:"الحالة",key:"status",width:10},{header:"المشرف",key:"supervisor",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"التاريخ",key:"date",width:12},{header:"قائمة المتخلفين",key:"defaulter_list",width:12},{header:"قائمة القرى",key:"village_list",width:10},{header:"خطة محدّثة",key:"updated_plan",width:10},{header:"بيانات سكانية",key:"population_data",width:10},{header:"خطة التغطية",key:"coverage_plan",width:10},{header:"مراجعة الخطة",key:"plan_reviewed",width:10},{header:"تغطية راجعة",key:"reverse_coverage",width:10},{header:"زيارة المستوى الأعلى",key:"higher_visit",width:12},{header:"تغطية >85%",key:"routine_coverage_85",width:10}];Ta({sheetName:"تقييم المرافق الصحية",title:"تقرير تقييم جودة أداء المرافق الصحية",subtitle:`${re.length} تقييم`,columns:oe,data:re,fileName:`health_facility_assessment_${new Date().toISOString().split("T")[0]}`}),D.done(`تم تصدير ${re.length} تقييم`)}),Ie=()=>ee("pdf",async()=>{var Ge;const{data:q}=await U.from("governorates").select("name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar"),{data:me}=await U.from("form_submissions").select("governorate_id, status, governorates(name_ar)").is("deleted_at",null).gte("created_at",new Date(Date.now()-720*60*60*1e3).toISOString()),ae=new Map;for(const ke of me||[]){const ue=((Ge=ke.governorates)==null?void 0:Ge.name_ar)||"غير محدد",Me=ae.get(ue)||{name:ue,count:0};Me.count++,ae.set(ue,Me)}const{data:re}=await U.from("form_submissions").select("status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(20),oe={submitted:"مرسلة",draft:"مسودة",approved:"معتمدة",rejected:"مرفوضة"},he=Et({title:"تقرير الإرساليات الشامل",subtitle:"إحصائيات تفصيلية للإرساليات والاستمارات",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"إجمالي الإرساليات",value:(F==null?void 0:F.total_submissions)||0,icon:"📋",color:"#1565C0"},{label:"مرسلة",value:((F==null?void 0:F.total_submissions)||0)-((F==null?void 0:F.draft_submissions)||0),icon:"✅",color:"#2E7D32"},{label:"مسودات",value:(F==null?void 0:F.draft_submissions)||0,icon:"📝",color:"#F57F17"},{label:"اليوم",value:(F==null?void 0:F.submissions_today)||0,icon:"📅",color:"#0277BD"}]},{title:"الإرساليات حسب المحافظة",icon:"🗺️",type:"table",columns:[{key:"name",label:"المحافظة"},{key:"count",label:"عدد الإرساليات"}],rows:Array.from(ae.values()).sort((ke,ue)=>ue.count-ke.count).slice(0,15)},{title:"آخر الإرساليات",icon:"📝",type:"table",columns:[{key:"form",label:"الاستمارة"},{key:"submitter",label:"المقدم"},{key:"governorate",label:"المحافظة"},{key:"status",label:"الحالة"},{key:"date",label:"التاريخ"}],rows:(re||[]).map(ke=>{var ue,Me,Le;return{form:((ue=ke.forms)==null?void 0:ue.title_ar)||"—",submitter:((Me=ke.profiles)==null?void 0:Me.full_name)||"—",governorate:((Le=ke.governorates)==null?void 0:Le.name_ar)||"—",status:oe[ke.status]||ke.status,date:new Date(ke.created_at).toLocaleDateString("ar-SA")}})}]});T("تقرير الإرساليات الشامل",he,"آخر 30 يوم")}),Ae=()=>ee("gov-pdf",async()=>{if(!j)return;const q=j.filter(oe=>oe.submissions===0),me=j.length>0?j[0]:null,ae=j.length>0?Math.round(j.filter(oe=>oe.submissions>0).length/j.length*100):0,re=Et({title:"تقرير أداء المحافظات",subtitle:"مقارنة شاملة لأداء جميع المحافظات",sections:[{title:"مؤشرات التغطية",icon:"🎯",type:"kpi-grid",kpis:[{label:"نسبة التغطية",value:`${ae}%`,icon:"📊",color:ae>=80?"#2E7D32":"#F57F17"},{label:"محافظات نشطة",value:j.filter(oe=>oe.submissions>0).length,icon:"🏛️",color:"#1565C0"},{label:"بدون تغطية",value:q.length,icon:"⚠️",color:q.length>0?"#E53935":"#2E7D32"},{label:"الأعلى نشاطاً",value:(me==null?void 0:me.name)||"—",icon:"🏆",color:"#FFD600"}]},{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:j.map((oe,he)=>({rank:he+1,name:oe.name,submissions:oe.submissions}))},...q.length>0?[{title:"محافظات بدون تغطية",icon:"⚠️",type:"list",items:q.map(oe=>({label:oe.name,value:"لا توجد إرساليات",color:"#E53935"}))}]:[]]});T("تقرير أداء المحافظات",re,`${j.length} محافظة`)}),hs=()=>ee("users-pdf",async()=>{const{data:q}=await U.from("profiles").select("full_name, email, role, is_active, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),me={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},ae={};for(const oe of q||[])ae[oe.role]=(ae[oe.role]||0)+1;const re=Et({title:"تقرير المستخدمين",subtitle:"إحصائيات شاملة للمستخدمين والأدوار",sections:[{title:"ملخص المستخدمين",icon:"👥",type:"kpi-grid",kpis:[{label:"إجمالي المستخدمين",value:(q==null?void 0:q.length)||0,icon:"👤",color:"#1565C0"},{label:"نشطين",value:(q==null?void 0:q.filter(oe=>oe.is_active).length)||0,icon:"✅",color:"#2E7D32"},{label:"غير نشطين",value:(q==null?void 0:q.filter(oe=>!oe.is_active).length)||0,icon:"⏸️",color:"#F57F17"}]},{title:"توزيع الأدوار",icon:"📊",type:"summary",items:Object.entries(ae).map(([oe,he])=>({label:me[oe]||oe,value:he,color:oe==="admin"?"#8E24AA":"#1565C0"}))},{title:"قائمة المستخدمين",icon:"📋",type:"table",columns:[{key:"name",label:"الاسم",width:150},{key:"email",label:"البريد",width:180},{key:"role",label:"الدور",width:100},{key:"governorate",label:"المحافظة",width:120},{key:"active",label:"نشط",width:60}],rows:(q||[]).map(oe=>{var he;return{name:oe.full_name,email:oe.email,role:me[oe.role]||oe.role,governorate:((he=oe.governorates)==null?void 0:he.name_ar)||"—",active:oe.is_active?"نعم":"لا"}})}]});T("تقرير المستخدمين",re,`${(q==null?void 0:q.length)||0} مستخدم`)}),fs=()=>ee("shortages-pdf",async()=>{const{data:q}=await U.from("supply_shortages").select("item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),me={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ae=Et({title:"تقرير النواقص التفصيلي",subtitle:"نواقص اللقاحات والمعدات والتجهيزات",sections:[{title:"ملخص النواقص",icon:"📦",type:"kpi-grid",kpis:[{label:"إجمالي النواقص",value:(q==null?void 0:q.length)||0,icon:"📦",color:"#1565C0"},{label:"حرجة",value:(q==null?void 0:q.filter(re=>re.severity==="critical").length)||0,icon:"🔴",color:"#E53935"},{label:"عالية",value:(q==null?void 0:q.filter(re=>re.severity==="high").length)||0,icon:"🟠",color:"#FF6D00"},{label:"محلولة",value:(q==null?void 0:q.filter(re=>re.is_resolved).length)||0,icon:"✅",color:"#2E7D32"}]},{title:"نسبة الحل",icon:"🎯",type:"progress",progressItems:[{label:"نواقص محلولة",value:(q==null?void 0:q.filter(re=>re.is_resolved).length)||0,max:(q==null?void 0:q.length)||1,color:"#2E7D32"},{label:"نواقص حرجة",value:(q==null?void 0:q.filter(re=>re.severity==="critical").length)||0,max:(q==null?void 0:q.length)||1,color:"#E53935"}]},{title:"تفاصيل النواقص",icon:"📋",type:"table",columns:[{key:"item",label:"الصنف",width:150},{key:"severity",label:"الخطورة",width:80},{key:"needed",label:"المطلوب",width:80},{key:"available",label:"المتاح",width:80},{key:"gap",label:"النقص",width:80},{key:"governorate",label:"المحافظة",width:120},{key:"resolved",label:"محلول",width:60}],rows:(q||[]).map(re=>{var oe;return{item:re.item_name,severity:me[re.severity]||re.severity,needed:re.quantity_needed||0,available:re.quantity_available||0,gap:Math.max(0,(re.quantity_needed||0)-re.quantity_available),governorate:((oe=re.governorates)==null?void 0:oe.name_ar)||"—",resolved:re.is_resolved?"نعم":"لا"}})}]});T("تقرير النواقص التفصيلي",ae,`${(q==null?void 0:q.length)||0} نقص`)}),vs=()=>ee("full-pdf",async()=>{if(!F)return;const q=j&&j.length>0?Math.round(j.filter(ae=>ae.submissions>0).length/j.length*100):0,me=Et({title:"التقرير الشامل — EPI Supervisor",subtitle:"جميع البيانات والإحصائيات في تقرير واحد",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"المستخدمين",value:F.total_users,icon:"👥",color:"#0277BD",sub:`${F.active_users} نشط`},{label:"إرساليات اليوم",value:F.submissions_today,icon:"📅",color:"#2E7D32"},{label:"المسودات",value:F.draft_submissions,icon:"📝",color:"#F57F17"},{label:"نسبة الإنجاز",value:`${F.approval_rate.toFixed(1)}%`,icon:"🎯",color:"#8E24AA"},{label:"النماذج النشطة",value:F.active_forms,icon:"📄",color:"#1565C0"},{label:"التغطية",value:`${q}%`,icon:"🗺️",color:q>=80?"#2E7D32":"#F57F17"}]},{title:"توزيع الحالات",icon:"📈",type:"summary",items:[{label:"مرسلة",value:F.total_submissions-F.draft_submissions,color:"#2E7D32"},{label:"مسودة",value:F.draft_submissions,color:"#F57F17"},{label:"هذا الأسبوع",value:F.submissions_this_week,color:"#0277BD"},{label:"الاتجاه",value:`${F.submissions_trend>0?"+":""}${F.submissions_trend}%`,color:F.submissions_trend>=0?"#2E7D32":"#E53935"}]},...j&&j.length>0?[{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:j.map((ae,re)=>({rank:re+1,name:ae.name,submissions:ae.submissions}))}]:[]]});T("التقرير الشامل",me,"جميع البيانات والإحصائيات")}),bs=async(q,me)=>{w(q.id);try{const ae=q.schema,re=[];ae!=null&&ae.fields&&ae.fields.forEach(ue=>re.push({label_ar:ue.label_ar||ue.label||"",key:ue.id||ue.key||""})),ae!=null&&ae.sections&&ae.sections.forEach(ue=>{var Me;return(Me=ue.fields)==null?void 0:Me.forEach(Le=>re.push({label_ar:Le.label_ar||Le.label||"",key:Le.id||Le.key||""}))});const oe=[];let he=0;const Ge=1e3;for(;;){const{data:ue,error:Me}=await U.from("form_submissions").select("id, status, data, created_at, profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)").eq("form_id",q.id).is("deleted_at",null).order("created_at",{ascending:!1}).range(he,he+Ge-1);if(Me)throw Me;if(!ue||ue.length===0||(oe.push(...ue),ue.length<Ge||oe.length>=5e4))break;he+=Ge,await new Promise(Le=>setTimeout(Le,50))}const ke=oe.map(ue=>{var Me,Le,ot;return{id:ue.id,status:ue.status,submitted_by:((Me=ue.profiles)==null?void 0:Me.full_name)||"",governorate:((Le=ue.governorates)==null?void 0:Le.name_ar)||"",district:((ot=ue.districts)==null?void 0:ot.name_ar)||"",created_at:ue.created_at,data:ue.data||{}}});if(ke.length===0){k({title:"لا توجد إرساليات",variant:"destructive"});return}if(me==="csv"){const ue=Oe=>{const Ue=String(Oe??""),bt=/^[=+\-@\t\r]/.test(Ue),et=Ue.includes(",")||Ue.includes('"')||Ue.includes(`
`)?`"${Ue.replace(/"/g,'""')}"`:Ue;return bt?`'${et}`:et},Me=["#","الحالة","المُرسل","المحافظة","التاريخ",...re.map(Oe=>Oe.label_ar)],Le=ke.map((Oe,Ue)=>[Ue+1,ue(Oe.status==="submitted"?"مرسلة":"مسودة"),ue(Oe.submitted_by),ue(Oe.governorate),ue(new Date(Oe.created_at).toLocaleDateString("ar-SA")),...re.map(bt=>{var et;return ue((et=Oe.data)==null?void 0:et[bt.key])})]),ot=[Me.join(","),...Le.map(Oe=>Oe.join(","))].join(`
`),Ot=new Blob(["\uFEFF"+ot],{type:"text/csv;charset=utf-8;"}),jt=URL.createObjectURL(Ot),vt=document.createElement("a");vt.href=jt,vt.download=`${q.title_ar}.csv`,vt.click(),URL.revokeObjectURL(jt)}else Hs(q.title_ar,re,ke);k({title:`تم تصدير ${ke.length} إرسالية ✅`,variant:"success"})}catch{k({title:"فشل التصدير",variant:"destructive"})}finally{w(null)}},Re=async(q,me,ae)=>{const re=io();try{await ae();const oe=Wa(re);oe&&T(q,oe,me)}catch(oe){throw Wa(re),oe}},xs=()=>ee("central-report",()=>Re("التقرير المركزي الشامل","جميع المحافظات والبيانات",()=>co({dateFrom:A||void 0,dateTo:Y||void 0,campaignType:c!=="all"?c:void 0,campaignRound:R}))),ys=q=>ee("gov-detail-"+q,()=>Re("تقرير محافظة","تفاصيل تفصيلية",()=>go(q,{dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),$s=q=>ee("form-analysis-"+q,()=>Re("تحليل النموذج","تقرير تفصيلي",()=>uo(q,{dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),_s=()=>ee("supervisor-report",()=>Re("تقرير أداء المشرفين","تقييم شامل لكل مشرف",()=>po({dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),ws=()=>ee("coverage-gap",()=>Re("تقرير الفجوة التغطية","أين البيانات ناقصة",()=>mo({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R}))),Ss=()=>ee("campaign-comparison",()=>Re("تقرير مقارنة الحملات","شلل أطفال vs الإيصالي التكاملي",()=>ho({dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),ks=()=>ee("daily-activity",()=>Re("تقرير النشاط اليومي","نشاط اليوم — إرساليات، دخول، مقارنة",()=>fo({campaignRound:R}))),Fs=()=>ee("data-quality",()=>Re("تقرير جودة البيانات","تحليل اكتمال البيانات — GPS، صور، حقول فارغة",()=>vo({dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),Rs=()=>ee("shortages-detailed",()=>Re("تقرير النواقص التفصيلي","تحليل شامل — حرج/عالي/متوسط",()=>bo({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0}))),Ds=()=>ee("weekly-report",()=>Re("التقرير الأسبوعي","ملخص الأسبوع — مقارنة بالسابق",()=>xo({campaignRound:R}))),js=()=>ee("user-activity",()=>Re("تقرير نشاط المستخدمين","دخول، نشاط، مستخدمين خاملين",()=>yo({dateFrom:A||void 0,dateTo:Y||void 0,campaignRound:R}))),Ts=()=>ee("challenges",()=>Re("تقرير التحديات والصعوبات","تحديات، إجراءات، توصيات",()=>$o({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R}))),Es=()=>ee("supervision-form",()=>Re("تقرير استمارة الإشراف","النشاط الإيصالي التكاملي — 8 أقسام × 33 مؤشر",()=>So({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R}))),Cs=()=>ee("supervision-challenges",()=>Re("تقرير تحديات الإشراف الميداني","التحديات — الإجراءات — التوصيات",()=>Fo({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R}))),Ns=()=>ee("daily-supervisor-eval",()=>Re("تقييم أداء المشرفين اليومي","استمارة الإشراف — النشاط الإيصالي التكاملي",()=>Co({date:Y||new Date().toISOString().split("T")[0],governorateId:V!=="all"?V:void 0,campaignRound:R}))),Ms=()=>ee("comprehensive-supervisor-eval",()=>Re("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي",()=>Mo({governorateId:V!=="all"?V:void 0,campaignRound:R}))),zs=()=>ee("master-supervisor-report",()=>Re("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات + خريطة — تقرير مدمج",()=>Ao({governorateId:V!=="all"?V:void 0,campaignRound:R}))),Ps=()=>ee("general-supervisors-eval",()=>Re("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي",()=>Lo({date:Y||new Date().toISOString().split("T")[0],governorateId:V!=="all"?V:void 0,campaignRound:R}))),Is=()=>ee("yesno-analysis",()=>Re("تحليل حقول نعم/لا","استمارة الاشراف — تحليل شامل",()=>Go({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R}))),As=()=>{Bo({dateFrom:A||void 0,dateTo:Y||void 0,governorateId:V!=="all"?V:void 0,campaignRound:R})},Ls=()=>ee("health-facility-assessment-pdf",()=>Re("تقرير تقييم المرافق الصحية","تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية",()=>Uo({governorateId:V!=="all"?V:void 0,campaignRound:R}))),Gs=ce.useMemo(()=>j?j.slice(0,10).map(q=>({name:q.name,الإرساليات:q.submissions})):[],[j]),Os=ce.useMemo(()=>F?[{name:"مرسلة",value:F.total_submissions-F.draft_submissions,color:"#10b981"},{name:"مسودة",value:F.draft_submissions,color:"#f59e0b"}]:[],[F]);return{stats:F,statsLoading:N,govStats:j,govLoading:x,forms:d,formsLoading:p,submissionCounts:o,governorates:$,chartData:y,chartLoading:a,roleDistribution:l,auditData:f,activeTab:h,setActiveTab:b,exportingFormId:g,exportingReport:E,formSearch:te,setFormSearch:_,dateFrom:A,setDateFrom:G,dateTo:Y,setDateTo:X,selectedGovFilter:V,setSelectedGovFilter:le,analyticsFilter:de,setAnalyticsFilter:be,drillDownOpen:Se,setDrillDownOpen:_e,drillDownData:we,setDrillDownData:ze,fullscreenChart:He,setFullscreenChart:ft,reportSearch:z,setReportSearch:K,reportFormat:se,setReportFormat:ie,filteredForms:ve,previewProps:u,openPreview:T,closePreview:P,exportProgress:D,userRole:r,campaign:c,labelAr:n,isFiltered:m,refetchStats:M,refetchForms:v,handleExportDashboard:Ne,handleExportGovernorates:xe,handleExportUsers:Ze,handleExportSubmissions:B,handleExportShortages:J,handleExportTimeline:ne,handleExportRoles:fe,handleExportAudit:ye,handleExportPDF:Ie,handleExportGovPDF:Ae,handleExportUsersPDF:hs,handleExportShortagesPDF:fs,handleExportFullPDF:vs,handleExportForm:bs,handleCentralReport:xs,handleGovDetailReport:ys,handleFormAnalysisReport:$s,handleSupervisorReport:_s,handleCoverageGapReport:ws,handleCampaignComparisonReport:Ss,handleDailyActivityReport:ks,handleDataQualityReport:Fs,handleShortagesDetailedReport:Rs,handleWeeklyReport:Ds,handleUserActivityReport:js,handleChallengesReport:Ts,handleSupervisionFormReport:Es,handleSupervisionChallengesReport:Cs,handleDailySupervisorEvaluation:Ns,handleComprehensiveSupervisorEvaluation:Ms,handleMasterSupervisorReport:zs,handleGeneralSupervisorsEvaluation:Ps,handleYesNoAnalysis:Is,handleMapReport:As,handleHealthFacilityAssessmentReport:Ls,handleExportHealthFacilityAssessment:Ke,govChartData:Gs,statusPieData:Os,exportReport:ee}}const $t=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];function Ye(e){return["admin","central"].includes(e)}function zt(e){return["admin","central","governorate"].includes(e)}const pe={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function Jt(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function Fe(e){return e.toLocaleString("ar-SA")}function Pt(e){const r=e.addSlide();return r.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:pe.textMuted}),r.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:pe.textMuted,align:"right"}),r.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:pe.primary}}),r}function Wo(e,r,c){const n=e.addSlide();n.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:pe.primaryDark}}),n.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:pe.white}});try{n.addImage({data:aa,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return n.addText(r,{x:.5,y:2.2,w:9,h:1,fontSize:32,fontFace:"Cairo",bold:!0,color:pe.white,align:"center"}),n.addText(c,{x:1,y:3.5,w:8,h:.6,fontSize:16,fontFace:"Tajawal",color:"B3D4FC",align:"center"}),n.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),n.addText(Jt(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),n}function Vt(e,r,c=.3,n=1.8){const m=9.4/r.length-.15;r.forEach((S,C)=>{const k=c+C*(m+.15);e.addShape("roundRect",{x:k,y:n,w:m,h:1.4,fill:{color:pe.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:k,y:n,w:m,h:.06,fill:{color:S.color||pe.primary},rectRadius:.03}),e.addText(S.icon||"📊",{x:k,y:n+.15,w:m,h:.3,fontSize:14,align:"center"}),e.addText(S.value,{x:k,y:n+.45,w:m,h:.5,fontSize:22,bold:!0,align:"center",color:S.color||pe.primary,fontFace:"Cairo"}),e.addText(S.label,{x:k,y:n+.95,w:m,h:.35,fontSize:9,align:"center",color:pe.textMuted})})}function Ka(e,r,c,n){const m=(n==null?void 0:n.x)||.3,S=(n==null?void 0:n.y)||3.5,C=(n==null?void 0:n.w)||9.4,k=[r.map(u=>({text:u,options:{bold:!0,color:pe.white,fill:{color:pe.primary},fontSize:9,align:"center"}})),...c.map((u,T)=>u.map(P=>({text:P,options:{fontSize:8,fill:{color:T%2===0?pe.bg:pe.white},align:"center"}})))];e.addTable(k,{x:m,y:S,w:C,border:{type:"solid",pt:.5,color:pe.border},colW:r.map(()=>C/r.length),rowH:.35,autoPage:!1})}async function Ho(){var g;const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),1);new Date(e.getFullYear(),e.getMonth()-1,1),new Date(e.getFullYear(),e.getMonth(),0);const[c,n,m,S,C]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",r.toISOString()).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*").is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),k=c.status==="fulfilled"?c.value.data||[]:[],u=n.status==="fulfilled"?n.value.data||[]:[],T=m.status==="fulfilled"?m.value.data||[]:[],P=S.status==="fulfilled"?S.value.data||[]:[];C.status==="fulfilled"&&C.value.data;const D=k.filter(w=>w.status==="submitted"),R=k.filter(w=>w.status==="draft"),F=new Set(k.map(w=>w.submitted_by)).size,N=new Set(k.map(w=>w.governorate_id).filter(Boolean)).size,M=P.filter(w=>!w.is_resolved),j=M.filter(w=>w.severity==="critical"),x=T.length>0?Math.round(N/T.length*100):0,i=T.map(w=>{const E=k.filter(W=>W.governorate_id===w.id);return{name:w.name_ar,total:E.length,submitted:E.filter(W=>W.status==="submitted").length,draft:E.filter(W=>W.status==="draft").length}}).sort((w,E)=>E.total-w.total),p=k.filter(w=>{var E;return((E=w.forms)==null?void 0:E.campaign_type)==="polio_campaign"}),v=k.filter(w=>{var E;return((E=w.forms)==null?void 0:E.campaign_type)!=="polio_campaign"}),o=new ta;o.layout="LAYOUT_WIDE",o.author="EPI Supervisor",o.title=`تقرير الأداء الشهري — ${Jt(e)}`,Wo(o,"التقرير الشهري للأداء",`أداء برنامج التحصين — ${Jt(r)} إلى ${Jt(e)}`);const $=Pt(o);$.addText("مؤشرات الأداء الرئيسية",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:pe.primary,fontFace:"Cairo"}),Vt($,[{label:"إجمالي الإرساليات",value:Fe(k.length),icon:"📋",color:pe.primary},{label:"مرسلة",value:Fe(D.length),icon:"✅",color:pe.success},{label:"مسودات",value:Fe(R.length),icon:"📝",color:pe.warning},{label:"مشرفين نشطين",value:Fe(F),icon:"👥",color:pe.purple},{label:"محافظات نشطة",value:`${N}/${T.length}`,icon:"🏛️",color:pe.info},{label:"نسبة التغطية",value:`${x}%`,icon:"🎯",color:x>=80?pe.success:pe.warning}]);const y=Pt(o);y.addText("مقارنة الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:pe.primary,fontFace:"Cairo"}),Vt(y,[{label:"حملة شلل أطفال",value:Fe(p.length),icon:"💉",color:pe.blue},{label:"شلل — مرسلة",value:Fe(p.filter(w=>w.status==="submitted").length),icon:"✅",color:pe.success},{label:"الإيصالي التكاملي",value:Fe(v.length),icon:"🏥",color:pe.green},{label:"إيصالي — مرسلة",value:Fe(v.filter(w=>w.status==="submitted").length),icon:"✅",color:pe.success}],.3,1.5);const a=p.length>0?Math.round((p.length-p.filter(w=>w.status==="submitted").length)/p.length*100):0,l=v.length>0?Math.round((v.length-v.filter(w=>w.status==="submitted").length)/v.length*100):0;y.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:3.2,w:9.4,h:.4,fontSize:14,bold:!0,color:pe.text,fontFace:"Cairo"}),Ka(y,["الحملة","الإجمالي","مرسلة","مسودة","نسبة التسريب","التقييم"],[["شلل أطفال",Fe(p.length),Fe(p.filter(w=>w.status==="submitted").length),Fe(p.filter(w=>w.status==="draft").length),`${a}%`,a<=10?"✅ ممتاز":a<=25?"⚠️ مقبول":"🔴 حرج"],["إيصالي تكاملي",Fe(v.length),Fe(v.filter(w=>w.status==="submitted").length),Fe(v.filter(w=>w.status==="draft").length),`${l}%`,l<=10?"✅ ممتاز":l<=25?"⚠️ مقبول":"🔴 حرج"]],{y:3.7});const f=Pt(o);f.addText("أداء المحافظات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:pe.primary,fontFace:"Cairo"}),Vt(f,[{label:"الأعلى نشاطاً",value:((g=i[0])==null?void 0:g.name)||"—",icon:"🏆",color:pe.warning},{label:"بدون تغطية",value:Fe(i.filter(w=>w.total===0).length),icon:"⚠️",color:pe.accent}],.3,1.2),Ka(f,["#","المحافظة","الإجمالي","مرسلة","مسودة","نسبة الإرسال"],i.slice(0,15).map((w,E)=>[`${E+1}`,w.name,Fe(w.total),Fe(w.submitted),Fe(w.draft),w.total>0?`${Math.round(w.submitted/w.total*100)}%`:"0%"]),{y:2.8});const d=Pt(o);d.addText("تنبيهات النواقص",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:pe.accent,fontFace:"Cairo"}),Vt(d,[{label:"نواقص غير محلولة",value:Fe(M.length),icon:"📦",color:pe.accent},{label:"حرجة",value:Fe(j.length),icon:"🚨",color:pe.accent},{label:"نواقص محلولة",value:Fe(P.filter(w=>w.is_resolved).length),icon:"✅",color:pe.success},{label:"معدل الحل",value:`${P.length>0?Math.round(P.filter(w=>w.is_resolved).length/P.length*100):0}%`,icon:"📈",color:pe.info}],.3,1.2),j.length>0&&(d.addShape("roundRect",{x:.3,y:3,w:9.4,h:.5,fill:{color:"FFEBEE"},rectRadius:.05}),d.addText(`🚨 تنبيه عاجل: يوجد ${j.length} نقص حرج يحتاج تدخل فوري!`,{x:.5,y:3,w:9,h:.5,fontSize:12,bold:!0,color:pe.accent}));const h=Pt(o);h.addText("التوصيات والإجراءات المطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:pe.primary,fontFace:"Cairo"});const b=[];x<80&&b.push(`🎯 رفع نسبة التغطية من ${x}% إلى 80% — متابعة المحافظات غير النشطة`),j.length>0&&b.push(`🚨 معالجة ${j.length} نواقص حرجة فوراً`),R.length>10&&b.push(`📝 مراجعة واعتماد ${R.length} مسودة معلقة`),F<u.filter(w=>w.is_active).length*.7&&b.push(`👥 تفعيل المشرفين غير النشطين — ${u.filter(w=>w.is_active).length-F} مشرف لم يرسل`),a>15&&b.push(`💉 خفض معدل التسريب في حملة شلل أطفال من ${a}%`),b.length===0&&b.push("✅ الأداء ممتاز — استمرار المتابعة والتحسين"),b.forEach((w,E)=>{h.addShape("roundRect",{x:.5,y:1.2+E*.7,w:9,h:.55,fill:{color:E%2===0?"E3F2FD":"F3E5F5"},rectRadius:.05}),h.addText(w,{x:.7,y:1.2+E*.7,w:8.6,h:.55,fontSize:12,color:pe.text,fontFace:"Cairo"})});const O=`تقرير_شهري_${e.toISOString().split("T")[0]}.pptx`;await o.writeFile({fileName:O})}const Q={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function Ft(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function Xe(e){const r=e.addSlide();return r.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:Q.primary}}),r.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:Q.textMuted}),r.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:Q.textMuted,align:"right"}),r}function ps(e,r,c){const n=e.addSlide();n.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:Q.primaryDark}}),n.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:Q.white}});try{n.addImage({data:aa,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return n.addText(r,{x:.5,y:2.2,w:9,h:1,fontSize:32,bold:!0,color:Q.white,align:"center",fontFace:"Cairo"}),n.addText(c,{x:1,y:3.5,w:8,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),n.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),n.addText(Ft(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),n}function wt(e,r,c=1.8){const n=9.4/r.length-.15;r.forEach((m,S)=>{const C=.3+S*(n+.15);e.addShape("roundRect",{x:C,y:c,w:n,h:1.4,fill:{color:Q.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:C,y:c,w:n,h:.06,fill:{color:m.color||Q.primary},rectRadius:.03}),e.addText(m.icon||"📊",{x:C,y:c+.15,w:n,h:.3,fontSize:14,align:"center"}),e.addText(m.value,{x:C,y:c+.45,w:n,h:.5,fontSize:22,bold:!0,align:"center",color:m.color||Q.primary,fontFace:"Cairo"}),e.addText(m.label,{x:C,y:c+.95,w:n,h:.35,fontSize:9,align:"center",color:Q.textMuted})})}function Lt(e,r,c,n){const m=(n==null?void 0:n.x)||.3,S=(n==null?void 0:n.y)||3.5,C=(n==null?void 0:n.w)||9.4,k=[r.map(u=>({text:u,options:{bold:!0,color:Q.white,fill:{color:Q.primary},fontSize:9,align:"center"}})),...c.map((u,T)=>u.map(P=>({text:P,options:{fontSize:8,fill:{color:T%2===0?Q.bg:Q.white},align:"center"}})))];e.addTable(k,{x:m,y:S,w:C,border:{type:"solid",pt:.5,color:Q.border},rowH:.35,autoPage:!1})}async function Ko(){const e=new Date,r=new Date(e.getTime()-7*864e5),c=new Date(e.getTime()-14*864e5),[n,m,S,C,k]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",r.toISOString()).is("deleted_at",null),U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",c.toISOString()).lt("created_at",r.toISOString()).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).eq("is_resolved",!1)]),u=n.status==="fulfilled"?n.value.data||[]:[],T=m.status==="fulfilled"&&m.value.count||0;S.status==="fulfilled"&&S.value.data;const P=C.status==="fulfilled"?C.value.data||[]:[],D=k.status==="fulfilled"?k.value.data||[]:[],R=u.filter(d=>d.status==="submitted"),F=u.filter(d=>d.status==="draft"),N=new Set(u.map(d=>d.submitted_by)).size,M=new Set(u.map(d=>d.governorate_id).filter(Boolean)).size,j=u.length-T,x=T>0?Math.round(j/T*100):0,i=Array.from({length:7},(d,h)=>{const b=new Date(r.getTime()+h*864e5),O=b.toISOString().split("T")[0],g=b.toLocaleDateString("ar-SA",{weekday:"long"}),w=u.filter(E=>E.created_at.startsWith(O));return{day:g,count:w.length,submitted:w.filter(E=>E.status==="submitted").length}}),p=P.map(d=>({name:d.name_ar,count:u.filter(h=>h.governorate_id===d.id).length})).sort((d,h)=>h.count-d.count).filter(d=>d.count>0),v=new ta;v.layout="LAYOUT_WIDE",v.author="EPI Supervisor",v.title=`النشرة الأسبوعية — ${Ft(r)} إلى ${Ft(e)}`,ps(v,"النشرة الأسبوعية للتحصين",`الأسبوع: ${Ft(r)} — ${Ft(e)}`);const o=Xe(v);o.addText("ملخص الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),wt(o,[{label:"إرساليات الأسبوع",value:u.length.toString(),icon:"📋",color:Q.primary},{label:"مرسلة",value:R.length.toString(),icon:"✅",color:Q.success},{label:"مقارنة بالأسبوع السابق",value:`${j>=0?"+":""}${x}%`,icon:j>=0?"📈":"📉",color:j>=0?Q.success:Q.accent},{label:"مشرفين نشطين",value:N.toString(),icon:"👥",color:Q.purple},{label:"محافظات نشطة",value:`${M}/${P.length}`,icon:"🏛️",color:Q.info}]);const $=Xe(v);$.addText("النشاط اليومي",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),Lt($,["اليوم","الإرساليات","مرسلة","نسبة الإرسال"],i.map(d=>[d.day,d.count.toString(),d.submitted.toString(),d.count>0?`${Math.round(d.submitted/d.count*100)}%`:"0%"]),{y:1.2});const y=Xe(v);y.addText("ترتيب المحافظات هذا الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),Lt(y,["#","المحافظة","الإرساليات","النسبة"],p.slice(0,15).map((d,h)=>[`${h+1}`,d.name,d.count.toString(),`${Math.round(d.count/Math.max(u.length,1)*100)}%`]),{y:1.2});const a=Xe(v);a.addText("تنبيهات وإجراءات مطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.accent,fontFace:"Cairo"});const l=[];j<0&&l.push({text:`⚠️ انخفاض الإرساليات بنسبة ${Math.abs(x)}% مقارنة بالأسبوع السابق`,color:Q.accent,bg:"FFEBEE"}),M<P.length*.7&&l.push({text:`🏛️ ${P.length-M} محافظة لم ترسل بيانات هذا الأسبوع`,color:Q.warning,bg:"FFF8E1"}),D.length>0&&l.push({text:`📦 ${D.length} نقص معلق يحتاج متابعة`,color:Q.accent,bg:"FFEBEE"}),F.length>u.length*.3&&l.push({text:`📝 نسبة المسودات عالية (${Math.round(F.length/Math.max(u.length,1)*100)}%) — مراجعة المشرفين`,color:Q.warning,bg:"FFF8E1"}),l.length===0&&l.push({text:"✅ لا توجد تنبيهات — الأداء ممتاز!",color:Q.success,bg:"E8F5E9"}),l.forEach((d,h)=>{a.addShape("roundRect",{x:.5,y:1.2+h*.8,w:9,h:.6,fill:{color:d.bg},rectRadius:.05}),a.addText(d.text,{x:.7,y:1.2+h*.8,w:8.6,h:.6,fontSize:12,color:d.color,fontFace:"Cairo"})});const f=`نشرة_اسبوعية_${e.toISOString().split("T")[0]}.pptx`;await v.writeFile({fileName:f})}async function Vo(){const e=new Date,[r,c,n,m]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e4),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null)]),S=r.status==="fulfilled"?r.value.data||[]:[],C=c.status==="fulfilled"?c.value.data||[]:[],k=n.status==="fulfilled"?n.value.data||[]:[],u=m.status==="fulfilled"?m.value.data||[]:[],T=k.filter(E=>E.campaign_type==="polio_campaign").map(E=>E.id),P=k.filter(E=>E.campaign_type!=="polio_campaign").map(E=>E.id),D=S.filter(E=>T.includes(E.form_id)),R=S.filter(E=>P.includes(E.form_id)),F=D.filter(E=>E.status==="submitted"),N=R.filter(E=>E.status==="submitted");D.filter(E=>E.status==="draft"),R.filter(E=>E.status==="draft");const M=D.length>0?Math.round((D.length-F.length)/D.length*100):0,j=R.length>0?Math.round((R.length-N.length)/R.length*100):0,x=C.map(E=>({name:E.name_ar,total:D.filter(W=>W.governorate_id===E.id).length,submitted:D.filter(W=>W.governorate_id===E.id&&W.status==="submitted").length})).sort((E,W)=>W.total-E.total),i=C.map(E=>({name:E.name_ar,total:R.filter(W=>W.governorate_id===E.id).length,submitted:R.filter(W=>W.governorate_id===E.id&&W.status==="submitted").length})).sort((E,W)=>W.total-E.total),p=x.filter(E=>E.total===0),v=i.filter(E=>E.total===0),o=new ta;o.layout="LAYOUT_WIDE",o.author="EPI Supervisor",o.title=`تقرير أداء الحملات — ${Ft(e)}`,ps(o,"تقرير أداء الحملات","مقارنة شاملة — حملة شلل أطفال vs الإيصالي التكاملي");const $=Xe(o);$.addText("نظرة عامة على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),wt($,[{label:"شلل أطفال — إجمالي",value:D.length.toString(),icon:"💉",color:Q.blue},{label:"شلل أطفال — مرسلة",value:F.length.toString(),icon:"✅",color:Q.success},{label:"إيصالي — إجمالي",value:R.length.toString(),icon:"🏥",color:Q.green},{label:"إيصالي — مرسلة",value:N.length.toString(),icon:"✅",color:Q.success}]);const y=Xe(o);y.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),y.addText("معدل التسريب = (الإجمالي - المرسلة) / الإجمالي × 100",{x:.3,y:.9,w:9.4,h:.3,fontSize:10,color:Q.textMuted,italic:!0}),wt(y,[{label:"شلل أطفال — التسريب",value:`${M}%`,icon:"💉",color:M<=10?Q.success:M<=25?Q.warning:Q.accent},{label:"إيصالي — التسريب",value:`${j}%`,icon:"🏥",color:j<=10?Q.success:j<=25?Q.warning:Q.accent}],1.5),y.addShape("roundRect",{x:.3,y:3.2,w:9.4,h:1.8,fill:{color:"E3F2FD"},rectRadius:.1}),y.addText("معايير التقييم (WHO Benchmarks)",{x:.5,y:3.3,w:9,h:.4,fontSize:13,bold:!0,color:Q.primary}),y.addText([{text:"✅ ممتاز: ",options:{bold:!0,color:Q.success}},{text:"تسريب ≤ 10%    ",options:{color:Q.text}},{text:"⚠️ مقبول: ",options:{bold:!0,color:Q.warning}},{text:"تسريب 11-25%    ",options:{color:Q.text}},{text:"🔴 حرج: ",options:{bold:!0,color:Q.accent}},{text:"تسريب > 25%",options:{color:Q.text}}],{x:.5,y:3.7,w:9,h:.4,fontSize:11}),y.addText("معدل التسريب يقيس فقدان المستفيدين بين الجرعة الأولى والجرعة الأخيرة. معدل عالي يشير لمشاكل في المتابعة أو اللوجستيات.",{x:.5,y:4.2,w:9,h:.6,fontSize:10,color:Q.textMuted});const a=Xe(o);a.addText("💉 تغطية حملة شلل أطفال حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:Q.blue,fontFace:"Cairo"}),wt(a,[{label:"محافظات نشطة",value:`${x.filter(E=>E.total>0).length}/${C.length}`,icon:"🏛️",color:Q.info},{label:"بدون تغطية",value:p.length.toString(),icon:"⚠️",color:p.length>0?Q.accent:Q.success}],1.2),Lt(a,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],x.filter(E=>E.total>0).slice(0,12).map((E,W)=>[`${W+1}`,E.name,E.total.toString(),E.submitted.toString(),`${Math.round(E.submitted/Math.max(E.total,1)*100)}%`]),{y:2.8});const l=Xe(o);l.addText("🏥 تغطية الإيصالي التكاملي حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:Q.green,fontFace:"Cairo"}),wt(l,[{label:"محافظات نشطة",value:`${i.filter(E=>E.total>0).length}/${C.length}`,icon:"🏛️",color:Q.info},{label:"بدون تغطية",value:v.length.toString(),icon:"⚠️",color:v.length>0?Q.accent:Q.success}],1.2),Lt(l,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],i.filter(E=>E.total>0).slice(0,12).map((E,W)=>[`${W+1}`,E.name,E.total.toString(),E.submitted.toString(),`${Math.round(E.submitted/Math.max(E.total,1)*100)}%`]),{y:2.8});const f=Xe(o);f.addText("تأثير النواقص على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.accent,fontFace:"Cairo"});const d=u.filter(E=>E.severity==="critical"&&!E.is_resolved),h=u.filter(E=>E.severity==="high"&&!E.is_resolved);wt(f,[{label:"نواقص حرجة",value:d.length.toString(),icon:"🚨",color:Q.accent},{label:"نواقص عالية",value:h.length.toString(),icon:"🟠",color:"E65100"},{label:"معدل الحل",value:`${u.length>0?Math.round(u.filter(E=>E.is_resolved).length/u.length*100):0}%`,icon:"📈",color:Q.info}],1.2),d.length>0&&Lt(f,["النقص","المحافظة","الخطورة","الكمية المطلوبة"],d.slice(0,8).map(E=>{var W;return[E.item_name,((W=E.governorates)==null?void 0:W.name_ar)||"—","🔴 حرج",`${E.quantity_needed||"—"}`]}),{y:3});const b=Xe(o);b.addText("النتائج الرئيسية والتوصيات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"});const O=[];M<=10?O.push({text:`✅ حملة شلل أطفال: معدل التسريب ${M}% — أداء ممتاز`,type:"success"}):M<=25?O.push({text:`⚠️ حملة شلل أطفال: معدل التسريب ${M}% — يحتاج تحسين`,type:"warning"}):O.push({text:`🔴 حملة شلل أطفال: معدل التسريب ${M}% — حرج!`,type:"danger"}),j<=10?O.push({text:`✅ الإيصالي التكاملي: معدل التسريب ${j}% — أداء ممتاز`,type:"success"}):j<=25?O.push({text:`⚠️ الإيصالي التكاملي: معدل التسريب ${j}% — يحتاج تحسين`,type:"warning"}):O.push({text:`🔴 الإيصالي التكاملي: معدل التسريب ${j}% — حرج!`,type:"danger"}),p.length>0&&O.push({text:`⚠️ ${p.length} محافظة بدون تغطية في حملة شلل أطفال`,type:"warning"}),d.length>0&&O.push({text:`🔴 ${d.length} نقص حرج يعيق الحملات`,type:"danger"});const g={success:{bg:"E8F5E9",text:Q.success},warning:{bg:"FFF8E1",text:Q.warning},danger:{bg:"FFEBEE",text:Q.accent}};O.forEach((E,W)=>{b.addShape("roundRect",{x:.5,y:1.2+W*.7,w:9,h:.55,fill:{color:g[E.type].bg},rectRadius:.05}),b.addText(E.text,{x:.7,y:1.2+W*.7,w:8.6,h:.55,fontSize:12,color:g[E.type].text,fontFace:"Cairo"})});const w=`تقرير_الحملات_${e.toISOString().split("T")[0]}.pptx`;await o.writeFile({fileName:w})}const Z={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",green:"10B981",amber:"F59E0B",purple:"8B5CF6",lightGreen:"E8F5E9",lightRed:"FFEBEE"};function ms(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function it(e,r){e.addShape(r.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:Z.primary}}),e.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:7,w:5,h:.3,fontSize:7,color:Z.textMuted}),e.addText(ms(new Date),{x:7,y:7,w:2.7,h:.3,fontSize:7,color:Z.textMuted,align:"right"})}function ct(e,r,c,n){e.addShape("roundRect",{x:.3,y:.3,w:9.4,h:.7,fill:{color:Z.primaryDark},rectRadius:.08}),e.addText(`${r}  ${c}`,{x:.5,y:.35,w:7,h:.6,fontSize:18,bold:!0,color:Z.white,fontFace:"Cairo"}),n&&e.addText(n,{x:7.5,y:.4,w:2,h:.5,fontSize:11,color:Z.white,align:"center",fill:{color:"1565C0"},shape:"roundRect",rectRadius:.15})}function ha(e,r,c=1.3){const n=9.4/r.length-.12;r.forEach((m,S)=>{const C=.3+S*(n+.12);e.addShape("roundRect",{x:C,y:c,w:n,h:1.5,fill:{color:Z.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.08},rectRadius:.1}),e.addShape("roundRect",{x:C,y:c,w:n,h:.06,fill:{color:m.color||Z.primary},rectRadius:.03}),e.addText(m.icon||"📊",{x:C,y:c+.15,w:n,h:.3,fontSize:16,align:"center"}),e.addText(m.value,{x:C,y:c+.45,w:n,h:.55,fontSize:24,bold:!0,align:"center",color:m.color||Z.primary,fontFace:"Cairo"}),e.addText(m.label,{x:C,y:c+1.05,w:n,h:.35,fontSize:9,align:"center",color:Z.textMuted})})}function Xt(e,r,c,n){const m=(n==null?void 0:n.x)||.3,S=(n==null?void 0:n.y)||3.2,C=(n==null?void 0:n.w)||9.4,k=(n==null?void 0:n.fontSize)||8,u=[r.map(T=>({text:T,options:{bold:!0,color:Z.white,fill:{color:Z.primary},fontSize:k,align:"center",fontFace:"Cairo"}})),...c.map((T,P)=>T.map(D=>({text:D,options:{fontSize:k-1,fill:{color:P%2===0?Z.bg:Z.white},align:"center"}})))];e.addTable(u,{x:m,y:S,w:C,border:{type:"solid",pt:.5,color:Z.border},rowH:.32,autoPage:!1})}const Va=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"]},{id:"work_env",title:"بيئة العمل",icon:"🏢",fields:["suitable_location","community_coordination","has_speaker","has_transport"]},{id:"records",title:"السجلات",icon:"📁",fields:["complete_records","daily_work_forms","correct_data_entry"]},{id:"quality",title:"جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","muac_measurement"]},{id:"vaccine",title:"اللقاحات",icon:"🧊",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"]},{id:"supplies",title:"الإمدادات",icon:"📦",fields:["family_planning_available","folic_iron_stock","scale"]},{id:"shortages",title:"العجز",icon:"⚠️",fields:["has_immunization_shortage","has_reproductive_shortage"]},{id:"catchup",title:"الإحاق",icon:"🔄",fields:["catch_up_knowledge","catch_up_training"]}];async function Xo(e){const r=new ta;r.layout="LAYOUT_WIDE",r.author="EPI Supervisor",r.title="التقرير الشامل المدمج للمشرفين";const c=ms(new Date),n=await Da(e),[m,S,C]=await Promise.allSettled([U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).limit(5e4),U.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).limit(1e4),U.from("profiles").select("id, full_name").is("deleted_at",null)]),k=new Map;for(const B of n.govs)k.set(B.id,B.name_ar);const{enriched:u,govs:T,subs:P,govGroups:D}=n,R=u.filter(B=>(B.role==="central"||B.role==="admin")&&B.govId),F=[...u.filter(B=>["governorate","district","data_entry"].includes(B.role)),...R];let N=D;const M=F.length,j=F.filter(B=>B.totalToday>0).length,x=F.filter(B=>B.totalToday===0&&!B.isGenSupervisor).length,i=F.filter(B=>B.isGenSupervisor).length,p=P.length,v=P.filter(B=>B.status==="submitted").length,o=m.status==="fulfilled"?m.value.data||[]:[],$=Va.flatMap(B=>B.fields),y=new Map;for(const B of $)y.set(B,{yes:0,no:0,total:0});for(const B of o){const J=B.data||{};for(const ne of $){const fe=J[ne],ye=y.get(ne);ye&&(fe===!0||fe==="yes"||fe==="نعم"?(ye.yes++,ye.total++):(fe===!1||fe==="no"||fe==="لا")&&(ye.no++,ye.total++))}}const a=Va.map(B=>{const J=B.fields.map(Ie=>{const Ae=y.get(Ie)||{yes:0,no:0,total:0};return{key:Ie,...Ae,yesRate:Ae.total>0?Math.round(Ae.yes/Ae.total*100):0}}),ne=J.reduce((Ie,Ae)=>Ie+Ae.yes,0),fe=J.reduce((Ie,Ae)=>Ie+Ae.no,0),ye=ne+fe,Ke=ye>0?Math.round(ne/ye*100):0;return{...B,fields:J,totalYes:ne,totalNo:fe,total:ye,avgRate:Ke}}),l=a.reduce((B,J)=>B+J.totalYes,0),f=a.reduce((B,J)=>B+J.totalNo,0),d=l+f,h=d>0?Math.round(l/d*100):0,b=S.status==="fulfilled"?S.value.data||[]:[],O=new Map;if(C.status==="fulfilled")for(const B of C.value.data||[])O.set(B.id,B.full_name);const g=["تحدي","صعوب","مشكل","عائق"],w=["إجراء","اجراء","اتخذ","تدبير"],E=["توصي","اقتراح","ينصح"];function W(B,J){if(!B||typeof B!="object")return null;for(const[ne,fe]of Object.entries(B))if(typeof fe=="string"&&fe.trim().length>2){for(const ye of J)if(ne.toLowerCase().includes(ye.toLowerCase()))return fe.trim().slice(0,120)}return null}const te=new Map;for(const B of b){const J=B.data||{},ne=W(J,g),fe=W(J,w),ye=W(J,E);if(!ne&&!fe&&!ye)continue;const Ke=B.governorate_id||"",Ie=k.get(Ke)||"غير محدد";te.has(Ke)||te.set(Ke,{govName:Ie,challenges:[],actions:[],recommendations:[],count:0});const Ae=te.get(Ke);Ae.count++,ne&&Ae.challenges.push(ne),fe&&Ae.actions.push(fe),ye&&Ae.recommendations.push(ye)}const _=[...te.values()].sort((B,J)=>J.count-B.count),A=_.reduce((B,J)=>B+J.count,0),G=_.reduce((B,J)=>B+J.challenges.length,0),Y=r.addSlide();Y.addShape(r.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:Z.primaryDark}}),Y.addShape(r.ShapeType.rect,{x:0,y:3.4,w:13.33,h:.04,fill:{color:Z.white}}),Y.addShape(r.ShapeType.rect,{x:0,y:3.5,w:13.33,h:.02,fill:{color:Z.primary}});try{Y.addImage({data:aa,x:5.9,y:.6,w:1.5,h:1.5,rounding:!0})}catch{}Y.addText("التقرير الشامل المدمج للمشرفين",{x:1,y:2.2,w:11.33,h:1,fontSize:36,bold:!0,color:Z.white,align:"center",fontFace:"Cairo"}),Y.addText("تقييم الأداء ◆ تحليل نعم/لا ◆ تحديات ميدانية",{x:1,y:3.6,w:11.33,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),Y.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.2,w:11.33,h:.4,fontSize:12,color:"90CAF9",align:"center"}),Y.addText(c,{x:1,y:5.8,w:11.33,h:.3,fontSize:11,color:"64B5F6",align:"center"});const X=r.addSlide();it(X,r),ct(X,"📊","مؤشرات الأداء الرئيسية",`${M} مشرف`);const V=Math.max(M-i,1),le=Math.round(j/V*100);ha(X,[{icon:"👥",label:"إجمالي المشرفين",value:`${M}`,color:Z.primary},{icon:"✅",label:"نشط",value:`${j}`,color:Z.success},{icon:"❌",label:"غير نشط",value:`${x}`,color:Z.accent},{icon:"🏛️",label:"إشراف عام",value:`${i}`,color:Z.info},{icon:"📋",label:"الاستمارات",value:`${p}`,color:Z.purple}],1.3),ha(X,[{icon:"🎯",label:"نسبة النشاط",value:`${le}%`,color:le>=70?Z.success:Z.warning},{icon:"📊",label:"نسبة نعم الكلية",value:`${h}%`,color:h>=70?Z.success:Z.warning},{icon:"⚠️",label:"تحديات ميدانية",value:`${A}`,color:Z.accent},{icon:"📤",label:"نسبة الإرسال",value:`${p>0?Math.round(v/p*100):0}%`,color:Z.green}],3.1);const de=[...N.values()].map(B=>{const J=B.allUsers.filter(Ie=>Ie.totalToday>0&&!Ie.isGenSupervisor).length,ne=B.allUsers.filter(Ie=>Ie.isGenSupervisor).length,fe=B.allUsers.reduce((Ie,Ae)=>Ie+Ae.totalToday,0),ye=B.allUsers.length,Ke=ye>0?Math.round(J/Math.max(ye-ne,1)*100):0;return[B.gov.name_ar,`${ye}`,`${J}`,`${ye-J-ne}`,`${fe}`,`${Ke}%`]});Xt(X,["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],de,{y:5,fontSize:7});const be=r.addSlide();it(be,r),ct(be,"📋","تقييم أداء المشرفين — تفاصيل المحافظات");const Se=[];for(const B of N.values()){const J=[...B.allUsers].sort((ne,fe)=>fe.totalToday-ne.totalToday).slice(0,6);for(const ne of J){const fe=ne.role==="central"||ne.role==="admin"?"مركزي":ne.role==="governorate"?"محافظة":ne.role==="district"?"مديرية":"إدخال",ye=ne.isGenSupervisor?"إشراف عام":ne.totalToday>0?"نشط":"غير نشط";Se.push([B.gov.name_ar,(ne.full_name||"—").slice(0,20),fe,(ne.distName||"—").slice(0,15),`${ne.totalToday}`,`${ne.submittedToday}`,ye])}}Xt(be,["المحافظة","الاسم","الصفة","المديرية","استمارات","مرسلة","الحالة"],Se.slice(0,20),{y:1.3,fontSize:7}),Se.length>20&&be.addText(`+ ${Se.length-20} مشرف إضافي...`,{x:.3,y:6.5,w:9.4,h:.3,fontSize:9,color:Z.textMuted,italic:!0});const _e=r.addSlide();it(_e,r),ct(_e,"📊","تحليل حقول نعم/لا",`${o.length} استمارة`);const we=a.map(B=>{const J=B.avgRate>=80?"ممتاز ✅":B.avgRate>=60?"جيد 👍":B.avgRate>=40?"متوسط ⚠️":"ضعيف ❌";return[`${B.icon} ${B.title}`,`${B.fields.length}`,`${B.totalYes}`,`${B.totalNo}`,`${B.avgRate}%`,J]});Xt(_e,["القسم","الحقول","نعم","لا","النسبة","التقييم"],we,{y:1.3,fontSize:8});const ze=a.flatMap(B=>B.fields.filter(J=>J.total>0)),He=[...ze].sort((B,J)=>J.yesRate-B.yesRate).slice(0,5),ft=[...ze].sort((B,J)=>B.yesRate-J.yesRate).slice(0,5);_e.addShape("roundRect",{x:.3,y:5,w:4.5,h:2,fill:{color:Z.lightGreen},rectRadius:.1}),_e.addText("✅ أعلى 5 حقول (نعم)",{x:.5,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:Z.success}),He.forEach((B,J)=>{_e.addText(`${J+1}. ${B.key} — ${B.yesRate}%`,{x:.5,y:5.4+J*.28,w:4,h:.25,fontSize:8,color:Z.text})}),_e.addShape("roundRect",{x:5.2,y:5,w:4.5,h:2,fill:{color:Z.lightRed},rectRadius:.1}),_e.addText("❌ أقل 5 حقول (نعم)",{x:5.4,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:Z.accent}),ft.forEach((B,J)=>{_e.addText(`${J+1}. ${B.key} — ${B.yesRate}%`,{x:5.4,y:5.4+J*.28,w:4,h:.25,fontSize:8,color:Z.text})});const z=r.addSlide();it(z,r),ct(z,"📑","تفصيل حقول نعم/لا — الأقسام الأولى");const K=a.slice(0,4);let se=1.3;for(const B of K){z.addShape("roundRect",{x:.3,y:se,w:9.4,h:.4,fill:{color:Z.primaryDark},rectRadius:.06}),z.addText(`${B.icon} ${B.title}  —  ${B.avgRate}%`,{x:.5,y:se+.02,w:8,h:.35,fontSize:11,bold:!0,color:Z.white}),se+=.5;for(const J of B.fields){const ne=J.yesRate,fe=ne>=80?Z.success:ne>=60?Z.warning:ne>=40?Z.amber:Z.accent;z.addText(J.key,{x:.5,y:se,w:3.5,h:.25,fontSize:8,color:Z.text}),z.addShape("roundRect",{x:4.2,y:se+.05,w:3.5,h:.15,fill:{color:Z.border},rectRadius:.05});const ye=Math.max(.1,ne/100*3.5);z.addShape("roundRect",{x:4.2,y:se+.05,w:ye,h:.15,fill:{color:fe},rectRadius:.05}),z.addText(`${ne}%`,{x:7.9,y:se,w:.8,h:.25,fontSize:8,bold:!0,color:fe,align:"center"}),z.addText(`✓${J.yes} ✗${J.no}`,{x:8.8,y:se,w:1,h:.25,fontSize:7,color:Z.textMuted,align:"center"}),se+=.28}se+=.15}const ie=r.addSlide();it(ie,r),ct(ie,"📑","تفصيل حقول نعم/لا — الأقسام المتبقية");const ve=a.slice(4);let ee=1.3;for(const B of ve){ie.addShape("roundRect",{x:.3,y:ee,w:9.4,h:.4,fill:{color:Z.primaryDark},rectRadius:.06}),ie.addText(`${B.icon} ${B.title}  —  ${B.avgRate}%`,{x:.5,y:ee+.02,w:8,h:.35,fontSize:11,bold:!0,color:Z.white}),ee+=.5;for(const J of B.fields){const ne=J.yesRate,fe=ne>=80?Z.success:ne>=60?Z.warning:ne>=40?Z.amber:Z.accent;ie.addText(J.key,{x:.5,y:ee,w:3.5,h:.25,fontSize:8,color:Z.text}),ie.addShape("roundRect",{x:4.2,y:ee+.05,w:3.5,h:.15,fill:{color:Z.border},rectRadius:.05});const ye=Math.max(.1,ne/100*3.5);ie.addShape("roundRect",{x:4.2,y:ee+.05,w:ye,h:.15,fill:{color:fe},rectRadius:.05}),ie.addText(`${ne}%`,{x:7.9,y:ee,w:.8,h:.25,fontSize:8,bold:!0,color:fe,align:"center"}),ie.addText(`✓${J.yes} ✗${J.no}`,{x:8.8,y:ee,w:1,h:.25,fontSize:7,color:Z.textMuted,align:"center"}),ee+=.28}ee+=.15}const Ne=r.addSlide();it(Ne,r),ct(Ne,"⚠️","تحديات الإشراف الميداني",`${_.length} محافظة`),ha(Ne,[{icon:"📋",label:"استمارات مُعبأة",value:`${A}`,color:Z.primary},{icon:"⚠️",label:"تحديات",value:`${G}`,color:Z.accent},{icon:"📋",label:"إجراءات",value:`${_.reduce((B,J)=>B+J.actions.length,0)}`,color:Z.info},{icon:"💡",label:"توصيات",value:`${_.reduce((B,J)=>B+J.recommendations.length,0)}`,color:Z.success}],1.3);const xe=_.slice(0,10).map(B=>[B.govName,`${B.count}`,`${B.challenges.length}`,`${B.actions.length}`,`${B.recommendations.length}`,B.challenges.length>0?B.challenges[0].slice(0,40)+"...":"—"]);if(Xt(Ne,["المحافظة","استمارات","تحديات","إجراءات","توصيات","أبرز تحدي"],xe,{y:3.2,fontSize:7}),_.length>0){const B=r.addSlide();it(B,r),ct(B,"📝","تفاصيل التحديات حسب المحافظة");let J=1.3;for(const ne of _.slice(0,4)){if(B.addShape("roundRect",{x:.3,y:J,w:9.4,h:.4,fill:{color:Z.primary},rectRadius:.06}),B.addText(`🏛️ ${ne.govName}  —  ${ne.count} استمارة`,{x:.5,y:J+.02,w:8,h:.35,fontSize:10,bold:!0,color:Z.white}),J+=.5,ne.challenges.length>0){B.addText(`⚠️ تحديات (${ne.challenges.length})`,{x:.5,y:J,w:2,h:.25,fontSize:8,bold:!0,color:Z.accent}),J+=.25;for(const fe of ne.challenges.slice(0,3))B.addText(`• ${fe.slice(0,80)}`,{x:.7,y:J,w:8.5,h:.22,fontSize:7,color:Z.text}),J+=.22}if(ne.actions.length>0){B.addText(`📋 إجراءات (${ne.actions.length})`,{x:.5,y:J,w:2,h:.25,fontSize:8,bold:!0,color:Z.info}),J+=.25;for(const fe of ne.actions.slice(0,2))B.addText(`• ${fe.slice(0,80)}`,{x:.7,y:J,w:8.5,h:.22,fontSize:7,color:Z.text}),J+=.22}J+=.2}}const Ze=`التقرير_الشامل_المدمج_${new Date().toISOString().split("T")[0]}.pptx`;await r.writeFile({fileName:Ze})}function Pn(){var M,j,x;const e=Yo(),{campaignRound:r,showRoundFilter:c,labelAr:n,isFiltered:m}=Zt(),S=c?Zs(r):null,[C,k]=ce.useState(()=>{try{const i=localStorage.getItem("epi-favorite-reports");return i?new Set(JSON.parse(i)):new Set}catch{return new Set}}),u=ce.useCallback(i=>{k(p=>{const v=new Set(p);return v.has(i)?v.delete(i):v.add(i),localStorage.setItem("epi-favorite-reports",JSON.stringify([...v])),v})},[]),[T,P]=ce.useState(()=>ts());ce.useEffect(()=>{Ks()},[]);const D=ce.useCallback(i=>{const p=sa.find(v=>v.id===i)||sa[0];P(p),Vs(i)},[]),R=ce.useMemo(()=>{var p;const i=[];return zt(e.userRole)&&i.push({icon:wr,title:"ملخص المؤشرات",subtitle:"KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء",value:e.stats?tt(e.stats.total_submissions):void 0,trend:(p=e.stats)==null?void 0:p.submissions_trend,color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:e.handleExportDashboard,loading:e.exportingReport==="dashboard",badge:"KPIs",format:"excel"}),i.push({icon:Ct,title:"الإرساليات — خط زمني",subtitle:"تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)",value:e.stats?tt(e.stats.submissions_today):void 0,color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:e.handleExportTimeline,loading:e.exportingReport==="timeline",badge:"30 يوم",format:"excel"}),Ye(e.userRole)&&i.push({icon:_t,title:"أداء المحافظات",subtitle:"مقارنة الإرساليات والتغطية الجغرافية بين المحافظات",value:e.govStats?tt(e.govStats.length)+" محافظة":void 0,color:"text-purple-600",gradient:"bg-gradient-to-r from-purple-500 to-purple-600",onClick:e.handleExportGovernorates,loading:e.exportingReport==="governorates",format:"excel"}),i.push({icon:Ma,title:"توزيع الحالات",subtitle:"نسبة الإرساليات المرسلة مقابل المسودات",value:e.stats?`${e.stats.approval_rate.toFixed(1)}%`:void 0,color:"text-amber-600",gradient:"bg-gradient-to-r from-amber-500 to-amber-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"تحليل",format:"excel"}),Ye(e.userRole)&&i.push({icon:Ve,title:"توزيع المستخدمين",subtitle:"المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات",value:e.roleDistribution?tt(e.roleDistribution.reduce((v,o)=>v+o.value,0)):void 0,color:"text-cyan-600",gradient:"bg-gradient-to-r from-cyan-500 to-cyan-600",onClick:e.handleExportRoles,loading:e.exportingReport==="roles",format:"excel"}),i.push({icon:ra,title:"تقرير الإرساليات الشامل",subtitle:"جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات",value:e.stats?tt(e.stats.total_submissions):void 0,color:"text-indigo-600",gradient:"bg-gradient-to-r from-indigo-500 to-indigo-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"شامل",format:"excel"}),Ye(e.userRole)&&i.push({icon:Ve,title:"تقرير المستخدمين",subtitle:"قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم",color:"text-rose-600",gradient:"bg-gradient-to-r from-rose-500 to-rose-600",onClick:e.handleExportUsers,loading:e.exportingReport==="users",format:"excel"}),zt(e.userRole)&&i.push({icon:oa,title:"تقرير النواقص",subtitle:"نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل",color:"text-orange-600",gradient:"bg-gradient-to-r from-orange-500 to-orange-600",onClick:e.handleExportShortages,loading:e.exportingReport==="shortages",format:"excel"}),zt(e.userRole)&&(i.push({icon:za,title:"تقييم المرافق الصحية",subtitle:"تقرير تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية",color:"text-teal-600",gradient:"bg-gradient-to-r from-teal-500 to-teal-600",onClick:e.handleExportHealthFacilityAssessment,loading:e.exportingReport==="health-facility-assessment",badge:"تقييم",format:"excel"}),i.push({icon:za,title:"📄 PDF — تقييم المرافق الصحية",subtitle:"تقرير PDF احترافي — مؤشرات الجاهزية، أداء المحافظات، تحليل المؤشرات",color:"text-red-600",gradient:"bg-gradient-to-r from-teal-600 to-emerald-700",onClick:e.handleHealthFacilityAssessmentReport,loading:e.exportingReport==="health-facility-assessment-pdf",badge:"PDF",format:"pdf"})),Ye(e.userRole)&&i.push({icon:Xs,title:"سجل التدقيق",subtitle:"جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم",color:"text-slate-600",gradient:"bg-gradient-to-r from-slate-500 to-slate-600",onClick:e.handleExportAudit,loading:e.exportingReport==="audit",badge:"audit",format:"excel"}),i.push({icon:nt,title:"📄 PDF — تقرير الإرساليات",subtitle:"تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-500 to-red-600",onClick:e.handleExportPDF,loading:e.exportingReport==="pdf",badge:"PDF",format:"pdf"}),Ye(e.userRole)&&(i.push({icon:_t,title:"📄 PDF — أداء المحافظات",subtitle:"تقرير PDF مقارن لأداء المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-600 to-rose-600",onClick:e.handleExportGovPDF,loading:e.exportingReport==="gov-pdf",badge:"PDF",format:"pdf"}),i.push({icon:Ve,title:"📄 PDF — المستخدمين",subtitle:"تقرير PDF للمستخدمين والأدوار",color:"text-red-600",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:e.handleExportUsersPDF,loading:e.exportingReport==="users-pdf",badge:"PDF",format:"pdf"})),zt(e.userRole)&&i.push({icon:oa,title:"📄 PDF — النواقص",subtitle:"تقرير PDF لنواقص الإمدادات",color:"text-red-600",gradient:"bg-gradient-to-r from-orange-500 to-red-500",onClick:e.handleExportShortagesPDF,loading:e.exportingReport==="shortages-pdf",badge:"PDF",format:"pdf"}),Ye(e.userRole)&&i.push({icon:mt,title:"📄 PDF — التقرير الشامل",subtitle:"تقرير PDF شامل بكل البيانات والإحصائيات",color:"text-white",gradient:"bg-gradient-to-r from-red-700 to-red-900",onClick:e.handleExportFullPDF,loading:e.exportingReport==="full-pdf",badge:"PDF شامل",format:"pdf"}),Ye(e.userRole)&&(i.push({icon:na,title:"🏛️ التقرير المركزي الشامل",subtitle:"تقرير احترافي شامل — جميع المحافظات، المستخدمين، النماذج، النواقص، التغطية",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleCentralReport,loading:e.exportingReport==="central-report",badge:"احترافي",format:"pdf"}),e.governorates&&e.governorates.forEach(v=>{i.push({icon:_t,title:`🏛️ تقرير محافظة ${v.name_ar}`,subtitle:"تقرير تفصيلي — المديريات، المستخدمين، الإرساليات، النواقص",color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:()=>e.handleGovDetailReport(v.id),loading:e.exportingReport==="gov-detail-"+v.id,badge:"محافظة",format:"pdf"})})),e.forms&&e.forms.forEach(v=>{i.push({icon:nt,title:`📊 تحليل: ${v.title_ar}`,subtitle:"تقرير تفصيلي — تحليل كل حقل، التغطية حسب المحافظة، التوقيت، الإرساليات",color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:()=>e.handleFormAnalysisReport(v.id),loading:e.exportingReport==="form-analysis-"+v.id,badge:"تحليل نموذج",format:"pdf"})}),Ye(e.userRole)&&(i.push({icon:Ve,title:"👥 تقرير أداء المشرفين",subtitle:"تقييم شامل — كل مشرف وكم أرسل، التقييم، النشاط، جودة البيانات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleSupervisorReport,loading:e.exportingReport==="supervisor-report",badge:"مشرفين",format:"pdf"}),i.push({icon:It,title:"🎯 تقرير الفجوة التغطية",subtitle:"أين البيانات ناقصة — محافظات ومديريات بدون تغطية",color:"text-white",gradient:"bg-gradient-to-r from-red-600 to-rose-700",onClick:e.handleCoverageGapReport,loading:e.exportingReport==="coverage-gap",badge:"فجوة",format:"pdf"}),i.push({icon:_a,title:"⚖️ تقرير مقارنة الحملات",subtitle:"شلل أطفال vs الإيصالي التكاملي — مقارنة شاملة",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleCampaignComparisonReport,loading:e.exportingReport==="campaign-comparison",badge:"مقارنة",format:"pdf"})),i.push({icon:Ea,title:"📅 تقرير النشاط اليومي",subtitle:"نشاط اليوم — إرساليات، دخول، مقارنة بأمس",color:"text-white",gradient:"bg-gradient-to-r from-cyan-600 to-teal-700",onClick:e.handleDailyActivityReport,loading:e.exportingReport==="daily-activity",badge:"يومي",format:"pdf"}),Ye(e.userRole)&&i.push({icon:Tt,title:"✨ تقرير جودة البيانات",subtitle:"تحليل اكتمال البيانات — GPS، صور، حقول فارغة",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-orange-600",onClick:e.handleDataQualityReport,loading:e.exportingReport==="data-quality",badge:"جودة",format:"pdf"}),i.push({icon:oa,title:"📦 تقرير النواقص التفصيلي",subtitle:"تحليل شامل — حرج/عالي/متوسط، حسب المحافظة والفئة",color:"text-white",gradient:"bg-gradient-to-r from-red-500 to-pink-600",onClick:e.handleShortagesDetailedReport,loading:e.exportingReport==="shortages-detailed",badge:"نواقص",format:"pdf"}),i.push({icon:Ct,title:"📊 التقرير الأسبوعي",subtitle:"ملخص الأسبوع — مقارنة بالسابق، نشاط يومي، أداء المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-green-700",onClick:e.handleWeeklyReport,loading:e.exportingReport==="weekly-report",badge:"أسبوعي",format:"pdf"}),Ye(e.userRole)&&i.push({icon:Ve,title:"🔐 تقرير نشاط المستخدمين",subtitle:"دخول، نشاط، مستخدمين خاملين — من دخل ومتى",color:"text-white",gradient:"bg-gradient-to-r from-slate-600 to-gray-700",onClick:e.handleUserActivityReport,loading:e.exportingReport==="user-activity",badge:"نشاط",format:"pdf"}),i.push({icon:It,title:"⚠️ PDF — التحديات والصعوبات",subtitle:"تقرير شامل — فجوات التغطية، النواقص، المشرفين غير النشطين، جودة البيانات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-orange-700",onClick:e.handleChallengesReport,loading:e.exportingReport==="challenges",badge:"تحديات",format:"pdf"}),i.push({icon:Js,title:"📋 PDF — استمارة الإشراف",subtitle:"النشاط الإيصالي التكاملي — 8 أقسام إشرافية، 33 مؤشر، تحليل تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-teal-600 to-cyan-700",onClick:e.handleSupervisionFormReport,loading:e.exportingReport==="supervision-form",badge:"إشراف",format:"pdf"}),i.push({icon:nt,title:"📝 PDF — تحديات الإشراف الميداني",subtitle:"آخر 3 حقول: التحديات والصعوبات، الإجراءات المتخذة، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleSupervisionChallengesReport,loading:e.exportingReport==="supervision-challenges",badge:"ميداني",format:"pdf"}),i.push({icon:Ve,title:"📋 تقييم أداء المشرفين اليومي",subtitle:"اليومي — المركزي + المحافظات + المديريات | الاسم، الصفة، عدد الاستمارات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-teal-700",onClick:e.handleDailySupervisorEvaluation,loading:e.exportingReport==="daily-supervisor-eval",badge:"يومي",format:"pdf"}),i.push({icon:Ve,title:"📊 تقييم أداء المشرفين الشامل",subtitle:"جميع الاستمارات — بدون فلتر تاريخ | إجمالي النشاط، المديريات، المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-indigo-700",onClick:e.handleComprehensiveSupervisorEvaluation,loading:e.exportingReport==="comprehensive-supervisor-eval",badge:"شامل",format:"pdf"}),i.push({icon:Tt,title:"🏆 التقرير الشامل المدمج للمشرفين",subtitle:"تقرير واحد يدمج: تقييم الأداء + تحليل نعم/لا + تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-red-600",onClick:e.handleMasterSupervisorReport,loading:e.exportingReport==="master-supervisor-report",badge:"🏆 مدمج",format:"pdf"}),i.push({icon:na,title:"🏛️ تقييم إشراف عام",subtitle:"المشرفين العامين فقط — مدير عام مكتب الصحة، تقييم الأداء، ترتيب، نسب النشاط",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleGeneralSupervisorsEvaluation,loading:e.exportingReport==="general-supervisors-eval",badge:"إشراف عام",format:"pdf"}),i.push({icon:Tt,title:"📊 تحليل حقول نعم/لا",subtitle:"استمارة الاشراف — تحليل شامل لكل حقل نعم/لا حسب القسم والمحافظة",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleYesNoAnalysis,loading:e.exportingReport==="yesno-analysis",badge:"تحليل",format:"pdf"}),i.push({icon:_t,title:"🗺️ خريطة مواقع المشرفين",subtitle:"خريطة اليمن + خريطة كل محافظة — مواقع GPS للمشرفين",color:"text-white",gradient:"bg-gradient-to-r from-teal-500 to-cyan-600",onClick:e.handleMapReport,loading:!1,badge:"خريطة",format:"pdf"}),Ye(e.userRole)&&i.push({icon:Rt,title:"📊 PPTX — التقرير الشهري",subtitle:"عرض PowerPoint احترافي — KPIs، مقارنة الحملات، تغطية المحافظات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-orange-500 to-amber-600",onClick:()=>e.exportReport("pptx-monthly",async()=>{await Ho()}),loading:e.exportingReport==="pptx-monthly",badge:"شهري",format:"pptx"}),i.push({icon:Ct,title:"📅 PPTX — النشرة الأسبوعية",subtitle:"عرض PowerPoint — ملخص الأسبوع، النشاط اليومي، ترتيب المحافظات، التنبيهات",color:"text-white",gradient:"bg-gradient-to-r from-orange-600 to-red-500",onClick:()=>e.exportReport("pptx-weekly",async()=>{await Ko()}),loading:e.exportingReport==="pptx-weekly",badge:"أسبوعي",format:"pptx"}),i.push({icon:_a,title:"💉 PPTX — أداء الحملات",subtitle:"عرض PowerPoint — شلل أطفال vs الإيصالي، معدل التسريب، التغطية، تأثير النواقص",color:"text-white",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:()=>e.exportReport("pptx-campaign",async()=>{await Vo()}),loading:e.exportingReport==="pptx-campaign",badge:"حملات",format:"pptx"}),i.push({icon:Tt,title:"🏆 PPTX — التقرير الشامل المدمج",subtitle:"عرض PowerPoint احترافي — تقييم الأداء + تحليل نعم/لا + التحديات | 8 شرائح",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-red-600",onClick:()=>e.exportReport("pptx-master",async()=>{await Xo()}),loading:e.exportingReport==="pptx-master",badge:"🏆 مدمج",format:"pptx"}),i.map(v=>({...v,favorite:C.has(v.title),onToggleFavorite:()=>u(v.title)}))},[e.userRole,e.stats,e.govStats,e.chartData,e.roleDistribution,e.exportingReport,e.dateFrom,e.dateTo,e.selectedGovFilter,e.campaign,e.governorates,e.forms,C,u]),F=ce.useMemo(()=>{let i=R;if(e.reportFormat==="favorites"?i=i.filter(p=>p.favorite):e.reportFormat!=="all"&&(i=i.filter(p=>p.format===e.reportFormat)),e.reportSearch.trim()){const p=e.reportSearch.trim().toLowerCase();i=i.filter(v=>v.title.toLowerCase().includes(p)||v.subtitle.toLowerCase().includes(p)||v.badge&&v.badge.toLowerCase().includes(p))}return i},[R,e.reportSearch,e.reportFormat]),N=ce.useMemo(()=>{const i={all:R.length,pdf:0,excel:0,pptx:0,favorites:0};return R.forEach(p=>{p.format==="pdf"?i.pdf++:p.format==="excel"?i.excel++:p.format==="pptx"&&i.pptx++,p.favorite&&i.favorites++}),i},[R]);return s.jsxs("div",{className:"page-enter",children:[s.jsx(ar,{title:"التقارير والبيانات",subtitle:e.isFiltered?`تحليلات وتصدير — ${e.labelAr}`:"تحليلات ذكية وتصدير احترافي للبيانات",onRefresh:()=>{e.refetchStats(),e.refetchForms()}}),s.jsxs("div",{className:"p-6 space-y-6",children:[s.jsx(Be,{className:"border-0 shadow-md",children:s.jsx(qe,{className:"p-4",children:s.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[s.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium",children:[s.jsx(Ja,{className:"w-4 h-4 text-muted-foreground"}),"فلاتر"]}),s.jsxs("div",{className:"flex items-center gap-1.5",children:[s.jsx(Qa,{className:"w-3.5 h-3.5 text-muted-foreground"}),s.jsx(pt,{type:"date",value:e.dateFrom,onChange:i=>e.setDateFrom(i.target.value),className:"w-[140px] h-9 text-xs"}),s.jsx("span",{className:"text-xs text-muted-foreground",children:"—"}),s.jsx(pt,{type:"date",value:e.dateTo,onChange:i=>e.setDateTo(i.target.value),className:"w-[140px] h-9 text-xs"})]}),zt(e.userRole)&&s.jsxs(va,{value:e.selectedGovFilter,onValueChange:e.setSelectedGovFilter,children:[s.jsxs(ba,{className:"w-[160px] h-9",children:[s.jsx(_t,{className:"w-3.5 h-3.5 ml-2 text-muted-foreground"}),s.jsx(xa,{placeholder:"المحافظة"})]}),s.jsxs(ya,{children:[s.jsx(At,{value:"all",children:"كل المحافظات"}),(e.governorates||[]).map(i=>s.jsx(At,{value:i.id,children:i.name_ar},i.id))]})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(Sr,{className:"w-3.5 h-3.5 text-muted-foreground"}),s.jsx("div",{className:"flex items-center gap-1.5",children:sa.map(i=>s.jsx("button",{onClick:()=>D(i.id),title:i.nameAr,className:$e("w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110",T.id===i.id?"border-foreground shadow-md scale-110":"border-transparent hover:border-muted-foreground/30"),style:{backgroundColor:`#${i.primary}`}},i.id))}),s.jsx("span",{className:"text-[10px] text-muted-foreground font-medium",children:T.nameAr})]}),(e.dateFrom||e.dateTo||e.selectedGovFilter!=="all")&&s.jsxs(We,{variant:"ghost",size:"sm",onClick:()=>{e.setDateFrom(""),e.setDateTo(""),e.setSelectedGovFilter("all")},className:"h-9 gap-1 text-muted-foreground",children:[s.jsx(fa,{className:"w-3 h-3"})," مسح"]})]})})}),s.jsx(nr,{title:"التقارير",children:s.jsxs(er,{value:e.activeTab,onValueChange:e.setActiveTab,children:[s.jsxs(tr,{className:"w-full justify-start gap-1 bg-transparent p-0 h-auto",children:[s.jsxs(Bt,{value:"analytics",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(Tt,{className:"w-4 h-4"})," التحليلات"]}),s.jsxs(Bt,{value:"quick-reports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(Ca,{className:"w-4 h-4"})," التقارير السريعة"]}),s.jsxs(Bt,{value:"form-exports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(St,{className:"w-4 h-4"})," تصدير النماذج",s.jsx(st,{variant:"secondary",className:"text-[10px] px-1.5",children:e.forms.length})]}),s.jsxs(Bt,{value:"comparison",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(wa,{className:"w-4 h-4"})," مقارنة الفترات"]})]}),s.jsx(Za,{className:"my-4"}),s.jsxs(qt,{value:"analytics",className:"mt-0 space-y-6",children:[s.jsx(qr,{filter:e.analyticsFilter,onChange:e.setAnalyticsFilter,onRefresh:()=>{e.refetchStats(),e.refetchForms()},refreshing:e.statsLoading}),s.jsx("div",{className:"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4",children:e.statsLoading?Array.from({length:6}).map((i,p)=>s.jsx(dt,{className:"h-28 rounded-xl"},p)):e.stats&&[{icon:Ve,label:"المستخدمون",value:e.stats.total_users,sub:`${e.stats.active_users} نشط`,color:"text-blue-600",bg:"bg-blue-50"},{icon:ra,label:"إرساليات اليوم",value:e.stats.submissions_today,sub:`من ${tt(e.stats.total_submissions)} إجمالي`,color:"text-emerald-600",bg:"bg-emerald-50",trend:e.stats.submissions_trend},{icon:nt,label:"المسودات",value:e.stats.draft_submissions,sub:"قيد الإعداد",color:"text-amber-600",bg:"bg-amber-50"},{icon:$a,label:"معدل الاعتماد",value:`${e.stats.approval_rate.toFixed(1)}%`,sub:"نسبة الإرسال",color:"text-purple-600",bg:"bg-purple-50"},{icon:nt,label:"النماذج النشطة",value:e.stats.active_forms,sub:`من ${e.stats.total_forms}`,color:"text-cyan-600",bg:"bg-cyan-50"},{icon:Ea,label:"إرساليات الأسبوع",value:e.stats.submissions_this_week,sub:"آخر 7 أيام",color:"text-rose-600",bg:"bg-rose-50"}].map((i,p)=>{const v=i.icon;return s.jsxs(Be,{className:"border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group",children:[s.jsx("div",{className:$e("absolute top-0 left-0 right-0 h-1",i.color.replace("text-","bg-"))}),s.jsxs(qe,{className:"p-4",children:[s.jsxs("div",{className:"flex items-start justify-between mb-3",children:[s.jsx("div",{className:$e("p-2 rounded-xl",i.bg),children:s.jsx(v,{className:$e("w-5 h-5",i.color)})}),i.trend!==void 0&&s.jsxs("span",{className:$e("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",i.trend>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[i.trend>=0?s.jsx(Fa,{className:"w-2.5 h-2.5"}):s.jsx(ea,{className:"w-2.5 h-2.5"}),Math.abs(i.trend),"%"]})]}),s.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:tt(i.value)}),s.jsx("p",{className:"text-xs font-medium mt-0.5",children:i.label}),s.jsx("p",{className:"text-[10px] text-muted-foreground",children:i.sub})]})]},p)})}),s.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[s.jsxs(Be,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[s.jsxs(gt,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(ut,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Ct,{className:"w-5 h-5 text-primary"}),"حركة الإرساليات"]}),s.jsx(la,{className:"text-xs",children:"آخر 30 يوم"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportTimeline,children:[s.jsx(mt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),s.jsx(qe,{className:"pt-0",children:e.chartLoading?s.jsx(dt,{className:"w-full h-[280px]"}):s.jsx(Ut,{width:"100%",height:280,children:s.jsxs(kr,{data:e.chartData||[],children:[s.jsxs("defs",{children:[s.jsxs("linearGradient",{id:"gSubmitted",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#10b981",stopOpacity:.3}),s.jsx("stop",{offset:"95%",stopColor:"#10b981",stopOpacity:0})]}),s.jsxs("linearGradient",{id:"gDraft",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#f59e0b",stopOpacity:.3}),s.jsx("stop",{offset:"95%",stopColor:"#f59e0b",stopOpacity:0})]})]}),s.jsx(Pa,{strokeDasharray:"3 3",stroke:"#e5e7eb"}),s.jsx(Ia,{dataKey:"date",tick:{fontSize:10,fill:"#6b7280"},tickFormatter:i=>i.slice(5),stroke:"#d1d5db"}),s.jsx(Aa,{tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),s.jsx(Yt,{content:s.jsx(Wt,{})}),s.jsx(Fr,{formatter:i=>s.jsx("span",{className:"text-xs",children:i})}),s.jsx(La,{type:"monotone",dataKey:"submitted",name:"مرسلة",stroke:"#10b981",fill:"url(#gSubmitted)",strokeWidth:2.5,dot:!1}),s.jsx(La,{type:"monotone",dataKey:"draft",name:"مسودة",stroke:"#f59e0b",fill:"url(#gDraft)",strokeWidth:2.5,dot:!1})]})})})]}),s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsx(gt,{className:"pb-2",children:s.jsxs(ut,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Ma,{className:"w-5 h-5 text-primary"}),"توزيع الحالات"]})}),s.jsx(qe,{children:e.statsLoading?s.jsx(dt,{className:"w-full h-[260px]"}):s.jsxs(s.Fragment,{children:[s.jsx(Ut,{width:"100%",height:180,children:s.jsxs(Ga,{children:[s.jsx(Oa,{data:e.statusPieData,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.statusPieData.map((i,p)=>s.jsx(ia,{fill:i.color},p))}),s.jsx(Yt,{content:s.jsx(Wt,{})})]})}),s.jsx("div",{className:"space-y-2 mt-2",children:e.statusPieData.map((i,p)=>s.jsxs("div",{className:"flex items-center justify-between text-sm",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:i.color}}),s.jsx("span",{className:"text-muted-foreground text-xs",children:i.name})]}),s.jsx("span",{className:"font-bold tabular-nums text-xs",children:tt(i.value)})]},p))})]})})]})]}),s.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[s.jsxs(Be,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[s.jsxs(gt,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(ut,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Rt,{className:"w-5 h-5 text-primary"}),"الإرساليات حسب المحافظة"]}),s.jsx(la,{className:"text-xs",children:"أعلى 10 محافظات"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportGovernorates,children:[s.jsx(mt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),s.jsx(qe,{className:"pt-0",children:e.govLoading?s.jsx(dt,{className:"w-full h-[280px]"}):s.jsx(Ut,{width:"100%",height:280,children:s.jsxs(Rr,{data:e.govChartData,layout:"vertical",children:[s.jsx(Pa,{strokeDasharray:"3 3",stroke:"#e5e7eb",horizontal:!1}),s.jsx(Ia,{type:"number",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),s.jsx(Aa,{dataKey:"name",type:"category",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db",width:70}),s.jsx(Yt,{content:s.jsx(Wt,{})}),s.jsx(Dr,{dataKey:"الإرساليات",radius:[0,8,8,0],children:e.govChartData.map((i,p)=>s.jsx(ia,{fill:$t[p%$t.length]},p))})]})})})]}),s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsx(gt,{className:"pb-2",children:s.jsxs(ut,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Ve,{className:"w-5 h-5 text-primary"}),"توزيع الأدوار"]})}),s.jsx(qe,{children:e.roleDistribution?s.jsxs(s.Fragment,{children:[s.jsx(Ut,{width:"100%",height:180,children:s.jsxs(Ga,{children:[s.jsx(Oa,{data:e.roleDistribution,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.roleDistribution.map((i,p)=>s.jsx(ia,{fill:$t[p%$t.length]},p))}),s.jsx(Yt,{content:s.jsx(Wt,{})})]})}),s.jsx("div",{className:"space-y-2 mt-2",children:e.roleDistribution.map((i,p)=>s.jsxs("div",{className:"flex items-center justify-between text-sm",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:$t[p%$t.length]}}),s.jsx("span",{className:"text-muted-foreground text-xs",children:i.name})]}),s.jsx("span",{className:"font-bold tabular-nums text-xs",children:i.value})]},p))})]}):s.jsx(dt,{className:"w-full h-[260px]"})})]})]}),((M=e.auditData)==null?void 0:M.data)&&e.auditData.data.length>0&&s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsxs(gt,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(ut,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Tr,{className:"w-5 h-5 text-primary"}),"آخر النشاطات"]}),s.jsx(la,{className:"text-xs",children:"آخر العمليات المسجلة في النظام"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportAudit,children:[s.jsx(mt,{className:"w-3.5 h-3.5"})," تصدير السجل"]})]}),s.jsx(qe,{className:"pt-0",children:s.jsx("div",{className:"space-y-0",children:(x=(j=e.auditData)==null?void 0:j.data)==null?void 0:x.slice(0,8).map((i,p)=>{var d,h,b;const v={create:{icon:$a,color:"text-emerald-600 bg-emerald-50"},update:{icon:Ct,color:"text-blue-600 bg-blue-50"},delete:{icon:It,color:"text-red-600 bg-red-50"},login:{icon:Ve,color:"text-purple-600 bg-purple-50"}},o={create:"إنشاء",update:"تعديل",delete:"حذف",login:"دخول",logout:"خروج"},$={profiles:"المستخدمين",form_submissions:"الإرساليات",forms:"النماذج",supply_shortages:"النواقص",notifications:"الإشعارات"},y=v[i.action]||{icon:jr,color:"text-muted-foreground bg-muted"},a=y.icon,l=Date.now()-new Date(i.created_at).getTime();let f;return l<6e4?f="الآن":l<36e5?f=`منذ ${Math.floor(l/6e4)} د`:l<864e5?f=`منذ ${Math.floor(l/36e5)} س`:f=`منذ ${Math.floor(l/864e5)} يوم`,s.jsxs("div",{className:$e("flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors",p<(((h=(d=e.auditData)==null?void 0:d.data)==null?void 0:h.length)??0)-1&&"border-b"),children:[s.jsx("div",{className:$e("p-2 rounded-lg",y.color),children:s.jsx(a,{className:"w-4 h-4"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsxs("p",{className:"text-sm font-medium truncate",children:[((b=i.profiles)==null?void 0:b.full_name)||"النظام"," — ",o[i.action]||i.action]}),s.jsxs("p",{className:"text-xs text-muted-foreground",children:[$[i.table_name]||i.table_name,i.ip_address&&` • ${i.ip_address}`]})]}),s.jsx("span",{className:"text-[11px] text-muted-foreground shrink-0",children:f})]},i.id)})})})]})]}),s.jsxs(qt,{value:"quick-reports",className:"mt-0 space-y-6",children:[s.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-3",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(Ca,{className:"w-5 h-5 text-amber-500"}),"التقارير السريعة"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"اختر التصنيف أو ابحث عن تقرير"})]}),s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsxs("div",{className:"relative w-64",children:[s.jsx(Qs,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),s.jsx(pt,{placeholder:"بحث في التقارير...",value:e.reportSearch,onChange:i=>e.setReportSearch(i.target.value),className:"pr-10 h-9 text-sm"}),e.reportSearch&&s.jsx("button",{onClick:()=>e.setReportSearch(""),className:"absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",children:s.jsx(es,{className:"w-3.5 h-3.5"})})]}),S&&s.jsxs(st,{variant:"secondary",className:"text-xs gap-1",children:[s.jsx(fa,{className:"w-3 h-3"})," ",S]}),s.jsxs(st,{variant:"outline",className:"text-xs",children:[F.length," تقرير"]})]})]}),s.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:[{key:"all",label:"الكل",icon:ra,color:"bg-primary text-primary-foreground"},{key:"favorites",label:"المفضلة",icon:as,color:"bg-amber-500 text-white"},{key:"excel",label:"Excel / CSV",icon:St,color:"bg-emerald-600 text-white"},{key:"pdf",label:"PDF",icon:nt,color:"bg-red-600 text-white"},{key:"pptx",label:"PowerPoint",icon:Rt,color:"bg-orange-600 text-white"}].map(i=>{const p=i.icon,v=e.reportFormat===i.key,o=N[i.key];return s.jsxs("button",{onClick:()=>e.setReportFormat(i.key),className:$e("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",v?`${i.color} shadow-md scale-105`:"bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"),children:[s.jsx(p,{className:"w-4 h-4"}),s.jsx("span",{children:i.label}),s.jsx("span",{className:$e("text-[10px] font-bold px-1.5 py-0.5 rounded-full",v?"bg-white/20":"bg-muted"),children:o})]},i.key)})}),F.length===0?s.jsxs("div",{className:"text-center py-16",children:[s.jsx(na,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),s.jsx("h3",{className:"text-lg font-medium",children:e.reportSearch?"لا توجد نتائج للبحث":"لا توجد تقارير متاحة"}),s.jsx("p",{className:"text-sm text-muted-foreground",children:e.reportSearch?"جرّب كلمة مختلفة":"تواصل مع مدير النظام للحصول على صلاحيات"})]}):s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5",children:F.map((i,p)=>s.jsx(Cr,{...i},p))})]}),s.jsxs(qt,{value:"form-exports",className:"mt-0 space-y-4",children:[s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(St,{className:"w-5 h-5 text-emerald-500"}),"تصدير النماذج"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"تصدير إرساليات كل نموذج بشكل منفصل"})]}),s.jsxs("div",{className:"relative w-64",children:[s.jsx(nt,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),s.jsx(pt,{placeholder:"بحث...",value:e.formSearch,onChange:i=>e.setFormSearch(i.target.value),className:"pr-10 h-9 text-sm"})]})]}),e.formsLoading?s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:Array.from({length:6}).map((i,p)=>s.jsx(dt,{className:"h-56 rounded-xl"},p))}):e.filteredForms.length===0?s.jsxs("div",{className:"text-center py-16",children:[s.jsx(St,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),s.jsx("h3",{className:"text-lg font-medium",children:e.formSearch?"لا توجد نتائج":"لا توجد نماذج"})]}):s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:e.filteredForms.map(i=>{var p;return s.jsx(Nr,{form:i,submissionCount:(p=e.submissionCounts)==null?void 0:p[i.id],onExport:e.handleExportForm,exporting:e.exportingFormId===i.id},i.id)})})]}),s.jsxs(qt,{value:"comparison",className:"mt-0 space-y-4",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(wa,{className:"w-5 h-5 text-primary"}),"مقارنة الفترات"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"قارن أداء الفترة الحالية بالسابقة"})]}),s.jsx(Br,{})]})]})})]}),e.exportProgress.isActive&&s.jsx("div",{className:"fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto",children:s.jsx(Mr,{status:e.exportProgress.status,message:e.exportProgress.message,progress:e.exportProgress.progress,total:e.exportProgress.total})}),s.jsx(rs,{...e.previewProps}),s.jsx(Ur,{open:e.drillDownOpen,onClose:()=>e.setDrillDownOpen(!1),data:e.drillDownData}),s.jsx(Wr,{open:!!e.fullscreenChart,onClose:()=>e.setFullscreenChart(null),title:e.fullscreenChart||"",children:s.jsx("div",{className:"h-full flex items-center justify-center text-muted-foreground",children:s.jsx("p",{className:"text-sm",children:"اضغط ESC للإغلاق"})})})]})}export{Pn as default};
