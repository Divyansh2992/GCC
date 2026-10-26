const RAW = JSON.parse(document.getElementById("dataset").textContent);

// ---------- Reference data (sourced; see each row's url) ----------
const COUNTS = [
 {label:"OceanFrogs (Jul 2025)", v:2168, url:"https://www.oceanfrogs.com/newsletter/episode-7-launching-gcc-index/"},
 {label:"Nasscom–Zinnov (Mar 2026)", v:2117, url:"https://zinnov.com/centers-of-excellence/zinnov-nasscom-india-gcc-landscape-2026-report/"},
 {label:"ANSR (May 2026)", v:1900, plus:true, url:"https://www.cxodigitalpulse.com/?p=54894"},
 {label:"AIM Research", v:1782, url:"https://gccexplorer.com"},
 {label:"Government of India (Dec 2025)", v:1700, plus:true, url:"https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/dec/doc20251211727201.pdf"}
];
const KF = "https://content.knightfrank.com/research/3116/documents/en/india-real-estate-office-and-residential-market-h1-2026-12927.pdf";
const CITIES = [
 {name:"Bengaluru",state:"Karnataka",tier:1,rent:102,rentUrl:KF,talent:660,gccs:487,match:["Bengaluru"],rule:{kind:"none",text:"Karnataka gives rent support only outside Bengaluru."}},
 {name:"Hyderabad",state:"Telangana",tier:1,rent:80,rentUrl:KF,talent:235,gccs:273,match:["Hyderabad"],rule:{kind:"none",text:"Telangana has no GCC policy yet; its IT policy applies."}},
 {name:"Pune",state:"Maharashtra",tier:1,rent:81.7,rentUrl:KF,talent:230,gccs:178,match:["Pune"],rule:{kind:"pct",pct:.10,capCr:4,text:"Maharashtra pays 10% of rent for new centres, up to ₹1–4 crore a year."}},
 {name:"Chennai",state:"Tamil Nadu",tier:1,rent:74.5,rentUrl:KF,talent:210,gccs:162,match:["Chennai"],rule:{kind:"none",text:"Tamil Nadu has no GCC policy; other incentives apply."}},
 {name:"Gurugram (Delhi NCR)",state:"Haryana",tier:1,rent:106,rentUrl:KF,talent:270,gccs:272,match:["Gurugram","Delhi","New Delhi"],rule:{kind:"haryana",text:"Haryana covers about 37.5% of rent for 5 years, capped by team size."}},
 {name:"Noida (Delhi NCR)",state:"Uttar Pradesh",tier:1,rent:101,rentUrl:KF,talent:270,gccs:272,match:["Noida"],rule:{kind:"pct",pct:.20,capCr:40,minHead:200,text:"Uttar Pradesh covers 20% of rent and running costs for 5 years (200+ staff in Noida)."}},
 {name:"Mumbai",state:"Maharashtra",tier:1,rent:130,rentUrl:KF,talent:235,gccs:207,match:["Mumbai"],rule:{kind:"pct",pct:.10,capCr:4,text:"Maharashtra pays 10% of rent for new centres, up to ₹1–4 crore a year."}},
 {name:"Ahmedabad (GIFT City)",state:"Gujarat",tier:2,rent:45,rentUrl:KF,talent:null,gccs:null,match:["GIFT City","Ahmedabad","Gandhinagar"],rule:{kind:"gujarat",minHead:50,text:"Gujarat covers 15% of running costs including rent, up to ₹20 crore a year (50+ staff)."}},
 {name:"Kolkata",state:"West Bengal",tier:2,rent:51.1,rentUrl:KF,talent:null,gccs:null,match:["Kolkata"],rule:{kind:"none",text:"West Bengal’s GCC policy is still a draft."}},
 {name:"Coimbatore",state:"Tamil Nadu",tier:2,rent:69.3,rentUrl:"https://realtynmore.com/coimbatore-real-estateq1-2026-cushman-wakefield/",talent:null,gccs:null,match:["Coimbatore"],rule:{kind:"none",text:"Tamil Nadu has no GCC policy; other incentives apply."}},
 {name:"Jaipur",state:"Rajasthan",tier:2,rent:49.8,rentUrl:"https://togetherbuying.in/articles/most-expensive-offices-in-india-2026-city-wise-rent-analysis",talent:null,gccs:null,match:["Jaipur"],rule:{kind:"pct",pct:.50,capCr:5,minHead:101,text:"Rajasthan pays 50% of rent for 3 years for its first 10 large GCCs, up to ₹5 crore a year."}}
];
const TIER2_TALENT = 85; // thousand people, Zinnov: five smaller cities combined, FY2025

