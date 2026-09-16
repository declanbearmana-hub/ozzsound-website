const cfg=window.OZZSOUND_CONFIG||{};
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Contact details stay unpublished until real details are supplied.
const contact=document.querySelector('#contactButton');
if(contact&&cfg.email){contact.href=`mailto:${cfg.email}`;contact.textContent='Check availability →';}

// Cinematic mixed photo/video hero with true crossfades. Missing future media is skipped.
const hero=document.querySelector('.hero');
const layers=[document.querySelector('.layerA'),document.querySelector('.layerB')];
let activeLayer=0, heroTimer=null;
const candidates=Array.isArray(cfg.heroMedia)?cfg.heroMedia:[];
const usable=[];
function probe(item){return new Promise(resolve=>{if(!item||!item.src)return resolve(false);if(item.type==='video'){const v=document.createElement('video');v.preload='metadata';v.muted=true;v.playsInline=true;v.onloadedmetadata=()=>resolve(true);v.onerror=()=>resolve(false);v.src=item.src;}else{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=item.src;}})}
function mount(layer,item){layer.innerHTML='';let el;if(item.type==='video'){el=document.createElement('video');el.src=item.src;el.muted=true;el.playsInline=true;el.autoplay=true;el.loop=true;el.preload='auto';if(item.poster)el.poster=item.poster;el.setAttribute('aria-hidden','true');}else{el=document.createElement('img');el.src=item.src;el.alt='';el.setAttribute('aria-hidden','true');}layer.appendChild(el);requestAnimationFrame(()=>layer.classList.add('show'));if(el.play)el.play().catch(()=>{});}
function cycleHero(index=0){if(!usable.length)return;const item=usable[index%usable.length], next=layers[1-activeLayer], old=layers[activeLayer];next.classList.remove('show');mount(next,item);setTimeout(()=>{old.classList.remove('show');activeLayer=1-activeLayer;},80);if(!reduceMotion&&usable.length>1)heroTimer=setTimeout(()=>cycleHero((index+1)%usable.length),item.duration||7000);}
Promise.all(candidates.map(async x=>(await probe(x))?x:null)).then(found=>{usable.push(...found.filter(Boolean));if(usable.length)cycleHero(0);});

