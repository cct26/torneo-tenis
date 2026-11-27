{
// ---------- utilidades ----------
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim();
const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'x';
const ckey=c=>norm(c).toUpperCase().replace(/[^A-Z0-9]/g,'')||'X';
const clone=o=>JSON.parse(JSON.stringify(o||{}));
const ORD=['ABIERTA','AA','A','AB','B','C','D','E'];
const RAMA={V:'Varonil',F:'Femenil'},MODS={S:'Singles',D:'Dobles'};
const DOW=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const fmtF=f=>{if(!f)return 'Sin fecha';const d=new Date(f+'T12:00');return isNaN(d)?f:`${DOW[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]}`};
const nombreE=e=>e?(e.j2?e.j1+' / '+e.j2:e.j1):'';
const pct=v=>(v*100).toFixed(0)+'%';

let db=null,dl=null,assets=null,canW=false;
const S={tid:'',T:{},C:{},R:{},app:{},view:'S',mod:'S',rama:'V',sub:'partidos',cat:'',fecha:'',fcat:'',q:'',edG:'',imp:null,delG:'',msg:''};
try{S.q=localStorage.getItem('cct-q')||''}catch(e){}
$('q').value=S.q;
const hit=n=>S.q&&norm(n).includes(norm(S.q));
const nm=n=>{n=String(n??'');if(!hit(n))return esc(n);const i=norm(n).indexOf(norm(S.q));return esc(n.slice(0,i))+'<mark>'+esc(n.slice(i,i+S.q.length))+'</mark>'+esc(n.slice(i+S.q.length))};
const setSt=t=>{$('st').textContent=t||''};

// ---------- marcador ----------
function parse(s){const t=String(s||'').trim().split(/[\s,;]+/).filter(Boolean);if(!t.length||t.length>3)return null;const sets=[];
  for(const x of t){const m=x.match(/^(\d{1,2})[-/](\d{1,2})(\(\d+\))?$/);if(!m)return null;const a=+m[1],b=+m[2];if(a===b)return null;sets.push([a,b])}
  const wa=sets.filter(x=>x[0]>x[1]).length,wb=sets.length-wa;if(wa===wb)return null;return{sets,w:wa>wb?'a':'b'}}
function outcome(r){if(!r)return null;
  if(r.wo==='a'||r.wo==='b'){const a=r.wo==='a';return{w:r.wo,wo:1,sa:a?2:0,sb:a?0:2,ga:a?12:0,gb:a?0:12}}
  const p=parse(r.s);if(!p)return null;let sa=0,sb=0,ga=0,gb=0;
  p.sets.forEach(([a,b],i)=>{a>b?sa++:sb++;if(i===2&&Math.max(a,b)>=10){a>b?ga++:gb++}else{ga+=a;gb+=b}});
  return{w:p.w,sa,sb,ga,gb}}
const scoreTxt=r=>r.virt?'W.O.<small>abandono</small>':r.wo?'W.O.'+(r.ab?'<small>default</small>':''):esc(String(r.s).replace(/[,;]+/g,' '));

// ---------- modelo ----------
const K=()=>S.mod+S.rama;
const base=k=>({mod:k[0],rama:k[1],entradas:{},grupos:{},partidos:{},ko:{},llaves:{}});
const cu=k=>S.C[k]||base(k);
function catsOf(c){const set=new Set();Object.values(c.entradas||{}).forEach(e=>e.cat&&set.add(e.cat));Object.values(c.grupos||{}).forEach(g=>g.cat&&set.add(g.cat));
  return[...set].sort((a,b)=>{const ia=ORD.indexOf(ckey(a)),ib=ORD.indexOf(ckey(b));return(ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b)})}
let MC={};
function M(k=K()){if(MC[k])return MC[k];const c=cu(k),E=c.entradas||{},cs=catsOf(c);
  const G=Object.entries(c.grupos||{}).map(([id,g])=>({id,cat:g.cat,n:+g.n||0,m:(g.m||[]).slice(),ms:[]})).sort((x,y)=>cs.indexOf(x.cat)-cs.indexOf(y.cat)||x.n-y.n);
  const gi=Object.fromEntries(G.map(g=>[g.id,g])),GM=[];
  for(const[pid,p]of Object.entries(c.partidos||{})){const g=gi[p.g];if(!g)continue;const ea=g.m[p.a-1],eb=g.m[p.b-1];if(!ea||!eb||!E[ea]||!E[eb])continue;
    const m={k,pid,rid:k+'.'+pid,g:g.id,cat:g.cat,n:g.n,a:p.a,b:p.b,ea,eb,ja:nombreE(E[ea]),jb:nombreE(E[eb]),f:p.f||'',h:p.h||'',cn:p.c||'',st:p.st||'',rep:!!p.rep};g.ms.push(m);GM.push(m)}
  G.forEach(g=>g.ms.sort(byWhen));
  const o={k,c,E,cs,G,GM,RET:{},RETS:{}};
  for(const m of GM){const r=res(m);if(r&&r.ab&&(r.wo==='a'||r.wo==='b')){const lo=r.wo==='a'?m.eb:m.ea;(o.RET[m.g]=o.RET[m.g]||new Set()).add(lo);(o.RETS[m.g]=o.RETS[m.g]||{})[lo]=m}}
  MC[k]=o;return o}
const byWhen=(x,y)=>(x.f||'9999').localeCompare(y.f||'9999')||(x.h||'99').localeCompare(y.h||'99');
function res(m){const r=S.R[m.rid];return r&&r.a===m.ea&&r.b===m.eb&&outcome(r)?r:null}
function eff(mm,m){const r=res(m);if(r)return r;if(m.ko)return null;const s=mm.RET[m.g];if(s&&s.has(m.ea)!==s.has(m.eb))return{wo:s.has(m.ea)?'b':'a',virt:1};return null}
function tabla(mm,g){const st=[];g.m.forEach((e,i)=>{if(e&&mm.E[e])st.push({i:i+1,e,n:nombreE(mm.E[e]),pj:0,pg:0,sg:0,sj:0,jg:0,jj:0})});
  const by=Object.fromEntries(st.map(s=>[s.i,s])),h={};
  for(const m of g.ms){const o=outcome(eff(mm,m));if(!o)continue;const A=by[m.a],B=by[m.b];if(!A||!B)continue;
    A.pj++;B.pj++;(o.w==='a'?A:B).pg++;A.sg+=o.sa;B.sg+=o.sb;A.sj+=o.sa+o.sb;B.sj+=o.sa+o.sb;A.jg+=o.ga;B.jg+=o.gb;A.jj+=o.ga+o.gb;B.jj+=o.ga+o.gb;
    h[m.a+'>'+m.b]=o.w==='a';h[m.b+'>'+m.a]=o.w==='b'}
  const ret=mm.RET[g.id]||new Set();
  st.forEach(s=>{s.ps=s.sj?s.sg/s.sj:0;s.pjg=s.jj?s.jg/s.jj:0;s.ret=ret.has(s.e)});
  const hh=(x,y)=>{const k=x.i+'>'+y.i;return k in h?(h[k]?-1:1):0},cnt=pg=>st.filter(s=>s.pg===pg).length;
  st.sort((x,y)=>(x.ret-y.ret)||y.pg-x.pg||(cnt(x.pg)===2?hh(x,y):0)||y.ps-x.ps||y.pjg-x.pjg||hh(x,y)||x.i-y.i);
  st.forEach((s,k)=>s.pos=k+1);
  const done=g.ms.length>0&&g.ms.every(m=>outcome(eff(mm,m)));
  return{st,done,any:g.ms.some(m=>outcome(eff(mm,m)))}}
function tamDef(mm,cat){const n=mm.G.filter(g=>g.cat===cat).length;if(n<=1)return 0;let t=2;while(t<n)t*=2;return Math.max(t,4)}
function clasif(mm,cat){const L=(mm.c.llaves||{})[ckey(cat)]||{},tam=L.tam!==undefined&&L.tam!==null&&L.tam!==''?+L.tam:tamDef(mm,cat);
  const T=mm.G.filter(g=>g.cat===cat).map(g=>({g,...tabla(mm,g)}));
  const cmp=(x,y)=>y.s.pg/(y.s.pj||1)-x.s.pg/(x.s.pj||1)||y.s.ps-x.s.ps||y.s.pjg-x.s.pjg||x.g-y.g;
  let out=[];for(let p=0;p<6&&out.length<tam;p++){const tier=T.filter(t=>t.st[p]&&!t.st[p].ret).map(t=>({s:t.st[p],g:t.g.n,lab:(p+1)+'º G'+t.g.n})).sort(cmp);out=out.concat(tier)}
  return{list:out.slice(0,tam).map(x=>({e:x.s.e,n:x.s.n,lab:x.lab,g:x.g})),done:T.length>0&&T.every(t=>t.done),tam,T}}
function orden(n){if(n===1)return[1];return orden(n/2).flatMap(x=>[x,n+1-x])}
function slots(mm,cat){const c=clasif(mm,cat),L=(mm.c.llaves||{})[ckey(cat)];
  if(L&&Array.isArray(L.sem)&&L.sem.length===c.tam)return{sl:L.sem.map(e=>e&&mm.E[e]?{e,n:nombreE(mm.E[e]),lab:''}:null),fija:true,c};
  const sl=orden(c.tam||1).map(k=>c.list[k-1]||null);if(!c.tam)return{sl:[],fija:false,c};
  for(let i=0;i<sl.length;i+=2){const a=sl[i],b=sl[i+1];if(a&&b&&a.g===b.g){for(let j=1;j<sl.length;j+=2){if(j===i+1)continue;const o=sl[j-1],x=sl[j];if(x&&o&&x.g!==a.g&&o.g!==b.g){sl[i+1]=x;sl[j]=b;break}}}}
  return{sl,fija:false,c}}
function rondas(mm,cat){const{sl}=slots(mm,cat);let ent=sl.map(x=>x?x.e:null),rs=[],r=0;const ck=ckey(cat),KO=mm.c.ko||{};
  while(ent.length>1){const ms=[],tot=ent.length/2;for(let k=0;k<ent.length;k+=2){const pid=`K-${ck}-${r}-${k/2}`,ea=ent[k],eb=ent[k+1],p=KO[pid]||{};
      const m={k:mm.k,pid,rid:mm.k+'.'+pid,ko:true,cat,ronda:rname(tot),ea,eb,ja:ea?nombreE(mm.E[ea]):'',jb:eb?nombreE(mm.E[eb]):'',f:p.f||'',h:p.h||'',cn:p.c||'',st:p.st||'',rep:!!p.rep};
      const o=(ea&&eb)?outcome(res(m)):null;m.res=o?res(m):null;
      m.w=o?(o.w==='a'?ea:eb):(r===0&&ea&&!eb?ea:(r===0&&eb&&!ea?eb:null));ms.push(m)}
    rs.push(ms);ent=ms.map(m=>m.w);r++}
  return rs}
const rname=n=>({1:'Final',2:'Semifinal',4:'Cuartos',8:'Octavos'})[n]||'Ronda';
function puntos(mm,cat,rs){const out=[];
  if(rs.length){const fin=rs[rs.length-1][0];
    if(fin.w&&fin.ea&&fin.eb){out.push([fin.w,'Campeón',1000]);out.push([fin.w===fin.ea?fin.eb:fin.ea,'Finalista',800])}
    if(rs.length>1)for(const m of rs[rs.length-2])if(m.w&&m.ea&&m.eb)out.push([m.w===m.ea?m.eb:m.ea,'Semifinalista',600])}
  else{const gs=mm.G.filter(g=>g.cat===cat);if(gs.length===1){const t=tabla(mm,gs[0]);if(t.done){const L=['Campeón','Finalista','Semifinalista','Semifinalista'],P=[1000,800,600,600];t.st.slice(0,4).forEach((s,i)=>out.push([s.e,L[i],P[i]]))}}}
  return out.map(([e,l,p])=>[nombreE(mm.E[e]),l,p])}
function koMatches(mm,real){return mm.cs.flatMap(cat=>{const fija=real?slots(mm,cat).fija:true;return rondas(mm,cat).flat().filter(m=>m.ea&&m.eb&&(fija||m.f||res(m)))})}

// ---------- escritura ----------
const Qw={};const serial=(p,fn)=>(Qw[p]=(Qw[p]||Promise.resolve()).then(fn,fn));
const cRef=k=>db.doc(`torneos/${S.tid}/cuadros/${k}`);
function fail(e){setSt(e&&e.code==='invalid_argument'?'No tienes permiso para editar.':'No se pudo guardar. Revisa tu conexión e intenta de nuevo.')}
function mut(k,fn){const d=Object.assign(base(k),clone(S.C[k]));fn(d);S.C[k]=d;MC={};render();return serial(cRef(k).path,()=>cRef(k).set(d)).catch(fail)}
function merge(a,b){for(const[k,v]of Object.entries(b)){if(v&&typeof v==='object'&&!Array.isArray(v)&&a[k]&&typeof a[k]==='object')merge(a[k],v);else a[k]=v}return a}
function upd(k,obj){const had=!!S.C[k];S.C[k]=merge(Object.assign(base(k),clone(S.C[k])),clone(obj));MC={};render();
  return serial(cRef(k).path,()=>had?cRef(k).update(obj):cRef(k).set(S.C[k])).catch(fail)}
function ensureRR(d,gid){const g=d.grupos[gid];if(!g)return;const n=g.m.length;d.partidos=d.partidos||{};
  for(const[pid,p]of Object.entries(d.partidos))if(p.g===gid&&(p.a>n||p.b>n))delete d.partidos[pid];
  const has=new Set(Object.values(d.partidos).filter(p=>p.g===gid).map(p=>Math.min(p.a,p.b)+'v'+Math.max(p.a,p.b)));
  for(let a=1;a<=n;a++)for(let b=a+1;b<=n;b++)if(!has.has(a+'v'+b))d.partidos[`${gid}-${a}v${b}`]={g:gid,a,b,f:'',h:'',c:''}}

// ---------- vistas ----------
function rowMatch(mm,m,showWhen){const r=eff(mm,m),o=outcome(r),ci=mm.cs.indexOf(m.cat)%5;
  const pa=`<span class="${o&&o.w==='a'?'w':''}">${nm(m.ja)}</span>`,pb=`<span class="${o&&o.w==='b'?'w':''}">${nm(m.jb)}</span>`;
  const sc=o?`<span class="sc">${scoreTxt(r)}</span>`:`<span class="sc ${canW?'pend':'no'}">${canW?'Capturar':'Pendiente'}</span>`;
  const lab=m.ko?`${esc(m.cat)} · ${m.ronda}`:`Cat. ${esc(m.cat)} · Grupo ${m.n} · ${m.a} vs ${m.b}`;
  const when=showWhen?` · ${fmtF(m.f)}${m.h?' '+m.h:''}`:'';
  const badge=m.st==='lluvia'?'<span class="badge">Suspendido por lluvia · por reprogramar</span>':m.st?'<span class="badge">Por reprogramar</span>':m.rep&&!o?'<span class="badge rep">Reprogramado</span>':'';
  const inner=`<span class="tag">${lab}${when}${m.cn?' · '+esc(m.cn):''}</span><span class="pl">${pa}${pb}${badge}</span>${sc}`;
  return canW?`<button class="m k${ci}" data-m="${esc(m.rid)}">${inner}</button>`:`<div class="m k${ci}">${inner}</div>`}

function subnav(){const mods=['V','F'].map(r=>{const c=cu(S.mod+r),n=Object.keys(c.entradas||{}).length;return `<button data-rama="${r}" aria-current="${r===S.rama}">${RAMA[r]}<small>${n||''}</small></button>`}).join('');
  const vs=[['partidos','Partidos'],['grupos','Grupos'],['llaves','Llaves'],['jugadores',S.mod==='D'?'Parejas':(S.rama==='F'?'Jugadoras':'Jugadores')]];
  return `<div class="sub"><div class="seg rama">${mods}</div><div class="seg">${vs.map(([v,l])=>`<button data-sub="${v}" aria-current="${v===S.sub}">${l}</button>`).join('')}</div></div>`}
function catChips(mm,attr,cur,all){if(!mm.cs.length)return'';return '<div class="chips">'+(all?`<button class="chip" data-${attr}="" aria-current="${!cur}">Todas</button>`:'')+mm.cs.map(c=>`<button class="chip" data-${attr}="${esc(c)}" aria-current="${c===cur}">Cat. ${esc(c)}</button>`).join('')+'</div>'}
function vacio(mm){const quien=S.mod==='D'?'parejas':(S.rama==='F'?'jugadoras':'jugadores');
  return `<p class="empty">Aún no hay ${quien} en ${MODS[S.mod]} ${RAMA[S.rama]}.${canW?' '+(S.mod==='D'||S.rama==='F'?'Agrégalas':'Agrégalos')+' en la pestaña de '+quien+' o importa un Excel desde Organizar.':''}</p>`+(canW?`<div class="acts"><button class="btn pri" data-addj="1">Agregar</button><button class="btn" data-go="org">Importar Excel o CSV</button></div>`:'')}

function vPartidos(mm){const KM=koMatches(mm,true);const all=[...mm.GM,...KM].filter(m=>!S.fcat||m.cat===S.fcat);
  if(!mm.GM.length&&!KM.length)return Object.keys(mm.E).length?'<p class="empty">Aún no hay partidos. Arma los grupos en la pestaña Grupos o importa los cruces.</p>':vacio(mm);
  let ms,head=catChips(mm,'fcat',S.fcat,true);
  if(S.q){ms=all.filter(m=>hit(m.ja)||hit(m.jb));head+=`<p class="note">${ms.length} partido(s) de “${esc(S.q)}”.</p>`;
    return head+(ms.length?`<div class="list">${ms.sort(byWhen).map(m=>rowMatch(mm,m,true)).join('')}</div>`:'<p class="empty">Sin partidos con ese nombre.</p>')}
  const lluvia=all.filter(m=>m.st),fechas=[...new Set(all.filter(m=>!m.st).map(m=>m.f))].sort((a,b)=>(a||'9999').localeCompare(b||'9999'));
  const keys=[...fechas,...(lluvia.length?['__lluvia']:[])];
  if(!keys.includes(S.fecha)){const h=iso(new Date());S.fecha=keys.includes(h)?h:(fechas.find(f=>f&&f>=h)||keys[0]||'')}
  head+='<div class="chips">'+keys.map(f=>{const set=f==='__lluvia'?lluvia:all.filter(m=>m.f===f&&!m.st),p=set.filter(m=>!outcome(eff(mm,m))).length;
    return `<button class="chip" data-fecha="${esc(f)}" aria-current="${f===S.fecha}">${f==='__lluvia'?'Por reprogramar':fmtF(f)}<small>${f==='__lluvia'?set.length:(p?p+' pend.':'✓')}</small></button>`}).join('')+'</div>';
  ms=S.fecha==='__lluvia'?lluvia:all.filter(m=>m.f===S.fecha&&!m.st);
  ms.sort((x,y)=>(x.h||'99').localeCompare(y.h||'99')||mm.cs.indexOf(x.cat)-mm.cs.indexOf(y.cat)||(x.n||0)-(y.n||0));
  if(S.fecha==='__lluvia')return head+`<div class="list">${ms.map(m=>rowMatch(mm,m,true)).join('')}</div>`;
  const grp=[];for(const m of ms){let g=grp.find(x=>x.h===m.h);if(!g)grp.push(g={h:m.h,ms:[]});g.ms.push(m)}
  return head+grp.map(g=>`<section class="slot"><div class="hr">${g.h||'––'}</div><div class="list">${g.ms.map(m=>rowMatch(mm,m,false)).join('')}</div></section>`).join('')}

function cardGrupo(mm,g){const t=tabla(mm,g),c=clasif(mm,g.cat),qn=new Set(c.list.map(x=>x.e));const ed=canW&&S.edG===g.id;
  const pj=g.ms.filter(m=>outcome(eff(mm,m))).length;
  let body;
  if(ed){const pool=Object.entries(mm.E).filter(([,e])=>e.cat===g.cat).sort((a,b)=>nombreE(a[1]).localeCompare(nombreE(b[1])));
    const where=e=>{const o=mm.G.find(x=>x.id!==g.id&&x.m.includes(e));return o?` (G${o.n})`:''};
    body=`<div class="plist">${g.m.map((e,i)=>`<div class="edrow"><b>${i+1}</b><select data-slot="${i}" aria-label="Lugar ${i+1}"><option value="">— vacío —</option>${pool.map(([id,x])=>`<option value="${esc(id)}" ${id===e?'selected':''}>${esc(nombreE(x))}${esc(where(id))}</option>`).join('')}</select><button class="mini danger" data-rmslot="${i}" aria-label="Quitar lugar ${i+1}">Quitar</button></div>`).join('')}</div>
    <div class="acts"><button class="btn" data-addslot="1">Agregar lugar</button><button class="btn ${S.delG===g.id?'pri':''}" data-delg="1">${S.delG===g.id?'Toca otra vez para eliminar':'Eliminar grupo'}</button><button class="btn pri" data-edg="">Listo</button></div>
    <p class="note">Cambiar un jugador conserva el horario de sus partidos. Los resultados ya capturados de ese lugar dejan de contar. Al agregar un lugar se crean sus partidos sin fecha.</p>`}
  else{const rows=t.st.map(s=>`<tr class="${c.done&&qn.has(s.e)?'q':''}"><td>${s.i}</td><td>${nm(s.n)}${s.ret?' <small>(abandonó)</small>':''}</td><td>${s.pj}</td><td>${s.pg}</td><td>${s.sg}/${s.sj}</td><td>${s.sj?pct(s.ps):'–'}</td><td>${s.jg}/${s.jj}</td><td>${s.jj?pct(s.pjg):'–'}</td><td class="pos">${t.any?s.pos:'–'}</td></tr>`).join('');
    body=`<div class="scroll"><table><thead><tr><th>Nº</th><th>Nombre</th><th>PJ</th><th>PG</th><th>SG/SJ</th><th>% Set</th><th>JG/JJ</th><th>% Jgo</th><th>Pos</th></tr></thead><tbody>${rows||'<tr><td colspan="9">Sin integrantes</td></tr>'}</tbody></table></div>
    <div class="list">${g.ms.map(m=>rowMatch(mm,m,true)).join('')}</div>`}
  return `<article class="card" data-g="${esc(g.id)}"><div class="rib"><h3>${S.q?'Cat. '+esc(g.cat)+' · ':''}Grupo ${g.n}</h3><span>${canW&&!ed?`<button class="mini" data-edg="${esc(g.id)}">Editar</button> `:''}<small class="${t.done?'ok':''}">${t.done?'Terminado':pj+' de '+g.ms.length}</small></span></div>${body}</article>`}
function vGrupos(mm){if(!mm.cs.length)return vacio(mm);
  if(!mm.cs.includes(S.cat))S.cat=mm.cs[0];
  const gs=S.q?mm.G.filter(g=>g.m.some(e=>e&&hit(nombreE(mm.E[e])))):mm.G.filter(g=>g.cat===S.cat);
  const sueltos=S.q?[]:Object.entries(mm.E).filter(([id,e])=>e.cat===S.cat&&!mm.G.some(g=>g.m.includes(id)));
  return (S.q?'':catChips(mm,'cat',S.cat,false))+`<p class="note">Desempate: partidos ganados; si empatan dos, el que ganó entre ellos; si empatan tres, % de sets y luego % de juegos. ● = clasificado a la fase final (se marca cuando terminan todos los grupos de la categoría).</p>`+
   (canW&&!S.q?`<div class="tools"><button class="btn" data-newg="1">Nuevo grupo en Cat. ${esc(S.cat)}</button></div>`:'')+
   (sueltos.length?`<p class="note"><b>Sin grupo:</b> ${sueltos.map(([,e])=>esc(nombreE(e))).join(', ')}</p>`:'')+
   (gs.length?`<div class="grid">${gs.map(g=>cardGrupo(mm,g)).join('')}</div>`:'<p class="empty">Sin grupos.</p>')}

function vLlaves(mm){if(!mm.cs.length)return vacio(mm);if(!mm.cs.includes(S.cat))S.cat=mm.cs[0];const cat=S.cat,{sl,fija,c}=slots(mm,cat),rs=rondas(mm,cat);
  if(c.tam&&!fija&&!c.done){const tot=c.T.reduce((n,t)=>n+t.g.ms.length,0),jug=c.T.reduce((n,t)=>n+t.g.ms.filter(m=>outcome(eff(mm,m))).length,0);return catChips(mm,'cat',cat,false)+`<p class="empty"><b>La llave de Cat. ${esc(cat)} se publica cuando terminen todos sus grupos.</b><br>Van ${jug} de ${tot} partidos de grupo jugados.</p>`}
  const chips=catChips(mm,'cat',cat,false);
  const estado=!c.tam?'Sin llave: la posición final sale de la tabla del grupo.':fija?'Llave fijada.':c.done?'Grupos terminados: la llave ya es definitiva, puedes fijarla.':'Proyección con los resultados actuales; cambia mientras se juegan los grupos.';
  let tools='';
  if(canW){tools=`<div class="tools"><label>Tamaño <select id="tam">${[0,2,4,8,16,32].map(n=>`<option value="${n}" ${n===c.tam?'selected':''}>${n||'Sin llave'}</option>`).join('')}</select></label>
    ${c.tam?(fija?'<button class="btn" id="lib">Volver a automática</button>':'<button class="btn pri" id="fix">Fijar llave</button>')+`<button class="btn" id="eds">${S.edS?'Cerrar edición':'Editar cruces'}</button>`:''}</div>`}
  let seeds='';
  if(canW&&S.edS&&c.tam){const pool=Object.entries(mm.E).filter(([,e])=>e.cat===cat);
    seeds='<div class="seeds">'+sl.map((x,i)=>`<label>${i%2?'vs':'Cruce '+(i/2+1)}<select data-s="${i}"><option value="">BYE</option>${pool.map(([id,e])=>`<option value="${esc(id)}" ${x&&x.e===id?'selected':''}>${esc(nombreE(e))}</option>`).join('')}</select></label>`).join('')+'</div>'}
  const qual=fija||!c.tam?'':`<div class="qual">${c.list.map((x,i)=>`<span><b>${i+1}</b>${nm(x.n)} · ${x.lab}</span>`).join('')}</div>`;
  const br=rs.length?'<div class="br">'+rs.map((ms,r)=>`<div class="rd"><h3>${rname(ms.length)}</h3><div class="rdm">${ms.map(m=>{
      const side=(e,n,s,ww)=>`<div class="${e?(ww?'w':''):'tbd'}"><span>${e?nm(n):(r===0?'BYE':'Por definir')}</span>${s?`<span class="s">${s}</span>`:''}</div>`;
      const sc=m.res?(m.res.wo?'W.O.':esc(m.res.s)):'';const w=m.w;
      const when=m.f||m.h?`<div class="tbd" style="font-size:13px">${m.st?(m.st==='lluvia'?'Lluvia · por reprogramar':'Por reprogramar'):fmtF(m.f)+(m.h?' '+m.h:'')}</div>`:'';
      const inner=side(m.ea,m.ja,w&&w===m.ea?sc:'',w&&w===m.ea)+side(m.eb,m.jb,w&&w===m.eb?sc:'',w&&w===m.eb)+when;
      return canW&&m.ea&&m.eb?`<button class="km" data-m="${esc(m.rid)}">${inner}</button>`:`<div class="km">${inner}</div>`}).join('')}</div></div>`).join('')+'</div>':'';
  const pt=puntos(mm,cat,rs);
  const pts=`<div class="pts"><h3>Puntos para la Copa</h3>${pt.length?pt.map(([n,l,p])=>`<div><span>${nm(n)} · ${l}</span><b>${p.toLocaleString('es-MX')} pts</b></div>`).join(''):'<p class="note">Aparecen al definirse semifinales y final: campeón 1,000, finalista 800, semifinalista 600.</p>'}</div>`;
  return chips+`<p class="note">${estado} Por omisión avanzan los primeros de grupo y, si faltan lugares, los mejores segundos; se evita que dos del mismo grupo se crucen en la primera ronda. Ajusta tamaño o cruces según el comité.</p>`+tools+seeds+qual+br+pts}

function vFicha(mm,id,quien){const e=mm.E[id],g=mm.G.find(x=>x.m.includes(id));
  const ms=[...mm.GM.filter(m=>m.ea===id||m.eb===id),...koMatches(mm,true).filter(m=>m.ea===id||m.eb===id)].sort(byWhen);
  let pj=0,pg=0;for(const m of ms){const o=outcome(eff(mm,m));if(!o)continue;pj++;if((o.w==='a'?m.ea:m.eb)===id)pg++}
  let pos='';if(g){const t=tabla(mm,g),s=t.st.find(x=>x.e===id);if(s&&t.any)pos=`${s.pos}º de ${t.st.length} en el grupo`}
  const datos=[`Cat. ${esc(e.cat)}`,g?`Grupo ${g.n}`:'Sin grupo',e.club?esc(e.club):''].filter(Boolean).join(' · ');
  const stats=`<div class="qual"><span><b>${pj}</b>jugados</span><span><b>${pg}</b>ganados</span><span><b>${pj-pg}</b>perdidos</span><span><b>${ms.length-pj}</b>por jugar</span>${pos?`<span><b>${pos.split(' ')[0]}</b>${esc(pos.slice(pos.indexOf(' ')+1))}</span>`:''}</div>`;
  return `<div class="tools"><button class="btn" data-vj="">← Volver a la lista</button>${canW?`<button class="btn" data-ej="${esc(id)}">Editar datos</button>`:''}</div>
  <h3 class="cath">${esc(nombreE(e))}</h3><p class="note">${datos}</p>${stats}
  ${ms.length?`<div class="list">${ms.map(m=>rowMatch(mm,m,true)).join('')}</div>`:`<p class="empty">Aún no tiene partidos programados.</p>`}`}
function vJugadores(mm){const quien=S.mod==='D'?'pareja':(S.rama==='F'?'jugadora':'jugador');
  if(S.verJ&&mm.E[S.verJ])return vFicha(mm,S.verJ,quien);
  const list=Object.entries(mm.E).filter(([,e])=>!S.q||hit(nombreE(e))||hit(e.club||''));
  let h=canW?`<div class="tools"><button class="btn pri" data-addj="1">Agregar ${quien}</button><button class="btn" data-go="org">Importar Excel o CSV</button></div>`:'';
  if(!list.length)return h+(S.q?'<p class="empty">Sin resultados.</p>':vacio(mm));
  for(const cat of mm.cs){const es=list.filter(([,e])=>e.cat===cat).sort((a,b)=>nombreE(a[1]).localeCompare(nombreE(b[1])));if(!es.length)continue;
    h+=`<h3 class="cath">Cat. ${esc(cat)} <small class="where">${es.length}</small></h3><div class="plist">`+es.map(([id,e])=>{const g=mm.G.find(x=>x.m.includes(id));
      const inner=`<span>${nm(nombreE(e))}</span><small>${g?'Grupo '+g.n:'Sin grupo'}</small>${e.club?`<small style="grid-column:1/-1">${nm(e.club)}</small>`:''}`;
      return `<button class="pi" data-vj="${esc(id)}">${inner}</button>`}).join('')+'</div>'}
  return h}

function convHTML(txt){const L=String(txt||'').split(/\r?\n/);let out='',sec=null,ul=false,big=false;
  const fmt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  const close=()=>{if(ul){sec+='</ul>';ul=false}if(big){sec+='</div>';big=false}};
  const flush=()=>{close();if(sec!==null)out+=sec+'</section>';sec=null};
  for(const raw of L){const l=raw.trim();if(!l){close();continue}
    if(l.startsWith('## ')){flush();sec=`<section class="sec"><h2>${fmt(l.slice(3))}</h2>`;continue}
    if(sec===null)sec='<section class="sec"><h2>Información</h2>';
    if(l.startsWith('> ')){if(ul){sec+='</ul>';ul=false}if(!big){sec+='<div class="big">';big=true}const[a,b]=l.slice(2).split('|');sec+=`<div><b>${fmt(a.trim())}</b><span>${fmt((b||'').trim())}</span></div>`;continue}
    if(big){sec+='</div>';big=false}
    if(l.startsWith('- ')){if(!ul){sec+='<ul>';ul=true}sec+=`<li>${fmt(l.slice(2))}</li>`;continue}
    if(ul){sec+='</ul>';ul=false}sec+=`<p>${fmt(l)}</p>`}
  flush();return out}
function vConv(){const t=S.T[S.tid]||{};const poster=t.poster&&(/^https:\/\//.test(t.poster)||/^\/_blob\//.test(t.poster)||/^[\w.-]+\.(jpe?g|png|webp)$/i.test(t.poster))?t.poster:'';
  const side=(poster?`<img class="poster" src="${esc(poster)}" alt="Póster del torneo">`:'')+(t.contacto||t.telefono?`<div class="ins"><b>Inscripciones</b><br>${esc(t.contacto||'')}${t.telefono?`<br><a href="tel:${esc(String(t.telefono).replace(/[^\d+]/g,''))}">${esc(t.telefono)}</a>`:''}</div>`:'');
  const body=t.convocatoria?convHTML(t.convocatoria):`<p class="empty">Este torneo aún no tiene convocatoria.${canW?' Agrégala en Organizar.':''}</p>`;
  return `<div class="conv"><div>${body}</div>${side?`<aside class="side">${side}</aside>`:''}</div>`}

// ---------- avisos ----------
Object.assign(S,{av:{},avE:'',avD:{t:'',x:'',fijo:false},avF:null,avDel:'',avBusy:false});
(()=>{if(!document.querySelector('.tab[data-v="avisos"]')){const b=document.createElement('button');b.className='tab';b.dataset.v='avisos';b.innerHTML='<span>Avisos</span>';const c=document.querySelector('.tab[data-v="conv"]');c.parentNode.insertBefore(b,c)}
  if(!document.querySelector('.tab[data-v="juego"]')){const j=document.createElement('button');j.className='tab';j.dataset.v='juego';j.innerHTML='<span>Minitenis</span>';const c=document.querySelector('.tab[data-v="conv"]');c.parentNode.insertBefore(j,c.nextSibling)}
  const st=document.createElement('style');st.textContent=`
.tab .nb{display:inline-block;transform:skewX(10deg);margin-left:6px;min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:var(--mag);color:#fff;font:800 12px/20px Montserrat,sans-serif;font-style:normal;text-align:center;vertical-align:1px}
.avs{display:grid;gap:16px;max-width:720px}
.av{background:var(--card);border:2px solid var(--line);border-radius:14px;overflow:hidden}
.av.fijo{border-color:var(--mag)}
.av .avh{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 16px;background:var(--navy);color:#fff}
.av.fijo .avh{background:var(--mag)}
.av h3{margin:0;font:italic 900 18px/1.2 Montserrat,sans-serif;text-transform:uppercase;min-width:0;overflow-wrap:anywhere}
.av .avh small{flex:none;font-weight:700;font-size:13px;opacity:.9;text-align:right}
.av .pin{display:inline-block;font:800 11px Montserrat,sans-serif;font-style:normal;background:var(--lime);color:var(--navyd);border-radius:6px;padding:2px 7px;margin-right:8px;vertical-align:2px}
.av .tx{padding:12px 16px;white-space:pre-line;overflow-wrap:anywhere;font-size:16px}
.av .tx a{color:var(--mag);font-weight:700}
.av .tx strong{color:var(--mag)}
.av .im{display:block;background:#0b0f33}
.av .im img{display:block;width:100%;height:auto;max-height:85vh;object-fit:contain}
.av .acts{margin:0;padding:12px 16px 14px}
.avban{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:var(--lime);color:var(--navyd);border:0;border-radius:12px;padding:10px 14px;margin:0 0 14px;font:700 15px Montserrat,sans-serif;cursor:pointer;min-height:48px}
.avban b{font:italic 900 13px Montserrat,sans-serif;text-transform:uppercase;background:var(--mag);color:#fff;border-radius:6px;padding:3px 8px;flex:none}
.avban span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.avform textarea{min-height:140px;font-size:16px}
.form label.chk{display:flex;align-items:center;gap:10px;min-height:44px}
.form label.chk input{width:22px;height:22px;min-height:22px;padding:0;accent-color:var(--mag)}
.avprev{margin-top:10px;display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px}
.avprev img{max-width:220px;max-height:220px;border-radius:10px;display:block}
header.conban{padding:0;background:#0d1240}
header.conban::before{display:block;content:"";position:absolute;inset:-30px;height:auto;background:var(--banurl) center/cover;filter:blur(26px) brightness(.5);transform:none;opacity:1}
header.conban .hw,header.conban .cc{display:none}
header.conban .banimg{position:relative;display:block;width:min(100%,760px);height:auto;margin:0 auto}
header.conban .club{margin:0 auto;padding:10px max(4vw,16px) 12px;justify-content:center}
.banprev{display:block;width:100%;max-width:340px;border-radius:10px;margin:6px 0 4px}`;document.head.appendChild(st)})();
const fmtTs=ts=>{const d=new Date(ts||0);return `${DOW[d.getDay()]} ${d.getDate()} ${MES[d.getMonth()]} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`};
const avTxt=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/https?:\/\/[^\s<]+/g,u=>`<a href="${u}" target="_blank" rel="noopener">${u}</a>`);
const avOk=u=>/^https:\/\//.test(u||'')?u:'';
const avList=()=>Object.entries(S.av).map(([id,a])=>({...a,id})).filter(a=>a.t||a.x||avOk(a.img)).sort((a,b)=>(!!b.fijo-!!a.fijo)||((b.ts||0)-(a.ts||0)));
const avKey=()=>'cct-avv-'+S.tid;
function avSeen(){try{return +localStorage.getItem(avKey())||0}catch(e){return 0}}
function avNuevos(){const s=avSeen(),lim=Date.now()-7*864e5;return avList().filter(a=>(a.ts||0)>s&&(a.ts||0)>lim)}
function avMark(){try{localStorage.setItem(avKey(),String(Date.now()))}catch(e){}}
function avReset(){if(S.avF)URL.revokeObjectURL(S.avF.url);S.avE='';S.avD={t:'',x:'',fijo:false};S.avF=null;S.avDel=''}
function avBanner(){const n=avNuevos().filter(a=>(a.ts||0)>Date.now()-3*864e5);if(!n.length)return '';n.sort((a,b)=>(b.ts||0)-(a.ts||0));const a=n[0];
  const txt=a.t||String(a.x||'').split('\n')[0]||'Nuevo aviso con imagen';
  return `<button class="avban" data-goav="1"><b>${n.length>1?n.length+' avisos':'Aviso'}</b><span>${esc(txt)}</span><span aria-hidden="true" style="flex:none">›</span></button>`}
function avForm(){const d=S.avD,ed=S.avE&&S.av[S.avE];const img=S.avF?S.avF.url:(ed&&!d.noImg?avOk(ed.img):'');
  return `<section class="box avform"><h2>${ed?'Editar aviso':'Nuevo aviso'}</h2><div class="form">
  <label class="full">Título (opcional)<input data-av="t" value="${esc(d.t)}" maxlength="120" placeholder="Ej. Jornada suspendida por lluvia"></label>
  <label class="full">Texto<textarea data-av="x" placeholder="Escribe el aviso. Puedes dejarlo vacío si solo subes una imagen.">${esc(d.x)}</textarea></label>
  ${assets?'<label>Imagen (opcional)<input type="file" id="avImg" accept="image/*"></label>':''}
  <label class="chk"><input type="checkbox" data-av="fijo" ${d.fijo?'checked':''}> Fijar hasta arriba</label></div>
  ${img?`<div class="avprev"><img src="${esc(img)}" alt="Imagen del aviso"><button class="btn" data-avnoimg="1">Quitar imagen</button></div>`:''}
  <p class="note">Usa <code>**texto**</code> para negritas. Los enlaces se pueden tocar.</p>
  <div class="acts"><button class="btn pri" data-avpub="1" ${S.avBusy?'disabled':''}>${S.avBusy?'Publicando…':ed?'Guardar cambios':'Publicar aviso'}</button>${ed||d.t||d.x||S.avF?'<button class="btn" data-avcancel="1">Cancelar</button>':''}</div>
  ${S.msg?`<p class="ok-msg">${esc(S.msg)}</p>`:''}</section>`}
function avCard(a){const tit=a.t||'Aviso',img=avOk(a.img);
  return `<article class="av${a.fijo?' fijo':''}"><div class="avh"><h3>${a.fijo?'<span class="pin">Fijado</span>':''}${esc(tit)}</h3><small>${fmtTs(a.ts)}</small></div>
  ${a.x?`<div class="tx">${avTxt(a.x)}</div>`:''}
  ${img?`<a class="im" href="${esc(img)}" target="_blank" rel="noopener"><img src="${esc(img)}" alt="${esc(tit)}" loading="lazy"></a>`:''}
  ${canW?`<div class="acts"><button class="btn" data-avsh="${esc(a.id)}">Compartir</button><button class="btn" data-ave="${esc(a.id)}">Editar</button><button class="btn" data-avfix="${esc(a.id)}">${a.fijo?'Desfijar':'Fijar arriba'}</button><button class="btn ${S.avDel===a.id?'pri':''}" data-avdel="${esc(a.id)}">${S.avDel===a.id?'Toca otra vez para borrar':'Borrar'}</button></div>`:''}</article>`}
function vAvisos(){const L=avList();avMark();
  return `<div class="avs">${canW?avForm():''}${L.map(avCard).join('')||`<p class="empty">Todavía no hay avisos.${canW?'':' Aquí se publicarán suspensiones por lluvia, cambios de horario y anuncios del torneo.'}</p>`}</div>`}
async function achica(f,max=1600){if(!/^image\/(jpe?g|png|webp|heic|heif)$/i.test(f.type||''))return f;
  try{const bmp=await createImageBitmap(f,{imageOrientation:'from-image'});const r=Math.min(1,max/Math.max(bmp.width,bmp.height));if(r===1&&f.size<900e3){bmp.close&&bmp.close();return f}
    const c=document.createElement('canvas');c.width=Math.round(bmp.width*r);c.height=Math.round(bmp.height*r);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(bmp,0,0,c.width,c.height);bmp.close&&bmp.close();
    const b=await new Promise(ok=>c.toBlob(ok,'image/jpeg',.86));if(!b||b.size>=f.size)return f;return new File([b],String(f.name||'aviso').replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'})}catch(e){return f}}
async function avClick(ds){
  if(ds.goav){location.hash='avisos';return true}
  if(ds.avsh){const a=S.av[ds.avsh];if(!a)return true;const url=location.origin+location.pathname.replace(/admin\.html$/,'')+'#avisos';const text=[a.t,a.x].filter(Boolean).join('\n');
    try{if(navigator.share){await navigator.share({title:a.t||'Aviso del torneo',text,url})}else{await navigator.clipboard.writeText((text?text+'\n\n':'')+url);setSt('Aviso copiado. Ya lo puedes pegar en WhatsApp.');setTimeout(()=>setSt(''),4000)}}catch(e){}return true}
  if(!canW)return false;
  if(ds.avpub){const d=S.avD,ed=S.avE&&S.av[S.avE];let img=S.avF?'':(ed&&!d.noImg?avOk(ed.img):'');
    if(!String(d.t).trim()&&!String(d.x).trim()&&!img&&!S.avF){S.msg='Escribe algo o agrega una imagen.';render();return true}
    S.avBusy=true;S.msg='';render();
    try{if(S.avF)img=(await assets.upload(S.avF.blob,'avisos')).url;
      const id=S.avE||('a'+Date.now().toString(36));const o={t:String(d.t).trim(),x:String(d.x).trim(),img,fijo:!!d.fijo,ts:ed?(ed.ts||Date.now()):Date.now()};if(ed)o.edit=Date.now();
      await db.doc(`torneos/${S.tid}/avisos/${id}`).set(o);S.av[id]=o;S.msg=ed?'Aviso actualizado.':'Aviso publicado.';avReset()}catch(err){S.msg='';fail(err)}
    S.avBusy=false;render();return true}
  if(ds.avcancel){avReset();S.msg='';render();return true}
  if(ds.avnoimg){if(S.avF){URL.revokeObjectURL(S.avF.url);S.avF=null}else S.avD.noImg=true;render();return true}
  if(ds.ave){const a=S.av[ds.ave];if(!a)return true;avReset();S.avE=ds.ave;S.avD={t:a.t||'',x:a.x||'',fijo:!!a.fijo};S.msg='';render();const v=$('view');scrollTo({top:Math.max(0,v.getBoundingClientRect().top+scrollY-80)});return true}
  if(ds.avfix){const a=S.av[ds.avfix];if(!a)return true;try{await db.doc(`torneos/${S.tid}/avisos/${ds.avfix}`).update({fijo:!a.fijo})}catch(err){fail(err)}return true}
  if(ds.avdel){if(S.avDel!==ds.avdel){S.avDel=ds.avdel;render();return true}const id=ds.avdel;S.avDel='';if(S.avE===id)avReset();
    try{await db.doc(`torneos/${S.tid}/avisos/${id}`).delete();delete S.av[id];S.msg='Aviso borrado.';render()}catch(err){fail(err)}return true}
  return false}
$('view').addEventListener('input',e=>{const k=e.target.dataset.av;if(k)S.avD[k]=e.target.type==='checkbox'?e.target.checked:e.target.value});

// ---------- instalar como app ----------
(()=>{if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
  const solo=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  let dp=null;addEventListener('beforeinstallprompt',e=>{e.preventDefault();dp=e});
  addEventListener('appinstalled',()=>{dp=null;const b=$('btnInst');if(b)b.remove()});
  if(solo())return;
  const st=document.createElement('style');st.textContent=`
.inst{flex:none;border:0;background:var(--mag);color:#fff;font:italic 800 15px Montserrat,sans-serif;padding:8px 16px;min-height:44px;transform:skewX(-8deg);box-shadow:4px 4px 0 #0b2a5a44;cursor:pointer;display:inline-flex;align-items:center}
.inst span{display:inline-flex;align-items:center;gap:8px;transform:skewX(8deg)}
.inst svg{width:18px;height:18px}
.dinst{border:0;border-radius:16px;padding:20px 22px;width:min(92vw,430px);background:var(--card);color:var(--ink);box-shadow:0 20px 50px #0007}
.dinst::backdrop{background:#000a}
.dinst h2{font:italic 900 22px Montserrat,sans-serif;color:var(--mag);margin:0 0 6px}
.dinst ol{padding-left:22px;margin:10px 0}.dinst li{margin:8px 0}.dinst p{margin:8px 0;color:var(--mut)}`;document.head.appendChild(st);
  const club=document.querySelector('header .club');if(!club)return;
  const b=document.createElement('button');b.id='btnInst';b.className='inst';b.type='button';
  b.innerHTML='<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Instalar app</span>';club.appendChild(b);
  b.addEventListener('click',async()=>{
    if(dp){const p=dp;dp=null;p.prompt();try{const r=await p.userChoice;if(r&&r.outcome==='accepted')b.remove()}catch(e){}return}
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    let d=$('dInst');if(!d){d=document.createElement('dialog');d.id='dInst';d.className='dinst';document.body.appendChild(d)}
    d.innerHTML='<h2>Instalar la app</h2>'+(ios
      ?'<ol><li>Abre esta página en <b>Safari</b>.</li><li>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).</li><li>Elige <b>Agregar a pantalla de inicio</b> y luego <b>Agregar</b>.</li></ol><p>Quedará un ícono en tu pantalla como cualquier otra app.</p>'
      :'<ol><li>Abre el menú del navegador (<b>⋮</b>, arriba a la derecha).</li><li>Elige <b>Instalar app</b> o <b>Agregar a pantalla de inicio</b>.</li></ol><p>En computadora también puedes usar el ícono de instalar que aparece a la derecha de la barra de dirección en Chrome o Edge.</p>')
      +'<div class="acts"><button class="btn pri" type="button" id="dInstOk">Entendido</button></div>';
    $('dInstOk').onclick=()=>d.close();d.showModal()})})();

// ---------- organizar ----------
const TF=[['edicion','Edición (ej. XXXI)'],['nombre','Nombre (ej. Torneo Challenger)'],['subtitulo','Subtítulo pequeño (ej. de tenis)'],['fechasTxt','Fechas como texto (ej. 23 Nov – 05 Dic)'],['inicio','Primer día','date'],['fin','Último día','date'],['sede','Sede'],['lema','Lema o club'],['contacto','Contacto de inscripciones'],['telefono','Teléfono']];
function vOrg(){if(!canW)return '<p class="empty">Solo quien edita puede organizar.</p>';const t=S.T[S.tid]||{};
  const tor=Object.entries(S.T).sort((a,b)=>(b[1].creado||0)-(a[1].creado||0));
  const field=([k,l,ty],v)=>`<label>${l}<input name="${k}" type="${ty||'text'}" value="${esc(v||'')}"></label>`;
  const imp=S.imp;
  return `<div class="org">
  <section class="box"><h2>Torneo</h2><div class="form"><label class="full">Torneo que estás viendo<select id="oSel">${tor.map(([id,x])=>`<option value="${esc(id)}" ${id===S.tid?'selected':''}>${esc((x.edicion?x.edicion+' ':'')+(x.nombre||id))}${id===S.app.activo?' (activo)':''}</option>`).join('')}</select></label></div>
   <div class="acts">${S.tid&&S.tid!==S.app.activo?'<button class="btn pri" id="oAct">Mostrar este torneo a todos</button>':'<span class="ok-msg">Este es el torneo que ven todos.</span>'}</div></section>
  <section class="box"><h2>Datos del torneo</h2><form class="form" id="oDat">${TF.map(f=>field(f,t[f[0]])).join('')}</form><div class="acts"><button class="btn pri" id="oSave">Guardar datos</button></div></section>
  <section class="box"><h2>Importar jugadores y cruces</h2>
   <div class="fmt"><p>Sube un Excel (.xlsx) o CSV. Puede traer dos hojas:</p>
   <p><b>Jugadores:</b> <code>Modalidad</code> (Singles/Dobles) · <code>Rama</code> (Varonil/Femenil) · <code>Categoría</code> · <code>Grupo</code> · <code>Nº</code> · <code>Jugador</code> · <code>Pareja</code> (solo dobles) · <code>Club</code></p>
   <p><b>Partidos:</b> <code>Modalidad</code> · <code>Rama</code> · <code>Categoría</code> · <code>Grupo</code> · <code>Partido</code> (ej. 1vs3) · <code>Fecha</code> (23/11/2026 o “Lunes”) · <code>Hora</code> · <code>Cancha</code></p>
   <p class="note">Si no mandas la hoja de Partidos, los partidos de cada grupo se crean sin fecha. Importar reemplaza solo las categorías que vengan en el archivo; los resultados de partidos que no cambian se conservan.</p></div>
   <div class="drop"><input type="file" id="oFile" accept=".xlsx,.xls,.csv,.txt" multiple aria-label="Archivo Excel o CSV"></div>
   <div class="acts">${dl?'<button class="btn" id="oTpl">Descargar plantilla</button><button class="btn" id="oExp">Exportar este torneo a Excel</button>':''}</div>
   ${imp?impPreview(imp):''}</section>
  <section class="box"><h2>Banner principal</h2><p class="note">Imagen que aparece hasta arriba de la página en lugar del encabezado con el nombre del torneo. Se ve mejor una imagen horizontal.</p>${t.banner?`<img class="banprev" src="${esc(t.banner)}" alt="Banner actual">`:''}<div class="form">${assets?'<label>Subir imagen<input type="file" id="oBan" accept="image/*"></label>':''}</div>${t.banner?'<div class="acts"><button class="btn" id="oBanDel">Quitar banner</button></div>':''}</section>
  <section class="box"><h2>Convocatoria</h2><div class="form"><label class="full">Texto<textarea id="oConv">${esc(t.convocatoria||'')}</textarea></label></div>
   <p class="note">Formato: <code>## Título</code> abre una sección · <code>- texto</code> viñeta · <code>&gt; valor | etiqueta</code> dato grande · <code>**negritas**</code>.</p>
   <div class="form">${assets?'<label>Póster (imagen)<input type="file" id="oPost" accept="image/*"></label>':''}</div>
   <div class="acts"><button class="btn pri" id="oConvOk">Guardar convocatoria</button>${t.poster?'<button class="btn" id="oPostDel">Quitar póster</button>':''}</div></section>
  <section class="box"><h2>Nuevo torneo</h2><form class="form" id="oNew">${TF.slice(0,8).map(f=>field(f,'')).join('')}</form><div class="acts"><button class="btn pri" id="oCreate">Crear torneo</button></div>
   <p class="note">Se crea vacío. Luego importa jugadores y cruces, y cuando esté listo usa “Mostrar este torneo a todos”.</p></section>
  ${S.msg?`<p class="ok-msg">${esc(S.msg)}</p>`:''}</div>`}
function impPreview(imp){const rows=Object.entries(imp.by).map(([k,b])=>`<tr><td>${MODS[k[0]]} ${RAMA[k[1]]}</td><td>${[...b.cats].map(esc).join(', ')}</td><td>${b.ent.length}</td><td>${Object.keys(b.grp).length}</td><td>${b.par.length}</td></tr>`).join('');
  return `<div class="imp"><h3 class="cath">Vista previa</h3><div class="scroll"><table><thead><tr><th>Cuadro</th><th>Categorías</th><th>Jugadores</th><th>Grupos</th><th>Partidos</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No se encontraron filas válidas.</td></tr>'}</tbody></table></div>
   ${imp.warn.length?`<ul>${imp.warn.slice(0,12).map(w=>`<li>${esc(w)}</li>`).join('')}${imp.warn.length>12?`<li>…y ${imp.warn.length-12} avisos más</li>`:''}</ul>`:''}
   <div class="acts">${rows?'<button class="btn pri" id="oImp">Importar y reemplazar estas categorías</button>':''}<button class="btn" id="oImpNo">Cancelar</button></div></div>`}

// ---------- importación ----------
let XL=null;
async function loadXLSX(){if(window.XLSX)return window.XLSX;await new Promise((ok,ko)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=()=>ko(new Error('xlsx'));document.head.appendChild(s)});return window.XLSX}
function csvRows(text){const first=text.split(/\r?\n/)[0]||'';const sep=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':(first.includes('\t')?'\t':',');
  const rows=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch}
    else if(ch==='"')q=true;else if(ch===sep){row.push(cell);cell=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}else cell+=ch}
  if(cell!==''||row.length){row.push(cell);rows.push(row)}
  const hd=(rows.shift()||[]).map(h=>h.trim());return rows.filter(r=>r.some(c=>String(c).trim())).map(r=>Object.fromEntries(hd.map((h,i)=>[h,r[i]??''])))}
const HDR={modalidad:'mod',modo:'mod',rama:'rama',genero:'rama',categoria:'cat',cat:'cat',grupo:'grupo',no:'pos',n:'pos',num:'pos',numero:'pos',posicion:'pos',lugar:'pos',jugador:'j1',jugadora:'j1',jugador1:'j1',jugadora1:'j1',nombre:'j1',pareja:'j2',jugador2:'j2',jugadora2:'j2',club:'club',partido:'partido',cruce:'partido',fecha:'fecha',dia:'fecha',hora:'hora',horario:'hora',cancha:'cancha',ladoa:'la',ladob:'lb'};
const NUM={uno:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12};
const WD={domingo:0,lunes:1,martes:2,miercoles:3,mierc:3,jueves:4,viernes:5,sabado:6,dom:0,lun:1,mar:2,mie:3,jue:4,vie:5,sab:6};
function grpNum(v){const s=norm(v).replace(/grupo|^g/g,'').trim();if(!s)return 0;if(/^\d+$/.test(s))return+s;return NUM[s]||0}
function pFecha(v,t){if(v===''||v==null)return'';if(typeof v==='number'){if(v>20000){const d=new Date(Date.UTC(1899,11,30)+Math.round(v)*864e5);return d.toISOString().slice(0,10)}return''}
  const s=norm(v);let m=s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  const ini=t.inicio?new Date(t.inicio+'T12:00'):null;
  m=s.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/);if(m){let y=m[3]?(m[3].length===2?'20'+m[3]:m[3]):String(ini?ini.getFullYear():new Date().getFullYear());return`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}
  const w=Object.keys(WD).find(k=>s.startsWith(k));
  if(w!==undefined&&ini){const dn=s.match(/(\d{1,2})/);const d=new Date(ini);if(dn){for(let i=0;i<40;i++){if(d.getDate()===+dn[1])return iso(d);d.setDate(d.getDate()+1)}}
    for(let i=0;i<7;i++){if(d.getDay()===WD[w])return iso(d);d.setDate(d.getDate()+1)}}
  return null}
function pHora(v){if(v===''||v==null)return'';if(typeof v==='number'){const mins=Math.round((v%1)*1440);return String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0')}
  const m=norm(v).match(/(\d{1,2})(?::|\.|h)?(\d{2})?\s*(a\.?\s?m\.?|p\.?\s?m\.?)?/);if(!m)return null;let h=+m[1];const mi=m[2]||'00';if(m[3]&&m[3][0]==='p'&&h<12)h+=12;if(m[3]&&m[3][0]==='a'&&h===12)h=0;return String(h).padStart(2,'0')+':'+mi}
async function leerArchivos(files){const t=S.T[S.tid]||{},rows=[],warn=[];
  for(const f of files){const name=f.name.toLowerCase();
    if(/\.(csv|txt)$/.test(name)){const buf=await f.arrayBuffer();let txt=new TextDecoder('utf-8').decode(buf);if(txt.includes('�'))txt=new TextDecoder('windows-1252').decode(buf);txt=txt.replace(/^﻿/,'');csvRows(txt).forEach(r=>rows.push({r,src:f.name}))}
    else{const X=await loadXLSX();const wb=X.read(await f.arrayBuffer(),{type:'array'});for(const sn of wb.SheetNames){if(/instruc/i.test(sn))continue;X.utils.sheet_to_json(wb.Sheets[sn],{defval:'',raw:true}).forEach(r=>rows.push({r,src:f.name+' · '+sn}))}}}
  const J=[],P=[];
  rows.forEach(({r,src},i)=>{const o={};for(const[k,v]of Object.entries(r)){const h=HDR[norm(k).replace(/[^a-z0-9]/g,'')];if(h&&o[h]===undefined)o[h]=typeof v==='string'?v.trim():v}
    const mod=norm(o.mod||'s').startsWith('d')?'D':'S',rama=norm(o.rama||'v').startsWith('f')?'F':'V',cat=String(o.cat??'').replace(/^cat(egoria)?\.?\s*/i,'').trim();
    const fila=`${src}, fila ${i+2}`;
    if(o.partido!==undefined&&String(o.partido).trim()!==''||(o.la&&o.lb)){if(!cat){warn.push(fila+': falta la categoría.');return}
      const f=pFecha(o.fecha,t),h=pHora(o.hora);if(f===null)warn.push(fila+`: no entendí la fecha “${o.fecha}”.`);if(h===null)warn.push(fila+`: no entendí la hora “${o.hora}”.`);
      P.push({k:mod+rama,cat,g:grpNum(o.grupo),p:String(o.partido??''),la:o.la,lb:o.lb,f:f||'',h:h||'',c:String(o.cancha??''),fila});return}
    if(o.j1!==undefined&&String(o.j1).trim()){if(!cat){warn.push(fila+': falta la categoría.');return}
      if(mod==='D'&&!String(o.j2||'').trim())warn.push(fila+': es de dobles pero no trae pareja.');
      J.push({k:mod+rama,cat,g:grpNum(o.grupo),pos:parseInt(o.pos)||0,j1:String(o.j1).trim(),j2:String(o.j2||'').trim(),club:String(o.club||'').trim(),fila})}});
  const by={};
  for(const j of J){const b=by[j.k]=by[j.k]||{cats:new Set(),ent:[],grp:{},par:[]};b.cats.add(j.cat);b.ent.push(j);
    if(j.g){const gk=ckey(j.cat)+'-'+j.g;const g=b.grp[gk]=b.grp[gk]||{cat:j.cat,n:j.g,m:[]};if(j.pos){if(g.m[j.pos-1])warn.push(j.fila+`: el lugar ${j.pos} del grupo ${j.g} está repetido.`);g.m[j.pos-1]=j}else g.m.push(j)}}
  for(const p of P){const b=by[p.k];const gk=ckey(p.cat)+'-'+p.g;const g=b&&b.grp[gk];if(!g){warn.push(p.fila+`: no hay jugadores en Cat. ${p.cat} grupo ${p.g}.`);continue}
    let a,bb;const m=String(p.p).match(/(\d+)\s*(?:vs?\.?|x|-|contra)\s*(\d+)/i);
    if(m){a=+m[1];bb=+m[2]}else if(p.la&&p.lb){const idx=n=>g.m.findIndex(j=>j&&norm(nombreE(j))===norm(n)||j&&norm(j.j1)===norm(n))+1;a=idx(p.la);bb=idx(p.lb)}
    if(!a||!bb||a===bb||!g.m[a-1]||!g.m[bb-1]){warn.push(p.fila+`: no entendí el partido “${p.p||p.la+' vs '+p.lb}”.`);continue}
    b.par.push({gk,a,b:bb,f:p.f,h:p.h,c:p.c})}
  if(!J.length&&!P.length)warn.push('No encontré columnas reconocibles. Revisa que la primera fila tenga encabezados como Categoría y Jugador.');
  return{by,warn}}
async function aplicarImport(imp){let n=0;
  for(const[k,b]of Object.entries(imp.by)){await mut(k,d=>{const cks=new Set([...b.cats].map(ckey));
      const prev={};for(const[id,e]of Object.entries(d.entradas))if(cks.has(ckey(e.cat)))prev[ckey(e.cat)+'|'+norm(nombreE(e))]=id;
      for(const[id,e]of Object.entries(d.entradas))if(cks.has(ckey(e.cat)))delete d.entradas[id];
      for(const[id,g]of Object.entries(d.grupos))if(cks.has(ckey(g.cat))){delete d.grupos[id];for(const[pid,p]of Object.entries(d.partidos))if(p.g===id)delete d.partidos[pid]}
      for(const ck of cks){for(const pid of Object.keys(d.ko||{}))if(pid.startsWith('K-'+ck+'-'))delete d.ko[pid];if(d.llaves)delete d.llaves[ck]}
      const idOf=new Map();
      for(const j of b.ent){const key=ckey(j.cat)+'|'+norm(nombreE(j));let id=prev[key];
        if(!id||d.entradas[id]){id=ckey(j.cat)+'-'+slug(nombreE(j));let i=2;const b0=id;while(d.entradas[id])id=b0+'-'+(i++)}
        d.entradas[id]={cat:j.cat,j1:j.j1,j2:j.j2||'',club:j.club||''};idOf.set(j,id);n++}
      for(const[gk,g]of Object.entries(b.grp)){d.grupos[gk]={cat:g.cat,n:g.n,m:Array.from({length:g.m.length},(_,i)=>g.m[i]?idOf.get(g.m[i]):'')}}
      for(const p of b.par){const pid=`${p.gk}-${Math.min(p.a,p.b)}v${Math.max(p.a,p.b)}`;const sw=p.a>p.b;d.partidos[pid]={g:p.gk,a:sw?p.b:p.a,b:sw?p.a:p.b,f:p.f,h:p.h,c:p.c}}
      for(const gk of Object.keys(b.grp))ensureRR(d,gk)})}
  return n}
async function libro(conDatos){const X=await loadXLSX();const wb=X.utils.book_new();
  const ins=[['Cómo llenar esta plantilla'],[''],['Hoja Jugadores: una fila por jugador (singles) o pareja (dobles).'],['Modalidad: Singles o Dobles. Rama: Varonil o Femenil. Categoría: como la usa el club (Abierta, A, AB, B, C, D…).'],['Grupo y Nº: número de grupo y lugar dentro del grupo (1, 2, 3…). Déjalos vacíos si aún no hay sorteo.'],['Pareja: solo en dobles. Club: para la Copa (opcional).'],[''],['Hoja Partidos (opcional): Partido como 1vs3 usando los lugares del grupo. Fecha como 23/11/2026 o el día (Lunes) si el torneo tiene “Primer día”. Hora como 19:00.'],['Si no hay hoja Partidos, se crean todos contra todos sin fecha.']];
  X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(ins),'Instrucciones');
  const J=[['Modalidad','Rama','Categoría','Grupo','Nº','Jugador','Pareja','Club']],P=[['Modalidad','Rama','Categoría','Grupo','Partido','Fecha','Hora','Cancha','Resultado']];
  if(conDatos){for(const k of Object.keys(S.C).sort()){const mm=M(k);const md=MODS[k[0]],rm=RAMA[k[1]];
      for(const[id,e]of Object.entries(mm.E)){const g=mm.G.find(x=>x.m.includes(id));J.push([md,rm,e.cat,g?g.n:'',g?g.m.indexOf(id)+1:'',e.j1,e.j2||'',e.club||''])}
      for(const m of mm.GM){const r=eff(mm,m);P.push([md,rm,m.cat,m.n,m.a+'vs'+m.b,m.f?m.f.split('-').reverse().join('/'):'',m.h,m.cn,r?(r.wo?'W.O. '+(r.wo==='a'?m.ja:m.jb):String(r.s)):''])}}}
  else{J.push(['Singles','Varonil','C',1,1,'Juan Pérez','','Club Campestre Tampico'],['Singles','Varonil','C',1,2,'Luis Gómez','',''],['Singles','Varonil','C',1,3,'Carlos Ruiz','',''],['Dobles','Femenil','B',1,1,'Ana López','María Díaz','']);
    P.push(['Singles','Varonil','C',1,'2vs3','23/11/2026','19:00','1',''],['Singles','Varonil','C',1,'1vs3','24/11/2026','20:30','2',''],['Singles','Varonil','C',1,'1vs2','Miércoles','21:45','','']);}
  const ws1=X.utils.aoa_to_sheet(J),ws2=X.utils.aoa_to_sheet(P);ws1['!cols']=[10,10,10,7,5,26,26,22].map(w=>({wch:w}));ws2['!cols']=[10,10,10,7,9,12,8,8,22].map(w=>({wch:w}));
  X.utils.book_append_sheet(wb,ws1,'Jugadores');X.utils.book_append_sheet(wb,ws2,'Partidos');
  return new Blob([X.write(wb,{type:'array',bookType:'xlsx'})])}

// ---------- render ----------
function header(){const t=S.T[S.tid]||{};$('hEd').textContent=t.edicion||'';{const w=String(t.nombre||'Torneo').trim().split(/\s+/),first=w.shift(),rest=w.join(' ');$('hNom').closest('h1').innerHTML=`<span id="hNom">${esc(first)}</span>${t.subtitulo?`<span class="dt" id="hSub">${esc(t.subtitulo)}</span>`:'<span id="hSub"></span>'}${rest?'<br>'+esc(rest):''}`}
  $('hFe').textContent=t.fechasTxt||'';$('hFe').hidden=!t.fechasTxt;$('hSede').textContent=[t.sede,t.lema].filter(Boolean).join(' · ');
  document.title=((t.edicion?t.edicion+' ':'')+(t.nombre||'Torneo')).slice(0,40);
  {const ban=t.banner&&(/^https:\/\//.test(t.banner)||/^[\w.-]+\.(jpe?g|png|webp)$/i.test(t.banner))?t.banner:'',hd=document.querySelector('header');let bi=$('hBan');hd.classList.toggle('conban',!!ban);
   if(ban){if(!bi){bi=document.createElement('img');bi.id='hBan';bi.className='banimg';hd.insertBefore(bi,hd.firstChild)}if(bi.getAttribute('src')!==ban){bi.src=ban;hd.style.setProperty('--banurl',`url("${ban.replace(/["\\]/g,'')}")`)}bi.alt=[t.edicion,t.nombre,t.fechasTxt].filter(Boolean).join(' · ')}else if(bi){bi.remove();hd.style.removeProperty('--banurl')}}
  let tot=0,pl=0;for(const k of Object.keys(S.C)){const mm=M(k);tot+=mm.GM.length;pl+=mm.GM.filter(m=>outcome(eff(mm,m))).length}
  $('pn').textContent=tot?`${pl} de ${tot} partidos de grupo jugados`:'Sin partidos cargados';$('pm').style.width=(tot?pl/tot*100:0)+'%';
  {const ta=document.querySelector('.tab[data-v="avisos"]');if(ta){const n=S.view==='avisos'?0:avNuevos().length,h2='<span>Avisos</span>'+(n?`<i class="nb" aria-label="${n} nuevos">${n}</i>`:'');if(ta.innerHTML!==h2)ta.innerHTML=h2}}
  $('tabOrg').hidden=!canW;document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.v===S.view))}