const POLICIES = [
 {state:"Karnataka",policy:"Karnataka GCC Policy 2024–29",inc:["Outside Bengaluru: rent 50% up to ₹2 cr; hiring costs 50% up to ₹7 cr","New centres outside Bengaluru: ₹3,000 per employee a month for 2 years","Labs and research centres: 40% of setup cost"],src:"BDO India",url:"https://bdo.in/getmedia/ee3322eb-8399-4a67-b3b3-9a71ed9e6746/GCC-Policy_BDO-India_Karnataka-GCC-Policy-_Design_1.pdf"},
 {state:"Uttar Pradesh",policy:"UP GCC Policy 2024",inc:["25% of setup cost, up to ₹10–25 cr","20% of rent and running costs for 5 years","Part of salaries paid for the first years"],src:"Invest UP (official)",url:"https://invest.up.gov.in/up-gcc-policy-2024/"},
 {state:"Gujarat",policy:"Gujarat GCC Policy 2025–30",inc:["20–30% of setup cost, up to ₹50–200 cr","15% of running costs incl. rent for 5 years","Provident fund contribution paid for 5 years"],src:"RSM India",url:"https://www.rsm.global/india/sites/default/files/media/publications/2025/Gujarat%20GCC%20Policy%202025_A%20Landmark%20Initiative%20to%20Attract%20Global%20Enterprises.pdf"},
 {state:"Maharashtra",policy:"Maharashtra GCC Policy 2025",inc:["20% of equipment cost, up to ₹10–100 cr","Or rent support: 10–20%, up to ₹1–4 cr","Part of high salaries paid for 3 years"],src:"RSM India",url:"https://www.rsm.global/india/sites/default/files/media/publications/2025/RSM%20India%20Newsflash%20-%20Maharashtra%20Introduces%20the%20GCC%20Policy%202025%20-%20Key%20Highlights%20%26%20Incentives.pdf"},
 {state:"Haryana",policy:"Haryana GCC Policy 2026",inc:["50–75% of setup cost by area","50–65% of running costs for 5–9 years","Provident fund contribution paid for 5 years"],src:"Grant Thornton",url:"https://www.grantthornton.in/globalassets/1.-member-firms/india/assets/pdfs/alerts/haryana-global-capability-centres-policy-2026.pdf"},
 {state:"Rajasthan",policy:"Rajasthan GCC Policy 2025",inc:["30% of setup cost, up to ₹10 cr","First 10 large GCCs: 30% of salaries and 50% of rent","No stamp or electricity duty"],src:"Mondaq",url:"https://webiis10.mondaq.com/india/employee-rights-labour-relations/1724116/impetus-to-gccs-in-india-rajasthan-releases-its-gcc-policy"},
 {state:"Madhya Pradesh",policy:"MP GCC Policy 2025",inc:["40% of setup cost (not confirmed)","Rent help up to ₹3 cr (not confirmed)"],src:"Drishti IAS",url:"https://www.drishtiias.com/state-pcs-current-affairs/madhya-pradesh-gcc-policy-2025"},
 {state:"Andhra Pradesh",policy:"AP IT & GCC Policy 2024–29",inc:["6 months of salary per new hire, paid after 18 months","₹2,000 per seat a month in rent for 2 years"],src:"Khaitan & Co",url:"https://khaitanco.com/thought-leadership/Impetus-to-GCCs-in-India-Andhra-Pradesh-Releases-its-IT-and-GCC-Policy"},
 {state:"Odisha",policy:"Odisha GCC Policy 2025",inc:["30% of setup cost","Co-working seats up to ₹6,000 a month","₹30,000–40,000 per local hire"],src:"Mondaq",url:"https://webiis10.mondaq.com/india/contracts-and-commercial-law/1749448/impetus-to-gccs-in-india-odisha-releases-its-gcc-policy"}
];

const CATS = ["Office space","Recruiting","Payroll","Legal and tax","Setup advice"];
const PCAT = {"Setup advisor / BOT operator":"Setup advice","Real estate broker":"Office space","Flex / managed office":"Office space","Staffing / RPO":"Recruiting","EOR / payroll":"Payroll","Legal / tax":"Legal and tax"};