const details={weddings:['Weddings','Music and atmosphere shaped around your day — from arrivals and formalities through to the dance floor.'],parties:['Birthdays & Parties','Milestones, private functions and celebrations with a soundtrack built around your crowd.'],kids:['Kids & Teens','Age-appropriate entertainment for birthdays, school events, family functions and younger crowds.'],corporate:['Corporate Events','Clean, professional entertainment for staff functions, launches, awards nights and business events.'],sporting:['Sporting Events','Club nights, presentations, celebrations and sporting functions that need energy and reliable sound.'],karaoke:['Karaoke','Hosted karaoke for parties, venues, corporate events and private functions — built around the crowd and the night.'],other:['Your Event','If it needs music, sound and atmosphere, Ozzsound can tailor an entertainment setup around it.']};
document.querySelectorAll('.event').forEach(card=>card.addEventListener('click',()=>{document.querySelectorAll('.event').forEach(x=>x.classList.remove('active'));card.classList.add('active');const d=details[card.dataset.event];document.querySelector('#detailTitle').textContent=d[0];document.querySelector('#detailText').textContent=d[1];document.querySelector('.eventDetail').animate([{opacity:.45,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});}));

document.documentElement.classList.add('js-reveal');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

if(!reduceMotion&&matchMedia('(pointer:fine)').matches){hero?.addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',`${e.clientX/window.innerWidth*100}%`);document.documentElement.style.setProperty('--my',`${e.clientY/window.innerHeight*100}%`);});document.querySelectorAll('.btn').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.035}px,${(e.clientY-r.top-r.height/2)*.055-3}px)`;});b.addEventListener('pointerleave',()=>b.style.transform='');});window.addEventListener('scroll',()=>{const y=window.scrollY;document.documentElement.style.setProperty('--scrollY',`${Math.min(y*.08,42)}px`);},{passive:true});}

// Public availability calendar. Edit bookedDates / limitedDates in config/site-config.js.
(()=>{const grid=document.querySelector('#calendarGrid');if(!grid)return;const monthLabel=document.querySelector('#calendarMonth'),result=document.querySelector('#dateResult'),enquire=document.querySelector('#dateEnquire');const booked=new Set(cfg.bookedDates||[]),limited=new Set(cfg.limitedDates||[]);const today=new Date();today.setHours(0,0,0,0);let view=new Date(today.getFullYear(),today.getMonth(),1);const pad=n=>String(n).padStart(2,'0'),key=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;function render(){grid.innerHTML='';const y=view.getFullYear(),m=view.getMonth();monthLabel.textContent=view.toLocaleDateString('en-AU',{month:'long',year:'numeric'});['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(x=>{const e=document.createElement('div');e.className='weekday';e.textContent=x;grid.appendChild(e)});let first=new Date(y,m,1).getDay();first=(first+6)%7;for(let i=0;i<first;i++){const e=document.createElement('div');e.className='calDay empty';grid.appendChild(e)}const days=new Date(y,m+1,0).getDate();for(let d=1;d<=days;d++){const dt=new Date(y,m,d),k=key(y,m,d),b=document.createElement('button');b.type='button';b.className='calDay';const isPast=dt<today,status=booked.has(k)?'booked':limited.has(k)?'limited':'available';b.classList.add(isPast?'past':status);b.disabled=isPast||status==='booked';b.innerHTML=`<span>${d}</span><small>${isPast?'Past':status==='booked'?'Booked':status==='limited'?'Enquire':'Available'}</small>`;b.setAttribute('aria-label',`${dt.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}: ${isPast?'past':status}`);if(!b.disabled)b.addEventListener('click',()=>select(dt,k,status,b));grid.appendChild(b)}}function select(dt,k,status,b){grid.querySelectorAll('.selected').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');const pretty=dt.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric'});result.classList.add('actionable');result.querySelector('strong').textContent=status==='limited'?`${pretty} — Limited availability`:`${pretty} — Available`;result.querySelector('p').textContent=status==='limited'?'This date may still be possible. Send an enquiry to confirm.':'This date is currently showing as available. Send an enquiry to confirm your booking.';enquire.dataset.date=k;enquire.textContent='Enquire about this date →'}document.querySelector('#calPrev').addEventListener('click',()=>{const prev=new Date(view.getFullYear(),view.getMonth()-1,1);if(prev>=new Date(today.getFullYear(),today.getMonth(),1)){view=prev;render()}});document.querySelector('#calNext').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()});render()})();

// Compact sticky header after leaving the top. Clicking the logo always returns home.
(()=>{const nav=document.querySelector('.nav'),brand=document.querySelector('.brand');if(!nav)return;const updateNav=()=>nav.classList.toggle('nav-scrolled',window.scrollY>120);updateNav();window.addEventListener('scroll',updateNav,{passive:true});if(brand){brand.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});});}})();

// Stage 1 booking funnel: calendar/event cards prefill the enquiry form.
(()=>{
  const form=document.querySelector('#enquiryForm'); if(!form)return;
  const eventSelect=document.querySelector('#eventType'), dateInput=document.querySelector('#eventDate');
  const submit=document.querySelector('#submitEnquiry'), status=document.querySelector('#formStatus');
  const fallback=document.querySelector('#contactFallback');
  const eventMap={weddings:'Wedding',parties:'Birthday & Party',kids:'Kids & Teens',corporate:'Corporate Event',sporting:'Sporting Event',karaoke:'Karaoke',other:'Other Event'};
  const today=new Date(); dateInput.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  document.querySelectorAll('.event').forEach(card=>card.addEventListener('click',()=>{eventSelect.value=eventMap[card.dataset.event]||'';}));
  document.querySelector('.eventDetail .btn')?.addEventListener('click',()=>{const active=document.querySelector('.event.active');if(active)eventSelect.value=eventMap[active.dataset.event]||'';});
  document.querySelector('#dateEnquire')?.addEventListener('click',e=>{const k=e.currentTarget.dataset.date;if(k)dateInput.value=k;});

  if(cfg.email){fallback.hidden=true;submit.disabled=false;}else{submit.disabled=true;status.textContent='The enquiry form is ready. Add the new Ozzsound email in site-config.js to activate sending.';}

  form.addEventListener('submit',e=>{
    e.preventDefault(); if(!form.reportValidity()||!cfg.email)return;
    const d=new FormData(form), subject=`Ozzsound enquiry — ${d.get('eventType')} — ${d.get('eventDate')}`;
    const body=[`Name: ${d.get('name')}`,`Phone: ${d.get('phone')}`,`Email: ${d.get('email')||'Not supplied'}`,`Event: ${d.get('eventType')}`,`Date: ${d.get('eventDate')}`,`Venue / suburb: ${d.get('venue')}`,`Approx. guests: ${d.get('guests')||'Not supplied'}`,`Times: ${d.get('times')||'Not supplied'}`,'',`Message:`,d.get('message')||'No additional message'].join('\n');
    window.location.href=`mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  const mobileCta=document.querySelector('.mobileDateCta'), availability=document.querySelector('#availability');
  if(mobileCta&&availability){const update=()=>{const r=availability.getBoundingClientRect();mobileCta.classList.toggle('hide',r.top<window.innerHeight*.72&&r.bottom>80)};update();window.addEventListener('scroll',update,{passive:true});}
})();

// Stage 2 reviews: the section stays completely hidden until genuine reviews are added to config.
(()=>{
  const section=document.querySelector('#reviews'), grid=document.querySelector('#reviewGrid');
  const reviews=Array.isArray(cfg.testimonials)?cfg.testimonials.filter(x=>x&&x.quote&&x.name):[];
  if(!section||!grid||!reviews.length)return;
  reviews.slice(0,6).forEach(r=>{
    const card=document.createElement('article'); card.className='reviewCard';
    const quote=document.createElement('blockquote'); quote.textContent=r.quote;
    const name=document.createElement('strong'); name.textContent=r.name;
    const event=document.createElement('small'); event.textContent=r.event||'Ozzsound client';
    const stars=document.createElement('div'); stars.className='reviewStars'; stars.setAttribute('aria-label','Client review'); stars.textContent='★★★★★';
    card.append(quote,name,event,stars); grid.appendChild(card);
  });
  section.hidden=false;
})();

// Stage 3 mobile menu: full-screen navigation, keyboard friendly and closes after selection.
(()=>{
  const toggle=document.querySelector('#menuToggle'), menu=document.querySelector('#mobileMenu');
  if(!toggle||!menu)return;
  const setOpen=open=>{
    toggle.classList.toggle('open',open); menu.classList.toggle('open',open);
    document.body.classList.toggle('menu-open',open); toggle.setAttribute('aria-expanded',String(open));
    toggle.setAttribute('aria-label',open?'Close menu':'Open menu'); menu.setAttribute('aria-hidden',String(!open));
  };
  toggle.addEventListener('click',()=>setOpen(!menu.classList.contains('open')));
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});
  addEventListener('resize',()=>{if(innerWidth>800)setOpen(false)},{passive:true});
})();


// Stage 4 cinematic media gallery + optional event imagery.
(()=>{
  const grid=document.querySelector('#mediaGrid'), filters=document.querySelector('#galleryFilters');
  const box=document.querySelector('#mediaLightbox'), stage=document.querySelector('#lightboxStage'), caption=document.querySelector('#lightboxCaption');
  if(!grid)return;
  const media=Array.isArray(cfg.galleryMedia)?cfg.galleryMedia.filter(x=>x&&x.src):[]; let live=[], current=0;
  const exists=item=>new Promise(resolve=>{if(item.type==='video'){const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>resolve(true);v.onerror=()=>resolve(false);v.src=item.src}else{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=item.src}});
  const makeCard=(item,i)=>{const card=document.createElement('article');card.className='mediaCard'+(i===0?' featureMedia':'');card.dataset.label=item.label||item.category||'Ozzsound event';card.dataset.category=item.category||'general';card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`View ${item.label||'event media'}`);let el;if(item.type==='video'){el=document.createElement('video');el.src=item.src;el.muted=true;el.playsInline=true;el.preload='metadata';if(item.poster)el.poster=item.poster;const play=document.createElement('span');play.className='mediaPlay';play.textContent='▶';card.append(el,play)}else{el=document.createElement('img');el.src=item.src;el.alt=item.label||'Ozzsound event';el.loading='lazy';card.append(el)}card.addEventListener('click',()=>open(i));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open(i)}});return card};
  function open(i){if(!live.length)return;current=(i+live.length)%live.length;const item=live[current];stage.innerHTML='';let el;if(item.type==='video'){el=document.createElement('video');el.src=item.src;el.controls=true;el.autoplay=true;el.playsInline=true;if(item.poster)el.poster=item.poster}else{el=document.createElement('img');el.src=item.src;el.alt=item.label||'Ozzsound event'}stage.appendChild(el);caption.textContent=item.label||'';box.classList.add('open');box.setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
  function close(){box?.classList.remove('open');box?.setAttribute('aria-hidden','true');stage.innerHTML='';document.body.style.overflow=''}
  Promise.all(media.map(async x=>(await exists(x))?x:null)).then(items=>{live=items.filter(Boolean);if(!live.length)return;grid.innerHTML='';live.forEach((x,i)=>grid.appendChild(makeCard(x,i)))});
  filters?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;filters.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.filter;grid.querySelectorAll('.mediaCard').forEach(c=>c.classList.toggle('filtered',f!=='all'&&c.dataset.category!==f))});
  box?.querySelector('.lightboxClose')?.addEventListener('click',close);box?.querySelector('.lightboxPrev')?.addEventListener('click',()=>open(current-1));box?.querySelector('.lightboxNext')?.addEventListener('click',()=>open(current+1));box?.addEventListener('click',e=>{if(e.target===box)close()});document.addEventListener('keydown',e=>{if(!box?.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')open(current-1);if(e.key==='ArrowRight')open(current+1)});

  Object.entries(cfg.eventMedia||{}).forEach(([key,src])=>{const card=document.querySelector(`.event[data-event="${key}"]`);if(!card||!src)return;const im=new Image();im.onload=()=>{card.style.backgroundImage=`url("${src}")`;card.classList.add('hasMedia')};im.src=src});
})();

// Stage 4 hero slide meter — appears only when usable hero media is present.
(()=>{const p=document.querySelector('#heroProgress');if(!p)return;const items=Array.isArray(cfg.heroMedia)?cfg.heroMedia:[];if(items.length<2){p.hidden=true;return}p.innerHTML=items.map(()=>'<i></i>').join('');let n=0;const bars=[...p.children];const run=()=>{bars.forEach((b,i)=>b.classList.toggle('active',i===n%bars.length));const d=items[n%items.length]?.duration||7000;p.style.setProperty('--hero-duration',`${d}ms`);n++;setTimeout(run,d)};if(!reduceMotion)run();else bars[0]?.classList.add('active')})();

// Stage 4.1 — Karaoke + interactive gear hire.
(()=>{
  const eventType=document.querySelector('#eventType'), message=document.querySelector('textarea[name="message"]');
  const selected=new Set(), text=document.querySelector('#gearSelectionText'), gearEnquire=document.querySelector('#gearEnquire');
  const sync=()=>{const items=[...selected]; if(text) text.textContent=items.length?items.join(' · '):'Nothing selected yet'; if(gearEnquire) gearEnquire.classList.toggle('ready',items.length>0)};
  document.querySelectorAll('.gearCard').forEach(card=>card.addEventListener('click',()=>{const item=card.dataset.gear; if(selected.has(item))selected.delete(item);else selected.add(item);card.classList.toggle('selected',selected.has(item));card.querySelector('b').textContent=selected.has(item)?'Selected ✓':'Select +';sync()}));
  const applyService=(service)=>{if(eventType)eventType.value=service; if(service==='Gear Hire'&&selected.size&&message){const line='Gear hire interest: '+[...selected].join(', ')+'.'; if(!message.value.includes('Gear hire interest:'))message.value=(message.value?message.value+'\n\n':'')+line;}}
  document.querySelectorAll('.serviceEnquire').forEach(a=>a.addEventListener('click',()=>applyService(a.dataset.service)));
  gearEnquire?.addEventListener('click',()=>applyService('Gear Hire'));
})();

// Stage 4.2 — Configurable gear catalogue, quantity, hire period and enquiry cart.
(()=>{
  const catalogue=document.querySelector('#hireCatalogue'); if(!catalogue)return;
  const products=Array.isArray(cfg.gearCatalogue)?cfg.gearCatalogue:[];
  const cart=new Map(), cartItems=document.querySelector('#hireCartItems'), empty=document.querySelector('#hireCartEmpty');
  const summary=document.querySelector('#gearSelectionText'), enquire=document.querySelector('#gearEnquire');
  const period=document.querySelector('#overallHirePeriod'), hireDate=document.querySelector('#gearHireDate');
  const eventType=document.querySelector('#eventType'), eventDate=document.querySelector('#eventDate'), message=document.querySelector('textarea[name="message"]');
  const icons={sound:'🔊',lighting:'✦',microphones:'🎤',karaoke:'🎙',dj:'◉'};
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const renderProduct=p=>{const a=document.createElement('article');a.className='hireProduct';a.dataset.category=p.category||'other';a.innerHTML=`<div class="hireProductVisual"><div class="gearFallback">${icons[p.category]||'♫'}</div><small>${esc(p.category)}</small></div><div class="hireProductBody"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="hireControls"><label><span>Qty</span><input class="hireQty" type="number" min="1" max="20" value="1"></label><label><span>Hire period</span><select class="itemPeriod"><option>1 day</option><option>2 days</option><option>Weekend</option><option>3–7 days</option><option>Discuss with us</option></select></label></div><button class="addHire" type="button">Add to hire list +</button></div>`;
    if(p.image){const im=new Image();im.onload=()=>{const v=a.querySelector('.hireProductVisual');v.querySelector('.gearFallback')?.remove();im.alt=p.name||'Ozzsound hire gear';v.prepend(im)};im.src=p.image}
    a.querySelector('.addHire').addEventListener('click',()=>{const qty=Math.max(1,Number(a.querySelector('.hireQty').value)||1), per=a.querySelector('.itemPeriod').value;cart.set(p.id,{...p,qty,period:per});sync();a.querySelector('.addHire').textContent='Added ✓';setTimeout(()=>a.querySelector('.addHire').textContent='Update hire list +',900)});return a};
  products.forEach(p=>catalogue.appendChild(renderProduct(p)));
  function sync(){cartItems.innerHTML='';const vals=[...cart.values()];empty.hidden=vals.length>0;vals.forEach(x=>{const r=document.createElement('div');r.className='hireCartRow';r.innerHTML=`<strong>${esc(x.name)}</strong><span>Qty ${x.qty}</span><span>${esc(x.period)}</span><button type="button" aria-label="Remove ${esc(x.name)}">×</button>`;r.querySelector('button').onclick=()=>{cart.delete(x.id);sync()};cartItems.appendChild(r)});summary.textContent=vals.length?`${vals.reduce((n,x)=>n+x.qty,0)} item${vals.reduce((n,x)=>n+x.qty,0)===1?'':'s'} · ${vals.length} gear type${vals.length===1?'':'s'} selected`:'Nothing selected yet';enquire.classList.toggle('ready',vals.length>0)}
  document.querySelector('#clearHire')?.addEventListener('click',()=>{cart.clear();sync()});
  document.querySelector('#gearFilters')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#gearFilters button').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.gearFilter;document.querySelectorAll('.hireProduct').forEach(x=>x.classList.toggle('filtered',f!=='all'&&x.dataset.category!==f))});
  const today=new Date(); if(hireDate)hireDate.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  enquire?.addEventListener('click',()=>{const vals=[...cart.values()];if(eventType)eventType.value='Gear Hire';if(hireDate?.value&&eventDate)eventDate.value=hireDate.value;if(!vals.length||!message)return;const lines=['Gear hire request:',...vals.map(x=>`- ${x.name} — Qty ${x.qty} — ${x.period}`),`Overall hire period: ${period?.value||'Not specified'}`,`Hire date: ${hireDate?.value||'Not specified'}`];const block=lines.join('\n');const old=message.value.replace(/\n*Gear hire request:[\s\S]*$/,'').trim();message.value=(old?old+'\n\n':'')+block});
  sync();
})();
