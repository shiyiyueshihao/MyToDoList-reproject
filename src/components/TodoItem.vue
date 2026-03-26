<template>
  <div class="todo-item-container" 
       :class="{ 'is-completed': todo.completed, 'is-sub': depth > 0, 'is-hovering-drag': isHoveringDrag }"
       @dragenter.prevent="handleDragEnter"
       @dragleave.prevent="handleDragLeave"
       @dragover.prevent
       @drop.prevent="handleDropLocal">
    
    <div class="todo-main-row" :style="{ 
      borderLeftColor: todo.color || 'var(--accent-color)',
      background: todo.color ? (todo.color + '15') : 'var(--bg-item)'
    }">
      <!-- 左侧：勾选框（居中） -->
      <div class="left-section">
        <div class="checkbox-wrapper" @click="toggleCompleted">
          <div class="custom-checkbox">
            <svg v-if="todo.completed" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
        </div>
      </div>

      <!-- 中间：内容与操作 -->
      <div class="middle-section">
        <div class="header-row">
          <!-- 任务内容：占据剩余空间 -->
          <div class="text-content" v-if="!isEditing" @dblclick="startEditing">
            <span class="text-display" :title="todo.text">{{ todo.text || '(暂无内容)' }}</span>
          </div>
          <div class="edit-mode-content" v-else>
            <input 
              ref="editInput"
              v-model="todo.text" 
              class="edit-input" 
              @blur="stopEditing" 
              @keyup.enter="stopEditing"
              @keydown.enter.stop
            />
          </div>
          
          <!-- 右侧元信息与操作：紧凑排列 -->
          <div class="todo-actions-row">
            <span class="updated-time">{{ todo.updatedAt.split(' ')[1] }}</span>
            <div class="status-dot" :title="todo.completed ? '已完成' : '进行中'"
                 :style="{ background: todo.color || 'var(--accent-color)', opacity: todo.completed ? 0.5 : 1 }">
            </div>
            
            <div class="actions-group">
              <button v-if="!isEditing" class="mini-btn edit" @click="startEditing" title="编辑">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
              <button v-else class="mini-btn save" @click="stopEditing" title="保存">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </button>

              <div class="color-dot-trigger" :style="{ background: todo.color || 'var(--accent-color)' }">
                <input type="color" v-model="todo.color" class="color-input" />
              </div>
              
              <button class="mini-btn collapse" v-if="todo.subTodos?.length" @click="isExpanded = !isExpanded" :class="{ 'is-collapsed': !isExpanded }">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>
              
              <button class="mini-btn add" @click="showAddSub = !showAddSub" title="子任务">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              
              <button class="mini-btn delete" @click="$emit('delete-todo', todo.id)" title="删除">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 图片预览列表（如果有图片则另起一行） -->
        <div v-if="todo.images && todo.images.length > 0" class="image-preview-list">
          <div 
            v-for="(img, idx) in todo.images" 
            :key="idx" 
            class="img-thumb-wrapper"
            @dblclick.stop="$emit('enlarge-image', img)"
          >
            <img :src="img" class="img-thumb" />
            <div class="img-remove" @click.stop="removeImage(idx)">×</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子任务输入框 -->
    <div v-if="showAddSub" class="sub-input-wrapper">
      <input 
        v-model="newSubText" 
        class="sub-input" 
        placeholder="输入子任务并回车，支持拖入图片" 
        @keyup.enter="handleAddSub"
      />
      <div v-if="tempImages.length > 0" class="temp-images">
        <div v-for="(img, i) in tempImages" :key="i" class="temp-img-item">
          <img :src="img" />
          <span class="remove-temp" @click="tempImages.splice(i, 1)">×</span>
        </div>
      </div>
    </div>

    <!-- 递归渲染子任务 -->
    <div v-if="isExpanded && todo.subTodos && todo.subTodos.length > 0" class="sub-todos-list">
      <TodoItem 
        v-for="sub in todo.subTodos" 
        :key="sub.id" 
        :todo="sub" 
        :depth="depth + 1"
        @delete-todo="deleteSubTodo"
        @enlarge-image="(url) => $emit('enlarge-image', url)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  todo: Object,
  depth: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['delete-todo', 'enlarge-image']);

