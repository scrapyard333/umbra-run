export const todayKey = (d = new Date()) => d.toLocaleDateString('en-CA')

export const DAILY_TEMPLATES = [
  { id: 'orbs', title: 'Orb Harvester', desc: 'Collect {n} orbs today', target: 40, reward: 120, stat: 'orbs' },
  { id: 'dist', title: 'Long Haul', desc: 'Run {n} meters in total today', target: 1000, reward: 150, stat: 'dist' },
  { id: 'jumps', title: 'Sky Dancer', desc: 'Perform {n} double jumps today', target: 25, reward: 130, stat: 'doubleJumps' },
  { id: 'slides', title: 'Low Profile', desc: 'Slide {n} times today', target: 15, reward: 100, stat: 'slides' },
]

const hashStr = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

export const dailyFor = (date) => {
  const t = DAILY_TEMPLATES[hashStr(date) % DAILY_TEMPLATES.length]
  return { date, templateId: t.id, progress: 0, claimed: false }
}
export const templateOf = (daily) => DAILY_TEMPLATES.find((t) => t.id === daily.templateId) || DAILY_TEMPLATES[0]
export const isDailyReady = (daily) =>
  daily.date === todayKey() && !daily.claimed && daily.progress >= templateOf(daily).target

export const ACHIEVEMENTS = [
  { id: 'first', title: 'Night Walker', desc: 'Complete your first run', reward: 50, max: 1, value: (s) => s.runs, icon: 'footprints' },
  { id: 'apprentice', title: 'Dusk Sprinter', desc: 'Reach 500m in a single run', reward: 100, max: 500, value: (s) => s.bestDist, icon: 'flame' },
  { id: 'master', title: 'Umbra Master', desc: 'Reach 1500m in a single run', reward: 300, max: 1500, value: (s) => s.bestDist, icon: 'crown' },
  { id: 'sky', title: 'Sky Dancer', desc: 'Perform 20 double jumps in one run', reward: 100, max: 20, value: (s) => s.bestDoubles, icon: 'wind' },
  { id: 'hoarder', title: 'Orb Hoarder', desc: 'Collect 100 orbs in total', reward: 150, max: 100, value: (s) => s.totalOrbs, icon: 'coins' },
  { id: 'unbroken', title: 'Unbroken', desc: 'Absorb 5 hits with a Shield', reward: 100, max: 5, value: (s) => s.shieldHits, icon: 'shield' },
  { id: 'bender', title: 'Time Bender', desc: 'Use Slow-Time 3 times', reward: 150, max: 3, value: (s) => s.slowUses, icon: 'timer' },
]

export const emptyStats = { runs: 0, totalOrbs: 0, bestDist: 0, bestDoubles: 0, shieldHits: 0, slowUses: 0 }

const newlyUnlocked = (stats, ids) => ACHIEVEMENTS.filter((a) => !ids.includes(a.id) && a.value(stats) >= a.max)

export function applyRun(s, run) {
  const stats = {
    ...s.stats,
    runs: s.stats.runs + 1,
    totalOrbs: s.stats.totalOrbs + run.orbs,
    bestDist: Math.max(s.stats.bestDist, run.dist),
    bestDoubles: Math.max(s.stats.bestDoubles, run.doubleJumps),
  }
  let daily = s.daily.date === todayKey() ? s.daily : dailyFor(todayKey())
  const t = templateOf(daily)
  const gain = { orbs: run.orbs, dist: run.dist, doubleJumps: run.doubleJumps, slides: run.slides }[t.stat] || 0
  if (!daily.claimed) daily = { ...daily, progress: Math.min(t.target, daily.progress + gain) }
  const newly = newlyUnlocked(stats, s.achievements)
  const bonus = newly.reduce((n, a) => n + a.reward, 0)
  const history = [...s.history, { score: run.score, dist: run.dist, date: Date.now() }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  return {
    next: {
      stats, daily, history,
      achievements: [...s.achievements, ...newly.map((a) => a.id)],
      best: Math.max(s.best, run.score),
      ghost: run.samples && run.score > (s.ghost?.score ?? 0) ? { score: run.score, samples: run.samples } : s.ghost ?? null,
      orbs: s.orbs + run.orbs + bonus,
    },
    newly,
  }
}

export function applyStat(s, key, n = 1) {
  const stats = { ...s.stats, [key]: (s.stats[key] || 0) + n }
  const newly = newlyUnlocked(stats, s.achievements)
  const bonus = newly.reduce((sum, a) => sum + a.reward, 0)
  return {
    next: { stats, achievements: [...s.achievements, ...newly.map((a) => a.id)], orbs: s.orbs + bonus },
    newly,
  }
}

export const BOTS = [
  { name: 'KageNova', dist: 3420, score: 3948 },
  { name: 'NeonRonin', dist: 2600, score: 2958 },
  { name: 'DuskWalker', dist: 1980, score: 2168 },
  { name: 'VoidMarauder', dist: 1510, score: 1648 },
  { name: 'EmberFox', dist: 990, score: 1108 },
  { name: 'GlitchSamurai', dist: 640, score: 790 },
  { name: 'PixelWraith', dist: 380, score: 455 },
  { name: 'LunaStrike', dist: 210, score: 250 },
]

export function buildBoard(history, best, bestDist) {
  const mine = history.length ? history : best > 0 ? [{ score: best, dist: bestDist }] : []
  return [
    ...BOTS.map((b) => ({ ...b, you: false })),
    ...mine.map((h) => ({ name: 'You', dist: h.dist, score: h.score, you: true })),
  ]
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}
