const SUPABASE_URL = 'https://ltyafffwvirfvmjrkzwj.supabase.co/';
const SUPABASE_KEY = 'sb_publishable_iFo9WnFVlvo85S5_DpzKkQ_s8oSS05E';
const sb = window.supabase?.createClient(SUPABASE_URL, SUPABASE_KEY);
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const view=$('#view'), title=$('#screenTitle');
const state={tab:'dashboard',query:'',data:emptySnapshot(),saldoByOp:new Map()};

/* ---------- data layer (bez zmian) ---------- */
function emptySnapshot(){return {personel:[],firmy:[],projekty:[],zaliczki:[],kosztyStale:[],dokumenty:[],urlopy:[],ustawienia:[defaultSettings()]}}
function defaultSettings(){const d=isoDate();return {dataStartowa:d,dataWidokuOd:d,dataWidokuDo:addMonths(d,12),saldoKontoGlowne:0,saldoKontoVat:0,saldoKasaGotowkowa:0}}
function isoDate(d=new Date()){return new Date(d).toISOString().slice(0,10)}
function addMonths(date,n){let d=new Date(date);d.setMonth(d.getMonth()+n);return isoDate(d)}
function esc(s=''){return String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
function money(n){return (Number(n)||0).toLocaleString('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0})}
function fmtDate(d){return d?new Date(d).toLocaleDateString('pl-PL'):'—'}
function net(d){return Number(d.kwotaNetto)||0} function vat(d){return net(d)*(Number(d.stawkaVat)||0)/100} function gross(d){return net(d)+vat(d)}
function personName(id){const p=state.data.personel.find(x=>x.id===id);return p?`${p.imie||''} ${p.nazwisko||''}`.trim():'—'}
function firmName(id){return state.data.firmy.find(x=>x.id===id)?.nazwa||'—'}
function projectName(id){return state.data.projekty.find(x=>x.id===id)?.nazwa||'—'}
function partyName(d){return d.rodzajStronyRaw==='Osoba'?personName(d.osobaId):firmName(d.firmaId)}
function normalize(x={}){const e=emptySnapshot();return {...e,...x,personel:x.personel||[],firmy:x.firmy||[],projekty:x.projekty||[],zaliczki:x.zaliczki||[],kosztyStale:x.kosztyStale||[],dokumenty:x.dokumenty||[],urlopy:x.urlopy||[],ustawienia:x.ustawienia?.length?x.ustawienia:e.ustawienia}}
async function requireSession(){const {data:{session},error}=await sb.auth.getSession(); if(error||!session) throw new Error('Brak sesji. Zaloguj się ponownie.'); return session}
async function downloadActive(){await requireSession(); const {data:st,error:e1}=await sb.from('app_snapshot_state').select('active_snapshot_id').eq('id',1).single(); if(e1) throw e1; if(!st?.active_snapshot_id) throw new Error('Brak aktywnego snapshota.'); const {data,error}=await sb.from('app_snapshot_versions').select('payload').eq('id',st.active_snapshot_id).single(); if(error) throw error; state.data=normalize(data.payload); localStorage.setItem('bb.cashflow.readonly.snapshot', JSON.stringify(state.data));}
async function boot(){try{const {data:{session}}=await sb.auth.getSession(); if(session){await downloadActive(); showApp(); render()} }catch(e){$('#loginStatus').textContent=e.message}}
$('#loginForm').onsubmit=async e=>{e.preventDefault(); const f=new FormData(e.currentTarget); $('#loginStatus').textContent='Logowanie i pobieranie danych…'; try{const {error}=await sb.auth.signInWithPassword({email:f.get('email'),password:f.get('password')}); if(error) throw error; await downloadActive(); showApp(); render()}catch(err){$('#loginStatus').textContent=err.message}};
function showApp(){$('#loginScreen').classList.add('hidden');$('#app').classList.remove('hidden')}

/* ---------- nawigacja: dolny pasek + sheet ---------- */
const PRIMARY=['dashboard','cashflow','documents','projects'];
function setSheet(open){$('#sheet').classList.toggle('open',open);$('#scrim').classList.toggle('open',open);$('#sheet').setAttribute('aria-hidden',String(!open))}
function pick(tab){state.tab=tab;state.query='';setSheet(false);render();window.scrollTo({top:0,behavior:'instant'})}
$('#tabbar').onclick=e=>{const b=e.target.closest('button[data-tab]'); if(b) pick(b.dataset.tab)};
$('#moreButton').onclick=()=>setSheet(true);
$('#sheet').onclick=e=>{const b=e.target.closest('button[data-tab]'); if(b) pick(b.dataset.tab)};
$('#scrim').onclick=()=>setSheet(false);
$('#logoutButton').onclick=async()=>{await sb.auth.signOut(); localStorage.removeItem('bb.cashflow.readonly.snapshot'); location.reload()};
async function doRefresh(btn){if(btn)btn.disabled=true; try{await downloadActive();render()}catch(e){alert(e.message)} finally{if(btn)btn.disabled=false}}
$('#refreshButton').onclick=()=>doRefresh();
$('#refreshButton2').onclick=()=>{setSheet(false);doRefresh($('#refreshButton2'))};

function render(){
  $$('#tabbar [data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  $('#moreButton').classList.toggle('active',!PRIMARY.includes(state.tab));
  const names={dashboard:'Pulpit',cashflow:'Cashflow',documents:'Dokumenty',projects:'Projekty',personel:'Personel',firms:'Firmy',fixedCosts:'Koszty stałe',advances:'Zaliczki',leaves:'Urlopy'};
  title.textContent=names[state.tab];
  ({dashboard,cashflow,documents,projects,personel,firms,fixedCosts,advances,leaves})[state.tab]();
}

/* ---------- helpers UI ---------- */
function initials(s=''){return (String(s).trim().split(/\s+/).map(w=>w[0]||'').slice(0,2).join('')||'•').toUpperCase()}
function emptyHtml(t){return `<div class="empty"><div class="ei"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aab3c2" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg></div><p>${esc(t)}</p></div>`}
function searchBar(){return `<div class="search-wrap"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg><input class="search" placeholder="Szukaj…" value="${esc(state.query)}"></div>`}
function bindSearch(){ $('.search')?.addEventListener('input',e=>{state.query=e.target.value;renderList()}) }
let _lastList=null;
function renderList(){ if(_lastList) _lastList(); }

function listView(rows,onClick){
  _lastList=()=>listView(rows,onClick);
  const q=state.query.toLowerCase();
  const f=rows.filter(r=>JSON.stringify(r.raw).toLowerCase().includes(q));
  view.innerHTML = searchBar() + (f.length
    ? `<div class="list">${f.map(r=>`<button class="lrow" data-id="${esc(r.id)}"><span class="lead ${r.lead.cls}">${esc(r.lead.txt)}</span><span class="lmain"><span class="ltitle">${esc(r.title)}</span><span class="lsub">${r.subHtml}</span></span><span class="lend">${r.endHtml}</span></button>`).join('')}</div>`
    : emptyHtml('Brak pozycji'));
  bindSearch();
  $$('.lrow[data-id]').forEach(el=>el.onclick=()=>onClick(rows.find(r=>r.id===el.dataset.id).raw));
}

/* ---------- PULPIT ---------- */
function stat(k,v,dot,cls){return `<div class="stat"><div class="k"><span class="dot ${dot}"></span>${k}</div><div class="v num ${cls||''}">${v}</div></div>`}
function dashboard(){
  _lastList=null;
  const docs=state.data.dokumenty, projects=state.data.projekty;
  const income=docs.filter(d=>d.typRaw==='Przychód').reduce((s,d)=>s+net(d),0);
  const costs=docs.filter(d=>['Wydatek','Personel'].includes(d.typRaw)).reduce((s,d)=>s+net(d),0);
  const ops=calcCashflow().slice(0,5);
  view.innerHTML=`
    <div class="hero">
      <div class="label">Bilans netto</div>
      <div class="big num">${money(income-costs)}</div>
      <div class="range"><b>${docs.length} dokumentów</b><b>${projects.length} projektów</b></div>
    </div>
    <div class="stats">
      ${stat('Przychody netto',money(income),'g','plus')}
      ${stat('Koszty netto',money(costs),'r','minus')}
      ${stat('Dokumenty',docs.length,'b')}
      ${stat('Projekty',projects.length,'n')}
    </div>
    <div class="section-title"><h2>Najbliższe operacje</h2><button class="secondary" data-go>Cashflow</button></div>
    <div class="card">${ops.length?ops.map(opRow).join(''):emptyHtml('Brak operacji.')}</div>`;
  $('[data-go]')?.addEventListener('click',()=>pick('cashflow'));
  bindOpRows();
}
function opRow(o){const inn=o.kwota>=0;return `<div class="op-row" data-op="${o.id}"><div class="om"><strong>${esc(o.nazwa)}</strong><span>${fmtDate(o.date)} · ${esc(o.opis||'')}</span></div><div class="oa ${inn?'plus':'minus'} num">${money(o.kwota)}</div></div>`}

/* ---------- CASHFLOW ---------- */
function calcCashflow(){const u=state.data.ustawienia[0]||defaultSettings(), from=new Date(u.dataWidokuOd||u.dataStartowa), to=new Date(u.dataWidokuDo||addMonths(from,12)); const ops=[]; state.data.dokumenty.forEach(d=>{if(!['Przychód','Wydatek','Personel'].includes(d.typRaw)||d.rodzajRozliczeniaRaw==='Zaliczka'||d.kosztStalyId)return; const date=new Date(d.dataPlatnosci||d.dataWymagalnosci); if(date>=from&&date<=to){const sign=d.typRaw==='Przychód'?1:-1; ops.push({id:'dok-'+d.id,kind:'document',source:d,date,nazwa:d.nazwaWewnetrzna||d.nazwaKsiegowa||'Dokument',opis:partyName(d),kwota:sign*gross(d),typ:d.typRaw,konto:d.rodzajStronyRaw==='Osoba'?state.data.personel.find(p=>p.id===d.osobaId)?.numerKontaBankowego:state.data.firmy.find(f=>f.id===d.firmaId)?.numerKontaBankowego})}}); state.data.zaliczki.forEach(z=>{const date=new Date(z.dataWyplaty); if(date>=from&&date<=to&&Number(z.kwota)>0) ops.push({id:'zal-'+z.id,kind:'advance',source:z,date,nazwa:z.nazwa||'Zaliczka',opis:personName(z.pracownikId),kwota:-Number(z.kwota),typ:'Zaliczka',konto:state.data.personel.find(p=>p.id===z.pracownikId)?.numerKontaBankowego})}); state.data.kosztyStale.filter(k=>k.aktywny!==false).forEach(k=>{let d=new Date(k.pierwszyMiesiac||from); d.setDate(Number(k.dzienMiesiaca)||1); const end=k.bezOstatniegoMiesiaca?to:new Date(k.ostatniMiesiac||to); while(d<=to&&d<=end){if(d>=from){const v=(Number(k.kwotaNetto)||0)*(k.rodzajRaw==='Personel'?1:(1+(Number(k.stawkaVat)||0)/100)); ops.push({id:'koszt-'+k.id+'-'+isoDate(d),kind:'fixedCost',source:k,date:new Date(d),nazwa:k.nazwa||'Koszt stały',opis:k.rodzajRaw,kwota:-v,typ:'Koszt stały',konto:k.rodzajRaw==='Personel'?state.data.personel.find(p=>p.id===k.osobaId)?.numerKontaBankowego:state.data.firmy.find(f=>f.id===k.dostawcaId)?.numerKontaBankowego})} d.setMonth(d.getMonth()+1)}}); return ops.sort((a,b)=>a.date-b.date)}
function cashflow(){
  _lastList=null;
  const u=state.data.ustawienia[0]||defaultSettings();
  let saldo=Number(u.saldoKontoGlowne||0)+Number(u.saldoKontoVat||0)+Number(u.saldoKasaGotowkowa||0);
  const ops=calcCashflow();
  state.saldoByOp.clear();
  let rows='', lastDay='', open=false;
  ops.forEach(o=>{
    saldo+=o.kwota; state.saldoByOp.set(o.id,saldo);
    const day=fmtDate(o.date);
    if(day!==lastDay){ if(open) rows+='</div>'; rows+=`<div class="tday">${day}</div><div class="tgroup">`; open=true; lastDay=day; }
    const inn=o.kwota>=0;
    rows+=`<button class="cfrow" data-op="${o.id}"><span class="tdir ${inn?'in':'out'}">${inn?'+':'−'}</span><span class="cmain"><span class="ctitle">${esc(o.nazwa)}</span><span class="csub">${esc(o.typ)} · ${esc(o.opis||'')}</span></span><span class="cend"><span class="camt ${inn?'plus':'minus'} num">${money(o.kwota)}</span><span class="cbal num">${money(saldo)}</span></span></button>`;
  });
  if(open) rows+='</div>';
  view.innerHTML=`
    <div class="hero">
      <div class="label">Saldo startowe</div>
      <div class="big num">${money(Number(u.saldoKontoGlowne||0)+Number(u.saldoKontoVat||0)+Number(u.saldoKasaGotowkowa||0))}</div>
      <div class="range"><b>${fmtDate(u.dataWidokuOd)}</b><span>→</span><b>${fmtDate(u.dataWidokuDo)}</b></div>
    </div>
    ${ops.length?`<div class="timeline">${rows}</div>`:emptyHtml('Brak operacji w okresie.')}`;
  bindOpRows();
}

/* ---------- LISTY ---------- */
function documents(){listView(state.data.dokumenty.map(d=>{const inc=d.typRaw==='Przychód';const cls=inc?'g':(['Wydatek','Personel'].includes(d.typRaw)?'r':'n');return {id:d.id,raw:d,lead:{txt:initials(partyName(d)),cls},title:d.nazwaWewnetrzna||d.nazwaKsiegowa||'—',subHtml:`<span class="chip ${cls}">${esc(d.typRaw||'—')}</span><span>${esc(projectName(d.projektId))}</span>`,endHtml:`<span class="lamt ${inc?'plus':'minus'} num">${money(gross(d))}</span><span class="lmeta">${fmtDate(d.dataWymagalnosci)}</span>`}}), openDocument)}
function projects(){listView(state.data.projekty.map(p=>{const docs=state.data.dokumenty.filter(d=>d.projektId===p.id);const bal=docs.reduce((s,d)=>s+(d.typRaw==='Przychód'?net(d):-net(d)),0);return {id:p.id,raw:p,lead:{txt:initials(p.nazwa),cls:bal>=0?'g':'r'},title:p.nazwa||'—',subHtml:`<span class="chip n">${esc(p.dzialRaw||'—')}</span><span>${esc(p.statusRaw||'—')}</span>`,endHtml:`<span class="lamt ${bal>=0?'plus':'minus'} num">${money(bal)}</span><span class="lmeta">${docs.length} dok.</span>`}}), openProject)}
function personel(){listView(state.data.personel.map(p=>({id:p.id,raw:p,lead:{txt:initials(`${p.imie||''} ${p.nazwisko||''}`),cls:'b'},title:`${p.imie||''} ${p.nazwisko||''}`.trim()||'—',subHtml:`<span>${esc(p.email||'—')}</span>`,endHtml:`<span class="lmeta">${esc(p.numerTelefonu||'')}</span>`})), openPerson)}
function firms(){listView(state.data.firmy.map(f=>({id:f.id,raw:f,lead:{txt:initials(f.nazwa),cls:'n'},title:f.nazwa||'—',subHtml:`<span>${f.nip?('NIP '+esc(f.nip)):'—'}</span>`,endHtml:`<span class="lmeta">${esc(f.numerTelefonu||f.email||'')}</span>`})), openFirm)}
function fixedCosts(){listView(state.data.kosztyStale.map(k=>{const on=k.aktywny!==false;const kwota=(Number(k.kwotaNetto)||0)*(1+(Number(k.stawkaVat)||0)/100);return {id:k.id,raw:k,lead:{txt:initials(k.nazwa),cls:on?'r':'n'},title:k.nazwa||'—',subHtml:`<span class="chip ${k.rodzajRaw==='Personel'?'b':'n'}">${esc(k.rodzajRaw||'—')}</span><span>dzień ${esc(k.dzienMiesiaca||'—')}</span>`,endHtml:`<span class="lamt minus num">${money(kwota)}</span><span class="lmeta">${on?'aktywny':'wstrzymany'}</span>`}}), openFixedCost)}
function advances(){listView(state.data.zaliczki.map(z=>({id:z.id,raw:z,lead:{txt:initials(z.nazwa||personName(z.pracownikId)),cls:'g'},title:z.nazwa||'—',subHtml:`<span>${esc(personName(z.pracownikId))} · ${esc(projectName(z.projektId))}</span>`,endHtml:`<span class="lamt minus num">${money(z.kwota)}</span><span class="lmeta">${esc(z.statusRaw||'—')}</span>`})), openAdvance)}
function leaves(){listView(state.data.urlopy.map(l=>({id:l.id,raw:l,lead:{txt:initials(personName(l.pracownikId)),cls:'b'},title:personName(l.pracownikId),subHtml:`<span>${fmtDate(l.dataOd)} – ${fmtDate(l.dataDo)}</span>`,endHtml:`<span class="lamt num">${esc(l.liczbaDniRoboczych||0)} dni</span><span class="lmeta">${esc(l.statusRaw||'—')}</span>`})), openLeave)}

/* ---------- MODALE ---------- */
function bindOpRows(){$$('[data-op]').forEach(el=>el.onclick=()=>openTransfer(calcCashflow().find(o=>o.id===el.dataset.op)))}
function modal(t,html){$('#modalTitle').textContent=t; $('#modalBody').innerHTML=html; $('#modal').showModal()}
function detail(rows){return `<div class="detail">${rows.filter(r=>r[1]!==undefined&&r[1]!==null&&r[1]!==''&&r[1]!=='—').map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`}
function openTransfer(o){if(!o)return; const out=o.kwota<0; modal('Widok przelewu', `<div class="transfer-hero"><div class="th-amt num ${out?'minus':'plus'}">${money(Math.abs(o.kwota))}</div><div class="th-dir">${out?'Do zapłaty':'Wpływ'}</div></div>`+detail([['Typ',o.typ],['Nazwa',o.nazwa],['Odbiorca / nadawca',o.opis],['Data',fmtDate(o.date)],['Numer konta',o.konto||'brak w danych'],['Saldo po operacji',money(state.saldoByOp.get(o.id))]]) + `<p class="transfer-note">Ten ekran jest tylko do odczytu — nie wykonuje przelewu i nie zapisuje zmian.</p>`)}
function openDocument(d){modal('Dokument', detail([['Nazwa wewnętrzna',d.nazwaWewnetrzna],['Nazwa księgowa',d.nazwaKsiegowa],['Typ',d.typRaw],['Dokument',d.typDokumentuRaw],['Kontrahent',partyName(d)],['Projekt',projectName(d.projektId)],['Netto',money(d.kwotaNetto)],['VAT',`${d.stawkaVat||0}%`],['Brutto',money(gross(d))],['Rozliczenie',d.rodzajRozliczeniaRaw],['Data sprzedaży',fmtDate(d.dataSprzedazy)],['Termin',fmtDate(d.dataWymagalnosci)],['Data płatności',fmtDate(d.dataPlatnosci)],['Treść / notatki',d.trescUmowy]]))}
function openProject(p){modal('Projekt', detail([['Nazwa',p.nazwa],['Dział',p.dzialRaw],['Status',p.statusRaw],['Utworzono',fmtDate(p.utworzono)]]))}
function openPerson(p){modal('Personel', detail([['Imię',p.imie],['Nazwisko',p.nazwisko],['Email',p.email],['Telefon',p.numerTelefonu],['Konto bankowe',p.numerKontaBankowego],['PESEL',p.pesel],['Urząd skarbowy',p.urzadSkarbowy],['Adres',p.adresZamieszkania]]))}
function openFirm(f){modal('Firma', detail([['Nazwa',f.nazwa],['NIP',f.nip],['REGON',f.regon],['KRS',f.krs],['Email',f.email],['Telefon',f.numerTelefonu],['Konto bankowe',f.numerKontaBankowego],['Adres',f.adres]]))}
function openFixedCost(k){modal('Koszt stały', detail([['Nazwa',k.nazwa],['Rodzaj',k.rodzajRaw],['Kwota netto',money(k.kwotaNetto)],['VAT',`${k.stawkaVat||0}%`],['Rozliczenie',k.rodzajRozliczeniaRaw],['Dzień miesiąca',k.dzienMiesiaca],['Pierwszy miesiąc',fmtDate(k.pierwszyMiesiac)],['Ostatni miesiąc',k.bezOstatniegoMiesiaca?'bez końca':fmtDate(k.ostatniMiesiac)],['Aktywny',k.aktywny!==false?'Tak':'Nie']]))}
function openAdvance(z){modal('Zaliczka', detail([['Nazwa',z.nazwa],['Kwota',money(z.kwota)],['Status',z.statusRaw],['Pracownik',personName(z.pracownikId)],['Projekt',projectName(z.projektId)],['Data wypłaty',fmtDate(z.dataWyplaty)],['Termin rozliczenia',fmtDate(z.terminRozliczenia)],['Data zwrotu',fmtDate(z.dataZwrotu)]]))}
function openLeave(l){modal('Urlop', detail([['Pracownik',personName(l.pracownikId)],['Od',fmtDate(l.dataOd)],['Do',fmtDate(l.dataDo)],['Dni robocze',l.liczbaDniRoboczych],['Status',l.statusRaw]]))}

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
boot();
