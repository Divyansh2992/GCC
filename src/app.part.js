
// ---------- saved state (this browser only) ----------
const KEY="gccatlas.v2";
const BLANK=()=>({saved:[],notes:{},added:{gccs:[],events:[],cityAdds:[]},alerts:{cat:"Office space",cities:[],only:false},seen:[]});
let store=BLANK();
try{ const s=JSON.parse(localStorage.getItem(KEY)||"null"); if(s) store={...store,...s,added:{...store.added,...(s.added||{})},alerts:{...store.alerts,...(s.alerts||{})}}; }catch(e){}
const persist=()=>{ try{ localStorage.setItem(KEY,JSON.stringify(store)); }catch(e){} };
// replay what the viewer added earlier
store.added.gccs.forEach(g=>{ if(!gById(g.id)) GCCS.push(g); });
store.added.events.forEach(e=>{ if(!EVENTS.some(x=>x.id===e.id)) EVENTS.push(e); });
store.added.cityAdds.forEach(({gcc,city})=>{ const g=gById(gcc); if(g&&!g.cities.includes(city)) g.cities.push(city); });
EVENTS.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const isSaved=id=>store.saved.includes(id);
function toggleSave(id){ store.saved=isSaved(id)?store.saved.filter(x=>x!==id):[...store.saved,id]; persist(); toast(isSaved(id)?"Added to My list":"Removed from My list"); refreshAll(); }
let toastT;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.hidden=false; clearTimeout(toastT); toastT=setTimeout(()=>t.hidden=true,2200); }
const nextId=(prefix,list)=>prefix+(1000+list.filter(x=>x.id.startsWith(prefix+"1")).length+1);

// ---------- navigation ----------
const TABS=["dash","list","new","providers","planner","add","saved"];
let current="dash";
function show(tab){
  if(!TABS.includes(tab)) tab="dash";
  current=tab;
  document.querySelectorAll("[data-view]").forEach(s=>s.hidden=s.dataset.view!==tab);
  document.querySelectorAll("#nav button").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===tab));
  try{history.replaceState(null,"","#"+tab)}catch(e){}
  closeDrawer(); window.scrollTo(0,0);
  if(tab==="new"){ renderSignals(); store.seen=EVENTS.map(e=>e.id); persist(); renderCounts(); }
}
$("#nav").addEventListener("click",e=>{const b=e.target.closest("button[data-tab]"); if(b) show(b.dataset.tab)});
document.addEventListener("click",e=>{
  const g=e.target.closest("[data-go]"); if(g){ if(g.dataset.city){ $("#fCity").value=g.dataset.city; } if(g.dataset.status!==undefined){ $("#fStatus").value=g.dataset.status; } if(g.dataset.go==="list") renderList(); show(g.dataset.go); }
  const og=e.target.closest("[data-open-g]"); if(og&&!e.target.closest("#drawer")) openGcc(og.dataset.openG);
  const op=e.target.closest("[data-open-p]"); if(op&&!e.target.closest("#drawer")) openProvider(op.dataset.openP);
  const st=e.target.closest("[data-star]"); if(st){ e.stopPropagation(); toggleSave(st.dataset.star); }
},true);
function renderCounts(){
  const unread=EVENTS.filter(e=>!store.seen.includes(e.id)).length;
  $("#cList").textContent=GCCS.length; $("#cProv").textContent=PROVIDERS.length;
  $("#cNew").textContent=unread; $("#cNew").hidden=!unread;
  $("#cSaved").textContent=store.saved.length; $("#cSaved").hidden=!store.saved.length;
}

// ---------- global search ----------
$("#gq").addEventListener("input",()=>{
  const q=$("#gq").value.trim().toLowerCase(); const box=$("#gres");
  if(q.length<2){ box.hidden=true; return; }
  const hits=[
    ...GCCS.filter(g=>[g.name,g.parent,g.sector,g.hq,...g.cities].join(" ").toLowerCase().includes(q)).slice(0,6).map(g=>({k:"g",id:g.id,label:g.name,meta:"Company · "+g.cities.slice(0,2).join(", ")})),
    ...PROVIDERS.filter(p=>[p.name,p.cat].join(" ").toLowerCase().includes(q)).slice(0,4).map(p=>({k:"p",id:p.id,label:p.name,meta:"Provider · "+p.cat})),
    ...CITIES.filter(c=>c.name.toLowerCase().includes(q)).slice(0,3).map(c=>({k:"c",id:c.name,label:c.name,meta:"City · open in planner"}))];
  box.innerHTML=hits.length?hits.map(h=>`<button data-k="${h.k}" data-id="${esc(h.id)}"><b>${esc(h.label)}</b><span class="sub">${esc(h.meta)}</span></button>`).join(""):'<p class="note" style="padding:8px">No matches.</p>';
  box.hidden=false;
});
$("#gres").addEventListener("click",e=>{
  const b=e.target.closest("button[data-k]"); if(!b) return;
  $("#gres").hidden=true; $("#gq").value="";
  if(b.dataset.k==="g") openGcc(b.dataset.id); else if(b.dataset.k==="p") openProvider(b.dataset.id); else { show("planner"); pickCity(b.dataset.id); }
});
document.addEventListener("click",e=>{ if(!e.target.closest(".search")) $("#gres").hidden=true; });
$("#gq").addEventListener("keydown",e=>{ if(e.key==="Enter"){ const f=$("#gres button"); if(f) f.click(); } if(e.key==="Escape") $("#gres").hidden=true; });

// ---------- dashboard ----------
const cityGroup=c=>["Gurugram","Noida","Delhi"].includes(c)?"Delhi NCR":c==="GIFT City"?"Ahmedabad":c;
function renderDash(){
  const n=s=>GCCS.filter(g=>g.status===s).length;
  const unread=EVENTS.filter(e=>!store.seen.includes(e.id)).length;
  const withProof=PROVIDERS.filter(p=>p.eng.length).length;
  $("#kpis").innerHTML=[
    [GCCS.length,"companies tracked",'data-go="list" data-status=""'],
    [n("entrant")+n("reported"),"new in 2025–26",'data-go="list" data-status="entrant"'],
    [unread,"unread news",'data-go="new"'],
    [`${withProof}/${PROVIDERS.length}`,"providers with proof",'data-go="providers"'],
    [store.saved.length,"in my list",'data-go="saved"']
  ].map(([v,l,a])=>`<button class="kpi" ${a}><span class="v">${v}</span><span class="l">${l}</span></button>`).join("");
  const counts={}; GCCS.forEach(g=>new Set(g.cities.map(cityGroup)).forEach(c=>{ if(c&&c!=="Not stated") counts[c]=(counts[c]||0)+1; }));
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8), max=top[0]?.[1]||1;
  $("#chartCity").innerHTML=top.map(([c,v])=>`<button class="bar" data-go="list" data-city="${esc(c)}"><span>${esc(c)}</span><i><b style="width:${v/max*100}%"></b></i><span class="n">${v}</span></button>`).join("");
  const months=[]; for(let y=2025;y<=2026;y++) for(let m=1;m<=12;m++){ const k=`${y}-${String(m).padStart(2,"0")}`; if(k<="2026-10") months.push(k); }
  const per=Object.fromEntries(months.map(k=>[k,EVENTS.filter(e=>String(e.date).startsWith(k)).length]));
  const mx=Math.max(1,...Object.values(per));
  $("#chartMonth").innerHTML=months.map(k=>`<div title="${k}: ${per[k]} news">${per[k]?per[k]:""}<b style="height:${per[k]/mx*100}%"></b></div>`).join("");
  $("#chartMonthL").innerHTML=months.map((k,i)=>`<span>${i%3===0?["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+k.slice(5)-1]+" "+k.slice(2,4):""}</span>`).join("");
  $("#latest").innerHTML=EVENTS.slice(0,5).map(e=>`<div class="card"><div class="top"><div><span class="sub">${esc(e.date)} · ${esc(e.cityRaw)}</span><br><b>${esc(e.company)}</b>: ${esc(e.type.toLowerCase())}</div><button class="btn ghost small" data-open-g="${e.gcc}">View</button></div></div>`).join("");
  const cmax=Math.max(...COUNTS.map(c=>c.v));
  $("#counts").innerHTML=COUNTS.map(c=>`<div class="crow"><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label)}</a><div class="track"><b style="width:${c.v/cmax*100}%"></b></div><span class="v">${fmt(c.v)}${c.plus?"+":""}</span></div>`).join("");
}

