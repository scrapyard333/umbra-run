import { useState } from 'react'
import { Settings, Volume2, Music, Sparkles, Keyboard, Trash2 } from 'lucide-react'
import { useGame } from '../../store'
import ModalShell from './ModalShell.jsx'

function Switch({ on, onClick, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={onClick} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-ice' : 'bg-white/15'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function Row({ icon: Icon, tint, title, sub, children }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-void/50 p-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border" style={{ borderColor: `${tint}66`, background: `${tint}1f`, color: tint }}><Icon size={18} /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-xs text-white/60">{sub}</div>
      </div>
      {children}
    </div>
  )
}

const NEXT = { high: 'medium', medium: 'low', low: 'high' }

export default function SettingsModal() {
  const settings = useGame((s) => s.settings)
  const toggleSetting = useGame((s) => s.toggleSetting)
  const setQuality = useGame((s) => s.setQuality)
  const resetProgress = useGame((s) => s.resetProgress)
  const [confirm, setConfirm] = useState(false)

  return (
    <ModalShell icon={Settings} title="Configuration" subtitle="Sound, visuals & keybindings" accent="#22d3ee" maxWidth="max-w-md">
      <div className="space-y-2">
        <Row icon={Volume2} tint="#a855f7" title="Sound Effects (SFX)" sub="Jump, orbs, hits & abilities">
          <Switch on={settings.sound} label="Sound effects" onClick={() => toggleSetting('sound')} />
        </Row>
        <Row icon={Music} tint="#22d3ee" title="Cyber Synth BGM" sub="Tempo accelerates with level speed">
          <Switch on={settings.music} label="Background music" onClick={() => toggleSetting('music')} />
        </Row>
        <Row icon={Sparkles} tint="#facc15" title="Particle Quality" sub="Shockwaves, dust & sparks">
          <button onClick={() => setQuality(NEXT[settings.quality])} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold tracking-widest">{settings.quality.toUpperCase()}</button>
        </Row>
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-void/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-widest text-white/60"><Keyboard size={13} /> QUICK CONTROLS</div>
        <div className="grid grid-cols-2 gap-y-1.5 text-xs text-white/70">
          <span><kbd className="rounded bg-white/10 px-1.5">SPACE</kbd> / <kbd className="rounded bg-white/10 px-1.5">↑</kbd> Jump</span>
          <span><kbd className="rounded bg-white/10 px-1.5">2x TAP</kbd> Double jump</span>
          <span><kbd className="rounded bg-white/10 px-1.5">↓</kbd> / <kbd className="rounded bg-white/10 px-1.5">S</kbd> Slide</span>
          <span><kbd className="rounded bg-white/10 px-1.5">P</kbd> / <kbd className="rounded bg-white/10 px-1.5">ESC</kbd> Pause</span>
        </div>
      </div>

      <div className="mt-3">
        {confirm ? (
          <div className="flex items-center gap-2 rounded-2xl border border-blood/40 bg-blood/10 p-3">
            <span className="flex-1 text-xs text-white/80">Erase all orbs, skins, achievements and scores?</span>
            <button onClick={() => { resetProgress(); setConfirm(false) }} className="rounded-lg bg-blood px-3 py-1.5 text-xs font-bold text-black">ERASE</button>
            <button onClick={() => setConfirm(false)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold">CANCEL</button>
          </div>
        ) : (
          <button onClick={() => setConfirm(true)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-xs font-bold tracking-widest text-white/50 transition hover:text-blood"><Trash2 size={14} /> RESET PROGRESS</button>
        )}
      </div>
    </ModalShell>
  )
}
