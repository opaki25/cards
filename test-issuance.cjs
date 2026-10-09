const assert=require('node:assert/strict');
const fs=require('node:fs');
const {randomUUID}=require('node:crypto');
const api='https://kmmbavbmwpzfkdiwqqzm.supabase.co/functions/v1/';
const pub='sb_publishable_cXSF1bpQRRfe7pAmHWzd-A_VCj1vcLO';
async function post(path,body,key){const r=await fetch(api+path,{method:'POST',headers:{'Content-Type':'application/json',apikey:pub,...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
(async()=>{
 const key=fs.readFileSync('../invitation-organiser-key.txt','utf8').trim();
 const draft={id:randomUUID(),name:'Integration test — not a wedding guest',admits:2};
 assert.equal((await post('issue-wedding-card',draft)).status,401);
 assert.equal((await post('issue-wedding-card',draft,'0'.repeat(64))).status,401);
 assert.equal((await post('issue-wedding-card',{...draft,admits:0},key)).status,400);
 const first=await post('issue-wedding-card',draft,key);assert.equal(first.status,200);
 fs.writeFileSync('../invitation-test-record.json',JSON.stringify({id:draft.id}));
 const second=await post('issue-wedding-card',draft,key);assert.equal(second.body.code,first.body.code);
 assert.equal((await post('issue-wedding-card',{...draft,name:'Changed name'},key)).status,409);
 const verified=await post('verify-wedding-card',{code:first.body.code});assert.equal(verified.body.valid,true);assert.equal(verified.body.name,draft.name);assert.equal(verified.body.admitted_guests,2);
 const grouped='RS-'+first.body.code.slice(3).match(/.{1,4}/g).join('-');
 assert.equal((await post('verify-wedding-card',{code:grouped.toLowerCase()})).body.valid,true);
 console.log('PASS: missing/wrong keys, invalid guest count, unique issuance, idempotent retry, mismatch protection, verifier name/count, formatted codes.');
 console.log('Test record to revoke: '+draft.id);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
