import { useState } from 'react'
import { Shirt, Check, Lock } from 'lucide-react'
import { useGame } from '../../store'
import { SKINS } from '../../game/constants.js'
import ModalShell, { OrbPill } from './ModalShell.jsx'
import SkinPreview from './SkinPreview.jsx'

export default function SkinsModal() {
  const orbs = useGame((s) => s.orbs)
  const owned = useGame((s) => s.owned)
  const equipped = useGame((s) => s.skin)
  const buySkin = useGame((s) => s.buySkin)
  const equipSkin = useGame((s) => s.equipSkin)
  const [sel, setSel] = useState(equipped)
  const skin = SKINS.find((k) => k.id === sel) || SKINS[0]
  const isOwned = owned.includes(skin.id)
  const missing = skin.price - orbs

  let action
  if (equipped === skin.id) {
    action = <div className="flex items-center justify-center gap-2 rounded-xl border border-green-500/40 bg-green-500/10 py-3 text-sm font-bold tracking-widest text-green-400"><Check size={16} /> CURRENTLY EQUIPPED</div>
  } else if (isOwned) {
    action = <button onClick={() => equipSkin(skin.id)} className="w-full rounded-xl bg-gradient-to-r from-neon to-ice py-3 text-sm font-bold tracking-widest text-black">EQUIP</button>
  } else if (missing <= 0) {
    action = <button onClick={() => buySkin(skin.id)} className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold tracking-widest text-black">UNLOCK FOR {skin.price} ORBS</button>
  } else {
    action = <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold tracking-widest text-white/40"><Lock size={14} /> NEED {missing} MORE ORBS</div>
  }

  return (
    <ModalShell icon={Shirt} title="Skin Vault" subtitle="Unlock unique silhouettes, trails & energy auras" accent={skin.accent} maxWidth="max-w-2xl" right={<OrbPill value={orbs} />}>
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-void/50 p-4 sm:flex-row sm:items-center">
        <div className="mx-auto"><SkinPreview skin={skin} /></div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-2xl font-black">{skin.name}</h3>
            <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-widest text-black" style={{ background: skin.accent }}>{skin.rarity}</span>
          </div>
          <p className="mt-1 text-sm text-white/70">{skin.desc}</p>
          <div className="mt-4">{action}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SKINS.map((k) => {
          const has = owned.includes(k.id)
          return (
            <button
              key={k.id}
              onClick={() => setSel(k.id)}
              className="relative rounded-2xl border bg-void/50 p-3 text-left transition hover:bg-white/5"
              style={{ borderColor: sel === k.id ? k.accent : 'rgba(255,255,255,0.1)', boxShadow: sel === k.id ? `0 0 18px ${k.accent}44` : 'none' }}
            >
              {equipped === k.id && <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-green-500 text-black"><Check size={12} /></span>}
              <span className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: k.accent, color: k.accent, background: `${k.accent}22` }}><Shirt size={18} /></span>
              <div className="mt-2 text-sm font-bold leading-tight">{k.name}</div>
              <div className="mt-0.5 text-xs font-semibold" style={{ color: has ? '#22d3ee' : '#facc15' }}>{has ? 'Owned' : `${k.price} orbs`}</div>
            </button>
          )
        })}
      </div>
    </ModalShell>
  )
}
