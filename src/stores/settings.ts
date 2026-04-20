import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface AppSettings {
  theme: string
  locale: string
  tourSeenVersion: string
  autostartEnabled: boolean
}

const SETTINGS_KEY = 'app-settings-v1'

const defaultSettings: AppSettings = {
  theme: 'tech',
  locale: 'zh-CN',
  tourSeenVersion: '',
  autostartEnabled: false
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings>(loadSettings())

  function loadSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY)
      if (saved) {
        return { ...defaultSettings, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }

    const legacyTheme = localStorage.getItem('todo-theme')
    const legacyLocale = localStorage.getItem('app-locale')

    return {
      ...defaultSettings,
      theme: legacyTheme || defaultSettings.theme,
      locale: legacyLocale || defaultSettings.locale
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
      localStorage.setItem('todo-theme', settings.value.theme)
      localStorage.setItem('app-locale', settings.value.locale)
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  watch(settings, () => {
    saveSettings()
    document.documentElement.setAttribute('data-theme', settings.value.theme)
  }, { deep: true })

  function setTheme(theme: string) {
    settings.value.theme = theme
  }

  function setLocale(locale: string) {
    settings.value.locale = locale
  }

  function setTourSeen(version: string) {
    settings.value.tourSeenVersion = version
  }

  function setAutostartEnabled(enabled: boolean) {
    settings.value.autostartEnabled = enabled
  }

  return {
    settings,
    setTheme,
    setLocale,
    setTourSeen,
    setAutostartEnabled
  }
})
