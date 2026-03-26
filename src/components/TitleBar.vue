<template>
  <div class="title-bar" data-tauri-drag-region>
    <!-- 左侧：头像与应用名称 -->
    <div class="left-section" data-tauri-drag-region>
      <div class="avatar-wrapper" @click="goToGithub">
        <img src="../assets/avatar.png" alt="Avatar" class="avatar-img" />
        <div class="avatar-glow"></div>
      </div>
      <span class="app-title" data-tauri-drag-region>SHIYIYUE ToDoList</span>
    </div>

    <!-- 中间：空白区域用于拖拽 -->
    <div class="center-section" data-tauri-drag-region></div>

    <!-- 右侧：窗口控制按钮 -->
    <div class="right-section">
      <div class="control-btn minimize" @click="minimizeWindow" title="最小化">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      </div>
      <div class="control-btn close" @click="closeWindow" title="关闭">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { openUrl } from '@tauri-apps/plugin-opener';

const appWindow = ref(null);

onMounted(async () => {
  // 仅在 Tauri 环境下初始化窗口实例
  if (window.__TAURI_INTERNALS__) {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      appWindow.value = getCurrentWindow();
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
      font-size: 12px;
      font-weight: 600;
      color: #3a4a5a;
      letter-spacing: 1.2px;
      font-family: 'JetBrains Mono', 'Fira Code', monospace; /* 科技感字体 */
      text-transform: uppercase;
      opacity: 0.85;
      background: linear-gradient(90deg, #3a4a5a, #0090ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .center-section {
    flex: 1;
    height: 100%;
  }

  .right-section {
    display: flex;
    gap: 8px;

    .control-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: rgba(60, 80, 100, 0.6);
      border: 1px solid transparent;

      &:hover {
        background: rgba(0, 150, 255, 0.08);
        color: #0080ff;
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
