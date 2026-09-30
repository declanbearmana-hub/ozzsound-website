(()=>{
'use strict';
if(!/\/admin(?:\/|\/index\.html$)/i.test(location.pathname))return;
if(window.__OZZSOUND_ADMIN_ATTENTION_LOADED__)return;
window.__OZZSOUND_ADMIN_ATTENTION_LOADED__=true;
const cfg=window.OZZSOUND_CONFIG||{};
const state={rows:new Map(),db:null,busy:false,loaded:false};
const refOf=text=>(String(text||'').match(/OZZ-[A-Z0-9]+/i)||[])[0]?.toUpperCase()||'';
const style=document.createElement('style');
style.textContent=`.attention-new{border-color:rgba(255,56,209,.72)!important;box-shadow:0 0 18px rgba(255,56,209,.12)!important}.mark-new-btn{border:1px solid rgba(255,56,209,.55);background:rgba(255,56,209,.08);color:#ffd4f6;border-radius:10px;padding:10px 12px;font-weight:850;cursor:pointer;width:100%;margin-top:7px}.mark-new-btn:hover{background:rgba(255,56,209,.16)}.mark-new-btn.is-new{color:#fff;background:rgba(255,56,209,.18)}.mark-new-btn:disabled{opacity:.55;cursor:wait}`;
document.head.appendChild(style);
function getDb(){
 if(window.OZZSOUND_ADMIN_CLIENT)return window.OZZSOUND_ADMIN_CLIENT;
 if(window.supabase&&cfg.supabaseUrl&&cfg.supabasePublishableKey)return window.supabase.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
 return null;
}
function cardForButton(btn){let n=btn;for(let i=0;i<7&&n;i++,n=n.parentElement){if(refOf(n.innerText))return n}return btn.parentElement}
function updateCounters(){
 if(!state.loaded)return;
 const count=[...state.rows.values()].filter(x=>x.admin_attention).length;
 document.querySelectorAll('.workspace-tab').forEach(el=>{if(/^New Enquiries/i.test((el.textContent||'').trim())){const badge=el.querySelector('.workspace-badge');if(badge)badge.textContent=String(count);el.classList.toggle('new-alert',count>0)}});
 document.querySelectorAll('.dashboard-action-row').forEach(row=>{if(/^New enquiries/i.test((row.innerText||'').trim())){const n=row.querySelector('.dashboard-action-count');if(n)n.textContent=String(count)}});
}
function render(){
 document.querySelectorAll('button').forEach(open=>{
  if(!/^Open Enquiry$/i.test((open.textContent||'').trim()))return;
  const card=cardForButton(open),ref=refOf(card?.innerText);if(!card||!ref)return;
  const row=state.rows.get(ref);
  card.classList.toggle('attention-new',!!row?.admin_attention);
  let btn=card.querySelector('.mark-new-btn');
  if(!btn){btn=document.createElement('button');btn.type='button';btn.className='mark-new-btn';open.parentElement?.appendChild(btn)}
  btn.dataset.ref=ref;
  btn.disabled=!state.loaded||!row;
  btn.classList.toggle('is-new',!!row?.admin_attention);
  btn.textContent=!state.loaded?'Loading…':!row?'Mark as New':row.admin_attention?'Marked as New ✓':'Mark as New';
 });
 updateCounters();
}
async function load(){
 const db=state.db=getDb();if(!db)return false;
 const {data,error}=await db.from('enquiries').select('id,enquiry_ref,admin_attention');
 if(error){console.warn('Could not load admin attention flags',error);return false}
 state.rows=new Map((data||[]).map(x=>[String(x.enquiry_ref||'').toUpperCase(),x]));state.loaded=true;render();return true;
}
async function setAttention(ref,value){
 const row=state.rows.get(ref);if(!row||state.busy||!state.db)return;state.busy=true;render();
 try{const {error}=await state.db.from('enquiries').update({admin_attention:value}).eq('id',row.id);if(error)throw error;row.admin_attention=value;render()}catch(e){console.error('Could not update admin attention flag',e);alert('Could not update this enquiry. Please try again.')}finally{state.busy=false;render()}
}
document.addEventListener('click',e=>{
 const mark=e.target.closest?.('.mark-new-btn');if(mark){e.preventDefault();e.stopPropagation();setAttention(mark.dataset.ref,true);return}
 const open=e.target.closest?.('button');if(open&&/^Open Enquiry$/i.test((open.textContent||'').trim())){const card=cardForButton(open),ref=refOf(card?.innerText);if(ref&&state.rows.get(ref)?.admin_attention)setTimeout(()=>setAttention(ref,false),150)}
},true);
const observer=new MutationObserver(()=>{clearTimeout(observer.t);observer.t=setTimeout(render,80)});observer.observe(document.documentElement,{childList:true,subtree:true});
render();
let tries=0;const timer=setInterval(async()=>{tries++;render();if(await load()){clearInterval(timer)}else if(tries>60){clearInterval(timer);render()}},250);
})();
