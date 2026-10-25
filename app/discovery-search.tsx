"use client";
import { Search, Sparkles } from 'lucide-react';
export function DiscoverySearch({query,onQuery,busy,loading=false,onSearch,city,onCity,expanded=false}:{query:string;onQuery:(s:string)=>void;busy:boolean;loading?:boolean;onSearch:(natural:boolean)=>void;city:string;onCity:(s:string)=>void;expanded?:boolean}) {
  const natural=/under|budget|tonight|tomorrow|friends|where we|date.night|saturday|sunday|monday/i.test(query);
  return <form className="discovery-search" onSubmit={e=>{e.preventDefault();onSearch(natural);}}>
    <label htmlFor={expanded?'modal-discover-query':'discover-query'}>Find your next place</label>
    <div className="search-field"><Search size={18}/><input id={expanded?'modal-discover-query':'discover-query'} value={query} onChange={e=>onQuery(e.target.value)} placeholder="Bouldering near UT Austin" maxLength={300}/><button className="primary" disabled={busy || query.trim().length<2} type="submit">{loading?'Finding…':'Find'}</button></div>
    {expanded && <div className="field"><label htmlFor="discovery-city">Search city</label><input id="discovery-city" value={city} onChange={e=>onCity(e.target.value)} /></div>}
    <div className="search-context"><span>{city} · {natural?'Muse Spark + SerpApi':'SerpApi places'}</span><button type="button" className="text-button" disabled={busy||query.trim().length<2} onClick={()=>onSearch(true)}><Sparkles size={14}/> Ask Muse Spark</button></div>
  </form>;
}
