'use strict';
(() => {
 const cfg=window.AK_CONFIG||{};
 const entries=[{id:'blessingForm',type:'blessing',status:'blessingStatus',name:'blessingName',message:'blessingText',kind:'blessingType'},{id:'capsuleForm',type:'capsule',status:'capsuleStatus',name:'capsuleName',message:'capsuleText',kind:'capsuleType'}];
 const forms=entries.map(entry=>({...entry,form:document.getElementById(entry.id)})).filter(entry=>entry.form);
 const retry = document.getElementById('retryVerification');
 const setUnavailable = (text, canRetry = false) => {
  for (const entry of forms) {
   entry.form.querySelector('[type=submit]').disabled = true;
   document.getElementById(entry.status).textContent = text;
  }
  if (retry) retry.hidden = !canRetry;
 };
 // Install this guard immediately: a failed verification script must never submit a native GET.
 forms.forEach(entry=>entry.form.addEventListener('submit',e=>e.preventDefault()));
 if(!cfg.submitEndpoint||!cfg.turnstileSiteKey){setUnavailable('Guestbook is not yet available. Your message has not been saved.');return}
 let mounted = false, script, watchdog, retryWidget;
 retry?.addEventListener('click', () => {
  if (mounted) retryWidget?.();
  else loadVerification();
 });
 function loadVerification() {
  setUnavailable('Preparing secure verification…');
  script?.remove();
  script = document.createElement('script');
  const attempt = script;
  function unavailable() {
   if (script !== attempt || mounted) return;
   clearTimeout(watchdog);
   setUnavailable('Verification could not load. Your message is still here. Try again below.', true);
  }
  watchdog = setTimeout(unavailable, 20000);
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.onload = () => { if (script === attempt) mount(); };
  script.onerror = unavailable;
  document.head.append(script);
 }
 function mount(){
  if(mounted)return;mounted=true;clearTimeout(watchdog);
  for(const entry of forms){
   const {form}=entry,status=document.getElementById(entry.status),submit=form.querySelector('[type=submit]');
   const holder=document.createElement('div');holder.className='turnstile-holder';holder.setAttribute('aria-label','Spam protection verification');
   const slot=document.getElementById('verificationSlot');if(slot)slot.append(holder);else submit.before(holder);
   let widget;
   const retryButton = entry.type === 'blessing' ? retry : null;
   function requestVerification() {
    submit.disabled = true;
    status.textContent = 'Complete the verification below to send your note.';
    if (retryButton) retryButton.hidden = true;
    try {
     if (widget !== undefined) {
      window.turnstile.reset(widget);
      return;
     }
     widget = window.turnstile.render(holder, {
      sitekey: cfg.turnstileSiteKey, size: form.clientWidth < 300 ? 'compact' : 'flexible', theme: 'light',
      callback: () => {
       submit.disabled = false;
       if (retryButton) retryButton.hidden = true;
       if (status.textContent.startsWith('Complete the verification')) status.textContent = '';
      },
      'expired-callback': () => {
       submit.disabled = true;
       status.textContent = 'Verification expired. Please verify again.';
       if (retryButton) retryButton.hidden = false;
      },
      'error-callback': () => {
       submit.disabled = true;
       status.textContent = 'Verification failed. Your message is still here.';
       if (retryButton) retryButton.hidden = false;
      }
     });
    } catch {
     status.textContent = 'Verification unavailable. Your message has not been saved.';
     if (retryButton) retryButton.hidden = false;
    }
   }
   if (retryButton) retryWidget = requestVerification;
   requestVerification();
   form.addEventListener('submit',async()=>{
    if(submit.disabled)return;
    const captchaToken=window.turnstile.getResponse(widget);
    if(!captchaToken){status.textContent='Please complete verification first.';return}
    const name=document.getElementById(entry.name).value.trim(),message=document.getElementById(entry.message).value.trim(),kind=document.getElementById(entry.kind).value;
    if(!name||!message){status.textContent='Please add your name and a message.';return}
    submit.disabled=true;status.textContent='Saving your note securely…';
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
    try{
     const response=await fetch(cfg.submitEndpoint,{method:'POST',headers:{'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({type:entry.type,name:entry.type==='blessing'&&document.getElementById('anonymous')?.checked?'Anonymous':name,message,kind,captchaToken})});
     const result=await response.json().catch(()=>null);
     if(!response.ok||result?.ok!==true){
      const error=new Error(response.status===429?'A few too many notes at once. Please try again later. Your note has not been saved.':response.status===403?'Verification expired or was not accepted. Please verify again. Your note has not been saved.':response.status>=500?'The guestbook is temporarily unavailable. Please try again shortly. Your note has not been saved.':'Could not save your message. Please try again.');throw error;
     }
     form.reset();status.textContent=entry.type==='blessing'?'Thank you! Your blessing is saved and awaiting approval.':'Your private anniversary message has been saved. Thank you!';
     form.dispatchEvent(new CustomEvent('ak:submission-saved',{detail:{type:entry.type}}));
    }catch(error){status.textContent=error.name==='AbortError'?'The connection timed out. We could not confirm whether your note was saved. Please wait before trying again.':error instanceof TypeError?'Connection lost. We could not confirm whether your note was saved. Please check your connection before retrying.':error.message}
    finally{clearTimeout(timeout);submit.disabled=true;window.turnstile.reset(widget)}
   });
  }
 }
 loadVerification();
})();
