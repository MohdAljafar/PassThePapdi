import { Link } from "react-router-dom";
import { X, Package, Inbox, Send, Route, Settings2 } from "lucide-react";

const items = [
  { to: "/explore?tab=boxes", label: "My collection", detail: "Boxes currently with you", icon: Package },
  { to: "/explore?tab=received", label: "Received gifts", detail: "Your gift history", icon: Inbox },
  { to: "/explore?tab=sent", label: "Gifts I've passed on", detail: "Invitations and status", icon: Send },
  { to: "/explore?tab=track", label: "Track a box", detail: "Follow a box's full story", icon: Route },
];
export default function ExploreDrawer({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm" onMouseDown={onClose}>
      <aside className="ml-auto flex h-full w-full max-w-sm flex-col bg-paper p-6 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="mb-7 flex items-center justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">More to explore</p><h2 className="mt-1 font-display text-2xl text-forest">Your club</h2></div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-cream" aria-label="Close menu"><X/></button>
        </div>
        <nav className="space-y-2">
          {items.map(({to,label,detail,icon:Icon}) => <Link key={to} to={to} onClick={onClose} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-gold/50 hover:shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-cream text-forest"><Icon size={20}/></span>
            <span className="min-w-0 flex-1"><span className="block font-bold text-ink">{label}</span><span className="block text-xs text-muted">{detail}</span></span>
          </Link>)}
        </nav>
        <div className="mt-auto rounded-2xl bg-forest p-4 text-white"><Settings2 size={18} className="mb-2 text-gold"/><p className="font-semibold">Keep it simple.</p><p className="mt-1 text-sm text-white/70">The best part is passing the happiness forward.</p></div>
      </aside>
    </div>
  );
}