import { useEffect, useRef } from 'react'
import { drawPlayer } from '../../game/renderer.js'
import { PLAYER_X, PLAYER_W } from '../../game/engine.js'

const CYCLE = 6

export default function SkinPreview({ skin }) {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const eng = {
      p: { y: 0, vy: 0, grounded: true, sliding: false, flipping: false, flipT: 0 },
      time: 0,
      speed: 420,
    }
    const cx = PLAYER_X + PLAYER_W / 2
    const s = 2.3
    let raf = 0
    let last = performance.now()

    const loop = (n) => {
      eng.time += (n - last) / 1000
      last = n
      const t = eng.time % CYCLE
      const p = eng.p
      p.y = 0; p.grounded = true; p.sliding = false; p.flipping = false
      if (t > 3.2 && t < 4.4) {
        const u = (t - 3.2) / 1.2
        p.y = -Math.sin(u * Math.PI) * 70
        p.grounded = false
        p.flipping = u < 0.5
        p.flipT = Math.min(0.55, u * 1.2)
      } else if (t >= 4.4 && t < 5.6) {
        p.sliding = true
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      const g = ctx.createRadialGradient(c.width / 2, c.height * 0.8, 4, c.width / 2, c.height * 0.8, c.width * 0.5)
      g.addColorStop(0, `${skin.accent}66`)
      g.addColorStop(1, `${skin.accent}00`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.setTransform(s, 0, 0, s, c.width / 2 - cx * s, c.height * 0.8)
      drawPlayer(ctx, eng, skin)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [skin])

  return <canvas ref={ref} width={300} height={300} className="h-36 w-36 shrink-0 rounded-2xl border border-white/10 bg-void/60 sm:h-40 sm:w-40" />
}
