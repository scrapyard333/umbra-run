import { BIOMES } from './biomes.js'
import { GROUND_Y } from './engine.js'

const TAU = Math.PI * 2
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
const wrap = (v, m) => ((v % m) + m) % m
const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const rgba = (hex, a) => { const [r, g, b] = toRgb(hex); return `rgba(${r},${g},${b},${a})` }
const mix = (a, b, t) => {
  const A = toRgb(a), B = toRgb(b)
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
const STARS = Array.from({ length: 130 }, (_, i) => ({
  x: hash(i), y: hash(i + 200) * 0.62, s: 0.6 + hash(i + 400) * 1.6, p: hash(i + 600) * TAU,
}))

function drawSky(ctx, w, h, A, B, t, clock) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, mix(A.sky[0], B.sky[0], t))
  g.addColorStop(0.6, mix(A.sky[1], B.sky[1], t))
  g.addColorStop(1, mix(A.sky[2], B.sky[2], t))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
  const sa = A.stars * (1 - t) + B.stars * t
  if (sa > 0.02) {
    ctx.fillStyle = '#fff'
    for (const s of STARS) {
      ctx.globalAlpha = sa * (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(clock * 1.6 + s.p)))
      ctx.fillRect(s.x * w, s.y * h, s.s, s.s)
    }
    ctx.globalAlpha = 1
  }
}

function drawAurora(ctx, w, alpha, clock) {
  if (alpha < 0.01) return
  ctx.save()
  ctx.globalAlpha = alpha
  for (let k = 0; k < 3; k++) {
    const g = ctx.createLinearGradient(0, 40, 0, 260)
    g.addColorStop(0, 'rgba(74,222,128,0)')
    g.addColorStop(0.5, k % 2 ? 'rgba(56,189,248,0.22)' : 'rgba(74,222,128,0.2)')
    g.addColorStop(1, 'rgba(74,222,128,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 60 + k * 30)
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, 80 + k * 34 + Math.sin(x * 0.006 + clock * 0.5 + k) * 28)
    for (let x = w; x >= 0; x -= 20) ctx.lineTo(x, 190 + k * 34 + Math.sin(x * 0.005 + clock * 0.4 + k * 2) * 34)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()
}

function drawBody(ctx, w, b, alpha) {
  if (alpha < 0.01) return
  const mx = w * b.x, my = b.y, r = b.r
  ctx.save()
  ctx.globalAlpha = alpha
  if (b.beam) {
    const beam = ctx.createLinearGradient(0, my, 0, GROUND_Y)
    beam.addColorStop(0, rgba(b.halo, 0.3 * (b.beamW ?? 1)))
    beam.addColorStop(1, rgba(b.halo, 0))
    ctx.fillStyle = beam
    ctx.beginPath()
    ctx.moveTo(mx - 30, my + 30); ctx.lineTo(mx + 30, my + 30)
    ctx.lineTo(mx + w * 0.16, GROUND_Y); ctx.lineTo(mx - w * 0.16, GROUND_Y)
    ctx.fill()
  }
  const glow = ctx.createRadialGradient(mx, my, r * 0.6, mx, my, r * 2.4)
  glow.addColorStop(0, rgba(b.halo, b.kind === 'sun' ? 0.7 : 0.55))
  glow.addColorStop(1, rgba(b.halo, 0))
  ctx.fillStyle = glow
  ctx.beginPath(); ctx.arc(mx, my, r * 2.4, 0, TAU); ctx.fill()
  const disc = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, 4, mx, my, r)
  disc.addColorStop(0, '#ffffff')
  disc.addColorStop(1, b.color)
  ctx.fillStyle = disc
  ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill()
  if (b.kind === 'moon') {
    ctx.fillStyle = 'rgba(70,45,120,0.3)'
    for (const [dx, dy, cr] of [[-0.27, -0.17, 0.19], [0.24, 0.14, 0.26], [-0.1, 0.38, 0.12], [0.38, -0.38, 0.1]]) {
      ctx.beginPath(); ctx.arc(mx + dx * r, my + dy * r, cr * r, 0, TAU); ctx.fill()
    }
  }
  ctx.restore()
}

