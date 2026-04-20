<template>
  <div class="todo-page-container">
    <!-- 代办列表区域 -->
    <div class="todo-list-scroll" ref="taskListRef">
      <div v-if="todos.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>{{ t('todo.empty') }}</p>
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
    <button class="fab-add-btn" ref="fabBtnRef" @click="showAddModal = true" :title="t('todo.addNew')">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </button>

    <!-- Tour 引导 -->
    <el-tour v-model="showTour" :mask="{ color: 'rgba(0, 0, 0, 0.6)' }">
      <el-tour-step
        :target="fabBtnRef"
        :title="t('tour.addButton')"
        :description="t('tour.addButtonDesc')"
      />
      <el-tour-step
        :target="taskListRef"
        :title="t('tour.taskList')"
        :description="t('tour.taskListDesc')"
      />
      <el-tour-step
        :target="settingsBtnRef"
        :title="t('tour.settings')"
        :description="t('tour.settingsDesc')"
      />
    </el-tour>

    <!-- 新增代办模态框 -->
    <Transition name="fade">
      <div v-if="showAddModal" class="add-todo-modal-overlay" @click.self="closeAddModal">
        <div class="add-todo-card" 
             @dragover.prevent="isDragging = true" 
             @dragleave.prevent="isDragging = false" 
             @drop.prevent="handleDrop"
             :class="{ 'is-dragging': isDragging }">
          
          <div class="modal-header">
            <h3>{{ t('todo.addNewTitle') }}</h3>
            <button class="close-btn" @click="closeAddModal">×</button>
          </div>

          <div class="modal-body" @click.self="focusEditor">
            <div
              ref="todoEditor"
              contenteditable="true"
              spellcheck="false"
              class="modal-rich-editor edit-rich-input"
              :placeholder="t('todo.placeholder')"
              @paste="onPaste"

              @dblclick="handleEditClick"
            ></div>
          </div>

          <div class="modal-footer">
            <button class="submit-btn" @click="addTodo">
              {{ t('todo.confirmAdd') }}
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
import { useI18n } from 'vue-i18n';
import { useAppSettings } from '../composables/useAppSettings';
import TodoItem from '../components/TodoItem.vue';
import ImageModal from '../components/ImageModal.vue';

const { t } = useI18n();
const { settings, setTourSeen } = useAppSettings();

// Tour 相关
const showTour = ref(false);
const fabBtnRef = ref<HTMLElement | null>(null);
const taskListRef = ref<HTMLElement | null>(null);
const settingsBtnRef = ref<HTMLElement | null>(null);

// Tour 关闭时标记已查看
watch(showTour, (val) => {
  if (!val && settings.value.tourSeenVersion !== 'v1') {
    setTourSeen('v1');
  }
});

// IndexedDB 工具函数，用于替代 localStorage，避免 QuotaExceededError
const DB_NAME = 'TodoAppDB';
const STORE_NAME = 'todos_store';
const TODOS_KEY = 'my-todos-v2';
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  images: string[];
  subTodos: Todo[];
  updatedAt: string;
  color: string;
}

const saveTodosToDB = async (data: Todo[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // 深拷贝一份数据以解除响应式绑定，防止 IndexedDB 序列化错误
      store.put(JSON.parse(JSON.stringify(data)), TODOS_KEY); 
      tx.oncomplete = () => resolve(); 
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save to IndexedDB:', err);
  }
};

const loadTodosFromDB = async (): Promise<Todo[] | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(TODOS_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to load from IndexedDB:', err);
    return null;
  }
};

declare global {
  interface Window {
    isDraggingFile: boolean;
    __TAURI_INTERNALS__: any;
  }
}
window.isDraggingFile = false;

// @ts-ignore
const currentTheme = ref('tech');  // 声明未读取

// @ts-ignore
const themes = [ // 声明未读取
  { id: 'tech', name: '科技感', color: '#007aff' },
  { id: 'minimal', name: '简约版', color: '#475569' },
  { id: 'pink', name: '桃花粉', color: '#fb7185' },
  { id: 'black', name: '纯黑版', color: '#222222' }
];

const todos = ref<Todo[]>([]);
const isDragging = ref(false);
const showAddModal = ref(false);
const todoEditor = ref<HTMLDivElement | null>(null);

const showModal = ref(false);
const modalImageUrl = ref('');

