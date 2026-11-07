import { Coins, Pause, RotateCw, Volume2, VolumeX, ArrowDown, ArrowUp, Zap, Shield, Magnet, Timer, Flame, Ghost } from 'lucide-react'
import { LEVELS } from '../game/constants.js'

function IconBtn({ onClick, label, tone, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-xl border bg-panel/80 backdrop-blur transition hover:scale-105 active:scale-95 sm:h-12 sm:w-12 ${tone}`}
    >
      {children}
    </button>
  )
}

function Key({ children }) {
  return <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold">{children}</kbd>
}

function Chip({ icon: Icon, color, label, pct }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-panel/80 px-3 py-1.5 backdrop-blur" style={{ borderColor: `${color}66`, color }}>
      <Icon size={15} />
      <div className="leading-tight">
        <div className="text-[11px] font-bold tracking-widest">{label}</div>
        {pct != null && (
          <div className="mt-0.5 h-1 w-14 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, background: color }} />
          </div>
        )}
      </div>
    </div>
  )
}

function TouchBtn({ label, icon: Icon, tone, onDown, onUp, className }) {
  const stop = (e) => { e.preventDefault(); onUp && onUp() }
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); onDown() }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      className={`pointer-events-auto absolute grid h-20 w-20 touch-none select-none place-items-center rounded-2xl border bg-panel/70 backdrop-blur transition active:scale-95 sm:h-24 sm:w-24 ${tone} ${className}`}
    >
      <span className="flex flex-col items-center gap-1">
        <Icon size={28} />
        <span className="font-display text-[11px] font-bold tracking-widest">{label}</span>
      </span>
    </button>
  )
}

export default function Hud({ hud, banner, soundOn, onPause, onRestart, onSound, onJump, onSlide }) {
  const lvl = LEVELS[hud.level]
  const ghostLabel = hud.ghost == null ? null : hud.ghost > 0 ? `GHOST +${hud.ghost}m` : `AHEAD ${-hud.ghost}m`
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-panel/80 px-4 py-2 backdrop-blur">
              <div>
                <div className="text-[10px] font-bold tracking-widest text-white/60">DIST</div>
                <div className="font-display text-2xl font-black">{hud.dist}<span className="ml-0.5 text-xs text-neon">m</span></div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-[10px] font-bold tracking-widest text-white/60">SCORE</div>
                <div className="font-display text-2xl font-black text-neon">{hud.score}</div>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-panel/80 px-3 py-2 backdrop-blur sm:flex">
              <span className="h-3 w-3 rounded-full" style={{ background: lvl.accent, boxShadow: `0 0 10px ${lvl.accent}` }} />
              <div className="leading-tight">
                <div className="text-[10px] font-bold tracking-widest text-ice">LV.{hud.level + 1}</div>
                <div className="text-xs font-bold">{lvl.name}</div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {hud.mult > 1 && <Chip icon={Flame} color="#fb923c" label={`x${hud.mult} COMBO`} pct={hud.comboPct} />}
            {hud.shield && <Chip icon={Shield} color="#22d3ee" label="SHIELD" />}
            {hud.magnet > 0 && <Chip icon={Magnet} color="#f87171" label="MAGNET" pct={hud.magnet / 8} />}
            {hud.slow > 0 && <Chip icon={Timer} color="#a78bfa" label="SLOW-TIME" pct={hud.slow / 5} />}
            {ghostLabel && <Chip icon={Ghost} color={hud.ghost > 0 ? '#cbd5e1' : '#4ade80'} label={ghostLabel} />}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-orb/40 bg-panel/80 px-3 backdrop-blur sm:h-12">
            <Coins size={18} className="text-orb" />
            <span className="font-display text-lg font-bold text-orb">{hud.orbs}</span>
          </div>
          <IconBtn onClick={onRestart} label="Restart" tone="border-ice/40 text-ice"><RotateCw size={20} /></IconBtn>
          <IconBtn onClick={onSound} label={soundOn ? 'Mute' : 'Unmute'} tone="border-ice/40 text-ice">
            {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </IconBtn>
          <IconBtn onClick={onPause} label="Pause" tone="border-neon/50 text-neon"><Pause size={20} /></IconBtn>
        </div>
      </div>

      {banner && (
        <div className="absolute left-1/2 top-24 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-ice/50 bg-panel/90 px-6 py-3 backdrop-blur">
          <Zap size={22} className="text-ice" />
          <div className="leading-tight">
            <div className="text-[10px] font-bold tracking-widest text-ice">{banner.label}</div>
            <div className="font-display text-lg font-bold">{banner.text}</div>
          </div>
        </div>
      )}

      <TouchBtn label="SLIDE" icon={ArrowDown} tone="border-ice/40 text-ice" onDown={() => onSlide(true)} onUp={() => onSlide(false)} className="bottom-4 left-4" />
      <TouchBtn label="JUMP" icon={ArrowUp} tone="border-neon/50 text-neon" onDown={onJump} className="bottom-4 right-4" />

      <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-4 rounded-2xl border border-white/10 bg-panel/70 px-4 py-2 text-xs text-white/70 backdrop-blur md:flex">
        <span className="flex items-center gap-1.5"><Key>1x TAP</Key> Jump</span>
        <span className="flex items-center gap-1.5"><Key>2x TAP</Key> 360° Somersault</span>
        <span className="flex items-center gap-1.5"><Key>↓ / S</Key> Slide</span>
        <span className="flex items-center gap-1.5"><Key>P</Key> Pause</span>
      </div>
    </div>
  )
}
