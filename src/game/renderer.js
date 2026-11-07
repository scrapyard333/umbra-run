import { GROUND_Y, PLAYER_X, PLAYER_W, MAGNET_RANGE } from './engine.js'
import { LEVELS, SKINS, PX_PER_M } from './constants.js'
import { drawCharacter } from './characters.js'

const TAU = Math.PI * 2
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const wrap = (v, m) => ((v % m) + m) % m
const STARS = Array.from({ length: 120 }, (_, i) => ({
  x: hash(i), y: hash(i + 200) * 0.6, s: 0.6 + hash(i + 400) * 1.6, p: hash(i + 600) * TAU,
}))

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgba = (hex, a) => { const [r, g, b] = toRgb(hex); return `rgba(${r},${g},${b},${a})` }
let skyRgb = null

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

function drawSky(ctx, w, h, lvl, dt, clock) {
  const target = lvl.sky.map(toRgb)
  if (!skyRgb) skyRgb = target.map((c) => c.slice())
  const k = 1 - Math.exp(-dt * 2.5)
  skyRgb.forEach((c, i) => { for (let j = 0; j < 3; j++) c[j] += (target[i][j] - c[j]) * k })
  const col = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, col(skyRgb[0]))
  g.addColorStop(0.6, col(skyRgb[1]))
  g.addColorStop(1, col(skyRgb[2]))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  for (const s of STARS) {
    ctx.globalAlpha = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 1.6 + s.p))
    ctx.fillRect(s.x * w, s.y * h, s.s, s.s)
  }
  ctx.globalAlpha = 1
}

function drawMoon(ctx, w, lvl) {
  const mx = w * 0.82, my = 118, r = 58
  const beam = ctx.createLinearGradient(0, my, 0, GROUND_Y)
  beam.addColorStop(0, rgba(lvl.accent, 0.3))
  beam.addColorStop(1, rgba(lvl.accent, 0))
  ctx.fillStyle = beam
  ctx.beginPath()
  ctx.moveTo(mx - 30, my + 30); ctx.lineTo(mx + 30, my + 30)
  ctx.lineTo(mx + w * 0.16, GROUND_Y); ctx.lineTo(mx - w * 0.16, GROUND_Y)
  ctx.fill()
  const glow = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 2.3)
  glow.addColorStop(0, rgba(lvl.accent, 0.55))
  glow.addColorStop(1, rgba(lvl.accent, 0))
  ctx.fillStyle = glow
  ctx.beginPath(); ctx.arc(mx, my, r * 2.3, 0, TAU); ctx.fill()
  const disc = ctx.createRadialGradient(mx - 18, my - 18, 4, mx, my, r)
  disc.addColorStop(0, '#ffffff'); disc.addColorStop(1, '#cdb8ff')
  ctx.fillStyle = disc
  ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill()
  ctx.fillStyle = 'rgba(70,45,120,0.35)'
  for (const [dx, dy, cr] of [[-16, -10, 11], [14, 8, 15], [-6, 22, 7], [22, -22, 6]]) {
    ctx.beginPath(); ctx.arc(mx + dx, my + dy, cr, 0, TAU); ctx.fill()
  }
}

function drawClouds(ctx, w, x) {
  const span = w + 600
  for (let c = 0; c < 6; c++) {
    const cx = wrap(c * 420 - x * 0.05, span) - 300
    const cy = 70 + hash(c) * 110
    for (let j = 0; j < 5; j++) {
      const r = 26 + hash(c * 7 + j) * 26
      const ox = j * 44 - 90
      const oy = Math.sin(j * 1.3) * 12
      ctx.fillStyle = 'rgba(22,13,44,0.88)'
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, 0, TAU); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx + ox, cy + oy, r, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke()
    }
  }
}

function drawMountains(ctx, w, x) {
  const P = 520
  const pts = [[0, 0], [60, -120], [130, -40], [210, -150], [300, -60], [390, -130], [520, -30]]
  ctx.fillStyle = '#150d30'
  for (let k = -1; k < w / P + 2; k++) {
    const ox = k * P - wrap(x * 0.08, P)
    ctx.beginPath()
    ctx.moveTo(ox, GROUND_Y)
    for (const [px, py] of pts) ctx.lineTo(ox + px, GROUND_Y - 20 + py)
    ctx.lineTo(ox + P, GROUND_Y)
    ctx.fill()
  }
}

