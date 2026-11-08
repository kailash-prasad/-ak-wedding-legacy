'use strict';
(() => {
 const cfg=window.AK_CONFIG||{};
 const entries=[{id:'blessingForm',type:'blessing',status:'blessingStatus',name:'blessingName',message:'blessingText',kind:'blessingType'},{id:'capsuleForm',type:'capsule',status:'capsuleStatus',name:'capsuleName',message:'capsuleText',kind:'capsuleType'}];
 const forms=entries.map(entry=>({...entry,form:document.getElementById(entry.id)})).filter(entry=>entry.form);
 const setUnavailable=text=>forms.forEach(entry=>{entry.form.querySelector('[type=submit]').disabled=true;document.getElementById(entry.status).textContent=text});
 // Install this guard immediately: a failed verification script must never submit a native GET.
 forms.forEach(entry=>entry.form.addEventListener('submit',e=>e.preventDefault()));
 if(!cfg.submitEndpoint||!cfg.turnstileSiteKey){setUnavailable('Guestbook is not yet available. Your message has not been saved.');return}
 let mounted=false;
 const watchdog=setTimeout(()=>{if(!mounted)setUnavailable('Verification is taking longer than expected. Please reload to try again; your message has not been saved.')},20000);
 function mount(){
  if(mounted)return;mounted=true;clearTimeout(watchdog);
  for(const entry of forms){
   const {form}=entry,status=document.getElementById(entry.status),submit=form.querySelector('[type=submit]');
   const holder=document.createElement('div');holder.className='turnstile-holder';holder.setAttribute('aria-label','Spam protection verification');
   const slot=document.getElementById('verificationSlot');if(slot)slot.append(holder);else submit.before(holder);
   let widget;
   try{widget=window.turnstile.render(holder,{sitekey:cfg.turnstileSiteKey,size:'flexible',theme:'light',
    callback:()=>{submit.disabled=false;status.textContent=''},
    'expired-callback':()=>{submit.disabled=true;status.textContent='Verification expired. Please verify again.'},
    'error-callback':()=>{submit.disabled=true;status.textContent='Verification could not load. Please reload to try again. Your message has not been saved.'}
   })}catch{status.textContent='Verification unavailable. Please try later.';continue}
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
 const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;script.onload=mount;script.onerror=()=>{clearTimeout(watchdog);setUnavailable('Verification unavailable. Please reload to try again. Your message has not been saved.')};document.head.append(script);
})();
