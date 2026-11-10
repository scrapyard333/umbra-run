export const BIOMES = {
  sakura: {
    id: 'sakura', name: 'Sakura Grove', season: 'Spring',
    sky: ['#0f0619', '#3a1450', '#c0527d'], accent: '#f472b6', ground: '#0a0510', farColor: '#2a1238', fog: '#f472b6',
    far: 'hills', mid: 'sakura', weather: ['petals'], stars: 0.7,
    body: { kind: 'moon', color: '#fff1f8', halo: '#f472b6', x: 0.8, y: 120, r: 62, beam: true },
  },
  desert: {
    id: 'desert', name: 'Ember Dunes', season: 'Summer',
    sky: ['#14081f', '#6b2548', '#f59e0b'], accent: '#fb923c', ground: '#120805', farColor: '#3b1330', fog: '#fb923c',
    far: 'dunes', mid: 'desert', weather: ['dust'], stars: 0.25,
    body: { kind: 'sun', color: '#fde68a', halo: '#fb923c', x: 0.78, y: 300, r: 95, beam: false },
  },
  forest: {
    id: 'forest', name: 'Whispering Forest', season: 'Autumn',
    sky: ['#03100d', '#0a2a22', '#1d5c3c'], accent: '#f59e0b', ground: '#030a07', farColor: '#0a2018', fog: '#34d399',
    far: 'hills', mid: 'forest', weather: ['leaves', 'fireflies'], stars: 1,
    body: { kind: 'moon', color: '#e4ffe9', halo: '#34d399', x: 0.8, y: 110, r: 54, beam: true },
  },
  tundra: {
    id: 'tundra', name: 'Frostbound Peaks', season: 'Winter',
    sky: ['#040a18', '#10264d', '#5b8fc7'], accent: '#7dd3fc', ground: '#060a12', farColor: '#16305c', fog: '#7dd3fc',
    far: 'ice', mid: 'snowpine', weather: ['snow'], stars: 1,
    body: { kind: 'moon', color: '#eaf6ff', halo: '#7dd3fc', x: 0.82, y: 100, r: 50, beam: true, aurora: true },
  },
  city: {
    id: 'city', name: 'Neon Metropolis', season: 'Night',
    sky: ['#04060f', '#0b1a3a', '#3a1060'], accent: '#22d3ee', ground: '#05040b', farColor: '#101030', fog: '#22d3ee',
    far: 'skyline', mid: 'city', weather: ['rain'], stars: 0.6,
    body: { kind: 'moon', color: '#ffffff', halo: '#22d3ee', x: 0.84, y: 118, r: 56, beam: true },
  },
  volcano: {
    id: 'volcano', name: 'Crimson Wastes', season: 'Inferno',
    sky: ['#0c0304', '#38090f', '#b02a1e'], accent: '#ef4444', ground: '#090304', farColor: '#2a0a0e', fog: '#ef4444',
    far: 'volcano', mid: 'rocks', weather: ['embers'], stars: 0.15,
    body: { kind: 'moon', color: '#ffb4a8', halo: '#ef4444', x: 0.78, y: 130, r: 70, beam: false },
  },
}

export const ORDER = ['sakura', 'desert', 'forest', 'tundra', 'city', 'volcano']
export const SEGMENT_M = 450
export const BLEND_M = 90

export function biomeAt(distM, mode = 'auto') {
  if (mode !== 'auto' && BIOMES[mode]) return { a: mode, b: mode, t: 0, active: mode }
  const seg = Math.floor(distM / SEGMENT_M)
  const inSeg = distM - seg * SEGMENT_M
  const a = ORDER[seg % ORDER.length]
  const b = ORDER[(seg + 1) % ORDER.length]
  const k = (inSeg - (SEGMENT_M - BLEND_M)) / BLEND_M
  const t = k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k)
  return { a, b, t, active: t >= 0.5 ? b : a }
}
