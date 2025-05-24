// 基础应用脚本 - 避免模块加载问题
console.log('加载基础应用...');

// 检查Vue是否可用
if (typeof Vue === 'undefined') {
  console.error('Vue未加载');
  document.querySelector('#app').innerHTML = 
    '<div style="text-align: center; padding: 20px; color: white;">' +
    '<h2>Vue框架未加载</h2>' +
    '<p>请检查网络连接</p>' +
    '<button onclick="location.reload()">重试</button>' +
    '</div>';
} else {
  // 创建简化版应用
  const app = Vue.createApp({
    data() {
      return {
        videoUrl: '',
        elements: [],
        currentTime: 0,
        duration: 10,
        selectedElementId: null,
        sidePanels: [
          {name: '形状', icon: 'square'},
          {name: '文字', icon: 'font'},
          {name: '动画', icon: 'film'},
          {name: '颜色', icon: 'palette'}
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
          <button><i class="fas fa-file-export"></i> 导出</button>
        </div>
        
        <input type="file" ref="videoInput" style="display:none" @change="onVideoSelected" accept="video/*">
      </div>
      
      <div class="main-container">
        <div class="sidebar">
          <div class="sidebar-section" v-for="(panel, index) in sidePanels" :key="index">
            <h3>{{ panel.name }}</h3>
            <div style="display: flex; justify-content: center; margin-top: 15px;">
              <i :class="'fas fa-' + panel.icon" style="font-size: 24px;"></i>
            </div>
          </div>
        </div>
        
        <div class="preview-container">
          <div class="video-preview">
            <video v-if="videoUrl" 
                   :src="videoUrl" 
                   controls 
                   style="max-width: 100%; max-height: 100%"></video>
            <div v-else style="text-align: center; padding: 20px; color: white;">
              <i class="fas fa-film" style="font-size: 48px; margin-bottom: 20px;"></i>
              <div>请导入视频进行编辑</div>
            </div>
          </div>
          
          <div class="controls">
            <button><i class="fas fa-step-backward"></i></button>
            <button style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-play"></i>
            </button>
            <button><i class="fas fa-step-forward"></i></button>
            <div style="margin: 0 15px; font-family: monospace;">00:00 / 00:00</div>
          </div>
          
          <div class="timeline-container">
            <div class="timeline-ruler">
              <div v-for="i in 10" :key="i" 
                   style="position: relative; width: 100px; border-left: 1px solid #334155; font-size: 10px; padding: 2px 4px;">
                {{ i }}s
              </div>
            </div>
            
            <div class="tracks-container">
              <div class="track">
                <div class="track-label">视频轨道</div>
              </div>
              <div class="track">
                <div class="track-label">文本轨道</div>
              </div>
              <div class="track">
                <div class="track-label">图形轨道</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    
    methods: {
      importVideo() {
        if (this.$refs.videoInput) {
          this.$refs.videoInput.click();
        }
      },
      
      onVideoSelected(event) {
        const file = event.target.files[0];
        if (file) {
          this.videoUrl = URL.createObjectURL(file);
        }
      }
    }
  });
  
  // 挂载应用
  try {
    app.mount('#app');
    console.log('基础应用已挂载');
  } catch (error) {
    console.error('挂载应用失败:', error);
    document.querySelector('#app').innerHTML = 
      '<div style="text-align: center; padding: 20px; color: white;">' +
      '<h2>应用挂载失败</h2>' +
      '<p>' + error.message + '</p>' +
      '<button onclick="location.reload()">重试</button>' +
      '</div>';
  }
}
