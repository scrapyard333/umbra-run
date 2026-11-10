const TAU = Math.PI * 2

function ik(hx, hy, fx, fy, l1, l2, dir) {
  const dx = fx - hx
  const dy = fy - hy
  const dist = Math.hypot(dx, dy) || 0.0001
  const ux = dx / dist
  const uy = dy / dist
  const d = Math.min(dist, l1 + l2 - 0.01)
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a))
  return {
    kx: hx + ux * a - uy * h * dir,
    ky: hy + uy * a + ux * h * dir,
    ex: hx + ux * d,
    ey: hy + uy * d,
  }
}

function rig(pose) {
  const { time, speed, air, sliding } = pose
  const ph = time * 16 * (speed / 420)
  const bob = air || sliding ? 0 : -Math.abs(Math.sin(ph)) * 1.6
  const lean = sliding ? -1.25 : 0
  const sx = sliding ? 2 : 0
  const pivotY = -20 + bob + (sliding ? 12 : 0)
  const cl = Math.cos(lean)
  const sl = Math.sin(lean)

  const at = (x, y) => {
    const dy = y + 20
    return { x: sx + x * cl - dy * sl, y: pivotY + x * sl + dy * cl }
  }
  const body = (ctx, fn) => {
    ctx.save()
    ctx.translate(sx, pivotY)
    ctx.rotate(lean)
    ctx.translate(0, 20)
    fn()
    ctx.restore()
  }

  const hip = at(0, -20)
  const sh = at(0, -40)
  const limb = (k) => {
    const a = ph + k * Math.PI
    if (sliding) return { foot: { x: k ? 17 : 24, y: k ? -1 : -3 }, hand: { x: sh.x - (k ? 12 : 9), y: k ? -5 : -9 } }
    if (air) return { foot: { x: k ? 11 : -9, y: k ? -9 : -4 }, hand: { x: k ? 14 : -12, y: k ? -52 : -49 } }
    return {
      foot: { x: Math.sin(a) * 14, y: -Math.max(0, Math.cos(a)) * 9 },
      hand: { x: -Math.sin(a) * 13 + 3, y: -24 - Math.abs(Math.cos(a)) * 4 + bob },
    }
  }
  return { ph, bob, hip, sh, at, body, back: limb(1), front: limb(0) }
}

function stroke2(ctx, pts, outline, fill, wOut, wIn) {
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const [col, w] of [[outline, wOut], [fill, wIn]]) {
    ctx.strokeStyle = col
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
    ctx.stroke()
  }
}

function leg(ctx, r, side, c, wOut = 10, wIn = 7) {
  const k = ik(r.hip.x, r.hip.y, side.foot.x, side.foot.y, 11, 11, -1)
  stroke2(ctx, [[r.hip.x, r.hip.y], [k.kx, k.ky], [k.ex, k.ey]], c.accent, c.body, wOut, wIn)
  return k
}

function arm(ctx, r, side, c, wOut = 8, wIn = 5) {
  const k = ik(r.sh.x, r.sh.y, side.hand.x, side.hand.y, 11, 11, 1)
  stroke2(ctx, [[r.sh.x, r.sh.y], [k.kx, k.ky], [k.ex, k.ey]], c.accent, c.body, wOut, wIn)
  return k
}

function glow(ctx, x, y, rad, color, alpha = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rad)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = alpha
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill()
  ctx.globalAlpha = 1
}

const floor = (pts) => pts.map(([x, y]) => [x, Math.min(y, -1)])

function poly(ctx, pts, fill, line, lw = 2) {
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  if (fill) { ctx.fillStyle = fill; ctx.fill() }
  if (line) { ctx.strokeStyle = line; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.stroke() }
}