function render(){MC={};try{header();let h='';
    if(S.view==='conv')h=vConv();else if(S.view==='org')h=vOrg();else if(S.view==='avisos')h=vAvisos();
    else{S.mod=S.view;const mm=M();h=avBanner()+subnav()+(S.sub==='grupos'?vGrupos(mm):S.sub==='llaves'?vLlaves(mm):S.sub==='jugadores'?vJugadores(mm):vPartidos(mm))}
    const ae=document.activeElement,v0=$('view');let fk=null;if(ae&&v0.contains(ae)&&/^(INPUT|TEXTAREA)$/.test(ae.tagName)&&ae.type!=='file'&&ae.type!=='checkbox'&&(ae.id||ae.dataset.av))fk={q:ae.id?'#'+ae.id:`[data-av="${ae.dataset.av}"]`,v:ae.value,s:ae.selectionStart,e:ae.selectionEnd};
    v0.innerHTML=h;if(fk){const n=v0.querySelector(fk.q);if(n){n.value=fk.v;n.focus({preventScroll:true});try{n.setSelectionRange(fk.s,fk.e)}catch(x){}}}}catch(e){console.error(e);$('view').innerHTML='<p class="empty">Algo salió mal al dibujar esta vista. Recarga la página.</p>'}}

// ---------- diálogo de partido ----------
let cur=null;
const BX=['a1','b1','a2','b2','a3','b3'].map(id=>$(id));
BX.forEach(x=>{x.setAttribute('inputmode','numeric');x.setAttribute('autocomplete','off');x.maxLength=x.dataset.tb?2:1;x.setAttribute('aria-label',(x.id[0]==='a'?'Primer lado':'Segundo lado')+(x.dataset.tb?' tie-break':' set '+x.id[1]))});
const vis=()=>BX.filter(x=>!(x.dataset.tb&&$('sb').classList.contains('notb')));
function leer(){const v=BX.map(x=>x.value===''?null:+x.value),sets=[];const full=i=>v[i]!==null&&v[i+1]!==null;
  if(full(0))sets.push([v[0],v[1]]);if(full(2))sets.push([v[2],v[3]]);
  const split=sets.length===2&&sets.every(x=>x[0]!==x[1])&&(sets[0][0]>sets[0][1])!==(sets[1][0]>sets[1][1]);
  if(split&&full(4))sets.push([v[4],v[5]]);const empty=v.every(x=>x===null);let err='',warn='';
  if(!empty){sets.forEach((x,i)=>{if(x[0]===x[1])err=(i===2?'Tie-break':'Set '+(i+1))+' empatado.'});
    if(!err&&(!full(0)||!full(2)))err='Faltan juegos del set '+(!full(0)?1:2)+'.';else if(!err&&split&&!full(4))err='Falta el match tie-break.';
    if(!err)sets.forEach((x,i)=>{const hi=Math.max(...x),lo=Math.min(...x);const ok=i===2?(hi>=10&&hi-lo>=2&&(hi===10||hi-lo===2)):((hi===6&&lo<=4)||(hi===7&&(lo===5||lo===6)));
      if(!ok&&!warn)warn='Revisa el '+(i===2?'tie-break':'set '+(i+1))+': '+x[0]+'-'+x[1]+' no es un marcador común.'})}
  return{v,sets,split,empty,err,warn,str:sets.map(x=>x.join('-')).join(' ')}}
