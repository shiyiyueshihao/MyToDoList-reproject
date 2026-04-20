<template>
  <div class="todo-item-container" 
       :class="{ 
         'is-completed': todo.completed || parentCompleted, 
         'is-sub': depth > 0, 
         'is-hovering-drag': isHoveringDrag,
         'is-parent-locked': parentCompleted
       }"
       @dragenter.prevent="handleDragEnter"
       @dragleave.prevent="handleDragLeave"
       @dragover.prevent
       @drop.prevent="handleDropLocal">
    
    <div class="todo-main-row" :style="{ 
      background: todo.color ? (todo.color + '15') : 'var(--bg-item)'
    }">
      <!-- 新的布局：顶部操作栏，底部内容 -->
      <div class="card-content-wrapper">
        <!-- 顶部：时间和操作 -->
        <div class="card-header">
          <span class="updated-time">{{ todo.updatedAt }}</span>
          
          <div class="actions-group">
            <button v-if="!isEditing" class="mini-btn edit" @click="startEditing" title="编辑">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button v-else class="mini-btn save" @click="stopEditing" title="保存">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </button>

            <div class="color-dot-trigger" :style="{ background: todo.color || 'var(--accent-color)' }">
              <input 
                type="color" 
                :value="todo.color || '#38bdf8'" 
                @input="todo.color = $event.target.value" 
                class="color-input" 
                @change="saveColor" 
              />
            </div>
            
            <button class="mini-btn collapse" v-if="todo.subTodos?.length" @click="isExpanded = !isExpanded" :class="{ 'is-collapsed': !isExpanded }">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
            
            <button v-if="depth < 3" class="mini-btn add" @click="toggleAddSub" title="子任务">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            
            <button class="mini-btn delete" @click="$emit('delete-todo', todo.id)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        <!-- 底部：勾选框与图文内容 -->
        <div class="card-body">
          <div class="checkbox-wrapper" @click="!parentCompleted && toggleCompleted()" :class="{ 'is-locked': parentCompleted }">
            <div class="custom-checkbox">
              <svg v-if="todo.completed || parentCompleted" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          </div>
          
          <div class="rich-text-container">
            <!-- 渲染图文混排的 HTML -->
            <div 
              class="rich-text-display" 
              v-if="!isEditing"
              v-html="todo.text || '(暂无内容)'"
              @dblclick="startEditing"
              @click="handleRichTextClick"
            ></div>
            
            <!-- 编辑模式：使用 contenteditable div 支持图文混排 -->
            <div class="edit-mode-content" v-else>
              <div
                ref="editDiv"
                contenteditable="true"
                spellcheck="false"
                class="edit-rich-input"
                placeholder="输入内容，支持拖入或粘贴图片到任意位置..."
                @blur="onEditBlur"
                @paste="onPaste"
                @click="handleRichTextClick"
                @dblclick="handleRichTextClick"
                @keydown.ctrl.enter="stopEditing"
                v-html="todo.text"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子任务输入框 -->
    <div v-if="showAddSub" class="sub-input-wrapper">
      <div class="sub-input-inner">
        <div
          ref="subEditDiv"
          contenteditable="true"
          spellcheck="false"
          class="edit-rich-input sub-rich-input"
          placeholder="输入子任务，支持拖入图片..."
          @keydown.enter.prevent="handleAddSub"
          @keydown.esc.prevent="cancelAddSub"
          @paste="onPaste"
          @dblclick="handleRichTextClick"
        ></div>
        <div class="sub-input-actions">
          <button class="sub-btn cancel" @click="cancelAddSub" title="取消 (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <button class="sub-btn confirm" @click="handleAddSub" title="确认 (Enter)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </button>
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
        :parentCompleted="todo.completed || parentCompleted"
        @delete-todo="deleteSubTodo"
        @enlarge-image="(url) => $emit('enlarge-image', url)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const props = defineProps({
  todo: Object,
  depth: {
    type: Number,
    default: 0
  },
  parentCompleted: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete-todo', 'enlarge-image', 'update-todo']);

const isEditing = ref(false);
const editDiv = ref(null);
const subEditDiv = ref(null);
const showAddSub = ref(false);
const isExpanded = ref(true);
const isHoveringDrag = ref(false);