function shinobi(ctx, r, p, c) {
  const f = Math.sin(p.time * 12)
  const s1 = r.at(-5, -47)
  const s2 = r.at(-5, -45)
  ctx.strokeStyle = c.accent
  ctx.lineCap = 'round'
  ctx.globalAlpha = 0.85
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo(s1.x - 21, s1.y + f * 8, s1.x - 41 - p.speed * 0.03, s1.y + 6 + Math.sin(p.time * 12 + 1) * 10); ctx.stroke()
  ctx.lineWidth = 2.5
  ctx.beginPath(); ctx.moveTo(s2.x, s2.y); ctx.quadraticCurveTo(s2.x - 17, s2.y + 3 + f * 6, s2.x - 33 - p.speed * 0.02, s2.y + 12 + Math.sin(p.time * 12 + 2) * 8); ctx.stroke()
  ctx.globalAlpha = 1

  arm(ctx, r, r.back, c)
  leg(ctx, r, r.back, c)

  r.body(ctx, () => {
    poly(ctx, [[-9, -42], [9, -42], [6, -19], [-6, -19]], c.body, c.accent)
    ctx.fillStyle = c.accent
    ctx.fillRect(-7, -28, 14, 5)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-6, -25); ctx.lineTo(-13, -22 + f * 3); ctx.stroke()

    ctx.strokeStyle = '#3b2d66'
    ctx.lineWidth = 4.5
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(-9, -58); ctx.stroke()
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(-9, -58); ctx.stroke()
    ctx.fillStyle = '#e9d5ff'
    ctx.fillRect(-12, -63, 5, 7)
    ctx.fillStyle = c.accent
    ctx.beginPath(); ctx.arc(-7, -55, 2.4, 0, TAU); ctx.fill()

    poly(ctx, [[-7, -55], [-21, -43 + f * 3], [-9, -43]], c.body, c.accent, 1.5)
    ctx.fillStyle = c.body
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, -52, 9.5, 0, TAU); ctx.fill(); ctx.stroke()
    glow(ctx, 5, -52, 9, c.accent, 0.5)
    ctx.fillStyle = c.accent
    ctx.fillRect(-1, -54, 11, 3.5)
  })

  leg(ctx, r, r.front, c)
  arm(ctx, r, r.front, c)
}

