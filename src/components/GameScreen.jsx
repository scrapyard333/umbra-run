import { useEffect, useRef, useState } from 'react'
import { Engine, WORLD_H, GROUND_Y, PLAYER_X, PLAYER_W } from '../game/engine.js'
import { draw, fx } from '../game/renderer.js'
import { LEVELS, SKINS, QUALITY, PX_PER_M } from '../game/constants.js'
import { audio } from '../game/audio.js'
import { BIOMES } from '../game/biomes.js'
import { useGame } from '../store'
import Hud from './Hud.jsx'
import GameOverCard from './GameOverCard.jsx'
import PauseMenu from './PauseMenu.jsx'

const PICKUP_COLOR = { shield: '#22d3ee', magnet: '#f87171', slow: '#a78bfa' }

export default function GameScreen() {
  const canvasRef = useRef(null)
  const ctl = useRef({})
  const [hud, setHud] = useState({ dist: 0, score: 0, orbs: 0, level: 0, mult: 1, combo: 0, comboPct: 0, shield: false, magnet: 0, slow: 0, ghost: null })
  const [over, setOver] = useState(null)
  const [banner, setBanner] = useState(null)
  const [paused, setPaused] = useState(false)
  const [count, setCount] = useState(0)
  const soundOn = useGame((s) => s.settings.sound || s.settings.music)
  const setAudio = useGame((s) => s.setAudio)
  const setScreen = useGame((s) => s.setScreen)
  const openModal = useGame((s) => s.openModal)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const eng = new Engine({ seed: (Math.random() * 1e9) | 0 })
    eng.biomeMode = useGame.getState().world
    const skinOf = () => SKINS.find((k) => k.id === useGame.getState().skin) || SKINS[0]
    const accentOf = () => skinOf().accent
    const loadGhost = () => { eng.ghost = useGame.getState().ghost?.samples ?? null }
    loadGhost()

    let w = 1200, scale = 1, raf = 0, last = performance.now(), hudT = 0
    let handled = false, bannerTimer = 0, isPaused = false, resumeIn = 0, shown = 0
    let lastSettings = useGame.getState().settings

    const syncAudio = () => {
      const s = useGame.getState().settings
      audio.configure({ sound: s.sound, music: s.music })
    }
    audio.unlock()
    syncAudio()
    audio.setBiome(eng.biome.active)
    audio.startMusic()

    const showBanner = (label, text, ms = 2200) => {
      setBanner({ label, text })
      clearTimeout(bannerTimer)
      bannerTimer = setTimeout(() => setBanner(null), ms)
    }

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

    const snap = () => {
      const g = eng.ghostState()
      return {
        dist: Math.floor(eng.distM),
        score: eng.score,
        orbs: eng.orbCount,
        level: eng.level,
        mult: eng.mult,
        combo: eng.combo,
        comboPct: eng.combo > 0 ? eng.comboT / 2.5 : 0,
        shield: eng.shield,
        magnet: eng.magnet,
        slow: eng.slow,
        ghost: g ? Math.round((g.x - eng.x) / PX_PER_M) : null,
        zone: BIOMES[eng.biome.active].name,
        zoneAccent: BIOMES[eng.biome.active].accent,
      }
    }

    const restart = () => {
      eng.seed = (Math.random() * 1e9) | 0
      eng.reset()
      loadGhost()
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
      audio.resume()
      audio.setBiome(eng.biome.active)
      audio.startMusic()
    }

    const togglePause = () => {
      if (eng.state !== 'running') return
      if (isPaused) { isPaused = false; resumeIn = 3; shown = 3; setCount(3); audio.resume() }
      else { isPaused = true; resumeIn = 0; shown = 0; setCount(0); audio.suspend() }
      setPaused(isPaused)
      last = performance.now()
    }

    ctl.current = {
      restart,
      togglePause,
      jump: () => { if (!locked() && eng.state === 'running') eng.jump() },
      slide: (on) => { if (on && locked()) return; eng.setSlide(on) },
    }

    const achieved = (list) => {
      if (list && list.length) showBanner('ACHIEVEMENT', `${list[0].title}  +${list[0].reward}`, 3200)
    }

    const onEvent = (e) => {
      const cx = PLAYER_X + PLAYER_W / 2
      const st = useGame.getState()
      switch (e.type) {
        case 'jump': fx.dust(cx, GROUND_Y); audio.sfx('jump'); break
        case 'land': fx.dust(cx, GROUND_Y); audio.sfx('land'); break
        case 'double': fx.burst(cx, eng.p.y - 30, accentOf(), 14); audio.sfx('double'); break
        case 'orb': fx.burst(e.x, e.y, '#facc15', 8, 180); audio.sfx('orb', e.mult); break
        case 'combo': audio.sfx('combo', e.mult); break
        case 'nearmiss':
          fx.burst(e.x, e.y, '#ffffff', 10, 220)
          audio.sfx('nearmiss')
          showBanner('NEAR MISS', `+${25 * eng.mult}`, 1200)
          break
        case 'pickup':
          fx.burst(e.x, e.y, PICKUP_COLOR[e.kind], 16, 260)
          audio.sfx(e.kind === 'slow' ? 'slow' : e.kind)
          break
        case 'shieldhit':
          fx.burst(PLAYER_X + 17, eng.p.y - 30, '#22d3ee', 24, 320)
          audio.sfx('shieldhit')
          achieved(st.addStat('shieldHits'))
          break
        case 'slowstart': achieved(st.addStat('slowUses')); break
        case 'die':
          fx.burst(cx, eng.p.y - 30, '#ef4444', 40, 340)
          audio.sfx('die')
          audio.stopMusic()
          break
        case 'zonechange':
          showBanner('NOW ENTERING', BIOMES[e.id].name, 2600)
          audio.setBiome(e.id)
          break
        case 'levelup':
          showBanner('LEVEL UP', LEVELS[e.level].name)
          audio.sfx('levelup')
          break
        default: break
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
        audio.setMood(eng.timeScale)
      }

      const cur = useGame.getState().settings
      if (cur !== lastSettings) {
        lastSettings = cur
        syncAudio()
      }

      fx.scale = QUALITY[cur.quality] ?? 1
      draw(ctx, eng, { w, h: WORLD_H, scale, dt: step, skin: skinOf() })

      hudT += step
      if (hudT > 0.1) {
        hudT = 0
        setHud(snap())
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
          samples: eng.rec,
        })
        setHud(snap())
        setOver({
          dist: Math.floor(eng.distM),
          orbs: eng.orbCount,
          score: eng.score,
          level: eng.level + 1,
          levelName: LEVELS[eng.level].name,
          best: Math.max(prevBest, eng.score),
          newBest: eng.score > prevBest,
          bestMult: eng.bestMult,
          nearMisses: eng.nearMisses,
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
      audio.stopMusic()
      audio.resume()
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
        onSound={() => setAudio(!useGame.getState().settings.sound && !useGame.getState().settings.music)}
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
