/* Optional Ozzsound music wishlist. iTunes Search API; no credentials required. */
(()=>{'use strict';
const form=document.querySelector('#enquiryForm'),root=document.querySelector('#musicWishlist');
if(!form||!root)return;
const state={song:[],artist:[]};
root.querySelectorAll('.musicPicker').forEach(picker=>{
 const kind=picker.dataset.kind,limit=Number(picker.dataset.limit),input=picker.querySelector('input'),results=picker.querySelector('.musicResults'),selected=picker.querySelector('.musicSelected'),count=picker.querySelector('.musicCount');
 let timer,controller,seq=0;
 const key=x=>String(x.id||x.name).toLowerCase();
 function render(){
  selected.replaceChildren();
  state[kind].forEach(item=>{
   const chip=document.createElement('div');chip.className='musicChip';
   if(item.art){const img=document.createElement('img');img.src=item.art;img.alt='';img.loading='lazy';chip.append(img)}
   const label=document.createElement('span');label.textContent=item.name;chip.append(label);
   const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+item.name);
   remove.addEventListener('click',()=>{state[kind]=state[kind].filter(x=>key(x)!==key(item));render()});chip.append(remove);selected.append(chip);
  });
  count.textContent=kind==='song'?state[kind].length+' / 15 selected':state[kind].length+' selected · 5+ suggested';
  input.disabled=state[kind].length>=limit;
  picker.querySelector('.musicManual').disabled=input.disabled;
 }
 function add(item){
  if(state[kind].length>=limit||state[kind].some(x=>key(x)===key(item)))return;
  state[kind].push(item);input.value='';results.replaceChildren();render();input.focus();
 }
 function resultButton(item){
  const btn=document.createElement('button');btn.type='button';btn.className='musicResult';btn.setAttribute('role','option');
  if(item.art){const img=document.createElement('img');img.src=item.art;img.alt='';img.loading='lazy';btn.append(img)}
  const text=document.createElement('span');text.textContent=item.name;btn.append(text);btn.addEventListener('click',()=>add(item));return btn;
 }
 input.addEventListener('input',()=>{
  clearTimeout(timer);if(controller)controller.abort();const request=++seq;results.replaceChildren();
  const query=input.value.trim();if(query.length<2)return;
  timer=setTimeout(async()=>{
   controller=new AbortController();
   try{
    const params=new URLSearchParams({term:query,entity:kind==='song'?'song':'musicArtist',media:'music',limit:'8',country:'AU'});
    const response=await fetch('https://itunes.apple.com/search?'+params,{signal:controller.signal});
    if(!response.ok)throw Error('Search unavailable');
    const data=await response.json();if(request!==seq)return;
    const seen=new Set();
    (data.results||[]).forEach(x=>{
     const name=kind==='song'?[(x.trackName||''),(x.artistName||'')].filter(Boolean).join(' — '):(x.artistName||'');
     if(!name)return;
     const id=kind==='song'?x.trackId:x.artistId;
     if(seen.has(id||name))return;seen.add(id||name);
     results.append(resultButton({id,name,art:x.artworkUrl100||''}));
    });
    if(!results.childElementCount)results.textContent='No matches. You can add your own entry below.';
   }catch(err){if(err.name!=='AbortError'&&request===seq)results.textContent='Search unavailable. You can add your own entry below.'}
  },300);
 });
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const first=results.querySelector('button');if(first)first.click();else picker.querySelector('.musicManual').click()}});
 picker.querySelector('.musicManual').addEventListener('click',()=>{const name=input.value.trim().slice(0,160);if(name)add({name,art:''})});
 render();
});
/* Capture before existing enquiry submit listener, preserving existing persistence and email paths. */
form.addEventListener('submit',()=>{
 const message=form.querySelector('textarea[name="message"]');if(!message)return;
 const songs=state.song.map((x,i)=>(i+1)+'. '+x.name),artists=state.artist.map((x,i)=>(i+1)+'. '+x.name);
 const marker='\n\nMusic wishlist (optional):\n';
 const previous=message.dataset.musicWishlistBase??message.value;
 message.dataset.musicWishlistBase=previous;
 message.value=previous+(songs.length||artists.length?marker+(songs.length?'Favourite songs:\n'+songs.join('\n')+'\n':'')+(artists.length?'Favourite artists / bands / groups:\n'+artists.join('\n'):''):'');
},true);
})();