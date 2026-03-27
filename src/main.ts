import "./styles/style.css";
import { createApp } from "vue";
import App from "./App.vue";

// 禁用右键菜单
document.addEventListener('contextmenu', (e) => e.preventDefault());

// 禁用常见的调试快捷键 (F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J)
document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I', 'C', 'J'].includes(e.key)) ||
    (e.ctrlKey && e.key === 'U') // 禁用查看源码
  ) {
    e.preventDefault();
  }
});


createApp(App).mount("#app");
