import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SKINS } from './game/constants'

export const useGame = create(
  persist(
    (set, get) => ({
      screen: 'home',
      modal: null,
      best: 0,
      orbs: 0,
      skin: 'umbra',
      owned: ['umbra'],
      settings: { sound: true, music: true, quality: 'high' },

      setScreen: (screen) => set({ screen }),
      openModal: (modal) => set({ modal }),
      closeModal: () => set({ modal: null }),
      addOrbs: (n) => set((s) => ({ orbs: s.orbs + n })),
      submitRun: (score) => set((s) => ({ best: Math.max(s.best, score) })),
      equipSkin: (id) => { if (get().owned.includes(id)) set({ skin: id }) },
      buySkin: (id) => {
        const skin = SKINS.find((k) => k.id === id)
        const s = get()
        if (!skin || s.owned.includes(id) || s.orbs < skin.price) return false
        set({ orbs: s.orbs - skin.price, owned: [...s.owned, id], skin: id })
        return true
      },
      toggleSetting: (key) =>
        set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),
    }),
    {
      name: 'umbra-run-save',
      partialize: (s) => ({ best: s.best, orbs: s.orbs, skin: s.skin, owned: s.owned, settings: s.settings }),
    },
  ),
)