function blendBody(a, b, t) {
  const l = (x, y) => x + (y - x) * t
  return {
    kind: t < 0.5 ? a.kind : b.kind,
    color: mix(a.color, b.color, t), halo: mix(a.halo, b.halo, t),
    x: l(a.x, b.x), y: l(a.y, b.y), r: l(a.r, b.r),
    beam: a.beam || b.beam, beamW: l(a.beam ? 1 : 0, b.beam ? 1 : 0),
  }
}

function farLayer(ctx, kind, w, x, color, accent) {
  ctx.fillStyle = color
  if (kind === 'hills' || kind === 'dunes') {
    const sc = x * (kind === 'dunes' ? 0.06 : 0.08)
    const f1 = kind === 'dunes' ? 0.0025 : 0.004
    const a1 = kind === 'dunes' ? 42 : 28
    for (const [lift, par, tone] of [[0, 1, 1], [-16, 1.5, 0.6]]) {
      ctx.globalAlpha *= tone
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y)
      for (let px = 0; px <= w + 10; px += 10) {
        const u = px + sc * par
        ctx.lineTo(px, GROUND_Y - 44 + lift - (Math.sin(u * f1) * a1 + Math.sin(u * f1 * 2.7 + 1.3) * a1 * 0.45 + a1 * 0.6))
      }
      ctx.lineTo(w, GROUND_Y); ctx.fill()
      ctx.globalAlpha /= tone
    }
  } else if (kind === 'ice') {
    const P = 520, sc = wrap(x * 0.08, P)
    const pts = [[0, 0], [70, -150], [140, -50], [230, -210], [320, -70], [410, -170], [520, -40]]
    for (let k = -1; k < w / P + 2; k++) {
      const ox = k * P - sc
      ctx.fillStyle = color
      ctx.beginPath(); ctx.moveTo(ox, GROUND_Y)
      for (const [px, py] of pts) ctx.lineTo(ox + px, GROUND_Y - 20 + py)
      ctx.lineTo(ox + P, GROUND_Y); ctx.fill()
      ctx.fillStyle = 'rgba(190,225,255,0.55)'
      for (const [px, py] of [pts[1], pts[3], pts[5]]) {
        ctx.beginPath()
        ctx.moveTo(ox + px, GROUND_Y - 20 + py); ctx.lineTo(ox + px - 26, GROUND_Y - 20 + py + 48); ctx.lineTo(ox + px + 30, GROUND_Y - 20 + py + 52)
        ctx.fill()
      }
    }
  } else if (kind === 'skyline') {
    const sc = x * 0.1, first = Math.floor(sc / 60)
    for (let j = -1; j < w / 60 + 2; j++) {
      const idx = first + j, sx = idx * 60 - sc
      const bh = 70 + hash(idx * 3) * 130
      ctx.fillStyle = color
      ctx.fillRect(sx, GROUND_Y - bh, 44 + hash(idx) * 16, bh)
      if (hash(idx + 5) > 0.7) { ctx.fillStyle = rgba(accent, 0.5); ctx.fillRect(sx + 6, GROUND_Y - bh + 10, 4, 6) }
    }
  } else if (kind === 'volcano') {
    const P = 760, sc = wrap(x * 0.07, P)
    for (let k = -1; k < w / P + 2; k++) {
      const ox = k * P - sc
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(ox, GROUND_Y); ctx.lineTo(ox + 260, GROUND_Y - 190); ctx.lineTo(ox + 330, GROUND_Y - 190); ctx.lineTo(ox + 600, GROUND_Y)
      ctx.fill()
      const g = ctx.createRadialGradient(ox + 295, GROUND_Y - 195, 2, ox + 295, GROUND_Y - 195, 110)
      g.addColorStop(0, rgba(accent, 0.7)); g.addColorStop(1, rgba(accent, 0))
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(ox + 295, GROUND_Y - 195, 110, 0, TAU); ctx.fill()
      ctx.strokeStyle = rgba(accent, 0.55); ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(ox + 305, GROUND_Y - 190); ctx.quadraticCurveTo(ox + 340, GROUND_Y - 110, ox + 330, GROUND_Y - 30); ctx.stroke()
    }
  }
}

