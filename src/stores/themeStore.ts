import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('light')
  const primaryColor = ref('#409eff')
  const customColors = ref<Record<string, string>>({})

  // 从 localStorage 加载
  function loadTheme() {
    const saved = localStorage.getItem('app-theme')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        mode.value = data.mode || 'light'
        primaryColor.value = data.primaryColor || '#409eff'
        customColors.value = data.customColors || {}
      } catch (e) {
        console.error('Failed to load theme:', e)
      }
    }
    applyTheme()
  }

  // 保存到 localStorage
  function saveTheme() {
    const data = {
      mode: mode.value,
      primaryColor: primaryColor.value,
      customColors: customColors.value
    }
    localStorage.setItem('app-theme', JSON.stringify(data))
  }

  // 应用主题到 DOM
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', mode.value)
    document.documentElement.style.setProperty('--primary-color', primaryColor.value)

    Object.entries(customColors.value).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value)
    })
  }

  // 切换主题模式
  function toggleMode() {
    mode.value = mode.value === 'light' ? 'dark' : 'light'
    applyTheme()
    saveTheme()
  }

  // 设置主题模式
  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    applyTheme()
    saveTheme()
  }

  // 设置主色
  function setPrimaryColor(color: string) {
    primaryColor.value = color
    applyTheme()
    saveTheme()
  }

  // 设置自定义颜色
  function setCustomColor(key: string, value: string) {
    customColors.value[key] = value
    applyTheme()
    saveTheme()
  }

  // 监听变化自动保存
  watch([mode, primaryColor, customColors], () => {
    saveTheme()
  }, { deep: true })

  return {
    mode,
    primaryColor,
    customColors,
    loadTheme,
    saveTheme,
    applyTheme,
    toggleMode,
    setMode,
    setPrimaryColor,
    setCustomColor
  }
})
