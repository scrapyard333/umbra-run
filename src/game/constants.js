export const SKINS = [
  { id: 'umbra', name: 'Umbra Monk', rarity: 'CLASSIC', price: 0, accent: '#a855f7', desc: 'A silent wanderer wrapped in midnight silk and violet mist.' },
  { id: 'glacier', name: 'Glacier Ghost', rarity: 'RARE', price: 250, accent: '#22d3ee', desc: 'Frozen light trails behind this icy night-walker.' },
  { id: 'ember', name: 'Ember Wraith', rarity: 'EPIC', price: 500, accent: '#ef4444', desc: 'Born in the dying coals of a thousand lanterns.' },
  { id: 'solar', name: 'Solar Regent', rarity: 'LEGENDARY', price: 1000, accent: '#facc15', desc: 'A crowned sprinter who carries a piece of the sun.' },
]

export const PX_PER_M = 50
export const ORB_VALUE = 25

export const LEVELS = [
  { name: 'Beginner', at: 0, sky: ['#05050d', '#150c2e', '#2a1250'], accent: '#a855f7', city: false },
  { name: 'Neon Metropolis', at: 300, sky: ['#04060f', '#0b1a3a', '#3a1060'], accent: '#22d3ee', city: true },
  { name: 'Crimson Wastes', at: 700, sky: ['#0d0508', '#2a0a14', '#5a1428'], accent: '#ef4444', city: false },
  { name: 'Solar Citadel', at: 1200, sky: ['#0d0a04', '#2a1a08', '#5a3a10'], accent: '#facc15', city: true },
  { name: 'Void Abyss', at: 1800, sky: ['#020208', '#0a0630', '#1a0a5a'], accent: '#818cf8', city: false },
]

export const levelAt = (meters) => {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (meters >= LEVELS[i].at) idx = i
  return idx
}

export const QUALITY = { high: 1, medium: 0.5, low: 0.15 }
