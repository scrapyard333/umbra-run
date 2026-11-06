import { useEffect, useRef, useState } from 'react'
import { Engine, WORLD_H, GROUND_Y, PLAYER_X, PLAYER_W } from '../game/engine.js'
import { draw, fx } from '../game/renderer.js'
import { LEVELS, SKINS } from '../game/constants.js'
import { useGame } from '../store'

export default function GameScreen() {
  const canvasRef = useRef(null)
  const restartRef = useRef(() => {})
  const [hud, setHud] = useState({ dist: 0, score: 0, orbs: 0, level: 0 })
  const [over, setOver] = useState(null)
  const [banner, setBanner] = useState(null)
  const setScreen = useGame((s) => s.setScreen)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const eng = new Engine({ seed: (Math.random() * 1e9) | 0 })
    const accentOf = () => (SKINS.find((k) => k.id === useGame.getState().skin) || SKINS[0]).accent
    let w = 1200, scale = 1, raf = 0, last = performance.now(), hudT = 0, handled = false, bannerTimer = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      scale = canvas.height / WORLD_H
      w = canvas.width / scale
      eng.width = w
    }
    resize()
    window.addEventListener('resize', resize)

    const restart = () => {
      eng.seed = (Math.random() * 1e9) | 0
      eng.reset()
      fx.clear()
      handled = false
      setOver(null)
      setBanner(null)
    }
    restartRef.current = restart

    const onEvent = (e) => {
      const cx = PLAYER_X + PLAYER_W / 2
      if (e.type === 'jump' || e.type === 'land') fx.dust(cx, GROUND_Y)
      else if (e.type === 'double') fx.burst(cx, eng.p.y - 30, accentOf(), 14)
      else if (e.type === 'orb') fx.burst(e.x, e.y, '#facc15', 8, 180)
      else if (e.type === 'die') fx.burst(cx, eng.p.y - 30, '#ef4444', 40, 340)
      else if (e.type === 'levelup') {
        setBanner(LEVELS[e.level].name)
        clearTimeout(bannerTimer)
        bannerTimer = setTimeout(() => setBanner(null), 2200)
      }
    }

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      eng.update(dt)
      eng.drain().forEach(onEvent)
      draw(ctx, eng, { w, h: WORLD_H, scale, dt, accent: accentOf() })

      hudT += dt
      if (hudT > 0.1) {
        hudT = 0
        setHud({ dist: Math.floor(eng.distM), score: eng.score, orbs: eng.orbCount, level: eng.level })
      }
      if (eng.state === 'dead' && !handled) {
        handled = true
        const st = useGame.getState()
        st.submitRun(eng.score)
        st.addOrbs(eng.orbCount)
        setHud({ dist: Math.floor(eng.distM), score: eng.score, orbs: eng.orbCount, level: eng.level })
        setOver({
          dist: Math.floor(eng.distM), orbs: eng.orbCount, score: eng.score,
          level: eng.level + 1, best: Math.max(st.best, eng.score),
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const down = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        if (e.repeat) return
        if (eng.state === 'dead') restart()
        else eng.jump()
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault()
        eng.setSlide(true)
      }
    }
    const up = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') eng.setSlide(false)
    }
    const tap = () => { if (eng.state === 'running') eng.jump() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    canvas.addEventListener('pointerdown', tap)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(bannerTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      canvas.removeEventListener('pointerdown', tap)
    }
  }, [])

  return (
    <div className="absolute inset-0 bg-void">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-panel/80 px-5 py-3 backdrop-blur">
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/60">DIST</div>
          <div className="font-display text-2xl font-bold">{hud.dist}<span className="text-sm text-neon">m</span></div>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/60">SCORE</div>
          <div className="font-display text-2xl font-bold text-neon">{hud.score}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold tracking-widest text-white/60">ORBS</div>
          <div className="font-display text-2xl font-bold text-orb">{hud.orbs}</div>
        </div>
        <div className="border-l border-white/10 pl-4">
          <div className="text-[10px] font-bold tracking-widest text-ice">LV.{hud.level + 1}</div>
          <div className="text-xs font-semibold">{LEVELS[hud.level].name}</div>
        </div>
      </div>

      {banner && (
        <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-2xl border border-ice/50 bg-panel/90 px-8 py-3 text-center backdrop-blur">
          <div className="text-[10px] font-bold tracking-widest text-ice">LEVEL UP</div>
          <div className="font-display text-xl font-bold">{banner}</div>
        </div>
      )}

      {over && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="w-80 rounded-3xl border border-ice/30 bg-panel p-6 text-center shadow-[0_0_60px_rgba(34,211,238,0.15)]">
            <div className="text-xs font-bold tracking-[0.3em] text-blood">RUN TERMINATED</div>
            <div className="mt-1 font-display text-3xl font-black glow-neon">GAME OVER</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-white/10 p-2"><div className="text-[10px] text-white/60">DISTANCE</div><div className="font-display text-xl text-neon">{over.dist}m</div></div>
              <div className="rounded-xl border border-white/10 p-2"><div className="text-[10px] text-white/60">ORBS</div><div className="font-display text-xl text-orb">{over.orbs}</div></div>
              <div className="rounded-xl border border-white/10 p-2"><div className="text-[10px] text-white/60">SCORE</div><div className="font-display text-xl text-ice">{over.score}</div></div>
              <div className="rounded-xl border border-white/10 p-2"><div className="text-[10px] text-white/60">LEVEL</div><div className="font-display text-xl">Lv.{over.level}</div></div>
            </div>
            <div className="mt-3 text-sm text-white/70">All-time best: <span className="font-display text-orb">{over.best}</span></div>
            <button onClick={() => restartRef.current()} className="mt-4 w-full rounded-xl bg-gradient-to-r from-neon to-ice py-3 font-display font-bold tracking-widest">PLAY AGAIN</button>
            <button onClick={() => setScreen('home')} className="mt-2 w-full rounded-xl border border-white/15 py-2 text-sm font-bold tracking-widest">MENU</button>
            <div className="mt-3 text-xs text-white/50">Press <kbd className="rounded bg-white/10 px-1.5">SPACE</kbd> to restart</div>
          </div>
        </div>
      )}
    </div>
  )
}
