import { GROUND_Y, PLAYER_X, PLAYER_W, MAGNET_RANGE } from './engine.js'
import { SKINS, PX_PER_M } from './constants.js'
import { drawWorld } from './world.js'
import { drawCharacter } from './characters.js'

const TAU = Math.PI * 2
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgba = (hex, a) => { const [r, g, b] = toRgb(hex); return `rgba(${r},${g},${b},${a})` }

export const fx = {
  list: [],
  scale: 1,
  burst(x, y, color, n = 10, speed = 260) {
    n = Math.ceil(n * this.scale)
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU
      const s = speed * (0.3 + Math.random() * 0.7)
      this.list.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.9, max: 0.9, r: 1.5 + Math.random() * 2.5, color })
    }
  },
  dust(x, y) {
    const n = Math.ceil(6 * this.scale)
    for (let i = 0; i < n; i++) {
      this.list.push({ x: x + (Math.random() - 0.5) * 20, y, vx: -60 - Math.random() * 120, vy: -Math.random() * 90, life: 0.4, max: 0.4, r: 2 + Math.random() * 3, color: '#b8a2ff' })
    }
  },
  clear() { this.list.length = 0 },
}

function drawOrbs(ctx, eng, clock) {
  for (const o of eng.orbs) {
    const sq = 0.35 + 0.65 * Math.abs(Math.cos(clock * 4 + o.x * 0.02))
    const g = ctx.createRadialGradient(o.x, o.y, 2, o.x, o.y, o.r * 2.2)
    g.addColorStop(0, 'rgba(250,204,21,0.55)')
    g.addColorStop(1, 'rgba(250,204,21,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(o.x, o.y, o.r * 2.2, 0, TAU); ctx.fill()
    ctx.save()
    ctx.translate(o.x, o.y)
    ctx.scale(sq, 1)
    ctx.fillStyle = '#f5a30b'
    ctx.beginPath(); ctx.arc(0, 0, o.r, 0, TAU); ctx.fill()
    ctx.fillStyle = '#ffd84a'
    ctx.beginPath(); ctx.arc(0, 0, o.r - 3, 0, TAU); ctx.fill()
    ctx.fillStyle = '#8a4b00'
    ctx.fillRect(-2, -5, 4, 10)
    ctx.restore()
  }
}

function drawObstacles(ctx, eng, lvl, clock) {
  for (const o of eng.obstacles) {
    if (o.type === 'spike') {
      const n = Math.round(o.w / 30)
      ctx.strokeStyle = lvl.accent
      ctx.lineWidth = 2
      ctx.shadowColor = lvl.accent
      ctx.shadowBlur = 12
      for (let i = 0; i < n; i++) {
        const x0 = o.x + i * 30
        const hh = o.h * (0.85 + 0.15 * hash(i + o.h))
        ctx.fillStyle = '#1b1033'
        ctx.beginPath()
        ctx.moveTo(x0, GROUND_Y); ctx.lineTo(x0 + 11 + hash(i) * 8, GROUND_Y - hh); ctx.lineTo(x0 + 30, GROUND_Y)
        ctx.closePath(); ctx.fill(); ctx.stroke()
      }
      ctx.shadowBlur = 0
    } else if (o.type === 'laser') {
      const by = GROUND_Y - 59
      ctx.fillStyle = '#1a1230'
      ctx.strokeStyle = '#22d3ee'
      ctx.lineWidth = 2
      for (const ex of [o.x - 6, o.x + o.w - 6]) {
        ctx.fillRect(ex, by - 22, 12, 44)
        ctx.strokeRect(ex, by - 22, 12, 44)
      }
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(clock * 30)
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 18
      ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(o.x + 6, by); ctx.lineTo(o.x + o.w - 6, by); ctx.stroke()
      ctx.shadowBlur = 0
      ctx.globalAlpha = 1
    }
  }
}

export function drawPlayer(ctx, eng, skin) {
  const p = eng.p
  const accent = skin.accent
  const cx = PLAYER_X + PLAYER_W / 2
  const sy = p.y - (p.sliding ? 14 : 30)

  const trail = ctx.createLinearGradient(cx - 160, 0, cx, 0)
  trail.addColorStop(0, rgba(accent, 0))
  trail.addColorStop(1, rgba(accent, 0.7))
  ctx.strokeStyle = trail
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(cx - 160, sy + 6); ctx.lineTo(cx - 8, sy); ctx.stroke()

  ctx.save()
  if (p.flipping) {
    ctx.translate(cx, p.y - 30)
    ctx.rotate(Math.min(1, p.flipT / 0.55) * TAU)
    ctx.translate(0, 30)
  } else {
    ctx.translate(cx, p.y)
  }
  drawCharacter(ctx, skin.id, { time: eng.time, speed: eng.speed, air: !p.grounded, sliding: p.sliding }, accent)
  ctx.restore()
}

function drawParticles(ctx, dt) {
  const list = fx.list
  for (let i = list.length - 1; i >= 0; i--) {
    const q = list[i]
    q.life -= dt
    if (q.life <= 0) { list.splice(i, 1); continue }
    q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 500 * dt
    ctx.globalAlpha = Math.max(0, q.life / q.max)
    ctx.fillStyle = q.color
    ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill()
  }
  ctx.globalAlpha = 1
}

const PICK_COLOR = { shield: '#22d3ee', magnet: '#f87171', slow: '#a78bfa' }

function drawPickups(ctx, eng, clock) {
  for (const k of eng.pickups) {
    const col = PICK_COLOR[k.kind]
    const y = k.y + Math.sin(clock * 3 + k.x * 0.01) * 4
    const g = ctx.createRadialGradient(k.x, y, 2, k.x, y, 38)
    g.addColorStop(0, rgba(col, 0.5))
    g.addColorStop(1, rgba(col, 0))
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(k.x, y, 38, 0, TAU); ctx.fill()
    ctx.fillStyle = 'rgba(8,6,20,0.9)'
    ctx.strokeStyle = col
    ctx.lineWidth = 2.5
    ctx.shadowColor = col
    ctx.shadowBlur = 14
    ctx.beginPath(); ctx.arc(k.x, y, k.r, 0, TAU); ctx.fill(); ctx.stroke()
    ctx.shadowBlur = 0
    ctx.save()
    ctx.translate(k.x, y)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (k.kind === 'shield') {
      ctx.beginPath()
      ctx.moveTo(0, -9); ctx.lineTo(8, -5); ctx.lineTo(7, 3); ctx.lineTo(0, 9); ctx.lineTo(-7, 3); ctx.lineTo(-8, -5)
      ctx.closePath(); ctx.stroke()
    } else if (k.kind === 'magnet') {
      ctx.lineWidth = 3.4
      ctx.beginPath()
      ctx.moveTo(-6, 7); ctx.lineTo(-6, 0); ctx.arc(0, 0, 6, Math.PI, 0); ctx.lineTo(6, 7)
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(-8, 5, 4, 3); ctx.fillRect(4, 5, 4, 3)
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5); ctx.moveTo(0, 0); ctx.lineTo(4, 2); ctx.stroke()
    }
    ctx.restore()
  }
}