const isEditing = ref(false);
const editInput = ref(null);
const showAddSub = ref(false);
const newSubText = ref('');
const tempImages = ref([]);
const isExpanded = ref(true);
const isHoveringDrag = ref(false);

const formatTime = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
};

// 监听内容变化，更新时间
watch(() => [props.todo.text, props.todo.completed, props.todo.color, props.todo.images?.length], () => {
  props.todo.updatedAt = formatTime(new Date());
}, { deep: true });

const startEditing = () => {
  isEditing.value = true;
  nextTick(() => {
    editInput.value?.focus();
    if (editInput.value) {
      editInput.value.style.height = 'auto';
      editInput.value.style.height = editInput.value.scrollHeight + 'px';
    }
  });
};

const stopEditing = () => {
  isEditing.value = false;
};

const toggleCompleted = () => {
  props.todo.completed = !props.todo.completed;
};

const handleAddSub = () => {
  if (!newSubText.value.trim() && tempImages.value.length === 0) return;
  
  const newSub = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: newSubText.value,
    completed: false,
    images: [...tempImages.value],
    subTodos: [],
    updatedAt: formatTime(new Date()),
    color: '' // 默认跟随主题，不跟随父组件颜色
  };
  
  if (!props.todo.subTodos) props.todo.subTodos = [];
  props.todo.subTodos.push(newSub);
  
  newSubText.value = '';
  tempImages.value = [];
  showAddSub.value = false;
  isExpanded.value = true;
};

const deleteSubTodo = (id) => {
  const index = props.todo.subTodos.findIndex(t => t.id === id);
  if (index > -1) {
    props.todo.subTodos.splice(index, 1);
  }
};

const removeImage = (idx) => {
  props.todo.images.splice(idx, 1);
};

// 拖放处理
const handleDragEnter = () => {
  isHoveringDrag.value = true;
};

const handleDragLeave = (e) => {
  // 仅当离开当前元素及其所有子元素时才重置
  if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
    isHoveringDrag.value = false;
  }
};

const processFiles = (files, targetList) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        targetList.push(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }
};

const handleDropLocal = (e) => {
  isHoveringDrag.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    if (!props.todo.images) props.todo.images = [];
    processFiles(files, props.todo.images);
  }
};

// Tauri 原生拖放兼容
let unlistenDragDrop = null;
const setupTauriDragDrop = async () => {
  if (window.__TAURI_INTERNALS__) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    unlistenDragDrop = await appWindow.onDragDropEvent(async (event) => {
      if (event.payload.type === 'drop' && isHoveringDrag.value) {
        const paths = event.payload.paths;
        for (const path of paths) {
          if (/\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(path)) {
            try {
              const { convertFileSrc } = await import('@tauri-apps/api/core');
              const assetUrl = convertFileSrc(path);
              
              const response = await fetch(assetUrl);
              const blob = await response.blob();
              
              const reader = new FileReader();
              reader.onload = (e) => {
                if (e.target?.result) {
                  if (!props.todo.images) props.todo.images = [];
                  props.todo.images.push(e.target.result);
                }
              };
              reader.readAsDataURL(blob);
            } catch (err) {
              console.error('Failed to process dropped file:', err);
            }
          }
        }
        isHoveringDrag.value = false;
      }
    });
  }
};

onMounted(() => {
  setupTauriDragDrop();
});

onUnmounted(() => {
  if (unlistenDragDrop) unlistenDragDrop();
});
</script>

<style scoped lang="scss">
.todo-item-container {
  margin-top: 10px;
  position: relative;
  transition: all 0.3s ease;
  padding-left: 4px; // 增加容器内边距，防止左侧阴影/边框被切断
  width: 100%;
  box-sizing: border-box;
  
  &.is-sub {
    margin-left: 8px; 
    padding-left: 6px;
    border-left: 1px solid var(--border-color);

    .todo-main-row {
      padding: 4px 6px; 
    }
  }

  &.is-hovering-drag {
    &::after {
      content: '释放以添加图片';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 122, 255, 0.1);
      border: 2px dashed var(--accent-color);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--accent-color);
      font-weight: 600;
      z-index: 10;
      backdrop-filter: blur(2px);
    }
  }

  &.is-completed {
    .text-display {
      color: var(--text-secondary);
      text-decoration: line-through;
      opacity: 0.6;
    }
    .todo-main-row {
      background: rgba(255, 255, 255, 0.5);
      border-left-width: 2px;
    }
    .img-thumb {
      filter: grayscale(0.8) opacity(0.5);
    }
  }
}