function pinta(){const x=leer();$('sb').classList.toggle('notb',!x.split&&x.v[4]===null&&x.v[5]===null);BX.forEach(b=>b.classList.remove('won'));
  [[0,1],[2,3],[4,5]].forEach(([i,j])=>{const p=x.v[i],q=x.v[j];if(p!==null&&q!==null&&p!==q)BX[p>q?i:j].classList.add('won')});return x}
function prev(){const p=$('dPrev'),x=pinta();p.classList.remove('bad');$('dAbL').hidden=!(cur.wo&&!cur.ko);
  [['dWa','a',cur.ja],['dWb','b',cur.jb]].forEach(([id,sd,n])=>{const on=cur.wo===sd;$(id).classList.toggle('on',on);$(id).setAttribute('aria-pressed',on);$(id).textContent=on?'Quitar W.O. de '+n:'W.O. gana '+n});
  if(cur.wo){p.textContent='W.O. a favor de '+(cur.wo==='a'?cur.ja:cur.jb)+' (6-0 6-0)';return x}
  if(x.empty){p.textContent='';return x}if(x.err){p.textContent=x.err;p.classList.add('bad');return x}
  const w=parse(x.str);p.textContent='Gana '+(w.w==='a'?cur.ja:cur.jb)+' · '+x.str+(x.warn?' — '+x.warn:'');if(x.warn)p.classList.add('bad');return x}
