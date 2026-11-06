import { useEffect, useState } from 'react'
import { Calendar, Gift, Check } from 'lucide-react'
import { useGame } from '../../store'
import { templateOf } from '../../game/meta.js'
import ModalShell from './ModalShell.jsx'

export default function DailyModal() {
  const daily = useGame((s) => s.daily)
  const orbs = useGame((s) => s.orbs)
  const claimDaily = useGame((s) => s.claimDaily)
  const refreshDaily = useGame((s) => s.refreshDaily)
  const [toast, setToast] = useState(null)
  useEffect(() => { refreshDaily() }, [refreshDaily])

  const t = templateOf(daily)
  const pct = Math.min(100, (daily.progress / t.target) * 100)
  const ready = !daily.claimed && daily.progress >= t.target

  const claim = () => {
    const got = claimDaily()
    if (got) { setToast(`+${got} orbs added to your bank!`); setTimeout(() => setToast(null), 2500) }
  }

  return (
    <ModalShell icon={Calendar} title="Daily Mission" subtitle="Resets every day at midnight" accent="#a855f7" maxWidth="max-w-md">
      {toast && <div className="mb-3 rounded-xl border border-ice/40 bg-ice/10 px-4 py-2 text-center text-sm font-bold text-ice">{toast}</div>}
      <div className="rounded-2xl border border-white/10 bg-void/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-neon">TODAY'S TARGET</div>
            <div className="mt-1 text-xl font-bold">{t.title}</div>
            <div className="text-sm text-white/70">{t.desc.replace('{n}', t.target)}</div>
          </div>
          <div className="rounded-full border border-orb/50 bg-orb/10 px-3 py-1 text-sm font-bold text-orb">+{t.reward}</div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-white/70">
          <span>Progress</span>
          <span className="font-display font-bold">{daily.progress} / {t.target}</span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-neon to-ice transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4">
          {daily.claimed ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 py-3 text-sm font-bold tracking-widest text-green-400"><Check size={16} /> REWARD CLAIMED</div>
          ) : ready ? (
            <button onClick={claim} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold tracking-widest text-black"><Gift size={16} /> CLAIM {t.reward} ORBS</button>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 py-3 text-center text-sm font-bold tracking-widest text-white/40">KEEP RUNNING</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between px-1 text-sm text-white/60">
        <span>Your bank balance</span>
        <span className="font-display font-bold text-orb">{orbs}</span>
      </div>
    </ModalShell>
  )
}
