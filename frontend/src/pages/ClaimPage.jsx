import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Gift, Heart, LoaderCircle, MapPin, MapPinned, ShieldCheck, SkipForward } from "lucide-react";
import GoogleSignIn from "../components/GoogleSignIn";
import GiftMap from "../components/GiftMap";
import { api, DEFAULT_IMAGE, getApproximatePosition } from "../lib/api";

export default function ClaimPage({ user, onLogin, onClaimed }) {
  const { token } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLocationChoice, setShowLocationChoice] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [mapLocations, setMapLocations] = useState([]);
  const [mapLoading, setMapLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setUnavailable(false);
    api(`/api/transfers/claim/${encodeURIComponent(token)}`)
      .then((data) => { if (active) setClaim(data.claim); })
      .catch((err) => { if (active) { setUnavailable(true); setError(err.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
  let active = true;

  setMapLoading(true);

  api("/api/map/public-locations")
    .then((data) => {
      if (active) {
        setMapLocations(data.locations || []);
      }
    })
    .catch((error) => {
      console.error("Could not load public map:", error);
      if (active) {
        setMapLocations([]);
      }
    })
    .finally(() => {
      if (active) {
        setMapLoading(false);
      }
    });

  return () => {
    active = false;
  };
}, []);

  const credential = useCallback(async (value) => {
    try { setLoginError(""); await onLogin(value); }
    catch (err) { setLoginError(err.message); }
  }, [onLogin]);
  const googleError = useCallback((message) => setLoginError(message), []);

  async function finishClaim(location) {
    setBusy(true); setError("");
    try {
      await api("/api/transfers/claim", {
        method: "POST",
        body: JSON.stringify({ token, ...(location ? { location } : {}) }),
      });
      await onClaimed();
      navigate("/", { replace: true, state: { justClaimed: true } });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function shareAndClaim() {
    setBusy(true); setError("");
    const location = await getApproximatePosition();
    await finishClaim(location);
  }

  if (loading) return <ClaimFrame><div className="py-20 text-center"><LoaderCircle className="mx-auto animate-spin text-forest"/><p className="mt-3 text-sm text-muted">Opening your little surprise…</p></div></ClaimFrame>;
  if (unavailable) return <ClaimFrame><div className="py-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-softgold text-gold"><Gift size={30}/></div><h1 className="mt-5 font-display text-3xl text-forest">This gift link is unavailable</h1><p className="mt-2 text-muted">{error}</p><button onClick={()=>navigate("/")} className="mt-6 rounded-xl bg-forest px-6 py-3 font-bold text-white">Go to Pass The Papdi</button></div></ClaimFrame>;

  return (
    <ClaimFrame>
      <div className="overflow-hidden rounded-[2rem] border border-line bg-paper shadow-soft">
        <div className="relative bg-[#173f30] px-6 pb-7 pt-8 text-center text-white sm:px-10">
          <span className="absolute right-5 top-5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.18em]">A surprise for you</span>
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-2xl">🪔</div>
          <p className="text-xs font-bold uppercase tracking-[.22em] text-[#e7c98d]">Pass The Papdi</p>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Diwali Without Soan Papdi? Haha...Impossible!</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/75">{claim?.senderName || "Someone"} sent you a gift. Accept it and follow the tradition.</p>
        </div>
        <div className="grid gap-6 p-5 sm:grid-cols-[.9fr_1.1fr] sm:p-8">
          <div className="overflow-hidden rounded-2xl bg-cream">
            <img src={claim?.imageUrl || DEFAULT_IMAGE} onError={(e)=>{e.currentTarget.src=DEFAULT_IMAGE}} alt="Soan Papdi gift" className="h-64 w-full object-cover sm:h-full"/>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-bold uppercase tracking-[.18em] text-gold">Your gift</span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest">{claim?.boxCode}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">Sent with love by <strong className="text-ink">{claim?.senderName}</strong>.</p>
            {claim?.message && <blockquote className="mt-4 rounded-xl border-l-4 border-gold bg-cream p-4 text-sm italic text-ink">“{claim.message}”</blockquote>}
            <div className="mt-6 space-y-3">
              {!user ? <>
                <p className="text-sm text-ink">Sign in with Google to claim this gift. Opening this link has not transferred ownership.</p>
                <GoogleSignIn onCredential={credential} onError={googleError}/>
                {loginError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{loginError}</p>}
              </> : !showLocationChoice ? <>
                <button onClick={()=>setShowLocationChoice(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-4 font-bold text-white shadow-lg shadow-forest/15 transition hover:bg-forest-dark">Accept my gift <ArrowRight size={18}/></button>
                <p className="text-center text-xs text-muted">You choose whether to share your location in the next step.</p>
              </> : <>
                <div className="rounded-2xl border border-line bg-cream p-4">
                  <div className="flex items-start gap-3"><span className="rounded-xl bg-white p-2 text-forest"><MapPin size={20}/></span><div><p className="font-bold text-forest">Let's light up the whole India</p><p className="mt-1 text-xs leading-relaxed text-muted">Share an approximate location to add a 1 km circle to the map. Your precise coordinates are not shown publicly. If you don't want to light up the map, you can skip location & claim your gift.</p></div></div>
                </div>
                <button disabled={busy} onClick={shareAndClaim} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3.5 font-bold text-white disabled:opacity-60">{busy ? <LoaderCircle className="animate-spin"/> : <MapPin size={18}/>} Share location & claim</button>
                <button disabled={busy} onClick={()=>finishClaim(null)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-3.5 font-bold text-forest hover:bg-cream disabled:opacity-60"><SkipForward size={17}/> Skip location & claim</button>
                <button disabled={busy} onClick={()=>setShowLocationChoice(false)} className="w-full py-1 text-xs font-semibold text-muted">Go back</button>
              </>}
              {busy && <p className="text-center text-xs text-muted">Completing your claim…</p>}
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </div>
          </div>
        </div>

        <section className="border-t border-line px-5 py-6 sm:px-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-gold">The bigger picture</p><h2 className="mt-1 font-display text-2xl font-bold text-forest">Soan Papdi Is Lighting Up India🪔✨</h2></div>
            <span className="text-xs font-semibold text-muted">Share Soan Papdi with others and help light up the nation this Diwali</span>
          </div>
          {mapLoading ? (
            <div className="grid h-56 place-items-center rounded-2xl bg-cream text-muted">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : (
            <GiftMap
              locations={mapLocations}
              className="aspect-square w-full max-w-[560px] mx-auto"
            />
          )}
          <p className="mt-3 text-xs leading-relaxed text-muted">Claim your Soan Papdi box and light up the map with your own circle! Your location is approximate (within ~1 km), never your exact coordinates.</p>
        </section>

        <section className="border-t border-line bg-cream/60 px-5 py-6 sm:px-8">
          <h2 className="text-center font-display text-xl font-bold text-forest">Here's what happens next</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Step icon={<CheckCircle2 size={19}/>} number="01" title="Claim your gift" detail="Accept it and it becomes yours. And your circle lights up the map."/>
            <Step icon={<MapPin size={19}/>} number="02" title="See the map" detail="Your dashboard opens to the growing journey map."/>
            <Step icon={<Gift size={19}/>} number="03" title="Pass it forward" detail="Choose someone and send them the next claim link."/>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-line bg-cream px-5 py-4 text-xs text-muted"><span className="flex items-center gap-1.5"><Heart size={14} className="text-gold"/> "Pass it on" is the spirit of Diwali</span></div>
      </div>
    </ClaimFrame>
  );
}

function Step({icon,number,title,detail}) {
  return <div className="flex gap-3 sm:flex-col sm:items-center sm:text-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-forest shadow-sm">{icon}</span><div><p className="text-[10px] font-extrabold tracking-[.16em] text-gold">{number}</p><p className="mt-0.5 text-sm font-bold text-forest">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p></div></div>;
}
function ClaimFrame({children}) {
  return <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f3e7d2,transparent_45%),#fff9f0] px-4 py-8 sm:py-14"><div className="mx-auto max-w-4xl">{children}<p className="mt-6 text-center text-xs text-muted">A small gift can travel a long way. 🪔</p></div></main>;
}