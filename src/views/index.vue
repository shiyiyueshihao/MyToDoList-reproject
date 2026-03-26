<template>
  <div class="todo-page-container">
    <!-- 代办列表区域 -->
    <div class="todo-list-scroll">
      <div v-if="todos.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无代办事项，点击下方按钮开始规划</p>
      </div>
      <TodoItem 
        v-for="todo in todos" 
        :key="todo.id" 
        :todo="todo" 
        @delete-todo="deleteTodo"
        @enlarge-image="openImageModal"
      />
    </div>

    <!-- 悬浮添加按钮 -->
    <button class="fab-add-btn" @click="showAddModal = true" title="新增代办">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>

    <!-- 新增代办模态框 -->
    <Transition name="fade">
      <div v-if="showAddModal" class="add-todo-modal-overlay" @click.self="closeAddModal">
        <div class="add-todo-card" 
             @dragover.prevent="isDragging = true" 
             @dragleave.prevent="isDragging = false" 
             @drop.prevent="handleDrop"
             :class="{ 'is-dragging': isDragging }">
          
          <div class="modal-header">
            <h3>新增代办事项</h3>
            <button class="close-btn" @click="closeAddModal">×</button>
          </div>

          <div class="modal-body">
            <textarea 
              v-model="newTodoText" 
              placeholder="有什么新计划？可以直接拖入图片..." 
              class="modal-textarea"
              ref="todoTextarea"
            ></textarea>

            <!-- 待上传图片预览 -->
            <div v-if="tempImages.length > 0" class="modal-temp-images">
              <div v-for="(img, i) in tempImages" :key="i" class="temp-img-wrapper">
                <img :src="img" />
                <div class="remove-btn" @click="tempImages.splice(i, 1)">×</div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <div class="drag-hint">支持图片拖拽</div>
            <button class="submit-btn" @click="addTodo" :disabled="!newTodoText.trim() && tempImages.length === 0">
              确认添加
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 图片放大弹窗 -->
    <ImageModal 
      :show="showModal" 
      :image-url="modalImageUrl" 
      @close="showModal = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue';
import TodoItem from '../components/TodoItem.vue';
import ImageModal from '../components/ImageModal.vue';

const currentTheme = ref('tech');

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  images: string[];
  subTodos: Todo[];
  updatedAt: string;
  color: string;
}

const themes = [
  { id: 'tech', name: '科技感', color: '#007aff' },
  { id: 'minimal', name: '简约版', color: '#475569' },
  { id: 'pink', name: '桃花粉', color: '#fb7185' },
  { id: 'black', name: '纯黑版', color: '#222222' }
];

const todos = ref<Todo[]>([]);
const newTodoText = ref('');
const tempImages = ref<string[]>([]);
const isDragging = ref(false);
const showAddModal = ref(false);
const todoTextarea = ref<HTMLTextAreaElement | null>(null);

const showModal = ref(false);
const modalImageUrl = ref('');

const formatTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

const addTodo = () => {
  if (!newTodoText.value.trim() && tempImages.value.length === 0) return;
  
  const newTodo: Todo = {
    id: Date.now().toString(),
    text: newTodoText.value,
    completed: false,
    images: [...tempImages.value],
    subTodos: [],
    updatedAt: formatTime(new Date()),
    color: '' // 默认为空，随主题色走
  };
  
  todos.value.unshift(newTodo);
  closeAddModal();
};

const closeAddModal = () => {
  showAddModal.value = false;
  newTodoText.value = '';
  tempImages.value = [];
};

watch(showAddModal, (val) => {
  if (val) {
    nextTick(() => {
      todoTextarea.value?.focus();
    });
  }
});

const deleteTodo = (id: string) => {
  const index = todos.value.findIndex(t => t.id === id);
  if (index > -1) {
    todos.value.splice(index, 1);
  }
};

const openImageModal = (url: string) => {
  modalImageUrl.value = url;
  showModal.value = true;
};

// Tauri 原生拖放处理
let unlistenDragDrop: any = null;

