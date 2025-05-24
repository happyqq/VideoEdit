import Sidebar from './Sidebar.js';
import VideoPreview from './VideoPreview.js';
import Timeline from './Timeline.js';
import ExportService from '../ExportService.js';

// 确保组件以标准方式导出
export default {
  name: 'App',
  components: {
    Sidebar,
    VideoPreview,
    Timeline
  },
  
  setup() {
    console.log('App组件setup执行');
    return {};
  },
  
  data() {
    return {
      projectName: '未命名项目',
      videoUrl: '',
      elements: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      selectedElementId: null,
      nextId: 1,
      pendingElementType: null, // 存储待添加的元素类型
      pendingShapeType: null, // 存储待添加的形状类型
      pendingProgressType: null, // 存储待添加的进度条类型
      showExportModal: false,
      exportFormat: 'mp4',
      exportQuality: '高',
      exportResolution: '1080p',
      isExporting: false,
      exportProgress: 0,
      lastClickPosition: { x: 100, y: 100 }, // 默认位置
      exportService: new ExportService(),
      nextTrackId: 1, // 为每个图层分配唯一ID
      tracks: [
        { id: 1, name: "主轨道", type: "main" },
        { id: 2, name: "文本轨道", type: "text" },
        { id: 3, name: "形状轨道", type: "shape" },
        { id: 4, name: "进度轨道", type: "progress" }
      ]
    };
  },
  
  template: `
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
      
      <input type="file" ref="videoInput" class="file-input" @change="handleVideoImport" accept="video/*">
    </div>
    
    <div class="main-container">
      <sidebar 
        @add-shape="addShape" 
        @add-text="addText" 
        @set-color="setColor"
        @apply-animation="applyAnimation">
      </sidebar>
      
      <div class="preview-container">
        <video-preview 
          :video-url="videoUrl" 
          :elements="elements"
          :current-time="currentTime"
          :selected-element-id="selectedElementId"
          @element-selected="selectElement"
          @canvas-clicked="handleCanvasClick">
        </video-preview>
        
        <timeline 
          :elements="elements"
          :duration="duration"
          :current-time="currentTime"
          @time-update="updateTime">
        </timeline>
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
              <option value="mp4">MP4</option>
              <option value="webm">WebM</option>
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
        <div class="export-buttons">
          <button @click="startExport" :disabled="isExporting">
            {{ isExporting ? '导出中...' : '开始导出' }}
          </button>
          <button @click="cancelExport">取消</button>
        </div>
        <div v-if="isExporting" class="export-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{width: exportProgress + '%'}"></div>
          </div>
          <div class="progress-text">{{ exportProgress }}%</div>
        </div>
      </div>
    </div>
  `,
  
  mounted() {
    console.log('App组件已挂载');
    
    // 设置导出服务事件处理程序
    this.setupExportService();
    
    // 监听窗口事件，确保未保存的更改不会丢失
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  
  beforeUnmount() {
    // 清理事件监听器
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  
  methods: {
    // 设置导出服务
    setupExportService() {
      if (this.exportService) {
        this.exportService.onProgress = (progress) => {
          this.exportProgress = Math.round(progress);
        };
        
        this.exportService.onComplete = (blob) => {
          // 创建下载链接
          const url = URL.createObjectURL(blob);
          const downloadLink = document.createElement('a');
          downloadLink.href = url;
          downloadLink.download = `video_export.${this.exportFormat}`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          // 清理URL和状态
          URL.revokeObjectURL(url);
          this.isExporting = false;
          this.showExportModal = false;
          
          // 通知用户
          alert('视频导出成功！');
        };
        
        this.exportService.onError = (error) => {
          console.error('导出错误:', error);
          alert('导出时发生错误: ' + error.message);
          this.isExporting = false;
        };
      }
    },
    
    // 保存提示
    handleBeforeUnload(event) {
      if (this.elements.length > 0) {
        event.preventDefault();
        event.returnValue = '您有未保存的更改，确定要离开吗？';
      }
    },
    
    importVideo() {
      console.log('触发导入视频');
      if (this.$refs.videoInput) {
        this.$refs.videoInput.click();
      }
    },
    
    handleVideoImport(event) {
      console.log('处理视频导入');
      const file = event.target.files[0];
      if (file) {
        console.log(`导入视频文件: ${file.name}`);
        this.videoUrl = URL.createObjectURL(file);
        
        // 创建临时视频元素来获取视频信息
        const video = document.createElement('video');
        video.src = this.videoUrl;
        video.onloadedmetadata = () => {
          this.duration = video.duration;
          console.log(`视频时长: ${this.duration}秒`);
        };
        video.onerror = (err) => {
          console.error('视频加载错误:', err);
          alert('加载视频失败，请尝试其他格式。');
        };
      }
    },
    
    exportVideo() {
      this.showExportModal = true;
    },
    
    startExport() {
      this.isExporting = true;
      this.exportProgress = 0;
      
      // 先验证并清理所有元素
      this.elements.forEach(element => {
        // 确保文本有内容，并清理HTML标签
        if (element.type === 'text') {
          if (!element.content || element.content.trim() === '') {
            element.content = '文本内容';
          } else {
            element.content = this.cleanHtml(element.content);
          }
        }
        
        // 确保所有元素都有必要的属性
        if (element.startTime === undefined) element.startTime = 0;
        if (element.duration === undefined) element.duration = 5;
        if (!element.color) {
          element.color = element.type === 'text' ? '#FFFFFF' : 
                         element.type === 'shape' ? '#FF0000' : '#3B82F6';
        }
        
        // 验证动画
        if (element.animation && !['fadeIn', 'fadeOut', 'slideIn', 'scaleUp', 'rotate'].includes(element.animation)) {
          console.warn(`未知动画类型: ${element.animation}，已重置`);
          element.animation = null;
        }
      });
      
      console.log('准备导出元素:', JSON.stringify(this.elements.map(e => ({
        id: e.id, 
        type: e.type, 
        animation: e.animation
      })));
      
      // 获取视频元素
      const videoElement = document.querySelector('.video-element');
      
      // 设置导出服务
      const setupSuccess = this.exportService.setup(
        videoElement, 
        this.exportFormat, 
        this.exportQuality, 
        this.exportResolution
      );
      
      if (setupSuccess) {
        console.log("正在导出视频，处理所有元素...");
        
        // 开始导出
        this.exportService.startExport(
          videoElement,
          this.elements,
          this.duration
        );
      } else {
        this.isExporting = false;
        alert('无法设置导出环境，请检查浏览器兼容性或使用Chrome浏览器。');
      }
    },
    
    cancelExport() {
      if (this.isExporting) {
        if (confirm('导出正在进行中，确定取消吗？')) {
          this.exportService.cancelExport();
          this.isExporting = false;
          this.showExportModal = false;
        }
      } else {
        this.showExportModal = false;
      }
    },
    
    // 更新元素位置
    updateElementPosition(id, x, y) {
      const element = this.elements.find(e => e.id === id);
      if (element) {
        element.x = x;
        element.y = y;
        console.log(`更新元素 ${id} 位置: ${x}, ${y}`);
      }
    },
    
    // 更新为两阶段添加形状：先记录类型，等待用户点击画布
    addShape(shapeType) {
      console.log(`添加形状: ${shapeType}`);
      this.pendingElementType = 'shape';
      this.pendingShapeType = shapeType;
    },
    
    // 两阶段添加文本
    addText() {
      console.log('添加文本');
      this.pendingElementType = 'text';
    },
    
    // 两阶段添加进度条
    addProgress(progressType) {
      this.pendingElementType = 'progress';
      this.pendingProgressType = progressType;
    },
    
    // 处理画布点击，添加待处理的元素
    handleCanvasClick(position) {
      console.log('画布被点击:', position);
      
      // 存储点击位置
      this.lastClickPosition = position;
      
      if (!this.pendingElementType) return;
      
      console.log(`添加待处理的元素: ${this.pendingElementType}`);
      
      if (this.pendingElementType === 'shape') {
        this.createShape(position.x, position.y);
      } else if (this.pendingElementType === 'text') {
        this.createText(position.x, position.y);
      } else if (this.pendingElementType === 'progress') {
        this.createProgress(position.x, position.y);
      }
      
      // 清除待添加状态
      this.pendingElementType = null;
    },
    
    createText(x, y) {
      const element = {
        id: this.nextId++,
        type: 'text',
        content: '点击编辑文本', // 确保默认文本存在
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
      
      console.log("添加文本元素:", JSON.stringify(element));
    },
    
    createShape(x, y) {
      const element = {
        id: this.nextId++,
        type: 'shape',
        shapeType: this.pendingShapeType,
        x: x,
        y: y,
        width: 100,
        height: 100,
        color: '#FF0000',
        startTime: this.currentTime,
        duration: 5,
        animation: null,
        trackId: 3 // 分配到形状轨道
      };
      
      this.elements.push(element);
      this.selectedElementId = element.id;
      
      console.log("添加形状元素:", JSON.stringify(element));
    },
    
    createProgress(x, y) {
      const element = {
        id: this.nextId++,
        type: 'progress',
        progressType: this.pendingProgressType,
        x: x,
        y: y,
        width: this.pendingProgressType === 'linear' ? 200 : 100,
        height: this.pendingProgressType === 'linear' ? 20 : 100,
        color: '#3b82f6',
        startTime: this.currentTime,
        duration: 10,
      };
      
      this.elements.push(element);
      this.selectedElementId = element.id;
    },
    
    // 添加新轨道
    addNewTrack(type) {
      const trackName = type === 'text' ? '文本轨道' : 
                       type === 'shape' ? '形状轨道' : 
                       type === 'progress' ? '进度轨道' : '自定义轨道';
                       
      const newTrack = {
        id: this.nextTrackId++,
        name: `${trackName} ${this.nextTrackId}`,
        type: type
      };
      
      this.tracks.push(newTrack);
      return newTrack.id;
    },
    
    // 更新元素时间线并确保其在正确的轨道上
    updateElementTime(elementId, startTime, duration) {
      const element = this.elements.find(e => e.id === elementId);
      if (element) {
        element.startTime = startTime;
        element.duration = duration;
        
        // 确保元素有一个轨道
        if (!element.trackId) {
          // 根据元素类型分配轨道
          if (element.type === 'text') {
            element.trackId = 2;
          } else if (element.type === 'shape') {
            element.trackId = 3;
          } else if (element.type === 'progress') {
            element.trackId = 4;
          } else {
            element.trackId = 1;
          }
        }
      }
    },
    
    setColor(color) {
      if (this.selectedElementId !== null) {
        const element = this.elements.find(e => e.id === this.selectedElementId);
        if (element) {
          element.color = color;
        }
      }
    },
    
    applyAnimation(animation) {
      if (this.selectedElementId !== null) {
        const element = this.elements.find(e => e.id === this.selectedElementId);
        if (element) {
          // 设置动画
          element.animation = animation;
          console.log(`应用动画 ${animation} 到元素 ID: ${this.selectedElementId}`);
        }
      }
    },
    
    togglePlayPause() {
      this.isPlaying = !this.isPlaying;
      
      if (this.isPlaying) {
        this.playbackInterval = setInterval(() => {
          this.currentTime += 0.1;
          if (this.currentTime >= this.duration) {
            this.currentTime = 0;
            this.isPlaying = false;
            clearInterval(this.playbackInterval);
          }
        }, 100);
      } else {
        clearInterval(this.playbackInterval);
      }
    },
    
    updateTime(time) {
      this.currentTime = time;
    },
    
    selectElement(id) {
      this.selectedElementId = id;
    },
    
    seekForward() {
      this.currentTime = Math.min(this.currentTime + 5, this.duration);
    },
    
    seekBackward() {
      this.currentTime = Math.max(this.currentTime - 5, 0);
    },
    
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    },
    
    // 工具函数：清理HTML
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
  }
};
