export default {
  data() {
    return {
      projectName: 'Untitled Project',
      saved: true,
      currentTime: '00:00:00:00',
      shapes: [
        { name: 'Rectangle', icon: 'square' },
        { name: 'Circle', icon: 'circle' },
        { name: 'Triangle', icon: 'play' },
        { name: 'Star', icon: 'star' },
        { name: 'Heart', icon: 'heart' },
        { name: 'Hexagon', icon: 'hexagon' }
      ],
      colors: [
        '#FF3B30', '#FF9500', '#FFCC00', '#ADFF2F', '#34C759', '#00FF7F',
        '#32CD32', '#5AC8FA', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55',
        '#E066FF', '#FF69B4', '#FF6347', '#808080', '#1E90FF'
      ],
      animations: [
        { name: 'Fade In', value: 'fade-in' },
        { name: 'Slide In', value: 'slide-in' },
        { name: 'Scale Up', value: 'scale-up' },
        { name: 'Rotate', value: 'rotate' }
      ],
      progressBars: [
        { name: 'Linear Progress Bar', value: 'linear' },
        { name: 'Circular Progress', value: 'circular' }
      ],
      timelineTracks: [
        { name: 'shape', color: '#FF2D55', items: [{start: 0, end: 6}] },
        { name: 'text', color: '#1E90FF', items: [{start: 0, end: 8}] },
        { name: 'subtitle', color: '#FFCC00', items: [{start: 4, end: 10}] },
        { name: 'audio', color: '#FF9500', items: [{start: 0, end: 15}] },
        { name: 'processor', color: '#FF3B30', items: [{start: 0, end: 15}] }
      ],
      selectedColor: '#3b82f6',
      activeElement: null,
      playing: false
    }
  },
  methods: {
    selectShape(shape) {
      console.log(`Selected shape: ${shape.name}`);
    },
    selectColor(color) {
      this.selectedColor = color;
      console.log(`Selected color: ${color}`);
    },
    applyAnimation(animation) {
      console.log(`Applied animation: ${animation.name}`);
    },
    applyProgressBar(bar) {
      console.log(`Applied progress bar: ${bar.name}`);
    },
    exportProject() {
      console.log('Exporting project...');
    },
    playPause() {
      this.playing = !this.playing;
      console.log(this.playing ? 'Playing' : 'Paused');
    },
    prevFrame() {
      console.log('Previous frame');
    },
    nextFrame() {
      console.log('Next frame');
    },
    fullscreen() {
      console.log('Toggle fullscreen');
    },
    zoomIn() {
      console.log('Zoom in');
    },
    zoomOut() {
      console.log('Zoom out');
    }
  },
  template: `
    <div class="video-editor">
      <header class="editor-header">
        <div class="logo">
          <div class="logo-icon">E</div>
          <div class="logo-text">Elements</div>
        </div>
        <div class="project-info">
          <div class="project-name">{{ projectName }}</div>
          <div class="saved-status" v-if="saved">
            <i class="fas fa-check-circle"></i> Saved
          </div>
        </div>
        <div class="header-controls">
          <button class="btn-export" @click="exportProject">
            <i class="fas fa-download"></i> Export
          </button>
        </div>
      </header>
      
      <div class="editor-main">
        <div class="sidebar">
          <div class="sidebar-section">
            <h3>Shapes</h3>
            <div class="shapes-grid">
              <div v-for="shape in shapes" :key="shape.name" 
                   class="shape-item" @click="selectShape(shape)">
                <i :class="'fas fa-' + shape.icon"></i>
                <span>{{ shape.name }}</span>
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>Color</h3>
            <div class="color-grid">
              <div v-for="color in colors" :key="color" 
                   class="color-item" 
                   :style="{ backgroundColor: color }"
                   @click="selectColor(color)">
              </div>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>Animations</h3>
            <div class="animations-grid">
              <button v-for="animation in animations" :key="animation.value" 
                     class="animation-btn" @click="applyAnimation(animation)">
                {{ animation.name }}
              </button>
            </div>
          </div>
          
          <div class="sidebar-section">
            <h3>Progress Bars</h3>
            <div class="progress-bars-list">
              <button v-for="bar in progressBars" :key="bar.value" 
                     class="progress-bar-btn" @click="applyProgressBar(bar)">
                {{ bar.name }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="editor-canvas">
          <div class="canvas-container">
            <div class="welcome-text">Welcome to Video Editor</div>
            <div class="progress-bar-demo">
              <div class="linear-progress"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="timeline">
        <div class="timeline-controls">
          <button @click="prevFrame"><i class="fas fa-step-backward"></i></button>
          <button @click="playPause">
            <i :class="playing ? 'fas fa-pause' : 'fas fa-play'"></i>
          </button>
          <button @click="nextFrame"><i class="fas fa-step-forward"></i></button>
          <div class="time-display">{{ currentTime }}</div>
          <div class="timeline-right-controls">
            <button @click="fullscreen"><i class="fas fa-expand"></i></button>
            <button @click="zoomIn"><i class="fas fa-plus"></i></button>
            <button @click="zoomOut"><i class="fas fa-expand"></i></button>
          </div>
        </div>
        
        <div class="timeline-ruler">
          <div class="time-marker" v-for="i in 15" :key="i">{{ (i * 2).toString().padStart(2, '0') }}</div>
        </div>
        
        <div class="timeline-tracks">
          <div v-for="track in timelineTracks" :key="track.name" class="timeline-track">
            <div class="track-label" :style="{ backgroundColor: track.color }">
              <i :class="'fas fa-' + track.name"></i>
              {{ track.name }}
            </div>
            <div class="track-content">
              <div v-for="(item, index) in track.items" :key="index"
                   class="track-item"
                   :style="{
                     left: (item.start * 30) + 'px',
                     width: ((item.end - item.start) * 30) + 'px',
                     backgroundColor: track.color
                   }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}
