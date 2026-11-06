import { Medal, Trophy } from 'lucide-react'
import { useGame } from '../../store'
import { buildBoard } from '../../game/meta.js'
import ModalShell from './ModalShell.jsx'

const rankIcon = (rank) => {
  if (rank === 1) return <Trophy size={16} className="text-orb" />
  if (rank === 2) return <Medal size={16} className="text-slate-300" />
  if (rank === 3) return <Medal size={16} className="text-orange-400" />
  return <span className="text-xs font-bold text-white/50">#{rank}</span>
}

export default function RanksModal() {
  const history = useGame((s) => s.history)
  const best = useGame((s) => s.best)
  const bestDist = useGame((s) => s.stats.bestDist)
  const board = buildBoard(history, best, bestDist)
  const mine = board.find((r) => r.you)

  return (
    <ModalShell icon={Medal} title="Hall of Shadows" subtitle={mine ? `Your best rank: #${mine.rank} of ${board.length}` : 'Top runners across the shadow realm'} accent="#facc15" maxWidth="max-w-md">
      <div className="grid grid-cols-[48px_1fr_80px_64px] px-3 pb-2 text-[10px] font-bold tracking-widest text-white/50">
        <span>RANK</span><span>RUNNER</span><span className="text-right">DISTANCE</span><span className="text-right">SCORE</span>
      </div>
      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
        {board.map((r, i) => (
          <div key={i} className={`grid grid-cols-[48px_1fr_80px_64px] items-center rounded-xl border px-3 py-2.5 text-sm ${r.you ? 'border-neon/50 bg-neon/10' : 'border-white/10 bg-void/50'}`}>
            <span>{rankIcon(r.rank)}</span>
            <span className="flex items-center gap-2 font-bold">
              {r.name}
              {r.you && <span className="rounded bg-neon px-1.5 py-0.5 text-[9px] font-black tracking-widest text-black">YOU</span>}
            </span>
            <span className="text-right text-white/70">{r.dist}m</span>
            <span className="text-right font-display font-bold text-orb">{r.score}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-white/40">Rival runners are simulated for now.</p>
    </ModalShell>
  )
}
