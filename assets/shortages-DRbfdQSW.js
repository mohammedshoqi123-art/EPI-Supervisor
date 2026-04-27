import{c as s,q as o,O as i,ac as u}from"./index-CHi5AQrF.js";import{u as n}from"./data-vendor-CInkegrm.js";/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=s("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);function m(r){return n({queryKey:["shortages",r],queryFn:async()=>{let e=i.from("supply_shortages").select("*, governorates(name_ar), districts(name_ar), profiles:reported_by(full_name), form_submissions(form_id, forms(title_ar))").is("deleted_at",null).order("created_at",{ascending:!1});e=await u(e,r);const{data:t,error:a}=await e;if(a)throw a;return t},enabled:o,retry:3,retryDelay:e=>Math.min(1e3*2**e,1e4),staleTime:1e4})}export{c as L,m as u};
//# sourceMappingURL=shortages-DRbfdQSW.js.map
