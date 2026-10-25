import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost'});
for(const [key,value] of Object.entries({window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Node:dom.window.Node,IS_REACT_ACT_ENVIRONMENT:true}))Object.defineProperty(globalThis,key,{value,configurable:true});
const {createElement,act}=await import('react');const {createRoot}=await import('react-dom/client');
const {PlanWithCircle}=await import('../app/plan-with-circle');
import type {Activity,Circle} from '../lib/types';
const activity={id:'a',title:'A real activity',image:''} as Activity;
const circles=[{id:'c',name:'Weekend Crew',members:[{id:'m',name:'Mohit',photo:'data:image/jpeg;base64,abc'}]}] as Circle[];
test('rapid submit is guarded, failure is recoverable and success offers Circle continuation',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);let calls=0,finish:(v:boolean)=>void=()=>{},view='';
 await act(async()=>root.render(createElement(PlanWithCircle,{activity,circles,initialCircle:'c',onSubmit:async()=>{calls++;return new Promise<boolean>(r=>finish=r);},onBack(){},onCreate(){},onView(c){view=c;}})));
 assert.ok(host.querySelector('img[alt="Mohit\'s profile"]'));
 const submit=()=>host.querySelector('form')!.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await act(async()=>{submit();submit();});assert.equal(calls,1);assert.match(host.textContent!,/Sending/);
 await act(async()=>finish(false));assert.match(host.querySelector('[role=alert]')!.textContent!,/Try again/);
 await act(async()=>submit());assert.equal(calls,2);await act(async()=>finish(true));
 assert.match(host.textContent!,/Suggested to Weekend Crew/);
 await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent?.includes('View in Circle'))!.click());assert.equal(view,'c');
 await act(async()=>root.unmount());host.remove();
});
test('no Circles offers creation, without silently submitting',async()=>{
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);let created=false;
 await act(async()=>root.render(createElement(PlanWithCircle,{activity,circles:[],onSubmit:async()=>{throw Error('must not submit');},onBack(){},onCreate(){created=true;},onView(){}})));
 assert.match(host.textContent!,/Who’s coming/);
 await act(async()=>Array.from(host.querySelectorAll('button')).find(b=>b.textContent==='Create a Circle')!.click());assert.equal(created,true);
 await act(async()=>root.unmount());host.remove();
});
