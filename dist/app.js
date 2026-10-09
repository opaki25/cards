'use strict';
const $ = id => document.getElementById(id);
const card = $('card'), ctx = card.getContext('2d');
const fonts = { classic: {family:'"Times New Roman", serif',weight:700}, elegant:{family:'Georgia, serif',weight:700}, script:{family:'"Segoe Script", "Brush Script MT", cursive',weight:400}, modern:{family:'Arial, sans-serif',weight:600} };
const base = document.createElement('canvas'); base.width=853;base.height=1280;
const baseCtx=base.getContext('2d');
let ready=false, valid=false, busy=false;
const API='https://kmmbavbmwpzfkdiwqqzm.supabase.co/functions/v1/';
const PUBLIC_KEY='sb_publishable_cXSF1bpQRRfe7pAmHWzd-A_VCj1vcLO';
let draft=null, issued=null;
const session={get(key){try{return sessionStorage.getItem(key);}catch{return null;}},set(key,value){try{sessionStorage.setItem(key,value);}catch{}},remove(key){try{sessionStorage.removeItem(key);}catch{}}};
try{draft=JSON.parse(session.get('invitation-draft'));if(draft?.id&&typeof draft.name==='string'){$('guest').value=draft.name;$('admits').value=draft.admits;}else draft=null;}catch{draft=null;}
$('organiser-key').value=session.get('invitation-organiser')||'';
function currentDraft(){
 const name=textValue(),admits=Number($('admits').value);
 if(!draft||draft.name!==name||draft.admits!==admits){draft={id:crypto.randomUUID(),name,admits};issued=null;}
 session.set('invitation-draft',JSON.stringify(draft));return draft;
}
function formattedCode(code){return 'RS-'+code.slice(3).match(/.{1,4}/g).join('-');}
function setBusy(value){busy=value;for(const id of ['guest','admits','font','size','autofit','reset','new-card','format','organiser-key','lock'])$(id).disabled=value;$('download').disabled=value||!valid;$('generate').disabled=value||!valid;}
async function issueCard(){
 const key=$('organiser-key').value.trim();
 if(!key){$('organiser-key').closest('details').open=true;$('organiser-key').focus();throw new Error('Paste your private organiser key under Organiser access first.');}
 session.set('invitation-organiser',key);
 const snapshot=currentDraft();
 const response=await fetch(API+'issue-wedding-card',{method:'POST',headers:{'Content-Type':'application/json',apikey:PUBLIC_KEY,Authorization:'Bearer '+key},body:JSON.stringify(snapshot),signal:AbortSignal.timeout(20000)});
 const data=await response.json();
 if(!response.ok)throw new Error(data.error||'Unable to save the invitation. Please try again.');
 if(!/^RS-[A-F0-9]{20}$/.test(data.code)||data.name!==snapshot.name||data.admits!==snapshot.admits)throw new Error('The saved invitation did not match this draft. Please try again.');
 issued=data;render();return data;
}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('The invitation image could not load. Please refresh to try again.'));img.src=src;});}
function textValue(){return $('guest').value.replace(/\s+/g,' ').trim();}
// Only the guest-name rectangle uses the repaired image. Every pixel outside
// this rectangle comes directly from the supplied original invitation.
function prepareBase(original,blank){
 baseCtx.drawImage(original,0,0,853,1280);
 const layer=document.createElement('canvas');layer.width=853;layer.height=1280;
 const lc=layer.getContext('2d');lc.drawImage(blank,0,0,853,1280);
 const x=214,y=917,w=433,h=48;
 const repaired=lc.getImageData(x,y,w,h), source=baseCtx.getImageData(x,y,w,h);
 // Match the patch to the original background along its upper/lower edges,
 // feathering its perimeter so there is no hard rectangular border.
 for(let col=0;col<w;col++){
  const correction=[0,0,0];
  for(let channel=0;channel<3;channel++){
   let delta=0,count=0;
   for(let dx=-8;dx<=8;dx++){const c=Math.max(0,Math.min(w-1,col+dx));for(const row of [0,1,h-2,h-1]){const i=(row*w+c)*4+channel;delta+=source.data[i]-repaired.data[i];count++;}}
   correction[channel]=delta/count;
  }
  for(let row=0;row<h;row++){
   const i=(row*w+col)*4;
   const alpha=Math.min(1,col/8,(w-1-col)/8,row/2,(h-1-row)/2);
   for(let channel=0;channel<3;channel++)repaired.data[i+channel]=source.data[i+channel]*(1-alpha)+(repaired.data[i+channel]+correction[channel])*alpha;
  }
 }
 baseCtx.putImageData(repaired,x,y);
}
function render(){
 if(!ready)return;
 const name=textValue(), font=fonts[$('font').value], requested=Number($('size').value);
 let size=requested;
 ctx.drawImage(base,0,0);ctx.fillStyle='#080b07';ctx.textAlign='center';ctx.textBaseline='alphabetic';
 const setFont=()=>{ctx.font=`${font.weight} ${size}px ${font.family}`;};setFont();
 const maxWidth=670,maxHeight=42;
 const fits=()=>{const m=ctx.measureText(name);return m.width<=maxWidth && m.actualBoundingBoxAscent+m.actualBoundingBoxDescent<=maxHeight;};
 if($('autofit').checked){while(size>8&&!fits()){size-=.25;setFont();}}
 currentDraft();
 valid=name.length>=2&&fits()&&Number.isInteger(Number($('admits').value))&&Number($('admits').value)>=1&&Number($('admits').value)<=50;
 const m=ctx.measureText(name);
 // Center visible glyphs in the original line, including descending letters.
 const baseline=940+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;
 ctx.save();ctx.beginPath();ctx.rect(85,918,683,47);ctx.clip();ctx.fillText(name,426.5,baseline);ctx.restore();
 $('size-value').textContent=`${requested} px`;
 // A designed footer replaces the old fixed SR001 with the registered code.
 ctx.fillStyle='#d2e5c6';ctx.fillRect(388,1228,453,34);
 ctx.fillStyle='#172217';ctx.font='17px "Times New Roman", serif';ctx.textAlign='right';
 ctx.fillText(issued?'Access code: '+formattedCode(issued.code):'Access code: generated before download',830,1251);
 $('access-code').textContent=issued?formattedCode(issued.code):'Not issued yet';
 $('code-status').textContent=issued?'Saved to the wedding guest list. Re-downloads keep this code.':'A unique code is saved to the wedding website when you generate or download this invitation.';
 $('generate').textContent=issued?'Confirm saved code':'Generate code';
 $('download').disabled=busy||!valid;$('generate').disabled=busy||!valid;
 $('fit-status').classList.toggle('warning',!valid);
 $('fit-status').textContent=name.length<2?'Enter a guest name of at least two characters.':!fits()?'This name is too long. Enable automatic fitting or reduce the font size.':!valid?'Enter a whole number of admitted guests from 1 to 50.':size<requested?`Automatically fitted to ${Number(size.toFixed(2))} px to keep the name inside the card.`:'Your guest’s name fits perfectly.';
 card.setAttribute('aria-label',`Wedding invitation for ${name||'your guest'}. Shepherd and Rita, 12 December 2026, 1 PM EAT, Flamingo Hall, Freedom City.`);
 $('message').textContent='';
}
for(const id of ['guest','admits','font','size','autofit'])$(id).addEventListener('input',render);
$('lock').addEventListener('click',()=>{$('organiser-key').value='';session.remove('invitation-organiser');$('message').textContent='Organiser key forgotten.';});
$('new-card').addEventListener('click',()=>{draft=null;issued=null;$('guest').value='';$('admits').value='1';render();$('guest').focus();});
$('generate').addEventListener('click',async()=>{if(!ready||!valid||busy)return;setBusy(true);$('message').textContent='Saving your invitation…';try{await issueCard();$('message').textContent='Code registered. Your invitation is ready to download.';}catch(e){$('message').textContent=e.name==='TimeoutError'?'The request timed out. Try again; the same draft will not create duplicate codes.':e.message;}finally{setBusy(false);}});
$('reset').addEventListener('click',()=>{$('font').value='classic';$('size').value='42';$('autofit').checked=true;render();});
$('editor-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!ready||!valid||busy)return;
 setBusy(true);$('message').textContent='Saving your invitation…';
 try{
  await issueCard();
  const format=$('format').value;
  const blob=await new Promise(resolve=>card.toBlob(resolve,`image/${format}`,0.96));
  if(!blob)throw new Error('Unable to create your download. Please try again.');
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  const name=textValue().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'').replace(/\s+/g,'-').slice(0,100)||'Guest';
  link.download=`Shepherd-and-Rita-${name}.${format==='jpeg'?'jpg':'png'}`;link.href=url;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('message').textContent='Your invitation is ready. Check your downloads.';
 }catch(error){$('message').textContent=error.name==='TimeoutError'?'The request timed out. Try again; your draft keeps the same code.':error.message;}finally{setBusy(false);}
});
$('expand').addEventListener('click',()=>{if(!ready)return;$('large-image').src=card.toDataURL('image/png');$('large-image').alt=card.getAttribute('aria-label');$('large-preview').showModal();});
$('close-preview').addEventListener('click',()=>$('large-preview').close());
$('large-preview').addEventListener('click',e=>{if(e.target===$('large-preview')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
Promise.all([loadImage('assets/invitation-original.png'),loadImage('assets/invitation-blank.png'),document.fonts.ready]).then(([original,blank])=>{prepareBase(original,blank);ready=true;$('loading').hidden=true;render();}).catch(error=>{$('loading').textContent=error.message;$('expand').disabled=true;});


