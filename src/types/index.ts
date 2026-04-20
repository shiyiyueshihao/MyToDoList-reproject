/**
 * 统一类型定义
 */

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  color: string
  subs: SubTask[]
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: 'light' | 'dark'
  locale: 'zh-CN' | 'en-US'
  onboardingCompleted: boolean
  autostart: boolean
}

export interface ThemeColors {
  primary: string
  success: string
  warning: string
  danger: string
  info: string
  [key: string]: string
}

export interface EditorState {
  isFocused: boolean
  hasContent: boolean
  cursorPosition: number
}
