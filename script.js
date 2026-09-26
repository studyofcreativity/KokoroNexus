(function(){
'use strict';
const API='https://kokoronexus-api.study-of-creativity.workers.dev';
const TK='kokoro_t_',NK='kokoro_n_';
const CATS={temporada:{l:'Temporada',i:'📺'},manga:{l:'Manga',i:'📚'},teorias:{l:'Teorías',i:'🧠'},fanarts:{l:'Fanarts',i:'🎨'},watchparties:{l:'Parties',i:'🍿'},offtopic:{l:'Off-topic',i:'💬'}};
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const uid=()=>'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&0x3|0x8)).toString(16)});
const name=()=>localStorage.getItem(NK)||'Anónimo';
const setName=n=>{n=(n||'').trim().slice(0,24)||'Anónimo';localStorage.setItem(NK,n);return n};
const saveT=(id,t)=>localStorage.setItem(TK+id,t);
const isOwn=id=>!!localStorage.getItem(TK+id);
const delT=id=>localStorage.removeItem(TK+id);
const esc=s=>{const d=document.createElement('div');d.textContent=s||'';return d.innerHTML};
const md=t=>esc(t).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
const ago=iso=>{const d=(Date.now()-new Date(iso))/1e3;if(d<60)return'hace un momento';if(d<3600)return`hace ${Math.floor(d/60)} min`;if(d<86400)return`hace ${Math.floor(d/3600)} h`;if(d<604800)return`hace ${Math.floor(d/86400)} d`;return new Date(iso).toLocaleDateString('es')};

let S={threads:[],cat:null,tid:null,edit:null,sort:'newest',del:null,meta:null};

async function api(method,path,body){
  const o={method,headers:{'Content-Type':'application/json'}};
  if(body)o.body=JSON.stringify(body);
  const r=await fetch(API+path,o);
  const j=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(j.error||r.statusText);
  return j;
}

function showWarn(meta){
  let el=$('#limitWarn');
  if(!el){
    el=document.createElement('div');
    el.id='limitWarn';
    el.style.cssText='background:rgba(245,158,11,.15);border:1px solid #f59e0b;color:#fbbf24;padding:.5rem .8rem;border-radius:8px;font-size:.8rem;margin-bottom:.8rem';
    const home=$('#view-home .userbar');
    if(home)home.after(el);
  }
  if(meta&&meta.warn){
    el.hidden=false;
    el.textContent=`⚠️ Almacén casi lleno (${meta.total}/${meta.max} hilos). Los más antiguos se borrarán solos al llegar al límite.`;
  }else{el.hidden=true}
}

async function load(){
  $('#loading').hidden=false;$('#empty').hidden=true;$('#list').innerHTML='';
  try{
    const data=await api('GET','/threads');
    if(Array.isArray(data)){S.threads=data;S.meta=null}
    else if(data&&Array.isArray(data.threads)){S.threads=data.threads;S.meta=data.meta||null}
    else{S.threads=[];S.meta=null}
    showWarn(S.meta);
    renderHome();
  }catch(e){alert('Error: '+e.message);S.threads=[]}
  $('#loading').hidden=true;
}

function show(v){$$('main>section').forEach(s=>s.hidden=true);$('#view-'+v).hidden=false}

function renderCats(){
  const counts={};Object.keys(CATS).forEach(k=>counts[k]=0);
  S.threads.forEach(t=>{if(counts[t.category]!=null)counts[t.category]++});
  let h=`<button class="chip${!S.cat?' on':''}" data-c="">Todos (${S.threads.length})</button>`;
  for(const[k,c] of Object.entries(CATS))h+=`<button class="chip${S.cat===k?' on':''}" data-c="${k}">${c.i} ${c.l} (${counts[k]||0})</button>`;
  $('#cats').innerHTML=h;
  $$('#cats .chip').forEach(b=>b.onclick=()=>{S.cat=b.dataset.c||null;renderHome()});
}

function sorted(){
  let a=[...S.threads];
  if(S.cat)a=a.filter(t=>t.category===S.cat);
  if(S.sort==='newest')a.sort((x,y)=>new Date(y.created_at)-new Date(x.created_at));
  else if(S.sort==='oldest')a.sort((x,y)=>new Date(x.created_at)-new Date(y.created_at));
  else a.sort((x,y)=>(y.replies?.length||0)-(x.replies?.length||0));
  return a;
}

function renderHome(){
  show('home');renderCats();
  $('#listTitle').textContent=S.cat?(CATS[S.cat]?.l||'Hilos'):'Últimos hilos';
  const list=sorted();
  if(!list.length){$('#list').innerHTML='';$('#empty').hidden=false;return}
  $('#empty').hidden=true;
  $('#list').innerHTML=list.map(t=>{
    const c=CATS[t.category]||{l:t.category,i:''};
    return`<article class="card" data-id="${t.id}"><div><span class="tag cat-${t.category}">${c.i} ${c.l}</span><h3>${esc(t.title)}</h3><div class="meta">por ${esc(t.author)} · ${ago(t.created_at)}</div></div><div class="stats">${t.replies?.length||0} resp.</div></article>`;
  }).join('');
  $$('#list .card').forEach(c=>c.onclick=()=>open(c.dataset.id));
}

function open(id){
  const t=S.threads.find(x=>x.id===id);if(!t)return;
  S.tid=id;show('thread');
  const c=CATS[t.category]||{l:t.category,i:''};
  const own=isOwn(t.id);
  $('#detail').innerHTML=`<span class="tag cat-${t.category}">${c.i} ${c.l}</span><h2>${esc(t.title)}</h2><div class="meta">por <b>${esc(t.author)}</b> · ${ago(t.created_at)}</div><div class="content">${md(t.content)}</div>${own?`<div class="owner"><button class="btn out sm" id="edT">Editar</button><button class="btn danger sm" id="delT">Eliminar</button></div>`:''}`;
  if(own){
    $('#edT').onclick=()=>startEdit(t);
    $('#delT').onclick=()=>{S.del={type:'thread',id:t.id};$('#modalTxt').textContent='¿Eliminar hilo y respuestas?';$('#modal').hidden=false};
  }
  const reps=t.replies||[];
  $('#rCount').textContent=`(${reps.length})`;
  $('#replies').innerHTML=reps.length?reps.map(r=>{
    const o=isOwn(r.id);
    return`<div class="rcard"><div class="rhead"><span><span class="rauthor">${esc(r.author)}</span> <span class="rdate">· ${ago(r.createdAt||r.created_at)}</span></span>${o?`<span><button class="btn out sm er" data-id="${r.id}">Editar</button> <button class="btn danger sm dr" data-id="${r.id}">Eliminar</button></span>`:''}</div><div class="content">${md(r.content)}</div></div>`;
  }).join(''):'<p style="color:var(--m);font-size:.85rem">Sé el primero en responder.</p>';
  $$('.er').forEach(b=>b.onclick=()=>{
    const r=reps.find(x=>x.id===b.dataset.id);if(!r)return;
    const n=prompt('Editar:',r.content);if(n!=null&&n.trim()){
      r.content=n.trim();
      api('PUT','/threads/'+id,{replies:reps}).then(()=>load().then(()=>open(id))).catch(e=>alert(e.message));
    }
  });
  $$('.dr').forEach(b=>b.onclick=()=>{S.del={type:'reply',tid:id,rid:b.dataset.id};$('#modalTxt').textContent='¿Eliminar respuesta?';$('#modal').hidden=false});
  $('#replyIn').value='';
}

function startEdit(t){
  S.edit=t.id;$('#formTitle').textContent='Editar hilo';$('#submitBtn').textContent='Guardar';
  $('#tTitle').value=t.title;$('#tCat').value=t.category;$('#tContent').value=t.content;show('form');
}

document.addEventListener('DOMContentLoaded',()=>{
  const html=document.documentElement;
  const th=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:light)').matches?'light':'dark');
  html.setAttribute('data-theme',th);$('#themeBtn').textContent=th==='dark'?'☀️':'🌙';
  $('#themeBtn').onclick=()=>{const n=html.getAttribute('data-theme')==='dark'?'light':'dark';html.setAttribute('data-theme',n);localStorage.setItem('theme',n);$('#themeBtn').textContent=n==='dark'?'☀️':'🌙'};

  $('#menuBtn').onclick=()=>{$('#nav').classList.toggle('open');$('#menuBtn').textContent=$('#nav').classList.contains('open')?'Cerrar':'Menú'};
  $$('.nav a').forEach(a=>a.onclick=e=>{e.preventDefault();$('#nav').classList.remove('open');$('#menuBtn').textContent='Menú';
    if(a.dataset.v==='home'){S.cat=null;renderHome()}else{S.cat=a.dataset.c;renderHome()}});
  $('#logo').onclick=e=>{e.preventDefault();S.cat=null;renderHome()};

  $('#nameIn').value=name()==='Anónimo'?'':name();
  $('#saveName').onclick=()=>{const n=setName($('#nameIn').value);$('#nameIn').value=n==='Anónimo'?'':n;alert('Guardado: '+n)};

  $('#newBtn').onclick=$('#emptyNew').onclick=()=>{S.edit=null;$('#formTitle').textContent='Nuevo hilo';$('#submitBtn').textContent='Publicar';$('#threadForm').reset();if(S.cat)$('#tCat').value=S.cat;show('form')};
  $('#sort').onchange=e=>{S.sort=e.target.value;renderHome()};
  $('#back').onclick=()=>{S.tid=null;renderHome()};
  $('#backForm').onclick=()=>S.tid?open(S.tid):renderHome();

  $('#threadForm').onsubmit=async e=>{
    e.preventDefault();
    const title=$('#tTitle').value.trim(),category=$('#tCat').value,content=$('#tContent').value.trim();
    if(!title||!content)return;
    const now=new Date().toISOString(),author=name();
    try{
      if(S.edit){
        if(!isOwn(S.edit))throw new Error('No eres el propietario');
        await api('PUT','/threads/'+S.edit,{title,category,content,updated_at:now});
        const id=S.edit;S.edit=null;await load();open(id);
      }else{
        const id=uid(),token=uid();
        await api('POST','/threads',{id,title,category,content,author,created_at:now,updated_at:now,replies:[]});
        saveT(id,token);await load();open(id);
      }
    }catch(err){alert(err.message)}
  };

  $('#replyForm').onsubmit=async e=>{
    e.preventDefault();
    const content=$('#replyIn').value.trim();if(!content||!S.tid)return;
    const t=S.threads.find(x=>x.id===S.tid);if(!t)return;
    const rid=uid(),token=uid();
    const reply={id:rid,content,author:name(),createdAt:new Date().toISOString()};
    const replies=[...(t.replies||[]),reply];
    try{
      await api('PUT','/threads/'+S.tid,{replies,updated_at:new Date().toISOString()});
      saveT(rid,token);await load();open(S.tid);
    }catch(err){alert(err.message)}
  };

  $('#okDel').onclick=async()=>{
    if(!S.del)return;
    try{
      if(S.del.type==='thread'){
        if(!isOwn(S.del.id))throw new Error('No eres el propietario');
        await api('DELETE','/threads/'+S.del.id);delT(S.del.id);S.tid=null;await load();renderHome();
      }else{
        if(!isOwn(S.del.rid))throw new Error('No eres el propietario');
        const t=S.threads.find(x=>x.id===S.del.tid);
        const replies=(t.replies||[]).filter(r=>r.id!==S.del.rid);
        await api('PUT','/threads/'+S.del.tid,{replies});delT(S.del.rid);await load();open(S.del.tid);
      }
    }catch(err){alert(err.message)}
    $('#modal').hidden=true;S.del=null;
  };
  $('#noDel').onclick=()=>{$('#modal').hidden=true;S.del=null};

  load();
});
})();
