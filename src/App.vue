<template>
  <div class="main-window">
    <TitleBar />
    <!-- 
    <div class="content-wrapper" data-tauri-drag-region>
      <img 
        src="./assets/avatar.png" 
        class="my-avatar" 
        @click="goToGithub" 
        title="点击访问我的 GitHub"
      />
    </div> 
    -->
    <div class="main-content">
      <IndexView />
    </div>
  </div>
</template>


<script setup>
import { onMounted } from 'vue';
import { openUrl } from '@tauri-apps/plugin-opener'; // Tauri 2.0 
import TitleBar from './components/TitleBar.vue';
import IndexView from './views/index.vue';

const goToGithub = async () => {
  if (window.__TAURI_INTERNALS__) {
    // 调用系统默认浏览器打开链接
    await openUrl('https://github.com/shiyiyueshihao');
  } else {
    window.open('https://github.com/shiyiyueshihao', '_blank');
  }
};

const showWeChat = () => {
  alert('我的微信号是：SHIYIYUE_XXXX');
};
onMounted(async () => {
  // 检查是否在 Tauri 环境中
  if (window.__TAURI_INTERNALS__) {
    try {
      // 动态导入，防止在一些环境下提前触发 metadata 读取
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      
      // 使用 requestAnimationFrame 确保 DOM 已经开始渲染
      requestAnimationFrame(() => {
        setTimeout(async () => {
          await appWindow.show();
          await appWindow.setFocus(); // 显影后自动聚焦
        }, 200); 
      });
    } catch (e) {
      console.error('Failed to show window:', e);
    }
  } else {
    console.log('正在浏览器环境运行，跳过窗口显示逻辑');
  }
});
</script>


<style scoped lang="scss">
.main-window {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(240, 245, 255, 0.5) 100%);
  backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  /* 科技感微弱内阴影 */
  box-shadow: inset 0 0 40px rgba(0, 150, 255, 0.02);
}

/* 
.my-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  cursor: pointer;
}
*/

/* 建议给 body 或 container 设置一个固定的背景色，防止透明穿透 */
body {
  background-color: #ffffff;
  margin: 0;
  overflow: hidden;
}
</style>