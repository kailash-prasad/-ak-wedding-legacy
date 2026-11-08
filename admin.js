'use strict';
(async()=>{
 const project='https://euiobpugmtdkxxmsuelk.supabase.co';
 const keyResponse=await fetch('./admin-config.json',{cache:'no-store'}).catch(()=>null);
 const config=keyResponse?.ok?await keyResponse.json():{};
 const status=document.getElementById('loginStatus'),dashStatus=document.getElementById('dashboardStatus');
 if(!config.publishableKey){status.textContent='Administrator login is awaiting public API key configuration.';document.getElementById('loginForm').querySelector('button').disabled=true;return}
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
 const db=createClient(project,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
 const login=document.getElementById('loginPanel'),dashboard=document.getElementById('dashboard');
 const pending=document.getElementById('pendingList');
 const capsule=document.getElementById('capsuleList');
 const unlock=Date.parse('2027-12-04T18:30:00Z');
 function showAdmin(ok){login.hidden=ok;dashboard.hidden=!ok}
 async function load(){
  const {data:userResult}=await db.auth.getUser();if(!userResult?.user){showAdmin(false);return}
  const {data:admin,error:adminError}=await db.from('site_admins').select('user_id').eq('user_id',userResult.user.id).maybeSingle();
  if(adminError||!admin){showAdmin(false);status.textContent='This account is not authorized as a site administrator.';return}
  showAdmin(true);
  const {data:rows,error}=await db.from('blessings').select('id,name,message,kind,created_at').eq('approved',false).order('created_at',{ascending:false}).limit(100);
  if(error){dashStatus.textContent='Could not load blessings: '+error.message;return}
  pending.replaceChildren();
  dashStatus.textContent=rows.length?rows.length+' blessing(s) awaiting approval.':'No blessings awaiting approval.';
  for(const row of rows){
   const article=document.createElement('article');article.className='entry';
   const title=document.createElement('strong');title.textContent=row.name+' · '+row.kind;
   const body=document.createElement('p');body.textContent=row.message;
   const approve=document.createElement('button');approve.textContent='Approve';
   const reject=document.createElement('button');reject.textContent='Delete';reject.setAttribute('aria-label','Delete blessing from '+row.name);
   approve.onclick=async()=>{approve.disabled=true;reject.disabled=true;const {error:e}=await db.from('blessings').update({approved:true}).eq('id',row.id);if(e){dashStatus.textContent=e.message;approve.disabled=false;reject.disabled=false}else await load()};
   reject.onclick=async()=>{if(!confirm('Permanently delete this blessing?'))return;approve.disabled=true;reject.disabled=true;const {error:e}=await db.from('blessings').delete().eq('id',row.id);if(e){dashStatus.textContent=e.message;approve.disabled=false;reject.disabled=false}else await load()};
   article.append(title,body,approve,reject);pending.append(article);
  }
  capsule.replaceChildren();
  if(Date.now()<unlock){document.getElementById('capsuleNotice').textContent='Sealed until 5 December 2027, 12:00 AM IST. Database access is locked until then.';return}
  const {data:letters,error:capsuleError}=await db.from('capsule_messages').select('name,message,kind,created_at').order('created_at',{ascending:true});
  if(capsuleError){document.getElementById('capsuleNotice').textContent='Unable to open capsule: '+capsuleError.message;return}
  document.getElementById('capsuleNotice').textContent='Our anniversary messages';
  for(const letter of letters){const article=document.createElement('article');article.className='entry';const title=document.createElement('strong');title.textContent=letter.name+' · '+letter.kind;const p=document.createElement('p');p.textContent=letter.message;article.append(title,p);capsule.append(article)}
 }
 document.getElementById('loginForm').addEventListener('submit',async e=>{e.preventDefault();status.textContent='Signing in…';const {error}=await db.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('password').value});document.getElementById('password').value='';if(error){status.textContent=error.message;return}status.textContent='';await load()});
 document.getElementById('logout').onclick=async()=>{await db.auth.signOut();pending.replaceChildren();capsule.replaceChildren();showAdmin(false)};
 await load();
})();