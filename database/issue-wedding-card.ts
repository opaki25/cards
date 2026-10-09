// Only a SHA-256 digest is stored here. The organiser key is never shipped to clients.
const organiserHash = '9efbc7d748cd01123ebb945355f7df7d59770bc200a35af04de757b935447c39';
const headers = {'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'content-type, apikey, authorization','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
const reply = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers});
Deno.serve(async (req: Request) => {
 if(req.method==='OPTIONS') return new Response(null,{headers});
 if(req.method!=='POST') return reply({error:'Method not allowed'},405);
 try {
  const key=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if(!/^[a-f0-9]{64}$/.test(key))return reply({error:'Enter your organiser key to issue invitations.'},401);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)))).map(b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==organiserHash)return reply({error:'The organiser key is incorrect.'},401);
  const raw=await req.text();if(raw.length>1024)return reply({error:'Request too large'},400);
  const input=JSON.parse(raw);
  const name=typeof input.name==='string'?input.name.replace(/\s+/g,' ').trim():'';
  const id=input.id, admits=input.admits;
  if(name.length<2||name.length>120||/[\u0000-\u001f]/.test(name)||!Number.isInteger(admits)||admits<1||admits>50||typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))return reply({error:'Enter a valid guest name and number of guests.'},400);
  const url=Deno.env.get('SUPABASE_URL')+'/rest/v1/wedding_cards';
  const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const dbHeaders={apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'};
  // A retry uses the same UUID. A unique primary key prevents duplicate issuance.
  const created=await fetch(url,{method:'POST',headers:{...dbHeaders,Prefer:'return=representation'},body:JSON.stringify({id,guest_name:name,admitted_guests:admits})});
  let row;
  if(created.ok){row=(await created.json())[0];}
  else if(created.status===409){
   const existing=await fetch(url+'?id=eq.'+id+'&select=id,code,guest_name,admitted_guests,active',{headers:dbHeaders});
   if(!existing.ok)return reply({error:'Could not confirm this invitation. Try again.'},503);
   row=(await existing.json())[0];
   if(!row||row.guest_name!==name||row.admitted_guests!==admits)return reply({error:'This draft has changed. Start a new invitation.'},409);
  }else{return reply({error:'Could not save the invitation. Please try again.'},503);}
  if(!row.active)return reply({error:'This invitation has been revoked. Start a new invitation.'},409);
  return reply({id:row.id,code:row.code,name:row.guest_name,admits:row.admitted_guests});
 }catch{return reply({error:'Could not issue the invitation. Please try again.'},400);}
});
