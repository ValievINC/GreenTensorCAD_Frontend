<template>
  <div id="app">
    <div class="app-container">
      <div class="controls-panel">
        <h1>GreenTensorCAD</h1>

        <LayerControls
            :layers="layers"
            @add-layer="addLayer"
            @remove-layer="removeLayer"
            @update-layer="updateLayer"
        />

        <SliceControls
            :slicePosition="slicePosition"
            :sliceEnabled="sliceEnabled"
            @update-slice="updateSlice"
        />
      </div>

      <div class="viewer-panel">
        <JscadViewer
            :layers="layers"
            :slicePosition="slicePosition"
            :sliceEnabled="sliceEnabled"
        />
      </div>
    </div>
  </div>
</template>

<script>
import LayerControls from './components/LayerControls.vue'
import SliceControls from './components/SliceControls.vue'
import JscadViewer from './components/JscadViewer.vue'

export default {
  name: 'App',
  components: {
    LayerControls,
    SliceControls,
    JscadViewer
  },
  data() {
    return {
      layers: [
        { id: 1, outerRadius: 8, thickness: 5, color: [0, 0, 1], visible: true },
        { id: 2, outerRadius: 10, thickness: 5, color: [0, 1, 0], visible: true },
        { id: 3, outerRadius: 12, thickness: 5, color: [1, 0, 0], visible: true }
      ],
      slicePosition: 180,
      sliceEnabled: true
    }
  },
  methods: {
    addLayer() {
      const newId = Math.max(...this.layers.map(l => l.id), 0) + 1
      const newOuterRadius = this.layers.length > 0 
        ? this.layers[this.layers.length - 1].outerRadius + 2 
        : 10

      this.layers.push({
        id: newId,
        outerRadius: newOuterRadius,
        thickness: 2,
        color: [Math.random(), Math.random(), Math.random()],
        visible: true
      })

      this.updateLayerRadii()
    },

    removeLayer(layerId) {
      if (this.layers.length <= 1) return
      this.layers = this.layers.filter(layer => layer.id !== layerId)
      this.updateLayerRadii()
    },

    updateLayer(updatedLayer) {
      const index = this.layers.findIndex(l => l.id === updatedLayer.id)
      if (index !== -1) {
        this.layers[index] = { ...updatedLayer }
        this.updateLayerRadii()
      }
    },

    updateLayerRadii() {
      for (let i = 0; i < this.layers.length; i++) {
        if (i === 0) {
          this.layers[i].outerRadius = Math.max(0.1, this.layers[i].thickness)
        } else {
          this.layers[i].outerRadius = Math.max(
            this.layers[i-1].outerRadius + 0.1, 
            this.layers[i-1].outerRadius + this.layers[i].thickness
          )
        }
        
        this.layers[i].outerRadius = Math.min(this.layers[i].outerRadius, 1000)
        this.layers[i].thickness = Math.min(this.layers[i].thickness, 1000)
      }
    },

    updateSlice({ position, enabled }) {
      this.slicePosition = position;
      this.sliceEnabled = enabled;
    }
  },

  mounted() {
    this.updateLayerRadii()
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #f8f9fa;
  color: #2c3e50;
}

#app {
  width: 100vw;
  height: 100vh;
}

.app-container {
  display: flex;
  height: 100vh;
  background: #ffffff;
}

.controls-panel {
  width: 450px;
  background: #ffffff;
  padding: 25px;
  overflow-y: auto;
  border-right: 2px solid #e9ecef;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
}

.viewer-panel {
  flex: 1;
  background: #f8f9fa;
  border-left: 1px solid #e9ecef;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #3498db;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.controls-panel::-webkit-scrollbar {
  width: 6px;
}

.controls-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.controls-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.controls-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>