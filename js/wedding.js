(()=>{
const form=document.querySelector('#weddingBuilder');if(!form)return;
const steps=[...document.querySelectorAll('.wedStep')],bars=[...document.querySelectorAll('.wedProgress span')],prev=document.querySelector('#wedPrev'),next=document.querySelector('#wedNext');let step=0;
const today=new Date(),date=form.elements.date;date.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
const checked=name=>[...form.querySelectorAll(`[name="${name}"]:checked`)].map(x=>x.value);
function coverageState(){const c=checked('coverage'),whole=c.includes('Ceremony & Reception');return {c,hasCeremony:whole||c.includes('Ceremony'),hasReception:whole||c.includes('Reception')}}
function route(){const {c,hasCeremony,hasReception}=coverageState();if(!c.length)return [0,1,2,3,4,5];const r=[0];if(hasCeremony)r.push(1);if(hasReception)r.push(2);r.push(3,4,5);return r}
function smartLogic(){
 const {hasCeremony,hasReception}=coverageState();
 // Whole day is a complete coverage choice; individual choices are an alternative.
 const whole=form.querySelector('#both'),cer=form.querySelector('#ceremony'),rec=form.querySelector('#reception');
 if(whole.checked){cer.checked=false;rec.checked=false}
 // "Decide later" is exclusive with concrete ceremony choices.
 const later=form.querySelector('#ceremonyLater'),cerNeeds=[...form.querySelectorAll('[name="ceremonyNeeds"]:not(#ceremonyLater)')];
 if(later.checked)cerNeeds.forEach(x=>x.checked=false);
 // Don't offer wireless microphones twice if they are already requested for ceremony or speeches.
 const micAlready=form.querySelector('#ceremonyMic')?.checked||form.querySelector('#speeches')?.checked;
 const micExtra=document.querySelector('#wirelessExtraChoice'),micInput=form.querySelector('#wireless');
 if(micExtra){micExtra.style.display=micAlready?'none':'';if(micAlready)micInput.checked=false}
 const note=document.querySelector('#smartExtrasNote');
 if(note) note.textContent=micAlready?'Wireless microphones are already included in your selections, so we’ve removed that duplicate option.':'';
 // Give a useful first-dance prompt only when that moment was selected.
 const music=document.querySelector('#smartMusicDetails');
 if(music){
   const fd=form.querySelector('#firstDance')?.checked;
   music.innerHTML=fd?'<label class="wedField"><span>First dance song <small style="font-weight:400;color:#7f8b9d">(optional)</small></span><input name="firstDanceSong" placeholder="Song and artist — or leave it for later"></label>':'';
 }
 // Keep irrelevant selections out of the saved result if coverage changes.
 if(!hasCeremony)form.querySelectorAll('[name="ceremonyNeeds"]').forEach(x=>x.checked=false);
 if(!hasReception)form.querySelectorAll('[name="receptionNeeds"]').forEach(x=>x.checked=false);
}
function show(target){smartLogic();const r=route();if(!r.includes(target)){const nv=r.find(i=>i>target);target=nv===undefined?r[r.length-1]:nv}step=target;const pos=r.indexOf(step);steps.forEach((x,i)=>x.classList.toggle('active',i===step));bars.forEach((x,i)=>{const rp=r.indexOf(i);x.style.display=rp===-1?'none':'';x.classList.toggle('on',rp!==-1&&rp<=pos)});prev.style.visibility=pos>0?'visible':'hidden';next.innerHTML=pos===r.length-1?'Continue to wedding enquiry <span>→</span>':'Next step <span>→</span>';if(pos===r.length-1)summary();window.scrollTo({top:Math.max(0,document.querySelector('.wedProgress').offsetTop-120),behavior:'smooth'})}
function timeline(){return [...document.querySelectorAll('.timelineRow')].map(r=>{const i=r.querySelectorAll('input');return {time:i[0].value,event:i[1].value.trim()}}).filter(x=>x.time||x.event)}
function data(){const {hasCeremony,hasReception}=coverageState();return {date:form.elements.date.value,venue:form.elements.venue.value.trim(),guests:form.elements.guests.value,setting:form.elements.setting.value,coverage:checked('coverage'),ceremonyNeeds:hasCeremony?checked('ceremonyNeeds'):[],receptionNeeds:hasReception?checked('receptionNeeds'):[],style:checked('style')[0]||'',firstDanceSong:form.elements.firstDanceSong?.value.trim()||'',mustPlay:form.elements.mustPlay.value.trim(),wouldLove:form.elements.wouldLove.value.trim(),doNotPlay:form.elements.doNotPlay.value.trim(),extras:checked('extras'),timeline:timeline()}}
function summary(){const d=data(),{hasCeremony,hasReception}=coverageState(),items=[['Wedding',d.coverage.join(', ')||'Not decided yet'],['Date',d.date||'Not decided yet'],['Venue',d.venue||'Not decided yet'],['Guests',d.guests?`Approx. ${d.guests}`:'Not decided yet'],['Style',d.style||'Not decided yet']];if(hasCeremony)items.push(['Ceremony',d.ceremonyNeeds.join(', ')||'Not specified']);if(hasReception)items.push(['Reception',d.receptionNeeds.join(', ')||'Not specified']);if(d.firstDanceSong)items.push(['First dance',d.firstDanceSong]);items.push(['Extras',d.extras.join(', ')||'None selected']);document.querySelector('#wedSummary').innerHTML=items.map(([a,b])=>`<div class="summaryCard"><small>${a}</small><strong>${b}</strong></div>`).join('')}
prev.addEventListener('click',()=>{const r=route(),pos=r.indexOf(step);if(pos>0)show(r[pos-1])});
next.addEventListener('click',()=>{const r=route(),pos=r.indexOf(step);if(pos<r.length-1)return show(r[pos+1]);const d=data();localStorage.setItem('ozzsoundWeddingBuilder',JSON.stringify(d));location.href='index.html?from=wedding#contact'});
form.addEventListener('change',e=>{
 if(e.target.name==='coverage'){
   if(e.target.id==='both'&&e.target.checked){form.querySelector('#ceremony').checked=false;form.querySelector('#reception').checked=false}
   else if((e.target.id==='ceremony'||e.target.id==='reception')&&e.target.checked)form.querySelector('#both').checked=false;
 }
 if(e.target.name==='ceremonyNeeds'){
   if(e.target.id==='ceremonyLater'&&e.target.checked)form.querySelectorAll('[name="ceremonyNeeds"]:not(#ceremonyLater)').forEach(x=>x.checked=false);
   else if(e.target.checked)form.querySelector('#ceremonyLater').checked=false;
 }
 smartLogic();if(e.target.name==='coverage')show(step);
});
document.querySelector('#addTimeline').addEventListener('click',()=>{const row=document.createElement('div');row.className='timelineRow';row.innerHTML='<input type="time" aria-label="Timeline time"><input placeholder="e.g. Dance floor opens" aria-label="Timeline event"><button type="button" class="removeRow" aria-label="Remove row">×</button>';document.querySelector('#timeline').appendChild(row)});document.querySelector('#timeline').addEventListener('click',e=>{if(e.target.closest('.removeRow')&&document.querySelectorAll('.timelineRow').length>1)e.target.closest('.timelineRow').remove()});
show(0);
})();
