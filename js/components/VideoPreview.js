export default {
  name: 'VideoPreview', // 添加名称
  
  props: {
    videoUrl: String,
    elements: Array,
    currentTime: Number,
    selectedElementId: Number
  },
  
  mounted() {
    console.log('VideoPreview组件已挂载');
    this._setupEventListeners();
  },
  
  beforeUnmount() {
    this._cleanupEventListeners();
  },
  
  template: `
    <div class="video-preview" @click="handleCanvasClick">
      <video 
        ref="videoElement" 
        class="video-element" 
        :src="videoUrl" 
        @loadedmetadata="onVideoLoad" 
        @timeupdate="onTimeUpdate">
      </video>
      
      <!-- 如果没有视频，显示欢迎信息 -->
      <div v-if="!videoUrl" style="position: absolute; text-align: center; padding: 20px; border: 1px solid #334155;">
        视频编辑器
      </div>
      
      <!-- 编辑叠加层 -->
      <div ref="editorOverlay" class="editor-overlay">
        <div 
          v-for="element in visibleElements" 
          :key="element.id"
          :class="['editor-element', 
                  {'text-element': element.type === 'text'},
                  {'shape-element': element.type === 'shape'},
                  {'selected': element.id === selectedElementId}]"
          :data-id="element.id"
          :style="getElementStyle(element)"
          @mousedown.stop="selectElement(element.id, $event)">
          
          <!-- 根据元素类型渲染不同内容 -->
          <template v-if="element.type === 'text'">
            <!-- 完全重写文本编辑方式 -->
            <div class="text-editor-container" v-if="element.id === selectedElementId">
              <div
                ref="textEditor"
                contenteditable="plaintext-only"
                class="text-editor"
                :style="{ color: element.color, fontSize: element.fontSize + 'px' }"
                @input="updateTextContent($event, element)"
                @blur="finalizeTextContent($event, element)"
                @paste="handlePaste($event)"
                @click.stop>
              </div>
            </div>
            <div v-else
              :style="{ color: element.color, fontSize: element.fontSize + 'px' }">
              {{cleanHtml(element.content)}}
            </div>
          </template>
          
          <template v-else-if="element.type === 'shape'">
            <div :style="getShapeStyle(element)"></div>
          </template>
          
          <template v-else-if="element.type === 'progress'">
            <div v-if="element.progressType === 'linear'" 
                :style="{ width: '100%', height: '100%', backgroundColor: '#334155', overflow: 'hidden' }">
              <div :style="{ width: getProgressPercentage() + '%', height: '100%', backgroundColor: element.color }"></div>
            </div>
            <div v-else class="circular-progress" 
                :style="{ width: '100%', height: '100%', position: 'relative' }">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                      fill="none" stroke="#334155" stroke-width="3"/>
                <path class="circle" :stroke="element.color" stroke-width="3" fill="none" 
                      :stroke-dasharray="\`\${getProgressPercentage()}, 100\`"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
            </div>
          </template>
          
          <!-- 当元素被选中时添加调整大小的控制点 -->
          <template v-if="element.id === selectedElementId">
            <div class="resize-handle handle-nw"></div>
            <div class="resize-handle handle-ne"></div>
            <div class="resize-handle handle-sw"></div>
            <div class="resize-handle handle-se"></div>
          </template>
        </div>
      </div>
    </div>
  `,
  
  computed: {
    visibleElements() {
      return this.elements.filter(element => {
        const isInTimeRange = this.currentTime >= element.startTime && 
                             this.currentTime <= element.startTime + element.duration;
        return isInTimeRange;
      });
    }
  },
  
  watch: {
    videoUrl() {
      if (this.videoUrl) {
        this.$nextTick(() => {
          this.$refs.videoElement.load();
        });
      }
    },
    
    currentTime() {
      if (this.$refs.videoElement) {
        this.$refs.videoElement.currentTime = this.currentTime;
      }
    },
    
    selectedElementId(newId, oldId) {
      // 当选择一个新元素时，给它添加调整大小的功能
      if (newId) {
        this.$nextTick(() => {
          const element = document.querySelector(`.editor-element[data-id="${newId}"]`);
          if (element) {
            this.setupResizeHandles(element, newId);
            this.setupElementDrag(element, newId);
          }
        });
      }
    }
  },
  
  methods: {
    onVideoLoad() {
      // 视频加载完成后的处理
    },
    
    onTimeUpdate() {
      // 同步视频实际时间
      //this.$emit('update-time', this.$refs.videoElement.currentTime);
    },
    
    // 设置事件监听器
    _setupEventListeners() {
      if (this.$refs.videoElement) {
        this.$refs.videoElement.addEventListener('error', this._handleVideoError);
      }
    },
    
    // 清理事件监听器
    _cleanupEventListeners() {
      if (this.$refs.videoElement) {
        this.$refs.videoElement.removeEventListener('error', this._handleVideoError);
      }
    },
    
    // 处理视频错误
    _handleVideoError(error) {
      console.error('视频加载错误:', error);
    },
    
    handleCanvasClick(event) {
      // 确保点击的是画布本身，而不是其中的元素
      if (event.target === event.currentTarget || event.target === this.$refs.videoElement) {
        const rect = this.$refs.editorOverlay.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // 发送点击位置信息
        this.$emit('canvas-clicked', { x, y });
        console.log('Canvas clicked at:', x, y);
      }
    },
    
    getElementStyle(element) {
      let style = {
        left: `${element.x}px`,
        top: `${element.y}px`
      };
      
      if (element.width && element.height) {
        style.width = `${element.width}px`;
        style.height = `${element.height}px`;
      }
      
      // 应用动画样式
      if (element.animation) {
        switch(element.animation) {
          case 'fadeIn':
            style.animation = 'fadeIn 1s ease-in';
            break;
          case 'slideIn':
            style.animation = 'slideIn 1s ease-out';
            break;
          case 'scaleUp':
            style.animation = 'scaleUp 0.5s ease-in-out';
            break;
          case 'rotate':
            style.animation = 'rotate 2s linear infinite';
            break;
        }
      }
      
      return style;
    },
    
    getShapeStyle(element) {
      let style = {
        width: '100%',
        height: '100%',
        backgroundColor: element.color
      };
      
      switch(element.shapeType) {
        case 'circle':
          style.borderRadius = '50%';
          break;
        case 'triangle':
          style = {
            width: '0',
            height: '0',
            borderLeft: `${element.width / 2}px solid transparent`,
            borderRight: `${element.width / 2}px solid transparent`,
            borderBottom: `${element.height}px solid ${element.color}`
          };
          break;
        case 'star':
          // 使用简化的星形表示
          style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
          break;
        case 'heart':
          // 使用简化的心形表示
          style.clipPath = 'path("M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z")';
          break;
        case 'hexagon':
          style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
          break;
      }
      
      return style;
    },
    
    getProgressPercentage() {
      // 计算当前进度的百分比
      if (this.currentTime === 0) return 0;
      const videoElement = this.$refs.videoElement;
      if (!videoElement || isNaN(videoElement.duration)) return 0;
      
      return Math.min(100, (this.currentTime / videoElement.duration) * 100);
    },
    
    selectElement(id, event) {
      // 防止冒泡，避免点击元素同时选择背景
      event.stopPropagation();
      this.$emit('element-selected', id);
      console.log('Selected element:', id);
      
      // 启用拖动和调整大小功能
      this.$nextTick(() => {
        const element = document.querySelector(`.editor-element[data-id="${id}"]`);
        const overlay = this.$refs.editorOverlay;
        if (element && overlay) {
          this.enableElementDragging(element, id);
          this.setupResizeHandles(element, id);
        }
      });
    },
    
    // 启用元素拖动
    enableElementDragging(element, elementId) {
      const self = this;
      const overlay = this.$refs.editorOverlay;
      
      // 清除可能已存在的事件监听器
      if (element._mouseDownHandler) {
        element.removeEventListener('mousedown', element._mouseDownHandler);
      }
      
      const mouseDownHandler = function(e) {
        // 如果点击的是调整大小的控制点或文本编辑器，不要启动拖动
        if (e.target.classList.contains('resize-handle') || 
            e.target.classList.contains('text-editor')) {
          return;
        }
        
        // 阻止默认行为和冒泡
        e.preventDefault();
        e.stopPropagation();
        
        // 获取鼠标相对于元素的偏移量
        const elementRect = element.getBoundingClientRect();
        const offsetX = e.clientX - elementRect.left;
        const offsetY = e.clientY - elementRect.top;
        
        // 创建鼠标移动处理函数
        const mouseMoveHandler = function(e) {
          // 计算新位置
          const overlayRect = overlay.getBoundingClientRect();
          const x = e.clientX - offsetX - overlayRect.left;
          const y = e.clientY - offsetY - overlayRect.top;
          
          // 设置元素的新位置
          element.style.left = Math.max(0, x) + 'px';
          element.style.top = Math.max(0, y) + 'px';
          
          // 更新数据模型
          const selectedElement = self.elements.find(el => el.id === elementId);
          if (selectedElement) {
            selectedElement.x = Math.max(0, x);
            selectedElement.y = Math.max(0, y);
            self.$emit('element-moved', elementId, Math.max(0, x), Math.max(0, y));
          }
        };
        
        // 创建鼠标抬起处理函数
        const mouseUpHandler = function() {
          // 移除事件监听器
          document.removeEventListener('mousemove', mouseMoveHandler);
          document.removeEventListener('mouseup', mouseUpHandler);
        };
        
        // 添加事件监听器
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
      };
      
      // 保存引用以便清除
      element._mouseDownHandler = mouseDownHandler;
      
      // 添加事件监听器
      element.addEventListener('mousedown', mouseDownHandler);
      console.log('Drag enabled for element:', elementId);
    },
    
    // 设置调整大小的控制点
    setupResizeHandles(element, elementId) {
      const handles = element.querySelectorAll('.resize-handle');
      if (!handles.length) return;
      
      const self = this;
      
      handles.forEach(handle => {
        // 清除可能已存在的事件监听器
        if (handle._mouseDownHandler) {
          handle.removeEventListener('mousedown', handle._mouseDownHandler);
        }
        
        const mouseDownHandler = function(e) {
          // 阻止默认行为和冒泡
          e.preventDefault();
          e.stopPropagation();
          
          // 获取元素的初始尺寸和位置
          const elementRect = element.getBoundingClientRect();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = elementRect.width;
          const startHeight = elementRect.height;
          const startLeft = parseFloat(element.style.left) || 0;
          const startTop = parseFloat(element.style.top) || 0;
          
          // 确定是哪个控制点
          const isRight = handle.classList.contains('handle-ne') || handle.classList.contains('handle-se');
          const isBottom = handle.classList.contains('handle-sw') || handle.classList.contains('handle-se');
          const isLeft = handle.classList.contains('handle-nw') || handle.classList.contains('handle-sw');
          const isTop = handle.classList.contains('handle-nw') || handle.classList.contains('handle-ne');
          
          // 创建鼠标移动处理函数
          const mouseMoveHandler = function(e) {
            // 计算鼠标移动的距离
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            
            // 计算新尺寸和位置
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            if (isRight) {
              newWidth = Math.max(30, startWidth + dx);
            }
            if (isBottom) {
              newHeight = Math.max(30, startHeight + dy);
            }
            if (isLeft) {
              newWidth = Math.max(30, startWidth - dx);
              if (newWidth !== startWidth) {
                newLeft = startLeft + (startWidth - newWidth);
              }
            }
            if (isTop) {
              newHeight = Math.max(30, startHeight - dy);
              if (newHeight !== startHeight) {
                newTop = startTop + (startHeight - newHeight);
              }
            }
            
            // 更新元素样式
            element.style.width = newWidth + 'px';
            element.style.height = newHeight + 'px';
            element.style.left = newLeft + 'px';
            element.style.top = newTop + 'px';
            
            // 更新数据模型
            const selectedElement = self.elements.find(el => el.id === elementId);
            if (selectedElement) {
              selectedElement.width = newWidth;
              selectedElement.height = newHeight;
              selectedElement.x = newLeft;
              selectedElement.y = newTop;
            }
          };
          
          // 创建鼠标抬起处理函数
          const mouseUpHandler = function() {
            // 移除事件监听器
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
          };
          
          // 添加事件监听器
          document.addEventListener('mousemove', mouseMoveHandler);
          document.addEventListener('mouseup', mouseUpHandler);
        };
        
        // 保存引用以便清除
        handle._mouseDownHandler = mouseDownHandler;
        
        // 添加事件监听器
        handle.addEventListener('mousedown', mouseDownHandler);
      });
    },
    
    // 设置光标到文本末尾的辅助方法
    setCaretToEnd(element) {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false); // false表示折叠到末尾
      selection.removeAllRanges();
      selection.addRange(range);
      element.focus();
    },
    
    // 清理HTML标签和实体
    cleanHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/<[^>]*>/g, '') // 移除HTML标签
        .replace(/&nbsp;/g, ' ') // 替换&nbsp;为空格
        .replace(/&lt;/g, '<')   // 替换&lt;
        .replace(/&gt;/g, '>')   // 替换&gt;
        .replace(/&amp;/g, '&')  // 替换&amp;
        .replace(/&quot;/g, '"') // 替换&quot;
        .replace(/&#?\w+;/g, ''); // 移除其他HTML实体
    },
    
    // 更新文本内容
    updateTextContent(event, element) {
      // 获取纯文本内容
      const text = this.cleanHtml(event.target.innerText || '');
      element.content = text;
    },
    
    // 最终化文本内容
    finalizeTextContent(event, element) {
      const text = this.cleanHtml(event.target.innerText || '');
      element.content = text;
      console.log(`文本内容已最终确认: "${element.content}"`);
    },
    
    // 处理粘贴事件，只允许纯文本
    handlePaste(event) {
      event.preventDefault();
      // 从剪贴板获取纯文本
      const text = (event.clipboardData || window.clipboardData).getData('text/plain');
      // 插入纯文本
      document.execCommand('insertText', false, text);
    },
    
    // 修复元素拖动功能
    setupElementDrag(element, elementId) {
      const self = this;
      const overlay = this.$refs.editorOverlay;
      
      let offsetX, offsetY, isDragging = false;
      
      // 移除之前可能存在的事件监听器，避免重复
      element.removeEventListener('mousedown', element._startDragHandler);
      
      // 创建新的拖动处理器
      const startDrag = function(e) {
        // 如果点击的是调整大小的控制点或文本编辑器，不要启动拖动
        if (e.target.classList.contains('resize-handle') || 
            e.target.classList.contains('text-editor')) {
          return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        // 获取鼠标指针在元素内的位置
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        
        // 添加鼠标移动和松开事件监听器
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
        
        isDragging = true;
      };
      
      const drag = function(e) {
        if (!isDragging) return;
        
        // 计算新位置
        let x = e.clientX - offsetX - overlay.getBoundingClientRect().left;
        let y = e.clientY - offsetY - overlay.getBoundingClientRect().top;
        
        // 确保元素不超出父元素边界
        const parentRect = overlay.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // 边界检查
        x = Math.max(0, Math.min(x, parentRect.width - elementRect.width));
        y = Math.max(0, Math.min(y, parentRect.height - elementRect.height));
        
        // 设置元素新位置
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        // 更新元素数据模型中的位置
        const selectedElement = self.elements.find(e => e.id === elementId);
        if (selectedElement) {
          selectedElement.x = x;
          selectedElement.y = y;
        }
        
        // 发出元素移动事件
        self.$emit('element-moved', elementId, x, y);
      };
      
      const stopDrag = function() {
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDrag);
        isDragging = false;
      };
      
      // 保存引用以便之后移除
      element._startDragHandler = startDrag;
      
      // 添加事件监听器
      element.addEventListener('mousedown', startDrag);
    },
  }
};
