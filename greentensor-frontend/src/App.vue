<template>
  <div id="app">
    <div class="app-container">
      <div class="controls-panel">
        <h1>GreenTensorCAD</h1>

        <GlobalSettings
            :lensRadiusCoeff="lensRadiusCoeff"
            @update-lens-radius="updateLensRadius"
        />

        <MaterialLibrary
            :materials="materialLibrary"
            @add-material="addCustomMaterial"
            @delete-material="deleteCustomMaterial"
            @update-material="updateCustomMaterial"
        />

        <LayerControls
            :layers="layers"
            :materials="materialLibrary"
            :lensRadiusCoeff="lensRadiusCoeff"
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
            :lensRadiusCoeff="lensRadiusCoeff"
        />
      </div>
    </div>
  </div>
</template>

<script>
import LayerControls from './components/LayerControls.vue'
import SliceControls from './components/SliceControls.vue'
import JscadViewer from './components/JscadViewer.vue'
import MaterialLibrary from './components/MaterialLibrary.vue'
import GlobalSettings from './components/GlobalSettings.vue'
import { materialLibrary } from './assets/materials.js'

export default {
  name: 'App',
  components: {
    LayerControls,
    SliceControls,
    JscadViewer,
    MaterialLibrary,
    GlobalSettings
  },
  data() {
    return {
      layers: [
        { 
          id: 1, 
          normalizedRadius: 0.3, // Нормированный радиус (доля от общего)
          physicalRadius: 0, // Будет вычисляться автоматически
          thickness: 0, // Теперь thickness не нужен, вычисляется из normalizedRadius
          color: materialLibrary[0].color,
          magneticPermeability: materialLibrary[0].magneticPermeability,
          dielectricConstant: materialLibrary[0].dielectricConstant,
          materialId: 1,
          visible: true 
        },
        { 
          id: 2, 
          normalizedRadius: 0.6,
          physicalRadius: 0,
          thickness: 0,
          color: materialLibrary[1].color,
          magneticPermeability: materialLibrary[1].magneticPermeability,
          dielectricConstant: materialLibrary[1].dielectricConstant,
          materialId: 2,
          visible: true 
        },
        { 
          id: 3, 
          normalizedRadius: 1.0, // Последний слой = полный радиус линзы
          physicalRadius: 0,
          thickness: 0,
          color: materialLibrary[2].color,
          magneticPermeability: materialLibrary[2].magneticPermeability,
          dielectricConstant: materialLibrary[2].dielectricConstant,
          materialId: 3,
          visible: true 
        }
      ],
      slicePosition: 180,
      sliceEnabled: true,
      materialLibrary: [...materialLibrary],
      lensRadiusCoeff: 6 // k₀ = 6π (по умолчанию как в вашем коде)
    }
  },
  methods: {
    updateLensRadius(newCoeff) {
      this.lensRadiusCoeff = newCoeff
      this.updatePhysicalRadii()
    },

    updatePhysicalRadii() {
      // Вычисляем физические радиусы на основе нормированных и общего радиуса линзы
      const k0 = this.lensRadiusCoeff * Math.PI
      
      // Сортируем слои по нормированному радиусу
      const sortedLayers = [...this.layers].sort((a, b) => a.normalizedRadius - b.normalizedRadius)
      
      // Обновляем физические радиусы
      sortedLayers.forEach(layer => {
        layer.physicalRadius = layer.normalizedRadius * k0
      })
      
      // Обновляем outerRadius для визуализации
      this.updateLayerRadii()
    },

    addLayer() {
      const newId = Math.max(...this.layers.map(l => l.id), 0) + 1
      
      // Находим максимальный нормированный радиус
      const maxNormalizedRadius = Math.max(...this.layers.map(l => l.normalizedRadius))
      
      // Новый слой с немного большим нормированным радиусом
      const newNormalizedRadius = maxNormalizedRadius + 0.1

      this.layers.push({
        id: newId,
        normalizedRadius: newNormalizedRadius,
        physicalRadius: 0,
        thickness: 0,
        color: [Math.random(), Math.random(), Math.random()],
        magneticPermeability: 1.0,
        dielectricConstant: 1.0,
        materialId: null,
        visible: true
      })

      this.updatePhysicalRadii()
    },

    removeLayer(layerId) {
      if (this.layers.length <= 1) return
      this.layers = this.layers.filter(layer => layer.id !== layerId)
      this.updatePhysicalRadii()
    },

    updateLayer(updatedLayer) {
      const index = this.layers.findIndex(l => l.id === updatedLayer.id)
      if (index !== -1) {
        this.layers[index] = { ...updatedLayer }
        this.updatePhysicalRadii()
      }
    },

    updateLayerRadii() {
      // Обновляем outerRadius для визуализации (используем физические радиусы)
      const sortedLayers = [...this.layers].sort((a, b) => a.normalizedRadius - b.normalizedRadius)
      
      for (let i = 0; i < sortedLayers.length; i++) {
        // Масштабируем для лучшей визуализации
        sortedLayers[i].outerRadius = sortedLayers[i].physicalRadius * 2
      }
    },

    updateSlice({ position, enabled }) {
      this.slicePosition = position;
      this.sliceEnabled = enabled;
    },

    addCustomMaterial(material) {
      const newId = Math.max(...this.materialLibrary.map(m => m.id), 0) + 1
      this.materialLibrary.push({
        ...material,
        id: newId
      })
    },

    updateCustomMaterial(updatedMaterial) {
      const index = this.materialLibrary.findIndex(m => m.id === updatedMaterial.id)
      if (index !== -1) {
        this.materialLibrary[index] = { ...updatedMaterial }
        
        this.layers.forEach(layer => {
          if (layer.materialId === updatedMaterial.id) {
            layer.color = [...updatedMaterial.color]
            layer.magneticPermeability = updatedMaterial.magneticPermeability
            layer.dielectricConstant = updatedMaterial.dielectricConstant
          }
        })
      }
    },

    deleteCustomMaterial(materialId) {
      this.materialLibrary = this.materialLibrary.filter(m => m.id !== materialId)
      
      this.layers.forEach(layer => {
        if (layer.materialId === materialId) {
          layer.materialId = null
        }
      })
    },

    applyMaterialToAllLayers(material) {
      this.layers.forEach(layer => {
        layer.color = [...material.color]
        layer.magneticPermeability = material.magneticPermeability
        layer.dielectricConstant = material.dielectricConstant
        layer.materialId = material.id
      })
    }
  },

  mounted() {
    this.updatePhysicalRadii()
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