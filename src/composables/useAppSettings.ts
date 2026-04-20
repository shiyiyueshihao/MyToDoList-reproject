import { ref, watch } from 'vue'

export interface AppSettings {
  theme: string
  locale: string
  tourSeenVersion: string
  autostartEnabled: boolean
}

const SETTINGS_KEY = 'app-settings-v1'

const defaultSettings: AppSettings = {
  theme: 'black',
  locale: 'zh-CN',
  tourSeenVersion: '',
  autostartEnabled: false
}

const loadSettings = (): AppSettings => {
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

const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    localStorage.setItem('todo-theme', settings.theme)
    localStorage.setItem('app-locale', settings.locale)
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export const useAppSettings = () => {
  const settings = ref<AppSettings>(loadSettings())

  watch(settings, (newSettings) => {
    saveSettings(newSettings)
    document.documentElement.setAttribute('data-theme', newSettings.theme)
  }, { deep: true })

  const setTheme = (theme: string) => {
    settings.value.theme = theme
  }

  const setLocale = (locale: string) => {
    settings.value.locale = locale
  }

  const setTourSeen = (version: string) => {
    settings.value.tourSeenVersion = version
  }

  const setAutostartEnabled = (enabled: boolean) => {
    settings.value.autostartEnabled = enabled
  }

  return {
    settings,
    setTheme,
    setLocale,
    setTourSeen,
    setAutostartEnabled
  }
}
