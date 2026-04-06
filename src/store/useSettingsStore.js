import { create } from 'zustand'
import { fetchSettings, updateSettings } from '../services/firebase'
import bakeryData from '../data/bakeryData.json'

export const useSettingsStore = create((set, get) => ({
  settings: bakeryData,
  loading: false,

  init: async () => {
    set({ loading: true })
    try {
      const data = await fetchSettings()
      if (data) {
        set({ settings: { ...bakeryData, ...data } })
      }
    } catch (err) {
      console.error('Settings init error:', err)
    } finally {
      set({ loading: false })
    }
  },

  update: async (newData) => {
    try {
      await updateSettings(newData)
      set({ settings: { ...get().settings, ...newData } })
    } catch (err) {
      console.error('Settings update error:', err)
      throw err
    }
  }
}))
