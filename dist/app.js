'use strict';
const $ = id => document.getElementById(id);
const card = $('card'), ctx = card.getContext('2d');
const fonts = { classic: {family:'"Times New Roman", serif',weight:700}, elegant:{family:'Georgia, serif',weight:700}, script:{family:'"Segoe Script", "Brush Script MT", cursive',weight:400}, modern:{family:'Arial, sans-serif',weight:600} };
const base = document.createElement('canvas'); base.width=853;base.height=1280;
const baseCtx=base.getContext('2d');
let ready=false, valid=false;
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
 valid=Boolean(name)&&fits();
 const m=ctx.measureText(name);
 // Center visible glyphs in the original line, including descending letters.
 const baseline=940+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;
 ctx.save();ctx.beginPath();ctx.rect(85,918,683,47);ctx.clip();ctx.fillText(name,426.5,baseline);ctx.restore();
 $('size-value').textContent=`${requested} px`;
 $('download').disabled=!valid;
 $('fit-status').classList.toggle('warning',!valid);
 $('fit-status').textContent=!name?'Enter a guest name to create an invitation.':!valid?'This name is too long. Enable automatic fitting or reduce the font size.':size<requested?`Automatically fitted to ${Number(size.toFixed(2))} px to keep the name inside the card.`:'Your guest’s name fits perfectly.';
 card.setAttribute('aria-label',`Wedding invitation for ${name||'your guest'}. Shepherd and Rita, 12 December 2026, 1 PM EAT, Flamingo Hall, Freedom City.`);
 $('message').textContent='';
}
for(const id of ['guest','font','size','autofit'])$(id).addEventListener('input',render);
$('reset').addEventListener('click',()=>{$('font').value='classic';$('size').value='42';$('autofit').checked=true;render();});
$('editor-form').addEventListener('submit',async e=>{
 e.preventDefault();if(!ready||!valid)return;
 const button=$('download');button.disabled=true;
 try{
  const format=$('format').value;
  const blob=await new Promise(resolve=>card.toBlob(resolve,`image/${format}`,0.96));
  if(!blob)throw new Error('Unable to create your download. Please try again.');
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  const name=textValue().replace(/[<>:"/\\|?*\u0000-\u001f]/g,'').replace(/\s+/g,'-').slice(0,100)||'Guest';
  link.download=`Shepherd-and-Rita-${name}.${format==='jpeg'?'jpg':'png'}`;link.href=url;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('message').textContent='Your invitation is ready. Check your downloads.';
 }catch(error){$('message').textContent=error.message;}finally{button.disabled=!valid;}
});
$('expand').addEventListener('click',()=>{if(!ready)return;$('large-image').src=card.toDataURL('image/png');$('large-image').alt=card.getAttribute('aria-label');$('large-preview').showModal();});
$('close-preview').addEventListener('click',()=>$('large-preview').close());
$('large-preview').addEventListener('click',e=>{if(e.target===$('large-preview')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
Promise.all([loadImage('assets/invitation-original.png'),loadImage('assets/invitation-blank.png'),document.fonts.ready]).then(([original,blank])=>{prepareBase(original,blank);ready=true;$('loading').hidden=true;render();}).catch(error=>{$('loading').textContent=error.message;$('expand').disabled=true;});

