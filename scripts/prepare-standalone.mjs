import { cp, mkdir, access } from 'node:fs/promises';
// Run after every build, before starting the standalone preview. Docker copies these separately.
await access('.next/standalone/server.js');
await mkdir('.next/standalone/.next/static', { recursive:true });
await cp('.next/static', '.next/standalone/.next/static', { recursive:true });
await mkdir('.next/standalone/public', { recursive:true });
await cp('public', '.next/standalone/public', { recursive:true });
console.log('Standalone preview assets prepared.');
