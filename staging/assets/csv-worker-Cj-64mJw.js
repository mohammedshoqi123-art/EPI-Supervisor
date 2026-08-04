(function(){"use strict";self.onmessage=function(o){const{rows:a,headers:t}=o.data;try{const c=n=>{if(n==null)return"";const s=String(n);return s.includes(",")||s.includes('"')||s.includes(`
`)?`"${s.replace(/"/g,'""')}"`:s},i=t.map(c).join(","),r=a.map(n=>t.map(s=>c(n[s])).join(",")),u="\uFEFF"+[i,...r].join(`
`);self.postMessage({success:!0,csv:u})}catch(e){self.postMessage({success:!1,error:(e==null?void 0:e.message)||String(e)})}}})();