function findM(rid){const k=rid.split('.')[0],mm=M(k);return mm.GM.find(m=>m.rid===rid)||koMatches(mm).find(m=>m.rid===rid)}
function abrir(rid){const m=findM(rid);if(!m)return;cur={...m};
  $('dTag').textContent=`${MODS[m.k[0]]} ${RAMA[m.k[1]]} · Cat. ${m.cat} · `+(m.ko?m.ronda:`Grupo ${m.n}`);$('dTit').textContent=m.ja+' vs '+m.jb;$('nA').textContent=m.ja;$('nB').textContent=m.jb;
  const r=res(m);cur.wo=r&&r.wo?r.wo:'';$('dAb').checked=!!(r&&r.ab);BX.forEach(b=>b.value='');const p=r&&!r.wo?parse(r.s):null;
  if(p)p.sets.forEach(([a,b],i)=>{BX[i*2].value=a;BX[i*2+1].value=b});
  $('dDel').hidden=!S.R[m.rid];
  {const mm=M(m.k),v=!r&&!m.ko?eff(mm,m):null;$('dVirt').hidden=!(v&&v.virt);if(v&&v.virt){const lo=v.wo==='a'?m.eb:m.ea,src=(mm.RETS[m.g]||{})[lo];cur.src=src;
    $('dVirtT').textContent=`Cuenta como W.O. porque ${nombreE(mm.E[lo])} abandonó el torneo (default injustificado${src?' en su partido contra '+(src.ea===lo?src.jb:src.ja):''}). Puedes capturar un marcador aquí, o quitar el abandono para que sus partidos pendientes vuelvan a quedar por jugar.`}}
  pintaWhen();$('dMv').hidden=true;$('dPrev2').textContent='';prev();$('dlg').showModal();if(!r)setTimeout(()=>BX[0].focus(),60)}