function midItem(ctx, kind, sx, r, idx, accent) {
  const g = GROUND_Y
  if (kind === 'sakura') {
    const x = sx + 60, h = 70 + r * 40
    ctx.strokeStyle = '#1d0b1a'; ctx.lineWidth = 8
    ctx.beginPath(); ctx.moveTo(x, g); ctx.lineTo(x, g - h); ctx.stroke()
    ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(x, g - h * 0.6); ctx.lineTo(x - 30, g - h * 0.92); ctx.moveTo(x, g - h * 0.7); ctx.lineTo(x + 32, g - h * 0.96); ctx.stroke()
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#c93a85' : '#f472b6'
      ctx.beginPath(); ctx.arc(x + (hash(idx * 9 + i) - 0.5) * 100, g - h - 6 + (hash(idx * 9 + i + 40) - 0.5) * 44, 20 + hash(idx + i) * 18, 0, TAU); ctx.fill()
    }
    if (r < 0.2) {
      const tx = sx + 190
      ctx.fillStyle = '#5b0f1e'
      ctx.fillRect(tx, g - 96, 9, 96); ctx.fillRect(tx + 54, g - 96, 9, 96)
      ctx.fillRect(tx - 12, g - 108, 87, 10); ctx.fillRect(tx - 4, g - 88, 71, 6)
    }
  } else if (kind === 'desert') {
    const x = sx + 80, h = 60 + r * 50
    ctx.fillStyle = '#160b07'
    ctx.beginPath(); ctx.roundRect(x - 6, g - h, 12, h, 6); ctx.fill()
    ctx.beginPath(); ctx.roundRect(x - 24, g - h * 0.62, 18, 8, 4); ctx.roundRect(x - 24, g - h * 0.62 - 26, 8, 34, 4); ctx.fill()
    ctx.beginPath(); ctx.roundRect(x + 6, g - h * 0.45, 18, 8, 4); ctx.roundRect(x + 16, g - h * 0.45 - 22, 8, 30, 4); ctx.fill()
    ctx.strokeStyle = rgba(accent, 0.4); ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(x + 5, g - h + 6); ctx.lineTo(x + 5, g - 4); ctx.stroke()
    if (r > 0.7) {
      ctx.fillStyle = '#1d0d0a'
      ctx.beginPath(); ctx.moveTo(sx + 150, g); ctx.lineTo(sx + 176, g - 92); ctx.lineTo(sx + 250, g - 92); ctx.lineTo(sx + 276, g); ctx.fill()
      ctx.strokeStyle = rgba(accent, 0.2); ctx.lineWidth = 2
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx + 160, g - i * 22); ctx.lineTo(sx + 266, g - i * 22); ctx.stroke() }
    }
  } else if (kind === 'forest') {
    const x = sx + 70, h = 150 + r * 70
    ctx.fillStyle = '#050f0b'
    ctx.fillRect(x - 6, g - h, 12, h)
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === 1 ? '#0d2f23' : '#0a2419'
      ctx.beginPath(); ctx.ellipse(x + (i - 1) * 24, g - h + 10 - (i === 1 ? 18 : 0), 40, 52, 0, 0, TAU); ctx.fill()
    }
    ctx.fillStyle = '#0a2419'
    ctx.beginPath(); ctx.ellipse(sx + 190, g - 10, 36, 16, 0, 0, TAU); ctx.fill()
  } else if (kind === 'snowpine') {
    const bx = sx + 50
    for (let t = 0; t < 3; t++) {
      const tw = 66 - t * 14, ty = g - 28 - t * 36
      ctx.fillStyle = '#0a1a34'
      ctx.beginPath(); ctx.moveTo(bx - tw / 2, ty); ctx.lineTo(bx, ty - 56); ctx.lineTo(bx + tw / 2, ty); ctx.fill()
      ctx.fillStyle = 'rgba(215,236,255,0.9)'
      ctx.beginPath(); ctx.moveTo(bx, ty - 56); ctx.lineTo(bx - tw * 0.2, ty - 56 + 22); ctx.lineTo(bx + tw * 0.2, ty - 56 + 22); ctx.fill()
    }
    if (r > 0.8) {
      ctx.fillStyle = 'rgba(165,225,255,0.5)'
      for (const [dx, hh] of [[150, 70], [166, 100], [184, 60]]) {
        ctx.beginPath(); ctx.moveTo(sx + dx, g); ctx.lineTo(sx + dx + 8, g - hh); ctx.lineTo(sx + dx + 16, g); ctx.fill()
      }
    }
  } else if (kind === 'city') {
    const bw = 60 + r * 50, bh = 90 + hash(idx + 9) * 170
    ctx.fillStyle = '#0b0720'
    ctx.fillRect(sx, g - bh, bw, bh)
    for (let wy = g - bh + 14; wy < g - 14; wy += 20) {
      for (let wx = sx + 10; wx < sx + bw - 10; wx += 16) {
        if (hash(idx * 31 + wx + wy) > 0.55) {
          ctx.fillStyle = hash(wx + wy) > 0.5 ? accent : '#f5a623'
          ctx.globalAlpha *= 0.8; ctx.fillRect(wx, wy, 6, 8); ctx.globalAlpha /= 0.8
        }
      }
    }
    if (hash(idx + 77) > 0.6) {
      ctx.fillStyle = rgba(accent, 0.9)
      ctx.shadowColor = accent; ctx.shadowBlur = 10
      ctx.fillRect(sx + bw - 8, g - bh + 30, 5, 44)
      ctx.shadowBlur = 0
    }
  } else if (kind === 'rocks') {
    const x = sx + 40
    ctx.fillStyle = '#14070a'
    ctx.beginPath()
    ctx.moveTo(x, g); ctx.lineTo(x + 8, g - 70 - r * 50); ctx.lineTo(x + 22, g - 30); ctx.lineTo(x + 38, g - 110 - r * 40)
    ctx.lineTo(x + 54, g - 40); ctx.lineTo(x + 70, g - 80); ctx.lineTo(x + 86, g)
    ctx.fill()
    ctx.strokeStyle = rgba(accent, 0.7); ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(x + 30, g - 8); ctx.lineTo(x + 36, g - 46); ctx.lineTo(x + 30, g - 80); ctx.stroke()
    const lg = ctx.createRadialGradient(x + 120, g, 2, x + 120, g, 70)
    lg.addColorStop(0, rgba(accent, 0.45)); lg.addColorStop(1, rgba(accent, 0))
    ctx.fillStyle = lg
    ctx.beginPath(); ctx.ellipse(x + 120, g, 70, 14, 0, 0, TAU); ctx.fill()
  }
}

