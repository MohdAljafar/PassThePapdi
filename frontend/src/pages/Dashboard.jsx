import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Gift, MapPin, RefreshCw, Sparkles, Users, Route, ChevronRight, LoaderCircle } from "lucide-react";
import { api } from "../lib/api";
import GiftMap from "../components/GiftMap";
import PassModal from "../components/PassModal";
import Topbar from "../components/Topbar";

export default function Dashboard({ user, onLogout }) {
  const [dashboard, setDashboard] = useState(null);
  const [boxes, setBoxes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [passOpen, setPassOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true); setMapError("");
    try {
      const [stats, owned, map] = await Promise.all([
        api("/api/dashboard"), api("/api/boxes"), api("/api/map/locations"),
      ]);
      setDashboard(stats);
      setBoxes(owned.boxes || []);
      setLocations(map.locations || []);
    } catch (err) {
      if (err.status === 401) onLogout();
      else setMapError(err.message);
      try {
        const [stats, owned] = await Promise.all([api("/api/dashboard"), api("/api/boxes")]);
        setDashboard(stats); setBoxes(owned.boxes || []);
      } catch {}
    } finally { setLoading(false); }
  }, [onLogout]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (location.state?.justClaimed) {
      setToast("Your gift is now yours. Welcome to the journey! 🎉");
      navigate("/", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  const stats = dashboard?.stats || {};
  const ownedCount = stats.ownedBoxes ?? boxes.length;
  const receivedCount = stats.receivedCount ?? 0;
  const passedCount = stats.sentCount ?? 0;

  return (
    <div className="min-h-screen bg-cream">
      <Topbar user={user} onLogout={onLogout} onMenu={()=>setMenuOpen(true)}/>
      <main className="mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 sm:pt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-gold"><Sparkles size={14}/> Your gift journey</p><h1 className="mt-2 font-display text-3xl font-bold text-forest sm:text-4xl">Look how far we've travelled.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Every circle is someone who shared a little happiness. The journey grows when you pass your gift on.</p></div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-bold text-forest hover:border-gold/50 disabled:opacity-60"><RefreshCw size={15} className={loading?"animate-spin":""}/> Refresh</button>
        </div>

        {toast && <div className="mb-5 flex items-center justify-between rounded-2xl border border-forest/15 bg-softgreen px-4 py-3 text-sm font-semibold text-forest"><span>{toast}</span><button onClick={()=>setToast("")}>×</button></div>}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-3 pt-5 sm:px-6">
              <div><h2 className="font-display text-xl font-bold text-forest">Happiness, on the map</h2><p className="mt-1 text-xs text-muted">Approximate 5 km circles from people who opted to share.</p></div>
              <span className="rounded-full bg-softgreen px-3 py-1 text-xs font-bold text-forest">{locations.length} shared spots</span>
            </div>
            {loading && !dashboard ? <div className="grid h-[430px] place-items-center text-muted"><LoaderCircle className="animate-spin"/></div> : <GiftMap locations={locations} className="mx-3 mb-3 h-[390px] sm:mx-4 sm:h-[470px]"/>}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-cream/60 px-5 py-3 text-xs text-muted"><span className="flex items-center gap-1.5"><MapPin size={13} className="text-gold"/> Each ring represents an approximate 5 km area.</span><span>Exact coordinates stay private.</span></div>
            {mapError && <p className="px-5 py-3 text-xs text-red-700">{mapError} — the rest of your dashboard may still be available.</p>}
            {!loading && locations.length === 0 && <p className="px-5 pb-4 text-center text-xs text-muted">No locations shared yet. Your journey can add the first circle.</p>}
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-[1.75rem] bg-forest p-6 text-white shadow-soft sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#eed39c]"><Gift size={13}/> Your next move</span>
              <h2 className="mt-5 font-display text-3xl font-bold leading-tight">Make someone<br/>else smile today.</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">Choose a box you own, add a note, and send a claim link. The gift stays yours until someone claims it.</p>
              <button onClick={()=>setPassOpen(true)} disabled={!boxes.length} className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#e8c98c] px-4 py-4 font-extrabold text-forest transition hover:bg-[#f1d9a8] disabled:cursor-not-allowed disabled:opacity-50"><Gift size={19}/> Pass the gift on <ArrowRight size={18}/></button>
              {!boxes.length && <p className="mt-3 text-center text-xs text-white/65">You don't have a box to pass on yet.</p>}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Stat icon={Gift} label="With you" value={ownedCount}/>
              <Stat icon={Users} label="Received" value={receivedCount}/>
              <Stat icon={Route} label="Passed on" value={passedCount}/>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <h3 className="font-bold text-forest">Your journey, at a glance</h3>
              <p className="mt-1 text-xs text-muted">A few numbers from your club activity.</p>
              <div className="mt-4 space-y-3 text-sm">
                <Metric label="Boxes currently with you" value={ownedCount}/>
                <Metric label="Gifts you've received" value={receivedCount}/>
                <Metric label="Gifts successfully passed on" value={passedCount}/>
              </div>
              <Link to="/explore" className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm font-bold text-forest hover:text-gold">Explore your history <ChevronRight size={17}/></Link>
            </div>
          </div>
        </section>

        <section className="mt-7 rounded-3xl border border-line bg-paper p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-gold">Keep the chain going</p><h2 className="mt-1 font-display text-2xl font-bold text-forest">The next chapter starts with you.</h2></div><button onClick={()=>setPassOpen(true)} disabled={!boxes.length} className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white hover:bg-forest-dark disabled:opacity-50">Pass a gift <ArrowRight size={16}/></button></div>
        </section>
      </main>
      {passOpen && <PassModal boxes={boxes} onClose={()=>setPassOpen(false)} onCreated={()=>{}}/>}
      {menuOpen && <ExploreQuickMenu onClose={()=>setMenuOpen(false)}/>}
    </div>
  );
}
function Stat({icon:Icon,label,value}){return <div className="rounded-2xl border border-line bg-white p-3 text-center"><Icon size={17} className="mx-auto text-gold"/><p className="mt-1 font-display text-2xl font-bold text-forest">{value}</p><p className="text-[10px] font-semibold text-muted">{label}</p></div>}
function Metric({label,value}){return <div className="flex items-center justify-between"><span className="text-muted">{label}</span><strong className="text-forest">{value}</strong></div>}
function ExploreQuickMenu({onClose}){return <div className="fixed inset-0 z-40 bg-ink/35 p-4" onMouseDown={onClose}><div className="ml-auto mt-16 max-w-xs rounded-2xl bg-paper p-5 shadow-2xl" onMouseDown={e=>e.stopPropagation()}><div className="flex justify-between"><h3 className="font-display text-xl text-forest">Explore</h3><button onClick={onClose}>×</button></div><Link onClick={onClose} to="/explore" className="mt-4 block rounded-xl bg-cream p-3 text-sm font-bold text-forest">My gifts and journey history →</Link></div></div>}
