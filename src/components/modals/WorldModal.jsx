import { useEffect, useRef } from 'react'
import { Globe, Check, Shuffle } from 'lucide-react'
import { useGame } from '../../store'
import { BIOMES, ORDER, SEGMENT_M } from '../../game/biomes.js'
import { SKINS } from '../../game/constants.js'
import { Engine } from '../../game/engine.js'
import { draw } from '../../game/renderer.js'
import ModalShell from './ModalShell.jsx'

function BiomePreview({ id }) {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const W = 1060
    const e = new Engine({ seed: 3, width: W })
    e.biomeMode = id
    e.x = 13000
    e.time = 4
    e.speed = 450
    for (let i = 0; i < 90; i++) {
      e.time += 1 / 30
      draw(ctx, e, { w: W, h: 600, scale: c.height / 600, dt: 1 / 30, skin: SKINS[0] })
    }
  }, [id])

  return <canvas ref={ref} width={300} height={170} className="h-auto w-full rounded-xl" />
}

export default function WorldModal() {
  const world = useGame((s) => s.world)
  const setWorld = useGame((s) => s.setWorld)

  return (
    <ModalShell icon={Globe} title="World Select" subtitle="Journey through every biome, or lock the run to one" accent="#a855f7" maxWidth="max-w-3xl">
      <button
        onClick={() => setWorld('auto')}
        className="relative w-full overflow-hidden rounded-2xl border p-4 text-left transition hover:bg-white/5"
        style={{ borderColor: world === 'auto' ? '#a855f7' : 'rgba(255,255,255,0.1)', boxShadow: world === 'auto' ? '0 0 20px #a855f755' : 'none' }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl border border-neon/60 bg-neon/15 text-neon"><Shuffle size={20} /></span>
          <div className="flex-1">
            <div className="font-display text-lg font-bold">Auto Journey</div>
            <div className="text-xs text-white/60">The world changes every {SEGMENT_M} m: spring, summer, autumn, winter, night, inferno.</div>
          </div>
          {world === 'auto' && <Check size={20} className="text-green-400" />}
        </div>
        <div className="mt-3 flex h-2 overflow-hidden rounded-full">
          {ORDER.map((id) => <span key={id} className="flex-1" style={{ background: BIOMES[id].accent }} />)}
        </div>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {ORDER.map((id) => {
          const b = BIOMES[id]
          const on = world === id
          return (
            <button
              key={id}
              onClick={() => setWorld(id)}
              className="relative overflow-hidden rounded-2xl border bg-void/50 p-2 text-left transition hover:bg-white/5"
              style={{ borderColor: on ? b.accent : 'rgba(255,255,255,0.1)', boxShadow: on ? `0 0 20px ${b.accent}55` : 'none' }}
            >
              <BiomePreview id={id} />
              <div className="mt-2 flex items-center justify-between px-1 pb-1">
                <div>
                  <div className="text-sm font-bold leading-tight">{b.name}</div>
                  <div className="text-[10px] font-bold tracking-widest" style={{ color: b.accent }}>{b.season.toUpperCase()}</div>
                </div>
                {on && <span className="grid h-6 w-6 place-items-center rounded-full bg-green-500 text-black"><Check size={14} /></span>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-white/40">Locking a world keeps both the scenery and its music for the whole run.</p>
    </ModalShell>
  )
}
