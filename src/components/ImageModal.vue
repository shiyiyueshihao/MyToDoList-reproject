<template>
  <Transition name="fade">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick" @wheel.prevent="handleWheel">
      <div class="modal-content" @click.stop>
        <img 
          ref="imgRef"
          :src="imageUrl" 
          class="enlarged-img" 
          :style="{ 
            transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`, 
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
          }" 
          @mousedown.prevent="startDrag"
        />
        <button class="close-modal-btn" @click="$emit('close')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';

const props = defineProps({
  show: Boolean,
  imageUrl: String
});
const emit = defineEmits(['close']);

const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const imgRef = ref(null);

let startX = 0;
let startY = 0;
let initialTranslateX = 0;
let initialTranslateY = 0;

watch(() => props.show, (newVal) => {
  if (newVal) {
    scale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    isDragging.value = false;
  } else {
    stopDrag();
  }
});

const handleOverlayClick = () => {
  scale.value = 1;
  translateX.value = 0;
  translateY.value = 0;
  emit('close');
};

const checkBoundaries = () => {
  if (!imgRef.value) return;
  
  const imgWidth = imgRef.value.offsetWidth;
  const imgHeight = imgRef.value.offsetHeight;
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;
  
  const scaledWidth = imgWidth * scale.value;
  const scaledHeight = imgHeight * scale.value;
  
  let maxX = 0;
  let maxY = 0;
  
  if (scaledWidth > winWidth) {
    maxX = (scaledWidth - winWidth) / 2 / scale.value;
  }
  
  if (scaledHeight > winHeight) {
    maxY = (scaledHeight - winHeight) / 2 / scale.value;
  }
  
  if (translateX.value > maxX) translateX.value = maxX;
  if (translateX.value < -maxX) translateX.value = -maxX;
  
  if (translateY.value > maxY) translateY.value = maxY;
  if (translateY.value < -maxY) translateY.value = -maxY;
};

const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.2 : 0.2; // 稍微增加缩放速度
  let newScale = scale.value + delta;
  
  // 限制缩放比例在 0.5 到 5 之间
  if (newScale < 0.5) newScale = 0.5;
  if (newScale > 5) newScale = 5;
  
  scale.value = newScale;
  
  if (scale.value <= 1) {
    translateX.value = 0;
    translateY.value = 0;
  } else {
    nextTick(() => checkBoundaries());
  }
};

const startDrag = (e) => {
  if (scale.value <= 1) return;
  isDragging.value = true;
  startX = e.clientX;
  startY = e.clientY;
  initialTranslateX = translateX.value;
  initialTranslateY = translateY.value;
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
  if (!isDragging.value) return;
  const dx = e.clientX - startX;
  const dy = e.clientY - startY;
  
  translateX.value = initialTranslateX + dx / scale.value;
  translateY.value = initialTranslateY + dy / scale.value;
};

const stopDrag = () => {
  if (isDragging.value) {
    isDragging.value = false;
    checkBoundaries();
  }
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: visible; // 允许放大后超出边界显示
  
  .enlarged-img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    transition: transform 0.1s ease-out; // 平滑缩放
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    border-radius: 8px;
    user-select: none;
    -webkit-user-drag: none;
  }
}

.close-modal-btn {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
  z-index: 10;

  &:hover {
    background: rgba(255, 77, 79, 0.8);
    transform: rotate(90deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
