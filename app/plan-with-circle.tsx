"use client";
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Users } from 'lucide-react';
import type { Activity, Circle } from '@/lib/types';
import { Avatar } from './profile-photo';

export function PlanWithCircle({activity,circles,onSubmit,onBack,onCreate,onView,initialCircle}: {
  activity:Activity;circles:Circle[];initialCircle?:string;
  onSubmit:(input:{circle:string;suggestedStart?:string;message?:string})=>Promise<boolean>;
  onBack:()=>void;onCreate:()=>void;onView:(circle:string)=>void;
}) {
  const [circle,setCircle]=useState(initialCircle || ''),[time,setTime]=useState(''),[message,setMessage]=useState('');
  const [busy,setBusy]=useState(false),[sent,setSent]=useState(false),[error,setError]=useState('');
  const pending=useRef(false);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.closest("dialog")?.scrollTo?.({top:0});heading.current?.focus({preventScroll:true});},[]);
  const chosen=circles.find(c=>c.id===circle);
  async function submit(e:React.FormEvent) {
    e.preventDefault(); if(pending.current || !chosen)return;
    pending.current=true;setBusy(true);setError('');
    try {
      const ok=await onSubmit({circle,suggestedStart:time ? new Date(time).toISOString() : undefined,message:message.trim() || undefined});
      if(ok)setSent(true);else setError('Couldn’t confirm the suggestion. Try again—retries won’t add it twice.');
    } catch {setError('Couldn’t confirm the suggestion. Your choices are saved here. Please try again.');}
    finally {pending.current=false;setBusy(false);}
  }
  return <section className="circle-picker">
    {!sent && <button className="text-button" onClick={onBack} disabled={busy}><ArrowLeft size={16}/> Back to details</button>}
    <div className="circle-picker-activity">{activity.image && <img src={activity.image} alt=""/>}<div><span>Bring your friends in</span><h3 ref={heading} tabIndex={-1}>{activity.title}</h3>{activity.venueData?.name && <p>{activity.venueData.name}</p>}</div></div>
    {sent ? <div className="circle-picker-success" role="status"><Check size={32}/><h3>Suggested to {chosen?.name}</h3><p>Everyone gets their own vote. Timing and approvals come next.</p>{chosen?.round && !chosen.round.complete && <p className="small muted">Your idea is ready for the next round, after the current votes are in.</p>}<button className="primary full" onClick={()=>onView(circle)}>View in Circle <ArrowRight size={18}/></button></div>
    : !circles.length ? <div className="circle-picker-empty"><Users size={32}/><h3>Who’s coming with you?</h3><p>Create a Circle for your friends, then suggest this activity together.</p><button className="primary full" onClick={onCreate}>Create a Circle</button></div>
    : <form onSubmit={submit}>
      <fieldset disabled={busy}><legend>Choose your Circle</legend><div className="circle-options">{circles.map(c=><label key={c.id} className={`circle-option ${circle===c.id?'selected':''}`}><input type="radio" name="planning-circle" value={c.id} checked={circle===c.id} onChange={()=>setCircle(c.id)} required/><span className="circle-option-copy"><strong>{c.name}</strong><small>{c.members.length} {c.members.length===1?'member':'members'}</small></span><span className="circle-option-avatars">{c.members.slice(0,3).map(m=><span key={m.id}><Avatar person={m}/></span>)}</span></label>)}</div></fieldset>
      <label className="circle-picker-time"><span>Suggested date & time <span className="muted">(optional)</span></span><input type="datetime-local" value={time} disabled={busy} onChange={e=>setTime(e.target.value)}/><small>{time?'A suggestion in your local time—not a confirmed plan.':'Decide together later'}</small></label>
      <label><span>Message to the group <span className="muted">(optional)</span></span><textarea value={message} onChange={e=>setMessage(e.target.value)} disabled={busy} maxLength={1000} rows={2} placeholder="Thought we could try this together"/></label>
      {error && <p className="error-banner" role="alert">{error}</p>}
      <div className="circle-picker-submit"><button className="primary full" disabled={busy || !chosen}>{busy?'Sending suggestion…':'Suggest activity'}</button><small>No votes, approvals or RSVPs are added for anyone.</small></div>
    </form>}
  </section>;
}