const handleFiles = (files: string[]) => {
  files.forEach(async (path) => {
    // 检查是否为图片（简单通过后缀名）
    if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path)) {
      try {
        const { convertFileSrc } = await import('@tauri-apps/api/core');
        const assetUrl = convertFileSrc(path);
        
        // 通过 fetch 获取图片内容并转为 Base64
        const response = await fetch(assetUrl);
        const blob = await response.blob();
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            if (showAddModal.value) {
              tempImages.value.push(e.target.result as string);
            } else {
              showAddModal.value = true;
              tempImages.value.push(e.target.result as string);
            }
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Failed to process dropped file:', e);
      }
    }
  });
};

const setupNativeDragDrop = async () => {
  if (window.__TAURI_INTERNALS__) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    unlistenDragDrop = await appWindow.onDragDropEvent((event) => {
      if (event.payload.type === 'drop') {
        const paths = event.payload.paths;
        handleFiles(paths);
      } else if (event.payload.type === 'enter') {
        isDragging.value = true;
      } else if (event.payload.type === 'leave' || event.payload.type === 'cancelled') {
        isDragging.value = false;
      }
    });
  }
};

// 浏览器拖放兜底
const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            tempImages.value.push(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

onMounted(() => {
  const savedTodos = localStorage.getItem('my-todos-v2');
  if (savedTodos) {
    try {
      todos.value = JSON.parse(savedTodos);
    } catch (e) {
      console.error('Failed to parse todos:', e);
    }
  }
  setupNativeDragDrop();
});

onUnmounted(() => {
  if (unlistenDragDrop) unlistenDragDrop();
});

watch(todos, (newVal) => {
  localStorage.setItem('my-todos-v2', JSON.stringify(newVal));
}, { deep: true });
</script>

<style scoped lang="scss">
.todo-page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 12px 20px; // 减小左右内边距，从 20px 降到 12px
  background: var(--bg-main);
  position: relative;
}

.todo-list-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  mask-image: linear-gradient(to bottom, transparent, black 20px, black calc(100% - 20px), transparent);

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 10px;
  }
}

.fab-add-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 16px; /* 更符合现代科技感的方圆角 */
  background: var(--accent-color);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 20px var(--shadow-color);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 100;

  &:hover {
    transform: scale(1.1) translateY(-5px);
    box-shadow: 0 12px 25px var(--shadow-color);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

.add-todo-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-todo-card {
  width: 95%;
  max-width: 360px; /* 缩小模态框宽度以适配 400 宽度的窗口 */
  background: var(--bg-item);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  animation: modal-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;

  /* Tech corner decoration */
  &::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    width: 40px;
    height: 40px;
    background: var(--accent-color);
    opacity: 0.1;
    transform: rotate(45deg);
  }

  &.is-dragging {
    border-color: var(--accent-color);
    background: rgba(0, 122, 255, 0.02);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .close-btn {
      background: transparent;
      border: none;
      font-size: 24px;
      color: var(--text-secondary);
      cursor: pointer;
      line-height: 1;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      
      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--text-primary);
      }
    }
  }

  .modal-textarea {
    width: 100%;
    height: 140px;
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    color: var(--text-primary);
    font-size: 16px;
    resize: none;
    outline: none;
    margin-bottom: 20px;
    transition: all 0.2s ease;

    &:focus {
      border-color: var(--accent-color);
      background: rgba(0, 0, 0, 0.2);
      box-shadow: 0 0 0 4px var(--shadow-color);
    }
  }

  .modal-temp-images {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 20px;

    .temp-img-wrapper {
      position: relative;
      width: 70px;
      height: 70px;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        backdrop-filter: blur(4px);
        
        &:hover {
          background: #ef4444;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .drag-hint {
      font-size: 13px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;

      &::before {
        content: '📸';
        font-size: 14px;
      }
    }

    .submit-btn {
      padding: 12px 28px;
      background: var(--accent-color);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        background: var(--text-secondary);
      }

      &:hover:not(:disabled) {
        filter: brightness(1.05);
        transform: translateY(-2px);
        box-shadow: 0 5px 15px var(--shadow-color);
      }
    }
  }
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
  opacity: 0.8;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 24px;
    filter: grayscale(0.5);
  }
  
  p {
    font-size: 16px;
    font-weight: 500;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
