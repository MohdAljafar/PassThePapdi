import { useEffect, useState } from "react";
import { Copy, MessageCircle, X, Gift, Check, LoaderCircle } from "lucide-react";
import { api } from "../lib/api";

export default function PassModal({ boxes, initialBox, onClose, onCreated }) {
  const [boxCode, setBoxCode] = useState(initialBox || boxes[0]?.boxCode || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function createLink(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await api("/api/transfers", {
        method: "POST",
        body: JSON.stringify({ boxCode, ...(message.trim() ? { message: message.trim() } : {}) }),
      });
      setResult(data);
      onCreated?.(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(result.claimUrl); setError("Link copied! Share it with your friend."); }
    catch { setError(result.claimUrl); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section className="w-full max-w-lg rounded-3xl bg-paper p-6 shadow-2xl sm:p-8" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div><span className="mb-2 inline-flex rounded-full bg-softgold px-3 py-1 text-xs font-bold uppercase tracking-wider text-forest">Pass the happiness</span><h2 className="font-display text-2xl text-forest">{result ? "Your link is ready!" : "Who deserves a little joy?"}</h2></div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-cream" aria-label="Close"><X/></button>
        </div>
        {!result ? <form onSubmit={createLink} className="space-y-4">
          <label className="block"><span className="mb-2 block text-sm font-bold text-ink">Choose the gift</span><select value={boxCode} onChange={(e)=>setBoxCode(e.target.value)} required className="w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-forest">{boxes.map((box)=><option key={box.id} value={box.boxCode}>{box.boxCode}</option>)}</select></label>
          <label className="block"><span className="mb-2 block text-sm font-bold text-ink">Add a little note <span className="font-normal text-muted">(optional)</span></span><textarea rows="3" maxLength="300" value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="A little something to make your day sweeter..." className="w-full resize-none rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-forest"/></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading || !boxCode} className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3.5 font-bold text-white shadow-lg shadow-forest/15 transition hover:bg-forest-dark disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin"/> : <Gift size={19}/>} Create claim link</button>
          <p className="text-center text-xs leading-relaxed text-muted">The box stays with you until someone eligible claims it.</p>
        </form> : <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-white p-4"><div className="mb-2 flex items-center gap-2 text-sm font-bold text-forest"><Check size={17}/> {result.transfer?.box?.boxCode || boxCode}</div><p className="break-all text-sm text-muted">{result.claimUrl}</p></div>
          <button onClick={copyLink} className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 py-3 font-bold text-forest hover:bg-cream"><Copy size={18}/> Copy claim link</button>
          <a href={result.whatsappUrl} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1fa855] px-5 py-3.5 font-bold text-white hover:bg-[#188c46]"><MessageCircle size={18}/> Share on WhatsApp</a>
          {error && <p className="text-center text-sm text-forest">{error}</p>}
          <button onClick={onClose} className="w-full py-2 text-sm font-semibold text-muted hover:text-forest">Done</button>
        </div>}
      </section>
    </div>
  );
}