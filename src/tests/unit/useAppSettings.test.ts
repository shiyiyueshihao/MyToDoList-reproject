import { describe, it, expect } from 'vitest'
import { useAppSettings } from '../../composables/useAppSettings'

describe('useAppSettings', () => {
  it('should initialize with default settings', () => {
    const { settings } = useAppSettings()
    expect(settings.value.theme).toBeDefined()
    expect(settings.value.locale).toBeDefined()
    expect(settings.value.tourSeenVersion).toBeDefined()
    expect(settings.value.autostartEnabled).toBeDefined()
  })

  it('should update theme', () => {
    const { settings, setTheme } = useAppSettings()
    setTheme('minimal')
    expect(settings.value.theme).toBe('minimal')
  })

  it('should update locale', () => {
    const { settings, setLocale } = useAppSettings()
    setLocale('en-US')
    expect(settings.value.locale).toBe('en-US')
  })

  it('should update tour seen version', () => {
    const { settings, setTourSeen } = useAppSettings()
    setTourSeen('v1')
    expect(settings.value.tourSeenVersion).toBe('v1')
  })

  it('should update autostart enabled', () => {
    const { settings, setAutostartEnabled } = useAppSettings()
    setAutostartEnabled(true)
    expect(settings.value.autostartEnabled).toBe(true)
  })
})
