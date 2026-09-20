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

const details={weddings:['Weddings','Music and atmosphere shaped around your day — from arrivals and formalities through to the dance floor.'],parties:['Birthdays & Parties','Milestones, private functions and celebrations with a soundtrack built around your crowd.'],schools:['School Functions','School discos, formals, graduations, presentations and celebrations with entertainment built around the students and the event.'],seasonal:['Seasonal Events','Halloween, Christmas, New Year and themed celebrations with costume competitions, impressions, games and crowd interaction available.'],corporate:['Corporate Events','Clean, professional entertainment for staff functions, launches, awards nights and business events.'],sporting:['Sporting Events','Club nights, presentations, celebrations and sporting functions that need energy and reliable sound.'],karaoke:['Karaoke','Hosted karaoke for parties, venues, corporate events and private functions — built around the crowd and the night.'],other:['Your Event','If it needs music, sound and atmosphere, Ozzsound can tailor an entertainment setup around it.']};
document.querySelectorAll('.event').forEach(card=>card.addEventListener('click',()=>{document.querySelectorAll('.event').forEach(x=>x.classList.remove('active'));card.classList.add('active');}));;

document.documentElement.classList.add('js-reveal');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

if(!reduceMotion&&matchMedia('(pointer:fine)').matches){hero?.addEventListener('pointermove',e=>{document.documentElement.style.setProperty('--mx',`${e.clientX/window.innerWidth*100}%`);document.documentElement.style.setProperty('--my',`${e.clientY/window.innerHeight*100}%`);});document.querySelectorAll('.btn').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.035}px,${(e.clientY-r.top-r.height/2)*.055-3}px)`;});b.addEventListener('pointerleave',()=>b.style.transform='');});window.addEventListener('scroll',()=>{const y=window.scrollY;document.documentElement.style.setProperty('--scrollY',`${Math.min(y*.08,42)}px`);},{passive:true});}

// Public availability calendar.
//
// Confirmed DJ bookings always take priority.
// Admin calendar overrides can mark a date unavailable, limited,
// explicitly available, or available from a chosen time.
// Both sources refresh live without reloading the page or clearing
// anything a customer has typed into an enquiry form.
(()=>{
  const grid=document.querySelector('#calendarGrid');
  if(!grid)return;

  const monthLabel=document.querySelector('#calendarMonth');
  const result=document.querySelector('#dateResult');
  const enquire=document.querySelector('#dateEnquire');
  const manualBooked=new Set(cfg.bookedDates||[]);
  const confirmedBooked=new Set();
  const overrides=new Map();
  const legacyLimited=new Set(cfg.limitedDates||[]);
  const today=new Date();
  today.setHours(0,0,0,0);

  let view=new Date(today.getFullYear(),today.getMonth(),1);
  let selectedKey='';
  let selectedPretty='';
  let availabilityClient=null;
  let availabilityChannel=null;

  const pad=n=>String(n).padStart(2,'0');
  const key=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
  const isBooked=k=>manualBooked.has(k)||confirmedBooked.has(k);

  const formatCalendarTime=value=>{
    if(!value)return '';
    const parts=String(value).split(':');
    const hour24=Number(parts[0]);
    const minute=Number(parts[1]||0);
    if(!Number.isFinite(hour24))return '';
    const period=hour24>=12?'PM':'AM';
    const hour12=hour24%12||12;
    return `${hour12}:${String(minute).padStart(2,'0')} ${period}`;
  };

  const statusFor=k=>{
    if(isBooked(k)){
      return {
        status:'booked',
        label:'Booked',
        publicLabel:'',
        time:''
      };
    }

    const override=overrides.get(k);

    if(override){
      const status=override.status||'available';
      const time=formatCalendarTime(
        override.available_from_time
      );

      return {
        status,
        time,
        publicLabel:String(
          override.public_label||''
        ).trim(),
        label:
          status==='unavailable'
            ?'Unavailable'
            :status==='limited'
              ?'Enquire'
              :status==='available_from'
                ?(time?`From ${time}`:'Available later')
                :'Available'
      };
    }

    if(legacyLimited.has(k)){
      return {
        status:'limited',
        label:'Enquire',
        publicLabel:'',
        time:''
      };
    }

    return {
      status:'available',
      label:'Available',
      publicLabel:'',
      time:''
    };
  };

  function render(){
    grid.innerHTML='';

    const y=view.getFullYear();
    const m=view.getMonth();

    monthLabel.textContent=view.toLocaleDateString(
      'en-AU',
      {month:'long',year:'numeric'}
    );

    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(x=>{
      const e=document.createElement('div');
      e.className='weekday';
      e.textContent=x;
      grid.appendChild(e);
    });

    let first=new Date(y,m,1).getDay();
    first=(first+6)%7;

    for(let i=0;i<first;i++){
      const e=document.createElement('div');
      e.className='calDay empty';
      grid.appendChild(e);
    }

    const days=new Date(y,m+1,0).getDate();

    for(let d=1;d<=days;d++){
      const dt=new Date(y,m,d);
      const k=key(y,m,d);
      const b=document.createElement('button');

      b.type='button';
      b.className='calDay';

      const isPast=dt<today;
      const info=statusFor(k);
      const status=info.status;

      b.classList.add(
        isPast
          ?'past'
          :status==='available_from'
            ?'available-from'
            :status
      );

      b.disabled=
        isPast||
        status==='booked'||
        status==='unavailable';

      if(selectedKey===k&&!b.disabled){
        b.classList.add('selected');
      }

      const timeLine=
        !isPast&&
        status==='available_from'&&
        info.time
          ?`<em class="calTime">From ${info.time}</em>`
          :'';

      b.innerHTML=
        `<span>${d}</span><small>${
          isPast?'Past':info.label
        }</small>${timeLine}`;

      const ariaStatus=
        isPast
          ?'past'
          :(
            info.publicLabel
              ?`${info.label}. ${info.publicLabel}`
              :info.label
          );

      b.setAttribute(
        'aria-label',
        `${dt.toLocaleDateString('en-AU',{
          day:'numeric',
          month:'long',
          year:'numeric'
        })}: ${ariaStatus}`
      );

      if(!b.disabled){
        b.addEventListener(
          'click',
          ()=>select(dt,k,info,b)
        );
      }

      grid.appendChild(b);
    }

    /*
      If a date becomes booked/unavailable while this page is open,
      update only the calendar message. Never touch the enquiry form.
    */
    if(selectedKey){
      const selectedInfo=statusFor(selectedKey);

      if(
        selectedInfo.status==='booked'||
        selectedInfo.status==='unavailable'
      ){
        if(result){
          result.classList.remove('actionable');

          const strong=result.querySelector('strong');
          const paragraph=result.querySelector('p');

          if(strong){
            strong.textContent=
              selectedInfo.status==='booked'
                ?`${selectedPretty||'That date'} — Now booked`
                :`${selectedPretty||'That date'} — Unavailable`;
          }

          if(paragraph){
            paragraph.textContent=
              selectedInfo.publicLabel||
              (
                selectedInfo.status==='booked'
                  ?'Ozzsound has confirmed a booking for this date. Please choose another available date.'
                  :'Ozzsound is not available on this date. Please choose another date.'
              );
          }
        }

        if(enquire){
          delete enquire.dataset.date;
          enquire.href='event-enquiry.html';
        }

        selectedKey='';
        selectedPretty='';
      }
    }
  }

  function select(dt,k,info,b){
    grid.querySelectorAll('.selected').forEach(
      x=>x.classList.remove('selected')
    );

    b.classList.add('selected');

    const pretty=dt.toLocaleDateString(
      'en-AU',
      {
        weekday:'long',
        day:'numeric',
        month:'long',
        year:'numeric'
      }
    );

    selectedKey=k;
    selectedPretty=pretty;

    result.classList.add('actionable');

    let heading=`${pretty} — Available`;
    let copy=
      'This date is currently showing as available. Send an enquiry to confirm your booking.';

    if(info.status==='limited'){
      heading=`${pretty} — Limited availability`;
      copy=
        info.publicLabel||
        'This date may still be possible. Send an enquiry to confirm.';
    }

    if(info.status==='available_from'){
      heading=
        `${pretty} — Available${info.time?` from ${info.time}`:''}`;

      copy=
        info.publicLabel||
        (
          info.time
            ?`Ozzsound is currently available from ${info.time} on this date. Send an enquiry to confirm your event times.`
            :'Ozzsound has availability later on this date. Send an enquiry to confirm your event times.'
        );
    }

    if(
      info.status==='available'&&
      info.publicLabel
    ){
      copy=info.publicLabel;
    }

    result.querySelector('strong').textContent=
      heading;

    result.querySelector('p').textContent=
      copy;

    enquire.dataset.date=k;
    enquire.href='event-enquiry.html?date='+encodeURIComponent(k);
    enquire.textContent='Enquire about this date →';
  }

  async function loadCalendarAvailability(){
    if(!availabilityClient)return;

    const [
      bookingResult,
      overrideResult
    ]=await Promise.all([
      availabilityClient
        .from('public_availability_dates')
        .select('event_date,status')
        .eq('status','booked'),

      availabilityClient
        .from('calendar_overrides')
        .select(
          'event_date,status,available_from_time,public_label'
        )
    ]);

    if(bookingResult.error){
      console.error(
        'Ozzsound confirmed-booking availability refresh failed:',
        bookingResult.error
      );
    }else{
      confirmedBooked.clear();

      (bookingResult.data||[]).forEach(row=>{
        if(row?.event_date){
          confirmedBooked.add(row.event_date);
        }
      });
    }

    if(overrideResult.error){
      console.error(
        'Ozzsound admin calendar refresh failed:',
        overrideResult.error
      );
    }else{
      overrides.clear();

      (overrideResult.data||[]).forEach(row=>{
        if(row?.event_date){
          overrides.set(
            row.event_date,
            row
          );
        }
      });
    }

    render();
  }

  function startLiveAvailability(){
    if(
      !window.supabase||
      !cfg.supabaseUrl||
      !cfg.supabasePublishableKey
    ){
      return;
    }

    availabilityClient=window.supabase.createClient(
      cfg.supabaseUrl,
      cfg.supabasePublishableKey,
      {
        auth:{
          persistSession:false,
          autoRefreshToken:false,
          detectSessionInUrl:false
        }
      }
    );

    loadCalendarAvailability();

    availabilityChannel=availabilityClient
      .channel('ozzsound-public-calendar')
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'public_availability_dates'
        },
        ()=>loadCalendarAvailability()
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'calendar_overrides'
        },
        ()=>loadCalendarAvailability()
      )
      .subscribe(status=>{
        if(
          status==='CHANNEL_ERROR'||
          status==='TIMED_OUT'
        ){
          console.warn(
            'Ozzsound live calendar connection:',
            status
          );
        }
      });

    /*
      Fallback check in case a mobile browser pauses its live socket.
      This updates only calendar state.
    */
    window.setInterval(
      loadCalendarAvailability,
      60000
    );
  }

  document.querySelector('#calPrev').addEventListener(
    'click',
    ()=>{
      const prev=new Date(
        view.getFullYear(),
        view.getMonth()-1,
        1
      );

      if(
        prev>=new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      ){
        view=prev;
        render();
      }
    }
  );

  document.querySelector('#calNext').addEventListener(
    'click',
    ()=>{
      view=new Date(
        view.getFullYear(),
        view.getMonth()+1,
        1
      );
      render();
    }
  );

  render();
  startLiveAvailability();
})();

// Compact sticky header after leaving the top. Clicking the logo always returns home.
(()=>{const nav=document.querySelector('.nav'),brand=document.querySelector('.brand');if(!nav)return;const updateNav=()=>nav.classList.toggle('nav-scrolled',window.scrollY>120);updateNav();window.addEventListener('scroll',updateNav,{passive:true});if(brand){brand.addEventListener('click',e=>{const href=brand.getAttribute('href')||'';if(href.startsWith('#')){e.preventDefault();window.scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'});}});}})();

// Stage 1 booking funnel: calendar/event cards prefill the enquiry form.
(()=>{
  const form=document.querySelector('#enquiryForm'); if(!form)return;
  const eventSelect=document.querySelector('#eventType'), dateInput=document.querySelector('#eventDate');
  try{const v=JSON.parse(localStorage.getItem('ozzsoundVirtualSetup')||'null');if(v){const msg=form.querySelector('textarea[name="message"]');if(msg&&!msg.value){const gear=(v.items||[]).map(x=>x.name).join(', ');msg.value='Virtual Setup created'+(gear?' with: '+gear:'')+'.\nA venue preview was created in the Virtual Setup planning tool.';}}}catch(e){}
  try{const w=JSON.parse(localStorage.getItem('ozzsoundWeddingBuilder')||'null');if(w&&new URLSearchParams(location.search).get('from')==='wedding'){eventSelect.value='Wedding';if(w.date)dateInput.value=w.date;const venue=form.querySelector('[name="venue"]'),guests=form.querySelector('[name="guests"]'),msg=form.querySelector('textarea[name="message"]');if(venue&&w.venue)venue.value=w.venue;if(guests&&w.guests)guests.value=w.guests;if(msg){const lines=['Wedding Experience Builder','Coverage: '+((w.coverage||[]).join(', ')||'Not decided'),'Setting: '+(w.setting||'Not decided'),'Style: '+(w.style||'Not decided'),'Ceremony: '+((w.ceremonyNeeds||[]).join(', ')||'Not specified'),'Reception: '+((w.receptionNeeds||[]).join(', ')||'Not specified'),'Extras: '+((w.extras||[]).join(', ')||'None selected')];if(w.mustPlay)lines.push('Must play: '+w.mustPlay);if(w.wouldLove)lines.push('Would love: '+w.wouldLove);if(w.doNotPlay)lines.push('Do not play: '+w.doNotPlay);if((w.timeline||[]).length){lines.push('Timeline:');w.timeline.forEach(x=>lines.push((x.time||'Time TBC')+' — '+(x.event||'Event TBC')))}msg.value=lines.join('\n');}}}catch(e){}
  try{
    const z=JSON.parse(localStorage.getItem('ozzsoundSeasonalBuilder')||'null');
    if(z&&new URLSearchParams(location.search).get('from')==='seasonal'){
      eventSelect.value='Seasonal Event';if(z.date)dateInput.value=z.date;
      const venue=form.querySelector('[name="venue"]'),guests=form.querySelector('[name="guests"]'),msg=form.querySelector('textarea[name="message"]');
      if(venue&&z.venue)venue.value=z.venue;if(guests&&z.guests)guests.value=z.guests;
      if(msg&&!msg.value){const lines=['Seasonal Event Builder','Season: '+(z.season||'Not chosen'),'Feel: '+(z.vibe||'Not chosen')];if(z.crowd)lines.push('Crowd: '+z.crowd);if((z.music||[]).length)lines.push('Music: '+z.music.join(', '));if(z.musicControl)lines.push('Music approach: '+z.musicControl);if((z.extras||[]).length)lines.push('Seasonal extras: '+z.extras.join(', '));if((z.moments||[]).length)lines.push('Important bits: '+z.moments.join(', '));if(z.strobe)lines.push('Strobe: '+z.strobe+(z.strobe==='Yes'?' · Organiser approval: '+(z.strobeApproval||'Not confirmed'):''));if(z.notes)lines.push('Anything else: '+z.notes);msg.value=lines.join('\n')}
    }
  }catch(e){}
  try{
    const p=JSON.parse(localStorage.getItem('ozzsoundPartyBuilder')||'null');
    if(p&&new URLSearchParams(location.search).get('from')==='party'){
      eventSelect.value='Birthday & Party';
      if(p.date)dateInput.value=p.date;
      const venue=form.querySelector('[name="venue"]'),guests=form.querySelector('[name="guests"]'),msg=form.querySelector('textarea[name="message"]');
      if(venue&&p.venue)venue.value=p.venue;if(guests&&p.guests)guests.value=p.guests;
      if(msg&&!msg.value){const lines=['Birthday / Party Builder','Party: '+(p.type||'Not chosen'),'Feel: '+(p.vibe||'Not chosen')];if(p.crowd)lines.push('Crowd: '+p.crowd);if(p.setting)lines.push('Setting: '+p.setting);if((p.music||[]).length)lines.push('Music: '+p.music.join(', '));if(p.musicControl)lines.push('Music approach: '+p.musicControl);if((p.moments||[]).length)lines.push('Important bits: '+p.moments.join(', '));if((p.fun||[]).length)lines.push('Fun options: '+p.fun.join(', '));if(p.strobe)lines.push('Strobe: '+p.strobe+(p.strobe==='Yes'?' · Organiser approval: '+(p.strobeApproval||'Not confirmed'):''));if(p.notes)lines.push('Anything else: '+p.notes);msg.value=lines.join('\n')}
    }
  }catch(e){}
  try{
    const s=JSON.parse(localStorage.getItem('ozzsoundSchoolPlan')||'null');
    if(s&&new URLSearchParams(location.search).get('event')==='schools'){
      eventSelect.value='School Function';
      const msg=form.querySelector('textarea[name="message"]');
      if(msg&&!msg.value){
        const lines=['School Function preferences:','Style: '+(s.vibe||'Not selected')];
        if(Array.isArray(s.extras)&&s.extras.length)lines.push('Interactive extras: '+s.extras.join(', '));
        lines.push('Strobe lighting: '+(s.strobe||'Not selected'));
        if(s.strobe==='Yes')lines.push('Strobe organiser approval: '+(s.strobeApproval||'Not confirmed'));
        msg.value=lines.join('\n');
      }
    }
  }catch(e){}
  const submit=document.querySelector('#submitEnquiry'), status=document.querySelector('#formStatus');
  const fallback=document.querySelector('#contactFallback');
  const eventMap={weddings:'Wedding',parties:'Birthday & Party',schools:'School Function',seasonal:'Seasonal Event',corporate:'Corporate Event',sporting:'Sporting Event',karaoke:'Karaoke',other:'Other Event'};
  const params=new URLSearchParams(location.search);
  const requestedEvent=params.get('event');
  if(requestedEvent&&eventSelect){
    const wanted=eventMap[requestedEvent]||requestedEvent;
    const option=[...eventSelect.options].find(o=>o.value===wanted||o.textContent.trim()===wanted);
    if(option)eventSelect.value=option.value;
  }
  const requestedDate=params.get('date');
  if(requestedDate&&dateInput&&/^\d{4}-\d{2}-\d{2}$/.test(requestedDate))dateInput.value=requestedDate;
  const today=new Date(); dateInput.min=`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const selectedTime=(d,prefix)=>{
    const hour=String(d.get(prefix+'Hour')||'').trim();
    const minute=String(d.get(prefix+'Minute')||'').trim();
    const period=String(d.get(prefix+'Period')||'').trim().toUpperCase();

    if(!hour||!minute||!['AM','PM'].includes(period)){
      return null;
    }

    const hour12=Number(hour);

    if(!Number.isInteger(hour12)||hour12<1||hour12>12){
      return null;
    }

    let hour24=hour12%12;

    if(period==='PM'){
      hour24+=12;
    }

    return {
      display:`${hour12}:${minute} ${period}`,
      database:`${String(hour24).padStart(2,'0')}:${minute}:00`
    };
  };

  document.querySelectorAll('.event').forEach(card=>card.addEventListener('click',()=>{eventSelect.value=eventMap[card.dataset.event]||'';}));
  document.querySelector('#dateEnquire')?.addEventListener('click',e=>{const k=e.currentTarget.dataset.date;if(k)dateInput.value=k;});

  if(cfg.supabaseUrl&&cfg.supabasePublishableKey){fallback.hidden=true;submit.disabled=false;}else{submit.disabled=true;status.textContent='Secure enquiry storage is not configured yet.';}

  async function saveEnquiry(record){
    const url=`${cfg.supabaseUrl}/rest/v1/enquiries`;
    /* Publishable keys belong in the apikey header. Sending an sb_publishable_
       key as a Bearer token is not valid JWT authentication for PostgREST. */
    const res=await fetch(url,{
      method:'POST',
      headers:{
        apikey:cfg.supabasePublishableKey,
        'Content-Type':'application/json',
        Prefer:'return=minimal'
      },
      body:JSON.stringify(record)
    });
    if(!res.ok){
      let detail='';
      try{detail=await res.text()}catch(e){}
      throw new Error(`Enquiry save failed (${res.status}). ${detail}`);
    }
  }

  form.addEventListener('submit',async e=>{
    e.preventDefault(); if(!form.reportValidity()||!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
    submit.disabled=true;
    const enquiryId=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const enquiryRef=`OZZ-${String(enquiryId).replace(/[^a-fA-F0-9]/g,'').slice(0,8).toUpperCase()}`;
    const d=new FormData(form);
    let uploads={count:0,paths:[],attachmentPaths:[],displayPhotoPaths:[],folder:''};
    try{
      if(window.OZZSOUND_UPLOADS){
        status.textContent='Securely uploading your photos…';
        uploads=await window.OZZSOUND_UPLOADS(enquiryRef,{name:d.get('name')||'',venue:d.get('venue')||'',eventDate:d.get('eventDate')||''});
      }
      let weddingData=null,karaokeData=null,virtualSetupData=null;
      try{weddingData=JSON.parse(localStorage.getItem('ozzsoundWeddingBuilder')||'null')}catch(e){}
      try{karaokeData=JSON.parse(localStorage.getItem('ozzsoundKaraoke')||'null')}catch(e){}
      try{virtualSetupData=JSON.parse(localStorage.getItem('ozzsoundVirtualSetup')||'null')}catch(e){}
      const startTime=selectedTime(d,'start');
      const finishTime=selectedTime(d,'finish');

      if(!startTime||!finishTime){
        throw new Error('Please choose both a start time and a finish time.');
      }

      const eventTimes=
        `${startTime.display} – ${finishTime.display}`;

      const enquiryData={
        name:String(d.get('name')||''), phone:String(d.get('phone')||''), email:String(d.get('email')||''),
        eventType:String(d.get('eventType')||''), eventDate:String(d.get('eventDate')||''), venue:String(d.get('venue')||''),
        guests:d.get('guests')?Number(d.get('guests')):null,
        times:eventTimes,
        startTime:startTime.display,
        finishTime:finishTime.display,
        message:String(d.get('message')||''),
        websiteFeedback:{pageRating:String(d.get('feedbackPageRating')||''),navigation:String(d.get('feedbackNavigation')||''),foundInfo:String(d.get('feedbackFoundInfo')||''),missing:String(d.get('feedbackMissing')||'').trim(),recommend:String(d.get('feedbackRecommend')||''),boring:String(d.get('feedbackBoring')||''),improve:String(d.get('feedbackImprove')||'').trim()},
        wedding:weddingData, karaoke:karaokeData, virtualSetup:virtualSetupData
      };
      status.textContent='Saving your enquiry securely…';
      await saveEnquiry({
        id:enquiryId, enquiry_ref:enquiryRef, enquiry_type:String(d.get('eventType')||''),
        name:enquiryData.name, phone:enquiryData.phone, email:enquiryData.email,
        event_type:enquiryData.eventType, event_date:enquiryData.eventDate, venue_suburb:enquiryData.venue,
        approx_guests:enquiryData.guests,
        event_times:enquiryData.times,
        event_start_time:startTime.database,
        event_finish_time:finishTime.database,
        message:enquiryData.message,
        website_feedback:enquiryData.websiteFeedback,
        upload_folder:uploads.folder||null, upload_paths:uploads.paths||[], upload_count:uploads.count||0,
        attachment_paths:uploads.attachmentPaths||[], display_photo_paths:uploads.displayPhotoPaths||[], enquiry_data:enquiryData,
        source:'website'
      });
      status.textContent=`Thanks — your enquiry has been securely received. Reference: ${enquiryRef}`;
      status.classList.add('success');
      submit.textContent='Enquiry sent ✓';
      form.querySelectorAll('input,select,textarea,button').forEach(el=>{if(el!==submit)el.disabled=true});
    }catch(err){
      console.error(err);
      status.textContent=uploads.count
        ? 'Your photos uploaded, but the enquiry details could not be saved. Please try again or contact Ozzsound.'
        : (err?.message?.includes('Enquiry save failed')
            ? 'We could not securely save your enquiry. Please try again in a moment.'
            : (err?.message || 'We could not securely send your enquiry. Nothing has been sent — please try again.'));
      submit.disabled=false;
    }
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

// Stage 4.2 — Configurable gear catalogue, package hire period and enquiry cart.
(()=>{
  const catalogue=document.querySelector('#hireCatalogue'); if(!catalogue)return;
  const products=Array.isArray(cfg.gearCatalogue)?cfg.gearCatalogue:[];
  const cart=new Map(), cartItems=document.querySelector('#hireCartItems'), empty=document.querySelector('#hireCartEmpty');
  const summary=document.querySelector('#gearSelectionText'), enquire=document.querySelector('#gearEnquire');
  const period=document.querySelector('#overallHirePeriod'), hireDate=document.querySelector('#gearHireDate');
  const strobeSafety=document.querySelector('#strobeSafety'), strobeApproval=document.querySelector('#strobeApproval'), strobeAcknowledgement=document.querySelector('#strobeAcknowledgement'), strobeRecommendation=document.querySelector('#strobeRecommendation');
  const eventType=document.querySelector('#eventType'), eventDate=document.querySelector('#eventDate'), message=document.querySelector('textarea[name="message"]');
  const icons={sound:'🔊',lighting:'✦',microphones:'🎤',karaoke:'🎙',dj:'◉'};
  const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const renderProduct=p=>{const a=document.createElement('article');a.className='hireProduct';a.dataset.category=p.category||'other';a.innerHTML=`<div class="hireProductVisual"><div class="gearFallback">${icons[p.category]||'♫'}</div><small>${esc(p.category)}</small></div><div class="hireProductBody"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><div class="hireControls"><label><span>Qty</span><input class="hireQty" type="number" min="1" max="20" value="1"></label></div><button class="addHire" type="button">Add to hire list +</button></div>`;
    if(p.image){const im=new Image();im.onload=()=>{const v=a.querySelector('.hireProductVisual');v.querySelector('.gearFallback')?.remove();im.alt=p.name||'Ozzsound hire gear';v.prepend(im)};im.src=p.image}
    a.querySelector('.addHire').addEventListener('click',()=>{const qty=Math.max(1,Number(a.querySelector('.hireQty').value)||1);cart.set(p.id,{...p,qty});sync();a.querySelector('.addHire').textContent='Added ✓';setTimeout(()=>a.querySelector('.addHire').textContent='Update hire list +',900)});return a};
  products.forEach(p=>catalogue.appendChild(renderProduct(p)));
  function sync(){cartItems.innerHTML='';const vals=[...cart.values()];empty.hidden=vals.length>0;vals.forEach(x=>{const r=document.createElement('div');r.className='hireCartRow';r.innerHTML=`<strong>${esc(x.name)}</strong><span>Qty ${x.qty}</span><button type="button" aria-label="Remove ${esc(x.name)}">×</button>`;r.querySelector('button').onclick=()=>{cart.delete(x.id);sync()};cartItems.appendChild(r)});const hasStrobe=vals.some(x=>x.id==='strobe');if(strobeSafety)strobeSafety.hidden=!hasStrobe;if(!hasStrobe&&strobeApproval)strobeApproval.value='';if(!hasStrobe&&strobeAcknowledgement)strobeAcknowledgement.checked=false;if(strobeRecommendation&&hasStrobe){const v=strobeApproval?.value||'';strobeRecommendation.textContent=(v.includes('Reason known')||v.includes('Not sure'))?'Ozzsound recommendation: do not use strobe lighting for this event.':'If there is any uncertainty, Ozzsound recommends that strobe lighting is not used.';}const total=vals.reduce((n,x)=>n+x.qty,0);summary.textContent=vals.length?`${total} item${total===1?'':'s'} · ${vals.length} gear type${vals.length===1?'':'s'} selected`:'Nothing selected yet';enquire.classList.toggle('ready',vals.length>0)}
  document.querySelector('#clearHire')?.addEventListener('click',()=>{cart.clear();sync()});
  document.querySelector('#gearFilters')?.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#gearFilters button').forEach(x=>x.classList.toggle('active',x===b));const f=b.dataset.gearFilter;document.querySelectorAll('.hireProduct').forEach(x=>x.classList.toggle('filtered',f!=='all'&&x.dataset.category!==f))});

  // Custom future-only calendar. Weekend package mode highlights and restricts selection to Saturday/Sunday.
  const calGrid=document.querySelector('#gearCalendarGrid'), calMonth=document.querySelector('#gearCalMonth'), calPrev=document.querySelector('#gearCalPrev'), calNext=document.querySelector('#gearCalNext'), dateDisplay=document.querySelector('#gearDateDisplay'), hint=document.querySelector('#gearCalendarHint');
  const now=new Date(), today=new Date(now.getFullYear(),now.getMonth(),now.getDate()); let view=new Date(today.getFullYear(),today.getMonth(),1), selected=null;
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const pretty=d=>d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'long',year:'numeric'});
  function packageDates(startDate){
    if(!startDate)return [];
    const value=period?.value||'1 day';
    const out=[];
    if(value==='Weekend'){
      // Highlight the selected weekend as one package. Never include a date before today.
      const day=startDate.getDay();
      const sat=new Date(startDate); sat.setDate(startDate.getDate()-(day===0?1:0));
      const sun=new Date(sat); sun.setDate(sat.getDate()+1);
      [sat,sun].forEach(d=>{if(d>=today)out.push(d)});
      return out;
    }
    const match=value.match(/^(\d+) day/);
    const count=match?Number(match[1]):1;
    for(let i=0;i<count;i++){const d=new Date(startDate);d.setDate(startDate.getDate()+i);out.push(d)}
    return out;
  }
  function renderCalendar(){
    if(!calGrid)return;
    calGrid.innerHTML='';
    calMonth.textContent=view.toLocaleDateString('en-AU',{month:'long',year:'numeric'});
    const first=(view.getDay()+6)%7, days=new Date(view.getFullYear(),view.getMonth()+1,0).getDate(), weekend=period?.value==='Weekend';
    const range=new Set(packageDates(selected).map(iso));
    const startKey=selected?iso(selected):'';
    for(let i=0;i<first;i++){const blank=document.createElement('span');blank.className='calBlank';calGrid.appendChild(blank)}
    for(let n=1;n<=days;n++){
      const d=new Date(view.getFullYear(),view.getMonth(),n), past=d<today, isWeekend=d.getDay()===0||d.getDay()===6, blocked=past||(weekend&&!isWeekend), k=iso(d);
      const inRange=range.has(k), isStart=k===startKey;
      const b=document.createElement('button');b.type='button';b.textContent=n;
      b.className='calDay'+(isWeekend?' weekend':'')+(past?' past':'')+(weekend&&isWeekend&&!past?' weekendActive':'')+(inRange?' hireRange':'')+(isStart?' selected rangeStart':'');
      b.disabled=blocked;b.setAttribute('aria-label',pretty(d)+(blocked?' unavailable':inRange?' included in hire period':''));
      if(!blocked)b.addEventListener('click',()=>{selected=d;hireDate.value=iso(d);dateDisplay.textContent=pretty(d);renderCalendar()});
      calGrid.appendChild(b)
    }
    calPrev.disabled=view.getFullYear()===today.getFullYear()&&view.getMonth()===today.getMonth();
    if(hint){
      if(!selected) hint.textContent=weekend?'Weekend package selected — choose a Saturday or Sunday.':'Choose any date from today onwards.';
      else {const dates=packageDates(selected), last=dates[dates.length-1]; hint.textContent=weekend?`Weekend package: ${pretty(dates[0])}${last&&iso(last)!==iso(dates[0])?' to '+pretty(last):''}.`:`${period?.value||'1 day'} package: ${pretty(dates[0])}${dates.length>1?' to '+pretty(last):''}.`;}
    }
  }
  calPrev?.addEventListener('click',()=>{const prev=new Date(view.getFullYear(),view.getMonth()-1,1);if(prev>=new Date(today.getFullYear(),today.getMonth(),1)){view=prev;renderCalendar()}});calNext?.addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);renderCalendar()});period?.addEventListener('change',()=>{if(period.value==='Weekend'&&selected&&![0,6].includes(selected.getDay())){selected=null;hireDate.value='';dateDisplay.textContent='Choose a weekend date'}renderCalendar()});renderCalendar();

  enquire?.addEventListener('click',e=>{const vals=[...cart.values()];if(!vals.length){e.preventDefault();summary.textContent='Choose at least one item before continuing';return;}if(!hireDate?.value){e.preventDefault();summary.textContent='Choose a hire date before continuing';document.querySelector('#gearCalendar')?.scrollIntoView({behavior:'smooth',block:'center'});return;}const hasStrobe=vals.some(x=>x.id==='strobe');if(hasStrobe&&!strobeApproval?.value){e.preventDefault();summary.textContent='Please answer the strobe-lighting safety question';strobeSafety?.scrollIntoView({behavior:'smooth',block:'center'});return;}if(hasStrobe&&!strobeAcknowledgement?.checked){e.preventDefault();summary.textContent='Please acknowledge the strobe-lighting safety warning';strobeSafety?.scrollIntoView({behavior:'smooth',block:'center'});return;}const payload={items:vals,overallPeriod:period?.value||'Not specified',hireDate:hireDate.value,strobeApproval:hasStrobe?(strobeApproval?.value||'Not confirmed'):'Not applicable',strobeAcknowledged:hasStrobe?!!strobeAcknowledgement?.checked:false};try{localStorage.setItem('ozzsoundGearHire',JSON.stringify(payload));}catch(err){}if(eventType)eventType.value='Gear Hire';if(eventDate)eventDate.value=hireDate.value;if(message){const lines=['Gear hire request:',...vals.map(x=>`- ${x.name} — Qty ${x.qty}`),`Package hire period: ${payload.overallPeriod}`,`Hire date: ${payload.hireDate}`];if(hasStrobe){lines.push(`Strobe safety response: ${payload.strobeApproval}`);lines.push(`Strobe warning acknowledged: ${payload.strobeAcknowledged?'Yes':'No'}`);}message.value=lines.join('\n');}});
  sync();
})();

