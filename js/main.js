// 主应用脚本 - 非模块版本
console.log('加载备用版本视频编辑器...');

// 等待DOM加载完成再初始化Vue应用
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM已加载，初始化视频编辑器...');

  // 检查Vue是否可用
  if (typeof Vue === 'undefined') {
    console.error('Vue未加载，无法继续');
    document.getElementById('app').innerHTML = `
      <div style="text-align: center; padding: 20px; color: white;">
        <h2>无法加载Vue框架</h2>
        <p>请检查网络连接并刷新页面</p>
        <button onclick="location.reload()">刷新</button>
      </div>
    `;
  } else {
    // 创建应用
    const videoEditorApp = {
      data() {
        return {
          videoUrl: '',
          elements: [],
          currentTime: 0,
          duration: 0,
          selectedElementId: null,
          pendingElementType: null,
          pendingShapeType: null,
          nextId: 1,
          isPlaying: false,
          // 添加导出相关状态
          showExportModal: false,
          exportFormat: 'webm',
          exportQuality: '中',
          exportResolution: '720p',
          exportProgress: 0,
          isExporting: false
        };
      },
      
      // 确保挂载后能正确初始化
      mounted() {
        console.log('应用已挂载');
        
        // 延时处理，确保DOM已更新
        this.$nextTick(() => {
          // 添加键盘快捷键支持
          document.addEventListener('keydown', this.handleKeyPress);
          
          // 初始化拖拽支持
          this.setupDraggable();
        });
      },
      
      // 清理事件监听
      beforeUnmount() {
        document.removeEventListener('keydown', this.handleKeyPress);
      },
      
      methods: {
        // 修复导入视频功能
        importVideo() {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'video/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              this.videoUrl = URL.createObjectURL(file);
              
              // 等待视频元数据加载
              const video = document.createElement('video');
              video.src = this.videoUrl;
              video.onloadedmetadata = () => {
                this.duration = video.duration;
                console.log(`视频已加载，持续时间: ${this.duration}秒`);
              };
            }
          };
          input.click();
        },
        
        // 键盘事件处理
        handleKeyPress(e) {
          // 简单的键盘事件处理
          if (e.key === 'Delete' && this.selectedElementId) {
            this.elements = this.elements.filter(el => el.id !== this.selectedElementId);
            this.selectedElementId = null;
          }
        },
        
        // 改进元素拖拽功能，确保位置准确对应
        setupDraggable() {
          // 监听编辑器元素的变化
          const observer = new MutationObserver(() => {
            document.querySelectorAll('.editor-element').forEach(el => {
              if (!el._draggableInitialized) {
                this.makeElementDraggable(el);
                // 为文本元素添加编辑功能
                if (el.classList.contains('text-element')) {
                  this.makeTextEditable(el);
                }
                el._draggableInitialized = true;
              }
            });
          });
          
          // 开始观察编辑器层
          const editorOverlay = document.querySelector('.editor-overlay');
          if (editorOverlay) {
            observer.observe(editorOverlay, { childList: true, subtree: true });
          }
        },
        
        // 使文本可编辑
        makeTextEditable(el) {
          const app = this;
          const elementId = parseInt(el.dataset.id);
          const element = app.elements.find(elem => elem.id === elementId);
          if (!element || element.type !== 'text') return;
          
          // 双击启用编辑
          el.addEventListener('dblclick', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 获取当前内容
            const currentContent = element.content || '';
            
            // 创建编辑区域
            const editor = document.createElement('div');
            editor.contentEditable = true;
            editor.className = 'text-editor';
            editor.style.color = element.color;
            editor.style.fontSize = element.fontSize + 'px';
            editor.style.width = '100%';
            editor.style.height = '100%';
            editor.style.border = 'none';
            editor.style.outline = 'none';
            editor.style.background = 'transparent';
            editor.style.textAlign = 'center';
            editor.innerText = currentContent;
            
            // 替换内容
            const contentContainer = el.querySelector('div');
            if (contentContainer) {
              contentContainer.replaceWith(editor);
            } else {
              el.appendChild(editor);
            }
            
            // 聚焦并选择所有文本
            editor.focus();
            const range = document.createRange();
            range.selectNodeContents(editor);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            
            // 处理编辑完成
            const finishEditing = function() {
              const newContent = editor.innerText.trim();
              if (newContent !== currentContent) {
                element.content = newContent;
                console.log('文本已更新:', newContent);
              }
              
              // 恢复显示
              const newDisplay = document.createElement('div');
              newDisplay.style.color = element.color;
              newDisplay.style.fontSize = element.fontSize + 'px';
              newDisplay.innerText = element.content;
              editor.replaceWith(newDisplay);
            };
            
            // 点击外部或按Enter完成编辑
            editor.addEventListener('blur', finishEditing);
            editor.addEventListener('keydown', function(e) {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEditing();
              }
            });
          });
        },
        
        // 使元素可拖动
        makeElementDraggable(el) {
          let offsetX, offsetY, isDragging = false;
          const app = this;
          const elementId = parseInt(el.dataset.id);
          
          el.addEventListener('mousedown', function(e) {
            // 如果点击的是调整大小的控制点或文本编辑器，不要启动拖动
            if (e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('text-editor')) {
              return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // 获取点击位置相对于元素的偏移量
            const rect = el.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            isDragging = true;
            
            // 添加拖动时的视觉反馈
            el.style.cursor = 'grabbing';
            el.style.zIndex = '1000';
            
            // 在文档级别添加移动和释放事件监听器
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          });
          
          const handleMouseMove = function(e) {
            if (!isDragging) return;
            
            // 获取编辑器覆盖层
            const editorOverlay = document.querySelector('.editor-overlay');
            if (!editorOverlay) return;
            
            // 计算新位置，考虑滚动
            const overlayRect = editorOverlay.getBoundingClientRect();
            let x = e.clientX - offsetX - overlayRect.left;
            let y = e.clientY - offsetY - overlayRect.top;
            
            // 边界检查，防止元素被拖出视频区域
            const maxX = overlayRect.width - el.offsetWidth;
            const maxY = overlayRect.height - el.offsetHeight;
            x = Math.max(0, Math.min(x, maxX));
            y = Math.max(0, Math.min(y, maxY));
            
            // 更新元素位置
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            
            // 更新元素数据
            const element = app.elements.find(elem => elem.id === elementId);
            if (element) {
              element.x = x;
              element.y = y;
            }
          };
          
          const handleMouseUp = function() {
            if (!isDragging) return;
            
            // 恢复正常样式
            el.style.cursor = '';
            el.style.zIndex = '';
            isDragging = false;
            
            // 移除文档级事件监听器
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
        },
        
        // 增强画布点击，确保元素位置准确
        handleCanvasClick(event) {
          if (!this.pendingElementType) return;
          
          // 获取点击位置，考虑视频的实际位置
          const videoPreview = document.querySelector('.video-preview');
          const videoElement = document.querySelector('.video-element');
          
          // 如果有视频，计算相对于视频的位置
          if (videoElement && videoElement.videoWidth > 0) {
            const videoRect = videoElement.getBoundingClientRect();
            const previewRect = videoPreview.getBoundingClientRect();
            
            // 计算视频在预览区域内的偏移
            const videoOffsetX = (previewRect.width - videoRect.width) / 2;
            const videoOffsetY = (previewRect.height - videoRect.height) / 2;
            
            // 计算点击位置相对于视频左上角的偏移
            const x = event.clientX - previewRect.left - videoOffsetX;
            const y = event.clientY - previewRect.top - videoOffsetY;
            
            // 检查点击是否在视频区域内
            if (x >= 0 && x <= videoRect.width && y >= 0 && y <= videoRect.height) {
              if (this.pendingElementType === 'shape') {
                this.createShape(x, y);
              } else if (this.pendingElementType === 'text') {
                this.createText(x, y);
              }
            }
          } else {
            // 如果没有视频，或视频未加载，使用相对于预览区域的位置
            const rect = videoPreview.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            
            if (this.pendingElementType === 'shape') {
              this.createShape(x, y);
            } else if (this.pendingElementType === 'text') {
              this.createText(x, y);
            }
          }
          
          this.pendingElementType = null;
        },
        
        // 设置调整大小功能
        setupResizeHandles() {
          const app = this;
          document.querySelectorAll('.resize-handle').forEach(handle => {
            // 清除可能存在的旧事件
            if (handle._mouseDownListener) {
              handle.removeEventListener('mousedown', handle._mouseDownListener);
            }
            
            const mouseDownListener = function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              const element = handle.closest('.editor-element');
              if (!element) return;
              
              const elementId = parseInt(element.dataset.id);
              const elementData = app.elements.find(el => el.id === elementId);
              if (!elementData) return;
              
              // 记录初始状态
              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = element.offsetWidth;
              const startHeight = element.offsetHeight;
              const startLeft = parseInt(element.style.left) || 0;
              const startTop = parseInt(element.style.top) || 0;
              
              // 确定调整方向
              const isRight = handle.classList.contains('handle-ne') || handle.classList.contains('handle-se');
              const isBottom = handle.classList.contains('handle-sw') || handle.classList.contains('handle-se');
              const isLeft = handle.classList.contains('handle-nw') || handle.classList.contains('handle-sw');
              const isTop = handle.classList.contains('handle-nw') || handle.classList.contains('handle-ne');
              
              const mouseMoveHandler = function(e) {
                // 计算变化量
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // 应用变化
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (isRight) newWidth = Math.max(30, startWidth + dx);
                if (isBottom) newHeight = Math.max(30, startHeight + dy);
                
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
                
                // 更新样式
                element.style.width = newWidth + 'px';
                element.style.height = newHeight + 'px';
                element.style.left = newLeft + 'px';
                element.style.top = newTop + 'px';
                
                // 更新数据
                if (elementData) {
                  elementData.width = newWidth;
                  elementData.height = newHeight;
                  elementData.x = newLeft;
                  elementData.y = newTop;
                }
              };
              
              const mouseUpHandler = function() {
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
              };
              
              document.addEventListener('mousemove', mouseMoveHandler);
              document.addEventListener('mouseup', mouseUpHandler);
            };
            
            handle._mouseDownListener = mouseDownListener;
            handle.addEventListener('mousedown', mouseDownListener);
          });
        },
        
        // 添加应用动画和颜色功能
        setColor(color) {
          if (!this.selectedElementId) return;
          
          const element = this.elements.find(e => e.id === this.selectedElementId);
          if (element) {
            element.color = color;
            console.log(`设置元素 ${this.selectedElementId} 颜色为 ${color}`);
          }
        },
        
        applyAnimation(animation) {
          if (!this.selectedElementId) return;
          
          const element = this.elements.find(e => e.id === this.selectedElementId);
          if (element) {
            element.animation = animation;
            console.log(`应用动画 ${animation || '无'} 到元素 ${this.selectedElementId}`);
          }
        },
        
        // 实现基本的形状和文本创建
        createShape(x, y) {
          const element = {
            id: this.nextId++,
            type: 'shape',
            shapeType: this.pendingShapeType || 'rectangle',
            x: x,
            y: y,
            width: 100,
            height: 100,
            color: '#FF0000',
            startTime: this.currentTime,
            duration: 5,
            animation: null
          };
          
          this.elements.push(element);
          this.selectedElementId = element.id;
        },
        
        createText(x, y) {
          const element = {
            id: this.nextId++,
            type: 'text',
            content: '点击编辑文本',
            x: x,
            y: y,
            width: 200,
            height: 50,
            fontSize: 24,
            color: '#FFFFFF',
            startTime: this.currentTime,
            duration: 5,
            animation: null
          };
          
          this.elements.push(element);
          this.selectedElementId = element.id;
        },
        
        addShape(shapeType) {
          this.pendingElementType = 'shape';
          this.pendingShapeType = shapeType;
        },
        
        addText() {
          this.pendingElementType = 'text';
        },
        
        selectElement(id) {
          this.selectedElementId = id;
          console.log(`选中元素：${id}`);
        },
        
        // 视频播放控制
        togglePlayPause() {
          this.isPlaying = !this.isPlaying;
        },
        
        // 导出视频
        exportVideo() {
          // 显示导出对话框
          this.showExportModal = true;
        },
        
        // 取消导出
        cancelExport() {
          if (this.isExporting) {
            if (confirm('导出过程中断将丢失已处理的内容，确定取消吗？')) {
              this.isExporting = false;
              this.showExportModal = false;
            }
          } else {
            this.showExportModal = false;
          }
        },
        
        // 开始导出过程
        startExport() {
          const videoElement = document.querySelector('.video-element');
          
          // 验证是否有视频可导出
          if (!videoElement || !videoElement.src) {
            alert('请先导入视频才能进行导出');
            return;
          }
          
          this.isExporting = true;
          this.exportProgress = 0;
          
          // 创建画布
          const canvas = document.createElement('canvas');
          canvas.width = this.getExportWidth();
          canvas.height = this.getExportHeight();
          const ctx = canvas.getContext('2d');
          
          try {
            // 创建媒体流和录制器
            const stream = canvas.captureStream(30);
            
            const options = {
              mimeType: `video/${this.exportFormat}`,
              videoBitsPerSecond: this.getBitrate(this.exportQuality)
            };
            
            const mediaRecorder = new MediaRecorder(stream, options);
            const chunks = [];
            
            mediaRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) {
                chunks.push(e.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              // 合并所有数据块创建视频文件
              const blob = new Blob(chunks, { type: `video/${this.exportFormat}` });
              
              // 创建下载链接
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `视频编辑器导出_${new Date().toISOString().slice(0, 10)}.${this.exportFormat}`;
              a.style.display = 'none';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              
              // 清理URL
              setTimeout(() => URL.revokeObjectURL(url), 100);
              
              // 重置状态
              this.isExporting = false;
              this.showExportModal = false;
              
              // 通知用户
              alert('视频导出成功！');
            };
            
            // 开始录制
            mediaRecorder.start(1000); // 每秒收集一次数据
            
            // 重置视频到起始位置
            videoElement.currentTime = 0;
            videoElement.pause();
            
            // 定义渲染变量
            let currentTime = 0;
            const frameDuration = 1 / 30; // 30fps
            const totalDuration = this.duration;
            let renderingRef; // 用于存储requestAnimationFrame的引用
            
            // 绘制单个帧的函数
            const renderFrame = () => {
              // 检查是否完成
              if (currentTime >= totalDuration || !this.isExporting) {
                if (this.isExporting) {
                  mediaRecorder.stop();
                }
                cancelAnimationFrame(renderingRef);
                return;
              }
              
              // 设置视频时间
              videoElement.currentTime = currentTime;
              
              // 绘制帧函数
              const drawFrame = () => {
                // 清除画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 绘制视频帧
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                // 绘制所有元素
                this.elements.forEach(element => {
                  if (currentTime >= element.startTime && 
                      currentTime <= element.startTime + element.duration) {
                    this.renderElementToCanvas(ctx, element, canvas.width, canvas.height, currentTime);
                  }
                });
                
                // 更新进度
                this.exportProgress = Math.min(100, Math.round((currentTime / totalDuration) * 100));
                
                // 增加时间
                currentTime += frameDuration;
                
                // 请求下一帧
                setTimeout(() => {
                  renderingRef = requestAnimationFrame(renderFrame);
                }, 0);
              };
              
              // 由于视频元素的currentTime设置是异步的，
              // 我们需要监听seeked事件来确保视频确实在正确的时间点
              const onSeeked = () => {
                videoElement.removeEventListener('seeked', onSeeked);
                drawFrame();
              };
              
              videoElement.addEventListener('seeked', onSeeked);
            };
            
            // 开始渲染
            renderingRef = requestAnimationFrame(renderFrame);
          } catch (error) {
            console.error('导出错误:', error);
            alert('导出过程中发生错误: ' + error.message);
            this.isExporting = false;
          }
        },
        
        // 渲染元素到画布
        renderElementToCanvas(ctx, element, canvasWidth, canvasHeight, currentTime) {
          // 计算元素位置及尺寸
          const x = element.x * (canvasWidth / this.getVideoWidth());
          const y = element.y * (canvasHeight / this.getVideoHeight());
          const width = element.width * (canvasWidth / this.getVideoWidth());
          const height = element.height * (canvasHeight / this.getVideoHeight());
          
          // 保存当前画布状态
          ctx.save();
          
          // 根据元素的动画状态应用相应效果
          this.applyAnimationToCanvas(ctx, element, x, y, width, height, currentTime);
          
          // 根据元素类型进行绘制
          if (element.type === 'text') {
            // 设置文本样式
            ctx.font = `${Math.round(element.fontSize * canvasHeight / this.getVideoHeight())}px Arial`;
            ctx.fillStyle = element.color || '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制文本
            ctx.fillText(element.content, x + width/2, y + height/2);
          } 
          else if (element.type === 'shape') {
            ctx.fillStyle = element.color || '#FF0000';
            
            switch(element.shapeType) {
              case 'circle':
                ctx.beginPath();
                ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
              case 'triangle':
                ctx.beginPath();
                ctx.moveTo(x + width/2, y);
                ctx.lineTo(x + width, y + height);
                ctx.lineTo(x, y + height);
                ctx.closePath();
                ctx.fill();
                break;
                
              case 'star':
                this.drawStar(ctx, x + width/2, y + height/2, Math.min(width, height)/2);
                break;
                
              case 'heart':
                this.drawHeart(ctx, x + width/2, y + height/2, width/2, height/2);
                break;
                
              case 'hexagon':
                this.drawPolygon(ctx, x + width/2, y + height/2, Math.min(width, height)/2, 6);
                break;
                
              default: // rectangle
                ctx.fillRect(x, y, width, height);
            }
          }
          
          // 恢复画布状态
          ctx.restore();
        },
        
        // 应用动画效果到画布
        applyAnimationToCanvas(ctx, element, x, y, width, height, currentTime) {
          if (!element.animation) return;
          
          // 计算当前动画进度
          const animationDuration = Math.min(1, element.duration / 2); // 动画持续0.5秒或元素持续时间的一半，取较小值
          const elapsedTime = currentTime - element.startTime;
          const timeLeft = element.startTime + element.duration - currentTime;
          
          // 中心点
          const centerX = x + width/2;
          const centerY = y + height/2;
          
          switch (element.animation) {
            case 'fadeIn':
              ctx.globalAlpha = Math.min(1, elapsedTime / animationDuration);
              break;
              
            case 'fadeOut':
              ctx.globalAlpha = Math.min(1, timeLeft / animationDuration);
              break;
              
            case 'slideIn':
              ctx.translate((1 - Math.min(1, elapsedTime / animationDuration)) * 100, 0);
              break;
              
            case 'scaleUp':
              const scale = Math.min(1, elapsedTime / animationDuration);
              ctx.translate(centerX, centerY);
              ctx.scale(scale, scale);
              ctx.translate(-centerX, -centerY);
              break;
              
            case 'rotate':
              ctx.translate(centerX, centerY);
              ctx.rotate((elapsedTime % 2) * Math.PI);
              ctx.translate(-centerX, -centerY);
              break;
          }
        },
        
        // 绘制星形
        drawStar(ctx, cx, cy, radius) {
          let spikes = 5;
          let outerRadius = radius;
          let innerRadius = radius/2;
          
          let rot = Math.PI/2*3;
          let step = Math.PI / spikes;
          
          ctx.beginPath();
          ctx.moveTo(cx, cy - outerRadius);
          
          for (let i = 0; i < spikes; i++) {
            let x = cx + Math.cos(rot) * outerRadius;
            let y = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(x, y);
            rot += step;
            
            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(x, y);
            rot += step;
          }
          
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
        },
        
        // 绘制心形
        drawHeart(ctx, cx, cy, width, height) {
          ctx.beginPath();
          const topCurveHeight = height * 0.3;
          
          // 从底部开始画
          ctx.moveTo(cx, cy + height/2);
          
          // 左边曲线
          ctx.bezierCurveTo(
            cx - width/2, cy, // 控制点
            cx - width/2, cy - topCurveHeight, // 控制点
            cx, cy - height/2 // 终点
          );
          
          // 右边曲线
          ctx.bezierCurveTo(
            cx + width/2, cy - topCurveHeight, // 控制点
            cx + width/2, cy, // 控制点
            cx, cy + height/2 // 终点
          );
          
          ctx.closePath();
          ctx.fill();
        },
        
        // 绘制多边形
        drawPolygon(ctx, cx, cy, radius, sides) {
          ctx.beginPath();
          for (let i = 0; i < sides; i++) {
            const angle = 2 * Math.PI * i / sides;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.closePath();
          ctx.fill();
        },
        
        // 获取导出宽度
        getExportWidth() {
          switch(this.exportResolution) {
            case '1080p': return 1920;
            case '720p': return 1280;
            case '480p': return 854;
            default: return 1280; // 默认720p
          }
        },
        
        // 获取导出高度
        getExportHeight() {
          switch(this.exportResolution) {
            case '1080p': return 1080;
            case '720p': return 720;
            case '480p': return 480;
            default: return 720; // 默认720p
          }
        },
        
        // 获取视频原始宽度
        getVideoWidth() {
          const videoElement = document.querySelector('.video-element');
          return videoElement ? videoElement.videoWidth || 1280 : 1280;
        },
        
        // 获取视频原始高度
        getVideoHeight() {
          const videoElement = document.querySelector('.video-element');
          return videoElement ? videoElement.videoHeight || 720 : 720;
        },
        
        // 根据质量设置获取比特率
        getBitrate(quality) {
          switch(quality) {
            case '高': return 5000000; // 5Mbps
            case '中': return 2500000; // 2.5Mbps
            case '低': return 1000000; // 1Mbps
            default: return 2500000; // 默认中等质量
          }
        },
        
        // ...existing code...
      },
      
      // 当数据更新时重新绑定事件
      updated() {
        this.$nextTick(() => {
          this.setupResizeHandles();
        });
      }
    };
    
    // 完整版模板
    videoEditorApp.template = `
      <div class="header">
        <div class="logo">
          <div style="background-color: #3b82f6; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">
            <span style="color: white; font-weight: bold;">E</span>
          </div>
          <span>视频编辑器</span>
        </div>
        
        <div class="header-buttons">
          <button @click="importVideo"><i class="fas fa-file-import"></i> 导入视频</button>
          <button @click="exportVideo"><i class="fas fa-file-export"></i> 导出</button>
        </div>
      </div>
      
      <div class="main-container">
        <!-- 侧边栏 -->
        <div class="sidebar">
          <div class="sidebar-section">
            <h3>形状</h3>
            <div class="shapes-grid">
              <div class="shape-item" @click="addShape('rectangle')">
                <div style="width: 24px; height: 24px; border: 2px solid #fff;"></div>
              </div>
              <div class="shape-item" @click="addShape('circle')">
                <div style="width: 24px; height: 24px; border: 2px solid #fff; border-radius: 50%;"></div>
              </div>
              <div class="shape-item" @click="addShape('triangle')">
                <div style="width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 24px solid #fff;"></div>
              </div>
              <div class="shape-item" @click="addShape('star')">
                <i class="fas fa-star"></i>
              </div>
              <div class="shape-item" @click="addShape('heart')">
                <i class="fas fa-heart"></i>
              </div>
              <div class="shape-item" @click="addShape('hexagon')">
                <i class="fas fa-stop"></i>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>颜色</h3>
            <div class="colors-grid">
              <div class="color-item" style="background-color: #f87171;" @click="setColor('#f87171')"></div>
              <div class="color-item" style="background-color: #fb923c;" @click="setColor('#fb923c')"></div>
              <div class="color-item" style="background-color: #fbbf24;" @click="setColor('#fbbf24')"></div>
              <div class="color-item" style="background-color: #a3e635;" @click="setColor('#a3e635')"></div>
              <div class="color-item" style="background-color: #34d399;" @click="setColor('#34d399')"></div>
              <div class="color-item" style="background-color: #22d3ee;" @click="setColor('#22d3ee')"></div>
              <div class="color-item" style="background-color: #60a5fa;" @click="setColor('#60a5fa')"></div>
              <div class="color-item" style="background-color: #818cf8;" @click="setColor('#818cf8')"></div>
              <div class="color-item" style="background-color: #a78bfa;" @click="setColor('#a78bfa')"></div>
              <div class="color-item" style="background-color: #e879f9;" @click="setColor('#e879f9')"></div>
              <div class="color-item" style="background-color: #fb7185;" @click="setColor('#fb7185')"></div>
              <div class="color-item" style="background-color: #ffffff;" @click="setColor('#ffffff')"></div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>动画</h3>
            <div class="animation-buttons">
              <button @click="applyAnimation('fadeIn')">淡入</button>
              <button @click="applyAnimation('fadeOut')">淡出</button>
              <button @click="applyAnimation('slideIn')">滑入</button>
              <button @click="applyAnimation('scaleUp')">放大</button>
              <button @click="applyAnimation('rotate')">旋转</button>
              <button @click="applyAnimation(null)">无动画</button>
            </div>
          </div>
          
          <div class="sidebar-section">
            <button @click="addText()" style="width: 100%; padding: 8px;">添加文字</button>
          </div>
        </div>
        
        <!-- 预览区域 -->
        <div class="preview-container">
          <div class="video-preview" @click="handleCanvasClick">
            <video 
              class="video-element" 
              :src="videoUrl" 
              @loadedmetadata="duration = $event.target.duration">
            </video>
            
            <!-- 如果没有视频，显示欢迎信息 -->
            <div v-if="!videoUrl" style="position: absolute; text-align: center; padding: 20px; border: 1px solid #334155;">
              视频编辑器
            </div>
            
            <!-- 编辑叠加层 -->
            <div class="editor-overlay">
              <div 
                v-for="element in elements.filter(e => currentTime >= e.startTime && currentTime <= e.startTime + e.duration)" 
                :key="element.id"
                :class="['editor-element', 
                          {'text-element': element.type === 'text'},
                          {'shape-element': element.type === 'shape'},
                          {'selected': element.id === selectedElementId}]"
                :style="{
                  left: element.x + 'px',
                  top: element.y + 'px',
                  width: element.width + 'px',
                  height: element.height + 'px'
                }"
                :data-id="element.id"
                @click.stop="selectElement(element.id)">
                
                <!-- 文本元素 -->
                <template v-if="element.type === 'text'">
                  <div :style="{ color: element.color, fontSize: element.fontSize + 'px' }">
                    {{ element.content }}
                  </div>
                </template>
                
                <!-- 形状元素 -->
                <template v-else-if="element.type === 'shape'">
                  <div :style="{
                    width: '100%',
                    height: '100%',
                    backgroundColor: element.color,
                    borderRadius: element.shapeType === 'circle' ? '50%' : '0'
                  }"></div>
                </template>
                
                <!-- 调整大小的控制点 -->
                <template v-if="element.id === selectedElementId">
                  <div class="resize-handle handle-nw"></div>
                  <div class="resize-handle handle-ne"></div>
                  <div class="resize-handle handle-sw"></div>
                  <div class="resize-handle handle-se"></div>
                </template>
              </div>
            </div>
          </div>
          
          <!-- 控制区域 -->
          <div class="controls">
            <button @click="currentTime = Math.max(0, currentTime - 5)"><i class="fas fa-backward"></i></button>
            <button class="play-pause-btn" @click="togglePlayPause">
              <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
            </button>
            <button @click="currentTime = Math.min(duration, currentTime + 5)"><i class="fas fa-forward"></i></button>
            
            <div class="time-display">{{ Math.floor(currentTime/60) }}:{{ Math.floor(currentTime%60).toString().padStart(2, '0') }} / {{ Math.floor(duration/60) }}:{{ Math.floor(duration%60).toString().padStart(2, '0') }}</div>
          </div>
          
          <!-- 时间轴 -->
          <div class="timeline-container">
            <div class="timeline-ruler">
              <div 
                class="time-marker" 
                :style="{ left: (duration > 0 ? (currentTime / duration * 100) : 0) + '%' }">
              </div>
              
              <div class="time-tick" v-for="i in 10" :key="i" :style="{ left: (i*10) + '%' }">
                {{ Math.floor((i*duration/10)/60) }}:{{ Math.floor((i*duration/10)%60).toString().padStart(2, '0') }}
              </div>
            </div>
            
            <div class="tracks-container">
              <div class="track">
                <div class="track-label">文本轨道</div>
                
                <div
                  v-for="element in elements.filter(e => e.type === 'text')"
                  :key="element.id"
                  :class="['track-item', 'text-track-item']"
                  :style="{
                    left: (duration > 0 ? (element.startTime / duration * 100) : 0) + '%',
                    width: (duration > 0 ? (element.duration / duration * 100) : 10) + '%'
                  }"
                  @click.stop="selectElement(element.id)">
                  {{ element.content.substring(0, 10) + (element.content.length > 10 ? '...' : '') }}
                </div>
              </div>
              
              <div class="track">
                <div class="track-label">形状轨道</div>
                
                <div
                  v-for="element in elements.filter(e => e.type === 'shape')"
                  :key="element.id"
                  :class="['track-item', 'shape-track-item']"
                  :style="{
                    left: (duration > 0 ? (element.startTime / duration * 100) : 0) + '%',
                    width: (duration > 0 ? (element.duration / duration * 100) : 10) + '%'
                  }"
                  @click.stop="selectElement(element.id)">
                  {{ element.shapeType }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 导出对话框 -->
      <div v-if="showExportModal" class="export-modal">
        <div class="export-modal-content">
          <h2>导出视频</h2>
          
          <div class="export-options">
            <div class="export-option">
              <label for="export-format">格式：</label>
              <select id="export-format" v-model="exportFormat">
                <option value="webm">WebM</option>
                <option value="mp4">MP4</option>
              </select>
            </div>
            
            <div class="export-option">
              <label for="export-quality">质量：</label>
              <select id="export-quality" v-model="exportQuality">
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>
            </div>
            
            <div class="export-option">
              <label for="export-resolution">分辨率：</label>
              <select id="export-resolution" v-model="exportResolution">
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
              </select>
            </div>
          </div>
          
          <div v-if="isExporting" class="export-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{width: exportProgress + '%'}"></div>
            </div>
            <div class="progress-text">{{ exportProgress }}%</div>
          </div>
          
          <div class="export-buttons">
            <button @click="startExport" :disabled="isExporting">
              {{ isExporting ? '导出中...' : '开始导出' }}
            </button>
            <button @click="cancelExport">取消</button>
          </div>
        </div>
      </div>
    `;
    
    // 创建并挂载应用
    console.log('创建Vue应用...');
    try {
      const app = Vue.createApp(videoEditorApp);
      app.mount('#app');
      console.log('Vue应用已挂载');
    } catch (error) {
      console.error('挂载Vue应用失败:', error);
      document.getElementById('app').innerHTML = `
        <div style="text-align: center; padding: 20px; color: white;">
          <h2>应用加载失败</h2>
          <p>${error.message}</p>
          <button onclick="location.reload()">刷新页面</button>
        </div>
      `;
    }
  }
});