function midLayer(ctx, kind, w, x, accent) {
  const sc = x * 0.32
  const first = Math.floor(sc / 300)
  for (let j = -1; j < w / 300 + 2; j++) {
    const idx = first + j
    midItem(ctx, kind, idx * 300 - sc, hash(idx), idx, accent)
  }
}

function drawGround(ctx, w, h, eng, accent, groundColor) {
  const gaps = eng.obstacles.filter((o) => o.type === 'chasm').sort((a, b) => a.x - b.x)
  const segs = []
  let cur = -60
  for (const g of gaps) { segs.push([cur, g.x]); cur = g.x + g.w }
  segs.push([cur, w + 60])

  for (const g of gaps) {
    const abyss = ctx.createLinearGradient(0, GROUND_Y, 0, h)
    abyss.addColorStop(0, rgba(accent, 0.35))
    abyss.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = abyss
    ctx.fillRect(g.x, GROUND_Y, g.w, h - GROUND_Y)
  }
  ctx.fillStyle = groundColor
  for (const [a, b] of segs) if (b > a) ctx.fillRect(a, GROUND_Y, b - a, h - GROUND_Y)

  ctx.strokeStyle = rgba(accent, 0.12)
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
  ctx.strokeStyle = accent
  ctx.lineWidth = 3
  ctx.shadowColor = accent
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
  ctx.fillStyle = rgba(accent, 0.8)
  const doff = wrap(eng.x, 44)
  for (let dx = -44; dx < w + 44; dx += 44) {
    const px = dx - doff
    if (!gaps.some((g) => px > g.x - 2 && px < g.x + g.w + 2)) ctx.fillRect(px, GROUND_Y + 10, 3, 3)
  }
}