function cyber(ctx, r, p, c) {
  const f = Math.sin(p.time * 10)
  ctx.strokeStyle = c.accent
  ctx.lineWidth = 1.5
  ctx.globalAlpha = 0.5
  for (let i = 0; i < 3; i++) {
    const a = r.at(-6, -44 + i * 7)
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(a.x - 34 - i * 10 - p.speed * 0.04, a.y + f * (2 - i))
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  arm(ctx, r, r.back, c, 8, 5)
  leg(ctx, r, r.back, c, 11, 8)

  r.body(ctx, () => {
    poly(ctx, [[-10, -43], [10, -43], [8, -30], [5, -19], [-5, -19], [-8, -30]], c.body, c.accent)
    glow(ctx, 0, -32, 11, c.accent, 0.8)
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(0, -32, 2.4, 0, TAU); ctx.fill()
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(6, -24); ctx.stroke()
    poly(ctx, [[-4, -47], [7, -47], [10, -41], [-4, -40]], c.body, c.accent, 1.5)

    ctx.fillStyle = c.body
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.roundRect(-8.5, -62, 18, 16, 6); ctx.fill(); ctx.stroke()
    poly(ctx, [[-8, -58], [-16, -68 + f * 1.5], [-4, -54]], c.accent, null)
    glow(ctx, 5, -55, 10, c.accent, 0.55)
    ctx.fillStyle = c.accent
    ctx.beginPath(); ctx.roundRect(-1, -58, 10.5, 6, 3); ctx.fill()
  })

  const k = leg(ctx, r, r.front, c, 11, 8)
  ctx.strokeStyle = c.accent
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(k.ex - 5, k.ey + 4); ctx.lineTo(k.ex + 7, k.ey + 4); ctx.stroke()

  const a = arm(ctx, r, r.front, c, 8, 5)
  ctx.shadowColor = c.accent
  ctx.shadowBlur = 8
  ctx.lineWidth = 3
  ctx.beginPath(); ctx.moveTo(a.ex, a.ey); ctx.lineTo(a.ex + (a.ex - a.kx) * 1.7, a.ey + (a.ey - a.ky) * 1.7); ctx.stroke()
  ctx.shadowBlur = 0
}

function oni(ctx, r, p, c) {
  const t = p.time
  const fl = (i) => Math.sin(t * 14 + i * 1.7)
  const tail = 44 + p.speed * 0.03
  const T = r.at(-6, -42)
  poly(ctx, floor([
    [T.x, T.y], [T.x - 12, T.y - 4 + fl(0) * 4], [T.x - tail * 0.7 + 6, T.y + fl(1) * 6],
    [T.x - tail + 6, T.y + 8 + fl(2) * 7], [T.x - tail * 0.7 + 6, T.y + 14 + fl(3) * 5],
    [T.x - 10, T.y + 18], [T.x, T.y + 20],
  ]), '#ea580c', null)
  poly(ctx, floor([
    [T.x, T.y + 2], [T.x - 10, T.y + fl(1) * 3], [T.x - tail * 0.5 + 6, T.y + 5 + fl(2) * 4],
    [T.x - tail * 0.72 + 6, T.y + 10 + fl(0) * 5], [T.x - tail * 0.5 + 6, T.y + 14 + fl(3) * 3], [T.x - 8, T.y + 17],
  ]), '#fbbf24', null)

  arm(ctx, r, r.back, c)
  leg(ctx, r, r.back, c)

  r.body(ctx, () => {
    poly(ctx, [[-11, -43], [11, -43], [7, -19], [-7, -19]], c.body, c.accent)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(-5, -40); ctx.lineTo(5, -25); ctx.stroke()
    poly(ctx, [[-9, -43], [-13, -53], [-3, -44]], c.accent, null)
    poly(ctx, [[2, -44], [8, -54], [11, -43]], c.accent, null)

    ctx.fillStyle = c.body
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, -52, 9.5, 0, TAU); ctx.fill(); ctx.stroke()
    poly(ctx, [[-7, -59], [-10, -72], [-1, -60]], c.accent, null)
    poly(ctx, [[2, -60], [8, -71], [8, -58]], c.accent, null)
    glow(ctx, 4, -53, 7, '#fde047', 0.7)
    poly(ctx, [[1, -54], [8, -55.5], [8, -52.5], [1, -52]], '#fde68a', null)
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(2, -47); ctx.lineTo(8, -47); ctx.stroke()
  })

  leg(ctx, r, r.front, c)
  const a = arm(ctx, r, r.front, c)
  glow(ctx, a.ex, a.ey, 9, '#fb923c', 0.9)
}

function royal(ctx, r, p, c) {
  const t = p.time
  const fl = (i) => Math.sin(t * 9 + i * 1.3)
  const mid = r.at(0, -34)
  glow(ctx, mid.x, mid.y, 46, c.accent, 0.28)
  const len = 36 + p.speed * 0.02
  const T = r.at(-5, -42)
  poly(ctx, floor([
    [T.x, T.y], [T.x - len * 0.5 + 5, T.y + fl(0) * 4], [T.x - len + 5, T.y + 12 + fl(1) * 6],
    [T.x - len * 0.85 + 5, T.y + 28 + fl(2) * 5], [T.x - 5, T.y + 24],
  ]), '#7c1d1d', c.accent, 1.5)

  arm(ctx, r, r.back, c)
  leg(ctx, r, r.back, c)

  r.body(ctx, () => {
    poly(ctx, [[-11, -43], [11, -43], [7, -19], [-7, -19]], c.body, c.accent)
    poly(ctx, [[-7, -41], [7, -41], [5, -29], [0, -25], [-5, -29]], c.accent, null)
    ctx.fillStyle = c.accent
    ctx.fillRect(-7.5, -23.5, 15, 3.5)
    ctx.beginPath(); ctx.arc(0, -42, 5.5, 0, TAU); ctx.fill()

    ctx.strokeStyle = c.accent
    ctx.globalAlpha = 0.6
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, -52, 15, 0, TAU); ctx.stroke()
    ctx.globalAlpha = 1

    ctx.fillStyle = c.body
    ctx.strokeStyle = c.accent
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(0, -52, 9.5, 0, TAU); ctx.fill(); ctx.stroke()
    ctx.fillStyle = c.accent
    ctx.fillRect(-1, -54, 11, 3)
    poly(ctx, [[-8, -59], [-8, -68], [-4, -63], [0, -70], [4, -63], [8, -68], [8, -59]], c.accent, '#fff6c4', 1)
  })

  const k = leg(ctx, r, r.front, c)
  ctx.fillStyle = c.accent
  ctx.beginPath(); ctx.arc(k.ex, k.ey, 4.5, 0, TAU); ctx.fill()
  const a = arm(ctx, r, r.front, c)
  ctx.beginPath(); ctx.arc(a.ex, a.ey, 4.5, 0, TAU); ctx.fill()
}

