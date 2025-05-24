export default {
  name: 'Timeline', // 添加名称
  
  props: {
    elements: Array,
    duration: Number,
    currentTime: Number
  },
  
  template: `
    <div class="timeline-container">
      <div class="timeline-ruler" @click="seekToPosition">
        <div 
          class="time-marker" 
          :style="{ left: (currentTime / duration * 100) + '%' }">
        </div>
        
        <div class="time-tick" v-for="tick in timeTicks" :key="tick" :style="{ left: tick + '%' }">
          {{ formatTime(tick * duration / 100) }}
        </div>
      </div>
      
      <div class="tracks-container">
        <!-- 自动生成的轨道 -->
        <div class="track" v-for="track in tracks" :key="track.type">
          <div class="track-label">{{ track.name }}</div>
          
          <div
            v-for="element in getTrackElements(track.type)"
            :key="element.id"
            :class="['track-item', getTrackItemClass(element.type)]"
            :style="{
              left: (element.startTime / duration * 100) + '%',
              width: (element.duration / duration * 100) + '%'
            }"
            @click="selectElement(element.id, $event)"
            @mousedown="startDragItem($event, element)"
          >
            {{ getItemLabel(element) }}
          </div>
        </div>
      </div>
    </div>
  `,
  
  data() {
    return {
      timeTicks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      dragInfo: {
        isDragging: false,
        element: null,
        startX: 0,
        originalStart: 0
      },
      // 预定义轨道
      tracks: [
        { type: 'text', name: '文本轨道' },
        { type: 'shape', name: '形状轨道' },
        { type: 'progress', name: '进度轨道' },
        { type: 'other', name: '其他元素' }
      ]
    };
  },
  
  mounted() {
    document.addEventListener('mousemove', this.dragItem);
    document.addEventListener('mouseup', this.stopDragItem);
  },
  
  beforeUnmount() {
    document.removeEventListener('mousemove', this.dragItem);
    document.removeEventListener('mouseup', this.stopDragItem);
  },
  
  methods: {
    seekToPosition(event) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = this.duration * percentage;
      this.$emit('time-update', newTime);
    },
    
    getTrackElements(trackType) {
      return this.elements.filter(element => {
        if (trackType === 'text' && element.type === 'text') return true;
        if (trackType === 'shape' && element.type === 'shape') return true;
        if (trackType === 'progress' && element.type === 'progress') return true;
        if (trackType === 'other' && 
            element.type !== 'text' && 
            element.type !== 'shape' && 
            element.type !== 'progress') return true;
        return false;
      });
    },
    
    getTrackItemClass(type) {
      return `${type}-track-item`;
    },
    
    getItemLabel(element) {
      switch(element.type) {
        case 'text':
          return element.content ? 
            (element.content.length > 10 ? 
              element.content.substring(0, 10) + '...' : 
              element.content) : 
            '文本';
        case 'shape':
          return element.shapeType || '形状';
        case 'progress':
          return element.progressType || '进度';
        default:
          return element.type || '元素';
      }
    },
    
    selectElement(id, event) {
      event.stopPropagation();
      this.$emit('element-selected', id);
    },
    
    startDragItem(event, element) {
      event.stopPropagation();
      
      this.dragInfo = {
        isDragging: true,
        element: element,
        startX: event.clientX,
        originalStart: element.startTime
      };
    },
    
    dragItem(event) {
      if (!this.dragInfo.isDragging) return;
      
      const timelineEl = document.querySelector('.timeline-container');
      if (!timelineEl) return;
      
      const rect = timelineEl.getBoundingClientRect();
      const deltaX = event.clientX - this.dragInfo.startX;
      const deltaTime = (deltaX / rect.width) * this.duration;
      
      let newStart = this.dragInfo.originalStart + deltaTime;
      
      // 确保不超出边界
      newStart = Math.max(0, newStart);
      newStart = Math.min(this.duration - this.dragInfo.element.duration, newStart);
      
      this.$emit('update-element-time', this.dragInfo.element.id, newStart, this.dragInfo.element.duration);
    },
    
    stopDragItem() {
      this.dragInfo.isDragging = false;
    },
    
    formatTime(seconds) {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min}:${sec.toString().padStart(2, '0')}`;
    }
  }
};
