import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';

// Deterministic exports of the supplied raster. No generated or redrawn artwork.
const root='public/brand/official/';
const {data,info}=await sharp(root+'source.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
const {width:w,height:h}=info;
// Remove only the exterior light matte; white facial details are enclosed and retained.
const seen=new Uint8Array(w*h), queue=new Int32Array(w*h); let head=0,tail=0;
const matte=(i)=> { const o=i*4,r=data[o],g=data[o+1],b=data[o+2]; return Math.max(r,g,b)-Math.min(r,g,b)<65; };
const add=(i)=>{if(!seen[i]&&matte(i)){seen[i]=1;queue[tail++]=i;}};
for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}
for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
while(head<tail){const i=queue[head++],x=i%w,y=Math.floor(i/w);if(x)add(i-1);if(x<w-1)add(i+1);if(y)add(i-w);if(y<h-1)add(i+w);}
for(let i=0;i<w*h;i++) if(seen[i] || (Math.floor(i/w)>700 && matte(i))) data[i*4+3]=0;
const raw={raw:{width:w,height:h,channels:4}};
const symbol=await sharp(data,raw).extract({left:278,top:110,width:890,height:584}).png().toBuffer();
const word=await sharp(data,raw).extract({left:320,top:698,width:814,height:280}).png().toBuffer();
await sharp(symbol).webp({quality:95}).toFile(root+'symbol.webp');
await sharp(word).webp({lossless:true}).toFile(root+'wordmark.webp');
await sharp(data,raw).extract({left:278,top:110,width:890,height:870}).png().toFile(root+'logo-stacked.png');
const s=await sharp(symbol).resize({width:192,height:128,fit:'inside'}).toBuffer();
const wordSmall=await sharp(word).resize({width:204,height:76,fit:'inside'}).toBuffer();
await sharp({create:{width:420,height:140,channels:4,background:'#0000'}}).composite([{input:s,left:0,top:6},{input:wordSmall,left:210,top:35}]).webp({lossless:true}).toFile(root+'logo-horizontal.webp');
for(const size of [180,192,512]){
 const mark=await sharp(symbol).resize({width:Math.round(size*.86),height:Math.round(size*.7),fit:'inside'}).toBuffer();
 const result=await sharp({create:{width:size,height:size,channels:4,background:'#fff9fa'}}).composite([{input:mark,gravity:'centre'}]).png().toBuffer();
 await writeFile(root+`app-${size}.png`,result);
 if(size===180)await writeFile('app/apple-icon.png',result);
}
const mask=await sharp(symbol).resize({width:350,height:260,fit:'inside'}).toBuffer();
await sharp({create:{width:512,height:512,channels:4,background:'#fff9fa'}}).composite([{input:mask,gravity:'centre'}]).png().toFile(root+'app-maskable-512.png');
const icons=[];
for(const size of [16,32,48]){
 const icon=await sharp(symbol).resize({width:size,height:size,fit:'contain',background:'#0000'}).png().toBuffer();
 await writeFile(root+`favicon-${size}.png`,icon); icons.push({size,icon});
}
const header=Buffer.alloc(6+16*icons.length);header.writeUInt16LE(1,2);header.writeUInt16LE(icons.length,4);let offset=header.length;
icons.forEach(({size,icon},i)=>{const o=6+16*i;header[o]=size;header[o+1]=size;header.writeUInt16LE(1,o+4);header.writeUInt16LE(32,o+6);header.writeUInt32LE(icon.length,o+8);header.writeUInt32LE(offset,o+12);offset+=icon.length;});
await writeFile('app/favicon.ico',Buffer.concat([header,...icons.map(i=>i.icon)]));
await sharp(root+'favicon-48.png').toFile('app/icon.png');
const og=await sharp(root+'logo-horizontal.webp').resize(840,280).toBuffer();
await sharp({create:{width:1200,height:630,channels:4,background:'#fff9fa'}}).composite([{input:og,gravity:'centre'}]).png().toFile('app/opengraph-image.png');
console.log('Official logo exports prepared from original pixels.');
