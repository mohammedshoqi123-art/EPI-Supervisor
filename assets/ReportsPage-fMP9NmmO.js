import{j as s}from"./data-vendor-CInkegrm.js";import{a as ge,k as Ls}from"./react-vendor-CSqLrF-f.js";import{c as Sa,C as Be,a as _e,i as qe,e as st,L as At,af as _t,g as We,n as Gs,I as U,Q as Ha,u as Zt,p as kt,T as zt,b as ct,d as gt,ac as Va,q as Xa,N as ut,a3 as Za,v as yt,X as Ja,R as ha,a4 as Os,aT as Bs,aU as Qa,aV as t,J as qs,aW as ja,aX as Us,aY as Ys,aZ as aa,a_ as Ws,s as tt,U as He,x as sa,P as ra,a$ as Ks,t as nt,f as oa,o as Ta,h as Dt,F as Hs,Z as Ea,a6 as na,K as Vs,an as Xs}from"./index-BII1dppx.js";import{S as dt}from"./skeleton-BUDf6U2h.js";import{S as fa,a as va,b as ba,c as xa,d as Pt}from"./select-DN1dC-4F.js";import{T as Zs,a as Js,b as Gt,c as Ot}from"./tabs-CJTlqvwV.js";import{H as Qs}from"./header-BQ7ekelz.js";import{P as er}from"./progress-DhXU6TNW.js";import{S as es}from"./star-Bmao4zu7.js";import{T as ka}from"./trending-up-zqQExvuB.js";import{T as Jt}from"./trending-down-BynNkXWR.js";import{A as tr}from"./arrow-up-right-CPc7rABs.js";import{u as ts,R as as}from"./ReportPreview-B3Hen64m.js";import{C as ya}from"./circle-check-DKIYwv38.js";import{C as ar}from"./circle-x-xmuxhhZQ.js";import{F as pt}from"./file-down-Cg7qEC5P.js";import{S as sr}from"./section-error-boundary-D6boQQRr.js";import{T as $a}from"./target-JwZDV-w5.js";import{A as rr}from"./award-BAopVmc9.js";import{D as ss,a as rs,b as os,c as ns,d as or}from"./dialog-DCKzlsX-.js";import{T as nr,a as lr,b as Ca,c as ir,d as dr,e as cr}from"./table-BCIK6OeN.js";import{u as ls}from"./governorates-D8qOuskU.js";import{u as gr,b as ur,a as pr,d as mr}from"./dashboard-C62IXDMC.js";import{u as hr,d as fr}from"./forms-n-M0UeVl.js";import{u as vr}from"./audit-B1TQbq4K.js";import{u as vt,w as br,P as Qt}from"./export-vendor-CeQm8jP5.js";import{E as ea,g as jt}from"./enhanced-pdf-C8v-6JNV.js";import{g as xr}from"./campaign-BC736IK9.js";import{G as yr}from"./gauge-qxKlmNnA.js";import{A as Tt}from"./activity-2zAro-3d.js";import{C as Na}from"./chart-pie-D9I1O0p2.js";import{B as $r}from"./building-2-BgGjDLiT.js";import{P as _r}from"./palette-D2UkcYTG.js";import{R as Bt,A as wr,C as Ma,X as za,Y as Pa,T as qt,L as Sr,a as Ia,i as Aa,j as La,h as la,B as kr,b as Fr}from"./chart-vendor-aV12ZcRF.js";import{I as Rr}from"./info-DWGa5eXD.js";import"./ui-vendor-SYVzqSV-.js";import"./chevron-down-CqqrkIna.js";import"./external-link-Czxnee_U.js";/**
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
 */const jr=Sa("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);function Ut({active:e,payload:r,label:l}){return!e||!(r!=null&&r.length)?null:s.jsxs("div",{className:"bg-popover/95 backdrop-blur-sm border border-border/60 rounded-xl shadow-xl p-3 min-w-[140px]",children:[s.jsx("p",{className:"text-xs font-medium text-muted-foreground mb-2",children:l}),r.map((n,g)=>s.jsxs("div",{className:"flex items-center justify-between gap-4 text-sm",children:[s.jsxs("div",{className:"flex items-center gap-1.5",children:[s.jsx("div",{className:"w-2.5 h-2.5 rounded-full",style:{backgroundColor:n.color}}),s.jsx("span",{className:"text-muted-foreground",children:n.name})]}),s.jsx("span",{className:"font-bold tabular-nums",children:n.value})]},g))]})}const Yt={pdf:{label:"PDF",color:"text-red-700",bg:"bg-red-50 border-red-200"},excel:{label:"Excel",color:"text-emerald-700",bg:"bg-emerald-50 border-emerald-200"},pptx:{label:"PPTX",color:"text-orange-700",bg:"bg-orange-50 border-orange-200"}};function Tr({icon:e,title:r,subtitle:l,value:n,trend:g,color:_,gradient:N,onClick:k,loading:p,badge:T,format:M,favorite:j,onToggleFavorite:F}){return s.jsxs(Be,{className:"group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 border-0 shadow-lg cursor-pointer relative overflow-hidden",onClick:k,children:[s.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",N)}),s.jsx("div",{className:_e("absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500",_.replace("text-","bg-"))}),F&&s.jsx("button",{onClick:S=>{S.stopPropagation(),F()},className:"absolute top-3 left-3 z-10 p-1 rounded-full transition-all hover:scale-125",title:j?"إزالة من المفضلة":"إضافة للمفضلة",children:s.jsx(es,{className:_e("w-4 h-4 transition-colors",j?"fill-amber-400 text-amber-400":"text-muted-foreground/30 hover:text-amber-400")})}),s.jsxs(qe,{className:"p-5 relative",children:[s.jsxs("div",{className:"flex items-start justify-between mb-4",children:[s.jsx("div",{className:_e("p-3 rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6",_.replace("text-","bg-").replace("600","50")),children:s.jsx(e,{className:_e("w-6 h-6",_)})}),s.jsxs("div",{className:"flex items-center gap-2",children:[M&&Yt[M]&&s.jsx("span",{className:_e("text-[9px] font-bold px-1.5 py-0.5 rounded border",Yt[M].color,Yt[M].bg),children:Yt[M].label}),T&&s.jsx(st,{variant:"secondary",className:"text-[10px] px-2",children:T}),g!==void 0&&s.jsxs("span",{className:_e("flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",g>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[g>=0?s.jsx(ka,{className:"w-3 h-3"}):s.jsx(Jt,{className:"w-3 h-3"}),Math.abs(g),"%"]})]})]}),n&&s.jsx("p",{className:"text-3xl font-heading font-bold mb-1 tabular-nums",children:n}),s.jsx("h3",{className:"font-bold font-heading text-sm mb-0.5",children:r}),s.jsx("p",{className:"text-xs text-muted-foreground",children:l}),s.jsxs("div",{className:"flex items-center gap-1 mt-3 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity",children:[s.jsx("span",{children:"تصدير التقرير"}),s.jsx(tr,{className:"w-3.5 h-3.5"})]})]}),p&&s.jsx("div",{className:"absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10",children:s.jsx(At,{className:"w-6 h-6 animate-spin text-primary"})})]})}function Er({form:e,submissionCount:r,onExport:l,exporting:n}){const g=(r==null?void 0:r.total)||0,_=(r==null?void 0:r.submitted)||0,N=(r==null?void 0:r.draft)||0,k=g>0?Math.round(_/g*100):0;return s.jsxs(Be,{className:_e("group hover:shadow-lg transition-all duration-200 relative overflow-hidden",!e.is_active&&"opacity-50"),children:[s.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",e.is_active?"bg-emerald-500":"bg-gray-400")}),s.jsxs(qe,{className:"p-4 pt-5",children:[s.jsxs("div",{className:"flex items-start gap-3 mb-3",children:[s.jsx("div",{className:"p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100",children:s.jsx(_t,{className:"w-5 h-5 text-emerald-600"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsx("h3",{className:"font-bold text-sm truncate",children:e.title_ar}),s.jsx("p",{className:"text-xs text-muted-foreground truncate",children:e.title_en})]}),e.campaign_type&&s.jsx(st,{variant:"outline",className:_e("text-[10px] shrink-0",e.campaign_type==="polio_campaign"?"text-blue-600 border-blue-200":"text-emerald-600 border-emerald-200"),children:e.campaign_type==="polio_campaign"?"💉":"🏥"})]}),s.jsxs("div",{className:"grid grid-cols-3 gap-2 mb-3",children:[s.jsxs("div",{className:"text-center p-2 rounded-lg bg-muted/50",children:[s.jsx("p",{className:"text-lg font-bold",children:g}),s.jsx("p",{className:"text-[10px] text-muted-foreground",children:"إجمالي"})]}),s.jsxs("div",{className:"text-center p-2 rounded-lg bg-emerald-50",children:[s.jsx("p",{className:"text-lg font-bold text-emerald-600",children:_}),s.jsx("p",{className:"text-[10px] text-emerald-700",children:"مرسل"})]}),s.jsxs("div",{className:"text-center p-2 rounded-lg bg-amber-50",children:[s.jsx("p",{className:"text-lg font-bold text-amber-600",children:N}),s.jsx("p",{className:"text-[10px] text-amber-700",children:"مسودة"})]})]}),s.jsxs("div",{className:"mb-3",children:[s.jsxs("div",{className:"flex justify-between text-[10px] text-muted-foreground mb-1",children:[s.jsx("span",{children:"نسبة الإرسال"}),s.jsxs("span",{children:[k,"%"]})]}),s.jsx(er,{value:k,className:"h-1.5"})]}),s.jsxs("div",{className:"flex gap-2",children:[s.jsxs(We,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",onClick:()=>l(e,"xlsx"),disabled:n||g===0,children:[n?s.jsx(At,{className:"w-3 h-3 animate-spin"}):s.jsx(_t,{className:"w-3 h-3"}),"Excel"]}),s.jsxs(We,{variant:"outline",size:"sm",className:"flex-1 gap-1.5 text-xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",onClick:()=>l(e,"csv"),disabled:n||g===0,children:[n?s.jsx(At,{className:"w-3 h-3 animate-spin"}):s.jsx(Gs,{className:"w-3 h-3"}),"CSV"]})]})]})]})}function Cr({status:e,message:r,progress:l,total:n,className:g}){if(e==="idle")return null;const _=n&&l?Math.round(l/n*100):null;return s.jsxs("div",{className:_e("flex items-center gap-3 p-3 rounded-xl border transition-all",e==="error"?"bg-red-50 border-red-200":e==="done"?"bg-emerald-50 border-emerald-200":"bg-blue-50 border-blue-200",g),children:[s.jsx("div",{className:_e("p-2 rounded-lg shrink-0",e==="error"?"bg-red-100":e==="done"?"bg-emerald-100":"bg-blue-100"),children:e==="fetching"||e==="generating"?s.jsx(At,{className:"w-4 h-4 text-blue-600 animate-spin"}):e==="done"?s.jsx(ya,{className:"w-4 h-4 text-emerald-600"}):e==="error"?s.jsx(ar,{className:"w-4 h-4 text-red-600"}):s.jsx(pt,{className:"w-4 h-4 text-blue-600"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("span",{className:"text-xs font-medium",children:e==="fetching"?"جاري تحميل البيانات...":e==="generating"?"جاري إنشاء التقرير...":e==="done"?"تم التصدير بنجاح ✅":e==="error"?"فشل التصدير":""}),_!==null&&s.jsxs("span",{className:"text-[10px] font-mono tabular-nums text-muted-foreground",children:[_,"%"]})]}),r&&s.jsx("p",{className:"text-[10px] text-muted-foreground mt-0.5 truncate",children:r}),_!==null&&s.jsx("div",{className:"mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden",children:s.jsx("div",{className:_e("h-full rounded-full transition-all duration-300",e==="error"?"bg-red-500":"bg-blue-500"),style:{width:`${Math.min(_,100)}%`}})}),l!==void 0&&n!==void 0&&s.jsxs("p",{className:"text-[9px] text-muted-foreground/70 mt-1",children:[l.toLocaleString("ar-SA")," / ",n.toLocaleString("ar-SA")," سجل"]})]})]})}function Nr(){const[e,r]=ge.useState("idle"),[l,n]=ge.useState(),[g,_]=ge.useState(),[N,k]=ge.useState(),p=ge.useCallback(z=>{r("fetching"),n("جاري تحميل البيانات من قاعدة البيانات..."),_(0),k(z)},[]),T=ge.useCallback((z,C)=>{_(z),C&&k(C),n(`تم تحميل ${z.toLocaleString("ar-SA")} سجل...`)},[]),M=ge.useCallback(()=>{r("generating"),n("جاري إنشاء الملف...")},[]),j=ge.useCallback(z=>{r("done"),n(z||"تم التحميل بنجاح"),setTimeout(()=>{r("idle"),n(void 0),_(void 0),k(void 0)},3e3)},[]),F=ge.useCallback(z=>{r("error"),n(z||"حدث خطأ أثناء التصدير"),setTimeout(()=>{r("idle"),n(void 0),_(void 0),k(void 0)},5e3)},[]),S=ge.useCallback(()=>{r("idle"),n(void 0),_(void 0),k(void 0)},[]);return{status:e,message:l,progress:g,total:N,startFetch:p,updateFetchProgress:T,startGenerate:M,done:j,error:F,reset:S,isActive:e!=="idle"}}function Et(e,r){const l=e-r,n=r>0?Math.round(l/r*100):e>0?100:0;return{diff:l,pct:n,direction:l>0?"up":l<0?"down":"same"}}async function Ga(e,r,l,n){var u;let g=null;if(n&&n!=="all"){const{data:m}=await U.from("forms").select("id").eq("campaign_type",n).is("deleted_at",null);g=(m==null?void 0:m.map(o=>o.id))||null}let _=U.from("form_submissions").select("id, status, governorate_id, created_at, governorates(name_ar)").is("deleted_at",null).gte("created_at",e).lte("created_at",r);g&&g.length>0&&(_=_.in("form_id",g));const[N,k,p,T]=await Promise.allSettled([_,U.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).lte("created_at",r),U.from("profiles").select("id",{count:"exact",head:!0}).is("deleted_at",null).eq("is_active",!0).lte("created_at",r),U.from("supply_shortages").select("id, severity",{count:"exact"}).is("deleted_at",null).gte("created_at",e).lte("created_at",r)]),M=N.status==="fulfilled"?N.value.data||[]:[],j=M.filter(m=>m.status==="submitted").length,F=M.filter(m=>m.status==="draft").length,S=new Map;for(const m of M){const o=((u=m.governorates)==null?void 0:u.name_ar)||"غير محدد";S.set(o,(S.get(o)||0)+1)}const z=Array.from(S.entries()).map(([m,o])=>({name:m,count:o})).sort((m,o)=>o.count-m.count),C=new Map;for(const m of M){const o=new Date(m.created_at).toISOString().split("T")[0];C.set(o,(C.get(o)||0)+1)}const D=Array.from(C.entries()).map(([m,o])=>({date:m,count:o})).sort((m,o)=>m.date.localeCompare(o.date)),x=T.status==="fulfilled"?T.value.data||[]:[],i=x.filter(m=>m.severity==="critical").length;return{label:l,dateFrom:e,dateTo:r,submissions:M.length,submitted:j,draft:F,users:k.status==="fulfilled"&&k.value.count||0,activeUsers:p.status==="fulfilled"&&p.value.count||0,shortages:x.length,criticalShortages:i,byGovernorate:z,byDay:D}}async function Mr(e,r,l,n,g){const[_,N]=await Promise.all([Ga(e,r,"الفترة الحالية",g),Ga(l,n,"الفترة السابقة",g)]),k={submissions:Et(_.submissions,N.submissions),submitted:Et(_.submitted,N.submitted),draft:Et(_.draft,N.draft),users:Et(_.users,N.users),shortages:Et(_.shortages,N.shortages)},p=_.byGovernorate.map(j=>{const F=N.byGovernorate.find(D=>D.name===j.name),S=_.submissions>0?j.count/_.submissions*100:0,z=(F==null?void 0:F.count)||0,C=N.submissions>0?z/N.submissions*100:0;return{name:j.name,currentPct:Math.round(S),previousPct:Math.round(C),change:Math.round(S-C)}}),T=p.filter(j=>j.change>0).sort((j,F)=>F.change-j.change).slice(0,5),M=p.filter(j=>j.change<0).sort((j,F)=>j.change-F.change).slice(0,5);return{current:_,previous:N,changes:k,topImproved:T,topDeclined:M}}const Oa=[{id:"this_week_vs_last",label:"هذا الأسبوع vs الماضي",icon:"📅",getCurrent:()=>{const e=new Date,r=e.getDay(),l=new Date(e);l.setDate(e.getDate()-r),l.setHours(0,0,0,0);const n=new Date(e);n.setHours(23,59,59,999);const g=new Date(l);g.setDate(g.getDate()-7);const _=new Date(l);return _.setDate(_.getDate()-1),_.setHours(23,59,59,999),{currentFrom:l.toISOString(),currentTo:n.toISOString(),previousFrom:g.toISOString(),previousTo:_.toISOString()}}},{id:"this_month_vs_last",label:"هذا الشهر vs الماضي",icon:"📆",getCurrent:()=>{const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),1),l=new Date(e.getFullYear(),e.getMonth()+1,0,23,59,59,999),n=new Date(e.getFullYear(),e.getMonth()-1,1),g=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{currentFrom:r.toISOString(),currentTo:l.toISOString(),previousFrom:n.toISOString(),previousTo:g.toISOString()}}},{id:"today_vs_yesterday",label:"اليوم vs أمس",icon:"📊",getCurrent:()=>{const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),e.getDate()),l=new Date(e.getFullYear(),e.getMonth(),e.getDate(),23,59,59,999),n=new Date(r);n.setDate(n.getDate()-1);const g=new Date(n);return g.setHours(23,59,59,999),{currentFrom:r.toISOString(),currentTo:l.toISOString(),previousFrom:n.toISOString(),previousTo:g.toISOString()}}}];function Xe(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}const wt=["#1565C0","#2E7D32","#F57F17","#E53935","#7B1FA2","#00838F","#E65100","#283593","#558B2F","#AD1457"];function zr(e,r){if(!e.length)return"";const l=(r==null?void 0:r.maxValue)||Math.max(...e.map(g=>g.value),1),n=(r==null?void 0:r.showValues)!==!1;return`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Xe(r.title)}</div>`:""}
      <div class="bar-chart">
        ${e.map((g,_)=>{const N=Math.round(g.value/l*100),k=g.color||wt[_%wt.length];return`
            <div class="bar-row">
              <div class="bar-label">${Xe(g.label)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${N}%; background: ${k}"></div>
              </div>
              ${n?`<div class="bar-value">${g.value.toLocaleString("ar-SA")}</div>`:""}
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Pr(e,r){if(!e.length)return"";const l=e.reduce((k,p)=>k+p.value,0);if(l===0)return"";const n=(r==null?void 0:r.size)||160,g=(r==null?void 0:r.showLegend)!==!1;let _=[],N=0;return e.forEach((k,p)=>{const M=k.value/l*100/100*360,j=k.color||wt[p%wt.length];_.push(`${j} ${N}deg ${N+M}deg`),N+=M}),`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Xe(r.title)}</div>`:""}
      <div class="donut-container" style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
        <div class="donut-wrapper" style="position: relative; width: ${n}px; height: ${n}px;">
          <div class="donut" style="
            width: ${n}px; height: ${n}px;
            border-radius: 50%;
            background: conic-gradient(${_.join(", ")});
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="
              width: ${n*.6}px; height: ${n*.6}px;
              border-radius: 50%; background: white;
              display: flex; align-items: center; justify-content: center;
              flex-direction: column;
            ">
              <div style="font-size: 20px; font-weight: 900; color: #212121;">${l.toLocaleString("ar-SA")}</div>
              <div style="font-size: 10px; color: #757575;">إجمالي</div>
            </div>
          </div>
        </div>
        ${g?`
          <div class="donut-legend" style="flex: 1; min-width: 140px;">
            ${e.map((k,p)=>{const T=l>0?Math.round(k.value/l*100):0;return`
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="width: 12px; height: 12px; border-radius: 3px; background: ${k.color||wt[p%wt.length]}; flex-shrink: 0;"></div>
                  <div style="flex: 1; font-size: 12px; color: #616161;">${Xe(k.label)}</div>
                  <div style="font-size: 12px; font-weight: 700; color: #212121;">${T}%</div>
                </div>
              `}).join("")}
          </div>
        `:""}
      </div>
    </div>
  `}function Ir(e,r){if(!e.length)return"";const l=Math.max(...e.map(_=>Math.max(_.current,_.previous)),1),n=(r==null?void 0:r.currentColor)||"#1565C0",g=(r==null?void 0:r.previousColor)||"#BDBDBD";return`
    <div class="pdf-chart">
      ${r!=null&&r.title?`<div class="chart-title">${Xe(r.title)}</div>`:""}
      <div style="display: flex; gap: 12px; margin-bottom: 10px; font-size: 11px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${n};"></div>
          <span>${Xe((r==null?void 0:r.currentLabel)||"الحالية")}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${g};"></div>
          <span>${Xe((r==null?void 0:r.previousLabel)||"السابقة")}</span>
        </div>
      </div>
      <div class="comparison-chart">
        ${e.map(_=>{const N=Math.round(_.current/l*100),k=Math.round(_.previous/l*100),p=_.current-_.previous,T=_.previous>0?Math.round(p/_.previous*100):0,M=p>0?"#2E7D32":p<0?"#E53935":"#757575",j=p>0?"↑":p<0?"↓":"→";return`
            <div style="margin-bottom: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 12px; font-weight: 600;">${Xe(_.label)}</span>
                <span style="font-size: 11px; color: ${M}; font-weight: 700;">
                  ${j} ${T>0?"+":""}${T}%
                </span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 3px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">حالي</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${N}%; height: 100%; background: ${n}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${_.current.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; font-size: 10px; color: #757575; text-align: right;">سابق</div>
                  <div style="flex: 1; height: 18px; background: #F5F7FA; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${k}%; height: 100%; background: ${g}; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-left: 8px;">
                      <span style="font-size: 10px; color: white; font-weight: 700;">${_.previous.toLocaleString("ar-SA")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `}).join("")}
      </div>
    </div>
  `}function Ba(e,r,l){const n=r>0?Math.min(Math.round(e/r*100),100):0,g=(l==null?void 0:l.color)||(n>=90?"#2E7D32":n>=70?"#F57F17":"#E53935"),_=(l==null?void 0:l.size)||120,N=l==null?void 0:l.target,k=(_-20)/2,p=2*Math.PI*k,T=p-n/100*p;return`
    <div class="pdf-chart" style="text-align: center;">
      ${l!=null&&l.title?`<div class="chart-title">${Xe(l.title)}</div>`:""}
      <div style="display: inline-block; position: relative; width: ${_}px; height: ${_}px;">
        <svg width="${_}" height="${_}" viewBox="0 0 ${_} ${_}">
          <!-- Background arc -->
          <circle cx="${_/2}" cy="${_/2}" r="${k}" fill="none" stroke="#E0E0E0" stroke-width="10" />
          <!-- Value arc -->
          <circle cx="${_/2}" cy="${_/2}" r="${k}" fill="none" stroke="${g}" stroke-width="10"
            stroke-dasharray="${p}" stroke-dashoffset="${T}"
            stroke-linecap="round" transform="rotate(-90 ${_/2} ${_/2})" />
        </svg>
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: ${g};">${n}%</div>
          ${l!=null&&l.label?`<div style="font-size: 10px; color: #757575;">${Xe(l.label)}</div>`:""}
        </div>
      </div>
      ${N?`
        <div style="font-size: 10px; color: #9E9E9E; margin-top: 8px;">
          الهدف: ${N}% | الحالي: ${n}%
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
  `}function Lr({direction:e,pct:r,diff:l}){const n=e==="up"?ka:e==="down"?Jt:jr,g=e==="up"?"text-emerald-600 bg-emerald-50":e==="down"?"text-red-600 bg-red-50":"text-gray-500 bg-gray-50";return s.jsxs("div",{className:_e("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",g),children:[s.jsx(n,{className:"w-3 h-3"}),s.jsxs("span",{children:[r>0?"+":"",r,"%"]}),s.jsxs("span",{className:"opacity-60",children:["(",l>0?"+":"",l,")"]})]})}function Wt({label:e,current:r,previous:l,icon:n,color:g}){const _=r-l,N=l>0?Math.round(_/l*100):r>0?100:0,k=_>0?"up":_<0?"down":"same";return s.jsx(Be,{className:"border-0 shadow-sm hover:shadow-md transition-all",children:s.jsxs(qe,{className:"p-4",children:[s.jsxs("div",{className:"flex items-start justify-between mb-3",children:[s.jsx("div",{className:_e("p-2 rounded-xl",g.replace("text-","bg-").replace("600","50")),children:s.jsx(n,{className:_e("w-4 h-4",g)})}),s.jsx(Lr,{direction:k,pct:N,diff:_})]}),s.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:r.toLocaleString("ar-SA")}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:e}),s.jsxs("p",{className:"text-[10px] text-muted-foreground/60 mt-1",children:["السابق: ",l.toLocaleString("ar-SA")]})]})})}function Gr({onExportPDF:e,onExportExcel:r}){const{toast:l}=Ha(),{campaign:n}=Zt(),{previewProps:g,openPreview:_}=ts(),[N,k]=ge.useState(!1),[p,T]=ge.useState(null),[M,j]=ge.useState("this_week_vs_last"),F=ge.useCallback(async z=>{const C=Oa.find(D=>D.id===(z||M));if(C){k(!0);try{const D=C.getCurrent(),x=await Mr(D.currentFrom,D.currentTo,D.previousFrom,D.previousTo,n!=="all"?n:void 0);T(x)}catch(D){console.error(D),l({title:"فشل تحميل المقارنة",variant:"destructive"})}finally{k(!1)}}},[M,n,l]),S=ge.useCallback(()=>{if(!p)return;const z=[{label:"الإرساليات",current:p.current.submissions,previous:p.previous.submissions},{label:"المرسلة",current:p.current.submitted,previous:p.previous.submitted},{label:"المسودات",current:p.current.draft,previous:p.previous.draft},{label:"النواقص",current:p.current.shortages,previous:p.previous.shortages}],C=p.current.byGovernorate.slice(0,10).map(u=>({label:u.name,value:u.count})),D=[{label:"مرسلة",value:p.current.submitted,color:"#2E7D32"},{label:"مسودة",value:p.current.draft,color:"#F57F17"}],i=`
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
          ${Ir(z,{title:"مقارنة الإرساليات",currentLabel:p.current.label,previousLabel:p.previous.label})}
        </div>
      </div>
      <div class="section">
        <div class="section-title"><span>🎯</span><span>نسبة الإنجاز</span></div>
        <div class="section-body" style="display: flex; gap: 24px; flex-wrap: wrap;">
          ${Ba(p.current.submitted,p.current.submissions,{title:"الحالية",target:95,size:120})}
          ${Ba(p.previous.submitted,p.previous.submissions,{title:"السابقة",target:95,size:120,color:"#BDBDBD"})}
        </div>
      </div>
      ${C.length>0?`
        <div class="section">
          <div class="section-title"><span>🗺️</span><span>الإرساليات حسب المحافظة</span></div>
          <div class="section-body">
            ${zr(C,{title:"أعلى 10 محافظات"})}
          </div>
        </div>
      `:""}
      ${D.some(u=>u.value>0)?`
        <div class="section">
          <div class="section-title"><span>📈</span><span>توزيع الحالات</span></div>
          <div class="section-body">
            ${Pr(D,{title:"الحالية"})}
          </div>
        </div>
      `:""}
      ${p.topImproved.length>0?`
        <div class="section">
          <div class="section-title"><span>🏆</span><span>الأكثر تحسّناً</span></div>
          <div class="section-body">
            ${p.topImproved.map(u=>`
              <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee; font-size: 12px;">
                <span>${u.name}</span>
                <span style="color: #2E7D32; font-weight: 700;">+${u.change}%</span>
              </div>
            `).join("")}
          </div>
        </div>
      `:""}
    `}</body></html>
    `;_("تقرير المقارنة",i,`${p.current.label} vs ${p.previous.label}`)},[p,_]);return s.jsxs("div",{className:"space-y-4",children:[s.jsx(Be,{className:"border-0 shadow-sm",children:s.jsxs(qe,{className:"p-4",children:[s.jsx("div",{className:"flex items-center justify-between mb-3",children:s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(_a,{className:"w-4 h-4 text-primary"}),s.jsx("span",{className:"text-sm font-heading font-bold",children:"مقارنة الفترات"})]})}),s.jsx("div",{className:"grid grid-cols-3 gap-2",children:Oa.map(z=>s.jsxs("button",{onClick:()=>{j(z.id),F(z.id)},className:_e("flex items-center gap-2 p-3 rounded-xl border text-right text-xs transition-all",M===z.id?"border-primary bg-primary/5 font-medium shadow-sm":"border-border hover:bg-muted/50"),children:[s.jsx("span",{className:"text-lg",children:z.icon}),s.jsx("span",{className:"flex-1",children:z.label}),M===z.id&&s.jsx("div",{className:"w-2 h-2 rounded-full bg-primary shrink-0"})]},z.id))}),s.jsxs(We,{onClick:()=>F(),disabled:N,className:"mt-3 gap-2 w-full",children:[N?s.jsx(At,{className:"w-4 h-4 animate-spin"}):s.jsx(kt,{className:"w-4 h-4"}),N?"جاري التحليل...":"تشغيل المقارنة"]})]})}),N&&s.jsx("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:Array.from({length:4}).map((z,C)=>s.jsx(dt,{className:"h-32 rounded-xl"},C))}),p&&!N&&s.jsxs(s.Fragment,{children:[s.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-3",children:[s.jsx(Wt,{label:"الإرساليات",current:p.current.submissions,previous:p.previous.submissions,icon:kt,color:"text-blue-600"}),s.jsx(Wt,{label:"المرسلة",current:p.current.submitted,previous:p.previous.submitted,icon:$a,color:"text-emerald-600"}),s.jsx(Wt,{label:"المسودات",current:p.current.draft,previous:p.previous.draft,icon:zt,color:"text-amber-600"}),s.jsx(Wt,{label:"النواقص",current:p.current.shortages,previous:p.previous.shortages,icon:zt,color:"text-red-600"})]}),(p.topImproved.length>0||p.topDeclined.length>0)&&s.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-2 gap-4",children:[p.topImproved.length>0&&s.jsxs(Be,{className:"border-0 shadow-sm border-t-4 border-t-emerald-500",children:[s.jsx(ct,{className:"pb-2",children:s.jsxs(gt,{className:"text-sm flex items-center gap-2",children:[s.jsx(rr,{className:"w-4 h-4 text-emerald-600"}),"الأكثر تحسّناً"]})}),s.jsx(qe,{className:"space-y-2",children:p.topImproved.map(z=>s.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[s.jsx("span",{className:"font-medium",children:z.name}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsxs("span",{className:"text-muted-foreground",children:[z.previousPct,"%"]}),s.jsxs("span",{className:"text-emerald-600 font-bold",children:["→ ",z.currentPct,"%"]}),s.jsxs(st,{variant:"outline",className:"text-[9px] text-emerald-600 border-emerald-300",children:["+",z.change,"%"]})]})]},z.name))})]}),p.topDeclined.length>0&&s.jsxs(Be,{className:"border-0 shadow-sm border-t-4 border-t-red-500",children:[s.jsx(ct,{className:"pb-2",children:s.jsxs(gt,{className:"text-sm flex items-center gap-2",children:[s.jsx(Jt,{className:"w-4 h-4 text-red-600"}),"الأكثر انخفاضاً"]})}),s.jsx(qe,{className:"space-y-2",children:p.topDeclined.map(z=>s.jsxs("div",{className:"flex items-center justify-between text-xs py-1.5 border-b last:border-0",children:[s.jsx("span",{className:"font-medium",children:z.name}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsxs("span",{className:"text-muted-foreground",children:[z.previousPct,"%"]}),s.jsxs("span",{className:"text-red-600 font-bold",children:["→ ",z.currentPct,"%"]}),s.jsxs(st,{variant:"outline",className:"text-[9px] text-red-600 border-red-300",children:[z.change,"%"]})]})]},z.name))})]})]}),s.jsxs("div",{className:"flex gap-2",children:[s.jsxs(We,{variant:"outline",onClick:S,className:"gap-2 flex-1",children:[s.jsx(pt,{className:"w-4 h-4"}),"تصدير PDF مع رسوم بيانية"]}),s.jsxs(We,{variant:"outline",onClick:()=>r==null?void 0:r(p),className:"gap-2 flex-1",children:[s.jsx(pt,{className:"w-4 h-4"}),"تصدير Excel"]})]})]}),s.jsx(as,{...g})]})}function Or({filter:e,onChange:r,onRefresh:l,refreshing:n}){const{data:g}=ls(),{campaign:_,visibleOptions:N,setCampaign:k}=Zt();return s.jsx(Be,{className:"border-0 shadow-sm",children:s.jsx(qe,{className:"p-3",children:s.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[s.jsxs("div",{className:"flex items-center gap-1.5 text-xs font-medium text-muted-foreground",children:[s.jsx(Va,{className:"w-3.5 h-3.5"}),"فلاتر"]}),s.jsxs("div",{className:"flex items-center gap-1",children:[s.jsx(Xa,{className:"w-3 h-3 text-muted-foreground"}),s.jsx(ut,{type:"date",value:e.dateFrom,onChange:p=>r({...e,dateFrom:p.target.value}),className:"w-[130px] h-8 text-[11px]"})]}),s.jsx("span",{className:"text-[10px] text-muted-foreground",children:"—"}),s.jsx(ut,{type:"date",value:e.dateTo,onChange:p=>r({...e,dateTo:p.target.value}),className:"w-[130px] h-8 text-[11px]"}),s.jsx(Za,{orientation:"vertical",className:"h-6"}),s.jsxs(fa,{value:e.governorateId,onValueChange:p=>r({...e,governorateId:p}),children:[s.jsxs(va,{className:"w-[140px] h-8 text-[11px]",children:[s.jsx(yt,{className:"w-3 h-3 ml-1 text-muted-foreground"}),s.jsx(ba,{placeholder:"المحافظة"})]}),s.jsxs(xa,{children:[s.jsx(Pt,{value:"all",children:"كل المحافظات"}),(g||[]).map(p=>s.jsx(Pt,{value:p.id,children:p.name_ar},p.id))]})]}),s.jsxs(fa,{value:_,onValueChange:p=>k(p),children:[s.jsx(va,{className:"w-[140px] h-8 text-[11px]",children:s.jsx(ba,{placeholder:"الحملة"})}),s.jsx(xa,{children:N.map(p=>s.jsx(Pt,{value:p.id,children:s.jsxs("span",{className:"flex items-center gap-1.5",children:[s.jsx("span",{children:p.icon})," ",p.labelAr]})},p.id))})]}),(e.dateFrom||e.dateTo||e.governorateId!=="all")&&s.jsxs(We,{variant:"ghost",size:"sm",onClick:()=>r({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),className:"h-8 gap-1 text-[11px] text-muted-foreground",children:[s.jsx(Ja,{className:"w-3 h-3"})," مسح"]}),s.jsxs(We,{variant:"outline",size:"sm",onClick:l,disabled:n,className:"h-8 gap-1.5 text-[11px] mr-auto",children:[s.jsx(ha,{className:_e("w-3 h-3",n&&"animate-spin")}),"تحديث"]})]})})})}function Br({open:e,onClose:r,data:l}){const[n,g]=ge.useState(null),[_,N]=ge.useState("desc"),[k,p]=ge.useState("");if(!l)return null;const T=j=>{n===j?N(F=>F==="asc"?"desc":"asc"):(g(j),N("desc"))};let M=l.data;if(k){const j=k.toLowerCase();M=M.filter(F=>Object.values(F).some(S=>String(S).toLowerCase().includes(j)))}return n&&(M=[...M].sort((j,F)=>{const S=j[n],z=F[n];return typeof S=="number"&&typeof z=="number"?_==="asc"?S-z:z-S:_==="asc"?String(S).localeCompare(String(z)):String(z).localeCompare(String(S))})),s.jsx(ss,{open:e,onOpenChange:j=>!j&&r(),children:s.jsxs(rs,{className:"max-w-4xl max-h-[85vh]",children:[s.jsxs(os,{children:[s.jsxs(ns,{className:"font-heading flex items-center gap-2",children:[s.jsx(Os,{className:"w-5 h-5 text-primary"}),l.title]}),l.subtitle&&s.jsx(or,{children:l.subtitle})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(ut,{placeholder:"بحث...",value:k,onChange:j=>p(j.target.value),className:"h-8 text-xs"}),s.jsxs(st,{variant:"outline",className:"text-[10px] shrink-0",children:[M.length," سجل"]})]}),s.jsx("div",{className:"overflow-auto max-h-[60vh]",children:s.jsxs(nr,{children:[s.jsx(lr,{children:s.jsx(Ca,{className:"bg-muted/30",children:l.columns.map(j=>s.jsx(ir,{className:_e("text-xs cursor-pointer hover:bg-muted/50 select-none",n===j.key&&"bg-primary/10"),onClick:()=>j.sortable!==!1&&T(j.key),children:s.jsxs("div",{className:"flex items-center gap-1",children:[j.label,n===j.key&&s.jsx("span",{className:"text-[9px]",children:_==="asc"?"↑":"↓"})]})},j.key))})}),s.jsx(dr,{children:M.map((j,F)=>s.jsx(Ca,{className:"hover:bg-muted/20",children:l.columns.map(S=>s.jsx(cr,{className:"text-xs",children:qr(j[S.key])},S.key))},F))})]})})]})})}function qr(e){return e==null?"—":typeof e=="boolean"?e?"نعم":"لا":typeof e=="number"?e.toLocaleString("ar-SA"):String(e)}function Ur({open:e,onClose:r,title:l,children:n}){return s.jsx(ss,{open:e,onOpenChange:g=>!g&&r(),children:s.jsxs(rs,{className:"max-w-6xl max-h-[90vh]",children:[s.jsx(os,{children:s.jsxs(ns,{className:"font-heading flex items-center gap-2",children:[s.jsx(kt,{className:"w-5 h-5 text-primary"}),l]})}),s.jsx("div",{className:"h-[70vh]",children:n})]})})}function qa(e,r){if(e==null)return"";if(r==="percent"){const l=typeof e=="number"?e:parseFloat(String(e));return isNaN(l)?String(e):l}if(r==="number"){const l=typeof e=="number"?e:parseFloat(String(e));return isNaN(l)?String(e):l}return String(e)}function Yr(e){if(e==="number")return"#,##0";if(e==="percent")return"0.0%"}function Wr(e){const r=e.replace("#",""),l=/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r);return l?{r:parseInt(l[1],16),g:parseInt(l[2],16),b:parseInt(l[3],16)}:{r:0,g:0,b:0}}function Ct(e,r){const{r:l,g:n,b:g}=Wr(e),_=Math.min(255,l+r),N=Math.min(255,n+r),k=Math.min(255,g+r);return[_,N,k].map(p=>p.toString(16).padStart(2,"0")).join("")}function mt(e){const{sheets:r,fileName:l,themeId:n}=e,g=n?Bs(n):Qa(),_=vt.book_new();for(const N of r){const{title:k,subtitle:p,columns:T,data:M,showTotal:j,totalColumns:F,rowColor:S}=N,z=T.map(y=>y.header),C=M.map(y=>T.map(v=>qa(y[v.key],v.numFmt)));let D=null;j&&F&&F.length>0&&(D=T.map(y=>{if(y.key===T[0].key)return"الإجمالي";if(F.includes(y.key)){const v=M.reduce((a,h)=>{const R=h[y.key];return a+(typeof R=="number"?R:0)},0);return qa(v,y.numFmt)}return""}));const x=[];let i=0;k&&(x.push([k]),i++),p&&(x.push([p]),i++),(k||p)&&(x.push([]),i++),x.push(z),x.push(...C),D&&x.push(D);const u=vt.aoa_to_sheet(x);u["!cols"]=T.map(y=>({wch:y.width||Math.min(Math.max(y.header.length*1.5,10),30)}));const m=[];if(k&&m.push({s:{r:0,c:0},e:{r:0,c:T.length-1}}),p&&m.push({s:{r:1,c:0},e:{r:1,c:T.length-1}}),u["!merges"]=m,M.length>0){const y=i;u["!autofilter"]={ref:vt.encode_range({s:{r:y,c:0},e:{r:y+M.length,c:T.length-1}})}}if(u["!freeze"]={xSplit:0,ySplit:i+1},k){const y=u.A1;y&&(y.s={font:{bold:!0,sz:16,color:{rgb:g.primaryDark}},alignment:{horizontal:"center",vertical:"center"},fill:{fgColor:{rgb:Ct(g.primary,180)}}})}if(p){const y=u.A2;y&&(y.s={font:{sz:11,color:{rgb:g.borderColor}},alignment:{horizontal:"center"}})}const o=i;for(let y=0;y<T.length;y++){const v=vt.encode_cell({r:o,c:y}),a=u[v];a&&(a.s={font:{bold:!0,sz:11,color:{rgb:g.headerText}},fill:{fgColor:{rgb:g.headerBg}},alignment:{horizontal:T[y].align||"right",vertical:"center",wrapText:!0},border:{top:{style:"thin",color:{rgb:Ct(g.primary,40)}},bottom:{style:"thin",color:{rgb:Ct(g.primary,40)}}}})}for(let y=o+1;y<x.length;y++){const v=y-o-1,a=v%2===0,h=D&&y===x.length-1,R=M[v];let d=a?g.rowEven:g.rowOdd;if(h)d=Ct(g.primary,180);else if(R&&S){const f=S(R);f&&(d=Ct(f,200))}for(let f=0;f<T.length;f++){const w=vt.encode_cell({r:y,c:f}),q=u[w];if(!q)continue;const c=Yr(T[f].numFmt),$={alignment:{horizontal:T[f].align||"right",vertical:"center"},fill:{fgColor:{rgb:d}},border:{bottom:{style:"thin",color:{rgb:g.borderColor}}}};h&&($.font={bold:!0,sz:11},$.border={top:{style:"medium",color:{rgb:g.primary}},bottom:{style:"medium",color:{rgb:g.primary}}}),c&&($.numFmt=c),typeof q.v=="number"&&!h&&($.font={bold:!0});const E=String(q.v||"").toLowerCase();(T[f].key==="severity"||T[f].key==="status")&&(["حرج","critical","غير نشط","مرفوض"].includes(E)?$.font={bold:!0,color:{rgb:"C62828"}}:["نشط","مرسلة","محلول","نجح"].includes(E)?$.font={bold:!0,color:{rgb:"2E7D32"}}:["عالي","high","مسودة"].includes(E)&&($.font={bold:!0,color:{rgb:"F57F17"}})),q.s=$}}vt.book_append_sheet(_,u,N.name.slice(0,31))}br(_,`${l}.xlsx`)}function Kr(e,r){const l=new Date().toLocaleDateString("ar-SA");mt({fileName:`dashboard_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"ملخص لوحة التحكم",title:"📊 ملخص المؤشرات — EPI Supervisor",subtitle:`📅 ${l}`,columns:[{header:"المؤشر",key:"label",width:30,align:"right"},{header:"القيمة",key:"value",width:15,align:"center"}],data:[{label:"👥 إجمالي المستخدمين",value:e.total_users},{label:"✅ المستخدمين النشطين",value:e.active_users},{label:"📋 إجمالي الإرساليات",value:e.total_submissions},{label:"📤 الإرساليات المرسلة",value:e.submitted_submissions},{label:"📝 المسودات",value:e.draft_submissions},{label:"📅 إرساليات اليوم",value:e.submissions_today},{label:"📈 إرساليات الأسبوع",value:e.submissions_this_week},{label:"📄 إجمالي النماذج",value:e.total_forms},{label:"✅ النماذج النشطة",value:e.active_forms},{label:"🎯 معدل الإنجاز",value:`${e.approval_rate.toFixed(1)}%`},{label:"📊 الاتجاه الأسبوعي",value:`${e.submissions_trend>0?"+":""}${e.submissions_trend.toFixed(1)}%`}]}]})}function Hr(e,r){const l=Math.max(...e.map(n=>n.submissions),1);mt({fileName:`governorates_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"أداء المحافظات",title:"🗺️ تقرير أداء المحافظات — EPI Supervisor",subtitle:`${e.length} محافظة — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"rank",width:6,align:"center"},{header:"المحافظة",key:"name",width:22,align:"right"},{header:"الإرساليات",key:"submissions",width:14,align:"center",numFmt:"number"},{header:"نسبة التغطية",key:"rate",width:14,align:"center"},{header:"مستوى الأداء",key:"level",width:14,align:"center"}],data:e.map((n,g)=>{const _=l>0?Math.round(n.submissions/l*100):0;return{rank:g+1,name:n.name,submissions:n.submissions,rate:`${_}%`,level:_>=80?"🟢 ممتاز":_>=50?"🟡 جيد":_>=20?"🟠 متوسط":"🔴 ضعيف"}}),showTotal:!0,totalColumns:["submissions"],rowColor:n=>{const g=l>0?n.submissions/l:0;return g>=.8?"2E7D32":g>=.5?"0277BD":g>=.2?"F57F17":"E53935"}}]})}function Vr(e,r){mt({fileName:`timeline_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"الإرساليات — خط زمني",title:"📈 تطور الإرساليات — آخر 30 يوم",subtitle:`📅 ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"التاريخ",key:"date",width:14,align:"center"},{header:"مرسلة",key:"submitted",width:12,align:"center",numFmt:"number"},{header:"مسودة",key:"draft",width:12,align:"center",numFmt:"number"},{header:"الإجمالي",key:"total",width:12,align:"center",numFmt:"number"},{header:"معدل الإرسال",key:"rate",width:14,align:"center"}],data:e.map(l=>({date:l.date,submitted:l.submitted,draft:l.draft,total:l.submitted+l.draft,rate:l.submitted+l.draft>0?`${Math.round(l.submitted/(l.submitted+l.draft)*100)}%`:"—"})),showTotal:!0,totalColumns:["submitted","draft","total"]}]})}function Xr(e,r){mt({fileName:`submissions_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"إرساليات النماذج",title:"📋 تقرير الإرساليات الشامل — EPI Supervisor",subtitle:`${e.length} إرسالية — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"النموذج",key:"form",width:22},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المُرسل",key:"submitted_by",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"النشاط",key:"campaign",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:l=>l.status==="مرسلة"?"2E7D32":l.status==="مسودة"?"F57F17":null}]})}function Zr(e,r){mt({fileName:`shortages_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"نواقص الإمدادات",title:"📦 تقرير النواقص — EPI Supervisor",subtitle:`${e.length} نقص — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الصنف",key:"item",width:22},{header:"الفئة",key:"category",width:15},{header:"المطلوب",key:"needed",width:10,align:"center",numFmt:"number"},{header:"المتاح",key:"available",width:10,align:"center",numFmt:"number"},{header:"الخطورة",key:"severity",width:12,align:"center"},{header:"محلول",key:"resolved",width:10,align:"center"},{header:"المُبلّغ",key:"by",width:18},{header:"المحافظة",key:"gov",width:15},{header:"التاريخ",key:"date",width:14,align:"center"}],data:e,rowColor:l=>{const n=String(l.severity).toLowerCase();return n==="حرج"||n==="critical"?"C62828":n==="عالي"||n==="high"?"F57F17":null}}]})}function Jr(e,r){const l={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"};mt({fileName:`users_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"المستخدمين",title:"👥 تقرير المستخدمين — EPI Supervisor",subtitle:`${e.length} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"#",key:"index",width:6,align:"center"},{header:"الاسم",key:"full_name",width:22},{header:"البريد",key:"email",width:25},{header:"الدور",key:"role",width:14,align:"center"},{header:"الحالة",key:"status",width:12,align:"center"},{header:"المحافظة",key:"governorate",width:15},{header:"تاريخ الإنشاء",key:"created_at",width:14,align:"center"}],data:e.map((n,g)=>({index:g+1,full_name:n.full_name,email:n.email,role:l[n.role]||n.role,status:n.is_active?"نشط":"غير نشط",governorate:n.governorate||"—",created_at:new Date(n.created_at).toLocaleDateString("ar-SA")})),rowColor:n=>n.status==="نشط"?"2E7D32":"E53935"}]})}function Qr(e,r){const l=e.reduce((n,g)=>n+g.value,0);mt({fileName:`roles_${new Date().toISOString().split("T")[0]}`,themeId:r,sheets:[{name:"توزيع الأدوار",title:"👥 توزيع المستخدمين حسب الدور",subtitle:`${l} مستخدم — ${new Date().toLocaleDateString("ar-SA")}`,columns:[{header:"الدور",key:"name",width:22,align:"right"},{header:"العدد",key:"value",width:12,align:"center",numFmt:"number"},{header:"النسبة",key:"percent",width:14,align:"center"}],data:e.map(n=>({name:n.name,value:n.value,percent:l>0?`${(n.value/l*100).toFixed(1)}%`:"0%"})),showTotal:!0,totalColumns:["value"]}]})}async function Ft(e){const{table:r,select:l,maxRows:n=5e4,pageSize:g=1e3,orderBy:_="created_at",orderDirection:N="desc",onProgress:k}=e,p=Date.now(),T=[];let M=0,j=null,F=!1;try{const{count:S}=await U.from(r).select("id",{count:"exact",head:!0});j=S}catch{}for(;;){let S=U.from(r).select(l).order(_,{ascending:N==="asc"}).range(M,M+g-1);e.applyFilters&&(S=e.applyFilters(S));const{data:z,error:C}=await S;if(C){console.error(`[BulkFetch] Error fetching ${r}:`,C);break}if(!z||z.length===0)break;if(T.push(...z),k==null||k(T.length,j),T.length>=n){F=!0;break}if(z.length<g)break;M+=g,await new Promise(D=>setTimeout(D,50))}return{data:T,totalCount:j||T.length,fetchedCount:T.length,truncated:F,elapsed:Date.now()-p}}async function eo(e){return Ft({table:"form_submissions",select:`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, email),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:5e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),e!=null&&e.formId&&(r=r.eq("form_id",e.formId)),e!=null&&e.status&&e.status!=="all"&&(r=r.eq("status",e.status)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(r=r.eq("governorate_id",e.governorateId)),e!=null&&e.dateFrom&&(r=r.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(r=r.lte("created_at",e.dateTo+"T23:59:59")),r)})}async function to(e){return Ft({table:"profiles",select:`
      id, full_name, email, role, is_active, phone,
      governorates(name_ar),
      districts(name_ar),
      created_at, updated_at
    `,maxRows:1e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),r)})}async function ao(e){return Ft({table:"supply_shortages",select:`
      id, item_name, item_category, quantity_needed, quantity_available,
      unit, severity, notes, is_resolved, created_at,
      profiles!reported_by(full_name),
      governorates(name_ar),
      districts(name_ar)
    `,maxRows:1e4,pageSize:1e3,applyFilters:r=>(r=r.is("deleted_at",null),r)})}function Le(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}const so={1:"الجولة الأولى",2:"الجولة الثانية",3:"الجولة الثالثة",4:"الجولة الرابعة",5:"الجولة الخامسة",6:"الجولة السادسة",7:"الجولة السابعة",8:"الجولة الثامنة",9:"الجولة التاسعة",10:"الجولة العاشرة"};function ro(e){return!e||e<=0?null:so[e]||`الجولة ${e}`}function Te(e){const r=ro(e);return r?` — ${r}`:""}function rt(e,r){return r&&r>0?e.eq("campaign_round",r):e}function oo(e){return e.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",hour12:!0})}function L(e){const r=document.createElement("div");return r.textContent=e,r.innerHTML}function Ee(e,r,l){return`
    <div class="report-header">
      <div class="header-top">
        <div class="header-brand">
          <div class="brand-icon"><img src="${ea}" alt="شعار التحصين" style="width:40px;height:40px;object-fit:contain;border-radius:8px" /></div>
          <div>
            <div class="brand-title">برنامج التحصين الصحي الموسع</div>
            <div class="brand-sub">وزارة الصحة العامة والسكان</div>
          </div>
        </div>
        <div class="header-meta">
          <div class="meta-item">📅 ${Le(new Date)}</div>
          <div class="meta-item">🕐 ${oo(new Date)}</div>
          ${l?`<div class="meta-item">📊 ${L(l)}</div>`:""}
        </div>
      </div>
      <div class="header-title-section">
        <h1>${L(e)}</h1>
        <p>${L(r)}</p>
      </div>
    </div>
  `}function Ce(){return`
    <div class="report-footer">
      <div class="footer-line"></div>
      <div class="footer-content">
        <span>منصة مشرف EPI — تقرير تلقائي</span>
        <span>سري — للاستخدام الداخلي فقط</span>
        <span class="page-number"></span>
      </div>
    </div>
  `}function A(e,r,l,n,g){return`
    <div class="kpi-card" style="border-top: 4px solid ${n}">
      <div class="kpi-icon">${l}</div>
      <div class="kpi-value" style="color: ${n}">${r}</div>
      <div class="kpi-label">${L(e)}</div>
      ${g?`<div class="kpi-sub">${L(g)}</div>`:""}
    </div>
  `}function V(e,r,l){return`
    <div class="section-title">
      <span class="section-icon">${e}</span>
      <span>${L(r)}</span>
      ${l?`<span class="section-badge">${L(l)}</span>`:""}
    </div>
  `}function ue(e,r){return`
    <table class="data-table">
      <thead>
        <tr>${e.map(l=>`<th>${L(l)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${r.map(l=>`<tr>${l.map(n=>`<td>${n}</td>`).join("")}</tr>`).join("")}
      </tbody>
    </table>
  `}function Ze(e,r,l,n){const g=l>0?Math.round(r/l*100):0;return`
    <div class="progress-item">
      <div class="progress-header">
        <span>${L(e)}</span>
        <span class="progress-value">${g}% (${r}/${l})</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(g,100)}%; background: ${n}"></div>
      </div>
    </div>
  `}function Ne(){return`
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
  `}let Fa=!1,Xt="",wa=0;function no(){return Fa=!0,Xt="",wa++,wa}function Ua(e){if(e!==void 0&&e!==wa)return"";Fa=!1;const r=Xt;return Xt="",r}function Me(e,r,l){var _;if(Fa)return Xt=e,e;const n=document.createElement("iframe");n.style.position="fixed",n.style.top="-9999px",n.style.left="-9999px",n.style.width="210mm",n.style.height="297mm",document.body.appendChild(n);const g=n.contentDocument||((_=n.contentWindow)==null?void 0:_.document);if(!g){document.body.removeChild(n);const N=new Blob([e],{type:"text/html"}),k=URL.createObjectURL(N),p=document.createElement("a");p.href=k,p.download=`${r||"تقرير"}.html`,p.click(),URL.revokeObjectURL(k);return}g.open(),g.write(e),g.close(),setTimeout(()=>{var N;(N=n.contentWindow)==null||N.print(),setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},1e4)},600)}async function lo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,g=l&&n?`من ${l} إلى ${n}`:"آخر 30 يوم";async function _(){const a=[];let h=0;const R=1e3;for(;;){let d=U.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(h,h+R-1);l&&(d=d.gte("created_at",l)),n&&(d=d.lte("created_at",n+"T23:59:59")),r&&(d=d.eq("campaign_round",r));const{data:f,error:w}=await d;if(w||!f||f.length===0||(a.push(...f),f.length<R)||(h+=R,a.length>=1e5))break}return a}const[N,k,p,T,M]=await Promise.allSettled([U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),_(),U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).gte("created_at",l||"").lte("created_at",(n||"")+"T23:59:59")]),j=N.status==="fulfilled"?N.value.data||[]:[],F=k.status==="fulfilled"?k.value||[]:[],S=p.status==="fulfilled"?p.value.data||[]:[],z=T.status==="fulfilled"?T.value.data||[]:[],C=M.status==="fulfilled"?M.value.data||[]:[],D=F.length,x=F.filter(a=>a.status==="submitted").length,i=F.filter(a=>a.status==="draft").length,u=S.filter(a=>a.is_active).length,m=C.filter(a=>!a.is_resolved).length,o=C.filter(a=>!a.is_resolved&&a.severity==="critical").length,y=j.map(a=>{const h=F.filter(f=>f.governorate_id===a.id),R=S.filter(f=>f.governorate_id===a.id&&f.is_active),d=C.filter(f=>f.governorate_id===a.id&&!f.is_resolved);return{name:a.name_ar,submissions:h.length,submitted:h.filter(f=>f.status==="submitted").length,draft:h.filter(f=>f.status==="draft").length,users:R.length,shortages:d.length,gps:h.filter(f=>f.gps_lat).length,photos:h.filter(f=>f.photos&&f.photos.length>0).length}}).sort((a,h)=>h.submissions-a.submissions),v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير المركزي الشامل — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("التقرير المركزي الشامل","نظرة عامة على أداء جميع المحافظات والإرساليات والمستخدمين"+Te(r),g)}

      <!-- ═══ Executive Summary KPIs ═══ -->
      ${V("📊","ملخص المؤشرات الرئيسية","KPIs")}
      <div class="kpi-grid">
        ${A("إجمالي الإرساليات",D,"📋",t.primary,`${x} مرسلة / ${i} مسودة`)}
        ${A("معدل الإرسال",`${D>0?Math.round(x/D*100):0}%`,"✅",t.success)}
        ${A("المحافظات النشطة",j.length,"🏛️",t.info,`${y.filter(a=>a.submissions>0).length} لها بيانات`)}
        ${A("المستخدمين النشطين",u,"👥","#7B1FA2")}
        ${A("النماذج النشطة",z.length,"📝",t.warning)}
        ${A("النواقص المعلقة",m,"⚠️",t.accent,`${o} حرجة`)}
        ${A("تغطية GPS",`${D>0?Math.round(F.filter(a=>a.gps_lat).length/D*100):0}%`,"📍",t.info)}
        ${A("تغطية الصور",`${D>0?Math.round(F.filter(a=>{var h;return((h=a.photos)==null?void 0:h.length)>0}).length/D*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Governorates Performance ═══ -->
      ${V("🏛️","أداء المحافظات",`${j.length} محافظة`)}
      ${ue(["#","المحافظة","الإرساليات","مرسلة","مسودة","المستخدمين","النواقص","GPS","معدل الإرسال"],y.map((a,h)=>[`${h+1}`,`<strong>${L(a.name)}</strong>`,`<span class="num">${a.submissions}</span>`,`<span class="num">${a.submitted}</span>`,`<span class="num">${a.draft}</span>`,`<span class="num">${a.users}</span>`,`<span class="num">${a.shortages>0?`<span style="color:${t.accent}">${a.shortages}</span>`:"0"}</span>`,`<span class="num">${a.submissions>0?Math.round(a.gps/a.submissions*100):0}%</span>`,`<span class="num">${a.submissions>0?Math.round(a.submitted/a.submissions*100):0}%</span>`]))}

      <!-- ═══ Coverage Analysis ═══ -->
      ${V("📈","تحليل التغطية")}
      ${y.map(a=>Ze(a.name,a.submissions,Math.max(...y.map(h=>h.submissions)),a.submissions>0?t.primary:"#BDBDBD")).join("")}

      <!-- ═══ Forms Summary ═══ -->
      <div class="page-break"></div>
      ${V("📝","ملخص النماذج")}
      ${ue(["#","النموذج","الحملة","الإرساليات","معدل الإنجاز"],z.map((a,h)=>{const R=F.filter(f=>f.form_id===a.id),d=R.filter(f=>f.status==="submitted").length;return[`${h+1}`,L(a.title_ar),a.campaign_type==="polio_campaign"?"💉 شلل أطفال":"🏥 إيصالي تكاملي",`<span class="num">${R.length}</span>`,`<span class="num">${R.length>0?Math.round(d/R.length*100):0}%</span>`]}))}

      <!-- ═══ Shortages Alert ═══ -->
      ${m>0?`
        ${V("⚠️","تنبيهات النواقص",`${m} معلقة`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${m}</strong> نقص معلق منها <strong>${o}</strong> حرجة تحتاج تدخل فوري.
        </div>
        ${ue(["النقص","المحافظة","الخطورة","الكمية المطلوبة"],C.filter(a=>!a.is_resolved).slice(0,15).map(a=>{var h;return[L(a.item_name),L(((h=a.governorates)==null?void 0:h.name_ar)||"—"),`<span class="status-badge ${a.severity==="critical"?"status-not-ready":a.severity==="high"?"status-partial":"status-ready"}">${a.severity==="critical"?"حرج":a.severity==="high"?"عالي":a.severity==="medium"?"متوسط":"منخفض"}</span>`,`<span class="num">${a.quantity_needed||"—"}</span>`]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة — أداء ممتاز!</div>
      `}

      <!-- ═══ Users Summary ═══ -->
      ${V("👥","توزيع المستخدمين")}
      <div class="three-col">
        ${["admin","central","governorate","district","data_entry"].map(a=>{const h=S.filter(f=>f.role===a&&f.is_active).length,R={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},d={admin:"🔴",central:"🟣",governorate:"🔵",district:"🟢",data_entry:"⚪"};return A(R[a]||a,h,d[a]||"👤",t.primary)}).join("")}
      </div>

      ${Ce()}
    </body>
    </html>
  `;Me(v,"التقرير_Mركزي_الشامل")}async function io(e,r){const l=r!=null&&r.campaignRound&&r.campaignRound>0?r.campaignRound:null,n=r==null?void 0:r.dateFrom,g=r==null?void 0:r.dateTo,_=v=>(n&&(v=v.gte("created_at",n)),g&&(v=v.lte("created_at",g+"T23:59:59")),v),N=_(rt(U.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles:submitted_by(full_name, role), districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),l)).order("created_at",{ascending:!1}),k=_(U.from("supply_shortages").select("*").eq("governorate_id",e).is("deleted_at",null)),[p,T,M,j,F]=await Promise.allSettled([U.from("governorates").select("*").eq("id",e).single(),N,U.from("profiles").select("*, districts(name_ar)").eq("governorate_id",e).is("deleted_at",null),U.from("districts").select("*").eq("governorate_id",e).eq("is_active",!0).is("deleted_at",null).order("name_ar"),k]),S=p.status==="fulfilled"?p.value.data:null,z=T.status==="fulfilled"?T.value.data||[]:[],C=M.status==="fulfilled"?M.value.data||[]:[],D=j.status==="fulfilled"?j.value.data||[]:[],x=F.status==="fulfilled"?F.value.data||[]:[];if(!S){console.warn("[Report] المحافظة غير موجودة");return}const i=z.length,u=z.filter(v=>v.status==="submitted").length,m=C.filter(v=>v.is_active).length,o=D.map(v=>{const a=z.filter(R=>R.district_id===v.id),h=C.filter(R=>R.district_id===v.id&&R.is_active);return{name:v.name_ar,submissions:a.length,submitted:a.filter(R=>R.status==="submitted").length,users:h.length,gps:a.filter(R=>R.gps_lat).length}}).sort((v,a)=>a.submissions-v.submissions),y=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير محافظة ${L(S.name_ar)} — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee(`تقرير محافظة ${S.name_ar}`,`تحليل شامل لأداء المحافظة — ${D.length} مديرية${Te(l)}`,r!=null&&r.dateFrom?`من ${r.dateFrom} إلى ${r.dateTo}`:void 0)}

      ${V("📊","مؤشرات المحافظة")}
      <div class="kpi-grid">
        ${A("الإرساليات",i,"📋",t.primary,`${u} مرسلة`)}
        ${A("معدل الإرسال",`${i>0?Math.round(u/i*100):0}%`,"✅",t.success)}
        ${A("المديريات",D.length,"🏘️",t.info,`${o.filter(v=>v.submissions>0).length} نشطة`)}
        ${A("المستخدمين",m,"👥","#7B1FA2")}
        ${A("النواقص",x.filter(v=>!v.is_resolved).length,"⚠️",t.accent)}
        ${A("تغطية GPS",`${i>0?Math.round(z.filter(v=>v.gps_lat).length/i*100):0}%`,"📍",t.info)}
      </div>

      ${V("🏘️","أداء المديريات",`${D.length} مديرية`)}
      ${ue(["#","المديرية","الإرساليات","مرسلة","المستخدمين","GPS","معدل الإنجاز"],o.map((v,a)=>[`${a+1}`,`<strong>${L(v.name)}</strong>`,`<span class="num">${v.submissions}</span>`,`<span class="num">${v.submitted}</span>`,`<span class="num">${v.users}</span>`,`<span class="num">${v.submissions>0?Math.round(v.gps/v.submissions*100):0}%</span>`,`<span class="num">${v.submissions>0?Math.round(v.submitted/v.submissions*100):0}%</span>`]))}

      ${V("📈","مخطط أداء المديريات")}
      ${o.map(v=>Ze(v.name,v.submissions,Math.max(...o.map(a=>a.submissions),1),t.primary)).join("")}

      ${V("👥","المستخدمون في المحافظة")}
      ${ue(["#","الاسم","الدور","المديرية","آخر دخول"],C.filter(v=>v.is_active).map((v,a)=>{var h;return[`${a+1}`,L(v.full_name),v.role==="governorate"?"🔵 محافظة":v.role==="district"?"🟢 مديرية":"⚪ إدخال بيانات",L(((h=v.districts)==null?void 0:h.name_ar)||"—"),v.last_login?new Date(v.last_login).toLocaleDateString("ar-SA"):"—"]}))}

      ${x.filter(v=>!v.is_resolved).length>0?`
        ${V("⚠️","النواقص المعلقة")}
        ${ue(["النقص","الخطورة","الكمية","ملاحظات"],x.filter(v=>!v.is_resolved).map(v=>[L(v.item_name),`<span class="status-badge ${v.severity==="critical"?"status-not-ready":"status-partial"}">${v.severity==="critical"?"حرج":"عالي"}</span>`,`<span class="num">${v.quantity_needed||"—"}</span>`,L(v.notes||"—")]))}
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(y,`تقرير_محافظة_${S.name_ar}`)}async function co(e,r){const l=r!=null&&r.campaignRound&&r.campaignRound>0?r.campaignRound:null,n=r==null?void 0:r.dateFrom,g=r==null?void 0:r.dateTo,N=(a=>(n&&(a=a.gte("created_at",n)),g&&(a=a.lte("created_at",g+"T23:59:59")),a))(rt(U.from("form_submissions").select("*, profiles:submitted_by(full_name, role), governorates(name_ar), districts(name_ar)").eq("form_id",e).is("deleted_at",null),l)).order("created_at",{ascending:!1}),[k,p,T]=await Promise.allSettled([U.from("forms").select("*").eq("id",e).single(),N,U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),M=k.status==="fulfilled"?k.value.data:null,j=p.status==="fulfilled"?p.value.data||[]:[],F=T.status==="fulfilled"?T.value.data||[]:[];if(!M){console.warn("[Report] النموذج غير موجود");return}const S=j.length,z=j.filter(a=>a.status==="submitted").length,C=j.filter(a=>a.status==="draft").length;let D={};try{D=typeof M.schema=="string"?JSON.parse(M.schema):M.schema}catch(a){console.warn("[form-analysis] Failed to parse form schema:",a)}const x=(D==null?void 0:D.sections)||[],i=x.flatMap(a=>a.fields||[]),u=F.map(a=>{const h=j.filter(R=>R.governorate_id===a.id);return{name:a.name_ar,total:h.length,submitted:h.filter(R=>R.status==="submitted").length,draft:h.filter(R=>R.status==="draft").length}}).filter(a=>a.total>0).sort((a,h)=>h.total-a.total),m=i.map(a=>{const h=a.name||a.id||a.label_ar;let R=0,d=0;return j.forEach(f=>{var q;const w=(q=f.data)==null?void 0:q[h];w!=null&&w!==""&&w!==0?R++:d++}),{label:a.label_ar||h,type:a.type,filled:R,empty:d,rate:S>0?Math.round(R/S*100):0}});j.forEach(a=>{a.created_at.split("T")[0]});const o=Array.from({length:24},(a,h)=>({hour:`${h.toString().padStart(2,"0")}:00`,count:j.filter(R=>new Date(R.created_at).getHours()===h).length})),y=M.campaign_type==="polio_campaign"?"💉 حملة شلل الأطفال":"🏥 النشاط الإيصالي التكاملي",v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل ${L(M.title_ar)} — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("تقرير تحليل النموذج",M.title_ar+Te(l),y)}

      ${V("📊","ملخص النموذج")}
      <div class="kpi-grid">
        ${A("إجمالي الإرساليات",S,"📋",t.primary)}
        ${A("مرسلة",z,"✅",t.success,`${S>0?Math.round(z/S*100):0}%`)}
        ${A("مسودة",C,"📝",t.warning,`${S>0?Math.round(C/S*100):0}%`)}
        ${A("المحافظات المشمولة",u.length,"🏛️",t.info)}
        ${A("الحقول",i.length,"🔤","#7B1FA2")}
        ${A("الأقسام",x.length,"📂","#00897B")}
        ${A("تغطية GPS",`${S>0?Math.round(j.filter(a=>a.gps_lat).length/S*100):0}%`,"📍",t.info)}
        ${A("تغطية الصور",`${S>0?Math.round(j.filter(a=>{var h;return((h=a.photos)==null?void 0:h.length)>0}).length/S*100):0}%`,"📷","#00897B")}
      </div>

      <!-- ═══ Description ═══ -->
      ${M.description_ar?`
        <div class="alert-box alert-info">
          <strong>وصف النموذج:</strong> ${L(M.description_ar)}
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
      ${V("🏛️","الإرساليات حسب المحافظة",`${u.length} محافظة`)}
      ${ue(["#","المحافظة","الإجمالي","مرسلة","مسودة","معدل الإرسال"],u.map((a,h)=>[`${h+1}`,`<strong>${L(a.name)}</strong>`,`<span class="num">${a.total}</span>`,`<span class="num">${a.submitted}</span>`,`<span class="num">${a.draft}</span>`,`<span class="num">${a.total>0?Math.round(a.submitted/a.total*100):0}%</span>`]))}

      ${u.map(a=>Ze(a.name,a.total,Math.max(...u.map(h=>h.total),1),t.primary)).join("")}

      <!-- ═══ Field Analysis ═══ -->
      ${m.length>0?`
        ${V("🔤","تحليل الحقول",`${m.length} حقل`)}
        ${ue(["#","الحقل","النوع","مُملأ","فارغ","نسبة التعبئة"],m.map((a,h)=>[`${h+1}`,`<strong>${L(a.label)}</strong>`,a.type||"—",`<span class="num">${a.filled}</span>`,`<span class="num" style="color:${a.empty>0?t.accent:t.success}">${a.empty}</span>`,`<span class="num" style="color:${a.rate>=80?t.success:a.rate>=50?t.warning:t.accent}">${a.rate}%</span>`]))}
        ${m.map(a=>Ze(a.label,a.filled,S,a.rate>=80?t.success:a.rate>=50?t.warning:t.accent)).join("")}
      `:""}

      <!-- ═══ Sections Analysis ═══ -->
      ${x.length>0?`
        ${V("📂","تحليل الأقسام")}
        ${ue(["#","القسم","عدد الحقول"],x.map((a,h)=>[`${h+1}`,L(a.title_ar||`قسم ${h+1}`),`<span class="num">${(a.fields||[]).length}</span>`]))}
      `:""}

      <!-- ═══ Time Analysis ═══ -->
      ${V("⏰","تحليل التوقيت")}
      <div class="alert-box alert-info">
        <strong>أول إرسالية:</strong> ${j.length>0?new Date(j[j.length-1].created_at).toLocaleDateString("ar-SA"):"—"} |
        <strong>آخر إرسالية:</strong> ${j.length>0?new Date(j[0].created_at).toLocaleDateString("ar-SA"):"—"}
      </div>

      ${ue(["الساعة","عدد الإرساليات"],o.filter(a=>a.count>0).map(a=>[a.hour,`<span class="num">${a.count}</span>`]))}

      <!-- ═══ Recent Submissions ═══ -->
      ${V("📋","آخر الإرساليات","آخر 10")}
      ${ue(["#","المحافظة","المديرية","المُرسل","الحالة","التاريخ"],j.slice(0,10).map((a,h)=>{var R,d,f;return[`${h+1}`,L(((R=a.governorates)==null?void 0:R.name_ar)||"—"),L(((d=a.districts)==null?void 0:d.name_ar)||"—"),L(((f=a.profiles)==null?void 0:f.full_name)||"—"),`<span class="status-badge ${a.status==="submitted"?"status-ready":"status-partial"}">${a.status==="submitted"?"مرسلة":"مسودة"}</span>`,new Date(a.created_at).toLocaleDateString("ar-SA")]}))}

      ${Ce()}
    </body>
    </html>
  `;Me(v,`تحليل_${M.title_ar}`)}async function go(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,g=e==null?void 0:e.governorateId,[_,N]=await Promise.allSettled([U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),k=await Ft({table:"form_submissions",select:"*, forms(title_ar), governorates(name_ar), districts(name_ar)",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"desc",applyFilters:o=>(o=o.is("deleted_at",null),l&&(o=o.gte("created_at",l)),n&&(o=o.lte("created_at",n+"T23:59:59")),g&&g!=="all"&&(o=o.eq("governorate_id",g)),r&&(o=o.eq("campaign_round",r)),o)}),p=_.status==="fulfilled"?_.value.data||[]:[],T=k.data;N.status==="fulfilled"&&N.value.data;const M=["data_entry","district","governorate"],F=p.filter(o=>M.includes(o.role)&&o.is_active).map(o=>{const y=T.filter($=>$.submitted_by===o.id),v=y.filter($=>$.status==="submitted").length,a=y.filter($=>$.status==="draft").length,h=y.filter($=>$.gps_lat).length,R=y.filter($=>{var E;return((E=$.photos)==null?void 0:E.length)>0}).length,d=y.length>0?y[0].created_at:null,f=o.last_login,w=d?Math.floor((Date.now()-new Date(d).getTime())/864e5):999,q=f?Math.floor((Date.now()-new Date(f).getTime())/864e5):999;let c=0;return y.length>0&&(c+=30),v>0&&(c+=25),h>0&&(c+=15),R>0&&(c+=15),w<=3?c+=15:w<=7?c+=10:w<=14&&(c+=5),{...o,totalSubs:y.length,submitted:v,draft:a,withGps:h,withPhotos:R,lastSub:d,lastLogin:f,daysSinceLastSub:w,daysSinceLastLogin:q,gpsRate:y.length>0?Math.round(h/y.length*100):0,photoRate:y.length>0?Math.round(R/y.length*100):0,score:c}}).sort((o,y)=>y.score-o.score),S=F.filter(o=>o.daysSinceLastSub<=7).length,z=F.filter(o=>o.daysSinceLastSub>14).length,C=F.length>0?Math.round(F.reduce((o,y)=>o+y.score,0)/F.length):0,D={data_entry:"إدخال بيانات",district:"مديرية",governorate:"محافظة"},x={data_entry:"⚪",district:"🟢",governorate:"🔵"};t.success,t.info;function i(o){return o>=70?t.success:o>=40?t.warning:t.accent}function u(o){return o>=80?"ممتاز":o>=60?"جيد":o>=40?"متوسط":o>=20?"ضعيف":"غير نشط"}const m=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير أداء المشرفين — EPI Supervisor</title>
      ${Ne()}
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
      ${Ee("تقرير أداء المشرفين الميدانيين","تقييم شامل لكل مشرف — الإرساليات، النشاط، جودة البيانات، التغطية"+Te(r))}

      ${V("📊","ملخص الأداء")}
      <div class="kpi-grid">
        ${A("إجمالي المشرفين",F.length,"👥",t.primary)}
        ${A("نشط (آخر 7 أيام)",S,"🟢",t.success,`${F.length>0?Math.round(S/F.length*100):0}%`)}
        ${A("غير نشط (+14 يوم)",z,"🔴",t.accent,`${F.length>0?Math.round(z/F.length*100):0}%`)}
        ${A("متوسط الأداء",`${C}/100`,"📊",C>=60?t.success:t.warning)}
      </div>

      ${V("🏆","ترتيب المشرفين حسب الأداء",`${F.length} مشرف`)}
      ${ue(["#","المشرف","الدور","المحافظة/المديرية","الإرساليات","مرسلة","GPS","النشاط","التقييم"],F.map((o,y)=>{var v,a;return[`${y+1}`,`<strong>${L(o.full_name)}</strong>`,`${x[o.role]||"👤"} ${D[o.role]||o.role}`,L(((v=o.governorates)==null?void 0:v.name_ar)||((a=o.districts)==null?void 0:a.name_ar)||"—"),`<span class="num">${o.totalSubs}</span>`,`<span class="num">${o.submitted}</span>`,`<span class="num">${o.gpsRate}%</span>`,o.daysSinceLastSub<=3?'<span class="activity-dot" style="background:#4CAF50"></span> نشط':o.daysSinceLastSub<=7?'<span class="activity-dot" style="background:#FF9800"></span> متوسط':o.daysSinceLastSub<=14?'<span class="activity-dot" style="background:#F44336"></span> ضعيف':'<span class="activity-dot" style="background:#9E9E9E"></span> متوقف',`<span class="score-badge" style="background:${i(o.score)}">${o.score} — ${u(o.score)}</span>`]}))}

      <!-- ═══ Top Performers ═══ -->
      ${F.filter(o=>o.score>=60).length>0?`
        ${V("⭐","المشرفون المتميزون",`${F.filter(o=>o.score>=60).length} متميز`)}
        ${F.filter(o=>o.score>=60).slice(0,10).map(o=>{var y,v;return`
          <div class="supervisor-card">
            <div class="supervisor-header">
              <div>
                <div class="supervisor-name">${x[o.role]} ${L(o.full_name)}</div>
                <div class="supervisor-meta">${D[o.role]} — ${L(((y=o.governorates)==null?void 0:y.name_ar)||((v=o.districts)==null?void 0:v.name_ar)||"—")}</div>
              </div>
              <span class="score-badge" style="background:${i(o.score)}">${o.score} ${u(o.score)}</span>
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
      ${F.filter(o=>o.daysSinceLastSub>14).length>0?`
        ${V("🚨","مشرفون غير نشطين — يحتاجون متابعة",`${F.filter(o=>o.daysSinceLastSub>14).length} غير نشط`)}
        <div class="alert-box alert-danger">
          يوجد <strong>${F.filter(o=>o.daysSinceLastSub>14).length}</strong> مشرف لم يرسل أي بيانات منذ أكثر من 14 يوم. يرجى متابعتهم.
        </div>
        ${ue(["#","المشرف","الدور","المحافظة","آخر إرسالية","منذ يوم"],F.filter(o=>o.daysSinceLastSub>14).map((o,y)=>{var v,a;return[`${y+1}`,`<strong>${L(o.full_name)}</strong>`,D[o.role]||o.role,L(((v=o.governorates)==null?void 0:v.name_ar)||((a=o.districts)==null?void 0:a.name_ar)||"—"),o.lastSub?new Date(o.lastSub).toLocaleDateString("ar-SA"):"لم يرسل أبداً",`<span style="color:${t.accent};font-weight:700">${o.daysSinceLastSub} يوم</span>`]}))}
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(m,"تقرير_أداء_المشرفين")}async function uo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,g=e==null?void 0:e.governorateId,_=o=>(l&&(o=o.gte("created_at",l)),n&&(o=o.lte("created_at",n+"T23:59:59")),o),N=o=>(g&&g!=="all"&&(o=o.eq("governorate_id",g)),o),[k,p,T,M]=await Promise.allSettled([U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null).order("name_ar"),U.from("districts").select("*, governorates(name_ar)").eq("is_active",!0).is("deleted_at",null),_(N(rt(U.from("form_submissions").select("governorate_id, district_id, created_at").is("deleted_at",null),r))),U.from("profiles").select("governorate_id, district_id, role, is_active").is("deleted_at",null)]),j=k.status==="fulfilled"?k.value.data||[]:[],F=p.status==="fulfilled"?p.value.data||[]:[],S=T.status==="fulfilled"?T.value.data||[]:[],z=M.status==="fulfilled"?M.value.data||[]:[],C=j.map(o=>{const y=S.filter(f=>f.governorate_id===o.id),v=F.filter(f=>f.governorate_id===o.id),a=v.filter(f=>S.some(w=>w.district_id===f.id)),h=z.filter(f=>f.governorate_id===o.id&&f.is_active),R=y.length>0?y.sort((f,w)=>new Date(w.created_at).getTime()-new Date(f.created_at).getTime())[0].created_at:null,d=R?Math.floor((Date.now()-new Date(R).getTime())/864e5):999;return{name:o.name_ar,id:o.id,totalDistricts:v.length,coveredDistricts:a.length,gapDistricts:v.length-a.length,submissions:y.length,users:h.length,lastSub:R,daysSinceLast:d,coverageRate:v.length>0?Math.round(a.length/v.length*100):0}}),D=C.filter(o=>o.coverageRate===100),x=C.filter(o=>o.coverageRate>0&&o.coverageRate<100),i=C.filter(o=>o.coverageRate===0),u=F.filter(o=>!S.some(y=>y.district_id===o.id)),m=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير الفجوة التغطية — EPI Supervisor</title>
      ${Ne()}
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
      ${Ee("تقرير الفجوة في التغطية","تحليل شامل للمناطق المغطاة وغير المغطاة — أين نحن وأين يجب أن نكون"+Te(r))}

      ${V("📊","نظرة عامة على التغطية")}
      <div class="kpi-grid">
        ${A("المحافظات",j.length,"🏛️",t.primary)}
        ${A("مغطاة بالكامل",D.length,"✅",t.success)}
        ${A("غطاء جزئي",x.length,"⚠️",t.warning)}
        ${A("بدون تغطية",i.length,"🔴",t.accent)}
        ${A("المديريات",F.length,"🏘️",t.info)}
        ${A("مديريات بلا بيانات",u.length,"🚨",t.accent)}
        ${A("نسبة التغطية",`${j.length>0?Math.round((j.length-i.length)/j.length*100):0}%`,"📈",t.primary)}
        ${A("المستخدمين",z.filter(o=>o.is_active).length,"👥","#7B1FA2")}
      </div>

      <!-- ═══ Zero Coverage Governorates ═══ -->
      ${i.length>0?`
        ${V("🚨","محافظات بدون أي تغطية",`${i.length} محافظة`)}
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
        ${V("⚠️","محافظات بتغطية جزئية",`${x.length} محافظة`)}
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
      ${V("📋","جدول التغطية الشامل")}
      ${ue(["#","المحافظة","المديريات","مغطاة","فجوة","الإرساليات","المستخدمين","نسبة التغطية"],C.map((o,y)=>[`${y+1}`,`<strong>${L(o.name)}</strong>`,`<span class="num">${o.totalDistricts}</span>`,`<span class="num">${o.coveredDistricts}</span>`,`<span class="num" style="color:${o.gapDistricts>0?t.accent:t.success}">${o.gapDistricts}</span>`,`<span class="num">${o.submissions}</span>`,`<span class="num">${o.users}</span>`,`<span class="num" style="color:${o.coverageRate>=80?t.success:o.coverageRate>=40?t.warning:t.accent}">${o.coverageRate}%</span>`]))}

      ${C.map(o=>Ze(o.name,o.coveredDistricts,o.totalDistricts,o.coverageRate>=80?t.success:o.coverageRate>=40?t.warning:t.accent)).join("")}

      <!-- ═══ Districts Without Data ═══ -->
      ${u.length>0?`
        <div class="page-break"></div>
        ${V("🏘️","مديريات بدون أي بيانات",`${u.length} مديرية`)}
        ${ue(["#","المديرية","المحافظة"],u.map((o,y)=>{var v;return[`${y+1}`,L(o.name_ar),L(((v=o.governorates)==null?void 0:v.name_ar)||"—")]}))}
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(m,"تقرير_الفجوة_التغطية")}async function po(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo;async function g(){const z=[];let C=0;const D=1e3;for(;;){let x=U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(C,C+D-1);l&&(x=x.gte("created_at",l)),n&&(x=x.lte("created_at",n+"T23:59:59")),r&&(x=x.eq("campaign_round",r));const{data:i,error:u}=await x;if(u||!i||i.length===0||(z.push(...i),i.length<D)||(C+=D,z.length>=1e5))break}return z}const[_,N,k]=await Promise.allSettled([g(),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),p=_.status==="fulfilled"?_.value||[]:[],T=N.status==="fulfilled"?N.value.data||[]:[],M=k.status==="fulfilled"?k.value.data||[]:[],F=[{id:"polio_campaign",label:"حملة شلل الأطفال",icon:"💉",color:"#1565C0"},{id:"integrated_activity",label:"النشاط الإيصالي التكاملي",icon:"🏥",color:"#2E7D32"}].map(z=>{const C=T.filter(a=>a.campaign_type===z.id),D=C.map(a=>a.id),x=p.filter(a=>D.includes(a.form_id)),i=x.filter(a=>a.status==="submitted").length,u=x.filter(a=>a.status==="draft").length,m=x.filter(a=>a.gps_lat).length,o=x.filter(a=>{var h;return((h=a.photos)==null?void 0:h.length)>0}).length,y=new Set(x.map(a=>a.governorate_id).filter(Boolean)),v=M.map(a=>({name:a.name_ar,submissions:x.filter(h=>h.governorate_id===a.id).length,submitted:x.filter(h=>h.governorate_id===a.id&&h.status==="submitted").length}));return{...z,forms:C.length,totalSubs:x.length,submitted:i,draft:u,withGps:m,withPhotos:o,govsWithData:y.size,gpsRate:x.length>0?Math.round(m/x.length*100):0,photoRate:x.length>0?Math.round(o/x.length*100):0,submitRate:x.length>0?Math.round(i/x.length*100):0,govBreakdown:v}}),S=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير مقارنة الحملات — EPI Supervisor</title>
      ${Ne()}
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
      ${Ee("تقرير مقارنة الحملات","مقارنة شاملة بين حملة شلل الأطفال والنشاط الإيصالي التكاملي"+Te(r))}

      ${F.map((z,C)=>`
        ${C===1?'<div class="vs-divider">VS</div>':""}
        <div class="campaign-card">
          <div class="campaign-header" style="border-color: ${z.color}">
            <span class="campaign-icon">${z.icon}</span>
            <div>
              <div class="campaign-name" style="color: ${z.color}">${L(z.label)}</div>
              <div style="font-size:10px;color:${t.textMuted}">${z.forms} نماذج نشطة</div>
            </div>
          </div>
          <div class="kpi-grid">
            ${A("الإرساليات",z.totalSubs,"📋",z.color)}
            ${A("مرسلة",z.submitted,"✅",t.success,`${z.submitRate}%`)}
            ${A("مسودة",z.draft,"📝",t.warning)}
            ${A("GPS",`${z.gpsRate}%`,"📍",t.info)}
            ${A("صور",`${z.photoRate}%`,"📷","#00897B")}
            ${A("محافظات",`${z.govsWithData}/${M.length}`,"🏛️",z.color)}
          </div>
          ${ue(["#","المحافظة","الإرساليات","مرسلة","معدل الإرسال"],z.govBreakdown.sort((D,x)=>x.submissions-D.submissions).map((D,x)=>[`${x+1}`,L(D.name),`<span class="num">${D.submissions}</span>`,`<span class="num">${D.submitted}</span>`,`<span class="num">${D.submissions>0?Math.round(D.submitted/D.submissions*100):0}%</span>`]))}
        </div>
      `).join("")}

      ${Ce()}
    </body>
    </html>
  `;Me(S,"تقرير_مقارنة_الحملات")}async function mo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date,n=l.toISOString().split("T")[0],g=new Date(l.getTime()-864e5).toISOString().split("T")[0],[_,N,k]=await Promise.allSettled([rt(U.from("form_submissions").select("*, forms(title_ar), profiles:submitted_by(full_name, role), governorates(name_ar)").gte("created_at",`${n}T00:00:00`).is("deleted_at",null).order("created_at",{ascending:!1}),r),U.from("profiles").select("*").is("deleted_at",null),U.from("notifications").select("*").gte("created_at",`${n}T00:00:00`).order("created_at",{ascending:!1})]),p=_.status==="fulfilled"?_.value.data||[]:[],T=N.status==="fulfilled"?N.value.data||[]:[],M=k.status==="fulfilled"?k.value.data||[]:[],[j]=await Promise.allSettled([rt(U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",`${g}T00:00:00`).lt("created_at",`${n}T00:00:00`).is("deleted_at",null),r)]),F=j.status==="fulfilled"&&j.value.count||0,S=p.filter(o=>o.status==="submitted").length,z=p.filter(o=>o.status==="draft").length,C=new Set(p.map(o=>o.submitted_by)).size,D=T.filter(o=>o.is_active).length,x=Array.from({length:24},(o,y)=>({hour:`${y.toString().padStart(2,"0")}:00`,count:p.filter(v=>new Date(v.created_at).getHours()===y).length})),i=p.length-F,u=F>0?Math.round(i/F*100):p.length>0?100:0,m=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النشاط اليومي — ${Le(l)}</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("تقرير النشاط اليومي",`نشاط اليوم — ${Le(l)}${Te(r)}`)}

      ${V("📊","مؤشرات اليوم")}
      <div class="kpi-grid">
        ${A("إرساليات اليوم",p.length,"📋",t.primary,`أمس: ${F} (${i>=0?"+":""}${u}%)`)}
        ${A("مرسلة",S,"✅",t.success)}
        ${A("مسودة",z,"📝",t.warning)}
        ${A("مشرفين نشطين",C,"👥","#7B1FA2",`من ${D}`)}
        ${A("إشعارات",M.length,"🔔",t.info)}
        ${A("مقارنة بأمس",`${i>=0?"📈":"📉"} ${Math.abs(u)}%`,i>=0?"📈":"📉",i>=0?t.success:t.accent)}
      </div>

      ${V("⏰","النشاط بالساعة")}
      ${ue(["الساعة","عدد الإرساليات","النشاط"],x.filter(o=>o.count>0).map(o=>[`<strong>${o.hour}</strong>`,`<span class="num">${o.count}</span>`,"█".repeat(Math.min(o.count,20))]))}

      ${p.length>0?`
        ${V("📋","إرساليات اليوم",`${p.length} إرسالية`)}
        ${ue(["#","الوقت","النموذج","المُرسل","المحافظة","الحالة"],p.slice(0,30).map((o,y)=>{var v,a,h;return[`${y+1}`,new Date(o.created_at).toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"}),L(((v=o.forms)==null?void 0:v.title_ar)||"—"),L(((a=o.profiles)==null?void 0:a.full_name)||"—"),L(((h=o.governorates)==null?void 0:h.name_ar)||"—"),`<span class="status-badge ${o.status==="submitted"?"status-ready":"status-partial"}">${o.status==="submitted"?"مرسلة":"مسودة"}</span>`]}))}
      `:`
        <div class="alert-box alert-warning">⚠️ لا توجد إرساليات اليوم حتى الآن</div>
      `}

      ${C<D?`
        ${V("🚨","مشرفين لم يرسلوا اليوم")}
        <div class="alert-box alert-danger">
          ${D-C} من ${D} مشرف لم يرسلوا أي بيانات اليوم.
        </div>
      `:`
        <div class="alert-box alert-success">✅ جميع المشرفين نشطين اليوم — أداء ممتاز!</div>
      `}

      ${Ce()}
    </body>
    </html>
  `;Me(m,`تقرير_النشاط_اليومي_${n}`)}async function ho(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo;async function g(){const m=[];let o=0;const y=1e3;for(;;){let v=U.from("form_submissions").select("*, forms(title_ar, schema), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).range(o,o+y-1);l&&(v=v.gte("created_at",l)),n&&(v=v.lte("created_at",n+"T23:59:59")),r&&(v=v.eq("campaign_round",r));const{data:a,error:h}=await v;if(h||!a||a.length===0||(m.push(...a),a.length<y)||(o+=y,m.length>=1e5))break}return m}const[_,N]=await Promise.allSettled([g(),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),k=_.status==="fulfilled"?_.value||[]:[],p=N.status==="fulfilled"?N.value.data||[]:[],T=k.length,M=k.filter(m=>m.gps_lat).length,j=T-M,F=k.filter(m=>{var o;return((o=m.photos)==null?void 0:o.length)>0}).length,S=T-F,z=k.filter(m=>m.notes&&m.notes.trim()).length,C=k.filter(m=>m.governorate_id).length,D=T-C,x=p.map(m=>{const o=k.filter(f=>f.form_id===m.id),y=o.filter(f=>f.gps_lat).length,v=o.filter(f=>{var w;return((w=f.photos)==null?void 0:w.length)>0}).length,a=o.filter(f=>f.governorate_id).length;let h={};try{h=typeof m.schema=="string"?JSON.parse(m.schema):m.schema}catch(f){console.warn("[data-quality] Failed to parse form schema:",f)}const d=((h==null?void 0:h.sections)||[]).flatMap(f=>f.fields||[]).map(f=>{const w=f.name||f.id||f.label_ar,q=o.filter(c=>{var E;const $=(E=c.data)==null?void 0:E[w];return $!=null&&$!==""&&$!==0}).length;return{label:f.label_ar||w,type:f.type,filled:q,total:o.length,rate:o.length>0?Math.round(q/o.length*100):0}});return{name:m.title_ar,total:o.length,gpsRate:o.length>0?Math.round(y/o.length*100):0,photoRate:o.length>0?Math.round(v/o.length*100):0,govRate:o.length>0?Math.round(a/o.length*100):0,fieldCompleteness:d,overallQuality:o.length>0?Math.round((y+v+a)/(o.length*3)*100):0}});function i(m){return m>=80?t.success:m>=50?t.warning:t.accent}const u=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير جودة البيانات — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("تقرير جودة البيانات","تحليل شامل لاكتمال وجودة البيانات المدخلة"+Te(r))}

      ${V("📊","مؤشرات جودة البيانات")}
      <div class="kpi-grid">
        ${A("إجمالي الإرساليات",T,"📋",t.primary)}
        ${A("مع GPS",`${Math.round(M/T*100)}%`,"📍",i(Math.round(M/T*100)),`${M}/${T}`)}
        ${A("مع صور",`${Math.round(F/T*100)}%`,"📷",i(Math.round(F/T*100)),`${F}/${T}`)}
        ${A("مع محافظة",`${Math.round(C/T*100)}%`,"🏛️",i(Math.round(C/T*100)),`${C}/${T}`)}
        ${A("بلا GPS",j,"⚠️",t.accent)}
        ${A("بلا صور",S,"⚠️",t.accent)}
        ${A("بلا محافظة",D,"⚠️",t.accent)}
        ${A("ملاحظات مكتوبة",z,"📝",t.info)}
      </div>

      ${j>0?`<div class="alert-box alert-warning">⚠️ ${j} إرسالية (${Math.round(j/T*100)}%) بلا بيانات GPS — يؤثر على دقة التقارير الجغرافية</div>`:""}
      ${D>0?`<div class="alert-box alert-danger">🚨 ${D} إرسالية (${Math.round(D/T*100)}%) بلا محافظة — يجب إصلاحها</div>`:""}

      ${V("📝","جودة البيانات حسب النموذج")}
      ${ue(["#","النموذج","الإرساليات","GPS","صور","محافظة","الجودة الإجمالية"],x.map((m,o)=>[`${o+1}`,`<strong>${L(m.name)}</strong>`,`<span class="num">${m.total}</span>`,`<span class="num" style="color:${i(m.gpsRate)}">${m.gpsRate}%</span>`,`<span class="num" style="color:${i(m.photoRate)}">${m.photoRate}%</span>`,`<span class="num" style="color:${i(m.govRate)}">${m.govRate}%</span>`,`<span class="score-badge" style="background:${i(m.overallQuality)}">${m.overallQuality}%</span>`]))}

      ${x.filter(m=>m.fieldCompleteness.length>0).map(m=>`
        ${V("🔤",`تحليل حقول: ${m.name}`)}
        ${ue(["الحقل","النسبة","مُملأ/الإجمالي"],m.fieldCompleteness.sort((o,y)=>o.rate-y.rate).map(o=>[L(o.label),`<span style="color:${i(o.rate)};font-weight:700">${o.rate}%</span>`,`<span class="num">${o.filled}/${o.total}</span>`]))}
        ${m.fieldCompleteness.map(o=>Ze(o.label,o.filled,o.total,i(o.rate))).join("")}
      `).join("")}

      ${Ce()}
    </body>
    </html>
  `;Me(u,"تقرير_جودة_البيانات")}async function fo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,g=e==null?void 0:e.governorateId,_=o=>(l&&(o=o.gte("created_at",l)),n&&(o=o.lte("created_at",n+"T23:59:59")),g&&g!=="all"&&(o=o.eq("governorate_id",g)),o),[N,k]=await Promise.allSettled([_(U.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null)).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),p=N.status==="fulfilled"?N.value.data||[]:[],T=k.status==="fulfilled"?k.value.data||[]:[],M=p.filter(o=>!o.is_resolved),j=p.filter(o=>o.is_resolved),F=M.filter(o=>o.severity==="critical"),S=M.filter(o=>o.severity==="high"),z=M.filter(o=>o.severity==="medium"),C=M.filter(o=>o.severity==="low"),D=T.map(o=>{const y=p.filter(a=>a.governorate_id===o.id),v=y.filter(a=>!a.is_resolved);return{name:o.name_ar,total:y.length,unresolved:v.length,critical:v.filter(a=>a.severity==="critical").length,high:v.filter(a=>a.severity==="high").length}}).filter(o=>o.total>0).sort((o,y)=>y.unresolved-o.unresolved),x={};M.forEach(o=>{const y=o.item_category||"أخرى";x[y]=(x[y]||0)+1});const i={critical:"🔴 حرج",high:"🟠 عالي",medium:"🟡 متوسط",low:"🟢 منخفض"},u={critical:t.accent,high:"#E65100",medium:t.warning,low:t.success},m=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير النواقص والاحتياجات — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("تقرير النواقص والاحتياجات","تحليل تفصيلي لنواقص اللقاحات والمعدات والتجهيزات"+Te(r))}

      ${V("📊","ملخص النواقص")}
      <div class="kpi-grid">
        ${A("إجمالي النواقص",p.length,"📦",t.primary)}
        ${A("غير محلولة",M.length,"⚠️",t.accent)}
        ${A("محلولة",j.length,"✅",t.success)}
        ${A("حرجة",F.length,"🚨",t.accent)}
        ${A("عالية",S.length,"🟠","#E65100")}
        ${A("متوسطة",z.length,"🟡",t.warning)}
        ${A("منخفضة",C.length,"🟢",t.success)}
        ${A("معدل الحل",`${p.length>0?Math.round(j.length/p.length*100):0}%`,"📈",t.info)}
      </div>

      ${F.length>0?`
        <div class="alert-box alert-danger">
          🚨 <strong>تنبيه عاجل:</strong> يوجد ${F.length} نقص حرج يحتاج تدخل فوري!
        </div>
      `:""}

      ${M.length>0?`
        ${V("⚠️","النواقص غير المحلولة",`${M.length} نقص`)}
        ${ue(["#","النقص","الفئة","المحافظة","الخطورة","الكمية","المُبلّغ","التاريخ"],M.map((o,y)=>{var v,a;return[`${y+1}`,`<strong>${L(o.item_name)}</strong>`,L(o.item_category||"—"),L(((v=o.governorates)==null?void 0:v.name_ar)||"—"),`<span style="color:${u[o.severity]||t.textMuted};font-weight:700">${i[o.severity]||o.severity}</span>`,`<span class="num">${o.quantity_needed||"—"}</span>`,L(((a=o.profiles)==null?void 0:a.full_name)||"—"),new Date(o.created_at).toLocaleDateString("ar-SA")]}))}
      `:`
        <div class="alert-box alert-success">✅ لا توجد نواقص معلقة</div>
      `}

      ${D.length>0?`
        ${V("🏛️","النواقص حسب المحافظة")}
        ${ue(["#","المحافظة","الإجمالي","غير محلولة","حرجة","عالية"],D.map((o,y)=>[`${y+1}`,`<strong>${L(o.name)}</strong>`,`<span class="num">${o.total}</span>`,`<span class="num" style="color:${o.unresolved>0?t.accent:t.success}">${o.unresolved}</span>`,`<span class="num" style="color:${t.accent}">${o.critical}</span>`,`<span class="num" style="color:#E65100">${o.high}</span>`]))}
      `:""}

      ${Object.keys(x).length>0?`
        ${V("📂","النواقص حسب الفئة")}
        ${ue(["الفئة","العدد"],Object.entries(x).sort((o,y)=>y[1]-o[1]).map(([o,y])=>[L(o),`<span class="num">${y}</span>`]))}
      `:""}

      ${j.length>0?`
        <div class="page-break"></div>
        ${V("✅","النواقص المحلولة",`${j.length} نقص`)}
        ${ue(["#","النقص","المحافظة","تاريخ الحل"],j.slice(0,20).map((o,y)=>{var v;return[`${y+1}`,L(o.item_name),L(((v=o.governorates)==null?void 0:v.name_ar)||"—"),o.resolved_at?new Date(o.resolved_at).toLocaleDateString("ar-SA"):"—"]}))}
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(m,"تقرير_النواقص_التفصيلي")}async function vo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date,n=new Date(l.getTime()-7*864e5),g=new Date(l.getTime()-14*864e5),[_,N,k,p]=await Promise.allSettled([rt(U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",n.toISOString()).is("deleted_at",null),r),rt(U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",g.toISOString()).lt("created_at",n.toISOString()).is("deleted_at",null),r),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null)]),T=_.status==="fulfilled"?_.value.data||[]:[],M=N.status==="fulfilled"&&N.value.count||0,j=k.status==="fulfilled"?k.value.data||[]:[],F=p.status==="fulfilled"?p.value.data||[]:[],S=T.filter(y=>y.status==="submitted").length,z=T.filter(y=>y.status==="draft").length,C=new Set(T.map(y=>y.submitted_by)).size,D=new Set(T.map(y=>y.governorate_id).filter(Boolean)).size,x=T.length-M,i=M>0?Math.round(x/M*100):0,u=Array.from({length:7},(y,v)=>{const a=new Date(n.getTime()+v*864e5),h=a.toISOString().split("T")[0],R=a.toLocaleDateString("ar-SA",{weekday:"long"}),d=T.filter(f=>f.created_at.startsWith(h));return{day:R,date:h,count:d.length,submitted:d.filter(f=>f.status==="submitted").length}}),m=F.map(y=>({name:y.name_ar,count:T.filter(v=>v.governorate_id===y.id).length})).sort((y,v)=>v.count-y.count).filter(y=>y.count>0),o=`
    <!DOCTYPE html>
    <html lang="ar" dir="RTL">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الأسبوعي — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("التقرير الأسبوعي",`ملخص الأسبوع — ${Le(n)} إلى ${Le(l)}${Te(r)}`)}

      ${V("📊","مؤشرات الأسبوع")}
      <div class="kpi-grid">
        ${A("إرساليات الأسبوع",T.length,"📋",t.primary,`${x>=0?"+":""}${i}% vs الأسبوع السابق`)}
        ${A("مرسلة",S,"✅",t.success,`${T.length>0?Math.round(S/T.length*100):0}%`)}
        ${A("مسودة",z,"📝",t.warning)}
        ${A("مشرفين نشطين",C,"👥","#7B1FA2",`من ${j.filter(y=>y.is_active).length}`)}
        ${A("محافظات نشطة",D,"🏛️",t.info,`من ${F.length}`)}
        ${A("متوسط يومي",Math.round(T.length/7),"📊",t.primary)}
      </div>

      ${V("📅","النشاط اليومي")}
      ${ue(["اليوم","التاريخ","الإرساليات","مرسلة"],u.map(y=>[y.day,y.date,`<span class="num">${y.count}</span>`,`<span class="num">${y.submitted}</span>`]))}

      ${m.length>0?`
        ${V("🏛️","أداء المحافظات هذا الأسبوع")}
        ${m.map(y=>Ze(y.name,y.count,Math.max(...m.map(v=>v.count),1),t.primary)).join("")}
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

      ${Ce()}
    </body>
    </html>
  `;Me(o,"التقرير_الأسبوعي")}async function bo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=e==null?void 0:e.dateFrom,n=e==null?void 0:e.dateTo,g=C=>(l&&(C=C.gte("created_at",l)),n&&(C=C.lte("created_at",n+"T23:59:59")),C),[_,N]=await Promise.allSettled([U.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("last_login",{ascending:!1}),g(rt(U.from("form_submissions").select("submitted_by, created_at").is("deleted_at",null),r))]),k=_.status==="fulfilled"?_.value.data||[]:[],p=N.status==="fulfilled"?N.value.data||[]:[],T={admin:"🔴 مدير النظام",central:"🟣 مركزي",governorate:"🔵 محافظة",district:"🟢 مديرية",data_entry:"⚪ إدخال بيانات"},M=k.map(C=>{const D=p.filter(u=>u.submitted_by===C.id),x=D.length>0?D.sort((u,m)=>new Date(m.created_at).getTime()-new Date(u.created_at).getTime())[0].created_at:null,i=C.last_login?Math.floor((Date.now()-new Date(C.last_login).getTime())/864e5):999;return{...C,totalSubs:D.length,lastSub:x,daysSinceLogin:i}}),j=M.filter(C=>C.is_active&&C.daysSinceLogin<=7),F=M.filter(C=>C.is_active&&C.daysSinceLogin>30),S=M.filter(C=>!C.last_login),z=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير نشاط المستخدمين — EPI Supervisor</title>
      ${Ne()}
    </head>
    <body>
      ${Ee("تقرير نشاط المستخدمين","تحليل شامل لنشاط ودخول المستخدمين"+Te(r))}

      ${V("📊","ملخص المستخدمين")}
      <div class="kpi-grid">
        ${A("إجمالي المستخدمين",k.length,"👥",t.primary)}
        ${A("نشطين",j.length,"🟢",t.success)}
        ${A("خاملين (+30 يوم)",F.length,"🟡",t.warning)}
        ${A("لم يدخلوا أبداً",S.length,"🔴",t.accent)}
      </div>

      ${V("👥","قائمة المستخدمين",`${k.length} مستخدم`)}
      ${ue(["#","الاسم","البريد","الدور","المحافظة/المديرية","الإرساليات","آخر دخول","الحالة"],M.map((C,D)=>{var x,i;return[`${D+1}`,`<strong>${L(C.full_name)}</strong>`,L(C.email),T[C.role]||C.role,L(((x=C.governorates)==null?void 0:x.name_ar)||((i=C.districts)==null?void 0:i.name_ar)||"—"),`<span class="num">${C.totalSubs}</span>`,C.last_login?new Date(C.last_login).toLocaleDateString("ar-SA"):"لم يدخل",C.is_active?C.daysSinceLogin<=7?"🟢 نشط":C.daysSinceLogin<=30?"🟡 خامل":"🔴 متوقف":"⚫ معطل"]}))}

      ${S.length>0?`
        ${V("🚨","مستخدمون لم يدخلوا أبداً")}
        <div class="alert-box alert-warning">
          ${S.length} مستخدم لم يسجل دخول أبداً. تحقق إذا كانوا بحاجة لحسابات.
        </div>
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(z,"تقرير_نشاط_المستخدمين")}t.accent,t.warning,t.success;t.success,t.warning,t.accent,t.info;async function xo(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date;async function n(b,I,B){const W=[];let X=0;const H=1e3;for(;;){let ie=U.from(b).select(I).is("deleted_at",null).order("created_at",{ascending:!1}).range(X,X+H-1);B&&(ie=B(ie));const{data:de,error:ye}=await ie;if(ye||!de||de.length===0||(W.push(...de),de.length<H)||(X+=H,W.length>=1e5))break}return W}async function g(){const b=`
      id, status, data, notes, gps_lat, gps_lng, photos, created_at,
      forms(title_ar, campaign_type),
      profiles!submitted_by(full_name, phone),
      governorates(id, name_ar),
      districts(id, name_ar)
    `;let I=await n("form_submissions",b,B=>r?B.eq("campaign_round",r):B);return I.length===0&&r&&(console.warn(`[ChallengesReport] No data for round ${r}, retrying without round filter`),I=await n("form_submissions",b)),I}const _=await g(),[N,k,p,T,M]=await Promise.allSettled([U.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name)").is("deleted_at",null).order("created_at",{ascending:!1}),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("*").eq("is_active",!0).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),n("audit_logs","*, profiles(full_name)",b=>b.in("action",["create","update","delete"]))]),j=_||[],F=N.status==="fulfilled"?N.value.data||[]:[],S=k.status==="fulfilled"?k.value.data||[]:[],z=p.status==="fulfilled"?p.value.data||[]:[],C=T.status==="fulfilled"?T.value.data||[]:[],D=M.status==="fulfilled"?M.value||[]:[];let x=j;e!=null&&e.dateFrom&&(x=x.filter(b=>b.created_at>=e.dateFrom)),e!=null&&e.dateTo&&(x=x.filter(b=>b.created_at<=e.dateTo+"T23:59:59")),e!=null&&e.governorateId&&e.governorateId!=="all"&&(x=x.filter(b=>{var I,B;return((B=(I=b.governorates)==null?void 0:I[0])==null?void 0:B.id)||e.governorateId===""}));const i=new Set(x.map(b=>{var I,B;return((B=(I=b.governorates)==null?void 0:I[0])==null?void 0:B.id)||""}).filter(Boolean)),u=S.filter(b=>!i.has(b.id)),m=new Set(x.map(b=>{var I,B;return((B=(I=b.districts)==null?void 0:I[0])==null?void 0:B.id)||""}).filter(Boolean)),o=z.filter(b=>!m.has(b.id)),y=["data_entry","district","governorate"],v=C.filter(b=>y.includes(b.role)&&b.is_active);l.toDateString();const a=new Set(x.filter(b=>new Date(b.created_at).getTime()>l.getTime()-7*864e5).map(b=>{var I,B;return((B=(I=b.profiles)==null?void 0:I[0])==null?void 0:B.full_name)||""})),h=v.filter(b=>!a.has(b.id)),R=S.map(b=>{const I=x.filter(H=>{var ie,de;return((de=(ie=H.governorates)==null?void 0:ie[0])==null?void 0:de.id)||b.id===""}),B=I.filter(H=>H.status==="submitted").length,W=I.filter(H=>H.status==="draft").length,X=I.length;return{gov:b,total:X,submitted:B,draft:W,completionRate:X>0?Math.round(B/X*100):0,draftRate:X>0?Math.round(W/X*100):0}}).filter(b=>b.total>0),d=x.filter(b=>b.gps_lat&&b.gps_lng),f=x.length>0?Math.round(d.length/x.length*100):0,w=x.filter(b=>b.photos&&b.photos.length>0),q=x.length>0?Math.round(w.length/x.length*100):0,c=F.filter(b=>!b.is_resolved),$=c.filter(b=>b.severity==="critical"),E=c.filter(b=>b.severity==="high"),Y=[];x.forEach(b=>{var B,W,X,H,ie,de;const I=[];(!b.gps_lat||!b.gps_lng)&&I.push("بدون إحداثيات GPS"),(!b.photos||b.photos.length===0)&&I.push("بدون صور"),b.status==="draft"&&I.push("مسودة غير مُرسلة"),I.length>0&&Y.push({gov:((W=(B=b.governorates)==null?void 0:B[0])==null?void 0:W.name_ar)||"—",dist:((H=(X=b.districts)==null?void 0:X[0])==null?void 0:H.name_ar)||"—",team:((de=(ie=b.profiles)==null?void 0:ie[0])==null?void 0:de.full_name)||"—",issue:I.join("، "),severity:b.status==="draft"?"medium":"low",gps:b.gps_lat&&b.gps_lng?`${b.gps_lat.toFixed(4)}, ${b.gps_lng.toFixed(4)}`:"غير متوفر"})}),z.map(b=>{const I=x.filter(B=>{var W,X;return((X=(W=B.districts)==null?void 0:W[0])==null?void 0:X.id)||b.id===""});return{dist:b,gov:S.find(B=>{var W,X;return B.id===((X=(W=b.governorates)==null?void 0:W[0])==null?void 0:X.id)||""}),total:I.length,submitted:I.filter(B=>B.status==="submitted").length}}).filter(b=>b.total===0||b.submitted===0);const Q=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير التحديات والصعوبات — EPI Supervisor</title>
      ${Ne()}
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
      ${Ee("تقرير التحديات والصعوبات","تحليل شامل — التحديات، الإجراءات المتخذة، التوصيات"+Te(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Le(new Date(e.dateFrom))} — ${Le(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${A("إجمالي الإرساليات",x.length,"📋",t.primary)}
        ${A("محافظات بدون تغطية",u.length,"🏛️",u.length>0?t.accent:t.success)}
        ${A("مديريات بدون تغطية",o.length,"📍",o.length>0?t.accent:t.success)}
        ${A("مشرفين غير نشطين",h.length,"👥",h.length>0?t.warning:t.success)}
        ${A("نواقص حرجة",$.length,"🚨",$.length>0?t.accent:t.success)}
        ${A("معدل GPS",`${f}%`,"📡",f>=80?t.success:t.warning)}
        ${A("معدل الصور",`${q}%`,"📷",q>=80?t.success:t.warning)}
        ${A("معدل الإنجاز",`${R.length>0?Math.round(R.reduce((b,I)=>b+I.completionRate,0)/R.length):0}%`,"🎯",t.info)}
      </div>

      <!-- ═══ 1. التحديات الجغرافية ═══ -->
      ${u.length>0||o.length>0?`
        ${V("🗺️","التحديات الجغرافية — فجوات التغطية")}

        ${u.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">⚠️ محافظات بدون أي تغطية</div>
              <span class="tag tag-status">${u.length} محافظة</span>
            </div>
            <div class="challenge-body">
              <p>المحافظات التالية لم تسجل أي إرساليات في الفترة المحددة:</p>
              <div style="margin-top: 8px;">
                ${u.map(b=>`<span class="tag tag-gov">${L(b.name_ar)}</span>`).join(" ")}
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
                ${o.slice(0,20).map(b=>{const I=S.find(B=>{var W,X;return B.id===((X=(W=b.governorates)==null?void 0:W[0])==null?void 0:X.id)||""});return`<span class="tag tag-dist">${L(b.name_ar)}</span> <span class="tag tag-gov">${L((I==null?void 0:I.name_ar)||"—")}</span>`}).join("<br>")}
                ${o.length>20?`<p style="color:${t.textMuted};font-size:10px;margin-top:4px;">... و ${o.length-20} مديرية أخرى</p>`:""}
              </div>
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 2. التحديات اللوجستية — النواقص ═══ -->
      ${c.length>0?`
        ${V("📦","التحديات اللوجستية — النواقص المعلقة")}

        ${$.length>0?`
          <div class="challenge-card severity-critical">
            <div class="challenge-header">
              <div class="challenge-title">🚨 نواقص حرجة — تحتاج تدخل فوري</div>
              <span class="tag tag-status">${$.length} نقص حرج</span>
            </div>
            <div class="challenge-body">
              ${ue(["النقص","الفئة","المحافظة","المديرية","المطلوب","المتاح","المُبلّغ"],$.map(b=>{var I,B,W,X,H,ie;return[`<strong>${L(b.item_name)}</strong>`,L(b.item_category||"—"),L(((B=(I=b.governorates)==null?void 0:I[0])==null?void 0:B.name_ar)||"—"),L(((X=(W=b.districts)==null?void 0:W[0])==null?void 0:X.name_ar)||"—"),`${b.quantity_needed||"—"}`,`${b.quantity_available||0}`,L(((ie=(H=b.profiles)==null?void 0:H[0])==null?void 0:ie.full_name)||"—")]}))}
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
              ${ue(["النقص","المحافظة","المطلوب","المتاح","الفرق"],E.slice(0,10).map(b=>{var I,B;return[L(b.item_name),L(((B=(I=b.governorates)==null?void 0:I[0])==null?void 0:B.name_ar)||"—"),`${b.quantity_needed||"—"}`,`${b.quantity_available||0}`,`<span style="color:${t.accent};font-weight:700">${Math.max(0,(b.quantity_needed||0)-(b.quantity_available||0))}</span>`]}))}
            </div>
          </div>
        `:""}
      `:""}

      <!-- ═══ 3. التحديات البشرية ═══ -->
      ${h.length>0?`
        ${V("👥","التحديات البشرية — المشرفين غير النشطين")}
        <div class="challenge-card severity-medium">
          <div class="challenge-header">
            <div class="challenge-title">⚠️ مشرفون لم يرسلوا بيانات منذ أكثر من 7 أيام</div>
            <span class="tag tag-status">${h.length} مشرف</span>
          </div>
          <div class="challenge-body">
            ${ue(["المشرف","الدور","المحافظة/المديرية","الهاتف","آخر دخول"],h.slice(0,15).map(b=>{var I,B,W,X;return[`<strong>${L(b.full_name)}</strong>`,b.role==="data_entry"?"إدخال بيانات":b.role==="district"?"مديرية":"محافظة",L(((B=(I=b.governorates)==null?void 0:I[0])==null?void 0:B.name_ar)||((X=(W=b.districts)==null?void 0:W[0])==null?void 0:X.name_ar)||"—"),b.phone||"—",b.last_login?new Date(b.last_login).toLocaleDateString("ar-SA"):"لم يدخل"]}))}
            ${h.length>15?`<p style="color:${t.textMuted};font-size:10px;margin-top:8px;">... و ${h.length-15} مشرف آخر</p>`:""}
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
          ${Ze("إحداثيات GPS",d.length,x.length,f>=80?t.success:f>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${d.length} من ${x.length} إرسالية تحتوي إحداثيات GPS
          </p>
          ${f<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل GPS الإجباري في التطبيق. تدريب المشرفين على استخدام نظام تحديد المواقع. مراجعة إعدادات الأجهزة.
            </div>
          `:""}
        </div>
      </div>

      <div class="challenge-card severity-${q<80?"high":"low"}">
        <div class="challenge-header">
          <div class="challenge-title">📷 تغطية الصور الميدانية</div>
          <span class="tag tag-gps">${q}% مغطاة</span>
        </div>
        <div class="challenge-body">
          ${Ze("صور مرفقة",w.length,x.length,q>=80?t.success:q>=50?t.warning:t.accent)}
          <p style="margin-top:6px;font-size:10px;color:${t.textMuted}">
            ${w.length} من ${x.length} إرسالية تحتوي صور
          </p>
          ${q<80?`
            <div class="action-box">
              <strong>📋 الإجراء المتخذ:</strong> تفعيل رفع الصور الإجباري. توفير كاميرات للمشرفين. تبسيط عملية رفع الصور.
            </div>
          `:""}
        </div>
      </div>

      <!-- ═══ 5. تحديات الإنجاز ═══ -->
      ${R.filter(b=>b.draftRate>30).length>0?`
        ${V("📝","تحديات الإنجاز — محافظات بنسب مسودات عالية")}
        ${R.filter(b=>b.draftRate>30).map(b=>`
          <div class="challenge-card severity-medium">
            <div class="challenge-header">
              <div class="challenge-title">📝 ${L(b.gov.name_ar)} — نسبة المسودات ${b.draftRate}%</div>
              <span class="tag tag-gov">${b.total} إرسالية</span>
            </div>
            <div class="challenge-body">
              <div style="display:flex;gap:16px;margin-bottom:8px;">
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مرسلة:</span>
                  <span style="font-weight:700;color:${t.success}">${b.submitted}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">مسودة:</span>
                  <span style="font-weight:700;color:${t.warning}">${b.draft}</span>
                </div>
                <div>
                  <span style="font-size:10px;color:${t.textMuted}">نسبة الإنجاز:</span>
                  <span style="font-weight:700;color:${b.completionRate>=70?t.success:t.accent}">${b.completionRate}%</span>
                </div>
              </div>
              ${Ze("نسبة الإرسال",b.submitted,b.total,b.completionRate>=70?t.success:t.warning)}
              <div class="action-box">
                <strong>📋 الإجراء المتخذ:</strong> متابعة مشرفي ${L(b.gov.name_ar)} لاعتماد المسودات المعلقة. تحديد الأسباب (مشاكل تقنية، نقص تدريب، ضعف إنترنت).
              </div>
            </div>
          </div>
        `).join("")}
      `:""}

      <!-- ═══ 6. أحداث ميدانية — من سجل التدقيق ═══ -->
      ${D.length>0?`
        ${V("📋","أحدث ميدانية مسجلة")}
        ${ue(["التاريخ","المستخدم","الإجراء","الجدول","IP"],D.slice(0,15).map(b=>{var I,B;return[new Date(b.created_at).toLocaleDateString("ar-SA"),L(((B=(I=b.profiles)==null?void 0:I[0])==null?void 0:B.full_name)||"النظام"),b.action==="create"?"✅ إنشاء":b.action==="update"?"📝 تعديل":"🗑️ حذف",b.table_name==="form_submissions"?"إرساليات":b.table_name==="supply_shortages"?"نواقص":b.table_name,b.ip_address||"—"]}))}
      `:""}

      <!-- ═══ 7. ملخص التوصيات ═══ -->
      ${V("💡","ملخص التوصيات والإجراءات الاستراتيجية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div class="recommendation-box">
          <strong>🎯 التغطية الجغرافية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${u.length>0?`<li>تفعيل ${u.length} محافظة غير نشطة</li>`:""}
            ${o.length>0?`<li>تغطية ${o.length} مديرية فارغة</li>`:""}
            <li>نشر فرق دعم ميداني للمناطق النائية</li>
            <li>تفعيل حملات التحصين المتنقلة</li>
          </ul>
        </div>
        <div class="recommendation-box">
          <strong>👥 الموارد البشرية:</strong>
          <ul style="margin:6px 0;padding-right:16px;font-size:10px;">
            ${h.length>0?`<li>متابعة ${h.length} مشرف غير نشط</li>`:""}
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
            ${q<80?`<li>رفع معدل الصور من ${q}% إلى 85%</li>`:""}
            <li>مراجعة وإعتماد المسودات المعلقة</li>
            <li>تفعيل المزامنة التلقائية</li>
          </ul>
        </div>
      </div>

      ${Ce()}
    </body>
    </html>
  `;Me(Q,"تقرير_التحديات_والصعوبات")}const at={team_info:{title:"أ — معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"],target:100},work_environment:{title:"ب — بيئة العمل والتنسيق",icon:"🏥",fields:["suitable_location","community_coordination","has_speaker","has_transport","previous_visit"],target:100},records_docs:{title:"ج — السجلات والوثائق",icon:"📋",fields:["complete_records","daily_work_forms","correct_data_entry","next_visit_noted"],target:100},vaccination_cards:{title:"د — بطاقات التحصين",icon:"💳",fields:["child_vaccination_cards","women_vaccination_cards"],target:100},service_quality:{title:"هـ — جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","respiratory_rate_check","muac_measurement","ors_provision","clean_delivery_kit","nutrition_assessment"],target:100},vitamins_referral:{title:"و — الفيتامينات والإحالة",icon:"💊",fields:["vitamin_a_children","vitamin_a_women","facility_referral","correct_medication","nutrition_counseling"],target:100},vaccine_handling:{title:"ز — التعامل مع اللقاحات",icon:"💉",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"],target:100},supplies_equipment:{title:"ح — الإمدادات والمعدات",icon:"📦",fields:["family_planning_available","folic_iron_stock","fetal_stethoscope","bp_device","muac_tape","height_board","thermometer","scale","daily_supply_tracking"],target:100},catch_up_policy:{title:"ط — سياسة الالتحاق بالركب",icon:"🎯",fields:["has_vaccine_carrier","vaccines_sufficient","correct_vaccine_site","catch_up_knowledge","catch_up_training","catch_up_2to5_registration","team_target_knowledge"],target:100},defaulter_tracking:{title:"ي — تتبع المتخلفين",icon:"🔍",fields:["has_defaulter_mechanism","has_previous_vaccination_records"],target:95},aefi:{title:"ك — الآثار الجانبية",icon:"⚠️",fields:["aefi_knowledge","aefi_mothers_info"],target:100}},ia={has_activity_plan:"لدى الفريق خطة وخارطة القرى المستهدفة",has_doctor_or_trained:"أحد أعضاء الفريق طبيب أو فني مدرب",wearing_uniform:"يلتزم الفريق بلبس الزي (البالطو)",suitable_location:"المكان مناسب ويضمن الخصوصية",community_coordination:"تم التنسيق المسبق مع المجتمع",has_speaker:"يتوفر مع الفريق مكبر صوت",has_transport:"توجد وسيلة نقل مناسبة",previous_visit:"تمت زيارة الفريق من المستوى الأعلى",complete_records:"تتوفر سجلات مكتملة",daily_work_forms:"توجد استمارات العمل اليومي",correct_data_entry:"يتم تدوين البيانات بشكل صحيح",next_visit_noted:"يتم تدوين العودة للزيارة القادمة",child_vaccination_cards:"يتم صرف بطاقة تحصين للأطفال",women_vaccination_cards:"يتم صرف بطاقة تحصين للنساء",good_acceptance:"يوجد إقبال جيد على الخدمة",safe_vaccination:"يتم ممارسة التطعيم الآمن",respiratory_rate_check:"يتم احتساب سرعة التنفس",muac_measurement:"يتم قياس محيط منتصف الذراع",ors_provision:"يتم إعطاء محلول الإرواء",clean_delivery_kit:"يتم تزويد الحوامل بعلبة الولادة النظيفة",nutrition_assessment:"يقوم العامل بتقييم مشاكل التغذية",vitamin_a_children:"يعطي فيتامين أ للأطفال وفق البروتوكول",vitamin_a_women:"يعطي فيتامين أ للنساء وفق البروتوكول",facility_referral:"يتم الإحالة للمرفق الصحي",correct_medication:"يتم إعطاء الأدوية بطريقة سليمة",nutrition_counseling:"يقوم العامل بالنصح حول التغذية",vaccine_disposal:"يتم التخلص من اللقاحات في الفترة المحددة",safety_box_usage:"يتم استخدام صندوق الأمان بصورة صحيحة",cold_chain_proper:"اللقاحات محفوظة بطريقة سليمة",family_planning_available:"تتوفر وسائل تنظيم الأسرة",folic_iron_stock:"لدى الفريق إمداد كافي من حمض الفوليك والحديد",fetal_stethoscope:"توجد لدى الفريق سماعة جنين",bp_device:"يتوفر سماعة فحص وجهاز ضغط الدم",muac_tape:"لدى الفريق أشرطة قياس محيط الذراع",height_board:"لدى الفريق أشرطة قياس الطول",thermometer:"لدى الفريق ترمومتر",scale:"يوجد مع الفريق ميزان",daily_supply_tracking:"يقوم الفريق بتدوين حركة الإمداد يومياً",has_vaccine_carrier:"لدى المطعم حافظة لقاح مع قوالب ثلج",vaccines_sufficient:"اللقاحات والمستلزمات متوفرة وكافية",correct_vaccine_site:"يتم إعطاء اللقاح في الموضع المناسب",catch_up_knowledge:"لدى العاملين معرفة بسياسة الالتحاق بالركب",catch_up_training:"تلقى العاملين التدريب الكافي",catch_up_2to5_registration:"يقوم المطعم بالتطعيم للأطفال 2-5 سنوات",team_target_knowledge:"لدى الفريق معرفة بالمستهدف",has_defaulter_mechanism:"يوجد آلية لتتبع المتخلفين",has_previous_vaccination_records:"يوجد سجل التطعيم للجولات السابقة",aefi_knowledge:"لدى العامل معرفة بالآثار الجانبية",aefi_mothers_info:"يقدم المطعم معلومات للأمهات حول الآثار"};function yo(e,r){const l=[r,`q_${r}`,`section_${r}`,r.toLowerCase()];for(const n of l){const g=e==null?void 0:e[n];if(g!=null&&g!==""){const _=Number(g);if(!isNaN(_))return _;if(g===!0||g==="نعم"||g==="yes")return 100;if(g===!1||g==="لا"||g==="no")return 0}}return null}function $o(e,r){return e===null?"⬜":e>=r?"✅":e>=r*.8?"⚠️":"🔴"}function da(e,r){return e===null?t.textMuted:e>=r?t.success:e>=r*.8?t.warning:t.accent}async function _o(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null;async function l(a){let R=[],d=0;for(;;){let f=U.from("form_submissions").select("id, status, data, notes, gps_lat, gps_lng, photos, created_at, submitted_by, governorate_id, district_id, form_id").is("deleted_at",null).order("created_at",{ascending:!1}).range(d,d+1e3-1);e!=null&&e.formId&&(f=f.eq("form_id",e.formId)),e!=null&&e.dateFrom&&(f=f.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(f=f.lte("created_at",e.dateTo+"T23:59:59")),a&&(f=f.eq("campaign_round",a));const{data:w,error:q}=await f;if(q){console.error("[SupFormReport] fetch error:",q.message);break}if(!w||w.length===0||(R.push(...w),w.length<1e3)||(d+=1e3,R.length>=1e5))break}return R}let n=await l(r);n.length===0&&r&&(console.warn(`[SupFormReport] No data for round ${r}, retrying without round filter`),n=await l(null));const g={data:n},[{data:_},{data:N},{data:k},{data:p}]=await Promise.all([U.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null),U.from("forms").select("id, title_ar, campaign_type").is("deleted_at",null)]),T=new Map;for(const a of p||[])T.set(a.id,a);const M=g.data.map(a=>({...a,forms:T.get(a.form_id)||null})),j=new Map;for(const a of _||[])j.set(a.id,a);const F=new Map;for(const a of N||[])F.set(a.id,a);const S=new Map;for(const a of k||[])S.set(a.id,a);let C=(M||[]).map(a=>{const h=a.submitted_by?j.get(a.submitted_by):null,R=a.governorate_id?F.get(a.governorate_id):null,d=a.district_id?S.get(a.district_id):null;return{...a,profiles:h?[h]:[],governorates:R?[R]:[],districts:d?[d]:[]}});e!=null&&e.governorateId&&e.governorateId!=="all"&&(C=C.filter(a=>a.governorate_id===e.governorateId));const D=C.map(a=>{const h=a.data||{},R={};let d=0,f=0,w=0;for(const[c,$]of Object.entries(at)){const E=$.fields.map(b=>{const I=yo(h,b),B=$o(I,$.target);return d++,I!==null&&I<$.target&&f++,I!==null&&(w+=I),{field:b,label:ia[b]||b,value:I,target:$.target,status:B}}),Y=E.filter(b=>b.value!==null),Q=Y.length>0?Math.round(Y.reduce((b,I)=>b+(I.value||0),0)/Y.length):-1;R[c]={fields:E,avgScore:Q,challengeCount:E.filter(b=>b.value!==null&&b.value<$.target).length}}const q=d>0?Math.round(w/d):0;return{sub:a,sectionResults:R,overallScore:q,totalChallenges:f,totalFields:d,hasData:Object.keys(h).length>0}}).filter(a=>a.hasData),x=D.length,i=x>0?Math.round(D.reduce((a,h)=>a+h.overallScore,0)/x):0,u={};for(const a of Object.keys(at)){const h=D.filter(R=>{var d;return((d=R.sectionResults[a])==null?void 0:d.avgScore)>=0});u[a]=h.length>0?Math.round(h.reduce((R,d)=>R+d.sectionResults[a].avgScore,0)/h.length):0}const m={};D.forEach(a=>{for(const[h,R]of Object.entries(a.sectionResults))R.fields.forEach(d=>{if(d.value!==null&&d.value<d.target){const f=`${h}||${d.field}`;m[f]=(m[f]||0)+1}})});const o=Object.entries(m).sort((a,h)=>h[1]-a[1]).slice(0,10).map(([a,h])=>{var f;const[R,d]=a.split("||");return{section:((f=at[R])==null?void 0:f.title)||R,field:ia[d]||d,count:h,pct:x>0?Math.round(h/x*100):0}}),y=[...D].sort((a,h)=>h.totalChallenges-a.totalChallenges).slice(0,15),v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير استمارة الإشراف — النشاط الإيصالي التكاملي</title>
      ${Ne()}
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
      ${Ee("تقرير استمارة الإشراف — النشاط الإيصالي التكاملي","تحليل تحديات 8 أقسام إشرافية × 33 مؤشر"+Te(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Le(new Date(e.dateFrom))} — ${Le(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص الإشراف")}
      <div class="kpi-grid">
        ${A("إجمالي الاستمارات",x,"📋",t.primary)}
        ${A("متوسط الأداء العام",`${i}%`,"🎯",i>=90?t.success:i>=70?t.warning:t.accent)}
        ${A("استمارات ممتازة (90%+)",D.filter(a=>a.overallScore>=90).length,"⭐",t.success)}
        ${A("استمارات تحتاج تحسين (<70%)",D.filter(a=>a.overallScore<70).length,"⚠️",D.filter(a=>a.overallScore<70).length>0?t.accent:t.success)}
        ${A("متوسط التحديات/استمارة",x>0?(D.reduce((a,h)=>a+h.totalChallenges,0)/x).toFixed(1):"0","📉",t.warning)}
      </div>

      <!-- ═══ Section Averages — Radar-like view ═══ -->
      ${V("📈","متوسط أداء الأقسام الثمانية")}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        ${Object.entries(at).map(([a,h])=>{const R=u[a];return`
            <div class="section-bar ${R>=90?"good":R>=70?"warning":"danger"}">
              <span class="section-icon">${h.icon}</span>
              <span class="section-name">${h.title}</span>
              <span class="section-score" style="color:${da(R,h.target)}">${R}%</span>
            </div>
          `}).join("")}
      </div>

      <!-- ═══ Top Challenges ═══ -->
      ${o.length>0?`
        ${V("🚨","أكثر التحديات تكراراً")}
        ${ue(["#","القسم","المؤشر","عدد الاستمارات","النسبة"],o.map((a,h)=>[`${h+1}`,L(a.section),`<strong>${L(a.field)}</strong>`,`${a.count}`,`<span style="color:${a.pct>50?t.accent:a.pct>25?t.warning:t.textMuted};font-weight:700">${a.pct}%</span>`]))}
      `:""}

      <!-- ═══ Worst Submissions — Detailed Cards ═══ -->
      ${y.length>0?`
        <div class="page-break"></div>
        ${V("📋","الاستمارات التي تحتاج متابعة",`${y.length} استمارة`)}

        ${y.map((a,h)=>{var c,$,E,Y,Q,b,I,B,W,X,H,ie,de,ye;const{sub:R,sectionResults:d,overallScore:f,totalChallenges:w}=a;return`
            <div class="supervision-card ${f>=80?"warning":"worst"}">
              <div class="card-header">
                <div>
                  <div class="card-title">${h+1}. ${L((($=(c=R.profiles)==null?void 0:c[0])==null?void 0:$.full_name)||"مشرف مجهول")}</div>
                  <div class="card-subtitle">${L(((Y=(E=R.forms)==null?void 0:E[0])==null?void 0:Y.title_ar)||"استمارة إشراف")}</div>
                  <div class="card-meta">
                    <span class="gov-badge">🏛️ ${L(((b=(Q=R.governorates)==null?void 0:Q[0])==null?void 0:b.name_ar)||"—")}</span>
                    <span class="dist-badge">📍 ${L(((B=(I=R.districts)==null?void 0:I[0])==null?void 0:B.name_ar)||"—")}</span>
                    <span class="team-badge">👥 ${L(((X=(W=R.profiles)==null?void 0:W[0])==null?void 0:X.full_name)||"—")}</span>
                    ${R.gps_lat&&R.gps_lng?`<span class="gps-tag">📡 ${R.gps_lat.toFixed(4)}, ${R.gps_lng.toFixed(4)}</span>`:'<span style="color:'+t.accent+';font-size:9px">⚠️ بدون GPS</span>'}
                    <span class="meta-item"><span class="meta-icon">📅</span> ${new Date(R.created_at).toLocaleDateString("ar-SA")}</span>
                    ${(ie=(H=R.profiles)==null?void 0:H[0])!=null&&ie.phone?`<span class="meta-item"><span class="meta-icon">📱</span> ${(ye=(de=R.profiles)==null?void 0:de[0])==null?void 0:ye.phone}</span>`:""}
                  </div>
                </div>
                <div class="card-score" style="color:${da(f,80)};background:${f>=80?"#E8F5E9":"#FFEBEE"}">
                  ${f}%
                </div>
              </div>

              <!-- Section breakdown -->
              ${Object.entries(at).map(([ke,Se])=>{const we=d[ke];if(!we)return"";const ze=we.avgScore;return`
                  <div class="section-bar ${ze>=90?"good":ze>=70?"warning":ze>=0?"danger":"neutral"}">
                    <span class="section-icon">${Se.icon}</span>
                    <span class="section-name">${Se.title}</span>
                    <span class="section-score" style="color:${da(ze,Se.target)}">
                      ${ze>=0?`${ze}%`:"—"}
                    </span>
                    ${we.challengeCount>0?`<span style="font-size:8px;color:${t.accent}">(${we.challengeCount} تحدي)</span>`:""}
                  </div>
                `}).join("")}

              <!-- Challenge details -->
              ${w>0?`
                <div style="margin-top:10px;">
                  <div style="font-size:10px;font-weight:700;color:${t.accent};margin-bottom:6px;">⚠️ التحديات المحددة:</div>
                  ${Object.entries(d).map(([ke,Se])=>Se.fields.filter(we=>we.value!==null&&we.value<we.target).map(we=>{var ze,Je;return`
                        <div class="challenge-item fail">
                          <span>${((ze=at[ke])==null?void 0:ze.icon)||"•"}</span>
                          <span style="flex:1">${(Je=at[ke])==null?void 0:Je.title} — ${we.label}</span>
                          <span style="font-weight:700;color:${t.accent}">${we.value}%</span>
                          <span style="color:${t.textMuted}">(الهدف: ${we.target}%)</span>
                        </div>
                      `}).join("")).join("")}
                </div>
              `:""}

              <!-- Notes -->
              ${R.notes?`
                <div style="margin-top:8px;padding:8px;background:${t.bgLight};border-radius:6px;font-size:10px;">
                  <strong>📝 ملاحظات:</strong> ${L(R.notes)}
                </div>
              `:""}
            </div>
          `}).join("")}
      `:""}

      <!-- ═══ Recommendations ═══ -->
      ${V("💡","التوصيات الإصلاحية")}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${Object.entries(at).map(([a,h])=>{const R=u[a];return R>=90?`
            <div style="background:#E8F5E9;border:1px solid #C8E6C9;border-radius:8px;padding:10px;">
              <strong>${h.icon} ${h.title}:</strong>
              <span style="color:${t.success};font-weight:700">ممتاز (${R}%)</span>
              <p style="font-size:9px;color:${t.textMuted};margin-top:4px;">استمرار المتابعة والتحسين</p>
            </div>
          `:`
            <div style="background:${R>=70?"#FFF8E1":"#FFEBEE"};border:1px solid ${R>=70?"#FFECB3":"#FFCDD2"};border-radius:8px;padding:10px;">
              <strong>${h.icon} ${h.title}:</strong>
              <span style="color:${R>=70?t.warning:t.accent};font-weight:700">${R>=70?"يحتاج تحسين":"يتدخل فوري"} (${R}%)</span>
              <ul style="font-size:9px;margin:4px 0;padding-right:14px;">
                ${h.fields.map(d=>{const f=D.filter(w=>{const q=w.sectionResults[a];return q&&q.fields.find(c=>c.field===d&&c.value!==null&&c.value<h.target)}).length;return f>0?`<li>${ia[d]} — ${f} استمارة</li>`:""}).filter(Boolean).join("")}
              </ul>
            </div>
          `}).join("")}
      </div>

      ${Ce()}
    </body>
    </html>
  `;Me(v,"تقرير_استمارة_الإشراف")}const wo={challenges:{label:"التحديات والصعوبات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"الإجراءات المتخذة",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"التوصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}},is={challenges:["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem","مشكلة","صعوبة","تحديات","صعوبات","مشاكل","عوائق"],actions:["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action","measure","إجراءات","اجراءات","تدابير","خطوات","ما تم"],recommendations:["توصي","اقتراح","ينصح","propose","recommend","توصيات","توصية","اقتراحات","يجب","من الضروري","ينبغي"]};function ca(e,r){if(!e||typeof e!="object")return null;const l=is[r];for(const[n,g]of Object.entries(e))if(typeof g=="string"&&g.trim().length>2){for(const _ of l)if(n.toLowerCase().includes(_.toLowerCase()))return g.trim()}if(e.data&&typeof e.data=="object"){for(const[n,g]of Object.entries(e.data))if(typeof g=="string"&&g.trim().length>2){for(const _ of l)if(n.toLowerCase().includes(_.toLowerCase()))return g.trim()}}for(const[n,g]of Object.entries(e))if(typeof g=="string"&&g.trim().length>20){for(const _ of l)if(g.toLowerCase().includes(_.toLowerCase()))return g.trim()}return null}function ga(e,r){if(!e||typeof e!="object")return null;const l=is[r];function n(g,_=0){if(_>3)return null;for(const[N,k]of Object.entries(g)){if(typeof k=="string"&&k.trim().length>10){for(const p of l)if(N.toLowerCase().includes(p.toLowerCase())||k.toLowerCase().includes(p.toLowerCase()))return k.trim()}if(typeof k=="object"&&k!==null&&!Array.isArray(k)){const p=n(k,_+1);if(p)return p}if(Array.isArray(k)){for(const p of k)if(typeof p=="object"&&p!==null){const T=n(p,_+1);if(T)return T}}}return null}return n(e)}async function So(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null;async function l(a){let R=[],d=0;for(;;){let f=U.from("form_submissions").select("id, status, data, notes, gps_lat, gps_lng, created_at, submitted_by, governorate_id, district_id").is("deleted_at",null).order("created_at",{ascending:!1}).range(d,d+1e3-1);e!=null&&e.dateFrom&&(f=f.gte("created_at",e.dateFrom)),e!=null&&e.dateTo&&(f=f.lte("created_at",e.dateTo+"T23:59:59")),a&&(f=f.eq("campaign_round",a));const{data:w,error:q}=await f;if(q){console.error("[SupChallengesReport] fetch error:",q.message);break}if(!w||w.length===0||(R.push(...w),w.length<1e3)||(d+=1e3,R.length>=1e5))break}return R}let n=await l(r);n.length===0&&r&&(console.warn(`[SupChallengesReport] No data for round ${r}, retrying without round filter`),n=await l(null));const g={data:n},[{data:_},{data:N},{data:k}]=await Promise.all([U.from("profiles").select("id, full_name, phone, role").is("deleted_at",null),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null)]),p=g.data,T=new Map;for(const a of _||[])T.set(a.id,a);const M=new Map;for(const a of N||[])M.set(a.id,a);const j=new Map;for(const a of k||[])j.set(a.id,a);const F=(p||[]).map(a=>{const h=a.data||{},R=ca(h,"challenges")||ga(h,"challenges"),d=ca(h,"actions")||ga(h,"actions"),f=ca(h,"recommendations")||ga(h,"recommendations"),w=a.submitted_by?T.get(a.submitted_by):null,q=a.governorate_id?M.get(a.governorate_id):null,c=a.district_id?j.get(a.district_id):null;return{challenges:R,actions:d,recommendations:f,hasAny:!!(R||d||f),hasAll:!!(R&&d&&f),govName:(q==null?void 0:q.name_ar)||"غير محدد",govId:a.governorate_id||"",distName:(c==null?void 0:c.name_ar)||"غير محدد",supervisorName:(w==null?void 0:w.full_name)||"مشرف مجهول",date:a.created_at}}),S=F.filter(a=>a.hasAny),z=new Map;for(const a of S){const h=a.govId||a.govName;z.has(h)||z.set(h,{govName:a.govName,total:0,complete:0,challengesList:[],actionsList:[],recommendationsList:[],supervisors:new Set,districts:new Set});const R=z.get(h);R.total++,a.hasAll&&R.complete++,R.supervisors.add(a.supervisorName),R.districts.add(a.distName),a.challenges&&R.challengesList.push(a.challenges),a.actions&&R.actionsList.push(a.actions),a.recommendations&&R.recommendationsList.push(a.recommendations)}const C=[...z.values()].sort((a,h)=>h.total-a.total),D=F.length,x=S.length,i=S.filter(a=>a.hasAll).length,u=S.filter(a=>a.challenges).length,m=S.filter(a=>a.actions).length,o=S.filter(a=>a.recommendations).length;function y(a,h){const R=wo[a];return h.length===0?"":`
      <div style="margin:8px 0;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;font-size:11px;font-weight:700;color:${R.color};">
          <span>${R.icon}</span>
          <span>${R.label}</span>
          <span style="font-size:9px;color:${t.textMuted};font-weight:400">(${h.length} نقطة)</span>
        </div>
        <div style="background:${R.bg};border:1px solid ${R.border};border-radius:8px;padding:10px 12px;">
          ${h.map((d,f)=>`
            <div style="font-size:11px;line-height:1.8;color:${t.textDark};padding:4px 0;${f>0?`border-top:1px solid ${R.border};`:""}">
              <span style="color:${t.textMuted};font-size:9px;">${f+1}.</span> ${L(d)}
            </div>
          `).join("")}
        </div>
      </div>
    `}const v=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير تحديات الإشراف الميداني</title>
      ${Ne()}
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
      ${Ee("تقرير تحديات الإشراف الميداني","النشاط الإيصالي التكاملي — مجمّع حسب المحافظة"+Te(r),e!=null&&e.dateFrom&&(e!=null&&e.dateTo)?`${Le(new Date(e.dateFrom))} — ${Le(new Date(e.dateTo))}`:"آخر 30 يوم")}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحديات")}
      <div class="kpi-grid">
        ${A("إجمالي الاستمارات",D,"📋",t.primary)}
        ${A("مُعبأة",x,"✅",t.success,`${D>0?Math.round(x/D*100):0}%`)}
        ${A("مكتملة (3/3)",i,"⭐",t.success)}
        ${A("تحديات",u,"⚠️","#E53935",`${x>0?Math.round(u/x*100):0}%`)}
        ${A("إجراءات",m,"📋","#1565C0",`${x>0?Math.round(m/x*100):0}%`)}
        ${A("توصيات",o,"💡","#2E7D32",`${x>0?Math.round(o/x*100):0}%`)}
      </div>

      ${C.length===0?`
        <div style="text-align:center;padding:40px;color:${t.textMuted};">
          <p style="font-size:18px;">📋 لا توجد استمارات مُعبأة</p>
        </div>
      `:""}

      <!-- ═══ Cards by Governorate ═══ -->
      ${C.map(a=>{const h=a.total>0?Math.round(a.complete/a.total*100):0;return`
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
              <div class="gov-card-badge" style="color:${h>=80?"#C8E6C9":h>=50?"#FFECB3":"#FFCDD2"}">
                ${h}%
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
                ${[...a.supervisors].slice(0,8).map(R=>`<span class="gov-meta-tag">👤 ${L(R)}</span>`).join("")}
                ${a.supervisors.size>8?`<span class="gov-meta-tag">... و ${a.supervisors.size-8} آخرين</span>`:""}
              </div>

              ${y("challenges",a.challengesList)}
              ${y("actions",a.actionsList)}
              ${y("recommendations",a.recommendationsList)}
            </div>
          </div>
        `}).join("")}

      <!-- ═══ ملخص جدول ═══ -->
      ${C.length>0?`
        ${V("📍","ملخص حسب المحافظة")}
        ${ue(["المحافظة","الاستمارات","مكتملة","التحديات","الإجراءات","التوصيات","الاكتمال"],C.map(a=>[L(a.govName),`${a.total}`,`${a.complete}`,`${a.challengesList.length}`,`${a.actionsList.length}`,`${a.recommendationsList.length}`,`<span style="color:${a.total>0&&a.complete/a.total>=.8?t.success:t.warning};font-weight:700">${a.total>0?Math.round(a.complete/a.total*100):0}%</span>`]))}
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(v,"تقرير_تحديات_الإشراف_الميداني")}function ds(e){const r=(e||"").trim();return r.includes("مدير عام مكتب الصحة العامة والسكان بالمحافظة")?!0:["عبدالحكيم محمد احمد عيناء"].some(n=>r.includes(n))}function ko(){return new Date().toISOString().split("T")[0]}function Fo(e){return new Date(e).toLocaleDateString("ar-SA",{weekday:"long"})}const Ro=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];function Do(e){return`${e.getDate()} ${Ro[e.getMonth()]} ${e.getFullYear()}`}async function cs(e){const r=(e==null?void 0:e.date)||ko(),l=`${r}T00:00:00`,n=`${r}T23:59:59`,g=Fo(r),_=Do(new Date(r)),N=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[k,p,T]=await Promise.allSettled([U.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),M=await Ft({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:u=>{let m=u.is("deleted_at",null).gte("created_at",l).lte("created_at",n);return N&&(m=m.eq("campaign_round",N)),m}}),j=k.status==="fulfilled"?k.value.data||[]:[],F=M.data,S=p.status==="fulfilled"?p.value.data||[]:[],z=T.status==="fulfilled"?T.value.data||[]:[],C=new Map;for(const u of S)C.set(u.id,u);const D=new Map;for(const u of z)D.set(u.id,u);const x=j.filter(u=>u.is_active).map(u=>{const m=F.filter(R=>R.submitted_by===u.id),o=m.filter(R=>R.status==="submitted").length,y=m.filter(R=>R.status==="draft").length,v=m.length,a=u.governorate_id?C.get(u.governorate_id):null,h=u.district_id?D.get(u.district_id):null;return{...u,totalToday:v,submittedToday:o,draftToday:y,isGenSupervisor:ds(u.full_name||""),govName:(a==null?void 0:a.name_ar)||"",govId:u.governorate_id||"",distName:(h==null?void 0:h.name_ar)||""}}),i=new Map;for(const u of S){const m=x.filter(v=>v.govId===u.id),o=m.filter(v=>v.role==="governorate"||v.role==="central"||v.role==="admin").sort((v,a)=>{const h={central:0,admin:0,governorate:1};return(h[v.role]??9)-(h[a.role]??9)}),y=new Map;for(const v of m.filter(a=>a.role==="district"||a.role==="data_entry")){const a=v.district_id||"_no_district";y.has(a)||y.set(a,[]),y.get(a).push(v)}i.set(u.id,{gov:u,allUsers:m,govLevelUsers:o,districts:y})}return{users:j,subs:F,govs:S,dists:z,enriched:x,govGroups:i,targetDate:r,dayName:g,dateArabic:_}}async function Ra(e){var x,i;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,[l,n,g]=await Promise.allSettled([U.from("profiles").select("id, full_name, phone, role, governorate_id, district_id, is_active").is("deleted_at",null).order("governorate_id",{ascending:!0}),U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0}),U.from("districts").select("id, name_ar, governorate_id").eq("is_active",!0).is("deleted_at",null).order("name_ar",{ascending:!0})]),_=await Ft({table:"form_submissions",select:"id, submitted_by, governorate_id, district_id, status, created_at, campaign_round",maxRows:1e5,pageSize:1e3,orderBy:"created_at",orderDirection:"asc",applyFilters:u=>{let m=u.is("deleted_at",null);return r&&(m=m.eq("campaign_round",r)),m}}),N=l.status==="fulfilled"?l.value.data||[]:[],k=_.data,p=n.status==="fulfilled"?n.value.data||[]:[],T=g.status==="fulfilled"?g.value.data||[]:[];let M="",j="",F=0;if(k.length>0&&(M=((x=k[0].created_at)==null?void 0:x.split("T")[0])||"",j=((i=k[k.length-1].created_at)==null?void 0:i.split("T")[0])||"",M&&j)){const u=new Date(M),m=new Date(j);F=Math.ceil((m.getTime()-u.getTime())/(1e3*60*60*24))+1}const S=new Map;for(const u of p)S.set(u.id,u);const z=new Map;for(const u of T)z.set(u.id,u);const C=N.filter(u=>u.is_active).map(u=>{const m=k.filter(R=>R.submitted_by===u.id),o=m.filter(R=>R.status==="submitted").length,y=m.filter(R=>R.status==="draft").length,v=m.length,a=u.governorate_id?S.get(u.governorate_id):null,h=u.district_id?z.get(u.district_id):null;return{...u,totalToday:v,submittedToday:o,draftToday:y,isGenSupervisor:ds(u.full_name||""),govName:(a==null?void 0:a.name_ar)||"",govId:u.governorate_id||"",distName:(h==null?void 0:h.name_ar)||""}}),D=new Map;for(const u of p){const m=C.filter(v=>v.govId===u.id),o=m.filter(v=>v.role==="governorate"||v.role==="central"||v.role==="admin").sort((v,a)=>{const h={central:0,admin:0,governorate:1};return(h[v.role]??9)-(h[a.role]??9)}),y=new Map;for(const v of m.filter(a=>a.role==="district"||a.role==="data_entry")){const a=v.district_id||"_no_district";y.has(a)||y.set(a,[]),y.get(a).push(v)}D.set(u.id,{gov:u,allUsers:m,govLevelUsers:o,districts:y})}return{users:N,subs:k,govs:p,dists:T,enriched:C,govGroups:D,dateRange:{from:M,to:j},totalDays:F}}const jo={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function To(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=await cs(e),{enriched:n,govs:g,dists:_,subs:N,targetDate:k,dayName:p,dateArabic:T,govGroups:M}=l,j=n.filter(w=>(w.role==="central"||w.role==="admin")&&w.govId),F=[...n.filter(w=>["governorate","district","data_entry"].includes(w.role)),...j];e!=null&&e.governorateId&&e.governorateId!=="all"&&(g.filter(w=>w.id===e.governorateId),F.filter(w=>w.govId===e.governorateId));const S=F.length,z=F.filter(w=>w.totalToday>0).length,C=F.filter(w=>w.totalToday===0&&!w.isGenSupervisor).length,D=F.filter(w=>w.isGenSupervisor).length,x=N.length,i=N.filter(w=>w.status==="submitted").length,u=N.filter(w=>w.status==="draft").length,o=new Set(F.map(w=>w.govId).filter(Boolean)).size,y=g.length,v=F.filter(w=>w.role==="district"||w.role==="data_entry"),h=new Set(v.map(w=>w.district_id).filter(Boolean)).size,R=_.length;function d(w,q){let c;w.isGenSupervisor?c='<span class="status-badge status-general">إشراف عام</span>':w.totalToday>0?c='<span class="status-badge status-active">✅ نشط</span>':c='<span class="status-badge status-inactive">❌ غير نشط</span>';let $;return w.role==="central"||w.role==="admin"?$="مركزي":w.role==="governorate"?$="مشرف محافظة":w.role==="district"?$="مديرية":$="إدخال بيانات",`
      <tr class="${w.totalToday===0&&!w.isGenSupervisor?"row-inactive":""}">
        <td class="num">${q+1}</td>
        <td>
          <div class="user-name">${jo[w.role]||"👤"} ${L(w.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${w.role}">${$}</span></td>
        <td>${L(w.govName||"—")}</td>
        <td>${L(w.distName||"—")}</td>
        <td class="num">${w.totalToday}</td>
        <td class="num num-success">${w.submittedToday}</td>
        <td class="num num-warning">${w.draftToday}</td>
        <td>${c}</td>
      </tr>
    `}const f=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين اليومي — ${T}</title>
      ${Ne()}
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
      ${Ee("تقييم أداء المشرفين اليومي","استمارة الإشراف للنشاط الإيصالي التكاملي"+Te(r),`${p} — ${T}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${p} — ${T}</div>
        <div class="day-date">تقرير تقييم أداء المشرفين اليومي</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${V("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${A("إجمالي المشرفين",S,"👥",t.primary)}
        ${A("نشط اليوم",z,"✅",t.success,`${S>0?Math.round(z/S*100):0}%`)}
        ${A("غير نشط",C,"❌",t.accent,`${S>0?Math.round(C/S*100):0}%`)}
        ${A("إشراف عام",D,"🏛️","#1565C0",`${S>0?Math.round(D/S*100):0}%`)}
        ${A("إجمالي الاستمارات",x,"📋",t.info,`مرسلة: ${i} | مسودة: ${u}`)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${V("📈","نسب الإشراف الإجمالية")}
      <div class="kpi-grid">
        ${(()=>{const w=Math.max(S-D,1),q=Math.round(z/w*100);return A("نسبة النشاط الكلية",`${q}%`,"🎯",q>=70?t.success:q>=40?t.warning:t.accent)})()}
        ${(()=>{const w=y>0?Math.round(o/y*100):0;return A("تغطية إشراف المحافظات",`${w}%`,"🏛️",w>=80?t.success:w>=50?t.warning:t.accent,`${o}/${y}`)})()}
        ${(()=>{const w=R>0?Math.round(h/R*100):0;return A("تغطية إشراف المديريات",`${w}%`,"📍",w>=80?t.success:w>=50?t.warning:t.accent,`${h}/${R}`)})()}
        ${(()=>{const w=x>0?Math.round(i/x*100):0;return A("نسبة الإرسال",`${w}%`,"📤",w>=80?t.success:w>=50?t.warning:t.accent,`${i}/${x}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${S}</span>
        <span class="summary-chip chip-active">✅ نشط: ${z}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${C}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${D}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${V("📊","ملخص المحافظات")}
      ${ue(["المحافظة","المشرفين","نشط","غير نشط","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[...M.values()].map(w=>{const q=w.allUsers.filter(b=>b.totalToday>0&&!b.isGenSupervisor).length,c=w.allUsers.filter(b=>b.totalToday===0&&!b.isGenSupervisor).length,$=w.allUsers.filter(b=>b.isGenSupervisor).length,E=w.allUsers.reduce((b,I)=>b+I.totalToday,0),Y=w.allUsers.length,Q=Y>0?Math.round(q/Math.max(Y-$,1)*100):0;return[L(w.gov.name_ar),`${Y}`,`<span style="color:${t.success};font-weight:700">${q}</span>`,`<span style="color:${c>0?t.accent:t.textMuted}">${c}</span>`,`${$}`,`${w.districts.size}`,`${E}`,`<span style="color:${Q>=70?t.success:Q>=40?t.warning:t.accent};font-weight:700">${Q}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${V("📍","ملخص المديريات")}
      ${[...M.values()].map(w=>{if(w.districts.size===0)return"";const q=w.allUsers.filter(I=>I.role==="district"||I.role==="data_entry").length,c=w.allUsers.filter(I=>(I.role==="district"||I.role==="data_entry")&&I.totalToday>0).length,$=q-c,E=w.allUsers.filter(I=>I.role==="district"||I.role==="data_entry").reduce((I,B)=>I+B.totalToday,0),Y=[...w.districts.values()].filter(I=>I.some(B=>B.totalToday>0)).length,Q=q>0?Math.round(c/q*100):0,b=[...w.districts.entries()].sort((I,B)=>{const W=I[1].reduce((H,ie)=>H+ie.totalToday,0);return B[1].reduce((H,ie)=>H+ie.totalToday,0)-W}).map(([I,B])=>{var ye;const W=((ye=B[0])==null?void 0:ye.distName)||"غير محدد",X=B.filter(ke=>ke.totalToday>0).length,H=B.filter(ke=>ke.totalToday===0).length,ie=B.reduce((ke,Se)=>ke+Se.totalToday,0),de=B.length>0?Math.round(X/B.length*100):0;return[L(W),`${B.length}`,`<span style="color:${t.success};font-weight:700">${X}</span>`,`<span style="color:${H>0?t.accent:t.textMuted}">${H}</span>`,`${ie}`,`<span style="color:${de>=70?t.success:de>=40?t.warning:t.accent};font-weight:700">${de}%</span>`]});return`
          <div class="dist-summary-group">
            <!-- header المحافظة -->
            <div class="dist-summary-gov-header">
              <span>🏛️ ${L(w.gov.name_ar)}</span>
              <span class="gov-sub">${w.districts.size} مديرية | ${q} مشرف</span>
            </div>

            <!-- جدول مديريات المحافظة -->
            ${ue(["المديرية","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],b)}

            <!-- إجمالي المحافظة -->
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${L(w.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${q} مشرف</span>
                <span style="color:${t.success}">✅ ${c} نشط</span>
                ${$>0?`<span style="color:${t.accent}">❌ ${$} غير نشط</span>`:""}
                <span>📋 ${E} استمارة</span>
                <span>📍 ${Y}/${w.districts.size} مديرية</span>
                <span style="color:${Q>=70?t.success:Q>=40?t.warning:t.accent}">🎯 ${Q}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...M.values()].map(w=>{const q=w.allUsers.filter(Q=>Q.totalToday>0).length,c=w.allUsers.length,$=w.allUsers.reduce((Q,b)=>Q+b.totalToday,0),E=w.districts.size,Y=[...w.districts.values()].filter(Q=>Q.some(b=>b.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(w.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${c} مشرف | نشط: ${q} | غير نشط: ${c-q} |
                  مديريات: ${Y}/${E}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${$}</strong>
              </div>
            </div>

            ${w.allUsers.length===0?'<div class="no-data-msg">لا يوجد مشرفين في هذه المحافظة</div>':""}

            <!-- مشرفي المحافظة + المركزي -->
            ${w.govLevelUsers.length>0?`
              <div class="dist-header">
                <span>🏛️ مشرفي المحافظة والمركزي</span>
                <span class="dist-count">${w.govLevelUsers.length} مشرف</span>
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
                  ${w.govLevelUsers.map((Q,b)=>d(Q,b)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...w.districts.entries()].sort((Q,b)=>b[1].length-Q[1].length).map(([Q,b])=>{var X;const I=((X=b[0])==null?void 0:X.distName)||"غير محدد",B=b.filter(H=>H.totalToday>0).length,W=b.reduce((H,ie)=>H+ie.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${L(I)}</span>
                    <span class="dist-count">${b.length} مشرف | نشط: ${B} | استمارات: ${W}</span>
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
                      ${b.sort((H,ie)=>(H.role==="district"?0:1)-(ie.role==="district"?0:1)||ie.totalToday-H.totalToday).map((H,ie)=>d(H,ie)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Ce()}
    </body>
    </html>
  `;Me(f,`تقييم_أداء_المشرفين_اليومي_${k}`)}const Eo={admin:"🔵",central:"🏛️",governorate:"🟢",district:"🟡",data_entry:"⚪"};async function Co(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=await Ra(e),{enriched:n,govs:g,dists:_,subs:N,govGroups:k,dateRange:p,totalDays:T}=l,M=n.filter(c=>(c.role==="central"||c.role==="admin")&&c.govId),j=[...n.filter(c=>["governorate","district","data_entry"].includes(c.role)),...M];e!=null&&e.governorateId&&e.governorateId!=="all"&&(g.filter(c=>c.id===e.governorateId),j.filter(c=>c.govId===e.governorateId));const F=j.length,S=j.filter(c=>c.totalToday>0).length,z=j.filter(c=>c.totalToday===0&&!c.isGenSupervisor).length,C=j.filter(c=>c.isGenSupervisor).length,D=N.length,x=N.filter(c=>c.status==="submitted").length,i=N.filter(c=>c.status==="draft").length,m=new Set(j.map(c=>c.govId).filter(Boolean)).size,o=g.length,y=j.filter(c=>c.role==="district"||c.role==="data_entry"),a=new Set(y.map(c=>c.district_id).filter(Boolean)).size,h=_.length,R=p.from?Le(new Date(p.from)):"—",d=p.to?Le(new Date(p.to)):"—";function f(c,$){let E;c.isGenSupervisor?E='<span class="status-badge status-general">إشراف عام</span>':c.totalToday>0?E=`<span class="status-badge status-active">✅ ${c.totalToday} استمارة</span>`:E='<span class="status-badge status-inactive">❌ لا إرساليات</span>';let Y;return c.role==="central"||c.role==="admin"?Y="مركزي":c.role==="governorate"?Y="مشرف محافظة":c.role==="district"?Y="مديرية":Y="إدخال بيانات",`
      <tr class="${c.totalToday===0&&!c.isGenSupervisor?"row-inactive":""}">
        <td class="num">${$+1}</td>
        <td>
          <div class="user-name">${Eo[c.role]||"👤"} ${L(c.full_name||"—")}</div>
        </td>
        <td><span class="role-tag role-${c.role}">${Y}</span></td>
        <td>${L(c.govName||"—")}</td>
        <td>${L(c.distName||"—")}</td>
        <td class="num">${c.totalToday}</td>
        <td class="num num-success">${c.submittedToday}</td>
        <td class="num num-warning">${c.draftToday}</td>
        <td>${E}</td>
      </tr>
    `}const w=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم أداء المشرفين الشامل — ${R} إلى ${d}</title>
      ${Ne()}
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
      ${Ee("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي"+Te(r),`${R} — ${d} (${T} يوم)`)}

      <!-- ═══ نطاق التاريخ ═══ -->
      <div class="range-banner">
        <div class="range-title">📊 تقرير شامل — جميع الاستمارات</div>
        <div class="range-detail">
          📅 من ${R} إلى ${d} — ${T} يوم — ${D} استمارة
        </div>
      </div>

      <!-- ═══ ملخص شامل ═══ -->
      ${V("📊","الملخص الشامل")}
      <div class="kpi-grid">
        ${A("إجمالي المشرفين",F,"👥",t.primary)}
        ${A("نشط (له استمارات)",S,"✅",t.success,`${F>0?Math.round(S/F*100):0}%`)}
        ${A("بدون إرساليات",z,"❌",t.accent,`${F>0?Math.round(z/F*100):0}%`)}
        ${A("إشراف عام",C,"🏛️","#1565C0",`${F>0?Math.round(C/F*100):0}%`)}
        ${A("إجمالي الاستمارات",D,"📋",t.info,`مرسلة: ${x} | مسودة: ${i}`)}
        ${A("متوسط الاستمارات/مشرف",F>0?Math.round(D/F):0,"📈",t.primary)}
      </div>

      <!-- ═══ نسب الإشراف الإجمالية ═══ -->
      ${V("📈","نسب الإشراف")}
      <div class="kpi-grid">
        ${(()=>{const c=Math.max(F-C,1),$=Math.round(S/c*100);return A("نسبة النشاط الكلية",`${$}%`,"🎯",$>=70?t.success:$>=40?t.warning:t.accent)})()}
        ${(()=>{const c=o>0?Math.round(m/o*100):0;return A("تغطية المحافظات",`${c}%`,"🏛️",c>=80?t.success:c>=50?t.warning:t.accent,`${m}/${o}`)})()}
        ${(()=>{const c=h>0?Math.round(a/h*100):0;return A("تغطية المديريات",`${c}%`,"📍",c>=80?t.success:c>=50?t.warning:t.accent,`${a}/${h}`)})()}
        ${(()=>{const c=D>0?Math.round(x/D*100):0;return A("نسبة الإرسال",`${c}%`,"📤",c>=80?t.success:c>=50?t.warning:t.accent,`${x}/${D}`)})()}
      </div>

      <div class="summary-bar">
        <span class="summary-chip chip-total">👥 إجمالي: ${F}</span>
        <span class="summary-chip chip-active">✅ نشط: ${S}</span>
        <span class="summary-chip chip-inactive">❌ بدون إرساليات: ${z}</span>
        <span class="summary-chip chip-general">🏛️ إشراف عام: ${C}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${V("📊","ملخص المحافظات")}
      ${ue(["المحافظة","المشرفين","نشط","بدون إرساليات","إشراف عام","المديريات","الاستمارات","نسبة النشاط"],[...k.values()].map(c=>{const $=c.allUsers.filter(B=>B.totalToday>0&&!B.isGenSupervisor).length,E=c.allUsers.filter(B=>B.totalToday===0&&!B.isGenSupervisor).length,Y=c.allUsers.filter(B=>B.isGenSupervisor).length,Q=c.allUsers.reduce((B,W)=>B+W.totalToday,0),b=c.allUsers.length,I=b>0?Math.round($/Math.max(b-Y,1)*100):0;return[L(c.gov.name_ar),`${b}`,`<span style="color:${t.success};font-weight:700">${$}</span>`,`<span style="color:${E>0?t.accent:t.textMuted}">${E}</span>`,`${Y}`,`${c.districts.size}`,`${Q}`,`<span style="color:${I>=70?t.success:I>=40?t.warning:t.accent};font-weight:700">${I}%</span>`]}))}

      <!-- ═══ ملخص المديريات — مجمّع بالمحافظة ═══ -->
      ${V("📍","ملخص المديريات")}
      ${[...k.values()].map(c=>{if(c.districts.size===0)return"";const $=c.allUsers.filter(W=>W.role==="district"||W.role==="data_entry").length,E=c.allUsers.filter(W=>(W.role==="district"||W.role==="data_entry")&&W.totalToday>0).length,Y=$-E,Q=c.allUsers.filter(W=>W.role==="district"||W.role==="data_entry").reduce((W,X)=>W+X.totalToday,0),b=[...c.districts.values()].filter(W=>W.some(X=>X.totalToday>0)).length,I=$>0?Math.round(E/$*100):0,B=[...c.districts.entries()].sort((W,X)=>{const H=W[1].reduce((de,ye)=>de+ye.totalToday,0);return X[1].reduce((de,ye)=>de+ye.totalToday,0)-H}).map(([W,X])=>{var Se;const H=((Se=X[0])==null?void 0:Se.distName)||"غير محدد",ie=X.filter(we=>we.totalToday>0).length,de=X.filter(we=>we.totalToday===0).length,ye=X.reduce((we,ze)=>we+ze.totalToday,0),ke=X.length>0?Math.round(ie/X.length*100):0;return[L(H),`${X.length}`,`<span style="color:${t.success};font-weight:700">${ie}</span>`,`<span style="color:${de>0?t.accent:t.textMuted}">${de}</span>`,`${ye}`,`<span style="color:${ke>=70?t.success:ke>=40?t.warning:t.accent};font-weight:700">${ke}%</span>`]});return`
          <div class="dist-summary-group">
            <div class="dist-summary-gov-header">
              <span>🏛️ ${L(c.gov.name_ar)}</span>
              <span class="gov-sub">${c.districts.size} مديرية | ${$} مشرف</span>
            </div>
            ${ue(["المديرية","المشرفين","نشط","بدون إرساليات","الاستمارات","النشاط"],B)}
            <div class="dist-summary-gov-total">
              <span>📊 إجمالي ${L(c.gov.name_ar)}</span>
              <div class="total-stats">
                <span>👥 ${$} مشرف</span>
                <span style="color:${t.success}">✅ ${E} نشط</span>
                ${Y>0?`<span style="color:${t.accent}">❌ ${Y} بدون إرساليات</span>`:""}
                <span>📋 ${Q} استمارة</span>
                <span>📍 ${b}/${c.districts.size} مديرية</span>
                <span style="color:${I>=70?t.success:I>=40?t.warning:t.accent}">🎯 ${I}%</span>
              </div>
            </div>
          </div>
        `}).join("")}

      <!-- ═══ تفاصيل المحافظات ═══ -->
      ${[...k.values()].map(c=>{const $=c.allUsers.filter(I=>I.totalToday>0).length,E=c.allUsers.length,Y=c.allUsers.reduce((I,B)=>I+B.totalToday,0),Q=c.districts.size,b=[...c.districts.values()].filter(I=>I.some(B=>B.totalToday>0)).length;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(c.gov.name_ar)}</div>
                <div class="gov-stats">
                  ${E} مشرف | نشط: ${$} | بدون إرساليات: ${E-$} |
                  مديريات: ${b}/${Q}
                </div>
              </div>
              <div style="text-align:left;font-size:11px;">
                إجمالي الاستمارات: <strong>${Y}</strong>
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
                  ${c.govLevelUsers.map((I,B)=>f(I,B)).join("")}
                </tbody>
              </table>
            `:""}

            <!-- المديريات -->
            ${[...c.districts.entries()].sort((I,B)=>B[1].length-I[1].length).map(([I,B])=>{var ie;const W=((ie=B[0])==null?void 0:ie.distName)||"غير محدد",X=B.filter(de=>de.totalToday>0).length,H=B.reduce((de,ye)=>de+ye.totalToday,0);return`
                  <div class="dist-header">
                    <span>📍 ${L(W)}</span>
                    <span class="dist-count">${B.length} مشرف | نشط: ${X} | استمارات: ${H}</span>
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
                      ${B.sort((de,ye)=>(de.role==="district"?0:1)-(ye.role==="district"?0:1)||ye.totalToday-de.totalToday).map((de,ye)=>f(de,ye)).join("")}
                    </tbody>
                  </table>
                `}).join("")}
          </div>
        `}).join("")}

      ${Ce()}
    </body>
    </html>
  `,q=new Date().toISOString().split("T")[0];Me(w,`تقييم_أداء_المشرفين_الشامل_${q}`)}const Ya=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟"},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟"},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟"}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟"},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟"},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟"},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟"},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟"}]},{id:"records",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟"},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟"},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟"},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟"}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟"},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟"},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟"},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟"},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟"}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟"},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟"},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟"}]},{id:"supplies",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟"},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟"},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟"},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟"},{key:"scale",label:"هل يوجد ميزان؟"},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟"}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟"},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟"},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟"},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟"}]},{id:"catch_up",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟"},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟"},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟"},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟"},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟"}]},{id:"defaulter",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟"},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟"}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟"},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟"}]}],No=["تحدي","صعوب","مشكل","عائق","معوق"," challeng","difficult","problem"],Mo=["إجراء","اجراء","اتخذ","تدبير","خطوة","فعل","نفذ","action"],zo=["توصي","اقتراح","ينصح","propose","recommend"];function ua(e,r){if(!e||typeof e!="object")return null;for(const[l,n]of Object.entries(e))if(typeof n=="string"&&n.trim().length>2){for(const g of r)if(l.toLowerCase().includes(g.toLowerCase()))return n.trim()}if(e.data&&typeof e.data=="object"){for(const[l,n]of Object.entries(e.data))if(typeof n=="string"&&n.trim().length>2){for(const g of r)if(l.toLowerCase().includes(g.toLowerCase()))return n.trim()}}for(const[,l]of Object.entries(e))if(typeof l=="string"&&l.trim().length>20){for(const n of r)if(l.toLowerCase().includes(n.toLowerCase()))return l.trim()}return null}async function Po(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date().toISOString().split("T")[0],n=Le(new Date),g=await Ra(e);async function _(P){let ne=[],ce=0;for(;;){let le=U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).order("created_at",{ascending:!1}).range(ce,ce+1e3-1);P&&(le=le.eq("campaign_round",P));const{data:be,error:te}=await le;if(te){console.error("[MasterReport] yesNo fetch error:",te.message);break}if(!be||be.length===0||(ne.push(...be),be.length<1e3))break;ce+=1e3}return ne}async function N(P){let ne=[],ce=0;for(;;){let le=U.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).range(ce,ce+1e3-1);P&&(le=le.eq("campaign_round",P));const{data:be,error:te}=await le;if(te){console.error("[MasterReport] challenges fetch error:",te.message);break}if(!be||be.length===0||(ne.push(...be),be.length<1e3))break;ce+=1e3}return ne}let k=await _(r);k.length===0&&r&&(console.warn(`[MasterReport] No supervision data for round ${r}, retrying without round filter`),k=await _(null));let p=await N(r);p.length===0&&r&&(console.warn(`[MasterReport] No challenges data for round ${r}, retrying without round filter`),p=await N(null));const T={value:{data:k}},M={value:{data:p}},j=new Map;for(const P of g.govs)j.set(P.id,P.name_ar);const{enriched:F,govs:S,dists:z,subs:C,govGroups:D}=g,x=F.filter(P=>(P.role==="central"||P.role==="admin")&&P.govId),i=[...F.filter(P=>["governorate","district","data_entry"].includes(P.role)),...x];let u=D;if(e!=null&&e.governorateId&&e.governorateId!=="all"){const P=new Map,K=D.get(e.governorateId);K&&P.set(e.governorateId,K),u=P}const m=i.length,o=i.filter(P=>P.totalToday>0).length,y=i.filter(P=>P.totalToday===0&&!P.isGenSupervisor).length,v=i.filter(P=>P.isGenSupervisor).length,a=C.length,h=C.filter(P=>P.status==="submitted").length;C.filter(P=>P.status==="draft").length;const R=T.value.data||[],d=Ya.flatMap(P=>P.fields.map(K=>K.key)),f=new Map;for(const P of d)f.set(P,{yes:0,no:0,total:0});for(const P of R){const K=P.data||{};for(const ne of d){const ce=K[ne],le=f.get(ne);le&&(ce===!0||ce==="yes"||ce==="نعم"?(le.yes++,le.total++):(ce===!1||ce==="no"||ce==="لا")&&(le.no++,le.total++))}}const w=Ya.map(P=>{const K=P.fields.map(te=>{const xe=f.get(te.key)||{yes:0,no:0,total:0};return{...te,...xe,yesRate:xe.total>0?Math.round(xe.yes/xe.total*100):0}}),ne=K.reduce((te,xe)=>te+xe.yes,0),ce=K.reduce((te,xe)=>te+xe.no,0),le=ne+ce,be=le>0?Math.round(ne/le*100):0;return{...P,fields:K,totalYes:ne,totalNo:ce,total:le,avgRate:be}}),q=w.reduce((P,K)=>P+K.totalYes,0),c=w.reduce((P,K)=>P+K.totalNo,0),$=q+c,E=$>0?Math.round(q/$*100):0,Y=w.flatMap(P=>P.fields.filter(K=>K.total>0)),Q=[...Y].sort((P,K)=>K.yesRate-P.yesRate).slice(0,5),b=[...Y].sort((P,K)=>P.yesRate-K.yesRate).slice(0,5),I=M.value.data||[],B=await U.from("profiles").select("id, full_name").is("deleted_at",null),W=new Map;for(const P of B.data||[])W.set(P.id,P.full_name);const X=new Map;for(const P of I){const K=P.data||{},ne=ua(K,No),ce=ua(K,Mo),le=ua(K,zo);if(!ne&&!ce&&!le)continue;const be=P.governorate_id||"",te=j.get(be)||"غير محدد";X.has(be)||X.set(be,{govName:te,challenges:[],actions:[],recommendations:[],supervisorNames:new Set,count:0});const xe=X.get(be);xe.count++,ne&&xe.challenges.push(ne),ce&&xe.actions.push(ce),le&&xe.recommendations.push(le);const Qe=W.get(P.submitted_by||"");Qe&&xe.supervisorNames.add(Qe)}const H=[...X.values()].sort((P,K)=>K.count-P.count),ie=H.reduce((P,K)=>P+K.count,0),de=H.reduce((P,K)=>P+K.challenges.length,0),ye=H.reduce((P,K)=>P+K.actions.length,0),ke=H.reduce((P,K)=>P+K.recommendations.length,0);function Se(P){const K=P>=80?t.success:P>=60?t.warning:P>=40?"#FF9800":t.accent;return`
      <div style="display:flex;align-items:center;gap:4px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:6px;height:6px;overflow:hidden;">
          <div style="width:${P}%;height:100%;background:${K};border-radius:6px;"></div>
        </div>
        <span style="font-size:9px;font-weight:700;color:${K};min-width:28px;text-align:left;">${P}%</span>
      </div>
    `}function we(P,K){if(K.length===0)return"";const ne={challenges:{label:"تحديات",icon:"⚠️",color:"#E53935",bg:"#FFF5F5",border:"#FFCDD2"},actions:{label:"إجراءات",icon:"📋",color:"#1565C0",bg:"#E3F2FD",border:"#BBDEFB"},recommendations:{label:"توصيات",icon:"💡",color:"#2E7D32",bg:"#E8F5E9",border:"#C8E6C9"}}[P];return`
      <div style="margin:6px 0;">
        <div style="font-size:11px;font-weight:700;color:${ne.color};margin-bottom:4px;">${ne.icon} ${ne.label} (${K.length})</div>
        <div style="background:${ne.bg};border:1px solid ${ne.border};border-radius:8px;padding:8px 10px;">
          ${K.slice(0,5).map((ce,le)=>`
            <div style="font-size:10px;line-height:1.6;color:${t.textDark};${le>0?`border-top:1px solid ${ne.border};padding-top:4px;`:""}">
              ${le+1}. ${L(ce.length>150?ce.slice(0,150)+"...":ce)}
            </div>
          `).join("")}
          ${K.length>5?`<div style="font-size:9px;color:${t.textMuted};margin-top:4px;">... و ${K.length-5} نقطة أخرى</div>`:""}
        </div>
      </div>
    `}function ze(P,K){let ne;P.isGenSupervisor?ne='<span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">إشراف عام</span>':P.totalToday>0?ne=`<span style="background:#E8F5E9;color:${t.success};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">✅ ${P.totalToday}</span>`:ne='<span style="background:#FFEBEE;color:#E53935;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">❌ 0</span>';const ce=P.role==="central"||P.role==="admin"?"مركزي":P.role==="governorate"?"محافظة":P.role==="district"?"مديرية":"إدخال";return`
      <tr style="${P.totalToday===0&&!P.isGenSupervisor?"opacity:0.5;":""}">
        <td style="font-size:10px;text-align:center;">${K+1}</td>
        <td style="font-size:10px;font-weight:700;">${L(P.full_name||"—")}</td>
        <td style="font-size:10px;">${ce}</td>
        <td style="font-size:10px;">${L(P.distName||"—")}</td>
        <td style="font-size:10px;text-align:center;font-weight:700;">${P.totalToday}</td>
        <td style="font-size:10px;text-align:center;color:${t.success};">${P.submittedToday}</td>
        <td style="font-size:10px;text-align:center;">${ne}</td>
      </tr>
    `}const Je=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>التقرير الشامل للمشرفين — ${n}</title>
      ${Ne()}
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
      ${Ee("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات — تقرير مدمج"+Te(r),n)}

      <!-- ═══════════════════════════════════════════ -->
      <!-- KPIs الرئيسية -->
      <!-- ═══════════════════════════════════════════ -->
      ${V("📊","مؤشرات الأداء الرئيسية")}
      <div class="kpi-grid">
        ${A("إجمالي المشرفين",m,"👥",t.primary)}
        ${A("نشط (له استمارات)",o,"✅",t.success,`${m>0?Math.round(o/m*100):0}%`)}
        ${A("بدون إرساليات",y,"❌",t.accent)}
        ${A("إشراف عام",v,"🏛️","#1565C0")}
        ${A("إجمالي الاستمارات",a,"📋",t.info,`مرسلة: ${h}`)}
        ${A("نسبة نعم الكلية",`${E}%`,"🎯",E>=70?t.success:t.warning,`${q}/${$}`)}
        ${A("تحديات ميدانية",ie,"⚠️","#E53935",`${de} نقطة`)}
      </div>

      <!-- ═══════════════════════════════════════════ -->
      <!-- القسم 1: تقييم أداء المشرفين -->
      <!-- ═══════════════════════════════════════════ -->
      <div class="master-section">
        <div class="master-section-header">
          <div class="master-section-title">📋 القسم 1: تقييم أداء المشرفين الشامل</div>
          <div class="master-section-badge">${m} مشرف | ${a} استمارة</div>
        </div>
        <div class="master-section-body">
          <!-- نسب الإشراف -->
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${(()=>{const P=Math.max(m-v,1),K=Math.round(o/P*100);return A("نسبة النشاط",`${K}%`,"🎯",K>=70?t.success:K>=40?t.warning:t.accent)})()}
            ${(()=>{const P=new Set(i.map(ne=>ne.govId).filter(Boolean)).size,K=S.length>0?Math.round(P/S.length*100):0;return A("تغطية المحافظات",`${K}%`,"🏛️",K>=80?t.success:t.warning,`${P}/${S.length}`)})()}
            ${(()=>{const P=new Set(i.filter(ne=>ne.role==="district"||ne.role==="data_entry").map(ne=>ne.district_id).filter(Boolean)).size,K=z.length>0?Math.round(P/z.length*100):0;return A("تغطية المديريات",`${K}%`,"📍",K>=80?t.success:t.warning,`${P}/${z.length}`)})()}
            ${(()=>{const P=a>0?Math.round(h/a*100):0;return A("نسبة الإرسال",`${P}%`,"📤",P>=80?t.success:t.warning)})()}
          </div>

          <!-- ملخص المحافظات -->
          ${ue(["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],[...u.values()].map(P=>{const K=P.allUsers.filter(xe=>xe.totalToday>0&&!xe.isGenSupervisor).length,ne=P.allUsers.filter(xe=>xe.totalToday===0&&!xe.isGenSupervisor).length,ce=P.allUsers.filter(xe=>xe.isGenSupervisor).length,le=P.allUsers.reduce((xe,Qe)=>xe+Qe.totalToday,0),be=P.allUsers.length,te=be>0?Math.round(K/Math.max(be-ce,1)*100):0;return[L(P.gov.name_ar),`${be}`,`<span style="color:${t.success};font-weight:700">${K}</span>`,`<span style="color:${ne>0?t.accent:t.textMuted}">${ne}</span>`,`${le}`,`<span style="color:${te>=70?t.success:te>=40?t.warning:t.accent};font-weight:700">${te}%</span>`]}))}

          <!-- تفاصيل المحافظات -->
          ${[...u.values()].map(P=>{const K=P.allUsers.filter(le=>le.totalToday>0).length,ne=P.allUsers.length,ce=P.allUsers.reduce((le,be)=>le+be.totalToday,0);return`
              <div style="margin-top:14px;page-break-inside:avoid;">
                <div style="background:linear-gradient(135deg,${t.primary},${t.primaryDark});color:white;padding:10px 14px;border-radius:8px;display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                  <div>
                    <div style="font-size:14px;font-weight:800;">🏛️ ${L(P.gov.name_ar)}</div>
                    <div style="font-size:10px;opacity:0.9;">${ne} مشرف | نشط: ${K} | استمارات: ${ce}</div>
                  </div>
                </div>
                ${P.allUsers.length>0?`
                  <table class="data-table" style="font-size:10px;">
                    <thead><tr><th>#</th><th>الاسم</th><th>الصفة</th><th>المديرية</th><th>استمارات</th><th>مرسلة</th><th>الحالة</th></tr></thead>
                    <tbody>
                      ${P.allUsers.sort((le,be)=>(le.isGenSupervisor?0:1)-(be.isGenSupervisor?0:1)||be.totalToday-le.totalToday).map((le,be)=>ze(le,be)).join("")}
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
          <div class="master-section-badge">${R.length} استمارة | ${E}% نعم</div>
        </div>
        <div class="master-section-body">
          <!-- أفضل وأسوأ حقول -->
          <div class="top-bottom-grid">
            <div class="top-bottom-card" style="border-top:3px solid ${t.success};">
              <div style="font-size:11px;font-weight:800;color:${t.success};margin-bottom:6px;">✅ أعلى 5 حقول</div>
              ${Q.map((P,K)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${K+1}.</span>
                  <span style="flex:1;">${L(P.label)}</span>
                  <span style="font-weight:800;color:${t.success};">${P.yesRate}%</span>
                </div>
              `).join("")}
            </div>
            <div class="top-bottom-card" style="border-top:3px solid ${t.accent};">
              <div style="font-size:11px;font-weight:800;color:${t.accent};margin-bottom:6px;">❌ أقل 5 حقول</div>
              ${b.map((P,K)=>`
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;">
                  <span style="color:#999;font-weight:700;">${K+1}.</span>
                  <span style="flex:1;">${L(P.label)}</span>
                  <span style="font-weight:800;color:${t.accent};">${P.yesRate}%</span>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- ملخص الأقسام -->
          ${ue(["القسم","الحقول","النسبة","التقييم"],w.map(P=>{const K=P.avgRate>=80?"ممتاز ✅":P.avgRate>=60?"جيد 👍":P.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",ne=P.avgRate>=80?t.success:P.avgRate>=60?"#FF9800":P.avgRate>=40?t.warning:t.accent;return[`${P.icon} ${L(P.title)}`,`${P.fields.length}`,`<span style="color:${ne};font-weight:800;">${P.avgRate}%</span>`,`<span style="color:${ne};font-weight:700;">${K}</span>`]}))}

          <!-- تفاصيل الأقسام -->
          ${w.map(P=>`
            <div class="yesno-section-card">
              <div class="yesno-section-header">
                <span style="font-size:12px;font-weight:800;color:${t.primaryDark};">${P.icon} ${L(P.title)}</span>
                <span style="font-size:14px;font-weight:900;color:${P.avgRate>=70?t.success:P.avgRate>=50?t.warning:t.accent};">${P.avgRate}%</span>
              </div>
              ${P.fields.map(K=>`
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
          <div class="master-section-badge">${ie} استمارة | ${de} تحدي</div>
        </div>
        <div class="master-section-body">
          <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);">
            ${A("استمارات مُعبأة",ie,"📋",t.primary)}
            ${A("تحديات",de,"⚠️","#E53935")}
            ${A("إجراءات",ye,"📋","#1565C0")}
            ${A("توصيات",ke,"💡","#2E7D32")}
          </div>

          ${H.length===0?`
            <div style="text-align:center;padding:20px;color:${t.textMuted};font-size:12px;">لا توجد تحديات مُسجّلة</div>
          `:""}

          ${H.map(P=>`
            <div class="challenge-card">
              <div class="challenge-header">
                <div>
                  <div style="font-size:13px;font-weight:800;color:${t.primaryDark};">🏛️ ${L(P.govName)}</div>
                  <div style="font-size:10px;color:${t.textMuted};">📝 ${P.count} استمارة | 👥 ${P.supervisorNames.size} مشرف</div>
                </div>
                <div style="display:flex;gap:8px;font-size:10px;">
                  <span style="background:#FFF5F5;color:#E53935;padding:2px 8px;border-radius:8px;">⚠️ ${P.challenges.length}</span>
                  <span style="background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;">📋 ${P.actions.length}</span>
                  <span style="background:#E8F5E9;color:#2E7D32;padding:2px 8px;border-radius:8px;">💡 ${P.recommendations.length}</span>
                </div>
              </div>
              <div style="padding:10px 14px;">
                ${we("challenges",P.challenges)}
                ${we("actions",P.actions)}
                ${we("recommendations",P.recommendations)}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      ${Ce()}
    </body>
    </html>
  `;Me(Je,`التقرير_الشامل_المشرفين_${l}`)}const pa="🏛️";async function Io(e){const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=await cs(e),{enriched:n,govs:g,targetDate:_,dayName:N,dateArabic:k}=l,p=n.filter(d=>d.isGenSupervisor);let T=p,M=g;e!=null&&e.governorateId&&e.governorateId!=="all"&&(M=g.filter(d=>d.id===e.governorateId),T=p.filter(d=>d.govId===e.governorateId));const j=new Map;for(const d of T){const f=d.govId||"_no_gov";j.has(f)||j.set(f,{govName:d.govName||"غير محدد",govId:d.govId,users:[]}),j.get(f).users.push(d)}const F=T.filter(d=>!d.govId);T.filter(d=>d.govId);const S=T.length,z=T.filter(d=>d.totalToday>0).length,C=T.filter(d=>d.totalToday===0).length,D=T.reduce((d,f)=>d+f.totalToday,0),x=T.reduce((d,f)=>d+f.submittedToday,0),i=T.reduce((d,f)=>d+f.draftToday,0),u=[...j.values()].filter(d=>d.users.some(f=>f.totalToday>0)).length,m=S>0?Math.round(z/S*100):0,o=T.filter(d=>d.totalToday>=5).length,y=T.filter(d=>d.totalToday>=2&&d.totalToday<5).length,v=T.filter(d=>d.totalToday===1).length,a=T.filter(d=>d.totalToday===0).length;function h(d,f){let w;d.totalToday===0?w='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?w='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?w='<span class="perf-badge perf-good">✅ جيد</span>':w='<span class="perf-badge perf-weak">⚠️ ضعيف</span>';const q=d.totalToday>0?Math.round(d.submittedToday/d.totalToday*100):0;return`
      <tr class="${d.totalToday===0?"row-inactive":""}">
        <td class="num">${f+1}</td>
        <td>
          <div class="user-name">${pa} ${L(d.full_name||"—")}</div>
        </td>
        <td>${L(d.govName||"—")}</td>
        <td class="num">${d.totalToday}</td>
        <td class="num num-success">${d.submittedToday}</td>
        <td class="num num-warning">${d.draftToday}</td>
        <td class="num" style="color:${q>=80?t.success:q>=50?t.warning:t.accent};font-weight:700">${q}%</td>
        <td>${w}</td>
      </tr>
    `}const R=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقييم إشراف عام — ${k}</title>
      ${Ne()}
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
      ${Ee("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي"+Te(r),`${N} — ${k}`)}

      <!-- ═══ Day Banner ═══ -->
      <div class="day-banner">
        <div class="day-name">📅 ${N} — ${k}</div>
        <div class="day-date">تقرير تقييم إشراف عام — المشرفين العامين</div>
      </div>

      <!-- ═══ ملخص اليوم ═══ -->
      ${V("📊","ملخص اليوم")}
      <div class="kpi-grid">
        ${A("إجمالي إشراف عام",S,"🏛️","#1565C0")}
        ${A("نشط اليوم",z,"✅",t.success,`${m}%`)}
        ${A("غير نشط",C,"❌",t.accent,`${S>0?Math.round(C/S*100):0}%`)}
        ${A("محافظات مغطاة",`${u}/${M.length}`,"📍",t.info)}
        ${A("إجمالي الاستمارات",D,"📋",t.info,`مرسلة: ${x} | مسودة: ${i}`)}
      </div>

      <!-- ═══ توزيع مستوى الأداء ═══ -->
      ${V("📈","توزيع مستوى الأداء")}
      <div class="perf-grid">
        <div class="perf-card excellent">
          <div class="perf-value" style="color:#1B5E20">${o}</div>
          <div class="perf-label">⭐ ممتاز</div>
          <div class="perf-sub">5+ استمارات</div>
        </div>
        <div class="perf-card good">
          <div class="perf-value" style="color:#0D47A1">${y}</div>
          <div class="perf-label">✅ جيد</div>
          <div class="perf-sub">2-4 استمارات</div>
        </div>
        <div class="perf-card weak">
          <div class="perf-value" style="color:#E65100">${v}</div>
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
        <span class="summary-chip chip-total">👥 إجمالي: ${S}</span>
        <span class="summary-chip chip-active">✅ نشط: ${z}</span>
        <span class="summary-chip chip-inactive">❌ غير نشط: ${C}</span>
        <span class="summary-chip chip-excellent">⭐ ممتاز: ${o}</span>
        <span class="summary-chip chip-good">✅ جيد: ${y}</span>
        <span class="summary-chip chip-weak">⚠️ ضعيف: ${v}</span>
      </div>

      <!-- ═══ ملخص المحافظات ═══ -->
      ${j.size>0?`
        ${V("📊","ملخص المحافظات")}
        ${ue(["المحافظة","إشراف عام","نشط","غير نشط","الاستمارات","نسبة النشاط"],[...j.values()].filter(d=>d.govId).map(d=>{const f=d.users.filter($=>$.totalToday>0).length,w=d.users.filter($=>$.totalToday===0).length,q=d.users.reduce(($,E)=>$+E.totalToday,0),c=d.users.length>0?Math.round(f/d.users.length*100):0;return[L(d.govName),`${d.users.length}`,`<span style="color:${t.success};font-weight:700">${f}</span>`,`<span style="color:${w>0?t.accent:t.textMuted}">${w}</span>`,`${q}`,`<span style="color:${c>=70?t.success:c>=40?t.warning:t.accent};font-weight:700">${c}%</span>`]}))}
      `:""}

      <!-- ═══ ترتيب المشرفين العامين ═══ -->
      ${T.length>0?`
        ${V("🏆","ترتيب المشرفين العامين")}
        <table class="data-table ranking-table">
          <thead>
            <tr><th>الترتيب</th><th>الاسم</th><th>المحافظة</th><th>الاستمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
          </thead>
          <tbody>
            ${[...T].sort((d,f)=>f.totalToday-d.totalToday).map((d,f)=>{const w=f===0?"rank-gold":f===1?"rank-silver":f===2?"rank-bronze":"",q=f===0?"🥇":f===1?"🥈":f===2?"🥉":`${f+1}`,c=d.totalToday>0?Math.round(d.submittedToday/d.totalToday*100):0;let $;return d.totalToday===0?$='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?$='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?$='<span class="perf-badge perf-good">✅ جيد</span>':$='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                  <tr class="${w} ${d.totalToday===0?"row-inactive":""}">
                    <td class="num" style="font-size:14px;font-weight:900">${q}</td>
                    <td><div class="user-name">${pa} ${L(d.full_name||"—")}</div></td>
                    <td>${L(d.govName||"—")}</td>
                    <td class="num" style="font-weight:800;font-size:13px">${d.totalToday}</td>
                    <td class="num num-success">${d.submittedToday}</td>
                    <td class="num num-warning">${d.draftToday}</td>
                    <td class="num" style="color:${c>=80?t.success:c>=50?t.warning:t.accent};font-weight:700">${c}%</td>
                    <td>${$}</td>
                  </tr>
                `}).join("")}
          </tbody>
        </table>
      `:""}

      <!-- ═══ تفاصيل حسب المحافظة ═══ -->
      ${[...j.values()].filter(d=>d.govId).map(d=>{const f=d.users.filter(c=>c.totalToday>0).length,w=d.users.reduce((c,$)=>c+$.totalToday,0),q=d.users.length>0?Math.round(f/d.users.length*100):0;return`
          <div class="gov-section">
            <div class="gov-header">
              <div>
                <div class="gov-name">🏛️ ${L(d.govName)}</div>
                <div class="gov-stats">${d.users.length} إشراف عام | نشط: ${f} | غير نشط: ${d.users.length-f}</div>
              </div>
              <div style="text-align:left;font-size:11px;">
                استمارات اليوم: <strong>${w}</strong> | نسبة النشاط: <strong style="color:${q>=70?"#A5D6A7":q>=40?"#FFE082":"#EF9A9A"}">${q}%</strong>
              </div>
            </div>

            ${d.users.length===0?'<div class="no-data-msg">لا يوجد مشرفين عامين في هذه المحافظة</div>':`
              <table class="data-table">
                <thead>
                  <tr><th>#</th><th>الاسم</th><th>المحافظة</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>نسبة الإرسال</th><th>التقييم</th></tr>
                </thead>
                <tbody>
                  ${d.users.sort((c,$)=>$.totalToday-c.totalToday).map((c,$)=>h(c,$)).join("")}
                </tbody>
              </table>
            `}
          </div>
        `}).join("")}

      <!-- ═══ المشرفون العامون بدون محافظة ═══ -->
      ${F.length>0?`
        <div class="no-gov-section">
          <div class="no-gov-title">⚠️ إشراف عام بدون محافظة مسجّلة (${F.length})</div>
          <table class="data-table">
            <thead>
              <tr><th>#</th><th>الاسم</th><th>استمارات</th><th>مرسلة</th><th>مسودة</th><th>التقييم</th></tr>
            </thead>
            <tbody>
              ${F.sort((d,f)=>f.totalToday-d.totalToday).map((d,f)=>{let w;return d.totalToday===0?w='<span class="perf-badge perf-inactive">❌ غير نشط</span>':d.totalToday>=5?w='<span class="perf-badge perf-excellent">⭐ ممتاز</span>':d.totalToday>=2?w='<span class="perf-badge perf-good">✅ جيد</span>':w='<span class="perf-badge perf-weak">⚠️ ضعيف</span>',`
                    <tr class="${d.totalToday===0?"row-inactive":""}">
                      <td class="num">${f+1}</td>
                      <td><div class="user-name">${pa} ${L(d.full_name||"—")}</div></td>
                      <td class="num">${d.totalToday}</td>
                      <td class="num num-success">${d.submittedToday}</td>
                      <td class="num num-warning">${d.draftToday}</td>
                      <td>${w}</td>
                    </tr>
                  `}).join("")}
            </tbody>
          </table>
        </div>
      `:""}

      ${Ce()}
    </body>
    </html>
  `;Me(R,`تقييم_إشراف_عام_${_}`)}const bt=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:[{key:"has_activity_plan",label:"هل لدى الفريق خريطة القرى المستهدفة؟",required:!0},{key:"has_doctor_or_trained",label:"هل أحد أعضاء الفريق طبيب أو فني مدرب؟",required:!0},{key:"wearing_uniform",label:"هل يلتزم الفريق بلبس الزي (البالطو)؟",required:!0}]},{id:"work_environment",title:"بيئة العمل والتنسيق",icon:"🏢",fields:[{key:"suitable_location",label:"هل المكان مناسب ويضمن الخصوصية؟",required:!0},{key:"community_coordination",label:"هل تم التنسيق المسبق مع المجتمع؟",required:!0},{key:"has_speaker",label:"هل يتوفر مكبر صوت؟",required:!0},{key:"has_transport",label:"هل توجد وسيلة نقل مناسبة؟",required:!0},{key:"previous_visit",label:"هل تمت زيارة من المستوى الأعلى سابقاً؟",required:!0}]},{id:"records_and_docs",title:"السجلات والوثائق",icon:"📁",fields:[{key:"complete_records",label:"هل السجلات مكتملة حسب الخدمة؟",required:!0},{key:"daily_work_forms",label:"هل توجد استمارات العمل اليومي؟",required:!0},{key:"correct_data_entry",label:"هل يتم تدوين البيانات بشكل صحيح؟",required:!0},{key:"next_visit_noted",label:"هل يتم تدوين العودة للزيارة القادمة؟",required:!0}]},{id:"vaccination_cards",title:"بطاقات التحصين",icon:"💉",fields:[{key:"child_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للأطفال؟",required:!0},{key:"women_vaccination_cards",label:"هل يتم صرف بطاقة تحصين للنساء؟",required:!0}]},{id:"service_quality",title:"جودة الخدمة",icon:"⭐",fields:[{key:"good_acceptance",label:"هل يوجد إقبال جيد على الخدمة؟",required:!0},{key:"safe_vaccination",label:"هل يتم ممارسة التطعيم الآمن؟",required:!0},{key:"respiratory_rate_check",label:"هل يتم احتساب سرعة التنفس للأطفال؟",required:!1},{key:"muac_measurement",label:"هل يتم قياس محيط الذراع؟",required:!1},{key:"ors_provision",label:"هل يتم إعطاء محلول الإرواء؟",required:!1},{key:"clean_delivery_kit",label:"هل يتم تزويد الحوامل بعلبة الولادة النظيفة؟",required:!1},{key:"nutrition_assessment",label:"هل يتم تقييم مشاكل التغذية؟",required:!1}]},{id:"vitamins_and_referral",title:"الفيتامينات والإحالة",icon:"💊",fields:[{key:"vitamin_a_children",label:"هل يُعطي فيتامين أ للأطفال؟",required:!1},{key:"vitamin_a_women",label:"هل يُعطي فيتامين أ للنساء؟",required:!1},{key:"facility_referral",label:"هل يتم الإحالة للمرفق الصحي؟",required:!1},{key:"correct_medication",label:"هل يتم إعطاء الأدوية بطريقة سليمة؟",required:!1},{key:"nutrition_counseling",label:"هل يتم النصح والإرشاد الغذائي؟",required:!1}]},{id:"vaccine_handling",title:"التعامل مع اللقاحات",icon:"🧊",fields:[{key:"vaccine_disposal",label:"هل يتم التخلص من اللقاحات الممزوجة في الوقت المحدد؟",required:!0},{key:"safety_box_usage",label:"هل يتم استخدام صندوق الأمان بصورة صحيحة؟",required:!0},{key:"cold_chain_proper",label:"هل اللقاحات محفوظة بطريقة سليمة؟",required:!0}]},{id:"supplies_equipment",title:"الإمدادات والمعدات",icon:"📦",fields:[{key:"family_planning_available",label:"هل توفر وسائل تنظيم الأسرة؟",required:!0},{key:"folic_iron_stock",label:"هل إمداد حمض الفوليك والحديد كافٍ؟",required:!0},{key:"fetal_stethoscope",label:"هل توجد سماعة جنين؟",required:!0},{key:"bp_device",label:"هل يتوفر جهاز ضغط الدم؟",required:!0},{key:"muac_tape",label:"هل يوجد شريط قياس محيط الذراع؟",required:!0},{key:"height_board",label:"هل يوجد شريط قياس الطول؟",required:!0},{key:"thermometer",label:"هل يوجد ترمومتر؟",required:!0},{key:"scale",label:"هل يوجد ميزان؟",required:!0},{key:"daily_supply_tracking",label:"هل يتم تدوين حركة الإمداد يومياً؟",required:!0}]},{id:"shortages",title:"العجز في الإمدادات",icon:"⚠️",fields:[{key:"has_immunization_shortage",label:"هل هناك عجز في إمدادات التحصين؟",required:!0},{key:"has_reproductive_shortage",label:"هل هناك عجز في إمدادات الصحة الإنجابية؟",required:!0},{key:"has_child_health_shortage",label:"هل هناك عجز في إمدادات صحة الطفل؟",required:!0},{key:"has_nutrition_shortage",label:"هل هناك عجز في إمدادات التغذية؟",required:!0}]},{id:"catch_up_policy",title:"سياسة الإحاق بالركب",icon:"🔄",fields:[{key:"has_vaccine_carrier",label:"هل لدى المطعم حافظة لقاح مبردة؟",required:!0},{key:"vaccines_sufficient",label:"هل اللقاحات كافية لجلسة التطعيم؟",required:!0},{key:"correct_vaccine_site",label:"هل يتم إعطاء اللقاح في الموضع الصحيح؟",required:!0},{key:"catch_up_knowledge",label:"هل لدى العاملين معرفة بسياسة الإحاق بالركب؟",required:!0},{key:"catch_up_training",label:"هل تلقى العاملون التدريب الكافي؟",required:!0},{key:"catch_up_2to5_registration",label:"هل يتم تطعيم أطفال 2-5 سنوات وتسجيلهم؟",required:!0},{key:"team_target_knowledge",label:"هل لدى الفريق معرفة بالمستهدفين؟",required:!0}]},{id:"defaulter_tracking",title:"تتبع المتخلفين",icon:"🔍",fields:[{key:"has_defaulter_mechanism",label:"هل توجد آليات تتبع المتخلفين؟",required:!0},{key:"has_previous_vaccination_records",label:"هل يوجد سجل تحصين سابق للمتابعة؟",required:!0}]},{id:"aefi",title:"الآثار الجانبية",icon:"🚨",fields:[{key:"aefi_knowledge",label:"هل لدى العامل معرفة بالآثار الجانبية؟",required:!0},{key:"aefi_mothers_info",label:"هل يتم تقديم معلومات للأمهات عن الآثار الجانبية؟",required:!0}]}];async function Ao(e){var q;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date().toISOString().split("T")[0],n=(e==null?void 0:e.dateFrom)||l,g=(e==null?void 0:e.dateTo)||l,_=`${n}T00:00:00`,N=`${g}T23:59:59`;async function k(c){let E=[],Y=0;for(;;){let Q=U.from("form_submissions").select("id, data, governorate_id, submitted_by, created_at").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").is("deleted_at",null).eq("status","submitted").gte("created_at",_).lte("created_at",N).order("created_at",{ascending:!1}).range(Y,Y+1e3-1);e!=null&&e.governorateId&&e.governorateId!=="all"&&(Q=Q.eq("governorate_id",e.governorateId)),c&&(Q=Q.eq("campaign_round",c));const{data:b,error:I}=await Q;if(I){console.error("[YesNoReport] fetch error:",I.message);break}if(!b||b.length===0||(E.push(...b),b.length<1e3))break;Y+=1e3}return E}let p=await k(r);p.length===0&&r&&(console.warn(`[YesNoReport] No data for round ${r}, retrying without round filter`),p=await k(null));const T={data:p},M=await U.from("profiles").select("id, full_name, role").is("deleted_at",null),j=new Map;for(const c of M.data||[])j.set(c.id,{name:c.full_name,role:c.role});const F=await U.from("governorates").select("id, name_ar").eq("is_active",!0).is("deleted_at",null),S=new Map;for(const c of F.data||[])S.set(c.id,c.name_ar);const z=T.data.map(c=>({...c,profiles:j.get(c.submitted_by)||null,governorates:c.governorate_id?{name_ar:S.get(c.governorate_id)||"غير محدد"}:null})),C=z.length,D=bt.flatMap(c=>c.fields.map($=>$.key)),x=new Map;for(const c of bt)for(const $ of c.fields)x.set($.key,{yes:0,no:0,total:0,label:$.label,sectionId:c.id});const i=new Map;for(const c of z){const $=c.data||{},E=((q=c.governorates)==null?void 0:q.name_ar)||"غير محدد";if(!i.has(E)){i.set(E,new Map);for(const Y of D)i.get(E).set(Y,{yes:0,no:0,total:0})}for(const Y of D){const Q=$[Y],b=x.get(Y);b&&(Q===!0||Q==="yes"||Q==="نعم"?(b.yes++,b.total++,i.get(E).get(Y).yes++,i.get(E).get(Y).total++):(Q===!1||Q==="no"||Q==="لا")&&(b.no++,b.total++,i.get(E).get(Y).no++,i.get(E).get(Y).total++))}}const u=bt.map(c=>{const $=c.fields.map(I=>({...I,...x.get(I.key),yesRate:x.get(I.key).total>0?Math.round(x.get(I.key).yes/x.get(I.key).total*100):0})),E=$.reduce((I,B)=>I+B.yes,0),Y=$.reduce((I,B)=>I+B.no,0),Q=E+Y,b=Q>0?Math.round(E/Q*100):0;return{...c,fields:$,totalYes:E,totalNo:Y,total:Q,avgRate:b}}),m=u.reduce((c,$)=>c+$.totalYes,0),o=u.reduce((c,$)=>c+$.totalNo,0),y=m+o,v=y>0?Math.round(m/y*100):0,a=u.flatMap(c=>c.fields.filter($=>$.total>0)),h=[...a].sort((c,$)=>$.yesRate-c.yesRate).slice(0,5),R=[...a].sort((c,$)=>c.yesRate-$.yesRate).slice(0,5),d=n===g?Le(new Date(n)):`${Le(new Date(n))} — ${Le(new Date(g))}`;function f(c,$="sm"){const E=c>=80?t.success:c>=60?t.warning:c>=40?"#FF9800":t.accent,Y=$==="lg"?"14px":"8px";return`
      <div style="display:flex;align-items:center;gap:6px;width:100%;">
        <div style="flex:1;background:#E0E0E0;border-radius:${Y};height:${Y};overflow:hidden;">
          <div style="width:${c}%;height:100%;background:${E};border-radius:${Y};transition:width 0.3s;"></div>
        </div>
        <span style="font-size:${$==="lg"?"11px":"9px"};font-weight:700;color:${E};min-width:35px;text-align:left;">${c}%</span>
      </div>
    `}const w=`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تحليل حقول نعم/لا — ${d}</title>
      ${Ne()}
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
      ${Ee("تحليل حقول نعم/لا","استمارة الاشراف للنشاط الايصالي التكاملي"+Te(r),d)}

      <!-- ═══ KPIs ═══ -->
      ${V("📊","ملخص التحليل")}
      <div class="kpi-grid">
        ${A("إجمالي الاستمارات",C,"📋",t.primary)}
        ${A("نسبة نعم الكلية",`${v}%`,"✅",v>=70?t.success:v>=50?t.warning:t.accent,`${m}/${y}`)}
        ${A("نسبة لا الكلية",`${100-v}%`,"❌",t.accent,`${o}/${y}`)}
        ${A("عدد الأقسام",bt.length,"📑",t.info)}
        ${A("عدد الحقول",D.length,"📝","#6366f1")}
      </div>

      <!-- ═══ أفضل وأسوأ 5 حقول ═══ -->
      <div class="top-bottom-grid">
        <div class="top-bottom-card" style="border-top: 4px solid ${t.success};">
          <div class="top-bottom-title" style="color:${t.success};">✅ أعلى 5 حقول (نعم)</div>
          ${h.map((c,$)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${$+1}.</span>
              <span class="top-item-label">${L(c.label)}</span>
              <span class="top-item-rate" style="color:${t.success};">${c.yesRate}%</span>
            </div>
          `).join("")}
        </div>
        <div class="top-bottom-card" style="border-top: 4px solid ${t.accent};">
          <div class="top-bottom-title" style="color:${t.accent};">❌ أقل 5 حقول (نعم)</div>
          ${R.map((c,$)=>`
            <div class="top-item">
              <span style="color:${t.textMuted};font-weight:700;">${$+1}.</span>
              <span class="top-item-label">${L(c.label)}</span>
              <span class="top-item-rate" style="color:${t.accent};">${c.yesRate}%</span>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- ═══ تفصيل حسب القسم ═══ -->
      ${V("📑","تحليل حسب القسم")}
      ${u.map(c=>`
        <div class="section-card">
          <div class="section-card-header">
            <div class="section-card-title">${c.icon} ${L(c.title)} (${c.fields.length} حقل)</div>
            <div class="section-card-rate" style="color:${c.avgRate>=70?t.success:c.avgRate>=50?t.warning:t.accent};">${c.avgRate}%</div>
          </div>
          ${c.fields.map($=>{const E=$.yesRate;return`
              <div class="field-row">
                <div class="field-label">${L($.label)}</div>
                <div style="flex:1.5;">${f(E)}</div>
                <div class="field-stats">
                  <span class="stat-yes">✓ ${$.yes}</span>
                  <span class="stat-no">✗ ${$.no}</span>
                  <span class="stat-total">(${$.total})</span>
                </div>
              </div>
            `}).join("")}
        </div>
      `).join("")}

      <!-- ═══ ملخص حسب المحافظة ═══ -->
      ${V("🏛️","ملخص حسب المحافظة")}
      <div class="gov-table-wrap">
        ${ue(["المحافظة","الاستمارات","نسبة نعم الكلية",...bt.slice(0,6).map(c=>c.icon+" "+c.title.slice(0,8))],[...i.entries()].map(([c,$])=>{const E=z.filter(B=>{var W;return((W=B.governorates)==null?void 0:W.name_ar)===c}).length;let Y=0,Q=0;for(const[,B]of $)Y+=B.yes,Q+=B.total;const b=Q>0?Math.round(Y/Q*100):0,I=bt.slice(0,6).map(B=>{let W=0,X=0;for(const ie of B.fields){const de=$.get(ie.key);de&&(W+=de.yes,X+=de.total)}const H=X>0?Math.round(W/X*100):0;return`<span style="color:${H>=70?t.success:H>=50?t.warning:t.accent};font-weight:700;">${H}%</span>`});return[L(c),`${E}`,`<span style="color:${b>=70?t.success:b>=50?t.warning:t.accent};font-weight:800;font-size:12px;">${b}%</span>`,...I]}))}
      </div>

      <!-- ═══ ملخص حسب القسم ═══ -->
      ${V("📈","مقارنة الأقسام")}
      ${ue(["القسم","الحقول","نعم","لا","المجموع","النسبة","التقييم"],u.map(c=>{const $=c.avgRate>=80?"ممتاز ✅":c.avgRate>=60?"جيد 👍":c.avgRate>=40?"متوسط ⚠️":"ضعيف ❌",E=c.avgRate>=80?t.success:c.avgRate>=60?"#FF9800":c.avgRate>=40?t.warning:t.accent;return[`${c.icon} ${L(c.title)}`,`${c.fields.length}`,`<span style="color:${t.success};font-weight:700;">${c.totalYes}</span>`,`<span style="color:${t.accent};font-weight:700;">${c.totalNo}</span>`,`${c.total}`,`<span style="color:${E};font-weight:800;">${c.avgRate}%</span>`,`<span style="color:${E};font-weight:700;">${$}</span>`]}))}

      ${Ce()}
    </body>
    </html>
  `;Me(w,`تحليل_نعم_لا_${n}_${g}`)}const Lo={عدن:{center:[12.78,45.02],zoom:11},تعز:{center:[13.58,44.02],zoom:11},الحديدة:{center:[14.8,42.95],zoom:11},البيضاء:{center:[13.98,45.57],zoom:11},مأرب:{center:[15.47,45.33],zoom:10},الجوف:{center:[16.78,45.58],zoom:10},حجة:{center:[15.69,43.6],zoom:10},أبين:{center:[13.43,45.37],zoom:11},لحج:{center:[13.05,44.88],zoom:11},شبوة:{center:[14.88,46.83],zoom:10},المهرة:{center:[15.8,51.5],zoom:9},المكلا:{center:[14.53,49.13],zoom:11},سيئون:{center:[15.97,48.78],zoom:10},الضالع:{center:[13.7,44.73],zoom:11},سقطرى:{center:[12.47,53.87],zoom:9},حضرموت:{center:[15.4,49],zoom:9}};async function Go(e){var D;const r=e!=null&&e.campaignRound&&e.campaignRound>0?e.campaignRound:null,l=new Date().toISOString().split("T")[0],n=(e==null?void 0:e.dateFrom)||l,g=(e==null?void 0:e.dateTo)||l;async function _(){const x=await xr(e==null?void 0:e.campaignType),i=[];let u=0;const m=1e3;for(;;){let o=U.from("form_submissions").select(`
          id, gps_lat, gps_lng, created_at, status, data,
          forms(title_ar, campaign_type),
          profiles:submitted_by(full_name, role),
          governorates(name_ar),
          districts(name_ar)
        `).is("deleted_at",null).not("gps_lat","is",null).not("gps_lng","is",null).gte("created_at",`${n}T00:00:00`).lte("created_at",`${g}T23:59:59`).order("created_at",{ascending:!1}).range(u,u+m-1);x&&x.length>0&&(o=o.in("form_id",x)),e!=null&&e.governorateId&&e.governorateId!=="all"&&(o=o.eq("governorate_id",e.governorateId)),r&&(o=o.eq("campaign_round",r));const{data:y,error:v}=await o;if(v||!y||y.length===0||(i.push(...y),y.length<m)||(u+=m,i.length>=1e5))break}return i}const k=(await _()||[]).filter(x=>x.gps_lat&&x.gps_lng&&typeof x.gps_lat=="number"&&typeof x.gps_lng=="number"&&x.gps_lat!==0&&x.gps_lng!==0),p=new Map;for(const x of k){const i=((D=x.governorates)==null?void 0:D.name_ar)||"غير محدد";p.has(i)||p.set(i,[]),p.get(i).push(x)}const T=k.map(x=>{var i,u,m,o;return{lat:x.gps_lat,lng:x.gps_lng,name:((i=x.profiles)==null?void 0:i.full_name)||"—",role:((u=x.profiles)==null?void 0:u.role)||"",gov:((m=x.governorates)==null?void 0:m.name_ar)||"",dist:((o=x.districts)==null?void 0:o.name_ar)||"",date:x.created_at,status:x.status}}),M={};for(const[x,i]of p)M[x]=i.map(u=>{var m,o,y,v;return{lat:u.gps_lat,lng:u.gps_lng,name:((m=u.profiles)==null?void 0:m.full_name)||"—",role:((o=u.profiles)==null?void 0:o.role)||"",gov:((y=u.governorates)==null?void 0:y.name_ar)||"",dist:((v=u.districts)==null?void 0:v.name_ar)||"",date:u.created_at,status:u.status}});const j=JSON.stringify(T),F=JSON.stringify(M),S=JSON.stringify(Lo),z=`<!DOCTYPE html>
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
    <p>استمارة الاشراف للنشاط الايصالي التكاملي — ${n===g?n:n+" إلى "+g}</p>
  </div>

  <div class="stats-bar">
    <div class="stat-chip" style="background:#E3F2FD;color:#1565C0;">📍 إجمالي النقاط: ${k.length}</div>
    <div class="stat-chip" style="background:#E8F5E9;color:#2E7D32;">🏛️ المحافظات: ${p.size}</div>
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
      ${[...p.entries()].map(([x,i])=>{const u=["#e74c3c","#3498db","#2ecc71","#f39c12","#9b59b6","#1abc9c","#e67e22","#34495e","#16a085","#c0392b","#8e44ad","#2980b9","#27ae60","#d35400","#2c3e50","#7f8c8d"],m=[...p.keys()].indexOf(x);return`<span class="supervisor-tag"><span class="supervisor-dot" style="background:${u[m%u.length]}"></span>${x} (${i.length})</span>`}).join("")}
    </div>
  </div>

  <!-- ═══ خرائط المحافظات ═══ -->
  ${[...p.entries()].map(([x,i])=>`
    <div class="map-section">
      <div class="map-section-header">
        <div class="map-section-title">🏛️ ${x}</div>
        <div class="map-section-count">${i.length} موقع — ${new Set(i.map(u=>u.submitted_by)).size} مشرف</div>
      </div>
      <div id="map-${x.replace(/\s/g,"_")}" class="map-container gov-map"></div>
      <div class="supervisor-list">
        ${[...new Set(i.map(u=>{var m;return((m=u.profiles)==null?void 0:m.full_name)||"—"}))].map(u=>{const m=i.filter(o=>{var y;return((y=o.profiles)==null?void 0:y.full_name)===u}).length;return`<span class="supervisor-tag">👤 ${u} (${m})</span>`}).join("")}
      </div>
    </div>
  `).join("")}

  <script>
    // ═══ Data ═══
    const allMarkers = ${j};
    const govMarkers = ${F};
    const govCenters = ${S};

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
</html>`,C=window.open("","_blank");C&&(C.document.write(z),C.document.close())}function Oo(){var Da;const{data:e}=qs(),r=((Da=e==null?void 0:e.profile)==null?void 0:Da.role)||"data_entry",{campaign:l,labelAr:n,isFiltered:g,campaignRound:_,showRoundFilter:N}=Zt(),{toast:k}=Ha(),{previewProps:p,openPreview:T,closePreview:M}=ts(),j=Nr(),F=N?_:void 0,{data:S,isLoading:z,refetch:C}=gr(l,F),{data:D,isLoading:x}=ur(l,F),{data:i,isLoading:u,refetch:m}=hr({campaignType:l}),{data:o}=fr(l,F),{data:y}=ls(),{data:v,isLoading:a}=pr(l,F),{data:h}=mr(),{data:R}=vr({page:1}),d=(i==null?void 0:i.data)||[],[f,w]=ge.useState("analytics"),[q]=Ls();ge.useEffect(()=>{const O=q.get("tab");O&&["analytics","quick-reports","form-exports","comparison"].includes(O)&&w(O)},[q]);const[c,$]=ge.useState(null),[E,Y]=ge.useState(null),[Q,b]=ge.useState(""),[I,B]=ge.useState(""),[W,X]=ge.useState(""),[H,ie]=ge.useState("all"),[de,ye]=ge.useState({dateFrom:"",dateTo:"",governorateId:"all",campaignType:"all"}),[ke,Se]=ge.useState(!1),[we,ze]=ge.useState(null),[Je,P]=ge.useState(null),[K,ne]=ge.useState(""),[ce,le]=ge.useState("all"),be=ge.useMemo(()=>d.filter(O=>{if(Q){const he=Q.toLowerCase();return O.title_ar.toLowerCase().includes(he)||O.title_en.toLowerCase().includes(he)}return!0}),[d,Q]),te=ge.useCallback(async(O,he)=>{Y(O);try{await he(),k({title:"تم تصدير التقرير بنجاح ✅",variant:"success"})}catch(ae){console.error(ae),k({title:"فشل التصدير",variant:"destructive"})}finally{Y(null)}},[k]),xe=()=>te("dashboard",()=>{S&&Kr(S)}),Qe=()=>te("governorates",()=>{D&&Hr(D.map(O=>({name:O.name,submissions:O.submissions})))}),ta=()=>te("users",async()=>{j.startFetch();const O=await to();j.updateFetchProgress(O.fetchedCount,O.totalCount),j.startGenerate(),Jr((O.data||[]).map(he=>{var ae;return{full_name:he.full_name,email:he.email,role:he.role,is_active:he.is_active,governorate:(ae=he.governorates)==null?void 0:ae.name_ar,created_at:he.created_at}})),j.done(`تم تصدير ${O.fetchedCount} مستخدم`)}),G=()=>te("submissions",async()=>{j.startFetch();const O=await eo({governorateId:H!=="all"?H:void 0,dateFrom:I||void 0,dateTo:W||void 0});j.updateFetchProgress(O.fetchedCount,O.totalCount),j.startGenerate();const he=O.data.map((ae,se)=>{var re,fe,Ge,Fe,pe;return{index:se+1,form:((re=ae.forms)==null?void 0:re.title_ar)||"",status:ae.status==="submitted"?"مرسلة":"مسودة",submitted_by:((fe=ae.profiles)==null?void 0:fe.full_name)||"",governorate:((Ge=ae.governorates)==null?void 0:Ge.name_ar)||"",district:((Fe=ae.districts)==null?void 0:Fe.name_ar)||"",campaign:((pe=ae.forms)==null?void 0:pe.campaign_type)==="polio_campaign"?"شلل أطفال":"إيصالي",date:new Date(ae.created_at).toLocaleDateString("ar-SA")}});Xr(he),j.done(`تم تصدير ${he.length} إرسالية${O.truncated?" (مُقتطع)":""}`)}),Z=()=>te("shortages",async()=>{j.startFetch();const O=await ao();j.updateFetchProgress(O.fetchedCount,O.totalCount),j.startGenerate();const he={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ae=O.data.map((se,re)=>{var fe,Ge;return{index:re+1,item:se.item_name,category:se.item_category||"",needed:se.quantity_needed||"",available:se.quantity_available||0,severity:he[se.severity]||se.severity,resolved:se.is_resolved?"نعم":"لا",by:((fe=se.profiles)==null?void 0:fe.full_name)||"",gov:((Ge=se.governorates)==null?void 0:Ge.name_ar)||"",date:new Date(se.created_at).toLocaleDateString("ar-SA")}});Zr(ae),j.done(`تم تصدير ${ae.length} نقص`)}),oe=()=>te("timeline",()=>{v&&Vr(v)}),ve=()=>te("roles",()=>{h&&Qr(h.map(O=>({name:O.name,value:O.value})))}),$e=()=>te("audit",()=>{if(!(R!=null&&R.data))return;const O=[{header:"#",key:"index",width:6},{header:"العملية",key:"action",width:15},{header:"الجدول",key:"table",width:15},{header:"المستخدم",key:"user",width:20},{header:"التفاصيل",key:"details",width:30},{header:"التاريخ",key:"date",width:18}],he=R.data.map((ae,se)=>{var re;return{index:se+1,action:ae.action,table:ae.table_name||"",user:((re=ae.profiles)==null?void 0:re.full_name)||"",details:JSON.stringify(ae.new_data||{}).slice(0,100),date:new Date(ae.created_at).toLocaleDateString("ar-SA")}});ja({sheetName:"سجل التدقيق",title:"سجل التدقيق — EPI Supervisor",subtitle:`${he.length} عملية`,columns:O,data:he,fileName:`audit_log_${new Date().toISOString().split("T")[0]}`})}),Ke=()=>te("health-facility-assessment",async()=>{j.startFetch();const{data:O,error:he}=await U.from("form_submissions").select(`
        id, status, data, created_at,
        profiles:submitted_by(full_name, email),
        governorates(name_ar),
        districts(name_ar)
      `).eq("form_id","606b5093-9a8f-47d6-a6c9-b0429ce4a9f6").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e3);if(he)throw he;j.updateFetchProgress((O==null?void 0:O.length)||0,(O==null?void 0:O.length)||0),j.startGenerate();const ae=fe=>fe===!0||fe==="yes"?"نعم":"لا",se=(O||[]).map((fe,Ge)=>{var Fe,pe,je,Ae,ot,Lt,Rt,ht,Oe,Ue,ft,et;return{index:Ge+1,status:fe.status==="submitted"?"مرسلة":"مسودة",supervisor:((Fe=fe.profiles)==null?void 0:Fe.full_name)||"",governorate:((pe=fe.governorates)==null?void 0:pe.name_ar)||"",district:((je=fe.districts)==null?void 0:je.name_ar)||"",date:new Date(fe.created_at).toLocaleDateString("ar-SA"),defaulter_list:ae((Ae=fe.data)==null?void 0:Ae.has_defaulter_list),village_list:ae((ot=fe.data)==null?void 0:ot.has_village_list),updated_plan:ae((Lt=fe.data)==null?void 0:Lt.has_updated_plan),population_data:ae((Rt=fe.data)==null?void 0:Rt.has_population_data),coverage_plan:ae((ht=fe.data)==null?void 0:ht.has_coverage_plan),plan_reviewed:ae((Oe=fe.data)==null?void 0:Oe.plan_reviewed_by_higher_level),reverse_coverage:ae((Ue=fe.data)==null?void 0:Ue.has_reverse_coverage),higher_visit:ae((ft=fe.data)==null?void 0:ft.has_higher_level_visit),routine_coverage_85:ae((et=fe.data)==null?void 0:et.routine_coverage_above_85)}}),re=[{header:"#",key:"index",width:5},{header:"الحالة",key:"status",width:10},{header:"المشرف",key:"supervisor",width:20},{header:"المحافظة",key:"governorate",width:15},{header:"المديرية",key:"district",width:15},{header:"التاريخ",key:"date",width:12},{header:"قائمة المتخلفين",key:"defaulter_list",width:12},{header:"قائمة القرى",key:"village_list",width:10},{header:"خطة محدّثة",key:"updated_plan",width:10},{header:"بيانات سكانية",key:"population_data",width:10},{header:"خطة التغطية",key:"coverage_plan",width:10},{header:"مراجعة الخطة",key:"plan_reviewed",width:10},{header:"تغطية راجعة",key:"reverse_coverage",width:10},{header:"زيارة المستوى الأعلى",key:"higher_visit",width:12},{header:"تغطية >85%",key:"routine_coverage_85",width:10}];ja({sheetName:"تقييم المرافق الصحية",title:"تقرير تقييم جودة أداء المرافق الصحية",subtitle:`${se.length} تقييم`,columns:re,data:se,fileName:`health_facility_assessment_${new Date().toISOString().split("T")[0]}`}),j.done(`تم تصدير ${se.length} تقييم`)}),Pe=()=>te("pdf",async()=>{var Ge;const{data:O}=await U.from("governorates").select("name_ar").eq("is_active",!0).is("deleted_at",null).order("name_ar"),{data:he}=await U.from("form_submissions").select("governorate_id, status, governorates(name_ar)").is("deleted_at",null).gte("created_at",new Date(Date.now()-720*60*60*1e3).toISOString()),ae=new Map;for(const Fe of he||[]){const pe=((Ge=Fe.governorates)==null?void 0:Ge.name_ar)||"غير محدد",je=ae.get(pe)||{name:pe,count:0};je.count++,ae.set(pe,je)}const{data:se}=await U.from("form_submissions").select("status, created_at, forms(title_ar), profiles!submitted_by(full_name), governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(20),re={submitted:"مرسلة",draft:"مسودة",approved:"معتمدة",rejected:"مرفوضة"},fe=jt({title:"تقرير الإرساليات الشامل",subtitle:"إحصائيات تفصيلية للإرساليات والاستمارات",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"إجمالي الإرساليات",value:(S==null?void 0:S.total_submissions)||0,icon:"📋",color:"#1565C0"},{label:"مرسلة",value:((S==null?void 0:S.total_submissions)||0)-((S==null?void 0:S.draft_submissions)||0),icon:"✅",color:"#2E7D32"},{label:"مسودات",value:(S==null?void 0:S.draft_submissions)||0,icon:"📝",color:"#F57F17"},{label:"اليوم",value:(S==null?void 0:S.submissions_today)||0,icon:"📅",color:"#0277BD"}]},{title:"الإرساليات حسب المحافظة",icon:"🗺️",type:"table",columns:[{key:"name",label:"المحافظة"},{key:"count",label:"عدد الإرساليات"}],rows:Array.from(ae.values()).sort((Fe,pe)=>pe.count-Fe.count).slice(0,15)},{title:"آخر الإرساليات",icon:"📝",type:"table",columns:[{key:"form",label:"الاستمارة"},{key:"submitter",label:"المقدم"},{key:"governorate",label:"المحافظة"},{key:"status",label:"الحالة"},{key:"date",label:"التاريخ"}],rows:(se||[]).map(Fe=>{var pe,je,Ae;return{form:((pe=Fe.forms)==null?void 0:pe.title_ar)||"—",submitter:((je=Fe.profiles)==null?void 0:je.full_name)||"—",governorate:((Ae=Fe.governorates)==null?void 0:Ae.name_ar)||"—",status:re[Fe.status]||Fe.status,date:new Date(Fe.created_at).toLocaleDateString("ar-SA")}})}]});T("تقرير الإرساليات الشامل",fe,"آخر 30 يوم")}),Ie=()=>te("gov-pdf",async()=>{if(!D)return;const O=D.filter(re=>re.submissions===0),he=D.length>0?D[0]:null,ae=D.length>0?Math.round(D.filter(re=>re.submissions>0).length/D.length*100):0,se=jt({title:"تقرير أداء المحافظات",subtitle:"مقارنة شاملة لأداء جميع المحافظات",sections:[{title:"مؤشرات التغطية",icon:"🎯",type:"kpi-grid",kpis:[{label:"نسبة التغطية",value:`${ae}%`,icon:"📊",color:ae>=80?"#2E7D32":"#F57F17"},{label:"محافظات نشطة",value:D.filter(re=>re.submissions>0).length,icon:"🏛️",color:"#1565C0"},{label:"بدون تغطية",value:O.length,icon:"⚠️",color:O.length>0?"#E53935":"#2E7D32"},{label:"الأعلى نشاطاً",value:(he==null?void 0:he.name)||"—",icon:"🏆",color:"#FFD600"}]},{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:D.map((re,fe)=>({rank:fe+1,name:re.name,submissions:re.submissions}))},...O.length>0?[{title:"محافظات بدون تغطية",icon:"⚠️",type:"list",items:O.map(re=>({label:re.name,value:"لا توجد إرساليات",color:"#E53935"}))}]:[]]});T("تقرير أداء المحافظات",se,`${D.length} محافظة`)}),ps=()=>te("users-pdf",async()=>{const{data:O}=await U.from("profiles").select("full_name, email, role, is_active, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),he={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال بيانات"},ae={};for(const re of O||[])ae[re.role]=(ae[re.role]||0)+1;const se=jt({title:"تقرير المستخدمين",subtitle:"إحصائيات شاملة للمستخدمين والأدوار",sections:[{title:"ملخص المستخدمين",icon:"👥",type:"kpi-grid",kpis:[{label:"إجمالي المستخدمين",value:(O==null?void 0:O.length)||0,icon:"👤",color:"#1565C0"},{label:"نشطين",value:(O==null?void 0:O.filter(re=>re.is_active).length)||0,icon:"✅",color:"#2E7D32"},{label:"غير نشطين",value:(O==null?void 0:O.filter(re=>!re.is_active).length)||0,icon:"⏸️",color:"#F57F17"}]},{title:"توزيع الأدوار",icon:"📊",type:"summary",items:Object.entries(ae).map(([re,fe])=>({label:he[re]||re,value:fe,color:re==="admin"?"#8E24AA":"#1565C0"}))},{title:"قائمة المستخدمين",icon:"📋",type:"table",columns:[{key:"name",label:"الاسم",width:150},{key:"email",label:"البريد",width:180},{key:"role",label:"الدور",width:100},{key:"governorate",label:"المحافظة",width:120},{key:"active",label:"نشط",width:60}],rows:(O||[]).map(re=>{var fe;return{name:re.full_name,email:re.email,role:he[re.role]||re.role,governorate:((fe=re.governorates)==null?void 0:fe.name_ar)||"—",active:re.is_active?"نعم":"لا"}})}]});T("تقرير المستخدمين",se,`${(O==null?void 0:O.length)||0} مستخدم`)}),ms=()=>te("shortages-pdf",async()=>{const{data:O}=await U.from("supply_shortages").select("item_name, severity, quantity_needed, quantity_available, is_resolved, governorates(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(200),he={critical:"حرج",high:"عالي",medium:"متوسط",low:"منخفض"},ae=jt({title:"تقرير النواقص التفصيلي",subtitle:"نواقص اللقاحات والمعدات والتجهيزات",sections:[{title:"ملخص النواقص",icon:"📦",type:"kpi-grid",kpis:[{label:"إجمالي النواقص",value:(O==null?void 0:O.length)||0,icon:"📦",color:"#1565C0"},{label:"حرجة",value:(O==null?void 0:O.filter(se=>se.severity==="critical").length)||0,icon:"🔴",color:"#E53935"},{label:"عالية",value:(O==null?void 0:O.filter(se=>se.severity==="high").length)||0,icon:"🟠",color:"#FF6D00"},{label:"محلولة",value:(O==null?void 0:O.filter(se=>se.is_resolved).length)||0,icon:"✅",color:"#2E7D32"}]},{title:"نسبة الحل",icon:"🎯",type:"progress",progressItems:[{label:"نواقص محلولة",value:(O==null?void 0:O.filter(se=>se.is_resolved).length)||0,max:(O==null?void 0:O.length)||1,color:"#2E7D32"},{label:"نواقص حرجة",value:(O==null?void 0:O.filter(se=>se.severity==="critical").length)||0,max:(O==null?void 0:O.length)||1,color:"#E53935"}]},{title:"تفاصيل النواقص",icon:"📋",type:"table",columns:[{key:"item",label:"الصنف",width:150},{key:"severity",label:"الخطورة",width:80},{key:"needed",label:"المطلوب",width:80},{key:"available",label:"المتاح",width:80},{key:"gap",label:"النقص",width:80},{key:"governorate",label:"المحافظة",width:120},{key:"resolved",label:"محلول",width:60}],rows:(O||[]).map(se=>{var re;return{item:se.item_name,severity:he[se.severity]||se.severity,needed:se.quantity_needed||0,available:se.quantity_available||0,gap:Math.max(0,(se.quantity_needed||0)-se.quantity_available),governorate:((re=se.governorates)==null?void 0:re.name_ar)||"—",resolved:se.is_resolved?"نعم":"لا"}})}]});T("تقرير النواقص التفصيلي",ae,`${(O==null?void 0:O.length)||0} نقص`)}),hs=()=>te("full-pdf",async()=>{if(!S)return;const O=D&&D.length>0?Math.round(D.filter(ae=>ae.submissions>0).length/D.length*100):0,he=jt({title:"التقرير الشامل — EPI Supervisor",subtitle:"جميع البيانات والإحصائيات في تقرير واحد",sections:[{title:"مؤشرات الأداء الرئيسية",icon:"📊",type:"kpi-grid",kpis:[{label:"المستخدمين",value:S.total_users,icon:"👥",color:"#0277BD",sub:`${S.active_users} نشط`},{label:"إرساليات اليوم",value:S.submissions_today,icon:"📅",color:"#2E7D32"},{label:"المسودات",value:S.draft_submissions,icon:"📝",color:"#F57F17"},{label:"نسبة الإنجاز",value:`${S.approval_rate.toFixed(1)}%`,icon:"🎯",color:"#8E24AA"},{label:"النماذج النشطة",value:S.active_forms,icon:"📄",color:"#1565C0"},{label:"التغطية",value:`${O}%`,icon:"🗺️",color:O>=80?"#2E7D32":"#F57F17"}]},{title:"توزيع الحالات",icon:"📈",type:"summary",items:[{label:"مرسلة",value:S.total_submissions-S.draft_submissions,color:"#2E7D32"},{label:"مسودة",value:S.draft_submissions,color:"#F57F17"},{label:"هذا الأسبوع",value:S.submissions_this_week,color:"#0277BD"},{label:"الاتجاه",value:`${S.submissions_trend>0?"+":""}${S.submissions_trend}%`,color:S.submissions_trend>=0?"#2E7D32":"#E53935"}]},...D&&D.length>0?[{title:"أداء المحافظات",icon:"🏛️",type:"table",columns:[{key:"rank",label:"#",width:40},{key:"name",label:"المحافظة",width:200},{key:"submissions",label:"إرساليات",width:120}],rows:D.map((ae,se)=>({rank:se+1,name:ae.name,submissions:ae.submissions}))}]:[]]});T("التقرير الشامل",he,"جميع البيانات والإحصائيات")}),fs=async(O,he)=>{$(O.id);try{const ae=O.schema,se=[];ae!=null&&ae.fields&&ae.fields.forEach(pe=>se.push({label_ar:pe.label_ar||pe.label||"",key:pe.id||pe.key||""})),ae!=null&&ae.sections&&ae.sections.forEach(pe=>{var je;return(je=pe.fields)==null?void 0:je.forEach(Ae=>se.push({label_ar:Ae.label_ar||Ae.label||"",key:Ae.id||Ae.key||""}))});const re=[];let fe=0;const Ge=1e3;for(;;){const{data:pe,error:je}=await U.from("form_submissions").select("id, status, data, created_at, profiles!submitted_by(full_name), governorates(name_ar), districts(name_ar)").eq("form_id",O.id).is("deleted_at",null).order("created_at",{ascending:!1}).range(fe,fe+Ge-1);if(je)throw je;if(!pe||pe.length===0||(re.push(...pe),pe.length<Ge||re.length>=5e4))break;fe+=Ge,await new Promise(Ae=>setTimeout(Ae,50))}const Fe=re.map(pe=>{var je,Ae,ot;return{id:pe.id,status:pe.status,submitted_by:((je=pe.profiles)==null?void 0:je.full_name)||"",governorate:((Ae=pe.governorates)==null?void 0:Ae.name_ar)||"",district:((ot=pe.districts)==null?void 0:ot.name_ar)||"",created_at:pe.created_at,data:pe.data||{}}});if(Fe.length===0){k({title:"لا توجد إرساليات",variant:"destructive"});return}if(he==="csv"){const pe=Oe=>{const Ue=String(Oe??""),ft=/^[=+\-@\t\r]/.test(Ue),et=Ue.includes(",")||Ue.includes('"')||Ue.includes(`
`)?`"${Ue.replace(/"/g,'""')}"`:Ue;return ft?`'${et}`:et},je=["#","الحالة","المُرسل","المحافظة","التاريخ",...se.map(Oe=>Oe.label_ar)],Ae=Fe.map((Oe,Ue)=>[Ue+1,pe(Oe.status==="submitted"?"مرسلة":"مسودة"),pe(Oe.submitted_by),pe(Oe.governorate),pe(new Date(Oe.created_at).toLocaleDateString("ar-SA")),...se.map(ft=>{var et;return pe((et=Oe.data)==null?void 0:et[ft.key])})]),ot=[je.join(","),...Ae.map(Oe=>Oe.join(","))].join(`
`),Lt=new Blob(["\uFEFF"+ot],{type:"text/csv;charset=utf-8;"}),Rt=URL.createObjectURL(Lt),ht=document.createElement("a");ht.href=Rt,ht.download=`${O.title_ar}.csv`,ht.click(),URL.revokeObjectURL(Rt)}else Us(O.title_ar,se,Fe);k({title:`تم تصدير ${Fe.length} إرسالية ✅`,variant:"success"})}catch{k({title:"فشل التصدير",variant:"destructive"})}finally{$(null)}},De=async(O,he,ae)=>{const se=no();try{await ae();const re=Ua(se);re&&T(O,re,he)}catch(re){throw Ua(se),re}},vs=()=>te("central-report",()=>De("التقرير المركزي الشامل","جميع المحافظات والبيانات",()=>lo({dateFrom:I||void 0,dateTo:W||void 0,campaignType:l!=="all"?l:void 0,campaignRound:F}))),bs=O=>te("gov-detail-"+O,()=>De("تقرير محافظة","تفاصيل تفصيلية",()=>io(O,{dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),xs=O=>te("form-analysis-"+O,()=>De("تحليل النموذج","تقرير تفصيلي",()=>co(O,{dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),ys=()=>te("supervisor-report",()=>De("تقرير أداء المشرفين","تقييم شامل لكل مشرف",()=>go({dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),$s=()=>te("coverage-gap",()=>De("تقرير الفجوة التغطية","أين البيانات ناقصة",()=>uo({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F}))),_s=()=>te("campaign-comparison",()=>De("تقرير مقارنة الحملات","شلل أطفال vs الإيصالي التكاملي",()=>po({dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),ws=()=>te("daily-activity",()=>De("تقرير النشاط اليومي","نشاط اليوم — إرساليات، دخول، مقارنة",()=>mo({campaignRound:F}))),Ss=()=>te("data-quality",()=>De("تقرير جودة البيانات","تحليل اكتمال البيانات — GPS، صور، حقول فارغة",()=>ho({dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),ks=()=>te("shortages-detailed",()=>De("تقرير النواقص التفصيلي","تحليل شامل — حرج/عالي/متوسط",()=>fo({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0}))),Fs=()=>te("weekly-report",()=>De("التقرير الأسبوعي","ملخص الأسبوع — مقارنة بالسابق",()=>vo({campaignRound:F}))),Rs=()=>te("user-activity",()=>De("تقرير نشاط المستخدمين","دخول، نشاط، مستخدمين خاملين",()=>bo({dateFrom:I||void 0,dateTo:W||void 0,campaignRound:F}))),Ds=()=>te("challenges",()=>De("تقرير التحديات والصعوبات","تحديات، إجراءات، توصيات",()=>xo({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F}))),js=()=>te("supervision-form",()=>De("تقرير استمارة الإشراف","النشاط الإيصالي التكاملي — 8 أقسام × 33 مؤشر",()=>_o({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F}))),Ts=()=>te("supervision-challenges",()=>De("تقرير تحديات الإشراف الميداني","التحديات — الإجراءات — التوصيات",()=>So({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F}))),Es=()=>te("daily-supervisor-eval",()=>De("تقييم أداء المشرفين اليومي","استمارة الإشراف — النشاط الإيصالي التكاملي",()=>To({date:W||new Date().toISOString().split("T")[0],governorateId:H!=="all"?H:void 0,campaignRound:F}))),Cs=()=>te("comprehensive-supervisor-eval",()=>De("تقييم أداء المشرفين الشامل","جميع الاستمارات — النشاط الإيصالي التكاملي",()=>Co({governorateId:H!=="all"?H:void 0,campaignRound:F}))),Ns=()=>te("master-supervisor-report",()=>De("التقرير الشامل للمشرفين","تقييم + تحليل + تحديات + خريطة — تقرير مدمج",()=>Po({governorateId:H!=="all"?H:void 0,campaignRound:F}))),Ms=()=>te("general-supervisors-eval",()=>De("تقييم إشراف عام","تقييم أداء المشرفين العامين — النشاط الإيصالي التكاملي",()=>Io({date:W||new Date().toISOString().split("T")[0],governorateId:H!=="all"?H:void 0,campaignRound:F}))),zs=()=>te("yesno-analysis",()=>De("تحليل حقول نعم/لا","استمارة الاشراف — تحليل شامل",()=>Ao({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F}))),Ps=()=>{Go({dateFrom:I||void 0,dateTo:W||void 0,governorateId:H!=="all"?H:void 0,campaignRound:F})},Is=ge.useMemo(()=>D?D.slice(0,10).map(O=>({name:O.name,الإرساليات:O.submissions})):[],[D]),As=ge.useMemo(()=>S?[{name:"مرسلة",value:S.total_submissions-S.draft_submissions,color:"#10b981"},{name:"مسودة",value:S.draft_submissions,color:"#f59e0b"}]:[],[S]);return{stats:S,statsLoading:z,govStats:D,govLoading:x,forms:d,formsLoading:u,submissionCounts:o,governorates:y,chartData:v,chartLoading:a,roleDistribution:h,auditData:R,activeTab:f,setActiveTab:w,exportingFormId:c,exportingReport:E,formSearch:Q,setFormSearch:b,dateFrom:I,setDateFrom:B,dateTo:W,setDateTo:X,selectedGovFilter:H,setSelectedGovFilter:ie,analyticsFilter:de,setAnalyticsFilter:ye,drillDownOpen:ke,setDrillDownOpen:Se,drillDownData:we,setDrillDownData:ze,fullscreenChart:Je,setFullscreenChart:P,reportSearch:K,setReportSearch:ne,reportFormat:ce,setReportFormat:le,filteredForms:be,previewProps:p,openPreview:T,closePreview:M,exportProgress:j,userRole:r,campaign:l,labelAr:n,isFiltered:g,refetchStats:C,refetchForms:m,handleExportDashboard:xe,handleExportGovernorates:Qe,handleExportUsers:ta,handleExportSubmissions:G,handleExportShortages:Z,handleExportTimeline:oe,handleExportRoles:ve,handleExportAudit:$e,handleExportPDF:Pe,handleExportGovPDF:Ie,handleExportUsersPDF:ps,handleExportShortagesPDF:ms,handleExportFullPDF:hs,handleExportForm:fs,handleCentralReport:vs,handleGovDetailReport:bs,handleFormAnalysisReport:xs,handleSupervisorReport:ys,handleCoverageGapReport:$s,handleCampaignComparisonReport:_s,handleDailyActivityReport:ws,handleDataQualityReport:Ss,handleShortagesDetailedReport:ks,handleWeeklyReport:Fs,handleUserActivityReport:Rs,handleChallengesReport:Ds,handleSupervisionFormReport:js,handleSupervisionChallengesReport:Ts,handleDailySupervisorEvaluation:Es,handleComprehensiveSupervisorEvaluation:Cs,handleMasterSupervisorReport:Ns,handleGeneralSupervisorsEvaluation:Ms,handleYesNoAnalysis:zs,handleMapReport:Ps,handleExportHealthFacilityAssessment:Ke,govChartData:Is,statusPieData:As,exportReport:te}}const xt=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];function Ye(e){return["admin","central"].includes(e)}function Nt(e){return["admin","central","governorate"].includes(e)}const me={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function Vt(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function Re(e){return e.toLocaleString("ar-SA")}function Mt(e){const r=e.addSlide();return r.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:me.textMuted}),r.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:me.textMuted,align:"right"}),r.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:me.primary}}),r}function Bo(e,r,l){const n=e.addSlide();n.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:me.primaryDark}}),n.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:me.white}});try{n.addImage({data:ea,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return n.addText(r,{x:.5,y:2.2,w:9,h:1,fontSize:32,fontFace:"Cairo",bold:!0,color:me.white,align:"center"}),n.addText(l,{x:1,y:3.5,w:8,h:.6,fontSize:16,fontFace:"Tajawal",color:"B3D4FC",align:"center"}),n.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),n.addText(Vt(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),n}function Kt(e,r,l=.3,n=1.8){const g=9.4/r.length-.15;r.forEach((_,N)=>{const k=l+N*(g+.15);e.addShape("roundRect",{x:k,y:n,w:g,h:1.4,fill:{color:me.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:k,y:n,w:g,h:.06,fill:{color:_.color||me.primary},rectRadius:.03}),e.addText(_.icon||"📊",{x:k,y:n+.15,w:g,h:.3,fontSize:14,align:"center"}),e.addText(_.value,{x:k,y:n+.45,w:g,h:.5,fontSize:22,bold:!0,align:"center",color:_.color||me.primary,fontFace:"Cairo"}),e.addText(_.label,{x:k,y:n+.95,w:g,h:.35,fontSize:9,align:"center",color:me.textMuted})})}function Wa(e,r,l,n){const g=(n==null?void 0:n.x)||.3,_=(n==null?void 0:n.y)||3.5,N=(n==null?void 0:n.w)||9.4,k=[r.map(p=>({text:p,options:{bold:!0,color:me.white,fill:{color:me.primary},fontSize:9,align:"center"}})),...l.map((p,T)=>p.map(M=>({text:M,options:{fontSize:8,fill:{color:T%2===0?me.bg:me.white},align:"center"}})))];e.addTable(k,{x:g,y:_,w:N,border:{type:"solid",pt:.5,color:me.border},colW:r.map(()=>N/r.length),rowH:.35,autoPage:!1})}async function qo(){var c;const e=new Date,r=new Date(e.getFullYear(),e.getMonth(),1);new Date(e.getFullYear(),e.getMonth()-1,1),new Date(e.getFullYear(),e.getMonth(),0);const[l,n,g,_,N]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",r.toISOString()).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*").is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null)]),k=l.status==="fulfilled"?l.value.data||[]:[],p=n.status==="fulfilled"?n.value.data||[]:[],T=g.status==="fulfilled"?g.value.data||[]:[],M=_.status==="fulfilled"?_.value.data||[]:[];N.status==="fulfilled"&&N.value.data;const j=k.filter($=>$.status==="submitted"),F=k.filter($=>$.status==="draft"),S=new Set(k.map($=>$.submitted_by)).size,z=new Set(k.map($=>$.governorate_id).filter(Boolean)).size,C=M.filter($=>!$.is_resolved),D=C.filter($=>$.severity==="critical"),x=T.length>0?Math.round(z/T.length*100):0,i=T.map($=>{const E=k.filter(Y=>Y.governorate_id===$.id);return{name:$.name_ar,total:E.length,submitted:E.filter(Y=>Y.status==="submitted").length,draft:E.filter(Y=>Y.status==="draft").length}}).sort(($,E)=>E.total-$.total),u=k.filter($=>{var E;return((E=$.forms)==null?void 0:E.campaign_type)==="polio_campaign"}),m=k.filter($=>{var E;return((E=$.forms)==null?void 0:E.campaign_type)!=="polio_campaign"}),o=new Qt;o.layout="LAYOUT_WIDE",o.author="EPI Supervisor",o.title=`تقرير الأداء الشهري — ${Vt(e)}`,Bo(o,"التقرير الشهري للأداء",`أداء برنامج التحصين — ${Vt(r)} إلى ${Vt(e)}`);const y=Mt(o);y.addText("مؤشرات الأداء الرئيسية",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:me.primary,fontFace:"Cairo"}),Kt(y,[{label:"إجمالي الإرساليات",value:Re(k.length),icon:"📋",color:me.primary},{label:"مرسلة",value:Re(j.length),icon:"✅",color:me.success},{label:"مسودات",value:Re(F.length),icon:"📝",color:me.warning},{label:"مشرفين نشطين",value:Re(S),icon:"👥",color:me.purple},{label:"محافظات نشطة",value:`${z}/${T.length}`,icon:"🏛️",color:me.info},{label:"نسبة التغطية",value:`${x}%`,icon:"🎯",color:x>=80?me.success:me.warning}]);const v=Mt(o);v.addText("مقارنة الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:me.primary,fontFace:"Cairo"}),Kt(v,[{label:"حملة شلل أطفال",value:Re(u.length),icon:"💉",color:me.blue},{label:"شلل — مرسلة",value:Re(u.filter($=>$.status==="submitted").length),icon:"✅",color:me.success},{label:"الإيصالي التكاملي",value:Re(m.length),icon:"🏥",color:me.green},{label:"إيصالي — مرسلة",value:Re(m.filter($=>$.status==="submitted").length),icon:"✅",color:me.success}],.3,1.5);const a=u.length>0?Math.round((u.length-u.filter($=>$.status==="submitted").length)/u.length*100):0,h=m.length>0?Math.round((m.length-m.filter($=>$.status==="submitted").length)/m.length*100):0;v.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:3.2,w:9.4,h:.4,fontSize:14,bold:!0,color:me.text,fontFace:"Cairo"}),Wa(v,["الحملة","الإجمالي","مرسلة","مسودة","نسبة التسريب","التقييم"],[["شلل أطفال",Re(u.length),Re(u.filter($=>$.status==="submitted").length),Re(u.filter($=>$.status==="draft").length),`${a}%`,a<=10?"✅ ممتاز":a<=25?"⚠️ مقبول":"🔴 حرج"],["إيصالي تكاملي",Re(m.length),Re(m.filter($=>$.status==="submitted").length),Re(m.filter($=>$.status==="draft").length),`${h}%`,h<=10?"✅ ممتاز":h<=25?"⚠️ مقبول":"🔴 حرج"]],{y:3.7});const R=Mt(o);R.addText("أداء المحافظات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:me.primary,fontFace:"Cairo"}),Kt(R,[{label:"الأعلى نشاطاً",value:((c=i[0])==null?void 0:c.name)||"—",icon:"🏆",color:me.warning},{label:"بدون تغطية",value:Re(i.filter($=>$.total===0).length),icon:"⚠️",color:me.accent}],.3,1.2),Wa(R,["#","المحافظة","الإجمالي","مرسلة","مسودة","نسبة الإرسال"],i.slice(0,15).map(($,E)=>[`${E+1}`,$.name,Re($.total),Re($.submitted),Re($.draft),$.total>0?`${Math.round($.submitted/$.total*100)}%`:"0%"]),{y:2.8});const d=Mt(o);d.addText("تنبيهات النواقص",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:me.accent,fontFace:"Cairo"}),Kt(d,[{label:"نواقص غير محلولة",value:Re(C.length),icon:"📦",color:me.accent},{label:"حرجة",value:Re(D.length),icon:"🚨",color:me.accent},{label:"نواقص محلولة",value:Re(M.filter($=>$.is_resolved).length),icon:"✅",color:me.success},{label:"معدل الحل",value:`${M.length>0?Math.round(M.filter($=>$.is_resolved).length/M.length*100):0}%`,icon:"📈",color:me.info}],.3,1.2),D.length>0&&(d.addShape("roundRect",{x:.3,y:3,w:9.4,h:.5,fill:{color:"FFEBEE"},rectRadius:.05}),d.addText(`🚨 تنبيه عاجل: يوجد ${D.length} نقص حرج يحتاج تدخل فوري!`,{x:.5,y:3,w:9,h:.5,fontSize:12,bold:!0,color:me.accent}));const f=Mt(o);f.addText("التوصيات والإجراءات المطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:me.primary,fontFace:"Cairo"});const w=[];x<80&&w.push(`🎯 رفع نسبة التغطية من ${x}% إلى 80% — متابعة المحافظات غير النشطة`),D.length>0&&w.push(`🚨 معالجة ${D.length} نواقص حرجة فوراً`),F.length>10&&w.push(`📝 مراجعة واعتماد ${F.length} مسودة معلقة`),S<p.filter($=>$.is_active).length*.7&&w.push(`👥 تفعيل المشرفين غير النشطين — ${p.filter($=>$.is_active).length-S} مشرف لم يرسل`),a>15&&w.push(`💉 خفض معدل التسريب في حملة شلل أطفال من ${a}%`),w.length===0&&w.push("✅ الأداء ممتاز — استمرار المتابعة والتحسين"),w.forEach(($,E)=>{f.addShape("roundRect",{x:.5,y:1.2+E*.7,w:9,h:.55,fill:{color:E%2===0?"E3F2FD":"F3E5F5"},rectRadius:.05}),f.addText($,{x:.7,y:1.2+E*.7,w:8.6,h:.55,fontSize:12,color:me.text,fontFace:"Cairo"})});const q=`تقرير_شهري_${e.toISOString().split("T")[0]}.pptx`;await o.writeFile({fileName:q})}const J={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",blue:"3B82F6",green:"10B981",purple:"8B5CF6"};function St(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function Ve(e){const r=e.addSlide();return r.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:J.primary}}),r.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:6.8,w:6,h:.3,fontSize:8,color:J.textMuted}),r.addText(new Date().toLocaleDateString("ar-SA"),{x:7,y:6.8,w:2.5,h:.3,fontSize:8,color:J.textMuted,align:"right"}),r}function gs(e,r,l){const n=e.addSlide();n.addShape(e.ShapeType.rect,{x:0,y:0,w:10,h:7.5,fill:{color:J.primaryDark}}),n.addShape(e.ShapeType.rect,{x:0,y:3.2,w:10,h:.04,fill:{color:J.white}});try{n.addImage({data:ea,x:4.25,y:.8,w:1.5,h:1.5,rounding:!0})}catch{}return n.addText(r,{x:.5,y:2.2,w:9,h:1,fontSize:32,bold:!0,color:J.white,align:"center",fontFace:"Cairo"}),n.addText(l,{x:1,y:3.5,w:8,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),n.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.5,w:8,h:.4,fontSize:11,color:"90CAF9",align:"center"}),n.addText(St(new Date),{x:1,y:6,w:8,h:.3,fontSize:10,color:"64B5F6",align:"center"}),n}function $t(e,r,l=1.8){const n=9.4/r.length-.15;r.forEach((g,_)=>{const N=.3+_*(n+.15);e.addShape("roundRect",{x:N,y:l,w:n,h:1.4,fill:{color:J.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.1},rectRadius:.1}),e.addShape("roundRect",{x:N,y:l,w:n,h:.06,fill:{color:g.color||J.primary},rectRadius:.03}),e.addText(g.icon||"📊",{x:N,y:l+.15,w:n,h:.3,fontSize:14,align:"center"}),e.addText(g.value,{x:N,y:l+.45,w:n,h:.5,fontSize:22,bold:!0,align:"center",color:g.color||J.primary,fontFace:"Cairo"}),e.addText(g.label,{x:N,y:l+.95,w:n,h:.35,fontSize:9,align:"center",color:J.textMuted})})}function It(e,r,l,n){const g=(n==null?void 0:n.x)||.3,_=(n==null?void 0:n.y)||3.5,N=(n==null?void 0:n.w)||9.4,k=[r.map(p=>({text:p,options:{bold:!0,color:J.white,fill:{color:J.primary},fontSize:9,align:"center"}})),...l.map((p,T)=>p.map(M=>({text:M,options:{fontSize:8,fill:{color:T%2===0?J.bg:J.white},align:"center"}})))];e.addTable(k,{x:g,y:_,w:N,border:{type:"solid",pt:.5,color:J.border},rowH:.35,autoPage:!1})}async function Uo(){const e=new Date,r=new Date(e.getTime()-7*864e5),l=new Date(e.getTime()-14*864e5),[n,g,_,N,k]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar)").gte("created_at",r.toISOString()).is("deleted_at",null),U.from("form_submissions").select("id",{count:"exact",head:!0}).gte("created_at",l.toISOString()).lt("created_at",r.toISOString()).is("deleted_at",null),U.from("profiles").select("*").is("deleted_at",null),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null).eq("is_resolved",!1)]),p=n.status==="fulfilled"?n.value.data||[]:[],T=g.status==="fulfilled"&&g.value.count||0;_.status==="fulfilled"&&_.value.data;const M=N.status==="fulfilled"?N.value.data||[]:[],j=k.status==="fulfilled"?k.value.data||[]:[],F=p.filter(d=>d.status==="submitted"),S=p.filter(d=>d.status==="draft"),z=new Set(p.map(d=>d.submitted_by)).size,C=new Set(p.map(d=>d.governorate_id).filter(Boolean)).size,D=p.length-T,x=T>0?Math.round(D/T*100):0,i=Array.from({length:7},(d,f)=>{const w=new Date(r.getTime()+f*864e5),q=w.toISOString().split("T")[0],c=w.toLocaleDateString("ar-SA",{weekday:"long"}),$=p.filter(E=>E.created_at.startsWith(q));return{day:c,count:$.length,submitted:$.filter(E=>E.status==="submitted").length}}),u=M.map(d=>({name:d.name_ar,count:p.filter(f=>f.governorate_id===d.id).length})).sort((d,f)=>f.count-d.count).filter(d=>d.count>0),m=new Qt;m.layout="LAYOUT_WIDE",m.author="EPI Supervisor",m.title=`النشرة الأسبوعية — ${St(r)} إلى ${St(e)}`,gs(m,"النشرة الأسبوعية للتحصين",`الأسبوع: ${St(r)} — ${St(e)}`);const o=Ve(m);o.addText("ملخص الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"}),$t(o,[{label:"إرساليات الأسبوع",value:p.length.toString(),icon:"📋",color:J.primary},{label:"مرسلة",value:F.length.toString(),icon:"✅",color:J.success},{label:"مقارنة بالأسبوع السابق",value:`${D>=0?"+":""}${x}%`,icon:D>=0?"📈":"📉",color:D>=0?J.success:J.accent},{label:"مشرفين نشطين",value:z.toString(),icon:"👥",color:J.purple},{label:"محافظات نشطة",value:`${C}/${M.length}`,icon:"🏛️",color:J.info}]);const y=Ve(m);y.addText("النشاط اليومي",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"}),It(y,["اليوم","الإرساليات","مرسلة","نسبة الإرسال"],i.map(d=>[d.day,d.count.toString(),d.submitted.toString(),d.count>0?`${Math.round(d.submitted/d.count*100)}%`:"0%"]),{y:1.2});const v=Ve(m);v.addText("ترتيب المحافظات هذا الأسبوع",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"}),It(v,["#","المحافظة","الإرساليات","النسبة"],u.slice(0,15).map((d,f)=>[`${f+1}`,d.name,d.count.toString(),`${Math.round(d.count/Math.max(p.length,1)*100)}%`]),{y:1.2});const a=Ve(m);a.addText("تنبيهات وإجراءات مطلوبة",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.accent,fontFace:"Cairo"});const h=[];D<0&&h.push({text:`⚠️ انخفاض الإرساليات بنسبة ${Math.abs(x)}% مقارنة بالأسبوع السابق`,color:J.accent,bg:"FFEBEE"}),C<M.length*.7&&h.push({text:`🏛️ ${M.length-C} محافظة لم ترسل بيانات هذا الأسبوع`,color:J.warning,bg:"FFF8E1"}),j.length>0&&h.push({text:`📦 ${j.length} نقص معلق يحتاج متابعة`,color:J.accent,bg:"FFEBEE"}),S.length>p.length*.3&&h.push({text:`📝 نسبة المسودات عالية (${Math.round(S.length/Math.max(p.length,1)*100)}%) — مراجعة المشرفين`,color:J.warning,bg:"FFF8E1"}),h.length===0&&h.push({text:"✅ لا توجد تنبيهات — الأداء ممتاز!",color:J.success,bg:"E8F5E9"}),h.forEach((d,f)=>{a.addShape("roundRect",{x:.5,y:1.2+f*.8,w:9,h:.6,fill:{color:d.bg},rectRadius:.05}),a.addText(d.text,{x:.7,y:1.2+f*.8,w:8.6,h:.6,fontSize:12,color:d.color,fontFace:"Cairo"})});const R=`نشرة_اسبوعية_${e.toISOString().split("T")[0]}.pptx`;await m.writeFile({fileName:R})}async function Yo(){const e=new Date,[r,l,n,g]=await Promise.allSettled([U.from("form_submissions").select("*, forms(title_ar, campaign_type), governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1}).limit(5e4),U.from("governorates").select("*").eq("is_active",!0).is("deleted_at",null),U.from("forms").select("*").eq("is_active",!0).is("deleted_at",null),U.from("supply_shortages").select("*, governorates(name_ar)").is("deleted_at",null)]),_=r.status==="fulfilled"?r.value.data||[]:[],N=l.status==="fulfilled"?l.value.data||[]:[],k=n.status==="fulfilled"?n.value.data||[]:[],p=g.status==="fulfilled"?g.value.data||[]:[],T=k.filter(E=>E.campaign_type==="polio_campaign").map(E=>E.id),M=k.filter(E=>E.campaign_type!=="polio_campaign").map(E=>E.id),j=_.filter(E=>T.includes(E.form_id)),F=_.filter(E=>M.includes(E.form_id)),S=j.filter(E=>E.status==="submitted"),z=F.filter(E=>E.status==="submitted");j.filter(E=>E.status==="draft"),F.filter(E=>E.status==="draft");const C=j.length>0?Math.round((j.length-S.length)/j.length*100):0,D=F.length>0?Math.round((F.length-z.length)/F.length*100):0,x=N.map(E=>({name:E.name_ar,total:j.filter(Y=>Y.governorate_id===E.id).length,submitted:j.filter(Y=>Y.governorate_id===E.id&&Y.status==="submitted").length})).sort((E,Y)=>Y.total-E.total),i=N.map(E=>({name:E.name_ar,total:F.filter(Y=>Y.governorate_id===E.id).length,submitted:F.filter(Y=>Y.governorate_id===E.id&&Y.status==="submitted").length})).sort((E,Y)=>Y.total-E.total),u=x.filter(E=>E.total===0),m=i.filter(E=>E.total===0),o=new Qt;o.layout="LAYOUT_WIDE",o.author="EPI Supervisor",o.title=`تقرير أداء الحملات — ${St(e)}`,gs(o,"تقرير أداء الحملات","مقارنة شاملة — حملة شلل أطفال vs الإيصالي التكاملي");const y=Ve(o);y.addText("نظرة عامة على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"}),$t(y,[{label:"شلل أطفال — إجمالي",value:j.length.toString(),icon:"💉",color:J.blue},{label:"شلل أطفال — مرسلة",value:S.length.toString(),icon:"✅",color:J.success},{label:"إيصالي — إجمالي",value:F.length.toString(),icon:"🏥",color:J.green},{label:"إيصالي — مرسلة",value:z.length.toString(),icon:"✅",color:J.success}]);const v=Ve(o);v.addText("تحليل معدل التسريب (Dropout Rate)",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"}),v.addText("معدل التسريب = (الإجمالي - المرسلة) / الإجمالي × 100",{x:.3,y:.9,w:9.4,h:.3,fontSize:10,color:J.textMuted,italic:!0}),$t(v,[{label:"شلل أطفال — التسريب",value:`${C}%`,icon:"💉",color:C<=10?J.success:C<=25?J.warning:J.accent},{label:"إيصالي — التسريب",value:`${D}%`,icon:"🏥",color:D<=10?J.success:D<=25?J.warning:J.accent}],1.5),v.addShape("roundRect",{x:.3,y:3.2,w:9.4,h:1.8,fill:{color:"E3F2FD"},rectRadius:.1}),v.addText("معايير التقييم (WHO Benchmarks)",{x:.5,y:3.3,w:9,h:.4,fontSize:13,bold:!0,color:J.primary}),v.addText([{text:"✅ ممتاز: ",options:{bold:!0,color:J.success}},{text:"تسريب ≤ 10%    ",options:{color:J.text}},{text:"⚠️ مقبول: ",options:{bold:!0,color:J.warning}},{text:"تسريب 11-25%    ",options:{color:J.text}},{text:"🔴 حرج: ",options:{bold:!0,color:J.accent}},{text:"تسريب > 25%",options:{color:J.text}}],{x:.5,y:3.7,w:9,h:.4,fontSize:11}),v.addText("معدل التسريب يقيس فقدان المستفيدين بين الجرعة الأولى والجرعة الأخيرة. معدل عالي يشير لمشاكل في المتابعة أو اللوجستيات.",{x:.5,y:4.2,w:9,h:.6,fontSize:10,color:J.textMuted});const a=Ve(o);a.addText("💉 تغطية حملة شلل أطفال حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:J.blue,fontFace:"Cairo"}),$t(a,[{label:"محافظات نشطة",value:`${x.filter(E=>E.total>0).length}/${N.length}`,icon:"🏛️",color:J.info},{label:"بدون تغطية",value:u.length.toString(),icon:"⚠️",color:u.length>0?J.accent:J.success}],1.2),It(a,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],x.filter(E=>E.total>0).slice(0,12).map((E,Y)=>[`${Y+1}`,E.name,E.total.toString(),E.submitted.toString(),`${Math.round(E.submitted/Math.max(E.total,1)*100)}%`]),{y:2.8});const h=Ve(o);h.addText("🏥 تغطية الإيصالي التكاملي حسب المحافظة",{x:.3,y:.3,w:9.4,h:.5,fontSize:18,bold:!0,color:J.green,fontFace:"Cairo"}),$t(h,[{label:"محافظات نشطة",value:`${i.filter(E=>E.total>0).length}/${N.length}`,icon:"🏛️",color:J.info},{label:"بدون تغطية",value:m.length.toString(),icon:"⚠️",color:m.length>0?J.accent:J.success}],1.2),It(h,["#","المحافظة","الإرساليات","مرسلة","نسبة التغطية"],i.filter(E=>E.total>0).slice(0,12).map((E,Y)=>[`${Y+1}`,E.name,E.total.toString(),E.submitted.toString(),`${Math.round(E.submitted/Math.max(E.total,1)*100)}%`]),{y:2.8});const R=Ve(o);R.addText("تأثير النواقص على الحملات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.accent,fontFace:"Cairo"});const d=p.filter(E=>E.severity==="critical"&&!E.is_resolved),f=p.filter(E=>E.severity==="high"&&!E.is_resolved);$t(R,[{label:"نواقص حرجة",value:d.length.toString(),icon:"🚨",color:J.accent},{label:"نواقص عالية",value:f.length.toString(),icon:"🟠",color:"E65100"},{label:"معدل الحل",value:`${p.length>0?Math.round(p.filter(E=>E.is_resolved).length/p.length*100):0}%`,icon:"📈",color:J.info}],1.2),d.length>0&&It(R,["النقص","المحافظة","الخطورة","الكمية المطلوبة"],d.slice(0,8).map(E=>{var Y;return[E.item_name,((Y=E.governorates)==null?void 0:Y.name_ar)||"—","🔴 حرج",`${E.quantity_needed||"—"}`]}),{y:3});const w=Ve(o);w.addText("النتائج الرئيسية والتوصيات",{x:.3,y:.3,w:9.4,h:.5,fontSize:20,bold:!0,color:J.primary,fontFace:"Cairo"});const q=[];C<=10?q.push({text:`✅ حملة شلل أطفال: معدل التسريب ${C}% — أداء ممتاز`,type:"success"}):C<=25?q.push({text:`⚠️ حملة شلل أطفال: معدل التسريب ${C}% — يحتاج تحسين`,type:"warning"}):q.push({text:`🔴 حملة شلل أطفال: معدل التسريب ${C}% — حرج!`,type:"danger"}),D<=10?q.push({text:`✅ الإيصالي التكاملي: معدل التسريب ${D}% — أداء ممتاز`,type:"success"}):D<=25?q.push({text:`⚠️ الإيصالي التكاملي: معدل التسريب ${D}% — يحتاج تحسين`,type:"warning"}):q.push({text:`🔴 الإيصالي التكاملي: معدل التسريب ${D}% — حرج!`,type:"danger"}),u.length>0&&q.push({text:`⚠️ ${u.length} محافظة بدون تغطية في حملة شلل أطفال`,type:"warning"}),d.length>0&&q.push({text:`🔴 ${d.length} نقص حرج يعيق الحملات`,type:"danger"});const c={success:{bg:"E8F5E9",text:J.success},warning:{bg:"FFF8E1",text:J.warning},danger:{bg:"FFEBEE",text:J.accent}};q.forEach((E,Y)=>{w.addShape("roundRect",{x:.5,y:1.2+Y*.7,w:9,h:.55,fill:{color:c[E.type].bg},rectRadius:.05}),w.addText(E.text,{x:.7,y:1.2+Y*.7,w:8.6,h:.55,fontSize:12,color:c[E.type].text,fontFace:"Cairo"})});const $=`تقرير_الحملات_${e.toISOString().split("T")[0]}.pptx`;await o.writeFile({fileName:$})}const ee={primary:"1565C0",primaryDark:"0D47A1",accent:"E53935",success:"2E7D32",warning:"F57F17",info:"0277BD",bg:"F5F7FA",white:"FFFFFF",text:"212121",textMuted:"616161",border:"E0E0E0",green:"10B981",amber:"F59E0B",purple:"8B5CF6",lightGreen:"E8F5E9",lightRed:"FFEBEE"};function us(e){const r=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];return`${e.getDate()} ${r[e.getMonth()]} ${e.getFullYear()}`}function lt(e,r){e.addShape(r.ShapeType.rect,{x:0,y:0,w:10,h:.06,fill:{color:ee.primary}}),e.addText("برنامج التحصين الصحي الموسع — مشرف EPI",{x:.3,y:7,w:5,h:.3,fontSize:7,color:ee.textMuted}),e.addText(us(new Date),{x:7,y:7,w:2.7,h:.3,fontSize:7,color:ee.textMuted,align:"right"})}function it(e,r,l,n){e.addShape("roundRect",{x:.3,y:.3,w:9.4,h:.7,fill:{color:ee.primaryDark},rectRadius:.08}),e.addText(`${r}  ${l}`,{x:.5,y:.35,w:7,h:.6,fontSize:18,bold:!0,color:ee.white,fontFace:"Cairo"}),n&&e.addText(n,{x:7.5,y:.4,w:2,h:.5,fontSize:11,color:ee.white,align:"center",fill:{color:"1565C0"},shape:"roundRect",rectRadius:.15})}function ma(e,r,l=1.3){const n=9.4/r.length-.12;r.forEach((g,_)=>{const N=.3+_*(n+.12);e.addShape("roundRect",{x:N,y:l,w:n,h:1.5,fill:{color:ee.white},shadow:{type:"outer",blur:4,offset:2,color:"000000",opacity:.08},rectRadius:.1}),e.addShape("roundRect",{x:N,y:l,w:n,h:.06,fill:{color:g.color||ee.primary},rectRadius:.03}),e.addText(g.icon||"📊",{x:N,y:l+.15,w:n,h:.3,fontSize:16,align:"center"}),e.addText(g.value,{x:N,y:l+.45,w:n,h:.55,fontSize:24,bold:!0,align:"center",color:g.color||ee.primary,fontFace:"Cairo"}),e.addText(g.label,{x:N,y:l+1.05,w:n,h:.35,fontSize:9,align:"center",color:ee.textMuted})})}function Ht(e,r,l,n){const g=(n==null?void 0:n.x)||.3,_=(n==null?void 0:n.y)||3.2,N=(n==null?void 0:n.w)||9.4,k=(n==null?void 0:n.fontSize)||8,p=[r.map(T=>({text:T,options:{bold:!0,color:ee.white,fill:{color:ee.primary},fontSize:k,align:"center",fontFace:"Cairo"}})),...l.map((T,M)=>T.map(j=>({text:j,options:{fontSize:k-1,fill:{color:M%2===0?ee.bg:ee.white},align:"center"}})))];e.addTable(p,{x:g,y:_,w:N,border:{type:"solid",pt:.5,color:ee.border},rowH:.32,autoPage:!1})}const Ka=[{id:"team_info",title:"معلومات الفريق",icon:"👥",fields:["has_activity_plan","has_doctor_or_trained","wearing_uniform"]},{id:"work_env",title:"بيئة العمل",icon:"🏢",fields:["suitable_location","community_coordination","has_speaker","has_transport"]},{id:"records",title:"السجلات",icon:"📁",fields:["complete_records","daily_work_forms","correct_data_entry"]},{id:"quality",title:"جودة الخدمة",icon:"⭐",fields:["good_acceptance","safe_vaccination","muac_measurement"]},{id:"vaccine",title:"اللقاحات",icon:"🧊",fields:["vaccine_disposal","safety_box_usage","cold_chain_proper"]},{id:"supplies",title:"الإمدادات",icon:"📦",fields:["family_planning_available","folic_iron_stock","scale"]},{id:"shortages",title:"العجز",icon:"⚠️",fields:["has_immunization_shortage","has_reproductive_shortage"]},{id:"catchup",title:"الإحاق",icon:"🔄",fields:["catch_up_knowledge","catch_up_training"]}];async function Wo(e){const r=new Qt;r.layout="LAYOUT_WIDE",r.author="EPI Supervisor",r.title="التقرير الشامل المدمج للمشرفين";const l=us(new Date),n=await Ra(e),[g,_,N]=await Promise.allSettled([U.from("form_submissions").select("id, data, governorate_id, status").eq("form_id","97a4f2b3-c573-4812-b58c-5b0acf814e24").eq("status","submitted").is("deleted_at",null).limit(5e4),U.from("form_submissions").select("id, data, governorate_id, district_id, submitted_by, created_at").is("deleted_at",null).order("created_at",{ascending:!1}).limit(1e4),U.from("profiles").select("id, full_name").is("deleted_at",null)]),k=new Map;for(const G of n.govs)k.set(G.id,G.name_ar);const{enriched:p,govs:T,subs:M,govGroups:j}=n,F=p.filter(G=>(G.role==="central"||G.role==="admin")&&G.govId),S=[...p.filter(G=>["governorate","district","data_entry"].includes(G.role)),...F];let z=j;const C=S.length,D=S.filter(G=>G.totalToday>0).length,x=S.filter(G=>G.totalToday===0&&!G.isGenSupervisor).length,i=S.filter(G=>G.isGenSupervisor).length,u=M.length,m=M.filter(G=>G.status==="submitted").length,o=g.status==="fulfilled"?g.value.data||[]:[],y=Ka.flatMap(G=>G.fields),v=new Map;for(const G of y)v.set(G,{yes:0,no:0,total:0});for(const G of o){const Z=G.data||{};for(const oe of y){const ve=Z[oe],$e=v.get(oe);$e&&(ve===!0||ve==="yes"||ve==="نعم"?($e.yes++,$e.total++):(ve===!1||ve==="no"||ve==="لا")&&($e.no++,$e.total++))}}const a=Ka.map(G=>{const Z=G.fields.map(Pe=>{const Ie=v.get(Pe)||{yes:0,no:0,total:0};return{key:Pe,...Ie,yesRate:Ie.total>0?Math.round(Ie.yes/Ie.total*100):0}}),oe=Z.reduce((Pe,Ie)=>Pe+Ie.yes,0),ve=Z.reduce((Pe,Ie)=>Pe+Ie.no,0),$e=oe+ve,Ke=$e>0?Math.round(oe/$e*100):0;return{...G,fields:Z,totalYes:oe,totalNo:ve,total:$e,avgRate:Ke}}),h=a.reduce((G,Z)=>G+Z.totalYes,0),R=a.reduce((G,Z)=>G+Z.totalNo,0),d=h+R,f=d>0?Math.round(h/d*100):0,w=_.status==="fulfilled"?_.value.data||[]:[],q=new Map;if(N.status==="fulfilled")for(const G of N.value.data||[])q.set(G.id,G.full_name);const c=["تحدي","صعوب","مشكل","عائق"],$=["إجراء","اجراء","اتخذ","تدبير"],E=["توصي","اقتراح","ينصح"];function Y(G,Z){if(!G||typeof G!="object")return null;for(const[oe,ve]of Object.entries(G))if(typeof ve=="string"&&ve.trim().length>2){for(const $e of Z)if(oe.toLowerCase().includes($e.toLowerCase()))return ve.trim().slice(0,120)}return null}const Q=new Map;for(const G of w){const Z=G.data||{},oe=Y(Z,c),ve=Y(Z,$),$e=Y(Z,E);if(!oe&&!ve&&!$e)continue;const Ke=G.governorate_id||"",Pe=k.get(Ke)||"غير محدد";Q.has(Ke)||Q.set(Ke,{govName:Pe,challenges:[],actions:[],recommendations:[],count:0});const Ie=Q.get(Ke);Ie.count++,oe&&Ie.challenges.push(oe),ve&&Ie.actions.push(ve),$e&&Ie.recommendations.push($e)}const b=[...Q.values()].sort((G,Z)=>Z.count-G.count),I=b.reduce((G,Z)=>G+Z.count,0),B=b.reduce((G,Z)=>G+Z.challenges.length,0),W=r.addSlide();W.addShape(r.ShapeType.rect,{x:0,y:0,w:13.33,h:7.5,fill:{color:ee.primaryDark}}),W.addShape(r.ShapeType.rect,{x:0,y:3.4,w:13.33,h:.04,fill:{color:ee.white}}),W.addShape(r.ShapeType.rect,{x:0,y:3.5,w:13.33,h:.02,fill:{color:ee.primary}});try{W.addImage({data:ea,x:5.9,y:.6,w:1.5,h:1.5,rounding:!0})}catch{}W.addText("التقرير الشامل المدمج للمشرفين",{x:1,y:2.2,w:11.33,h:1,fontSize:36,bold:!0,color:ee.white,align:"center",fontFace:"Cairo"}),W.addText("تقييم الأداء ◆ تحليل نعم/لا ◆ تحديات ميدانية",{x:1,y:3.6,w:11.33,h:.6,fontSize:16,color:"B3D4FC",align:"center",fontFace:"Tajawal"}),W.addText("وزارة الصحة العامة والسكان — الجمهورية اليمنية",{x:1,y:5.2,w:11.33,h:.4,fontSize:12,color:"90CAF9",align:"center"}),W.addText(l,{x:1,y:5.8,w:11.33,h:.3,fontSize:11,color:"64B5F6",align:"center"});const X=r.addSlide();lt(X,r),it(X,"📊","مؤشرات الأداء الرئيسية",`${C} مشرف`);const H=Math.max(C-i,1),ie=Math.round(D/H*100);ma(X,[{icon:"👥",label:"إجمالي المشرفين",value:`${C}`,color:ee.primary},{icon:"✅",label:"نشط",value:`${D}`,color:ee.success},{icon:"❌",label:"غير نشط",value:`${x}`,color:ee.accent},{icon:"🏛️",label:"إشراف عام",value:`${i}`,color:ee.info},{icon:"📋",label:"الاستمارات",value:`${u}`,color:ee.purple}],1.3),ma(X,[{icon:"🎯",label:"نسبة النشاط",value:`${ie}%`,color:ie>=70?ee.success:ee.warning},{icon:"📊",label:"نسبة نعم الكلية",value:`${f}%`,color:f>=70?ee.success:ee.warning},{icon:"⚠️",label:"تحديات ميدانية",value:`${I}`,color:ee.accent},{icon:"📤",label:"نسبة الإرسال",value:`${u>0?Math.round(m/u*100):0}%`,color:ee.green}],3.1);const de=[...z.values()].map(G=>{const Z=G.allUsers.filter(Pe=>Pe.totalToday>0&&!Pe.isGenSupervisor).length,oe=G.allUsers.filter(Pe=>Pe.isGenSupervisor).length,ve=G.allUsers.reduce((Pe,Ie)=>Pe+Ie.totalToday,0),$e=G.allUsers.length,Ke=$e>0?Math.round(Z/Math.max($e-oe,1)*100):0;return[G.gov.name_ar,`${$e}`,`${Z}`,`${$e-Z-oe}`,`${ve}`,`${Ke}%`]});Ht(X,["المحافظة","المشرفين","نشط","غير نشط","الاستمارات","النشاط"],de,{y:5,fontSize:7});const ye=r.addSlide();lt(ye,r),it(ye,"📋","تقييم أداء المشرفين — تفاصيل المحافظات");const ke=[];for(const G of z.values()){const Z=[...G.allUsers].sort((oe,ve)=>ve.totalToday-oe.totalToday).slice(0,6);for(const oe of Z){const ve=oe.role==="central"||oe.role==="admin"?"مركزي":oe.role==="governorate"?"محافظة":oe.role==="district"?"مديرية":"إدخال",$e=oe.isGenSupervisor?"إشراف عام":oe.totalToday>0?"نشط":"غير نشط";ke.push([G.gov.name_ar,(oe.full_name||"—").slice(0,20),ve,(oe.distName||"—").slice(0,15),`${oe.totalToday}`,`${oe.submittedToday}`,$e])}}Ht(ye,["المحافظة","الاسم","الصفة","المديرية","استمارات","مرسلة","الحالة"],ke.slice(0,20),{y:1.3,fontSize:7}),ke.length>20&&ye.addText(`+ ${ke.length-20} مشرف إضافي...`,{x:.3,y:6.5,w:9.4,h:.3,fontSize:9,color:ee.textMuted,italic:!0});const Se=r.addSlide();lt(Se,r),it(Se,"📊","تحليل حقول نعم/لا",`${o.length} استمارة`);const we=a.map(G=>{const Z=G.avgRate>=80?"ممتاز ✅":G.avgRate>=60?"جيد 👍":G.avgRate>=40?"متوسط ⚠️":"ضعيف ❌";return[`${G.icon} ${G.title}`,`${G.fields.length}`,`${G.totalYes}`,`${G.totalNo}`,`${G.avgRate}%`,Z]});Ht(Se,["القسم","الحقول","نعم","لا","النسبة","التقييم"],we,{y:1.3,fontSize:8});const ze=a.flatMap(G=>G.fields.filter(Z=>Z.total>0)),Je=[...ze].sort((G,Z)=>Z.yesRate-G.yesRate).slice(0,5),P=[...ze].sort((G,Z)=>G.yesRate-Z.yesRate).slice(0,5);Se.addShape("roundRect",{x:.3,y:5,w:4.5,h:2,fill:{color:ee.lightGreen},rectRadius:.1}),Se.addText("✅ أعلى 5 حقول (نعم)",{x:.5,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:ee.success}),Je.forEach((G,Z)=>{Se.addText(`${Z+1}. ${G.key} — ${G.yesRate}%`,{x:.5,y:5.4+Z*.28,w:4,h:.25,fontSize:8,color:ee.text})}),Se.addShape("roundRect",{x:5.2,y:5,w:4.5,h:2,fill:{color:ee.lightRed},rectRadius:.1}),Se.addText("❌ أقل 5 حقول (نعم)",{x:5.4,y:5.05,w:4,h:.35,fontSize:11,bold:!0,color:ee.accent}),P.forEach((G,Z)=>{Se.addText(`${Z+1}. ${G.key} — ${G.yesRate}%`,{x:5.4,y:5.4+Z*.28,w:4,h:.25,fontSize:8,color:ee.text})});const K=r.addSlide();lt(K,r),it(K,"📑","تفصيل حقول نعم/لا — الأقسام الأولى");const ne=a.slice(0,4);let ce=1.3;for(const G of ne){K.addShape("roundRect",{x:.3,y:ce,w:9.4,h:.4,fill:{color:ee.primaryDark},rectRadius:.06}),K.addText(`${G.icon} ${G.title}  —  ${G.avgRate}%`,{x:.5,y:ce+.02,w:8,h:.35,fontSize:11,bold:!0,color:ee.white}),ce+=.5;for(const Z of G.fields){const oe=Z.yesRate,ve=oe>=80?ee.success:oe>=60?ee.warning:oe>=40?ee.amber:ee.accent;K.addText(Z.key,{x:.5,y:ce,w:3.5,h:.25,fontSize:8,color:ee.text}),K.addShape("roundRect",{x:4.2,y:ce+.05,w:3.5,h:.15,fill:{color:ee.border},rectRadius:.05});const $e=Math.max(.1,oe/100*3.5);K.addShape("roundRect",{x:4.2,y:ce+.05,w:$e,h:.15,fill:{color:ve},rectRadius:.05}),K.addText(`${oe}%`,{x:7.9,y:ce,w:.8,h:.25,fontSize:8,bold:!0,color:ve,align:"center"}),K.addText(`✓${Z.yes} ✗${Z.no}`,{x:8.8,y:ce,w:1,h:.25,fontSize:7,color:ee.textMuted,align:"center"}),ce+=.28}ce+=.15}const le=r.addSlide();lt(le,r),it(le,"📑","تفصيل حقول نعم/لا — الأقسام المتبقية");const be=a.slice(4);let te=1.3;for(const G of be){le.addShape("roundRect",{x:.3,y:te,w:9.4,h:.4,fill:{color:ee.primaryDark},rectRadius:.06}),le.addText(`${G.icon} ${G.title}  —  ${G.avgRate}%`,{x:.5,y:te+.02,w:8,h:.35,fontSize:11,bold:!0,color:ee.white}),te+=.5;for(const Z of G.fields){const oe=Z.yesRate,ve=oe>=80?ee.success:oe>=60?ee.warning:oe>=40?ee.amber:ee.accent;le.addText(Z.key,{x:.5,y:te,w:3.5,h:.25,fontSize:8,color:ee.text}),le.addShape("roundRect",{x:4.2,y:te+.05,w:3.5,h:.15,fill:{color:ee.border},rectRadius:.05});const $e=Math.max(.1,oe/100*3.5);le.addShape("roundRect",{x:4.2,y:te+.05,w:$e,h:.15,fill:{color:ve},rectRadius:.05}),le.addText(`${oe}%`,{x:7.9,y:te,w:.8,h:.25,fontSize:8,bold:!0,color:ve,align:"center"}),le.addText(`✓${Z.yes} ✗${Z.no}`,{x:8.8,y:te,w:1,h:.25,fontSize:7,color:ee.textMuted,align:"center"}),te+=.28}te+=.15}const xe=r.addSlide();lt(xe,r),it(xe,"⚠️","تحديات الإشراف الميداني",`${b.length} محافظة`),ma(xe,[{icon:"📋",label:"استمارات مُعبأة",value:`${I}`,color:ee.primary},{icon:"⚠️",label:"تحديات",value:`${B}`,color:ee.accent},{icon:"📋",label:"إجراءات",value:`${b.reduce((G,Z)=>G+Z.actions.length,0)}`,color:ee.info},{icon:"💡",label:"توصيات",value:`${b.reduce((G,Z)=>G+Z.recommendations.length,0)}`,color:ee.success}],1.3);const Qe=b.slice(0,10).map(G=>[G.govName,`${G.count}`,`${G.challenges.length}`,`${G.actions.length}`,`${G.recommendations.length}`,G.challenges.length>0?G.challenges[0].slice(0,40)+"...":"—"]);if(Ht(xe,["المحافظة","استمارات","تحديات","إجراءات","توصيات","أبرز تحدي"],Qe,{y:3.2,fontSize:7}),b.length>0){const G=r.addSlide();lt(G,r),it(G,"📝","تفاصيل التحديات حسب المحافظة");let Z=1.3;for(const oe of b.slice(0,4)){if(G.addShape("roundRect",{x:.3,y:Z,w:9.4,h:.4,fill:{color:ee.primary},rectRadius:.06}),G.addText(`🏛️ ${oe.govName}  —  ${oe.count} استمارة`,{x:.5,y:Z+.02,w:8,h:.35,fontSize:10,bold:!0,color:ee.white}),Z+=.5,oe.challenges.length>0){G.addText(`⚠️ تحديات (${oe.challenges.length})`,{x:.5,y:Z,w:2,h:.25,fontSize:8,bold:!0,color:ee.accent}),Z+=.25;for(const ve of oe.challenges.slice(0,3))G.addText(`• ${ve.slice(0,80)}`,{x:.7,y:Z,w:8.5,h:.22,fontSize:7,color:ee.text}),Z+=.22}if(oe.actions.length>0){G.addText(`📋 إجراءات (${oe.actions.length})`,{x:.5,y:Z,w:2,h:.25,fontSize:8,bold:!0,color:ee.info}),Z+=.25;for(const ve of oe.actions.slice(0,2))G.addText(`• ${ve.slice(0,80)}`,{x:.7,y:Z,w:8.5,h:.22,fontSize:7,color:ee.text}),Z+=.22}Z+=.2}}const ta=`التقرير_الشامل_المدمج_${new Date().toISOString().split("T")[0]}.pptx`;await r.writeFile({fileName:ta})}function Cn(){var C,D,x;const e=Oo(),{campaignRound:r,showRoundFilter:l,labelAr:n,isFiltered:g}=Zt(),_=l?Xs(r):null,[N,k]=ge.useState(()=>{try{const i=localStorage.getItem("epi-favorite-reports");return i?new Set(JSON.parse(i)):new Set}catch{return new Set}}),p=ge.useCallback(i=>{k(u=>{const m=new Set(u);return m.has(i)?m.delete(i):m.add(i),localStorage.setItem("epi-favorite-reports",JSON.stringify([...m])),m})},[]),[T,M]=ge.useState(()=>Qa());ge.useEffect(()=>{Ys()},[]);const j=ge.useCallback(i=>{const u=aa.find(m=>m.id===i)||aa[0];M(u),Ws(i)},[]),F=ge.useMemo(()=>{var u;const i=[];return Nt(e.userRole)&&i.push({icon:yr,title:"ملخص المؤشرات",subtitle:"KPIs — المستخدمين، الإرساليات، النماذج، معدل الأداء",value:e.stats?tt(e.stats.total_submissions):void 0,trend:(u=e.stats)==null?void 0:u.submissions_trend,color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:e.handleExportDashboard,loading:e.exportingReport==="dashboard",badge:"KPIs",format:"excel"}),i.push({icon:Tt,title:"الإرساليات — خط زمني",subtitle:"تطور الإرساليات خلال آخر 30 يوم (مرسلة / مسودة)",value:e.stats?tt(e.stats.submissions_today):void 0,color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:e.handleExportTimeline,loading:e.exportingReport==="timeline",badge:"30 يوم",format:"excel"}),Ye(e.userRole)&&i.push({icon:yt,title:"أداء المحافظات",subtitle:"مقارنة الإرساليات والتغطية الجغرافية بين المحافظات",value:e.govStats?tt(e.govStats.length)+" محافظة":void 0,color:"text-purple-600",gradient:"bg-gradient-to-r from-purple-500 to-purple-600",onClick:e.handleExportGovernorates,loading:e.exportingReport==="governorates",format:"excel"}),i.push({icon:Na,title:"توزيع الحالات",subtitle:"نسبة الإرساليات المرسلة مقابل المسودات",value:e.stats?`${e.stats.approval_rate.toFixed(1)}%`:void 0,color:"text-amber-600",gradient:"bg-gradient-to-r from-amber-500 to-amber-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"تحليل",format:"excel"}),Ye(e.userRole)&&i.push({icon:He,title:"توزيع المستخدمين",subtitle:"المستخدمون حسب الدور: مدير، مركزي، محافظة، قضاء، إدخال بيانات",value:e.roleDistribution?tt(e.roleDistribution.reduce((m,o)=>m+o.value,0)):void 0,color:"text-cyan-600",gradient:"bg-gradient-to-r from-cyan-500 to-cyan-600",onClick:e.handleExportRoles,loading:e.exportingReport==="roles",format:"excel"}),i.push({icon:sa,title:"تقرير الإرساليات الشامل",subtitle:"جميع الإرساليات مع تفاصيل النماذج والمُرسلين والمحافظات",value:e.stats?tt(e.stats.total_submissions):void 0,color:"text-indigo-600",gradient:"bg-gradient-to-r from-indigo-500 to-indigo-600",onClick:e.handleExportSubmissions,loading:e.exportingReport==="submissions",badge:"شامل",format:"excel"}),Ye(e.userRole)&&i.push({icon:He,title:"تقرير المستخدمين",subtitle:"قائمة جميع المستخدمين مع أدوارهم ومحافظاتهم",color:"text-rose-600",gradient:"bg-gradient-to-r from-rose-500 to-rose-600",onClick:e.handleExportUsers,loading:e.exportingReport==="users",format:"excel"}),Nt(e.userRole)&&i.push({icon:ra,title:"تقرير النواقص",subtitle:"نواقص اللقاحات والمعدات — الخطورة، المحافظة، حالة الحل",color:"text-orange-600",gradient:"bg-gradient-to-r from-orange-500 to-orange-600",onClick:e.handleExportShortages,loading:e.exportingReport==="shortages",format:"excel"}),Nt(e.userRole)&&i.push({icon:$r,title:"تقييم المرافق الصحية",subtitle:"تقرير تقييم جودة أداء المرافق الصحية — الجاهزية، الخطط، التغطية",color:"text-teal-600",gradient:"bg-gradient-to-r from-teal-500 to-teal-600",onClick:e.handleExportHealthFacilityAssessment,loading:e.exportingReport==="health-facility-assessment",badge:"تقييم",format:"excel"}),Ye(e.userRole)&&i.push({icon:Ks,title:"سجل التدقيق",subtitle:"جميع العمليات: إنشاء، تعديل، حذف، تسجيل دخول — مع IP والمستخدم",color:"text-slate-600",gradient:"bg-gradient-to-r from-slate-500 to-slate-600",onClick:e.handleExportAudit,loading:e.exportingReport==="audit",badge:"audit",format:"excel"}),i.push({icon:nt,title:"📄 PDF — تقرير الإرساليات",subtitle:"تقرير PDF احترافي للإرساليات مع إحصائيات المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-500 to-red-600",onClick:e.handleExportPDF,loading:e.exportingReport==="pdf",badge:"PDF",format:"pdf"}),Ye(e.userRole)&&(i.push({icon:yt,title:"📄 PDF — أداء المحافظات",subtitle:"تقرير PDF مقارن لأداء المحافظات",color:"text-red-600",gradient:"bg-gradient-to-r from-red-600 to-rose-600",onClick:e.handleExportGovPDF,loading:e.exportingReport==="gov-pdf",badge:"PDF",format:"pdf"}),i.push({icon:He,title:"📄 PDF — المستخدمين",subtitle:"تقرير PDF للمستخدمين والأدوار",color:"text-red-600",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:e.handleExportUsersPDF,loading:e.exportingReport==="users-pdf",badge:"PDF",format:"pdf"})),Nt(e.userRole)&&i.push({icon:ra,title:"📄 PDF — النواقص",subtitle:"تقرير PDF لنواقص الإمدادات",color:"text-red-600",gradient:"bg-gradient-to-r from-orange-500 to-red-500",onClick:e.handleExportShortagesPDF,loading:e.exportingReport==="shortages-pdf",badge:"PDF",format:"pdf"}),Ye(e.userRole)&&i.push({icon:pt,title:"📄 PDF — التقرير الشامل",subtitle:"تقرير PDF شامل بكل البيانات والإحصائيات",color:"text-white",gradient:"bg-gradient-to-r from-red-700 to-red-900",onClick:e.handleExportFullPDF,loading:e.exportingReport==="full-pdf",badge:"PDF شامل",format:"pdf"}),Ye(e.userRole)&&(i.push({icon:oa,title:"🏛️ التقرير المركزي الشامل",subtitle:"تقرير احترافي شامل — جميع المحافظات، المستخدمين، النماذج، النواقص، التغطية",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleCentralReport,loading:e.exportingReport==="central-report",badge:"احترافي",format:"pdf"}),e.governorates&&e.governorates.forEach(m=>{i.push({icon:yt,title:`🏛️ تقرير محافظة ${m.name_ar}`,subtitle:"تقرير تفصيلي — المديريات، المستخدمين، الإرساليات، النواقص",color:"text-blue-600",gradient:"bg-gradient-to-r from-blue-500 to-blue-600",onClick:()=>e.handleGovDetailReport(m.id),loading:e.exportingReport==="gov-detail-"+m.id,badge:"محافظة",format:"pdf"})})),e.forms&&e.forms.forEach(m=>{i.push({icon:nt,title:`📊 تحليل: ${m.title_ar}`,subtitle:"تقرير تفصيلي — تحليل كل حقل، التغطية حسب المحافظة، التوقيت، الإرساليات",color:"text-emerald-600",gradient:"bg-gradient-to-r from-emerald-500 to-emerald-600",onClick:()=>e.handleFormAnalysisReport(m.id),loading:e.exportingReport==="form-analysis-"+m.id,badge:"تحليل نموذج",format:"pdf"})}),Ye(e.userRole)&&(i.push({icon:He,title:"👥 تقرير أداء المشرفين",subtitle:"تقييم شامل — كل مشرف وكم أرسل، التقييم، النشاط، جودة البيانات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleSupervisorReport,loading:e.exportingReport==="supervisor-report",badge:"مشرفين",format:"pdf"}),i.push({icon:zt,title:"🎯 تقرير الفجوة التغطية",subtitle:"أين البيانات ناقصة — محافظات ومديريات بدون تغطية",color:"text-white",gradient:"bg-gradient-to-r from-red-600 to-rose-700",onClick:e.handleCoverageGapReport,loading:e.exportingReport==="coverage-gap",badge:"فجوة",format:"pdf"}),i.push({icon:$a,title:"⚖️ تقرير مقارنة الحملات",subtitle:"شلل أطفال vs الإيصالي التكاملي — مقارنة شاملة",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleCampaignComparisonReport,loading:e.exportingReport==="campaign-comparison",badge:"مقارنة",format:"pdf"})),i.push({icon:Ta,title:"📅 تقرير النشاط اليومي",subtitle:"نشاط اليوم — إرساليات، دخول، مقارنة بأمس",color:"text-white",gradient:"bg-gradient-to-r from-cyan-600 to-teal-700",onClick:e.handleDailyActivityReport,loading:e.exportingReport==="daily-activity",badge:"يومي",format:"pdf"}),Ye(e.userRole)&&i.push({icon:Dt,title:"✨ تقرير جودة البيانات",subtitle:"تحليل اكتمال البيانات — GPS، صور، حقول فارغة",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-orange-600",onClick:e.handleDataQualityReport,loading:e.exportingReport==="data-quality",badge:"جودة",format:"pdf"}),i.push({icon:ra,title:"📦 تقرير النواقص التفصيلي",subtitle:"تحليل شامل — حرج/عالي/متوسط، حسب المحافظة والفئة",color:"text-white",gradient:"bg-gradient-to-r from-red-500 to-pink-600",onClick:e.handleShortagesDetailedReport,loading:e.exportingReport==="shortages-detailed",badge:"نواقص",format:"pdf"}),i.push({icon:Tt,title:"📊 التقرير الأسبوعي",subtitle:"ملخص الأسبوع — مقارنة بالسابق، نشاط يومي، أداء المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-green-700",onClick:e.handleWeeklyReport,loading:e.exportingReport==="weekly-report",badge:"أسبوعي",format:"pdf"}),Ye(e.userRole)&&i.push({icon:He,title:"🔐 تقرير نشاط المستخدمين",subtitle:"دخول، نشاط، مستخدمين خاملين — من دخل ومتى",color:"text-white",gradient:"bg-gradient-to-r from-slate-600 to-gray-700",onClick:e.handleUserActivityReport,loading:e.exportingReport==="user-activity",badge:"نشاط",format:"pdf"}),i.push({icon:zt,title:"⚠️ PDF — التحديات والصعوبات",subtitle:"تقرير شامل — فجوات التغطية، النواقص، المشرفين غير النشطين، جودة البيانات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-orange-700",onClick:e.handleChallengesReport,loading:e.exportingReport==="challenges",badge:"تحديات",format:"pdf"}),i.push({icon:Hs,title:"📋 PDF — استمارة الإشراف",subtitle:"النشاط الإيصالي التكاملي — 8 أقسام إشرافية، 33 مؤشر، تحليل تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-teal-600 to-cyan-700",onClick:e.handleSupervisionFormReport,loading:e.exportingReport==="supervision-form",badge:"إشراف",format:"pdf"}),i.push({icon:nt,title:"📝 PDF — تحديات الإشراف الميداني",subtitle:"آخر 3 حقول: التحديات والصعوبات، الإجراءات المتخذة، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-indigo-600 to-blue-700",onClick:e.handleSupervisionChallengesReport,loading:e.exportingReport==="supervision-challenges",badge:"ميداني",format:"pdf"}),i.push({icon:He,title:"📋 تقييم أداء المشرفين اليومي",subtitle:"اليومي — المركزي + المحافظات + المديريات | الاسم، الصفة، عدد الاستمارات",color:"text-white",gradient:"bg-gradient-to-r from-emerald-600 to-teal-700",onClick:e.handleDailySupervisorEvaluation,loading:e.exportingReport==="daily-supervisor-eval",badge:"يومي",format:"pdf"}),i.push({icon:He,title:"📊 تقييم أداء المشرفين الشامل",subtitle:"جميع الاستمارات — بدون فلتر تاريخ | إجمالي النشاط، المديريات، المحافظات",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-indigo-700",onClick:e.handleComprehensiveSupervisorEvaluation,loading:e.exportingReport==="comprehensive-supervisor-eval",badge:"شامل",format:"pdf"}),i.push({icon:Dt,title:"🏆 التقرير الشامل المدمج للمشرفين",subtitle:"تقرير واحد يدمج: تقييم الأداء + تحليل نعم/لا + تحديات ميدانية",color:"text-white",gradient:"bg-gradient-to-r from-amber-500 to-red-600",onClick:e.handleMasterSupervisorReport,loading:e.exportingReport==="master-supervisor-report",badge:"🏆 مدمج",format:"pdf"}),i.push({icon:oa,title:"🏛️ تقييم إشراف عام",subtitle:"المشرفين العامين فقط — مدير عام مكتب الصحة، تقييم الأداء، ترتيب، نسب النشاط",color:"text-white",gradient:"bg-gradient-to-r from-blue-700 to-indigo-800",onClick:e.handleGeneralSupervisorsEvaluation,loading:e.exportingReport==="general-supervisors-eval",badge:"إشراف عام",format:"pdf"}),i.push({icon:Dt,title:"📊 تحليل حقول نعم/لا",subtitle:"استمارة الاشراف — تحليل شامل لكل حقل نعم/لا حسب القسم والمحافظة",color:"text-white",gradient:"bg-gradient-to-r from-violet-600 to-purple-700",onClick:e.handleYesNoAnalysis,loading:e.exportingReport==="yesno-analysis",badge:"تحليل",format:"pdf"}),i.push({icon:yt,title:"🗺️ خريطة مواقع المشرفين",subtitle:"خريطة اليمن + خريطة كل محافظة — مواقع GPS للمشرفين",color:"text-white",gradient:"bg-gradient-to-r from-teal-500 to-cyan-600",onClick:e.handleMapReport,loading:!1,badge:"خريطة",format:"pdf"}),Ye(e.userRole)&&i.push({icon:kt,title:"📊 PPTX — التقرير الشهري",subtitle:"عرض PowerPoint احترافي — KPIs، مقارنة الحملات، تغطية المحافظات، التوصيات",color:"text-white",gradient:"bg-gradient-to-r from-orange-500 to-amber-600",onClick:()=>e.exportReport("pptx-monthly",async()=>{await qo()}),loading:e.exportingReport==="pptx-monthly",badge:"شهري",format:"pptx"}),i.push({icon:Tt,title:"📅 PPTX — النشرة الأسبوعية",subtitle:"عرض PowerPoint — ملخص الأسبوع، النشاط اليومي، ترتيب المحافظات، التنبيهات",color:"text-white",gradient:"bg-gradient-to-r from-orange-600 to-red-500",onClick:()=>e.exportReport("pptx-weekly",async()=>{await Uo()}),loading:e.exportingReport==="pptx-weekly",badge:"أسبوعي",format:"pptx"}),i.push({icon:$a,title:"💉 PPTX — أداء الحملات",subtitle:"عرض PowerPoint — شلل أطفال vs الإيصالي، معدل التسريب، التغطية، تأثير النواقص",color:"text-white",gradient:"bg-gradient-to-r from-rose-500 to-pink-600",onClick:()=>e.exportReport("pptx-campaign",async()=>{await Yo()}),loading:e.exportingReport==="pptx-campaign",badge:"حملات",format:"pptx"}),i.push({icon:Dt,title:"🏆 PPTX — التقرير الشامل المدمج",subtitle:"عرض PowerPoint احترافي — تقييم الأداء + تحليل نعم/لا + التحديات | 8 شرائح",color:"text-white",gradient:"bg-gradient-to-r from-amber-600 to-red-600",onClick:()=>e.exportReport("pptx-master",async()=>{await Wo()}),loading:e.exportingReport==="pptx-master",badge:"🏆 مدمج",format:"pptx"}),i.map(m=>({...m,favorite:N.has(m.title),onToggleFavorite:()=>p(m.title)}))},[e.userRole,e.stats,e.govStats,e.chartData,e.roleDistribution,e.exportingReport,e.dateFrom,e.dateTo,e.selectedGovFilter,e.campaign,e.governorates,e.forms,N,p]),S=ge.useMemo(()=>{let i=F;if(e.reportFormat==="favorites"?i=i.filter(u=>u.favorite):e.reportFormat!=="all"&&(i=i.filter(u=>u.format===e.reportFormat)),e.reportSearch.trim()){const u=e.reportSearch.trim().toLowerCase();i=i.filter(m=>m.title.toLowerCase().includes(u)||m.subtitle.toLowerCase().includes(u)||m.badge&&m.badge.toLowerCase().includes(u))}return i},[F,e.reportSearch,e.reportFormat]),z=ge.useMemo(()=>{const i={all:F.length,pdf:0,excel:0,pptx:0,favorites:0};return F.forEach(u=>{u.format==="pdf"?i.pdf++:u.format==="excel"?i.excel++:u.format==="pptx"&&i.pptx++,u.favorite&&i.favorites++}),i},[F]);return s.jsxs("div",{className:"page-enter",children:[s.jsx(Qs,{title:"التقارير والبيانات",subtitle:e.isFiltered?`تحليلات وتصدير — ${e.labelAr}`:"تحليلات ذكية وتصدير احترافي للبيانات",onRefresh:()=>{e.refetchStats(),e.refetchForms()}}),s.jsxs("div",{className:"p-6 space-y-6",children:[s.jsx(Be,{className:"border-0 shadow-md",children:s.jsx(qe,{className:"p-4",children:s.jsxs("div",{className:"flex flex-wrap items-center gap-3",children:[s.jsxs("div",{className:"flex items-center gap-2 text-sm font-medium",children:[s.jsx(Va,{className:"w-4 h-4 text-muted-foreground"}),"فلاتر"]}),s.jsxs("div",{className:"flex items-center gap-1.5",children:[s.jsx(Xa,{className:"w-3.5 h-3.5 text-muted-foreground"}),s.jsx(ut,{type:"date",value:e.dateFrom,onChange:i=>e.setDateFrom(i.target.value),className:"w-[140px] h-9 text-xs"}),s.jsx("span",{className:"text-xs text-muted-foreground",children:"—"}),s.jsx(ut,{type:"date",value:e.dateTo,onChange:i=>e.setDateTo(i.target.value),className:"w-[140px] h-9 text-xs"})]}),Nt(e.userRole)&&s.jsxs(fa,{value:e.selectedGovFilter,onValueChange:e.setSelectedGovFilter,children:[s.jsxs(va,{className:"w-[160px] h-9",children:[s.jsx(yt,{className:"w-3.5 h-3.5 ml-2 text-muted-foreground"}),s.jsx(ba,{placeholder:"المحافظة"})]}),s.jsxs(xa,{children:[s.jsx(Pt,{value:"all",children:"كل المحافظات"}),(e.governorates||[]).map(i=>s.jsx(Pt,{value:i.id,children:i.name_ar},i.id))]})]}),s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx(_r,{className:"w-3.5 h-3.5 text-muted-foreground"}),s.jsx("div",{className:"flex items-center gap-1.5",children:aa.map(i=>s.jsx("button",{onClick:()=>j(i.id),title:i.nameAr,className:_e("w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110",T.id===i.id?"border-foreground shadow-md scale-110":"border-transparent hover:border-muted-foreground/30"),style:{backgroundColor:`#${i.primary}`}},i.id))}),s.jsx("span",{className:"text-[10px] text-muted-foreground font-medium",children:T.nameAr})]}),(e.dateFrom||e.dateTo||e.selectedGovFilter!=="all")&&s.jsxs(We,{variant:"ghost",size:"sm",onClick:()=>{e.setDateFrom(""),e.setDateTo(""),e.setSelectedGovFilter("all")},className:"h-9 gap-1 text-muted-foreground",children:[s.jsx(ha,{className:"w-3 h-3"})," مسح"]})]})})}),s.jsx(sr,{title:"التقارير",children:s.jsxs(Zs,{value:e.activeTab,onValueChange:e.setActiveTab,children:[s.jsxs(Js,{className:"w-full justify-start gap-1 bg-transparent p-0 h-auto",children:[s.jsxs(Gt,{value:"analytics",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(Dt,{className:"w-4 h-4"})," التحليلات"]}),s.jsxs(Gt,{value:"quick-reports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(Ea,{className:"w-4 h-4"})," التقارير السريعة"]}),s.jsxs(Gt,{value:"form-exports",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(_t,{className:"w-4 h-4"})," تصدير النماذج",s.jsx(st,{variant:"secondary",className:"text-[10px] px-1.5",children:e.forms.length})]}),s.jsxs(Gt,{value:"comparison",className:"data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2.5 gap-2 font-medium",children:[s.jsx(_a,{className:"w-4 h-4"})," مقارنة الفترات"]})]}),s.jsx(Za,{className:"my-4"}),s.jsxs(Ot,{value:"analytics",className:"mt-0 space-y-6",children:[s.jsx(Or,{filter:e.analyticsFilter,onChange:e.setAnalyticsFilter,onRefresh:()=>{e.refetchStats(),e.refetchForms()},refreshing:e.statsLoading}),s.jsx("div",{className:"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4",children:e.statsLoading?Array.from({length:6}).map((i,u)=>s.jsx(dt,{className:"h-28 rounded-xl"},u)):e.stats&&[{icon:He,label:"المستخدمون",value:e.stats.total_users,sub:`${e.stats.active_users} نشط`,color:"text-blue-600",bg:"bg-blue-50"},{icon:sa,label:"إرساليات اليوم",value:e.stats.submissions_today,sub:`من ${tt(e.stats.total_submissions)} إجمالي`,color:"text-emerald-600",bg:"bg-emerald-50",trend:e.stats.submissions_trend},{icon:nt,label:"المسودات",value:e.stats.draft_submissions,sub:"قيد الإعداد",color:"text-amber-600",bg:"bg-amber-50"},{icon:ya,label:"معدل الاعتماد",value:`${e.stats.approval_rate.toFixed(1)}%`,sub:"نسبة الإرسال",color:"text-purple-600",bg:"bg-purple-50"},{icon:nt,label:"النماذج النشطة",value:e.stats.active_forms,sub:`من ${e.stats.total_forms}`,color:"text-cyan-600",bg:"bg-cyan-50"},{icon:Ta,label:"إرساليات الأسبوع",value:e.stats.submissions_this_week,sub:"آخر 7 أيام",color:"text-rose-600",bg:"bg-rose-50"}].map((i,u)=>{const m=i.icon;return s.jsxs(Be,{className:"border-0 shadow-md hover:shadow-lg transition-shadow relative overflow-hidden group",children:[s.jsx("div",{className:_e("absolute top-0 left-0 right-0 h-1",i.color.replace("text-","bg-"))}),s.jsxs(qe,{className:"p-4",children:[s.jsxs("div",{className:"flex items-start justify-between mb-3",children:[s.jsx("div",{className:_e("p-2 rounded-xl",i.bg),children:s.jsx(m,{className:_e("w-5 h-5",i.color)})}),i.trend!==void 0&&s.jsxs("span",{className:_e("flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",i.trend>=0?"text-emerald-700 bg-emerald-50":"text-red-700 bg-red-50"),children:[i.trend>=0?s.jsx(ka,{className:"w-2.5 h-2.5"}):s.jsx(Jt,{className:"w-2.5 h-2.5"}),Math.abs(i.trend),"%"]})]}),s.jsx("p",{className:"text-2xl font-heading font-bold tabular-nums",children:tt(i.value)}),s.jsx("p",{className:"text-xs font-medium mt-0.5",children:i.label}),s.jsx("p",{className:"text-[10px] text-muted-foreground",children:i.sub})]})]},u)})}),s.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[s.jsxs(Be,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[s.jsxs(ct,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(gt,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Tt,{className:"w-5 h-5 text-primary"}),"حركة الإرساليات"]}),s.jsx(na,{className:"text-xs",children:"آخر 30 يوم"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportTimeline,children:[s.jsx(pt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),s.jsx(qe,{className:"pt-0",children:e.chartLoading?s.jsx(dt,{className:"w-full h-[280px]"}):s.jsx(Bt,{width:"100%",height:280,children:s.jsxs(wr,{data:e.chartData||[],children:[s.jsxs("defs",{children:[s.jsxs("linearGradient",{id:"gSubmitted",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#10b981",stopOpacity:.3}),s.jsx("stop",{offset:"95%",stopColor:"#10b981",stopOpacity:0})]}),s.jsxs("linearGradient",{id:"gDraft",x1:"0",y1:"0",x2:"0",y2:"1",children:[s.jsx("stop",{offset:"5%",stopColor:"#f59e0b",stopOpacity:.3}),s.jsx("stop",{offset:"95%",stopColor:"#f59e0b",stopOpacity:0})]})]}),s.jsx(Ma,{strokeDasharray:"3 3",stroke:"#e5e7eb"}),s.jsx(za,{dataKey:"date",tick:{fontSize:10,fill:"#6b7280"},tickFormatter:i=>i.slice(5),stroke:"#d1d5db"}),s.jsx(Pa,{tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),s.jsx(qt,{content:s.jsx(Ut,{})}),s.jsx(Sr,{formatter:i=>s.jsx("span",{className:"text-xs",children:i})}),s.jsx(Ia,{type:"monotone",dataKey:"submitted",name:"مرسلة",stroke:"#10b981",fill:"url(#gSubmitted)",strokeWidth:2.5,dot:!1}),s.jsx(Ia,{type:"monotone",dataKey:"draft",name:"مسودة",stroke:"#f59e0b",fill:"url(#gDraft)",strokeWidth:2.5,dot:!1})]})})})]}),s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsx(ct,{className:"pb-2",children:s.jsxs(gt,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Na,{className:"w-5 h-5 text-primary"}),"توزيع الحالات"]})}),s.jsx(qe,{children:e.statsLoading?s.jsx(dt,{className:"w-full h-[260px]"}):s.jsxs(s.Fragment,{children:[s.jsx(Bt,{width:"100%",height:180,children:s.jsxs(Aa,{children:[s.jsx(La,{data:e.statusPieData,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.statusPieData.map((i,u)=>s.jsx(la,{fill:i.color},u))}),s.jsx(qt,{content:s.jsx(Ut,{})})]})}),s.jsx("div",{className:"space-y-2 mt-2",children:e.statusPieData.map((i,u)=>s.jsxs("div",{className:"flex items-center justify-between text-sm",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:i.color}}),s.jsx("span",{className:"text-muted-foreground text-xs",children:i.name})]}),s.jsx("span",{className:"font-bold tabular-nums text-xs",children:tt(i.value)})]},u))})]})})]})]}),s.jsxs("div",{className:"grid grid-cols-1 xl:grid-cols-3 gap-6",children:[s.jsxs(Be,{className:"xl:col-span-2 border-0 shadow-md overflow-hidden",children:[s.jsxs(ct,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(gt,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(kt,{className:"w-5 h-5 text-primary"}),"الإرساليات حسب المحافظة"]}),s.jsx(na,{className:"text-xs",children:"أعلى 10 محافظات"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportGovernorates,children:[s.jsx(pt,{className:"w-3.5 h-3.5"})," تصدير"]})]}),s.jsx(qe,{className:"pt-0",children:e.govLoading?s.jsx(dt,{className:"w-full h-[280px]"}):s.jsx(Bt,{width:"100%",height:280,children:s.jsxs(kr,{data:e.govChartData,layout:"vertical",children:[s.jsx(Ma,{strokeDasharray:"3 3",stroke:"#e5e7eb",horizontal:!1}),s.jsx(za,{type:"number",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db"}),s.jsx(Pa,{dataKey:"name",type:"category",tick:{fontSize:10,fill:"#6b7280"},stroke:"#d1d5db",width:70}),s.jsx(qt,{content:s.jsx(Ut,{})}),s.jsx(Fr,{dataKey:"الإرساليات",radius:[0,8,8,0],children:e.govChartData.map((i,u)=>s.jsx(la,{fill:xt[u%xt.length]},u))})]})})})]}),s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsx(ct,{className:"pb-2",children:s.jsxs(gt,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(He,{className:"w-5 h-5 text-primary"}),"توزيع الأدوار"]})}),s.jsx(qe,{children:e.roleDistribution?s.jsxs(s.Fragment,{children:[s.jsx(Bt,{width:"100%",height:180,children:s.jsxs(Aa,{children:[s.jsx(La,{data:e.roleDistribution,cx:"50%",cy:"50%",innerRadius:45,outerRadius:70,paddingAngle:4,dataKey:"value",stroke:"#fff",strokeWidth:2,children:e.roleDistribution.map((i,u)=>s.jsx(la,{fill:xt[u%xt.length]},u))}),s.jsx(qt,{content:s.jsx(Ut,{})})]})}),s.jsx("div",{className:"space-y-2 mt-2",children:e.roleDistribution.map((i,u)=>s.jsxs("div",{className:"flex items-center justify-between text-sm",children:[s.jsxs("div",{className:"flex items-center gap-2",children:[s.jsx("div",{className:"w-3 h-3 rounded-sm",style:{backgroundColor:xt[u%xt.length]}}),s.jsx("span",{className:"text-muted-foreground text-xs",children:i.name})]}),s.jsx("span",{className:"font-bold tabular-nums text-xs",children:i.value})]},u))})]}):s.jsx(dt,{className:"w-full h-[260px]"})})]})]}),((C=e.auditData)==null?void 0:C.data)&&e.auditData.data.length>0&&s.jsxs(Be,{className:"border-0 shadow-md overflow-hidden",children:[s.jsxs(ct,{className:"flex flex-row items-center justify-between pb-2",children:[s.jsxs("div",{children:[s.jsxs(gt,{className:"text-base font-heading flex items-center gap-2",children:[s.jsx(Dr,{className:"w-5 h-5 text-primary"}),"آخر النشاطات"]}),s.jsx(na,{className:"text-xs",children:"آخر العمليات المسجلة في النظام"})]}),s.jsxs(We,{variant:"outline",size:"sm",className:"gap-1.5 text-xs",onClick:e.handleExportAudit,children:[s.jsx(pt,{className:"w-3.5 h-3.5"})," تصدير السجل"]})]}),s.jsx(qe,{className:"pt-0",children:s.jsx("div",{className:"space-y-0",children:(x=(D=e.auditData)==null?void 0:D.data)==null?void 0:x.slice(0,8).map((i,u)=>{var d,f,w;const m={create:{icon:ya,color:"text-emerald-600 bg-emerald-50"},update:{icon:Tt,color:"text-blue-600 bg-blue-50"},delete:{icon:zt,color:"text-red-600 bg-red-50"},login:{icon:He,color:"text-purple-600 bg-purple-50"}},o={create:"إنشاء",update:"تعديل",delete:"حذف",login:"دخول",logout:"خروج"},y={profiles:"المستخدمين",form_submissions:"الإرساليات",forms:"النماذج",supply_shortages:"النواقص",notifications:"الإشعارات"},v=m[i.action]||{icon:Rr,color:"text-muted-foreground bg-muted"},a=v.icon,h=Date.now()-new Date(i.created_at).getTime();let R;return h<6e4?R="الآن":h<36e5?R=`منذ ${Math.floor(h/6e4)} د`:h<864e5?R=`منذ ${Math.floor(h/36e5)} س`:R=`منذ ${Math.floor(h/864e5)} يوم`,s.jsxs("div",{className:_e("flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-muted/50 transition-colors",u<(((f=(d=e.auditData)==null?void 0:d.data)==null?void 0:f.length)??0)-1&&"border-b"),children:[s.jsx("div",{className:_e("p-2 rounded-lg",v.color),children:s.jsx(a,{className:"w-4 h-4"})}),s.jsxs("div",{className:"flex-1 min-w-0",children:[s.jsxs("p",{className:"text-sm font-medium truncate",children:[((w=i.profiles)==null?void 0:w.full_name)||"النظام"," — ",o[i.action]||i.action]}),s.jsxs("p",{className:"text-xs text-muted-foreground",children:[y[i.table_name]||i.table_name,i.ip_address&&` • ${i.ip_address}`]})]}),s.jsx("span",{className:"text-[11px] text-muted-foreground shrink-0",children:R})]},i.id)})})})]})]}),s.jsxs(Ot,{value:"quick-reports",className:"mt-0 space-y-6",children:[s.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-3",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(Ea,{className:"w-5 h-5 text-amber-500"}),"التقارير السريعة"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"اختر التصنيف أو ابحث عن تقرير"})]}),s.jsxs("div",{className:"flex items-center gap-3",children:[s.jsxs("div",{className:"relative w-64",children:[s.jsx(Vs,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),s.jsx(ut,{placeholder:"بحث في التقارير...",value:e.reportSearch,onChange:i=>e.setReportSearch(i.target.value),className:"pr-10 h-9 text-sm"}),e.reportSearch&&s.jsx("button",{onClick:()=>e.setReportSearch(""),className:"absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",children:s.jsx(Ja,{className:"w-3.5 h-3.5"})})]}),_&&s.jsxs(st,{variant:"secondary",className:"text-xs gap-1",children:[s.jsx(ha,{className:"w-3 h-3"})," ",_]}),s.jsxs(st,{variant:"outline",className:"text-xs",children:[S.length," تقرير"]})]})]}),s.jsx("div",{className:"flex items-center gap-2 flex-wrap",children:[{key:"all",label:"الكل",icon:sa,color:"bg-primary text-primary-foreground"},{key:"favorites",label:"المفضلة",icon:es,color:"bg-amber-500 text-white"},{key:"excel",label:"Excel / CSV",icon:_t,color:"bg-emerald-600 text-white"},{key:"pdf",label:"PDF",icon:nt,color:"bg-red-600 text-white"},{key:"pptx",label:"PowerPoint",icon:kt,color:"bg-orange-600 text-white"}].map(i=>{const u=i.icon,m=e.reportFormat===i.key,o=z[i.key];return s.jsxs("button",{onClick:()=>e.setReportFormat(i.key),className:_e("flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",m?`${i.color} shadow-md scale-105`:"bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"),children:[s.jsx(u,{className:"w-4 h-4"}),s.jsx("span",{children:i.label}),s.jsx("span",{className:_e("text-[10px] font-bold px-1.5 py-0.5 rounded-full",m?"bg-white/20":"bg-muted"),children:o})]},i.key)})}),S.length===0?s.jsxs("div",{className:"text-center py-16",children:[s.jsx(oa,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),s.jsx("h3",{className:"text-lg font-medium",children:e.reportSearch?"لا توجد نتائج للبحث":"لا توجد تقارير متاحة"}),s.jsx("p",{className:"text-sm text-muted-foreground",children:e.reportSearch?"جرّب كلمة مختلفة":"تواصل مع مدير النظام للحصول على صلاحيات"})]}):s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5",children:S.map((i,u)=>s.jsx(Tr,{...i},u))})]}),s.jsxs(Ot,{value:"form-exports",className:"mt-0 space-y-4",children:[s.jsxs("div",{className:"flex items-center justify-between",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(_t,{className:"w-5 h-5 text-emerald-500"}),"تصدير النماذج"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"تصدير إرساليات كل نموذج بشكل منفصل"})]}),s.jsxs("div",{className:"relative w-64",children:[s.jsx(nt,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"}),s.jsx(ut,{placeholder:"بحث...",value:e.formSearch,onChange:i=>e.setFormSearch(i.target.value),className:"pr-10 h-9 text-sm"})]})]}),e.formsLoading?s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:Array.from({length:6}).map((i,u)=>s.jsx(dt,{className:"h-56 rounded-xl"},u))}):e.filteredForms.length===0?s.jsxs("div",{className:"text-center py-16",children:[s.jsx(_t,{className:"w-16 h-16 mx-auto text-muted-foreground/30 mb-4"}),s.jsx("h3",{className:"text-lg font-medium",children:e.formSearch?"لا توجد نتائج":"لا توجد نماذج"})]}):s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4",children:e.filteredForms.map(i=>{var u;return s.jsx(Er,{form:i,submissionCount:(u=e.submissionCounts)==null?void 0:u[i.id],onExport:e.handleExportForm,exporting:e.exportingFormId===i.id},i.id)})})]}),s.jsxs(Ot,{value:"comparison",className:"mt-0 space-y-4",children:[s.jsxs("div",{children:[s.jsxs("h2",{className:"text-lg font-heading font-bold flex items-center gap-2",children:[s.jsx(_a,{className:"w-5 h-5 text-primary"}),"مقارنة الفترات"]}),s.jsx("p",{className:"text-xs text-muted-foreground mt-0.5",children:"قارن أداء الفترة الحالية بالسابقة"})]}),s.jsx(Gr,{})]})]})})]}),e.exportProgress.isActive&&s.jsx("div",{className:"fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto",children:s.jsx(Cr,{status:e.exportProgress.status,message:e.exportProgress.message,progress:e.exportProgress.progress,total:e.exportProgress.total})}),s.jsx(as,{...e.previewProps}),s.jsx(Br,{open:e.drillDownOpen,onClose:()=>e.setDrillDownOpen(!1),data:e.drillDownData}),s.jsx(Ur,{open:!!e.fullscreenChart,onClose:()=>e.setFullscreenChart(null),title:e.fullscreenChart||"",children:s.jsx("div",{className:"h-full flex items-center justify-center text-muted-foreground",children:s.jsx("p",{className:"text-sm",children:"اضغط ESC للإغلاق"})})})]})}export{Cn as default};
