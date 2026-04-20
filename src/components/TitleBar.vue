<template>
  <div class="title-bar" data-tauri-drag-region>
    <!-- 左侧：头像与应用名称 -->
    <div class="left-section" data-tauri-drag-region>
      <div class="avatar-wrapper" @click="goToGithub">
        <img src="../assets/avatar.png" alt="Avatar" class="avatar-img" />
        <div class="avatar-glow"></div>
      </div>
      <span class="app-title" data-tauri-drag-region>{{ t('app.title') }}</span>
    </div>

    <!-- 中间：空白区域用于拖拽 -->
    <div class="center-section" data-tauri-drag-region></div>

    <!-- 右侧：窗口控制按钮 -->
    <div class="right-section">
      <!-- 主题设置按钮 -->
      <div class="control-btn settings-btn" ref="settingsBtnRef" @click="showThemeMenu = !showThemeMenu" :title="t('titleBar.settings')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="1"></circle>
          <circle cx="19" cy="12" r="1"></circle>
          <circle cx="5" cy="12" r="1"></circle>
        </svg>
      </div>

      <!-- 主题切换菜单 -->
      <Transition name="slide-up">
        <div v-if="showThemeMenu" class="theme-menu" @mouseleave="showThemeMenu = false">
          <div class="menu-section">
            <div class="menu-label">{{ t('titleBar.themes.tech') }}</div>
            <div
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              @click="handleSetTheme(theme.id)"
              :class="{ active: settings.theme === theme.id }"
            >
              <div class="theme-dot" :style="{ background: theme.color }"></div>
              <span>{{ theme.name }}</span>
            </div>
          </div>

          <div class="menu-divider"></div>

          <div class="menu-section">
            <div class="menu-label">{{ t('titleBar.language') }}</div>
            <div
              v-for="lang in languages"
              :key="lang.code"
              class="theme-option"
              @click="handleSetLocale(lang.code)"
              :class="{ active: settings.locale === lang.code }"
            >
              <span>{{ lang.name }}</span>
            </div>
          </div>

          <div class="menu-divider"></div>

          <div class="menu-section">
            <div class="menu-label">{{ t('titleBar.autostart') }}</div>
            <div
              class="theme-option"
              @click="toggleAutostart"
            >
              <div class="autostart-toggle" :class="{ active: autostartEnabled }">
                <div class="toggle-slider"></div>
              </div>
              <span>{{ autostartEnabled ? '已启用' : '已禁用' }}</span>
            </div>
          </div>
        </div>
      </Transition>

      <div class="control-btn minimize" @click="minimizeWindow" :title="t('titleBar.minimize')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>
      <div class="control-btn close" @click="closeWindow" :title="t('titleBar.close')">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useI18n } from 'vue-i18n';
import { useAppSettings } from '../composables/useAppSettings';

const { t, locale } = useI18n();
const { settings, setTheme, setLocale, setAutostartEnabled } = useAppSettings();

const appWindow = ref(null);
const showThemeMenu = ref(false);
const settingsBtnRef = ref(null);
const autostartEnabled = ref(settings.value.autostartEnabled);

const themes = computed(() => [
  { id: 'tech', name: t('titleBar.themes.tech'), color: '#007aff' },
  { id: 'minimal', name: t('titleBar.themes.minimal'), color: '#475569' },
  { id: 'pink', name: t('titleBar.themes.pink'), color: '#fb7185' },
  { id: 'black', name: t('titleBar.themes.black'), color: '#222222' }
]);

const languages = [
  { code: 'zh-CN', name: '中文' },
  { code: 'en-US', name: 'English' }
];

const handleSetTheme = (id) => {
  setTheme(id);
  showThemeMenu.value = false;
};

const handleSetLocale = (code) => {
  setLocale(code);
  locale.value = code;
  showThemeMenu.value = false;
};

const toggleAutostart = async () => {
  if (window.__TAURI_INTERNALS__) {
    try {
      const { enable, disable, isEnabled } = await import('@tauri-apps/plugin-autostart');

      if (autostartEnabled.value) {
        await disable();
        autostartEnabled.value = false;
      } else {
        await enable();
        autostartEnabled.value = true;
      }

      setAutostartEnabled(autostartEnabled.value);
    } catch (e) {
      console.error('Failed to toggle autostart:', e);
    }
  }
};

