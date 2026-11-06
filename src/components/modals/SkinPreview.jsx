import { useEffect, useRef } from 'react'
import { drawPlayer } from '../../game/renderer.js'
import { PLAYER_X, PLAYER_W } from '../../game/engine.js'

export default function SkinPreview({ accent }) {
  const ref = useRef(null)

  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const eng = { p: { y: 0, vy: 0, grounded: true, sliding: false, flipping: false, flipT: 0 }, time: 0, speed: 420 }
    const cx = PLAYER_X + PLAYER_W / 2
    const s = 2.3
    let raf = 0
    let last = performance.now()
    const loop = (n) => {
      eng.time += (n - last) / 1000
      last = n
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, c.width, c.height)
      const g = ctx.createRadialGradient(c.width / 2, c.height * 0.8, 4, c.width / 2, c.height * 0.8, c.width * 0.5)
      g.addColorStop(0, `${accent}66`)
      g.addColorStop(1, `${accent}00`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, c.width, c.height)
      ctx.setTransform(s, 0, 0, s, c.width / 2 - cx * s, c.height * 0.8)
      drawPlayer(ctx, eng, accent)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [accent])

  return <canvas ref={ref} width={300} height={300} className="h-36 w-36 shrink-0 rounded-2xl border border-white/10 bg-void/60 sm:h-40 sm:w-40" />
}
