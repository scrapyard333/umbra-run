import { useEffect } from 'react'
import { Play, Maximize, Trophy, Coins, Shirt, Calendar, Medal, Settings, Sparkles } from 'lucide-react'
import { useGame } from '../store'

function Chip({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-2 backdrop-blur">
      <Icon size={18} className={color} />
      <div className="leading-tight">
        <div className="text-[10px] font-bold tracking-widest text-white/60">{label}</div>
        <div className={`font-display text-lg font-bold ${color}`}>{value}</div>
      </div>
    </div>
  )
}

const DOCK = [
  { id: 'skins', label: 'SKINS', icon: Shirt, color: 'text-ice' },
  { id: 'daily', label: 'DAILY', icon: Calendar, color: 'text-neon' },
  { id: 'trophies', label: 'TROPHIES', icon: Trophy, color: 'text-ice' },
  { id: 'ranks', label: 'RANKS', icon: Medal, color: 'text-orb' },
  { id: 'settings', label: 'SETTINGS', icon: Settings, color: 'text-white/60' },
]

export default function HomeScreen() {
  const best = useGame((s) => s.best)
  const orbs = useGame((s) => s.orbs)
  const modal = useGame((s) => s.modal)
  const setScreen = useGame((s) => s.setScreen)
  const openModal = useGame((s) => s.openModal)

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && !modal) {
        e.preventDefault()
        setScreen('playing')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, setScreen])

  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-between p-4 sm:p-6">
      <div className="flex w-full items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl border border-neon/60 bg-panel/80">
            <Sparkles size={22} className="text-ice" />
          </div>
          <div className="leading-tight">
            <div className="text-[11px] font-bold tracking-widest text-neon">VERSION 1.0</div>
            <div className="text-sm font-semibold">Umbra Protocol</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={toggleFullscreen} className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-panel/80 px-4 py-2 text-xs font-bold tracking-widest text-ice sm:flex">
            <Maximize size={16} /> FULLSCREEN
          </button>
          <Chip icon={Trophy} label="BEST" value={best} color="text-neon" />
          <Chip icon={Coins} label="ORBS" value={orbs} color="text-orb" />
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="rounded-full border border-neon/40 bg-neon/10 px-4 py-1 font-display text-[10px] font-bold tracking-[0.25em] text-white/70 sm:text-xs">
          NEON NIGHT ENDLESS RUNNER
        </div>
        <h1 className="mt-4 font-display text-5xl font-black tracking-wider sm:text-7xl md:text-8xl">
          <span className="glow-neon text-white">UMBRA</span>
          <span className="glow-ice text-ice"> RUN</span>
        </h1>
        <p className="mt-4 max-w-md text-base text-white/75 sm:text-lg">
          Slip past lethal spikes, vault chasms with double jumps, and chain cosmic power-ups in an endless night sprint.
        </p>
        <button
          onClick={() => setScreen('playing')}
          className="mt-8 flex items-center gap-4 rounded-2xl bg-gradient-to-r from-ice via-blue-500 to-neon px-10 py-5 font-display text-2xl font-black tracking-widest text-black shadow-[0_0_40px_rgba(34,211,238,0.35)] transition hover:scale-105 active:scale-95"
        >
          <Play fill="currentColor" /> START RUN
        </button>
        <p className="mt-3 text-sm text-white/60">
          Tap screen or press <kbd className="rounded bg-white/10 px-2 py-0.5 text-xs">SPACE</kbd>
        </p>
      </div>

      <nav className="flex gap-1 rounded-2xl border border-white/10 bg-panel/85 p-2 backdrop-blur sm:gap-4 sm:px-6">
        {DOCK.map(({ id, label, icon: Icon, color }) => (
          <button key={id} onClick={() => openModal(id)} className="flex w-16 flex-col items-center gap-1 rounded-xl py-2 transition hover:bg-white/5 sm:w-24">
            <Icon size={22} className={color} />
            <span className="text-[10px] font-bold tracking-widest">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
