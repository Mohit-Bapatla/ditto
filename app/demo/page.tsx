"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Home from "../page";
import { BrandLogo } from "../brand-logo";
import "./demo.css";
export default function Demo() {
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(true), [error, setError] = useState("");
  useEffect(() => { let active = true; fetch("/api/demo/state").then(r => { if (active) setReady(r.ok); }).catch(() => {}).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, []);
  async function start() {
    setBusy(true); setError("");
    try { const r = await fetch("/api/demo/start", { method: "POST" }); const d = await r.json(); if (!r.ok) throw Error(d.error); setReady(true); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  if (ready) return <Home />;
  return <main className="demo-entry">
    <div className="demo-entry-copy">
      <BrandLogo />
      <h1>Try Ditto.<br />Make the next plan.</h1>
      <p>Swipe, find common ground, and turn a group chat into an outing.</p>
      <p>Meet sample friends Mohit, Edwin, and Paxton in your own private demo. Switch between them to vote and approve a plan. Reset whenever you like.</p>
      <button className="primary" disabled={busy} onClick={start}>{busy ? "Getting ready…" : "Start my demo"}</button>
      {error && <p role="alert">{error}</p>}
      <Link href="/">Use Ditto with your own profile</Link>
      <details><summary>What’s included?</summary><p>Four Circles, 36 sample activities, and upcoming plans. Sample people and decisions are isolated from real accounts. Live Muse Spark and venue searches have usage limits; sample planning is clearly labeled. No invitations, bookings, or calendar changes leave this demo. Your space expires after 24 hours.</p></details>
    </div>
    <figure><img src="/activities/pickleball.webp" alt="A representative pickleball court for the sample activity" /><figcaption>Find your next yes. Then decide together.</figcaption></figure>
  </main>;
}
