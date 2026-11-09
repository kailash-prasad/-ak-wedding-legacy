const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const code=fs.readFileSync('secure-forms.js','utf8');
async function scenario(response,mode='normal'){
 const listeners=[],sent=[],nodes={};let opts,script,reset=0;
 const submit={disabled:true,before(){}};
 const form={addEventListener(type,fn){if(type==='submit')listeners.push(fn)},querySelector(){return submit},reset(){reset++},dispatchEvent(e){sent.push(e)}};
 const status={textContent:''};
 Object.assign(nodes,{blessingForm:form,blessingStatus:status,blessingName:{value:'QA'},blessingText:{value:'Integration test'},blessingType:{value:'blessing'},verificationSlot:{append(){}}});
 const sandbox={window:{AK_CONFIG:{submitEndpoint:'https://test.invalid',turnstileSiteKey:'test'},turnstile:{render(h,o){opts=o;return 1},getResponse(){return 'test-token'},reset(){}}},
 document:{getElementById:id=>nodes[id],createElement:()=>({setAttribute(){}}),head:{append(s){script=s}}},setTimeout:()=>1,clearTimeout(){},AbortController,CustomEvent:class{constructor(type,init){this.type=type;this.detail=init.detail}},fetch:async()=>{if(response instanceof Error)throw response;return response},TypeError,Error};
 vm.runInNewContext(code,sandbox);
 if(mode==='scriptError'){script.onerror();return {submit,status,sent,listeners}}
 script.onload();opts.callback();await listeners[1]();return {submit,status,sent,reset};
}
(async()=>{
 let r=await scenario({ok:true,status:201,json:async()=>({ok:true})});assert.equal(r.sent.length,1);assert.equal(r.reset,1);assert.equal(r.sent[0].type,'ak:submission-saved');
 r=await scenario({ok:true,status:200,json:async()=>({})});assert.equal(r.sent.length,0);assert.equal(r.reset,0);
 r=await scenario({ok:false,status:429,json:async()=>({error:'rate'})});assert.match(r.status.textContent,/too many/);assert.equal(r.sent.length,0);
 r=await scenario({ok:false,status:403,json:async()=>({})});assert.match(r.status.textContent,/verify again/);assert.equal(r.sent.length,0);
 r=await scenario({ok:false,status:503,json:async()=>({})});assert.match(r.status.textContent,/temporarily unavailable/);assert.equal(r.sent.length,0);
 r=await scenario(new TypeError('network'));assert.match(r.status.textContent,/could not confirm/);assert.equal(r.sent.length,0);
 r=await scenario(null,'scriptError');assert.equal(r.submit.disabled,true);assert.equal(r.listeners.length,1);assert.match(r.status.textContent,/not been saved/);
 console.log('PASS: saved confirmation, false-success rejection, rate limit, verification failure, server failure, network uncertainty, script-load guard');
})().catch(e=>{console.error(e);process.exitCode=1});