function drawMid(ctx, w, x, lvl) {
  const sc = x * 0.32
  const first = Math.floor(sc / 300)
  for (let j = -1; j < w / 300 + 2; j++) {
    const idx = first + j
    const sx = idx * 300 - sc
    const r = hash(idx)
    ctx.fillStyle = '#0b0720'
    if (lvl.city) {
      const bw = 60 + r * 50, bh = 90 + hash(idx + 9) * 170
      ctx.fillRect(sx, GROUND_Y - bh, bw, bh)
      for (let wy = GROUND_Y - bh + 14; wy < GROUND_Y - 14; wy += 20) {
        for (let wx = sx + 10; wx < sx + bw - 10; wx += 16) {
          if (hash(idx * 31 + wx + wy) > 0.55) {
            ctx.fillStyle = hash(wx + wy) > 0.5 ? lvl.accent : '#f5a623'
            ctx.globalAlpha = 0.8
            ctx.fillRect(wx, wy, 6, 8)
            ctx.globalAlpha = 1
          }
        }
      }
    } else if (r < 0.3) {
      const bx = sx + 60
      ctx.fillRect(bx, GROUND_Y - 70, 26, 70)
      for (let t = 0; t < 2; t++) {
        const ty = GROUND_Y - 70 - t * 26
        ctx.beginPath()
        ctx.moveTo(bx - 14, ty); ctx.lineTo(bx + 13, ty - 22); ctx.lineTo(bx + 40, ty)
        ctx.fill()
      }
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(bx + 10, GROUND_Y - 50, 6, 6)
    } else {
      const bx = sx + 40
      for (let t = 0; t < 3; t++) {
        const tw = 64 - t * 14, ty = GROUND_Y - 30 - t * 34
        ctx.beginPath()
        ctx.moveTo(bx - tw / 2, ty); ctx.lineTo(bx, ty - 52); ctx.lineTo(bx + tw / 2, ty)
        ctx.fill()
      }
      if (r > 0.75) {
        ctx.fillRect(sx + 150, GROUND_Y - 34, 46, 34)
        ctx.fillStyle = '#f5a623'
        ctx.fillRect(sx + 160, GROUND_Y - 24, 8, 8)
        ctx.fillRect(sx + 174, GROUND_Y - 24, 8, 8)
      }
    }
  }
}

function drawGround(ctx, w, h, eng, lvl) {
  const gaps = eng.obstacles.filter((o) => o.type === 'chasm').sort((a, b) => a.x - b.x)
  const segs = []
  let cur = -60
  for (const g of gaps) { segs.push([cur, g.x]); cur = g.x + g.w }
  segs.push([cur, w + 60])

  for (const g of gaps) {
    const abyss = ctx.createLinearGradient(0, GROUND_Y, 0, h)
    abyss.addColorStop(0, rgba(lvl.accent, 0.35))
    abyss.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = abyss
    ctx.fillRect(g.x, GROUND_Y, g.w, h - GROUND_Y)
  }

  ctx.fillStyle = '#05040b'
  for (const [a, b] of segs) if (b > a) ctx.fillRect(a, GROUND_Y, b - a, h - GROUND_Y)

  ctx.strokeStyle = rgba(lvl.accent, 0.12)
  ctx.lineWidth = 1
  const off = wrap(eng.x * 0.9, 70)
  for (const [a, b] of segs) {
    if (b <= a) continue
    ctx.save()
    ctx.beginPath(); ctx.rect(a, GROUND_Y, b - a, h - GROUND_Y); ctx.clip()
    for (let gx = -70; gx < w + 140; gx += 70) {
      const lx = gx - off
      ctx.beginPath(); ctx.moveTo(lx, GROUND_Y); ctx.lineTo(lx - 30, h); ctx.stroke()
    }
    for (let gy = GROUND_Y + 22; gy < h; gy += 26) {
      ctx.beginPath(); ctx.moveTo(a, gy); ctx.lineTo(b, gy); ctx.stroke()
    }
    ctx.restore()
  }

  ctx.strokeStyle = lvl.accent
  ctx.lineWidth = 3
  ctx.shadowColor = lvl.accent
  ctx.shadowBlur = 14
  for (const [a, b] of segs) {
    if (b <= a) continue
    ctx.beginPath(); ctx.moveTo(a, GROUND_Y); ctx.lineTo(b, GROUND_Y); ctx.stroke()
  }
  for (const g of gaps) {
    ctx.beginPath(); ctx.moveTo(g.x, GROUND_Y); ctx.lineTo(g.x, h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(g.x + g.w, GROUND_Y); ctx.lineTo(g.x + g.w, h); ctx.stroke()
  }
  ctx.shadowBlur = 0
  ctx.fillStyle = rgba(lvl.accent, 0.8)
  const doff = wrap(eng.x, 44)
  for (let dx = -44; dx < w + 44; dx += 44) {
    const px = dx - doff
    if (!gaps.some((g) => px > g.x - 2 && px < g.x + g.w + 2)) ctx.fillRect(px, GROUND_Y + 10, 3, 3)
  }
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
  const lvl = LEVELS[eng.level]
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  drawSky(ctx, w, h, lvl, dt, clock)
  drawMoon(ctx, w, lvl)
  drawClouds(ctx, w, eng.x)
  drawMountains(ctx, w, eng.x)
  drawMid(ctx, w, eng.x, lvl)
  drawGround(ctx, w, h, eng, lvl)
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
