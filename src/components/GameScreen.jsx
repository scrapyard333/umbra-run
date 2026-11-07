import { useEffect, useRef, useState } from 'react'
import { Engine, WORLD_H, GROUND_Y, PLAYER_X, PLAYER_W } from '../game/engine.js'
import { draw, fx } from '../game/renderer.js'
import { LEVELS, SKINS, QUALITY } from '../game/constants.js'
import { useGame } from '../store'
import Hud from './Hud.jsx'
import GameOverCard from './GameOverCard.jsx'
import PauseMenu from './PauseMenu.jsx'

export default function GameScreen() {
  const canvasRef = useRef(null)
  const ctl = useRef({})
  const [hud, setHud] = useState({ dist: 0, score: 0, orbs: 0, level: 0 })
  const [over, setOver] = useState(null)
  const [banner, setBanner] = useState(null)
  const [paused, setPaused] = useState(false)
  const [count, setCount] = useState(0)
  const soundOn = useGame((s) => s.settings.sound)
  const toggleSetting = useGame((s) => s.toggleSetting)
  const setScreen = useGame((s) => s.setScreen)
  const openModal = useGame((s) => s.openModal)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const eng = new Engine({ seed: (Math.random() * 1e9) | 0 })
    const skinOf = () => SKINS.find((k) => k.id === useGame.getState().skin) || SKINS[0]
    const accentOf = () => skinOf().accent
    let w = 1200, scale = 1, raf = 0, last = performance.now(), hudT = 0
    let handled = false, bannerTimer = 0, isPaused = false, resumeIn = 0, shown = 0

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

    const locked = () => isPaused || resumeIn > 0

    const restart = () => {
      eng.seed = (Math.random() * 1e9) | 0
      eng.reset()
      fx.clear()
      handled = false
      isPaused = false
      resumeIn = 0
      shown = 0
      last = performance.now()
      setOver(null)
      setBanner(null)
      setPaused(false)
      setCount(0)
    }

    const togglePause = () => {
      if (eng.state !== 'running') return
      if (isPaused) { isPaused = false; resumeIn = 3; shown = 3; setCount(3) }
      else { isPaused = true; resumeIn = 0; shown = 0; setCount(0) }
      setPaused(isPaused)
      last = performance.now()
    }

    ctl.current = {
      restart,
      togglePause,
      jump: () => { if (!locked() && eng.state === 'running') eng.jump() },
      slide: (on) => { if (on && locked()) return; eng.setSlide(on) },
    }

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
      let step = dt
      if (resumeIn > 0) {
        resumeIn -= dt
        const c = Math.max(0, Math.ceil(resumeIn))
        if (c !== shown) { shown = c; setCount(c) }
        step = 0
      } else if (isPaused) {
        step = 0
      }
      if (step > 0) {
        eng.update(step)
        eng.drain().forEach(onEvent)
      }
      fx.scale = QUALITY[useGame.getState().settings.quality] ?? 1
      draw(ctx, eng, { w, h: WORLD_H, scale, dt: step, skin: skinOf() })

      hudT += step
      if (hudT > 0.1) {
        hudT = 0
        setHud({ dist: Math.floor(eng.distM), score: eng.score, orbs: eng.orbCount, level: eng.level })
      }
      if (eng.state === 'dead' && !handled) {
        handled = true
        const st = useGame.getState()
        const prevBest = st.best
        const unlocked = st.finishRun({
          score: eng.score,
          dist: Math.floor(eng.distM),
          orbs: eng.orbCount,
          doubleJumps: eng.doubleJumps,
          slides: eng.slides,
          level: eng.level + 1,
        })
        setHud({ dist: Math.floor(eng.distM), score: eng.score, orbs: eng.orbCount, level: eng.level })
        setOver({
          dist: Math.floor(eng.distM),
          orbs: eng.orbCount,
          score: eng.score,
          level: eng.level + 1,
          levelName: LEVELS[eng.level].name,
          best: Math.max(prevBest, eng.score),
          newBest: eng.score > prevBest,
          unlocked,
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const down = (e) => {
      if (useGame.getState().modal) return
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        if (e.repeat) return
        if (eng.state === 'dead') restart()
        else ctl.current.jump()
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault()
        ctl.current.slide(true)
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (!e.repeat) togglePause()
      }
    }
    const up = (e) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') ctl.current.slide(false)
    }
    const onHidden = () => {
      if (document.hidden && eng.state === 'running' && !isPaused) togglePause()
    }
    const tap = () => ctl.current.jump()

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    document.addEventListener('visibilitychange', onHidden)
    canvas.addEventListener('pointerdown', tap)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(bannerTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      document.removeEventListener('visibilitychange', onHidden)
      canvas.removeEventListener('pointerdown', tap)
    }
  }, [])

  return (
    <div className="absolute inset-0 bg-void">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      <Hud
        hud={hud}
        banner={banner}
        soundOn={soundOn}
        onPause={() => ctl.current.togglePause()}
        onRestart={() => ctl.current.restart()}
        onSound={() => toggleSetting('sound')}
        onJump={() => ctl.current.jump()}
        onSlide={(on) => ctl.current.slide(on)}
      />

      {count > 0 && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="font-display text-8xl font-black text-ice glow-ice">{count}</span>
        </div>
      )}

      {paused && !over && (
        <PauseMenu
          onResume={() => ctl.current.togglePause()}
          onRestart={() => ctl.current.restart()}
          onMenu={() => setScreen('home')}
        />
      )}

      {over && (
        <GameOverCard
          data={over}
          onRestart={() => ctl.current.restart()}
          onMenu={() => setScreen('home')}
          onSkins={() => openModal('skins')}
        />
      )}
    </div>
  )
}
