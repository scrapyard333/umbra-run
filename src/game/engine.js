import { PX_PER_M, ORB_VALUE, levelAt } from './constants.js'

export const WORLD_H = 600
export const GROUND_Y = 500
export const PLAYER_X = 190
export const PLAYER_W = 34
export const STAND_H = 60
export const SLIDE_H = 30

const GRAVITY = 2600
const JUMP_V = -940
const DOUBLE_V = -860

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
    this.doubleJumps = 0
    this.slides = 0
    this.spawnIn = 650
    this.obstacles = []
    this.orbs = []
    this.events = []
    this.p = {
      y: GROUND_Y, vy: 0, grounded: true, jumps: 2,
      sliding: false, slideT: 0, wantSlide: false, flipping: false, flipT: 0,
    }
  }

  get distM() { return this.x / PX_PER_M }
  get score() { return Math.floor(this.distM) + this.orbCount * ORB_VALUE }
  get box() {
    const h = this.p.sliding ? SLIDE_H : STAND_H
    return { x: PLAYER_X + 6, y: this.p.y - h + 3, w: PLAYER_W - 12, h: h - 3 }
  }

  emit(type, data) { this.events.push({ type, ...data }) }
  drain() { const e = this.events; this.events = []; return e }

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
    this.speed = Math.min(880, 420 + this.distM * 0.28)
    const dx = this.speed * dt
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
    if (p.y > GROUND_Y + 110) { this.die('fell'); return }

    this.spawnIn -= dx
    if (this.spawnIn <= 0) this.spawn()

    const box = this.box
    for (const o of this.obstacles) {
      o.x -= dx
      let hb = null
      if (o.type === 'spike') hb = { x: o.x + 5, y: GROUND_Y - o.h + 8, w: o.w - 10, h: o.h - 8 }
      else if (o.type === 'laser') hb = { x: o.x, y: GROUND_Y - 70, w: o.w, h: 22 }
      if (hb && hit(box, hb)) { this.die(o.type); return }
    }

    const grab = { x: box.x - 6, y: box.y - 6, w: box.w + 12, h: box.h + 12 }
    for (const o of this.orbs) {
      o.x -= dx
      if (!o.got && hit(grab, { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 })) {
        o.got = true
        this.orbCount++
        this.emit('orb', { x: o.x, y: o.y })
      }
    }

    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -120)
    this.orbs = this.orbs.filter((o) => !o.got && o.x > -60)

    const lv = levelAt(this.distM)
    if (lv > this.level) { this.level = lv; this.emit('levelup', { level: lv }) }
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
      this.obstacles.push({ type: 'laser', x, w })
      if (r() < 0.6) for (let i = 0; i < 3; i++) this.orbs.push({ x: x + 30 + i * 26, y: GROUND_Y - 18, r: 13, got: false })
    } else {
      const n = 1 + Math.floor(r() * (m > 200 ? 3 : 2))
      w = n * 30
      this.obstacles.push({ type: 'spike', x, w, h: 44 + r() * 10 })
      if (r() < 0.45) this.orbArc(x, w)
    }
    this.spawnIn = w + this.speed * (0.9 + r() * 0.6) + 120
    if (r() < 0.22) {
      const rowX = x + w + this.spawnIn * 0.55
      const rowY = GROUND_Y - 30 - r() * 90
      const cnt = 3 + Math.floor(r() * 3)
      for (let i = 0; i < cnt; i++) this.orbs.push({ x: rowX + i * 36, y: rowY, r: 13, got: false })
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