function pintaWhen(){const m=cur;$('dWhen').textContent=(m.st==='lluvia'?'Suspendido por lluvia — por reprogramar. Antes: ':m.st?'Por reprogramar. Antes: ':m.rep?'Reprogramado: ':'Programado: ')+(m.f?fmtF(m.f):'sin fecha')+(m.h?' · '+m.h:'')+(m.cn?' · Cancha '+m.cn:'');
  $('dRain').textContent=m.st==='lluvia'?'Quitar marca de lluvia':'Suspendido por lluvia';$('dReprog').textContent=m.st==='reprog'?'Quitar “por reprogramar”':'Por reprogramar (otro motivo)';$('dF').value=m.f||'';$('dH').value=m.h||'';$('dC').value=m.cn||''}
function sched(patch){const k=cur.k,coll=cur.ko?'ko':'partidos';Object.assign(cur,{f:patch.f??cur.f,h:patch.h??cur.h,cn:patch.c??cur.cn,st:patch.st??cur.st,rep:patch.rep??cur.rep});
  const full={f:cur.f,h:cur.h,c:cur.cn,st:cur.st,rep:!!cur.rep};if(!cur.ko){full.g=cur.g;full.a=cur.a;full.b=cur.b}
  return upd(k,{[coll]:{[cur.pid]:full}})}
