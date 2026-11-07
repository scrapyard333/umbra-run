import { PX_PER_M, ORB_VALUE, levelAt } from './constants.js'

export const WORLD_H = 600
export const GROUND_Y = 500
export const PLAYER_X = 190
export const PLAYER_W = 34
export const STAND_H = 60
export const SLIDE_H = 30
export const REC_DT = 0.1
export const MAGNET_RANGE = 300

const GRAVITY = 2600
const JUMP_V = -940
const DOUBLE_V = -860
const MAGNET_TIME = 8
const SLOW_TIME = 5
const SLOW_SCALE = 0.55
const MAX_SAMPLES = 3000

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

export class Engine {
  constructor({ seed = 1, width = 1200 } = {}) {
    this.seed = seed
    this.width = width
    this.ghost = null
    this.reset()
  }

  reset() {
    this.rand = mulberry32(this.seed)
    this.state = 'running'
    this.cause = null
    this.time = 0
    this.x = 0
    this.speed = 420
    this.level = 0
    this.orbCount = 0
    this.points = 0
    this.doubleJumps = 0
    this.slides = 0
    this.nearMisses = 0
    this.combo = 0
    this.comboT = 0
    this.mult = 1
    this.bestMult = 1
    this.shield = false
    this.grace = 0
    this.magnet = 0
    this.slow = 0
    this.timeScale = 1
    this.spawnIn = 650
    this.nextPickupIn = 2500
    this.obstacles = []
    this.orbs = []
    this.pickups = []
    this.events = []
    this.rec = [[0, GROUND_Y, 0]]
    this.recT = 0
    this.p = {
      y: GROUND_Y, vy: 0, grounded: true, jumps: 2,
      sliding: false, slideT: 0, wantSlide: false, flipping: false, flipT: 0,
    }
  }

  get distM() { return this.x / PX_PER_M }
  get score() { return Math.floor(this.distM) + this.points }
  get box() {
    const h = this.p.sliding ? SLIDE_H : STAND_H
    return { x: PLAYER_X + 6, y: this.p.y - h + 3, w: PLAYER_W - 12, h: h - 3 }
  }

  emit(type, data) { this.events.push({ type, ...data }) }
  drain() { const e = this.events; this.events = []; return e }