function drawEffects(ctx, eng, clock) {
  const cx = PLAYER_X + PLAYER_W / 2
  const cy = eng.p.y - (eng.p.sliding ? 14 : 30)
  if (eng.magnet > 0) {
    for (let i = 0; i < 3; i++) {
      const t = (clock * 1.3 + i / 3) % 1
      ctx.strokeStyle = rgba('#f87171', t * 0.35)
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, (1 - t) * MAGNET_RANGE + 24, 0, TAU); ctx.stroke()
    }
  }
  if (eng.shield || eng.grace > 0) {
    const flick = eng.grace > 0 && Math.sin(clock * 40) > 0 ? 0.25 : 1
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 48)
    g.addColorStop(0, 'rgba(34,211,238,0)')
    g.addColorStop(1, 'rgba(34,211,238,' + 0.28 * flick + ')')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, 48, 0, TAU); ctx.fill()
    ctx.strokeStyle = 'rgba(165,243,252,' + 0.85 * flick + ')'
    ctx.lineWidth = 2.5
    ctx.shadowColor = '#22d3ee'
    ctx.shadowBlur = 12
    ctx.beginPath(); ctx.arc(cx, cy, 46, 0, TAU); ctx.stroke()
    ctx.shadowBlur = 0
  }
}

function drawGhost(ctx, eng, skin, w) {
  const g = eng.ghostState && eng.ghostState()
  if (!g) return
  const dx = g.x - eng.x
  ctx.font = 'bold 12px Rajdhani, sans-serif'
  ctx.fillStyle = 'rgba(203,213,225,0.8)'
  if (dx > w - 60) {
    ctx.textAlign = 'right'
    ctx.fillText('GHOST +' + Math.round(dx / PX_PER_M) + 'm  >', w - 12, GROUND_Y - 90)
    ctx.textAlign = 'left'
    return
  }
  if (dx < -120) {
    ctx.fillText('< GHOST -' + Math.round(-dx / PX_PER_M) + 'm', 12, GROUND_Y - 90)
    return
  }
  const fake = {
    p: { y: g.y, vy: 0, grounded: g.y >= GROUND_Y - 1, sliding: g.s === 1, flipping: false, flipT: 0 },
    time: eng.time,
    speed: eng.speed,
  }
  ctx.save()
  ctx.translate(dx, 0)
  ctx.globalAlpha = 0.3
  drawPlayer(ctx, fake, { id: skin.id, accent: '#cbd5e1' })
  ctx.globalAlpha = 0.8
  ctx.textAlign = 'center'
  ctx.fillText('GHOST', PLAYER_X + PLAYER_W / 2, g.y - 80)
  ctx.restore()
}

export function draw(ctx, eng, o) {
  const { w, h = 600, scale = 1, dt = 0.016, skin = SKINS[0] } = o
  const clock = performance.now() / 1000
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  const lvl = drawWorld(ctx, eng, w, h, dt, clock, fx.scale)
  drawOrbs(ctx, eng, clock)
  drawObstacles(ctx, eng, lvl, clock)
  drawPickups(ctx, eng, clock)
  drawGhost(ctx, eng, skin, w)
  if (eng.state !== 'dead') {
    drawPlayer(ctx, eng, skin)
    drawEffects(ctx, eng, clock)
  }
  drawParticles(ctx, dt)
  if (eng.timeScale < 0.99) {
    ctx.fillStyle = rgba('#6366f1', (1 - eng.timeScale) * 0.4)
    ctx.fillRect(0, 0, w, h)
  }
}