// Stage 4.4 — Dedicated karaoke builder and enquiry handoff.
(()=>{
  const groups=[...document.querySelectorAll('[data-karaoke-group]')];
  const summary=document.querySelector('#karaokeSummaryText'), cont=document.querySelector('#karaokeContinue'), requests=document.querySelector('#karaokeRequests');
  if(!groups.length)return;
  const state={eras:new Set(),genres:new Set(),event:new Set()};
  const sync=()=>{
    const eras=[...state.eras], genres=[...state.genres], event=[...state.event][0]||'';
    const bits=[]; if(eras.length)bits.push(eras.join(', ')); if(genres.length)bits.push(genres.join(', ')); if(event)bits.push(event);
    summary.textContent=bits.length?bits.join(' · '):'Start choosing your eras and music styles above.';
    cont.classList.toggle('ready',eras.length>0||genres.length>0||!!event);
  };
  groups.forEach(group=>group.addEventListener('click',e=>{
    const b=e.target.closest('button'); if(!b)return; const key=group.dataset.karaokeGroup, val=b.dataset.value; const set=state[key];
    if(group.classList.contains('single')){group.querySelectorAll('button').forEach(x=>x.classList.remove('selected'));set.clear();set.add(val);b.classList.add('selected');}
    else {set.has(val)?set.delete(val):set.add(val);b.classList.toggle('selected',set.has(val));}
    sync();
  }));
  cont?.addEventListener('click',()=>{const payload={eras:[...state.eras],genres:[...state.genres],event:[...state.event][0]||'',requests:(requests?.value||'').trim()};try{localStorage.setItem('ozzsoundKaraoke',JSON.stringify(payload));}catch(e){}});
  sync();
})();

