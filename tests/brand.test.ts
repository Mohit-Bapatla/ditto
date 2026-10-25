import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import manifest from "../app/manifest";

test("official branding exports have correct dimensions and icon safe areas", async () => {
  const root = "public/brand/official/";
  for (const size of [180,192,512]) {
    const m = await sharp(`${root}app-${size}.png`).metadata();
    assert.equal(m.width,size); assert.equal(m.height,size);
  }
  const logo = await sharp(root+"logo-horizontal.webp").metadata();
  assert.equal(logo.width,420); assert.equal(logo.height,140); assert.equal(logo.hasAlpha,true);
  const {data,info} = await sharp(root+"app-maskable-512.png").raw().toBuffer({resolveWithObject:true});
  // All colored artwork fits inside the standard central 80% diameter safe circle.
  for(let y=0;y<512;y++) for(let x=0;x<512;x++) {
    const o=(y*512+x)*info.channels;
    if(Math.max(data[o],data[o+1],data[o+2])-Math.min(data[o],data[o+1],data[o+2])>65)
      assert.ok(Math.hypot(x-256,y-256)<205,"mask must not clip the official artwork");
  }
  const ico=await readFile("app/favicon.ico");
  assert.equal(ico.readUInt16LE(2),1); assert.equal(ico.readUInt16LE(4),3);
  const og=await sharp("app/opengraph-image.png").metadata();
  assert.equal(og.width,1200);assert.equal(og.height,630);
  const m=manifest();assert.equal(m.display,"standalone");assert.equal(m.start_url,"/");
  for(const icon of m.icons || []) assert.ok((await readFile(`public${icon.src}`)).length>0);
});