// ---------- companies ----------
function fillSelect(sel,label,values){const keep=sel.value; sel.innerHTML=`<option value="">${label}</option>`+values.map(v=>`<option>${esc(v)}</option>`).join(""); if(values.includes(keep)) sel.value=keep;}
let listSort={key:"staff",dir:-1};
const sortVal={name:g=>g.name.toLowerCase(),hq:g=>String(g.hq).toLowerCase(),sector:g=>String(g.sector).toLowerCase(),cities:g=>g.cities.length,staff:g=>g.headcount||0,status:g=>STATUS[g.status]};
function filteredList(){
  const q=$("#q").value.trim().toLowerCase(), c=$("#fCity").value, s=$("#fStatus").value, sec=$("#fSector").value;
  const inCity=g=>!c||g.cities.map(cityGroup).includes(c)||g.cities.includes(c);
  const rows=GCCS.filter(g=>inCity(g)&&(!s||g.status===s)&&(!sec||g.sector===sec)&&(!q||[g.name,g.parent,g.sector,g.hq,...g.cities].join(" ").toLowerCase().includes(q)));
  const f=sortVal[listSort.key]; rows.sort((a,b)=>{const x=f(a),y=f(b); return (x>y?1:x<y?-1:0)*listSort.dir;});
  return rows;
}
function renderList(){
  const rows=filteredList();
  $("#listCount").textContent=`${rows.length} of ${GCCS.length} companies · click a column to sort`;
  document.querySelectorAll("th[data-sort]").forEach(th=>{ th.querySelector(".arrow")?.remove(); if(th.dataset.sort===listSort.key) th.insertAdjacentHTML("beforeend",`<span class="arrow">${listSort.dir>0?"▲":"▼"}</span>`); });
  $("#regBody").innerHTML=rows.map(g=>`<tr data-g="${g.id}"><td><button class="star" data-star="${g.id}" aria-pressed="${isSaved(g.id)}" aria-label="Save ${esc(g.name)}">★</button></td><td><b>${esc(g.name)}</b>${freshIds.has(g.id)?' <span class="pill s-entrant">Just added</span>':""}${store.notes[g.id]?' <span class="pill e-self">Note</span>':""}</td><td>${esc(g.hq)}</td><td>${esc(g.sector)}</td><td>${g.cities.map(esc).join(", ")}</td><td class="num">${staff(g)}</td><td>${statusPill(g.status)}</td></tr>`).join("")
    || `<tr><td colspan="7"><div class="empty">No company matches these filters.</div></td></tr>`;
}
["#q","#fCity","#fStatus","#fSector"].forEach(s=>$(s).addEventListener("input",renderList));
document.querySelectorAll("th[data-sort]").forEach(th=>th.addEventListener("click",()=>{ const k=th.dataset.sort; listSort={key:k,dir:listSort.key===k?-listSort.dir:(k==="staff"?-1:1)}; renderList(); }));
$("#regBody").addEventListener("click",e=>{ if(e.target.closest("[data-star]")) return; const r=e.target.closest("tr[data-g]"); if(r) openGcc(r.dataset.g); });

// ---------- CSV export ----------
const csvCell=v=>{ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
const toCSV=(head,rows)=>[head,...rows].map(r=>r.map(csvCell).join(",")).join("\n");
let downloads=null;
(window.claude?.use?window.claude.use("downloads"):Promise.resolve(null)).then(d=>downloads=d).catch(()=>{});
async function saveFile(filename,text){
  if(downloads){ try{ await downloads.save({filename,data:new Blob(["﻿"+text],{type:"text/csv"})}); toast("Download ready"); return; }catch(e){ if(e?.code==="declined"||e?.code==="cancelled") return; } }
  try{ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["﻿"+text],{type:"text/csv"})); a.download=filename; document.body.appendChild(a); a.click(); a.remove(); toast("Downloaded "+filename); }
  catch(e){ toast("Download is not available here"); }
}
const gccRow=g=>[g.name,g.parent,g.hq,g.sector,g.cities.join("; "),g.headcount||"",g.headcount?WHO[g.hcType]||"":"",STATUS[g.status],store.notes[g.id]||"",g.sources.map(s=>s.url).filter(Boolean).join(" ")];
const GCC_HEAD=["Company","Parent","Based in","Industry","Cities","India staff","Staff figure from","Status","My note","Sources"];
$("#exportList").onclick=()=>saveFile("gcc-atlas-companies.csv",toCSV(GCC_HEAD,filteredList().map(gccRow)));
$("#exportSaved").onclick=()=>{ const rows=store.saved.map(gById).filter(Boolean); if(!rows.length) return toast("Your list is empty"); saveFile("gcc-atlas-my-list.csv",toCSV(GCC_HEAD,rows.map(gccRow))); };
$("#exportProv").onclick=()=>saveFile("gcc-atlas-providers.csv",toCSV(["Provider","Type","GCC clients with proof","Strongest proof","Website"],filteredProviders().map(p=>[p.name,p.cat,p.eng.map(x=>x.client).join("; "),p.eng.length?LEVEL_LABEL[bestKey(p)]:"None found",p.url])));