(()=>{
  const box=document.querySelector('#karaokeReviewContent'), form=document.querySelector('#enquiryForm');
  if(!box||!form)return;
  try{
    const data=JSON.parse(localStorage.getItem('ozzsoundKaraoke')||'null'); if(!data)return;
    const esc=s=>String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    const rows=[];
    if(data.eras?.length)rows.push(['Eras',data.eras.join(', ')]); if(data.genres?.length)rows.push(['Genres',data.genres.join(', ')]); if(data.event)rows.push(['Event style',data.event]); if(data.requests)rows.push(['Requests',data.requests]);
    if(rows.length)box.innerHTML=rows.map(x=>`<div class="gearReviewRow"><strong>${esc(x[0])}</strong><span>${esc(x[1])}</span></div>`).join('');
    const msg=form.querySelector('textarea[name="message"]'); if(msg){const lines=['Karaoke preferences:',`Eras: ${data.eras?.join(', ')||'Open to suggestions'}`,`Genres: ${data.genres?.join(', ')||'Open to suggestions'}`,`Event style: ${data.event||'Not specified'}`,`Artists / songs / requests: ${data.requests||'None supplied'}`];msg.value=lines.join('\n');}
  }catch(e){console.warn(e)}
})();

// Enquiry photo pickers — secure private uploads to Supabase Storage.
(()=>{
  const form=document.querySelector('#enquiryForm'); if(!form)return;
  const eventType=form.querySelector('[name="eventType"]');
  const MAX_FILES=50, MAX_BYTES=10*1024*1024, allowed=/^image\/(jpeg|png|webp|heic|heif)$/i;
  const pickers=[];
  const setupPicker=(opts)=>{
    const wrap=document.querySelector(opts.wrap), input=document.querySelector(opts.input), grid=document.querySelector(opts.grid), count=document.querySelector(opts.count), note=document.querySelector(opts.note);
    if(!wrap||!input||!grid||!count||!note)return null;
    let files=[];
    const render=()=>{
      count.textContent=`${files.length} photo${files.length===1?'':'s'}`; grid.innerHTML='';
      files.forEach((file,i)=>{const card=document.createElement('div');card.className='photoThumb';const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Remove ${file.name}`);remove.dataset.photoRemove=i;if(/^image\/(jpeg|png|webp)$/i.test(file.type)){const img=document.createElement('img');img.alt=file.name;img.src=URL.createObjectURL(file);img.onload=()=>URL.revokeObjectURL(img.src);card.appendChild(img)}else{const ph=document.createElement('div');ph.className='photoNoPreview';ph.textContent=file.name;card.appendChild(ph)}card.appendChild(remove);grid.appendChild(card)});
      note.textContent=files.length?'Ready for secure upload when you send your enquiry.':'Photos are optional. Selected photos will be securely stored with your enquiry.';note.className='photoUploadNote';
    };
    input.addEventListener('change',()=>{let rejected=false;for(const f of [...input.files]){if(files.length>=MAX_FILES){rejected=true;break}if(f.size>MAX_BYTES){rejected=true;continue}if(!allowed.test(f.type)&&!f.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)){rejected=true;continue}if(!files.some(x=>x.name===f.name&&x.size===f.size&&x.lastModified===f.lastModified))files.push(f)}input.value='';render();if(rejected){note.textContent='Some photos were skipped. Use JPG, PNG, WEBP, HEIC or HEIF files up to 10 MB each, maximum 50 photos.';note.className='photoUploadNote warn'}});
    grid.addEventListener('click',e=>{const b=e.target.closest('[data-photo-remove]');if(!b)return;files.splice(Number(b.dataset.photoRemove),1);render()});
    render(); const api={wrap,note,category:opts.category,get files(){return files}}; pickers.push(api); return api;
  };
  setupPicker({wrap:'#enquiryAttachments',input:'#attachmentPhotos',grid:'#attachmentPreview',count:'#attachmentCount',note:'#attachmentNote',category:'attachments'});
  const wedding=setupPicker({wrap:'#weddingPhotoUpload',input:'#weddingPhotos',grid:'#weddingPhotoPreview',count:'#weddingPhotoCount',note:'#weddingPhotoNote',category:'display-photos'});
  const help=document.querySelector('#attachmentHelp');
  const sync=()=>{const type=eventType?.value||'';if(wedding)wedding.wrap.hidden=type!=='Wedding';if(help){help.textContent=type==='Gear Hire'?'Upload venue/setup photos, access areas, power locations or anything relevant to your hire.':type==='Karaoke'?'Upload venue photos, setup-area photos or anything else that helps us plan your karaoke night.':type==='Wedding'?'Upload venue photos, setup-area photos, inspiration or other planning images. Photos for display on the day can be added separately below.':'Upload venue photos, setup-area photos, event inspiration or anything else that helps Ozzsound plan your event.'}};
  eventType?.addEventListener('change',sync); sync();
  const cleanName=name=>String(name||'photo').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(-100);
  const cleanFolderPart=value=>String(value||'').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/-+/g,'-').slice(0,60);
  const shortRef=id=>String(id||'').replace(/[^a-zA-Z0-9]/g,'').slice(0,6).toUpperCase()||Math.random().toString(36).slice(2,8).toUpperCase();
  window.OZZSOUND_UPLOADS=async (enquiryId, details={})=>{
    const selected=pickers.filter(p=>p.files.length&&!p.wrap.hidden); if(!selected.length)return {count:0,paths:[],attachmentPaths:[],displayPhotoPaths:[],folder:''};
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey||!cfg.supabaseUploadBucket)throw new Error('Secure upload storage is not configured.');
    const client=cleanFolderPart(details.name)||'Client';
    const location=cleanFolderPart(details.venue)||'Location-TBC';
    const date=cleanFolderPart(details.eventDate)||'Date-TBC';
    const folder=`${client}_${location}_${date}_${shortRef(enquiryId)}`;
    const paths=[], attachmentPaths=[], displayPhotoPaths=[]; let done=0, total=selected.reduce((n,p)=>n+p.files.length,0);
    for(const picker of selected){
      picker.note.textContent='Uploading securely…'; picker.note.className='photoUploadNote';
      for(const file of picker.files){
        const id=(crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`);
        const path=`${folder}/${picker.category}/${id}-${cleanName(file.name)}`;
        const url=`${cfg.supabaseUrl}/storage/v1/object/${encodeURIComponent(cfg.supabaseUploadBucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
        const res=await fetch(url,{method:'POST',headers:{apikey:cfg.supabasePublishableKey,Authorization:`Bearer ${cfg.supabasePublishableKey}`,'Content-Type':file.type||'application/octet-stream','x-upsert':'false'},body:file});
        if(!res.ok){let detail='';try{detail=await res.text()}catch(e){};throw new Error(`Photo upload failed (${res.status}). ${detail}`)}
        paths.push(path);
        if(picker.category==='display-photos')displayPhotoPaths.push(path);else attachmentPaths.push(path);
        done++;picker.note.textContent=`Securely uploaded ${done} of ${total} photo${total===1?'':'s'}…`;
      }
      picker.note.textContent='Photos securely uploaded with this enquiry.'; picker.note.className='photoUploadNote';
    }
    return {count:paths.length,paths,attachmentPaths,displayPhotoPaths,folder};
  };
})();


(()=>{if(document.querySelector('#privacyNotice'))return;let ok=false;try{ok=localStorage.getItem('ozzsoundPrivacyNotice')==='acknowledged'}catch(e){}if(ok)return;const n=document.createElement('div');n.id='privacyNotice';n.className='privacyNotice';n.innerHTML='<span>Ozzsound uses the information you provide to manage enquiries, bookings and event planning. <a href="privacy.html">Your Privacy</a></span><button type="button">Acknowledge</button>';document.body.appendChild(n);n.querySelector('button').addEventListener('click',()=>{try{localStorage.setItem('ozzsoundPrivacyNotice','acknowledged')}catch(e){}n.remove()});})();

/* Homepage event carousel: continuous auto-scroll with arrows, drag and swipe.
   Manual interaction temporarily takes control, then seamlessly resumes movement. */
document.addEventListener('DOMContentLoaded',()=>{
  const flow=document.querySelector('#eventFlow');
  if(!flow)return;
  const track=flow.querySelector('.eventFlowTrack');
  const prev=document.querySelector('.eventFlowPrev');
  const next=document.querySelector('.eventFlowNext');
  if(!track)return;

  let offset=0,startX=0,startOffset=0,dragging=false,moved=false,lastTime=performance.now();
  const speed=34; // pixels per second
  const cardStep=()=>{const card=flow.querySelector('.flowCard');return card?card.getBoundingClientRect().width+18:348};
  const loopWidth=()=>track.scrollWidth/2;

  const readOffset=()=>{
    const matrix=new DOMMatrixReadOnly(getComputedStyle(track).transform);
    return Number.isFinite(matrix.m41)?matrix.m41:offset;
  };
  const normalise=()=>{
    const w=loopWidth();
    if(!w)return;
    while(offset<=-w)offset+=w;
    while(offset>0)offset-=w;
  };
  const render=()=>{normalise();track.style.transform='translate3d('+offset+'px,0,0)'};
  const takeControl=()=>{
    offset=readOffset();
    track.style.animation='none';
    flow.classList.add('isUserControlled');
    render();
  };
  const move=dir=>{
    takeControl();
    offset+=dir*cardStep();
    render();
  };

  prev?.addEventListener('click',()=>move(1));
  next?.addEventListener('click',()=>move(-1));

  // Keep normal taps/clicks on cards as real link clicks.
  // Dragging is handled at window level instead of pointer-capturing the
  // carousel, because pointer capture changes the click target to the
  // carousel and prevents its <a> cards from navigating.
  flow.addEventListener('pointerdown',e=>{
    if(e.button!==undefined&&e.button!==0)return;
    takeControl();
    dragging=true;moved=false;startX=e.clientX;startOffset=offset;
    flow.classList.add('isDragging');
  });
  window.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-startX;
    if(Math.abs(dx)>7)moved=true;
    offset=startOffset+dx;
    render();
  });
  const end=()=>{
    if(!dragging)return;
    dragging=false;
    flow.classList.remove('isDragging');
  };
  window.addEventListener('pointerup',end);
  window.addEventListener('pointercancel',end);
  flow.addEventListener('click',e=>{
    if(moved){e.preventDefault();e.stopPropagation();moved=false;}
  },true);
  flow.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'){e.preventDefault();move(1)}
    if(e.key==='ArrowRight'){e.preventDefault();move(-1)}
  });

  // Replace the CSS marquee once JS is ready, but keep the same visual position.
  takeControl();
  const tick=now=>{
    const dt=Math.min((now-lastTime)/1000,.05);lastTime=now;
    if(!dragging){offset-=speed*dt;render();}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

// Ozzsound legal footer links — kept central so every public page stays consistent.
document.addEventListener('DOMContentLoaded',()=>{
  const links=[['Privacy','privacy.html'],['Booking & Website Terms','terms.html'],['Security','security.html'],['Cookies','cookies.html'],['Copyright','copyright.html']];
  document.querySelectorAll('footer').forEach(footer=>{
    if(footer.querySelector('.legalFooterLinks'))return;
    const host=footer.querySelector('.footerMain,.foot')||footer;
    const nav=document.createElement('nav');nav.className='legalFooterLinks';nav.setAttribute('aria-label','Legal and policy links');
    nav.innerHTML=links.map(([label,href])=>'<a href="'+href+'">'+label+'</a>').join('');
    host.appendChild(nav);
  });
});


// Site-wide page navigation: delegated click handling works for static and injected controls.
(()=>{
  const initPageJumpNav=()=>{
    const brand=document.querySelector('a.brand');
    if(brand && location.pathname && !/(^|\/)index\.html$/.test(location.pathname) && location.pathname!=='/'){
      brand.setAttribute('href','index.html');
    }
    if(!document.querySelector('.pageJumpNav')){
      const nav=document.createElement('div');
      nav.className='pageJumpNav';
      nav.setAttribute('aria-label','Page navigation');
      nav.innerHTML='<button type="button" class="pageJumpButton pageJumpTop" aria-label="Back to top" title="Back to top">↑<span>Top</span></button><button type="button" class="pageJumpButton pageJumpBottom" aria-label="Go to bottom" title="Go to bottom">↓<span>Bottom</span></button>';
      document.body.appendChild(nav);
    }
  };

  const jump=(where)=>{
    const root=document.scrollingElement || document.documentElement;
    const top=where==='top' ? 0 : Math.max(root.scrollHeight,document.body?.scrollHeight||0);
    try{window.scrollTo({top,behavior:'smooth'});}catch(_){window.scrollTo(0,top);}
    root.scrollTop=top;
    document.documentElement.scrollTop=top;
    if(document.body) document.body.scrollTop=top;
  };

  document.addEventListener('click',event=>{
    const top=event.target.closest?.('.pageJumpTop');
    const bottom=event.target.closest?.('.pageJumpBottom');
    if(!top && !bottom) return;
    event.preventDefault();
    event.stopPropagation();
    jump(top?'top':'bottom');
  },true);

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initPageJumpNav,{once:true});
  else initPageJumpNav();
})();
