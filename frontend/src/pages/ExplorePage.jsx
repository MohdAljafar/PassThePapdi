import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Inbox, Send, Search, LoaderCircle, Plus, Gift } from "lucide-react";
import { api, DEFAULT_IMAGE, formatDate } from "../lib/api";
import Topbar from "../components/Topbar";

export default function ExplorePage({user,onLogout}) {
  const [params,setParams]=useSearchParams();
  const navigate=useNavigate();
  const tab=params.get("tab")||"boxes";
  const [boxes,setBoxes]=useState([]);
  const [received,setReceived]=useState([]);
  const [sent,setSent]=useState([]);
  const [code,setCode]=useState("");
  const [journey,setJourney]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [imageUrl,setImageUrl]=useState(`${window.location.origin}${DEFAULT_IMAGE}`);
  const [note,setNote]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    let active=true;
    Promise.all([api("/api/boxes"),api("/api/transfers/received"),api("/api/transfers/sent")])
      .then(([b,r,s])=>{if(active){setBoxes(b.boxes||[]);setReceived(r.received||[]);setSent(s.transfers||[])}})
      .catch(e=>{if(active)setError(e.message)})
      .finally(()=>{if(active)setLoading(false)});
    return ()=>{active=false};
  },[]);

  async function track(e){
    e.preventDefault();setError("");setJourney(null);
    try{const d=await api(`/api/boxes/${encodeURIComponent(code.trim())}/journey`);setJourney(d.box)}
    catch(e){setError(e.message)}
  }

  async function addBox(e){
    e.preventDefault();setError("");setSaving(true);
    try{
      await api("/api/boxes",{method:"POST",body:JSON.stringify({imageUrl:imageUrl.trim(),...(note.trim()?{note:note.trim()}:{})})});
      navigate("/",{replace:true,state:{addedBox:true}});
    }catch(e){setError(e.message)}
    finally{setSaving(false)}
  }

  const tabs=[["boxes","My collection",Package],["received","Received gifts",Inbox],["sent","Passed on",Send],["track","Track a box",Search],["add","Add a box",Plus]];
  return <div className="min-h-screen bg-cream"><Topbar user={user} onLogout={onLogout}/><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-forest"><ArrowLeft size={16}/> Back to journey map</Link><div className="mt-5"><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">Explore</p><h1 className="mt-1 font-display text-3xl font-bold text-forest">Your gifts & stories</h1><p className="mt-2 text-sm text-muted">Everything else is here when you're curious.</p></div>
  <div className="mt-7 flex gap-2 overflow-x-auto border-b border-line pb-2">{tabs.map(([key,label,Icon])=><button key={key} onClick={()=>{setError("");setParams({tab:key})}} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab===key?"bg-forest text-white":"bg-white text-muted"}`}><Icon size={15}/>{label}</button>)}</div>
  {loading?<div className="py-16 text-center"><LoaderCircle className="mx-auto animate-spin text-forest"/></div>:<div className="mt-5 space-y-3">
    {tab==="boxes"&&<>{boxes.length?boxes.map(b=><Row key={b.id} image={b.imageUrl} title={b.boxCode} detail={`${b._count?.journeys||0} journey events · Currently with you`}/>):<Empty>No boxes are currently in your collection.</Empty>}</>}
    {tab==="received"&&<>{received.length?received.map(j=><Row key={j.id} image={j.box?.imageUrl} title={j.box?.boxCode||"Gift"} detail={`Received from ${j.fromOwner?.name||"a club member"} · ${formatDate(j.createdAt)} · ${j.currentlyOwnedByMe?"Still with you":"Passed on"}`}/>):<Empty>No received gifts yet.</Empty>}</>}
    {tab==="sent"&&<>{sent.length?sent.map(t=><Row key={t.id} image={t.box?.imageUrl} title={t.box?.boxCode||"Gift"} detail={`${t.status} · ${t.recipient?.name? "Claimed by "+t.recipient.name:"Claim link created"} · ${formatDate(t.claimedAt||t.createdAt)}`}/>):<Empty>You haven't passed on a gift yet.</Empty>}</>}
    {tab==="track"&&<><form onSubmit={track} className="flex gap-2"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Enter a box code, e.g. SP-12345" className="min-w-0 flex-1 rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"/><button className="rounded-xl bg-forest px-5 font-bold text-white">Track</button></form>{error&&<p className="text-sm text-red-700">{error}</p>}{journey&&<div className="rounded-2xl border border-line bg-white p-5"><img src={journey.imageUrl||DEFAULT_IMAGE} alt="" className="h-44 w-full rounded-xl object-cover"/><h3 className="mt-3 font-display text-xl font-bold text-forest">{journey.boxCode}</h3><p className="text-sm text-muted">Current owner: {journey.currentOwner?.name||"Unknown"}</p><div className="mt-4 space-y-3">{(journey.journeys||[]).map(j=><div className="border-l-2 border-gold py-1 pl-4" key={j.id}><p className="text-sm font-bold text-forest">{j.eventType==="CREATED"?"Box joined the club":`${j.fromOwner?.name||"Someone"} passed it to ${j.toOwner?.name||"someone"}`}</p><p className="text-xs text-muted">{formatDate(j.createdAt)} · {j.note||"A new chapter"}</p></div>)}</div></div>}</>}
    {tab==="add"&&<div className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 shadow-soft sm:p-8"><div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-cream text-forest"><Gift/></div><h2 className="font-display text-2xl font-bold text-forest">Add a Soan Papdi box</h2><p className="mt-2 text-sm leading-relaxed text-muted">Start a new journey by adding a box to your collection. You can pass it on once it's yours.</p><form onSubmit={addBox} className="mt-6 space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold text-ink">Box image URL</span><input required type="url" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-forest"/></label><label className="block"><span className="mb-2 block text-sm font-bold text-ink">A note about this box <span className="font-normal text-muted">(optional)</span></span><textarea rows="3" maxLength="300" value={note} onChange={e=>setNote(e.target.value)} placeholder="Where did this journey begin?" className="w-full resize-none rounded-xl border border-line px-4 py-3 outline-none focus:border-forest"/></label>{error&&<p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3.5 font-bold text-white disabled:opacity-60">{saving?<LoaderCircle className="animate-spin"/>:<Plus size={18}/>} Add to my collection</button></form></div>}
    {error&&tab!=="track"&&tab!=="add"&&<p className="text-sm text-red-700">{error}</p>}
  </div>}</main></div>;
}
function Row({image,title,detail}){return <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-3"><img src={image||DEFAULT_IMAGE} alt="" className="h-16 w-16 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="font-bold text-forest">{title}</p><p className="mt-1 text-xs text-muted">{detail}</p></div></div>}
function Empty({children}){return <div className="rounded-2xl border border-dashed border-line bg-white/70 p-10 text-center text-sm text-muted">{children}</div>}
