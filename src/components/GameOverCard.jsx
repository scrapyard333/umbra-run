import { Coins, Flame, Trophy, RotateCw, Shirt, Home, Zap, Star, Award } from 'lucide-react'
import Confetti from './Confetti.jsx'

function Tile({ label, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-void/60 px-3 py-3 text-center">
      <div className="text-[10px] font-bold tracking-widest text-white/60">{label}</div>
      <div className="mt-1 flex items-center justify-center gap-1.5">{children}</div>
    </div>
  )
}

export default function GameOverCard({ data, onRestart, onMenu, onSkins }) {
  const celebrate = data.level >= 2 || data.newBest || data.unlocked?.length > 0
  return (
    <div className="absolute inset-0 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      {celebrate && <Confetti />}
      <div className="relative my-auto w-full max-w-md rounded-3xl border border-ice/30 bg-panel p-6 shadow-[0_0_70px_rgba(34,211,238,0.18)]">
        {data.level >= 2 && (
          <div className="absolute -top-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl border border-ice/50 bg-panel px-4 py-2">
            <Zap size={18} className="text-ice" />
            <div className="text-left leading-tight">
              <div className="text-[10px] font-bold tracking-widest text-ice">LEVEL {data.level} REACHED!</div>
              <div className="text-sm font-bold">{data.levelName}</div>
            </div>
          </div>
        )}
        <div className={`text-center ${data.level >= 2 ? 'pt-3' : ''}`}>
          <div className="text-xs font-bold tracking-[0.3em] text-blood">RUN TERMINATED</div>
          <h2 className="mt-1 font-display text-4xl font-black tracking-wider text-white glow-neon">GAME OVER</h2>
          {data.newBest && (
            <div className="mx-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-orb/50 bg-orb/10 px-3 py-1 text-[11px] font-bold tracking-widest text-orb">
              <Star size={12} fill="currentColor" /> NEW BEST
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Tile label="DISTANCE"><span className="font-display text-3xl font-black text-neon">{data.dist}<span className="text-sm">m</span></span></Tile>
          <Tile label="ORBS GATHERED"><Coins size={20} className="text-orb" /><span className="font-display text-3xl font-black text-orb">{data.orbs}</span></Tile>
          <Tile label="TOTAL SCORE"><span className="font-display text-3xl font-black text-ice">{data.score}</span></Tile>
          <Tile label="LEVEL REACHED"><Flame size={20} className="text-orange-400" /><span className="font-display text-2xl font-black">Lv.{data.level}</span></Tile>
        </div>

        {data.unlocked?.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.unlocked.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-2xl border border-orb/40 bg-orb/10 px-4 py-2">
                <span className="flex items-center gap-2 text-sm font-bold"><Award size={16} className="text-orb" /> {a.title}</span>
                <span className="font-display text-sm font-black text-orb">+{a.reward}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-void/60 px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-white/80"><Trophy size={16} className="text-orb" /> All-Time Best</span>
          <span className="font-display text-xl font-black text-orb">{data.best}</span>
        </div>

        <button onClick={onRestart} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon to-ice py-4 font-display text-lg font-bold tracking-widest transition hover:brightness-110 active:scale-[0.98]">
          <RotateCw size={20} /> PLAY AGAIN
        </button>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={onSkins} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-void/60 py-3 text-sm font-bold tracking-widest text-ice transition hover:bg-white/5"><Shirt size={16} /> SKINS</button>
          <button onClick={onMenu} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-void/60 py-3 text-sm font-bold tracking-widest transition hover:bg-white/5"><Home size={16} /> MENU</button>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Press <kbd className="rounded bg-white/10 px-1.5 py-0.5">SPACE</kbd> to quickly restart</p>
      </div>
    </div>
  )
}
