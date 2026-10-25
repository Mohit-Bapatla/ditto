"use client";
import { useState } from 'react';
import { ExternalLink, MapPin } from 'lucide-react';
import { approximateMiles } from '@/lib/discovery-intent';
import type { Activity } from '@/lib/types';
export function VenueDetails({activity:a,busy,onSave}:{activity:Activity;busy:boolean;onSave:()=>void}) {
  const [distance,setDistance]=useState<number>(),[locationError,setLocationError]=useState('');
  const v=a.venueData!;
  return <section className="venue-detail-content">
    <p>{a.description}</p>
    <h3>{v.name}</h3>
    {v.address && <p><MapPin size={16}/> {v.address}</p>}
    <dl className="venue-facts">
      {v.rating !== undefined && <><dt>Maps rating</dt><dd>{v.rating} / 5</dd></>}
      <dt>Price</dt><dd>{v.price || 'Not supplied — check with the venue'}</dd>
      <dt>Hours at retrieval</dt><dd>{v.hours || 'Not supplied — check with the venue'}</dd>
      {a.discovery?.timing && <><dt>Suggested meetup</dt><dd>{a.discovery.timing} · not a reservation</dd></>}
      {a.publishedEvent && <><dt>Published event time</dt><dd><a href={a.publishedEvent.sourceUrl} target="_blank" rel="noreferrer">{a.publishedEvent.start}</a></dd></>}
      {a.discovery?.budgetLimit !== undefined && <><dt>Your budget target</dt><dd>${a.discovery.budgetLimit} · actual cost unverified</dd></>}
      {v.latitude !== undefined && v.longitude !== undefined && <><dt>Coordinates</dt><dd>{v.latitude.toFixed(5)}, {v.longitude.toFixed(5)}</dd></>}
    </dl>
    {!!a.discovery?.constraints.length && <p>Your preferences: {a.discovery.constraints.join(' · ')}</p>}
    <a href={v.url} target="_blank" rel="noreferrer">View on Google Maps <ExternalLink size={16}/></a>
    {v.latitude !== undefined && v.longitude !== undefined && <button className="text-button" onClick={()=>{if(!navigator.geolocation){setLocationError('Location is unavailable in this browser.');return;}navigator.geolocation.getCurrentPosition(p=>{setDistance(approximateMiles(p.coords,v));setLocationError('');},()=>setLocationError('Location unavailable. You can still check the address on Maps.'),{timeout:10000,maximumAge:300000});}}>Use my location for distance</button>}
    {distance !== undefined && <p>About {distance.toFixed(1)} miles away · straight-line distance</p>}
    {locationError && <p role="status">{locationError}</p>}
    <p className="small muted">{v.provenance?.cached ? 'Previously retrieved' : 'Retrieved'} via SerpApi{v.provenance ? ` on ${new Date(v.provenance.retrievedAt).toLocaleDateString()}` : ''}. Venue details can change. {a.discovery?.interpretedBy === 'Muse Spark' ? 'Muse Spark interpreted your request; it did not verify venue availability.' : 'Activity idea based on your search.'}</p>
    <button className="primary full" disabled={busy || a.status==='interested' || a.swipe==='yes'} onClick={onSave}>{a.status==='interested'||a.swipe==='yes'?'Saved to interests':'Save to interests'}</button>
    <p className="small muted">A suggestion, not an official venue event. No attendees, booking or reservation have been created.</p>
  </section>;
}
