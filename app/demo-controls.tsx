"use client";
import Link from "next/link";
import { useState } from "react";
import type { State } from "@/lib/types";
import "./demo/demo.css";
export function DemoControls({ data, busy, onSwitch }: { data: State; busy: boolean; onSwitch: (user: string) => void }) {
  const [confirm, setConfirm] = useState(false), [resetting, setResetting] = useState(false), [error, setError] = useState("");
  async function reset() {
    setResetting(true); setError("");
    try { const r = await fetch("/api/demo/reset", { method: "POST" }); const d = await r.json(); if (!r.ok) throw Error(d.error); window.location.reload(); }
    catch (e) { setError((e as Error).message); setResetting(false); }
  }
  return <details className="demo-tools"><summary>Demo · {data.user.name}</summary><div className="demo-tools-panel">
    <h2>Your demo</h2><p>Play each sample person’s part. Your votes and approvals stay in this demo.</p>
    <label htmlFor="demo-person">Explore as</label><select id="demo-person" value={data.user.id} disabled={busy || resetting} onChange={e => onSwitch(e.target.value)}>{data.demoUsers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    {confirm ? <><p>Reset only your sample people, votes, and plans? Other visitors and your real profile won’t change.</p><button disabled={busy || resetting} onClick={reset}>{resetting ? "Resetting…" : "Yes, reset my demo"}</button><button disabled={resetting} onClick={() => setConfirm(false)}>Keep exploring</button></> : <button disabled={busy} onClick={() => setConfirm(true)}>Reset my demo</button>}
    {error && <p role="alert">{error}</p>}<Link href="/">Exit demo</Link><p className="small muted">Live AI has usage limits. Calendar export and external invitations are disabled.</p>
  </div></details>;
}
