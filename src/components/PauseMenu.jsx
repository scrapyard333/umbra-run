import { Play, RotateCw, Home } from 'lucide-react'

export default function PauseMenu({ onResume, onRestart, onMenu }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl border border-neon/40 bg-panel p-6 text-center shadow-[0_0_60px_rgba(168,85,247,0.2)]">
        <div className="text-[10px] font-bold tracking-[0.3em] text-neon">TAKE A BREATH</div>
        <h2 className="mt-1 font-display text-3xl font-black glow-neon">PAUSED</h2>
        <button onClick={onResume} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-neon to-ice py-3 font-display font-bold tracking-widest">
          <Play size={18} fill="currentColor" /> RESUME
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button onClick={onRestart} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm font-bold tracking-widest"><RotateCw size={16} /> RESTART</button>
          <button onClick={onMenu} className="flex items-center justify-center gap-2 rounded-xl border border-white/15 py-2.5 text-sm font-bold tracking-widest"><Home size={16} /> MENU</button>
        </div>
        <p className="mt-4 text-xs text-white/50">Press <kbd className="rounded bg-white/10 px-1.5">P</kbd> or <kbd className="rounded bg-white/10 px-1.5">ESC</kbd> to resume</p>
      </div>
    </div>
  )
}
