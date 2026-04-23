const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/DashboardPage-BBa4XG7o.js","assets/data-vendor-C69A2NXF.js","assets/react-vendor-CD31eg2q.js","assets/progress-CH5DF247.js","assets/ui-vendor-DNFAusO9.js","assets/tabs-Dxvei8Nq.js","assets/header-C1zmr8U4.js","assets/file-text-COnwjPe6.js","assets/wifi-BIJ5sGgn.js","assets/wifi-off-BQ45ENIA.js","assets/activity-TsYcKwda.js","assets/chart-vendor-sBqPOh__.js","assets/circle-check-CcyF10Bk.js","assets/arrow-up-right-CnciUe-v.js","assets/target-CoPGRMjp.js","assets/map-pin-BGngV7iW.js","assets/trending-up-Fie0lSFO.js","assets/trending-down-CjI2TPqY.js","assets/UsersPage-fqMLR3ZD.js","assets/select-B4FXL90S.js","assets/dropdown-menu-ikvV-__H.js","assets/dialog-CV9woafd.js","assets/square-pen-BBHpDYJy.js","assets/mail-T9F3emPQ.js","assets/ellipsis-vertical-wlqRN6wM.js","assets/trash-2-cN-dqp35.js","assets/index-PEhoLQFk.js","assets/switch-5CeQn0A2.js","assets/calendar-CAn3Wjdw.js","assets/settings-zo2Ciirt.js","assets/chevron-up-Bke3UZB3.js","assets/list-checks-kuhWgRV-.js","assets/type-CHzhPY6R.js","assets/smartphone-BmYwkQ-7.js","assets/download-CorU9Ehn.js","assets/circle-x-Cu93zUP8.js","assets/SubmissionsPage-tsj2dR_C.js","assets/table-D6YUdy0e.js","assets/AIInsightsPage-BKVgYkYN.js","assets/AISettingsPage-DB0At9KN.js","assets/layers-B-DQ6CaG.js","assets/save-UBO7P2fh.js","assets/AuditPage-AlfcCma6.js","assets/circle-check-big-OIbBpC2m.js","assets/GovernoratesPage-DJ9B84Mi.js","assets/rotate-ccw-yXxjsjLQ.js","assets/MapPage-BYtKtb--.js","assets/external-link-qc-TehAM.js","assets/MapPage-Dgihpmma.css","assets/PagesManagementPage-czoQSQu8.js","assets/palette-BoIlpjbj.js","assets/folder-open-C46Rk2-U.js","assets/chart-pie-BsduJNDJ.js","assets/history-CJvuHPUF.js","assets/SettingsPage-8Y5piKVT.js","assets/volume-x-C--VuK2X.js","assets/package-x-C6uoaAFc.js","assets/info-x0e4E3BI.js","assets/ChatPage-Cwpgk9zx.js","assets/BotChatPage-CMdhwdD0.js","assets/NotificationsPage-DvGRR4Jh.js","assets/ReferencesPage-kfoy3K2f.js","assets/ReportsPage-DdQj5IBV.js"])))=>i.map(i=>d[i]);
var nn=Object.defineProperty;var on=(e,t,o)=>t in e?nn(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o;var te=(e,t,o)=>on(e,typeof t!="symbol"?t+"":t,o);import{j as n,c as sn,u as A,d as q,e as V,Q as an,f as rn}from"./data-vendor-C69A2NXF.js";import{f as dn,g as ln,a as u,u as pt,L as Ae,b as cn,h as un,N as ye,O as pn,i as mn,j as S,R as gn,B as bn}from"./react-vendor-CD31eg2q.js";import{V as mt,R as gt,A as bt,C as yt,T as ht,D as ft,P as yn,S as hn,a as xt,b as fn,c as _t,d as xn,e as _n,f as wt,g as wn,h as kt,i as vt,I as It,F as Pt,j as jt}from"./ui-vendor-DNFAusO9.js";import{c as Tt}from"./chart-vendor-sBqPOh__.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function o(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(i){if(i.ep)return;i.ep=!0;const a=o(i);fetch(i.href,a)}})();var ke={},Ze;function kn(){if(Ze)return ke;Ze=1;var e=dn();return ke.createRoot=e.createRoot,ke.hydrateRoot=e.hydrateRoot,ke}var vn=kn();const In=ln(vn),Je=e=>typeof e=="boolean"?`${e}`:e===0?"0":e,Xe=Tt,Te=(e,t)=>o=>{var s;if((t==null?void 0:t.variants)==null)return Xe(e,o==null?void 0:o.class,o==null?void 0:o.className);const{variants:i,defaultVariants:a}=t,r=Object.keys(i).map(l=>{const p=o==null?void 0:o[l],g=a==null?void 0:a[l];if(p===null)return null;const b=Je(p)||Je(g);return i[l][b]}),d=o&&Object.entries(o).reduce((l,p)=>{let[g,b]=p;return b===void 0||(l[g]=b),l},{}),c=t==null||(s=t.compoundVariants)===null||s===void 0?void 0:s.reduce((l,p)=>{let{class:g,className:b,..._}=p;return Object.entries(_).every(y=>{let[h,I]=y;return Array.isArray(I)?I.includes({...a,...d}[h]):{...a,...d}[h]===I})?[...l,g,b]:l},[]);return Xe(e,r,c,o==null?void 0:o.class,o==null?void 0:o.className)};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pn=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),Et=(...e)=>e.filter((t,o,s)=>!!t&&t.trim()!==""&&s.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var jn={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tn=u.forwardRef(({color:e="currentColor",size:t=24,strokeWidth:o=2,absoluteStrokeWidth:s,className:i="",children:a,iconNode:r,...d},c)=>u.createElement("svg",{ref:c,...jn,width:t,height:t,stroke:e,strokeWidth:s?Number(o)*24/Number(t):o,className:Et("lucide",i),...d},[...r.map(([l,p])=>u.createElement(l,p)),...Array.isArray(a)?a:[a]]));/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=(e,t)=>{const o=u.forwardRef(({className:s,...i},a)=>u.createElement(Tn,{ref:a,iconNode:t,className:Et(`lucide-${Pn(e)}`,s),...i}));return o.displayName=`${e}`,o};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const En=x("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nn=x("BellRing",[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M22 8c0-2.3-.8-4.3-2-6",key:"5bb3ad"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}],["path",{d:"M4 2C2.8 3.7 2 5.7 2 8",key:"tap9e0"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sn=x("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=x("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cn=x("Brain",[["path",{d:"M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",key:"l5xja"}],["path",{d:"M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z",key:"ep3f8r"}],["path",{d:"M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4",key:"1p4c4q"}],["path",{d:"M17.599 6.5a3 3 0 0 0 .399-1.375",key:"tmeiqw"}],["path",{d:"M6.003 5.125A3 3 0 0 0 6.401 6.5",key:"105sqy"}],["path",{d:"M3.477 10.896a4 4 0 0 1 .585-.396",key:"ql3yin"}],["path",{d:"M19.938 10.5a4 4 0 0 1 .585.396",key:"1qfode"}],["path",{d:"M6 18a4 4 0 0 1-1.967-.516",key:"2e4loj"}],["path",{d:"M19.967 17.484A4 4 0 0 1 18 18",key:"159ez6"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mn=x("ChartColumn",[["path",{d:"M3 3v16a2 2 0 0 0 2 2h16",key:"c24i48"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bn=x("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const An=x("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qn=x("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const et=x("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vn=x("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rn=x("Cog",[["path",{d:"M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",key:"sobvz5"}],["path",{d:"M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",key:"11i496"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 22v-2",key:"1osdcq"}],["path",{d:"m17 20.66-1-1.73",key:"eq3orb"}],["path",{d:"M11 10.27 7 3.34",key:"16pf9h"}],["path",{d:"m20.66 17-1.73-1",key:"sg0v6f"}],["path",{d:"m3.34 7 1.73 1",key:"1ulond"}],["path",{d:"M14 12h8",key:"4f43i9"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"m20.66 7-1.73 1",key:"1ow05n"}],["path",{d:"m3.34 17 1.73-1",key:"nuk764"}],["path",{d:"m17 3.34-1 1.73",key:"2wel8s"}],["path",{d:"m11 13.73-4 6.93",key:"794ttg"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const On=x("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dn=x("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zn=x("EyeOff",[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fn=x("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ln=x("FileSearch",[["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M4.268 21a2 2 0 0 0 1.727 1H18a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3",key:"ms7g94"}],["path",{d:"m9 18-1.5-1.5",key:"1j6qii"}],["circle",{cx:"5",cy:"14",r:"3",key:"ufru5t"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $n=x("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gn=x("FileStack",[["path",{d:"M21 7h-3a2 2 0 0 1-2-2V2",key:"9rb54x"}],["path",{d:"M21 6v6.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5v-9c0-.8.7-1.5 1.5-1.5H17Z",key:"1059l0"}],["path",{d:"M7 8v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H15",key:"16874u"}],["path",{d:"M3 12v8.8c0 .3.2.6.4.8.2.2.5.4.8.4H11",key:"k2ox98"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nt=x("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hn=x("Gauge",[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kn=x("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Un=x("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wn=x("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tt=x("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qn=x("MapPinned",[["path",{d:"M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0",key:"11u0oz"}],["circle",{cx:"12",cy:"8",r:"2",key:"1822b1"}],["path",{d:"M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712",key:"q8zwxj"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zn=x("Maximize2",[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jn=x("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xn=x("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yn=x("Minimize2",[["polyline",{points:"4 14 10 14 10 20",key:"11kfnr"}],["polyline",{points:"20 10 14 10 14 4",key:"rlmsce"}],["line",{x1:"14",x2:"21",y1:"10",y2:"3",key:"o5lafz"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eo=x("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const to=x("Navigation",[["polygon",{points:"3 11 22 2 13 21 11 13 3 11",key:"1ltx0t"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const no=x("PanelsTopLeft",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M9 21V9",key:"1oto5p"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oo=x("Pin",[["path",{d:"M12 17v5",key:"bb1du9"}],["path",{d:"M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z",key:"1nkz8b"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const so=x("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=x("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ao=x("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const io=x("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ro=x("Shield",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pe=x("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lo=x("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const co=x("ThumbsDown",[["path",{d:"M17 14V2",key:"8ymqnk"}],["path",{d:"M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z",key:"m61m77"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uo=x("ThumbsUp",[["path",{d:"M7 10v12",key:"1qc93n"}],["path",{d:"M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z",key:"emmmcr"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const St=x("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const po=x("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mo=x("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=x("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const go=x("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]),ze="-",bo=e=>{const t=ho(e),{conflictingClassGroups:o,conflictingClassGroupModifiers:s}=e;return{getClassGroupId:r=>{const d=r.split(ze);return d[0]===""&&d.length!==1&&d.shift(),Ct(d,t)||yo(r)},getConflictingClassGroupIds:(r,d)=>{const c=o[r]||[];return d&&s[r]?[...c,...s[r]]:c}}},Ct=(e,t)=>{var r;if(e.length===0)return t.classGroupId;const o=e[0],s=t.nextPart.get(o),i=s?Ct(e.slice(1),s):void 0;if(i)return i;if(t.validators.length===0)return;const a=e.join(ze);return(r=t.validators.find(({validator:d})=>d(a)))==null?void 0:r.classGroupId},nt=/^\[(.+)\]$/,yo=e=>{if(nt.test(e)){const t=nt.exec(e)[1],o=t==null?void 0:t.substring(0,t.indexOf(":"));if(o)return"arbitrary.."+o}},ho=e=>{const{theme:t,prefix:o}=e,s={nextPart:new Map,validators:[]};return xo(Object.entries(e.classGroups),o).forEach(([a,r])=>{qe(r,s,a,t)}),s},qe=(e,t,o,s)=>{e.forEach(i=>{if(typeof i=="string"){const a=i===""?t:ot(t,i);a.classGroupId=o;return}if(typeof i=="function"){if(fo(i)){qe(i(s),t,o,s);return}t.validators.push({validator:i,classGroupId:o});return}Object.entries(i).forEach(([a,r])=>{qe(r,ot(t,a),o,s)})})},ot=(e,t)=>{let o=e;return t.split(ze).forEach(s=>{o.nextPart.has(s)||o.nextPart.set(s,{nextPart:new Map,validators:[]}),o=o.nextPart.get(s)}),o},fo=e=>e.isThemeGetter,xo=(e,t)=>t?e.map(([o,s])=>{const i=s.map(a=>typeof a=="string"?t+a:typeof a=="object"?Object.fromEntries(Object.entries(a).map(([r,d])=>[t+r,d])):a);return[o,i]}):e,_o=e=>{if(e<1)return{get:()=>{},set:()=>{}};let t=0,o=new Map,s=new Map;const i=(a,r)=>{o.set(a,r),t++,t>e&&(t=0,s=o,o=new Map)};return{get(a){let r=o.get(a);if(r!==void 0)return r;if((r=s.get(a))!==void 0)return i(a,r),r},set(a,r){o.has(a)?o.set(a,r):i(a,r)}}},Mt="!",wo=e=>{const{separator:t,experimentalParseClassName:o}=e,s=t.length===1,i=t[0],a=t.length,r=d=>{const c=[];let l=0,p=0,g;for(let I=0;I<d.length;I++){let E=d[I];if(l===0){if(E===i&&(s||d.slice(I,I+a)===t)){c.push(d.slice(p,I)),p=I+a;continue}if(E==="/"){g=I;continue}}E==="["?l++:E==="]"&&l--}const b=c.length===0?d:d.substring(p),_=b.startsWith(Mt),y=_?b.substring(1):b,h=g&&g>p?g-p:void 0;return{modifiers:c,hasImportantModifier:_,baseClassName:y,maybePostfixModifierPosition:h}};return o?d=>o({className:d,parseClassName:r}):r},ko=e=>{if(e.length<=1)return e;const t=[];let o=[];return e.forEach(s=>{s[0]==="["?(t.push(...o.sort(),s),o=[]):o.push(s)}),t.push(...o.sort()),t},vo=e=>({cache:_o(e.cacheSize),parseClassName:wo(e),...bo(e)}),Io=/\s+/,Po=(e,t)=>{const{parseClassName:o,getClassGroupId:s,getConflictingClassGroupIds:i}=t,a=[],r=e.trim().split(Io);let d="";for(let c=r.length-1;c>=0;c-=1){const l=r[c],{modifiers:p,hasImportantModifier:g,baseClassName:b,maybePostfixModifierPosition:_}=o(l);let y=!!_,h=s(y?b.substring(0,_):b);if(!h){if(!y){d=l+(d.length>0?" "+d:d);continue}if(h=s(b),!h){d=l+(d.length>0?" "+d:d);continue}y=!1}const I=ko(p).join(":"),E=g?I+Mt:I,M=E+h;if(a.includes(M))continue;a.push(M);const W=i(h,y);for(let H=0;H<W.length;++H){const oe=W[H];a.push(E+oe)}d=l+(d.length>0?" "+d:d)}return d};function jo(){let e=0,t,o,s="";for(;e<arguments.length;)(t=arguments[e++])&&(o=Bt(t))&&(s&&(s+=" "),s+=o);return s}const Bt=e=>{if(typeof e=="string")return e;let t,o="";for(let s=0;s<e.length;s++)e[s]&&(t=Bt(e[s]))&&(o&&(o+=" "),o+=t);return o};function To(e,...t){let o,s,i,a=r;function r(c){const l=t.reduce((p,g)=>g(p),e());return o=vo(l),s=o.cache.get,i=o.cache.set,a=d,d(c)}function d(c){const l=s(c);if(l)return l;const p=Po(c,o);return i(c,p),p}return function(){return a(jo.apply(null,arguments))}}const j=e=>{const t=o=>o[e]||[];return t.isThemeGetter=!0,t},At=/^\[(?:([a-z-]+):)?(.+)\]$/i,Eo=/^\d+\/\d+$/,No=new Set(["px","full","screen"]),So=/^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,Co=/\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,Mo=/^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,Bo=/^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,Ao=/^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,U=e=>ie(e)||No.has(e)||Eo.test(e),X=e=>ce(e,"length",Lo),ie=e=>!!e&&!Number.isNaN(Number(e)),Ee=e=>ce(e,"number",ie),me=e=>!!e&&Number.isInteger(Number(e)),qo=e=>e.endsWith("%")&&ie(e.slice(0,-1)),v=e=>At.test(e),Y=e=>So.test(e),Vo=new Set(["length","size","percentage"]),Ro=e=>ce(e,Vo,qt),Oo=e=>ce(e,"position",qt),Do=new Set(["image","url"]),zo=e=>ce(e,Do,Go),Fo=e=>ce(e,"",$o),ge=()=>!0,ce=(e,t,o)=>{const s=At.exec(e);return s?s[1]?typeof t=="string"?s[1]===t:t.has(s[1]):o(s[2]):!1},Lo=e=>Co.test(e)&&!Mo.test(e),qt=()=>!1,$o=e=>Bo.test(e),Go=e=>Ao.test(e),Ho=()=>{const e=j("colors"),t=j("spacing"),o=j("blur"),s=j("brightness"),i=j("borderColor"),a=j("borderRadius"),r=j("borderSpacing"),d=j("borderWidth"),c=j("contrast"),l=j("grayscale"),p=j("hueRotate"),g=j("invert"),b=j("gap"),_=j("gradientColorStops"),y=j("gradientColorStopPositions"),h=j("inset"),I=j("margin"),E=j("opacity"),M=j("padding"),W=j("saturate"),H=j("scale"),oe=j("sepia"),ue=j("skew"),fe=j("space"),xe=j("translate"),se=()=>["auto","contain","none"],m=()=>["auto","hidden","clip","visible","scroll"],P=()=>["auto",v,t],w=()=>[v,t],B=()=>["",U,X],K=()=>["auto",ie,v],$=()=>["bottom","center","left","left-bottom","left-top","right","right-bottom","right-top","top"],Q=()=>["solid","dashed","dotted","double","none"],N=()=>["normal","multiply","screen","overlay","darken","lighten","color-dodge","color-burn","hard-light","soft-light","difference","exclusion","hue","saturation","color","luminosity"],ae=()=>["start","end","center","between","around","evenly","stretch"],ee=()=>["","0",v],_e=()=>["auto","avoid","all","avoid-page","page","left","right","column"],L=()=>[ie,v];return{cacheSize:500,separator:":",theme:{colors:[ge],spacing:[U,X],blur:["none","",Y,v],brightness:L(),borderColor:[e],borderRadius:["none","","full",Y,v],borderSpacing:w(),borderWidth:B(),contrast:L(),grayscale:ee(),hueRotate:L(),invert:ee(),gap:w(),gradientColorStops:[e],gradientColorStopPositions:[qo,X],inset:P(),margin:P(),opacity:L(),padding:w(),saturate:L(),scale:L(),sepia:ee(),skew:L(),space:w(),translate:w()},classGroups:{aspect:[{aspect:["auto","square","video",v]}],container:["container"],columns:[{columns:[Y]}],"break-after":[{"break-after":_e()}],"break-before":[{"break-before":_e()}],"break-inside":[{"break-inside":["auto","avoid","avoid-page","avoid-column"]}],"box-decoration":[{"box-decoration":["slice","clone"]}],box:[{box:["border","content"]}],display:["block","inline-block","inline","flex","inline-flex","table","inline-table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row-group","table-row","flow-root","grid","inline-grid","contents","list-item","hidden"],float:[{float:["right","left","none","start","end"]}],clear:[{clear:["left","right","both","none","start","end"]}],isolation:["isolate","isolation-auto"],"object-fit":[{object:["contain","cover","fill","none","scale-down"]}],"object-position":[{object:[...$(),v]}],overflow:[{overflow:m()}],"overflow-x":[{"overflow-x":m()}],"overflow-y":[{"overflow-y":m()}],overscroll:[{overscroll:se()}],"overscroll-x":[{"overscroll-x":se()}],"overscroll-y":[{"overscroll-y":se()}],position:["static","fixed","absolute","relative","sticky"],inset:[{inset:[h]}],"inset-x":[{"inset-x":[h]}],"inset-y":[{"inset-y":[h]}],start:[{start:[h]}],end:[{end:[h]}],top:[{top:[h]}],right:[{right:[h]}],bottom:[{bottom:[h]}],left:[{left:[h]}],visibility:["visible","invisible","collapse"],z:[{z:["auto",me,v]}],basis:[{basis:P()}],"flex-direction":[{flex:["row","row-reverse","col","col-reverse"]}],"flex-wrap":[{flex:["wrap","wrap-reverse","nowrap"]}],flex:[{flex:["1","auto","initial","none",v]}],grow:[{grow:ee()}],shrink:[{shrink:ee()}],order:[{order:["first","last","none",me,v]}],"grid-cols":[{"grid-cols":[ge]}],"col-start-end":[{col:["auto",{span:["full",me,v]},v]}],"col-start":[{"col-start":K()}],"col-end":[{"col-end":K()}],"grid-rows":[{"grid-rows":[ge]}],"row-start-end":[{row:["auto",{span:[me,v]},v]}],"row-start":[{"row-start":K()}],"row-end":[{"row-end":K()}],"grid-flow":[{"grid-flow":["row","col","dense","row-dense","col-dense"]}],"auto-cols":[{"auto-cols":["auto","min","max","fr",v]}],"auto-rows":[{"auto-rows":["auto","min","max","fr",v]}],gap:[{gap:[b]}],"gap-x":[{"gap-x":[b]}],"gap-y":[{"gap-y":[b]}],"justify-content":[{justify:["normal",...ae()]}],"justify-items":[{"justify-items":["start","end","center","stretch"]}],"justify-self":[{"justify-self":["auto","start","end","center","stretch"]}],"align-content":[{content:["normal",...ae(),"baseline"]}],"align-items":[{items:["start","end","center","baseline","stretch"]}],"align-self":[{self:["auto","start","end","center","stretch","baseline"]}],"place-content":[{"place-content":[...ae(),"baseline"]}],"place-items":[{"place-items":["start","end","center","baseline","stretch"]}],"place-self":[{"place-self":["auto","start","end","center","stretch"]}],p:[{p:[M]}],px:[{px:[M]}],py:[{py:[M]}],ps:[{ps:[M]}],pe:[{pe:[M]}],pt:[{pt:[M]}],pr:[{pr:[M]}],pb:[{pb:[M]}],pl:[{pl:[M]}],m:[{m:[I]}],mx:[{mx:[I]}],my:[{my:[I]}],ms:[{ms:[I]}],me:[{me:[I]}],mt:[{mt:[I]}],mr:[{mr:[I]}],mb:[{mb:[I]}],ml:[{ml:[I]}],"space-x":[{"space-x":[fe]}],"space-x-reverse":["space-x-reverse"],"space-y":[{"space-y":[fe]}],"space-y-reverse":["space-y-reverse"],w:[{w:["auto","min","max","fit","svw","lvw","dvw",v,t]}],"min-w":[{"min-w":[v,t,"min","max","fit"]}],"max-w":[{"max-w":[v,t,"none","full","min","max","fit","prose",{screen:[Y]},Y]}],h:[{h:[v,t,"auto","min","max","fit","svh","lvh","dvh"]}],"min-h":[{"min-h":[v,t,"min","max","fit","svh","lvh","dvh"]}],"max-h":[{"max-h":[v,t,"min","max","fit","svh","lvh","dvh"]}],size:[{size:[v,t,"auto","min","max","fit"]}],"font-size":[{text:["base",Y,X]}],"font-smoothing":["antialiased","subpixel-antialiased"],"font-style":["italic","not-italic"],"font-weight":[{font:["thin","extralight","light","normal","medium","semibold","bold","extrabold","black",Ee]}],"font-family":[{font:[ge]}],"fvn-normal":["normal-nums"],"fvn-ordinal":["ordinal"],"fvn-slashed-zero":["slashed-zero"],"fvn-figure":["lining-nums","oldstyle-nums"],"fvn-spacing":["proportional-nums","tabular-nums"],"fvn-fraction":["diagonal-fractions","stacked-fractions"],tracking:[{tracking:["tighter","tight","normal","wide","wider","widest",v]}],"line-clamp":[{"line-clamp":["none",ie,Ee]}],leading:[{leading:["none","tight","snug","normal","relaxed","loose",U,v]}],"list-image":[{"list-image":["none",v]}],"list-style-type":[{list:["none","disc","decimal",v]}],"list-style-position":[{list:["inside","outside"]}],"placeholder-color":[{placeholder:[e]}],"placeholder-opacity":[{"placeholder-opacity":[E]}],"text-alignment":[{text:["left","center","right","justify","start","end"]}],"text-color":[{text:[e]}],"text-opacity":[{"text-opacity":[E]}],"text-decoration":["underline","overline","line-through","no-underline"],"text-decoration-style":[{decoration:[...Q(),"wavy"]}],"text-decoration-thickness":[{decoration:["auto","from-font",U,X]}],"underline-offset":[{"underline-offset":["auto",U,v]}],"text-decoration-color":[{decoration:[e]}],"text-transform":["uppercase","lowercase","capitalize","normal-case"],"text-overflow":["truncate","text-ellipsis","text-clip"],"text-wrap":[{text:["wrap","nowrap","balance","pretty"]}],indent:[{indent:w()}],"vertical-align":[{align:["baseline","top","middle","bottom","text-top","text-bottom","sub","super",v]}],whitespace:[{whitespace:["normal","nowrap","pre","pre-line","pre-wrap","break-spaces"]}],break:[{break:["normal","words","all","keep"]}],hyphens:[{hyphens:["none","manual","auto"]}],content:[{content:["none",v]}],"bg-attachment":[{bg:["fixed","local","scroll"]}],"bg-clip":[{"bg-clip":["border","padding","content","text"]}],"bg-opacity":[{"bg-opacity":[E]}],"bg-origin":[{"bg-origin":["border","padding","content"]}],"bg-position":[{bg:[...$(),Oo]}],"bg-repeat":[{bg:["no-repeat",{repeat:["","x","y","round","space"]}]}],"bg-size":[{bg:["auto","cover","contain",Ro]}],"bg-image":[{bg:["none",{"gradient-to":["t","tr","r","br","b","bl","l","tl"]},zo]}],"bg-color":[{bg:[e]}],"gradient-from-pos":[{from:[y]}],"gradient-via-pos":[{via:[y]}],"gradient-to-pos":[{to:[y]}],"gradient-from":[{from:[_]}],"gradient-via":[{via:[_]}],"gradient-to":[{to:[_]}],rounded:[{rounded:[a]}],"rounded-s":[{"rounded-s":[a]}],"rounded-e":[{"rounded-e":[a]}],"rounded-t":[{"rounded-t":[a]}],"rounded-r":[{"rounded-r":[a]}],"rounded-b":[{"rounded-b":[a]}],"rounded-l":[{"rounded-l":[a]}],"rounded-ss":[{"rounded-ss":[a]}],"rounded-se":[{"rounded-se":[a]}],"rounded-ee":[{"rounded-ee":[a]}],"rounded-es":[{"rounded-es":[a]}],"rounded-tl":[{"rounded-tl":[a]}],"rounded-tr":[{"rounded-tr":[a]}],"rounded-br":[{"rounded-br":[a]}],"rounded-bl":[{"rounded-bl":[a]}],"border-w":[{border:[d]}],"border-w-x":[{"border-x":[d]}],"border-w-y":[{"border-y":[d]}],"border-w-s":[{"border-s":[d]}],"border-w-e":[{"border-e":[d]}],"border-w-t":[{"border-t":[d]}],"border-w-r":[{"border-r":[d]}],"border-w-b":[{"border-b":[d]}],"border-w-l":[{"border-l":[d]}],"border-opacity":[{"border-opacity":[E]}],"border-style":[{border:[...Q(),"hidden"]}],"divide-x":[{"divide-x":[d]}],"divide-x-reverse":["divide-x-reverse"],"divide-y":[{"divide-y":[d]}],"divide-y-reverse":["divide-y-reverse"],"divide-opacity":[{"divide-opacity":[E]}],"divide-style":[{divide:Q()}],"border-color":[{border:[i]}],"border-color-x":[{"border-x":[i]}],"border-color-y":[{"border-y":[i]}],"border-color-s":[{"border-s":[i]}],"border-color-e":[{"border-e":[i]}],"border-color-t":[{"border-t":[i]}],"border-color-r":[{"border-r":[i]}],"border-color-b":[{"border-b":[i]}],"border-color-l":[{"border-l":[i]}],"divide-color":[{divide:[i]}],"outline-style":[{outline:["",...Q()]}],"outline-offset":[{"outline-offset":[U,v]}],"outline-w":[{outline:[U,X]}],"outline-color":[{outline:[e]}],"ring-w":[{ring:B()}],"ring-w-inset":["ring-inset"],"ring-color":[{ring:[e]}],"ring-opacity":[{"ring-opacity":[E]}],"ring-offset-w":[{"ring-offset":[U,X]}],"ring-offset-color":[{"ring-offset":[e]}],shadow:[{shadow:["","inner","none",Y,Fo]}],"shadow-color":[{shadow:[ge]}],opacity:[{opacity:[E]}],"mix-blend":[{"mix-blend":[...N(),"plus-lighter","plus-darker"]}],"bg-blend":[{"bg-blend":N()}],filter:[{filter:["","none"]}],blur:[{blur:[o]}],brightness:[{brightness:[s]}],contrast:[{contrast:[c]}],"drop-shadow":[{"drop-shadow":["","none",Y,v]}],grayscale:[{grayscale:[l]}],"hue-rotate":[{"hue-rotate":[p]}],invert:[{invert:[g]}],saturate:[{saturate:[W]}],sepia:[{sepia:[oe]}],"backdrop-filter":[{"backdrop-filter":["","none"]}],"backdrop-blur":[{"backdrop-blur":[o]}],"backdrop-brightness":[{"backdrop-brightness":[s]}],"backdrop-contrast":[{"backdrop-contrast":[c]}],"backdrop-grayscale":[{"backdrop-grayscale":[l]}],"backdrop-hue-rotate":[{"backdrop-hue-rotate":[p]}],"backdrop-invert":[{"backdrop-invert":[g]}],"backdrop-opacity":[{"backdrop-opacity":[E]}],"backdrop-saturate":[{"backdrop-saturate":[W]}],"backdrop-sepia":[{"backdrop-sepia":[oe]}],"border-collapse":[{border:["collapse","separate"]}],"border-spacing":[{"border-spacing":[r]}],"border-spacing-x":[{"border-spacing-x":[r]}],"border-spacing-y":[{"border-spacing-y":[r]}],"table-layout":[{table:["auto","fixed"]}],caption:[{caption:["top","bottom"]}],transition:[{transition:["none","all","","colors","opacity","shadow","transform",v]}],duration:[{duration:L()}],ease:[{ease:["linear","in","out","in-out",v]}],delay:[{delay:L()}],animate:[{animate:["none","spin","ping","pulse","bounce",v]}],transform:[{transform:["","gpu","none"]}],scale:[{scale:[H]}],"scale-x":[{"scale-x":[H]}],"scale-y":[{"scale-y":[H]}],rotate:[{rotate:[me,v]}],"translate-x":[{"translate-x":[xe]}],"translate-y":[{"translate-y":[xe]}],"skew-x":[{"skew-x":[ue]}],"skew-y":[{"skew-y":[ue]}],"transform-origin":[{origin:["center","top","top-right","right","bottom-right","bottom","bottom-left","left","top-left",v]}],accent:[{accent:["auto",e]}],appearance:[{appearance:["none","auto"]}],cursor:[{cursor:["auto","default","pointer","wait","text","move","help","not-allowed","none","context-menu","progress","cell","crosshair","vertical-text","alias","copy","no-drop","grab","grabbing","all-scroll","col-resize","row-resize","n-resize","e-resize","s-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","zoom-in","zoom-out",v]}],"caret-color":[{caret:[e]}],"pointer-events":[{"pointer-events":["none","auto"]}],resize:[{resize:["none","y","x",""]}],"scroll-behavior":[{scroll:["auto","smooth"]}],"scroll-m":[{"scroll-m":w()}],"scroll-mx":[{"scroll-mx":w()}],"scroll-my":[{"scroll-my":w()}],"scroll-ms":[{"scroll-ms":w()}],"scroll-me":[{"scroll-me":w()}],"scroll-mt":[{"scroll-mt":w()}],"scroll-mr":[{"scroll-mr":w()}],"scroll-mb":[{"scroll-mb":w()}],"scroll-ml":[{"scroll-ml":w()}],"scroll-p":[{"scroll-p":w()}],"scroll-px":[{"scroll-px":w()}],"scroll-py":[{"scroll-py":w()}],"scroll-ps":[{"scroll-ps":w()}],"scroll-pe":[{"scroll-pe":w()}],"scroll-pt":[{"scroll-pt":w()}],"scroll-pr":[{"scroll-pr":w()}],"scroll-pb":[{"scroll-pb":w()}],"scroll-pl":[{"scroll-pl":w()}],"snap-align":[{snap:["start","end","center","align-none"]}],"snap-stop":[{snap:["normal","always"]}],"snap-type":[{snap:["none","x","y","both"]}],"snap-strictness":[{snap:["mandatory","proximity"]}],touch:[{touch:["auto","none","manipulation"]}],"touch-x":[{"touch-pan":["x","left","right"]}],"touch-y":[{"touch-pan":["y","up","down"]}],"touch-pz":["touch-pinch-zoom"],select:[{select:["none","text","all","auto"]}],"will-change":[{"will-change":["auto","scroll","contents","transform",v]}],fill:[{fill:[e,"none"]}],"stroke-w":[{stroke:[U,X,Ee]}],stroke:[{stroke:[e,"none"]}],sr:["sr-only","not-sr-only"],"forced-color-adjust":[{"forced-color-adjust":["auto","none"]}]},conflictingClassGroups:{overflow:["overflow-x","overflow-y"],overscroll:["overscroll-x","overscroll-y"],inset:["inset-x","inset-y","start","end","top","right","bottom","left"],"inset-x":["right","left"],"inset-y":["top","bottom"],flex:["basis","grow","shrink"],gap:["gap-x","gap-y"],p:["px","py","ps","pe","pt","pr","pb","pl"],px:["pr","pl"],py:["pt","pb"],m:["mx","my","ms","me","mt","mr","mb","ml"],mx:["mr","ml"],my:["mt","mb"],size:["w","h"],"font-size":["leading"],"fvn-normal":["fvn-ordinal","fvn-slashed-zero","fvn-figure","fvn-spacing","fvn-fraction"],"fvn-ordinal":["fvn-normal"],"fvn-slashed-zero":["fvn-normal"],"fvn-figure":["fvn-normal"],"fvn-spacing":["fvn-normal"],"fvn-fraction":["fvn-normal"],"line-clamp":["display","overflow"],rounded:["rounded-s","rounded-e","rounded-t","rounded-r","rounded-b","rounded-l","rounded-ss","rounded-se","rounded-ee","rounded-es","rounded-tl","rounded-tr","rounded-br","rounded-bl"],"rounded-s":["rounded-ss","rounded-es"],"rounded-e":["rounded-se","rounded-ee"],"rounded-t":["rounded-tl","rounded-tr"],"rounded-r":["rounded-tr","rounded-br"],"rounded-b":["rounded-br","rounded-bl"],"rounded-l":["rounded-tl","rounded-bl"],"border-spacing":["border-spacing-x","border-spacing-y"],"border-w":["border-w-s","border-w-e","border-w-t","border-w-r","border-w-b","border-w-l"],"border-w-x":["border-w-r","border-w-l"],"border-w-y":["border-w-t","border-w-b"],"border-color":["border-color-s","border-color-e","border-color-t","border-color-r","border-color-b","border-color-l"],"border-color-x":["border-color-r","border-color-l"],"border-color-y":["border-color-t","border-color-b"],"scroll-m":["scroll-mx","scroll-my","scroll-ms","scroll-me","scroll-mt","scroll-mr","scroll-mb","scroll-ml"],"scroll-mx":["scroll-mr","scroll-ml"],"scroll-my":["scroll-mt","scroll-mb"],"scroll-p":["scroll-px","scroll-py","scroll-ps","scroll-pe","scroll-pt","scroll-pr","scroll-pb","scroll-pl"],"scroll-px":["scroll-pr","scroll-pl"],"scroll-py":["scroll-pt","scroll-pb"],touch:["touch-x","touch-y","touch-pz"],"touch-x":["touch"],"touch-y":["touch"],"touch-pz":["touch"]},conflictingClassGroupModifiers:{"font-size":["leading"]}}},Ko=To(Ho);function k(...e){return Ko(Tt(e))}function Uo(e){return new Intl.NumberFormat("ar-SA").format(e)}function Wo(e){return new Intl.DateTimeFormat("ar-SA",{year:"numeric",month:"short",day:"numeric"}).format(new Date(e))}function ma(e){return new Intl.DateTimeFormat("ar-SA",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(e))}function ga(e){const t=new Date,o=new Date(e),s=t.getTime()-o.getTime(),i=Math.floor(s/1e3),a=Math.floor(i/60),r=Math.floor(a/60),d=Math.floor(r/24);return i<60?"الآن":a<60?`منذ ${a} دقيقة`:r<24?`منذ ${r} ساعة`:d<7?`منذ ${d} يوم`:Wo(e)}function Vt(e){return e.split(" ").map(t=>t[0]).join("").toUpperCase().slice(0,2)}const Qo=yn,Rt=u.forwardRef(({className:e,...t},o)=>n.jsx(mt,{ref:o,className:k("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",e),...t}));Rt.displayName=mt.displayName;const Zo=Te("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 space-x-reverse overflow-hidden rounded-xl border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",{variants:{variant:{default:"border bg-background text-foreground",success:"border-emerald-200 bg-emerald-50 text-emerald-900 group",destructive:"destructive group border-destructive bg-destructive text-destructive-foreground",warning:"border-amber-200 bg-amber-50 text-amber-900"}},defaultVariants:{variant:"default"}}),Ot=u.forwardRef(({className:e,variant:t,...o},s)=>n.jsx(gt,{ref:s,className:k(Zo({variant:t}),e),...o}));Ot.displayName=gt.displayName;const Jo=u.forwardRef(({className:e,...t},o)=>n.jsx(bt,{ref:o,className:k("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",e),...t}));Jo.displayName=bt.displayName;const Dt=u.forwardRef(({className:e,...t},o)=>n.jsx(yt,{ref:o,className:k("absolute left-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",e),"toast-close":"",...t,children:n.jsx(De,{className:"h-4 w-4"})}));Dt.displayName=yt.displayName;const zt=u.forwardRef(({className:e,...t},o)=>n.jsx(ht,{ref:o,className:k("text-sm font-semibold",e),...t}));zt.displayName=ht.displayName;const Ft=u.forwardRef(({className:e,...t},o)=>n.jsx(ft,{ref:o,className:k("text-sm opacity-90",e),...t}));Ft.displayName=ft.displayName;const Xo=5,Yo=5e3;let Ne=0;function es(){return Ne=(Ne+1)%Number.MAX_SAFE_INTEGER,Ne.toString()}const Se=new Map,st=e=>{if(Se.has(e))return;const t=setTimeout(()=>{Se.delete(e),be({type:"REMOVE_TOAST",toastId:e})},Yo);Se.set(e,t)},ts=(e,t)=>{switch(t.type){case"ADD_TOAST":return{...e,toasts:[t.toast,...e.toasts].slice(0,Xo)};case"UPDATE_TOAST":return{...e,toasts:e.toasts.map(o=>o.id===t.toast.id?{...o,...t.toast}:o)};case"DISMISS_TOAST":{const{toastId:o}=t;return o?st(o):e.toasts.forEach(s=>st(s.id)),{...e,toasts:e.toasts.map(s=>s.id===o||o===void 0?{...s,open:!1}:s)}}case"REMOVE_TOAST":return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(o=>o.id!==t.toastId)}}},ve=[];let Ie={toasts:[]};function be(e){Ie=ts(Ie,e),ve.forEach(t=>t(Ie))}function ns({...e}){const t=es(),o=i=>be({type:"UPDATE_TOAST",toast:{...i,id:t}}),s=()=>be({type:"DISMISS_TOAST",toastId:t});return be({type:"ADD_TOAST",toast:{...e,id:t,open:!0,onOpenChange:i=>{i||s()}}}),{id:t,dismiss:s,update:o}}function os(){const[e,t]=u.useState(Ie);return u.useEffect(()=>(ve.push(t),()=>{const o=ve.indexOf(t);o>-1&&ve.splice(o,1)}),[e]),{...e,toast:ns,dismiss:o=>be({type:"DISMISS_TOAST",toastId:o})}}function ss(){const{toasts:e}=os();return n.jsxs(Qo,{children:[e.map(({id:t,title:o,description:s,action:i,...a})=>n.jsxs(Ot,{...a,children:[n.jsxs("div",{className:"grid gap-1",children:[o&&n.jsx(zt,{children:o}),s&&n.jsx(Ft,{children:s})]}),i,n.jsx(Dt,{})]},t)),n.jsx(Rt,{})]})}const Lt=u.createContext(void 0);function as({children:e,defaultTheme:t="system",storageKey:o="epi-admin-theme",...s}){const[i,a]=u.useState(()=>localStorage.getItem(o)||t);u.useEffect(()=>{const d=window.document.documentElement;if(d.classList.remove("light","dark"),i==="system"){const c=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.classList.add(c);return}d.classList.add(i)},[i]);const r={theme:i,setTheme:d=>{localStorage.setItem(o,d),a(d)}};return n.jsx(Lt.Provider,{...s,value:r,children:e})}const is=()=>{const e=u.useContext(Lt);if(e===void 0)throw new Error("useTheme must be used within a ThemeProvider");return e},re=[{id:"polio_campaign",labelAr:"حملة شلل الأطفال",labelEn:"Polio Campaign",icon:"💉",color:"from-blue-500 to-blue-600"},{id:"integrated_activity",labelAr:"النشاط الإيصالي التكاملي",labelEn:"Integrated Activity",icon:"🏥",color:"from-emerald-500 to-emerald-600"},{id:"all",labelAr:"جميع الأنشطة",labelEn:"All Activities",icon:"📋",color:"from-gray-500 to-gray-600"}],Ce="epi-admin-active-campaign",$t=u.createContext(null);function rs({children:e}){const[t,o]=u.useState(()=>{if(typeof window<"u"){const r=localStorage.getItem(Ce);if(r&&["polio_campaign","integrated_activity","all"].includes(r))return r}return"polio_campaign"}),s=u.useCallback(r=>{o(r),typeof window<"u"&&localStorage.setItem(Ce,r)},[]);u.useEffect(()=>{localStorage.setItem(Ce,t)},[t]);const i=re.find(r=>r.id===t)??re[0],a={campaign:t,setCampaign:s,currentOption:i,isFiltered:t!=="all",labelAr:i.labelAr};return n.jsx($t.Provider,{value:a,children:e})}function Gt(){const e=u.useContext($t);if(!e)throw new Error("useCampaign must be used within CampaignProvider");return e}const ds=Te("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",{variants:{variant:{default:"bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",destructive:"bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md",outline:"border border-input bg-background hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline",success:"bg-emerald-600 text-white hover:bg-emerald-700 shadow-md",warning:"bg-amber-500 text-white hover:bg-amber-600 shadow-md"},size:{default:"h-10 px-4 py-2",sm:"h-9 rounded-md px-3",lg:"h-11 rounded-lg px-8 text-base",icon:"h-10 w-10","icon-sm":"h-8 w-8"}},defaultVariants:{variant:"default",size:"default"}}),O=u.forwardRef(({className:e,variant:t,size:o,asChild:s=!1,...i},a)=>{const r=s?hn:"button";return n.jsx(r,{className:k(ds({variant:t,size:o,className:e})),ref:a,...i})});O.displayName="Button";class ls extends u.Component{constructor(o){super(o);te(this,"handleReset",()=>{this.setState({hasError:!1,error:null})});this.state={hasError:!1,error:null}}static getDerivedStateFromError(o){return{hasError:!0,error:o}}componentDidCatch(o,s){console.error("[ErrorBoundary] Caught error:",o,s)}render(){return this.state.hasError?n.jsx("div",{className:"min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4",children:n.jsxs("div",{className:"max-w-md text-center space-y-6 p-8",children:[n.jsx("div",{className:"w-20 h-20 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto",children:n.jsx(St,{className:"w-10 h-10 text-red-500"})}),n.jsxs("div",{children:[n.jsx("h1",{className:"text-2xl font-heading font-bold text-gray-900 mb-2",children:"خطأ غير متوقع"}),n.jsx("p",{className:"text-gray-600 text-sm",children:"حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى."})]}),this.state.error&&n.jsx("div",{className:"text-xs font-mono text-left bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 overflow-auto max-h-32",dir:"ltr",children:this.state.error.message}),n.jsxs("div",{className:"flex gap-3 justify-center",children:[n.jsxs(O,{onClick:this.handleReset,className:"gap-2",children:[n.jsx(Oe,{className:"w-4 h-4"})," إعادة المحاولة"]}),n.jsx(O,{variant:"outline",onClick:()=>window.location.href="/EPI-Supervisor/",children:"العودة للرئيسية"})]})]})}):this.props.children}}const cs="modulepreload",us=function(e){return"/EPI-Supervisor/"+e},at={},D=function(t,o,s){let i=Promise.resolve();if(o&&o.length>0){let r=function(l){return Promise.all(l.map(p=>Promise.resolve(p).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};document.getElementsByTagName("link");const d=document.querySelector("meta[property=csp-nonce]"),c=(d==null?void 0:d.nonce)||(d==null?void 0:d.getAttribute("nonce"));i=r(o.map(l=>{if(l=us(l),l in at)return;at[l]=!0;const p=l.endsWith(".css"),g=p?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${l}"]${g}`))return;const b=document.createElement("link");if(b.rel=p?"stylesheet":cs,p||(b.as="script"),b.crossOrigin="",b.href=l,c&&b.setAttribute("nonce",c),document.head.appendChild(b),p)return new Promise((_,y)=>{b.addEventListener("load",_),b.addEventListener("error",()=>y(new Error(`Unable to preload CSS for ${l}`)))})}))}function a(r){const d=new Event("vite:preloadError",{cancelable:!0});if(d.payload=r,window.dispatchEvent(d),!d.defaultPrevented)throw r}return i.then(r=>{for(const d of r||[])d.status==="rejected"&&a(d.reason);return t().catch(a)})},ps=fn,ms=u.forwardRef(({className:e,sideOffset:t=4,...o},s)=>n.jsx(xt,{ref:s,sideOffset:t,className:k("z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",e),...o}));ms.displayName=xt.displayName;const Fe=u.forwardRef(({className:e,children:t,...o},s)=>n.jsxs(_t,{ref:s,className:k("relative overflow-hidden",e),...o,children:[n.jsx(xn,{className:"h-full w-full rounded-[inherit]",children:t}),n.jsx(Ht,{}),n.jsx(_n,{})]}));Fe.displayName=_t.displayName;const Ht=u.forwardRef(({className:e,orientation:t="vertical",...o},s)=>n.jsx(wt,{ref:s,orientation:t,className:k("flex touch-none select-none transition-colors",t==="vertical"&&"h-full w-2.5 border-l border-l-transparent p-[1px]",t==="horizontal"&&"h-2.5 flex-col border-t border-t-transparent p-[1px]",e),...o,children:n.jsx(wn,{className:"relative flex-1 rounded-full bg-border"})}));Ht.displayName=wt.displayName;const ne=u.forwardRef(({className:e,orientation:t="horizontal",decorative:o=!0,...s},i)=>n.jsx(kt,{ref:i,decorative:o,orientation:t,className:k("shrink-0 bg-border",t==="horizontal"?"h-[1px] w-full":"h-full w-[1px]",e),...s}));ne.displayName=kt.displayName;const de=u.forwardRef(({className:e,...t},o)=>n.jsx(vt,{ref:o,className:k("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",e),...t}));de.displayName=vt.displayName;const gs=u.forwardRef(({className:e,...t},o)=>n.jsx(It,{ref:o,className:k("aspect-square h-full w-full",e),...t}));gs.displayName=It.displayName;const le=u.forwardRef(({className:e,...t},o)=>n.jsx(Pt,{ref:o,className:k("flex h-full w-full items-center justify-center rounded-full bg-muted font-semibold text-sm",e),...t}));le.displayName=Pt.displayName;const bs=Te("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",{variants:{variant:{default:"border-transparent bg-primary text-primary-foreground",secondary:"border-transparent bg-secondary text-secondary-foreground",destructive:"border-transparent bg-destructive text-destructive-foreground",success:"border-transparent bg-emerald-100 text-emerald-800",warning:"border-transparent bg-amber-100 text-amber-800",info:"border-transparent bg-cyan-100 text-cyan-800",outline:"text-foreground"}},defaultVariants:{variant:"default"}});function Le({className:e,variant:t,...o}){return n.jsx("div",{className:k(bs({variant:t}),e),...o})}const ys="https://yinoyjmzzrxrpuxbzwwm.supabase.co",Kt="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpbm95am16enJ4cnB1eGJ6d3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5MzAzMjYsImV4cCI6MjA5MTUwNjMyNn0.MsNVFeq-yDBKfU5MCPJRGV4jTC9nL1DkLJdiQmfxm2c",hs=async(e,t)=>{for(let s=0;s<=3;s++)try{return await fetch(e,t)}catch(i){const a=s===3;if(!(i instanceof TypeError&&(i.message==="Failed to fetch"||i.message.includes("fetch")))||a)throw i;const d=Math.min(500*Math.pow(2,s),3e3);await new Promise(c=>setTimeout(c,d))}return fetch(e,t)},f=sn(ys,Kt,{auth:{autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0},global:{fetch:hs,headers:{"X-Client-Info":"epi-supervisor-admin"}}}),T=!!Kt,ba=Object.freeze(Object.defineProperty({__proto__:null,isConfigured:T,supabase:f},Symbol.toStringTag,{value:"Module"}));async function he(e){if(!e||e==="all")return null;const{data:t,error:o}=await f.from("forms").select("id").eq("campaign_type",e).is("deleted_at",null);return o||!t?null:t.map(s=>s.id)}async function fs(e,t){return e}function Ut(){return A({queryKey:["auth"],queryFn:async()=>{if(!T)return null;const{data:{session:e},error:t}=await f.auth.getSession();if(t)throw t;if(!e)return null;const{data:o,error:s}=await f.from("profiles").select("*, governorates(name_ar), districts(name_ar)").eq("id",e.user.id).single();return s?(console.warn("[Auth] Profile fetch error:",s.message),{session:e,profile:null}):{session:e,profile:o}},retry:1,retryDelay:2e3,staleTime:3e4,enabled:T})}function xs(){const e=q();return V({mutationFn:async({email:t,password:o})=>{const{data:s,error:i}=await f.auth.signInWithPassword({email:t,password:o});if(i)throw i;return s},onSuccess:()=>{e.invalidateQueries({queryKey:["auth"]})}})}function _s(){const e=q();return V({mutationFn:async()=>{await f.auth.signOut()},onSuccess:()=>{e.clear()}})}function Wt(e){return A({queryKey:["dashboard-stats",e],queryFn:async()=>{if(!T)return null;const t=await he(e),o=h=>t&&t.length>0?h.in("form_id",t):h,s=h=>e&&e!=="all"?h.eq("campaign_type",e):h,[i,a,r]=await Promise.allSettled([f.from("profiles").select("id, is_active, role, created_at",{count:"exact"}),o(f.from("form_submissions").select("id, status, created_at",{count:"exact"})),s(f.from("forms").select("id, is_active",{count:"exact"}))]),d=i.status==="fulfilled"?i.value.data||[]:[],c=a.status==="fulfilled"?a.value.data||[]:[],l=r.status==="fulfilled"?r.value.data||[]:[],p=new Date,g=new Date(p.getFullYear(),p.getMonth(),p.getDate()),b=new Date(g.getTime()-10080*60*1e3),_=c.filter(h=>new Date(h.created_at)>=g).length,y=c.filter(h=>new Date(h.created_at)>=b).length;return{total_users:d.length,active_users:d.filter(h=>h.is_active).length,total_submissions:c.length,approved_submissions:0,rejected_submissions:0,draft_submissions:c.filter(h=>h.status==="draft").length,total_forms:l.length,active_forms:l.filter(h=>h.is_active).length,submissions_today:_,submissions_this_week:y,submissions_trend:12.5,approval_rate:c.length>0?c.filter(h=>h.status==="submitted").length/c.length*100:0,unread_notifications:0}},refetchInterval:T?3e4:!1,enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:15e3})}function ya(e){return A({queryKey:["submissions-chart",e],queryFn:async()=>{let t=f.from("form_submissions").select("status, created_at").order("created_at",{ascending:!0});const o=await he(e);o&&o.length>0&&(t=t.in("form_id",o));const{data:s}=await t;if(!s)return[];const i={},a=new Date;for(let r=29;r>=0;r--){const c=new Date(a.getTime()-r*24*60*60*1e3).toISOString().split("T")[0];i[c]={date:c,submitted:0,draft:0}}return s.forEach(r=>{const d=r.created_at.split("T")[0];i[d]&&(r.status==="submitted"?i[d].submitted++:r.status==="draft"&&i[d].draft++)}),Object.values(i)},enabled:T})}function ha(e){return A({queryKey:["governorate-stats",e],queryFn:async()=>{const{data:t}=await f.from("governorates").select("id, name_ar").eq("is_active",!0).order("name_ar");if(!t)return[];const o=await he(e);return(await Promise.all(t.map(async i=>{let a=f.from("form_submissions").select("id",{count:"exact",head:!0}).eq("governorate_id",i.id);o&&o.length>0&&(a=a.in("form_id",o));const{count:r}=await a;return{name:i.name_ar,submissions:r||0}}))).sort((i,a)=>a.submissions-i.submissions)},enabled:T})}function fa(e){return A({queryKey:["users",e],queryFn:async()=>{let t=f.from("profiles").select("*, governorates(name_ar), districts(name_ar)").is("deleted_at",null).order("created_at",{ascending:!1});e!=null&&e.role&&(t=t.eq("role",e.role)),e!=null&&e.search&&(t=t.or(`full_name.ilike.%${e.search}%,email.ilike.%${e.search}%`));const{data:o,error:s}=await t;if(s)throw s;return o},enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:1e4})}function xa(){const e=q();return V({mutationFn:async t=>{const{data:o,error:s}=await f.functions.invoke("create-admin",{body:t});if(s)throw s;return o},onSuccess:()=>e.invalidateQueries({queryKey:["users"]})})}function _a(){const e=q();return V({mutationFn:async({userId:t,role:o,governorate_id:s,district_id:i})=>{const{data:a,error:r}=await f.functions.invoke("admin-actions",{body:{action:"update_role",user_id:t,role:o,governorate_id:s,district_id:i}});if(r)throw r;return a},onSuccess:()=>e.invalidateQueries({queryKey:["users"]})})}function wa(){const e=q();return V({mutationFn:async({userId:t,isActive:o})=>{const{data:s,error:i}=await f.functions.invoke("admin-actions",{body:{action:"toggle_active",user_id:t,is_active:o}});if(i)throw i;return s},onSuccess:()=>e.invalidateQueries({queryKey:["users"]})})}function ka(){const e=q();return V({mutationFn:async t=>{const{data:o,error:s}=await f.functions.invoke("admin-actions",{body:{action:"delete_user",user_id:t}});if(s)throw s;return o},onSuccess:()=>e.invalidateQueries({queryKey:["users"]})})}function va(e){return A({queryKey:["forms",e],queryFn:async()=>{const t=(e==null?void 0:e.page)||1,o=(e==null?void 0:e.pageSize)||50;let s=f.from("forms").select("*",{count:"exact"}).is("deleted_at",null).order("created_at",{ascending:!1}).range((t-1)*o,t*o-1);e!=null&&e.search&&(s=s.or(`title_ar.ilike.%${e.search}%,title_en.ilike.%${e.search}%`)),e!=null&&e.campaignType&&e.campaignType!=="all"&&(s=s.eq("campaign_type",e.campaignType));const{data:i,error:a,count:r}=await s;if(a)throw a;return{data:i||[],count:r||0}},enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:1e4})}function Ia(e){return A({queryKey:["form-submission-counts",e],queryFn:async()=>{let t=f.from("form_submissions").select("form_id, status").is("deleted_at",null);const o=await he(e);o&&o.length>0&&(t=t.in("form_id",o));const{data:s,error:i}=await t;if(i)throw i;const a={};for(const r of s||[])a[r.form_id]||(a[r.form_id]={total:0,submitted:0,draft:0}),a[r.form_id].total++,r.status==="submitted"?a[r.form_id].submitted++:r.status==="draft"&&a[r.form_id].draft++;return a},enabled:T,staleTime:3e4})}function Pa(){const e=q();return V({mutationFn:async t=>{const{data:{session:o}}=await f.auth.getSession(),{data:s,error:i}=await f.from("forms").insert({...t,created_by:o==null?void 0:o.user.id}).select().single();if(i)throw i;return s},onSuccess:()=>{e.invalidateQueries({queryKey:["forms"]}),e.invalidateQueries({queryKey:["form-submission-counts"]})}})}function ja(){const e=q();return V({mutationFn:async({id:t,...o})=>{const{data:s,error:i}=await f.from("forms").update({...o,updated_at:new Date().toISOString()}).eq("id",t).select().single();if(i)throw i;return s},onSuccess:()=>{e.invalidateQueries({queryKey:["forms"]}),e.invalidateQueries({queryKey:["form-submission-counts"]})}})}function Ta(){const e=q();return V({mutationFn:async t=>{const{error:o}=await f.from("forms").update({deleted_at:new Date().toISOString()}).eq("id",t);if(o)throw o},onSuccess:()=>{e.invalidateQueries({queryKey:["forms"]}),e.invalidateQueries({queryKey:["form-submission-counts"]})}})}function Ea(e){return A({queryKey:["submissions",e],queryFn:async()=>{const t=(e==null?void 0:e.page)||1,o=(e==null?void 0:e.pageSize)||20;let s=f.from("form_submissions").select("*, forms(title_ar, campaign_type), profiles(full_name, email)",{count:"exact"}).is("deleted_at",null).order("created_at",{ascending:!1}).range((t-1)*o,t*o-1);if(e!=null&&e.status&&(s=s.eq("status",e.status)),e!=null&&e.formId&&(s=s.eq("form_id",e.formId)),e!=null&&e.governorateId&&(s=s.eq("governorate_id",e.governorateId)),e!=null&&e.campaignType&&e.campaignType!=="all"){const d=await he(e.campaignType);if(d&&d.length>0)s=s.in("form_id",d);else return{data:[],count:0}}const{data:i,error:a,count:r}=await s;if(a)throw a;return{data:i||[],count:r||0}},enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:1e4})}function Na(){const e=q();return V({mutationFn:async({id:t,status:o,review_notes:s})=>{const{data:{session:i}}=await f.auth.getSession(),{data:a,error:r}=await f.from("form_submissions").update({status:o,review_notes:s,reviewed_by:i==null?void 0:i.user.id,reviewed_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq("id",t).select().single();if(r)throw r;return a},onSuccess:()=>{e.invalidateQueries({queryKey:["submissions"]}),e.invalidateQueries({queryKey:["dashboard-stats"]})}})}function Sa(){return A({queryKey:["governorates"],queryFn:async()=>{const{data:e,error:t}=await f.from("governorates").select("*").eq("is_active",!0).order("name_ar");if(t)throw t;return e},enabled:T,retry:3,retryDelay:e=>Math.min(1e3*2**e,1e4),staleTime:6e4})}function Ca(e){return A({queryKey:["districts",e],queryFn:async()=>{let t=f.from("districts").select("*").eq("is_active",!0).order("name_ar");e&&(t=t.eq("governorate_id",e));const{data:o,error:s}=await t;if(s)throw s;return o},enabled:!!e,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4)})}function Ma(e){return A({queryKey:["audit-logs",e],queryFn:async()=>{const t=(e==null?void 0:e.page)||1,o=50;let s=f.from("audit_logs").select("*, profiles(full_name, email)",{count:"exact"}).order("created_at",{ascending:!1}).range((t-1)*o,t*o-1);e!=null&&e.userId&&(s=s.eq("user_id",e.userId)),e!=null&&e.action&&(s=s.eq("action",e.action));const{data:i,error:a,count:r}=await s;if(a)throw a;return{data:i||[],count:r||0}},enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:1e4})}function Ba(e){return A({queryKey:["shortages",e],queryFn:async()=>{let t=f.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles(full_name), form_submissions(form_id, forms(title_ar))").is("deleted_at",null).order("created_at",{ascending:!1});t=await fs(t);const{data:o,error:s}=await t;if(s)throw s;return o},enabled:T,retry:3,retryDelay:t=>Math.min(1e3*2**t,1e4),staleTime:1e4})}function Aa(e="general"){return A({queryKey:["chat-messages",e],queryFn:async()=>{const{data:t,error:o}=await f.from("chat_messages").select("*").eq("room",e).order("created_at",{ascending:!0}).limit(100);if(o)throw o;return t},enabled:T,refetchInterval:T?5e3:!1})}function qa(){const e=q();return V({mutationFn:async({message:t,room:o="general"})=>{const{data:{session:s}}=await f.auth.getSession(),{data:i}=await f.from("profiles").select("full_name").eq("id",s==null?void 0:s.user.id).single(),{data:a,error:r}=await f.from("chat_messages").insert({sender_id:s==null?void 0:s.user.id,sender_name:(i==null?void 0:i.full_name)||"مستخدم",content:t,room:o}).select().single();if(r)throw r;return a},onSuccess:()=>e.invalidateQueries({queryKey:["chat-messages"]})})}function Va(){return A({queryKey:["notifications"],queryFn:async()=>{var s;const{data:{session:e}}=await f.auth.getSession(),{data:t,error:o}=await f.from("notifications").select("*").eq("recipient_id",((s=e==null?void 0:e.user)==null?void 0:s.id)||"00000000-0000-0000-0000-000000000000").order("created_at",{ascending:!1}).limit(50);if(o)throw o;return t},enabled:T,retry:3,retryDelay:e=>Math.min(1e3*2**e,1e4),staleTime:1e4})}function Ra(){const e=q();return V({mutationFn:async t=>{const{data:o,error:s}=await f.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("id",t).select().single();if(s)throw s;return o},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function Oa(){const e=q();return V({mutationFn:async()=>{const{data:{session:t}}=await f.auth.getSession(),{error:o}=await f.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("recipient_id",t==null?void 0:t.user.id).eq("is_read",!1);if(o)throw o},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function Da(){const e=q();return V({mutationFn:async t=>{const{error:o}=await f.from("notifications").delete().eq("id",t);if(o)throw o},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function za(){const e=q();return V({mutationFn:async()=>{const{data:{session:t}}=await f.auth.getSession(),{error:o}=await f.from("notifications").delete().eq("recipient_id",(t==null?void 0:t.user.id)||"00000000-0000-0000-0000-000000000000");if(o)throw o},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function Fa(){const e=q();return V({mutationFn:async({id:t,isRead:o})=>{const{data:s,error:i}=await f.from("notifications").update({is_read:!o,read_at:o?null:new Date().toISOString()}).eq("id",t).select().single();if(i)throw i;return s},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function La(){const e=q();return V({mutationFn:async t=>{const{data:{session:o}}=await f.auth.getSession();let s=f.from("profiles").select("id").eq("is_active",!0).is("deleted_at",null);t.target==="admin"?s=s.in("role",["admin","central"]):t.target==="field"?s=s.in("role",["governorate","district","data_entry"]):t.target==="governorate"&&t.governorate_id&&(s=s.eq("governorate_id",t.governorate_id));const{data:i,error:a}=await s;if(a)throw a;if(!i||i.length===0)throw new Error("لا يوجد مستلمين");const r=i.map(d=>({recipient_id:d.id,title:t.title,body:t.body,type:t.type||"info",category:t.category||"system",data:{}}));for(let d=0;d<r.length;d+=100){const c=r.slice(d,d+100),{error:l}=await f.from("notifications").insert(c);if(l)throw l}return{sent_count:r.length}},onSuccess:()=>e.invalidateQueries({queryKey:["notifications"]})})}function $a(){return A({queryKey:["notification-stats"],queryFn:async()=>{var g;const{data:{session:e}}=await f.auth.getSession(),t=((g=e==null?void 0:e.user)==null?void 0:g.id)||"00000000-0000-0000-0000-000000000000",{data:o,error:s}=await f.from("notifications").select("type, category, is_read, created_at").eq("recipient_id",t).order("created_at",{ascending:!1}).limit(500);if(s)throw s;const i={},a={},r={},d=new Date;for(let b=6;b>=0;b--){const _=new Date(d);_.setDate(_.getDate()-b);const y=_.toISOString().split("T")[0];r[y]={total:0,unread:0}}for(const b of o??[]){i[b.type]=(i[b.type]??0)+1,a[b.category]=(a[b.category]??0)+1;const _=b.created_at.split("T")[0];r[_]&&(r[_].total++,b.is_read||r[_].unread++)}const c=Object.entries(i).map(([b,_])=>({name:b,value:_})),l=Object.entries(a).map(([b,_])=>({name:b,value:_})),p=Object.entries(r).map(([b,_])=>({date:b.slice(5),..._}));return{byType:c,byCategory:l,trend:p,total:(o==null?void 0:o.length)??0}},enabled:T,staleTime:3e4})}function Ga(){return A({queryKey:["notification-templates"],queryFn:async()=>{const{data:e,error:t}=await f.from("notification_templates").select("*").order("created_at",{ascending:!1});if(t){if(t.code==="42P01")return it();throw t}return e!=null&&e.length?e:it()},enabled:T,staleTime:6e4})}function it(){return[{id:"t1",title:"تذكير بالإرساليات",body:"يرجى إكمال الإرساليات المعلقة قبل نهاية اليوم.",type:"warning",category:"submission"},{id:"t2",title:"صيانة النظام",body:"سيكون النظام في وضع الصيانة اليوم من الساعة 10 مساءً حتى 12 مساءً.",type:"info",category:"system"},{id:"t3",title:"نقص في اللقاحات",body:"تم رصد نقص في أحد اللقاحات. يرجى المراجعة.",type:"error",category:"shortage"},{id:"t4",title:"إشعار عام",body:"",type:"info",category:"system"},{id:"t5",title:"تمت الموافقة",body:"تمت الموافقة على طلبك بنجاح.",type:"success",category:"user"}]}function Ha(){return A({queryKey:["role-distribution"],queryFn:async()=>{const{data:e}=await f.from("profiles").select("role").is("deleted_at",null);if(!e)return[];const t={};e.forEach(s=>{t[s.role]=(t[s.role]||0)+1});const o={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"قضاء",data_entry:"إدخال بيانات"};return Object.entries(t).map(([s,i])=>({name:o[s]||s,value:i,role:s}))},enabled:T})}const Ka={admin:5,central:4,governorate:3,district:2,data_entry:1},Qt={admin:"مدير النظام",central:"مركزي",governorate:"محافظة",district:"قضاء",data_entry:"إدخال بيانات"},Ua={admin:"bg-purple-100 text-purple-800 border-purple-200",central:"bg-blue-100 text-blue-800 border-blue-200",governorate:"bg-emerald-100 text-emerald-800 border-emerald-200",district:"bg-amber-100 text-amber-800 border-amber-200",data_entry:"bg-gray-100 text-gray-800 border-gray-200"},Wa={draft:"مسودة",submitted:"مرسلة"},Qa={draft:"bg-amber-100 text-amber-700",submitted:"bg-emerald-100 text-emerald-700"};function Ve(e="128"){return`/EPI-Supervisor/logo-epi-${e}.png`.replace(/\/+/g,"/")}const Zt=[{icon:Hn,label:"لوحة التحكم",href:"/dashboard"},{icon:Mn,label:"التحليلات",href:"/insights"},{icon:$n,label:"التقارير والبيانات",href:"/reports",roles:["admin","central","governorate","district"]},{icon:Cn,label:"إعدادات الذكاء الاصطناعي",href:"/ai-settings",roles:["admin"]},{icon:mo,label:"المستخدمون",href:"/users"},{icon:Ln,label:"النماذج",href:"/forms"},{icon:Gn,label:"الإرساليات",href:"/submissions"},{icon:io,label:"سجل التدقيق",href:"/audit",roles:["admin"]},{icon:Qn,label:"المحافظات",href:"/governorates",roles:["admin"]},{icon:Kn,label:"الخريطة التفاعلية",href:"/map"},{icon:no,label:"إدارة الصفحات",href:"/pages",roles:["admin"]},{icon:Sn,label:"المراجع والكتب",href:"/references"},{icon:Xn,label:"الشات الداخلي",href:"/chat"},{icon:Pe,label:"مستشار التحصين",href:"/bot"},{icon:Nn,label:"الإشعارات",href:"/notifications"},{icon:Rn,label:"الإعدادات",href:"/settings",roles:["admin"]}];function ws({collapsed:e}){const[t,o]=u.useState(new Date);u.useEffect(()=>{const a=setInterval(()=>o(new Date),1e3);return()=>clearInterval(a)},[]);const s=t.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:!0}),i=t.toLocaleDateString("ar-SA",{weekday:"short",day:"numeric",month:"short"});return e?null:n.jsxs("div",{className:"px-4 py-2 text-center",children:[n.jsxs("div",{className:"flex items-center justify-center gap-1.5 text-xs text-muted-foreground",children:[n.jsx(Vn,{className:"w-3 h-3"}),n.jsx("span",{className:"font-mono tabular-nums",children:s})]}),n.jsx("p",{className:"text-[10px] text-muted-foreground/60 mt-0.5",children:i})]})}function ks({user:e,collapsed:t=!1,onToggle:o}){var b,_;const s=pt(),{theme:i,setTheme:a}=is(),r=_s(),{data:d}=Wt(),{campaign:c,setCampaign:l}=Gt(),g=Zt.filter(y=>y.roles?(e==null?void 0:e.role)&&y.roles.includes(e.role):!0);return n.jsxs("aside",{className:k("flex flex-col h-screen border-l transition-all duration-300 relative z-30",t?"w-[72px]":"w-[280px]"),style:{background:"linear-gradient(180deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%)",color:"#fff",borderColor:"rgba(255,255,255,0.15)",backdropFilter:"none"},children:[n.jsxs("div",{className:"flex items-center gap-3 p-4 h-16",children:[!t&&n.jsxs(n.Fragment,{children:[n.jsx("div",{className:"flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50",children:n.jsx("img",{src:Ve("128"),alt:"EPI",className:"w-8 h-8 object-contain",onError:y=>{y.currentTarget.style.display="none";const h=y.currentTarget.parentElement;h.innerHTML='<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"></div>'}})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("h1",{className:"font-heading font-bold text-lg text-white truncate",children:"EPI Supervisor's"}),n.jsx("p",{className:"text-xs text-blue-100",children:"المشرف — لوحة الإدارة"})]})]}),t&&n.jsx("div",{className:"flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50 mx-auto",children:n.jsx("img",{src:Ve("64"),alt:"EPI",className:"w-8 h-8 object-contain",onError:y=>{y.currentTarget.style.display="none";const h=y.currentTarget.parentElement;h.innerHTML='<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800"></div>'}})}),n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:o,className:"hidden lg:flex text-blue-200 hover:text-white hover:bg-white/10",children:t?n.jsx(qn,{className:"w-4 h-4"}):n.jsx(An,{className:"w-4 h-4"})})]}),n.jsx(ne,{className:"bg-white/10"}),!t&&n.jsxs("div",{className:"px-3 py-3",children:[n.jsxs("div",{className:"flex items-center gap-1.5 px-2 mb-2",children:[n.jsx(Nt,{className:"w-3.5 h-3.5 text-blue-200"}),n.jsx("span",{className:"text-[11px] font-medium text-blue-200 uppercase tracking-wider",children:"فلتر النشاط"})]}),n.jsx("div",{className:"space-y-1",children:re.map(y=>{const h=c===y.id;return n.jsxs("button",{onClick:()=>l(y.id),className:k("w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-right",h?"bg-white/20 text-white shadow-md shadow-black/10":"text-blue-100 hover:bg-white/10 hover:text-white"),children:[n.jsx("span",{className:"text-base",children:y.icon}),n.jsx("span",{className:"flex-1 truncate",children:y.labelAr}),h&&n.jsx("span",{className:"w-2 h-2 rounded-full bg-white shrink-0"})]},y.id)})})]}),t&&n.jsx("div",{className:"px-3 py-2 flex justify-center",title:(b=re.find(y=>y.id===c))==null?void 0:b.labelAr,children:n.jsx("span",{className:"text-lg",children:(_=re.find(y=>y.id===c))==null?void 0:_.icon})}),n.jsx(ne,{className:"bg-white/10"}),n.jsx(Fe,{className:"flex-1 py-2",children:n.jsx("nav",{className:"px-3 space-y-1",children:g.map(y=>{const h=s.pathname===y.href||y.href!=="/"&&s.pathname.startsWith(y.href),I=y.icon;return n.jsxs(Ae,{to:y.href,className:k("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative group",h?"bg-white/20 text-white shadow-md shadow-black/10":"text-blue-100 hover:bg-white/10 hover:text-white",t&&"justify-center px-0"),children:[h&&!t&&n.jsx("div",{className:"absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"}),n.jsx(I,{className:k("w-5 h-5 shrink-0",t&&"w-5 h-5")}),!t&&n.jsx("span",{className:"flex-1",children:y.label}),!t&&y.badge&&y.badge>0&&n.jsx(Le,{variant:y.badge>5?"destructive":"warning",className:"text-[10px] px-1.5 py-0",children:y.badge}),t&&y.badge&&y.badge>0&&n.jsx("span",{className:"absolute top-1 left-1 w-2 h-2 rounded-full bg-red-500"}),t&&n.jsx("div",{className:"absolute right-full ml-2 px-2 py-1 bg-white text-gray-900 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50",children:y.label})]},y.href)})})}),n.jsx(ne,{className:"bg-white/10"}),n.jsx(ws,{collapsed:t}),n.jsx(ne,{className:"bg-white/10"}),n.jsx("div",{className:"px-3 py-2",children:n.jsxs(O,{variant:"ghost",size:t?"icon":"default",className:k("w-full text-blue-100 hover:text-white hover:bg-white/10",t?"":"justify-start gap-3"),onClick:()=>a(i==="dark"?"light":"dark"),children:[i==="dark"?n.jsx(lo,{className:"w-5 h-5"}):n.jsx(eo,{className:"w-5 h-5"}),!t&&n.jsx("span",{children:i==="dark"?"الوضع الفاتح":"الوضع الداكن"})]})}),n.jsx("div",{className:"p-3 border-t border-white/10",children:e?n.jsxs("div",{className:k("flex items-center gap-3",t&&"justify-center"),children:[n.jsx(de,{className:"w-9 h-9",children:n.jsx(le,{className:"bg-white/20 text-white text-sm font-bold",children:Vt(e.full_name)})}),!t&&n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium truncate text-white",children:e.full_name}),n.jsx("p",{className:"text-xs text-blue-200 truncate",children:Qt[e.role]})]}),n.jsx(O,{variant:"ghost",size:t?"icon":"icon-sm",onClick:()=>r.mutate(),className:"text-blue-200 hover:text-white hover:bg-white/10",title:"تسجيل الخروج",children:n.jsx(tt,{className:"w-4 h-4"})})]}):n.jsxs(Ae,{to:"/login",className:k("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white transition-colors",t&&"justify-center px-0"),children:[n.jsx(tt,{className:"w-5 h-5 rotate-180"}),!t&&n.jsx("span",{children:"تسجيل الدخول"})]})})]})}function vs({user:e}){const[t,o]=u.useState(!1),s=pt(),{campaign:i,setCampaign:a}=Gt();u.useEffect(()=>{o(!1)},[s.pathname]),u.useEffect(()=>(t?document.body.style.overflow="hidden":document.body.style.overflow="",()=>{document.body.style.overflow=""}),[t]);const r=Zt.filter(c=>c.roles?(e==null?void 0:e.role)&&c.roles.includes(e.role):!0),d=t?n.jsxs("div",{className:"fixed inset-0",style:{zIndex:99999},children:[n.jsx("div",{className:"fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200",onClick:()=>o(!1)}),n.jsxs("div",{className:"fixed inset-y-0 right-0 w-[280px] shadow-2xl animate-in slide-in-from-right duration-300",style:{background:"linear-gradient(180deg, #1d4ed8 0%, #2563eb 40%, #1e40af 100%)",color:"#fff"},children:[n.jsxs("div",{className:"flex items-center justify-between p-4 h-16",children:[n.jsxs("div",{className:"flex items-center gap-3",children:[n.jsx("div",{className:"flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm overflow-hidden border border-blue-100/50",children:n.jsx("img",{src:Ve("64"),alt:"EPI",className:"w-8 h-8 object-contain",onError:c=>{c.currentTarget.style.display="none"}})}),n.jsx("h1",{className:"font-heading font-bold text-lg text-white",children:"EPI Supervisor's"})]}),n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:()=>o(!1),className:"text-blue-200 hover:text-white hover:bg-white/10",children:n.jsx(De,{className:"w-5 h-5"})})]}),n.jsx(ne,{className:"bg-white/10"}),n.jsxs("div",{className:"px-3 pt-3 pb-1",children:[n.jsxs("div",{className:"flex items-center gap-1.5 px-2 mb-2",children:[n.jsx(Nt,{className:"w-3.5 h-3.5 text-blue-200"}),n.jsx("span",{className:"text-[11px] font-medium text-blue-200 uppercase tracking-wider",children:"فلتر النشاط"})]}),n.jsx("div",{className:"space-y-1",children:re.map(c=>{const l=i===c.id;return n.jsxs("button",{onClick:()=>a(c.id),className:k("w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-right",l?"bg-white/20 text-white shadow-md shadow-black/10":"text-blue-100 hover:bg-white/10 hover:text-white"),children:[n.jsx("span",{className:"text-base",children:c.icon}),n.jsx("span",{className:"flex-1 truncate",children:c.labelAr}),l&&n.jsx("span",{className:"w-2 h-2 rounded-full bg-white shrink-0"})]},c.id)})})]}),n.jsx(ne,{className:"bg-white/10"}),n.jsx("nav",{className:"px-3 py-4 space-y-1 overflow-y-auto",style:{maxHeight:"calc(100vh - 280px)"},children:r.map(c=>{const l=s.pathname===c.href,p=c.icon;return n.jsxs(Ae,{to:c.href,onClick:()=>o(!1),className:k("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",l?"bg-white/20 text-white shadow-md":"text-blue-100 hover:bg-white/10 hover:text-white"),children:[n.jsx(p,{className:"w-5 h-5"}),n.jsx("span",{children:c.label}),c.badge&&c.badge>0&&n.jsx(Le,{variant:"destructive",className:"mr-auto text-[10px]",children:c.badge})]},c.href)})}),e&&n.jsx("div",{className:"absolute bottom-0 left-0 right-0 p-3 border-t border-white/10",children:n.jsxs("div",{className:"flex items-center gap-3",children:[n.jsx(de,{className:"w-9 h-9",children:n.jsx(le,{className:"bg-white/20 text-white text-sm font-bold",children:Vt(e.full_name)})}),n.jsxs("div",{className:"flex-1 min-w-0",children:[n.jsx("p",{className:"text-sm font-medium truncate text-white",children:e.full_name}),n.jsx("p",{className:"text-xs text-blue-200 truncate",children:Qt[e.role]})]})]})})]})]}):null;return n.jsxs(n.Fragment,{children:[n.jsx(O,{variant:"ghost",size:"icon",className:"lg:hidden",onClick:()=>o(!0),children:n.jsx(Jn,{className:"w-5 h-5"})}),cn.createPortal(d,document.body)]})}function rt({className:e,...t}){return n.jsx("div",{className:k("animate-pulse rounded-lg bg-muted",e),...t})}const $e=u.forwardRef(({className:e,...t},o)=>n.jsx("div",{ref:o,className:k("rounded-xl border bg-card text-card-foreground shadow-card transition-all duration-200",e),...t}));$e.displayName="Card";const Ge=u.forwardRef(({className:e,...t},o)=>n.jsx("div",{ref:o,className:k("flex flex-col space-y-1.5 p-6",e),...t}));Ge.displayName="CardHeader";const He=u.forwardRef(({className:e,...t},o)=>n.jsx("h3",{ref:o,className:k("text-xl font-bold leading-none tracking-tight font-heading",e),...t}));He.displayName="CardTitle";const Jt=u.forwardRef(({className:e,...t},o)=>n.jsx("p",{ref:o,className:k("text-sm text-muted-foreground",e),...t}));Jt.displayName="CardDescription";const Xt=u.forwardRef(({className:e,...t},o)=>n.jsx("div",{ref:o,className:k("p-6 pt-0",e),...t}));Xt.displayName="CardContent";const Is=u.forwardRef(({className:e,...t},o)=>n.jsx("div",{ref:o,className:k("flex items-center p-6 pt-0",e),...t}));Is.displayName="CardFooter";const je=u.forwardRef(({className:e,type:t,...o},s)=>n.jsx("input",{type:t,className:k("flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",e),ref:s,...o}));je.displayName="Input";const Ps=[{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:0,section:"جدول_التطعيم_الروتيني",content:`جدول التحصين الروتيني في اليمن — برنامج التحصين الموسّع (EPI):

الزيارة الأولى — عند الولادة:
• BCG (تطعيم السل) — جرعة واحدة داخل الجلد في الذراع الأيمن
• OPV0 (الشلل الفموي الجرعة صفر) — فموياً
• HepB0 (الالتهاب الكبدي B) — عضلي، خلال 24 ساعة من الولادة

الزيارة الثانية — 6 أسابيع:
• OPV1 (شلل فموي 1) — فموياً
• Penta1 (خماسي 1) — عضلي في الفخذ الأيسر
• PCV1 (مكورات رئوية 1) — عضلي
• Rota1 (روتا 1) — فموياً

الزيارة الثالثة — 10 أسابيع:
• OPV2 + Penta2 + PCV2 + Rota2

الزيارة الرابعة — 14 أسبوع:
• OPV3 + Penta3 + PCV3 + IPV1 (شلل حقن 1) — عضلي

الزيارة الخامسة — 9 أشهر:
• MR1 (حصبة وحصبة ألمانية 1) — تحت الجلد في الذراع الأيسر
• OPV4 (شلل فموي 4 — جرعة تنشيطية)
• IPV2 (شلل حقن 2)
• فيتامين أ — 100,000 وحدة دولية (كبسولة زرقاء)

الزيارة السادسة — 18 شهر:
• MR2 (حصبة وحصبة ألمانية 2)
• OPV5 (شلل فموي 5 — جرعة تنشيطية)
• Penta4 (خماسي 4 — جرعة تعزيزية)
• فيتامين أ — 200,000 وحدة دولية (كبسولة حمراء)

الزيارة السابعة — 5-7 سنوات (دخول المدارس):
• MR (حصبة وحصبة ألمانية — جرعة تعزيزية)
• Td (تنظير — الكزاز والخناق)
• فيتامين أ — 200,000 وحدة دولية

ملخص عدد الجرعات:
• BCG: 1 جرعة (عند الولادة فقط)
• HepB: 1 جرعة (عند الولادة فقط)
• OPV: 6 جرعات (صفر + 3 أولية + 2 تنشيطية)
• Penta: 4 جرعات (3 أولية + 1 تعزيزية عند 18 شهر)
• PCV: 3 جرعات (3 أولية عند 6w و10w و14w)
• Rota: 2 جرعتين (عند 6w و10w)
• IPV: 2 جرعتين (عند 14 أسبوع و9 أشهر)
• MR: 3 جرعات (2 أولية عند 9 أشهر و18 شهر + 1 تعزيزية عند المدرسة)
• Vitamin A: 2 جرعة (100,000 وحدة عند 9 أشهر + 200,000 وحدة عند 18 شهر)
• Td: 1 جرعة (عند دخول المدرسة 5-7 سنوات)

الفاصل الأدنى بين الجرعات المتتالية: 4 أسابيع (28 يوم)`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:1,section:"اللقاحات_الأساسية_التفصيل",content:`اللقاحات الأساسية — التفاصيل السريرية:

1. BCG (تطعيم السل): يُعطى عند الولادة داخل الجلد في الذراع الأيمن. جرعة واحدة فقط. يحمي من أشكال السل الخطيرة عند الأطفال. الحد الأقصى للعمر: سنة واحدة (12 شهر) — بعد السنة لا يُعطي أبداً.

2. HepB (الالتهاب الكبدي B): يُعطى عضلياً عند الولادة خلال 24 ساعة. جرعة واحدة فقط.

3. OPV (الشلل الفموي): يُعطى فموياً 6 جرعات: صفر (عند الولادة) + 3 جرعات أولية (عند 6 أسابيع و10 أسابيع و14 أسبوع) + 2 جرعة تنشيطية (عند 9 أشهر و18 شهر). يحمي من شلل الأطفال.

4. Penta (اللقاح الخماسي): يحمي من 5 أمراض: الدفتيريا + الكزاز + السعال الديكي + التهاب كبدي B + المستدمية النزلية (Hib). 3 جرعات أولية عضلية عند 6 و10 و14 أسبوع + جرعة تعزيزية واحدة عند 18 شهر. الفاصل الأدنى بين الجرعات: 4 أسابيع. Penta3 هو المؤشر الرئيسي لتغطية التطعيم.

5. PCV (اللقاح الرئوي — المكورات الرئوية): يحمي من الالتهاب الرئوي والمكورات الرئوية. 3 جرعات أولية عند 6 و10 و14 أسبوع. اليمن تستخدم PCV13.

6. Rota (الروتا فيروس): يحمي من الإسهال الحاد بالروتا. جرعتان فمويتان عند 6 و10 أسابيع. الفاصل 4 أسابيع.

7. IPV (الشلل الحقن — الشلل المعطل): جرعتان عضليتين — الأولى عند 14 أسبوع والثانية عند 9 أشهر. يعزز المناعة ضد شلل الأطفال.

8. MR (الحصبة والحصبة الألمانية): يُعطى تحت الجلد في الذراع الأيسر. 3 جرعات: MR1 عند 9 أشهر + MR2 عند 18 شهر + جرعة تعزيزية عند 5-7 سنوات (دخول المدرسة). الحصبة مرض شديد العدوى.

9. Vitamin A (فيتامين أ): يُعطى فموياً. جرعتان: 100,000 وحدة دولية (كبسولة زرقاء) عند 9 أشهر + 200,000 وحدة دولية (كبسولة حمراء) عند 18 شهر. يحمي من العمى ويقوي المناعة.

10. Td (التنظير — الكزاز والخناق): يُعطى عضلياً. جرعة واحدة عند دخول المدرسة (5-7 سنوات). يحمي من الكزاز والخناق.

ملاحظة: اللقاح الخماسي يحتوي على: الدفتيريا + الكزاز + السعال الديكي + التهاب الكبد البائي + المستدمية النزلية (Hib)`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:2,section:"سلسلة_التبريد_والتخزين",content:`سلسلة التبريد والتخزين — دليل عملي:

درجات الحرارة: التخزين الموصى 2-8 درجة مئوية. لا تجمد اللقاحات ما عدا OPV و Rota.

استثناءات: OPV يمكن تخزينه في المجمد (-20). Rota يُخزّن في المجمد. IPV و MR و Penta و PCV: 2-8 فقط.

مؤشر VVM: مربع على كل قنينة يتحول من فاتح إلى غامق بالتعرض للحرارة. VVM 1 فاتح = صالح. VVM 4 غامق بالكامل = فاسد.

الحفظ في الميدان: استخدم الحافظة الحرارية مع قوالب باردة. لا تضع القوالب في اتصال مباشر مع القنينات. أعد تبريد القوالب كل يوم.

التسجيل: سجل درجات الحرارة مرتين يومياً. إذا تجاوزت 8 درجة لأكثر من 4 ساعات أبلغ فوراً. إذا تجمد اللقاح اعتبره فاسداً وسجل محضر إتلاف.`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:3,section:"الأحداث_الضارة_بعد_التطعيم_AEFI",content:`الأحداث الضارة بعد التطعيم (AEFI):

التعريف: أي حدث طبي ضار يعقب التلقيح.

التصنيف:
1. متعلقة باللقاح: ردود فعل موضعية (ألم، احمرار، تورم) وحمى خفيفة خلال 48 ساعة — طبيعية.
2. متعلقة بالخطأ: خطأ في التخزين أو التقديم أو التطهير.
3. صدفية: تحدث بالصدفة بعد التطعيم وليس بسببه.
4. متعلقة بالقلق: ردود فعل نفسية (بكاء، خوف، إغماء).

الإبلاغ: جميع حالات الخطيرة خلال 24 ساعة. الحالات الخطيرة: دخول مستشفى، إعاقة دائمة، تهديد حياة، وفاة.

التعامل: حمى = باراسيتامول وسوائل. تورم = كمادات باردة. إغماء = وضع الطفل على ظهره مع رفع الأرجل. صدمة شديدة = أدرينالين عضلي فوراً.`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:4,section:"حملات_التطعيم_التكميلية_SIA",content:`حملات التطعيم التكميلية (SIA) والفرق عن الروتيني:

الروتيني (EPI): رضع حسب الجدول، شهري/أسبوعي، 50-100 طفل لكل جولة، كل اللقاحات، في مرافق ثابتة.

الحملة (SIA): جميع الأطفال دون 5 سنوات، جولة أو جولتين سنوياً، 1-1.5 مليون وطنياً، عادة OPV أو MR فقط، فرق متحركة + ثابتة.

أنواع الحملات في اليمن: حملات OPV (شلل) جولتين سنوياً وطنية. حملات MR (حصبة) حسب الحاجة. حملات إكمال للفئات الفائتة.

فرق الحملات: 12% ثابتة في المرافق + 88% متحركة تذهب للبيوت. كل فريق 2-3 عمال + مشرف. يومياً 15-25 منزل أو 30-50 طفل.

مؤشرات الجودة: تغطية 95% لكل مديرية، 100% على مستوى المحافظة، تلف لقاح 10% أو أقل، إمداد عكسي 100% خلال 48 ساعة.`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:5,section:"الجرعة_الصفرية_والتسرّب",content:`الجرعة الصفرية (Zero Dose) والتسرّب (Dropout):

الجرعة الصفرية: الطفل الذي لم يتلقَّ أي جرعة من Penta. في اليمن 2025: 16,042 طفل (4%). أعلى المحافظات: سيئون 16.3%، المهرة 13.7%، سقطرى 13.4%، مأرب 13.3%.

التسرّب: الفرق بين من بدأوا التطعيم ومن أكملوه. P1 إلى P3: (Penta1 - Penta3) / Penta1 × 100. P3 إلى MR1: (Penta3 - MR1) / Penta3 × 100. المعدل الجيد: أقل من 10%.

الهدف الوطني: P1→P3 تسرّب 5% أو أقل. P3→MR1 تسرّب 10% أو أقل.

الأسباب: بعد المسافة، نقص الوعي، أوقات عمل المرافق، نزوح العائلات، مرض الطفل.

الاستراتيجيات: تذكير عبر الهاتف، تفعيل العاملين المجتمعيين، دمج التطعيم مع خدمات أخرى، جلسات توعية مركزة.`},{docId:"epi_operational_guide",title:"الدليل التشغيلي — منصة مشرف EPI",docType:"operational",index:6,section:"أدوار_المستخدمين",content:`نظام الصلاحيات في منصة مشرف EPI — 5 أدوار:

مدير النظام (Admin) المستوى 5: وصول كامل لإدارة المستخدمين والنماذج والإعدادات وجميع البيانات.

مركزي (Central) المستوى 4: رؤية كل البيانات وطنياً، إنشاء وتعديل النماذج، تصدير تقارير.

محافظة (Governorate) المستوى 3: رؤية بيانات محافظته فقط، الموافقة والرفض على الإرساليات، تصدير PDF.

مديرية (District) المستوى 2: رؤية بيانات مديريته فقط، تصدير التقارير.

إدخال بيانات (Data Entry) المستوى 1: إرسال النماذج فقط، رؤية بياناته فقط، لا يستطيع حذف.

قواعد مهمة: لا يمكن إنشاء مستخدم بنفس المستوى أو أعلى. مدير النظام فقط يستطيع إنشاء مستخدمين من المستوى 4 و 5. كل مستخدم يرى البيانات الجغرافية التابعة لمستواه فقط. الحذف ناعم (Soft Delete).

الأمان: الجلسة تنتهي بعد 8 ساعات. التشفير المحلي AES-256-GCM للبيانات على الجهاز.`},{docId:"epi_operational_guide",title:"الدليل التشغيلي — منصة مشرف EPI",docType:"operational",index:7,section:"النماذج_الديناميكية",content:`النماذج الديناميكية — 10 أنواع حقول:
1. نص (Text) — إدخال حر
2. رقم (Number) — أرقام فقط
3. جوال (Phone) — مع تحقق صيغة
4. نص طويل (Textarea) — لوصف تفصيلي
5. اختيار (Select) — قائمة منسدلة من خيار واحد
6. اختيار متعدد (Multi-select) — عدة خيارات
7. نعم/لا (Boolean) — تبديل
8. تاريخ (Date) — منتقي تاريخ
9. GPS — إحداثيات جغرافية (اختياري إلزامي)
10. صورة (Image) — التقاط من الكاميرا (اختياري إلزامي)

إعدادات متقدمة: GPS إلزامي، صورة إلزامية، عدد صور أقصى، أقسام، ترتيب بسحب وإفلات.

نظام المزامنة: الحفظ أولاً في Hive محلي دائماً. إذا متصل = إرسال فوري. إذا غير متصل = طابور مزامنة. مزامنة تلقائية كل 5 دقائق عند الاتصال. أولوية: إرساليات التطعيم أولاً. إعادة محاولة: 10 ثانية ثم 30 ثم 90 ثم 5 دقائق ثم 15 دقيقة. بعد 5 محاولات فاشلة = مراجعة ييدوية (Dead Letter).`},{docId:"epi_operational_guide",title:"الدليل التشغيلي — منصة مشرف EPI",docType:"operational",index:8,section:"التقارير_المتاحة",content:`أنواع التقارير في منصة مشرف EPI — 5 أنواع PDF:

1. تقرير الإرساليات اليومي: عدد الإرساليات، الحالة (مقبول/مرفوض/معلق)، حسب المديرية. للمحافظة وال مديرية والمركزي.

2. تقرير الإرساليات الأسبوعي: ملخص الأسبوع، اتجاهات، مقارنة بالأسبوع السابق. للمحافظة والمركزي.

3. تقرير النواقص والاحتياجات: قائمة النواقص المبلغة، الأولوية، الحالة. لجميع الأدوار حسب نطاقها.

4. تقرير أداء المحافظات: مقارنة المحافظات في التغطية وعدد الجلسات ومعدل الجلسة. للمركزي ومدير النظام.

5. التقرير الشامل: كل البيانات — إرساليات ونواقص ومستخدمين وإحصائيات. لمدير النظام فقط.

لوحات المعلومات: مؤشرات KPI حية، رسوم بيانية دائري وخطي وأعمدة، خرائط تفاعلية OpenStreetMap.`},{docId:"epi_operational_guide",title:"الدليل التشغيلي — منصة مشرف EPI",docType:"operational",index:9,section:"المساعد_الذكي",content:`المساعد الذكي (MiMo AI) — الاستخدام والقدرات:

القدرات: الإجابة على أسئلة حول بيانات التحصين، تحليل التغطية حسب المحافظة والمديرية والجولة، مقارنة الأداء بين المناطق، تقديم توصيات بناءً على البيانات، تفسير المؤشرات، الإجابة عن أسئلة سريرية حول اللقاحات.

أمثلة على أسئلة مفيدة: ما نسبة تغطية لحج في الجولة الخامسة؟ قارن بين أداء تعز ومأرب في 2025. ما أسباب التسرّب في الحديدة؟ ما الجدول الزمني للتطعيم عند الولادة؟ ما المستهدف الشهري لمديرية المخاء؟

القيود: 25 طلب في الدقيقة لكل مستخدم. لا يحتفظ بذاكرة بين المحادثات. يعتمد على قاعدة المعرفة المحلية (RAG).`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:10,section:"النشاط_الإيصالي_الجولات",content:`النشاط الإيصالي التكاملي — الجولات الخمس 2025:

الجولة 1 (أبريل-مايو): 14 محافظة، 118 مديرية، 1,873 جلسة، 60,729 طفل مطعم.
الجولة 2 (يونيو-يوليو): 14 محافظة، 121 مديرية، 2,237 جلسة، 64,847 طفل.
الجولة 3 (سبتمبر): 14 محافظة، 120 مديرية، 2,178 جلسة، 64,841 طفل.
الجولة 4 (نوفمبر): 15 محافظة، 117 مديرية، 2,171 جلسة، 57,450 طفل.
الجولة 5 (ديسمبر): 15 محافظة، 117 مديرية، 2,171 جلسة، 56,161 طفل.

إجمالي 2025: حوالي 304,028 طفل مطعم في 5 جولات. متوسط الجولة: 60,806 طفل.

الاتجاه: الجولة 2 و 3 الأعلى (موسم ذروة). الجولة 4 و 5 الأدنى (نهاية العام).

ملاحظة: حضرموت مقسمة في الجولة 4 و 5 إلى الساحل والوادي بدلاً من المكلا و سيئون.`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:11,section:"حملات_الشلل",content:`حملات التطعيم ضد شلل الأطفال (OPV) 2024-2025:

الجولة 1 (فبراير 2024): 1,291,196 طفل، تغطية 100%.
الجولة 2 (يوليو 2024): 1,342,025 طفل، تغطية 102%، تلف 13%.
الجولة 3 (يوليو 2025): 1,401,786 طفل، تغطية 104%، تلف 11%، مشاركة نسائية 89%.
الجولة 4 (سبتمبر 2025): 1,440,085 طفل، تغطية 107%، تلف 11%، مشاركة نسائية 91%.

المجموع: 5,475,092 طفل عبر 4 جولات.

أعلى المحافظات تغطياً (الجولة 4): الحديدة 131%، مارب 123%، لحج 116%.
أقل المحافظات: المهرة 94%، سقطرى 95%، حضرموت الوادي 96%.

مديريات تحت الحد الأدنى (الجولة 3): القف 62%، قشن 75%، حصوين 78%.

مؤشرات الجودة (الجولة 4): جاهزية الفريق 100%، بروتوكول 100%، سلسلة تبريد 100%، إمداد عكسي 100%، إشراف إلكتروني 89%.`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:12,section:"الغطية_الروتينية_الوطنية",content:`نتائج التغطية الروتينية 2025:

Penta1 (خماسي أول): 96.3% أعلى من الهدف 90%.
Penta3 (خماسي ثالث): 90.0% على مستوى الهدف.
MR1 (حصبة أول): 86.0% أقل من الهدف 90%.

التسرّب: P1→P3 = 6.3% (جيد). P3→MR1 = 4.0% (جيد).

المحفزات: لحج 108% تغطية Penta1. أبين 100%.

التحديات: الحديدة MR1 حوالي 73% أكبر فجوة. سيئون MR1 حوالي 74%.

الجرعة الصفرية: 16,042 طفل (4%). أعلى: سيئون 16.3%، المهرة 13.7%، سقطرى 13.4%.

تغطية شهرية من DHIS2: زنجبار (أبين) Penta1 = 180.8% تشير لمشكلة تقدير سكان. التواهي (عدن) MR1 = 63% تحتاج متابعة.`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:13,section:"المستهدفات_2026",content:`المستهدفات السنوية 2026:

12 محافظة، 120 مديرية. تحت 1 سنة سنوي: 312,729 طفل. تحت 5 سنوات: 1,536,663 طفل. المنازل: 1,181,319.

أعلى المحافظات: تعز 74,025 (نمو 2.51%). لحج 40,215. عدن 28,988 (نمو 3.79%). مأرب 28,383.

أعلى المديريات: مدينة مأرب 81,524 طفل (5.3% من الوطني). مأرب 47,228. الشمايتين 45,158. تبن 43,154.

أقل المديريات: القف 152 طفل (أصغر مديرية). زموخ ومنوخ 236. حجر الصيعر 354.

معدلات النمو: الأعلى المهرة 4.57%. الأدنى شبوة 2.46%. المستهدف الشهري وطني: 26,061 طفل.

تغير التقسيم: حضرموت المكلا أصبحت حضرموت الساحل (12 مديرية). حضرموت سيئون أصبحت حضرموت الوادي (16 مديرية فيها 6 إضافية).`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:14,section:"اتجاهات_المجتمع",content:`اتجاهات المجتمع تجاه التطعيم 2025:

من 23,631 جلسة توعوية: 87,029 مستفيد، 73,909 طفل في أسرهم.

بعد التوعية: اقتنع 48.2%، لا يزال متردد 12.1%، لا يزال رافض 4.6%، انتقلوا للتطعيم 80.1% من المترددين.

أسباب الرفض حسب المحافظة: شبوة 740 سبب (الأعلى: معتقدات دينية + تخوف + شائعات). سيئون 353 سبب (معتقدات دينية + خوف). عدن (شائعات إعاقة + معتقدات). المهرة 140 سبب (مناطق رحل + جهل). الضالع (شائعات اللقاح أمريكي). البيضاء (شائعات فقط).

استراتيجيات الإقناع الفعالة: التحذير من أمراض الطفولة، نقض الشائعات بحقائق علمية، شرح الآثار الجانبية العادية، أمثلة واقعية من أطفال تم تطعيمهم بنجاح.`},{docId:"epi_data_2025",title:"بيانات التحصين اليمن 2025",docType:"data",index:15,section:"الفجوات_والتوصيات",content:`الفجوات الرئيسية والتوصيات بناءً على بيانات 2025:

الفجوة 1 — تغطية MR1 منخفضة: MR1 = 86% والهدف 90%. أسوأ: الحديدة 73%، سيئون 74%. توصية: حملات MR تكميلية.

الفجوة 2 — المهرة: 9 مديريات صغيرة، 3 تحت 90% في الشلل (قشن 75%، حصوين 78%، حوف 81%). توصية: خطة وصول مخصصة.

الفجوة 3 — سقطرى: 70 طفل في الإيصالي R5. توصية: شحن جوي دوري وتخزين استراتيجي.

الفجوة 4 — الإشراف الإلكتروني: 83% ثم 89%. المؤشر الوحيد تحت 100%. توصية: تدريب المشرفين وتوفير أجهزة.

الفجوة 5 — الرفض المجتمعي: 42% من أسباب عدم التطعيم. شبوة و سيئون = 65% من الرفض. توصية: حملات توعية مركزة وتفعيل قادة المجتمع.

الفجوة 6 — تلف اللقاح في النائيات: القف 78% تلف، ثمود 45%، رخيه 31%. توصية: تحسين سلسلة التبريد وتدريب على VVM.`},{docId:"epi_supervision_template",title:"نموذج مؤشرات الإشراف",docType:"template",index:16,section:"مؤشرات_الإشراف_الشاملة",content:`نموذج مؤشرات الإشراف للنشاط الإيصالي التكاملي — 8 أقسام و 33 مؤشر:

القسم أ — تركيبة الفريق (4 مؤشرات): عنصري الفريق متواجدين 100%. امرأة في الفريق 90% أو أكثر. عضو من نفس المنطقة 95% أو أكثر. كروت تعريف 100%.

القسم ب — التخطيط (3 مؤشرات): خطة كروكي 100%. تحديد الموقع 100%. الالتزام بالخطة 100%.

القسم ج — بروتوكول التطعيم (4 مؤشرات): اتصال شخصي 100%. سؤال الجميع 100%. زاوية 45 درجة 100%. بلع 100%.

القسم د — التسجيل (4 مؤشرات): تسجيل يومي 100%. متابعة متغيبين 100%. تعليم أصابع 100%. علامات منازل 100%.

القسم هـ — اللوجستيات (5 مؤشرات): تموين كاف 100%. لقاح كاف 100%. حفظ حراري 100%. فهم VVM 100%. VVM سليم 100%.

القسم و — الإشراف (4 مؤشرات): إشراف إلكتروني 95% أو أكثر. زيارة يومية 100%. تدوين ملاحظات 100%. سؤال مشتبهات 100%.

القسم ز — السلامة (6 مؤشرات): تسجيل إمداد 100%. أكياس 100%. جمع صحيح 100%. تسجيل واضح 100%. تطابق عدد 100%. تسليم يومي 100%.

القسم ح — فيتامين أ (3 مؤشرات): توفر 100%. إعطاء صحيح 100%. مقص وعلبة 100%.

المؤشر الوحيد تحت 100% في الجولة 4: الإشراف الإلكتروني 89%.`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تعريف التطعيم",docType:"knowledge",index:17,section:"تعريف التطعيم",content:`💉 ما هو التطعيم؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: ما هي اللقاحات",docType:"knowledge",index:18,section:"ما هي اللقاحات",content:`🧬 اللقاحات هي مواد حيوية (بيولوجية) تحتوي على:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: المناعة",docType:"knowledge",index:19,section:"المناعة",content:`🛡️ ما هي المناعة؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أنواع المناعة",docType:"knowledge",index:20,section:"أنواع المناعة",content:`🔬 أنواع المناعة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: المناعة المجتمعية",docType:"knowledge",index:21,section:"المناعة المجتمعية",content:`🏘️ ما هي المناعة المجتمعية (Herd Immunity)؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: بي سي جي",docType:"knowledge",index:22,section:"بي سي جي",content:`🔴 تطعيم BCG (بي سي جي):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: شلل الأطفال",docType:"knowledge",index:23,section:"شلل الأطفال",content:`🟢 تطعيم شلل الأطفال (OPV / IPV):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الخماسي",docType:"knowledge",index:24,section:"الخماسي",content:`🟡 التطعيم الخماسي (Pentavalent/Penta):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيم الرئوي",docType:"knowledge",index:25,section:"التطعيم الرئوي",content:`🟣 تطعيم PCV (التطعيم الرئوي - المكورات الرئوية):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الروتا",docType:"knowledge",index:26,section:"الروتا",content:`🔵 تطعيم الروتا فيروس (Rotavirus):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الحصبة",docType:"knowledge",index:27,section:"الحصبة",content:`🔴 تطعيم الحصبة (MR):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيمات النسائية",docType:"knowledge",index:28,section:"التطعيمات النسائية",content:`👩 تطعيمات الكزاز للحوامل (Td/TT):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مرض السل",docType:"knowledge",index:29,section:"مرض السل",content:`🦠 مرض السل (Tuberculosis/الدرن):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: شلل الأطفال المرض",docType:"knowledge",index:30,section:"شلل الأطفال المرض",content:`🦠 شلل الأطفال (Poliomyelitis):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الخناق",docType:"knowledge",index:31,section:"الخناق",content:`🦠 الخناق (Diphtheria):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الكزاز",docType:"knowledge",index:32,section:"الكزاز",content:`🦠 الكزاز (Tetanus):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: السعال الديبي",docType:"knowledge",index:33,section:"السعال الديبي",content:`🦠 السعال الديبي (Whooping Cough/Pertussis):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التهاب الكبد ب",docType:"knowledge",index:34,section:"التهاب الكبد ب",content:`🦠 التهاب الكبد B (Hepatitis B):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الحصبة الألمانية",docType:"knowledge",index:35,section:"الحصبة الألمانية",content:`🦠 الحصبة الألمانية (Rubella):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: المكورات الرئوية",docType:"knowledge",index:36,section:"المكورات الرئوية",content:`🦠 الالتهابات بالمكورات الرئوية (Pneumococcal):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الروتا المرض",docType:"knowledge",index:37,section:"الروتا المرض",content:`🦠 الإسهال بالروتا فيروس:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التهاب الأغشية المخية",docType:"knowledge",index:38,section:"التهاب الأغشية المخية",content:`🦠 التهاب الأغشية المخية (Meningitis by Hib):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: آثار جانبية",docType:"knowledge",index:39,section:"آثار جانبية",content:`📋 الآثار الجانبية للتطعيمات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: AEFI",docType:"knowledge",index:40,section:"AEFI",content:`📊 حالات الآثار الجانبية بعد التطعيم (AEFI):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الحساسية",docType:"knowledge",index:41,section:"الحساسية",content:`⚠️ الحساسية والتطعيم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: متى أطعم",docType:"knowledge",index:42,section:"متى أطعم",content:`📅 الجدول الزمني للتطعيمات في اليمن (2025):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: كم جرعة",docType:"knowledge",index:43,section:"كم جرعة",content:`📊 عدد الجرعات لكل تطعيم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: فاصل الجرعات",docType:"knowledge",index:44,section:"فاصل الجرعات",content:`⏰ الفواصل بين الجرعات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: سلسلة التبريد",docType:"knowledge",index:45,section:"سلسلة التبريد",content:`❄️ سلسلة التبريد (Cold Chain):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: VVM",docType:"knowledge",index:46,section:"VVM",content:`🔍 مؤشر صلاحية اللقاح (VVM - Vaccine Vial Monitor):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: المحاقن",docType:"knowledge",index:47,section:"المحاقن",content:`💉 المحاقن والمستلزمات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: فيتامين أ",docType:"knowledge",index:48,section:"فيتامين أ",content:`🌟 تكميم فيتامين أ (Vitamin A Supplementation):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أساطير",docType:"knowledge",index:49,section:"أساطير",content:`🚫 الأساطير الشائعة عن التطعيمات (والحقيقة):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مختبرات",docType:"knowledge",index:50,section:"مختبرات",content:`🔬 كيف نختبر اللقاحات ونضمن أمانها؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: للأطفال المبتسرين",docType:"knowledge",index:51,section:"للأطفال المبتسرين",content:`👶 تطعيم الأطفال المبتسرين (خُدّج):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: للأطفال المرضى",docType:"knowledge",index:52,section:"للأطفال المرضى",content:`🤒 تطعيم الأطفال المرضى:
`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الأم المرضعة",docType:"knowledge",index:53,section:"الأم المرضعة",content:`🤱 التطعيم أثناء الرضاعة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الحوامل",docType:"knowledge",index:54,section:"الحوامل",content:`🤰 التطعيم أثناء الحمل:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تأخير التطعيم",docType:"knowledge",index:55,section:"تأخير التطعيم",content:`⏰ ماذا لو تأخرت عن موعد التطعيم؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: عدم الاستجابة",docType:"knowledge",index:56,section:"عدم الاستجابة",content:`❓ ماذا لو لم يستجب الطفل للتطعيم؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تطعيمات متعددة",docType:"knowledge",index:57,section:"تطعيمات متعددة",content:`💉 هل يمكن إعطاء عدة تطعيمات في نفس اليوم؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تندب BCG",docType:"knowledge",index:58,section:"تندب BCG",content:`🔴 التندب بعد تطعيم BCG - طبيعي أم لا؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيم والمدرسة",docType:"knowledge",index:59,section:"التطعيم والمدرسة",content:`🏫 التطعيم والالتحاق بالمدرسة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حملات التطعيم",docType:"knowledge",index:60,section:"حملات التطعيم",content:`🚐 حملات التحصين التكميلية (SIA):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مجاناً",docType:"knowledge",index:61,section:"مجاناً",content:`💰 هل تطعيمات البرنامج مجانية؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أين التطعيم",docType:"knowledge",index:62,section:"أين التطعيم",content:`📍 أين أطعم طفلي في اليمن؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: نصائح قبل التطعيم",docType:"knowledge",index:63,section:"نصائح قبل التطعيم",content:`✅ نصائح قبل التطعيم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: نصائح بعد التطعيم",docType:"knowledge",index:64,section:"نصائح بعد التطعيم",content:`✅ نصائح بعد التطعيم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التغذية والمناعة",docType:"knowledge",index:65,section:"التغذية والمناعة",content:`🥗 التغذية ودورها في تعزيز المناعة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الأمراض المعدية",docType:"knowledge",index:66,section:"الأمراض المعدية",content:`🦠 كيف تنتقل الأمراض المعدية؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الإسهال",docType:"knowledge",index:67,section:"الإسهال",content:`💧 الإسهال عند الأطفال:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيمات الجديدة",docType:"knowledge",index:68,section:"التطعيمات الجديدة",content:`🆕 هل ستطعيمات جديدة في المستقبل؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيم والسفر",docType:"knowledge",index:69,section:"التطعيم والسفر",content:`✈️ التطعيم والسفر:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: ملاحظات",docType:"knowledge",index:70,section:"ملاحظات",content:`📝 ملاحظات عامة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: جدول التطعيم الرسمي",docType:"knowledge",index:71,section:"جدول التطعيم الرسمي",content:`📅 جدول التحصين الروتيني الرسمي (2025):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الفرق بين OPV و IPV",docType:"knowledge",index:72,section:"الفرق بين OPV و IPV",content:`🔵 الفرق بين OPV و IPV:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: هل التطعيم يضر",docType:"knowledge",index:73,section:"هل التطعيم يضر",content:`🤔 هل التطعيمات ضارة؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطعيم والرضاعة",docType:"knowledge",index:74,section:"التطعيم والرضاعة",content:`🍼 هل الرضاعة تمنع التطعيم؟

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: BCG",docType:"knowledge",index:75,section:"BCG",content:"لقاح السل"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: HepB",docType:"knowledge",index:76,section:"HepB",content:"لقاح الكبد الوبائي ب"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: bOPV",docType:"knowledge",index:77,section:"bOPV",content:"لقاح شلل الأطفال الفموي ثنائي النوع"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: tOPV",docType:"knowledge",index:78,section:"tOPV",content:"لقاح شلل الأطفال الفموي ثلاثي الأنواع"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: IPV",docType:"knowledge",index:79,section:"IPV",content:"لقاح شلل الأطفال الحقني"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: MR",docType:"knowledge",index:80,section:"MR",content:"لقاح الحصبة والحصبة الألمانية"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: PCV",docType:"knowledge",index:81,section:"PCV",content:"لقاح المكورات الرئوية"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: Rota",docType:"knowledge",index:82,section:"Rota",content:"لقاح الروتا فيروس"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: Td",docType:"knowledge",index:83,section:"Td",content:"لقاح الكزاز والخناق"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: Penta",docType:"knowledge",index:84,section:"Penta",content:"لقاح الخماسي (DTP-HepB-Hib)"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: Hib",docType:"knowledge",index:85,section:"Hib",content:"لقاح المستدمية النزلية النوع ب"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: DTP",docType:"knowledge",index:86,section:"DTP",content:"لقاح الخناق والكزاز والسعال الديبي"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: TT",docType:"knowledge",index:87,section:"TT",content:"لقاح الكزاز"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: OCV",docType:"knowledge",index:88,section:"OCV",content:"لقاح الكوليرا الفموي"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: COVID-19",docType:"knowledge",index:89,section:"COVID-19",content:"لقاح كورونا"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: EPI",docType:"knowledge",index:90,section:"EPI",content:"برنامج التحصين الصحي الموسع"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: AEFI",docType:"knowledge",index:91,section:"AEFI",content:"حالات الآثار الجانبية بعد التطعيم"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: VVM",docType:"knowledge",index:92,section:"VVM",content:"مراقب صلاحية اللقاح"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: NIDs",docType:"knowledge",index:93,section:"NIDs",content:"الأيام الوطنية للتحصين"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: SNIDs",docType:"knowledge",index:94,section:"SNIDs",content:"أيام التحصين الإقليمية"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: SIA",docType:"knowledge",index:95,section:"SIA",content:"أنشطة التحصين التكميلية"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: UNICEF",docType:"knowledge",index:96,section:"UNICEF",content:"منظمة الأمم المتحدة لرعاية الطفولة"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: WHO",docType:"knowledge",index:97,section:"WHO",content:"منظمة الصحة العالمية"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: GAVI",docType:"knowledge",index:98,section:"GAVI",content:"التحالف العالمي للقاحات والتحصين"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: ID",docType:"knowledge",index:99,section:"ID",content:"حقن داخل الأدمة"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: SC",docType:"knowledge",index:100,section:"SC",content:"حقن تحت الجلد"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: IM",docType:"knowledge",index:101,section:"IM",content:"حقن عضلي"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: WMF",docType:"knowledge",index:102,section:"WMF",content:"معامل الفاقد من اللقاح"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: EXP",docType:"knowledge",index:103,section:"EXP",content:"تاريخ الانتهاء"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: LOT.NO",docType:"knowledge",index:104,section:"LOT.NO",content:"رقم الدفعة"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: ADS",docType:"knowledge",index:105,section:"ADS",content:"محاقن ذاتية التلف"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: CCVM",docType:"knowledge",index:106,section:"CCVM",content:"إدارة اللقاح وسلسلة التبريد"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: CCE",docType:"knowledge",index:107,section:"CCE",content:"معدات سلسلة التبريد"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: EVM",docType:"knowledge",index:108,section:"EVM",content:"الإدارة الفعالة للقاحات"},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: إدارة المستوى الوسيط",docType:"knowledge",index:109,section:"إدارة المستوى الوسيط",content:`🏢 إدارة المستوى الوسيط للتحصين — دليل شامل:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: دور مدير مكتب التحصين",docType:"knowledge",index:110,section:"دور مدير مكتب التحصين",content:`👨‍💼 دور مدير مكتب التحصين بالمحافظة/المديرية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مؤشرات الأداء الرئيسية",docType:"knowledge",index:111,section:"مؤشرات الأداء الرئيسية",content:`📊 مؤشرات الأداء الرئيسية (KPIs) للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: رصد التغطيات",docType:"knowledge",index:112,section:"رصد التغطيات",content:`📈 رصد التغطيات التطعيمية — دليل عملي:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حساب السكان المستهدفين",docType:"knowledge",index:113,section:"حساب السكان المستهدفين",content:`👥 حساب السكان المستهدفين للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تحليل التسرب",docType:"knowledge",index:114,section:"تحليل التسرب",content:`📉 تحليل التسرب بين جرعات التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تتبع المتخلفين",docType:"knowledge",index:115,section:"تتبع المتخلفين",content:`🔍 تتبع المتخلفين عن التحصين — استراتيجيات عملية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التقارير الدورية",docType:"knowledge",index:116,section:"التقارير الدورية",content:`📋 التقارير الدورية للتحصين — دليل شامل:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: نظام المعلومات الصحي",docType:"knowledge",index:117,section:"نظام المعلومات الصحي",content:`💻 نظام المعلومات الصحي (DHIS2) للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التخطيط الدقيق",docType:"knowledge",index:118,section:"التخطيط الدقيق",content:`🗺️ التخطيط الدقيق (Microplanning) للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: إدارة المخزون",docType:"knowledge",index:119,section:"إدارة المخزون",content:`📦 إدارة مخزون اللقاحات — دليل عملي:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: خطة العمل السنوية",docType:"knowledge",index:120,section:"خطة العمل السنوية",content:`📅 خطة العمل السنوية للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الجلسات الثابتة والمتنقلة",docType:"knowledge",index:121,section:"الجلسات الثابتة والمتنقلة",content:`🏥 الجلسات الثابتة والمتنقلة للتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التنسيق مع الشركاء",docType:"knowledge",index:122,section:"التنسيق مع الشركاء",content:`🤝 التنسيق مع الشركاء في برنامج التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: صنع القرار المبني على البيانات",docType:"knowledge",index:123,section:"صنع القرار المبني على البيانات",content:`📊 صنع القرار المبني على البيانات (Data-Driven Decision Making):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الإشراف الداعم",docType:"knowledge",index:124,section:"الإشراف الداعم",content:`🔍 الإشراف الداعم للتحصين — المفهوم والممارسة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الزيارات الإشرافية",docType:"knowledge",index:125,section:"الزيارات الإشرافية",content:`🚗 الزيارات الإشرافية الداعمة — دليل عملي:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: قائمة المراجعة الإشرافية",docType:"knowledge",index:126,section:"قائمة المراجعة الإشرافية",content:`☑️ قائمة المراجعة الإشرافية (Supervision Checklist):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التغذية الراجعة البناءة",docType:"knowledge",index:127,section:"التغذية الراجعة البناءة",content:`💬 التغذية الراجعة البناءة في الإشراف الداعم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: خطة التحسين",docType:"knowledge",index:128,section:"خطة التحسين",content:`📈 خطة التحسين (Improvement Plan):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حملات التحصين",docType:"knowledge",index:129,section:"حملات التحصين",content:`🚐 حملات التحصين — دليل شامل:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أيام التحصين الوطنية",docType:"knowledge",index:130,section:"أيام التحصين الوطنية",content:`🇾🇪 أيام التحصين الوطنية (NIDs):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حملات الاستجابة للأوبئة",docType:"knowledge",index:131,section:"حملات الاستجابة للأوبئة",content:`🚨 حملات الاستجابة للأوبئة (Outbreak Response):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التعبئة المجتمعية للحملات",docType:"knowledge",index:132,section:"التعبئة المجتمعية للحملات",content:`📢 التعبئة المجتمعية لحملات التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تخطيط الحملات",docType:"knowledge",index:133,section:"تخطيط الحملات",content:`📋 تخطيط حملات التحصين — دليل خطوة بخطوة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تنفيذ الحملات",docType:"knowledge",index:134,section:"تنفيذ الحملات",content:`⚙️ تنفيذ حملات التحصين — الإجراءات الميدانية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مراقبة الحملات",docType:"knowledge",index:135,section:"مراقبة الحملات",content:`👁️ مراقبة حملات التحصين — دليل المراقبين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تقييم الحملات",docType:"knowledge",index:136,section:"تقييم الحملات",content:`📊 تقييم حملات التحصين — مؤشرات ودروس:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: فرق التحصين المتنقلة",docType:"knowledge",index:137,section:"فرق التحصين المتنقلة",content:`🚑 فرق التحصين المتنقلة (Mobile Teams):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: سياسة القارورة المفتوحة",docType:"knowledge",index:138,section:"سياسة القارورة المفتوحة",content:`🔓 سياسة القارورة المفتوحة (Open Vial Policy):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حساب الاحتياج من اللقاحات",docType:"knowledge",index:139,section:"حساب الاحتياج من اللقاحات",content:`🧮 حساب الاحتياج من اللقاحات — معادلات وأمثلة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: حساب الهدر",docType:"knowledge",index:140,section:"حساب الهدر",content:`📉 حساب هدر اللقاحات وتقليله:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أنواع الثلاجات",docType:"knowledge",index:141,section:"أنواع الثلاجات",content:` freezer أنواع ثلاجات التحصين ومعدات سلسلة التبريد:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تعبئة حافظات اللقاح",docType:"knowledge",index:142,section:"تعبئة حافظات اللقاح",content:`🎒 تعبئة حافظات اللقاح (Vaccine Carriers) — دليل خطوة بخطوة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تحضير اللقاحات الجافة",docType:"knowledge",index:143,section:"تحضير اللقاحات الجافة",content:`🧪 تحضير اللقاحات الجافة (Lyophilized Vaccines):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: سلامة الحقن",docType:"knowledge",index:144,section:"سلامة الحقن",content:`💉 سلامة الحقن (Injection Safety) — دليل شامل:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التخلص من النفايات الحيوية",docType:"knowledge",index:145,section:"التخلص من النفايات الحيوية",content:`🗑️ التخلص من النفايات الحيوية (Medical Waste Disposal):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مراقبة درجة الحرارة",docType:"knowledge",index:146,section:"مراقبة درجة الحرارة",content:`🌡️ مراقبة درجة حرارة سلسلة التبريد:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: صيانة معدات سلسلة التبريد",docType:"knowledge",index:147,section:"صيانة معدات سلسلة التبريد",content:`🔧 صيانة معدات سلسلة التبريد:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: نقل اللقاحات",docType:"knowledge",index:148,section:"نقل اللقاحات",content:`🚚 نقل اللقاحات — دليل التوزيع الآمن:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التخزين الصحيح للقاحات",docType:"knowledge",index:149,section:"التخزين الصحيح للقاحات",content:`🏥 التخزين الصحيح للقاحات في الثلاجة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: إدارة انقطاع التبريد",docType:"knowledge",index:150,section:"إدارة انقطاع التبريد",content:`⚡ إدارة انقطاع التبريد (Cold Chain Break):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: نظام FIFO و FEFO",docType:"knowledge",index:151,section:"نظام FIFO و FEFO",content:`📊 نظام FIFO و FEFO لإدارة المخزون:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الترصد الوبائي",docType:"knowledge",index:152,section:"الترصد الوبائي",content:`🔬 الترصد الوبائي للأمراض المستهدفة بالتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الاستجابة للأوبئة",docType:"knowledge",index:153,section:"الاستجابة للأوبئة",content:`🚨 الاستجابة للأوبئة — خطوات عملية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: رصد الأحداث الضائرة",docType:"knowledge",index:154,section:"رصد الأحداث الضائرة",content:`⚠️ رصد الأحداث الضائرة بعد التطعيم (AEFI Surveillance):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تحصين المدارس",docType:"knowledge",index:155,section:"تحصين المدارس",content:`🏫 تحصين المدارس — دليل التنفيذ:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: جودة البيانات",docType:"knowledge",index:156,section:"جودة البيانات",content:`📊 جودة البيانات في برنامج التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تعزيز الطلب",docType:"knowledge",index:157,section:"تعزيز الطلب",content:`📢 تعزيز الطلب على التحصين (Demand Generation):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: المشاركة المجتمعية",docType:"knowledge",index:158,section:"المشاركة المجتمعية",content:`🤝 المشاركة المجتمعية في برنامج التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مكافحة الشائعات",docType:"knowledge",index:159,section:"مكافحة الشائعات",content:`🛑 مكافحة الشائعات عن التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التثقيف الصحي",docType:"knowledge",index:160,section:"التثقيف الصحي",content:`📚 التثقيف الصحي للتحصين — دليل الممارسة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التكامل مع برامج أخرى",docType:"knowledge",index:161,section:"التكامل مع برامج أخرى",content:`🔗 التكامل بين التحصين والبرامج الصحية الأخرى:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: توثيق التطعيمات",docType:"knowledge",index:162,section:"توثيق التطعيمات",content:`📝 توثيق التطعيمات — أهمية البطاقة والسجلات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين في الطوارئ والنزوح",docType:"knowledge",index:163,section:"التحصين في الطوارئ والنزوح",content:`🏚️ التحصين في حالات الطوارئ والنزوح:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الشهادة الدولية للتطعيم",docType:"knowledge",index:164,section:"الشهادة الدولية للتطعيم",content:`🌐 الشهادة الدولية للتطعيم (International Certificate of Vaccination):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مراقبة الأمراض المستهدفة",docType:"knowledge",index:165,section:"مراقبة الأمراض المستهدفة",content:`👁️ مراقبة الأمراض المستهدفة بالتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التخلص من الأمراض",docType:"knowledge",index:166,section:"التخلص من الأمراض",content:`🎯 التخلص من الأمراض المستهدفة بالتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: معالجة حالات الرفض",docType:"knowledge",index:167,section:"معالجة حالات الرفض",content:`🚫 معالجة حالات رفض التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التطوع في التحصين",docType:"knowledge",index:168,section:"التطوع في التحصين",content:`🙋 التطوع في برنامج التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الشراكة مع القطاع الخاص",docType:"knowledge",index:169,section:"الشراكة مع القطاع الخاص",content:`🏢 الشراكة مع القطاع الخاص في التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: بناء قدرات العاملين",docType:"knowledge",index:170,section:"بناء قدرات العاملين",content:`👨‍🏫 بناء قدرات العاملين الصحيين في التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحفيز والمتابعة",docType:"knowledge",index:171,section:"التحفيز والمتابعة",content:`🏆 تحفيز العاملين الصحيين ومتابعتهم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: اجتماعات المراجعة",docType:"knowledge",index:172,section:"اجتماعات المراجعة",content:`🤝 اجتماعات مراجعة أداء التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تقييم الأداء الربعي",docType:"knowledge",index:173,section:"تقييم الأداء الربعي",content:`📊 تقييم الأداء الربعي لبرنامج التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين والنزوح",docType:"knowledge",index:174,section:"التحصين والنزوح",content:`🏚️ التحصين للسكان النازحين والمتأثرين بالنزاعات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التغطية الشاملة",docType:"knowledge",index:175,section:"التغطية الشاملة",content:`🎯 التغطية الشاملة للتحصين (Universal Coverage):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: صحة الأم والطفل والتحصين",docType:"knowledge",index:176,section:"صحة الأم والطفل والتحصين",content:`👩‍👧 صحة الأم والطفل وعلاقتها بالتحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التواصل الفعال مع المجتمع",docType:"knowledge",index:177,section:"التواصل الفعال مع المجتمع",content:`🗣️ التواصل الفعال مع المجتمع في التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: القيادة المجتمعية للتحصين",docType:"knowledge",index:178,section:"القيادة المجتمعية للتحصين",content:`⭐ القيادة المجتمعية لدعم التحصين:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: الإبلاغ عن AEFI",docType:"knowledge",index:179,section:"الإبلاغ عن AEFI",content:`📞 الإبلاغ عن الأحداث الضائرة بعد التطعيم:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين والسجل المدني",docType:"knowledge",index:180,section:"التحصين والسجل المدني",content:`📜 الربط بين التحصين والسجل المدني:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: مؤشر استخدام اللقاحات",docType:"knowledge",index:181,section:"مؤشر استخدام اللقاحات",content:`📊 مؤشر استخدام اللقاحات (Vaccine Utilization Rate):

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التوزيع العادل للقاحات",docType:"knowledge",index:182,section:"التوزيع العادل للقاحات",content:`⚖️ التوزيع العادل للقاحات:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين والرعاية الأولية",docType:"knowledge",index:183,section:"التحصين والرعاية الأولية",content:`🏥 التحصين كجزء من الرعاية الصحية الأولية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين في المناطق الحضرية",docType:"knowledge",index:184,section:"التحصين في المناطق الحضرية",content:`🏙️ التحصين في المناطق الحضرية:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: تخزين المخفف",docType:"knowledge",index:185,section:"تخزين المخفف",content:`💧 تخزين المخفف (Diluent) بشكل صحيح:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: أنواع أكياس الثلج",docType:"knowledge",index:186,section:"أنواع أكياس الثلج",content:`🧊 أنواع أكياس الثلج واستخدامها:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين والتحول الرقمي",docType:"knowledge",index:187,section:"التحصين والتحول الرقمي",content:`📱 التحصين والتحول الرقمي:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: معالجة اللقاح المتجمد",docType:"knowledge",index:188,section:"معالجة اللقاح المتجمد",content:`❄️ معالجة اللقاح الذي تعرض للتجمد:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: التحصين وتغير المناخ",docType:"knowledge",index:189,section:"التحصين وتغير المناخ",content:`🌍 التحصين وتغير المناخ:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: جدول التحصين المحدث 2026",docType:"knowledge",index:190,section:"جدول التحصين المحدث 2026",content:`📅 جدول التحصين المحدث 2026 — التغييرات الجديدة:

`},{docId:"epi_bot_knowledge_base",title:"EPI-Bot: إدارة الحملات في النزاعات",docType:"knowledge",index:191,section:"إدارة الحملات في النزاعات",content:`⚔️ إدارة حملات التحصين في مناطق النزاعات:

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: حول النشاط الايصالي",docType:"knowledge",index:192,section:"حول النشاط الايصالي",content:`🚐 النشاط الايصالي التكاملي (SIA):

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: تكميم فيتامين أ",docType:"knowledge",index:193,section:"تكميم فيتامين أ",content:`🌟 تكميم فيتامين أ (VAS):

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: حملات الحصبة",docType:"knowledge",index:194,section:"حملات الحصبة",content:`🔴 حملات الحصبة التكميلية:

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: أسبوع صحة الطفل",docType:"knowledge",index:195,section:"أسبوع صحة الطفل",content:`👶 أسبوع صحة الطفل (CHW):

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: حملات الكزاز للحوامل",docType:"knowledge",index:196,section:"حملات الكزاز للحوامل",content:`🤰 حملات الكزاز للحوامل (MAT):

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: الفرق بين SIA والروتين",docType:"knowledge",index:197,section:"الفرق بين SIA والروتين",content:`📊 الفرق بين SIA والتطعيم الروتيني:

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: تقييم SIA",docType:"knowledge",index:198,section:"تقييم SIA",content:`📊 تقييم النشاط الايصالي التكاملي:

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: التخطيط لـ SIA",docType:"knowledge",index:199,section:"التخطيط لـ SIA",content:`📋 التخطيط للنشاط الايصالي:

`},{docId:"epi_bot_sia_kb",title:"EPI-Bot: التحديات",docType:"knowledge",index:200,section:"التحديات",content:`⚠️ التحديات في تنفيذ SIA:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: علم المناعة التطبيقي للتحصين",docType:"knowledge",index:201,section:"علم المناعة التطبيقي للتحصين",content:`🔬 علم المناعة التطبيقي للتحصين (Applied Immunology):

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: المناعة السلبية الأمومية والتحصين",docType:"knowledge",index:202,section:"المناعة السلبية الأمومية والتحصين",content:`🤰 المناعة السلبية الأمومية وتأثيرها على التحصين:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: أنواع اللقاحات المتقدمة",docType:"knowledge",index:203,section:"أنواع اللقاحات المتقدمة",content:`🧬 تصنيف اللقاحات المتقدم:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: استراتيجيات التحصين المتقدمة",docType:"knowledge",index:204,section:"استراتيجيات التحصين المتقدمة",content:`📋 استراتيجيات التحصين المتقدمة (Advanced Immunization Strategies):

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: مؤشرات جودة التحصين",docType:"knowledge",index:205,section:"مؤشرات جودة التحصين",content:`📊 مؤشرات جودة التحصين (Immunization Quality Indicators):

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: بروتوكولات التطعيم المتقدمة",docType:"knowledge",index:206,section:"بروتوكولات التطعيم المتقدمة",content:`📋 بروتوكولات التطعيم المتقدمة:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: التحصين في حالات الطوارئ والأزمات",docType:"knowledge",index:207,section:"التحصين في حالات الطوارئ والأزمات",content:`🚨 التحصين في حالات الطوارئ والأزمات:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: القضاء على الأمراض والتحصين",docType:"knowledge",index:208,section:"القضاء على الأمراض والتحصين",content:`🎯 استراتيجيات القضاء على الأمراض بالتحصين:

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: إدارة اللقاحات المتقدمة",docType:"knowledge",index:209,section:"إدارة اللقاحات المتقدمة",content:`💊 إدارة اللقاحات المتقدمة (Advanced Vaccine Management):

`},{docId:"epi_bot_advanced_immunization_kb",title:"EPI-Bot: سلسلة التبريد المتقدمة",docType:"knowledge",index:210,section:"سلسلة التبريد المتقدمة",content:`❄️ إدارة سلسلة التبريد المتقدمة:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: حول التحليل",docType:"knowledge",index:211,section:"حول التحليل",content:`📊 تحليل بيانات النظام الصحي:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: مؤشرات HMIS",docType:"knowledge",index:212,section:"مؤشرات HMIS",content:`📊 مؤشرات HMIS الرئيسية:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: تحليل التغطية",docType:"knowledge",index:213,section:"تحليل التغطية",content:`📈 تحليل التغطية التطعيمية:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: تحليل AEFI",docType:"knowledge",index:214,section:"تحليل AEFI",content:`⚠️ تحليل حالات الآثار الجانبية (AEFI):

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: تحليل الحملات",docType:"knowledge",index:215,section:"تحليل الحملات",content:`🚐 تحليل بيانات الحملات:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: البيانات الديموغرافية",docType:"knowledge",index:216,section:"البيانات الديموغرافية",content:`👶 البيانات الديموغرافية:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: التقارير",docType:"knowledge",index:217,section:"التقارير",content:`📋 التقارير المطلوبة:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: التنبؤ",docType:"knowledge",index:218,section:"التنبؤ",content:`🔮 التنبؤ بالاحتياجات:

`},{docId:"epi_bot_analytics_kb",title:"EPI-Bot: جودة البيانات",docType:"knowledge",index:219,section:"جودة البيانات",content:`✅ جودة البيانات:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: حول الحملات",docType:"knowledge",index:220,section:"حول الحملات",content:`🚐 حملات شلل الأطفال في اليمن:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: الحملات الوطنية",docType:"knowledge",index:221,section:"الحملات الوطنية",content:`🇾🇪 الحملات الوطنية لشلل الأطفال (NIDs):

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: الحملات الإقليمية",docType:"knowledge",index:222,section:"الحملات الإقليمية",content:`📍 الحملات الإقليمية (SNIDs):

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: الفرق بين NIDs و SNIDs",docType:"knowledge",index:223,section:"الفرق بين NIDs و SNIDs",content:`📊 الفرق بين الحملات الوطنية والإقليمية:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: تاريخ شلل الأطفال في اليمن",docType:"knowledge",index:224,section:"تاريخ شلل الأطفال في اليمن",content:`📜 تاريخ شلل الأطفال في اليمن:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: أنواع شلل الأطفال",docType:"knowledge",index:225,section:"أنواع شلل الأطفال",content:`🦠 أنواع فيروس شلل الأطفال:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: فريق الحملة",docType:"knowledge",index:226,section:"فريق الحملة",content:`👥 بنية فريق الحملة:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: تقييم الحملة",docType:"knowledge",index:227,section:"تقييم الحملة",content:`📊 تقييم أداء الحملة:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: السجلات والتقارير",docType:"knowledge",index:228,section:"السجلات والتقارير",content:`📋 سجلات وتقارير الحملة:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: الأطفال غير المطعمين",docType:"knowledge",index:229,section:"الأطفال غير المطعمين",content:`👶 التعامل مع الأطفال غير المطعمين:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: التثقيف الصحي",docType:"knowledge",index:230,section:"التثقيف الصحي",content:`📢 التثقيف الصحي خلال الحملة:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: سلسلة التبريد في الحملات",docType:"knowledge",index:231,section:"سلسلة التبريد في الحملات",content:`❄️ سلسلة التبريد خلال الحملات:

`},{docId:"epi_bot_polio_campaign_kb",title:"EPI-Bot: الاستجابة للأوبئة",docType:"knowledge",index:232,section:"الاستجابة للأوبئة",content:`🚨 الاستجابة للأوبئة:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: إدارة المستوى الوسيط",docType:"knowledge",index:233,section:"إدارة المستوى الوسيط",content:`🏥 إدارة المستوى الوسيط في برنامج التحصين (Intermediate Level Management):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: مهام مدير مكتب المحافظة في التحصين",docType:"knowledge",index:234,section:"مهام مدير مكتب المحافظة في التحصين",content:`📋 المهام التفصيلية لمدير مكتب المحافظة في التحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: مؤشرات أداء المستوى الوسيط",docType:"knowledge",index:235,section:"مؤشرات أداء المستوى الوسيط",content:`📊 مؤشرات أداء المستوى الوسيط في التحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: الإشراف الداعم",docType:"knowledge",index:236,section:"الإشراف الداعم",content:`🏥 الإشراف الداعم في برنامج التحصين (Supportive Supervision):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: قائمة التحقق الإشرافية",docType:"knowledge",index:237,section:"قائمة التحقق الإشرافية",content:`📋 قائمة التحقق الإشرافية الداعمة للتحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: التخطيط الدقيق",docType:"knowledge",index:238,section:"التخطيط الدقيق",content:`📅 التخطيط الدقيق للتحصين (Microplanning):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: نظام المعلومات الصحية HMIS",docType:"knowledge",index:239,section:"نظام المعلومات الصحية HMIS",content:`💻 نظام المعلومات الصحية (HMIS) في التحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: جودة البيانات في التحصين",docType:"knowledge",index:240,section:"جودة البيانات في التحصين",content:`📊 جودة البيانات في برنامج التحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: بناء القدرات في التحصين",docType:"knowledge",index:241,section:"بناء القدرات في التحصين",content:`🎓 بناء القدرات في برنامج التحصين (Capacity Building):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: التنسيق والشراكات في التحصين",docType:"knowledge",index:242,section:"التنسيق والشراكات في التحصين",content:`🤝 التنسيق والشراكات في برنامج التحصين:

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: التعبئة الاجتماعية للتحصين",docType:"knowledge",index:243,section:"التعبئة الاجتماعية للتحصين",content:`📢 التعبئة الاجتماعية للتحصين (Social Mobilization):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: تحليل البيانات لاتخاذ القرارات",docType:"knowledge",index:244,section:"تحليل البيانات لاتخاذ القرارات",content:`📈 تحليل البيانات لاتخاذ القرارات في التحصين (Data-driven Decision Making):

`},{docId:"epi_bot_intermediate_management_kb",title:"EPI-Bot: تتبع المتخلفين عن التحصين",docType:"knowledge",index:245,section:"تتبع المتخلفين عن التحصين",content:`🔍 تتبع المتخلفين عن التحصين (Defaulter Tracing):

`},{docId:"epi_bot_real_data",title:"بيانات التغطية الفعلية — المحافظات",docType:"data",index:246,section:"تغطية_المحافظات",content:`بيانات التغطية حسب المحافظة:

• أبين: 95975 طفل (101%) — جيدة
• الحديدة: 42883 طفل (151%) — ممتازة
• الضالع: 86918 طفل (100%) — جيدة
• المهرة: 21330 طفل (94%) — مقبولة
• تعز: 336730 طفل (102%) — جيدة
• حضرموت الساحل: 103237 طفل (98%) — جيدة
• حضرموت الوادي: 76381 طفل (90%) — مقبولة
• سقطرى: 10805 طفل (90%) — مقبولة
• شبوة: 112276 طفل (93%) — مقبولة
• عدن: 64295 طفل (87%) — متدنية
• لحج: 130284 طفل (99%) — جيدة
• مأرب: 72325 طفل (95%) — مقبولة
• حجة: 55765 طفل (89%) — متدنية
• البيضاء: 18855 طفل (82%) — متدنية
• الجوف: 13904 طفل (79%) — متدنية
• أبين: 95293 طفل (99%) — جيدة
• الحديدة: 47537 طفل (117%) — ممتازة
• الضالع: 91904 طفل (103%) — جيدة
• المهرة: 20728 طفل (95%) — مقبولة
• تعز: 347155 طفل (106%) — جيدة
• حضرموت الساحل: 105387 طفل (99%) — جيدة
• حضرموت الوادي: 82010 طفل (95%) — مقبولة
• سقطرى: 11186 طفل (96%) — مقبولة
• شبوة: 112131 طفل (93%) — مقبولة
• عدن: 63909 طفل (87%) — متدنية
• لحج: 137000 طفل (104%) — جيدة
• مأرب: 74313 طفل (98%) — جيدة
• حجة: 60261 طفل (96%) — مقبولة
• البيضاء: 19320 طفل (84%) — متدنية
• الجوف: 14145 طفل (80%) — متدنية
• أبين: 98264 طفل (100%) — ممتازة
• الحديدة: 51184 طفل (123%) — ممتازة
• الضالع: 97408 طفل (105%) — ممتازة
• المهرة: 20517 طفل (91%) — مقبولة
• تعز: 358991 طفل (107%) — ممتازة
• حضرموت الساحل: 108325 طفل (98%) — جيدة
• حضرموت الوادي: 83842 طفل (95%) — مقبولة
• سقطرى: 11465 طفل (93%) — مقبولة
• شبوة: 113755 طفل (95%) — مقبولة
• عدن: 67043 طفل (91%) — مقبولة
• لحج: 140650 طفل (107%) — ممتازة
• مأرب: 76704 طفل (101%) — جيدة
• حجة: 63806 طفل (102%) — جيدة
• البيضاء: 20264 طفل (88%) — متدنية
• الجوف: 14831 طفل (84%) — متدنية
• أبين: 97374 طفل (99%) — ممتازة
• الحديدة: 54236 طفل (131%) — ممتازة
• الضالع: 99418 طفل (107%) — ممتازة
• المهرة: 21243 طفل (94%) — مقبولة
• تعز: 360398 طفل (107%) — ممتازة
• حضرموت الساحل: 110768 طفل (100%) — ممتازة
• حضرموت الوادي: 85993 طفل (96%) — جيدة
• سقطرى: 11723 طفل (95%) — مقبولة
• شبوة: 116519 طفل (97%) — جيدة
• عدن: 67037 طفل (91%) — مقبولة
• لحج: 141781 طفل (108%) — ممتازة
• مأرب: 77037 طفل (101%) — جيدة
• حجة: 64384 طفل (103%) — جيدة
• البيضاء: 20383 طفل (88%) — متدنية
• الجوف: 14727 طفل (84%) — متدنية
`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:247,section:"جدول_الجرعة_الصفرية_فوق_العام",content:`جدول الجرعة الصفرية — فوق العام إلى سنتين (من لم يأخذ أي جرعة سابقاً):

الزيارة الأولى — عند أول لقاء:
• Penta1 (خماسي 1) — عضلي
• PCV1 (مكورات رئوية 1) — عضلي
• Rota1 (روتا 1) — فموي
• OPV1 (شلل فموي 1) — فموي
• IPV1 (شلل حقن 1) — عضلي
• MR1 (حصبة وحصبة ألمانية 1) — تحت الجلد
• فيتامين أ — 100,000 وحدة دولية

الزيارة الثانية — بعد شهر من الزيارة الأولى:
• Penta2 (خماسي 2)
• PCV2 (مكورات رئوية 2)
• Rota2 (روتا 2)
• OPV2 (شلل فموي 2)
• IPV2 (شلل حقن 2)
• MR2 (حصبة وحصبة ألمانية 2)

الزيارة الثالثة — بعد شهر من الزيارة الثانية:
• OPV3 (شلل فموي 3)

الزيارة الرابعة — بعد 6 أشهر من الزيارة الثانية:
• Penta3 (خماسي 3 — الجرعة الثالثة)

ملاحظات:
• الفاصل الأدنى بين الزيارة الأولى والثانية: 4 أسابيع
• الفاصل الأدنى بين الزيارة الثانية والثالثة: 4 أسابيع
• لا يُعطي الروتا بعد عمر سنتين (24 شهر)
• ⚠️ لا يُعطي BCG في هذا الجدول (الحد الأقصى = سنة واحدة فقط)
• جميع اللقاحات الأخرى: الحد الأقصى 5 سنوات
• جميع اللقاحات الأخرى الحد الأقصى 5 سنوات (ما عدا Td المدرسي: 7 سنوات)`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:248,section:"جدول_الجرعة_الصفرية_فوق_العامين",content:`جدول الجرعة الصفرية — فوق العامين إلى خمس سنوات (من لم يأخذ أي جرعة سابقاً):

الزيارة الأولى — عند أول لقاء:
• Penta1 (خماسي 1) — عضلي
• PCV1 (مكورات رئوية 1) — عضلي
• OPV1 (شلل فموي 1) — فموي
• IPV1 (شلل حقن 1) — عضلي
• MR1 (حصبة وحصبة ألمانية 1) — تحت الجلد
• فيتامين أ — 200,000 وحدة دولية

⚠️ لا يُعطي BCG (الحد الأقصى = سنة واحدة)
⚠️ لا يُعطي Rota (الحد الأقصى = سنتين)

ملاحظة: لا يُعطي الروتا في هذا الجدول (تجاوز العمر الأقصى سنتين)

الزيارة الثانية — بعد شهر من الزيارة الأولى:
• Penta2 (خماسي 2)
• OPV2 (شلل فموي 2)
• IPV2 (شلل حقن 2)
• MR2 (حصبة وحصبة ألمانية 2)

ملاحظة: لا يُعطي PCV في الزيارة الثانية (يُعطى فقط في الزيارة الأولى)

الزيارة الثالثة — بعد شهر من الزيارة الثانية:
• OPV3 (شلل فموي 3)

الزيارة الرابعة — بعد 6 أشهر من الزيارة الثانية:
• Penta3 (خماسي 3 — الجرعة الثالثة)

الفرق عن جدول فوق العام إلى سنتين:
• لا يُعطي الروتا (تجاوز العمر)
• PCV يُعطى في الزيارة الأولى فقط (وليس الأولى والثانية)
• Penta3 يُعطى بعد 6 أشهر من الزيارة الثانية (وليس 3 أشهر)
• فيتامين أ يُعطى 200,000 وحدة دولية (وليس 100,000)`},{docId:"epi_clinical_guide",title:"الدليل السريري للتحصين — اليمن",docType:"clinical",index:249,section:"أمثلة_الجرعة_الصفرية",content:`أمثلة تطبيقية على الجرعة الصفرية (من دليل التحصين):

مثال 1 — طفل عمره 3 أشهر ونصف بدون أي جرعة سابقة:
اللقاحات: BCG + OPV1 + Penta1 + PCV1 + Rota1 + IPV1
ملاحظة: بعد شهر → الجرعة الثانية من Penta وOPV وPCV وRota وIPV

مثال 2 — طفل عمره 9 أشهر بدون أي جرعة سابقة:
اللقاحات: BCG + OPV1 + Penta1 + PCV1 + Rota1 + IPV1 + MR1 + فيتامين أ 100,000 وحدة
ملاحظة: بعد شهر → الجرعة الثانية من Penta وOPV وPCV وRota وIPV + MR2

مثال 3 — طفل عمره سنة وستة أشهر بدون أي جرعة سابقة:
اللقاحات: OPV1 + IPV1 + Penta1 + PCV1 + Rota1 + MR1 + فيتامين أ 100,000 وحدة
ملاحظة: بعد شهر → الجرعة الثانية من Penta وOPV وPCV وRota وIPV + MR2

مثال 4 — طفل عمره سنتين وستة أشهر بدون أي جرعة سابقة:
اللقاحات: OPV1 + IPV1 + Penta1 + PCV1 + MR1 + فيتامين أ 100,000 وحدة
ملاحظة: لا يُعطي الروتا (تجاوز العمر) — بعد شهر → الجرعة الثانية من Penta وOPV وIPV + MR2

مثال 5 — طفل عمره سنة و3 أشهر، أخذ جرعة واحدة فقط في 4 أشهر:
اللقاحات: OPV2 + IPV2 + Penta2 + PCV2 + Rota2 + MR1 + فيتامين أ 100,000 وحدة
ملاحظة: بعد شهر → OPV3 + MR2

مثال 5 — طفل عمره 3 سنوات بدون أي جرعة سابقة:
اللقاحات: OPV1 + IPV1 + Penta1 + PCV1 + MR1 + فيتامين أ 200,000 وحدة
ملاحظة: لا يُعطي BCG (تجاوز سنة) ولا يُعطي الروتا (تجاوز سنتين) — بعد شهر → OPV2 + Penta2 + IPV2 + MR2 — بعد شهر → OPV3 — بعد 6 أشهر → Penta3

القاعدة الأساسية:
• BCG: الحد الأقصى سنة واحدة (12 شهر). Rota: الحد الأقصى سنتين. الخماسي + باقي اللقاحات: الحد الأقصى 5 سنوات. Td (مدرسي): الحد الأقصى 7 سنوات
• في حال فقدان بطاقة التحصين لا يمنع من استكمال اللقاحات
• أقصر فاصل بين الجرعات المتتالية: 4 أسابيع (28 يوم)
• BCG يُعطى مرة واحدة فقط في العمر
• لا تُعد الجرعة المعملية لأن الجسم يحتفظ بالذاكرة المناعية`}],js=new Set(["في","من","على","إلى","عن","مع","هذا","هذه","ذلك","تلك","التي","الذي","الذين","اللواتي","هو","هي","هم","هن","أنا","نحن","أنت","أنتم","أنتن","كان","كانت","يكون","تكون","ليس","ليست","قد","لقد","سوف","لم","لن","ما","لا","إن","أن","إذا","إذ","حتى","كل","بعض","أي","بين","عند","فوق","تحت","أمام","خلف","يمين","يسار","كيف","أين","متى","لماذا","كم","هل","أم","ثم","أو","و","ف","ب","ل","ال","لل","بال","كال","وال","هذا","هذه","تلك","ذاك","هنا","هناك","حيث","كي","لكن","بعد","قبل","خلال","منذ","حول","دون","ضد","عبر","نحو","وفق","حسب","دون","غير","سوى"]),Ts=["ال","و ال","ب ال","ك ال","ل ل","و","ب","ك","ل","ف","س"],Es=["ة","ات","ين","ون","ان","يت","يا","ية","هن","هم","نا","كم","كن","ها","ه"];function F(e){return e.replace(/[إأآا]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي").replace(/[ًٌٍَُِّْ]/g,"").replace(/\s+/g," ").trim()}function Me(e){return F(e).split(/[\s،؛:.!؟\-\(\)\[\]{}]+/).filter(o=>o.length>1)}function dt(e){return e.filter(t=>!js.has(t))}function lt(e){let t=e;for(const o of Ts)if(t.startsWith(o)&&t.length>o.length+2){t=t.slice(o.length);break}for(const o of Es)if(t.endsWith(o)&&t.length>o.length+2){t=t.slice(0,-o.length);break}return t}function Ns(e){const t=F(e),o=[{regex:/سنتين/,toMonths:()=>24},{regex:/سنة\s*ونص[ف]?/,toMonths:()=>18},{regex:/سنة\s*و(ست|6)\s*شهر/,toMonths:()=>18},{regex:/سنة\s*و(ثلاث|3)\s*شهر/,toMonths:()=>15},{regex:/سنتين\s*ونص[ف]?/,toMonths:()=>30},{regex:/سنت?[هی]/,toMonths:()=>12},{regex:/(\d+)\s*شهو?ر/,toMonths:s=>parseInt(s[1])},{regex:/شهرين/,toMonths:()=>2},{regex:new RegExp("(?<!\\d)شهر(?!\\d|ين)"),toMonths:()=>1},{regex:/(\d+)\s*اسبوو?ع/,toMonths:s=>Math.floor(parseInt(s[1])/4)},{regex:/اسبوو?ع(?!\d|ين)/,toMonths:()=>0},{regex:/(\d+)\s*يوم/,toMonths:s=>0},{regex:/^(\d+)\s*$/,toMonths:s=>parseInt(s[1])}];for(const s of o){const i=t.match(s.regex);if(i){const a=s.toMonths(i),r=a*4;let d="";return a===0?d="أقل من شهر":a===1?d="شهر واحد":a===2?d="شهرين":a<12?d=`${a} شهور`:a===12?d="سنة واحدة":a===18?d="سنة ونصف":a===24?d="سنتين":d=`${a} شهر`,{months:a,weeks:r,display:d}}}return null}function ct(e){const t=[],o=[],s=[],i=[{id:"bcg",name:"🔴 BCG (ضد السل)",dueAt:0,maxAt:12,route:"داخل الجلد"},{id:"hepb0",name:"💉 HepB0 (كبد ب - ولادة)",dueAt:0,maxAt:60,route:"عضلي"},{id:"opv0",name:"💧 OPV0 (شلل فموي - ولادة)",dueAt:0,maxAt:60,route:"فموي"},{id:"opv1",name:"💧 OPV1 (شلل فموي 1)",dueAt:1.5,maxAt:60,route:"فموي"},{id:"penta1",name:"5️⃣ Penta1 (خماسي 1)",dueAt:1.5,maxAt:60,route:"عضلي"},{id:"pcv1",name:"🫁 PCV1 (مكورات 1)",dueAt:1.5,maxAt:60,route:"عضلي"},{id:"rota1",name:"🦠 Rota1 (روتا 1)",dueAt:1.5,maxAt:24,route:"فموي"},{id:"opv2",name:"💧 OPV2 (شلل فموي 2)",dueAt:2.5,maxAt:60,route:"فموي"},{id:"penta2",name:"5️⃣ Penta2 (خماسي 2)",dueAt:2.5,maxAt:60,route:"عضلي"},{id:"pcv2",name:"🫁 PCV2 (مكورات 2)",dueAt:2.5,maxAt:60,route:"عضلي"},{id:"rota2",name:"🦠 Rota2 (روتا 2)",dueAt:2.5,maxAt:24,route:"فموي"},{id:"opv3",name:"💧 OPV3 (شلل فموي 3)",dueAt:3.5,maxAt:60,route:"فموي"},{id:"penta3",name:"5️⃣ Penta3 (خماسي 3)",dueAt:3.5,maxAt:60,route:"عضلي"},{id:"pcv3",name:"🫁 PCV3 (مكورات 3)",dueAt:3.5,maxAt:60,route:"عضلي"},{id:"ipv1",name:"💉 IPV1 (شلل حقن 1)",dueAt:3.5,maxAt:60,route:"عضلي"},{id:"mr1",name:"🔴 MR1 (حصبة 1)",dueAt:9,maxAt:60,route:"تحت الجلد"},{id:"opv4",name:"💧 OPV4 (شلل فموي 4)",dueAt:9,maxAt:60,route:"فموي"},{id:"ipv2",name:"💉 IPV2 (شلل حقن 2)",dueAt:9,maxAt:60,route:"عضلي"},{id:"vitA1",name:"🌟 فيتامين أ (100,000 و.د)",dueAt:9,maxAt:60,route:"فموي"},{id:"mr2",name:"🔴 MR2 (حصبة 2)",dueAt:18,maxAt:60,route:"تحت الجلد"},{id:"opv5",name:"💧 OPV5 (شلل فموي 5)",dueAt:18,maxAt:60,route:"فموي"},{id:"penta4",name:"💪 Penta4 (خماسي تعزيزية)",dueAt:18,maxAt:60,route:"عضلي"},{id:"vitA2",name:"🌟 فيتامين أ (200,000 و.د)",dueAt:18,maxAt:60,route:"فموي"},{id:"td_school",name:"🏫 Td (مدرسي)",dueAt:60,maxAt:84,route:"عضلي"},{id:"mr_school",name:"🔴 MR تعزيزية (مدرسي)",dueAt:60,maxAt:60,route:"تحت الجلد"},{id:"vitA_school",name:"🌟 فيتامين أ (مدرسي)",dueAt:60,maxAt:60,route:"فموي"}];for(const r of i)e>=r.dueAt&&e<r.maxAt?t.push(r.name):e>=r.maxAt?t.some(d=>d.includes(r.id.replace(/\d+$/,"")))||o.push(`${r.name} (تجاوز العمر)`):s.push(`${r.name} (عند ${r.dueAt<1?"الولادة":r.dueAt+" شهر"})`);let a="";return e<1.5?a=`📅 **التطعيمات عند الولادة:**
• BCG (ضد السل) — داخل الجلد
• OPV0 (شلل فموي) — فموي
• HepB0 (كبد ب) — عضلي خلال 24 ساعة`:e<2.5?a=`📅 **تطعيمات 6 أسابيع:**
• OPV1 + Penta1 + PCV1 + Rota1
الجرعة التالية عند 10 أسابيع`:e<3.5?a=`📅 **تطعيمات 10 أسابيع:**
• OPV2 + Penta2 + PCV2 + Rota2
الجرعة التالية عند 14 أسبوع`:e<9?a=`📅 **تطعيمات 14 أسبوع:**
• OPV3 + Penta3 + PCV3 + IPV1
الجرعة التالية عند 9 أشهر (MR1 + OPV4 + IPV2 + فيتامين أ)`:e<18?a=`📅 **تطعيمات 9 أشهر:**
• MR1 + OPV4 + IPV2 + فيتامين أ (100,000 و.د)
الجرعة التالية عند 18 شهر`:e<60?a=`📅 **تطعيمات 18 شهر:**
• MR2 + OPV5 + Penta4 (تعزيزية) + فيتامين أ (200,000 و.د)
الجرعة التالية عند دخول المدارس (5-7 سنوات)`:a=`📅 **تطعيمات دخول المدارس (5-7 سنوات):**
• Td + MR تعزيزية + فيتامين أ (200,000 و.د)`,{due:t,overdue:o,upcoming:s,schedule:a}}const ut=[{id:"query_submissions",label:"استعلام الإرساليات",keywords:["ارسالي","ارسال","بيانات","استماره","نموذج","تقديم","مسوده","مرسل"],category:"query",responseTemplate:"إحصائيات الإرساليات",priority:10},{id:"query_governorates",label:"استعلام المحافظات",keywords:["محافظ","محافظه","منطق","قضاء","مديري","حي","جغرافي","خريط"],category:"query",responseTemplate:"بيانات المحافظات",priority:9},{id:"query_users",label:"استعلام المستخدمين",keywords:["مستخدم","فريق","موظف","عامل","مشغل","نشط","حساب","صلاحي"],category:"query",responseTemplate:"إحصائيات المستخدمين",priority:9},{id:"query_coverage",label:"استعلام التغطية",keywords:["تغطي","نسب","معدل","تحصين","تلقيح","تطعيم","وصول","انتشار"],category:"query",responseTemplate:"نسب التغطية",priority:10},{id:"query_vaccination",label:"استعلام التطعيم",keywords:["لقاح","تطعيم","تحصين","تلقيح","جرع","حصب","شلل","سحايا","كبد","دفتري","كزاز","سعال"],category:"query",responseTemplate:"بيانات التطعيم",priority:10},{id:"query_forms",label:"استعلام الاستمارات",keywords:["استماره","نموذج","قالب","حقل","بيان","خان","ملء","تعب"],category:"query",responseTemplate:"الاستمارات المتاحة",priority:8},{id:"query_analytics",label:"استعلام التحليلات",keywords:["تحليل","احصائ","مؤشر","رسم","بيان","رسم بيان","مقارن","اتجاه","تقدم"],category:"query",responseTemplate:"التحليلات",priority:9},{id:"create_report",label:"إنشاء تقرير",keywords:["تقرير","انشاء","اصدار","اعداد","ملخص","شامل","تقرير يوم","تقرير اسبوع"],category:"action",responseTemplate:"إنشاء تقرير",priority:8},{id:"export_data",label:"تصدير البيانات",keywords:["تصدير","تنزيل","حفظ","اكسل","بي دي اف","PDF","Excel","CSV","طباع"],category:"action",responseTemplate:"تصدير البيانات",priority:7},{id:"send_notification",label:"إرسال إشعار",keywords:["اشعار","تنبيه","رسال","ارسال","ابلاغ","اعلام","تنويه"],category:"action",responseTemplate:"إرسال إشعار",priority:8},{id:"resolve_shortage",label:"معالجة النقص",keywords:["معالج","حل","معالج نقص","توفير","تزويد","تعب","ترميم"],category:"action",responseTemplate:"معالجة النقص",priority:9},{id:"fill_form",label:"ملء استمارة",keywords:["ملء","تعب","ادخال","بيانات","استماره جديده","نموذج جديد"],category:"action",responseTemplate:"ملء استمارة",priority:7},{id:"go_to_dashboard",label:"لوحة التحكم",keywords:["لوح","تحكم","رئيس","صفحه رئيس","بداي"],category:"navigation",responseTemplate:"الانتقال للوحة التحكم",priority:5},{id:"go_to_map",label:"الخريطة",keywords:["خريط","موقع","جغراف","مساح","اماكن","مواقع"],category:"navigation",responseTemplate:"الانتقال للخريطة",priority:5},{id:"go_to_settings",label:"الإعدادات",keywords:["اعداد","ضبط","تخصيص","تفضيل","مظهر","ثيم","لغ"],category:"navigation",responseTemplate:"الانتقال للإعدادات",priority:4},{id:"go_to_users",label:"المستخدمين",keywords:["اداره مستخدم","فريق","صلاحي","ادوار"],category:"navigation",responseTemplate:"الانتقال لإدارة المستخدمين",priority:5},{id:"go_to_submissions",label:"الإرساليات",keywords:["عرض ارسالي","جدول ارسالي","قائم ارسالي"],category:"navigation",responseTemplate:"الانتقال للإرساليات",priority:5},{id:"how_to",label:"كيف أفعل",keywords:["كيف","طريق","خطوات","شرح","دليل","ارشاد"],category:"help",responseTemplate:"دليل الاستخدام",priority:6},{id:"guide",label:"دليل",keywords:["دليل","تعليم","مساعد","شرح","استخدام","بداي","مبتد"],category:"help",responseTemplate:"دليل الاستخدام",priority:6},{id:"troubleshooting",label:"حل المشاكل",keywords:["مشكل","خطا","عطل","لا يعمل","لا يظهر","عالق","متوقف","فشل"],category:"help",responseTemplate:"حل المشاكل",priority:7},{id:"greeting",label:"تحية",keywords:["مرحب","اهلا","سلام","صباح","مساء","هاي","هلو"],category:"help",responseTemplate:"مرحباً! كيف أساعدك؟",priority:3},{id:"thanks",label:"شكر",keywords:["شكر","شكرا","ممتاز","رائع","تمام","جيد","حلوه"],category:"help",responseTemplate:"العفو! سعيد بالمساعدة.",priority:2},{id:"trend_analysis",label:"تحليل الاتجاهات",keywords:["اتجاه","تطور","تغير","نمو","انخفاض","ارتفاع","مقارن زمان","فتر"],category:"analysis",responseTemplate:"تحليل الاتجاهات",priority:9},{id:"comparison",label:"مقارنة",keywords:["مقارن","فرق","تمييز","افضل","اسوا","اعلى","ادنى","بين","ضد"],category:"analysis",responseTemplate:"المقارنة",priority:9},{id:"forecasting",label:"تنبؤ",keywords:["توقع","تنبؤ","مستقبل","قادم","اسبوع قادم","شهر قادم","هدف","خط"],category:"analysis",responseTemplate:"التنبؤات",priority:8},{id:"anomaly_detection",label:"كشف الشذوذ",keywords:["شذوذ","غير طبيع","غريب","مفاج","غير متوقع","انحراف","خارج المعتاد"],category:"analysis",responseTemplate:"كشف الشذوذ",priority:9},{id:"performance_analysis",label:"تحليل الأداء",keywords:["اداء","كفاء","انتاج","فاعلي","جود","دق","سرع"],category:"analysis",responseTemplate:"تحليل الأداء",priority:8},{id:"critical_shortage",label:"نقص حرج",keywords:["حرج","خطر","طوار","مستعجل","فوري","عاجل","صفر","نفد"],category:"alert",responseTemplate:"تنبيه: نقص حرج",priority:10},{id:"low_coverage",label:"تغطية منخفضة",keywords:["منخفض","ضعيف","تحت المطلوب","اقل من الهدف","حصل","عجز"],category:"alert",responseTemplate:"تنبيه: تغطية منخفضة",priority:10},{id:"inactive_users",label:"مستخدمين غير نشطين",keywords:["غير نشط","خامل","لم يسجل","لم يدخل","متغيب","غائب"],category:"alert",responseTemplate:"تنبيه: مستخدمين غير نشطين",priority:8},{id:"data_quality",label:"جودة البيانات",keywords:["جود","دق","خطا بيان","بيانات خاطئ","تناقض","مكرر","ناقص","غير مكتمل"],category:"alert",responseTemplate:"تنبيه: مشكلة جودة البيانات",priority:9},{id:"system_health",label:"صحة النظام",keywords:["نظام","خادم","اتصال","شبك","بط","استجاب","متاح"],category:"alert",responseTemplate:"حالة النظام",priority:7},{id:"query_campaigns",label:"استعلام الحملات",keywords:["حمل","موسم","تطعيم دور","حمل وطن","استئصال"],category:"query",responseTemplate:"بيانات الحملات",priority:8},{id:"query_supplies",label:"استعلام المستلزمات",keywords:["مستلزم","معد","حقن","ثلاج","مبرد","سرنج","قطن","كحول"],category:"query",responseTemplate:"المستلزمات",priority:8},{id:"query_cold_chain",label:"سلسلة التبريد",keywords:["تبريد","ثلاج","مبرد","حرار","تخزين لقاح","سلسل بارد","فريزر"],category:"query",responseTemplate:"سلسلة التبريد",priority:9},{id:"query_adverse_events",label:"الأحداث الضائرة",keywords:["ضائر","عرض جانب","تاثير","مضاعف","تحسس","رد فعل"],category:"query",responseTemplate:"الأحداث الضائرة",priority:9},{id:"query_demographics",label:"الديموغرافيا",keywords:["سكان","تعداد","ولاد","وفيات","فئ عمر","اطفال","حوامل"],category:"query",responseTemplate:"بيانات سكانية",priority:7},{id:"query_child_vaccines",label:"تطعيمات طفلي",keywords:["طفلي","طفلك","طفﻻ","رضيع","مولود","تطعيمات طفل","جدول طفلي","وش ياخذ","وش اللقاحات","تعليمات طفلي"],category:"query",responseTemplate:"تطعيمات حسب العمر",priority:10},{id:"child_age_response",label:"عمر الطفل",keywords:["عمره","عمرها","شهرين","سنتين","سنه","سنة"],category:"context",responseTemplate:"رد حسب العمر",priority:9},{id:"query_schedule",label:"جدول التطعيم",keywords:["جدول","مواعيد","وقت","تاريخ","موعد","خطة","زمن"],category:"query",responseTemplate:"جدول التطعيم",priority:8},{id:"bulk_action",label:"إجراء جماعي",keywords:["جماع","كل","مجموع","دفع","متعدد","تحديد الكل"],category:"action",responseTemplate:"إجراء جماعي",priority:6},{id:"go_to_reports",label:"التقارير",keywords:["تقارير","ارقام","احصائي"],category:"navigation",responseTemplate:"الانتقال للتقارير",priority:5},{id:"feedback",label:"ملاحظات",keywords:["ملاحظ","راي","اقتراح","تحسين","تقييم"],category:"help",responseTemplate:"شكراً لملاحظاتك",priority:4},{id:"correlation_analysis",label:"تحليل الارتباط",keywords:["ارتباط","علاق","سببي","تاثير متبادل","رابط"],category:"analysis",responseTemplate:"تحليل الارتباط",priority:8},{id:"root_cause",label:"السبب الجذري",keywords:["سبب","جذر","لماذا","عامل","محرك","مصدر مشكل"],category:"analysis",responseTemplate:"تحليل السبب الجذري",priority:9}],Ss={positive:["ممتاز","رائع","جيد","جدا","مبدع","متميز","نجاح","تحسن","تقدم","انجاز","تفوق","تمام","الحمد","شكر","سعيد","فرح","افضل"],negative:["سيء","سيئ","رديء","فاشل","مشكل","مشاكل","خطا","خطر","صعب","عاجز","فشل","ضعف","نقص","تاخير","متاخر","بطيء","اسوا"],urgent:["عاجل","حرج","طوارئ","فوري","الان","مستعجل","خطر","تنبيه","انذار","صفر","نفد","توقف","انقطاع","كارث","ازم"],neutral:["عادي","طبيعي","معتاد","كالمعتاد","مستقر","ثابت","رتيب"]},Cs=[{id:"kb_vaccine_types",domain:"vaccination",keywords:["لقاح","تحصين","تلقيح","تطعيم","جرع"],response:"برنامج التطعيم يشمل: BCG (السل)، HepB (الكبد B)، OPV/IPV (شلل الأطفال)، Pentavalent (الخماسي)، Measles (الحصبة)، MR (الحصبة والحصبة الألمانية)، DTaP (الدفتريا والكزاز والسعال الديكي). يتم إعطاء الجرعات حسب جدول التطعيم الوطني.",relatedIntents:["query_vaccination","query_coverage","query_schedule"],priority:10},{id:"kb_coverage_targets",domain:"coverage",keywords:["تغطي","هدف","نسب","معدل"],response:"الهدف الوطني للتغطية هو 95% لجميع اللقاحات. النسب الأقل من 80% تعتبر حرجة وتتطلب تدخل فوري. النسب بين 80-90% تتطلب متابعة مكثفة.",relatedIntents:["query_coverage","low_coverage","comparison"],priority:10},{id:"kb_cold_chain",domain:"cold_chain",keywords:["تبريد","ثلاج","مبرد","حرار","سلسل"],response:"سلسلة التبريد يجب أن تحافظ على درجة حرارة +2 إلى +8 درجات مئوية لمعظم اللقاحات. أي انقطاع يتجاوز 30 دقيقة يجب تسجيله. اللقاحات المتأثرة يجب عزلها ومراجعة المسؤول.",relatedIntents:["query_cold_chain","anomaly_detection"],priority:10},{id:"kb_epi_program",domain:"epi",keywords:["برنامج","توسع","مناع","وقاي"],response:"برنامج التوسع في التطعيم (EPI) يهدف لتوفير التطعيمات الأساسية لجميع الأطفال. يشمل المراقبة الوبائية، إدارة المخزون، التدريب، والتوعية المجتمعية.",relatedIntents:["query_vaccination","query_campaigns","guide"],priority:8},{id:"kb_governorate_roles",domain:"roles",keywords:["صلاحي","دور","محافظ","قضاء","مركز","اداره"],response:"الأدوار: مدير النظام (كامل الصلاحيات)، مركزي (إشراف عام)، محافظة (إشراف على المحافظة)، قضاء (إشراف على القضاء)، إدخال بيانات (إدخال الاستمارات فقط).",relatedIntents:["query_users","go_to_users","how_to"],priority:7},{id:"kb_data_entry",domain:"data_entry",keywords:["ادخال","بيانات","استماره","نموذج","ملء"],response:"لإدخال بيانات: 1) اختر الاستمارة المناسبة 2) املأ جميع الحقول المطلوبة 3) تأكد من صحة البيانات 4) أضف الإحداثيات GPS إذا طُلب 5) التقط الصور إذا لزم 6) اضغط إرسال.",relatedIntents:["fill_form","query_forms","how_to"],priority:8},{id:"kb_reporting",domain:"reporting",keywords:["تقرير","احصائ","مؤشر","تحليل"],response:"التقارير المتاحة: يومي (ملخص النشاط)، أسبوعي (اتجاهات ومقارنات)، شهري (تحليل شامل)، المحافظات (مقارنة جغرافية)، التغطية (نسب التحصين)، النواقص (حالة المستلزمات).",relatedIntents:["create_report","query_analytics","trend_analysis"],priority:8},{id:"kb_autism_myth",domain:"myths",keywords:["اوتيزم","توحد","يسبب","ضرر","ضار","خطور","خطر"],response:"🚫 لا، التطعيمات لا تسبب الأوتيزم! هذه أسطورة نشرتها دراسة مزيفة عام 1998 تم سحبها وفقد صاحبها رخصته الطبية. أظهرت عشرات الدراسات على ملايين الأطفال أن لا علاقة بين التطعيمات والأوتيزم. التطعيمات آمنة وفعالة وتنقذ حياة الأطفال.",relatedIntents:["query_vaccination","guide"],priority:10},{id:"kb_free_vaccine",domain:"cost",keywords:["مجاني","مجان","سعر","تكلفة","فلوس","ثمن","يكلف"],response:"💰 نعم! جميع تطعيمات برنامج التحصين الموسع (EPI) مجانية تماماً في جميع المرافق الصحية الحكومية. لا تدفع أي رسوم. إذا طلب منك أحد دفع مبلغ، أبلغ فوراً.",relatedIntents:["query_vaccination","guide"],priority:10},{id:"kb_where_vaccinate",domain:"location",keywords:["وين","أين","مكان","مركز","مستشفى","عياد","صحي"],response:"📍 يمكنك تطعيم طفلك في: 1) المراكز الصحية الحكومية (مجاني) 2) المستوصفات 3) المستشفيات الحكومية 4) خلال حملات التطعيم التكميلية (فرق متنقلة تأتي للبيوت). ابحث عن أقرب مركز صحي في منطقتك.",relatedIntents:["query_vaccination","guide"],priority:9},{id:"kb_sick_vaccine",domain:"clinical",keywords:["مريض","حمى","سخون","مصاب","مريض","здоров"],response:"🤒 إذا كان الطفل مريضاً بحمى خفيفة (أقل من 38.5°C) أو سحاب خفيف، يمكن إعطاء التطعيم. أما إذا الحمى شديدة (فوق 38.5°C) أو المرض خطير، يؤجل التطعيم حتى الشفاء. استشر الطبيب في حالة الشك.",relatedIntents:["query_vaccination","how_to"],priority:9},{id:"kb_bcg_scar",domain:"clinical",keywords:["تندب","ندب","علامة","اثر","بقع"],response:"🔴 التندب بعد تطعيم BCG طبيعي ومطلوب! يظهر بعد 2-4 أسابيع كاحمرار صغير، ثم يتحول إلى ندبة صغيرة (حوالي 5-10 مم). هذا يدل على أن التطعيم نجح. لا تحاول علاج الندبة أو إزالتها.",relatedIntents:["query_vaccination","how_to"],priority:8}];class Ms{constructor(){te(this,"conversations",new Map);te(this,"maxHistory",50);te(this,"maxSessions",100)}getContext(t,o){const s=`${t}:${o}`;let i=this.conversations.get(s);if(i||(i={userId:t,sessionId:o,history:[],metadata:{},createdAt:Date.now(),updatedAt:Date.now()},this.conversations.set(s,i)),this.conversations.size>this.maxSessions){const a=Array.from(this.conversations.entries()).sort((r,d)=>r[1].updatedAt-d[1].updatedAt)[0];a&&this.conversations.delete(a[0])}return i}addTurn(t,o,s){const i=`${t}:${o}`,a=this.getContext(t,o);a.history.push(s),a.history.length>this.maxHistory&&(a.history=a.history.slice(-this.maxHistory)),s.intent&&(a.lastIntent=s.intent),s.entities&&(a.lastEntities=s.entities),a.updatedAt=Date.now(),this.conversations.set(i,a)}getRecentIntents(t,o,s=5){return this.getContext(t,o).history.filter(a=>a.role==="user"&&a.intent).slice(-s).map(a=>a.intent)}clearSession(t,o){this.conversations.delete(`${t}:${o}`)}}class Bs{constructor(){te(this,"memory");te(this,"defaultSessionId","default");this.memory=new Ms}searchLocalKnowledge(t){const o=F(t),s=Me(o),i=dt(s),a=[];for(const r of Ps){let d=0;const c=F(r.content),l=F(r.section),p=F(r.title);for(const g of i)if(!(g.length<2)){c.includes(g)&&(d+=2),l.includes(g)&&(d+=3),p.includes(g)&&(d+=2);for(const b of c.split(/\s+/))(b.includes(g)||g.includes(b))&&(d+=.5)}r.docType==="clinical"&&i.some(g=>["لقاح","تطعيم","جرع","تحصين","تبريد"].some(b=>F(b).includes(g)))&&(d*=1.3),r.docType==="data"&&i.some(g=>["تغطي","نسب","إحصائي","بيانات","معدل"].some(b=>F(b).includes(g)))&&(d*=1.3),r.docType==="operational"&&i.some(g=>["كيف","استخدام","دليل","ارشاد","طريق"].some(b=>F(b).includes(g)))&&(d*=1.3),d>0&&a.push({chunk:r,score:d})}return a.sort((r,d)=>d.score-r.score).slice(0,3).map(r=>r.chunk)}processMessage(t,o){let s=this.classifyIntent(t);const i=this.analyzeSentiment(t),a=this.getSmartSuggestions(o||this.getDefaultContext()),r=this.buildActions(s.intent,s.entities),d=(o==null?void 0:o.userId)||"anonymous",c=(o==null?void 0:o.sessionId)||this.defaultSessionId,l=this.memory.getRecentIntents(d,c,3),p=l[l.length-1];(p==="query_child_vaccines"||p==="child_age_response")&&s.entities.child_age_months&&(s={...s,intent:"child_age_response",confidence:.95}),s.entities.child_age_months&&s.intent==="unknown"&&(s={...s,intent:"child_age_response",confidence:.9});const g=this.searchLocalKnowledge(t);let b="",_=!1;if(g.length>0){const I=g[0];if(b=`📖 ${I.title}

${I.content}`,g.length>1){b+=`

━━━ مراجع إضافية ━━━`;for(const E of g.slice(1))b+=`

📌 ${E.section}: ${E.content.slice(0,200)}...`}_=!0}b||(b=this.generateResponse(s,i,o));const y=this.searchKnowledgeBase(t);y&&(b+=`

💡 `+y.response,_=!0),this.memory.addTurn(d,c,{role:"user",text:t,intent:s.intent,sentiment:i.sentiment,timestamp:Date.now(),entities:s.entities}),this.memory.addTurn(d,c,{role:"bot",text:b,intent:s.intent,timestamp:Date.now()});const h=_||s.confidence>.5?"local":"hybrid";return{text:b,intent:s.intent,sentiment:i.sentiment,suggestions:a,actions:r,source:h,data:{knowledgeChunks:g.length}}}classifyIntent(t){const o=F(t),s=Me(t),i=dt(s),a=i.map(lt);let r="unknown",d=0,c={};for(const p of ut){let g=0;for(const b of p.keywords){const _=F(b),y=lt(_);o.includes(_)&&(g+=3),a.some(h=>h===y||h.includes(y)||y.includes(h))&&(g+=2),i.some(h=>h.includes(_)||_.includes(h))&&(g+=1.5)}p.category==="alert"&&(g*=1.3),p.category==="action"&&(g*=1.1),g*=p.priority/10,g>d&&(d=g,r=p.id)}c=this.extractEntities(o,s);const l=Math.min(d/10,1);return l<.2&&(r=this.fallbackIntent(o)),{intent:r,confidence:l,entities:c,originalText:t,normalizedText:o}}analyzeSentiment(t){const o=F(t);Me(t);const s={positive:0,negative:0,neutral:0,urgent:0},i=[];for(const[p,g]of Object.entries(Ss))for(const b of g){const _=F(b);o.includes(_)&&(s[p]+=p==="urgent"?3:1,i.push(b))}(t.match(/!/g)||[]).length>1&&(s.urgent+=1),t!==t.toLowerCase()&&/[A-Z]{3,}/.test(t)&&(s.urgent+=.5);let a="neutral",r=0;for(const[p,g]of Object.entries(s))g>r&&(r=g,a=p);r===0&&(a="neutral");let d=0;a==="urgent"?d=Math.min(10,5+r):a==="negative"&&(d=Math.min(7,2+r));const c=Object.values(s).reduce((p,g)=>p+g,0)||1,l=r/c;return{sentiment:a,score:l,keywords:i,urgencyLevel:d}}getSmartSuggestions(t){var r,d;const o=this.memory.getRecentIntents(t.userId,t.sessionId,3),s=[],i=o[o.length-1]||t.lastIntent,a={query_submissions:["حلل أسباب الرفض","قارن بالأسبوع الماضي","أي المحافظات لها أعلى رفض؟"],query_governorates:["حلل السبب في الأضعف","قارن بآخر شهر","اعرض تفاصيل كل محافظة"],query_users:["المستخدمين غير النشطين","توزيع الصلاحيات","آخر تسجيل دخول"],query_coverage:["أي المناطق أقل تغطية؟","قارن بالهدف الوطني","توقع التغطية الشهر القادم"],query_child_vaccines:["كم عمر طفلك؟","متى الموعد القادم؟","هل فيه لقاحات متأخرة؟"],child_age_response:["وش اللقاحات القادمة؟","هل فيه تأخر؟","متى الموعد التالي؟"],query_schedule:["جدول الحملة القادمة","أي اللقاحات ناقصة؟","مقارنة بالجدول الرسمي"],query_vaccination:["ما أكثر اللقاحات نقصاً؟","حالة سلسلة التبريد","تغطية الحصب","وش تطعيمات طفلي؟"],query_cold_chain:["حرارة الثلاجة","ما هو VVM؟","كيف أتعامل مع انقطاع التبريد؟"],query_adverse_events:["كيف أبلّغ؟","ما هي الأعراض الخطيرة؟","متى أراجع الطبيب؟"],how_to:["كيف أملأ استمارة؟","كيف أصدر تقرير؟","كيف أضيف مستخدم؟"],guide:["دليل التطعيم","جدول التحصين","الآثار الجانبية"],create_report:["أرسل التقرير بالبريد","صدر كـ PDF","أضف رسوم بيانية"],low_coverage:["حدد الأسباب المحتملة","اقترح خطة تحسين","أي المناطق متأثرة؟"],greeting:["📊 حالة الإرساليات","📈 تقرير يومي"],unknown:["📊 حالة الإرساليات","👥 فريق العمل","📈 تقرير يومي"]};return i&&a[i]?s.push(...a[i].slice(0,3)):s.push(...(a.unknown||[]).slice(0,3)),(r=t.metadata)!=null&&r.hasCriticalShortages&&s.unshift("🚨 عالج النواقص الحرجة فوراً"),(d=t.metadata)!=null&&d.lowCoverageAreas&&s.unshift("📉 مناطق ذات تغطية منخفضة"),s.slice(0,5)}generateDailySummary(t){const o=[];return o.push("📋 **ملخص يومي — EPI Supervisor**"),o.push(`📅 ${new Date().toLocaleDateString("ar-SA",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}`),o.push(""),t.total_submissions!==void 0&&(o.push("📊 **الإرساليات:**"),o.push(`   • الإجمالي: ${t.total_submissions}`),o.push(`   • اليوم: ${t.submissions_today??0}`),o.push(`   • هذا الأسبوع: ${t.submissions_this_week??0}`),o.push("")),t.total_users!==void 0&&(o.push("👥 **المستخدمين:**"),o.push(`   • الإجمالي: ${t.total_users}`),o.push(`   • النشطين: ${t.active_users??0}`),o.push("")),t.total_forms!==void 0&&(o.push("📝 **الاستمارات:**"),o.push(`   • الإجمالي: ${t.total_forms}`),o.push(`   • النشطة: ${t.active_forms??0}`),o.push("")),t.submissions_today===0&&t.active_users>0&&o.push("📭 لا توجد إرساليات اليوم رغم وجود مستخدمين نشطين"),o.join(`
`)}selectBestModel(t){const o=this.classifyIntent(t),s=this.analyzeSentiment(t);return s.sentiment==="urgent"||s.urgencyLevel>=7?{provider:"groq",model:"llama3-8b-8192",reason:"استعلام عاجل - نختار أسرع نموذج",estimatedLatency:"fast",cost:"free"}:["greeting","thanks","go_to_dashboard","go_to_map","go_to_settings","feedback"].includes(o.intent)||o.confidence>.9?{provider:"groq",model:"llama3-8b-8192",reason:"استعلام بسيط - نموذج سريع كافٍ",estimatedLatency:"fast",cost:"free"}:["trend_analysis","comparison","forecasting","anomaly_detection","correlation_analysis","root_cause","performance_analysis"].includes(o.intent)?{provider:"openrouter",model:"gpt-4o",reason:"تحليل معقد - نحتاج نموذج قوي",estimatedLatency:"slow",cost:"high"}:["query_vaccination","query_coverage","query_cold_chain","query_adverse_events","how_to","guide"].includes(o.intent)?{provider:"zai",model:"default",reason:"استعلام معرفي - نموذج مع قاعدة معرفة",estimatedLatency:"medium",cost:"medium"}:{provider:"groq",model:"llama3-70b-8192",reason:"استعلام متوسط - توازن بين السرعة والجودة",estimatedLatency:"medium",cost:"low"}}suggestFormValues(t,o){const s={};if(!(t!=null&&t.fields)||!o.length)return s;for(const i of t.fields){const a=i.name||i.key;if(!a)continue;const r=o.map(d=>d[a]).filter(d=>d!=null&&d!=="");if(r.length!==0){if(i.type==="select"||i.type==="radio"){const d={};for(const l of r){const p=String(l);d[p]=(d[p]||0)+1}const c=Object.entries(d).sort((l,p)=>p[1]-l[1]);c.length>0&&(s[a]=c[0][0])}if(i.type==="number"){const d=r.map(Number).filter(c=>!isNaN(c));if(d.length>0){const c=d.reduce((l,p)=>l+p,0)/d.length;s[a]=Math.round(c*100)/100}}i.type==="date"&&(s[a]=new Date().toISOString().split("T")[0]),(i.type==="text"||i.type==="textarea")&&(s[a]=r[r.length-1])}}return s}extractEntities(t,o){const s={},i=Ns(t);i&&(s.child_age_months=String(i.months),s.child_age_weeks=String(i.weeks),s.child_age_display=i.display),s.child_age_months||(t.includes("اليوم")?s.time_period="today":t.includes("اسبوع")||t.includes("هذا الاسبوع")?s.time_period="this_week":t.includes("شهر")||t.includes("هذا الشهر")?s.time_period="this_month":t.includes("امس")&&(s.time_period="yesterday")),t.includes("حرج")?s.severity="critical":t.includes("عالي")?s.severity="high":t.includes("متوسط")?s.severity="medium":t.includes("منخفض")&&(s.severity="low"),t.includes("مرسل")||t.includes("مقدم")?s.status="submitted":(t.includes("مسوده")||t.includes("مسود"))&&(s.status="draft");const a=t.match(/\d+/);return a&&(s.number=a[0]),s}searchKnowledgeBase(t){const o=F(t);let s=null,i=0;for(const a of Cs){let r=0;for(const d of a.keywords)o.includes(F(d))&&(r+=1);r*=a.priority/10,r>i&&(i=r,s=a)}return i>.5?s:null}generateResponse(t,o,s){const i=ut.find(r=>r.id===t.intent);let a="";switch(o.sentiment==="urgent"?a="🚨 ":o.sentiment==="negative"&&(a="⚠️ "),t.intent){case"greeting":return"أهلاً! 👋 أنا مساعدك الذكي EPI-Bot. كيف أساعدك اليوم؟";case"thanks":return"العفو! 😊 سعيد بمساعدتك. هل تحتاج شيئاً آخر؟";case"query_submissions":return`${a}إحصائيات الإرساليات:

يمكنك الاطلاع على تفاصيل الإرساليات من صفحة الإرساليات. هل تريد تقريراً مفصلاً أو مقارنة بفترة سابقة؟`;case"query_shortages":return`${a}تقرير النواقص:

يمكنك الاطلاع على النواقص المسجلة مع تصنيفها حسب الخطورة. هل تريد التركيز على النواقص الحرجة فقط؟`;case"query_governorates":return`${a}بيانات المحافظات:

يمكنك عرض ترتيب المحافظات حسب عدد الإرساليات أو نسب التغطية. أي مقارنة تهمك؟`;case"query_users":return`${a}إحصائيات المستخدمين:

يمكنك عرض توزيع المستخدمين حسب الأدوار والنشاط. هل تريد معرفة المستخدمين غير النشطين؟`;case"query_coverage":return`${a}نسب التغطية:

الهدف الوطني 95%. يمكنني عرض نسب التغطية حسب المحافظة أو اللقاح. أي تفاصيل تهمك؟`;case"query_vaccination":return`${a}بيانات التطعيم:

يشمل برنامج التطعيم BCG, HepB, OPV/IPV, الخماسي, الحصبة, MR, DTaP. أي لقاح تريد تفاصيله؟`;case"query_child_vaccines":{const r=t.entities.child_age_months;if(r){const d=parseInt(r),c=t.entities.child_age_display||r+" شهر",l=ct(d);let p=`👶 **تطعيمات طفلك (${c}):**

`;return p+=l.schedule+`

`,l.due.length>0&&(p+=`✅ **اللقاحات المطلوبة الآن:**
`,l.due.forEach(g=>p+=`• ${g}
`),p+=`
`),l.overdue.length>0&&(p+=`⚠️ **لقاحات متأخرة:**
`,l.overdue.forEach(g=>p+=`• ${g}
`),p+=`
`),l.upcoming.length>0&&l.upcoming.length<=5&&(p+=`📅 **اللقاحات القادمة:**
`,l.upcoming.slice(0,3).forEach(g=>p+=`• ${g}
`)),p+=`
💡 تذكّر: الفاصل الأدنى بين الجرعات 4 أسابيع (28 يوم). تابع مع أقرب مركز صحي.`,p}return`👶 لكي أخبرك بتطعيمات طفلك بالضبط، كم عمره؟

مثال: "شهر"، "3 شهور"، "9 شهور"، "سنة"، "سنة ونص"`}case"child_age_response":{const r=t.entities.child_age_months;if(r){const d=parseInt(r),c=t.entities.child_age_display||r+" شهر",l=ct(d);let p=`👶 **تطعيمات طفلك (${c}):**

`;return p+=l.schedule+`

`,l.due.length>0&&(p+=`✅ **اللقاحات المطلوبة:**
`,l.due.forEach(g=>p+=`• ${g}
`)),l.overdue.length>0&&(p+=`
⚠️ **متأخرة:**
`,l.overdue.forEach(g=>p+=`• ${g}
`)),p+=`
💡 تابع مع أقرب مركز صحي لاستكمال التطعيمات.`,p}return'🤔 ما فهمت العمر بالضبط. ممكن تقولي كم عمر طفلك؟ (مثال: "شهر"، "3 شهور"، "سنة")'}case"low_coverage":return`${a}تنبيه: التغطية أقل من المستهدف! يجب تحديد الأسباب ووضع خطة تحسين. هل تريد تحليل المناطق المتأثرة؟`;case"how_to":case"guide":return`📖 دليل الاستخدام:

• الإرساليات: عرض وتتبع البيانات المُرسلة
• التقارير: إنشاء تقارير وتحليلات
• الإشعارات: إرسال تنبيهات للفريق

ما الذي تريد تعلمه بالتفصيل؟`;case"troubleshooting":return`🔧 حل المشاكل:

1) مشكلة في الاتصال: تحقق من الشبكة وأعد المحاولة
2) بيانات لا تظهر: انتظر قليلاً ثم أعد تحميل الصفحة
3) خطأ في الإرسال: تأكد من ملء جميع الحقول المطلوبة

ما المشكلة التي تواجهها؟`;case"create_report":return`${a}إنشاء تقرير:

يمكنني إنشاء تقارير متنوعة:
• تقرير يومي شامل
• تقرير أسبوعي بالاتجاهات
• مقارنة المحافظات
• تحليل التغطية

أي تقرير تريد؟`;case"trend_analysis":return`${a}تحليل الاتجاهات:

يمكنني تحليل اتجاهات الإرساليات والتغطية عبر الزمن. أي فترة زمنية تريد تحليلها؟`;case"comparison":return`${a}مقارنة:

يمكنني المقارنة بين:
• المحافظات
• الفترات الزمنية
• أنواع اللقاحات
• الحملات

ماذا تريد مقارنته؟`;case"forecasting":return`${a}التنبؤ:

بناءً على البيانات المتاحة، يمكنني تقدير الاتجاهات المستقبلية للتغطية والإرساليات. أي مؤشر تريد التنبؤ به؟`;default:return i?`${a}${i.responseTemplate}. كيف أساعدك بشكل أكبر؟`:"لم أفهم سؤالك بالضبط. هل يمكنك إعادة صياغته؟ يمكنني مساعدتك في الإرساليات، النواقص، التقارير، والتحليلات."}}buildActions(t,o){const s=[];switch(t){case"query_submissions":s.push({id:"nav-subs",label:"عرض الإرساليات",type:"navigate",payload:"/submissions",color:"bg-blue-50 text-blue-700 border-blue-200"});break;case"query_governorates":s.push({id:"nav-govs",label:"خريطة المحافظات",type:"navigate",payload:"/governorates",color:"bg-emerald-50 text-emerald-700 border-emerald-200"});break;case"query_users":s.push({id:"nav-users",label:"إدارة المستخدمين",type:"navigate",payload:"/users",color:"bg-purple-50 text-purple-700 border-purple-200"});break;case"create_report":s.push({id:"gen-daily",label:"تقرير يومي",type:"query",payload:"أنشئ تقريراً يومياً شاملاً",color:"bg-indigo-50 text-indigo-700 border-indigo-200"},{id:"gen-weekly",label:"تقرير أسبوعي",type:"query",payload:"حلل اتجاه الأسبوع",color:"bg-rose-50 text-rose-700 border-rose-200"});break;case"go_to_dashboard":s.push({id:"nav-dash",label:"لوحة التحكم",type:"navigate",payload:"/dashboard",color:"bg-blue-50 text-blue-700 border-blue-200"});break}return s}fallbackIntent(t){return t.includes("ارقام")||t.includes("عدد")?"query_analytics":t.includes("اين")||t.includes("فين")?"query_governorates":t.includes("كم")?"query_submissions":t.includes("متى")?"query_schedule":t.includes("لماذا")||t.includes("ليش")?"root_cause":"unknown"}getDefaultContext(){return{userId:"anonymous",sessionId:this.defaultSessionId,history:[],metadata:{},createdAt:Date.now(),updatedAt:Date.now()}}}const As=new Bs,Be=[{id:"subs",label:"حالة الإرساليات",icon:"📊",command:"ما حالة الإرساليات اليوم؟",category:"query",color:"bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"},{id:"short",label:"النواقص الحرجة",icon:"⚠️",command:"أين النواقص الحرجة؟",category:"query",color:"bg-red-50 text-red-700 border-red-200 hover:bg-red-100"},{id:"govs",label:"ترتيب المحافظات",icon:"🗺️",command:"أي المحافظات الأكثر إرسالاً؟",category:"query",color:"bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"},{id:"users",label:"فريق العمل",icon:"👥",command:"كم مستخدم نشط لدينا؟",category:"query",color:"bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"},{id:"coverage",label:"تغطية التطعيم",icon:"💉",command:"ما تغطية التطعيم حالياً؟",category:"query",color:"bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"},{id:"quality",label:"جودة الإدخال",icon:"✅",command:"حلل جودة الإدخال ونسبة الرفض",category:"query",color:"bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"},{id:"daily",label:"تقرير يومي",icon:"📅",command:"أنشئ تقريراً يومياً شاملاً",category:"report",color:"bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"},{id:"weekly",label:"تقرير أسبوعي",icon:"📈",command:"حلل اتجاه الأسبوع الحالي",category:"report",color:"bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"},{id:"gov-report",label:"تقرير المحافظات",icon:"📋",command:"أنشئ تقرير مقارنة المحافظات",category:"report",color:"bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"}];function qs({data:e}){if(e.type==="bar"||e.type==="progress"){const t=Math.max(...e.items.map(o=>o.value),1);return n.jsxs("div",{className:"mt-3 p-3 rounded-xl bg-background/80 border space-y-2",children:[n.jsx("p",{className:"text-xs font-medium text-muted-foreground mb-2",children:e.title}),e.items.map((o,s)=>n.jsxs("div",{className:"space-y-1",children:[n.jsxs("div",{className:"flex justify-between text-xs",children:[n.jsx("span",{className:"truncate",children:o.label}),n.jsx("span",{className:"font-mono font-bold",children:Uo(o.value)})]}),n.jsx("div",{className:"h-2 bg-muted rounded-full overflow-hidden",children:n.jsx("div",{className:k("h-full rounded-full transition-all duration-500",o.color||"bg-primary"),style:{width:`${o.value/t*100}%`}})})]},s))]})}if(e.type==="pie"){const t=e.items.reduce((o,s)=>o+s.value,0)||1;return n.jsxs("div",{className:"mt-3 p-3 rounded-xl bg-background/80 border",children:[n.jsx("p",{className:"text-xs font-medium text-muted-foreground mb-2",children:e.title}),n.jsx("div",{className:"flex flex-wrap gap-2",children:e.items.map((o,s)=>n.jsxs("div",{className:"flex items-center gap-1.5 text-xs",children:[n.jsx("div",{className:k("w-2.5 h-2.5 rounded-full",o.color||"bg-primary")}),n.jsx("span",{children:o.label}),n.jsxs("span",{className:"font-mono font-bold",children:[(o.value/t*100).toFixed(0),"%"]})]},s))})]})}return null}function Vs({actions:e,onAction:t}){const o={navigate:to,query:Dn,command:so};return n.jsx("div",{className:"mt-2 flex flex-wrap gap-1.5",children:e.map(s=>{const i=o[s.type]||En;return n.jsxs("button",{onClick:()=>t(s),className:k("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all hover:shadow-sm active:scale-95",s.color||"bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"),children:[n.jsx(i,{className:"w-3 h-3"}),s.label]},s.id)})})}function Rs(){const{data:e}=Wt();return u.useCallback(()=>{const t=[];return e&&(e.approval_rate<70&&e.total_submissions>20&&t.push({text:`⚠️ معدل الاعتماد ${e.approval_rate.toFixed(1)}% — أقل من 70%`,severity:"warning"}),e.submissions_today===0&&e.active_users>0&&t.push({text:`📭 لا توجد إرساليات اليوم مع ${e.active_users} مستخدم نشط`,severity:"warning"})),t},[e])}function Os(e,t){switch(e){case"query_submissions":return["حلل أسباب الرفض","قارن بالأسبوع الماضي","أي المحافظات لها أعلى رفض؟"];case"query_governorates":return["حلل السبب في الأضعف","قارن بآخر شهر","اعرض تفاصيل كل محافظة"];case"query_users":return["المستخدمين غير النشطين","توزيع الصلاحيات","آخر تسجيل دخول"];default:return["📊 حالة الإرساليات","⚠️ النواقص الحرجة","📈 تقرير يومي"]}}function Ds(){var se;const[e,t]=u.useState(!1),[o,s]=u.useState(!1),[i,a]=u.useState([]),[r,d]=u.useState(""),[c,l]=u.useState(!1),[p,g]=u.useState(null),[b,_]=u.useState(!1),y=u.useRef(null),h=u.useRef(null),I=un(),E=Rs();u.useEffect(()=>{y.current&&(y.current.scrollTop=y.current.scrollHeight)},[i]),u.useEffect(()=>{var m;e&&((m=h.current)==null||m.focus())},[e]),u.useEffect(()=>{if(e&&i.length===0){const m=E(),P={id:"greeting",role:"assistant",content:m.length>0?`أهلاً! 👋 لاحظت ${m.length} نقاط تحتاج اهتمامك:`:"أهلاً! 👋 أنا مساعدك الذكي. كيف أساعدك اليوم؟",timestamp:new Date,actions:[{id:"nav-insights",label:"الرؤى الذكية",icon:"brain",type:"navigate",payload:"/insights",color:"bg-purple-50 text-purple-700 border-purple-200"},{id:"nav-dashboard",label:"لوحة التحكم",icon:"dashboard",type:"navigate",payload:"/dashboard",color:"bg-blue-50 text-blue-700 border-blue-200"}]};a([P])}},[e]);const M=async(m,P)=>{var K;if(!m.trim()&&!P)return;const w={id:Date.now().toString(),role:"user",content:P&&((K=Be.find($=>$.id===P))==null?void 0:K.label)||m,timestamp:new Date};a($=>[...$,w]),d(""),l(!0);const B={id:(Date.now()+1).toString(),role:"assistant",content:"",timestamp:new Date,isStreaming:!0};a($=>[...$,B]);try{if(!P){const z={userId:"current",sessionId:"main",history:[],metadata:{},createdAt:Date.now(),updatedAt:Date.now()},C=As.processMessage(m,z);if(C.source==="local"){let Z="";const Qe=C.text.split("");for(let J=0;J<Qe.length;J++)Z+=Qe[J],a(G=>G.map(pe=>pe.id===B.id?{...pe,content:Z}:pe)),J%3===0&&await new Promise(G=>setTimeout(G,6));const tn=W(C.intent,void 0);if(a(J=>J.map(G=>G.id===B.id?{...G,isStreaming:!1,source:"epi-bot-local",intent:C.intent,actions:tn}:G)),C.suggestions.length>0){const J={id:(Date.now()+2).toString(),role:"assistant",content:"",timestamp:new Date,isStreaming:!1,source:"suggestions",actions:C.suggestions.slice(0,4).map((G,pe)=>({id:`suggest-${pe}`,label:G,icon:"sparkle",type:"query",payload:G,color:"bg-muted text-muted-foreground border-border hover:bg-accent"}))};a(G=>[...G,J])}l(!1);return}}const{data:{session:$}}=await f.auth.getSession();if(!$)throw new Error("Not authenticated");const Q=i.filter(z=>z.id!=="greeting").slice(-10).map(z=>({role:z.role,content:z.content})),{data:N,error:ae}=await f.functions.invoke("ai-chat-v3",{body:{message:m||"",template:P||void 0,history:Q,stream:!1,mode:void 0}});if(ae)throw ae;const ee=(N==null?void 0:N.reply)||(N==null?void 0:N.text)||"عذراً، لم أتمكن من المعالجة.",_e=(N==null?void 0:N.source)||"ai",L=N==null?void 0:N.intent,we=N==null?void 0:N.data;let Ke="";const Ue=ee.split("");for(let z=0;z<Ue.length;z++)Ke+=Ue[z],a(C=>C.map(Z=>Z.id===B.id?{...Z,content:Ke}:Z)),z%4===0&&await new Promise(C=>setTimeout(C,8));const Yt=W(L,we),en=H(L,we),We=Os(L,we);if(a(z=>z.map(C=>C.id===B.id?{...C,isStreaming:!1,source:_e,intent:L,data:we,actions:Yt,chart:en}:C)),We.length>0){const z={id:(Date.now()+2).toString(),role:"assistant",content:"",timestamp:new Date,actions:We.map((C,Z)=>({id:`suggest-${Z}`,label:C,icon:"sparkle",type:"query",payload:C,color:"bg-muted text-muted-foreground border-border hover:bg-accent"}))};a(C=>[...C,z])}}catch{a(Q=>Q.map(N=>N.id===B.id?{...N,content:"⚠️ حدث خطأ في الاتصال. تأكد من إعدادات AI.",isStreaming:!1}:N))}finally{l(!1)}};function W(m,P){if(!m)return[];const w=[];switch(m){case"query_submissions":w.push({id:"nav-subs",label:"عرض الإرساليات",icon:"navigate",type:"navigate",payload:"/submissions",color:"bg-blue-50 text-blue-700 border-blue-200"});break;case"query_governorates":w.push({id:"nav-govs",label:"خريطة المحافظات",icon:"navigate",type:"navigate",payload:"/governorates",color:"bg-emerald-50 text-emerald-700 border-emerald-200"});break;case"query_users":w.push({id:"nav-users",label:"إدارة المستخدمين",icon:"navigate",type:"navigate",payload:"/users",color:"bg-purple-50 text-purple-700 border-purple-200"});break;case"query_health":case"query_coverage":w.push({id:"nav-insights",label:"الرؤى الذكية",icon:"navigate",type:"navigate",payload:"/insights",color:"bg-cyan-50 text-cyan-700 border-cyan-200"});break}return w}function H(m,P){if(P){if(m==="query_submissions"&&P.byStatus)return{type:"pie",title:"توزيع الإرساليات حسب الحالة",items:[{label:"معتمدة",value:P.byStatus.approved||0,color:"bg-emerald-500"},{label:"مرفوضة",value:P.byStatus.rejected||0,color:"bg-red-500"},{label:"مسودات",value:P.byStatus.draft||0,color:"bg-gray-400"}].filter(w=>w.value>0)};if(m==="query_governorates"&&Array.isArray(P))return{type:"bar",title:"أعلى المحافظات إرسالاً",items:P.slice(0,6).map(w=>({label:w.name,value:w.submissions||0,color:w.submissions>20?"bg-emerald-500":w.submissions>10?"bg-blue-500":"bg-amber-500"}))};if(m==="query_users"&&P.byRole){const w={admin:"مدير",central:"مركزي",governorate:"محافظة",district:"مديرية",data_entry:"إدخال"};return{type:"pie",title:"توزيع المستخدمين حسب الدور",items:Object.entries(P.byRole).map(([B,K],$)=>({label:w[B]||B,value:K,color:["bg-purple-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-gray-500"][$]}))}}}}const oe=m=>{m.type==="navigate"?(I(m.payload),b||t(!1)):m.type==="query"&&M(m.payload)},ue=(m,P)=>{a(w=>w.map(B=>B.id===m?{...B,feedback:B.feedback===P?null:P}:B)),f.from("ai_feedback").insert({message_id:m,feedback:P,created_at:new Date().toISOString()}).then(()=>{})},fe=(m,P)=>{navigator.clipboard.writeText(P),g(m),setTimeout(()=>g(null),2e3)},xe=()=>{a([]),setTimeout(()=>{const m=E(),P={id:"greeting",role:"assistant",content:m.length>0?`أهلاً! 👋 ${m.length} نقاط تحتاج اهتمامك:`:"أهلاً! 👋 كيف أساعدك اليوم؟",timestamp:new Date,actions:[{id:"nav-insights",label:"الرؤى الذكية",icon:"brain",type:"navigate",payload:"/insights"},{id:"nav-dashboard",label:"لوحة التحكم",icon:"dashboard",type:"navigate",payload:"/dashboard"}]};a([P])},100)};return e?n.jsx("div",{className:k("fixed bottom-6 left-6 z-50 transition-all duration-300",o?"w-[640px] h-[85vh]":"w-[440px] h-[600px]"),children:n.jsxs($e,{className:"h-full flex flex-col shadow-2xl border-primary/20 overflow-hidden",children:[n.jsxs(Ge,{className:"flex flex-row items-center justify-between py-3 px-4 bg-gradient-to-l from-primary/5 via-purple-50/50 to-transparent border-b",children:[n.jsxs("div",{className:"flex items-center gap-3",children:[n.jsxs("div",{className:"relative",children:[n.jsx("div",{className:"w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-md",children:n.jsx(Pe,{className:"w-5 h-5 text-white"})}),n.jsx("span",{className:"absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"})]}),n.jsxs("div",{children:[n.jsx(He,{className:"text-sm font-heading",children:"EPI Copilot"}),n.jsxs("p",{className:"text-[11px] text-muted-foreground flex items-center gap-1",children:[n.jsx(go,{className:"w-3 h-3 text-amber-500"}),"مدعوم بالذكاء الاصطناعي"]})]})]}),n.jsxs("div",{className:"flex items-center gap-0.5",children:[n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:xe,title:"محادثة جديدة",children:n.jsx(Oe,{className:"w-3.5 h-3.5"})}),n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:()=>_(!b),title:b?"إلغاء التثبيت":"تثبيت",children:n.jsx(oo,{className:k("w-3.5 h-3.5",b&&"text-primary fill-primary")})}),n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:()=>s(!o),children:o?n.jsx(Yn,{className:"w-3.5 h-3.5"}):n.jsx(Zn,{className:"w-3.5 h-3.5"})}),n.jsx(O,{variant:"ghost",size:"icon-sm",onClick:()=>t(!1),children:n.jsx(De,{className:"w-3.5 h-3.5"})})]})]}),n.jsx(Fe,{className:"flex-1 px-3 py-2",ref:y,children:n.jsxs("div",{className:"space-y-3",children:[i.map(m=>n.jsx("div",{children:m.role==="user"?n.jsxs("div",{className:"flex gap-2.5 justify-end",children:[n.jsx("div",{className:"max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed bg-primary text-primary-foreground",children:m.content}),n.jsx(de,{className:"w-7 h-7 shrink-0",children:n.jsx(le,{className:"bg-primary/10 text-primary text-[10px]",children:n.jsx(po,{className:"w-3.5 h-3.5"})})})]}):n.jsxs("div",{className:"flex gap-2.5",children:[n.jsx(de,{className:"w-7 h-7 shrink-0 mt-0.5",children:n.jsx(le,{className:"bg-gradient-to-br from-purple-100 to-primary/10 text-purple-700 text-[10px]",children:n.jsx(Ye,{className:"w-3.5 h-3.5"})})}),n.jsxs("div",{className:"max-w-[85%]",children:[(m.content||m.isStreaming)&&n.jsxs("div",{className:"rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed bg-muted/80",children:[m.content?n.jsx("div",{className:"whitespace-pre-wrap",children:m.content}):m.isStreaming?n.jsxs("div",{className:"flex items-center gap-1.5 py-1",children:[n.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"0ms"}}),n.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"150ms"}}),n.jsx("span",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"300ms"}})]}):null,m.chart&&n.jsx(qs,{data:m.chart}),m.content&&!m.isStreaming&&m.id!=="greeting"&&n.jsxs("div",{className:"mt-2 flex items-center gap-1",children:[n.jsxs("button",{onClick:()=>fe(m.id,m.content),className:"flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors",children:[p===m.id?n.jsx(Bn,{className:"w-3 h-3"}):n.jsx(On,{className:"w-3 h-3"}),p===m.id?"تم":"نسخ"]}),n.jsx("span",{className:"text-muted-foreground/30 mx-1",children:"|"}),n.jsx("button",{onClick:()=>ue(m.id,"up"),className:k("p-0.5 rounded transition-colors",m.feedback==="up"?"text-emerald-600":"text-muted-foreground hover:text-emerald-600"),children:n.jsx(uo,{className:"w-3 h-3"})}),n.jsx("button",{onClick:()=>ue(m.id,"down"),className:k("p-0.5 rounded transition-colors",m.feedback==="down"?"text-red-600":"text-muted-foreground hover:text-red-600"),children:n.jsx(co,{className:"w-3 h-3"})}),m.source&&n.jsx(Le,{variant:"outline",className:"text-[9px] px-1.5 py-0 h-4 ml-auto",children:m.source==="epi-bot-local"?"🧠 EPI-Bot":m.source==="function_call"?"🗃️ DB":m.source==="groq"?"⚡ AI":m.source==="mimo"?"🤖 MiMo":m.source})]})]}),m.actions&&m.actions.length>0&&n.jsx(Vs,{actions:m.actions,onAction:oe})]})]})},m.id)),c&&((se=i[i.length-1])==null?void 0:se.content)===""&&n.jsxs("div",{className:"flex gap-2.5",children:[n.jsx(de,{className:"w-7 h-7",children:n.jsx(le,{className:"bg-gradient-to-br from-purple-100 to-primary/10 text-purple-700 text-[10px]",children:n.jsx(Ye,{className:"w-3.5 h-3.5"})})}),n.jsx("div",{className:"bg-muted/80 rounded-2xl rounded-bl-md px-4 py-3",children:n.jsxs("div",{className:"flex items-center gap-1.5",children:[n.jsx("div",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"0ms"}}),n.jsx("div",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"150ms"}}),n.jsx("div",{className:"w-1.5 h-1.5 rounded-full bg-primary animate-bounce",style:{animationDelay:"300ms"}})]})})]})]})}),i.length<=1&&n.jsxs("div",{className:"px-3 pb-1",children:[n.jsx("div",{className:"flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide",children:Be.filter(m=>m.category==="query").map(m=>n.jsxs("button",{onClick:()=>M(m.command),className:k("flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all hover:shadow-sm active:scale-95 shrink-0",m.color),children:[n.jsx("span",{children:m.icon}),m.label]},m.id))}),n.jsx("div",{className:"flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide mt-1",children:Be.filter(m=>m.category==="report").map(m=>n.jsxs("button",{onClick:()=>M("",m.id),className:k("flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all hover:shadow-sm active:scale-95 shrink-0",m.color),children:[n.jsx("span",{children:m.icon}),m.label]},m.id))})]}),n.jsx("div",{className:"p-3 border-t bg-background",children:n.jsxs("form",{onSubmit:m=>{m.preventDefault(),M(r)},className:"flex gap-2",children:[n.jsx(je,{ref:h,value:r,onChange:m=>d(m.target.value),placeholder:"اسأل Copilot... (مثال: كم إرسالية اليوم؟)",disabled:c,className:"flex-1 h-10 rounded-xl bg-muted/50 border-0 text-sm",dir:"rtl"}),n.jsx(O,{type:"submit",size:"icon",disabled:c||!r.trim(),className:"h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 hover:shadow-lg",children:c?n.jsx(Un,{className:"w-4 h-4 animate-spin"}):n.jsx(ao,{className:"w-4 h-4"})})]})})]})}):n.jsx("div",{className:"fixed bottom-6 left-6 z-50",children:n.jsxs("button",{onClick:()=>t(!0),className:"group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:scale-105 active:scale-95",children:[n.jsx(Pe,{className:"w-6 h-6 mx-auto group-hover:animate-pulse"}),n.jsx("span",{className:"absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"})]})})}function zs(){var c;const[e,t]=u.useState(!1),{data:o,isLoading:s,isError:i,error:a,refetch:r}=Ut();if(!T)return n.jsx(ye,{to:"/login",replace:!0});if(s)return n.jsx("div",{className:"flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50",children:n.jsxs("div",{className:"flex flex-col items-center gap-5",children:[n.jsxs("div",{className:"relative",children:[n.jsx("div",{className:"w-20 h-20 rounded-2xl bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center animate-pulse border border-blue-100/50",children:n.jsx("img",{src:"/EPI-Supervisor/logo-epi-256.png".replace(/\/+/g,"/"),alt:"EPI",className:"w-14 h-14 object-contain",onError:l=>{l.currentTarget.style.display="none",l.currentTarget.parentElement.innerHTML='<div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 animate-pulse"></div>'}})}),n.jsx("div",{className:"absolute inset-0 rounded-2xl bg-blue-400/20 blur-xl -z-10 scale-110"})]}),n.jsxs("div",{className:"text-center space-y-2",children:[n.jsx(rt,{className:"w-40 h-5 mx-auto"}),n.jsx(rt,{className:"w-24 h-3 mx-auto"})]}),n.jsxs("div",{className:"flex items-center gap-1.5",children:[n.jsx("div",{className:"w-2 h-2 rounded-full bg-blue-500 animate-bounce",style:{animationDelay:"0ms"}}),n.jsx("div",{className:"w-2 h-2 rounded-full bg-blue-400 animate-bounce",style:{animationDelay:"150ms"}}),n.jsx("div",{className:"w-2 h-2 rounded-full bg-blue-300 animate-bounce",style:{animationDelay:"300ms"}})]})]})});if(i)return n.jsx("div",{className:"flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50",children:n.jsxs("div",{className:"flex flex-col items-center gap-4 max-w-md text-center p-8",children:[n.jsx("div",{className:"w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center",children:n.jsx(St,{className:"w-8 h-8 text-red-500"})}),n.jsx("h2",{className:"text-xl font-heading font-bold text-gray-800",children:"خطأ في الاتصال"}),n.jsx("p",{className:"text-sm text-muted-foreground",children:"تعذر الاتصال بخادم Supabase. تأكد من اتصالك بالإنترنت أو حاول مرة أخرى."}),n.jsx("p",{className:"text-xs text-red-500 font-mono",dir:"ltr",children:(a==null?void 0:a.message)||"Connection failed"}),n.jsxs("div",{className:"flex gap-3",children:[n.jsxs(O,{onClick:()=>r(),className:"gap-2",children:[n.jsx(Oe,{className:"w-4 h-4"})," إعادة المحاولة"]}),n.jsx(O,{variant:"outline",onClick:()=>window.location.reload(),children:"تحديث الصفحة"})]})]})});if(!(o!=null&&o.session))return n.jsx(ye,{to:"/login",replace:!0});const d=o.profile||{id:o.session.user.id,email:o.session.user.email||"",full_name:((c=o.session.user.email)==null?void 0:c.split("@")[0])||"مستخدم",role:"admin",is_active:!0,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};return n.jsxs("div",{className:"flex h-screen overflow-hidden bg-background",children:[n.jsx("div",{className:"hidden lg:block relative z-30",children:n.jsx(ks,{user:d,collapsed:e,onToggle:()=>t(!e)})}),n.jsxs("div",{className:"flex-1 flex flex-col overflow-hidden",children:[n.jsxs("div",{className:"lg:hidden flex items-center gap-3 px-4 py-3 border-b bg-background/80 backdrop-blur-md sticky top-0 z-40",children:[n.jsx(vs,{user:d}),n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx("div",{className:"w-8 h-8 rounded-lg bg-white shadow-sm overflow-hidden border border-blue-100/50 flex items-center justify-center",children:n.jsx("img",{src:"/EPI-Supervisor/logo-epi-64.png".replace(/\/+/g,"/"),alt:"EPI",className:"w-6 h-6 object-contain",onError:l=>{l.currentTarget.style.display="none"}})}),n.jsxs("h1",{className:"font-heading font-bold text-lg",children:[n.jsx("span",{className:"text-blue-600",children:"EPI"})," Supervisor's"]})]})]}),n.jsx("main",{className:"flex-1 overflow-auto scroll-smooth",children:n.jsx(pn,{})})]}),n.jsx(Ds,{})]})}const Fs=Te("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"),Re=u.forwardRef(({className:e,...t},o)=>n.jsx(jt,{ref:o,className:k(Fs(),e),...t}));Re.displayName=jt.displayName;function Ls(){const[e,t]=u.useState(""),[o,s]=u.useState(""),[i,a]=u.useState(!1),r=xs(),{data:d}=Ut();if(d!=null&&d.session)return n.jsx(ye,{to:"/dashboard",replace:!0});const c=async l=>{l.preventDefault(),r.mutate({email:e,password:o})};return n.jsxs("div",{className:"min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 relative overflow-hidden",children:[n.jsxs("div",{className:"absolute inset-0 overflow-hidden",children:[n.jsx("div",{className:"absolute inset-0 opacity-[0.03]",style:{backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231d4ed8' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}),n.jsx("div",{className:"absolute top-[10%] right-[15%] w-[400px] h-[400px] rounded-full bg-blue-200/30 blur-3xl animate-pulse-slow"}),n.jsx("div",{className:"absolute bottom-[15%] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-200/20 blur-3xl animate-pulse-slow",style:{animationDelay:"2s"}}),n.jsx("div",{className:"absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-purple-200/15 blur-3xl animate-pulse-slow",style:{animationDelay:"4s"}})]}),n.jsxs("div",{className:"relative w-full max-w-md",children:[n.jsxs("div",{className:"text-center mb-8 animate-fade-in",children:[n.jsxs("div",{className:"relative inline-block mb-6",children:[n.jsx("div",{className:"w-32 h-32 rounded-3xl bg-white shadow-2xl shadow-blue-500/10 flex items-center justify-center overflow-hidden border border-blue-100/50 mx-auto relative",children:n.jsx("img",{src:"/EPI-Supervisor/logo-epi-256.png".replace(/\/+/g,"/"),alt:"شعار برنامج التطعيم الموسع",className:"w-24 h-24 object-contain relative z-10",onError:l=>{l.currentTarget.style.display="none",l.currentTarget.parentElement.innerHTML=`
                    <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                      <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  `}})}),n.jsx("div",{className:"absolute inset-0 rounded-3xl bg-blue-400/20 blur-2xl -z-10 scale-125"})]}),n.jsxs("h1",{className:"text-4xl font-heading font-bold text-gray-900 mb-2",children:[n.jsx("span",{className:"bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",children:"EPI"})," ","Supervisor's"]}),n.jsx("p",{className:"text-gray-500 text-sm font-medium",children:"المشرف — منصة الإشراف الميداني لحملات التطعيم"}),n.jsxs("div",{className:"inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60",children:[n.jsx(ro,{className:"w-3.5 h-3.5 text-emerald-600"}),n.jsx("span",{className:"text-xs font-medium text-emerald-700",children:"اتصال آمن ومشفّر"})]}),n.jsx("div",{className:"flex items-center justify-center gap-6 mt-5 opacity-50",children:n.jsx("img",{src:"./header-partners.png",alt:"وزارة الصحة العامة والسكان — اليونيسف",className:"h-12 object-contain",onError:l=>{l.currentTarget.style.display="none"}})})]}),n.jsxs($e,{className:"shadow-2xl shadow-blue-500/5 border-0 bg-white/90 backdrop-blur-xl animate-fade-in overflow-hidden",style:{animationDelay:"0.1s"},children:[n.jsx("div",{className:"h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"}),n.jsxs(Ge,{className:"text-center pb-4 pt-6",children:[n.jsxs(He,{className:"text-xl font-heading text-gray-900 flex items-center justify-center gap-2",children:[n.jsx(Wn,{className:"w-5 h-5 text-blue-500"}),"تسجيل الدخول"]}),n.jsx(Jt,{className:"text-gray-500",children:"أدخل بيانات حساب المسؤول للوصول إلى لوحة التحكم"})]}),n.jsxs(Xt,{className:"px-6 pb-6",children:[!T&&n.jsxs("div",{className:"mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-800 text-sm flex items-start gap-2.5",children:[n.jsx(et,{className:"w-5 h-5 mt-0.5 shrink-0"}),n.jsxs("div",{children:[n.jsx("p",{className:"font-semibold",children:"Supabase غير مُعدّ"}),n.jsx("p",{className:"text-xs mt-1 opacity-80",children:"يرجى تعيين متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY"}),n.jsxs("p",{className:"text-xs mt-2 opacity-60 font-mono",dir:"ltr",children:["URL: ","https://yinoyjmzzrxrpuxbzwwm.supabase.co",n.jsx("br",{}),"Key: ","***set***"]})]})]}),n.jsxs("form",{onSubmit:c,className:"space-y-5",children:[n.jsxs("div",{className:"space-y-2",children:[n.jsx(Re,{htmlFor:"email",className:"text-gray-700 font-medium text-sm",children:"البريد الإلكتروني"}),n.jsx(je,{id:"email",type:"email",placeholder:"admin@example.com",value:e,onChange:l=>t(l.target.value),required:!0,dir:"ltr",className:"text-left h-12 bg-gray-50/80 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-blue-200 transition-all rounded-xl"})]}),n.jsxs("div",{className:"space-y-2",children:[n.jsx(Re,{htmlFor:"password",className:"text-gray-700 font-medium text-sm",children:"كلمة المرور"}),n.jsxs("div",{className:"relative",children:[n.jsx(je,{id:"password",type:i?"text":"password",placeholder:"••••••••",value:o,onChange:l=>s(l.target.value),required:!0,dir:"ltr",className:"text-left pl-10 h-12 bg-gray-50/80 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-blue-200 transition-all rounded-xl"}),n.jsx("button",{type:"button",onClick:()=>a(!i),className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1",children:i?n.jsx(zn,{className:"w-4 h-4"}):n.jsx(Fn,{className:"w-4 h-4"})})]})]}),r.isError&&n.jsxs("div",{className:"p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-sm flex items-center gap-2 animate-fade-in",children:[n.jsx(et,{className:"w-4.5 h-4.5 shrink-0"}),"فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور."]}),n.jsx(O,{type:"submit",className:"w-full h-12 bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all text-base font-medium rounded-xl",disabled:r.isPending||!T,children:r.isPending?n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx("div",{className:"w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"}),"جاري تسجيل الدخول..."]}):n.jsxs("div",{className:"flex items-center gap-2",children:[n.jsx(Pe,{className:"w-4 h-4"}),"تسجيل الدخول"]})})]})]})]}),n.jsxs("div",{className:"text-center mt-8 animate-fade-in",style:{animationDelay:"0.2s"},children:[n.jsx("p",{className:"text-xs text-gray-400 font-medium",children:"منصة EPI Supervisor's v1.0.0"}),n.jsx("p",{className:"text-[10px] text-gray-300 mt-1.5",children:"وزارة الصحة العامة والسكان — برنامج التطعيم الموسع"})]})]})]})}const $s=u.lazy(()=>D(()=>import("./DashboardPage-BBa4XG7o.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17]))),Gs=u.lazy(()=>D(()=>import("./UsersPage-fqMLR3ZD.js"),__vite__mapDeps([18,1,2,19,4,20,21,6,22,23,15,24,25,11]))),Hs=u.lazy(()=>D(()=>import("./index-PEhoLQFk.js"),__vite__mapDeps([26,1,2,20,4,6,27,7,24,22,25,15,28,19,5,21,29,30,31,32,33,3,34,10,11,12,35]))),Ks=u.lazy(()=>D(()=>import("./SubmissionsPage-tsj2dR_C.js"),__vite__mapDeps([36,1,2,19,4,37,21,5,20,6,34,7,24,25,35,11]))),Us=u.lazy(()=>D(()=>import("./AIInsightsPage-BKVgYkYN.js"),__vite__mapDeps([38,1,2,6,14,11,15,12,16,7,4]))),Ws=u.lazy(()=>D(()=>import("./AISettingsPage-DB0At9KN.js"),__vite__mapDeps([39,1,2,27,4,5,6,10,8,12,35,9,40,7,41,16,11]))),Qs=u.lazy(()=>D(()=>import("./AuditPage-AlfcCma6.js"),__vite__mapDeps([42,1,2,19,4,37,21,6,34,35,43,7,10,11]))),Zs=u.lazy(()=>D(()=>import("./GovernoratesPage-DJ9B84Mi.js"),__vite__mapDeps([44,1,2,3,4,19,37,6,7,40,28,45,15,14,16,17,30,10,11]))),Js=u.lazy(()=>D(()=>import("./MapPage-BYtKtb--.js"),__vite__mapDeps([46,1,2,19,4,21,6,45,30,15,7,40,14,28,47,11,48]))),Xs=u.lazy(()=>D(()=>import("./PagesManagementPage-czoQSQu8.js"),__vite__mapDeps([49,1,2,27,4,19,20,21,5,6,33,22,7,12,29,15,50,51,52,16,24,25,41,47,32,53,40,30,11]))),Ys=u.lazy(()=>D(()=>import("./SettingsPage-8Y5piKVT.js"),__vite__mapDeps([54,1,2,27,4,19,3,21,6,29,50,8,23,55,30,34,25,56,7,31,12,45,57,41,11]))),ea=u.lazy(()=>D(()=>import("./ChatPage-Cwpgk9zx.js"),__vite__mapDeps([58,1,2,20,4,6,11]))),ta=u.lazy(()=>D(()=>import("./BotChatPage-CMdhwdD0.js"),__vite__mapDeps([59,1,2,6,4,11]))),na=u.lazy(()=>D(()=>import("./NotificationsPage-DvGRR4Jh.js"),__vite__mapDeps([60,1,2,19,4,20,21,5,6,43,57,15,29,7,28,25,34,24,23,33,55,52,11,16]))),oa=u.lazy(()=>D(()=>import("./ReferencesPage-kfoy3K2f.js"),__vite__mapDeps([61,1,2,27,4,19,20,21,6,7,51,22,24,47,25,34,12,11]))),sa=u.lazy(()=>D(()=>import("./ReportsPage-DdQj5IBV.js"),__vite__mapDeps([62,1,2,3,4,19,5,6,10,15,52,56,7,28,12,16,17,11,53,57,13,34])));function R(){return n.jsx("div",{className:"flex h-full items-center justify-center",children:n.jsxs("div",{className:"flex flex-col items-center gap-3",children:[n.jsx("div",{className:"w-10 h-10 rounded-xl bg-primary/10 animate-pulse flex items-center justify-center",children:n.jsx("div",{className:"w-5 h-5 rounded-md bg-primary/30"})}),n.jsx("p",{className:"text-sm text-muted-foreground animate-pulse",children:"جاري التحميل..."})]})})}function aa(){return n.jsx(ps,{children:n.jsxs(mn,{children:[n.jsx(S,{path:"/login",element:n.jsx(Ls,{})}),n.jsxs(S,{element:n.jsx(zs,{}),children:[n.jsx(S,{path:"dashboard",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx($s,{})})}),n.jsx(S,{path:"users",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Gs,{})})}),n.jsx(S,{path:"forms",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Hs,{})})}),n.jsx(S,{path:"submissions",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Ks,{})})}),n.jsx(S,{path:"insights",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Us,{})})}),n.jsx(S,{path:"ai-settings",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Ws,{})})}),n.jsx(S,{path:"audit",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Qs,{})})}),n.jsx(S,{path:"governorates",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Zs,{})})}),n.jsx(S,{path:"map",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Js,{})})}),n.jsx(S,{path:"pages",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Xs,{})})}),n.jsx(S,{path:"settings",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(Ys,{})})}),n.jsx(S,{path:"chat",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(ea,{})})}),n.jsx(S,{path:"bot",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(ta,{})})}),n.jsx(S,{path:"notifications",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(na,{})})}),n.jsx(S,{path:"references",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(oa,{})})}),n.jsx(S,{path:"reports",element:n.jsx(u.Suspense,{fallback:n.jsx(R,{}),children:n.jsx(sa,{})})})]}),n.jsx(S,{path:"/",element:n.jsx(ye,{to:"/login",replace:!0})}),n.jsx(S,{path:"*",element:n.jsx(ye,{to:"/login",replace:!0})})]})})}const ia=new an({defaultOptions:{queries:{staleTime:300*1e3,refetchOnWindowFocus:!1,retry:2}}}),ra=()=>{const e="/EPI-Supervisor/";return e==="/"?"":e.replace(/\/$/,"")};In.createRoot(document.getElementById("root")).render(n.jsx(gn.StrictMode,{children:n.jsx(ls,{children:n.jsx(rn,{client:ia,children:n.jsx(bn,{basename:ra(),children:n.jsx(as,{defaultTheme:"light",storageKey:"epi-admin-theme",children:n.jsxs(rs,{children:[n.jsx(aa,{}),n.jsx(ss,{})]})})})})})}));export{ja as $,Qa as A,O as B,$e as C,Dn as D,fa as E,Gn as F,Kn as G,Qt as H,je as I,wa as J,os as K,de as L,Xn as M,le as N,Vt as O,Ua as P,xa as Q,Oe as R,io as S,St as T,mo as U,Sa as V,Ca as W,Re as X,_a as Y,go as Z,ka as _,Wt as a,Fn as a0,zn as a1,ao as a2,Wo as a3,Pa as a4,Fe as a5,ne as a6,On as a7,De as a8,Bn as a9,Aa as aA,qa as aB,As as aC,D as aD,Ra as aE,Oa as aF,Da as aG,za as aH,Fa as aI,La as aJ,$a as aK,Ga as aL,Ut as aM,Hn as aN,re as aO,ba as aP,Ka as aa,et as ab,Un as ac,Ta as ad,Na as ae,po as af,qn as ag,ma as ah,f as ai,Ia as aj,Ba as ak,Cn as al,Sn as am,Rn as an,Ma as ao,tt as ap,ps as aq,Nt as ar,Zn as as,to as at,no as au,Wn as av,$n as aw,is as ax,lo as ay,eo as az,ya as b,x as c,ha as d,Ha as e,Va as f,Ea as g,va as h,T as i,Xt as j,Uo as k,Ge as l,He as m,Jt as n,rt as o,ro as p,Mn as q,Pe as r,Vn as s,An as t,Gt as u,Ln as v,k as w,ga as x,Le as y,Wa as z};
//# sourceMappingURL=index-Dvygi9OR.js.map