.todo-main-row {
  display: flex;
  align-items: center;
  gap: 4px; // 进一步减小间距
  padding: 4px 8px; // 紧凑内边距
  background: var(--bg-item);
  border-radius: var(--item-radius);
  border: 1px solid var(--border-color);
  border-left: 3px solid var(--accent-color);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--shadow-color);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    box-shadow: 0 4px 12px var(--shadow-color);
    border-color: var(--accent-color);
  }
}

.middle-section {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center; // 确保中间部分也垂直居中
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 2px; // 极窄间距
}

.text-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.text-display {
  font-size: 13px; // 字体微调
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.edit-mode-content {
  flex: 1;
  min-width: 0;
}

.edit-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--accent-color);
  color: var(--text-primary);
  font-size: 13px;
  padding: 1px 6px;
  border-radius: 4px;
  outline: none;
  font-family: inherit;
}

.todo-actions-row {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.updated-time {
  font-size: 8px; // 极小字体，只保留最基本信息
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  opacity: 0.3;
  margin-right: 2px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 0px; // 按钮直接紧挨着
  opacity: 0.6; // 默认低透明度
  transition: opacity 0.3s;
}

.todo-main-row:hover .actions-group {
  opacity: 1;
}

.mini-btn {
  width: 18px; // 进一步缩小
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s;
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--accent-color);
  }

  &.save {
    color: #10b981;
  }

  &.delete:hover {
    color: #ef4444;
  }

  &.collapse {
    transition: transform 0.3s;
    &.is-collapsed {
      transform: rotate(-90deg);
    }
  }
}

.color-dot-trigger {
  position: relative;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.2);
  cursor: pointer;
  flex-shrink: 0;

  .color-input {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 30px;
    height: 30px;
    padding: 0;
    border: none;
    cursor: pointer;
    opacity: 0;
  }
}

.checkbox-wrapper {
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-right: 2px;
  
  .custom-checkbox {
    width: 15px; // 极简勾选框
    height: 15px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: transparent;
  }
}

.image-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;

  .img-thumb-wrapper {
    position: relative;
    width: 54px;
    height: 54px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--border-color);
    cursor: zoom-in;
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
      border-color: var(--accent-color);
      box-shadow: 0 4px 10px var(--shadow-color);
      
      .img-remove {
        opacity: 1;
      }
    }

    .img-thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .img-remove {
      position: absolute;
      top: 2px; right: 2px;
      width: 16px; height: 16px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
      
      &:hover {
        background: #ef4444;
      }
    }
  }
}

.todo-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0.3;
  transition: opacity 0.3s;

  .color-picker-trigger {
    position: relative;
    width: 14px;
    height: 14px;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid rgba(0,0,0,0.1);
    
    .color-input {
      position: absolute;
      top: -10px;
      left: -10px;
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      cursor: pointer;
    }
  }

  .action-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-secondary);
      transition: all 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.05);
        color: var(--accent-color);
      }

      &.save {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }

      &.delete:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

    &.collapse-toggle {
      transition: transform 0.3s;
      &.is-collapsed {
        transform: rotate(-90deg);
      }
    }
  }
}

.todo-main-row:hover .todo-actions {
  opacity: 1;
}

.sub-input-wrapper {
  margin-top: 10px;
  margin-left: 32px;
  
  .sub-input {
    width: 100%;
    background: var(--bg-item);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    color: var(--text-primary);
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px var(--shadow-color);
    }
  }

  .temp-images {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    
    .temp-img-item {
      position: relative;
      width: 48px;
      height: 48px;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--border-color);
      }

      .remove-temp {
        position: absolute;
        top: -6px;
        right: -6px;
        width: 18px;
        height: 18px;
        background: #ef4444;
        color: white;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        cursor: pointer;
        z-index: 5;
      }
    }
  }
}

.sub-todos-list {
  padding-left: 0;
}
</style>
