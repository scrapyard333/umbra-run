import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SKINS } from './game/constants.js'
import { applyRun, applyStat, dailyFor, emptyStats, todayKey, templateOf } from './game/meta.js'

const initial = () => ({
  best: 0,
  orbs: 0,
  skin: 'kysora',
  owned: ['kysora'],
  world: 'auto',
  settings: { sound: true, music: true, quality: 'high' },
  stats: { ...emptyStats },
  achievements: [],
  daily: dailyFor(todayKey()),
  history: [],
  ghost: null,
})

export const useGame = create(
  persist(
    (set, get) => ({
      screen: 'home',
      modal: null,
      ...initial(),

      setScreen: (screen) => set({ screen }),
      openModal: (modal) => set({ modal }),
      closeModal: () => set({ modal: null }),
      setWorld: (world) => set({ world }),

      finishRun: (run) => {
        const { next, newly } = applyRun(get(), run)
        set(next)
        return newly
      },
      addStat: (key, n = 1) => {
        const { next, newly } = applyStat(get(), key, n)
        set(next)
        return newly
      },
      refreshDaily: () => {
        if (get().daily.date !== todayKey()) set({ daily: dailyFor(todayKey()) })
      },
      claimDaily: () => {
        const s = get()
        const t = templateOf(s.daily)
        if (s.daily.date !== todayKey() || s.daily.claimed || s.daily.progress < t.target) return 0
        set({ orbs: s.orbs + t.reward, daily: { ...s.daily, claimed: true } })
        return t.reward
      },

      equipSkin: (id) => { if (get().owned.includes(id)) set({ skin: id }) },
      buySkin: (id) => {
        const skin = SKINS.find((k) => k.id === id)
        const s = get()
        if (!skin || s.owned.includes(id) || s.orbs < skin.price) return false
        set({ orbs: s.orbs - skin.price, owned: [...s.owned, id], skin: id })
        return true
      },

      toggleSetting: (key) => set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),
      setAudio: (on) => set((s) => ({ settings: { ...s.settings, sound: on, music: on } })),
      setQuality: (quality) => set((s) => ({ settings: { ...s.settings, quality } })),
      resetProgress: () => set({ ...initial() }),
    }),
    {
      name: 'umbra-run-save',
      version: 2,
      migrate: (state, version) => {
        if (version < 2) {
          return { ...state, skin: 'kysora', owned: Array.from(new Set([...(state.owned || []), 'kysora'])), world: 'auto' }
        }
        return state
      },
      partialize: (s) => ({
        best: s.best, orbs: s.orbs, skin: s.skin, owned: s.owned, world: s.world, settings: s.settings,
        stats: s.stats, achievements: s.achievements, daily: s.daily, history: s.history, ghost: s.ghost,
      }),
    },
  ),
)
