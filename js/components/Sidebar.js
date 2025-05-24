export default {
  name: 'Sidebar', // 添加名称
  
  template: `
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
        <h3>进度条</h3>
        <div class="progress-buttons">
          <button @click="addProgress('linear')">线性进度条</button>
          <button @click="addProgress('circular')">圆形进度条</button>
        </div>
      </div>
      
      <div class="sidebar-section">
        <button @click="addText()" style="width: 100%; padding: 8px;">添加文字</button>
      </div>
    </div>
  `,
  
  methods: {
    // 添加形状
    addShape(shapeType) {
      console.log('Sidebar: 添加形状', shapeType);
      this.$emit('add-shape', shapeType);
    },
    
    // 添加文本
    addText() {
      console.log('Sidebar: 添加文本');
      this.$emit('add-text');
    },
    
    // 设置颜色
    setColor(color) {
      console.log('Sidebar: 设置颜色', color);
      this.$emit('set-color', color);
    },
    
    // 应用动画
    applyAnimation(animation) {
      console.log('Sidebar: 应用动画', animation);
      this.$emit('apply-animation', animation);
    },
    
    // 添加进度条
    addProgress(progressType) {
      console.log('Sidebar: 添加进度条', progressType);
      this.$emit('add-progress', progressType);
    }
  }
};