const formatTime = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  // 根据语言返回不同格式
  if (locale.value === 'en-US') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${d}, ${y} ${h}:${min}`;
  }

  return `${y}年${m}月${d}日 ${h}:${min}`;
};

// 监听内容变化，更新时间
watch(() => [props.todo.text, props.todo.completed, props.todo.color], () => {
  if (!isEditing.value) {
    props.todo.updatedAt = formatTime(new Date());
  }
}, { deep: true });

const startEditing = () => {
  isEditing.value = true;
  nextTick(() => {
    if (editDiv.value) {
      editDiv.value.focus();
      // 将光标移到末尾
      const range = document.createRange();
      range.selectNodeContents(editDiv.value);
      range.collapse(false);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
};

const stopEditing = () => {
  if (editDiv.value) {
    const newText = editDiv.value.innerHTML;
    if (props.todo.text !== newText) {
      props.todo.text = newText;
    }
  }
  isEditing.value = false;
};

const onPaste = async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  const targetEditor = e.currentTarget;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          insertImageAtCursor(event.target.result, targetEditor);
        };
        reader.readAsDataURL(file);
      }
    }
  }
};

const onEditBlur = (e) => {
  // 如果正在拖拽图片，或者鼠标按下了滚动条，直接返回不结束编辑
  if (window.isDraggingFile) return;
  
  const relatedTarget = e.relatedTarget;
  
  // 检查是否点击了应用内部的其他元素
  // 只有当焦点移动到了编辑框以外，且没有移动到应用的任何其他部分时（例如点击了桌面），才可能触发失焦保存
  // 但为了防止误触关闭，我们这里改成：只有明确按下 Ctrl+Enter，或者点击了保存按钮才保存，或者点击了另一个任务的编辑
  
  // 检查是否点击了操作按钮组或者颜色选择器等
  const isActionClick = relatedTarget && (
    relatedTarget.closest('.actions-group') || 
    relatedTarget.closest('.edit-mode-content') ||
    relatedTarget.closest('.color-dot-trigger') ||
    relatedTarget.closest('.modal-overlay') // 防止点击预览图片时关闭
  );

  if (isActionClick) return;
  
  // 如果焦点消失且没有任何 relatedTarget，说明点击了应用外部（比如桌面、其他窗口）
  // 或者由于系统原因此处失去焦点。为了更好的体验，如果是点击外部应用，我们保持它的编辑状态。
  if (!relatedTarget) {
    // 强制保持焦点
    // 注意：如果是真正的切换窗口，系统会剥夺焦点，我们不强制抢夺，只是不关闭编辑模式
    return;
  }
  
  // 延迟检查，如果是点击了应用内的其他空白区域，我们才关闭编辑模式
  setTimeout(() => {
    if (isEditing.value && !window.isDraggingFile) stopEditing();
  }, 300);
};

const toggleCompleted = () => {
  props.todo.completed = !props.todo.completed;
};

const toggleAddSub = () => {
  showAddSub.value = !showAddSub.value;
  if (showAddSub.value) {
    nextTick(() => {
      if (subEditDiv.value) subEditDiv.value.focus();
    });
  }
};

const cancelAddSub = () => {
  showAddSub.value = false;
  if (subEditDiv.value) subEditDiv.value.innerHTML = '';
};

const handleAddSub = () => {
  const content = subEditDiv.value?.innerHTML || '';
  if (!content.trim() || content === '<br>') return;

  const newSub = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: content,
    completed: false,
    images: [],
    subTodos: [],
    updatedAt: formatTime(new Date()),
    color: ''
  };

  if (!props.todo.subTodos) props.todo.subTodos = [];
  props.todo.subTodos.unshift(newSub);

  if (subEditDiv.value) subEditDiv.value.innerHTML = '';
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
  // 对于 HTML 结构，删除图片需要通过编辑模式进行
};

// 拖放处理
const handleDragEnter = (e) => {
  isHoveringDrag.value = true;
};

const handleDragLeave = (e) => {
  if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget)) {
    isHoveringDrag.value = false;
  }
};

const insertImageAtCursor = (dataUrl, targetEditor = null) => {
  let targetDiv = targetEditor;

  if (!targetDiv) {
    if (showAddSub.value && subEditDiv.value) {
      targetDiv = subEditDiv.value;
    } else if (isEditing.value && editDiv.value) {
      targetDiv = editDiv.value;
    } else if (editDiv.value) {
      isEditing.value = true;
      nextTick(() => {
        if (editDiv.value) {
          editDiv.value.focus();
          const img = document.createElement('img');
          img.src = dataUrl;
          img.className = 'inline-rich-img';
          editDiv.value.appendChild(img);

          const range = document.createRange();
          range.setStartAfter(img);
          range.setEndAfter(img);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      });
      return;
    }
  }

  if (targetDiv) {
    targetDiv.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = 'inline-rich-img';
      range.insertNode(img);

      range.setStartAfter(img);
      range.setEndAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      const img = document.createElement('img');
      img.src = dataUrl;
      img.className = 'inline-rich-img';
      targetDiv.appendChild(img);

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

const processFiles = (files, targetEditor = null) => {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        insertImageAtCursor(event.target.result, targetEditor);
      };
      reader.readAsDataURL(file);
    }
  }
};

const handleDropLocal = (e) => {
  isHoveringDrag.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const targetEditor = e.currentTarget.querySelector('.edit-rich-input:focus') ||
                        (showAddSub.value ? subEditDiv.value : null) ||
                        (isEditing.value ? editDiv.value : null);
    processFiles(files, targetEditor);
  }
};

// Tauri 原生拖放兼容
let unlistenDragDrop = null;
const saveColor = () => {
  emit('update-todo', props.todo);
};

const handleRichTextClick = (e) => {
  const target = e.target;
  if (target.tagName === 'IMG' && target.classList.contains('inline-rich-img')) {
    emit('enlarge-image', target.src);
  }
};

const setupTauriDragDrop = async () => {
  if (window.__TAURI_INTERNALS__) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    const appWindow = getCurrentWindow();
    unlistenDragDrop = await appWindow.onDragDropEvent(async (event) => {
      if (event.payload.type === 'drop' && isHoveringDrag.value) {
        const paths = event.payload.paths;
        try {
          const { readFile } = await import('@tauri-apps/plugin-fs');
          for (const path of paths) {
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
                
                insertImageAtCursor(dataUrl);
              } catch (err) {
                console.error('Failed to process dropped file:', err);
              }
            }
          }
        } catch (e) {
          console.error('Failed to import fs plugin in TodoItem:', e);
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
    margin-left: 6px; // 减小缩进，从 8px 降到 6px
    padding-left: 4px; // 减小内边距，从 6px 降到 4px
    border-left: 1px solid var(--border-color);

    .todo-main-row {
      padding: 6px 8px; // 子任务更加紧凑
      transform: scale(0.98); // 减小缩放程度，保证文字清晰度
      transform-origin: left center;
    }
  }

  &.is-parent-locked {
    opacity: 0.85;
    
    .todo-main-row {
      background: rgba(255, 255, 255, 0.03) !important;
      border-color: transparent !important;
    }
    
    .mini-btn:not(.collapse) {
      display: none; // 被父级锁定时隐藏编辑/删除/添加按钮，防止误触
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
    .rich-text-display {
      color: var(--text-secondary);
      text-decoration: line-through;
      opacity: 0.6;
    }
    .todo-main-row {
      background: rgba(255, 255, 255, 0.05);
      border-left-width: 2px;
    }
    .inline-rich-img {
      filter: grayscale(0.8) opacity(0.5);
    }
  }
}

.todo-main-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-item);
  border-radius: var(--item-radius);
  border: 1px solid var(--border-color);
  /* 移除左侧边框颜色 */
  border-left: 1px solid var(--border-color); 
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

.card-content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.updated-time {
  font-size: 10px;
  color: var(--text-primary);
  font-family: 'JetBrains Mono', monospace;
  opacity: 0.8;
  white-space: nowrap;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.card-content-wrapper:hover .actions-group {
  opacity: 1;
}

.mini-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s;
  padding: 0;
  opacity: 0.7;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--accent-color);
    opacity: 1;
  }
  &.save { color: #10b981; }
  &.delete:hover { color: #ef4444; }
  &.collapse {
    transition: transform 0.3s;
    &.is-collapsed { transform: rotate(-90deg); }
  }
}

.color-dot-trigger {
  position: relative;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.4);
  cursor: pointer;
  flex-shrink: 0;
  margin: 0 4px;

  .color-input {
    position: absolute;
    top: -10px; left: -10px;
    width: 30px; height: 30px;
    padding: 0; border: none;
    cursor: pointer; opacity: 0;
  }
}

.card-body {
  display: flex;
  align-items: flex-start; // 顶部对齐
  gap: 8px;
  width: 100%;
}

.checkbox-wrapper {
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 2px; // 与文字对齐
  
  &.is-locked {
    cursor: not-allowed;
    opacity: 0.8;
  }
  
  .custom-checkbox {
    width: 16px;
    height: 16px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    background: transparent;
  }
}

.rich-text-container {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* 真正的行内图文混排样式 */
.rich-text-display {
  font-size: 13.5px;
  color: var(--text-primary);
  line-height: 1.6;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 1; /* 默认预览只显示一行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;

  :deep(.inline-rich-img) {
    height: 1.4em; /* 图片高度与行高一致 */
    width: auto;
    vertical-align: bottom; /* 底部对齐 */
    margin: 0 4px;
    border-radius: 2px;
    cursor: zoom-in;
    display: inline-block;
  }
}

.edit-mode-content {
  width: 100%;
  background: var(--input-bg);
  border-radius: 8px;
  border: 1px solid var(--accent-color);
  padding: 8px;
  box-sizing: border-box;
}

.edit-rich-input {
  width: 100%;
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
  text-align: left;
  word-break: break-all;

  &:empty:before {
    content: attr(placeholder);
    color: var(--text-secondary);
    opacity: 0.5;
  }

  // 编辑模式下的图片样式
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

.edit-images-preview {
  display: none; // 已经直接插入到富文本中了
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
  
  .sub-input-inner {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .sub-rich-input {
    flex: 1;
    min-height: 24px;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.05);
    border: 1px solid var(--border-color);
    
    &:focus {
      border-color: var(--accent-color);
      background: var(--input-bg);
    }
  }

  .sub-input-actions {
    display: flex;
    gap: 4px;
    margin-bottom: 2px;
    
    .sub-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &.cancel {
        background: transparent;
        color: var(--text-secondary);
        &:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }
      
      &.confirm {
        background: var(--accent-color);
        color: white;
        &:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
      }
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
