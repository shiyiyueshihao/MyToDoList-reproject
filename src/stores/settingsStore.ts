import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref('zh-CN')
  const autostart = ref(false)
  const onboardingCompleted = ref(false)
  const windowPosition = ref({ x: 0, y: 0 })
  const windowSize = ref({ width: 800, height: 600 })

  // 从 localStorage 加载
  function loadSettings() {
    const saved = localStorage.getItem('app-settings')
    if (saved) {
      try {
        const data = JSON.parse(saved)
        locale.value = data.locale || 'zh-CN'
        autostart.value = data.autostart || false
        onboardingCompleted.value = data.onboardingCompleted || false
        windowPosition.value = data.windowPosition || { x: 0, y: 0 }
        windowSize.value = data.windowSize || { width: 800, height: 600 }
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }

  // 保存到 localStorage
  function saveSettings() {
    const data = {
      locale: locale.value,
      autostart: autostart.value,
      onboardingCompleted: onboardingCompleted.value,
      windowPosition: windowPosition.value,
      windowSize: windowSize.value
    }
    localStorage.setItem('app-settings', JSON.stringify(data))
  }

  // 设置语言
  function setLocale(newLocale: string) {
    locale.value = newLocale
    saveSettings()
  }

  // 设置开机自启
  function setAutostart(enabled: boolean) {
    autostart.value = enabled
    saveSettings()
  }

  // 完成引导
  function completeOnboarding() {
    onboardingCompleted.value = true
    saveSettings()
  }

  // 设置窗口位置
  function setWindowPosition(x: number, y: number) {
    windowPosition.value = { x, y }
    saveSettings()
  }

  // 设置窗口大小
  function setWindowSize(width: number, height: number) {
    windowSize.value = { width, height }
    saveSettings()
  }

  // 监听变化自动保存
  watch([locale, autostart, onboardingCompleted, windowPosition, windowSize], () => {
    saveSettings()
  }, { deep: true })

  return {
    locale,
    autostart,
    onboardingCompleted,
    windowPosition,
    windowSize,
    loadSettings,
    saveSettings,
    setLocale,
    setAutostart,
    completeOnboarding,
    setWindowPosition,
    setWindowSize
  }
})