const WX = {
  petals: { rate: 12, max: 60 },
  leaves: { rate: 9, max: 46 },
  fireflies: { rate: 0, max: 16 },
  dust: { rate: 26, max: 70 },
  snow: { rate: 70, max: 150 },
  rain: { rate: 90, max: 130 },
  embers: { rate: 30, max: 80 },
}
const LEAF_COLORS = ['#f59e0b', '#ea580c', '#b45309', '#facc15']

function spawnWx(type, w, h, scatter) {
  const R = Math.random
  const x = scatter ? R() * w : R() * (w + 240)
  const y = scatter ? R() * GROUND_Y : -12
  if (type === 'petals') return { x, y, vx: -40 - R() * 40, vy: 38 + R() * 40, s: 3 + R() * 3, rot: R() * TAU, vr: (R() - 0.5) * 5, ph: R() * TAU }
  if (type === 'leaves') return { x, y, vx: -30 - R() * 40, vy: 50 + R() * 50, s: 3 + R() * 3, rot: R() * TAU, vr: (R() - 0.5) * 6, ph: R() * TAU, c: LEAF_COLORS[(R() * 4) | 0] }
  if (type === 'fireflies') return { x: R() * w, y: GROUND_Y - 30 - R() * 230, vx: 0, vy: 0, s: 2 + R() * 1.5, ph: R() * TAU, a: R() * TAU }
  if (type === 'dust') return { x: scatter ? R() * w : w + 20, y: 80 + R() * (GROUND_Y - 100), vx: -160 - R() * 160, vy: (R() - 0.5) * 8, s: 14 + R() * 40, ph: 0 }
  if (type === 'snow') return { x, y, vx: -20 - R() * 40, vy: 50 + R() * 90, s: 1.4 + R() * 2.2, ph: R() * TAU }
  if (type === 'rain') return { x: R() * (w + 300), y: scatter ? R() * GROUND_Y : -20, vx: -150, vy: 640 + R() * 160, s: 10 + R() * 8, ph: 0 }
  return { x: R() * w, y: scatter ? GROUND_Y - R() * 260 : GROUND_Y + 4, vx: -20 - R() * 40, vy: -30 - R() * 80, s: 1 + R() * 2.2, ph: R() * TAU }
}

function weather(ctx, eng, w, h, dt, clock, A, B, t, q) {
  const pools = eng._wx || (eng._wx = {})
  const speed = eng.speed * eng.timeScale
  const weightOf = (type) => (A.weather.includes(type) ? 1 - t : 0) + (B.weather.includes(type) ? t : 0)
  for (const type of Object.keys(WX)) {
    const wt = weightOf(type)
    const pool = pools[type] || (pools[type] = { list: [], acc: 0, init: false })
    if (wt < 0.02 && !pool.list.length) continue
    if (wt < 0.02) { pool.list.length = 0; continue }
    const cfg = WX[type]
    const max = Math.max(4, Math.floor(cfg.max * q))
    if (!pool.init) { for (let i = 0; i < max * 0.8; i++) pool.list.push(spawnWx(type, w, h, true)); pool.init = true }
    pool.acc += cfg.rate * wt * q * dt
    while (pool.acc >= 1) { pool.acc -= 1; if (pool.list.length < max) pool.list.push(spawnWx(type, w, h, false)) }
    for (let i = pool.list.length - 1; i >= 0; i--) {
      const p = pool.list[i]
      if (type === 'fireflies') {
        p.a += (Math.sin(clock + p.ph) * 1.2) * dt
        p.x += Math.cos(p.a) * 22 * dt - speed * 0.04 * dt
        p.y += Math.sin(p.a) * 14 * dt
        if (p.x < -20) p.x = w + 10
      } else {
        const sway = type === 'petals' || type === 'leaves' || type === 'snow' ? Math.sin(clock * 2 + p.ph) * 22 : 0
        const wind = type === 'rain' ? 0.12 : type === 'dust' ? 0.5 : 0.25
        p.x += (p.vx - speed * wind + sway) * dt
        p.y += p.vy * dt
        if (p.rot !== undefined) p.rot += p.vr * dt
        const floorY = type === 'rain' ? GROUND_Y + 6 : h + 10
        if (p.x < -60 || p.y > floorY || p.y < -40) { pool.list.splice(i, 1); continue }
      }
      draw1(ctx, type, p, wt, clock)
    }
  }
}