// ---------- side panel ----------
function openDrawer(html){$("#drawer").innerHTML=html;$("#drawer").hidden=false;$("#scrim").hidden=false;$("#drawer").querySelector("[data-close]")?.focus()}
function closeDrawer(){$("#drawer").hidden=true;$("#scrim").hidden=true}
$("#scrim").onclick=closeDrawer;
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer()});
$("#drawer").addEventListener("click",e=>{
  if(e.target.closest("[data-close]")) return closeDrawer();
  const st=e.target.closest("[data-dstar]"); if(st){ toggleSave(st.dataset.dstar); openGcc(st.dataset.dstar); return; }
  const g=e.target.closest("[data-open-g]"); if(g) return openGcc(g.dataset.openG);
  const p=e.target.closest("[data-open-p]"); if(p) return openProvider(p.dataset.openP);
});
let noteT;
function openGcc(id){
  const g=gById(id); if(!g) return;
  const ev=EVENTS.filter(e=>e.gcc===id);
  const prov=PROVIDERS.flatMap(p=>p.eng.filter(x=>x.gcc===id).map(x=>({p,x})));
  openDrawer(`<div class="dhead"><div><h2 style="font-size:21px">${esc(g.name)}</h2><div style="margin-top:6px">${statusPill(g.status)}</div></div><div class="filters"><button class="btn ${isSaved(id)?"":"ghost"} small" data-dstar="${id}">${isSaved(id)?"★ Saved":"☆ Save"}</button><button class="btn ghost small" data-close>Close</button></div></div>
  <dl class="kv"><dt>Parent company</dt><dd>${esc(g.parent)}</dd><dt>Based in</dt><dd>${esc(g.hq)}</dd>${g.sector?`<dt>Industry</dt><dd>${esc(g.sector)}</dd>`:""}<dt>Cities in India</dt><dd>${g.cities.map(esc).join(", ")}</dd>
  <dt>India staff</dt><dd>${staff(g)}${g.hcNote?`<div class="sub">${esc(g.hcNote)}</div>`:""}</dd>${g.est?`<dt>In India since</dt><dd>${esc(g.est)}</dd>`:""}${g.entity?`<dt>Indian company name</dt><dd>${esc(g.entity)}</dd>`:""}${g.funcs.length?`<dt>Work done</dt><dd>${g.funcs.map(esc).join(", ")}</dd>`:""}</dl>
  <label for="note">My note (saved automatically)<textarea id="note" style="min-height:80px" placeholder="For example: met their India head in May; follow up in Q1">${esc(store.notes[id]||"")}</textarea></label>
  ${ev.length?`<h3>News</h3><div class="tl">${ev.map(e=>`<div><span class="d">${esc(e.date)} · ${esc(e.cityRaw)}</span><br><b>${esc(e.type)}.</b> ${esc(e.detail)}<br>${e.url?ext(e.url,"Read the source"):'<span class="sub">From a pasted article</span>'}</div>`).join("")}</div>`:""}
  <h3>Partners who worked with them</h3><div class="tl">${prov.length?prov.map(({p,x})=>`<div><button class="link" data-open-p="${p.id}">${esc(p.name)}</button>: ${esc(x.type)} <span class="pill e-${x.level}">${LEVEL_LABEL[x.level]}</span></div>`).join(""):'<div class="sub">None with public proof yet.</div>'}</div>
  <h3>Sources</h3><div class="tl">${g.sources.map(s=>`<div>${s.url?ext(s.url,s.title||s.url):esc(s.title||"Added by you")}${s.date?` <span class="sub">${esc(s.date)}</span>`:""}</div>`).join("")||'<div class="sub">Added by you.</div>'}</div>`);
  $("#note").addEventListener("input",ev=>{ clearTimeout(noteT); noteT=setTimeout(()=>{ const v=ev.target.value.trim(); if(v) store.notes[id]=v; else delete store.notes[id]; persist(); renderList(); renderSaved(); toast("Note saved"); },500); });
}
function openProvider(id){
  const p=pById(id); if(!p) return;
  openDrawer(`<div class="dhead"><div><h2 style="font-size:21px">${esc(p.name)}</h2><p class="sub">${esc(p.cat)}</p></div><button class="btn ghost small" data-close>Close</button></div>
  <p>${esc(p.desc)}</p><p>${ext(p.url,"Website")}</p>
  <h3>GCC clients with public proof</h3><div class="tl">${p.eng.length?p.eng.map(x=>`<div>${x.gcc?`<button class="link" data-open-g="${x.gcc}">${esc(x.client)}</button>`:`<b>${esc(x.client)}</b>`}${x.year?` <span class="sub">(${x.year})</span>`:""} <span class="pill e-${x.level}">${LEVEL_LABEL[x.level]}</span><br>${esc(x.type)}. ${esc(x.detail)}<br>${ext(x.url,"Read the source")}</div>`).join(""):'<div class="sub">None found. This provider may have GCC clients, but none is named in public sources.</div>'}</div>`);
}

// ---------- add a company by hand ----------
function openAddForm(){
  openDrawer(`<div class="dhead"><h2 style="font-size:21px">Add a company</h2><button class="btn ghost small" data-close>Close</button></div>
  <form class="fm" id="addForm">
    <label>Company name *<input type="text" id="fName" required placeholder="For example: Acme Bank"></label>
    <label>Based in (country)<input type="text" id="fHq" placeholder="For example: United States"></label>
    <label>Industry<input type="text" id="fSec" list="secList" placeholder="For example: Banking and finance"><datalist id="secList">${[...new Set(GCCS.map(g=>g.sector).filter(Boolean))].map(s=>`<option value="${esc(s)}">`).join("")}</datalist></label>
    <label>City in India *<input type="text" id="fCityIn" required list="cityListDl" placeholder="For example: Pune"><datalist id="cityListDl">${[...new Set(GCCS.flatMap(g=>g.cities))].sort().map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label>
    <label>India staff<input type="number" id="fStaff" min="0" placeholder="Leave empty if unknown"></label>
    <label>Status<select id="fSt"><option value="entrant">New in 2025–26</option><option value="operating">Running</option><option value="reported">Reported, not confirmed</option></select></label>
    <label>Source link<input type="url" id="fSrc" placeholder="https://…"></label>
    <div class="filters"><button class="btn" type="submit">Add company</button><span class="note">Saved in this browser.</span></div>
  </form>`);
  $("#fName").focus();
  $("#addForm").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("#fName").value.trim(), city=$("#fCityIn").value.trim(); if(!name||!city) return;
    const dupe=resolve([name]); if(dupe&&dupe.score>=.9){ toast(`${dupe.g.name} is already in the list`); openGcc(dupe.g.id); return; }
    const src=$("#fSrc").value.trim();
    const g={id:nextId("G",GCCS),name,parent:name,hq:$("#fHq").value.trim()||"Not stated",sector:$("#fSec").value.trim(),entity:null,cities:[cityKey(city)],
      headcount:+$("#fStaff").value||null,hcType:$("#fStaff").value?"press":null,hcYear:$("#fStaff").value?2026:null,hcNote:$("#fStaff").value?"Entered by you":null,
      est:"",funcs:[],status:$("#fSt").value,sources:[{url:src||null,title:src?"Source you added":"Added by you",date:"2026-10-26"}]};
    GCCS.push(g); store.added.gccs.push(g); persist(); freshIds.add(g.id);
    refreshAll(); toast(`${name} added`); openGcc(g.id);
  });
}
$("#addCo").onclick=openAddForm;

