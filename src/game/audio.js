const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12)
const MUSIC_VOL = 0.5

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

const THEMES = {
  sakura: {
    bpm: 84, root: 62, scale: [0, 2, 3, 7, 8],
    chords: [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]],
    pad: { type: 'sine', vol: 0.045, lp: 1800 },
    bass: { type: 'sine', steps: [0, 10], oct: -12, vol: 0.15, len: 3, lp: 300 },
    arp: { type: 'triangle', every: 2, vol: 0.07, oct: 12, len: 1.8, lp: 3200, pattern: [0, 1, 2, 1, 2, 1, 0, 1] },
    drums: { kick: [0, 8], kickVol: 0.28, shaker: [4, 12] },
    melody: { type: 'sine', vol: 0.08, density: 0.55, oct: 12 },
  },
  desert: {
    bpm: 92, root: 52, scale: [0, 1, 4, 5, 7, 8, 10],
    chords: [[52, 56, 59], [53, 57, 60], [52, 56, 59], [50, 54, 57]],
    pad: { type: 'sawtooth', vol: 0.04, lp: 900 },
    bass: { type: 'sawtooth', steps: [0], oct: -12, vol: 0.17, len: 14, lp: 220 },
    arp: { type: 'sawtooth', every: 2, vol: 0.05, oct: 12, len: 1.2, lp: 1800, pattern: [0, 2, 1, 2] },
    drums: { kick: [0, 6, 10], kickVol: 0.34, tak: [3, 7, 11, 14] },
    melody: { type: 'triangle', vol: 0.08, density: 0.6, oct: 24 },
  },
  forest: {
    bpm: 78, root: 57, scale: [0, 2, 3, 5, 7, 9, 10],
    chords: [[45, 48, 52], [43, 47, 50], [41, 45, 48], [40, 43, 47]],
    pad: { type: 'sine', vol: 0.04, lp: 1600 },
    bass: { type: 'sine', steps: [0], oct: 0, vol: 0.13, len: 12, lp: 260 },
    arp: { type: 'triangle', every: 4, vol: 0.08, oct: 24, len: 3, lp: 2500, pattern: [0, 1, 2, 1] },
    drums: { kick: [0], kickVol: 0.2, tick: [8] },
    melody: { type: 'sine', vol: 0.09, density: 0.45, oct: 12 },
  },
  tundra: {
    bpm: 70, root: 64, scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]],
    pad: { type: 'sine', vol: 0.045, lp: 1500 },
    bass: { type: 'sine', steps: [0], oct: -12, vol: 0.11, len: 14, lp: 200 },
    arp: { type: 'sine', every: 4, vol: 0.07, oct: 24, len: 4, lp: 4000, pattern: [2, 1, 2, 0] },
    drums: { kick: [0], kickVol: 0.16 },
    melody: { type: 'triangle', vol: 0.06, density: 0.4, oct: 12 },
  },
  city: {
    bpm: 100, root: 57, scale: [0, 2, 3, 5, 7, 8, 10],
    chords: [[45, 48, 52], [41, 45, 48], [48, 52, 55], [43, 47, 50]],
    pad: { type: 'sawtooth', vol: 0.04, lp: 700 },
    bass: { type: 'sawtooth', steps: [0, 2, 4, 6, 8, 10, 12, 14], oct: 0, vol: 0.15, len: 1.5, lp: 420 },
    arp: { type: 'square', every: 2, vol: 0.04, oct: 24, len: 1, lp: 2200, pattern: [0, 1, 2, 1] },
    drums: { kick: [0, 4, 8, 12], kickVol: 0.32, snare: [4, 12], hat: [2, 6, 10, 14] },
    melody: { type: 'square', vol: 0.045, density: 0.4, oct: 12 },
  },
  volcano: {
    bpm: 90, root: 50, scale: [0, 1, 3, 5, 7, 8, 10],
    chords: [[38, 41, 45], [34, 38, 41], [36, 40, 43], [33, 37, 40]],
    pad: { type: 'sawtooth', vol: 0.06, lp: 500 },
    bass: { type: 'sawtooth', steps: [0, 3, 6, 8, 11], oct: 0, vol: 0.24, len: 2, lp: 260 },
    arp: { type: 'square', every: 4, vol: 0.04, oct: 36, len: 1, lp: 1800, pattern: [0, 2, 1] },
    drums: { kick: [0, 8], kickVol: 0.44, tom: [3, 11] },
    melody: { type: 'sawtooth', vol: 0.05, density: 0.3, oct: 12 },
  },
}

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

  const st = { sound: true, music: true, theme: 'sakura', pending: null, tempoScale: 1, timer: null, nextT: 0, step: 0, running: false }

  function tone({ type = 'square', f0, f1 = f0, t = ctx.currentTime, dur = 0.12, vol = 0.15, bus = sfxBus, attack = 0.004, lp = 0, hold = 0 }) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(f0, t)
    if (f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(vol, t + attack)
    if (hold > 0) g.gain.setValueAtTime(vol, t + attack + hold)
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

  const stepDur = () => 60 / (THEMES[st.theme].bpm * st.tempoScale) / 4

  function playStep(step, t) {
    const th = THEMES[st.theme]
    const barAbs = Math.floor(step / 16)
    const chord = th.chords[barAbs % th.chords.length]
    const s = step % 16
    const sd = stepDur()

    if (s === 0) {
      chord.forEach((n) => tone({ type: th.pad.type, f0: NOTE(n), t, dur: sd * 16.5, hold: sd * 9, attack: sd * 3, vol: th.pad.vol, lp: th.pad.lp, bus: musBus }))
    }
    if (th.bass.steps.includes(s)) {
      tone({ type: th.bass.type, f0: NOTE(chord[0] + th.bass.oct), t, dur: sd * th.bass.len, vol: th.bass.vol, lp: th.bass.lp, bus: musBus, hold: sd * th.bass.len * 0.4 })
    }
    if (s % th.arp.every === 0) {
      const idx = th.arp.pattern[(s / th.arp.every) % th.arp.pattern.length]
      tone({ type: th.arp.type, f0: NOTE(chord[idx % 3] + th.arp.oct + (idx >= 3 ? 12 : 0)), t, dur: sd * th.arp.len, vol: th.arp.vol, lp: th.arp.lp, bus: musBus })
    }
    const d = th.drums
    if (d.kick && d.kick.includes(s)) tone({ type: 'sine', f0: 150, f1: 45, t, dur: 0.2, vol: d.kickVol, bus: musBus })
    if (d.snare && d.snare.includes(s)) noise({ t, dur: 0.12, vol: 0.14, type: 'bandpass', freq: 1800, q: 0.8, bus: musBus })
    if (d.hat && d.hat.includes(s)) noise({ t, dur: 0.03, vol: 0.05, type: 'highpass', freq: 7000, bus: musBus })
    if (d.shaker && d.shaker.includes(s)) noise({ t, dur: 0.06, vol: 0.05, type: 'highpass', freq: 8000, bus: musBus })
    if (d.tak && d.tak.includes(s)) noise({ t, dur: 0.07, vol: 0.09, type: 'bandpass', freq: 2200, q: 1.1, bus: musBus })
    if (d.tick && d.tick.includes(s)) noise({ t, dur: 0.05, vol: 0.04, type: 'bandpass', freq: 1500, q: 1.5, bus: musBus })
    if (d.tom && d.tom.includes(s)) tone({ type: 'sine', f0: 110, f1: 60, t, dur: 0.28, vol: 0.26, bus: musBus })

    if (s % 4 === 0 && hash(barAbs * 7 + s) < th.melody.density) {
      const deg = th.scale[Math.floor(hash(barAbs * 13 + s * 3) * th.scale.length)]
      tone({ type: th.melody.type, f0: NOTE(th.root + th.melody.oct + deg), t, dur: sd * 3, vol: th.melody.vol, lp: 2400, bus: musBus })
    }
  }

  function scheduleUntil(until) {
    while (st.nextT < until) {
      if (st.pending && st.step % 16 === 0) { st.theme = st.pending; st.pending = null }
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
    st.pending = null
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

  function setMood(scale = 1) {
    st.tempoScale = Math.max(0.4, scale)
  }

  function setBiome(id) {
    if (!THEMES[id]) return
    if (st.timer) st.pending = id
    else { st.theme = id; st.pending = null }
  }

  return {
    ctx,
    sfx,
    startMusic,
    stopMusic,
    configure,
    setMood,
    setBiome,
    scheduleUntil,
    suspend: () => ctx.suspend && ctx.suspend(),
    resume: () => ctx.resume && ctx.resume(),
    sfxNames: Object.keys(SFX),
    themeNames: Object.keys(THEMES),
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
  setMood: safe((s) => instance && instance.setMood(s)),
  setBiome: safe((id) => instance && instance.setBiome(id)),
  suspend: safe(() => instance && instance.suspend()),
  resume: safe(() => instance && instance.resume()),
}
