'use strict';
(() => {
 const cfg=window.AK_CONFIG||{};
 const endpoint=cfg.submitEndpoint,siteKey=cfg.turnstileSiteKey;
 const forms=[{id:'blessingForm',type:'blessing',status:'blessingStatus',name:'blessingName',message:'blessingText',kind:'blessingType'},{id:'capsuleForm',type:'capsule',status:'capsuleStatus',name:'capsuleName',message:'capsuleText',kind:'capsuleType'}];
 if(!endpoint||!siteKey){forms.forEach(({id,status})=>{const form=document.getElementById(id);if(!form)return;form.addEventListener('submit',e=>{e.preventDefault();document.getElementById(status).textContent='Guestbook is not yet available; your message was not saved.'})});return}
 const widgets=[];
 function mount(){
  for(const entry of forms){
   const form=document.getElementById(entry.id);if(!form)continue;
   const status=document.getElementById(entry.status),submit=form.querySelector('[type=submit]');
   const holder=document.createElement('div');holder.className='turnstile-holder';holder.setAttribute('aria-label','Spam protection verification');
   submit.before(holder);
   const widget=window.turnstile.render(holder,{sitekey:siteKey});
   widgets.push(widget);
   form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(submit.disabled)return;
    const captchaToken=window.turnstile.getResponse(widget);
    if(!captchaToken){status.textContent='Please complete the verification first.';return}
    const name=document.getElementById(entry.name).value.trim();
    const message=document.getElementById(entry.message).value.trim();
    const kind=document.getElementById(entry.kind).value;
    submit.disabled=true;status.textContent='Sending securely…';
    try{
     const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:entry.type,name:entry.type==='blessing'&&document.getElementById('anonymous')?.checked?'Anonymous':name,message,kind,captchaToken})});
     if(!response.ok)throw new Error('Submission unsuccessful');
     form.reset();
     status.textContent=entry.type==='blessing'?'Thank you! Your blessing is awaiting approval.':'Your private anniversary message has been saved. Thank you!';
    }catch{status.textContent='Could not save your message. Please try again.'}
    finally{submit.disabled=false;window.turnstile.reset(widget)}
   });
  }
 }
 const script=document.createElement('script');
 script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
 script.async=true;script.defer=true;script.onload=mount;
 script.onerror=()=>forms.forEach(({id,status})=>{const form=document.getElementById(id);if(form){form.querySelector('[type=submit]').disabled=true;document.getElementById(status).textContent='Verification unavailable. Please try later.'}});
 document.head.appendChild(script);
})();