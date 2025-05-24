console.log('使用备用加载器...');

// 检查Vue是否加载
if (typeof Vue === 'undefined') {
  // 尝试加载Vue
  var vueScript = document.createElement('script');
  vueScript.src = 'https://cdn.jsdelivr.net/npm/vue@3.2.45';
  vueScript.onload = initApp;
  vueScript.onerror = function() {
    document.querySelector('#app').innerHTML = 
      '<div style="text-align: center; padding: 20px; color: white;">' +
      '<h2>无法加载Vue框架</h2>' +
      '<p>请检查网络连接后重试。</p>' +
      '<button onclick="location.reload()">重试</button>' +
      '</div>';
  };
  document.head.appendChild(vueScript);
} else {
  initApp();
}

function initApp() {
  // 创建一个最小可行产品
  const app = {
    data() {
      return {
        message: '视频编辑器加载中...',
        loading: true,
        error: null
      };
    },
    mounted() {
      this.message = '视频编辑器已加载';
      this.loading = false;
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
          <button>导入视频</button>
          <button>导出</button>
        </div>
      </div>
      
      <div class="main-container">
        <div class="sidebar">
          <div class="sidebar-section">
            <h3>功能未加载</h3>
            <p style="color: white; padding: 10px;">出现了加载问题，请刷新页面重试</p>
          </div>
        </div>
        
        <div class="preview-container">
          <div class="video-preview">
            <div style="text-align: center; padding: 20px; color: white;">
              {{ message }}
              <div v-if="error">错误: {{ error }}</div>
              <button @click="location.reload()" v-if="error">重试</button>
            </div>
          </div>
        </div>
      </div>
    `
  };

  try {
    // 创建Vue应用
    const vueApp = Vue.createApp(app);
    vueApp.mount('#app');
    console.log('备用应用已挂载');
  } catch (error) {
    console.error('备用应用初始化失败:', error);
    document.querySelector('#app').innerHTML = 
      '<div style="text-align: center; padding: 20px; color: white;">' +
      '<h2>应用启动失败</h2>' +
      '<p>' + error.message + '</p>' +
      '<button onclick="location.reload()">重试</button>' +
      '</div>';
  }
}
