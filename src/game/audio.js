const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12)
const MUSIC_VOL = 0.5

const CHORDS = [
  [57, 60, 64],
  [53, 57, 60],
  [48, 52, 55],
  [55, 59, 62],
]

export function createAudio(ctx) {
  const master = ctx.createGain()
  master.gain.value = 0.85
  const limiter = ctx.createWaveShaper()
  const curve = new Float32Array(2048)
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1
    curve[i] = Math.tanh(1.8 * x) / Math.tanh(1.8)
  }
  limiter.curve = curve
  master.connect(limiter)
  limiter.connect(ctx.destination)

  const sfxBus = ctx.createGain()
  sfxBus.gain.value = 1.8
  sfxBus.connect(master)
  const musBus = ctx.createGain()
  musBus.gain.value = MUSIC_VOL
  musBus.connect(master)

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const nd = noiseBuf.getChannelData(0)
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1

  const st = { sound: true, music: true, bpm: 108, tempoScale: 1, level: 0, timer: null, nextT: 0, step: 0, running: false }

  function tone({ type = 'square', f0, f1 = f0, t = ctx.currentTime, dur = 0.12, vol = 0.15, bus = sfxBus, attack = 0.004, lp = 0 }) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(f0, t)
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    let node = osc
    if (lp) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = lp
      osc.connect(f)
      node = f
    }
    node.connect(g)
    g.connect(bus)
    osc.start(t)
    osc.stop(t + dur + 0.05)
  }

  function noise({ t = ctx.currentTime, dur = 0.1, vol = 0.1, type = 'highpass', freq = 6000, q = 0.7, bus = sfxBus }) {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuf
    const f = ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    src.connect(f)
    f.connect(g)
    g.connect(bus)
    src.start(t)
    src.stop(t + dur + 0.05)
  }

  const SFX = {
    jump: () => tone({ type: 'square', f0: 300, f1: 640, dur: 0.12, vol: 0.15 }),
    double: () => {
      tone({ type: 'square', f0: 520, f1: 1100, dur: 0.16, vol: 0.1 })
      tone({ type: 'sine', f0: 260, f1: 520, dur: 0.18, vol: 0.12 })
    },
    land: () => {
      noise({ dur: 0.07, vol: 0.12, type: 'lowpass', freq: 500 })
      tone({ type: 'sine', f0: 130, f1: 60, dur: 0.09, vol: 0.18 })
    },
    orb: (mult = 1) => {
      const f = 880 * (1 + 0.14 * (mult - 1))
      tone({ type: 'triangle', f0: f, dur: 0.09, vol: 0.14 })
      tone({ type: 'triangle', f0: f * 1.5, t: ctx.currentTime + 0.06, dur: 0.12, vol: 0.14 })
    },
    combo: (mult = 2) => {
      tone({ type: 'square', f0: 330 * mult, f1: 660 * mult, dur: 0.14, vol: 0.12 })
    },
    nearmiss: () => {
      noise({ dur: 0.22, vol: 0.14, type: 'bandpass', freq: 2400, q: 1.2 })
      tone({ type: 'sine', f0: 1200, f1: 1900, dur: 0.12, vol: 0.1 })
    },
    shield: () => {
      ;[520, 660, 880].forEach((f, i) => tone({ type: 'sine', f0: f, t: ctx.currentTime + i * 0.07, dur: 0.18, vol: 0.14 }))
    },
    shieldhit: () => {
      noise({ dur: 0.3, vol: 0.2, type: 'lowpass', freq: 1800 })
      tone({ type: 'sawtooth', f0: 420, f1: 90, dur: 0.3, vol: 0.14, lp: 1500 })
    },
    magnet: () => tone({ type: 'sawtooth', f0: 200, f1: 900, dur: 0.28, vol: 0.13, lp: 2200 }),
    slow: () => {
      tone({ type: 'sine', f0: 900, f1: 180, dur: 0.55, vol: 0.16 })
      tone({ type: 'triangle', f0: 450, f1: 90, dur: 0.55, vol: 0.1 })
    },
    levelup: () => {
      ;[523, 659, 784, 1046].forEach((f, i) => tone({ type: 'square', f0: f, t: ctx.currentTime + i * 0.09, dur: 0.14, vol: 0.1 }))
    },
    die: () => {
      tone({ type: 'sawtooth', f0: 440, f1: 55, dur: 0.7, vol: 0.18, lp: 2000 })
      noise({ dur: 0.45, vol: 0.2, type: 'lowpass', freq: 1200 })
    },
    click: () => tone({ type: 'square', f0: 700, f1: 500, dur: 0.05, vol: 0.1 }),
  }

  function sfx(name, arg) {
    if (!st.sound || !SFX[name]) return
    SFX[name](arg)
  }

  const stepDur = () => 60 / (st.bpm * st.tempoScale) / 4

  function playStep(step, t) {
    const bar = Math.floor(step / 16) % CHORDS.length
    const s = step % 16
    const chord = CHORDS[bar]
    const sd = stepDur()
    const lv = st.level

    if (s % 4 === 0) tone({ type: 'sine', f0: 150, f1: 45, t, dur: 0.16, vol: 0.5, bus: musBus })
    if (s === 4 || s === 12) noise({ t, dur: 0.12, vol: 0.18, type: 'bandpass', freq: 1800, q: 0.8, bus: musBus })
    if (s % 2 === 1 || lv >= 2) noise({ t, dur: 0.03, vol: 0.07, type: 'highpass', freq: 7000, bus: musBus })

    if (s % 2 === 0) {
      const root = NOTE(chord[0] - 24 + (s % 8 === 6 ? 12 : 0))
      tone({ type: 'sawtooth', f0: root, t, dur: sd * 1.8, vol: 0.22, bus: musBus, lp: 380 })
    }

    const arpNote = chord[s % 3] + (s % 6 < 3 ? 12 : 24) + (lv >= 3 ? 12 : 0)
    tone({ type: 'square', f0: NOTE(arpNote), t, dur: sd * 0.9, vol: 0.05, bus: musBus, lp: 2600 })

    if (lv >= 1 && s % 8 === 0) {
      tone({ type: 'triangle', f0: NOTE(chord[2] + 24), t, dur: sd * 6, vol: 0.07, bus: musBus })
    }
  }

  function scheduleUntil(until) {
    while (st.nextT < until) {
      playStep(st.step, st.nextT)
      st.nextT += stepDur()
      st.step++
    }
  }

  function startMusic() {
    st.running = true
    if (!st.music || st.timer) return
    musBus.gain.cancelScheduledValues(ctx.currentTime)
    musBus.gain.setValueAtTime(MUSIC_VOL, ctx.currentTime)
    st.nextT = ctx.currentTime + 0.1
    st.step = 0
    st.timer = setInterval(() => scheduleUntil(ctx.currentTime + 0.35), 100)
  }

  function stopMusic() {
    st.running = false
    if (st.timer) { clearInterval(st.timer); st.timer = null }
    musBus.gain.cancelScheduledValues(ctx.currentTime)
    musBus.gain.setValueAtTime(musBus.gain.value, ctx.currentTime)
    musBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.12)
  }

  function configure({ sound, music }) {
    st.sound = !!sound
    const was = st.music
    st.music = !!music
    if (was && !st.music && st.timer) {
      clearInterval(st.timer)
      st.timer = null
      musBus.gain.cancelScheduledValues(ctx.currentTime)
      musBus.gain.setValueAtTime(0.0001, ctx.currentTime)
    }
    if (!was && st.music && st.running) startMusic()
  }

  function setTempo(bpm, scale = 1, level = 0) {
    st.bpm = bpm
    st.tempoScale = Math.max(0.4, scale)
    st.level = level
  }

  return {
    ctx,
    sfx,
    startMusic,
    stopMusic,
    configure,
    setTempo,
    scheduleUntil,
    suspend: () => ctx.suspend && ctx.suspend(),
    resume: () => ctx.resume && ctx.resume(),
    sfxNames: Object.keys(SFX),
  }
}

let instance = null
const safe = (fn) => (...a) => { try { return fn(...a) } catch { return undefined } }

export const audio = {
  unlock() {
    if (!instance) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      instance = createAudio(new AC())
    }
    instance.resume()
  },
  sfx: safe((n, a) => instance && instance.sfx(n, a)),
  startMusic: safe(() => instance && instance.startMusic()),
  stopMusic: safe(() => instance && instance.stopMusic()),
  configure: safe((o) => instance && instance.configure(o)),
  setTempo: safe((b, s, l) => instance && instance.setTempo(b, s, l)),
  suspend: safe(() => instance && instance.suspend()),
  resume: safe(() => instance && instance.resume()),
}
