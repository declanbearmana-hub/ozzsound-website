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