function draw1(ctx, type, p, wt, clock) {
  if (type === 'petals' || type === 'leaves') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot)
    ctx.globalAlpha = 0.85 * wt
    ctx.fillStyle = type === 'petals' ? '#f9a8d4' : p.c
    ctx.beginPath(); ctx.ellipse(0, 0, p.s * 1.4, p.s * 0.8, 0, 0, TAU); ctx.fill()
    ctx.restore()
  } else if (type === 'fireflies') {
    const a = (0.5 + 0.5 * Math.sin(clock * 2.2 + p.ph)) * wt
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10)
    g.addColorStop(0, `rgba(253,224,71,${0.9 * a})`); g.addColorStop(1, 'rgba(253,224,71,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(p.x, p.y, 10, 0, TAU); ctx.fill()
  } else if (type === 'dust') {
    ctx.globalAlpha = 0.22 * wt
    ctx.strokeStyle = '#fcd9a8'; ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.s, p.y + 1); ctx.stroke()
  } else if (type === 'snow') {
    ctx.globalAlpha = 0.85 * wt
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill()
  } else if (type === 'rain') {
    ctx.globalAlpha = 0.32 * wt
    ctx.strokeStyle = '#9bdcff'; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 2.5, p.y - p.s); ctx.stroke()
  } else {
    ctx.globalAlpha = (0.5 + 0.5 * Math.sin(clock * 9 + p.ph)) * wt
    ctx.fillStyle = '#fb923c'
    ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, TAU); ctx.fill()
  }
  ctx.globalAlpha = 1
}

export function drawWorld(ctx, eng, w, h, dt, clock, q = 1) {
  if (eng.time === 0 && eng._wx) eng._wx = null
  const bp = eng.biome
  const A = BIOMES[bp.a], B = BIOMES[bp.b], t = bp.t
  const accent = mix(A.accent, B.accent, t)
  drawSky(ctx, w, h, A, B, t, clock)
  drawAurora(ctx, w, (A.body.aurora ? 1 - t : 0) + (B.body.aurora ? t : 0), clock)
  if (A.body.kind === B.body.kind) {
    drawBody(ctx, w, blendBody(A.body, B.body, t), 1)
  } else {
    drawBody(ctx, w, A.body, 1 - t)
    drawBody(ctx, w, B.body, t)
  }

  for (const [bio, wt] of [[A, 1 - t], [B, t]]) {
    if (wt < 0.01) continue
    ctx.globalAlpha = wt
    farLayer(ctx, bio.far, w, eng.x, bio.farColor, bio.accent)
    midLayer(ctx, bio.mid, w, eng.x, bio.accent)
    ctx.globalAlpha = 1
  }
  for (const [bio, wt] of [[A, 1 - t], [B, t]]) {
    if (wt < 0.01) continue
    const fg = ctx.createLinearGradient(0, GROUND_Y - 140, 0, GROUND_Y)
    fg.addColorStop(0, rgba(bio.fog, 0))
    fg.addColorStop(1, rgba(bio.fog, 0.16 * wt))
    ctx.fillStyle = fg
    ctx.fillRect(0, GROUND_Y - 140, w, 140)
  }
  drawGround(ctx, w, h, eng, accent, mix(A.ground, B.ground, t))
  weather(ctx, eng, w, h, dt, clock, A, B, t, q)
  return { accent }
}
