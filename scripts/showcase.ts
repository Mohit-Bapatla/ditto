import { spawn } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync, unlinkSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { resolve } from 'node:path';
import { prepareShowcase } from '../lib/showcase-fixtures';
import { showcaseOwner } from '../lib/showcase-policy';
const mode=process.argv[2] || 'start';
if(!['start','seed','reset'].includes(mode))throw new Error('Use showcase, showcase:seed or showcase:reset.');
const root=process.cwd(),lock=resolve('data/showcase/server.pid');
if(mode==='start' && existsSync(lock)) {
  const pid=Number(readFileSync(lock,'utf8'));let alive=false;
  if(Number.isSafeInteger(pid)&&pid>0)try{process.kill(pid,0);alive=true;}catch{}
  if(alive)throw new Error('Showcase is already running. Use http://showcase.localhost:3120/.');
}
const result=await prepareShowcase(root,mode==='reset'?'reset':'seed');
console.log(`Showcase v${result.version}: ${result.path}`);
if(result.backupPath)console.log(`Pre-reset backup: ${result.backupPath}`);
if(result.missingPhotos.length)console.log(`Original photos unavailable: ${result.missingPhotos.join(', ')}. Initials remain.`);
if(mode==='start') {
  const lan=process.argv.includes('--lan'),port='3120';
  console.log(`Open http://showcase.localhost:${port}/ as Mohit. Profile → Settings switches sample identities.`);
  if(lan)for(const list of Object.values(networkInterfaces()))for(const address of list||[])if(address.family==='IPv4'&&!address.internal)console.log(`Same-Wi-Fi iPhone: http://${address.address}:${port}/ (only while this command is running).`);
  writeFileSync(lock,String(process.pid),{mode:0o600});
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname',lan?'0.0.0.0':'127.0.0.1','--port',port],{
    stdio:'inherit',env:{...process.env,DATABASE_PATH:result.path,DITTO_SHOWCASE:'1',DITTO_PRESENTATION_FIXTURES:'1',DITTO_PRESENTATION_OWNER:showcaseOwner,DITTO_DEMO_SEED:'false',PUBLIC_ORIGIN:'',COOKIE_SECURE:'false',ALLOW_LIVE_PROVIDERS:'false',MODEL_API_KEY:'',SERPAPI_API_KEY:''}
  });
  const cleanup=()=>{if(existsSync(lock)&&readFileSync(lock,'utf8')===String(process.pid))unlinkSync(lock);};
  child.on('error',e=>{cleanup();throw e;});
  child.on('exit',code=>{cleanup();process.exit(code??0);});
  for(const signal of ['SIGINT','SIGTERM'] as const)process.on(signal,()=>child.kill(signal));
}
