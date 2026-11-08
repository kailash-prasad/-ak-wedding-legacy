// Supabase Edge Function: public-submit
// Deploy with --no-verify-jwt; never expose the service role key in browser code.
// Required secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN,
// TURNSTILE_SECRET_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const encoder = new TextEncoder();
const json=(value:unknown,status=200,origin='')=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json','access-control-allow-origin':origin,'vary':'Origin','cache-control':'no-store'}});
Deno.serve(async request=>{
 const origin=request.headers.get('origin')||'';
 const allowed=Deno.env.get('ALLOWED_ORIGIN')||'';
 const allowedOrigins=new Set([allowed,'https://lustrous-pastelito-d75323.netlify.app']);
 if(!origin||!allowedOrigins.has(origin))return json({error:'Origin not allowed'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':origin,'access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin'}});
 if(request.method!=='POST')return json({error:'Method not allowed'},405,origin);
 if(Number(request.headers.get('content-length')||0)>12000)return json({error:'Payload too large'},413,origin);
 const turnstileSecret=Deno.env.get('TURNSTILE_SECRET_KEY');
 const redisUrl=Deno.env.get('UPSTASH_REDIS_REST_URL');
 const redisToken=Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
 if(!turnstileSecret||!redisUrl||!redisToken)return json({error:'Submission service unavailable'},503,origin);
 let payload:Record<string,unknown>;
 try{payload=await request.json();}catch{return json({error:'Invalid JSON'},400,origin)}
 const type=payload.type;
 if(type!=='blessing'&&type!=='capsule')return json({error:'Invalid submission type'},400,origin);
 const name=String(payload.name||'').trim(),message=String(payload.message||'').trim();
 const kind=String(payload.kind||'');
 const allowedKinds=type==='blessing'?['blessing','memory','advice']:['wish','prediction','memory','advice'];
 if(!name||name.length>80||!message||message.length>(type==='blessing'?1200:1800)||!allowedKinds.includes(kind))return json({error:'Invalid fields'},400,origin);
 const token=String(payload.captchaToken||'');
 if(!token)return json({error:'Verification required'},400,origin);
 const verify=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:turnstileSecret,response:token})}).then(r=>r.json()).catch(()=>null);
 if(!verify?.success)return json({error:'Verification failed'},403,origin);
 const ip=request.headers.get('cf-connecting-ip')||'unknown';
 const digest=await crypto.subtle.digest('SHA-256',encoder.encode(ip+':'+Deno.env.get('SUPABASE_URL')));
 const key='legacy:submit:'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
 const rate=await fetch(redisUrl+'/pipeline',{method:'POST',headers:{authorization:'Bearer '+redisToken,'content-type':'application/json'},body:JSON.stringify([['INCR',key],['EXPIRE',key,3600,'NX']])}).then(r=>r.json()).catch(()=>null);
 if(!rate||rate[0]?.result>8)return json({error:'Please try again later'},429,origin);
 const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
 const row={name,message,kind,...(type==='blessing'?{approved:false}:{})};
 const {error}=await client.from(type==='blessing'?'blessings':'capsule_messages').insert(row);
 if(error)return json({error:'Could not save your message'},500,origin);
 return json({ok:true},201,origin);
});