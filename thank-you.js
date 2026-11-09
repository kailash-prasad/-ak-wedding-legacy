'use strict';
(() => {
 const $ = id => document.getElementById(id);
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let motionPaused = reduced.matches, galleryPaused = false, galleryVisible = false, introTimer, timer;
 const gate = $('royalGate'), main = $('main'), header = document.querySelector('.site-header');
 const setInert = value => { main.inert = value; header.inert = value; };
 const introKey = 'ak-legacy-portrait-intro-seen';
 function finishIntro() {
  try { localStorage.setItem(introKey, '1'); } catch { /* Storage is optional. */ }
  clearTimeout(introTimer); gate.hidden = true; gate.classList.remove('opening','leaving');
  document.body.classList.remove('intro-locked'); setInert(false); main.focus({preventScroll:true});
 }
 function enter(skip = false) {
  if (gate.classList.contains('opening') && !skip) return;
  if (skip || motionPaused) return finishIntro();
  gate.classList.add('opening'); $('openRoyalGate').disabled = true; $('skipIntro').focus();
  introTimer = setTimeout(() => { gate.classList.add('leaving'); introTimer = setTimeout(finishIntro,700); },2800);
 }
 function showIntro() {
  gate.hidden = false; gate.classList.remove('opening','leaving'); $('openRoyalGate').disabled = false;
  document.body.classList.add('intro-locked'); setInert(true); $('openRoyalGate').focus({preventScroll:true});
 }
 $('openRoyalGate').addEventListener('click',()=>enter());
 $('skipIntro').addEventListener('click',()=>enter(true));
 $('replayIntro').addEventListener('click',()=>{window.scrollTo({top:0,behavior:'instant'});showIntro()});
 gate.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();enter(true)}
  if(e.key==='Tab'){
   const controls=[$('openRoyalGate'),$('skipIntro')].filter(b=>!b.disabled);
   if(e.shiftKey && document.activeElement===controls[0]){e.preventDefault();controls.at(-1).focus()}
   else if(!e.shiftKey && document.activeElement===controls.at(-1)){e.preventDefault();controls[0].focus()}
  }
 });
 document.querySelector('.skip-link').addEventListener('click',()=>{if(!gate.hidden)finishIntro()});
 let returningGuest = false;
 try { returningGuest = localStorage.getItem(introKey) === '1'; } catch { /* Storage is optional. */ }
 if (!returningGuest && !location.hash) showIntro();
 for(let i=0;i<14;i++){const petal=document.createElement('i');petal.style.cssText='--x:'+((i*37)%100)+'%;--duration:'+(15+i%7)+'s;--delay:'+(-i*2.8)+'s';$('petals').append(petal)}
 const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
 document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
 $('openLetter').addEventListener('click',()=>{
  $('envelope').classList.add('open');$('openLetter').setAttribute('aria-expanded','true');
  $('letterPaper').tabIndex=-1;$('letterPaper').focus({preventScroll:true});
 });
 const cfg=window.AK_MEMORIES, chapters=cfg.chapters;
 let current=0;
 const lotus='<svg viewBox="0 0 240 240" fill="none" stroke="currentColor" stroke-width="1.2"><circle cx="120" cy="120" r="101" stroke-dasharray="1 9"/><path d="M120 183C73 144 80 91 120 51C160 91 167 144 120 183Z" fill="currentColor" fill-opacity=".14"/><path d="M120 183C50 180 33 132 39 91C91 97 119 139 120 183ZM120 183C190 180 207 132 201 91C149 97 121 139 120 183Z" fill="currentColor" fill-opacity=".12"/><path d="M120 183C60 210 22 172 18 140C64 128 101 151 120 183ZM120 183C180 210 218 172 222 140C176 128 139 151 120 183Z"/><path d="M68 201Q120 227 172 201M120 51V30M109 35L120 20L131 35"/><circle cx="120" cy="120" r="5"/></svg>';
 function artwork(){return '<div class="scene" aria-hidden="true"><div class="scene-court"></div><div class="scene-moon"></div><div class="scene-ring"></div><div class="scene-vines"></div><div class="scene-lotus">'+lotus+'</div><div class="scene-hangings">'+Array.from({length:9},(_,i)=>'<i style="--h:'+(35+(i%3)*22)+'px;animation-delay:-'+i+'s"></i>').join('')+'</div></div>'}
 chapters.forEach((chapter,i)=>{
  const slide=document.createElement('article');slide.className='memory-slide '+chapter.theme;
  slide.setAttribute('aria-label','Slide '+(i+1)+' of '+chapters.length+': '+chapter.name);
  slide.setAttribute('aria-roledescription','slide');
  if(chapter.image){
   slide.classList.add('has-photo');const photo=document.createElement('img');photo.className='memory-photo';photo.src=chapter.image;photo.alt=chapter.alt;photo.loading='lazy';photo.draggable=false;slide.append(photo);
  }else{slide.innerHTML=artwork();const label=document.createElement('span');label.className='preview-tag';label.textContent='AN ILLUSTRATED PRELUDE';slide.append(label)}
  const caption=document.createElement('div');caption.className='slide-caption';
  const kicker=document.createElement('span');kicker.className='eyebrow';kicker.textContent=chapter.name.toUpperCase()+' · '+chapter.date;
  const title=document.createElement('h3');title.textContent=chapter.title;
  const note=document.createElement('p');note.textContent=chapter.note;caption.append(kicker,title,note);slide.append(caption);
  const zoom=document.createElement('button');zoom.className='zoom-memory';zoom.type='button';zoom.textContent='⤢';zoom.setAttribute('aria-label','Enlarge '+chapter.name+' memory');zoom.addEventListener('click',()=>openLightbox(i));slide.append(zoom);
  $('memoryTrack').append(slide);
  const tab=document.createElement('button');tab.type='button';tab.textContent=chapter.name;tab.setAttribute('aria-label','Show '+chapter.name);tab.addEventListener('click',()=>go(i,true));
  const date=document.createElement('small');date.textContent=chapter.date;tab.append(date);$('memoryDots').append(tab);
 });
 const slides=[...$('memoryTrack').children],tabs=[...$('memoryDots').children];
 function schedule(){clearInterval(timer);if(!motionPaused&&!galleryPaused&&galleryVisible&&!document.hidden&&!$('lightbox').open&&!$('gallery').contains(document.activeElement))timer=setInterval(()=>go(current+1),Math.max(2500,cfg.interval||5500))}
 function go(index,announce=false){
  const next=(index+chapters.length)%chapters.length;
  const direction=index===current-1||index<current&&index!==current+1?-1:1;
  if(next!==current&&!motionPaused){
   slides[next].animate([
    {transform:'perspective(1300px) rotateY('+direction*-9+'deg)',filter:'brightness(.77)'},
    {transform:'none',filter:'brightness(1)'}
   ],{duration:650,easing:'ease-out'});
  }
  current=next;
  $('memoryTrack').style.transform='translateX(-'+current*100+'%)';
  slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.inert=i!==current;s.setAttribute('aria-hidden',String(i!==current))});
  tabs.forEach((t,i)=>t.setAttribute('aria-current',String(i===current)));
  $('slideNumber').textContent=String(current+1).padStart(2,'0');
  if(announce)$('galleryStatus').textContent=chapters[current].name+', '+chapters[current].title;
  schedule();
 }
 $('memoryPrev').addEventListener('click',()=>go(current-1,true));$('memoryNext').addEventListener('click',()=>go(current+1,true));
 $('galleryPause').addEventListener('click',()=>{galleryPaused=!galleryPaused;$('galleryPause').textContent=galleryPaused?'Play':'Pause';$('galleryPause').setAttribute('aria-label',galleryPaused?'Play slideshow':'Pause slideshow');$('galleryPause').setAttribute('aria-pressed',String(galleryPaused));schedule()});
 $('gallery').addEventListener('keydown',e=>{if(e.target.closest('button'))return;if(e.key==='ArrowRight'){e.preventDefault();go(current+1,true)}if(e.key==='ArrowLeft'){e.preventDefault();go(current-1,true)}});
 let pointerStart=null;
 $('gallery').addEventListener('pointerdown',e=>{
  if(!e.isPrimary||e.target.closest('button,a'))return;
  pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};
  $('gallery').setPointerCapture(e.pointerId);clearInterval(timer);
 });
 $('gallery').addEventListener('pointerup',e=>{
  if(!pointerStart||e.pointerId!==pointerStart.id)return;
  const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;
  if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)go(current+(dx<0?1:-1),true);else schedule();
 });
 $('gallery').addEventListener('pointercancel',()=>{pointerStart=null;schedule()});
 $('gallery').addEventListener('mouseenter',()=>clearInterval(timer));$('gallery').addEventListener('mouseleave',schedule);
 $('gallery').addEventListener('focusin',()=>clearInterval(timer));$('gallery').addEventListener('focusout',()=>setTimeout(()=>{if(!$('gallery').contains(document.activeElement))schedule()},0));
 new IntersectionObserver(entries=>{galleryVisible=entries[0].isIntersecting;schedule()},{threshold:.2}).observe($('gallery'));
 document.addEventListener('visibilitychange',schedule);
 let lastZoom;
 function openLightbox(i){
  lastZoom=slides[i].querySelector('.zoom-memory');
  const clone=slides[i].cloneNode(true);clone.inert=false;clone.removeAttribute('aria-hidden');clone.querySelector('button').remove();
  $('lightboxContent').replaceChildren(clone);$('lightboxCaption').textContent=chapters[i].name+(chapters[i].image?'':' — illustrated preview');
  $('lightbox').showModal();clearInterval(timer);
 }
 $('closeLightbox').addEventListener('click',()=>$('lightbox').close());
 $('lightbox').addEventListener('close',()=>{lastZoom?.focus();schedule()});
 $('lightbox').addEventListener('click',e=>{if(e.target===$('lightbox'))$('lightbox').close()});
 function applyMotion(){
  document.documentElement.classList.toggle('motion-paused',motionPaused);
  $('motionToggle').textContent=motionPaused?'Motion off':'Pause motion';$('motionToggle').setAttribute('aria-pressed',String(motionPaused));schedule();
 }
 $('motionToggle').addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion()});
 reduced.addEventListener('change',()=>{motionPaused=reduced.matches;applyMotion()});
 if (cfg.albumUrl) {
  $('albumLink').href = cfg.albumUrl;
  $('albumLink').hidden = false;
  $('albumNote').hidden = true;
 }
 $('blessingText').addEventListener('input',()=>{$('charCount').textContent=$('blessingText').value.length+' / 1200'});
 $('blessingForm').addEventListener('ak:submission-saved',()=>{
  $('blessingForm').hidden=true;$('sentKeepsake').hidden=false;$('sentKeepsake').tabIndex=-1;$('sentKeepsake').focus({preventScroll:true});$('charCount').textContent='0 / 1200';
 });
 $('writeAgain').addEventListener('click',()=>{$('sentKeepsake').hidden=true;$('blessingForm').hidden=false;$('blessingName').focus()});
 go(0);applyMotion();
})();
