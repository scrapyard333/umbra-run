import { Trophy, Lock, Check, Footprints, Flame, Crown, Wind, Coins, Shield, Timer } from 'lucide-react'
import { useGame } from '../../store'
import { ACHIEVEMENTS } from '../../game/meta.js'
import ModalShell from './ModalShell.jsx'

const ICONS = { footprints: Footprints, flame: Flame, crown: Crown, wind: Wind, coins: Coins, shield: Shield, timer: Timer }

export default function TrophiesModal() {
  const stats = useGame((s) => s.stats)
  const unlocked = useGame((s) => s.achievements)

  return (
    <ModalShell icon={Trophy} title="Achievements" subtitle={`Completed ${unlocked.length} of ${ACHIEVEMENTS.length}`} accent="#22d3ee" maxWidth="max-w-md">
      <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
        {ACHIEVEMENTS.map((a) => {
          const done = unlocked.includes(a.id)
          const Icon = ICONS[a.icon] || Trophy
          const cur = Math.min(a.max, a.value(stats))
          return (
            <div key={a.id} className={`flex items-center gap-3 rounded-2xl border p-3 ${done ? 'border-ice/30 bg-ice/5' : 'border-white/10 bg-void/50 opacity-70'}`}>
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${done ? 'border-ice/60 text-ice' : 'border-white/10 text-white/40'}`}>
                {done ? <Icon size={20} /> : <Lock size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-sm font-bold">{a.title}{done && <Check size={14} className="text-green-400" />}</div>
                <div className="text-xs text-white/60">{a.desc}</div>
                {!done && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-ice/70" style={{ width: `${(cur / a.max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-white/50">{cur}/{a.max}</span>
                  </div>
                )}
              </div>
              <div className="rounded-full border border-orb/40 bg-orb/10 px-2.5 py-1 text-xs font-bold text-orb">+{a.reward}</div>
            </div>
          )
        })}
      </div>
    </ModalShell>
  )
}