BX.forEach(b=>{b.addEventListener('focus',()=>b.select());
  b.addEventListener('input',()=>{b.value=b.value.replace(/\D/g,'');cur.wo='';$('dAb').checked=false;prev();if(!b.dataset.tb&&b.value.length===1){const L=vis(),i=L.indexOf(b);if(L[i+1])L[i+1].focus()}});
  b.addEventListener('keydown',e=>{if(e.key==='Backspace'&&b.value===''){const L=vis(),i=L.indexOf(b);if(i>0){e.preventDefault();L[i-1].focus();L[i-1].value='';prev()}}})});
const woTog=side=>{cur.wo=cur.wo===side?'':side;if(cur.wo)BX.forEach(b=>b.value='');else $('dAb').checked=false;prev()};
$('dWa').onclick=()=>woTog('a');$('dWb').onclick=()=>woTog('b');
$('dNo').onclick=()=>$('dlg').close();
const resRef=rid=>db.doc(`torneos/${S.tid}/res/${rid}`);
$('dVirtX').onclick=async()=>{const src=cur.src;if(!src)return;const r=S.R[src.rid];if(!r)return;try{await serial(resRef(src.rid).path,()=>resRef(src.rid).set({...r,ab:false,t:Date.now()}));$('dlg').close()}catch(e){$('dPrev2').textContent='No se pudo quitar el abandono.'}};
$('dDel').onclick=async()=>{try{await serial(resRef(cur.rid).path,()=>resRef(cur.rid).delete());$('dlg').close()}catch(e){$('dPrev').textContent='No se pudo borrar.';$('dPrev').classList.add('bad')}};
$('frm').addEventListener('submit',async e=>{e.preventDefault();const x=prev();
  if(!cur.wo&&(x.empty||x.err)){if(x.empty){$('dPrev').textContent='Captura el marcador o marca un W.O.';$('dPrev').classList.add('bad')}return}
  const data={s:cur.wo?'':x.str,wo:cur.wo||'',ab:!!(cur.wo&&!cur.ko&&$('dAb').checked),a:cur.ea,b:cur.eb,t:Date.now()};
  $('dOk').disabled=true;try{await serial(resRef(cur.rid).path,()=>resRef(cur.rid).set(data));$('dlg').close()}
  catch(err){$('dPrev').textContent=err&&err.code==='invalid_argument'?'No tienes permiso para capturar resultados.':'No se pudo guardar. Intenta de nuevo.';$('dPrev').classList.add('bad')}
  $('dOk').disabled=false});