// ---------- news & alerts ----------
const WHY={
 "Opened a new GCC":{"Office space":"Needs a long-term office within 6–12 months.","Recruiting":"Leaders and first hires come next.","Payroll":"May pay early staff through a payroll partner.","Legal and tax":"Company setup and approvals ahead.","Setup advice":"Still choosing how to run the centre."},
 "New GCC, reported":{"Office space":"Not confirmed yet. Worth a call, not a chase.","Recruiting":"A senior hire would confirm it.","Payroll":"If true, early hiring is likely.","Legal and tax":"A company filing would confirm it.","Setup advice":"Earliest stage, if confirmed."},
 "Expanded":{"Office space":"Needs more floors or a second site.","Recruiting":"Many new roles to fill.","Payroll":"Payroll is growing.","Legal and tax":"New registrations if it is a new city.","Setup advice":"Planning across several cities."},
 "Signed an office lease":{"Office space":"This deal is done; watch for fit-out and the next site.","Recruiting":"Hiring follows the new space.","Payroll":"Headcount will grow.","Legal and tax":"Lease and incentive paperwork.","Setup advice":"Space is set; operating plans next."},
 "Closed or merged a centre":{"Office space":"Space being given up or moved.","Recruiting":"Staff moving or leaving: talent available.","Payroll":"Exits and transfers to process.","Legal and tax":"Closure and transfer work.","Setup advice":"The company is rethinking its India footprint."},
 "Sold its GCC to an IT firm":{"Office space":"Space moves to the buyer.","Recruiting":"The buyer now does the hiring.","Payroll":"Staff move to a new employer.","Legal and tax":"Business and staff transfer work.","Setup advice":"A sign others in this sector may outsource too."}
};
const ALERT_CITIES=["Bengaluru","Hyderabad","Pune","Chennai","Delhi NCR","Mumbai","Coimbatore","Ahmedabad"];
function renderSignals(){
  const a=store.alerts;
  $("#sigCats").innerHTML=CATS.map(c=>`<button class="chip" aria-pressed="${c===a.cat}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  $("#myCities").innerHTML=ALERT_CITIES.map(c=>`<button class="chip" aria-pressed="${a.cities.includes(c)}" data-mc="${esc(c)}">${esc(c)}</button>`).join("");
  $("#onlyMine").setAttribute("aria-pressed",a.only);
  const t=$("#sigType").value;
  const list=EVENTS.filter(e=>(!t||e.type===t)&&(!a.only||!a.cities.length||e.cities.some(c=>a.cities.includes(cityGroup(c)))));
  $("#feed").innerHTML=list.map(e=>{const why=(WHY[e.type]||{})[a.cat]||""; const unread=!store.seen.includes(e.id);
    return `<article class="card${freshIds.has(e.id)?" fresh":""}"><div class="top"><div><span class="sub">${esc(e.date)} · ${esc(e.cityRaw)}</span> ${unread?'<span class="pill unread">New</span>':""}<h3 style="font-size:16px">${esc(e.company)}: ${esc(e.type.toLowerCase())}</h3></div><div class="filters"><button class="star" data-star="${e.gcc}" aria-pressed="${isSaved(e.gcc)}" aria-label="Save company">★</button><button class="btn ghost small" data-open-g="${esc(e.gcc)}">View company</button></div></div>
    <p>${esc(e.detail)}</p>${why?`<p class="why"><b>For ${esc(a.cat.toLowerCase())}:</b> ${esc(why)}</p>`:""}<p class="sub">${e.url?ext(e.url,"Read the source"):"From a pasted article"}</p></article>`}).join("") || '<div class="empty">No news matches your alerts. Add more cities or turn off “Show only my cities”.</div>';
}
$("#sigCats").addEventListener("click",e=>{const b=e.target.closest("[data-c]"); if(b){store.alerts.cat=b.dataset.c;persist();renderSignals()}});
$("#myCities").addEventListener("click",e=>{const b=e.target.closest("[data-mc]"); if(!b) return; const c=b.dataset.mc, l=store.alerts.cities; store.alerts.cities=l.includes(c)?l.filter(x=>x!==c):[...l,c]; persist(); renderSignals();});
$("#onlyMine").onclick=()=>{ store.alerts.only=!store.alerts.only; if(store.alerts.only&&!store.alerts.cities.length) toast("Pick at least one city"); persist(); renderSignals(); };
$("#sigType").addEventListener("input",renderSignals);

// ---------- providers ----------
let provCat="", provSort={key:"best",dir:-1};
const rank={documented:3,reported:2,self:1};
const best=p=>p.eng.reduce((a,x)=>Math.max(a,rank[x.level]),0);
const bestKey=p=>["","self","reported","documented"][best(p)];
const pSortVal={name:p=>p.name.toLowerCase(),cat:p=>p.cat,n:p=>p.eng.length,best:p=>best(p)*100+p.eng.length};
function filteredProviders(){
  const q=$("#pq").value.trim().toLowerCase();
  const rows=PROVIDERS.filter(p=>(!provCat||p.cat===provCat)&&(!q||[p.name,p.cat,p.desc,...p.eng.map(x=>x.client)].join(" ").toLowerCase().includes(q)));
  const f=pSortVal[provSort.key]; rows.sort((a,b)=>{const x=f(a),y=f(b); return (x>y?1:x<y?-1:0)*provSort.dir;});
  return rows;
}
function renderProviders(){
  const withEng=PROVIDERS.filter(p=>p.eng.length).length;
  $("#provKpis").innerHTML=[[PROVIDERS.length,"providers checked"],[withEng,"with a GCC client on public record"],[PROVIDERS.length-withEng,"with none we could find"]].map(([v,l])=>`<div class="kpi" style="cursor:default"><span class="v">${v}</span><span class="l">${l}</span></div>`).join("");
  $("#provCats").innerHTML=["",...CATS].map(c=>`<button class="chip" aria-pressed="${c===provCat}" data-c="${esc(c)}">${c?esc(c):"All"}</button>`).join("");
  document.querySelectorAll("th[data-psort]").forEach(th=>{ th.style.cursor="pointer"; th.querySelector(".arrow")?.remove(); if(th.dataset.psort===provSort.key) th.insertAdjacentHTML("beforeend",`<span class="arrow">${provSort.dir>0?"▲":"▼"}</span>`); });
  $("#provBody").innerHTML=filteredProviders().map(p=>`<tr data-p="${p.id}"><td><b>${esc(p.name)}</b></td><td>${esc(p.cat)}</td><td>${p.eng.length?p.eng.map(x=>esc(x.client)).join(", "):'<span class="sub">none found</span>'}</td><td>${p.eng.length?`<span class="pill e-${bestKey(p)}">${LEVEL_LABEL[bestKey(p)]}</span>`:""}</td></tr>`).join("")||'<tr><td colspan="4"><div class="empty">No provider matches.</div></td></tr>';
}
$("#provCats").addEventListener("click",e=>{const b=e.target.closest("[data-c]"); if(b){provCat=b.dataset.c;renderProviders()}});
$("#pq").addEventListener("input",renderProviders);
document.querySelectorAll("th[data-psort]").forEach(th=>th.addEventListener("click",()=>{ const k=th.dataset.psort; provSort={key:k,dir:provSort.key===k?-provSort.dir:(k==="name"||k==="cat"?1:-1)}; renderProviders(); }));
$("#provBody").addEventListener("click",e=>{const r=e.target.closest("tr[data-p]"); if(r) openProvider(r.dataset.p)});

// ---------- city planner ----------
let tier2=false, lastPlan=null, selCity=null, cmp=[];
function rentSupport(c,hc,annualRent,sqft){
  const r=c.rule;
  if(r.minHead&&hc<r.minHead) return {amt:0,note:`Needs ${r.minHead}+ staff`};
  if(r.kind==="pct") return {amt:Math.min(annualRent*r.pct,r.capCr*1e7)};
  if(r.kind==="haryana") return {amt:Math.min(annualRent*.75*.5,Math.min(.75e7*hc/100,15e7))};
  if(r.kind==="gujarat") return {amt:Math.min(Math.min(c.rent,50)*sqft*12*.15,20e7)};
  return {amt:0,note:"None"};
}
function plan(){
  const costW=+$("#pPri").value/100, hc=Math.max(10,+$("#pHead").value||300), seat=100;
  const tal=c=>c.talent??TIER2_TALENT/5;
  const maxT=Math.log(Math.max(...CITIES.map(tal))), minT=Math.log(TIER2_TALENT/5);
  const rents=CITIES.map(c=>c.rent), maxR=Math.max(...rents), minR=Math.min(...rents);
  const maxE=Math.max(...CITIES.map(c=>c.gccs||0));
  return CITIES.map(c=>{
    const talent=(Math.log(tal(c))-minT)/(maxT-minT||1), cost=(maxR-c.rent)/(maxR-minR||1), eco=(c.gccs||20)/maxE;
    const sqft=hc*seat, annualRent=sqft*c.rent*12, sup=rentSupport(c,hc,annualRent,sqft);
    const score=Math.round((talent*(1-costW)*.55+cost*costW*.55+eco*.3+(hc>1000?talent:1)*.15)*100);
    const peers=GCCS.filter(g=>g.cities.some(x=>c.match.includes(x)));
    return {c,score,annualRent,sup,peers,hc};
  }).sort((a,b)=>b.score-a.score);
}
function pickCity(name){ selCity=name; renderPlanner(); $("#briefOut").innerHTML='<p class="note">Click “Write summary” for a note on this city.</p>'; }
function renderPlanner(){
  const v=+$("#pPri").value; $("#pPriL").textContent=v<35?"More talent":v>65?"Lower cost":"Both equally";
  $("#pTier2").setAttribute("aria-pressed",tier2);
  const all=plan(), ranked=all.filter(r=>tier2||r.c.tier===1);
  const sel=all.find(r=>r.c.name===selCity)||ranked[0];
  lastPlan=[sel,...ranked.filter(r=>r!==sel)];
  fillSelect($("#pCity"),"Choose…",CITIES.map(c=>c.name)); $("#pCity").value=sel.c.name;
  const shown=ranked.slice(0,6); if(!shown.includes(sel)) shown.push(sel);
  $("#cityList").innerHTML=shown.map(r=>`<div class="city${r===sel?" sel":""}" role="button" tabindex="0" aria-pressed="${r===sel}" data-city="${esc(r.c.name)}"><div class="rank">${ranked.indexOf(r)+1||"–"}</div>
    <div><b style="font-size:16px">${esc(r.c.name)}</b> <span class="sub">${esc(r.c.state)} · fit ${r.score}/100</span>${r===sel?' <span class="pill s-operating">Selected</span>':""}
      <div class="sub">${r.c.talent?`${fmt(r.c.talent*1000)}+ people work in GCCs here`:"Smaller talent pool"} · ${r.peers.length} companies from our list</div>
      <div class="money"><div><span>Office rent</span><b>₹${r.c.rent}</b>/sq ft/mo</div><div><span>Your year-one rent</span><b>${cr(r.annualRent)}</b></div><div><span>State rent support</span><b>${r.sup.amt?cr(r.sup.amt)+"/yr":esc(r.sup.note)}</b></div></div>
      <p class="sub" style="margin-top:6px">${esc(r.c.rule.text)} ${ext(r.c.rentUrl,"Rent source")}</p></div>
    <div class="cmp"><button class="chip" data-cmp="${esc(r.c.name)}" aria-pressed="${cmp.includes(r.c.name)}">${cmp.includes(r.c.name)?"✓ Comparing":"Compare"}</button></div></div>`).join("");
  $("#briefCity").textContent=sel.c.name;
  $("#peerHead").textContent=`Companies already in ${sel.c.name} (${sel.peers.length})`;
  $("#peerList").innerHTML=sel.peers.slice(0,8).map(g=>`<div class="card"><div class="top"><div><b>${esc(g.name)}</b> ${statusPill(g.status)}<div class="sub">${esc(g.hq)}${g.headcount?" · "+fmt(g.headcount)+" staff":""}</div></div><button class="btn ghost small" data-open-g="${g.id}">View</button></div></div>`).join("")||'<div class="empty">None from our list yet.</div>';
  // comparison table
  const rows=cmp.map(n=>all.find(r=>r.c.name===n)).filter(Boolean);
  $("#compareBox").hidden=!rows.length;
  if(rows.length){
    const line=(label,f)=>`<tr><td class="sub">${label}</td>${rows.map(r=>`<td>${f(r)}</td>`).join("")}</tr>`;
    $("#compare").innerHTML=`<thead><tr><th></th>${rows.map(r=>`<th>${esc(r.c.name)}</th>`).join("")}</tr></thead><tbody>
      ${line("Fit score",r=>`<b>${r.score}/100</b>`)}
      ${line("Office rent",r=>`₹${r.c.rent}/sq ft/month`)}
      ${line("Year-one rent",r=>cr(r.annualRent))}
      ${line("State rent support",r=>r.sup.amt?cr(r.sup.amt)+"/yr":esc(r.sup.note))}
      ${line("Rent after support",r=>`<b>${cr(r.annualRent-r.sup.amt)}</b>`)}
      ${line("People in GCCs",r=>r.c.talent?fmt(r.c.talent*1000)+"+":"Not reported")}
      ${line("Companies from our list",r=>r.peers.length)}
      ${line("State",r=>esc(r.c.state))}</tbody>`;
  }
}
$("#pTier2").onclick=()=>{tier2=!tier2;renderPlanner()};
["#pPri","#pHead"].forEach(s=>$(s).addEventListener("input",renderPlanner));
$("#pCity").addEventListener("input",()=>{ if($("#pCity").value) pickCity($("#pCity").value); });
$("#cityList").addEventListener("click",e=>{
  if(e.target.closest("a")) return;
  const c=e.target.closest("[data-cmp]");
  if(c){ const n=c.dataset.cmp; if(cmp.includes(n)) cmp=cmp.filter(x=>x!==n); else if(cmp.length<3) cmp.push(n); else return toast("Compare up to 3 cities"); renderPlanner(); return; }
  const d=e.target.closest("[data-city]"); if(d) pickCity(d.dataset.city);
});
$("#cityList").addEventListener("keydown",e=>{ const c=e.target.closest("[data-city]"); if(c&&(e.key==="Enter"||e.key===" ")){ e.preventDefault(); pickCity(c.dataset.city); } });
$("#clearCmp").onclick=()=>{cmp=[];renderPlanner()};
function renderPolicies(){
  const q=$("#polQ").value.trim().toLowerCase();
  const rows=POLICIES.filter(p=>!q||[p.state,p.policy,...p.inc].join(" ").toLowerCase().includes(q));
  $("#polBody").innerHTML=rows.map(p=>`<tr><td><b>${esc(p.state)}</b></td><td>${esc(p.policy)}</td><td><ul>${p.inc.map(i=>`<li>${esc(i)}</li>`).join("")}</ul></td><td>${ext(p.url,p.src)}</td></tr>`).join("")||'<tr><td colspan="4" class="sub">No match.</td></tr>';
}
$("#polQ").addEventListener("input",renderPolicies);

// ---------- my list ----------
let resetArmed=false;
function renderSaved(){
  const rows=store.saved.map(gById).filter(Boolean);
  $("#savedBox").innerHTML=rows.length?`<div class="panel scroll" style="padding:4px 6px"><table><thead><tr><th style="width:36px"></th><th>Company</th><th>Cities</th><th>Status</th><th>My note</th></tr></thead><tbody class="click" id="savedBody">${rows.map(g=>`<tr data-g="${g.id}"><td><button class="star" data-star="${g.id}" aria-pressed="true" aria-label="Remove ${esc(g.name)}">★</button></td><td><b>${esc(g.name)}</b><div class="sub">${esc(g.sector)}</div></td><td>${g.cities.map(esc).join(", ")}</td><td>${statusPill(g.status)}</td><td>${store.notes[g.id]?esc(store.notes[g.id]):'<span class="sub">Click to add a note</span>'}</td></tr>`).join("")}</tbody></table></div>`
    :'<div class="empty">Your list is empty. Click ☆ next to any company in Companies or News to save it here.</div>';
  $("#savedBody")?.addEventListener("click",e=>{ if(e.target.closest("[data-star]")) return; const r=e.target.closest("tr[data-g]"); if(r) openGcc(r.dataset.g); });
}
$("#resetAll").onclick=()=>{
  if(!resetArmed){ resetArmed=true; $("#resetAll").textContent="Click again to confirm"; setTimeout(()=>{resetArmed=false;$("#resetAll").textContent="Clear all my changes"},4000); return; }
  store=BLANK(); persist(); location.reload();
};

// ---------- AI (through the host page's sample capability) with plain fallbacks ----------
let sample=null;
(window.claude?.use?window.claude.use("sample"):Promise.resolve(null)).then(s=>{
  sample=s; $("#aiBadge").textContent=s?"AI on":"AI off · basic mode"; $("#aiBadge").classList.toggle("on",!!s);
}).catch(()=>{$("#aiBadge").textContent="AI off · basic mode"});
const errCopy=c=>({not_granted:"AI was not allowed, so basic mode was used.",rate_limited:"Too many requests. Try again in a minute.",session_expired:"Sign in again, then retry.",refused:"The AI declined this text.",invalid_json:"The AI reply could not be read, so basic mode was used.",prompt_too_large:"That text is too long. Paste a shorter part."}[c]||"The AI could not finish, so basic mode was used.");
function snapshot(){
  const G=GCCS.map(g=>[g.id,g.name,g.hq,g.sector,STATUS[g.status],g.cities.join("/"),g.headcount?g.headcount+" staff ("+(WHO[g.hcType]||"reported")+")":"staff not public"].join("|")).join("\n");
  const E=EVENTS.map(e=>[e.id,e.date,e.gcc,e.company,e.type,e.cityRaw,e.detail].join("|")).join("\n");
  const P=PROVIDERS.map(p=>[p.id,p.name,p.cat,p.eng.length?p.eng.map(x=>`${x.client}${x.gcc?" "+x.gcc:""}: ${x.type} (${LEVEL_LABEL[x.level]})`).join("; "):"no GCC client with public proof"].join("|")).join("\n");
  const C=CITIES.map(c=>[c.name,c.state,"rent ₹"+c.rent+"/sqft/month","GCC talent "+(c.talent?c.talent+"K":"n/a"),c.rule.text].join("|")).join("\n");
  const S=POLICIES.map(p=>[p.state,p.policy,p.inc.join("; ")].join("|")).join("\n");
  return `TODAY: 2026-10-26\nCOMPANIES (id|name|based in|industry|status|cities|India staff)\n${G}\n\nNEWS (id|date|company id|company|what happened|city|detail)\n${E}\n\nPROVIDERS (id|name|type|GCC clients with proof)\n${P}\n\nCITIES\n${C}\n\nSTATE POLICIES\n${S}`;
}
function renderMd(t){
  let h=esc(t).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\[((?:[GPE]\d+)(?:\s*,\s*[GPE]\d+)*)\]/g,(m,ids)=>ids.split(/\s*,\s*/).map(id=>`<button class="cite" data-cite="${id}">${id}</button>`).join(" "));
  let out="",inList=false;
  for(const l of h.split("\n")){const m=l.match(/^\s*[-*•]\s+(.*)/);
    if(m){if(!inList){out+="<ul>";inList=true}out+=`<li>${m[1]}</li>`}
    else{if(inList){out+="</ul>";inList=false} const hd=l.match(/^#+\s+(.*)/); out+=hd?`<h3 style="margin-top:10px">${hd[1]}</h3>`:l.trim()?`<p style="margin:6px 0">${l}</p>`:""}}
  return out+(inList?"</ul>":"");
}
function onCite(e){const b=e.target.closest("[data-cite]"); if(!b) return; const id=b.dataset.cite;
  if(id[0]==="G") openGcc(id); else if(id[0]==="P") openProvider(id); else {const ev=EVENTS.find(x=>x.id===id); if(ev) openGcc(ev.gcc)}}
$("#askOut").addEventListener("click",onCite); $("#briefOut").addEventListener("click",onCite);

const ASK_SAMPLES=["Which companies opened a GCC in Hyderabad?","Which GCCs were sold to IT firms?","Which banks have GCCs in India?","Which providers have official proof of GCC work?"];
$("#askSamples").innerHTML=ASK_SAMPLES.map(q=>`<button class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join("");
$("#askSamples").addEventListener("click",e=>{const b=e.target.closest("[data-q]"); if(b){$("#askQ").value=b.dataset.q; ask()}});
let askCtl=null;
$("#askStop").onclick=()=>askCtl?.abort();
$("#askBtn").onclick=ask;
$("#askQ").addEventListener("keydown",e=>{if(e.key==="Enter") ask()});
const SYN={bank:["banking","bfsi","financial","bank"],banks:["banking","bfsi","financial","bank"],sold:["sold"],opened:["opened","new"],official:["official"]};
function basicAnswer(q){
  const words=q.toLowerCase().replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(w=>w.length>2&&!/^(which|what|who|have|has|the|and|for|with|from|india|gcc|gccs|companies|company|are|does|did|their|that|this|work|proof)$/.test(w));
  const terms=[...new Set(words.flatMap(w=>SYN[w]||[w.replace(/s$/,"")]))];
  if(!terms.length) return '<p class="note">Try a question with a city, industry or company name.</p>';
  const score=t=>terms.filter(w=>t.includes(w)).length;
  const ev=EVENTS.map(e=>({e,s:score([e.company,e.type,e.cityRaw].join(" ").toLowerCase())})).filter(x=>x.s).sort((a,b)=>b.s-a.s);
  const gs=GCCS.map(g=>({g,s:score([g.name,g.sector,g.hq,STATUS[g.status],...g.cities].join(" ").toLowerCase())})).filter(x=>x.s).sort((a,b)=>b.s-a.s);
  const ps=PROVIDERS.filter(p=>p.eng.length).map(p=>({p,s:score([p.name,p.cat,...p.eng.map(x=>x.client+" "+LEVEL_LABEL[x.level])].join(" ").toLowerCase())})).filter(x=>x.s).sort((a,b)=>b.s-a.s);
  const top=Math.max(ev[0]?.s||0,gs[0]?.s||0,ps[0]?.s||0);
  if(!top) return '<p class="note">No matching records. Try a city (Hyderabad), an industry (banking) or a company name.</p>';
  let h='<p class="note">Basic mode (AI is off): the records that best match your words.</p>';
  if(ev[0]?.s===top) h+=`<h3 style="margin-top:8px">News</h3><ul>${ev.filter(x=>x.s===top).slice(0,8).map(({e})=>`<li><b>${esc(e.company)}</b>: ${esc(e.type.toLowerCase())}, ${esc(e.cityRaw)} (${esc(e.date)}) <button class="cite" data-cite="${e.id}">${e.id}</button></li>`).join("")}</ul>`;
  if(gs[0]?.s===top) h+=`<h3 style="margin-top:8px">Companies</h3><ul>${gs.filter(x=>x.s===top).slice(0,10).map(({g})=>`<li><b>${esc(g.name)}</b>, ${g.cities.map(esc).join(", ")} <button class="cite" data-cite="${g.id}">${g.id}</button></li>`).join("")}</ul>`;
  if(ps[0]?.s===top) h+=`<h3 style="margin-top:8px">Providers</h3><ul>${ps.filter(x=>x.s===top).slice(0,8).map(({p})=>`<li><b>${esc(p.name)}</b>: ${p.eng.map(x=>esc(x.client)).join(", ")} <button class="cite" data-cite="${p.id}">${p.id}</button></li>`).join("")}</ul>`;
  return h;
}
async function ask(){
  const q=$("#askQ").value.trim(); if(!q) return;
  if(!sample){ $("#askOut").innerHTML=basicAnswer(q); return; }
  askCtl=new AbortController(); $("#askBtn").disabled=true; $("#askStop").hidden=false;
  $("#askOut").innerHTML='<p class="note">Thinking…</p>';
  const prompt=`You answer questions about Global Capability Centres (GCCs) in India using ONLY the data below.
Rules: cite each record you use by its id in square brackets, one per bracket, like [G4] or [E2] or [P3]. If the data does not answer the question, say so plainly. Use simple words. At most 150 words. Short bullets if useful. No preamble.

DATA
${snapshot()}

QUESTION: ${q}`;
  try{ await sample(prompt,{signal:askCtl.signal,cache:false,onText:({text})=>{$("#askOut").innerHTML=renderMd(text)}}) }
  catch(e){ if(e.code==="cancelled") $("#askOut").innerHTML=e.text?renderMd(e.text):'<p class="note">Stopped.</p>'; else { if(e.code==="not_granted") sample=null; $("#askOut").innerHTML=`<p class="err">${esc(errCopy(e.code))}</p>`+basicAnswer(q);} }
  finally{ $("#askBtn").disabled=false; $("#askStop").hidden=true }
}
function basicBrief(){
  const [a,b,c]=lastPlan; const pol=POLICIES.find(p=>p.state===a.c.state);
  return `<p class="note">Basic mode: written from the planner results without AI.</p>
  <h3>Recommendation</h3><p><b>${esc(a.c.name)}</b> (${esc(a.c.state)}). Alternatives: ${esc(b.c.name)} and ${esc(c.c.name)}.</p>
  <h3>Why</h3><ul><li>${a.c.talent?`${fmt(a.c.talent*1000)}+ people already work in GCCs there.`:"Lower costs than the big cities."}</li><li>Rent is about ₹${a.c.rent} per sq ft a month: about ${cr(a.annualRent)} in year one for ${fmt(a.hc)} people.</li><li>${a.peers.length} companies from our list are already there${a.peers.length?`, including ${a.peers.slice(0,3).map(g=>esc(g.name)).join(", ")}`:""}.</li></ul>
  <h3>Incentives</h3><p>${esc(a.c.rule.text)}${pol?` Also check: ${esc(pol.inc[0])}.`:""}</p>
  <h3>Next steps</h3><ul><li>Get rent quotes from two brokers.</li><li>Confirm policy conditions with the state’s investment office.</li><li>Shortlist partners with official proof in the Providers tab.</li></ul>`;
}
$("#brief").onclick=async()=>{
  if(!lastPlan) return;
  if(!sample){ $("#briefOut").innerHTML=basicBrief(); return; }
  const b=$("#brief"); b.disabled=true; $("#briefOut").innerHTML='<p class="note">Writing…</p>';
  const top=lastPlan.slice(0,3).map(r=>`${r.c.name} (rent ₹${r.c.rent}; year-one rent ${cr(r.annualRent)}; state rent support ${r.sup.amt?cr(r.sup.amt)+"/yr":r.sup.note}; companies already there ${r.peers.map(g=>g.id).join(",")})`).join("; ");
  const prompt=`Write a short, plain-English note for a company planning a GCC in India with ${$("#pHead").value} people in year one, using ONLY the data below. The company is considering ${lastPlan[0].c.name} first.
Cities: ${top}.
Sections with 2–3 short bullets each: **Recommendation**, **Why**, **Incentives to apply for**, **Next steps**. Cite companies as [G..] and providers as [P..]. At most 180 words.

DATA
${snapshot()}`;
  try{ await sample(prompt,{cache:false,onText:({text})=>{$("#briefOut").innerHTML=renderMd(text)}}) }
  catch(e){ if(e.code==="not_granted") sample=null; $("#briefOut").innerHTML=`<p class="err">${esc(errCopy(e.code))}</p>`+basicBrief() }
  finally{ b.disabled=false }
};

// ---------- add from news ----------
const SAMPLE_KEYS=["ev-schwab-hyderabad","ev-bestbuy-tcs","ev-heineken-hyderabad","ev-target-manyata"];
const SAMPLES=Object.fromEntries(SAMPLE_KEYS.map(k=>RAW.events.find(e=>e.id===k)).filter(Boolean).map(e=>[
  e.company.split(" (")[0], `${e.sourceTitle||""}\n\n${e.company} (${e.hqCountry}). ${e.detail} Location: ${e.city}. Reported ${e.date}.\n\nSource: ${e.sourceUrl}`]));
SAMPLES["Unrelated news"]=`The India Meteorological Department said the southwest monsoon is expected to be normal this year, with rainfall at about 105% of the long-period average.`;
$("#samples").innerHTML=Object.keys(SAMPLES).map(k=>`<button class="chip" data-s="${esc(k)}">${esc(k)}</button>`).join("");
const idleIngest=()=>{$("#ingestOut").innerHTML='<h2>Result</h2><div class="empty">Pick an example or paste an article, then click “Read the article”.</div>'};
$("#samples").addEventListener("click",e=>{const b=e.target.closest("[data-s]"); if(b){$("#doc").value=SAMPLES[b.dataset.s]; idleIngest()}});
const CITY_ALIAS={bangalore:"Bengaluru",bengaluru:"Bengaluru",hyderabad:"Hyderabad",pune:"Pune",chennai:"Chennai",gurugram:"Gurugram",gurgaon:"Gurugram",noida:"Noida",delhi:"Delhi",mumbai:"Mumbai",ahmedabad:"Ahmedabad","gift city":"GIFT City",kochi:"Kochi",coimbatore:"Coimbatore",kolkata:"Kolkata",jaipur:"Jaipur",indore:"Indore",visakhapatnam:"Visakhapatnam",mysuru:"Mysuru"};
const cityOf=s=>{if(!s) return null; const l=s.toLowerCase(); for(const k in CITY_ALIAS) if(l.includes(k)) return CITY_ALIAS[k]; return s};
function ruleExtract(t){
  const l=t.toLowerCase(); const city=Object.keys(CITY_ALIAS).find(k=>l.includes(k));
  const hc=(t.match(/~?([\d,]{3,6})\+?\s*(?:staff|professionals|people|employees|roles|jobs|hires|engineers)/i)||[])[1];
  const sq=(t.match(/([\d.,]+)\s*(lakh|M|million)?\s*sq\.?\s*ft/i)||[]);
  const area=sq[1]?Math.round(parseFloat(sq[1].replace(/,/g,""))*({lakh:1e5,m:1e6,million:1e6}[(sq[2]||"").toLowerCase()]||1)):null;
  const known=GCCS.find(g=>norm(g.name).some(w=>w.length>3&&l.includes(w)));
  const co=(t.match(/\n\n([^(\n]+?)\s*\(/)||t.match(/([A-Z][\w'’&.-]+(?:\s[A-Z][\w'’&.-]+){0,3})\s+(?:opens|opened|launches|launched|sets up|to set up|announces|leases|signs)/)||[])[1]||known?.name;
  const type=/transferred|sold|acquire|divest/i.test(t)?"Sold its GCC to an IT firm":/lease|sq ft/i.test(t)&&!/first|new gcc|opened|opens/i.test(t)?"Signed an office lease":/expan|additional|second/i.test(t)?"Expanded":/gcc|capability|technology cent|innovation cent|tech hub/i.test(t)?"Opened a new GCC":null;
  return {company:co?co.trim():null,eventType:co&&type?type:"Not relevant",city:city?CITY_ALIAS[city]:null,headcount:hc?+hc.replace(/,/g,""):null,areaSqft:area,summary:null,evidence:[]};
}
let pending=null;
$("#extract").onclick=async()=>{
  const t=$("#doc").value.trim(); if(!t){$("#extractNote").textContent="Paste an article first.";return}
  const btn=$("#extract"); btn.disabled=true; $("#extractNote").textContent="";
  $("#ingestOut").innerHTML=`<h2>Result</h2><p class="note">${sample?"The AI is reading the article…":"Reading in basic mode…"}</p>`;
  let rec=null, via="basic mode";
  if(sample){
    const prompt=`Read this article about a company and India. Reply with ONLY one JSON object with these keys:
{"company": the company's common name or null, "eventType": one of "Opened a new GCC","Expanded","Signed an office lease","Closed or merged a centre","Sold its GCC to an IT firm","Not relevant",
 "city": Indian city or null, "headcount": number of staff planned or current, or null, "areaSqft": office size in sq ft as a number, or null,
 "summary": one plain sentence of at most 25 words, "evidence": up to 3 short exact quotes from the article that prove the facts}
A GCC is an office a global company opens in India to do its own work. If the article is not about a company opening, growing, moving or selling such a centre in India, use "Not relevant". Use only the article.

ARTICLE:
"""${t.slice(0,12000)}"""`;
    try{ rec=await sample.json(prompt,{modelTier:"quick"}); via="AI" }
    catch(e){ if(e.code==="not_granted") sample=null; $("#extractNote").textContent=errCopy(e.code); rec=null }
  }
  if(!rec||typeof rec!=="object") rec=ruleExtract(t);
  rec.city=cityOf(rec.city);
  pending={rec,match:resolve([rec.company].filter(Boolean)),via,src:(t.match(/https?:\/\/\S+/)||[])[0]||null};
  renderIngest(); btn.disabled=false;
};
function renderIngest(){
  const {rec,match,via}=pending;
  if(rec.eventType==="Not relevant"||!rec.company){ $("#ingestOut").innerHTML=`<h2>Result</h2><div class="match new"><b>Nothing to add.</b> This article is not about a company opening, growing or selling an India centre.</div>`; return; }
  const row=(k,v)=>v==null||v===""?"":`<dt>${k}</dt><dd>${esc(v)}</dd>`;
  const newCity=rec.city&&match&&!match.g.cities.includes(rec.city);
  $("#ingestOut").innerHTML=`<div class="head"><h2>What we found</h2><span class="pill ${via==="AI"?"s-operating":"e-self"}">read by ${esc(via)}</span></div>
  <dl class="kv">${row("Company",rec.company)}${row("What happened",rec.eventType)}${row("City",rec.city)}${row("Staff",rec.headcount&&fmt(rec.headcount))}${row("Office size",rec.areaSqft&&fmt(rec.areaSqft)+" sq ft")}${row("In short",rec.summary)}</dl>
  ${(rec.evidence||[]).length?`<h3>Proof from the article</h3>${rec.evidence.map(q=>`<blockquote>“${esc(q)}”</blockquote>`).join("")}`:""}
  ${match?`<div class="match old"><b>Already in the list: ${esc(match.g.name)}.</b> Adding attaches this news to that company${newCity?` and adds ${esc(rec.city)} to its cities`:""}.</div>`:`<div class="match new"><b>New company.</b> Adding creates a new entry in the list.</div>`}
  <div class="filters"><button class="btn" id="approve">Add to GCC Atlas</button><button class="btn ghost" id="discard">Discard</button></div>`;
  $("#approve").onclick=approve; $("#discard").onclick=()=>{pending=null;$("#ingestOut").innerHTML='<h2>Result</h2><p class="note">Discarded. Nothing was added.</p>'};
}
function approve(){
  const {rec,match,src}=pending; const city=rec.city||"Not stated";
  let g=match?.g;
  if(!g){
    g={id:nextId("G",GCCS),name:rec.company,parent:rec.company,hq:"Not stated",sector:"",entity:null,cities:[city],headcount:null,hcType:null,hcYear:null,
      hcNote:rec.headcount?`Planned staff in the article: ${fmt(rec.headcount)}`:null,est:"2026",funcs:[],status:"entrant",sources:[{url:src,title:"Added from a pasted article",date:"2026-10-26"}]};
    GCCS.push(g); store.added.gccs.push(g);
  } else if(rec.city&&!g.cities.includes(rec.city)){ g.cities.push(rec.city); store.added.cityAdds.push({gcc:g.id,city:rec.city}); }
  const ev={id:nextId("E",EVENTS),company:g.name,hq:g.hq,type:rec.eventType,cityRaw:city,cities:[city],date:"2026-10-26",detail:rec.summary||"Added from a pasted article.",url:src,title:"Pasted article",gcc:g.id};
  EVENTS.unshift(ev); store.added.events.push(ev); persist(); freshIds.add(g.id); freshIds.add(ev.id);
  refreshAll(); toast("Added to GCC Atlas");
  $("#ingestOut").innerHTML=`<h2>Result</h2><div class="match old"><b>Added.</b> ${esc(g.name)} now shows this news. It is highlighted in News &amp; alerts and Companies.</div>
  <div class="filters"><button class="btn" data-go="new">See it in News</button><button class="btn ghost" data-open-g="${g.id}">View company</button></div>`;
  pending=null;
}

// ---------- start ----------
function refreshAll(){
  const cities=[...new Set(GCCS.flatMap(g=>g.cities))].filter(c=>c&&c!=="Not stated").sort();
  fillSelect($("#fCity"),"Any city",[...new Set(["Delhi NCR",...cities.map(cityGroup),...cities])].sort());
  fillSelect($("#fSector"),"Any industry",[...new Set(GCCS.map(g=>g.sector).filter(Boolean))].sort());
  fillSelect($("#sigType"),"Anything that happened",[...new Set(EVENTS.map(e=>e.type))]);
  renderCounts(); renderDash(); renderList(); renderSignals(); renderProviders(); renderPolicies(); renderPlanner(); renderSaved();
}
refreshAll(); idleIngest();
$("#doc").value=Object.values(SAMPLES)[0];
show((location.hash||"").slice(1)||"dash");
