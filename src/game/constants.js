export const SKINS = [
  { id: 'kysora', name: 'Kysora', rarity: 'SIGNATURE', price: 0, accent: '#A6A9B0', desc: 'Shadow Assassin. Silent, precise and disciplined. Black tactical armor, a hooded cape, a long katana and three throwing daggers.' },
  { id: 'umbra', name: 'Umbra Monk', rarity: 'CLASSIC', price: 0, accent: '#a855f7', desc: 'A silent shinobi in midnight silk, katana on his back and a violet scarf streaming behind.' },
  { id: 'glacier', name: 'Glacier Ghost', rarity: 'RARE', price: 250, accent: '#22d3ee', desc: 'A cyber-runner in a frost-lit visor suit. Ribbons of light trail from every stride.' },
  { id: 'ember', name: 'Ember Wraith', rarity: 'EPIC', price: 500, accent: '#ef4444', desc: 'A horned wraith wrapped in living flame. The night burns wherever it runs.' },
  { id: 'solar', name: 'Solar Regent', rarity: 'LEGENDARY', price: 1000, accent: '#facc15', desc: 'A crowned sprinter with a halo and a royal cape, carrying a piece of the sun.' },
]

export const PX_PER_M = 50
export const ORB_VALUE = 25

export const LEVELS = [
  { name: 'Rookie', at: 0, sky: ['#05050d', '#150c2e', '#2a1250'], accent: '#a855f7', city: false },
  { name: 'Runner', at: 300, sky: ['#04060f', '#0b1a3a', '#3a1060'], accent: '#22d3ee', city: true },
  { name: 'Veteran', at: 700, sky: ['#0d0508', '#2a0a14', '#5a1428'], accent: '#ef4444', city: false },
  { name: 'Master', at: 1200, sky: ['#0d0a04', '#2a1a08', '#5a3a10'], accent: '#facc15', city: true },
  { name: 'Legend', at: 1800, sky: ['#020208', '#0a0630', '#1a0a5a'], accent: '#818cf8', city: false },
]

export const levelAt = (meters) => {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (meters >= LEVELS[i].at) idx = i
  return idx
}

export const QUALITY = { high: 1, medium: 0.5, low: 0.15 }