onMounted(async () => {
  document.documentElement.setAttribute('data-theme', settings.value.theme);
  locale.value = settings.value.locale;

  // 仅在 Tauri 环境下初始化窗口实例
  if (window.__TAURI_INTERNALS__) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      appWindow.value = getCurrentWindow();

      // 检查自启动状态
      const { isEnabled } = await import('@tauri-apps/plugin-autostart');
      autostartEnabled.value = await isEnabled();
      setAutostartEnabled(autostartEnabled.value);
    } catch (e) {
      console.error('Failed to initialize Tauri window:', e);
    }
  }
});

const goToGithub = async () => {
  if (window.__TAURI_INTERNALS__) {
    await openUrl('https://github.com/nextlevelbuilder');
  } else {
    window.open('https://github.com/nextlevelbuilder', '_blank');
  }
};

const minimizeWindow = async () => {
  if (appWindow.value) {
    await appWindow.value.minimize();
  }
};

const toggleMaximize = async () => {
  if (appWindow.value) {
    await appWindow.value.toggleMaximize();
  }
};

const closeWindow = async () => {
  if (appWindow.value) {
    await appWindow.value.close();
  }
};
</script>

<style scoped lang="scss">
.title-bar {
  height: 36px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px) saturate(160%);
  border-bottom: 1px solid rgba(0, 180, 255, 0.15);
  user-select: none;
  z-index: 9999;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 150, 255, 0.05);

  .left-section {
    display: flex;
    align-items: center;
    gap: 14px;

    .avatar-wrapper {
      position: relative;
      width: 24px;
      height: 24px;
      cursor: pointer;
      border-radius: 4px; /* 更硬朗的圆角 */
      overflow: hidden;
      border: 1px solid rgba(0, 200, 255, 0.4);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      background: rgba(0, 150, 255, 0.1);

      &:hover {
        border-color: rgba(0, 220, 255, 0.8);
        box-shadow: 0 0 12px rgba(0, 200, 255, 0.4);
        transform: rotate(5deg) scale(1.1);
      }

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: brightness(1.1) contrast(1.05);
      }

      .avatar-glow {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, rgba(0, 200, 255, 0.1), transparent);
        pointer-events: none;
      }
    }

    .app-title {
      font-size: 13px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 1.5px;
      font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
      text-transform: uppercase;
      text-shadow: 0 0 10px rgba(56, 189, 248, 0.5), 0 0 20px rgba(56, 189, 248, 0.3);
      opacity: 1;
    }
  }

  .center-section {
    flex: 1;
    height: 100%;
  }

  .right-section {
    display: flex;
    gap: 8px;
    position: relative;

    .theme-menu {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: var(--bg-item);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 8px;
      min-width: 140px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      backdrop-filter: blur(10px);

      .menu-section {
        padding: 4px 0;
      }

      .menu-label {
        font-size: 10px;
        color: var(--text-secondary);
        padding: 4px 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .menu-divider {
        height: 1px;
        background: var(--border-color);
        margin: 6px 0;
      }

      .theme-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        &.active {
          background: rgba(0, 144, 255, 0.1);
          span {
            color: var(--accent-color);
            font-weight: 600;
          }
        }

        .theme-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        span {
          font-size: 12px;
          color: var(--text-primary);
        }
      }

      .autostart-toggle {
        width: 36px;
        height: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        position: relative;
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);

        &.active {
          background: var(--accent-color);
          border-color: var(--accent-color);

          .toggle-slider {
            transform: translateX(16px);
          }
        }

        .toggle-slider {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 1px;
          left: 1px;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      }
    }

    .control-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--text-primary);
      border: 1px solid transparent;

      &:hover {
        background: rgba(0, 150, 255, 0.08);
        color: var(--accent-color);
        border-color: rgba(0, 150, 255, 0.2);
        box-shadow: 0 0 8px rgba(0, 150, 255, 0.1);
      }

      &.close:hover {
        background: rgba(255, 77, 79, 0.1);
        color: #ff4d4f;
        border-color: rgba(255, 77, 79, 0.3);
        box-shadow: 0 0 10px rgba(255, 77, 79, 0.2);
      }

      svg {
        stroke-width: 2.5;
      }
    }
  }
}
</style>
