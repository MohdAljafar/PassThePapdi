import { Link } from "react-router-dom";
import { CircleUserRound, LogOut, Menu, Sparkles } from "lucide-react";

export default function Topbar({ user, onLogout, onMenu }) {
  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest text-xl text-white">🪔</span>
          <span>
            <span className="block font-display text-lg font-bold leading-tight text-forest">Soan Papdi Club</span>
            <span className="block text-[10px] font-bold uppercase tracking-[.2em] text-muted">Every box has a story</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={onMenu} className="rounded-full p-2 text-forest hover:bg-white md:hidden" aria-label="Open menu"><Menu size={20}/></button>
          <span className="hidden items-center gap-2 rounded-full border border-line bg-white/70 px-3 py-1.5 text-sm text-forest sm:flex">
            <Sparkles size={15} className="text-gold"/> {user?.name?.split(" ")[0] || "Club member"}
          </span>
          {user?.pictureUrl ? <img src={user.pictureUrl} alt="" className="h-9 w-9 rounded-full border border-line object-cover"/> : <CircleUserRound className="text-forest"/>}
          <button onClick={onLogout} className="rounded-full p-2 text-muted transition hover:bg-white hover:text-forest" title="Sign out" aria-label="Sign out"><LogOut size={18}/></button>
        </div>
      </div>
    </header>
  );
}