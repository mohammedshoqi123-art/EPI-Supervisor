import{j as a}from"./data-vendor-CInkegrm.js";import{a as le,k as Ls}from"./react-vendor-CSqLrF-f.js";import{c as Sa,C as Oe,a as _e,i as Be,e as tt,L as Pt,af as $t,g as Ye,n as Gs,I as K,Q as Ha,u as Vt,p as St,T as Nt,b as it,d as dt,ac as Va,q as Xa,N as ct,a3 as Ja,v as xt,X as Qa,R as ha,a4 as Os,aT as Bs,aU as Za,aV as t,J as Us,aW as ja,aX as qs,aY as Ys,aZ as aa,a_ as Ws,s as Ze,U as He,x as sa,P as ra,a$ as Ks,t as rt,f as oa,o as Ta,h as Ft,F as Hs,Z as Ea,a6 as na,K as Vs,an as Xs}from"./index-BotCtI5u.js";import{S as lt}from"./skeleton-CZHjqq9l.js";import{S as fa,a as va,b as ba,c as xa,d as Mt}from"./select-CMWTdWQg.js";import{T as Js,a as Qs,b as At,c as Lt}from"./tabs-B66Hqi-i.js";import{H as Zs}from"./header-BwdLCnXW.js";import{P as er}from"./progress-DrKqPQnW.js";import{S as es}from"./star-DkytVHgi.js";import{T as ka}from"./trending-up-DY64eGgP.js";import{T as Xt}from"./trending-down-DuuPVNTR.js";import{A as tr}from"./arrow-up-right-n2SsPXEd.js";import{u as ts,R as as}from"./ReportPreview-DlsDUOkm.js";import{C as ya}from"./circle-check-DzQ_FpUm.js";import{C as ar}from"./circle-x-Dbne1WQT.js";import{F as gt}from"./file-down-D2vf8dbr.js";import{S as sr}from"./section-error-boundary-EdEYMFpK.js";import{T as $a}from"./target-DjAWgpCl.js";import{A as rr}from"./award-DLA7Afe2.js";import{D as ss,a as rs,b as os,c as ns,d as or}from"./dialog-Cpl8Xq_P.js";import{T as nr,a as lr,b as Ca,c as ir,d as dr,e as cr}from"./table-BVkAkDOO.js";import{u as ls}from"./governorates-Dg8yT2pd.js";import{u as gr,b as ur,a as pr,d as mr}from"./dashboard-BXw13vdk.js";import{u as hr,d as fr}from"./forms-BCSWSN2k.js";import{u as vr}from"./audit-DzZ1H6cZ.js";import{u as ft,w as br,P as Jt}from"./export-vendor-CeQm8jP5.js";import{E as Qt,g as Rt}from"./enhanced-pdf-7HvvZCQc.js";import{g as xr}from"./campaign-CI7-dOVa.js";import{G as yr}from"./gauge-CoWp2fF1.js";import{A as Dt}from"./activity-CL8V2BXO.js";import{C as Na}from"./chart-pie-DplUewyd.js";import{B as $r}from"./building-2-CBi963pw.js";import{P as _r}from"./palette-hZpBCqR5.js";import{R as Gt,A as wr,C as Ma,X as za,Y as Pa,T as Ot,L as Sr,a as Ia,i as Aa,j as La,h as la,B as kr,b as Fr}from"./chart-vendor-aV12ZcRF.js";import{I as Rr}from"./info-DOjT9_qX.js";import"./ui-vendor-SYVzqSV-.js";import"./chevron-down-DfPdDxv_.js";import"./external-link-Ct6a35wV.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _a=Sa("ArrowLeftRight",[["path",{d:"M8 3 4 7l4 4",key:"9rb6wj"}],["path",{d:"M4 7h16",key:"6tx8e3"}],["path",{d:"m16 21 4-4-4-4",key:"siv7j2"}],["path",{d:"M20 17H4",key:"h6l3hr"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dr=Sa("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jr=Sa("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);function Bt({active:e,payload:s,label:i}){return!e||!(s!=null&&s.length)?null:a.jsxs("div",{className:"bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[140px]",children:[a.jsx("p",{className:"text-xs font-medium text-muted-foreground mb-2",children:i}),s.map((l,u)=>a.jsxs("div",{className:"flex items-center justify-between gap-4 text-sm",children:[a.jsxs("div",{className:"flex items-center gap-1.5",children:[a.jsx("div",{className:"w-2.5 h-2.5 rounded-full",style:{backgroundColor:l.color}}),a.jsx("span",{className:"text-muted-foreground",children:l.name})]}),a.jsx("span",{className:"font-bold tabular-nums",children:l.value})]},u))]})}const Ut={pdf:{label:"PDF",color:"text-red-700",bg:"bg-red-50 border-red-200"},excel:{label:"Excel",color:"text-emerald-700",bg:"bg-emerald-50 border-emerald-200"},pptx:{label:"PPTX",color:"text-orange-700",bg:"bg-orange-50 border-orange-200"}};function Tr({icon:e,title:s,subtitle:i,value:l,trend:u,color:b,gradient:N,onClick:_,loading:m,badge:F,format:M,favorite:S,onToggleFavorite:y}){return a.jsxs(Oe,{className:"group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden",onClick:_,children:[a.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",N)}),a.jsx("div",{className:_e("absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500",b.replace("text-","bg-"))}),y&&a.jsx("button",{onClick:k=>{k.stopPropagation(),y()},className:"absolute top-3 left-3 z-10 p-1 rounded-full transition-all hover:scale-125",title:S?"إزالة من المفضلة":"إضافة للمفضلة",children:a.jsx(es,{className:_e("w-4 h-4 transition-colors",S?"fill-amber-400 text-amber-400":"text-muted-foreground/30 hover:text-amber-400")})}),a.jsxs(Be,{className:"p-5 relative",children:[a.jsxs("div",{className:"flex items-start justify-between mb-4",children:[a.jsx("div",{className:_e("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",b.replace("text-","bg-").replace("600","50")),children:a.jsx(e,{className:_e("w-6 h-6",b)})}),a.jsxs("div",{className:"flex items-center gap-2",children:[M&&Ut[M]&&a.jsx("span",{className:_e("text-[9px] font-bold px-1.5 py-0.5 rounded border",Ut[M].color,Ut[M].bg),children:Ut[M].label}),F&&a.jsx(tt,{variant:"secondary",className:"text-[10px] px-2",children:F}),u!==void 0&&a.jsxs("span",{className:_e("flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",u>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[u>=0?a.jsx(ka,{className:"w-3 h-3"}):a.jsx(Xt,{className:"w-3 h-3"}),Math.abs(u),"%"]})]})]}),l&&a.jsx("p",{className:"text-3xl font-heading font-bold mb-1 tabular-nums",children:l}),a.jsx("h3",{className:"font-bold font-heading text-sm mb-0.5",children:s}),a.jsx("p",{className:"text-xs text-muted-foreground",children:i}),a.jsxs("div",{className:"flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity",children:[a.jsx("span",{children:"تصدير التقرير"}),a.jsx(tr,{className:"w-3.5 h-3.5"})]})]}),m&&a.jsx("div",{className:"absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10",children:a.jsx(Pt,{className:"w-6 h-6 animate-spin text-primary"})})]})}function Er({form:e,submissionCount:s,onExport:i,exporting:l}){const u=(s==null?void 0:s.total)||0,b=(s==null?void 0:s.submitted)||0,N=(s==null?void 0:s.draft)||0,_=u>0?Math.round(b/u*100):0;return a.jsxs(Oe,{className:_e("group hover:shadow-lg transition-all duration-200 relative overflow-hidden",!e.is_active&&"opacity-50"),children:[a.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",e.is_active?"bg-emerald-500":"bg-gray-400")}),a.jsxs(Be,{className:"p-4 pt-5",children:[a.jsxs("div",{className:"flex items-start gap-3 mb-3",children:[a.jsx("div",{className:"p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100",children:a.jsx($t,{className:"w-5 h-5 text-emerald-600"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsx("h3",{className:"font-bold text-sm truncate",children:e.title_ar}),a.jsx("p",{className:"text-xs text-muted-foreground truncate",children:e.title_en})]}),e.campaign_type&&a.jsx(tt,{variant:"outline",className:_e("text-[10px] shrink-0",e.campaign_type==="polio_campaign"?"text-blue-600 border-blue-200":"text-emerald-600 border-emerald-200"),children:e.campaign_type==="polio_campaign"?"💉":"🏥"})]}),a.jsxs("div",{className:"grid grid-cols-3 gap-2 mb-3",children:[a.jsxs("div",{className:"text-center p-2 rounded-lg bg-muted/50",children:[a.jsx("p",{className:"text-lg font-bold",children:u}),a.jsx("p",{className:"text-[10px] text-muted-foreground",children:"إجمالي"})]}),a.jsxs("div",{className:"text-center p-2 rounded-lg bg-emerald-50",children:[a.jsx("p",{className:"text-lg font-bold text-emerald-600",children:b}),a.jsx("p",{className:"text-[10px] text-emerald-700",children:"مرسل"})]}),a.jsxs("div",{className:"text-center p-2 rounded-lg bg-amber-50",children:[a.jsx("p",{className:"text-lg font-bold text-amber-600",children:N}),a.jsx("p",{className:"text-[10px] text-amber-700",children:"مسودة"})]})]}),a.jsxs("div",{className:"mb-3",children:[a.jsxs("div",{className:"flex justify-between text-[10px] text-muted-foreground mb-1",children:[a.jsx("span",{children:"نسبة الإرسال"}),a.jsxs("span",{children:[_,"%"]})]}),a.jsx(er,{value:_,className:"h-1.5"})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsxs(Ye,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",onClick:()=>i(e,"xlsx"),disabled:l||u===0,children:[l?a.jsx(Pt,{className:"w-3 h-3 animate-spin"}):a.jsx($t,{className:"w-3 h-3"}),"Excel"]}),a.jsxs(Ye,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",onClick:()=>i(e,"csv"),disabled:l||u===0,children:[l?a.jsx(Pt,{className:"w-3 h-3 animate-spin"}):a.jsx(Gs,{className:"w-3 h-3"}),"CSV"]})]})]})]})}function Cr({status:e,message:s,progress:i,total:l,className:u}){if(e==="idle")return null;const b=l&&i?Math.round(i/l*100):null;return a.jsxs("div",{className:_e("flex items-center gap-3 p-3 rounded-xl border transition-all",e==="error"?"bg-red-50 border-red-200":e==="done"?"bg-emerald-50 border-emerald-200":"bg-blue-50 border-blue-200",u),children:[a.jsx("div",{className:_e("p-2 rounded-lg shrink-0",e==="error"?"bg-red-100":e==="done"?"bg-emerald-100":"bg-blue-100"),children:e==="fetching"||e==="generating"?a.jsx(Pt,{className:"w-4 h-4 text-blue-600 animate-spin"}):e==="done"?a.jsx(ya,{className:"w-4 h-4 text-emerald-600"}):e==="error"?a.jsx(ar,{className:"w-4 h-4 text-red-600"}):a.jsx(gt,{className:"w-4 h-4 text-blue-600"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("span",{className:"text-xs font-medium",children:e==="fetching"?"جاري تحميل البيانات...":e==="generating"?"جاري إنشاء التقرير...":e==="done"?"تم التصدير بنجاح ✅":e==="error"?"فشل التصدير":""}),b!==null&&a.jsxs("span",{className:"text-[10px] font-mono tabular-nums text-muted-foreground",children:[b,"%"]})]}),s&&a.jsx("p",{className:"text-[10px] text-muted-foreground mt-0.5 truncate",children:s}),b!==null&&a.jsx("div",{className:"mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden",children:a.jsx("div",{className:_e("h-full rounded-full transition-all duration-300",e==="error"?"bg-red-500":"bg-blue-500"),style:{width:`${Math.min(b,100)}%`}})}),i!==void 0&&l!==void 0&&a.jsxs("p",{className:"text-[9px] text-muted-foreground/70 mt-1",children:[i.toLocaleString("ar-SA")," / ",l.toLocaleString("ar-SA")," سجل"]})]})]})}function Nr(){const[e,s]=le.useState("idle"),[i,l]=le.useState(),[u,b]=le.useState(),[N,_]=le.useState(),m=le.useCallback(C=>{s("fetching"),l("جاري تحميل البيانات من قاعدة البيانات..."),b(0),_(C)},[]),F=le.useCallback((C,R)=>{b(C),R&&_(R),l(`تم تحميل ${C.toLocaleString("ar-SA")} سجل...`)},[]),M=le.useCallback(()=>{s("generating"),l("جاري إنشاء الملف...")},[]),S=le.useCallback(C=>{s("done"),l(C||"تم التحميل بنجاح"),setTimeout(()=>{s("idle"),l(void 0),b(void 0),_(void 0)},3e3)},[]),y=le.useCallback(C=>{s("error"),l(C||"حدث خطأ أثناء التصدير"),setTimeout(()=>{s("idle"),l(void 0),b(void 0),_(void 0)},5e3)},[]),k=le.useCallback(()=>{s("idle"),l(void 0),b(void 0),_(void 0)},[]);return{status:e,message:i,progress:u,total:N,startFetch:m,updateFetchProgress:F,startGenerate:M,done:S,error:y,reset:k,isActive:e!=="idle"}}function jt(e,s){const i=e-s,l=s>0?Math.round(i/s*100):e>0?100:0;return{diff:i,pct:l,direction:i>0?"up":i<0?"down":"same"}}async function Ga(e,s,i,l){var h;let u=null;if(l&&l!=="all"){const{data:p}=await K.from("forms").select("id").eq("campaign_type",l).is("deleted_at",null);u=(p==null?void 0:p.map(r=>r.id))||null}let b=K.from("form_submissions").select("id, status, governorate_id, created_at, governorates(name_ar)").is("deleted_at",null).gte("created_at",e).lte("created_at",s);u&&u.length>0&&(b=b.in("form_id",u));const[N,_,m,F]=await Promise.allSettled([b,K.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).lte("created_at",s),K.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).eq("is_active",!0).lte("created_at",s),K.from("supply_shortages").select("id, severity",{count:"exact"}).is("deleted_at",null).gte("created_at",e).lte("created_at",s)]),M=N.status==="fulfilled"?N.value.data||[]:[],S=M.filter(p=>p.status==="submitted").length,y=M.filter(p=>p.status==="draft").length,k=new Map;for(const p of M){const r=((h=p.governorates)==null?void 0:h.name_ar)||"غير محدد";k.set(r,(k.get(r)||0)+1)}const C=Array.from(k.entries()).map(([p,r])=>({name:p,count:r})).sort((p,r)=>r.count-p.count),R=new Map;for(const p of M){const r=new Date(p.created_at).toISOString().split("T")[0];R.set(r,(R.get(r)||0)+1)}const v=Array.from(R.entries()).map(([p,r])=>({date:p,count:r})).sort((p,r)=>p.date.localeCompare(r.date)),j=F.status==="fulfilled"?F.value.data||[]:[],d=j.filter(p=>p.severity==="critical").length;return{label:i,dateFrom:e,dateTo:s,submissions:M.length,submitted:S,draft:y,users:_.status==="fulfilled"&&_.value.count||0,activeUsers:m.status==="fulfilled"&&m.value.count||0,shortages:j.length,criticalShortages:d,byGovernorate:C,byDay:v}}async function Mr(e,s,i,l,u){const[b,N]=await Promise.all([Ga(e,s,"الفترة الحالية",u),Ga(i,l,"الفترة السابقة",u)]),_={submissions:jt(b.submissions,N.submissions),submitted:jt(b.submitted,N.submitted),draft:jt(b.draft,N.draft),users:jt(b.users,N.users),shortages:jt(b.shortages,N.shortages)},m=b.byGovernorate.map(S=>{const y=N.byGovernorate.find(v=>v.name===S.name),k=b.submissions>0?S.count/b.submissions*100:0,C=(y==null?void 0:y.count)||0,R=N.submissions>0?C/N.submissions*100:0;return{name:S.name,currentPct:Math.round(k),previousPct:Math.round(R),change:Math.round(k-R)}}),F=m.filter(S=>S.change>0).sort((S,y)=>y.change-S.change).slice(0,5),M=m.filter(S=>S.change<0).sort((S,y)=>S.change-y.change).slice(0,5);return{current:b,previous:N,changes:_,topImproved:F,topDeclined:M}}const Oa=[{id:"this_week_vs_last",label:"هذا الأسبوع vs الماضي",icon:"📅",getCurrent:()=>{const e=new Date,s=e.getDay(),i=new Date(e);i.setDate(e.getDate()-s),i.setHours(0,0,0,0);const l=new Date(e);l.setHours(23,59,59,999);const u=new Date(i);u.setDate(u.getDate()-7);const b=new Date(i);return b.setDate(b.getDate()-1),b.setHours(23,59,59,999),{currentFrom:i.toISOString(),currentTo:l.toISOString(),previousFrom:u.toISOString(),previousTo:b.toISOString()}}},{id:"this_month_vs_last",label:"هذا الشهر vs الماضي",icon:"📆",getCurrent:()=>{const e=new Date,s=new Date(e.getFullYear(),e.getMonth(),1),i=new Date(e.getFullYear(),e.getMonth()+1,0,23,59,59,999),l=new Date(e.getFullYear(),e.getMonth()-1,1),u=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{currentFrom:s.toISOString(),currentTo:i.toISOString(),previousFrom:l.toISOString(),previousTo:u.toISOString()}}},{id:"today_vs_yesterday",label:"اليوم vs أمس",icon:"📊",getCurrent:()=>{const e=new Date,s=new Date(e.getFullYear(),e.getMonth(),e.getDate()),i=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999),l=new Date(s);l.setDate(l.getDate()-1);const u=new Date(l);return u.setHours(23,59,59,999),{currentFrom:s.toISOString(),currentTo:i.toISOString(),previousFrom:l.toISOString(),previousTo:u.toISOString()}}}];function Xe(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}const _t=["#1565C0","#2E7D32","#F57F17","#E53935","#7B1FA2","#00838F","#E65100","#283593","#558B2F","#AD1457"];function zr(e,s){if(!e.length)return"";const i=(s==null?void 0:s.maxValue)||Math.max(...e.map(u=>u.value),1),l=(s==null?void 0:s.showValues)!==!1;return`
    <div class="pdf-chart">
      ${s!=null&&s.title?`<div class="chart-title">${Xe(s.title)}</div>`:""}
      <div class="bar-chart">
        ${e.map((u,b)=>{const N=Math.round(u.value/i*100),_=u.color||_t[b%_t.length];return`
            <div class="bar-row">
              <div class="bar-label">${Xe(u.label)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${N}%; background: ${_}"></div>
              </div>
              ${l?`<div class="bar-value">${u.value.toLocaleString("ar-SA")}</div>`:""}
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Pr(e,s){if(!e.length)return"";const i=e.reduce((_,m)=>_+m.value,0);if(i===0)return"";const l=(s==null?void 0:s.size)||160,u=(s==null?void 0:s.showLegend)!==!1;let b=[],N=0;return e.forEach((_,m)=>{const M=_.value/i*100/100*360,S=_.color||_t[m%_t.length];b.push(`${S} ${N}deg ${N+M}deg`),N+=M}),`
    <div class="pdf-chart">
      ${s!=null&&s.title?`<div class="chart-title">${Xe(s.title)}</div>`:""}
      <div class="donut-container" style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
        <div class="donut-wrapper" style="position: relative; width: ${l}px; height: ${l}px;">
          <div class="donut" style="
            width: ${l}px; height: ${l}px;
            border-radius: 50%;
            background: conic-gradient(${b.join(", ")});
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: ${l*.6}px; height: ${l*.6}px;
              border-radius: 50%; background: white;
              display: flex; align-items: center; justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 20px; font-weight: 900; color: #212121;">${i.toLocaleString("ar-SA")}</div>
              <div style="font-size: 10px; color: #757575;">إجمالي</div>
            </div>
          </div>
        </div>
        ${u?`
          <div class="donut-legend" style="flex: 1; min-width: 140px;">
            ${e.map((_,m)=>{const F=i>0?Math.round(_.value/i*100):0;return`
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 3px; background: ${_.color||_t[m%_t.length]}; flex-shrink: 0;"></div>
                  <div style="flex: 1; font-size: 12px; color: #616161;">${Xe(_.label)}</div>
                  <div style="font-size: 12px; font-weight: 700; color: #212121;">${F}%</div>
                </div>
              `}).join("")}
          </div>
        `:""}
      </div>
    </div>
  `}function Ir(e,s){if(!e.length)return"";const i=Math.max(...e.map(b=>Math.max(b.current,b.previous)),1),l=(s==null?void 0:s.currentColor)||"#1565C0",u=(s==null?void 0:s.previousColor)||"#BDBDBD";return`
    <div class="pdf-chart">
      ${s!=null&&s.title?`<div class="chart-title">${Xe(s.title)}</div>`:""}
      <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${l};"></div>
          <span>${Xe((s==null?void 0:s.currentLabel)||"الحالية")}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${u};"></div>
          <span>${Xe((s==null?void 0:s.previousLabel)||"السابقة")}</span>
        </div>
      </div>
      <div class="comparison-chart">
        ${e.map(b=>{const N=Math.round(b.current/i*100),_=Math.round(b.previous/i*100),m=b.current-b.previous,F=b.previous>0?Math.round(m/b.previous*100):0,M=m>0?"#2E7D32":m<0?"#E53935":"#757575",S=m>0?"↑":m<0?"↓":"→";return`
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 600;">${Xe(b.label)}</span>
                <span style="font-size: 11px; color: ${M}; font-weight: 700;">
                  ${S} ${F>0?"+":""}${F}%
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">حالي</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${N}%; height: 100%; background: ${l}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${b.current.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">سابق</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${_}%; height: 100%; background: ${u}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${b.previous.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Ba(e,s,i){const l=s>0?Math.min(Math.round(e/s*100),100):0,u=(i==null?void 0:i.color)||(l>=90?"#2E7D32":l>=70?"#F57F17":"#E53935"),b=(i==null?void 0:i.size)||120,N=i==null?void 0:i.target,_=(b-20)/2,m=2*Math.PI*_,F=m-l/100*m;return`
    <div class="pdf-chart" style="text-align: center;">
      ${i!=null&&i.title?`<div class="chart-title">${Xe(i.title)}</div>`:""}
      <div style="display: inline-block; position: relative; width: ${b}px; height: ${b}px;">
        <svg width="${b}" height="${b}" viewBox="0 0 ${b} ${b}">
          <!-- Background arc -->
          <circle cx="${b/2}" cy="${b/2}" r="${_}" fill="none" stroke="#E0E0E0" stroke-width="10" />
          <!-- Value arc -->
          <circle cx="${b/2}" cy="${b/2}" r="${_}" fill="none" stroke="${u}" stroke-width="10"
            stroke-dasharray="${m}" stroke-dashoffset="${F}"
            stroke-linecap="round" transform="rotate(-90 ${b/2} ${b/2})" />
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: ${u};">${l}%</div>
          ${i!=null&&i.label?`<div style="font-size: 10px; color: #757575;">${Xe(i.label)}</div>`:""}
        </div>
      </div>
      ${N?`
        <div style="font-size: 10px; color: #9E9E9E; margin-top: 8px;">
          الهدف: ${N}% | الحالي: ${l}%
        </div>
      `:""}
    </div>
  `}function Ar(){return`
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
  `}function Lr({direction:e,pct:s,diff:i}){const l=e==="up"?ka:e==="down"?Xt:jr,u=e==="up"?"text-emerald-600 bg-emerald-50":e==="down"?"text-red-600 bg-red-50":"text-gray-500 bg-gray-50";return a.jsxs("div",{className:_e("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",u),children:[a.jsx(l,{className:"w-3 h-3"}),a.jsxs("span",{children:[s>0?"+":"",s,"%"]}),a.jsxs("span",{className:"opacity-60",children:["(",i>0?"+":"",i,")"]})]})}function qt({label:e,current:s,previous:i,icon:l,color:u}){const b=s-i,N=i>0?Math.round(b/i*100):s>0?100:0,_=b>0?"up":b<0?"down":"same";return a.jsx(Oe,{className:"border-0 shadow-sm hover:shadow-md transition-all",children:a.jsxs(Be,{className:"p-4",children:[a.jsxs("div",{className:"flex items-start justify-between mb-3",children:[a.jsx("div",{className:_e("p-2 rounded-xl",u.replace("text-","bg-").replace("600","50")),children:a.jsx(l,{className:_e("w-4 h-4",u)})}),a.jsx(Lr,{direction:_,pct:N,diff:b})]}),a.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:s.toLocaleString("ar-SA")}),a.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:e}),a.jsxs("p",{className:"text-[10px] text-muted-foreground/60 mt-1",children:["السابق: ",i.toLocaleString("ar-SA")]})]})})}function Gr({onExportPDF:e,onExportExcel:s}){const{toast:i}=Ha(),{campaign:l}=Vt(),{previewProps:u,openPreview:b}=ts(),[N,_]=le.useState(!1),[m,F]=le.useState(null),[M,S]=le.useState("this_week_vs_last"),y=le.useCallback(async C=>{const R=Oa.find(v=>v.id===(C||M));if(R){_(!0);try{const v=R.getCurrent(),j=await Mr(v.currentFrom,v.currentTo,v.previousFrom,v.previousTo,l!=="all"?l:void 0);F(j)}catch(v){console.error(v),i({title:"فشل تحميل المقارنة",variant:"destructive"})}finally{_(!1)}}},[M,l,i]),k=le.useCallback(()=>{if(!m)return;const C=[{label:"الإرساليات",current:m.current.submissions,previous:m.previous.submissions},{label:"المرسلة",current:m.current.submitted,previous:m.previous.submitted},{label:"المسودات",current:m.current.draft,previous:m.previous.draft},{label:"النواقص",current:m.current.shortages,previous:m.previous.shortages}],R=m.current.byGovernorate.slice(0,10).map(h=>({label:h.name,value:h.count})),v=[{label:"مرسلة",value:m.current.submitted,color:"#2E7D32"},{label:"مسودة",value:m.current.draft,color:"#F57F17"}],d=`
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
      ${Ar()}
      <div class="section">
        <div class="section-title"><span>📊</span><span>مؤشرات الأداء — مقارنة</span></div>
        <div class="section-body">
          ${Ir(C,{title:"مقارنة الإرساليات",currentLabel:m.current.label,previousLabel:m.previous.label})}
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span>🎯</span><span>نسبة الإنجاز</span></div>
        <div class="section-body" style="display: flex; gap: 24px; flex-wrap: wrap;">
          ${Ba(m.current.submitted,m.current.submissions,{title:"الحالية",target:95,size:120})}
          ${Ba(m.previous.submitted,m.previous.submissions,{title:"السابقة",target:95,size:120,color:"#BDBDBD"})}
        </div>
      </div>
      ${R.length>0?`
        <div class="section">
          <div class="section-title"><span>🗺️</span><span>الإرساليات حسب المحافظة</span></div>
          <div class="section-body">
            ${zr(R,{title:"أعلى 10 محافظات"})}
          </div>
        </div>
      `:""}
      ${v.some(h=>h.value>0)?`
        <div class="section">
          <div class="section-title"><span>📈</span><span>توزيع الحالات</span></div>
          <div class="section-body">
            ${Pr(v,{title:"الحالية"})}
          </div>
        </div>
      `:""}
      ${m.topImproved.length>0?`
        <div class="section">
          <div class="section-title"><span>🏆</span><span>الأكثر تحسّناً</span></div>
          <div class="section-body">
            ${m.topImproved.map(h=>`
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                <span>${h.name}</span>
                <span style="color: #2E7D32; font-weight: 700;">+${h.change}%</span>
              </div>
            `).join("")}
          </div>
        </div>
      `:""}
    `}</body></html>
    `;b("تقرير المقارنة",d,`${m.current.label} vs ${m.previous.label}`)},[m,b]);return a.jsxs("div",{className:"space-y-4",children:[a.jsx(Oe,{className:"border-0 shadow-sm",children:a.jsxs(Be,{className:"p-4",children:[a.jsx("div",{className:"flex items-center justify-between mb-3",children:a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(_a,{className:"w-4 h-4 text-primary"}),a.jsx("span",{className:"text-sm font-heading font-bold",children:"مقارنة الفترات"})]})}),a.jsx("div",{className:"grid grid-cols-3 gap-2",children:Oa.map(C=>a.jsxs("button",{onClick:()=>{S(C.id),y(C.id)},className:_e("flex items-center gap-2 p-3 rounded-xl border text-right text-xs transition-all",M===C.id?"border-primary bg-primary/5 font-medium shadow-sm":"border-border hover:bg-muted/50"),children:[a.jsx("span",{className:"text-lg",children:C.icon}),a.jsx("span",{className:"flex-1",children:C.label}),M===C.id&&a.jsx("div",{className:"w-2 h-2 rounded-full bg-primary shrink-0"})]},C.id))}),a.jsxs(Ye,{onClick:()=>y(),disabled:N,className:"mt-3 gap-2 w-full",children:[N?a.jsx(Pt,{className:"w-4 h-4 animate-spin"}):a.jsx(St,{className:"w-4 h-4"}),N?"جاري التحليل...":"تشغيل المقارنة"]})]})}),N&&a.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:Array.from({length:4}).map((C,R)=>a.jsx(lt,{className:"h-32 rounded-xl"},R))}),m&&!N&&a.jsxs(a.Fragment,{children:[a.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:[a.jsx(qt,{label:"الإرساليات",current:m.current.submissions,previous:m.previous.submissions,icon:St,color:"text-blue-600"}),a.jsx(qt,{label:"المرسلة",current:m.current.submitted,previous:m.previous.submitted,icon:$a,color:"text-emerald-600"}),a.jsx(qt,{label:"المسودات",current:m.current.draft,previous:m.previous.draft,icon:Nt,color:"text-amber-600"}),a.jsx(qt,{label:"النواقص",current:m.current.shortages,previous:m.previous.shortages,icon:Nt,color:"text-red-600"})]}),(m.topImproved.length>0||m.topDeclined.length>0)&&a.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[m.topImproved.length>0&&a.jsxs(Oe,{className:"border-0 shadow-sm border-t-4 border-t-emerald-500",children:[a.jsx(it,{className:"pb-2",children:a.jsxs(dt,{className:"text-sm flex items-center gap-2",children:[a.jsx(rr,{className:"w-4 h-4 text-emerald-600"}),"الأكثر تحسّناً"]})}),a.jsx(Be,{className:"space-y-2",children:m.topImproved.map(C=>a.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[a.jsx("span",{className:"font-medium",children:C.name}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsxs("span",{className:"text-muted-foreground",children:[C.previousPct,"%"]}),a.jsxs("span",{className:"text-emerald-600 font-bold",children:["→ ",C.currentPct,"%"]}),a.jsxs(tt,{variant:"outline",className:"text-[9px] text-emerald-600 border-emerald-300",children:["+",C.change,"%"]})]})]},C.name))})]}),m.topDeclined.length>0&&a.jsxs(Oe,{className:"border-0 shadow-sm border-t-4 border-t-red-500",children:[a.jsx(it,{className:"pb-2",children:a.jsxs(dt,{className:"text-sm flex items-center gap-2",children:[a.jsx(Xt,{className:"w-4 h-4 text-red-600"}),"الأكثر انخفاضاً"]})}),a.jsx(Be,{className:"space-y-2",children:m.topDeclined.map(C=>a.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[a.jsx("span",{className:"font-medium",children:C.name}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsxs("span",{className:"text-muted-foreground",children:[C.previousPct,"%"]}),a.jsxs("span",{className:"text-red-600 font-bold",children:["→ ",C.currentPct,"%"]}),a.jsxs(tt,{variant:"outline",className:"text-[9px] text-red-600 border-red-300",children:[C.change,"%"]})]})]},C.name))})]})]}),a.jsxs("div",{className:"flex gap-2",children:[a.jsxs(Ye,{variant:"outline",onClick:k,className:"gap-2 flex-1",children:[a.jsx(gt,{className:"w-4 h-4"}),"تصدير PDF مع رسوم بيانية"]}),a.jsxs(Ye,{variant:"outline",onClick:()=>s==null?void 0:s(m),className:"gap-2 flex-1",children:[a.jsx(gt,{className:"w-4 h-4"}),"تصدير Excel"]})]})]}),a.jsx(as,{...u})]})}function Or({filter:e,onChange:s,onRefresh:i,refreshing:l}){const{data:u}=ls(),{campaign:b,visibleOptions:N,setCampaign:_}=Vt();return a.jsx(Oe,{className:"border-0 shadow-sm",children:a.jsx(Be,{className:"p-3",children:a.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[a.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-medium text-muted-foreground",children:[a.jsx(Va,{className:"w-3.5 h-3.5"}),"فلاتر"]}),a.jsxs("div",{className:"flex items-center gap-1",children:[a.jsx(Xa,{className:"w-3 h-3 text-muted-foreground"}),a.jsx(ct,{type:"date",value:e.dateFrom,onChange:m=>s({...e,dateFrom:m.target.value}),className:"w-[130px] h-8 text-[11px]"})]}),a.jsx("span",{className:"text-[10px] text-muted-foreground",children:"—"}),a.jsx(ct,{type:"date",value:e.dateTo,onChange:m=>s({...e,dateTo:m.target.value}),className:"w-[130px] h-8 text-[11px]"}),a.jsx(Ja,{orientation:"vertical",className:"h-6"}),a.jsxs(fa,{value:e.governorateId,onValueChange:m=>s({...e,governorateId:m}),children:[a.jsxs(va,{className:"w-[140px] h-8 text-[11px]",children:[a.jsx(xt,{className:"w-3 h-3 ml-1 text-muted-foreground"}),a.jsx(ba,{placeholder:"المحافظة"})]}),a.jsxs(xa,{children:[a.jsx(Mt,{value:"all",children:"كل المحافظات"}),(u||[]).map(m=>a.jsx(Mt,{value:m.id,children:m.name_ar},m.id))]})]}),a.jsxs(fa,{value:b,onValueChange:m=>_(m),children:[a.jsx(va,{className:"w-[140px] h-8 text-[11px]",children:a.jsx(ba,{placeholder:"الحملة"})}),a.jsx(xa,{children:N.map(m=>a.jsx(Mt,{value:m.id,children:a.jsxs("span",{className:"flex items-center gap-1.5",children:[a.jsx("span",{children:m.icon})," ",m.labelAr]})},m.id))})]}),(e.dateFrom||e.dateTo||e.governorateId!=="all")&&a.jsxs(Ye,{variant:"ghost",size:"sm",onClick:()=>s({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),className:"h-8 gap-1 text-[11px] text-muted-foreground",children:[a.jsx(Qa,{className:"w-3 h-3"})," مسح"]}),a.jsxs(Ye,{variant:"outline",size:"sm",onClick:i,disabled:l,className:"h-8 gap-1.5 text-[11px] mr-auto",children:[a.jsx(ha,{className:_e("w-3 h-3",l&&"animate-spin")}),"تحديث"]})]})})})}function Br({open:e,onClose:s,data:i}){const[l,u]=le.useState(null),[b,N]=le.useState("desc"),[_,m]=le.useState("");if(!i)return null;const F=S=>{l===S?N(y=>y==="asc"?"desc":"asc"):(u(S),N("desc"))};let M=i.data;if(_){const S=_.toLowerCase();M=M.filter(y=>Object.values(y).some(k=>String(k).toLowerCase().includes(S)))}return l&&(M=[...M].sort((S,y)=>{const k=S[l],C=y[l];return typeof k=="number"&&typeof C=="number"?b==="asc"?k-C:C-k:b==="asc"?String(k).localeCompare(String(C)):String(C).localeCompare(String(k))})),a.jsx(ss,{open:e,onOpenChange:S=>!S&&s(),children:a.jsxs(rs,{className:"max-w-4xl max-h-[85vh]",children:[a.jsxs(os,{children:[a.jsxs(ns,{className:"font-heading flex items-center gap-2",children:[a.jsx(Os,{className:"w-5 h-5 text-primary"}),i.title]}),i.subtitle&&a.jsx(or,{children:i.subtitle})]}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(ct,{placeholder:"بحث...",value:_,onChange:S=>m(S.target.value),className:"h-8 text-xs"}),a.jsxs(tt,{variant:"outline",className:"text-[10px] shrink-0",children:[M.length," سجل"]})]}),a.jsx("div",{className:"overflow-auto max-h-[60vh]",children:a.jsxs(nr,{children:[a.jsx(lr,{children:a.jsx(Ca,{className:"bg-muted/30",children:i.columns.map(S=>a.jsx(ir,{className:_e("text-xs cursor-pointer hover:bg-muted/50 select-none",l===S.key&&"bg-primary/10"),onClick:()=>S.sortable!==!1&&F(S.key),children:a.jsxs("div",{className:"flex items-center gap-1",children:[S.label,l===S.key&&a.jsx("span",{className:"text-[9px]",children:b==="asc"?"↑":"↓"})]})},S.key))})}),a.jsx(dr,{children:M.map((S,y)=>a.jsx(Ca,{className:"hover:bg-muted/20",children:i.columns.map(k=>a.jsx(cr,{className:"text-xs",children:Ur(S[k.key])},k.key))},y))})]})})]})})}function Ur(e){return e==null?"—":typeof e=="boolean"?e?"نعم":"لا":typeof e=="number"?e.toLocaleString("ar-SA"):String(e)}function qr({open:e,onClose:s,title:i,children:l}){return a.jsx(ss,{open:e,onOpenChange:u=>!u&&s(),children:a.jsxs(rs,{className:"max-w-6xl max-h-[90vh]",children:[a.jsx(os,{children:a.jsxs(ns,{className:"font-heading flex items-center gap-2",children:[a.jsx(St,{className:"w-5 h-5 text-primary"}),i]})}),a.jsx("div",{className:"h-[70vh]",children:l})]})})}function Ua(e,s){if(e==null)return"";if(s==="percent"){const i=typeof e=="number"?e:parseFloat(String(e));return isNaN(i)?String(e):i}if(s==="number"){const i=typeof e=="number"?e:parseFloat(String(e));return isNaN(i)?String(e):i}return String(e)}function Yr(e){if(e==="number")return"#,##0";if(e==="percent")return"0.0%"}function Wr(e){const s=e.replace("#",""),i=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(s);return i?{r:parseInt(i[1],16),g:parseInt(i[2],16),b:parseInt(i[3],16)}:{r:0,g:0,b:0}}function Tt(e,s){const{r:i,g:l,b:u}=Wr(e),b=Math.min(255,i+s),N=Math.min(255,l+s),_=Math.min(255,u+s);return[b,N,_].map(m=>m.toString(16).padStart(2,"0")).join("")}function ut(e){const{sheets:s,fileName:i,themeId:l}=e,u=l?Bs(l):Za(),b=ft.book_new();for(const N of s){const{title:_,subtitle:m,columns:F,data:M,showTotal:S,totalColumns:y,rowColor:k}=N,C=F.map(o=>o.header),R=M.map(o=>F.map(g=>Ua(o[g.key],g.numFmt)));let v=null;S&&y&&y.length>0&&(v=F.map(o=>{if(o.key===F[0].key)return"الإجمالي";if(y.includes(o.key)){const g=M.reduce((n,x)=>{const I=x[o.key];return n+(typeof I=="number"?I:0)},0);return Ua(g,o.numFmt)}return""}));const j=[];let d=0;_&&(j.push([_]),d++),m&&(j.push([m]),d++),(_||m)&&(j.push([]),d++),j.push(C),j.push(...R),v&&j.push(v);const h=ft.aoa_to_sheet(j);h["!cols"]=F.map(o=>({wch:o.width||Math.min(Math.max(o.header.length*1.5,10),30)}));const p=[];if(_&&p.push({s:{r:0,c:0},e:{r:0,c:F.length-1}}),m&&p.push({s:{r:1,c:0},e:{r:1,c:F.length-1}}),h["!merges"]=p,M.length>0){const o=d;h["!autofilter"]={ref:ft.encode_range({s:{r:o,c:0},e:{r:o+M.length,c:F.length-1}})}}if(h["!freeze"]={xSplit:0,ySplit:d+1},_){const o=h.A1;o&&(o.s={font:{bold:!0,sz:16,color:{rgb:u.primaryDark}},alignment:{horizontal:"center",vertical:"center"},fill:{fgColor:{rgb:Tt(u.primary,180)}}})}if(m){const o=h.A2;o&&(o.s={font:{sz:11,color:{rgb:u.borderColor}},alignment:{horizontal:"center"}})}const r=d;for(let o=0;o<F.length;o++){const g=ft.encode_cell({r,c:o}),n=h[g];n&&(n.s={font:{bold:!0,sz:11,color:{rgb:u.headerText}},fill:{fgColor:{rgb:u.headerBg}},alignment:{horizontal:F[o].align||"right",vertical:"center",wrapText:!0},border:{top:{style:"thin",color:{rgb:Tt(u.primary,40)}},bottom:{style:"thin",color:{rgb:Tt(u.primary,40)}}}})}for(let o=r+1;o<j.length;o++){const g=o-r-1,n=g%2===0,x=v&&o===j.length-1,I=M[g];let f=n?u.rowEven:u.rowOdd;if(x)f=Tt(u.primary,180);else if(I&&k){const E=k(I);E&&(f=Tt(E,200))}for(let E=0;E<F.length;E++){const c=ft.encode_cell({r:o,c:E}),L=h[c];if(!L)continue;const $=Yr(F[E].numFmt),D={alignment:{horizontal:F[E].align||"right",vertical:"center"},fill:{fgColor:{rgb:f}},border:{bottom:{style:"thin",color:{rgb:u.borderColor}}}};x&&(D.font={bold:!0,sz:11},D.border={top:{style:"medium",color:{rgb:u.primary}},bottom:{style:"medium",color:{rgb:u.primary}}}),$&&(D.numFmt=$),typeof L.v=="number"&&!x&&(D.font={bold:!0});const z=String(L.v||"").toLowerCase();(F[E].key==="severity"||F[E].key==="status")&&(["حرج","critical","غير نشط","مرفوض"].includes(z)?D.font={bold:!0,color:{rgb:"C62828"}}:["نشط","مرسلة","محلول","نجح"].includes(z)?D.font={bold:!0,color:{rgb:"2E7D32"}}:["عالي","high","مسودة"].includes(z)&&(D.font={bold:!0,color:{rgb:"F57F17"}})),L.s=D}}ft.book_append_sheet(b,h,N.name.slice(0,31))}br(b,`${i}.xlsx`)}function Kr(e,s){const i=new Date().toLocaleDateString("ar-SA");ut({fileName:`dashboard_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"ملخص لوحة التحكم",title:"📊 ملخص المؤشرات — EPI Supervisor",subtitle:`📅 ${i}`,columns:[{header:"المؤشر",key:"label",width:30,align:"right"},{header:"القيمة",key:"value",width:15,align:"center"}],data:[{label:"👥 إجمالي المستخدمين",value:e.total_users},{label:"✅ المستخدمين النشطين",value:e.active_users},{label:"📋 إجمالي الإرساليات",value:e.total_submissions},{label:"📤 الإرساليات المرسلة",value:e.submitted_submissions},{label:"📝 المسودات",value:e.draft_submissions},{label:"📅 إرساليات اليوم",value:e.submissions_today},{label:"📈 إرساليات الأسبوع",value:e.submissions_this_week},{label:"📄 إجمالي النماذج",value:e.total_forms},{label:"✅ النماذج النشطة",value:e.active_forms},{label:"🎯 معدل الإنجاز",value:`${e.approval_rate.toFixed(1)}%`},{label:"📊 الاتجاه الأسبوعي",value:`${e.submissions_trend>0?"+":""}${e.submissions_trend.toFixed(1)}%`}]}]})}function Hr(e,s){const i=Math.max(...e.map(l=>l.submissions),1);ut({fileName:`governorates_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"أداء المحافظات",title:"🗺️ تقرير أداء المحافظات — EPI Supervisor",subtitle:`${e.length} محافظة — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"rank",width:6,align:"center"},{header:"المحافظة",key:"name",width:22,align:"right"},{header:"الإرساليات",key:"submissions",width:14,align:"center",numFmt:"number"},{header:"نسبة التغطية",key:"rate",width:14,align:"center"},{header:"مستوى الأداء",key:"level",width:14,align:"center"}],data:e.map((l,u)=>{const b=i>0?Math.round(l.submissions/i*100):0;return{rank:u+1,name:l.name,submissions:l.submissions,rate:`${b}%`,level:b>=80?"🟢 ممتاز":b>=50?"🟡 جيد":b>=20?"🟠 متوسط":"🔴 ضعيف"}}),showTotal:!0,totalColumns:["submissions"],rowColor:l=>{const u=i>0?l.submissions/i:0;return u>=.8?"2E7D32":u>=.5?"0277BD":u>=.2?"F57F17":"E53935"}}]})}function Vr(e,s){ut({fileName:`timeline_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"الإرساليات — خط زمني",title:"📈 تطور الإرساليات — آخر 30 يوم",subtitle:`📅 ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"التاريخ",key:"date",width:14,align:"center"},{header:"مرسلة",key:"submitted",width:12,align:"center",numFmt:"number"},{header:"مسودة",key:"draft",width:12,align:"center",numFmt:"number"},{header:"الإجمالي",key:"total",width:12,align:"center",numFmt:"number"},{header:"معدل الإرسال",key:"rate",width:14,align:"center"}],data:e.map(i=>({date:i.date,submitted:i.submitted,draft:i.draft,total:i.submitted+i.draft,rate:i.submitted+i.draft>0?`${Math.round(i.submitted/(i.submitted+i.draft)*100)}%`:"—"})),showTotal:!0,totalColumns:["submitted","draft","total"]}]})}function Xr(e,s){ut({fileName:`submissions_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"إرساليات النماذج",title:"📋 تقرير الإرساليات الشامل — EPI Supervisor",subtitle:`${e.length} إرسالية — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"النموذج",key:"form",width:22},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المُرسل",key:"submitted_by",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"النشاط",key:"campaign",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:i=>i.status==="مرسلة"?"2E7D32":i.status==="مسودة"?"F57F17":null}]})}function Jr(e,s){ut({fileName:`shortages_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"نواقص الإمدادات",title:"📦 تقرير النواقص — EPI Supervisor",subtitle:`${e.length} نقص — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الصنف",key:"item",width:22},{header:"الفئة",key:"category",width:15},{header:"المطلوب",key:"needed",width:10,align:"center",numFmt:"number"},{header:"المتاح",key:"available",width:10,align:"center",numFmt:"number"},{header:"الخطورة",key:"severity",width:12,align:"center"},{header:"محلول",key:"resolved",width:10,align:"center"},{header:"المُبلّغ",key:"by",width:18},{header:"المحافظة",key:"gov",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:i=>{const l=String(i.severity).toLowerCase();return l==="حرج"||l==="critical"?"C62828":l==="عالي"||l==="high"?"F57F17":null}}]})}function Qr(e,s){const i={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"};ut({fileName:`users_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"المستخدمين",title:"👥 تقرير المستخدمين — EPI Supervisor",subtitle:`${e.length} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الاسم",key:"full_name",width:22},{header:"البريد",key:"email",width:25},{header:"الدور",key:"role",width:14,align:"center"},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المحافظة",key:"governorate",width:15},{header:"تاريخ الإنشاء",key:"created_at",width:14,align:"center"}],data:e.map((l,u)=>({index:u+1,full_name:l.full_name,email:l.email,role:i[l.role]||l.role,status:l.is_active?"نشط":"غير نشط",governorate:l.governorate||"—",created_at:new Date(l.created_at).toLocaleDateString("ar-SA")})),rowColor:l=>l.status==="نشط"?"2E7D32":"E53935"}]})}function Zr(e,s){const i=e.reduce((l,u)=>l+u.value,0);ut({fileName:`roles_${new Date().toISOString().split("T")[0]}`,themeId:s,sheets:[{name:"توزيع الأدوار",title:"👥 توزيع المستخدمين حسب الدور",subtitle:`${i} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"الدور",key:"name",width:22,align:"right"},{header:"العدد",key:"value",width:12,align:"center",numFmt:"number"},{header:"النسبة",key:"percent",width:14,align:"center"}],data:e.map(l=>({name:l.name,value:l.value,percent:i>0?`${(l.value/i*100).toFixed(1)}%`:"0%"})),showTotal:!0,totalColumns:["value"]}]})}async function We(e){const{table:s,select:i,maxRows:l=5e4,pageSize:u=1e3,orderBy:b="created_at",orderDirection:N="desc",onProgress:_}=e,m=Date.now(),F=[];let M=0,S=null,y=!1;try{const{count:k}=await K.from(s).select("id",{count:"exact",head:!0});S=k}catch{}for(;;){let k=K.from(s).select(i).order(b,{ascending:N==="asc"}).range(M,M+u-1);e.applyFilters&&(k=e.applyFilters(k));const{data:C,error:R}=await k;if(R){console.error(`[BulkFetch] Error fetching ${s}:`,R);break}if(!C||C.length===0)break;if(F.push(...C),_==null||_(F.length,S),F.length>=l){y=!0;break}if(C.length<u)break;M+=u,await new Promise(v=>setTimeout(v,50))}return{data:F,totalCount:S||F.length,fetchedCount:F.length,truncated:y,elapsed:Date.now()-m}}async function eo(e){return We({table:"form_submissions",select:`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:5e4,pageSize:1e3,applyFilters:s=>(s=s.is("deleted_at",null),e!=null&&e.formId&&(s=s.eq("form_id",e.formId)),e!=null&&e.status&&e.status!=="all"&&(s=s.eq("status",e.status)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(s=s.eq("governorate_id",e.governorateId)),e!=null&&e.dateFrom&&(s=s.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(s=s.lte("created_at",e.dateTo+"T23:59:59")),s)})}async function to(e){return We({table:"profiles",select:`
      id, full_name, email, role, is_active, phone,
      governorates(name_ar),
      districts(name_ar),
      created_at, updated_at
    `,maxRows:1e4,pageSize:1e3,applyFilters:s=>(s=s.is("deleted_at",null),s)})}async function ao(e){return We({table:"supply_shortages",select:`
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:1e4,pageSize:1e3,applyFilters:s=>(s=s.is("deleted_at",null),s)})}function Pe(e){const s=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${s[e.getMonth()]} ${e.getFullYear()}`}const so={1:"الجولة الأولى",2:"الجولة الثانية",3:"الجولة الثالثة",4:"الجولة الرابعة",5:"الجولة الخامسة",6:"الجولة السادسة",7:"الجولة السابعة",8:"الجولة الثامنة",9:"الجولة التاسعة",10:"الجولة العاشرة"};function ro(e){return!e||e<=0?null:so[e]||`الجولة ${e}`}function De(e){const s=ro(e);return s?` — ${s}`:""}function at(e,s){return s&&s>0?e.eq("campaign_round",s):e}function oo(e){return e.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function A(e){const s=document.createElement("div");return s.textContent=e,s.innerHTML}function je(e,s,i){return`
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon"><img src="${Qt}" alt="شعار التحصين" style="width:40px;height:40px;object-fit:contain;border-radius:8px" /></div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${Pe(new Date)}</div>
          <div class="meta-item">🕐 ${oo(new Date)}</div>
          ${i?`<div class="meta-item">📊 ${A(i)}</div>`:""}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${A(e)}</h1>
        <p>${A(s)}</p>
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
  `}function P(e,s,i,l,u){return`
    <div class="kpi-card" style="border-top: 4px solid ${l}">
      <div class="kpi-icon">${i}</div>
      <div class="kpi-value" style="color: ${l}">${s}</div>
      <div class="kpi-label">${A(e)}</div>
      ${u?`<div class="kpi-sub">${A(u)}</div>`:""}
    </div>
  `}function V(e,s,i){return`
    <div class="section-title">
      <span class="section-icon">${e}</span>
      <span>${A(s)}</span>
      ${i?`<span class="section-badge">${A(i)}</span>`:""}
    </div>
  `}function ie(e,s){return`
    <table class="data-table">
      <thead>
        <tr>${e.map(i=>`<th>${A(i)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${s.map(i=>`<tr>${i.map(l=>`<td>${l}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `}function Je(e,s,i,l){const u=i>0?Math.round(s/i*100):0;return`
    <div class="progress-item">
      <div class="progress-header">
        <span>${A(e)}</span>
        <span class="progress-value">${u}% (${s}/${i})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(u,100)}%; background: ${l}"></div>
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
  `}let Fa=!1,Ht="",wa=0;function no(){return Fa=!0,Ht="",wa++,wa}function qa(e){if(e!==void 0&&e!==wa)return"";Fa=!1;const s=Ht;return Ht="",s}function Ce(e,s,i){var b;if(Fa)return Ht=e,e;const l=document.createElement("iframe");l.style.position="fixed",l.style.top="-9999px",l.style.left="-9999px",l.style.width="210mm",l.style.height="297mm",document.body.appendChild(l);const u=l.contentDocument||((b=l.contentWindow)==null?void 0:b.document);if(!u){document.body.removeChild(l);const N=new Blob([e],{type:"text/html"}),_=URL.createObjectURL(N),m=document.createElement("a");m.href=_,m.download=`${s||"تقرير"}.html`,m.click(),URL.revokeObjectURL(_);return}u.open(),u.write(e),u.close(),setTimeout(()=>{var N;(N=l.contentWindow)==null||N.print(),setTimeout(()=>{document.body.contains(l)&&document.body.removeChild(l)},1e4)},600)}async function lo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo,u=i&&l?`من ${i} إلى ${l}`:"آخر 30 يوم";async function b(){const n=[];let x=0;const I=1e3;for(;;){let f=K.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(x,x+I-1);i&&(f=f.gte("created_at",i)),l&&(f=f.lte("created_at",l+"T23:59:59")),s&&(f=f.eq("campaign_round",s));const{data:E,error:c}=await f;if(c||!E||E.length===0||(n.push(...E),E.length<I)||(x+=I,n.length>=1e5))break}return n}const[N,_,m,F,M]=await Promise.allSettled([K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),b(),K.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null),K.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),K.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).gte("created_at",i||"").lte("created_at",(l||"")+"T23:59:59")]),S=N.status==="fulfilled"?N.value.data||[]:[],y=_.status==="fulfilled"?_.value||[]:[],k=m.status==="fulfilled"?m.value.data||[]:[],C=F.status==="fulfilled"?F.value.data||[]:[],R=M.status==="fulfilled"?M.value.data||[]:[],v=y.length,j=y.filter(n=>n.status==="submitted").length,d=y.filter(n=>n.status==="draft").length,h=k.filter(n=>n.is_active).length,p=R.filter(n=>!n.is_resolved).length,r=R.filter(n=>!n.is_resolved&&n.severity==="critical").length,o=S.map(n=>{const x=y.filter(E=>E.governorate_id===n.id),I=k.filter(E=>E.governorate_id===n.id&&E.is_active),f=R.filter(E=>E.governorate_id===n.id&&!E.is_resolved);return{name:n.name_ar,submissions:x.length,submitted:x.filter(E=>E.status==="submitted").length,draft:x.filter(E=>E.status==="draft").length,users:I.length,shortages:f.length,gps:x.filter(E=>E.gps_lat).length,photos:x.filter(E=>E.photos&&E.photos.length>0).length}}).sort((n,x)=>x.submissions-n.submissions),g=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("التقرير المركزي الشامل","نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين"+De(s),u)}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${V("📊","ملخص المؤشرات الرئيسية","KPIs")}
      <div class="kpi-grid">
        ${P("إجمالي الإرساليات",v,"📋",t.primary,`${j} مرسلة / ${d} مسودة`)}
        ${P("معدل الإرسال",`${v>0?Math.round(j/v*100):0}%`,"✅",t.success)}
        ${P("المحافظات النشطة",S.length,"🏛️",t.info,`${o.filter(n=>n.submissions>0).length} لها بيانات`)}
        ${P("المستخدمين النشطين",h,"👥","#7B1FA2")}
        ${P("النماذج النشطة",C.length,"📝",t.warning)}
        ${P("النواقص المعلقة",p,"⚠️",t.accent,`${r} حرجة`)}
        ${P("تغطية GPS",`${v>0?Math.round(y.filter(n=>n.gps_lat).length/v*100):0}%`,"📍",t.info)}
        ${P("تغطية الصور",`${v>0?Math.round(y.filter(n=>{var x;return((x=n.photos)==null?void 0:x.length)>0}).length/v*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${V("🏛️","أداء المحافظات",`${S.length} محافظة`)}
      ${ie(["#","المحافظة","الإرساليات","مرسلة","مسودة","المستخدمين","النواقص","GPS","معدل الإرسال"],o.map((n,x)=>[`${x+1}`,`<strong>${A(n.name)}</strong>`,`<span class="num">${n.submissions}</span>`,`<span class="num">${n.submitted}</span>`,`<span class="num">${n.draft}</span>`,`<span class="num">${n.users}</span>`,`<span class="num">${n.shortages>0?`<span style="color:${t.accent}">${n.shortages}</span>`:"0"}</span>`,`<span class="num">${n.submissions>0?Math.round(n.gps/n.submissions*100):0}%</span>`,`<span class="num">${n.submissions>0?Math.round(n.submitted/n.submissions*100):0}%</span>`]))}

      <!-- ═══ Coverage Analysis ═══ -->
      ${V("📈","تحليل التغطية")}
      ${o.map(n=>Je(n.name,n.submissions,Math.max(...o.map(x=>x.submissions)),n.submissions>0?t.primary:"#BDBDBD")).join("")}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${V("📝","ملخص النماذج")}
      ${ie(["#","النموذج","الحملة","الإرساليات","معدل الإنجاز"],C.map((n,x)=>{const I=y.filter(E=>E.form_id===n.id),f=I.filter(E=>E.status==="submitted").length;return[`${x+1}`,A(n.title_ar),n.campaign_type==="polio_campaign"?"💉 شلل أطفال":"🏥 إيصالي تكاملي",`<span class="num">${I.length}</span>`,`<span class="num">${I.length>0?Math.round(f/I.length*100):0}%</span>`]}))}

      <!-- ═══ Shortages Alert ═══ -->
      ${p>0?`
        ${V("⚠️","تنبيهات النواقص",`${p} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${p}</strong> نقص معلق منها <strong>${r}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${ie(["النقص","المحافظة","الخطورة","الكمية المطلوبة"],R.filter(n=>!n.is_resolved).slice(0,15).map(n=>{var x;return[A(n.item_name),A(((x=n.governorates)==null?void 0:x.name_ar)||"—"),`<span class="status-badge ${n.severity==="critical"?"status-not-ready":n.severity==="high"?"status-partial":"status-ready"}">${n.severity==="critical"?"حرج":n.severity==="high"?"عالي":n.severity==="medium"?"متوسط":"منخفض"}</span>`,`<span class="num">${n.quantity_needed||"—"}</span>`]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${V("👥","توزيع المستخدمين")}
      <div class="three-col">
        ${["admin","central","governorate","district","data_entry"].map(n=>{const x=k.filter(E=>E.role===n&&E.is_active).length,I={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},f={admin:"🔴",central:"🟣",governorate:"🔵",district:"🟢",data_entry:"⚪"};return P(I[n]||n,x,f[n]||"👤",t.primary)}).join("")}
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(g,"التقرير_Mركزي_الشامل")}async function io(e,s){const i=s!=null&&s.campaignRound&&s.campaignRound>0?s.campaignRound:null,l=s==null?void 0:s.dateFrom,u=s==null?void 0:s.dateTo,b=g=>(l&&(g=g.gte("created_at",l)),u&&(g=g.lte("created_at",u+"T23:59:59")),g),N=b(at(K.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),i)).order("created_at",{ascending:!1}),_=b(K.from("supply_shortages").select("*").eq("governorate_id",e).is("deleted_at",null)),[m,F,M,S,y]=await Promise.allSettled([K.from("governorates").select("*").eq("id",e).single(),N,K.from("profiles").select("*, districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),K.from("districts").select("*").eq("governorate_id",e).eq("is_active",!0).is("deleted_at",null).order("name_ar"),_]),k=m.status==="fulfilled"?m.value.data:null,C=F.status==="fulfilled"?F.value.data||[]:[],R=M.status==="fulfilled"?M.value.data||[]:[],v=S.status==="fulfilled"?S.value.data||[]:[],j=y.status==="fulfilled"?y.value.data||[]:[];if(!k){console.warn("[Report] المحافظة غير موجودة");return}const d=C.length,h=C.filter(g=>g.status==="submitted").length,p=R.filter(g=>g.is_active).length,r=v.map(g=>{const n=C.filter(I=>I.district_id===g.id),x=R.filter(I=>I.district_id===g.id&&I.is_active);return{name:g.name_ar,submissions:n.length,submitted:n.filter(I=>I.status==="submitted").length,users:x.length,gps:n.filter(I=>I.gps_lat).length}}).sort((g,n)=>n.submissions-g.submissions),o=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${A(k.name_ar)} — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je(`تقرير محافظة ${k.name_ar}`,`تحليل شامل لأداء المحافظة — ${v.length} مديرية${De(i)}`,s!=null&&s.dateFrom?`من ${s.dateFrom} إلى ${s.dateTo}`:void 0)}

      ${V("📊","مؤشرات المحافظة")}
      <div class="kpi-grid">
        ${P("الإرساليات",d,"📋",t.primary,`${h} مرسلة`)}
        ${P("معدل الإرسال",`${d>0?Math.round(h/d*100):0}%`,"✅",t.success)}
        ${P("المديريات",v.length,"🏘️",t.info,`${r.filter(g=>g.submissions>0).length} نشطة`)}
        ${P("المستخدمين",p,"👥","#7B1FA2")}
        ${P("النواقص",j.filter(g=>!g.is_resolved).length,"⚠️",t.accent)}
        ${P("تغطية GPS",`${d>0?Math.round(C.filter(g=>g.gps_lat).length/d*100):0}%`,"📍",t.info)}
      </div>

      ${V("🏘️","أداء المديريات",`${v.length} مديرية`)}
      ${ie(["#","المديرية","الإرساليات","مرسلة","المستخدمين","GPS","معدل الإنجاز"],r.map((g,n)=>[`${n+1}`,`<strong>${A(g.name)}</strong>`,`<span class="num">${g.submissions}</span>`,`<span class="num">${g.submitted}</span>`,`<span class="num">${g.users}</span>`,`<span class="num">${g.submissions>0?Math.round(g.gps/g.submissions*100):0}%</span>`,`<span class="num">${g.submissions>0?Math.round(g.submitted/g.submissions*100):0}%</span>`]))}

      ${V("📈","مخطط أداء المديريات")}
      ${r.map(g=>Je(g.name,g.submissions,Math.max(...r.map(n=>n.submissions),1),t.primary)).join("")}

      ${V("👥","المستخدمون في المحافظة")}
      ${ie(["#","الاسم","الدور","المديرية","آخر دخول"],R.filter(g=>g.is_active).map((g,n)=>{var x;return[`${n+1}`,A(g.full_name),g.role==="governorate"?"🔵 محافظة":g.role==="district"?"🟢 مديرية":"⚪ إدخال بيانات",A(((x=g.districts)==null?void 0:x.name_ar)||"—"),g.last_login?new Date(g.last_login).toLocaleDateString("ar-SA"):"—"]}))}

      ${j.filter(g=>!g.is_resolved).length>0?`
        ${V("⚠️","النواقص المعلقة")}
        ${ie(["النقص","الخطورة","الكمية","ملاحظات"],j.filter(g=>!g.is_resolved).map(g=>[A(g.item_name),`<span class="status-badge ${g.severity==="critical"?"status-not-ready":"status-partial"}">${g.severity==="critical"?"حرج":"عالي"}</span>`,`<span class="num">${g.quantity_needed||"—"}</span>`,A(g.notes||"—")]))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(o,`تقرير_محافظة_${k.name_ar}`)}async function co(e,s){const i=s!=null&&s.campaignRound&&s.campaignRound>0?s.campaignRound:null,l=s==null?void 0:s.dateFrom,u=s==null?void 0:s.dateTo,N=(n=>(l&&(n=n.gte("created_at",l)),u&&(n=n.lte("created_at",u+"T23:59:59")),n))(at(K.from("form_submissions").select("*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").eq("form_id",e).is("deleted_at",null),i)).order("created_at",{ascending:!1}),[_,m,F]=await Promise.allSettled([K.from("forms").select("*").eq("id",e).single(),N,K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),M=_.status==="fulfilled"?_.value.data:null,S=m.status==="fulfilled"?m.value.data||[]:[],y=F.status==="fulfilled"?F.value.data||[]:[];if(!M){console.warn("[Report] النموذج غير موجود");return}const k=S.length,C=S.filter(n=>n.status==="submitted").length,R=S.filter(n=>n.status==="draft").length;let v={};try{v=typeof M.schema=="string"?JSON.parse(M.schema):M.schema}catch(n){console.warn("[form-analysis] Failed to parse form schema:",n)}const j=(v==null?void 0:v.sections)||[],d=j.flatMap(n=>n.fields||[]),h=y.map(n=>{const x=S.filter(I=>I.governorate_id===n.id);return{name:n.name_ar,total:x.length,submitted:x.filter(I=>I.status==="submitted").length,draft:x.filter(I=>I.status==="draft").length}}).filter(n=>n.total>0).sort((n,x)=>x.total-n.total),p=d.map(n=>{const x=n.name||n.id||n.label_ar;let I=0,f=0;return S.forEach(E=>{var L;const c=(L=E.data)==null?void 0:L[x];c!=null&&c!==""&&c!==0?I++:f++}),{label:n.label_ar||x,type:n.type,filled:I,empty:f,rate:k>0?Math.round(I/k*100):0}});S.forEach(n=>{n.created_at.split("T")[0]});const r=Array.from({length:24},(n,x)=>({hour:`${x.toString().padStart(2,"0")}:00`,count:S.filter(I=>new Date(I.created_at).getHours()===x).length})),o=M.campaign_type==="polio_campaign"?"💉 حملة شلل الأطفال":"🏥 النشاط الإيصالي التكاملي",g=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${A(M.title_ar)} — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير تحليل النموذج",M.title_ar+De(i),o)}

      ${V("📊","ملخص النموذج")}
      <div class="kpi-grid">
        ${P("إجمالي الإرساليات",k,"📋",t.primary)}
        ${P("مرسلة",C,"✅",t.success,`${k>0?Math.round(C/k*100):0}%`)}
        ${P("مسودة",R,"📝",t.warning,`${k>0?Math.round(R/k*100):0}%`)}
        ${P("المحافظات المشمولة",h.length,"🏛️",t.info)}
        ${P("الحقول",d.length,"🔤","#7B1FA2")}
        ${P("الأقسام",j.length,"📂","#00897B")}
        ${P("تغطية GPS",`${k>0?Math.round(S.filter(n=>n.gps_lat).length/k*100):0}%`,"📍",t.info)}
        ${P("تغطية الصور",`${k>0?Math.round(S.filter(n=>{var x;return((x=n.photos)==null?void 0:x.length)>0}).length/k*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Description ═══ -->
      ${M.description_ar?`
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${A(M.description_ar)}
        </div>
      `:""}

      <!-- ═══ Settings ═══ -->
      ${V("⚙️","إعدادات النموذج")}
      <div class="two-col">
        <div class="alert-box alert-info">
          <strong>GPS إلزامي:</strong> ${M.requires_gps?"نعم ✅":"لا ❌"}
        </div>
        <div class="alert-box alert-info">
          <strong>صورة إلزامية:</strong> ${M.requires_photo?"نعم ✅":"لا ❌"}
        </div>
      </div>

      <!-- ═══ Governorate Breakdown ═══ -->
      <div class="page-break"></div>
      ${V("🏛️","الإرساليات حسب المحافظة",`${h.length} محافظة`)}
      ${ie(["#","المحافظة","الإجمالي","مرسلة","مسودة","معدل الإرسال"],h.map((n,x)=>[`${x+1}`,`<strong>${A(n.name)}</strong>`,`<span class="num">${n.total}</span>`,`<span class="num">${n.submitted}</span>`,`<span class="num">${n.draft}</span>`,`<span class="num">${n.total>0?Math.round(n.submitted/n.total*100):0}%</span>`]))}

      ${h.map(n=>Je(n.name,n.total,Math.max(...h.map(x=>x.total),1),t.primary)).join("")}

      <!-- ═══ Field Analysis ═══ -->
      ${p.length>0?`
        ${V("🔤","تحليل الحقول",`${p.length} حقل`)}
        ${ie(["#","الحقل","النوع","مُملأ","فارغ","نسبة التعبئة"],p.map((n,x)=>[`${x+1}`,`<strong>${A(n.label)}</strong>`,n.type||"—",`<span class="num">${n.filled}</span>`,`<span class="num" style="color:${n.empty>0?t.accent:t.success}">${n.empty}</span>`,`<span class="num" style="color:${n.rate>=80?t.success:n.rate>=50?t.warning:t.accent}">${n.rate}%</span>`]))}
        ${p.map(n=>Je(n.label,n.filled,k,n.rate>=80?t.success:n.rate>=50?t.warning:t.accent)).join("")}
      `:""}

      <!-- ═══ Sections Analysis ═══ -->
      ${j.length>0?`
        ${V("📂","تحليل الأقسام")}
        ${ie(["#","القسم","عدد الحقول"],j.map((n,x)=>[`${x+1}`,A(n.title_ar||`قسم ${x+1}`),`<span class="num">${(n.fields||[]).length}</span>`]))}
      `:""}

      <!-- ═══ Time Analysis ═══ -->
      ${V("⏰","تحليل التوقيت")}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${S.length>0?new Date(S[S.length-1].created_at).toLocaleDateString("ar-SA"):"—"} |
        <strong>آخر إرسالية:</strong> ${S.length>0?new Date(S[0].created_at).toLocaleDateString("ar-SA"):"—"}
      </div>

      ${ie(["الساعة","عدد الإرساليات"],r.filter(n=>n.count>0).map(n=>[n.hour,`<span class="num">${n.count}</span>`]))}

      <!-- ═══ Recent Submissions ═══ -->
      ${V("📋","آخر الإرساليات","آخر 10")}
      ${ie(["#","المحافظة","المديرية","المُرسل","الحالة","التاريخ"],S.slice(0,10).map((n,x)=>{var I,f,E;return[`${x+1}`,A(((I=n.governorates)==null?void 0:I.name_ar)||"—"),A(((f=n.districts)==null?void 0:f.name_ar)||"—"),A(((E=n.profiles)==null?void 0:E.full_name)||"—"),`<span class="status-badge ${n.status==="submitted"?"status-ready":"status-partial"}">${n.status==="submitted"?"مرسلة":"مسودة"}</span>`,new Date(n.created_at).toLocaleDateString("ar-SA")]}))}

      ${Te()}
    </body>
    </html>
  `;Ce(g,`تحليل_${M.title_ar}`)}async function go(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo,u=e==null?void 0:e.governorateId,[b,N]=await Promise.allSettled([K.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),_=await We({table:"form_submissions",select:"*, forms(title_ar), governorates(name_ar), districts(name_ar)",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:r=>(r=r.is("deleted_at",null),i&&(r=r.gte("created_at",i)),l&&(r=r.lte("created_at",l+"T23:59:59")),u&&u!=="all"&&(r=r.eq("governorate_id",u)),s&&(r=r.eq("campaign_round",s)),r)}),m=b.status==="fulfilled"?b.value.data||[]:[],F=_.data;N.status==="fulfilled"&&N.value.data;const M=["data_entry","district","governorate"],y=m.filter(r=>M.includes(r.role)&&r.is_active).map(r=>{const o=F.filter(D=>D.submitted_by===r.id),g=o.filter(D=>D.status==="submitted").length,n=o.filter(D=>D.status==="draft").length,x=o.filter(D=>D.gps_lat).length,I=o.filter(D=>{var z;return((z=D.photos)==null?void 0:z.length)>0}).length,f=o.length>0?o[0].created_at:null,E=r.last_login,c=f?Math.floor((Date.now()-new Date(f).getTime())/864e5):999,L=E?Math.floor((Date.now()-new Date(E).getTime())/864e5):999;let $=0;return o.length>0&&($+=30),g>0&&($+=25),x>0&&($+=15),I>0&&($+=15),c<=3?$+=15:c<=7?$+=10:c<=14&&($+=5),{...r,totalSubs:o.length,submitted:g,draft:n,withGps:x,withPhotos:I,lastSub:f,lastLogin:E,daysSinceLastSub:c,daysSinceLastLogin:L,gpsRate:o.length>0?Math.round(x/o.length*100):0,photoRate:o.length>0?Math.round(I/o.length*100):0,score:$}}).sort((r,o)=>o.score-r.score),k=y.filter(r=>r.daysSinceLastSub<=7).length,C=y.filter(r=>r.daysSinceLastSub>14).length,R=y.length>0?Math.round(y.reduce((r,o)=>r+o.score,0)/y.length):0,v={data_entry:"إدخال بيانات",district:"مديرية",governorate:"محافظة"},j={data_entry:"⚪",district:"🟢",governorate:"🔵"};t.success,t.info;function d(r){return r>=70?t.success:r>=40?t.warning:t.accent}function h(r){return r>=80?"ممتاز":r>=60?"جيد":r>=40?"متوسط":r>=20?"ضعيف":"غير نشط"}const p=`
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
      ${je("تقرير أداء المشرفين الميدانيين","تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية"+De(s))}

      ${V("📊","ملخص الأداء")}
      <div class="kpi-grid">
        ${P("إجمالي المشرفين",y.length,"👥",t.primary)}
        ${P("نشط (آخر 7 أيام)",k,"🟢",t.success,`${y.length>0?Math.round(k/y.length*100):0}%`)}
        ${P("غير نشط (+14 يوم)",C,"🔴",t.accent,`${y.length>0?Math.round(C/y.length*100):0}%`)}
        ${P("متوسط الأداء",`${R}/100`,"📊",R>=60?t.success:t.warning)}
      </div>

      ${V("🏆","ترتيب المشرفين حسب الأداء",`${y.length} مشرف`)}
      ${ie(["#","المشرف","الدور","المحافظة/المديرية","الإرساليات","مرسلة","GPS","النشاط","التقييم"],y.map((r,o)=>{var g,n;return[`${o+1}`,`<strong>${A(r.full_name)}</strong>`,`${j[r.role]||"👤"} ${v[r.role]||r.role}`,A(((g=r.governorates)==null?void 0:g.name_ar)||((n=r.districts)==null?void 0:n.name_ar)||"—"),`<span class="num">${r.totalSubs}</span>`,`<span class="num">${r.submitted}</span>`,`<span class="num">${r.gpsRate}%</span>`,r.daysSinceLastSub<=3?'<span class="activity-dot" style="background:#4CAF50"></span> نشط':r.daysSinceLastSub<=7?'<span class="activity-dot" style="background:#FF9800"></span> متوسط':r.daysSinceLastSub<=14?'<span class="activity-dot" style="background:#F44336"></span> ضعيف':'<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',`<span class="score-badge" style="background:${d(r.score)}">${r.score} — ${h(r.score)}</span>`]}))}

      <!-- ═══ Top Performers ═══ -->
      ${y.filter(r=>r.score>=60).length>0?`
        ${V("⭐","المشرفون المتميزون",`${y.filter(r=>r.score>=60).length} متميز`)}
        ${y.filter(r=>r.score>=60).slice(0,10).map(r=>{var o,g;return`
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${j[r.role]} ${A(r.full_name)}</div>
                <div class="supervisor-meta">${v[r.role]} — ${A(((o=r.governorates)==null?void 0:o.name_ar)||((g=r.districts)==null?void 0:g.name_ar)||"—")}</div>
              </div>
              <span class="score-badge" style="background:${d(r.score)}">${r.score} ${h(r.score)}</span>
            </div>
            <div class="supervisor-stats">
              <div class="stat-box">
                <div class="stat-value" style="color:${t.primary}">${r.totalSubs}</div>
                <div class="stat-label">إجمالي</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${t.success}">${r.submitted}</div>
                <div class="stat-label">مرسلة</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:${t.info}">${r.gpsRate}%</div>
                <div class="stat-label">GPS</div>
              </div>
              <div class="stat-box">
                <div class="stat-value" style="color:#7B1FA2">${r.photoRate}%</div>
                <div class="stat-label">صور</div>
              </div>
            </div>
          </div>
        `}).join("")}
      `:""}

      <!-- ═══ Inactive Supervisors ═══ -->
      ${y.filter(r=>r.daysSinceLastSub>14).length>0?`
        ${V("🚨","مشرفون غير نشطين — يحتاجون متابعة",`${y.filter(r=>r.daysSinceLastSub>14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${y.filter(r=>r.daysSinceLastSub>14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${ie(["#","المشرف","الدور","المحافظة","آخر إرسالية","منذ يوم"],y.filter(r=>r.daysSinceLastSub>14).map((r,o)=>{var g,n;return[`${o+1}`,`<strong>${A(r.full_name)}</strong>`,v[r.role]||r.role,A(((g=r.governorates)==null?void 0:g.name_ar)||((n=r.districts)==null?void 0:n.name_ar)||"—"),r.lastSub?new Date(r.lastSub).toLocaleDateString("ar-SA"):"لم يرسل أبداً",`<span style="color:${t.accent};font-weight:700">${r.daysSinceLastSub} يوم</span>`]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(p,"تقرير_أداء_المشرفين")}async function uo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo,u=e==null?void 0:e.governorateId,b=r=>(i&&(r=r.gte("created_at",i)),l&&(r=r.lte("created_at",l+"T23:59:59")),r),N=r=>(u&&u!=="all"&&(r=r.eq("governorate_id",u)),r),[_,m,F,M]=await Promise.allSettled([K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),K.from("districts").select("*, governorates(name_ar)").eq("is_active",!0).is("deleted_at",null),b(N(at(K.from("form_submissions").select("governorate_id, district_id, created_at").is("deleted_at",null),s))),K.from("profiles").select("governorate_id, district_id, role, is_active").is("deleted_at",null)]),S=_.status==="fulfilled"?_.value.data||[]:[],y=m.status==="fulfilled"?m.value.data||[]:[],k=F.status==="fulfilled"?F.value.data||[]:[],C=M.status==="fulfilled"?M.value.data||[]:[],R=S.map(r=>{const o=k.filter(E=>E.governorate_id===r.id),g=y.filter(E=>E.governorate_id===r.id),n=g.filter(E=>k.some(c=>c.district_id===E.id)),x=C.filter(E=>E.governorate_id===r.id&&E.is_active),I=o.length>0?o.sort((E,c)=>new Date(c.created_at).getTime()-new Date(E.created_at).getTime())[0].created_at:null,f=I?Math.floor((Date.now()-new Date(I).getTime())/864e5):999;return{name:r.name_ar,id:r.id,totalDistricts:g.length,coveredDistricts:n.length,gapDistricts:g.length-n.length,submissions:o.length,users:x.length,lastSub:I,daysSinceLast:f,coverageRate:g.length>0?Math.round(n.length/g.length*100):0}}),v=R.filter(r=>r.coverageRate===100),j=R.filter(r=>r.coverageRate>0&&r.coverageRate<100),d=R.filter(r=>r.coverageRate===0),h=y.filter(r=>!k.some(o=>o.district_id===r.id)),p=`
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
      ${je("تقرير الفجوة في التغطية","تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون"+De(s))}

      ${V("📊","نظرة عامة على التغطية")}
      <div class="kpi-grid">
        ${P("المحافظات",S.length,"🏛️",t.primary)}
        ${P("مغطاة بالكامل",v.length,"✅",t.success)}
        ${P("غطاء جزئي",j.length,"⚠️",t.warning)}
        ${P("بدون تغطية",d.length,"🔴",t.accent)}
        ${P("المديريات",y.length,"🏘️",t.info)}
        ${P("مديريات بلا بيانات",h.length,"🚨",t.accent)}
        ${P("نسبة التغطية",`${S.length>0?Math.round((S.length-d.length)/S.length*100):0}%`,"📈",t.primary)}
        ${P("المستخدمين",C.filter(r=>r.is_active).length,"👥","#7B1FA2")}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${d.length>0?`
        ${V("🚨","محافظات بدون أي تغطية",`${d.length} محافظة`)}
        <div class="alert-box alert-danger">
          <strong>تنبيه:</strong> يوجد ${d.length} محافظة لم تسجل أي إرسالية. هذه المناطق تحتاج تدخل فوري.
        </div>
        ${d.map(r=>`
          <div class="gap-card" style="border-right: 4px solid ${t.accent}">
            <div class="gap-header">
              <strong>🔴 ${A(r.name)}</strong>
              <span style="color:${t.accent};font-weight:700">${r.totalDistricts} مديرية — 0 إرسالية</span>
            </div>
            <div style="font-size:10px;color:${t.textMuted}">
              ${r.users>0?`${r.users} مستخدم مسجل`:"لا يوجد مستخدمين"}
              ${r.lastSub?` — آخر نشاط: ${new Date(r.lastSub).toLocaleDateString("ar-SA")}`:" — لم يسبق العمل هنا"}
            </div>
          </div>
        `).join("")}
      `:`
        <div class="alert-box alert-success">✅ جميع المحافظات لها تغطية على الأقل جزئية</div>
      `}

      <!-- ═══ Partial Coverage ═══ -->
      ${j.length>0?`
        <div class="page-break"></div>
        ${V("⚠️","محافظات بتغطية جزئية",`${j.length} محافظة`)}
        ${j.map(r=>`
          <div class="gap-card" style="border-right: 4px solid ${t.warning}">
            <div class="gap-header">
              <strong>🟡 ${A(r.name)}</strong>
              <span>${r.coveredDistricts}/${r.totalDistricts} مديرية (${r.coverageRate}%)</span>
            </div>
            <div class="coverage-bar">
              <div class="coverage-fill" style="width:${r.coverageRate}%;background:${r.coverageRate>=60?t.success:t.warning}"></div>
            </div>
            <div style="font-size:9px;color:${t.textMuted};margin-top:4px">
              ${r.submissions} إرسالية — ${r.users} مستخدم — مديريات بلا بيانات: ${r.gapDistricts}
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ All Governorates Summary ═══ -->
      ${V("📋","جدول التغطية الشامل")}
      ${ie(["#","المحافظة","المديريات","مغطاة","فجوة","الإرساليات","المستخدمين","نسبة التغطية"],R.map((r,o)=>[`${o+1}`,`<strong>${A(r.name)}</strong>`,`<span class="num">${r.totalDistricts}</span>`,`<span class="num">${r.coveredDistricts}</span>`,`<span class="num" style="color:${r.gapDistricts>0?t.accent:t.success}">${r.gapDistricts}</span>`,`<span class="num">${r.submissions}</span>`,`<span class="num">${r.users}</span>`,`<span class="num" style="color:${r.coverageRate>=80?t.success:r.coverageRate>=40?t.warning:t.accent}">${r.coverageRate}%</span>`]))}

      ${R.map(r=>Je(r.name,r.coveredDistricts,r.totalDistricts,r.coverageRate>=80?t.success:r.coverageRate>=40?t.warning:t.accent)).join("")}

      <!-- ═══ Districts Without Data ═══ -->
      ${h.length>0?`
        <div class="page-break"></div>
        ${V("🏘️","مديريات بدون أي بيانات",`${h.length} مديرية`)}
        ${ie(["#","المديرية","المحافظة"],h.map((r,o)=>{var g;return[`${o+1}`,A(r.name_ar),A(((g=r.governorates)==null?void 0:g.name_ar)||"—")]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(p,"تقرير_الفجوة_التغطية")}async function po(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo;async function u(){const C=[];let R=0;const v=1e3;for(;;){let j=K.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(R,R+v-1);i&&(j=j.gte("created_at",i)),l&&(j=j.lte("created_at",l+"T23:59:59")),s&&(j=j.eq("campaign_round",s));const{data:d,error:h}=await j;if(h||!d||d.length===0||(C.push(...d),d.length<v)||(R+=v,C.length>=1e5))break}return C}const[b,N,_]=await Promise.allSettled([u(),K.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),m=b.status==="fulfilled"?b.value||[]:[],F=N.status==="fulfilled"?N.value.data||[]:[],M=_.status==="fulfilled"?_.value.data||[]:[],y=[{id:"polio_campaign",label:"حملة شلل الأطفال",icon:"💉",color:"#1565C0"},{id:"integrated_activity",label:"النشاط الإيصالي التكاملي",icon:"🏥",color:"#2E7D32"}].map(C=>{const R=F.filter(n=>n.campaign_type===C.id),v=R.map(n=>n.id),j=m.filter(n=>v.includes(n.form_id)),d=j.filter(n=>n.status==="submitted").length,h=j.filter(n=>n.status==="draft").length,p=j.filter(n=>n.gps_lat).length,r=j.filter(n=>{var x;return((x=n.photos)==null?void 0:x.length)>0}).length,o=new Set(j.map(n=>n.governorate_id).filter(Boolean)),g=M.map(n=>({name:n.name_ar,submissions:j.filter(x=>x.governorate_id===n.id).length,submitted:j.filter(x=>x.governorate_id===n.id&&x.status==="submitted").length}));return{...C,forms:R.length,totalSubs:j.length,submitted:d,draft:h,withGps:p,withPhotos:r,govsWithData:o.size,gpsRate:j.length>0?Math.round(p/j.length*100):0,photoRate:j.length>0?Math.round(r/j.length*100):0,submitRate:j.length>0?Math.round(d/j.length*100):0,govBreakdown:g}}),k=`
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
      ${je("تقرير مقارنة الحملات","مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي"+De(s))}

      ${y.map((C,R)=>`
        ${R===1?'<div class="vs-divider">VS</div>':""}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${C.color}">
            <span class="campaign-icon">${C.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${C.color}">${A(C.label)}</div>
              <div style="font-size:10px;color:${t.textMuted}">${C.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${P("الإرساليات",C.totalSubs,"📋",C.color)}
            ${P("مرسلة",C.submitted,"✅",t.success,`${C.submitRate}%`)}
            ${P("مسودة",C.draft,"📝",t.warning)}
            ${P("GPS",`${C.gpsRate}%`,"📍",t.info)}
            ${P("صور",`${C.photoRate}%`,"📷","#00897B")}
            ${P("محافظات",`${C.govsWithData}/${M.length}`,"🏛️",C.color)}
          </div>
          ${ie(["#","المحافظة","الإرساليات","مرسلة","معدل الإرسال"],C.govBreakdown.sort((v,j)=>j.submissions-v.submissions).map((v,j)=>[`${j+1}`,A(v.name),`<span class="num">${v.submissions}</span>`,`<span class="num">${v.submitted}</span>`,`<span class="num">${v.submissions>0?Math.round(v.submitted/v.submissions*100):0}%</span>`]))}
        </div>
      `).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(k,"تقرير_مقارنة_الحملات")}async function mo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date,l=i.toISOString().split("T")[0],u=new Date(i.getTime()-864e5).toISOString().split("T")[0],[b,N,_]=await Promise.allSettled([at(K.from("form_submissions").select("*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)").gte("created_at",`${l}T00:00:00`).is("deleted_at",null).order("created_at",{ascending:!1}),s),K.from("profiles").select("*").is("deleted_at",null),K.from("notifications").select("*").gte("created_at",`${l}T00:00:00`).order("created_at",{ascending:!1})]),m=b.status==="fulfilled"?b.value.data||[]:[],F=N.status==="fulfilled"?N.value.data||[]:[],M=_.status==="fulfilled"?_.value.data||[]:[],[S]=await Promise.allSettled([at(K.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",`${u}T00:00:00`).lt("created_at",`${l}T00:00:00`).is("deleted_at",null),s)]),y=S.status==="fulfilled"&&S.value.count||0,k=m.filter(r=>r.status==="submitted").length,C=m.filter(r=>r.status==="draft").length,R=new Set(m.map(r=>r.submitted_by)).size,v=F.filter(r=>r.is_active).length,j=Array.from({length:24},(r,o)=>({hour:`${o.toString().padStart(2,"0")}:00`,count:m.filter(g=>new Date(g.created_at).getHours()===o).length})),d=m.length-y,h=y>0?Math.round(d/y*100):m.length>0?100:0,p=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${Pe(i)}</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير النشاط اليومي",`نشاط اليوم — ${Pe(i)}${De(s)}`)}

      ${V("📊","مؤشرات اليوم")}
      <div class="kpi-grid">
        ${P("إرساليات اليوم",m.length,"📋",t.primary,`أمس: ${y} (${d>=0?"+":""}${h}%)`)}
        ${P("مرسلة",k,"✅",t.success)}
        ${P("مسودة",C,"📝",t.warning)}
        ${P("مشرفين نشطين",R,"👥","#7B1FA2",`من ${v}`)}
        ${P("إشعارات",M.length,"🔔",t.info)}
        ${P("مقارنة بأمس",`${d>=0?"📈":"📉"} ${Math.abs(h)}%`,d>=0?"📈":"📉",d>=0?t.success:t.accent)}
      </div>

      ${V("⏰","النشاط بالساعة")}
      ${ie(["الساعة","عدد الإرساليات","النشاط"],j.filter(r=>r.count>0).map(r=>[`<strong>${r.hour}</strong>`,`<span class="num">${r.count}</span>`,"█".repeat(Math.min(r.count,20))]))}

      ${m.length>0?`
        ${V("📋","إرساليات اليوم",`${m.length} إرسالية`)}
        ${ie(["#","الوقت","النموذج","المُرسل","المحافظة","الحالة"],m.slice(0,30).map((r,o)=>{var g,n,x;return[`${o+1}`,new Date(r.created_at).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"}),A(((g=r.forms)==null?void 0:g.title_ar)||"—"),A(((n=r.profiles)==null?void 0:n.full_name)||"—"),A(((x=r.governorates)==null?void 0:x.name_ar)||"—"),`<span class="status-badge ${r.status==="submitted"?"status-ready":"status-partial"}">${r.status==="submitted"?"مرسلة":"مسودة"}</span>`]}))}
      `:`
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${R<v?`
        ${V("🚨","مشرفين لم يرسلوا اليوم")}
        <div class="alert-box alert-danger">
          ${v-R} من ${v} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      `:`
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${Te()}
    </body>
    </html>
  `;Ce(p,`تقرير_النشاط_اليومي_${l}`)}async function ho(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo;async function u(){const p=[];let r=0;const o=1e3;for(;;){let g=K.from("form_submissions").select("*, forms(title_ar, schema), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(r,r+o-1);i&&(g=g.gte("created_at",i)),l&&(g=g.lte("created_at",l+"T23:59:59")),s&&(g=g.eq("campaign_round",s));const{data:n,error:x}=await g;if(x||!n||n.length===0||(p.push(...n),n.length<o)||(r+=o,p.length>=1e5))break}return p}const[b,N]=await Promise.allSettled([u(),K.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),_=b.status==="fulfilled"?b.value||[]:[],m=N.status==="fulfilled"?N.value.data||[]:[],F=_.length,M=_.filter(p=>p.gps_lat).length,S=F-M,y=_.filter(p=>{var r;return((r=p.photos)==null?void 0:r.length)>0}).length,k=F-y,C=_.filter(p=>p.notes&&p.notes.trim()).length,R=_.filter(p=>p.governorate_id).length,v=F-R,j=m.map(p=>{const r=_.filter(E=>E.form_id===p.id),o=r.filter(E=>E.gps_lat).length,g=r.filter(E=>{var c;return((c=E.photos)==null?void 0:c.length)>0}).length,n=r.filter(E=>E.governorate_id).length;let x={};try{x=typeof p.schema=="string"?JSON.parse(p.schema):p.schema}catch(E){console.warn("[data-quality] Failed to parse form schema:",E)}const f=((x==null?void 0:x.sections)||[]).flatMap(E=>E.fields||[]).map(E=>{const c=E.name||E.id||E.label_ar,L=r.filter($=>{var z;const D=(z=$.data)==null?void 0:z[c];return D!=null&&D!==""&&D!==0}).length;return{label:E.label_ar||c,type:E.type,filled:L,total:r.length,rate:r.length>0?Math.round(L/r.length*100):0}});return{name:p.title_ar,total:r.length,gpsRate:r.length>0?Math.round(o/r.length*100):0,photoRate:r.length>0?Math.round(g/r.length*100):0,govRate:r.length>0?Math.round(n/r.length*100):0,fieldCompleteness:f,overallQuality:r.length>0?Math.round((o+g+n)/(r.length*3)*100):0}});function d(p){return p>=80?t.success:p>=50?t.warning:t.accent}const h=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير جودة البيانات","تحليل شامل لاكتمال وجودة البيانات المدخلة"+De(s))}

      ${V("📊","مؤشرات جودة البيانات")}
      <div class="kpi-grid">
        ${P("إجمالي الإرساليات",F,"📋",t.primary)}
        ${P("مع GPS",`${Math.round(M/F*100)}%`,"📍",d(Math.round(M/F*100)),`${M}/${F}`)}
        ${P("مع صور",`${Math.round(y/F*100)}%`,"📷",d(Math.round(y/F*100)),`${y}/${F}`)}
        ${P("مع محافظة",`${Math.round(R/F*100)}%`,"🏛️",d(Math.round(R/F*100)),`${R}/${F}`)}
        ${P("بلا GPS",S,"⚠️",t.accent)}
        ${P("بلا صور",k,"⚠️",t.accent)}
        ${P("بلا محافظة",v,"⚠️",t.accent)}
        ${P("ملاحظات مكتوبة",C,"📝",t.info)}
      </div>

      ${S>0?`<div class="alert-box alert-warning">⚠️ ${S} إرسالية (${Math.round(S/F*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>`:""}
      ${v>0?`<div class="alert-box alert-danger">🚨 ${v} إرسالية (${Math.round(v/F*100)}%) بلا محافظة — يجب إصلاحها</div>`:""}

      ${V("📝","جودة البيانات حسب النموذج")}
      ${ie(["#","النموذج","الإرساليات","GPS","صور","محافظة","الجودة الإجمالية"],j.map((p,r)=>[`${r+1}`,`<strong>${A(p.name)}</strong>`,`<span class="num">${p.total}</span>`,`<span class="num" style="color:${d(p.gpsRate)}">${p.gpsRate}%</span>`,`<span class="num" style="color:${d(p.photoRate)}">${p.photoRate}%</span>`,`<span class="num" style="color:${d(p.govRate)}">${p.govRate}%</span>`,`<span class="score-badge" style="background:${d(p.overallQuality)}">${p.overallQuality}%</span>`]))}

      ${j.filter(p=>p.fieldCompleteness.length>0).map(p=>`
        ${V("🔤",`تحليل حقول: ${p.name}`)}
        ${ie(["الحقل","النسبة","مُملأ/الإجمالي"],p.fieldCompleteness.sort((r,o)=>r.rate-o.rate).map(r=>[A(r.label),`<span style="color:${d(r.rate)};font-weight:700">${r.rate}%</span>`,`<span class="num">${r.filled}/${r.total}</span>`]))}
        ${p.fieldCompleteness.map(r=>Je(r.label,r.filled,r.total,d(r.rate))).join("")}
      `).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(h,"تقرير_جودة_البيانات")}async function fo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo,u=e==null?void 0:e.governorateId,b=r=>(i&&(r=r.gte("created_at",i)),l&&(r=r.lte("created_at",l+"T23:59:59")),u&&u!=="all"&&(r=r.eq("governorate_id",u)),r),[N,_]=await Promise.allSettled([b(K.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null)).order("created_at",{ascending:!1}),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),m=N.status==="fulfilled"?N.value.data||[]:[],F=_.status==="fulfilled"?_.value.data||[]:[],M=m.filter(r=>!r.is_resolved),S=m.filter(r=>r.is_resolved),y=M.filter(r=>r.severity==="critical"),k=M.filter(r=>r.severity==="high"),C=M.filter(r=>r.severity==="medium"),R=M.filter(r=>r.severity==="low"),v=F.map(r=>{const o=m.filter(n=>n.governorate_id===r.id),g=o.filter(n=>!n.is_resolved);return{name:r.name_ar,total:o.length,unresolved:g.length,critical:g.filter(n=>n.severity==="critical").length,high:g.filter(n=>n.severity==="high").length}}).filter(r=>r.total>0).sort((r,o)=>o.unresolved-r.unresolved),j={};M.forEach(r=>{const o=r.item_category||"أخرى";j[o]=(j[o]||0)+1});const d={critical:"🔴 حرج",high:"🟠 عالي",medium:"🟡 متوسط",low:"🟢 منخفض"},h={critical:t.accent,high:"#E65100",medium:t.warning,low:t.success},p=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير النواقص والاحتياجات","تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات"+De(s))}

      ${V("📊","ملخص النواقص")}
      <div class="kpi-grid">
        ${P("إجمالي النواقص",m.length,"📦",t.primary)}
        ${P("غير محلولة",M.length,"⚠️",t.accent)}
        ${P("محلولة",S.length,"✅",t.success)}
        ${P("حرجة",y.length,"🚨",t.accent)}
        ${P("عالية",k.length,"🟠","#E65100")}
        ${P("متوسطة",C.length,"🟡",t.warning)}
        ${P("منخفضة",R.length,"🟢",t.success)}
        ${P("معدل الحل",`${m.length>0?Math.round(S.length/m.length*100):0}%`,"📈",t.info)}
      </div>

      ${y.length>0?`
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${y.length} نقص حرج يحتاج تدخل فوري!
        </div>
      `:""}

      ${M.length>0?`
        ${V("⚠️","النواقص غير المحلولة",`${M.length} نقص`)}
        ${ie(["#","النقص","الفئة","المحافظة","الخطورة","الكمية","المُبلّغ","التاريخ"],M.map((r,o)=>{var g,n;return[`${o+1}`,`<strong>${A(r.item_name)}</strong>`,A(r.item_category||"—"),A(((g=r.governorates)==null?void 0:g.name_ar)||"—"),`<span style="color:${h[r.severity]||t.textMuted};font-weight:700">${d[r.severity]||r.severity}</span>`,`<span class="num">${r.quantity_needed||"—"}</span>`,A(((n=r.profiles)==null?void 0:n.full_name)||"—"),new Date(r.created_at).toLocaleDateString("ar-SA")]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${v.length>0?`
        ${V("🏛️","النواقص حسب المحافظة")}
        ${ie(["#","المحافظة","الإجمالي","غير محلولة","حرجة","عالية"],v.map((r,o)=>[`${o+1}`,`<strong>${A(r.name)}</strong>`,`<span class="num">${r.total}</span>`,`<span class="num" style="color:${r.unresolved>0?t.accent:t.success}">${r.unresolved}</span>`,`<span class="num" style="color:${t.accent}">${r.critical}</span>`,`<span class="num" style="color:#E65100">${r.high}</span>`]))}
      `:""}

      ${Object.keys(j).length>0?`
        ${V("📂","النواقص حسب الفئة")}
        ${ie(["الفئة","العدد"],Object.entries(j).sort((r,o)=>o[1]-r[1]).map(([r,o])=>[A(r),`<span class="num">${o}</span>`]))}
      `:""}

      ${S.length>0?`
        <div class="page-break"></div>
        ${V("✅","النواقص المحلولة",`${S.length} نقص`)}
        ${ie(["#","النقص","المحافظة","تاريخ الحل"],S.slice(0,20).map((r,o)=>{var g;return[`${o+1}`,A(r.item_name),A(((g=r.governorates)==null?void 0:g.name_ar)||"—"),r.resolved_at?new Date(r.resolved_at).toLocaleDateString("ar-SA"):"—"]}))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(p,"تقرير_النواقص_التفصيلي")}async function vo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date,l=new Date(i.getTime()-7*864e5),u=new Date(i.getTime()-14*864e5),[b,N,_,m]=await Promise.allSettled([at(K.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",l.toISOString()).is("deleted_at",null),s),at(K.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",u.toISOString()).lt("created_at",l.toISOString()).is("deleted_at",null),s),K.from("profiles").select("*").is("deleted_at",null),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),F=b.status==="fulfilled"?b.value.data||[]:[],M=N.status==="fulfilled"&&N.value.count||0,S=_.status==="fulfilled"?_.value.data||[]:[],y=m.status==="fulfilled"?m.value.data||[]:[],k=F.filter(o=>o.status==="submitted").length,C=F.filter(o=>o.status==="draft").length,R=new Set(F.map(o=>o.submitted_by)).size,v=new Set(F.map(o=>o.governorate_id).filter(Boolean)).size,j=F.length-M,d=M>0?Math.round(j/M*100):0,h=Array.from({length:7},(o,g)=>{const n=new Date(l.getTime()+g*864e5),x=n.toISOString().split("T")[0],I=n.toLocaleDateString("ar-SA",{weekday:"long"}),f=F.filter(E=>E.created_at.startsWith(x));return{day:I,date:x,count:f.length,submitted:f.filter(E=>E.status==="submitted").length}}),p=y.map(o=>({name:o.name_ar,count:F.filter(g=>g.governorate_id===o.id).length})).sort((o,g)=>g.count-o.count).filter(o=>o.count>0),r=`
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("التقرير الأسبوعي",`ملخص الأسبوع — ${Pe(l)} إلى ${Pe(i)}${De(s)}`)}

      ${V("📊","مؤشرات الأسبوع")}
      <div class="kpi-grid">
        ${P("إرساليات الأسبوع",F.length,"📋",t.primary,`${j>=0?"+":""}${d}% vs الأسبوع السابق`)}
        ${P("مرسلة",k,"✅",t.success,`${F.length>0?Math.round(k/F.length*100):0}%`)}
        ${P("مسودة",C,"📝",t.warning)}
        ${P("مشرفين نشطين",R,"👥","#7B1FA2",`من ${S.filter(o=>o.is_active).length}`)}
        ${P("محافظات نشطة",v,"🏛️",t.info,`من ${y.length}`)}
        ${P("متوسط يومي",Math.round(F.length/7),"📊",t.primary)}
      </div>

      ${V("📅","النشاط اليومي")}
      ${ie(["اليوم","التاريخ","الإرساليات","مرسلة"],h.map(o=>[o.day,o.date,`<span class="num">${o.count}</span>`,`<span class="num">${o.submitted}</span>`]))}

      ${p.length>0?`
        ${V("🏛️","أداء المحافظات هذا الأسبوع")}
        ${p.map(o=>Je(o.name,o.count,Math.max(...p.map(g=>g.count),1),t.primary)).join("")}
      `:""}

      ${j<0?`
        <div class="alert-box alert-warning">
          ⚠️ انخفاض الإرساليات بنسبة ${Math.abs(d)}% مقارنة بالأسبوع السابق. يجب متابعة المشرفين.
        </div>
      `:j>0?`
        <div class="alert-box alert-success">
          ✅ زيادة الإرساليات بنسبة ${d}% مقارنة بالأسبوع السابق. أداء ممتاز!
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(r,"التقرير_الأسبوعي")}async function bo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=e==null?void 0:e.dateFrom,l=e==null?void 0:e.dateTo,u=R=>(i&&(R=R.gte("created_at",i)),l&&(R=R.lte("created_at",l+"T23:59:59")),R),[b,N]=await Promise.allSettled([K.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("last_login",{ascending:!1}),u(at(K.from("form_submissions").select("submitted_by, created_at").is("deleted_at",null),s))]),_=b.status==="fulfilled"?b.value.data||[]:[],m=N.status==="fulfilled"?N.value.data||[]:[],F={admin:"🔴 مدير النظام",central:"🟣 مركزي",governorate:"🔵 محافظة",district:"🟢 مديرية",data_entry:"⚪ إدخال بيانات"},M=_.map(R=>{const v=m.filter(h=>h.submitted_by===R.id),j=v.length>0?v.sort((h,p)=>new Date(p.created_at).getTime()-new Date(h.created_at).getTime())[0].created_at:null,d=R.last_login?Math.floor((Date.now()-new Date(R.last_login).getTime())/864e5):999;return{...R,totalSubs:v.length,lastSub:j,daysSinceLogin:d}}),S=M.filter(R=>R.is_active&&R.daysSinceLogin<=7),y=M.filter(R=>R.is_active&&R.daysSinceLogin>30),k=M.filter(R=>!R.last_login),C=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${Ee()}
    </head>
    <body>
      ${je("تقرير نشاط المستخدمين","تحليل شامل لنشاط ودخول المستخدمين"+De(s))}

      ${V("📊","ملخص المستخدمين")}
      <div class="kpi-grid">
        ${P("إجمالي المستخدمين",_.length,"👥",t.primary)}
        ${P("نشطين",S.length,"🟢",t.success)}
        ${P("خاملين (+30 يوم)",y.length,"🟡",t.warning)}
        ${P("لم يدخلوا أبداً",k.length,"🔴",t.accent)}
      </div>

      ${V("👥","قائمة المستخدمين",`${_.length} مستخدم`)}
      ${ie(["#","الاسم","البريد","الدور","المحافظة/المديرية","الإرساليات","آخر دخول","الحالة"],M.map((R,v)=>{var j,d;return[`${v+1}`,`<strong>${A(R.full_name)}</strong>`,A(R.email),F[R.role]||R.role,A(((j=R.governorates)==null?void 0:j.name_ar)||((d=R.districts)==null?void 0:d.name_ar)||"—"),`<span class="num">${R.totalSubs}</span>`,R.last_login?new Date(R.last_login).toLocaleDateString("ar-SA"):"لم يدخل",R.is_active?R.daysSinceLogin<=7?"🟢 نشط":R.daysSinceLogin<=30?"🟡 خامل":"🔴 متوقف":"⚫ معطل"]}))}

      ${k.length>0?`
        ${V("🚨","مستخدمون لم يدخلوا أبداً")}
        <div class="alert-box alert-warning">
          ${k.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(C,"تقرير_نشاط_المستخدمين")}t.accent,t.warning,t.success;t.success,t.warning,t.accent,t.info;async function xo(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date;async function l(w,O,G){const H=[];let q=0;const ae=1e3;for(;;){let X=K.from(w).select(O).is("deleted_at",null).order("created_at",{ascending:!1}).range(q,q+ae-1);G&&(X=G(X));const{data:de,error:fe}=await X;if(fe||!de||de.length===0||(H.push(...de),de.length<ae)||(q+=ae,H.length>=1e5))break}return H}const[u,b,N,_,m,F]=await Promise.allSettled([l("form_submissions",`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, phone),
      governorates(id, name_ar),
      districts(id, name_ar)
    `,w=>s?w.eq("campaign_round",s):w),K.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null).order("created_at",{ascending:!1}),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),K.from("districts").select("*").eq("is_active",!0).is("deleted_at",null),K.from("profiles").select("*").is("deleted_at",null),l("audit_logs","*, profiles(full_name)",w=>w.in("action",["create","update","delete"]))]),M=u.status==="fulfilled"?u.value||[]:[],S=b.status==="fulfilled"?b.value.data||[]:[],y=N.status==="fulfilled"?N.value.data||[]:[],k=_.status==="fulfilled"?_.value.data||[]:[],C=m.status==="fulfilled"?m.value.data||[]:[],R=F.status==="fulfilled"?F.value||[]:[];let v=M;e!=null&&e.dateFrom&&(v=v.filter(w=>w.created_at>=e.dateFrom)),e!=null&&e.dateTo&&(v=v.filter(w=>w.created_at<=e.dateTo+"T23:59:59")),e!=null&&e.governorateId&&e.governorateId!=="all"&&(v=v.filter(w=>{var O,G;return((G=(O=w.governorates)==null?void 0:O[0])==null?void 0:G.id)||e.governorateId===""}));const j=new Set(v.map(w=>{var O,G;return((G=(O=w.governorates)==null?void 0:O[0])==null?void 0:G.id)||""}).filter(Boolean)),d=y.filter(w=>!j.has(w.id)),h=new Set(v.map(w=>{var O,G;return((G=(O=w.districts)==null?void 0:O[0])==null?void 0:G.id)||""}).filter(Boolean)),p=k.filter(w=>!h.has(w.id)),r=["data_entry","district","governorate"],o=C.filter(w=>r.includes(w.role)&&w.is_active);i.toDateString();const g=new Set(v.filter(w=>new Date(w.created_at).getTime()>i.getTime()-7*864e5).map(w=>{var O,G;return((G=(O=w.profiles)==null?void 0:O[0])==null?void 0:G.full_name)||""})),n=o.filter(w=>!g.has(w.id)),x=y.map(w=>{const O=v.filter(ae=>{var X,de;return((de=(X=ae.governorates)==null?void 0:X[0])==null?void 0:de.id)||w.id===""}),G=O.filter(ae=>ae.status==="submitted").length,H=O.filter(ae=>ae.status==="draft").length,q=O.length;return{gov:w,total:q,submitted:G,draft:H,completionRate:q>0?Math.round(G/q*100):0,draftRate:q>0?Math.round(H/q*100):0}}).filter(w=>w.total>0),I=v.filter(w=>w.gps_lat&&w.gps_lng),f=v.length>0?Math.round(I.length/v.length*100):0,E=v.filter(w=>w.photos&&w.photos.length>0),c=v.length>0?Math.round(E.length/v.length*100):0,L=S.filter(w=>!w.is_resolved),$=L.filter(w=>w.severity==="critical"),D=L.filter(w=>w.severity==="high"),z=[];v.forEach(w=>{var G,H,q,ae,X,de;const O=[];(!w.gps_lat||!w.gps_lng)&&O.push("بدون إحداثيات GPS"),(!w.photos||w.photos.length===0)&&O.push("بدون صور"),w.status==="draft"&&O.push("مسودة غير مُرسلة"),O.length>0&&z.push({gov:((H=(G=w.governorates)==null?void 0:G[0])==null?void 0:H.name_ar)||"—",dist:((ae=(q=w.districts)==null?void 0:q[0])==null?void 0:ae.name_ar)||"—",team:((de=(X=w.profiles)==null?void 0:X[0])==null?void 0:de.full_name)||"—",issue:O.join("، "),severity:w.status==="draft"?"medium":"low",gps:w.gps_lat&&w.gps_lng?`${w.gps_lat.toFixed(4)}, ${w.gps_lng.toFixed(4)}`:"غير متوفر"})}),k.map(w=>{const O=v.filter(G=>{var H,q;return((q=(H=G.districts)==null?void 0:H[0])==null?void 0:q.id)||w.id===""});return{dist:w,gov:y.find(G=>{var H,q;return G.id===((q=(H=w.governorates)==null?void 0:H[0])==null?void 0:q.id)||""}),total:O.length,submitted:O.filter(G=>G.status==="submitted").length}}).filter(w=>w.total===0||w.submitted===0);const W=`
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
      ${je("تقرير التحديات والصعوبات","تحليل شامل — التحديات، الإجراءات المتخذة، التوصيات"+De(s),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${P("إجمالي الإرساليات",v.length,"📋",t.primary)}
        ${P("محافظات بدون تغطية",d.length,"🏛️",d.length>0?t.accent:t.success)}
        ${P("مديريات بدون تغطية",p.length,"📍",p.length>0?t.accent:t.success)}
        ${P("مشرفين غير نشطين",n.length,"👥",n.length>0?t.warning:t.success)}
        ${P("نواقص حرجة",$.length,"🚨",$.length>0?t.accent:t.success)}
        ${P("معدل GPS",`${f}%`,"📡",f>=80?t.success:t.warning)}
        ${P("معدل الصور",`${c}%`,"📷",c>=80?t.success:t.warning)}
        ${P("معدل الإنجاز",`${x.length>0?Math.round(x.reduce((w,O)=>w+O.completionRate,0)/x.length):0}%`,"🎯",t.info)}
      </div>

      <!-- ═══ 1. التحديات الجغرافية ═══ -->
      ${d.length>0||p.length>0?`
        ${V("🗺️","التحديات الجغرافية — فجوات التغطية")}

        ${d.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">⚠️ محافظات بدون أي تغطية</div>
              <span class="tag tag-status">${d.length} محافظة</span>
            </div>
            <div class="challenge-body">
              <p>المحافظات التالية لم تسجل أي إرساليات في الفترة المحددة:</p>
              <div style="margin-top: 8px;">
                ${d.map(w=>`<span class="tag tag-gov">${A(w.name_ar)}</span>`).join(" ")}
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

        ${p.length>0?`
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">📍 مديريات بدون تغطية</div>
              <span class="tag tag-status">${p.length} مديرية</span>
            </div>
            <div class="challenge-body">
              <p>المديريات التالية لم تسجل أي إرساليات:</p>
              <div style="margin-top: 8px; max-height: 200px; overflow-y: auto;">
                ${p.slice(0,20).map(w=>{const O=y.find(G=>{var H,q;return G.id===((q=(H=w.governorates)==null?void 0:H[0])==null?void 0:q.id)||""});return`<span class="tag tag-dist">${A(w.name_ar)}</span> <span class="tag tag-gov">${A((O==null?void 0:O.name_ar)||"—")}</span>`}).join("<br>")}
                ${p.length>20?`<p style="color:${t.textMuted};font-size:10px;margin-top:4px;">... و ${p.length-20} مديرية أخرى</p>`:""}
              </div>
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 2. التحديات اللوجستية — النواقص ═══ -->
      ${L.length>0?`
        ${V("📦","التحديات اللوجستية — النواقص المعلقة")}

        ${$.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">🚨 نواقص حرجة — تحتاج تدخل فوري</div>
              <span class="tag tag-status">${$.length} نقص حرج</span>
            </div>
            <div class="challenge-body">
              ${ie(["النقص","الفئة","المحافظة","المديرية","المطلوب","المتاح","المُبلّغ"],$.map(w=>{var O,G,H,q,ae,X;return[`<strong>${A(w.item_name)}</strong>`,A(w.item_category||"—"),A(((G=(O=w.governorates)==null?void 0:O[0])==null?void 0:G.name_ar)||"—"),A(((q=(H=w.districts)==null?void 0:H[0])==null?void 0:q.name_ar)||"—"),`${w.quantity_needed||"—"}`,`${w.quantity_available||0}`,A(((X=(ae=w.profiles)==null?void 0:ae[0])==null?void 0:X.full_name)||"—")]}))}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> رفع طلب عاجل لهيئة التوريدات الطبية. التواصل مع المنظمات الشريكة (UNICEF, WHO) لتوفير النواقص الحرجة. تفعيل نظام الإقراض المؤقت بين المحافظات.
              </div>
              <div class="recommendation-box">
                <strong>💡 التوصية:</strong> إنشاء مخزون طوارئ استراتيجي. تفعيل نظام الإنذار المبكر للنواقص. مراجعة دورة التوريد وتحديد العوائق.
              </div>
            </div>
          </div>
        `:""}

        ${D.length>0?`
          <div class="challenge-card severity-high">
            <div class="challenge-header">
              <div class="challenge-title">🟠 نواقص عالية الأولوية</div>
              <span class="tag tag-status">${D.length} نقص</span>
            </div>
            <div class="challenge-body">
              ${ie(["النقص","المحافظة","المطلوب","المتاح","الفرق"],D.slice(0,10).map(w=>{var O,G;return[A(w.item_name),A(((G=(O=w.governorates)==null?void 0:O[0])==null?void 0:G.name_ar)||"—"),`${w.quantity_needed||"—"}`,`${w.quantity_available||0}`,`<span style="color:${t.accent};font-weight:700">${Math.max(0,(w.quantity_needed||0)-(w.quantity_available||0))}</span>`]}))}
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 3. التحديات البشرية ═══ -->
      ${n.length>0?`
        ${V("👥","التحديات البشرية — المشرفين غير النشطين")}
        <div class="challenge-card severity-medium">
          <div class="challenge-header">
            <div class="challenge-title">⚠️ مشرفون لم يرسلوا بيانات منذ أكثر من 7 أيام</div>
            <span class="tag tag-status">${n.length} مشرف</span>
          </div>
          <div class="challenge-body">
            ${ie(["المشرف","الدور","المحافظة/المديرية","الهاتف","آخر دخول"],n.slice(0,15).map(w=>{var O,G,H,q;return[`<strong>${A(w.full_name)}</strong>`,w.role==="data_entry"?"إدخال بيانات":w.role==="district"?"مديرية":"محافظة",A(((G=(O=w.governorates)==null?void 0:O[0])==null?void 0:G.name_ar)||((q=(H=w.districts)==null?void 0:H[0])==null?void 0:q.name_ar)||"—"),w.phone||"—",w.last_login?new Date(w.last_login).toLocaleDateString("ar-SA"):"لم يدخل"]}))}
            ${n.length>15?`<p style="color:${t.textMuted};font-size:10px;margin-top:8px;">... و ${n.length-15} مشرف آخر</p>`:""}
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
      ${V("📊","تحديات جودة البيانات")}

      <div class="challenge-card severity-${f<80?"high":"low"}">
        <div class="challenge-header">
          <div class="challenge-title">📡 تغطية نظام تحديد المواقع (GPS)</div>
          <span class="tag tag-gps">${f}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${Je("إحداثيات GPS",I.length,v.length,f>=80?t.success:f>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${I.length} من ${v.length} إرسالية تحتوي إحداثيات GPS
          </p>
          ${f<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل GPS الإجباري في التطبيق. تدريب المشرفين على استخدام نظام تحديد المواقع. مراجعة إعدادات الأجهزة.
            </div>
          `:""}
        </div>
      </div>

      <div class="challenge-card severity-${c<80?"high":"low"}">
        <div class="challenge-header">
          <div class="challenge-title">📷 تغطية الصور الميدانية</div>
          <span class="tag tag-gps">${c}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${Je("صور مرفقة",E.length,v.length,c>=80?t.success:c>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${E.length} من ${v.length} إرسالية تحتوي صور
          </p>
          ${c<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل رفع الصور الإجباري. توفير كاميرات للمشرفين. تبسيط عملية رفع الصور.
            </div>
          `:""}
        </div>
      </div>

      <!-- ═══ 5. تحديات الإنجاز ═══ -->
      ${x.filter(w=>w.draftRate>30).length>0?`
        ${V("📝","تحديات الإنجاز — محافظات بنسب مسودات عالية")}
        ${x.filter(w=>w.draftRate>30).map(w=>`
          <div class="challenge-card severity-medium">
            <div class="challenge-header">
              <div class="challenge-title">📝 ${A(w.gov.name_ar)} — نسبة المسودات ${w.draftRate}%</div>
              <span class="tag tag-gov">${w.total} إرسالية</span>
            </div>
            <div class="challenge-body">
              <div style="display:flex;gap:16px;margin-bottom:8px;">
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مرسلة:</span>
                  <span style="font-weight:700;color:${t.success}">${w.submitted}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مسودة:</span>
                  <span style="font-weight:700;color:${t.warning}">${w.draft}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">نسبة الإنجاز:</span>
                  <span style="font-weight:700;color:${w.completionRate>=70?t.success:t.accent}">${w.completionRate}%</span>
                </div>
              </div>
              ${Je("نسبة الإرسال",w.submitted,w.total,w.completionRate>=70?t.success:t.warning)}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> متابعة مشرفي ${A(w.gov.name_ar)} لاعتماد المسودات المعلقة. تحديد الأسباب (مشاكل تقنية، نقص تدريب، ضعف إنترنت).
              </div>
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ 6. أحداث ميدانية — من سجل التدقيق ═══ -->
      ${R.length>0?`
        ${V("📋","أحدث ميدانية مسجلة")}
        ${ie(["التاريخ","المستخدم","الإجراء","الجدول","IP"],R.slice(0,15).map(w=>{var O,G;return[new Date(w.created_at).toLocaleDateString("ar-SA"),A(((G=(O=w.profiles)==null?void 0:O[0])==null?void 0:G.full_name)||"النظام"),w.action==="create"?"✅ إنشاء":w.action==="update"?"📝 تعديل":"🗑️ حذف",w.table_name==="form_submissions"?"إرساليات":w.table_name==="supply_shortages"?"نواقص":w.table_name,w.ip_address||"—"]}))}
      `:""}

      <!-- ═══ 7. ملخص التوصيات ═══ -->
      ${V("💡","ملخص التوصيات والإجراءات الاستراتيجية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="recommendation-box">
          <strong>🎯 التغطية الجغرافية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${d.length>0?`<li>تفعيل ${d.length} محافظة غير نشطة</li>`:""}
            ${p.length>0?`<li>تغطية ${p.length} مديرية فارغة</li>`:""}
            <li>نشر فرق دعم ميداني للمناطق النائية</li>
            <li>تفعيل حملات التحصين المتنقلة</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>👥 الموارد البشرية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${n.length>0?`<li>متابعة ${n.length} مشرف غير نشط</li>`:""}
            <li>برامج تدريب مكثفة</li>
            <li>تفعيل نظام الحوافز</li>
            <li>توفير أجهزة وإنترنت</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📦 اللوجستيات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${$.length>0?`<li>معالجة ${$.length} نقص حرج فوراً</li>`:""}
            <li>إنشاء مخزون طوارئ</li>
            <li>تحسين سلسلة التوريد</li>
            <li>شراكات مع المنظمات الدولية</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>📊 جودة البيانات:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${f<80?`<li>رفع معدل GPS من ${f}% إلى 90%</li>`:""}
            ${c<80?`<li>رفع معدل الصور من ${c}% إلى 85%</li>`:""}
            <li>مراجعة وإعتماد المسودات المعلقة</li>
            <li>تفعيل المزامنة التلقائية</li>
          </ul>
        </div>
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(W,"تقرير_التحديات_والصعوبات")}const et={team_info:{title:"أ — معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"],target:100},work_environment:{title:"ب — بيئة العمل والتنسيق",icon:"🏥",fields:["suitable_location","community_coordination","has_speaker","has_transport","previous_visit"],target:100},records_docs:{title:"ج — السجلات والوثائق",icon:"📋",fields:["complete_records","daily_work_forms","correct_data_entry","next_visit_noted"],target:100},vaccination_cards:{title:"د — بطاقات التحصين",icon:"💳",fields:["child_vaccination_cards","women_vaccination_cards"],target:100},service_quality:{title:"هـ — جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","respiratory_rate_check","muac_measurement","ors_provision","clean_delivery_kit","nutrition_assessment"],target:100},vitamins_referral:{title:"و — الفيتامينات والإحالة",icon:"💊",fields:["vitamin_a_children","vitamin_a_women","facility_referral","correct_medication","nutrition_counseling"],target:100},vaccine_handling:{title:"ز — التعامل مع اللقاحات",icon:"💉",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"],target:100},supplies_equipment:{title:"ح — الإمدادات والمعدات",icon:"📦",fields:["family_planning_available","folic_iron_stock","fetal_stethoscope","bp_device","muac_tape","height_board","thermometer","scale","daily_supply_tracking"],target:100},catch_up_policy:{title:"ط — سياسة الالتحاق بالركب",icon:"🎯",fields:["has_vaccine_carrier","vaccines_sufficient","correct_vaccine_site","catch_up_knowledge","catch_up_training","catch_up_2to5_registration","team_target_knowledge"],target:100},defaulter_tracking:{title:"ي — تتبع المتخلفين",icon:"🔍",fields:["has_defaulter_mechanism","has_previous_vaccination_records"],target:95},aefi:{title:"ك — الآثار الجانبية",icon:"⚠️",fields:["aefi_knowledge","aefi_mothers_info"],target:100}},ia={has_activity_plan:"لدى الفريق خطة وخارطة القرى المستهدفة",has_doctor_or_trained:"أحد أعضاء الفريق طبيب أو فني مدرب",wearing_uniform:"يلتزم الفريق بلبس الزي (البالطو)",suitable_location:"المكان مناسب ويضمن الخصوصية",community_coordination:"تم التنسيق المسبق مع المجتمع",has_speaker:"يتوفر مع الفريق مكبر صوت",has_transport:"توجد وسيلة نقل مناسبة",previous_visit:"تمت زيارة الفريق من المستوى الأعلى",complete_records:"تتوفر سجلات مكتملة",daily_work_forms:"توجد استمارات العمل اليومي",correct_data_entry:"يتم تدوين البيانات بشكل صحيح",next_visit_noted:"يتم تدوين العودة للزيارة القادمة",child_vaccination_cards:"يتم صرف بطاقة تحصين للأطفال",women_vaccination_cards:"يتم صرف بطاقة تحصين للنساء",good_acceptance:"يوجد إقبال جيد على الخدمة",safe_vaccination:"يتم ممارسة التطعيم الآمن",respiratory_rate_check:"يتم احتساب سرعة التنفس",muac_measurement:"يتم قياس محيط منتصف الذراع",ors_provision:"يتم إعطاء محلول الإرواء",clean_delivery_kit:"يتم تزويد الحوامل بعلبة الولادة النظيفة",nutrition_assessment:"يقوم العامل بتقييم مشاكل التغذية",vitamin_a_children:"يعطي فيتامين أ للأطفال وفق البروتوكول",vitamin_a_women:"يعطي فيتامين أ للنساء وفق البروتوكول",facility_referral:"يتم الإحالة للمرفق الصحي",correct_medication:"يتم إعطاء الأدوية بطريقة سليمة",nutrition_counseling:"يقوم العامل بالنصح حول التغذية",vaccine_disposal:"يتم التخلص من اللقاحات في الفترة المحددة",safety_box_usage:"يتم استخدام صندوق الأمان بصورة صحيحة",cold_chain_proper:"اللقاحات محفوظة بطريقة سليمة",family_planning_available:"تتوفر وسائل تنظيم الأسرة",folic_iron_stock:"لدى الفريق إمداد كافي من حمض الفوليك والحديد",fetal_stethoscope:"توجد لدى الفريق سماعة جنين",bp_device:"يتوفر سماعة فحص وجهاز ضغط الدم",muac_tape:"لدى الفريق أشرطة قياس محيط الذراع",height_board:"لدى الفريق أشرطة قياس الطول",thermometer:"لدى الفريق ترمومتر",scale:"يوجد مع الفريق ميزان",daily_supply_tracking:"يقوم الفريق بتدوين حركة الإمداد يومياً",has_vaccine_carrier:"لدى المطعم حافظة لقاح مع قوالب ثلج",vaccines_sufficient:"اللقاحات والمستلزمات متوفرة وكافية",correct_vaccine_site:"يتم إعطاء اللقاح في الموضع المناسب",catch_up_knowledge:"لدى العاملين معرفة بسياسة الالتحاق بالركب",catch_up_training:"تلقى العاملين التدريب الكافي",catch_up_2to5_registration:"يقوم المطعم بالتطعيم للأطفال 2-5 سنوات",team_target_knowledge:"لدى الفريق معرفة بالمستهدف",has_defaulter_mechanism:"يوجد آلية لتتبع المتخلفين",has_previous_vaccination_records:"يوجد سجل التطعيم للجولات السابقة",aefi_knowledge:"لدى العامل معرفة بالآثار الجانبية",aefi_mothers_info:"يقدم المطعم معلومات للأمهات حول الآثار"};function yo(e,s){const i=[s,`q_${s}`,`section_${s}`,s.toLowerCase()];for(const l of i){const u=e==null?void 0:e[l];if(u!=null&&u!==""){const b=Number(u);if(!isNaN(b))return b;if(u===!0||u==="نعم"||u==="yes")return 100;if(u===!1||u==="لا"||u==="no")return 0}}return null}function $o(e,s){return e===null?"⬜":e>=s?"✅":e>=s*.8?"⚠️":"🔴"}function da(e,s){return e===null?t.textMuted:e>=s?t.success:e>=s*.8?t.warning:t.accent}async function _o(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=await We({table:"form_submissions",select:"id, status, data, notes, gps_lat, gps_lng, photos, created_at, submitted_by, governorate_id, district_id, form_id",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:o=>(o=o.is("deleted_at",null),e!=null&&e.formId&&(o=o.eq("form_id",e.formId)),e!=null&&e.dateFrom&&(o=o.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(o=o.lte("created_at",e.dateTo+"T23:59:59")),s&&(o=o.eq("campaign_round",s)),o)}),[{data:l},{data:u},{data:b},{data:N}]=await Promise.all([K.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),K.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),K.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null),K.from("forms").select("id, title_ar, campaign_type").is("deleted_at",null)]),_=new Map;for(const o of N||[])_.set(o.id,o);const m=i.data.map(o=>({...o,forms:_.get(o.form_id)||null})),F=new Map;for(const o of l||[])F.set(o.id,o);const M=new Map;for(const o of u||[])M.set(o.id,o);const S=new Map;for(const o of b||[])S.set(o.id,o);let k=(m||[]).map(o=>{const g=o.submitted_by?F.get(o.submitted_by):null,n=o.governorate_id?M.get(o.governorate_id):null,x=o.district_id?S.get(o.district_id):null;return{...o,profiles:g?[g]:[],governorates:n?[n]:[],districts:x?[x]:[]}});e!=null&&e.governorateId&&e.governorateId!=="all"&&(k=k.filter(o=>o.governorate_id===e.governorateId));const C=k.map(o=>{const g=o.data||{},n={};let x=0,I=0,f=0;for(const[c,L]of Object.entries(et)){const $=L.fields.map(W=>{const w=yo(g,W),O=$o(w,L.target);return x++,w!==null&&w<L.target&&I++,w!==null&&(f+=w),{field:W,label:ia[W]||W,value:w,target:L.target,status:O}}),D=$.filter(W=>W.value!==null),z=D.length>0?Math.round(D.reduce((W,w)=>W+(w.value||0),0)/D.length):-1;n[c]={fields:$,avgScore:z,challengeCount:$.filter(W=>W.value!==null&&W.value<L.target).length}}const E=x>0?Math.round(f/x):0;return{sub:o,sectionResults:n,overallScore:E,totalChallenges:I,totalFields:x,hasData:Object.keys(g).length>0}}).filter(o=>o.hasData),R=C.length,v=R>0?Math.round(C.reduce((o,g)=>o+g.overallScore,0)/R):0,j={};for(const o of Object.keys(et)){const g=C.filter(n=>{var x;return((x=n.sectionResults[o])==null?void 0:x.avgScore)>=0});j[o]=g.length>0?Math.round(g.reduce((n,x)=>n+x.sectionResults[o].avgScore,0)/g.length):0}const d={};C.forEach(o=>{for(const[g,n]of Object.entries(o.sectionResults))n.fields.forEach(x=>{if(x.value!==null&&x.value<x.target){const I=`${g}||${x.field}`;d[I]=(d[I]||0)+1}})});const h=Object.entries(d).sort((o,g)=>g[1]-o[1]).slice(0,10).map(([o,g])=>{var I;const[n,x]=o.split("||");return{section:((I=et[n])==null?void 0:I.title)||n,field:ia[x]||x,count:g,pct:R>0?Math.round(g/R*100):0}}),p=[...C].sort((o,g)=>g.totalChallenges-o.totalChallenges).slice(0,15),r=`
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
      ${je("تقرير استمارة الإشراف — النشاط الإيصالي التكاملي","تحليل تحديات 8 أقسام إشرافية × 33 مؤشر"+De(s),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص الإشراف")}
      <div class="kpi-grid">
        ${P("إجمالي الاستمارات",R,"📋",t.primary)}
        ${P("متوسط الأداء العام",`${v}%`,"🎯",v>=90?t.success:v>=70?t.warning:t.accent)}
        ${P("استمارات ممتازة (90%+)",C.filter(o=>o.overallScore>=90).length,"⭐",t.success)}
        ${P("استمارات تحتاج تحسين (<70%)",C.filter(o=>o.overallScore<70).length,"⚠️",C.filter(o=>o.overallScore<70).length>0?t.accent:t.success)}
        ${P("متوسط التحديات/استمارة",R>0?(C.reduce((o,g)=>o+g.totalChallenges,0)/R).toFixed(1):"0","📉",t.warning)}
      </div>

      <!-- ═══ Section Averages — Radar-like view ═══ -->
      ${V("📈","متوسط أداء الأقسام الثمانية")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${Object.entries(et).map(([o,g])=>{const n=j[o];return`
            <div class="section-bar ${n>=90?"good":n>=70?"warning":"danger"}">
              <span class="section-icon">${g.icon}</span>
              <span class="section-name">${g.title}</span>
              <span class="section-score" style="color:${da(n,g.target)}">${n}%</span>
            </div>
          `}).join("")}
      </div>

      <!-- ═══ Top Challenges ═══ -->
      ${h.length>0?`
        ${V("🚨","أكثر التحديات تكراراً")}
        ${ie(["#","القسم","المؤشر","عدد الاستمارات","النسبة"],h.map((o,g)=>[`${g+1}`,A(o.section),`<strong>${A(o.field)}</strong>`,`${o.count}`,`<span style="color:${o.pct>50?t.accent:o.pct>25?t.warning:t.textMuted};font-weight:700">${o.pct}%</span>`]))}
      `:""}

      <!-- ═══ Worst Submissions — Detailed Cards ═══ -->
      ${p.length>0?`
        <div class="page-break"></div>
        ${V("📋","الاستمارات التي تحتاج متابعة",`${p.length} استمارة`)}

        ${p.map((o,g)=>{var c,L,$,D,z,W,w,O,G,H,q,ae,X,de;const{sub:n,sectionResults:x,overallScore:I,totalChallenges:f}=o;return`
            <div class="supervision-card ${I>=80?"warning":"worst"}">
              <div class="card-header">
                <div>
                  <div class="card-title">${g+1}. ${A(((L=(c=n.profiles)==null?void 0:c[0])==null?void 0:L.full_name)||"مشرف مجهول")}</div>
                  <div class="card-subtitle">${A(((D=($=n.forms)==null?void 0:$[0])==null?void 0:D.title_ar)||"استمارة إشراف")}</div>
                  <div class="card-meta">
                    <span class="gov-badge">🏛️ ${A(((W=(z=n.governorates)==null?void 0:z[0])==null?void 0:W.name_ar)||"—")}</span>
                    <span class="dist-badge">📍 ${A(((O=(w=n.districts)==null?void 0:w[0])==null?void 0:O.name_ar)||"—")}</span>
                    <span class="team-badge">👥 ${A(((H=(G=n.profiles)==null?void 0:G[0])==null?void 0:H.full_name)||"—")}</span>
                    ${n.gps_lat&&n.gps_lng?`<span class="gps-tag">📡 ${n.gps_lat.toFixed(4)}, ${n.gps_lng.toFixed(4)}</span>`:'<span style="color:'+t.accent+';font-size:9px">⚠️ بدون GPS</span>'}
                    <span class="meta-item"><span class="meta-icon">📅</span> ${new Date(n.created_at).toLocaleDateString("ar-SA")}</span>
                    ${(ae=(q=n.profiles)==null?void 0:q[0])!=null&&ae.phone?`<span class="meta-item"><span class="meta-icon">📱</span> ${(de=(X=n.profiles)==null?void 0:X[0])==null?void 0:de.phone}</span>`:""}
                  </div>
                </div>
                <div class="card-score" style="color:${da(I,80)};background:${I>=80?"#E8F5E9":"#FFEBEE"}">
                  ${I}%
                </div>
              </div>

              <!-- Section breakdown -->
              ${Object.entries(et).map(([fe,xe])=>{const ve=x[fe];if(!ve)return"";const T=ve.avgScore;return`
                  <div class="section-bar ${T>=90?"good":T>=70?"warning":T>=0?"danger":"neutral"}">
                    <span class="section-icon">${xe.icon}</span>
                    <span class="section-name">${xe.title}</span>
                    <span class="section-score" style="color:${da(T,xe.target)}">
                      ${T>=0?`${T}%`:"—"}
                    </span>
                    ${ve.challengeCount>0?`<span style="font-size:8px;color:${t.accent}">(${ve.challengeCount} تحدي)</span>`:""}
                  </div>
                `}).join("")}

              <!-- Challenge details -->
              ${f>0?`
                <div style="margin-top:10px;">
                  <div style="font-size:10px;font-weight:700;color:${t.accent};margin-bottom:6px;">⚠️ التحديات المحددة:</div>
                  ${Object.entries(x).map(([fe,xe])=>xe.fields.filter(ve=>ve.value!==null&&ve.value<ve.target).map(ve=>{var T,Y;return`
                        <div class="challenge-item fail">
                          <span>${((T=et[fe])==null?void 0:T.icon)||"•"}</span>
                          <span style="flex:1">${(Y=et[fe])==null?void 0:Y.title} — ${ve.label}</span>
                          <span style="font-weight:700;color:${t.accent}">${ve.value}%</span>
                          <span style="color:${t.textMuted}">(الهدف: ${ve.target}%)</span>
                        </div>
                      `}).join("")).join("")}
                </div>
              `:""}

              <!-- Notes -->
              ${n.notes?`
                <div style="margin-top:8px;padding:8px;background:${t.bgLight};border-radius:6px;font-size:10px;">
                  <strong>📝 ملاحظات:</strong> ${A(n.notes)}
                </div>
              `:""}
            </div>
          `}).join("")}
      `:""}

      <!-- ═══ Recommendations ═══ -->
      ${V("💡","التوصيات الإصلاحية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${Object.entries(et).map(([o,g])=>{const n=j[o];return n>=90?`
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px;">
              <strong>${g.icon} ${g.title}:</strong>
              <span style="color:${t.success};font-weight:700">ممتاز (${n}%)</span>
              <p style="font-size:9px;color:${t.textMuted};margin-top:4px;">استمرار المتابعة والتحسين</p>
            </div>
          `:`
            <div style="background:${n>=70?"#FFF8E1":"#FFEBEE"};border:1px solid ${n>=70?"#FFECB3":"#FFCDD2"};border-radius:8px;padding:10px;">
              <strong>${g.icon} ${g.title}:</strong>
              <span style="color:${n>=70?t.warning:t.accent};font-weight:700">${n>=70?"يحتاج تحسين":"يتدخل فوري"} (${n}%)</span>
              <ul style="font-size:9px;margin:4px 0;padding-right:14px;">
                ${g.fields.map(x=>{const I=C.filter(f=>{const E=f.sectionResults[o];return E&&E.fields.find(c=>c.field===x&&c.value!==null&&c.value<g.target)}).length;return I>0?`<li>${ia[x]} — ${I} استمارة</li>`:""}).filter(Boolean).join("")}
              </ul>
            </div>
          `}).join("")}
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(r,"تقرير_استمارة_الإشراف")}const wo={challenges:{label:"التحديات والصعوبات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"الإجراءات المتخذة",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"التوصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}},is={challenges:["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem","مشكلة","صعوبة","تحديات","صعوبات","مشاكل","عوائق"],actions:["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action","measure","إجراءات","اجراءات","تدابير","خطوات","ما تم"],recommendations:["توصي","اقتراح","ينصح","propose","recommend","توصيات","توصية","اقتراحات","يجب","من الضروري","ينبغي"]};function ca(e,s){if(!e||typeof e!="object")return null;const i=is[s];for(const[l,u]of Object.entries(e))if(typeof u=="string"&&u.trim().length>2){for(const b of i)if(l.toLowerCase().includes(b.toLowerCase()))return u.trim()}if(e.data&&typeof e.data=="object"){for(const[l,u]of Object.entries(e.data))if(typeof u=="string"&&u.trim().length>2){for(const b of i)if(l.toLowerCase().includes(b.toLowerCase()))return u.trim()}}for(const[l,u]of Object.entries(e))if(typeof u=="string"&&u.trim().length>20){for(const b of i)if(u.toLowerCase().includes(b.toLowerCase()))return u.trim()}return null}function ga(e,s){if(!e||typeof e!="object")return null;const i=is[s];function l(u,b=0){if(b>3)return null;for(const[N,_]of Object.entries(u)){if(typeof _=="string"&&_.trim().length>10){for(const m of i)if(N.toLowerCase().includes(m.toLowerCase())||_.toLowerCase().includes(m.toLowerCase()))return _.trim()}if(typeof _=="object"&&_!==null&&!Array.isArray(_)){const m=l(_,b+1);if(m)return m}if(Array.isArray(_)){for(const m of _)if(typeof m=="object"&&m!==null){const F=l(m,b+1);if(F)return F}}}return null}return l(e)}async function So(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=await We({table:"form_submissions",select:"id, status, data, notes, gps_lat, gps_lng, created_at, submitted_by, governorate_id, district_id",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:o=>(o=o.is("deleted_at",null),e!=null&&e.dateFrom&&(o=o.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(o=o.lte("created_at",e.dateTo+"T23:59:59")),s&&(o=o.eq("campaign_round",s)),o)}),[{data:l},{data:u},{data:b}]=await Promise.all([K.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),K.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),K.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null)]),N=i.data,_=new Map;for(const o of l||[])_.set(o.id,o);const m=new Map;for(const o of u||[])m.set(o.id,o);const F=new Map;for(const o of b||[])F.set(o.id,o);const M=(N||[]).map(o=>{const g=o.data||{},n=ca(g,"challenges")||ga(g,"challenges"),x=ca(g,"actions")||ga(g,"actions"),I=ca(g,"recommendations")||ga(g,"recommendations"),f=o.submitted_by?_.get(o.submitted_by):null,E=o.governorate_id?m.get(o.governorate_id):null,c=o.district_id?F.get(o.district_id):null;return{challenges:n,actions:x,recommendations:I,hasAny:!!(n||x||I),hasAll:!!(n&&x&&I),govName:(E==null?void 0:E.name_ar)||"غير محدد",govId:o.governorate_id||"",distName:(c==null?void 0:c.name_ar)||"غير محدد",supervisorName:(f==null?void 0:f.full_name)||"مشرف مجهول",date:o.created_at}}),S=M.filter(o=>o.hasAny),y=new Map;for(const o of S){const g=o.govId||o.govName;y.has(g)||y.set(g,{govName:o.govName,total:0,complete:0,challengesList:[],actionsList:[],recommendationsList:[],supervisors:new Set,districts:new Set});const n=y.get(g);n.total++,o.hasAll&&n.complete++,n.supervisors.add(o.supervisorName),n.districts.add(o.distName),o.challenges&&n.challengesList.push(o.challenges),o.actions&&n.actionsList.push(o.actions),o.recommendations&&n.recommendationsList.push(o.recommendations)}const k=[...y.values()].sort((o,g)=>g.total-o.total),C=M.length,R=S.length,v=S.filter(o=>o.hasAll).length,j=S.filter(o=>o.challenges).length,d=S.filter(o=>o.actions).length,h=S.filter(o=>o.recommendations).length;function p(o,g){const n=wo[o];return g.length===0?"":`
      <div style="margin:8px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;font-weight:700;color:${n.color};">
          <span>${n.icon}</span>
          <span>${n.label}</span>
          <span style="font-size:9px;color:${t.textMuted};font-weight:400">(${g.length} نقطة)</span>
        </div>
        <div style="background:${n.bg};border:1px solid ${n.border};border-radius:8px;padding:10px 12px;">
          ${g.map((x,I)=>`
            <div style="font-size:11px;line-height:1.8;color:${t.textDark};padding:4px 0;${I>0?`border-top:1px solid ${n.border};`:""}">
              <span style="color:${t.textMuted};font-size:9px;">${I+1}.</span> ${A(x)}
            </div>
          `).join("")}
        </div>
      </div>
    `}const r=`
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
      ${je("تقرير تحديات الإشراف الميداني","النشاط الإيصالي التكاملي — مجمّع حسب المحافظة"+De(s),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Pe(new Date(e.dateFrom))} — ${Pe(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${P("إجمالي الاستمارات",C,"📋",t.primary)}
        ${P("مُعبأة",R,"✅",t.success,`${C>0?Math.round(R/C*100):0}%`)}
        ${P("مكتملة (3/3)",v,"⭐",t.success)}
        ${P("تحديات",j,"⚠️","#E53935",`${R>0?Math.round(j/R*100):0}%`)}
        ${P("إجراءات",d,"📋","#1565C0",`${R>0?Math.round(d/R*100):0}%`)}
        ${P("توصيات",h,"💡","#2E7D32",`${R>0?Math.round(h/R*100):0}%`)}
      </div>

      ${k.length===0?`
        <div style="text-align:center;padding:40px;color:${t.textMuted};">
          <p style="font-size:18px;">📋 لا توجد استمارات مُعبأة</p>
        </div>
      `:""}

      <!-- ═══ Cards by Governorate ═══ -->
      ${k.map(o=>{const g=o.total>0?Math.round(o.complete/o.total*100):0;return`
          <div class="gov-card">
            <div class="gov-card-header">
              <div>
                <div class="gov-card-name">🏛️ ${A(o.govName)}</div>
                <div class="gov-card-stats">
                  <span>📝 ${o.total} استمارة</span>
                  <span>👥 ${o.supervisors.size} مشرف</span>
                  <span>📍 ${o.districts.size} مديرية</span>
                </div>
              </div>
              <div class="gov-card-badge" style="color:${g>=80?"#C8E6C9":g>=50?"#FFECB3":"#FFCDD2"}">
                ${g}%
              </div>
            </div>
            <div class="gov-card-body">
              <div class="stat-row">
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.accent}">${o.challengesList.length}</div>
                  <div class="stat-label">تحديات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.primary}">${o.actionsList.length}</div>
                  <div class="stat-label">إجراءات</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value" style="color:${t.success}">${o.recommendationsList.length}</div>
                  <div class="stat-label">توصيات</div>
                </div>
              </div>

              <div class="gov-meta-row">
                ${[...o.supervisors].slice(0,8).map(n=>`<span class="gov-meta-tag">👤 ${A(n)}</span>`).join("")}
                ${o.supervisors.size>8?`<span class="gov-meta-tag">... و ${o.supervisors.size-8} آخرين</span>`:""}
              </div>

              ${p("challenges",o.challengesList)}
              ${p("actions",o.actionsList)}
              ${p("recommendations",o.recommendationsList)}
            </div>
          </div>
        `}).join("")}

      <!-- ═══ ملخص جدول ═══ -->
      ${k.length>0?`
        ${V("📍","ملخص حسب المحافظة")}
        ${ie(["المحافظة","الاستمارات","مكتملة","التحديات","الإجراءات","التوصيات","الاكتمال"],k.map(o=>[A(o.govName),`${o.total}`,`${o.complete}`,`${o.challengesList.length}`,`${o.actionsList.length}`,`${o.recommendationsList.length}`,`<span style="color:${o.total>0&&o.complete/o.total>=.8?t.success:t.warning};font-weight:700">${o.total>0?Math.round(o.complete/o.total*100):0}%</span>`]))}
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(r,"تقرير_تحديات_الإشراف_الميداني")}function ds(e){const s=(e||"").trim();return s.includes("مدير عام مكتب الصحة العامة والسكان بالمحافظة")?!0:["عبدالحكيم محمد احمد عيناء"].some(l=>s.includes(l))}function ko(){return new Date().toISOString().split("T")[0]}function Fo(e){return new Date(e).toLocaleDateString("ar-SA",{weekday:"long"})}const Ro=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];function Do(e){return`${e.getDate()} ${Ro[e.getMonth()]} ${e.getFullYear()}`}async function cs(e){const s=(e==null?void 0:e.date)||ko(),i=`${s}T00:00:00`,l=`${s}T23:59:59`,u=Fo(s),b=Do(new Date(s)),N=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[_,m,F]=await Promise.allSettled([K.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),K.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),K.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),M=await We({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:h=>{let p=h.is("deleted_at",null).gte("created_at",i).lte("created_at",l);return N&&(p=p.eq("campaign_round",N)),p}}),S=_.status==="fulfilled"?_.value.data||[]:[],y=M.data,k=m.status==="fulfilled"?m.value.data||[]:[],C=F.status==="fulfilled"?F.value.data||[]:[],R=new Map;for(const h of k)R.set(h.id,h);const v=new Map;for(const h of C)v.set(h.id,h);const j=S.filter(h=>h.is_active).map(h=>{const p=y.filter(I=>I.submitted_by===h.id),r=p.filter(I=>I.status==="submitted").length,o=p.filter(I=>I.status==="draft").length,g=p.length,n=h.governorate_id?R.get(h.governorate_id):null,x=h.district_id?v.get(h.district_id):null;return{...h,totalToday:g,submittedToday:r,draftToday:o,isGenSupervisor:ds(h.full_name||""),govName:(n==null?void 0:n.name_ar)||"",govId:h.governorate_id||"",distName:(x==null?void 0:x.name_ar)||""}}),d=new Map;for(const h of k){const p=j.filter(g=>g.govId===h.id),r=p.filter(g=>g.role==="governorate"||g.role==="central"||g.role==="admin").sort((g,n)=>{const x={central:0,admin:0,governorate:1};return(x[g.role]??9)-(x[n.role]??9)}),o=new Map;for(const g of p.filter(n=>n.role==="district"||n.role==="data_entry")){const n=g.district_id||"_no_district";o.has(n)||o.set(n,[]),o.get(n).push(g)}d.set(h.id,{gov:h,allUsers:p,govLevelUsers:r,districts:o})}return{users:S,subs:y,govs:k,dists:C,enriched:j,govGroups:d,targetDate:s,dayName:u,dateArabic:b}}async function Ra(e){var j,d;const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[i,l,u]=await Promise.allSettled([K.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),K.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),K.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),b=await We({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:h=>{let p=h.is("deleted_at",null);return s&&(p=p.eq("campaign_round",s)),p}}),N=i.status==="fulfilled"?i.value.data||[]:[],_=b.data,m=l.status==="fulfilled"?l.value.data||[]:[],F=u.status==="fulfilled"?u.value.data||[]:[];let M="",S="",y=0;if(_.length>0&&(M=((j=_[0].created_at)==null?void 0:j.split("T")[0])||"",S=((d=_[_.length-1].created_at)==null?void 0:d.split("T")[0])||"",M&&S)){const h=new Date(M),p=new Date(S);y=Math.ceil((p.getTime()-h.getTime())/(1e3*60*60*24))+1}const k=new Map;for(const h of m)k.set(h.id,h);const C=new Map;for(const h of F)C.set(h.id,h);const R=N.filter(h=>h.is_active).map(h=>{const p=_.filter(I=>I.submitted_by===h.id),r=p.filter(I=>I.status==="submitted").length,o=p.filter(I=>I.status==="draft").length,g=p.length,n=h.governorate_id?k.get(h.governorate_id):null,x=h.district_id?C.get(h.district_id):null;return{...h,totalToday:g,submittedToday:r,draftToday:o,isGenSupervisor:ds(h.full_name||""),govName:(n==null?void 0:n.name_ar)||"",govId:h.governorate_id||"",distName:(x==null?void 0:x.name_ar)||""}}),v=new Map;for(const h of m){const p=R.filter(g=>g.govId===h.id),r=p.filter(g=>g.role==="governorate"||g.role==="central"||g.role==="admin").sort((g,n)=>{const x={central:0,admin:0,governorate:1};return(x[g.role]??9)-(x[n.role]??9)}),o=new Map;for(const g of p.filter(n=>n.role==="district"||n.role==="data_entry")){const n=g.district_id||"_no_district";o.has(n)||o.set(n,[]),o.get(n).push(g)}v.set(h.id,{gov:h,allUsers:p,govLevelUsers:r,districts:o})}return{users:N,subs:_,govs:m,dists:F,enriched:R,govGroups:v,dateRange:{from:M,to:S},totalDays:y}}const jo={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function To(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=await cs(e),{enriched:l,govs:u,dists:b,subs:N,targetDate:_,dayName:m,dateArabic:F,govGroups:M}=i,S=l.filter(c=>(c.role==="central"||c.role==="admin")&&c.govId),y=[...l.filter(c=>["governorate","district","data_entry"].includes(c.role)),...S];e!=null&&e.governorateId&&e.governorateId!=="all"&&(u.filter(c=>c.id===e.governorateId),y.filter(c=>c.govId===e.governorateId));const k=y.length,C=y.filter(c=>c.totalToday>0).length,R=y.filter(c=>c.totalToday===0&&!c.isGenSupervisor).length,v=y.filter(c=>c.isGenSupervisor).length,j=N.length,d=N.filter(c=>c.status==="submitted").length,h=N.filter(c=>c.status==="draft").length,r=new Set(y.map(c=>c.govId).filter(Boolean)).size,o=u.length,g=y.filter(c=>c.role==="district"||c.role==="data_entry"),x=new Set(g.map(c=>c.district_id).filter(Boolean)).size,I=b.length;function f(c,L){let $;c.isGenSupervisor?$='<span class="status-badge status-general">إشراف عام</span>':c.totalToday>0?$='<span class="status-badge status-active">✅ نشط</span>':$='<span class="status-badge status-inactive">❌ غير نشط</span>';let D;return c.role==="central"||c.role==="admin"?D="مركزي":c.role==="governorate"?D="مشرف محافظة":c.role==="district"?D="مديرية":D="إدخال بيانات",`
      <tr class="${c.totalToday===0&&!c.isGenSupervisor?"row-inactive":""}">
        <td class="num">${L+1}</td>
        <td>
          <div class="user-name">${jo[c.role]||"👤"} ${A(c.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${c.role}">${D}</span></td>
        <td>${A(c.govName||"—")}</td>
        <td>${A(c.distName||"—")}</td>
        <td class="num">${c.totalToday}</td>
        <td class="num num-success">${c.submittedToday}</td>
        <td class="num num-warning">${c.draftToday}</td>
        <td>${$}</td>
      </tr>
    `}const E=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين اليومي — ${F}</title>
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
      ${je("تقييم أداء المشرفين اليومي","استمارة الإشراف للنشاط الإيصالي التكاملي"+De(s),`${m} — ${F}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${m} — ${F}</div>
        <div class="day-date">تقرير تقييم أداء المشرفين اليومي</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${V("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${P("إجمالي المشرفين",k,"👥",t.primary)}
        ${P("نشط اليوم",C,"✅",t.success,`${k>0?Math.round(C/k*100):0}%`)}
        ${P("غير نشط",R,"❌",t.accent,`${k>0?Math.round(R/k*100):0}%`)}
        ${P("إشراف عام",v,"🏛️","#1565C0",`${k>0?Math.round(v/k*100):0}%`)}
        ${P("إجمالي الاستمارات",j,"📋",t.info,`مرسلة: ${d} | مسودة: ${h}`)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${V("📈","نسب الإشراف الإجمالية")}
      <div class="kpi-grid">
        ${(()=>{const c=Math.max(k-v,1),L=Math.round(C/c*100);return P("نسبة النشاط الكلية",`${L}%`,"🎯",L>=70?t.success:L>=40?t.warning:t.accent)})()}
        ${(()=>{const c=o>0?Math.round(r/o*100):0;return P("تغطية إشراف المحافظات",`${c}%`,"🏛️",c>=80?t.success:c>=50?t.warning:t.accent,`${r}/${o}`)})()}
        ${(()=>{const c=I>0?Math.round(x/I*100):0;return P("تغطية إشراف المديريات",`${c}%`,"📍",c>=80?t.success:c>=50?t.warning:t.accent,`${x}/${I}`)})()}
        ${(()=>{const c=j>0?Math.round(d/j*100):0;return P("نسبة الإرسال",`${c}%`,"📤",c>=80?t.success:c>=50?t.warning:t.accent,`${d}/${j}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${k}</span>
        <span class="summary-chip chip-active">✅ نشط: ${C}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${R}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${v}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${V("📊","ملخص المحافظات")}
      ${ie(["المحافظة","المشرفين","نشط","غير نشط","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[...M.values()].map(c=>{const L=c.allUsers.filter(O=>O.totalToday>0&&!O.isGenSupervisor).length,$=c.allUsers.filter(O=>O.totalToday===0&&!O.isGenSupervisor).length,D=c.allUsers.filter(O=>O.isGenSupervisor).length,z=c.allUsers.reduce((O,G)=>O+G.totalToday,0),W=c.allUsers.length,w=W>0?Math.round(L/Math.max(W-D,1)*100):0;return[A(c.gov.name_ar),`${W}`,`<span style="color:${t.success};font-weight:700">${L}</span>`,`<span style="color:${$>0?t.accent:t.textMuted}">${$}</span>`,`${D}`,`${c.districts.size}`,`${z}`,`<span style="color:${w>=70?t.success:w>=40?t.warning:t.accent};font-weight:700">${w}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${V("📍","ملخص المديريات")}
      ${[...M.values()].map(c=>{if(c.districts.size===0)return"";const L=c.allUsers.filter(G=>G.role==="district"||G.role==="data_entry").length,$=c.allUsers.filter(G=>(G.role==="district"||G.role==="data_entry")&&G.totalToday>0).length,D=L-$,z=c.allUsers.filter(G=>G.role==="district"||G.role==="data_entry").reduce((G,H)=>G+H.totalToday,0),W=[...c.districts.values()].filter(G=>G.some(H=>H.totalToday>0)).length,w=L>0?Math.round($/L*100):0,O=[...c.districts.entries()].sort((G,H)=>{const q=G[1].reduce((X,de)=>X+de.totalToday,0);return H[1].reduce((X,de)=>X+de.totalToday,0)-q}).map(([G,H])=>{var xe;const q=((xe=H[0])==null?void 0:xe.distName)||"غير محدد",ae=H.filter(ve=>ve.totalToday>0).length,X=H.filter(ve=>ve.totalToday===0).length,de=H.reduce((ve,T)=>ve+T.totalToday,0),fe=H.length>0?Math.round(ae/H.length*100):0;return[A(q),`${H.length}`,`<span style="color:${t.success};font-weight:700">${ae}</span>`,`<span style="color:${X>0?t.accent:t.textMuted}">${X}</span>`,`${de}`,`<span style="color:${fe>=70?t.success:fe>=40?t.warning:t.accent};font-weight:700">${fe}%</span>`]});return`
          <div class="dist-summary-group">
            <!-- header المحافظة -->
            <div class="dist-summary-gov-header">
              <span>🏛️ ${A(c.gov.name_ar)}</span>
              <span class="gov-sub">${c.districts.size} مديرية | ${L} مشرف</span>
            </div>

            <!-- جدول مديريات المحافظة -->
            ${ie(["المديرية","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],O)}

            <!-- إجمالي المحافظة -->
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${A(c.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${L} مشرف</span>
                <span style="color:${t.success}">✅ ${$} نشط</span>
                ${D>0?`<span style="color:${t.accent}">❌ ${D} غير نشط</span>`:""}
                <span>📋 ${z} استمارة</span>
                <span>📍 ${W}/${c.districts.size} مديرية</span>
                <span style="color:${w>=70?t.success:w>=40?t.warning:t.accent}">🎯 ${w}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...M.values()].map(c=>{const L=c.allUsers.filter(w=>w.totalToday>0).length,$=c.allUsers.length,D=c.allUsers.reduce((w,O)=>w+O.totalToday,0),z=c.districts.size,W=[...c.districts.values()].filter(w=>w.some(O=>O.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${A(c.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${$} مشرف | نشط: ${L} | غير نشط: ${$-L} |
                  مديريات: ${W}/${z}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${D}</strong>
              </div>
            </div>

            ${c.allUsers.length===0?'<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>':""}

            <!-- مشرفي المحافظة + المركزي -->
            ${c.govLevelUsers.length>0?`
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${c.govLevelUsers.length} مشرف</span>
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
                  ${c.govLevelUsers.map((w,O)=>f(w,O)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...c.districts.entries()].sort((w,O)=>O[1].length-w[1].length).map(([w,O])=>{var ae;const G=((ae=O[0])==null?void 0:ae.distName)||"غير محدد",H=O.filter(X=>X.totalToday>0).length,q=O.reduce((X,de)=>X+de.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${A(G)}</span>
                    <span class="dist-count">${O.length} مشرف | نشط: ${H} | استمارات: ${q}</span>
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
                      ${O.sort((X,de)=>(X.role==="district"?0:1)-(de.role==="district"?0:1)||de.totalToday-X.totalToday).map((X,de)=>f(X,de)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Te()}
    </body>
    </html>
  `;Ce(E,`تقييم_أداء_المشرفين_اليومي_${_}`)}const Eo={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function Co(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=await Ra(e),{enriched:l,govs:u,dists:b,subs:N,govGroups:_,dateRange:m,totalDays:F}=i,M=l.filter($=>($.role==="central"||$.role==="admin")&&$.govId),S=[...l.filter($=>["governorate","district","data_entry"].includes($.role)),...M];e!=null&&e.governorateId&&e.governorateId!=="all"&&(u.filter($=>$.id===e.governorateId),S.filter($=>$.govId===e.governorateId));const y=S.length,k=S.filter($=>$.totalToday>0).length,C=S.filter($=>$.totalToday===0&&!$.isGenSupervisor).length,R=S.filter($=>$.isGenSupervisor).length,v=N.length,j=N.filter($=>$.status==="submitted").length,d=N.filter($=>$.status==="draft").length,p=new Set(S.map($=>$.govId).filter(Boolean)).size,r=u.length,o=S.filter($=>$.role==="district"||$.role==="data_entry"),n=new Set(o.map($=>$.district_id).filter(Boolean)).size,x=b.length,I=m.from?Pe(new Date(m.from)):"—",f=m.to?Pe(new Date(m.to)):"—";function E($,D){let z;$.isGenSupervisor?z='<span class="status-badge status-general">إشراف عام</span>':$.totalToday>0?z=`<span class="status-badge status-active">✅ ${$.totalToday} استمارة</span>`:z='<span class="status-badge status-inactive">❌ لا إرساليات</span>';let W;return $.role==="central"||$.role==="admin"?W="مركزي":$.role==="governorate"?W="مشرف محافظة":$.role==="district"?W="مديرية":W="إدخال بيانات",`
      <tr class="${$.totalToday===0&&!$.isGenSupervisor?"row-inactive":""}">
        <td class="num">${D+1}</td>
        <td>
          <div class="user-name">${Eo[$.role]||"👤"} ${A($.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${$.role}">${W}</span></td>
        <td>${A($.govName||"—")}</td>
        <td>${A($.distName||"—")}</td>
        <td class="num">${$.totalToday}</td>
        <td class="num num-success">${$.submittedToday}</td>
        <td class="num num-warning">${$.draftToday}</td>
        <td>${z}</td>
      </tr>
    `}const c=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين الشامل — ${I} إلى ${f}</title>
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
      ${je("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي"+De(s),`${I} — ${f} (${F} يوم)`)}

      <!-- ═══ نطاق التاريخ ═══ -->
      <div class="range-banner">
        <div class="range-title">📊 تقرير شامل — جميع الاستمارات</div>
        <div class="range-detail">
          📅 من ${I} إلى ${f} — ${F} يوم — ${v} استمارة
        </div>
      </div>

      <!-- ═══ ملخص شامل ═══ -->
      ${V("📊","الملخص الشامل")}
      <div class="kpi-grid">
        ${P("إجمالي المشرفين",y,"👥",t.primary)}
        ${P("نشط (له استمارات)",k,"✅",t.success,`${y>0?Math.round(k/y*100):0}%`)}
        ${P("بدون إرساليات",C,"❌",t.accent,`${y>0?Math.round(C/y*100):0}%`)}
        ${P("إشراف عام",R,"🏛️","#1565C0",`${y>0?Math.round(R/y*100):0}%`)}
        ${P("إجمالي الاستمارات",v,"📋",t.info,`مرسلة: ${j} | مسودة: ${d}`)}
        ${P("متوسط الاستمارات/مشرف",y>0?Math.round(v/y):0,"📈",t.primary)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${V("📈","نسب الإشراف")}
      <div class="kpi-grid">
        ${(()=>{const $=Math.max(y-R,1),D=Math.round(k/$*100);return P("نسبة النشاط الكلية",`${D}%`,"🎯",D>=70?t.success:D>=40?t.warning:t.accent)})()}
        ${(()=>{const $=r>0?Math.round(p/r*100):0;return P("تغطية المحافظات",`${$}%`,"🏛️",$>=80?t.success:$>=50?t.warning:t.accent,`${p}/${r}`)})()}
        ${(()=>{const $=x>0?Math.round(n/x*100):0;return P("تغطية المديريات",`${$}%`,"📍",$>=80?t.success:$>=50?t.warning:t.accent,`${n}/${x}`)})()}
        ${(()=>{const $=v>0?Math.round(j/v*100):0;return P("نسبة الإرسال",`${$}%`,"📤",$>=80?t.success:$>=50?t.warning:t.accent,`${j}/${v}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${y}</span>
        <span class="summary-chip chip-active">✅ نشط: ${k}</span>
        <span class="summary-chip chip-inactive">❌ بدون إرساليات: ${C}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${R}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${V("📊","ملخص المحافظات")}
      ${ie(["المحافظة","المشرفين","نشط","بدون إرساليات","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[..._.values()].map($=>{const D=$.allUsers.filter(H=>H.totalToday>0&&!H.isGenSupervisor).length,z=$.allUsers.filter(H=>H.totalToday===0&&!H.isGenSupervisor).length,W=$.allUsers.filter(H=>H.isGenSupervisor).length,w=$.allUsers.reduce((H,q)=>H+q.totalToday,0),O=$.allUsers.length,G=O>0?Math.round(D/Math.max(O-W,1)*100):0;return[A($.gov.name_ar),`${O}`,`<span style="color:${t.success};font-weight:700">${D}</span>`,`<span style="color:${z>0?t.accent:t.textMuted}">${z}</span>`,`${W}`,`${$.districts.size}`,`${w}`,`<span style="color:${G>=70?t.success:G>=40?t.warning:t.accent};font-weight:700">${G}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${V("📍","ملخص المديريات")}
      ${[..._.values()].map($=>{if($.districts.size===0)return"";const D=$.allUsers.filter(q=>q.role==="district"||q.role==="data_entry").length,z=$.allUsers.filter(q=>(q.role==="district"||q.role==="data_entry")&&q.totalToday>0).length,W=D-z,w=$.allUsers.filter(q=>q.role==="district"||q.role==="data_entry").reduce((q,ae)=>q+ae.totalToday,0),O=[...$.districts.values()].filter(q=>q.some(ae=>ae.totalToday>0)).length,G=D>0?Math.round(z/D*100):0,H=[...$.districts.entries()].sort((q,ae)=>{const X=q[1].reduce((fe,xe)=>fe+xe.totalToday,0);return ae[1].reduce((fe,xe)=>fe+xe.totalToday,0)-X}).map(([q,ae])=>{var T;const X=((T=ae[0])==null?void 0:T.distName)||"غير محدد",de=ae.filter(Y=>Y.totalToday>0).length,fe=ae.filter(Y=>Y.totalToday===0).length,xe=ae.reduce((Y,ne)=>Y+ne.totalToday,0),ve=ae.length>0?Math.round(de/ae.length*100):0;return[A(X),`${ae.length}`,`<span style="color:${t.success};font-weight:700">${de}</span>`,`<span style="color:${fe>0?t.accent:t.textMuted}">${fe}</span>`,`${xe}`,`<span style="color:${ve>=70?t.success:ve>=40?t.warning:t.accent};font-weight:700">${ve}%</span>`]});return`
          <div class="dist-summary-group">
            <div class="dist-summary-gov-header">
              <span>🏛️ ${A($.gov.name_ar)}</span>
              <span class="gov-sub">${$.districts.size} مديرية | ${D} مشرف</span>
            </div>
            ${ie(["المديرية","المشرفين","نشط","بدون إرساليات","الاستمارات","النشاط"],H)}
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${A($.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${D} مشرف</span>
                <span style="color:${t.success}">✅ ${z} نشط</span>
                ${W>0?`<span style="color:${t.accent}">❌ ${W} بدون إرساليات</span>`:""}
                <span>📋 ${w} استمارة</span>
                <span>📍 ${O}/${$.districts.size} مديرية</span>
                <span style="color:${G>=70?t.success:G>=40?t.warning:t.accent}">🎯 ${G}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[..._.values()].map($=>{const D=$.allUsers.filter(G=>G.totalToday>0).length,z=$.allUsers.length,W=$.allUsers.reduce((G,H)=>G+H.totalToday,0),w=$.districts.size,O=[...$.districts.values()].filter(G=>G.some(H=>H.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${A($.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${z} مشرف | نشط: ${D} | بدون إرساليات: ${z-D} |
                  مديريات: ${O}/${w}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                إجمالي الاستمارات: <strong>${W}</strong>
              </div>
            </div>

            ${$.allUsers.length===0?'<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>':""}

            <!-- مشرفي المحافظة + المركزي -->
            ${$.govLevelUsers.length>0?`
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${$.govLevelUsers.length} مشرف</span>
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
                  ${$.govLevelUsers.map((G,H)=>E(G,H)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...$.districts.entries()].sort((G,H)=>H[1].length-G[1].length).map(([G,H])=>{var de;const q=((de=H[0])==null?void 0:de.distName)||"غير محدد",ae=H.filter(fe=>fe.totalToday>0).length,X=H.reduce((fe,xe)=>fe+xe.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${A(q)}</span>
                    <span class="dist-count">${H.length} مشرف | نشط: ${ae} | استمارات: ${X}</span>
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
                      ${H.sort((fe,xe)=>(fe.role==="district"?0:1)-(xe.role==="district"?0:1)||xe.totalToday-fe.totalToday).map((fe,xe)=>E(fe,xe)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Te()}
    </body>
    </html>
  `,L=new Date().toISOString().split("T")[0];Ce(c,`تقييم_أداء_المشرفين_الشامل_${L}`)}const Ya=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟"},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟"},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟"}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟"},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟"},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟"},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟"},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟"}]},{id:"records",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟"},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟"},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟"},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟"}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟"},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟"},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟"},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟"},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟"}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟"},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟"},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟"}]},{id:"supplies",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟"},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟"},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟"},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟"},{key:"scale",label:"هل يوجد ميزان؟"},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟"}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟"},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟"},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟"},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟"}]},{id:"catch_up",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟"},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟"},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟"},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟"},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟"}]},{id:"defaulter",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟"},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟"}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟"},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟"}]}],No=["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem"],Mo=["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action"],zo=["توصي","اقتراح","ينصح","propose","recommend"];function ua(e,s){if(!e||typeof e!="object")return null;for(const[i,l]of Object.entries(e))if(typeof l=="string"&&l.trim().length>2){for(const u of s)if(i.toLowerCase().includes(u.toLowerCase()))return l.trim()}if(e.data&&typeof e.data=="object"){for(const[i,l]of Object.entries(e.data))if(typeof l=="string"&&l.trim().length>2){for(const u of s)if(i.toLowerCase().includes(u.toLowerCase()))return l.trim()}}for(const[,i]of Object.entries(e))if(typeof i=="string"&&i.trim().length>20){for(const l of s)if(i.toLowerCase().includes(l.toLowerCase()))return i.trim()}return null}async function Po(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date().toISOString().split("T")[0],l=Pe(new Date),u=await Ra(e),[b,N]=await Promise.allSettled([We({table:"form_submissions",select:"id, data, governorate_id, status",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:T=>{let Y=T.eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null);return s&&(Y=Y.eq("campaign_round",s)),Y}}),We({table:"form_submissions",select:"id, data, governorate_id, district_id, submitted_by, created_at",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:T=>{let Y=T.is("deleted_at",null);return s&&(Y=Y.eq("campaign_round",s)),Y}})]),_=new Map;for(const T of u.govs)_.set(T.id,T.name_ar);const{enriched:m,govs:F,dists:M,subs:S,govGroups:y}=u,k=m.filter(T=>(T.role==="central"||T.role==="admin")&&T.govId),C=[...m.filter(T=>["governorate","district","data_entry"].includes(T.role)),...k];let R=y;if(e!=null&&e.governorateId&&e.governorateId!=="all"){const T=new Map,Y=y.get(e.governorateId);Y&&T.set(e.governorateId,Y),R=T}const v=C.length,j=C.filter(T=>T.totalToday>0).length,d=C.filter(T=>T.totalToday===0&&!T.isGenSupervisor).length,h=C.filter(T=>T.isGenSupervisor).length,p=S.length,r=S.filter(T=>T.status==="submitted").length;S.filter(T=>T.status==="draft").length;const o=b.status==="fulfilled"?b.value.data||[]:[],g=Ya.flatMap(T=>T.fields.map(Y=>Y.key)),n=new Map;for(const T of g)n.set(T,{yes:0,no:0,total:0});for(const T of o){const Y=T.data||{};for(const ne of g){const we=Y[ne],be=n.get(ne);be&&(we===!0||we==="yes"||we==="نعم"?(be.yes++,be.total++):(we===!1||we==="no"||we==="لا")&&(be.no++,be.total++))}}const x=Ya.map(T=>{const Y=T.fields.map(Ie=>{const pe=n.get(Ie.key)||{yes:0,no:0,total:0};return{...Ie,...pe,yesRate:pe.total>0?Math.round(pe.yes/pe.total*100):0}}),ne=Y.reduce((Ie,pe)=>Ie+pe.yes,0),we=Y.reduce((Ie,pe)=>Ie+pe.no,0),be=ne+we,ye=be>0?Math.round(ne/be*100):0;return{...T,fields:Y,totalYes:ne,totalNo:we,total:be,avgRate:ye}}),I=x.reduce((T,Y)=>T+Y.totalYes,0),f=x.reduce((T,Y)=>T+Y.totalNo,0),E=I+f,c=E>0?Math.round(I/E*100):0,L=x.flatMap(T=>T.fields.filter(Y=>Y.total>0)),$=[...L].sort((T,Y)=>Y.yesRate-T.yesRate).slice(0,5),D=[...L].sort((T,Y)=>T.yesRate-Y.yesRate).slice(0,5),z=N.status==="fulfilled"?N.value.data||[]:[],W=await K.from("profiles").select("id, full_name").is("deleted_at",null),w=new Map;for(const T of W.data||[])w.set(T.id,T.full_name);const O=new Map;for(const T of z){const Y=T.data||{},ne=ua(Y,No),we=ua(Y,Mo),be=ua(Y,zo);if(!ne&&!we&&!be)continue;const ye=T.governorate_id||"",Ie=_.get(ye)||"غير محدد";O.has(ye)||O.set(ye,{govName:Ie,challenges:[],actions:[],recommendations:[],supervisorNames:new Set,count:0});const pe=O.get(ye);pe.count++,ne&&pe.challenges.push(ne),we&&pe.actions.push(we),be&&pe.recommendations.push(be);const Ae=w.get(T.submitted_by||"");Ae&&pe.supervisorNames.add(Ae)}const G=[...O.values()].sort((T,Y)=>Y.count-T.count),H=G.reduce((T,Y)=>T+Y.count,0),q=G.reduce((T,Y)=>T+Y.challenges.length,0),ae=G.reduce((T,Y)=>T+Y.actions.length,0),X=G.reduce((T,Y)=>T+Y.recommendations.length,0);function de(T){const Y=T>=80?t.success:T>=60?t.warning:T>=40?"#FF9800":t.accent;return`
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${T}%;height:100%;background:${Y};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${Y};min-width:28px;text-align:left;">${T}%</span>
      </div>
    `}function fe(T,Y){if(Y.length===0)return"";const ne={challenges:{label:"تحديات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"إجراءات",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"توصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}}[T];return`
      <div style="margin:6px 0;">
        <div style="font-size:11px;font-weight:700;color:${ne.color};margin-bottom:4px;">${ne.icon} ${ne.label} (${Y.length})</div>
        <div style="background:${ne.bg};border:1px solid ${ne.border};border-radius:8px;padding:8px 10px;">
          ${Y.slice(0,5).map((we,be)=>`
            <div style="font-size:10px;line-height:1.6;color:${t.textDark};${be>0?`border-top:1px solid ${ne.border};padding-top:4px;`:""}">
              ${be+1}. ${A(we.length>150?we.slice(0,150)+"...":we)}
            </div>
          `).join("")}
          ${Y.length>5?`<div style="font-size:9px;color:${t.textMuted};margin-top:4px;">... و ${Y.length-5} نقطة أخرى</div>`:""}
        </div>
      </div>
    `}function xe(T,Y){let ne;T.isGenSupervisor?ne='<span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">إشراف عام</span>':T.totalToday>0?ne=`<span style="background:#E8F5E9;color:${t.success};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">✅ ${T.totalToday}</span>`:ne='<span style="background:#FFEBEE;color:#E53935;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">❌ 0</span>';const we=T.role==="central"||T.role==="admin"?"مركزي":T.role==="governorate"?"محافظة":T.role==="district"?"مديرية":"إدخال";return`
      <tr style="${T.totalToday===0&&!T.isGenSupervisor?"opacity:0.5;":""}">
        <td style="font-size:10px;text-align:center;">${Y+1}</td>
        <td style="font-size:10px;font-weight:700;">${A(T.full_name||"—")}</td>
        <td style="font-size:10px;">${we}</td>
        <td style="font-size:10px;">${A(T.distName||"—")}</td>
        <td style="font-size:10px;text-align:center;font-weight:700;">${T.totalToday}</td>
        <td style="font-size:10px;text-align:center;color:${t.success};">${T.submittedToday}</td>
        <td style="font-size:10px;text-align:center;">${ne}</td>
      </tr>
    `}const ve=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الشامل للمشرفين — ${l}</title>
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
      ${je("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات — تقرير مدمج"+De(s),l)}

      <!-- ═══════════════════════════════════════════ -->
      <!-- KPIs الرئيسية -->
      <!-- ═══════════════════════════════════════════ -->
      ${V("📊","مؤشرات الأداء الرئيسية")}
      <div class="kpi-grid">
        ${P("إجمالي المشرفين",v,"👥",t.primary)}
        ${P("نشط (له استمارات)",j,"✅",t.success,`${v>0?Math.round(j/v*100):0}%`)}
        ${P("بدون إرساليات",d,"❌",t.accent)}
        ${P("إشراف عام",h,"🏛️","#1565C0")}
        ${P("إجمالي الاستمارات",p,"📋",t.info,`مرسلة: ${r}`)}
        ${P("نسبة نعم الكلية",`${c}%`,"🎯",c>=70?t.success:t.warning,`${I}/${E}`)}
        ${P("تحديات ميدانية",H,"⚠️","#E53935",`${q} نقطة`)}
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تقييم أداء المشرفين -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📋 القسم 1: تقييم أداء المشرفين الشامل</div>
          <div class="master-section-badge">${v} مشرف | ${p} استمارة</div>
        </div>
        <div class="master-section-body">
          <!-- نسب الإشراف -->
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${(()=>{const T=Math.max(v-h,1),Y=Math.round(j/T*100);return P("نسبة النشاط",`${Y}%`,"🎯",Y>=70?t.success:Y>=40?t.warning:t.accent)})()}
            ${(()=>{const T=new Set(C.map(ne=>ne.govId).filter(Boolean)).size,Y=F.length>0?Math.round(T/F.length*100):0;return P("تغطية المحافظات",`${Y}%`,"🏛️",Y>=80?t.success:t.warning,`${T}/${F.length}`)})()}
            ${(()=>{const T=new Set(C.filter(ne=>ne.role==="district"||ne.role==="data_entry").map(ne=>ne.district_id).filter(Boolean)).size,Y=M.length>0?Math.round(T/M.length*100):0;return P("تغطية المديريات",`${Y}%`,"📍",Y>=80?t.success:t.warning,`${T}/${M.length}`)})()}
            ${(()=>{const T=p>0?Math.round(r/p*100):0;return P("نسبة الإرسال",`${T}%`,"📤",T>=80?t.success:t.warning)})()}
          </div>

          <!-- ملخص المحافظات -->
          ${ie(["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],[...R.values()].map(T=>{const Y=T.allUsers.filter(pe=>pe.totalToday>0&&!pe.isGenSupervisor).length,ne=T.allUsers.filter(pe=>pe.totalToday===0&&!pe.isGenSupervisor).length,we=T.allUsers.filter(pe=>pe.isGenSupervisor).length,be=T.allUsers.reduce((pe,Ae)=>pe+Ae.totalToday,0),ye=T.allUsers.length,Ie=ye>0?Math.round(Y/Math.max(ye-we,1)*100):0;return[A(T.gov.name_ar),`${ye}`,`<span style="color:${t.success};font-weight:700">${Y}</span>`,`<span style="color:${ne>0?t.accent:t.textMuted}">${ne}</span>`,`${be}`,`<span style="color:${Ie>=70?t.success:Ie>=40?t.warning:t.accent};font-weight:700">${Ie}%</span>`]}))}

          <!-- تفاصيل المحافظات -->
          ${[...R.values()].map(T=>{const Y=T.allUsers.filter(be=>be.totalToday>0).length,ne=T.allUsers.length,we=T.allUsers.reduce((be,ye)=>be+ye.totalToday,0);return`
              <div style="margin-top:14px;page-break-inside:avoid;">
                <div style="background:linear-gradient(135deg,${t.primary},${t.primaryDark});color:white;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div>
                    <div style="font-size:14px;font-weight:800;">🏛️ ${A(T.gov.name_ar)}</div>
                    <div style="font-size:10px;opacity:0.9;">${ne} مشرف | نشط: ${Y} | استمارات: ${we}</div>
                  </div>
                </div>
                ${T.allUsers.length>0?`
                  <table class="data-table" style="font-size:10px;">
                    <thead><tr><th>#</th><th>الاسم</th><th>الصفة</th><th>المديرية</th><th>استمارات</th><th>مرسلة</th><th>الحالة</th></tr></thead>
                    <tbody>
                      ${T.allUsers.sort((be,ye)=>(be.isGenSupervisor?0:1)-(ye.isGenSupervisor?0:1)||ye.totalToday-be.totalToday).map((be,ye)=>xe(be,ye)).join("")}
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
          <div class="master-section-badge">${o.length} استمارة | ${c}% نعم</div>
        </div>
        <div class="master-section-body">
          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${t.success};">
              <div style="font-size:11px;font-weight:800;color:${t.success};margin-bottom:6px;">✅ أعلى 5 حقول</div>
              ${$.map((T,Y)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${Y+1}.</span>
                  <span style="flex:1;">${A(T.label)}</span>
                  <span style="font-weight:800;color:${t.success};">${T.yesRate}%</span>
                </div>
              `).join("")}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${t.accent};">
              <div style="font-size:11px;font-weight:800;color:${t.accent};margin-bottom:6px;">❌ أقل 5 حقول</div>
              ${D.map((T,Y)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${Y+1}.</span>
                  <span style="flex:1;">${A(T.label)}</span>
                  <span style="font-weight:800;color:${t.accent};">${T.yesRate}%</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${ie(["القسم","الحقول","النسبة","التقييم"],x.map(T=>{const Y=T.avgRate>=80?"ممتاز ✅":T.avgRate>=60?"جيد 👍":T.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",ne=T.avgRate>=80?t.success:T.avgRate>=60?"#FF9800":T.avgRate>=40?t.warning:t.accent;return[`${T.icon} ${A(T.title)}`,`${T.fields.length}`,`<span style="color:${ne};font-weight:800;">${T.avgRate}%</span>`,`<span style="color:${ne};font-weight:700;">${Y}</span>`]}))}

          <!-- تفاصيل الأقسام -->
          ${x.map(T=>`
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${t.primaryDark};">${T.icon} ${A(T.title)}</span>
                <span style="font-size:14px;font-weight:900;color:${T.avgRate>=70?t.success:T.avgRate>=50?t.warning:t.accent};">${T.avgRate}%</span>
              </div>
              ${T.fields.map(Y=>`
                <div class="yesno-field-row">
                  <span style="flex:1;font-size:11px;">${A(Y.label)}</span>
                  <span style="flex:1.2;">${de(Y.yesRate)}</span>
                  <span style="font-size:9px;color:${t.textMuted};min-width:50px;text-align:left;">✓${Y.yes} ✗${Y.no}</span>
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
          <div class="master-section-badge">${H} استمارة | ${q} تحدي</div>
        </div>
        <div class="master-section-body">
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${P("استمارات مُعبأة",H,"📋",t.primary)}
            ${P("تحديات",q,"⚠️","#E53935")}
            ${P("إجراءات",ae,"📋","#1565C0")}
            ${P("توصيات",X,"💡","#2E7D32")}
          </div>

          ${G.length===0?`
            <div style="text-align:center;padding:20px;color:${t.textMuted};font-size:12px;">لا توجد تحديات مُسجّلة</div>
          `:""}

          ${G.map(T=>`
            <div class="challenge-card">
              <div class="challenge-header">
                <div>
                  <div style="font-size:13px;font-weight:800;color:${t.primaryDark};">🏛️ ${A(T.govName)}</div>
                  <div style="font-size:10px;color:${t.textMuted};">📝 ${T.count} استمارة | 👥 ${T.supervisorNames.size} مشرف</div>
                </div>
                <div style="display:flex;gap:8px;font-size:10px;">
                  <span style="background:#FFF5F5;color:#E53935;padding:2px 8px;border-radius:8px;">⚠️ ${T.challenges.length}</span>
                  <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;">📋 ${T.actions.length}</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;">💡 ${T.recommendations.length}</span>
                </div>
              </div>
              <div style="padding:10px 14px;">
                ${fe("challenges",T.challenges)}
                ${fe("actions",T.actions)}
                ${fe("recommendations",T.recommendations)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      ${Te()}
    </body>
    </html>
  `;Ce(ve,`التقرير_الشامل_المشرفين_${i}`)}const pa="🏛️";async function Io(e){const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=await cs(e),{enriched:l,govs:u,targetDate:b,dayName:N,dateArabic:_}=i,m=l.filter(f=>f.isGenSupervisor);let F=m,M=u;e!=null&&e.governorateId&&e.governorateId!=="all"&&(M=u.filter(f=>f.id===e.governorateId),F=m.filter(f=>f.govId===e.governorateId));const S=new Map;for(const f of F){const E=f.govId||"_no_gov";S.has(E)||S.set(E,{govName:f.govName||"غير محدد",govId:f.govId,users:[]}),S.get(E).users.push(f)}const y=F.filter(f=>!f.govId);F.filter(f=>f.govId);const k=F.length,C=F.filter(f=>f.totalToday>0).length,R=F.filter(f=>f.totalToday===0).length,v=F.reduce((f,E)=>f+E.totalToday,0),j=F.reduce((f,E)=>f+E.submittedToday,0),d=F.reduce((f,E)=>f+E.draftToday,0),h=[...S.values()].filter(f=>f.users.some(E=>E.totalToday>0)).length,p=k>0?Math.round(C/k*100):0,r=F.filter(f=>f.totalToday>=5).length,o=F.filter(f=>f.totalToday>=2&&f.totalToday<5).length,g=F.filter(f=>f.totalToday===1).length,n=F.filter(f=>f.totalToday===0).length;function x(f,E){let c;f.totalToday===0?c='<span class="perf-badge perf-inactive">❌ غير نشط</span>':f.totalToday>=5?c='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':f.totalToday>=2?c='<span class="perf-badge perf-good">✅ جيد</span>':c='<span class="perf-badge perf-weak">⚠️ ضعيف</span>';const L=f.totalToday>0?Math.round(f.submittedToday/f.totalToday*100):0;return`
      <tr class="${f.totalToday===0?"row-inactive":""}">
        <td class="num">${E+1}</td>
        <td>
          <div class="user-name">${pa} ${A(f.full_name||"—")}</div>
        </td>
        <td>${A(f.govName||"—")}</td>
        <td class="num">${f.totalToday}</td>
        <td class="num num-success">${f.submittedToday}</td>
        <td class="num num-warning">${f.draftToday}</td>
        <td class="num" style="color:${L>=80?t.success:L>=50?t.warning:t.accent};font-weight:700">${L}%</td>
        <td>${c}</td>
      </tr>
    `}const I=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف عام — ${_}</title>
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
      ${je("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي"+De(s),`${N} — ${_}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${N} — ${_}</div>
        <div class="day-date">تقرير تقييم إشراف عام — المشرفين العامين</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${V("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${P("إجمالي إشراف عام",k,"🏛️","#1565C0")}
        ${P("نشط اليوم",C,"✅",t.success,`${p}%`)}
        ${P("غير نشط",R,"❌",t.accent,`${k>0?Math.round(R/k*100):0}%`)}
        ${P("محافظات مغطاة",`${h}/${M.length}`,"📍",t.info)}
        ${P("إجمالي الاستمارات",v,"📋",t.info,`مرسلة: ${j} | مسودة: ${d}`)}
      </div>

      <!-- ═══ توزيع مستوى الأداء ═══ -->
      ${V("📈","توزيع مستوى الأداء")}
      <div class="perf-grid">
        <div class="perf-card excellent">
          <div class="perf-value" style="color:#1B5E20">${r}</div>
          <div class="perf-label">⭐ ممتاز</div>
          <div class="perf-sub">5+ استمارات</div>
        </div>
        <div class="perf-card good">
          <div class="perf-value" style="color:#0D47A1">${o}</div>
          <div class="perf-label">✅ جيد</div>
          <div class="perf-sub">2-4 استمارات</div>
        </div>
        <div class="perf-card weak">
          <div class="perf-value" style="color:#E65100">${g}</div>
          <div class="perf-label">⚠️ ضعيف</div>
          <div class="perf-sub">استمارة واحدة</div>
        </div>
        <div class="perf-card inactive-card">
          <div class="perf-value" style="color:${t.accent}">${n}</div>
          <div class="perf-label">❌ غير نشط</div>
          <div class="perf-sub">لا استمارات</div>
        </div>
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${k}</span>
        <span class="summary-chip chip-active">✅ نشط: ${C}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${R}</span>
        <span class="summary-chip chip-excellent">⭐ ممتاز: ${r}</span>
        <span class="summary-chip chip-good">✅ جيد: ${o}</span>
        <span class="summary-chip chip-weak">⚠️ ضعيف: ${g}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${S.size>0?`
        ${V("📊","ملخص المحافظات")}
        ${ie(["المحافظة","إشراف عام","نشط","غير نشط","الاستمارات","نسبة النشاط"],[...S.values()].filter(f=>f.govId).map(f=>{const E=f.users.filter(D=>D.totalToday>0).length,c=f.users.filter(D=>D.totalToday===0).length,L=f.users.reduce((D,z)=>D+z.totalToday,0),$=f.users.length>0?Math.round(E/f.users.length*100):0;return[A(f.govName),`${f.users.length}`,`<span style="color:${t.success};font-weight:700">${E}</span>`,`<span style="color:${c>0?t.accent:t.textMuted}">${c}</span>`,`${L}`,`<span style="color:${$>=70?t.success:$>=40?t.warning:t.accent};font-weight:700">${$}%</span>`]}))}
      `:""}

      <!-- ═══ ترتيب المشرفين العامين ═══ -->
      ${F.length>0?`
        ${V("🏆","ترتيب المشرفين العامين")}
        <table class="data-table ranking-table">
          <thead>
            <tr><th>الترتيب</th><th>الاسم</th><th>المحافظة</th><th>الاستمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
          </thead>
          <tbody>
            ${[...F].sort((f,E)=>E.totalToday-f.totalToday).map((f,E)=>{const c=E===0?"rank-gold":E===1?"rank-silver":E===2?"rank-bronze":"",L=E===0?"🥇":E===1?"🥈":E===2?"🥉":`${E+1}`,$=f.totalToday>0?Math.round(f.submittedToday/f.totalToday*100):0;let D;return f.totalToday===0?D='<span class="perf-badge perf-inactive">❌ غير نشط</span>':f.totalToday>=5?D='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':f.totalToday>=2?D='<span class="perf-badge perf-good">✅ جيد</span>':D='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                  <tr class="${c} ${f.totalToday===0?"row-inactive":""}">
                    <td class="num" style="font-size:14px;font-weight:900">${L}</td>
                    <td><div class="user-name">${pa} ${A(f.full_name||"—")}</div></td>
                    <td>${A(f.govName||"—")}</td>
                    <td class="num" style="font-weight:800;font-size:13px">${f.totalToday}</td>
                    <td class="num num-success">${f.submittedToday}</td>
                    <td class="num num-warning">${f.draftToday}</td>
                    <td class="num" style="color:${$>=80?t.success:$>=50?t.warning:t.accent};font-weight:700">${$}%</td>
                    <td>${D}</td>
                  </tr>
                `}).join("")}
          </tbody>
        </table>
      `:""}

      <!-- ═══ تفاصيل حسب المحافظة ═══ -->
      ${[...S.values()].filter(f=>f.govId).map(f=>{const E=f.users.filter($=>$.totalToday>0).length,c=f.users.reduce(($,D)=>$+D.totalToday,0),L=f.users.length>0?Math.round(E/f.users.length*100):0;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${A(f.govName)}</div>
                <div class="gov-stats">${f.users.length} إشراف عام | نشط: ${E} | غير نشط: ${f.users.length-E}</div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${c}</strong> | نسبة النشاط: <strong style="color:${L>=70?"#A5D6A7":L>=40?"#FFE082":"#EF9A9A"}">${L}%</strong>
              </div>
            </div>

            ${f.users.length===0?'<div class="no-data-msg">لا يوجد مشرفين عامين في هذه المحافظة</div>':`
              <table class="data-table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
                </thead>
                <tbody>
                  ${f.users.sort(($,D)=>D.totalToday-$.totalToday).map(($,D)=>x($,D)).join("")}
                </tbody>
              </table>
            `}
          </div>
        `}).join("")}

      <!-- ═══ المشرفون العامون بدون محافظة ═══ -->
      ${y.length>0?`
        <div class="no-gov-section">
          <div class="no-gov-title">⚠️ إشراف عام بدون محافظة مسجّلة (${y.length})</div>
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>التقييم</th></tr>
            </thead>
            <tbody>
              ${y.sort((f,E)=>E.totalToday-f.totalToday).map((f,E)=>{let c;return f.totalToday===0?c='<span class="perf-badge perf-inactive">❌ غير نشط</span>':f.totalToday>=5?c='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':f.totalToday>=2?c='<span class="perf-badge perf-good">✅ جيد</span>':c='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                    <tr class="${f.totalToday===0?"row-inactive":""}">
                      <td class="num">${E+1}</td>
                      <td><div class="user-name">${pa} ${A(f.full_name||"—")}</div></td>
                      <td class="num">${f.totalToday}</td>
                      <td class="num num-success">${f.submittedToday}</td>
                      <td class="num num-warning">${f.draftToday}</td>
                      <td>${c}</td>
                    </tr>
                  `}).join("")}
            </tbody>
          </table>
        </div>
      `:""}

      ${Te()}
    </body>
    </html>
  `;Ce(I,`تقييم_إشراف_عام_${b}`)}const vt=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟",required:!0},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟",required:!0},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟",required:!0}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟",required:!0},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟",required:!0},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟",required:!0},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟",required:!0},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟",required:!0}]},{id:"records_and_docs",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟",required:!0},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟",required:!0},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟",required:!0},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟",required:!0}]},{id:"vaccination_cards",title:"بطاقات التحصين",icon:"💉",fields:[{key:"child_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للأطفال؟",required:!0},{key:"women_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للنساء؟",required:!0}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟",required:!0},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟",required:!0},{key:"respiratory_rate_check",label:"هل يتم احتساب سرعة التنفس للأطفال؟",required:!1},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟",required:!1},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟",required:!1},{key:"clean_delivery_kit",label:"هل يتم تزويد الحوامل بعلبة الولادة النظيفة؟",required:!1},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟",required:!1}]},{id:"vitamins_and_referral",title:"الفيتامينات والإحالة",icon:"💊",fields:[{key:"vitamin_a_children",label:"هل يُعطي فيتامين أ للأطفال؟",required:!1},{key:"vitamin_a_women",label:"هل يُعطي فيتامين أ للنساء؟",required:!1},{key:"facility_referral",label:"هل يتم الإحالة للمرفق الصحي؟",required:!1},{key:"correct_medication",label:"هل يتم إعطاء الأدوية بطريقة سليمة؟",required:!1},{key:"nutrition_counseling",label:"هل يتم النصح والإرشاد الغذائي؟",required:!1}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟",required:!0},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟",required:!0},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟",required:!0}]},{id:"supplies_equipment",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟",required:!0},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟",required:!0},{key:"fetal_stethoscope",label:"هل توجد سماعة جنين؟",required:!0},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟",required:!0},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟",required:!0},{key:"height_board",label:"هل يوجد شريط قياس الطول؟",required:!0},{key:"thermometer",label:"هل يوجد ترمومتر؟",required:!0},{key:"scale",label:"هل يوجد ميزان؟",required:!0},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟",required:!0}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟",required:!0},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟",required:!0},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟",required:!0},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟",required:!0}]},{id:"catch_up_policy",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟",required:!0},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟",required:!0},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟",required:!0},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟",required:!0},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟",required:!0},{key:"catch_up_2to5_registration",label:"هل يتم تطعيم أطفال 2-5 سنوات وتسجيلهم؟",required:!0},{key:"team_target_knowledge",label:"هل لدى الفريق معرفة بالمستهدفين؟",required:!0}]},{id:"defaulter_tracking",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟",required:!0},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟",required:!0}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟",required:!0},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟",required:!0}]}];async function Ao(e){var E;const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date().toISOString().split("T")[0],l=(e==null?void 0:e.dateFrom)||i,u=(e==null?void 0:e.dateTo)||i,b=`${l}T00:00:00`,N=`${u}T23:59:59`,_=await We({table:"form_submissions",select:"id, data, governorate_id, submitted_by, created_at",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:c=>(c=c.eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").is("deleted_at",null).eq("status","submitted").gte("created_at",b).lte("created_at",N),e!=null&&e.governorateId&&e.governorateId!=="all"&&(c=c.eq("governorate_id",e.governorateId)),s&&(c=c.eq("campaign_round",s)),c)}),m=await K.from("profiles").select("id, full_name, role").is("deleted_at",null),F=new Map;for(const c of m.data||[])F.set(c.id,{name:c.full_name,role:c.role});const M=await K.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),S=new Map;for(const c of M.data||[])S.set(c.id,c.name_ar);const y=_.data.map(c=>({...c,profiles:F.get(c.submitted_by)||null,governorates:c.governorate_id?{name_ar:S.get(c.governorate_id)||"غير محدد"}:null})),k=y.length,C=vt.flatMap(c=>c.fields.map(L=>L.key)),R=new Map;for(const c of vt)for(const L of c.fields)R.set(L.key,{yes:0,no:0,total:0,label:L.label,sectionId:c.id});const v=new Map;for(const c of y){const L=c.data||{},$=((E=c.governorates)==null?void 0:E.name_ar)||"غير محدد";if(!v.has($)){v.set($,new Map);for(const D of C)v.get($).set(D,{yes:0,no:0,total:0})}for(const D of C){const z=L[D],W=R.get(D);W&&(z===!0||z==="yes"||z==="نعم"?(W.yes++,W.total++,v.get($).get(D).yes++,v.get($).get(D).total++):(z===!1||z==="no"||z==="لا")&&(W.no++,W.total++,v.get($).get(D).no++,v.get($).get(D).total++))}}const j=vt.map(c=>{const L=c.fields.map(w=>({...w,...R.get(w.key),yesRate:R.get(w.key).total>0?Math.round(R.get(w.key).yes/R.get(w.key).total*100):0})),$=L.reduce((w,O)=>w+O.yes,0),D=L.reduce((w,O)=>w+O.no,0),z=$+D,W=z>0?Math.round($/z*100):0;return{...c,fields:L,totalYes:$,totalNo:D,total:z,avgRate:W}}),d=j.reduce((c,L)=>c+L.totalYes,0),h=j.reduce((c,L)=>c+L.totalNo,0),p=d+h,r=p>0?Math.round(d/p*100):0,o=j.flatMap(c=>c.fields.filter(L=>L.total>0)),g=[...o].sort((c,L)=>L.yesRate-c.yesRate).slice(0,5),n=[...o].sort((c,L)=>c.yesRate-L.yesRate).slice(0,5),x=l===u?Pe(new Date(l)):`${Pe(new Date(l))} — ${Pe(new Date(u))}`;function I(c,L="sm"){const $=c>=80?t.success:c>=60?t.warning:c>=40?"#FF9800":t.accent,D=L==="lg"?"14px":"8px";return`
      <div style="display:flex;align-items:center;gap:6px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:${D};height:${D};overflow:hidden;">
          <div style="width:${c}%;height:100%;background:${$};border-radius:${D};transition:width 0.3s;"></div>
        </div>
        <span style="font-size:${L==="lg"?"11px":"9px"};font-weight:700;color:${$};min-width:35px;text-align:left;">${c}%</span>
      </div>
    `}const f=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل حقول نعم/لا — ${x}</title>
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
      ${je("تحليل حقول نعم/لا","استمارة الاشراف للنشاط الايصالي التكاملي"+De(s),x)}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحليل")}
      <div class="kpi-grid">
        ${P("إجمالي الاستمارات",k,"📋",t.primary)}
        ${P("نسبة نعم الكلية",`${r}%`,"✅",r>=70?t.success:r>=50?t.warning:t.accent,`${d}/${p}`)}
        ${P("نسبة لا الكلية",`${100-r}%`,"❌",t.accent,`${h}/${p}`)}
        ${P("عدد الأقسام",vt.length,"📑",t.info)}
        ${P("عدد الحقول",C.length,"📝","#6366f1")}
      </div>

      <!-- ═══ أفضل وأسوأ 5 حقول ═══ -->
      <div class="top-bottom-grid">
        <div class="top-bottom-card" style="border-top: 4px solid ${t.success};">
          <div class="top-bottom-title" style="color:${t.success};">✅ أعلى 5 حقول (نعم)</div>
          ${g.map((c,L)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${L+1}.</span>
              <span class="top-item-label">${A(c.label)}</span>
              <span class="top-item-rate" style="color:${t.success};">${c.yesRate}%</span>
            </div>
          `).join("")}
        </div>
        <div class="top-bottom-card" style="border-top: 4px solid ${t.accent};">
          <div class="top-bottom-title" style="color:${t.accent};">❌ أقل 5 حقول (نعم)</div>
          ${n.map((c,L)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${L+1}.</span>
              <span class="top-item-label">${A(c.label)}</span>
              <span class="top-item-rate" style="color:${t.accent};">${c.yesRate}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ═══ تفصيل حسب القسم ═══ -->
      ${V("📑","تحليل حسب القسم")}
      ${j.map(c=>`
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">${c.icon} ${A(c.title)} (${c.fields.length} حقل)</div>
            <div class="section-card-rate" style="color:${c.avgRate>=70?t.success:c.avgRate>=50?t.warning:t.accent};">${c.avgRate}%</div>
          </div>
          ${c.fields.map(L=>{const $=L.yesRate;return`
              <div class="field-row">
                <div class="field-label">${A(L.label)}</div>
                <div style="flex:1.5;">${I($)}</div>
                <div class="field-stats">
                  <span class="stat-yes">✓ ${L.yes}</span>
                  <span class="stat-no">✗ ${L.no}</span>
                  <span class="stat-total">(${L.total})</span>
                </div>
              </div>
            `}).join("")}
        </div>
      `).join("")}

      <!-- ═══ ملخص حسب المحافظة ═══ -->
      ${V("🏛️","ملخص حسب المحافظة")}
      <div class="gov-table-wrap">
        ${ie(["المحافظة","الاستمارات","نسبة نعم الكلية",...vt.slice(0,6).map(c=>c.icon+" "+c.title.slice(0,8))],[...v.entries()].map(([c,L])=>{const $=y.filter(O=>{var G;return((G=O.governorates)==null?void 0:G.name_ar)===c}).length;let D=0,z=0;for(const[,O]of L)D+=O.yes,z+=O.total;const W=z>0?Math.round(D/z*100):0,w=vt.slice(0,6).map(O=>{let G=0,H=0;for(const ae of O.fields){const X=L.get(ae.key);X&&(G+=X.yes,H+=X.total)}const q=H>0?Math.round(G/H*100):0;return`<span style="color:${q>=70?t.success:q>=50?t.warning:t.accent};font-weight:700;">${q}%</span>`});return[A(c),`${$}`,`<span style="color:${W>=70?t.success:W>=50?t.warning:t.accent};font-weight:800;font-size:12px;">${W}%</span>`,...w]}))}
      </div>

      <!-- ═══ ملخص حسب القسم ═══ -->
      ${V("📈","مقارنة الأقسام")}
      ${ie(["القسم","الحقول","نعم","لا","المجموع","النسبة","التقييم"],j.map(c=>{const L=c.avgRate>=80?"ممتاز ✅":c.avgRate>=60?"جيد 👍":c.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",$=c.avgRate>=80?t.success:c.avgRate>=60?"#FF9800":c.avgRate>=40?t.warning:t.accent;return[`${c.icon} ${A(c.title)}`,`${c.fields.length}`,`<span style="color:${t.success};font-weight:700;">${c.totalYes}</span>`,`<span style="color:${t.accent};font-weight:700;">${c.totalNo}</span>`,`${c.total}`,`<span style="color:${$};font-weight:800;">${c.avgRate}%</span>`,`<span style="color:${$};font-weight:700;">${L}</span>`]}))}

      ${Te()}
    </body>
    </html>
  `;Ce(f,`تحليل_نعم_لا_${l}_${u}`)}const Lo={عدن:{center:[12.78,45.02],zoom:11},تعز:{center:[13.58,44.02],zoom:11},الحديدة:{center:[14.8,42.95],zoom:11},البيضاء:{center:[13.98,45.57],zoom:11},مأرب:{center:[15.47,45.33],zoom:10},الجوف:{center:[16.78,45.58],zoom:10},حجة:{center:[15.69,43.6],zoom:10},أبين:{center:[13.43,45.37],zoom:11},لحج:{center:[13.05,44.88],zoom:11},شبوة:{center:[14.88,46.83],zoom:10},المهرة:{center:[15.8,51.5],zoom:9},المكلا:{center:[14.53,49.13],zoom:11},سيئون:{center:[15.97,48.78],zoom:10},الضالع:{center:[13.7,44.73],zoom:11},سقطرى:{center:[12.47,53.87],zoom:9},حضرموت:{center:[15.4,49],zoom:9}};async function Go(e){var v;const s=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,i=new Date().toISOString().split("T")[0],l=(e==null?void 0:e.dateFrom)||i,u=(e==null?void 0:e.dateTo)||i;async function b(){const j=await xr(e==null?void 0:e.campaignType),d=[];let h=0;const p=1e3;for(;;){let r=K.from("form_submissions").select(`
          id, gps_lat, gps_lng, created_at, status, data,
          forms(title_ar, campaign_type),
          profiles:submitted_by(full_name, role),
          governorates(name_ar),
          districts(name_ar)
        `).is("deleted_at",null).not("gps_lat","is",null).not("gps_lng","is",null).gte("created_at",`${l}T00:00:00`).lte("created_at",`${u}T23:59:59`).order("created_at",{ascending:!1}).range(h,h+p-1);j&&j.length>0&&(r=r.in("form_id",j)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(r=r.eq("governorate_id",e.governorateId)),s&&(r=r.eq("campaign_round",s));const{data:o,error:g}=await r;if(g||!o||o.length===0||(d.push(...o),o.length<p)||(h+=p,d.length>=1e5))break}return d}const _=(await b()||[]).filter(j=>j.gps_lat&&j.gps_lng&&typeof j.gps_lat=="number"&&typeof j.gps_lng=="number"&&j.gps_lat!==0&&j.gps_lng!==0),m=new Map;for(const j of _){const d=((v=j.governorates)==null?void 0:v.name_ar)||"غير محدد";m.has(d)||m.set(d,[]),m.get(d).push(j)}const F=_.map(j=>{var d,h,p,r;return{lat:j.gps_lat,lng:j.gps_lng,name:((d=j.profiles)==null?void 0:d.full_name)||"—",role:((h=j.profiles)==null?void 0:h.role)||"",gov:((p=j.governorates)==null?void 0:p.name_ar)||"",dist:((r=j.districts)==null?void 0:r.name_ar)||"",date:j.created_at,status:j.status}}),M={};for(const[j,d]of m)M[j]=d.map(h=>{var p,r,o,g;return{lat:h.gps_lat,lng:h.gps_lng,name:((p=h.profiles)==null?void 0:p.full_name)||"—",role:((r=h.profiles)==null?void 0:r.role)||"",gov:((o=h.governorates)==null?void 0:o.name_ar)||"",dist:((g=h.districts)==null?void 0:g.name_ar)||"",date:h.created_at,status:h.status}});const S=JSON.stringify(F),y=JSON.stringify(M),k=JSON.stringify(Lo),C=`<!DOCTYPE html>
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
    <p>استمارة الاشراف للنشاط الايصالي التكاملي — ${l===u?l:l+" إلى "+u}</p>
  </div>

  <div class="stats-bar">
    <div class="stat-chip" style="background:#E3F2FD;color:#1565C0;">📍 إجمالي النقاط: ${_.length}</div>
    <div class="stat-chip" style="background:#E8F5E9;color:#2E7D32;">🏛️ المحافظات: ${m.size}</div>
    <div class="stat-chip" style="background:#FFF3E0;color:#E65100;">👥 المشرفين: ${new Set(_.map(j=>j.submitted_by)).size}</div>
  </div>

  <!-- ═══ الخريطة الكاملة لليمن ═══ -->
  <div class="map-section">
    <div class="map-section-header">
      <div class="map-section-title">🇾🇪 الخريطة الكاملة — جميع المواقع</div>
      <div class="map-section-count">${_.length} موقع</div>
    </div>
    <div id="map-yemen" class="map-container"></div>
    <div class="supervisor-list">
      ${[...m.entries()].map(([j,d])=>{const h=["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#34495e","#16a085","#c0392b","#8e44ad","#2980b9","#27ae60","#d35400","#2c3e50","#7f8c8d"],p=[...m.keys()].indexOf(j);return`<span class="supervisor-tag"><span class="supervisor-dot" style="background:${h[p%h.length]}"></span>${j} (${d.length})</span>`}).join("")}
    </div>
  </div>

  <!-- ═══ خرائط المحافظات ═══ -->
  ${[...m.entries()].map(([j,d])=>`
    <div class="map-section">
      <div class="map-section-header">
        <div class="map-section-title">🏛️ ${j}</div>
        <div class="map-section-count">${d.length} موقع — ${new Set(d.map(h=>h.submitted_by)).size} مشرف</div>
      </div>
      <div id="map-${j.replace(/\s/g,"_")}" class="map-container gov-map"></div>
      <div class="supervisor-list">
        ${[...new Set(d.map(h=>{var p;return((p=h.profiles)==null?void 0:p.full_name)||"—"}))].map(h=>{const p=d.filter(r=>{var o;return((o=r.profiles)==null?void 0:o.full_name)===h}).length;return`<span class="supervisor-tag">👤 ${h} (${p})</span>`}).join("")}
      </div>
    </div>
  `).join("")}

  <script>
    // ═══ Data ═══
    const allMarkers = ${S};
    const govMarkers = ${y};
    const govCenters = ${k};

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
</html>`,R=window.open("","_blank");R&&(R.document.write(C),R.document.close())}function Oo(){var Da;const{data:e}=Us(),s=((Da=e==null?void 0:e.profile)==null?void 0:Da.role)||"data_entry",{campaign:i,labelAr:l,isFiltered:u,campaignRound:b,showRoundFilter:N}=Vt(),{toast:_}=Ha(),{previewProps:m,openPreview:F,closePreview:M}=ts(),S=Nr(),y=N?b:void 0,{data:k,isLoading:C,refetch:R}=gr(i,y),{data:v,isLoading:j}=ur(i,y),{data:d,isLoading:h,refetch:p}=hr({campaignType:i}),{data:r}=fr(i,y),{data:o}=ls(),{data:g,isLoading:n}=pr(i,y),{data:x}=mr(),{data:I}=vr({page:1}),f=(d==null?void 0:d.data)||[],[E,c]=le.useState("analytics"),[L]=Ls();le.useEffect(()=>{const U=L.get("tab");U&&["analytics","quick-reports","form-exports","comparison"].includes(U)&&c(U)},[L]);const[$,D]=le.useState(null),[z,W]=le.useState(null),[w,O]=le.useState(""),[G,H]=le.useState(""),[q,ae]=le.useState(""),[X,de]=le.useState("all"),[fe,xe]=le.useState({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),[ve,T]=le.useState(!1),[Y,ne]=le.useState(null),[we,be]=le.useState(null),[ye,Ie]=le.useState(""),[pe,Ae]=le.useState("all"),Zt=le.useMemo(()=>f.filter(U=>{if(w){const ue=w.toLowerCase();return U.title_ar.toLowerCase().includes(ue)||U.title_en.toLowerCase().includes(ue)}return!0}),[f,w]),oe=le.useCallback(async(U,ue)=>{W(U);try{await ue(),_({title:"تم تصدير التقرير بنجاح ✅",variant:"success"})}catch(ee){console.error(ee),_({title:"فشل التصدير",variant:"destructive"})}finally{W(null)}},[_]),pt=()=>oe("dashboard",()=>{k&&Kr(k)}),ea=()=>oe("governorates",()=>{v&&Hr(v.map(U=>({name:U.name,submissions:U.submissions})))}),ta=()=>oe("users",async()=>{S.startFetch();const U=await to();S.updateFetchProgress(U.fetchedCount,U.totalCount),S.startGenerate(),Qr((U.data||[]).map(ue=>{var ee;return{full_name:ue.full_name,email:ue.email,role:ue.role,is_active:ue.is_active,governorate:(ee=ue.governorates)==null?void 0:ee.name_ar,created_at:ue.created_at}})),S.done(`تم تصدير ${U.fetchedCount} مستخدم`)}),B=()=>oe("submissions",async()=>{S.startFetch();const U=await eo({governorateId:X!=="all"?X:void 0,dateFrom:G||void 0,dateTo:q||void 0});S.updateFetchProgress(U.fetchedCount,U.totalCount),S.startGenerate();const ue=U.data.map((ee,te)=>{var se,me,Le,Se,ce;return{index:te+1,form:((se=ee.forms)==null?void 0:se.title_ar)||"",status:ee.status==="submitted"?"مرسلة":"مسودة",submitted_by:((me=ee.profiles)==null?void 0:me.full_name)||"",governorate:((Le=ee.governorates)==null?void 0:Le.name_ar)||"",district:((Se=ee.districts)==null?void 0:Se.name_ar)||"",campaign:((ce=ee.forms)==null?void 0:ce.campaign_type)==="polio_campaign"?"شلل أطفال":"إيصالي",date:new Date(ee.created_at).toLocaleDateString("ar-SA")}});Xr(ue),S.done(`تم تصدير ${ue.length} إرسالية${U.truncated?" (مُقتطع)":""}`)}),J=()=>oe("shortages",async()=>{S.startFetch();const U=await ao();S.updateFetchProgress(U.fetchedCount,U.totalCount),S.startGenerate();const ue={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ee=U.data.map((te,se)=>{var me,Le;return{index:se+1,item:te.item_name,category:te.item_category||"",needed:te.quantity_needed||"",available:te.quantity_available||0,severity:ue[te.severity]||te.severity,resolved:te.is_resolved?"نعم":"لا",by:((me=te.profiles)==null?void 0:me.full_name)||"",gov:((Le=te.governorates)==null?void 0:Le.name_ar)||"",date:new Date(te.created_at).toLocaleDateString("ar-SA")}});Jr(ee),S.done(`تم تصدير ${ee.length} نقص`)}),re=()=>oe("timeline",()=>{g&&Vr(g)}),he=()=>oe("roles",()=>{x&&Zr(x.map(U=>({name:U.name,value:U.value})))}),$e=()=>oe("audit",()=>{if(!(I!=null&&I.data))return;const U=[{header:"#",key:"index",width:6},{header:"العملية",key:"action",width:15},{header:"الجدول",key:"table",width:15},{header:"المستخدم",key:"user",width:20},{header:"التفاصيل",key:"details",width:30},{header:"التاريخ",key:"date",width:18}],ue=I.data.map((ee,te)=>{var se;return{index:te+1,action:ee.action,table:ee.table_name||"",user:((se=ee.profiles)==null?void 0:se.full_name)||"",details:JSON.stringify(ee.new_data||{}).slice(0,100),date:new Date(ee.created_at).toLocaleDateString("ar-SA")}});ja({sheetName:"سجل التدقيق",title:"سجل التدقيق — EPI Supervisor",subtitle:`${ue.length} عملية`,columns:U,data:ue,fileName:`audit_log_${new Date().toISOString().split("T")[0]}`})}),Ke=()=>oe("health-facility-assessment",async()=>{S.startFetch();const{data:U,error:ue}=await K.from("form_submissions").select(`
        id, status, data, created_at,
        profiles:submitted_by(full_name, email),
        governorates(name_ar),
        districts(name_ar)
      `).eq("form_id","606b5093-9a8f-47d6-a6c9-b0429ce4a9f6").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);if(ue)throw ue;S.updateFetchProgress((U==null?void 0:U.length)||0,(U==null?void 0:U.length)||0),S.startGenerate();const ee=me=>me===!0||me==="yes"?"نعم":"لا",te=(U||[]).map((me,Le)=>{var Se,ce,Re,ze,st,It,kt,mt,Ge,Ue,ht,Qe;return{index:Le+1,status:me.status==="submitted"?"مرسلة":"مسودة",supervisor:((Se=me.profiles)==null?void 0:Se.full_name)||"",governorate:((ce=me.governorates)==null?void 0:ce.name_ar)||"",district:((Re=me.districts)==null?void 0:Re.name_ar)||"",date:new Date(me.created_at).toLocaleDateString("ar-SA"),defaulter_list:ee((ze=me.data)==null?void 0:ze.has_defaulter_list),village_list:ee((st=me.data)==null?void 0:st.has_village_list),updated_plan:ee((It=me.data)==null?void 0:It.has_updated_plan),population_data:ee((kt=me.data)==null?void 0:kt.has_population_data),coverage_plan:ee((mt=me.data)==null?void 0:mt.has_coverage_plan),plan_reviewed:ee((Ge=me.data)==null?void 0:Ge.plan_reviewed_by_higher_level),reverse_coverage:ee((Ue=me.data)==null?void 0:Ue.has_reverse_coverage),higher_visit:ee((ht=me.data)==null?void 0:ht.has_higher_level_visit),routine_coverage_85:ee((Qe=me.data)==null?void 0:Qe.routine_coverage_above_85)}}),se=[{header:"#",key:"index",width:5},{header:"الحالة",key:"status",width:10},{header:"المشرف",key:"supervisor",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"التاريخ",key:"date",width:12},{header:"قائمة المتخلفين",key:"defaulter_list",width:12},{header:"قائمة القرى",key:"village_list",width:10},{header:"خطة محدّثة",key:"updated_plan",width:10},{header:"بيانات سكانية",key:"population_data",width:10},{header:"خطة التغطية",key:"coverage_plan",width:10},{header:"مراجعة الخطة",key:"plan_reviewed",width:10},{header:"تغطية راجعة",key:"reverse_coverage",width:10},{header:"زيارة المستوى الأعلى",key:"higher_visit",width:12},{header:"تغطية >85%",key:"routine_coverage_85",width:10}];ja({sheetName:"تقييم المرافق الصحية",title:"تقرير تقييم جودة أداء المرافق الصحية",subtitle:`${te.length} تقييم`,columns:se,data:te,fileName:`health_facility_assessment_${new Date().toISOString().split("T")[0]}`}),S.done(`تم تصدير ${te.length} تقييم`)}),Ne=()=>oe("pdf",async()=>{var Le;const{data:U}=await K.from("governorates").select("name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar"),{data:ue}=await K.from("form_submissions").select("governorate_id, status, governorates(name_ar)").is("deleted_at",null).gte("created_at",new Date(Date.now()-720*60*60*1e3).toISOString()),ee=new Map;for(const Se of ue||[]){const ce=((Le=Se.governorates)==null?void 0:Le.name_ar)||"غير محدد",Re=ee.get(ce)||{name:ce,count:0};Re.count++,ee.set(ce,Re)}const{data:te}=await K.from("form_submissions").select("status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(20),se={submitted:"مرسلة",draft:"مسودة",approved:"معتمدة",rejected:"مرفوضة"},me=Rt({title:"تقرير الإرساليات الشامل",subtitle:"إحصائيات تفصيلية للإرساليات والاستمارات",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"إجمالي الإرساليات",value:(k==null?void 0:k.total_submissions)||0,icon:"📋",color:"#1565C0"},{label:"مرسلة",value:((k==null?void 0:k.total_submissions)||0)-((k==null?void 0:k.draft_submissions)||0),icon:"✅",color:"#2E7D32"},{label:"مسودات",value:(k==null?void 0:k.draft_submissions)||0,icon:"📝",color:"#F57F17"},{label:"اليوم",value:(k==null?void 0:k.submissions_today)||0,icon:"📅",color:"#0277BD"}]},{title:"الإرساليات حسب المحافظة",icon:"🗺️",type:"table",columns:[{key:"name",label:"المحافظة"},{key:"count",label:"عدد الإرساليات"}],rows:Array.from(ee.values()).sort((Se,ce)=>ce.count-Se.count).slice(0,15)},{title:"آخر الإرساليات",icon:"📝",type:"table",columns:[{key:"form",label:"الاستمارة"},{key:"submitter",label:"المقدم"},{key:"governorate",label:"المحافظة"},{key:"status",label:"الحالة"},{key:"date",label:"التاريخ"}],rows:(te||[]).map(Se=>{var ce,Re,ze;return{form:((ce=Se.forms)==null?void 0:ce.title_ar)||"—",submitter:((Re=Se.profiles)==null?void 0:Re.full_name)||"—",governorate:((ze=Se.governorates)==null?void 0:ze.name_ar)||"—",status:se[Se.status]||Se.status,date:new Date(Se.created_at).toLocaleDateString("ar-SA")}})}]});F("تقرير الإرساليات الشامل",me,"آخر 30 يوم")}),Me=()=>oe("gov-pdf",async()=>{if(!v)return;const U=v.filter(se=>se.submissions===0),ue=v.length>0?v[0]:null,ee=v.length>0?Math.round(v.filter(se=>se.submissions>0).length/v.length*100):0,te=Rt({title:"تقرير أداء المحافظات",subtitle:"مقارنة شاملة لأداء جميع المحافظات",sections:[{title:"مؤشرات التغطية",icon:"🎯",type:"kpi-grid",kpis:[{label:"نسبة التغطية",value:`${ee}%`,icon:"📊",color:ee>=80?"#2E7D32":"#F57F17"},{label:"محافظات نشطة",value:v.filter(se=>se.submissions>0).length,icon:"🏛️",color:"#1565C0"},{label:"بدون تغطية",value:U.length,icon:"⚠️",color:U.length>0?"#E53935":"#2E7D32"},{label:"الأعلى نشاطاً",value:(ue==null?void 0:ue.name)||"—",icon:"🏆",color:"#FFD600"}]},{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:v.map((se,me)=>({rank:me+1,name:se.name,submissions:se.submissions}))},...U.length>0?[{title:"محافظات بدون تغطية",icon:"⚠️",type:"list",items:U.map(se=>({label:se.name,value:"لا توجد إرساليات",color:"#E53935"}))}]:[]]});F("تقرير أداء المحافظات",te,`${v.length} محافظة`)}),ps=()=>oe("users-pdf",async()=>{const{data:U}=await K.from("profiles").select("full_name, email, role, is_active, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),ue={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},ee={};for(const se of U||[])ee[se.role]=(ee[se.role]||0)+1;const te=Rt({title:"تقرير المستخدمين",subtitle:"إحصائيات شاملة للمستخدمين والأدوار",sections:[{title:"ملخص المستخدمين",icon:"👥",type:"kpi-grid",kpis:[{label:"إجمالي المستخدمين",value:(U==null?void 0:U.length)||0,icon:"👤",color:"#1565C0"},{label:"نشطين",value:(U==null?void 0:U.filter(se=>se.is_active).length)||0,icon:"✅",color:"#2E7D32"},{label:"غير نشطين",value:(U==null?void 0:U.filter(se=>!se.is_active).length)||0,icon:"⏸️",color:"#F57F17"}]},{title:"توزيع الأدوار",icon:"📊",type:"summary",items:Object.entries(ee).map(([se,me])=>({label:ue[se]||se,value:me,color:se==="admin"?"#8E24AA":"#1565C0"}))},{title:"قائمة المستخدمين",icon:"📋",type:"table",columns:[{key:"name",label:"الاسم",width:150},{key:"email",label:"البريد",width:180},{key:"role",label:"الدور",width:100},{key:"governorate",label:"المحافظة",width:120},{key:"active",label:"نشط",width:60}],rows:(U||[]).map(se=>{var me;return{name:se.full_name,email:se.email,role:ue[se.role]||se.role,governorate:((me=se.governorates)==null?void 0:me.name_ar)||"—",active:se.is_active?"نعم":"لا"}})}]});F("تقرير المستخدمين",te,`${(U==null?void 0:U.length)||0} مستخدم`)}),ms=()=>oe("shortages-pdf",async()=>{const{data:U}=await K.from("supply_shortages").select("item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),ue={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ee=Rt({title:"تقرير النواقص التفصيلي",subtitle:"نواقص اللقاحات والمعدات والتجهيزات",sections:[{title:"ملخص النواقص",icon:"📦",type:"kpi-grid",kpis:[{label:"إجمالي النواقص",value:(U==null?void 0:U.length)||0,icon:"📦",color:"#1565C0"},{label:"حرجة",value:(U==null?void 0:U.filter(te=>te.severity==="critical").length)||0,icon:"🔴",color:"#E53935"},{label:"عالية",value:(U==null?void 0:U.filter(te=>te.severity==="high").length)||0,icon:"🟠",color:"#FF6D00"},{label:"محلولة",value:(U==null?void 0:U.filter(te=>te.is_resolved).length)||0,icon:"✅",color:"#2E7D32"}]},{title:"نسبة الحل",icon:"🎯",type:"progress",progressItems:[{label:"نواقص محلولة",value:(U==null?void 0:U.filter(te=>te.is_resolved).length)||0,max:(U==null?void 0:U.length)||1,color:"#2E7D32"},{label:"نواقص حرجة",value:(U==null?void 0:U.filter(te=>te.severity==="critical").length)||0,max:(U==null?void 0:U.length)||1,color:"#E53935"}]},{title:"تفاصيل النواقص",icon:"📋",type:"table",columns:[{key:"item",label:"الصنف",width:150},{key:"severity",label:"الخطورة",width:80},{key:"needed",label:"المطلوب",width:80},{key:"available",label:"المتاح",width:80},{key:"gap",label:"النقص",width:80},{key:"governorate",label:"المحافظة",width:120},{key:"resolved",label:"محلول",width:60}],rows:(U||[]).map(te=>{var se;return{item:te.item_name,severity:ue[te.severity]||te.severity,needed:te.quantity_needed||0,available:te.quantity_available||0,gap:Math.max(0,(te.quantity_needed||0)-te.quantity_available),governorate:((se=te.governorates)==null?void 0:se.name_ar)||"—",resolved:te.is_resolved?"نعم":"لا"}})}]});F("تقرير النواقص التفصيلي",ee,`${(U==null?void 0:U.length)||0} نقص`)}),hs=()=>oe("full-pdf",async()=>{if(!k)return;const U=v&&v.length>0?Math.round(v.filter(ee=>ee.submissions>0).length/v.length*100):0,ue=Rt({title:"التقرير الشامل — EPI Supervisor",subtitle:"جميع البيانات والإحصائيات في تقرير واحد",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"المستخدمين",value:k.total_users,icon:"👥",color:"#0277BD",sub:`${k.active_users} نشط`},{label:"إرساليات اليوم",value:k.submissions_today,icon:"📅",color:"#2E7D32"},{label:"المسودات",value:k.draft_submissions,icon:"📝",color:"#F57F17"},{label:"نسبة الإنجاز",value:`${k.approval_rate.toFixed(1)}%`,icon:"🎯",color:"#8E24AA"},{label:"النماذج النشطة",value:k.active_forms,icon:"📄",color:"#1565C0"},{label:"التغطية",value:`${U}%`,icon:"🗺️",color:U>=80?"#2E7D32":"#F57F17"}]},{title:"توزيع الحالات",icon:"📈",type:"summary",items:[{label:"مرسلة",value:k.total_submissions-k.draft_submissions,color:"#2E7D32"},{label:"مسودة",value:k.draft_submissions,color:"#F57F17"},{label:"هذا الأسبوع",value:k.submissions_this_week,color:"#0277BD"},{label:"الاتجاه",value:`${k.submissions_trend>0?"+":""}${k.submissions_trend}%`,color:k.submissions_trend>=0?"#2E7D32":"#E53935"}]},...v&&v.length>0?[{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:v.map((ee,te)=>({rank:te+1,name:ee.name,submissions:ee.submissions}))}]:[]]});F("التقرير الشامل",ue,"جميع البيانات والإحصائيات")}),fs=async(U,ue)=>{D(U.id);try{const ee=U.schema,te=[];ee!=null&&ee.fields&&ee.fields.forEach(ce=>te.push({label_ar:ce.label_ar||ce.label||"",key:ce.id||ce.key||""})),ee!=null&&ee.sections&&ee.sections.forEach(ce=>{var Re;return(Re=ce.fields)==null?void 0:Re.forEach(ze=>te.push({label_ar:ze.label_ar||ze.label||"",key:ze.id||ze.key||""}))});const se=[];let me=0;const Le=1e3;for(;;){const{data:ce,error:Re}=await K.from("form_submissions").select("id, status, data, created_at, profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)").eq("form_id",U.id).is("deleted_at",null).order("created_at",{ascending:!1}).range(me,me+Le-1);if(Re)throw Re;if(!ce||ce.length===0||(se.push(...ce),ce.length<Le||se.length>=5e4))break;me+=Le,await new Promise(ze=>setTimeout(ze,50))}const Se=se.map(ce=>{var Re,ze,st;return{id:ce.id,status:ce.status,submitted_by:((Re=ce.profiles)==null?void 0:Re.full_name)||"",governorate:((ze=ce.governorates)==null?void 0:ze.name_ar)||"",district:((st=ce.districts)==null?void 0:st.name_ar)||"",created_at:ce.created_at,data:ce.data||{}}});if(Se.length===0){_({title:"لا توجد إرساليات",variant:"destructive"});return}if(ue==="csv"){const ce=Ge=>{const Ue=String(Ge??""),ht=/^[=+\-@\t\r]/.test(Ue),Qe=Ue.includes(",")||Ue.includes('"')||Ue.includes(`
`)?`"${Ue.replace(/"/g,'""')}"`:Ue;return ht?`'${Qe}`:Qe},Re=["#","الحالة","المُرسل","المحافظة","التاريخ",...te.map(Ge=>Ge.label_ar)],ze=Se.map((Ge,Ue)=>[Ue+1,ce(Ge.status==="submitted"?"مرسلة":"مسودة"),ce(Ge.submitted_by),ce(Ge.governorate),ce(new Date(Ge.created_at).toLocaleDateString("ar-SA")),...te.map(ht=>{var Qe;return ce((Qe=Ge.data)==null?void 0:Qe[ht.key])})]),st=[Re.join(","),...ze.map(Ge=>Ge.join(","))].join(`
`),It=new Blob(["\uFEFF"+st],{type:"text/csv;charset=utf-8;"}),kt=URL.createObjectURL(It),mt=document.createElement("a");mt.href=kt,mt.download=`${U.title_ar}.csv`,mt.click(),URL.revokeObjectURL(kt)}else qs(U.title_ar,te,Se);_({title:`تم تصدير ${Se.length} إرسالية ✅`,variant:"success"})}catch{_({title:"فشل التصدير",variant:"destructive"})}finally{D(null)}},Fe=async(U,ue,ee)=>{const te=no();try{await ee();const se=qa(te);se&&F(U,se,ue)}catch(se){throw qa(te),se}},vs=()=>oe("central-report",()=>Fe("التقرير المركزي الشامل","جميع المحافظات والبيانات",()=>lo({dateFrom:G||void 0,dateTo:q||void 0,campaignType:i!=="all"?i:void 0,campaignRound:y}))),bs=U=>oe("gov-detail-"+U,()=>Fe("تقرير محافظة","تفاصيل تفصيلية",()=>io(U,{dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),xs=U=>oe("form-analysis-"+U,()=>Fe("تحليل النموذج","تقرير تفصيلي",()=>co(U,{dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),ys=()=>oe("supervisor-report",()=>Fe("تقرير أداء المشرفين","تقييم شامل لكل مشرف",()=>go({dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),$s=()=>oe("coverage-gap",()=>Fe("تقرير الفجوة التغطية","أين البيانات ناقصة",()=>uo({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y}))),_s=()=>oe("campaign-comparison",()=>Fe("تقرير مقارنة الحملات","شلل أطفال vs الإيصالي التكاملي",()=>po({dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),ws=()=>oe("daily-activity",()=>Fe("تقرير النشاط اليومي","نشاط اليوم — إرساليات، دخول، مقارنة",()=>mo({campaignRound:y}))),Ss=()=>oe("data-quality",()=>Fe("تقرير جودة البيانات","تحليل اكتمال البيانات — GPS، صور، حقول فارغة",()=>ho({dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),ks=()=>oe("shortages-detailed",()=>Fe("تقرير النواقص التفصيلي","تحليل شامل — حرج/عالي/متوسط",()=>fo({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0}))),Fs=()=>oe("weekly-report",()=>Fe("التقرير الأسبوعي","ملخص الأسبوع — مقارنة بالسابق",()=>vo({campaignRound:y}))),Rs=()=>oe("user-activity",()=>Fe("تقرير نشاط المستخدمين","دخول، نشاط، مستخدمين خاملين",()=>bo({dateFrom:G||void 0,dateTo:q||void 0,campaignRound:y}))),Ds=()=>oe("challenges",()=>Fe("تقرير التحديات والصعوبات","تحديات، إجراءات، توصيات",()=>xo({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y}))),js=()=>oe("supervision-form",()=>Fe("تقرير استمارة الإشراف","النشاط الإيصالي التكاملي — 8 أقسام × 33 مؤشر",()=>_o({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y}))),Ts=()=>oe("supervision-challenges",()=>Fe("تقرير تحديات الإشراف الميداني","التحديات — الإجراءات — التوصيات",()=>So({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y}))),Es=()=>oe("daily-supervisor-eval",()=>Fe("تقييم أداء المشرفين اليومي","استمارة الإشراف — النشاط الإيصالي التكاملي",()=>To({date:q||new Date().toISOString().split("T")[0],governorateId:X!=="all"?X:void 0,campaignRound:y}))),Cs=()=>oe("comprehensive-supervisor-eval",()=>Fe("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي",()=>Co({governorateId:X!=="all"?X:void 0,campaignRound:y}))),Ns=()=>oe("master-supervisor-report",()=>Fe("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات + خريطة — تقرير مدمج",()=>Po({governorateId:X!=="all"?X:void 0,campaignRound:y}))),Ms=()=>oe("general-supervisors-eval",()=>Fe("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي",()=>Io({date:q||new Date().toISOString().split("T")[0],governorateId:X!=="all"?X:void 0,campaignRound:y}))),zs=()=>oe("yesno-analysis",()=>Fe("تحليل حقول نعم/لا","استمارة الاشراف — تحليل شامل",()=>Ao({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y}))),Ps=()=>{Go({dateFrom:G||void 0,dateTo:q||void 0,governorateId:X!=="all"?X:void 0,campaignRound:y})},Is=le.useMemo(()=>v?v.slice(0,10).map(U=>({name:U.name,الإرساليات:U.submissions})):[],[v]),As=le.useMemo(()=>k?[{name:"مرسلة",value:k.total_submissions-k.draft_submissions,color:"#10b981"},{name:"مسودة",value:k.draft_submissions,color:"#f59e0b"}]:[],[k]);return{stats:k,statsLoading:C,govStats:v,govLoading:j,forms:f,formsLoading:h,submissionCounts:r,governorates:o,chartData:g,chartLoading:n,roleDistribution:x,auditData:I,activeTab:E,setActiveTab:c,exportingFormId:$,exportingReport:z,formSearch:w,setFormSearch:O,dateFrom:G,setDateFrom:H,dateTo:q,setDateTo:ae,selectedGovFilter:X,setSelectedGovFilter:de,analyticsFilter:fe,setAnalyticsFilter:xe,drillDownOpen:ve,setDrillDownOpen:T,drillDownData:Y,setDrillDownData:ne,fullscreenChart:we,setFullscreenChart:be,reportSearch:ye,setReportSearch:Ie,reportFormat:pe,setReportFormat:Ae,filteredForms:Zt,previewProps:m,openPreview:F,closePreview:M,exportProgress:S,userRole:s,campaign:i,labelAr:l,isFiltered:u,refetchStats:R,refetchForms:p,handleExportDashboard:pt,handleExportGovernorates:ea,handleExportUsers:ta,handleExportSubmissions:B,handleExportShortages:J,handleExportTimeline:re,handleExportRoles:he,handleExportAudit:$e,handleExportPDF:Ne,handleExportGovPDF:Me,handleExportUsersPDF:ps,handleExportShortagesPDF:ms,handleExportFullPDF:hs,handleExportForm:fs,handleCentralReport:vs,handleGovDetailReport:bs,handleFormAnalysisReport:xs,handleSupervisorReport:ys,handleCoverageGapReport:$s,handleCampaignComparisonReport:_s,handleDailyActivityReport:ws,handleDataQualityReport:Ss,handleShortagesDetailedReport:ks,handleWeeklyReport:Fs,handleUserActivityReport:Rs,handleChallengesReport:Ds,handleSupervisionFormReport:js,handleSupervisionChallengesReport:Ts,handleDailySupervisorEvaluation:Es,handleComprehensiveSupervisorEvaluation:Cs,handleMasterSupervisorReport:Ns,handleGeneralSupervisorsEvaluation:Ms,handleYesNoAnalysis:zs,handleMapReport:Ps,handleExportHealthFacilityAssessment:Ke,govChartData:Is,statusPieData:As,exportReport:oe}}const bt=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];function qe(e){return["admin","central"].includes(e)}function Et(e){return["admin","central","governorate"].includes(e)}const ge={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function Kt(e){const s=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${s[e.getMonth()]} ${e.getFullYear()}`}function ke(e){return e.toLocaleString("ar-SA")}function Ct(e){const s=e.addSlide();return s.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:ge.textMuted}),s.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:ge.textMuted,align:"right"}),s.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:ge.primary}}),s}function Bo(e,s,i){const l=e.addSlide();l.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:ge.primaryDark}}),l.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:ge.white}});try{l.addImage({data:Qt,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return l.addText(s,{x:.5,y:2.2,w:9,h:1,fontSize:32,fontFace:"Cairo",bold:!0,color:ge.white,align:"center"}),l.addText(i,{x:1,y:3.5,w:8,h:.6,fontSize:16,fontFace:"Tajawal",color:"B3D4FC",align:"center"}),l.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),l.addText(Kt(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),l}function Yt(e,s,i=.3,l=1.8){const u=9.4/s.length-.15;s.forEach((b,N)=>{const _=i+N*(u+.15);e.addShape("roundRect",{x:_,y:l,w:u,h:1.4,fill:{color:ge.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:_,y:l,w:u,h:.06,fill:{color:b.color||ge.primary},rectRadius:.03}),e.addText(b.icon||"📊",{x:_,y:l+.15,w:u,h:.3,fontSize:14,align:"center"}),e.addText(b.value,{x:_,y:l+.45,w:u,h:.5,fontSize:22,bold:!0,align:"center",color:b.color||ge.primary,fontFace:"Cairo"}),e.addText(b.label,{x:_,y:l+.95,w:u,h:.35,fontSize:9,align:"center",color:ge.textMuted})})}function Wa(e,s,i,l){const u=(l==null?void 0:l.x)||.3,b=(l==null?void 0:l.y)||3.5,N=(l==null?void 0:l.w)||9.4,_=[s.map(m=>({text:m,options:{bold:!0,color:ge.white,fill:{color:ge.primary},fontSize:9,align:"center"}})),...i.map((m,F)=>m.map(M=>({text:M,options:{fontSize:8,fill:{color:F%2===0?ge.bg:ge.white},align:"center"}})))];e.addTable(_,{x:u,y:b,w:N,border:{type:"solid",pt:.5,color:ge.border},colW:s.map(()=>N/s.length),rowH:.35,autoPage:!1})}async function Uo(){var $;const e=new Date,s=new Date(e.getFullYear(),e.getMonth(),1);new Date(e.getFullYear(),e.getMonth()-1,1),new Date(e.getFullYear(),e.getMonth(),0);const[i,l,u,b,N]=await Promise.allSettled([K.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",s.toISOString()).is("deleted_at",null),K.from("profiles").select("*").is("deleted_at",null),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),K.from("supply_shortages").select("*").is("deleted_at",null),K.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),_=i.status==="fulfilled"?i.value.data||[]:[],m=l.status==="fulfilled"?l.value.data||[]:[],F=u.status==="fulfilled"?u.value.data||[]:[],M=b.status==="fulfilled"?b.value.data||[]:[];N.status==="fulfilled"&&N.value.data;const S=_.filter(D=>D.status==="submitted"),y=_.filter(D=>D.status==="draft"),k=new Set(_.map(D=>D.submitted_by)).size,C=new Set(_.map(D=>D.governorate_id).filter(Boolean)).size,R=M.filter(D=>!D.is_resolved),v=R.filter(D=>D.severity==="critical"),j=F.length>0?Math.round(C/F.length*100):0,d=F.map(D=>{const z=_.filter(W=>W.governorate_id===D.id);return{name:D.name_ar,total:z.length,submitted:z.filter(W=>W.status==="submitted").length,draft:z.filter(W=>W.status==="draft").length}}).sort((D,z)=>z.total-D.total),h=_.filter(D=>{var z;return((z=D.forms)==null?void 0:z.campaign_type)==="polio_campaign"}),p=_.filter(D=>{var z;return((z=D.forms)==null?void 0:z.campaign_type)!=="polio_campaign"}),r=new Jt;r.layout="LAYOUT_WIDE",r.author="EPI Supervisor",r.title=`تقرير الأداء الشهري — ${Kt(e)}`,Bo(r,"التقرير الشهري للأداء",`أداء برنامج التحصين — ${Kt(s)} إلى ${Kt(e)}`);const o=Ct(r);o.addText("مؤشرات الأداء الرئيسية",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:ge.primary,fontFace:"Cairo"}),Yt(o,[{label:"إجمالي الإرساليات",value:ke(_.length),icon:"📋",color:ge.primary},{label:"مرسلة",value:ke(S.length),icon:"✅",color:ge.success},{label:"مسودات",value:ke(y.length),icon:"📝",color:ge.warning},{label:"مشرفين نشطين",value:ke(k),icon:"👥",color:ge.purple},{label:"محافظات نشطة",value:`${C}/${F.length}`,icon:"🏛️",color:ge.info},{label:"نسبة التغطية",value:`${j}%`,icon:"🎯",color:j>=80?ge.success:ge.warning}]);const g=Ct(r);g.addText("مقارنة الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:ge.primary,fontFace:"Cairo"}),Yt(g,[{label:"حملة شلل أطفال",value:ke(h.length),icon:"💉",color:ge.blue},{label:"شلل — مرسلة",value:ke(h.filter(D=>D.status==="submitted").length),icon:"✅",color:ge.success},{label:"الإيصالي التكاملي",value:ke(p.length),icon:"🏥",color:ge.green},{label:"إيصالي — مرسلة",value:ke(p.filter(D=>D.status==="submitted").length),icon:"✅",color:ge.success}],.3,1.5);const n=h.length>0?Math.round((h.length-h.filter(D=>D.status==="submitted").length)/h.length*100):0,x=p.length>0?Math.round((p.length-p.filter(D=>D.status==="submitted").length)/p.length*100):0;g.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:3.2,w:9.4,h:.4,fontSize:14,bold:!0,color:ge.text,fontFace:"Cairo"}),Wa(g,["الحملة","الإجمالي","مرسلة","مسودة","نسبة التسريب","التقييم"],[["شلل أطفال",ke(h.length),ke(h.filter(D=>D.status==="submitted").length),ke(h.filter(D=>D.status==="draft").length),`${n}%`,n<=10?"✅ ممتاز":n<=25?"⚠️ مقبول":"🔴 حرج"],["إيصالي تكاملي",ke(p.length),ke(p.filter(D=>D.status==="submitted").length),ke(p.filter(D=>D.status==="draft").length),`${x}%`,x<=10?"✅ ممتاز":x<=25?"⚠️ مقبول":"🔴 حرج"]],{y:3.7});const I=Ct(r);I.addText("أداء المحافظات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:ge.primary,fontFace:"Cairo"}),Yt(I,[{label:"الأعلى نشاطاً",value:(($=d[0])==null?void 0:$.name)||"—",icon:"🏆",color:ge.warning},{label:"بدون تغطية",value:ke(d.filter(D=>D.total===0).length),icon:"⚠️",color:ge.accent}],.3,1.2),Wa(I,["#","المحافظة","الإجمالي","مرسلة","مسودة","نسبة الإرسال"],d.slice(0,15).map((D,z)=>[`${z+1}`,D.name,ke(D.total),ke(D.submitted),ke(D.draft),D.total>0?`${Math.round(D.submitted/D.total*100)}%`:"0%"]),{y:2.8});const f=Ct(r);f.addText("تنبيهات النواقص",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:ge.accent,fontFace:"Cairo"}),Yt(f,[{label:"نواقص غير محلولة",value:ke(R.length),icon:"📦",color:ge.accent},{label:"حرجة",value:ke(v.length),icon:"🚨",color:ge.accent},{label:"نواقص محلولة",value:ke(M.filter(D=>D.is_resolved).length),icon:"✅",color:ge.success},{label:"معدل الحل",value:`${M.length>0?Math.round(M.filter(D=>D.is_resolved).length/M.length*100):0}%`,icon:"📈",color:ge.info}],.3,1.2),v.length>0&&(f.addShape("roundRect",{x:.3,y:3,w:9.4,h:.5,fill:{color:"FFEBEE"},rectRadius:.05}),f.addText(`🚨 تنبيه عاجل: يوجد ${v.length} نقص حرج يحتاج تدخل فوري!`,{x:.5,y:3,w:9,h:.5,fontSize:12,bold:!0,color:ge.accent}));const E=Ct(r);E.addText("التوصيات والإجراءات المطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:ge.primary,fontFace:"Cairo"});const c=[];j<80&&c.push(`🎯 رفع نسبة التغطية من ${j}% إلى 80% — متابعة المحافظات غير النشطة`),v.length>0&&c.push(`🚨 معالجة ${v.length} نواقص حرجة فوراً`),y.length>10&&c.push(`📝 مراجعة واعتماد ${y.length} مسودة معلقة`),k<m.filter(D=>D.is_active).length*.7&&c.push(`👥 تفعيل المشرفين غير النشطين — ${m.filter(D=>D.is_active).length-k} مشرف لم يرسل`),n>15&&c.push(`💉 خفض معدل التسريب في حملة شلل أطفال من ${n}%`),c.length===0&&c.push("✅ الأداء ممتاز — استمرار المتابعة والتحسين"),c.forEach((D,z)=>{E.addShape("roundRect",{x:.5,y:1.2+z*.7,w:9,h:.55,fill:{color:z%2===0?"E3F2FD":"F3E5F5"},rectRadius:.05}),E.addText(D,{x:.7,y:1.2+z*.7,w:8.6,h:.55,fontSize:12,color:ge.text,fontFace:"Cairo"})});const L=`تقرير_شهري_${e.toISOString().split("T")[0]}.pptx`;await r.writeFile({fileName:L})}const Q={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function wt(e){const s=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${s[e.getMonth()]} ${e.getFullYear()}`}function Ve(e){const s=e.addSlide();return s.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:Q.primary}}),s.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:Q.textMuted}),s.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:Q.textMuted,align:"right"}),s}function gs(e,s,i){const l=e.addSlide();l.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:Q.primaryDark}}),l.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:Q.white}});try{l.addImage({data:Qt,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return l.addText(s,{x:.5,y:2.2,w:9,h:1,fontSize:32,bold:!0,color:Q.white,align:"center",fontFace:"Cairo"}),l.addText(i,{x:1,y:3.5,w:8,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),l.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),l.addText(wt(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),l}function yt(e,s,i=1.8){const l=9.4/s.length-.15;s.forEach((u,b)=>{const N=.3+b*(l+.15);e.addShape("roundRect",{x:N,y:i,w:l,h:1.4,fill:{color:Q.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:N,y:i,w:l,h:.06,fill:{color:u.color||Q.primary},rectRadius:.03}),e.addText(u.icon||"📊",{x:N,y:i+.15,w:l,h:.3,fontSize:14,align:"center"}),e.addText(u.value,{x:N,y:i+.45,w:l,h:.5,fontSize:22,bold:!0,align:"center",color:u.color||Q.primary,fontFace:"Cairo"}),e.addText(u.label,{x:N,y:i+.95,w:l,h:.35,fontSize:9,align:"center",color:Q.textMuted})})}function zt(e,s,i,l){const u=(l==null?void 0:l.x)||.3,b=(l==null?void 0:l.y)||3.5,N=(l==null?void 0:l.w)||9.4,_=[s.map(m=>({text:m,options:{bold:!0,color:Q.white,fill:{color:Q.primary},fontSize:9,align:"center"}})),...i.map((m,F)=>m.map(M=>({text:M,options:{fontSize:8,fill:{color:F%2===0?Q.bg:Q.white},align:"center"}})))];e.addTable(_,{x:u,y:b,w:N,border:{type:"solid",pt:.5,color:Q.border},rowH:.35,autoPage:!1})}async function qo(){const e=new Date,s=new Date(e.getTime()-7*864e5),i=new Date(e.getTime()-14*864e5),[l,u,b,N,_]=await Promise.allSettled([K.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",s.toISOString()).is("deleted_at",null),K.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",i.toISOString()).lt("created_at",s.toISOString()).is("deleted_at",null),K.from("profiles").select("*").is("deleted_at",null),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),K.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).eq("is_resolved",!1)]),m=l.status==="fulfilled"?l.value.data||[]:[],F=u.status==="fulfilled"&&u.value.count||0;b.status==="fulfilled"&&b.value.data;const M=N.status==="fulfilled"?N.value.data||[]:[],S=_.status==="fulfilled"?_.value.data||[]:[],y=m.filter(f=>f.status==="submitted"),k=m.filter(f=>f.status==="draft"),C=new Set(m.map(f=>f.submitted_by)).size,R=new Set(m.map(f=>f.governorate_id).filter(Boolean)).size,v=m.length-F,j=F>0?Math.round(v/F*100):0,d=Array.from({length:7},(f,E)=>{const c=new Date(s.getTime()+E*864e5),L=c.toISOString().split("T")[0],$=c.toLocaleDateString("ar-SA",{weekday:"long"}),D=m.filter(z=>z.created_at.startsWith(L));return{day:$,count:D.length,submitted:D.filter(z=>z.status==="submitted").length}}),h=M.map(f=>({name:f.name_ar,count:m.filter(E=>E.governorate_id===f.id).length})).sort((f,E)=>E.count-f.count).filter(f=>f.count>0),p=new Jt;p.layout="LAYOUT_WIDE",p.author="EPI Supervisor",p.title=`النشرة الأسبوعية — ${wt(s)} إلى ${wt(e)}`,gs(p,"النشرة الأسبوعية للتحصين",`الأسبوع: ${wt(s)} — ${wt(e)}`);const r=Ve(p);r.addText("ملخص الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),yt(r,[{label:"إرساليات الأسبوع",value:m.length.toString(),icon:"📋",color:Q.primary},{label:"مرسلة",value:y.length.toString(),icon:"✅",color:Q.success},{label:"مقارنة بالأسبوع السابق",value:`${v>=0?"+":""}${j}%`,icon:v>=0?"📈":"📉",color:v>=0?Q.success:Q.accent},{label:"مشرفين نشطين",value:C.toString(),icon:"👥",color:Q.purple},{label:"محافظات نشطة",value:`${R}/${M.length}`,icon:"🏛️",color:Q.info}]);const o=Ve(p);o.addText("النشاط اليومي",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),zt(o,["اليوم","الإرساليات","مرسلة","نسبة الإرسال"],d.map(f=>[f.day,f.count.toString(),f.submitted.toString(),f.count>0?`${Math.round(f.submitted/f.count*100)}%`:"0%"]),{y:1.2});const g=Ve(p);g.addText("ترتيب المحافظات هذا الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),zt(g,["#","المحافظة","الإرساليات","النسبة"],h.slice(0,15).map((f,E)=>[`${E+1}`,f.name,f.count.toString(),`${Math.round(f.count/Math.max(m.length,1)*100)}%`]),{y:1.2});const n=Ve(p);n.addText("تنبيهات وإجراءات مطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.accent,fontFace:"Cairo"});const x=[];v<0&&x.push({text:`⚠️ انخفاض الإرساليات بنسبة ${Math.abs(j)}% مقارنة بالأسبوع السابق`,color:Q.accent,bg:"FFEBEE"}),R<M.length*.7&&x.push({text:`🏛️ ${M.length-R} محافظة لم ترسل بيانات هذا الأسبوع`,color:Q.warning,bg:"FFF8E1"}),S.length>0&&x.push({text:`📦 ${S.length} نقص معلق يحتاج متابعة`,color:Q.accent,bg:"FFEBEE"}),k.length>m.length*.3&&x.push({text:`📝 نسبة المسودات عالية (${Math.round(k.length/Math.max(m.length,1)*100)}%) — مراجعة المشرفين`,color:Q.warning,bg:"FFF8E1"}),x.length===0&&x.push({text:"✅ لا توجد تنبيهات — الأداء ممتاز!",color:Q.success,bg:"E8F5E9"}),x.forEach((f,E)=>{n.addShape("roundRect",{x:.5,y:1.2+E*.8,w:9,h:.6,fill:{color:f.bg},rectRadius:.05}),n.addText(f.text,{x:.7,y:1.2+E*.8,w:8.6,h:.6,fontSize:12,color:f.color,fontFace:"Cairo"})});const I=`نشرة_اسبوعية_${e.toISOString().split("T")[0]}.pptx`;await p.writeFile({fileName:I})}async function Yo(){const e=new Date,[s,i,l,u]=await Promise.allSettled([K.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e4),K.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),K.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),K.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null)]),b=s.status==="fulfilled"?s.value.data||[]:[],N=i.status==="fulfilled"?i.value.data||[]:[],_=l.status==="fulfilled"?l.value.data||[]:[],m=u.status==="fulfilled"?u.value.data||[]:[],F=_.filter(z=>z.campaign_type==="polio_campaign").map(z=>z.id),M=_.filter(z=>z.campaign_type!=="polio_campaign").map(z=>z.id),S=b.filter(z=>F.includes(z.form_id)),y=b.filter(z=>M.includes(z.form_id)),k=S.filter(z=>z.status==="submitted"),C=y.filter(z=>z.status==="submitted");S.filter(z=>z.status==="draft"),y.filter(z=>z.status==="draft");const R=S.length>0?Math.round((S.length-k.length)/S.length*100):0,v=y.length>0?Math.round((y.length-C.length)/y.length*100):0,j=N.map(z=>({name:z.name_ar,total:S.filter(W=>W.governorate_id===z.id).length,submitted:S.filter(W=>W.governorate_id===z.id&&W.status==="submitted").length})).sort((z,W)=>W.total-z.total),d=N.map(z=>({name:z.name_ar,total:y.filter(W=>W.governorate_id===z.id).length,submitted:y.filter(W=>W.governorate_id===z.id&&W.status==="submitted").length})).sort((z,W)=>W.total-z.total),h=j.filter(z=>z.total===0),p=d.filter(z=>z.total===0),r=new Jt;r.layout="LAYOUT_WIDE",r.author="EPI Supervisor",r.title=`تقرير أداء الحملات — ${wt(e)}`,gs(r,"تقرير أداء الحملات","مقارنة شاملة — حملة شلل أطفال vs الإيصالي التكاملي");const o=Ve(r);o.addText("نظرة عامة على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),yt(o,[{label:"شلل أطفال — إجمالي",value:S.length.toString(),icon:"💉",color:Q.blue},{label:"شلل أطفال — مرسلة",value:k.length.toString(),icon:"✅",color:Q.success},{label:"إيصالي — إجمالي",value:y.length.toString(),icon:"🏥",color:Q.green},{label:"إيصالي — مرسلة",value:C.length.toString(),icon:"✅",color:Q.success}]);const g=Ve(r);g.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"}),g.addText("معدل التسريب = (الإجمالي - المرسلة) / الإجمالي × 100",{x:.3,y:.9,w:9.4,h:.3,fontSize:10,color:Q.textMuted,italic:!0}),yt(g,[{label:"شلل أطفال — التسريب",value:`${R}%`,icon:"💉",color:R<=10?Q.success:R<=25?Q.warning:Q.accent},{label:"إيصالي — التسريب",value:`${v}%`,icon:"🏥",color:v<=10?Q.success:v<=25?Q.warning:Q.accent}],1.5),g.addShape("roundRect",{x:.3,y:3.2,w:9.4,h:1.8,fill:{color:"E3F2FD"},rectRadius:.1}),g.addText("معايير التقييم (WHO Benchmarks)",{x:.5,y:3.3,w:9,h:.4,fontSize:13,bold:!0,color:Q.primary}),g.addText([{text:"✅ ممتاز: ",options:{bold:!0,color:Q.success}},{text:"تسريب ≤ 10%    ",options:{color:Q.text}},{text:"⚠️ مقبول: ",options:{bold:!0,color:Q.warning}},{text:"تسريب 11-25%    ",options:{color:Q.text}},{text:"🔴 حرج: ",options:{bold:!0,color:Q.accent}},{text:"تسريب > 25%",options:{color:Q.text}}],{x:.5,y:3.7,w:9,h:.4,fontSize:11}),g.addText("معدل التسريب يقيس فقدان المستفيدين بين الجرعة الأولى والجرعة الأخيرة. معدل عالي يشير لمشاكل في المتابعة أو اللوجستيات.",{x:.5,y:4.2,w:9,h:.6,fontSize:10,color:Q.textMuted});const n=Ve(r);n.addText("💉 تغطية حملة شلل أطفال حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:Q.blue,fontFace:"Cairo"}),yt(n,[{label:"محافظات نشطة",value:`${j.filter(z=>z.total>0).length}/${N.length}`,icon:"🏛️",color:Q.info},{label:"بدون تغطية",value:h.length.toString(),icon:"⚠️",color:h.length>0?Q.accent:Q.success}],1.2),zt(n,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],j.filter(z=>z.total>0).slice(0,12).map((z,W)=>[`${W+1}`,z.name,z.total.toString(),z.submitted.toString(),`${Math.round(z.submitted/Math.max(z.total,1)*100)}%`]),{y:2.8});const x=Ve(r);x.addText("🏥 تغطية الإيصالي التكاملي حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:Q.green,fontFace:"Cairo"}),yt(x,[{label:"محافظات نشطة",value:`${d.filter(z=>z.total>0).length}/${N.length}`,icon:"🏛️",color:Q.info},{label:"بدون تغطية",value:p.length.toString(),icon:"⚠️",color:p.length>0?Q.accent:Q.success}],1.2),zt(x,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],d.filter(z=>z.total>0).slice(0,12).map((z,W)=>[`${W+1}`,z.name,z.total.toString(),z.submitted.toString(),`${Math.round(z.submitted/Math.max(z.total,1)*100)}%`]),{y:2.8});const I=Ve(r);I.addText("تأثير النواقص على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.accent,fontFace:"Cairo"});const f=m.filter(z=>z.severity==="critical"&&!z.is_resolved),E=m.filter(z=>z.severity==="high"&&!z.is_resolved);yt(I,[{label:"نواقص حرجة",value:f.length.toString(),icon:"🚨",color:Q.accent},{label:"نواقص عالية",value:E.length.toString(),icon:"🟠",color:"E65100"},{label:"معدل الحل",value:`${m.length>0?Math.round(m.filter(z=>z.is_resolved).length/m.length*100):0}%`,icon:"📈",color:Q.info}],1.2),f.length>0&&zt(I,["النقص","المحافظة","الخطورة","الكمية المطلوبة"],f.slice(0,8).map(z=>{var W;return[z.item_name,((W=z.governorates)==null?void 0:W.name_ar)||"—","🔴 حرج",`${z.quantity_needed||"—"}`]}),{y:3});const c=Ve(r);c.addText("النتائج الرئيسية والتوصيات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:Q.primary,fontFace:"Cairo"});const L=[];R<=10?L.push({text:`✅ حملة شلل أطفال: معدل التسريب ${R}% — أداء ممتاز`,type:"success"}):R<=25?L.push({text:`⚠️ حملة شلل أطفال: معدل التسريب ${R}% — يحتاج تحسين`,type:"warning"}):L.push({text:`🔴 حملة شلل أطفال: معدل التسريب ${R}% — حرج!`,type:"danger"}),v<=10?L.push({text:`✅ الإيصالي التكاملي: معدل التسريب ${v}% — أداء ممتاز`,type:"success"}):v<=25?L.push({text:`⚠️ الإيصالي التكاملي: معدل التسريب ${v}% — يحتاج تحسين`,type:"warning"}):L.push({text:`🔴 الإيصالي التكاملي: معدل التسريب ${v}% — حرج!`,type:"danger"}),h.length>0&&L.push({text:`⚠️ ${h.length} محافظة بدون تغطية في حملة شلل أطفال`,type:"warning"}),f.length>0&&L.push({text:`🔴 ${f.length} نقص حرج يعيق الحملات`,type:"danger"});const $={success:{bg:"E8F5E9",text:Q.success},warning:{bg:"FFF8E1",text:Q.warning},danger:{bg:"FFEBEE",text:Q.accent}};L.forEach((z,W)=>{c.addShape("roundRect",{x:.5,y:1.2+W*.7,w:9,h:.55,fill:{color:$[z.type].bg},rectRadius:.05}),c.addText(z.text,{x:.7,y:1.2+W*.7,w:8.6,h:.55,fontSize:12,color:$[z.type].text,fontFace:"Cairo"})});const D=`تقرير_الحملات_${e.toISOString().split("T")[0]}.pptx`;await r.writeFile({fileName:D})}const Z={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",green:"10B981",amber:"F59E0B",purple:"8B5CF6",lightGreen:"E8F5E9",lightRed:"FFEBEE"};function us(e){const s=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${s[e.getMonth()]} ${e.getFullYear()}`}function ot(e,s){e.addShape(s.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:Z.primary}}),e.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:7,w:5,h:.3,fontSize:7,color:Z.textMuted}),e.addText(us(new Date),{x:7,y:7,w:2.7,h:.3,fontSize:7,color:Z.textMuted,align:"right"})}function nt(e,s,i,l){e.addShape("roundRect",{x:.3,y:.3,w:9.4,h:.7,fill:{color:Z.primaryDark},rectRadius:.08}),e.addText(`${s}  ${i}`,{x:.5,y:.35,w:7,h:.6,fontSize:18,bold:!0,color:Z.white,fontFace:"Cairo"}),l&&e.addText(l,{x:7.5,y:.4,w:2,h:.5,fontSize:11,color:Z.white,align:"center",fill:{color:"1565C0"},shape:"roundRect",rectRadius:.15})}function ma(e,s,i=1.3){const l=9.4/s.length-.12;s.forEach((u,b)=>{const N=.3+b*(l+.12);e.addShape("roundRect",{x:N,y:i,w:l,h:1.5,fill:{color:Z.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.08},rectRadius:.1}),e.addShape("roundRect",{x:N,y:i,w:l,h:.06,fill:{color:u.color||Z.primary},rectRadius:.03}),e.addText(u.icon||"📊",{x:N,y:i+.15,w:l,h:.3,fontSize:16,align:"center"}),e.addText(u.value,{x:N,y:i+.45,w:l,h:.55,fontSize:24,bold:!0,align:"center",color:u.color||Z.primary,fontFace:"Cairo"}),e.addText(u.label,{x:N,y:i+1.05,w:l,h:.35,fontSize:9,align:"center",color:Z.textMuted})})}function Wt(e,s,i,l){const u=(l==null?void 0:l.x)||.3,b=(l==null?void 0:l.y)||3.2,N=(l==null?void 0:l.w)||9.4,_=(l==null?void 0:l.fontSize)||8,m=[s.map(F=>({text:F,options:{bold:!0,color:Z.white,fill:{color:Z.primary},fontSize:_,align:"center",fontFace:"Cairo"}})),...i.map((F,M)=>F.map(S=>({text:S,options:{fontSize:_-1,fill:{color:M%2===0?Z.bg:Z.white},align:"center"}})))];e.addTable(m,{x:u,y:b,w:N,border:{type:"solid",pt:.5,color:Z.border},rowH:.32,autoPage:!1})}const Ka=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"]},{id:"work_env",title:"بيئة العمل",icon:"🏢",fields:["suitable_location","community_coordination","has_speaker","has_transport"]},{id:"records",title:"السجلات",icon:"📁",fields:["complete_records","daily_work_forms","correct_data_entry"]},{id:"quality",title:"جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","muac_measurement"]},{id:"vaccine",title:"اللقاحات",icon:"🧊",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"]},{id:"supplies",title:"الإمدادات",icon:"📦",fields:["family_planning_available","folic_iron_stock","scale"]},{id:"shortages",title:"العجز",icon:"⚠️",fields:["has_immunization_shortage","has_reproductive_shortage"]},{id:"catchup",title:"الإحاق",icon:"🔄",fields:["catch_up_knowledge","catch_up_training"]}];async function Wo(e){const s=new Jt;s.layout="LAYOUT_WIDE",s.author="EPI Supervisor",s.title="التقرير الشامل المدمج للمشرفين";const i=us(new Date),l=await Ra(e),[u,b,N]=await Promise.allSettled([K.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).limit(5e4),K.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).limit(1e4),K.from("profiles").select("id, full_name").is("deleted_at",null)]),_=new Map;for(const B of l.govs)_.set(B.id,B.name_ar);const{enriched:m,govs:F,subs:M,govGroups:S}=l,y=m.filter(B=>(B.role==="central"||B.role==="admin")&&B.govId),k=[...m.filter(B=>["governorate","district","data_entry"].includes(B.role)),...y];let C=S;const R=k.length,v=k.filter(B=>B.totalToday>0).length,j=k.filter(B=>B.totalToday===0&&!B.isGenSupervisor).length,d=k.filter(B=>B.isGenSupervisor).length,h=M.length,p=M.filter(B=>B.status==="submitted").length,r=u.status==="fulfilled"?u.value.data||[]:[],o=Ka.flatMap(B=>B.fields),g=new Map;for(const B of o)g.set(B,{yes:0,no:0,total:0});for(const B of r){const J=B.data||{};for(const re of o){const he=J[re],$e=g.get(re);$e&&(he===!0||he==="yes"||he==="نعم"?($e.yes++,$e.total++):(he===!1||he==="no"||he==="لا")&&($e.no++,$e.total++))}}const n=Ka.map(B=>{const J=B.fields.map(Ne=>{const Me=g.get(Ne)||{yes:0,no:0,total:0};return{key:Ne,...Me,yesRate:Me.total>0?Math.round(Me.yes/Me.total*100):0}}),re=J.reduce((Ne,Me)=>Ne+Me.yes,0),he=J.reduce((Ne,Me)=>Ne+Me.no,0),$e=re+he,Ke=$e>0?Math.round(re/$e*100):0;return{...B,fields:J,totalYes:re,totalNo:he,total:$e,avgRate:Ke}}),x=n.reduce((B,J)=>B+J.totalYes,0),I=n.reduce((B,J)=>B+J.totalNo,0),f=x+I,E=f>0?Math.round(x/f*100):0,c=b.status==="fulfilled"?b.value.data||[]:[],L=new Map;if(N.status==="fulfilled")for(const B of N.value.data||[])L.set(B.id,B.full_name);const $=["تحدي","صعوب","مشكل","عائق"],D=["إجراء","اجراء","اتخذ","تدبير"],z=["توصي","اقتراح","ينصح"];function W(B,J){if(!B||typeof B!="object")return null;for(const[re,he]of Object.entries(B))if(typeof he=="string"&&he.trim().length>2){for(const $e of J)if(re.toLowerCase().includes($e.toLowerCase()))return he.trim().slice(0,120)}return null}const w=new Map;for(const B of c){const J=B.data||{},re=W(J,$),he=W(J,D),$e=W(J,z);if(!re&&!he&&!$e)continue;const Ke=B.governorate_id||"",Ne=_.get(Ke)||"غير محدد";w.has(Ke)||w.set(Ke,{govName:Ne,challenges:[],actions:[],recommendations:[],count:0});const Me=w.get(Ke);Me.count++,re&&Me.challenges.push(re),he&&Me.actions.push(he),$e&&Me.recommendations.push($e)}const O=[...w.values()].sort((B,J)=>J.count-B.count),G=O.reduce((B,J)=>B+J.count,0),H=O.reduce((B,J)=>B+J.challenges.length,0),q=s.addSlide();q.addShape(s.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:Z.primaryDark}}),q.addShape(s.ShapeType.rect,{x:0,y:3.4,w:13.33,h:.04,fill:{color:Z.white}}),q.addShape(s.ShapeType.rect,{x:0,y:3.5,w:13.33,h:.02,fill:{color:Z.primary}});try{q.addImage({data:Qt,x:5.9,y:.6,w:1.5,h:1.5,rounding:!0})}catch{}q.addText("التقرير الشامل المدمج للمشرفين",{x:1,y:2.2,w:11.33,h:1,fontSize:36,bold:!0,color:Z.white,align:"center",fontFace:"Cairo"}),q.addText("تقييم الأداء ◆ تحليل نعم/لا ◆ تحديات ميدانية",{x:1,y:3.6,w:11.33,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),q.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.2,w:11.33,h:.4,fontSize:12,color:"90CAF9",align:"center"}),q.addText(i,{x:1,y:5.8,w:11.33,h:.3,fontSize:11,color:"64B5F6",align:"center"});const ae=s.addSlide();ot(ae,s),nt(ae,"📊","مؤشرات الأداء الرئيسية",`${R} مشرف`);const X=Math.max(R-d,1),de=Math.round(v/X*100);ma(ae,[{icon:"👥",label:"إجمالي المشرفين",value:`${R}`,color:Z.primary},{icon:"✅",label:"نشط",value:`${v}`,color:Z.success},{icon:"❌",label:"غير نشط",value:`${j}`,color:Z.accent},{icon:"🏛️",label:"إشراف عام",value:`${d}`,color:Z.info},{icon:"📋",label:"الاستمارات",value:`${h}`,color:Z.purple}],1.3),ma(ae,[{icon:"🎯",label:"نسبة النشاط",value:`${de}%`,color:de>=70?Z.success:Z.warning},{icon:"📊",label:"نسبة نعم الكلية",value:`${E}%`,color:E>=70?Z.success:Z.warning},{icon:"⚠️",label:"تحديات ميدانية",value:`${G}`,color:Z.accent},{icon:"📤",label:"نسبة الإرسال",value:`${h>0?Math.round(p/h*100):0}%`,color:Z.green}],3.1);const fe=[...C.values()].map(B=>{const J=B.allUsers.filter(Ne=>Ne.totalToday>0&&!Ne.isGenSupervisor).length,re=B.allUsers.filter(Ne=>Ne.isGenSupervisor).length,he=B.allUsers.reduce((Ne,Me)=>Ne+Me.totalToday,0),$e=B.allUsers.length,Ke=$e>0?Math.round(J/Math.max($e-re,1)*100):0;return[B.gov.name_ar,`${$e}`,`${J}`,`${$e-J-re}`,`${he}`,`${Ke}%`]});Wt(ae,["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],fe,{y:5,fontSize:7});const xe=s.addSlide();ot(xe,s),nt(xe,"📋","تقييم أداء المشرفين — تفاصيل المحافظات");const ve=[];for(const B of C.values()){const J=[...B.allUsers].sort((re,he)=>he.totalToday-re.totalToday).slice(0,6);for(const re of J){const he=re.role==="central"||re.role==="admin"?"مركزي":re.role==="governorate"?"محافظة":re.role==="district"?"مديرية":"إدخال",$e=re.isGenSupervisor?"إشراف عام":re.totalToday>0?"نشط":"غير نشط";ve.push([B.gov.name_ar,(re.full_name||"—").slice(0,20),he,(re.distName||"—").slice(0,15),`${re.totalToday}`,`${re.submittedToday}`,$e])}}Wt(xe,["المحافظة","الاسم","الصفة","المديرية","استمارات","مرسلة","الحالة"],ve.slice(0,20),{y:1.3,fontSize:7}),ve.length>20&&xe.addText(`+ ${ve.length-20} مشرف إضافي...`,{x:.3,y:6.5,w:9.4,h:.3,fontSize:9,color:Z.textMuted,italic:!0});const T=s.addSlide();ot(T,s),nt(T,"📊","تحليل حقول نعم/لا",`${r.length} استمارة`);const Y=n.map(B=>{const J=B.avgRate>=80?"ممتاز ✅":B.avgRate>=60?"جيد 👍":B.avgRate>=40?"متوسط ⚠️":"ضعيف ❌";return[`${B.icon} ${B.title}`,`${B.fields.length}`,`${B.totalYes}`,`${B.totalNo}`,`${B.avgRate}%`,J]});Wt(T,["القسم","الحقول","نعم","لا","النسبة","التقييم"],Y,{y:1.3,fontSize:8});const ne=n.flatMap(B=>B.fields.filter(J=>J.total>0)),we=[...ne].sort((B,J)=>J.yesRate-B.yesRate).slice(0,5),be=[...ne].sort((B,J)=>B.yesRate-J.yesRate).slice(0,5);T.addShape("roundRect",{x:.3,y:5,w:4.5,h:2,fill:{color:Z.lightGreen},rectRadius:.1}),T.addText("✅ أعلى 5 حقول (نعم)",{x:.5,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:Z.success}),we.forEach((B,J)=>{T.addText(`${J+1}. ${B.key} — ${B.yesRate}%`,{x:.5,y:5.4+J*.28,w:4,h:.25,fontSize:8,color:Z.text})}),T.addShape("roundRect",{x:5.2,y:5,w:4.5,h:2,fill:{color:Z.lightRed},rectRadius:.1}),T.addText("❌ أقل 5 حقول (نعم)",{x:5.4,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:Z.accent}),be.forEach((B,J)=>{T.addText(`${J+1}. ${B.key} — ${B.yesRate}%`,{x:5.4,y:5.4+J*.28,w:4,h:.25,fontSize:8,color:Z.text})});const ye=s.addSlide();ot(ye,s),nt(ye,"📑","تفصيل حقول نعم/لا — الأقسام الأولى");const Ie=n.slice(0,4);let pe=1.3;for(const B of Ie){ye.addShape("roundRect",{x:.3,y:pe,w:9.4,h:.4,fill:{color:Z.primaryDark},rectRadius:.06}),ye.addText(`${B.icon} ${B.title}  —  ${B.avgRate}%`,{x:.5,y:pe+.02,w:8,h:.35,fontSize:11,bold:!0,color:Z.white}),pe+=.5;for(const J of B.fields){const re=J.yesRate,he=re>=80?Z.success:re>=60?Z.warning:re>=40?Z.amber:Z.accent;ye.addText(J.key,{x:.5,y:pe,w:3.5,h:.25,fontSize:8,color:Z.text}),ye.addShape("roundRect",{x:4.2,y:pe+.05,w:3.5,h:.15,fill:{color:Z.border},rectRadius:.05});const $e=Math.max(.1,re/100*3.5);ye.addShape("roundRect",{x:4.2,y:pe+.05,w:$e,h:.15,fill:{color:he},rectRadius:.05}),ye.addText(`${re}%`,{x:7.9,y:pe,w:.8,h:.25,fontSize:8,bold:!0,color:he,align:"center"}),ye.addText(`✓${J.yes} ✗${J.no}`,{x:8.8,y:pe,w:1,h:.25,fontSize:7,color:Z.textMuted,align:"center"}),pe+=.28}pe+=.15}const Ae=s.addSlide();ot(Ae,s),nt(Ae,"📑","تفصيل حقول نعم/لا — الأقسام المتبقية");const Zt=n.slice(4);let oe=1.3;for(const B of Zt){Ae.addShape("roundRect",{x:.3,y:oe,w:9.4,h:.4,fill:{color:Z.primaryDark},rectRadius:.06}),Ae.addText(`${B.icon} ${B.title}  —  ${B.avgRate}%`,{x:.5,y:oe+.02,w:8,h:.35,fontSize:11,bold:!0,color:Z.white}),oe+=.5;for(const J of B.fields){const re=J.yesRate,he=re>=80?Z.success:re>=60?Z.warning:re>=40?Z.amber:Z.accent;Ae.addText(J.key,{x:.5,y:oe,w:3.5,h:.25,fontSize:8,color:Z.text}),Ae.addShape("roundRect",{x:4.2,y:oe+.05,w:3.5,h:.15,fill:{color:Z.border},rectRadius:.05});const $e=Math.max(.1,re/100*3.5);Ae.addShape("roundRect",{x:4.2,y:oe+.05,w:$e,h:.15,fill:{color:he},rectRadius:.05}),Ae.addText(`${re}%`,{x:7.9,y:oe,w:.8,h:.25,fontSize:8,bold:!0,color:he,align:"center"}),Ae.addText(`✓${J.yes} ✗${J.no}`,{x:8.8,y:oe,w:1,h:.25,fontSize:7,color:Z.textMuted,align:"center"}),oe+=.28}oe+=.15}const pt=s.addSlide();ot(pt,s),nt(pt,"⚠️","تحديات الإشراف الميداني",`${O.length} محافظة`),ma(pt,[{icon:"📋",label:"استمارات مُعبأة",value:`${G}`,color:Z.primary},{icon:"⚠️",label:"تحديات",value:`${H}`,color:Z.accent},{icon:"📋",label:"إجراءات",value:`${O.reduce((B,J)=>B+J.actions.length,0)}`,color:Z.info},{icon:"💡",label:"توصيات",value:`${O.reduce((B,J)=>B+J.recommendations.length,0)}`,color:Z.success}],1.3);const ea=O.slice(0,10).map(B=>[B.govName,`${B.count}`,`${B.challenges.length}`,`${B.actions.length}`,`${B.recommendations.length}`,B.challenges.length>0?B.challenges[0].slice(0,40)+"...":"—"]);if(Wt(pt,["المحافظة","استمارات","تحديات","إجراءات","توصيات","أبرز تحدي"],ea,{y:3.2,fontSize:7}),O.length>0){const B=s.addSlide();ot(B,s),nt(B,"📝","تفاصيل التحديات حسب المحافظة");let J=1.3;for(const re of O.slice(0,4)){if(B.addShape("roundRect",{x:.3,y:J,w:9.4,h:.4,fill:{color:Z.primary},rectRadius:.06}),B.addText(`🏛️ ${re.govName}  —  ${re.count} استمارة`,{x:.5,y:J+.02,w:8,h:.35,fontSize:10,bold:!0,color:Z.white}),J+=.5,re.challenges.length>0){B.addText(`⚠️ تحديات (${re.challenges.length})`,{x:.5,y:J,w:2,h:.25,fontSize:8,bold:!0,color:Z.accent}),J+=.25;for(const he of re.challenges.slice(0,3))B.addText(`• ${he.slice(0,80)}`,{x:.7,y:J,w:8.5,h:.22,fontSize:7,color:Z.text}),J+=.22}if(re.actions.length>0){B.addText(`📋 إجراءات (${re.actions.length})`,{x:.5,y:J,w:2,h:.25,fontSize:8,bold:!0,color:Z.info}),J+=.25;for(const he of re.actions.slice(0,2))B.addText(`• ${he.slice(0,80)}`,{x:.7,y:J,w:8.5,h:.22,fontSize:7,color:Z.text}),J+=.22}J+=.2}}const ta=`التقرير_الشامل_المدمج_${new Date().toISOString().split("T")[0]}.pptx`;await s.writeFile({fileName:ta})}function Cn(){var R,v,j;const e=Oo(),{campaignRound:s,showRoundFilter:i,labelAr:l,isFiltered:u}=Vt(),b=i?Xs(s):null,[N,_]=le.useState(()=>{try{const d=localStorage.getItem("epi-favorite-reports");return d?new Set(JSON.parse(d)):new Set}catch{return new Set}}),m=le.useCallback(d=>{_(h=>{const p=new Set(h);return p.has(d)?p.delete(d):p.add(d),localStorage.setItem("epi-favorite-reports",JSON.stringify([...p])),p})},[]),[F,M]=le.useState(()=>Za());le.useEffect(()=>{Ys()},[]);const S=le.useCallback(d=>{const h=aa.find(p=>p.id===d)||aa[0];M(h),Ws(d)},[]),y=le.useMemo(()=>{var h;const d=[];return Et(e.userRole)&&d.push({icon:yr,title:"ملخص المؤشرات",subtitle:"KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء",value:e.stats?Ze(e.stats.total_submissions):void 0,trend:(h=e.stats)==null?void 0:h.submissions_trend,color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:e.handleExportDashboard,loading:e.exportingReport==="dashboard",badge:"KPIs",format:"excel"}),d.push({icon:Dt,title:"الإرساليات — خط زمني",subtitle:"تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)",value:e.stats?Ze(e.stats.submissions_today):void 0,color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:e.handleExportTimeline,loading:e.exportingReport==="timeline",badge:"30 يوم",format:"excel"}),qe(e.userRole)&&d.push({icon:xt,title:"أداء المحافظات",subtitle:"مقارنة الإرساليات والتغطية الجغرافية بين المحافظات",value:e.govStats?Ze(e.govStats.length)+" محافظة":void 0,color:"text-purple-600",gradient:"bg-gradient-to-r from-purple-500 to-purple-600",onClick:e.handleExportGovernorates,loading:e.exportingReport==="governorates",format:"excel"}),d.push({icon:Na,title:"توزيع الحالات",subtitle:"نسبة الإرساليات المرسلة مقابل المسودات",value:e.stats?`${e.stats.approval_rate.toFixed(1)}%`:void 0,color:"text-amber-600",gradient:"bg-gradient-to-r from-amber-500 to-amber-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"تحليل",format:"excel"}),qe(e.userRole)&&d.push({icon:He,title:"توزيع المستخدمين",subtitle:"المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات",value:e.roleDistribution?Ze(e.roleDistribution.reduce((p,r)=>p+r.value,0)):void 0,color:"text-cyan-600",gradient:"bg-gradient-to-r from-cyan-500 to-cyan-600",onClick:e.handleExportRoles,loading:e.exportingReport==="roles",format:"excel"}),d.push({icon:sa,title:"تقرير الإرساليات الشامل",subtitle:"جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات",value:e.stats?Ze(e.stats.total_submissions):void 0,color:"text-indigo-600",gradient:"bg-gradient-to-r from-indigo-500 to-indigo-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"شامل",format:"excel"}),qe(e.userRole)&&d.push({icon:He,title:"تقرير المستخدمين",subtitle:"قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم",color:"text-rose-600",gradient:"bg-gradient-to-r from-rose-500 to-rose-600",onClick:e.handleExportUsers,loading:e.exportingReport==="users",format:"excel"}),Et(e.userRole)&&d.push({icon:ra,title:"تقرير النواقص",subtitle:"نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل",color:"text-orange-600",gradient:"bg-gradient-to-r from-orange-500 to-orange-600",onClick:e.handleExportShortages,loading:e.exportingReport==="shortages",format:"excel"}),Et(e.userRole)&&d.push({icon:$r,title:"تقييم المرافق الصحية",subtitle:"تقرير تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية",color:"text-teal-600",gradient:"bg-gradient-to-r from-teal-500 to-teal-600",onClick:e.handleExportHealthFacilityAssessment,loading:e.exportingReport==="health-facility-assessment",badge:"تقييم",format:"excel"}),qe(e.userRole)&&d.push({icon:Ks,title:"سجل التدقيق",subtitle:"جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم",color:"text-slate-600",gradient:"bg-gradient-to-r from-slate-500 to-slate-600",onClick:e.handleExportAudit,loading:e.exportingReport==="audit",badge:"audit",format:"excel"}),d.push({icon:rt,title:"📄 PDF — تقرير الإرساليات",subtitle:"تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-500 to-red-600",onClick:e.handleExportPDF,loading:e.exportingReport==="pdf",badge:"PDF",format:"pdf"}),qe(e.userRole)&&(d.push({icon:xt,title:"📄 PDF — أداء المحافظات",subtitle:"تقرير PDF مقارن لأداء المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-600 to-rose-600",onClick:e.handleExportGovPDF,loading:e.exportingReport==="gov-pdf",badge:"PDF",format:"pdf"}),d.push({icon:He,title:"📄 PDF — المستخدمين",subtitle:"تقرير PDF للمستخدمين والأدوار",color:"text-red-600",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:e.handleExportUsersPDF,loading:e.exportingReport==="users-pdf",badge:"PDF",format:"pdf"})),Et(e.userRole)&&d.push({icon:ra,title:"📄 PDF — النواقص",subtitle:"تقرير PDF لنواقص الإمدادات",color:"text-red-600",gradient:"bg-gradient-to-r from-orange-500 to-red-500",onClick:e.handleExportShortagesPDF,loading:e.exportingReport==="shortages-pdf",badge:"PDF",format:"pdf"}),qe(e.userRole)&&d.push({icon:gt,title:"📄 PDF — التقرير الشامل",subtitle:"تقرير PDF شامل بكل البيانات والإحصائيات",color:"text-white",gradient:"bg-gradient-to-r from-red-700 to-red-900",onClick:e.handleExportFullPDF,loading:e.exportingReport==="full-pdf",badge:"PDF شامل",format:"pdf"}),qe(e.userRole)&&(d.push({icon:oa,title:"🏛️ التقرير المركزي الشامل",subtitle:"تقرير احترافي شامل — جميع المحافظات، المستخدمين، النماذج، النواقص، التغطية",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleCentralReport,loading:e.exportingReport==="central-report",badge:"احترافي",format:"pdf"}),e.governorates&&e.governorates.forEach(p=>{d.push({icon:xt,title:`🏛️ تقرير محافظة ${p.name_ar}`,subtitle:"تقرير تفصيلي — المديريات، المستخدمين، الإرساليات، النواقص",color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:()=>e.handleGovDetailReport(p.id),loading:e.exportingReport==="gov-detail-"+p.id,badge:"محافظة",format:"pdf"})})),e.forms&&e.forms.forEach(p=>{d.push({icon:rt,title:`📊 تحليل: ${p.title_ar}`,subtitle:"تقرير تفصيلي — تحليل كل حقل، التغطية حسب المحافظة، التوقيت، الإرساليات",color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:()=>e.handleFormAnalysisReport(p.id),loading:e.exportingReport==="form-analysis-"+p.id,badge:"تحليل نموذج",format:"pdf"})}),qe(e.userRole)&&(d.push({icon:He,title:"👥 تقرير أداء المشرفين",subtitle:"تقييم شامل — كل مشرف وكم أرسل، التقييم، النشاط، جودة البيانات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleSupervisorReport,loading:e.exportingReport==="supervisor-report",badge:"مشرفين",format:"pdf"}),d.push({icon:Nt,title:"🎯 تقرير الفجوة التغطية",subtitle:"أين البيانات ناقصة — محافظات ومديريات بدون تغطية",color:"text-white",gradient:"bg-gradient-to-r from-red-600 to-rose-700",onClick:e.handleCoverageGapReport,loading:e.exportingReport==="coverage-gap",badge:"فجوة",format:"pdf"}),d.push({icon:$a,title:"⚖️ تقرير مقارنة الحملات",subtitle:"شلل أطفال vs الإيصالي التكاملي — مقارنة شاملة",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleCampaignComparisonReport,loading:e.exportingReport==="campaign-comparison",badge:"مقارنة",format:"pdf"})),d.push({icon:Ta,title:"📅 تقرير النشاط اليومي",subtitle:"نشاط اليوم — إرساليات، دخول، مقارنة بأمس",color:"text-white",gradient:"bg-gradient-to-r from-cyan-600 to-teal-700",onClick:e.handleDailyActivityReport,loading:e.exportingReport==="daily-activity",badge:"يومي",format:"pdf"}),qe(e.userRole)&&d.push({icon:Ft,title:"✨ تقرير جودة البيانات",subtitle:"تحليل اكتمال البيانات — GPS، صور، حقول فارغة",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-orange-600",onClick:e.handleDataQualityReport,loading:e.exportingReport==="data-quality",badge:"جودة",format:"pdf"}),d.push({icon:ra,title:"📦 تقرير النواقص التفصيلي",subtitle:"تحليل شامل — حرج/عالي/متوسط، حسب المحافظة والفئة",color:"text-white",gradient:"bg-gradient-to-r from-red-500 to-pink-600",onClick:e.handleShortagesDetailedReport,loading:e.exportingReport==="shortages-detailed",badge:"نواقص",format:"pdf"}),d.push({icon:Dt,title:"📊 التقرير الأسبوعي",subtitle:"ملخص الأسبوع — مقارنة بالسابق، نشاط يومي، أداء المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-green-700",onClick:e.handleWeeklyReport,loading:e.exportingReport==="weekly-report",badge:"أسبوعي",format:"pdf"}),qe(e.userRole)&&d.push({icon:He,title:"🔐 تقرير نشاط المستخدمين",subtitle:"دخول، نشاط، مستخدمين خاملين — من دخل ومتى",color:"text-white",gradient:"bg-gradient-to-r from-slate-600 to-gray-700",onClick:e.handleUserActivityReport,loading:e.exportingReport==="user-activity",badge:"نشاط",format:"pdf"}),d.push({icon:Nt,title:"⚠️ PDF — التحديات والصعوبات",subtitle:"تقرير شامل — فجوات التغطية، النواقص، المشرفين غير النشطين، جودة البيانات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-orange-700",onClick:e.handleChallengesReport,loading:e.exportingReport==="challenges",badge:"تحديات",format:"pdf"}),d.push({icon:Hs,title:"📋 PDF — استمارة الإشراف",subtitle:"النشاط الإيصالي التكاملي — 8 أقسام إشرافية، 33 مؤشر، تحليل تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-teal-600 to-cyan-700",onClick:e.handleSupervisionFormReport,loading:e.exportingReport==="supervision-form",badge:"إشراف",format:"pdf"}),d.push({icon:rt,title:"📝 PDF — تحديات الإشراف الميداني",subtitle:"آخر 3 حقول: التحديات والصعوبات، الإجراءات المتخذة، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleSupervisionChallengesReport,loading:e.exportingReport==="supervision-challenges",badge:"ميداني",format:"pdf"}),d.push({icon:He,title:"📋 تقييم أداء المشرفين اليومي",subtitle:"اليومي — المركزي + المحافظات + المديريات | الاسم، الصفة، عدد الاستمارات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-teal-700",onClick:e.handleDailySupervisorEvaluation,loading:e.exportingReport==="daily-supervisor-eval",badge:"يومي",format:"pdf"}),d.push({icon:He,title:"📊 تقييم أداء المشرفين الشامل",subtitle:"جميع الاستمارات — بدون فلتر تاريخ | إجمالي النشاط، المديريات، المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-indigo-700",onClick:e.handleComprehensiveSupervisorEvaluation,loading:e.exportingReport==="comprehensive-supervisor-eval",badge:"شامل",format:"pdf"}),d.push({icon:Ft,title:"🏆 التقرير الشامل المدمج للمشرفين",subtitle:"تقرير واحد يدمج: تقييم الأداء + تحليل نعم/لا + تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-red-600",onClick:e.handleMasterSupervisorReport,loading:e.exportingReport==="master-supervisor-report",badge:"🏆 مدمج",format:"pdf"}),d.push({icon:oa,title:"🏛️ تقييم إشراف عام",subtitle:"المشرفين العامين فقط — مدير عام مكتب الصحة، تقييم الأداء، ترتيب، نسب النشاط",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleGeneralSupervisorsEvaluation,loading:e.exportingReport==="general-supervisors-eval",badge:"إشراف عام",format:"pdf"}),d.push({icon:Ft,title:"📊 تحليل حقول نعم/لا",subtitle:"استمارة الاشراف — تحليل شامل لكل حقل نعم/لا حسب القسم والمحافظة",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleYesNoAnalysis,loading:e.exportingReport==="yesno-analysis",badge:"تحليل",format:"pdf"}),d.push({icon:xt,title:"🗺️ خريطة مواقع المشرفين",subtitle:"خريطة اليمن + خريطة كل محافظة — مواقع GPS للمشرفين",color:"text-white",gradient:"bg-gradient-to-r from-teal-500 to-cyan-600",onClick:e.handleMapReport,loading:!1,badge:"خريطة",format:"pdf"}),qe(e.userRole)&&d.push({icon:St,title:"📊 PPTX — التقرير الشهري",subtitle:"عرض PowerPoint احترافي — KPIs، مقارنة الحملات، تغطية المحافظات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-orange-500 to-amber-600",onClick:()=>e.exportReport("pptx-monthly",async()=>{await Uo()}),loading:e.exportingReport==="pptx-monthly",badge:"شهري",format:"pptx"}),d.push({icon:Dt,title:"📅 PPTX — النشرة الأسبوعية",subtitle:"عرض PowerPoint — ملخص الأسبوع، النشاط اليومي، ترتيب المحافظات، التنبيهات",color:"text-white",gradient:"bg-gradient-to-r from-orange-600 to-red-500",onClick:()=>e.exportReport("pptx-weekly",async()=>{await qo()}),loading:e.exportingReport==="pptx-weekly",badge:"أسبوعي",format:"pptx"}),d.push({icon:$a,title:"💉 PPTX — أداء الحملات",subtitle:"عرض PowerPoint — شلل أطفال vs الإيصالي، معدل التسريب، التغطية، تأثير النواقص",color:"text-white",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:()=>e.exportReport("pptx-campaign",async()=>{await Yo()}),loading:e.exportingReport==="pptx-campaign",badge:"حملات",format:"pptx"}),d.push({icon:Ft,title:"🏆 PPTX — التقرير الشامل المدمج",subtitle:"عرض PowerPoint احترافي — تقييم الأداء + تحليل نعم/لا + التحديات | 8 شرائح",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-red-600",onClick:()=>e.exportReport("pptx-master",async()=>{await Wo()}),loading:e.exportingReport==="pptx-master",badge:"🏆 مدمج",format:"pptx"}),d.map(p=>({...p,favorite:N.has(p.title),onToggleFavorite:()=>m(p.title)}))},[e.userRole,e.stats,e.govStats,e.chartData,e.roleDistribution,e.exportingReport,e.dateFrom,e.dateTo,e.selectedGovFilter,e.campaign,e.governorates,e.forms,N,m]),k=le.useMemo(()=>{let d=y;if(e.reportFormat==="favorites"?d=d.filter(h=>h.favorite):e.reportFormat!=="all"&&(d=d.filter(h=>h.format===e.reportFormat)),e.reportSearch.trim()){const h=e.reportSearch.trim().toLowerCase();d=d.filter(p=>p.title.toLowerCase().includes(h)||p.subtitle.toLowerCase().includes(h)||p.badge&&p.badge.toLowerCase().includes(h))}return d},[y,e.reportSearch,e.reportFormat]),C=le.useMemo(()=>{const d={all:y.length,pdf:0,excel:0,pptx:0,favorites:0};return y.forEach(h=>{h.format==="pdf"?d.pdf++:h.format==="excel"?d.excel++:h.format==="pptx"&&d.pptx++,h.favorite&&d.favorites++}),d},[y]);return a.jsxs("div",{className:"page-enter",children:[a.jsx(Zs,{title:"التقارير والبيانات",subtitle:e.isFiltered?`تحليلات وتصدير — ${e.labelAr}`:"تحليلات ذكية وتصدير احترافي للبيانات",onRefresh:()=>{e.refetchStats(),e.refetchForms()}}),a.jsxs("div",{className:"p-6 space-y-6",children:[a.jsx(Oe,{className:"border-0 shadow-md",children:a.jsx(Be,{className:"p-4",children:a.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[a.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium",children:[a.jsx(Va,{className:"w-4 h-4 text-muted-foreground"}),"فلاتر"]}),a.jsxs("div",{className:"flex items-center gap-1.5",children:[a.jsx(Xa,{className:"w-3.5 h-3.5 text-muted-foreground"}),a.jsx(ct,{type:"date",value:e.dateFrom,onChange:d=>e.setDateFrom(d.target.value),className:"w-[140px] h-9 text-xs"}),a.jsx("span",{className:"text-xs text-muted-foreground",children:"—"}),a.jsx(ct,{type:"date",value:e.dateTo,onChange:d=>e.setDateTo(d.target.value),className:"w-[140px] h-9 text-xs"})]}),Et(e.userRole)&&a.jsxs(fa,{value:e.selectedGovFilter,onValueChange:e.setSelectedGovFilter,children:[a.jsxs(va,{className:"w-[160px] h-9",children:[a.jsx(xt,{className:"w-3.5 h-3.5 ml-2 text-muted-foreground"}),a.jsx(ba,{placeholder:"المحافظة"})]}),a.jsxs(xa,{children:[a.jsx(Mt,{value:"all",children:"كل المحافظات"}),(e.governorates||[]).map(d=>a.jsx(Mt,{value:d.id,children:d.name_ar},d.id))]})]}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx(_r,{className:"w-3.5 h-3.5 text-muted-foreground"}),a.jsx("div",{className:"flex items-center gap-1.5",children:aa.map(d=>a.jsx("button",{onClick:()=>S(d.id),title:d.nameAr,className:_e("w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110",F.id===d.id?"border-foreground shadow-md scale-110":"border-transparent hover:border-muted-foreground/30"),style:{backgroundColor:`#${d.primary}`}},d.id))}),a.jsx("span",{className:"text-[10px] text-muted-foreground font-medium",children:F.nameAr})]}),(e.dateFrom||e.dateTo||e.selectedGovFilter!=="all")&&a.jsxs(Ye,{variant:"ghost",size:"sm",onClick:()=>{e.setDateFrom(""),e.setDateTo(""),e.setSelectedGovFilter("all")},className:"h-9 gap-1 text-muted-foreground",children:[a.jsx(ha,{className:"w-3 h-3"})," مسح"]})]})})}),a.jsx(sr,{title:"التقارير",children:a.jsxs(Js,{value:e.activeTab,onValueChange:e.setActiveTab,children:[a.jsxs(Qs,{className:"w-full justify-start gap-1 bg-transparent p-0 h-auto",children:[a.jsxs(At,{value:"analytics",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[a.jsx(Ft,{className:"w-4 h-4"})," التحليلات"]}),a.jsxs(At,{value:"quick-reports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[a.jsx(Ea,{className:"w-4 h-4"})," التقارير السريعة"]}),a.jsxs(At,{value:"form-exports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[a.jsx($t,{className:"w-4 h-4"})," تصدير النماذج",a.jsx(tt,{variant:"secondary",className:"text-[10px] px-1.5",children:e.forms.length})]}),a.jsxs(At,{value:"comparison",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[a.jsx(_a,{className:"w-4 h-4"})," مقارنة الفترات"]})]}),a.jsx(Ja,{className:"my-4"}),a.jsxs(Lt,{value:"analytics",className:"mt-0 space-y-6",children:[a.jsx(Or,{filter:e.analyticsFilter,onChange:e.setAnalyticsFilter,onRefresh:()=>{e.refetchStats(),e.refetchForms()},refreshing:e.statsLoading}),a.jsx("div",{className:"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4",children:e.statsLoading?Array.from({length:6}).map((d,h)=>a.jsx(lt,{className:"h-28 rounded-xl"},h)):e.stats&&[{icon:He,label:"المستخدمون",value:e.stats.total_users,sub:`${e.stats.active_users} نشط`,color:"text-blue-600",bg:"bg-blue-50"},{icon:sa,label:"إرساليات اليوم",value:e.stats.submissions_today,sub:`من ${Ze(e.stats.total_submissions)} إجمالي`,color:"text-emerald-600",bg:"bg-emerald-50",trend:e.stats.submissions_trend},{icon:rt,label:"المسودات",value:e.stats.draft_submissions,sub:"قيد الإعداد",color:"text-amber-600",bg:"bg-amber-50"},{icon:ya,label:"معدل الاعتماد",value:`${e.stats.approval_rate.toFixed(1)}%`,sub:"نسبة الإرسال",color:"text-purple-600",bg:"bg-purple-50"},{icon:rt,label:"النماذج النشطة",value:e.stats.active_forms,sub:`من ${e.stats.total_forms}`,color:"text-cyan-600",bg:"bg-cyan-50"},{icon:Ta,label:"إرساليات الأسبوع",value:e.stats.submissions_this_week,sub:"آخر 7 أيام",color:"text-rose-600",bg:"bg-rose-50"}].map((d,h)=>{const p=d.icon;return a.jsxs(Oe,{className:"border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group",children:[a.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",d.color.replace("text-","bg-"))}),a.jsxs(Be,{className:"p-4",children:[a.jsxs("div",{className:"flex items-start justify-between mb-3",children:[a.jsx("div",{className:_e("p-2 rounded-xl",d.bg),children:a.jsx(p,{className:_e("w-5 h-5",d.color)})}),d.trend!==void 0&&a.jsxs("span",{className:_e("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",d.trend>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[d.trend>=0?a.jsx(ka,{className:"w-2.5 h-2.5"}):a.jsx(Xt,{className:"w-2.5 h-2.5"}),Math.abs(d.trend),"%"]})]}),a.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:Ze(d.value)}),a.jsx("p",{className:"text-xs font-medium mt-0.5",children:d.label}),a.jsx("p",{className:"text-[10px] text-muted-foreground",children:d.sub})]})]},h)})}),a.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[a.jsxs(Oe,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[a.jsxs(it,{className:"flex flex-row items-center justify-between pb-2",children:[a.jsxs("div",{children:[a.jsxs(dt,{className:"text-base font-heading flex items-center gap-2",children:[a.jsx(Dt,{className:"w-5 h-5 text-primary"}),"حركة الإرساليات"]}),a.jsx(na,{className:"text-xs",children:"آخر 30 يوم"})]}),a.jsxs(Ye,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportTimeline,children:[a.jsx(gt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),a.jsx(Be,{className:"pt-0",children:e.chartLoading?a.jsx(lt,{className:"w-full h-[280px]"}):a.jsx(Gt,{width:"100%",height:280,children:a.jsxs(wr,{data:e.chartData||[],children:[a.jsxs("defs",{children:[a.jsxs("linearGradient",{id:"gSubmitted",x1:"0",y1:"0",x2:"0",y2:"1",children:[a.jsx("stop",{offset:"5%",stopColor:"#10b981",stopOpacity:.3}),a.jsx("stop",{offset:"95%",stopColor:"#10b981",stopOpacity:0})]}),a.jsxs("linearGradient",{id:"gDraft",x1:"0",y1:"0",x2:"0",y2:"1",children:[a.jsx("stop",{offset:"5%",stopColor:"#f59e0b",stopOpacity:.3}),a.jsx("stop",{offset:"95%",stopColor:"#f59e0b",stopOpacity:0})]})]}),a.jsx(Ma,{strokeDasharray:"3 3",stroke:"#e5e7eb"}),a.jsx(za,{dataKey:"date",tick:{fontSize:10,fill:"#6b7280"},tickFormatter:d=>d.slice(5),stroke:"#d1d5db"}),a.jsx(Pa,{tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),a.jsx(Ot,{content:a.jsx(Bt,{})}),a.jsx(Sr,{formatter:d=>a.jsx("span",{className:"text-xs",children:d})}),a.jsx(Ia,{type:"monotone",dataKey:"submitted",name:"مرسلة",stroke:"#10b981",fill:"url(#gSubmitted)",strokeWidth:2.5,dot:!1}),a.jsx(Ia,{type:"monotone",dataKey:"draft",name:"مسودة",stroke:"#f59e0b",fill:"url(#gDraft)",strokeWidth:2.5,dot:!1})]})})})]}),a.jsxs(Oe,{className:"border-0 shadow-md overflow-hidden",children:[a.jsx(it,{className:"pb-2",children:a.jsxs(dt,{className:"text-base font-heading flex items-center gap-2",children:[a.jsx(Na,{className:"w-5 h-5 text-primary"}),"توزيع الحالات"]})}),a.jsx(Be,{children:e.statsLoading?a.jsx(lt,{className:"w-full h-[260px]"}):a.jsxs(a.Fragment,{children:[a.jsx(Gt,{width:"100%",height:180,children:a.jsxs(Aa,{children:[a.jsx(La,{data:e.statusPieData,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.statusPieData.map((d,h)=>a.jsx(la,{fill:d.color},h))}),a.jsx(Ot,{content:a.jsx(Bt,{})})]})}),a.jsx("div",{className:"space-y-2 mt-2",children:e.statusPieData.map((d,h)=>a.jsxs("div",{className:"flex items-center justify-between text-sm",children:[a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:d.color}}),a.jsx("span",{className:"text-muted-foreground text-xs",children:d.name})]}),a.jsx("span",{className:"font-bold tabular-nums text-xs",children:Ze(d.value)})]},h))})]})})]})]}),a.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[a.jsxs(Oe,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[a.jsxs(it,{className:"flex flex-row items-center justify-between pb-2",children:[a.jsxs("div",{children:[a.jsxs(dt,{className:"text-base font-heading flex items-center gap-2",children:[a.jsx(St,{className:"w-5 h-5 text-primary"}),"الإرساليات حسب المحافظة"]}),a.jsx(na,{className:"text-xs",children:"أعلى 10 محافظات"})]}),a.jsxs(Ye,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportGovernorates,children:[a.jsx(gt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),a.jsx(Be,{className:"pt-0",children:e.govLoading?a.jsx(lt,{className:"w-full h-[280px]"}):a.jsx(Gt,{width:"100%",height:280,children:a.jsxs(kr,{data:e.govChartData,layout:"vertical",children:[a.jsx(Ma,{strokeDasharray:"3 3",stroke:"#e5e7eb",horizontal:!1}),a.jsx(za,{type:"number",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),a.jsx(Pa,{dataKey:"name",type:"category",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db",width:70}),a.jsx(Ot,{content:a.jsx(Bt,{})}),a.jsx(Fr,{dataKey:"الإرساليات",radius:[0,8,8,0],children:e.govChartData.map((d,h)=>a.jsx(la,{fill:bt[h%bt.length]},h))})]})})})]}),a.jsxs(Oe,{className:"border-0 shadow-md overflow-hidden",children:[a.jsx(it,{className:"pb-2",children:a.jsxs(dt,{className:"text-base font-heading flex items-center gap-2",children:[a.jsx(He,{className:"w-5 h-5 text-primary"}),"توزيع الأدوار"]})}),a.jsx(Be,{children:e.roleDistribution?a.jsxs(a.Fragment,{children:[a.jsx(Gt,{width:"100%",height:180,children:a.jsxs(Aa,{children:[a.jsx(La,{data:e.roleDistribution,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.roleDistribution.map((d,h)=>a.jsx(la,{fill:bt[h%bt.length]},h))}),a.jsx(Ot,{content:a.jsx(Bt,{})})]})}),a.jsx("div",{className:"space-y-2 mt-2",children:e.roleDistribution.map((d,h)=>a.jsxs("div",{className:"flex items-center justify-between text-sm",children:[a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:bt[h%bt.length]}}),a.jsx("span",{className:"text-muted-foreground text-xs",children:d.name})]}),a.jsx("span",{className:"font-bold tabular-nums text-xs",children:d.value})]},h))})]}):a.jsx(lt,{className:"w-full h-[260px]"})})]})]}),((R=e.auditData)==null?void 0:R.data)&&e.auditData.data.length>0&&a.jsxs(Oe,{className:"border-0 shadow-md overflow-hidden",children:[a.jsxs(it,{className:"flex flex-row items-center justify-between pb-2",children:[a.jsxs("div",{children:[a.jsxs(dt,{className:"text-base font-heading flex items-center gap-2",children:[a.jsx(Dr,{className:"w-5 h-5 text-primary"}),"آخر النشاطات"]}),a.jsx(na,{className:"text-xs",children:"آخر العمليات المسجلة في النظام"})]}),a.jsxs(Ye,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportAudit,children:[a.jsx(gt,{className:"w-3.5 h-3.5"})," تصدير السجل"]})]}),a.jsx(Be,{className:"pt-0",children:a.jsx("div",{className:"space-y-0",children:(j=(v=e.auditData)==null?void 0:v.data)==null?void 0:j.slice(0,8).map((d,h)=>{var f,E,c;const p={create:{icon:ya,color:"text-emerald-600 bg-emerald-50"},update:{icon:Dt,color:"text-blue-600 bg-blue-50"},delete:{icon:Nt,color:"text-red-600 bg-red-50"},login:{icon:He,color:"text-purple-600 bg-purple-50"}},r={create:"إنشاء",update:"تعديل",delete:"حذف",login:"دخول",logout:"خروج"},o={profiles:"المستخدمين",form_submissions:"الإرساليات",forms:"النماذج",supply_shortages:"النواقص",notifications:"الإشعارات"},g=p[d.action]||{icon:Rr,color:"text-muted-foreground bg-muted"},n=g.icon,x=Date.now()-new Date(d.created_at).getTime();let I;return x<6e4?I="الآن":x<36e5?I=`منذ ${Math.floor(x/6e4)} د`:x<864e5?I=`منذ ${Math.floor(x/36e5)} س`:I=`منذ ${Math.floor(x/864e5)} يوم`,a.jsxs("div",{className:_e("flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors",h<(((E=(f=e.auditData)==null?void 0:f.data)==null?void 0:E.length)??0)-1&&"border-b"),children:[a.jsx("div",{className:_e("p-2 rounded-lg",g.color),children:a.jsx(n,{className:"w-4 h-4"})}),a.jsxs("div",{className:"flex-1 min-w-0",children:[a.jsxs("p",{className:"text-sm font-medium truncate",children:[((c=d.profiles)==null?void 0:c.full_name)||"النظام"," — ",r[d.action]||d.action]}),a.jsxs("p",{className:"text-xs text-muted-foreground",children:[o[d.table_name]||d.table_name,d.ip_address&&` • ${d.ip_address}`]})]}),a.jsx("span",{className:"text-[11px] text-muted-foreground shrink-0",children:I})]},d.id)})})})]})]}),a.jsxs(Lt,{value:"quick-reports",className:"mt-0 space-y-6",children:[a.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-3",children:[a.jsxs("div",{children:[a.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[a.jsx(Ea,{className:"w-5 h-5 text-amber-500"}),"التقارير السريعة"]}),a.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"اختر التصنيف أو ابحث عن تقرير"})]}),a.jsxs("div",{className:"flex items-center gap-3",children:[a.jsxs("div",{className:"relative w-64",children:[a.jsx(Vs,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),a.jsx(ct,{placeholder:"بحث في التقارير...",value:e.reportSearch,onChange:d=>e.setReportSearch(d.target.value),className:"pr-10 h-9 text-sm"}),e.reportSearch&&a.jsx("button",{onClick:()=>e.setReportSearch(""),className:"absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",children:a.jsx(Qa,{className:"w-3.5 h-3.5"})})]}),b&&a.jsxs(tt,{variant:"secondary",className:"text-xs gap-1",children:[a.jsx(ha,{className:"w-3 h-3"})," ",b]}),a.jsxs(tt,{variant:"outline",className:"text-xs",children:[k.length," تقرير"]})]})]}),a.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:[{key:"all",label:"الكل",icon:sa,color:"bg-primary text-primary-foreground"},{key:"favorites",label:"المفضلة",icon:es,color:"bg-amber-500 text-white"},{key:"excel",label:"Excel / CSV",icon:$t,color:"bg-emerald-600 text-white"},{key:"pdf",label:"PDF",icon:rt,color:"bg-red-600 text-white"},{key:"pptx",label:"PowerPoint",icon:St,color:"bg-orange-600 text-white"}].map(d=>{const h=d.icon,p=e.reportFormat===d.key,r=C[d.key];return a.jsxs("button",{onClick:()=>e.setReportFormat(d.key),className:_e("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",p?`${d.color} shadow-md scale-105`:"bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"),children:[a.jsx(h,{className:"w-4 h-4"}),a.jsx("span",{children:d.label}),a.jsx("span",{className:_e("text-[10px] font-bold px-1.5 py-0.5 rounded-full",p?"bg-white/20":"bg-muted"),children:r})]},d.key)})}),k.length===0?a.jsxs("div",{className:"text-center py-16",children:[a.jsx(oa,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),a.jsx("h3",{className:"text-lg font-medium",children:e.reportSearch?"لا توجد نتائج للبحث":"لا توجد تقارير متاحة"}),a.jsx("p",{className:"text-sm text-muted-foreground",children:e.reportSearch?"جرّب كلمة مختلفة":"تواصل مع مدير النظام للحصول على صلاحيات"})]}):a.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5",children:k.map((d,h)=>a.jsx(Tr,{...d},h))})]}),a.jsxs(Lt,{value:"form-exports",className:"mt-0 space-y-4",children:[a.jsxs("div",{className:"flex items-center justify-between",children:[a.jsxs("div",{children:[a.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[a.jsx($t,{className:"w-5 h-5 text-emerald-500"}),"تصدير النماذج"]}),a.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"تصدير إرساليات كل نموذج بشكل منفصل"})]}),a.jsxs("div",{className:"relative w-64",children:[a.jsx(rt,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),a.jsx(ct,{placeholder:"بحث...",value:e.formSearch,onChange:d=>e.setFormSearch(d.target.value),className:"pr-10 h-9 text-sm"})]})]}),e.formsLoading?a.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:Array.from({length:6}).map((d,h)=>a.jsx(lt,{className:"h-56 rounded-xl"},h))}):e.filteredForms.length===0?a.jsxs("div",{className:"text-center py-16",children:[a.jsx($t,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),a.jsx("h3",{className:"text-lg font-medium",children:e.formSearch?"لا توجد نتائج":"لا توجد نماذج"})]}):a.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:e.filteredForms.map(d=>{var h;return a.jsx(Er,{form:d,submissionCount:(h=e.submissionCounts)==null?void 0:h[d.id],onExport:e.handleExportForm,exporting:e.exportingFormId===d.id},d.id)})})]}),a.jsxs(Lt,{value:"comparison",className:"mt-0 space-y-4",children:[a.jsxs("div",{children:[a.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[a.jsx(_a,{className:"w-5 h-5 text-primary"}),"مقارنة الفترات"]}),a.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"قارن أداء الفترة الحالية بالسابقة"})]}),a.jsx(Gr,{})]})]})})]}),e.exportProgress.isActive&&a.jsx("div",{className:"fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto",children:a.jsx(Cr,{status:e.exportProgress.status,message:e.exportProgress.message,progress:e.exportProgress.progress,total:e.exportProgress.total})}),a.jsx(as,{...e.previewProps}),a.jsx(Br,{open:e.drillDownOpen,onClose:()=>e.setDrillDownOpen(!1),data:e.drillDownData}),a.jsx(qr,{open:!!e.fullscreenChart,onClose:()=>e.setFullscreenChart(null),title:e.fullscreenChart||"",children:a.jsx("div",{className:"h-full flex items-center justify-center text-muted-foreground",children:a.jsx("p",{className:"text-sm",children:"اضغط ESC للإغلاق"})})})]})}export{Cn as default};