$('dReprog').onclick=()=>{const on=cur.st!=='reprog';sched({st:on?'reprog':''});pintaWhen();$('dPrev2').textContent=on?'Marcado como por reprogramar. Usa “Cambiar fecha” cuando tenga nueva fecha.':'Se quitó la marca.';if(on)$('dMv').hidden=false};
$('dRain').onclick=()=>{const on=cur.st!=='lluvia';sched({st:on?'lluvia':''});pintaWhen();$('dPrev2').textContent=on?'Marcado como suspendido por lluvia. Usa “Cambiar fecha” para reprogramarlo.':'Se quitó la marca de lluvia.';if(on){$('dMv').hidden=false}};
$('dMove').onclick=()=>{$('dMv').hidden=!$('dMv').hidden;if(!$('dMv').hidden)$('dF').focus()};
$('dMvOk').onclick=()=>{const f=$('dF').value,h=$('dH').value,c=$('dC').value.trim();const was=!!cur.st||cur.rep||(cur.f&&f!==cur.f)||(cur.h&&h!==cur.h);
  sched({f,h,c,st:'',rep:!!was});pintaWhen();$('dMv').hidden=true;$('dPrev2').textContent='Nueva fecha guardada: '+fmtF(f)+(h?' · '+h:'')};

// ---------- diálogo de jugador ----------
let curJ=null;
function abrirJ(id){const k=K(),mm=M(k),e=id?mm.E[id]:null;curJ={k,id};const D=S.mod==='D',F=S.rama==='F';
  $('jTag').textContent=`${MODS[S.mod]} ${RAMA[S.rama]}`;$('jTit').textContent=id?'Editar '+(D?'pareja':F?'jugadora':'jugador'):'Agregar '+(D?'pareja':F?'jugadora':'jugador');
  $('jCats').innerHTML=mm.cs.map(c=>`<option value="${esc(c)}">`).join('');
  $('jCat').value=e?e.cat:(S.cat||mm.cs[0]||'');$('jN1').value=e?e.j1:'';$('jN2').value=e?e.j2||'':'';$('jClub').value=e?e.club||'':'';
  $('jL1').textContent=D?(F?'Jugadora 1':'Jugador 1'):(F?'Jugadora':'Jugador');$('jW2').hidden=!D;$('jDel').hidden=!id;$('jDel').textContent='Eliminar';$('jMsg').textContent='';$('dlgJ').showModal()}
$('jNo').onclick=()=>$('dlgJ').close();
$('frmJ').addEventListener('submit',e=>{e.preventDefault();const cat=$('jCat').value.trim(),j1=$('jN1').value.trim(),j2=$('jN2').value.trim(),club=$('jClub').value.trim();
  if(!cat||!j1){$('jMsg').textContent='Falta categoría o nombre.';return}
  const{k,id}=curJ;mut(k,d=>{let nid=id;if(!nid){nid=ckey(cat)+'-'+slug(j2?j1+' '+j2:j1);let i=2;const b0=nid;while(d.entradas[nid])nid=b0+'-'+(i++)}
    const old=d.entradas[nid];d.entradas[nid]={cat,j1,j2:S.mod==='D'?j2:'',club};
    if(old&&ckey(old.cat)!==ckey(cat))for(const g of Object.values(d.grupos)){const i=g.m.indexOf(nid);if(i>=0)g.m[i]=''}});
  S.cat=cat;$('dlgJ').close()});
$('jDel').onclick=()=>{if($('jDel').textContent==='Eliminar'){$('jDel').textContent='Toca otra vez para eliminar';return}
  const{k,id}=curJ;mut(k,d=>{delete d.entradas[id];for(const g of Object.values(d.grupos)){const i=g.m.indexOf(id);if(i>=0)g.m[i]=''}});$('dlgJ').close()};

