import { useCallback, useState } from "react";
import { Gift, Heart, MapPin, ArrowRight } from "lucide-react";
import GoogleSignIn from "../components/GoogleSignIn";

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState("");
  const handleCredential = useCallback(async (credential) => {
    try { setError(""); await onLogin(credential); }
    catch (err) { setError(err.message); }
  }, [onLogin]);
  const handleError = useCallback((message) => setError(message), []);
  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <section className="animate-rise">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.18em] text-forest"><span>🪔</span> Pass The Papdi</div>
          <p className="mb-3 text-sm font-bold uppercase tracking-[.22em] text-gold">A little sweetness goes a long way</p>
          <h1 className="max-w-xl font-display text-5xl font-bold leading-[1.08] text-forest sm:text-6xl">One gift.<br/>Many stories.<br/><span className="text-gold">Endless smiles.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">Pass a box of Soan Papdi from one person to another. Watch its journey grow, one kind gesture at a time.</p>
          <div className="mt-9 flex flex-wrap gap-5 text-sm font-semibold text-forest"><span className="flex items-center gap-2"><Gift size={17} className="text-gold"/> Pass a real gift</span><span className="flex items-center gap-2"><MapPin size={17} className="text-gold"/> See the journey</span><span className="flex items-center gap-2"><Heart size={17} className="text-gold"/> Share happiness</span></div>
        </section>
        <section className="animate-rise mx-auto w-full max-w-md rounded-[2rem] border border-line bg-paper p-7 shadow-soft sm:p-9">
          <div className="mb-7 grid h-14 w-14 place-items-center rounded-2xl bg-softgreen text-forest"><Gift size={26}/></div>
          <h2 className="font-display text-3xl font-bold text-forest">Welcome to the club</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">Sign in to see your gift journey, receive a box or pass one along.</p>
          <div className="mt-8"><GoogleSignIn onCredential={handleCredential} onError={handleError}/></div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <p className="mt-7 text-center text-xs leading-relaxed text-muted">By continuing, you agree to use the club to share gifts kindly and responsibly.</p>
          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-muted"><Heart size={13} className="text-gold"/> Made to be passed on <ArrowRight size={13}/></div>
        </section>
      </div>
    </main>
  );
}