// ---------- helpers ----------
const $ = s=>document.querySelector(s);
const esc = s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n=>Number(n).toLocaleString("en-IN");
const cr = rupees=>"₹"+(rupees/1e7).toLocaleString("en-IN",{maximumFractionDigits:1})+" crore";
const ext = (url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label||"source")}</a>`:"";
const STOP=/\b(the|inc|incorporated|corp|corporation|co|company|companies|plc|ltd|limited|pvt|private|llp|ag|se|sa|nv|gmbh|oyj|group|holdings|india|indian|global|technology|technologies|tech|services|service|solutions|centre|center|capability|gcc|gccs|digital|business|shared|software|engineering|design|development|research|innovation|campus|hub|international|of|and|wholesale)\b/g;
const norm=s=>String(s||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(STOP," ").split(/\s+/).filter(t=>t.length>1);
function cityKey(c){
  const s=String(c).replace(/\(.*?\)/g,"").trim();
  if(/gurugram|gurgaon/i.test(s)) return "Gurugram";
  if(/noida/i.test(s)) return "Noida";
  if(/delhi/i.test(s)) return "Delhi";
  if(/gift/i.test(s)) return "GIFT City";
  if(/bangalore/i.test(s)) return "Bengaluru";
  return s;
}
const splitCities = s=>String(s||"").split(/;|\/|->|,/).map(cityKey).filter(Boolean);

// ---------- turn the dataset into records ----------
let GCCS = RAW.gccs.map((g,i)=>({
  id:"G"+(i+1), name:g.company, parent:g.parentCompany, hq:g.parentHqCountry, sector:g.sector, entity:g.indianEntity,
  cities:[...new Set(g.cities.map(cityKey))], headcount:g.indiaHeadcount, hcType:g.headcountType, hcYear:g.headcountYear, hcNote:g.headcountNote,
  est:g.yearEstablishedIndia, funcs:g.functions||[], status:"operating",
  sources:(g.sources||[]).map(s=>({url:s.sourceUrl,title:s.sourceTitle,date:s.sourceDate})) }));

function resolve(names, pool=GCCS){
  let best=null;
  for(const g of pool){ for(const cand of [g.name,g.parent,g.entity].filter(Boolean)){ const a=new Set(norm(cand));
    for(const n of names){ const b=norm(n); if(!b.length||!a.size) continue;
      const inter=b.filter(t=>a.has(t)).length; const s=inter/Math.min(a.size,b.length)*(inter/Math.max(a.size,b.length))**.25;
      if(!best||s>best.score) best={g,score:s,via:cand}; } } }
  return best&&best.score>=.6?best:null;
}
const TYPE = {"new GCC":"Opened a new GCC","new GCC (reported)":"New GCC, reported","expansion":"Expanded","lease":"Signed an office lease","consolidation":"Closed or merged a centre","GCC divestment":"Sold its GCC to an IT firm"};
let EVENTS = RAW.events.map((e,i)=>({id:"E"+(i+1),company:e.company,hq:e.hqCountry,type:TYPE[e.eventType]||e.eventType,cityRaw:e.city,cities:splitCities(e.city),date:e.date,detail:e.detail,url:e.sourceUrl,title:e.sourceTitle}))
  .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
for(const e of EVENTS){
  const m=resolve([e.company]);
  if(m){ e.gcc=m.g.id; if(/Sold/.test(e.type)) m.g.status="divested"; continue; }
  const g={id:"G"+(GCCS.length+1),name:e.company,parent:e.company,hq:e.hq,sector:"",entity:null,cities:e.cities,
    headcount:null,hcType:null,hcYear:null,hcNote:null,est:String(e.date).slice(0,4),funcs:[],
    status:/Sold/.test(e.type)?"divested":/reported/i.test(e.type)?"reported":"entrant",
    sources:[{url:e.url,title:e.title,date:e.date}]};
  GCCS.push(g); e.gcc=g.id;
}
// plain industry names; new entrants carry no sector in the dataset, so name it from the company
const ENTRANT_SECTOR=[[/Lilly|Merck|Sanofi/,"Pharma"],[/McDonald|HEINEKEN|Nestl|L.Or/,"Consumer goods"],[/Costco|Best Buy/,"Retail"],[/Vanguard|Schwab/,"Banking and finance"],[/Guardian/,"Insurance"],[/BASF/,"Chemicals"],[/ArcelorMittal/,"Steel"],[/Southwest/,"Airline"]];
GCCS.forEach(g=>{ if(g.sector==="BFSI") g.sector="Banking and finance"; if(!g.sector){ const m=ENTRANT_SECTOR.find(([re])=>re.test(g.name)); g.sector=m?m[1]:""; } });
const LEVEL = c=>/vendor|low/i.test(c)?"self":/high/i.test(c)&&!/medium/i.test(c)?"documented":"reported";
const LEVEL_LABEL={documented:"Official",reported:"News report",self:"Provider’s own claim"};
let PROVIDERS = RAW.providers.map((p,i)=>({id:"P"+(i+1),name:p.name,cat:PCAT[p.category]||p.category,desc:p.description,url:p.url,eng:[]}));
// a stake, a partnership or a government agreement is not GCC client work
const NOT_GCC_CLIENT=/^(ANSR|Accenture|ServiceNow)|Government|Department/i;
RAW.engagements.forEach((x,i)=>{
  if(NOT_GCC_CLIENT.test(x.client)) return;
  const p=PROVIDERS.find(p=>p.name===x.provider)||PROVIDERS.find(p=>p.name.includes(x.provider)||x.provider.includes(p.name.split(" (")[0]));
  if(!p) return;
  const m=resolve([x.client]);
  p.eng.push({client:x.client,gcc:m?.g.id||null,type:x.engagementType,city:x.city,year:x.year,detail:x.detail,url:x.sourceUrl,title:x.sourceTitle,level:LEVEL(x.confidence||"")});
});

const gById = id=>GCCS.find(g=>g.id===id);
const pById = id=>PROVIDERS.find(p=>p.id===id);
const STATUS={operating:"Running",entrant:"New in 2025–26",reported:"Reported, not confirmed",divested:"Sold to an IT firm"};
const statusPill = s=>`<span class="pill s-${s}">${STATUS[s]||esc(s)}</span>`;
const WHO={official:"company figure",press:"news report",thirdParty:"estimate"};
const staff = g=>g.headcount?`${fmt(g.headcount)} <span class="sub">(${WHO[g.hcType]||"reported"}${g.hcYear?", "+g.hcYear:""})</span>`:'<span class="sub">not public</span>';
let freshIds=new Set();