function kunai(ctx, x, y, dx, dy) {
  const L = Math.hypot(dx, dy) || 1
  const ux = dx / L, uy = dy / L
  ctx.fillStyle = '#A6A9B0'
  ctx.beginPath()
  ctx.moveTo(x + ux * 9, y + uy * 9)
  ctx.lineTo(x - uy * 1.7, y + ux * 1.7)
  ctx.lineTo(x + uy * 1.7, y - ux * 1.7)
  ctx.closePath(); ctx.fill()
  ctx.strokeStyle = '#454950'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.arc(x - ux * 1.6, y - uy * 1.6, 1.5, 0, TAU); ctx.stroke()
}

function kysora(ctx, r, p, c) {
  const BLK = '#111214', CHR = '#292B30', GUN = '#454950', SIL = '#A6A9B0', STL = '#737984'
  const cc = { accent: '#3b3e46', body: BLK }
  const f = Math.sin(p.time * 9)
  const T = r.at(-4, -43)
  const len = 34 + p.speed * 0.02

  poly(ctx, floor([
    [T.x, T.y], [T.x - 10, T.y - 2 + f * 2], [T.x - len * 0.55, T.y + 3 + f * 3], [T.x - len, T.y + 10 + f * 5],
    [T.x - len * 0.85, T.y + 22 + f * 4], [T.x - len * 0.5, T.y + 28 + f * 3], [T.x - 12, T.y + 22], [T.x - 3, T.y + 16],
  ]), '#17181c', '#454950', 1)
  ctx.strokeStyle = 'rgba(115,121,132,0.35)'
  ctx.lineWidth = 1
  for (const k of [0.3, 0.55, 0.8]) {
    ctx.beginPath()
    ctx.moveTo(T.x - 6, T.y + 6 + k * 14)
    ctx.quadraticCurveTo(T.x - len * 0.5, T.y + 6 + k * 12 + f * 3, T.x - len * (0.5 + k * 0.4), Math.min(-1, T.y + 10 + k * 16 + f * 4))
    ctx.stroke()
  }

  const armGuard = (side) => {
    const a = arm(ctx, r, side, cc, 8, 6)
    const sx = a.kx + (a.ex - a.kx) * 0.15, sy = a.ky + (a.ey - a.ky) * 0.15
    const ex = a.kx + (a.ex - a.kx) * 0.82, ey = a.ky + (a.ey - a.ky) * 0.82
    stroke2(ctx, [[sx, sy], [ex, ey]], SIL, GUN, 7, 5)
    ctx.fillStyle = BLK; ctx.strokeStyle = '#454950'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(a.ex, a.ey, 3.2, 0, TAU); ctx.fill(); ctx.stroke()
    return a
  }
  const legGuard = (side, daggers) => {
    const k = leg(ctx, r, side, cc, 10, 8)
    const sx = k.kx + (k.ex - k.kx) * 0.12, sy = k.ky + (k.ey - k.ky) * 0.12
    const ex = k.kx + (k.ex - k.kx) * 0.84, ey = k.ky + (k.ey - k.ky) * 0.84
    stroke2(ctx, [[sx, sy], [ex, ey]], STL, GUN, 8, 6)
    ctx.fillStyle = GUN; ctx.strokeStyle = SIL; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(k.kx - 3.6, k.ky - 3.6, 7.2, 7.2, 2.5); ctx.fill(); ctx.stroke()
    ctx.fillStyle = BLK; ctx.strokeStyle = '#454950'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(k.ex + 2, k.ey + 0.5, 5.2, 2.8, 0, 0, TAU); ctx.fill(); ctx.stroke()
    if (daggers) {
      const dx = k.kx - r.hip.x, dy = k.ky - r.hip.y
      for (let i = 0; i < 3; i++) {
        const u = 0.22 + i * 0.2
        kunai(ctx, r.hip.x + dx * u + 4.5, r.hip.y + dy * u, dx, dy)
      }
    }
    return k
  }

  armGuard(r.back)
  legGuard(r.back, false)

  r.body(ctx, () => {
    const tg = ctx.createLinearGradient(-10, -44, 10, -19)
    tg.addColorStop(0, CHR); tg.addColorStop(1, BLK)
    poly(ctx, [[-10, -43], [10, -43], [7, -19], [-7, -19]], tg, '#454950', 1)

    ctx.strokeStyle = CHR; ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(-9, -42); ctx.lineTo(8, -24); ctx.moveTo(9, -42); ctx.lineTo(-8, -24); ctx.stroke()
    ctx.strokeStyle = STL; ctx.lineWidth = 0.9
    ctx.beginPath(); ctx.moveTo(-9, -42); ctx.lineTo(8, -24); ctx.moveTo(9, -42); ctx.lineTo(-8, -24); ctx.stroke()
    ctx.fillStyle = SIL; ctx.fillRect(-2, -35, 4, 4)

    ctx.fillStyle = CHR; ctx.fillRect(-8, -26, 16, 4)
    ctx.fillStyle = SIL; ctx.fillRect(-2.5, -26, 5, 4)

    ctx.strokeStyle = BLK; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(-9, -58); ctx.stroke()
    ctx.strokeStyle = STL; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(6, -22); ctx.lineTo(-9, -58); ctx.stroke()
    ctx.strokeStyle = BLK; ctx.lineWidth = 3.4
    ctx.beginPath(); ctx.moveTo(-9, -58); ctx.lineTo(-13, -67); ctx.stroke()
    ctx.fillStyle = SIL
    ctx.beginPath(); ctx.arc(-9, -58, 2.4, 0, TAU); ctx.fill()

    poly(ctx, [[-8, -58], [-19, -46 + f * 2], [-11, -41], [-5, -44]], '#17181c', '#454950', 1)

    const hg = ctx.createLinearGradient(-9, -62, 9, -44)
    hg.addColorStop(0, CHR); hg.addColorStop(1, BLK)
    ctx.fillStyle = hg; ctx.strokeStyle = '#454950'; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(0, -52, 9.5, 0, TAU); ctx.fill(); ctx.stroke()
    ctx.strokeStyle = SIL; ctx.lineWidth = 1.4
    ctx.beginPath(); ctx.arc(0, -52, 9, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke()
    poly(ctx, [[1, -56], [9.5, -54], [10, -47], [5, -42.5], [0, -46]], GUN, SIL, 1)
    ctx.strokeStyle = BLK; ctx.lineWidth = 0.9
    ctx.beginPath(); ctx.moveTo(4, -47.5); ctx.lineTo(8.5, -48.5); ctx.moveTo(4, -45.5); ctx.lineTo(7.5, -46.5); ctx.stroke()
    glow(ctx, 6.5, -53.5, 7, '#d6dbe4', 0.45)
    ctx.fillStyle = '#e6eaf2'
    ctx.fillRect(2.4, -55, 7.6, 2)
    poly(ctx, [[-7, -44], [-1, -43], [-2, -39], [-8, -41]], GUN, STL, 0.8)

    poly(ctx, [[-4, -45], [6, -45], [9, -40], [7, -39], [-4, -40]], GUN, SIL, 1)
  })

  legGuard(r.front, true)
  armGuard(r.front)
}

const DRAWERS = { kysora, umbra: shinobi, glacier: cyber, ember: oni, solar: royal }
const BODY = { kysora: '#111214', umbra: '#0b0818', glacier: '#06131d', ember: '#16070a', solar: '#150e03' }

export function drawCharacter(ctx, skinId, pose, accent) {
  const draw = DRAWERS[skinId] || shinobi
  const c = { accent, body: BODY[skinId] || '#0b0818' }
  draw(ctx, rig(pose), pose, c)
}