const formatTime = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}年${m}月${d}日 ${h}:${min}`;
};

const focusEditor = () => {
  if (todoEditor.value) {
    todoEditor.value.focus();
  }
};

const insertImageAtCursor = (dataUrl: string) => {
  if (todoEditor.value) {
    todoEditor.value.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = 'inline-rich-img';
      range.insertNode(img);
      
      // 光标移到图片后
      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = 'inline-rich-img';
      todoEditor.value.appendChild(img);
      
      const range = document.createRange();
      range.setStartAfter(img);
      range.setEndAfter(img);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
};

const onPaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            insertImageAtCursor(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

const addTodo = () => {
  const content = todoEditor.value?.innerHTML || '';
  if (!content.trim() || content === '<br>') return;
  
  const newTodo: Todo = {
    id: Date.now().toString(),
    text: content,
    completed: false,
    images: [], // 统一存入 text 中
    subTodos: [],
    updatedAt: formatTime(new Date()),
    color: '' 
  };
  
  todos.value.unshift(newTodo);
  closeAddModal();
};

const closeAddModal = () => {
  showAddModal.value = false;
  if (todoEditor.value) todoEditor.value.innerHTML = '';
};

watch(showAddModal, (val) => {
  if (val) {
    nextTick(() => {
      todoEditor.value?.focus();
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

const handleEditClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'IMG' && target.classList.contains('inline-rich-img')) {
    openImageModal((target as HTMLImageElement).src);
  }
};

// Tauri 原生拖放处理
let unlistenDragDrop: any = null;

const handleFiles = async (files: string[], position?: {x: number, y: number}) => {
  if (window.__TAURI_INTERNALS__) {
    try {
      const { readFile } = await import('@tauri-apps/plugin-fs');
      
      for (const path of files) {
        if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path)) {
          try {
            const contents = await readFile(path);
            let binary = '';
            const bytes = new Uint8Array(contents);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = window.btoa(binary);
            
            const ext = path.split('.').pop()?.toLowerCase();
            const mimeType = ext === 'jpg' ? 'jpeg' : ext;
            const dataUrl = `data:image/${mimeType};base64,${base64}`;
            
            let target: Element | null = null;
            if (position) {
              const el = document.elementFromPoint(position.x, position.y);
              if (el) target = el.closest('.edit-rich-input');
            }
            if (!target && document.activeElement && document.activeElement.classList.contains('edit-rich-input')) {
              target = document.activeElement;
            }

            if (target) {
              if (target instanceof HTMLElement) target.focus();
              const img = document.createElement('img');
              img.src = dataUrl;
              img.className = 'inline-rich-img';
              target.appendChild(img);
              
              // 将光标移到图片后
              const range = document.createRange();
              range.setStartAfter(img);
              range.setEndAfter(img);
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
              
              target.dispatchEvent(new Event('input', { bubbles: true }));
            } else if (showAddModal.value) {
              insertImageAtCursor(dataUrl);
            }
          } catch (e) {
            console.error('Failed to read file:', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to import fs plugin:', err);
    }
  }
};

const setupNativeDragDrop = async () => {
  if (window.__TAURI_INTERNALS__) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    unlistenDragDrop = await appWindow.onDragDropEvent((event) => {
      if (event.payload.type === 'enter') {
        window.isDraggingFile = true;
      } else if (event.payload.type === 'drop') {
        window.isDraggingFile = false;
        handleFiles(event.payload.paths, event.payload.position);
      } else {
        window.isDraggingFile = false;
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
            insertImageAtCursor(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

onMounted(async () => {
  // 1. 优先尝试从 IndexedDB 加载
  const dbTodos = await loadTodosFromDB();
  if (dbTodos) {
    todos.value = dbTodos;
  } else {
    // 2. 如果 DB 中没有，尝试从旧版本 localStorage 迁移数据
    const savedTodos = localStorage.getItem('my-todos-v2');
    if (savedTodos) {
      try {
        todos.value = JSON.parse(savedTodos);
        // 数据迁移后，为了释放 localStorage 空间可以将其移除（可选）
        // localStorage.removeItem('my-todos-v2');
      } catch (e) {
        console.error('Failed to parse todos from localStorage:', e);
      }
    }
  }

  setupNativeDragDrop();

  // 检查是否需要显示 Tour
  if (!settings.value.tourSeenVersion || settings.value.tourSeenVersion !== 'v1') {
    setTimeout(() => {
      // 通过 DOM 查询获取设置按钮
      const settingsBtn = document.querySelector('.settings-btn') as HTMLElement;
      if (settingsBtn) {
        settingsBtnRef.value = settingsBtn;
      }
      showTour.value = true;
    }, 500);
  }

  // 添加关闭前保存
  window.addEventListener('beforeunload', () => {
    saveTodosToDB(todos.value);
  });
});

onUnmounted(() => {
  if (unlistenDragDrop) unlistenDragDrop();
  // 卸载时也保存一次
  saveTodosToDB(todos.value);
});

watch(todos, (newVal) => {
  // 使用 IndexedDB 替代 localStorage，避免图片太多导致的配额超限报错
  saveTodosToDB(newVal);
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
  padding-bottom: 110px;
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

  .modal-rich-editor {
    width: 100%;
    min-height: 140px;
    max-height: 300px;
    background: rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    color: var(--text-primary);
    font-size: 16px;
    outline: none;
    margin-bottom: 20px;
    transition: all 0.2s ease;
    overflow-y: auto;
    text-align: left;
    line-height: 1.6;

    &:focus {
      border-color: var(--accent-color);
      background: rgba(0, 0, 0, 0.2);
      box-shadow: 0 0 0 4px var(--shadow-color);
    }

    &:empty:before {
      content: attr(placeholder);
      color: var(--text-secondary);
      opacity: 0.5;
    }

    :deep(.inline-rich-img) {
      height: 1.5em;
      width: auto;
      vertical-align: bottom;
      margin: 0 4px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: inline-block;
      cursor: zoom-in;
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