// ---------- eventos ----------
$('view').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const ds=b.dataset;
  if(await avClick(ds))return;
  if(ds.rama){S.verJ='';S.rama=ds.rama;S.fecha='';S.cat='';S.fcat='';S.edG='';location.hash=hashOf();return}
  if(ds.sub){S.sub=ds.sub;S.edG='';S.verJ='';render();return}
  if(ds.vj!==undefined){S.verJ=ds.vj;render();const bar=document.querySelector('.bar');if(bar&&window.scrollY>bar.offsetTop)scrollTo({top:bar.offsetTop});return}
  if(ds.fecha!==undefined){S.fecha=ds.fecha;render();return}
  if(ds.fcat!==undefined){S.fcat=ds.fcat;render();return}
  if(ds.cat!==undefined){S.cat=ds.cat;S.edS=false;S.edG='';render();return}
  if(ds.m){abrir(ds.m);return}
  if(ds.addj){abrirJ('');return}
  if(ds.ej){abrirJ(ds.ej);return}
  if(ds.go){location.hash=ds.go==='org'?'organizar':ds.go;return}
  if(ds.edg!==undefined){S.edG=ds.edg;S.delG='';render();return}
  const k=K();
  if(ds.newg){mut(k,d=>{const n=1+Math.max(0,...Object.values(d.grupos).filter(g=>ckey(g.cat)===ckey(S.cat)).map(g=>+g.n||0));const gid=ckey(S.cat)+'-'+n;d.grupos[gid]={cat:S.cat,n,m:['','','']};ensureRR(d,gid);S.edG=gid});return}
  const card=b.closest('[data-g]'),gid=card&&card.dataset.g;
  if(ds.addslot&&gid){mut(k,d=>{d.grupos[gid].m.push('');ensureRR(d,gid)});return}
  if(ds.rmslot!==undefined&&gid){const i=+ds.rmslot;mut(k,d=>{const g=d.grupos[gid];if(i===g.m.length-1){g.m.pop();ensureRR(d,gid)}else g.m[i]=''});return}
  if(ds.delg&&gid){if(S.delG!==gid){S.delG=gid;render();return}mut(k,d=>{delete d.grupos[gid];for(const[pid,p]of Object.entries(d.partidos))if(p.g===gid)delete d.partidos[pid]});S.edG='';S.delG='';return}
  if(b.id==='fix'){const mm=M(k),{sl}=slots(mm,S.cat);upd(k,{llaves:{[ckey(S.cat)]:{tam:sl.length,sem:sl.map(x=>x?x.e:'')}}});return}
  if(b.id==='lib'){mut(k,d=>{const L=d.llaves[ckey(S.cat)]||{};d.llaves[ckey(S.cat)]={tam:L.tam??'',sem:null}});return}
  if(b.id==='eds'){S.edS=!S.edS;render();return}
  // organizar
  if(b.id==='oAct'){try{await db.doc('config/app').set({...S.app,activo:S.tid})}catch(err){fail(err)}return}
  if(b.id==='oSave'){const fd=new FormData($('oDat')),o={};TF.forEach(([f])=>o[f]=String(fd.get(f)||'').trim());try{await db.doc('torneos/'+S.tid).update(o);S.msg='Datos guardados.';render()}catch(err){fail(err)}return}
  if(b.id==='oConvOk'){try{await db.doc('torneos/'+S.tid).update({convocatoria:$('oConv').value});S.msg='Convocatoria guardada.';render()}catch(err){fail(err)}return}
  if(b.id==='oBanDel'){try{await db.doc('torneos/'+S.tid).update({banner:''});S.msg='Banner quitado.';render()}catch(err){fail(err)}return}
  if(b.id==='oPostDel'){try{await db.doc('torneos/'+S.tid).update({poster:''});render()}catch(err){fail(err)}return}
  if(b.id==='oCreate'){const fd=new FormData($('oNew')),o={};TF.slice(0,8).forEach(([f])=>o[f]=String(fd.get(f)||'').trim());if(!o.nombre){S.msg='Ponle nombre al torneo.';render();return}
    const id=slug((o.edicion?o.edicion+' ':'')+o.nombre)+'-'+Date.now().toString(36);o.creado=Date.now();
    try{await db.doc('torneos/'+id).set(o);try{localStorage.setItem('cct-tid',id)}catch(x){}S.msg='Torneo creado. Ahora importa sus jugadores.';selTorneo(id)}catch(err){fail(err)}return}
  if(b.id==='oTpl'||b.id==='oExp'){try{const blob=await libro(b.id==='oExp');await dl.save({filename:b.id==='oExp'?slug(((S.T[S.tid]||{}).nombre)||'torneo')+'.xlsx':'plantilla-torneo.xlsx',data:blob})}catch(err){if(!err||err.code!=='declined')setSt('No se pudo generar el archivo.')}return}
  if(b.id==='oImpNo'){S.imp=null;render();return}
  if(b.id==='oImp'){b.disabled=true;b.textContent='Importando…';try{const n=await aplicarImport(S.imp);S.imp=null;S.msg=`Listo: ${n} registros importados.`;render()}catch(err){fail(err)}return}
});
$('view').addEventListener('change',async e=>{const t=e.target,k=K();
  if(t.dataset.av){S.avD[t.dataset.av]=t.type==='checkbox'?t.checked:t.value;return}
  if(t.id==='avImg'&&t.files[0]){try{const f=await achica(t.files[0]);if(S.avF)URL.revokeObjectURL(S.avF.url);S.avF={blob:f,url:URL.createObjectURL(f)};S.avD.noImg=false;S.msg=''}catch(err){S.msg='No pude leer esa imagen.'}render();return}
  if(t.id==='tam'){mut(k,d=>{d.llaves[ckey(S.cat)]={tam:+t.value,sem:null}});return}
  if(t.dataset.s!==undefined){const mm=M(k),{sl}=slots(mm,S.cat);const arr=sl.map(x=>x?x.e:'');arr[+t.dataset.s]=t.value;upd(k,{llaves:{[ckey(S.cat)]:{tam:arr.length,sem:arr}}});return}
  if(t.dataset.slot!==undefined){const gid=t.closest('[data-g]').dataset.g,i=+t.dataset.slot,v=t.value;
    mut(k,d=>{if(v)for(const g of Object.values(d.grupos)){const j=g.m.indexOf(v);if(j>=0)g.m[j]=''}d.grupos[gid].m[i]=v});return}
  if(t.id==='oSel'){try{localStorage.setItem('cct-tid',t.value)}catch(x){}selTorneo(t.value);return}
  if(t.id==='oFile'&&t.files.length){S.msg='';try{S.imp=await leerArchivos([...t.files])}catch(err){S.imp={by:{},warn:['No pude leer el archivo. Si es Excel, revisa tu conexión (se descarga un lector) o guárdalo como CSV.']}}render();return}
  if(t.id==='oBan'&&t.files[0]){setSt('Subiendo banner…');try{const f=await achica(t.files[0],2000);const a=await assets.upload(f,'banners');await db.doc('torneos/'+S.tid).update({banner:a.url});setSt('');S.msg='Banner actualizado.';render()}catch(err){setSt('No se pudo subir el banner.')}return}
  if(t.id==='oPost'&&t.files[0]){try{const a=await assets.upload(t.files[0]);await db.doc('torneos/'+S.tid).update({poster:a.url});S.msg='Póster actualizado.';render()}catch(err){setSt('No se pudo subir el póster.')}return}
});
$('tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(!b)return;const v=b.dataset.v;if(v==='juego'){location.href='juego.html';return}if(v==='S'||v==='D'){S.view=v;S.mod=v;S.fecha='';S.cat='';S.fcat=''}location.hash=v==='avisos'?'avisos':v==='conv'?'convocatoria':v==='org'?'organizar':(v==='S'?'singles':'dobles')+'-'+(S.rama==='F'?'femenil':'varonil')});
const hashOf=()=>(S.mod==='S'?'singles':'dobles')+'-'+(S.rama==='F'?'femenil':'varonil');
function route(){const h=location.hash.slice(1);let m;
  if(h==='avisos')S.view='avisos';else if(h==='convocatoria')S.view='conv';else if(h==='organizar')S.view='org';
  else if((m=h.match(/^(singles|dobles)-(varonil|femenil)$/))){S.view=S.mod=m[1]==='singles'?'S':'D';S.rama=m[2]==='femenil'?'F':'V'}
  else{S.view=S.mod}
  S.edG='';render()}
addEventListener('hashchange',route);
let qt;$('q').addEventListener('input',e=>{clearTimeout(qt);qt=setTimeout(()=>{S.q=e.target.value.trim();try{localStorage.setItem('cct-q',S.q)}catch(x){}if(S.view==='conv'||S.view==='org'||S.view==='avisos'){location.hash=hashOf();return}render()},150)});
$('qx').onclick=()=>{$('q').value='';S.q='';try{localStorage.removeItem('cct-q')}catch(x){}render()};
route();

// ---------- datos ----------
let un=[],tmr=null;
function selTorneo(id){un.forEach(f=>{try{f()}catch(e){}});un=[];S.tid=id;S.C={};S.R={};S.av={};avReset();MC={};render();if(!id)return;let ok=0;
  const done=()=>{if(++ok>=2){clearTimeout(tmr);setSt('')}};clearTimeout(tmr);tmr=setTimeout(()=>{if(ok<2)setSt('Todavía no se pueden cargar los datos; lo que ves puede estar incompleto.')},10000);
  un.push(db.collection(`torneos/${id}/cuadros`).onSnapshot(s=>{const n={};s.docs.forEach(d=>{n[d.id]=d.data()});S.C=n;if(!s.metadata.fromCache)done();render()},err=>{setSt('No se pudieron cargar los cuadros.')}));
  un.push(db.collection(`torneos/${id}/res`).onSnapshot(s=>{const n={};s.docs.forEach(d=>{n[d.id]=d.data()});S.R=n;if(!s.metadata.fromCache)done();render()},err=>{setSt('No se pudieron cargar los resultados.')}));
  un.push(db.collection(`torneos/${id}/avisos`).onSnapshot(s=>{const n={};s.docs.forEach(d=>{n[d.id]=d.data()});if(JSON.stringify(n)===JSON.stringify(S.av))return;S.av=n;render()},()=>{}))}
function pickT(){let t='';if(canW){try{t=localStorage.getItem('cct-tid')||''}catch(e){}}
  if(!S.T[t])t=S.app.activo;if(!S.T[t])t=Object.keys(S.T).sort((a,b)=>(S.T[b].creado||0)-(S.T[a].creado||0))[0]||'';
  if(t!==S.tid)selTorneo(t);else render()}
// ---------- Supabase ----------
const MODO=window.MODO||'publico',CFG=window.TORNEO_CFG||{};
const sb=window.supabase&&CFG.url&&CFG.anonKey?window.supabase.createClient(CFG.url,CFG.anonKey):null;
const parentOf=p=>p.split('/').slice(0,-1).join('/');
const mapErr=e=>({code:e&&(e.code==='42501'||e.code==='invalid_argument'||/row-level security|permission|JWT/i.test(e.message||''))?'invalid_argument':'unavailable',message:(e&&e.message)||''});
const snapDoc=(p,row)=>({id:p.split('/').pop(),exists:!!row,data:()=>row?row.data:undefined,metadata:{fromCache:false,hasPendingWrites:false}});
async function fetchDoc(p){const{data,error}=await sb.from('docs').select('path,data').eq('path',p).maybeSingle();if(error)throw error;return data}
async function fetchCol(p){const{data,error}=await sb.from('docs').select('path,data').eq('coleccion',p);if(error)throw error;return data||[]}
const LS=[],dirty=new Set();let rtT=null;
async function refresh(l){try{if(l.kind==='doc'){l.fn(snapDoc(l.path,await fetchDoc(l.path)))}else{const docs=(await fetchCol(l.path)).map(r=>snapDoc(r.path,r));l.fn({docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false}})}}catch(e){l.err&&l.err(mapErr(e))}}
function onChange(p){for(const l of LS)if((l.kind==='doc'&&l.path===p)||(l.kind==='col'&&l.path===parentOf(p)))dirty.add(l);clearTimeout(rtT);rtT=setTimeout(()=>{const ls=[...dirty];dirty.clear();ls.forEach(refresh)},150)}
function listen(kind,path,fn,err){const l={kind,path,fn,err};LS.push(l);refresh(l);return()=>{const i=LS.indexOf(l);if(i>=0)LS.splice(i,1)}}
const now=()=>new Date().toISOString();
const docApi=p=>({path:p,id:p.split('/').pop(),
  get:async()=>snapDoc(p,await fetchDoc(p)),
  set:async d=>{const{error}=await sb.from('docs').upsert({path:p,coleccion:parentOf(p),data:d,updated_at:now()});if(error)throw mapErr(error);onChange(p)},
  update:async d=>{const cur=await fetchDoc(p);if(!cur)throw{code:'invalid_argument',message:'No existe el documento'};
    const{data,error}=await sb.from('docs').update({data:merge(clone(cur.data),clone(d)),updated_at:now()}).eq('path',p).select('path');if(error)throw mapErr(error);if(!data||!data.length)throw{code:'invalid_argument',message:'Sin permiso'};onChange(p)},
  delete:async()=>{const{error}=await sb.from('docs').delete().eq('path',p);if(error)throw mapErr(error);onChange(p)},
  onSnapshot:(fn,err)=>listen('doc',p,fn,err)});
const colApi=p=>({path:p,doc:id=>docApi(p+'/'+id),onSnapshot:(fn,err)=>listen('col',p,fn,err)});

// descargas y póster
dl={save:async({filename,data})=>{const u=URL.createObjectURL(data);const a=document.createElement('a');a.href=u;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);return{status:'saved'}}};
assets={upload:async(f,dir='posters')=>{const ext=((f.name||'').split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`${dir}/${S.tid}-${Date.now()}.${ext}`;
  const{error}=await sb.storage.from('publico').upload(path,f,{upsert:true,contentType:f.type||undefined});if(error)throw error;return{url:sb.storage.from('publico').getPublicUrl(path).data.publicUrl}}};

// acceso
function showLogin(on){const el=$('login');if(el)el.hidden=!on;const o=$('tabSalir');if(o)o.hidden=on}
async function initAuth(){if(MODO!=='admin'){canW=false;return}
  const{data}=await sb.auth.getSession();canW=!!(data&&data.session);showLogin(!canW);
  sb.auth.onAuthStateChange((_e,ses)=>{const was=canW;canW=!!ses;showLogin(!canW);if(was!==canW){MC={};render()}})}
if($('lf'))$('lf').addEventListener('submit',async e=>{e.preventDefault();let u=$('lu').value.trim();const pw=$('lp').value;if(!u||!pw)return;if(!u.includes('@'))u=u.toLowerCase()+'@torneo.local';
  $('lm').textContent='Entrando…';const{error}=await sb.auth.signInWithPassword({email:u,password:pw});$('lm').textContent=error?'Usuario o contraseña incorrectos.':''});
if($('tabSalir'))$('tabSalir').addEventListener('click',async e=>{e.stopPropagation();await sb.auth.signOut()});

(async()=>{if(!sb){setSt('Falta configurar Supabase en config.js.');return}
  db={doc:docApi,collection:colApi};
  try{await initAuth()}catch(e){canW=false}
  if(MODO!=='admin'&&S.view==='org'){location.hash=hashOf()}
  sb.channel('docs-cambios').on('postgres_changes',{event:'*',schema:'public',table:'docs'},pl=>{const p=(pl.new&&pl.new.path)||(pl.old&&pl.old.path);if(p)onChange(p)}).subscribe();
  setInterval(()=>{if(document.visibilityState==='visible')LS.forEach(refresh)},45000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')LS.forEach(refresh)});
  let got=0;const go=()=>{if(++got>=2)pickT()};
  db.doc('config/app').onSnapshot(s=>{S.app=s.exists?s.data():{};if(got>=2)pickT();else go()},()=>go());
  db.collection('torneos').onSnapshot(s=>{const n={};s.docs.forEach(d=>{n[d.id]=d.data()});S.T=n;if(got>=2)pickT();else go()},()=>{setSt('No se pudieron cargar los torneos.');go()});
})();
}
