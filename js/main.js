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

const details={weddings:['Weddings','Music and atmosphere shaped around your day — from arrivals and formalities through to the dance floor.'],parties:['Birthdays & Parties','Milestones, private functions and celebrations with a soundtrack built around your crowd.'],kids:['Kids & Teens','Age-appropriate entertainment for birthdays, school events, family functions and younger crowds.'],corporate:['Corporate Events','Clean, professional entertainment for staff functions, launches, awards nights and business events.'],sporting:['Sporting Events','Club nights, presentations, celebrations and sporting functions that need energy and reliable sound.'],other:['Your Event','If it needs music, sound and atmosphere, Ozzsound can tailor an entertainment setup around it.']};
document.querySelectorAll('.event').forEach(card=>card.addEventListener('click',()=>{document.querySelectorAll('.event').forEach(x=>x.classList.remove('active'));card.classList.add('active');const d=details[card.dataset.event];document.querySelector('#detailTitle').textContent=d[0];document.querySelector('#detailText').textContent=d[1];document.querySelector('.eventDetail').animate([{opacity:.45,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});}));

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
  const eventMap={weddings:'Wedding',parties:'Birthday & Party',kids:'Kids & Teens',corporate:'Corporate Event',sporting:'Sporting Event',other:'Other Event'};
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