  ghostState() {
    const g = this.ghost
    if (!g || g.length < 2) return null
    const i = this.time / REC_DT
    const i0 = Math.floor(i)
    if (i0 >= g.length - 1) return null
    const a = g[i0]
    const b = g[i0 + 1]
    const f = i - i0
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, s: a[2] }
  }

  chain(n) {
    this.combo += n
    this.comboT = 2.5
    const m = Math.min(5, 1 + Math.floor(this.combo / 5))
    if (m > this.mult) {
      this.mult = m
      this.bestMult = Math.max(this.bestMult, m)
      this.emit('combo', { mult: m })
    }
  }

  jump() {
    if (this.state !== 'running') return
    const p = this.p
    if (p.jumps === 2) {
      p.vy = JUMP_V; p.jumps = 1; p.grounded = false; p.sliding = false
      this.emit('jump')
    } else if (p.jumps === 1) {
      p.vy = DOUBLE_V; p.jumps = 0; p.flipping = true; p.flipT = 0; p.sliding = false
      this.doubleJumps++
      this.emit('double')
    }
  }

  setSlide(on) {
    this.p.wantSlide = on
    if (on && !this.p.grounded && this.state === 'running') this.p.vy = Math.max(this.p.vy, 1100)
  }

  die(cause) {
    if (this.state !== 'running') return
    this.state = 'dead'
    this.cause = cause
    this.emit('die', { cause })
  }

  update(dt) {
    if (this.state !== 'running') return
    dt = Math.min(dt, 0.033)
    this.time += dt

    if (this.magnet > 0) this.magnet = Math.max(0, this.magnet - dt)
    if (this.slow > 0) this.slow = Math.max(0, this.slow - dt)
    if (this.grace > 0) this.grace = Math.max(0, this.grace - dt)
    const targetScale = this.slow > 0 ? SLOW_SCALE : 1
    this.timeScale += (targetScale - this.timeScale) * Math.min(1, dt * 6)
    if (this.combo > 0) {
      this.comboT -= dt
      if (this.comboT <= 0) { this.combo = 0; this.mult = 1; this.emit('combobreak') }
    }

    this.speed = Math.min(880, 420 + this.distM * 0.28)
    const dx = this.speed * this.timeScale * dt
    this.x += dx

    const p = this.p
    p.slideT += dt
    if (p.wantSlide && p.grounded && !p.sliding) { p.sliding = true; p.slideT = 0; this.slides++ }
    if (p.sliding && (!p.grounded || (!p.wantSlide && p.slideT > 0.3))) p.sliding = false
    if (p.flipping) { p.flipT += dt; if (p.flipT > 0.55) p.flipping = false }

    p.vy += GRAVITY * dt
    p.y += p.vy * dt

    const cx = PLAYER_X + PLAYER_W / 2
    const overGap = this.obstacles.some((o) => o.type === 'chasm' && cx > o.x + 6 && cx < o.x + o.w - 6)
    if (p.y >= GROUND_Y && p.vy >= 0 && !overGap) {
      p.y = GROUND_Y; p.vy = 0; p.jumps = 2; p.flipping = false
      if (!p.grounded) { p.grounded = true; this.emit('land') }
    } else if (p.y >= GROUND_Y && overGap) {
      if (p.grounded) { p.grounded = false; p.jumps = Math.min(p.jumps, 1) }
    } else if (p.y < GROUND_Y) {
      p.grounded = false
    }
    if (p.y > GROUND_Y + 110) {
      if (this.shield) {
        this.shield = false
        this.grace = 1.2
        p.vy = -1150
        p.y = GROUND_Y + 100
        p.jumps = 1
        p.grounded = false
        this.emit('shieldhit', { x: PLAYER_X, y: GROUND_Y })
      } else {
        this.die('fell')
        return
      }
    }

    this.spawnIn -= dx
    this.nextPickupIn -= dx
    if (this.spawnIn <= 0) this.spawn()

    const box = this.box
    for (const o of this.obstacles) {
      o.x -= dx
      let hb = null
      if (o.type === 'spike') hb = { x: o.x + 5, y: GROUND_Y - o.h + 8, w: o.w - 10, h: o.h - 8 }
      else if (o.type === 'laser') hb = { x: o.x, y: GROUND_Y - 70, w: o.w, h: 22 }
      if (!hb || o.broken) continue

      if (hit(box, hb)) {
        if (this.grace > 0) continue
        if (this.shield) {
          this.shield = false
          this.grace = 1
          o.broken = true
          this.emit('shieldhit', { x: o.x + o.w / 2, y: GROUND_Y - 30 })
          continue
        }
        this.die(o.type)
        return
      }

      const overlapX = box.x < hb.x + hb.w && box.x + box.w > hb.x
      if (overlapX) {
        const bottom = box.y + box.h
        const gap = bottom <= hb.y ? hb.y - bottom : box.y >= hb.y + hb.h ? box.y - (hb.y + hb.h) : -1
        if (gap >= 0 && gap < o.minClear) o.minClear = gap
      }
      if (!o.judged && hb.x + hb.w < box.x) {
        o.judged = true
        if (o.minClear <= (o.type === 'laser' ? 12 : 24)) {
          this.nearMisses++
          this.points += ORB_VALUE * this.mult
          this.chain(2)
          this.emit('nearmiss', { x: PLAYER_X + 20, y: p.y - 40 })
        }
      }
    }

    const pcx = PLAYER_X + PLAYER_W / 2
    const pcy = p.y - (p.sliding ? 14 : 30)
    const grab = { x: box.x - 6, y: box.y - 6, w: box.w + 12, h: box.h + 12 }
    for (const o of this.orbs) {
      o.x -= dx
      if (this.magnet > 0) {
        const ddx = pcx - o.x
        const ddy = pcy - o.y
        if (ddx * ddx + ddy * ddy < MAGNET_RANGE * MAGNET_RANGE) {
          const k = Math.min(1, dt * 7)
          o.x += ddx * k
          o.y += ddy * k
        }
      }
      if (!o.got && hit(grab, { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 })) {
        o.got = true
        this.orbCount++
        this.points += ORB_VALUE * this.mult
        this.chain(1)
        this.emit('orb', { x: o.x, y: o.y, mult: this.mult })
      }
    }

    for (const k of this.pickups) {
      k.x -= dx
      if (!k.got && hit(grab, { x: k.x - k.r, y: k.y - k.r, w: k.r * 2, h: k.r * 2 })) {
        k.got = true
        if (k.kind === 'shield') this.shield = true
        else if (k.kind === 'magnet') { this.magnet = MAGNET_TIME; this.emit('magnetstart') }
        else { this.slow = SLOW_TIME; this.emit('slowstart') }
        this.emit('pickup', { kind: k.kind, x: k.x, y: k.y })
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -120)
    this.orbs = this.orbs.filter((o) => !o.got && o.x > -60)
    this.pickups = this.pickups.filter((k) => !k.got && k.x > -60)

    const lv = levelAt(this.distM)
    if (lv > this.level) { this.level = lv; this.emit('levelup', { level: lv }) }

    this.recT += dt
    while (this.recT >= REC_DT) {
      this.recT -= REC_DT
      if (this.rec.length < MAX_SAMPLES) this.rec.push([Math.round(this.x), Math.round(p.y), p.sliding ? 1 : 0])
    }
  }

  spawn() {
    const r = this.rand
    const x = this.width + 120
    const m = this.distM
    const roll = r()
    let w
    if (m > 40 && roll < 0.28) {
      w = 130 + r() * (70 + this.speed * 0.12)
      this.obstacles.push({ type: 'chasm', x, w })
      if (r() < 0.45) this.orbArc(x, w)
    } else if (m > 120 && roll < 0.5) {
      w = 120
      this.obstacles.push({ type: 'laser', x, w, minClear: Infinity })
      if (r() < 0.6) for (let i = 0; i < 3; i++) this.orbs.push({ x: x + 30 + i * 26, y: GROUND_Y - 18, r: 13, got: false })
    } else {
      const n = 1 + Math.floor(r() * (m > 200 ? 3 : 2))
      w = n * 30
      this.obstacles.push({ type: 'spike', x, w, h: 44 + r() * 10, minClear: Infinity })
      if (r() < 0.45) this.orbArc(x, w)
    }
    this.spawnIn = w + this.speed * (0.9 + r() * 0.6) + 120
    if (r() < 0.22) {
      const rowX = x + w + this.spawnIn * 0.55
      const rowY = GROUND_Y - 30 - r() * 90
      const cnt = 3 + Math.floor(r() * 3)
      for (let i = 0; i < cnt; i++) this.orbs.push({ x: rowX + i * 36, y: rowY, r: 13, got: false })
    }
    if (this.nextPickupIn <= 0 && m > 60) {
      const roll2 = r()
      const kind = roll2 < 0.4 ? 'shield' : roll2 < 0.7 ? 'magnet' : 'slow'
      this.pickups.push({ kind, x: x + w + this.spawnIn * 0.4, y: GROUND_Y - 70 - r() * 60, r: 17, got: false })
      this.nextPickupIn = 3200 + r() * 2600
    }
  }

  orbArc(x, w) {
    const span = w + 80
    for (let i = 0; i < 5; i++) {
      this.orbs.push({
        x: x - 40 + (i * span) / 4,
        y: GROUND_Y - 40 - 100 * Math.sin((Math.PI * i) / 4),
        r: 13, got: false,
      })
    }
  }
}
