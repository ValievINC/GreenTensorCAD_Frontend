<template>
  <div class="layer-controls component-section">
    <div class="section-header">
      <h2>Настройка слоёв</h2>
      <button @click="$emit('add-layer')" class="btn btn-success">+ Добавить слой</button>
    </div>

    <div class="scroll-container">
      <div class="layers-list">
        <div v-for="(layer, index) in layers" :key="layer.id" class="card">
          <div class="card-header">
            <span class="layer-title">Слой {{ index + 1 }}</span>
            <button
                @click="$emit('remove-layer', layer.id)"
                class="btn btn-danger btn-icon btn-icon-lg"
                :disabled="layers.length <= 1"
            >
              ×
            </button>
          </div>

          <div class="layer-controls-grid grid-2cols">
            <label class="checkbox-control grid-full-width">
              <input
                  type="checkbox"
                  v-model="layer.visible"
                  @change="updateLayer(layer)"
                  class="checkbox-input"
              >
              <span class="form-label">Видимость</span>
            </label>

            <!-- Нормированный радиус -->
            <label class="form-group">
              <span class="form-label">Нормированный радиус:</span>
              <input
                  type="number"
                  v-model.number="layer.normalizedRadius"
                  min="0.01"
                  max="10"
                  step="0.01"
                  @input="updateLayerWithValidation(layer, $event, 'normalizedRadius')"
                  class="form-input"
              >
              <div class="form-hint">
                Физ. радиус: {{ calculatePhysicalRadius(layer).toFixed(3) }} мм
                ({{ (layer.normalizedRadius * 100).toFixed(1) }}% от линзы)
              </div>
            </label>

            <div class="form-group grid-full-width">
              <label class="form-label">Материал:</label>
              <div class="select-wrapper">
                <select 
                  v-model="layer.materialId" 
                  @change="onMaterialChange(layer, $event)"
                  class="form-select"
                >
                  <option value="">-- Выберите материал --</option>
                  <optgroup label="Стандартные материалы">
                    <option 
                      v-for="material in standardMaterials" 
                      :key="material.id" 
                      :value="material.id"
                    >
                      {{ material.name }}
                    </option>
                  </optgroup>
                  <optgroup label="Пользовательские материалы" v-if="customMaterials.length > 0">
                    <option 
                      v-for="material in customMaterials" 
                      :key="material.id" 
                      :value="material.id"
                    >
                      {{ material.name }}
                    </option>
                  </optgroup>
                </select>
              </div>
            </div>

            <label class="form-group">
              <span class="form-label">Магнитная проницаемость:</span>
              <input
                  type="number"
                  v-model.number="layer.magneticPermeability"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  @input="updateLayerWithValidation(layer, $event, 'magneticPermeability')"
                  class="form-input"
                  :class="{ 'auto-applied': layer.autoAppliedProperties?.magneticPermeability }"
              >
            </label>

            <label class="form-group">
              <span class="form-label">Диэлектрическая проницаемость:</span>
              <input
                  type="number"
                  v-model.number="layer.dielectricConstant"
                  min="0.1"
                  max="1000"
                  step="0.1"
                  @input="updateLayerWithValidation(layer, $event, 'dielectricConstant')"
                  class="form-input"
                  :class="{ 'auto-applied': layer.autoAppliedProperties?.dielectricConstant }"
              >
            </label>

            <label class="form-group">
              <span class="form-label">Цвет:</span>
              <div class="color-input-wrapper">
                <input
                    type="color"
                    :value="rgbToHex(layer.color)"
                    @input="updateColor(layer, $event)"
                    class="color-picker full-width"
                    :class="{ 'auto-applied': layer.autoAppliedProperties?.color }"
                >
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LayerControls',
  props: {
    layers: {
      type: Array,
      required: true
    },
    materials: {
      type: Array,
      required: true
    },
    lensRadiusCoeff: {
      type: Number,
      required: true
    }
  },
  computed: {
    standardMaterials() {
      return this.materials.filter(m => !m.custom)
    },
    customMaterials() {
      return this.materials.filter(m => m.custom)
    }
  },
  methods: {
    calculatePhysicalRadius(layer) {
      const k0 = this.lensRadiusCoeff * Math.PI
      return layer.normalizedRadius * k0
    },

    getSelectedMaterial(materialId) {
      const id = Number(materialId);
      return this.materials.find(m => m.id === id);
    },

    getMaterialColor(materialId) {
      const material = this.getSelectedMaterial(materialId)
      if (!material) return '#cccccc'
      if (Array.isArray(material.color)) {
        return `rgb(${Math.round(material.color[0] * 255)}, ${Math.round(material.color[1] * 255)}, ${Math.round(material.color[2] * 255)})`
      }
      return material.color
    },

    onMaterialChange(layer, event) {
      const materialId = event.target.value
      const material = this.getSelectedMaterial(materialId)
      const autoAppliedProperties = {}
      
      if (material) {
        layer.color = Array.isArray(material.color) ? [...material.color] : this.hexToRgbArray(material.color)
        layer.magneticPermeability = material.magneticPermeability
        layer.dielectricConstant = material.dielectricConstant
        
        autoAppliedProperties.color = true
        autoAppliedProperties.magneticPermeability = true
        autoAppliedProperties.dielectricConstant = true
      }
      
      const updatedLayer = {
        ...layer,
        materialId: materialId || null,
        autoAppliedProperties: material ? autoAppliedProperties : {}
      }
      
      this.$emit('update-layer', updatedLayer)
    },

    updateLayer(layer) {
      this.$emit('update-layer', { ...layer })
    },

    updateLayerWithValidation(layer, event, field) {
      let value = parseFloat(event.target.value);
      
      if (isNaN(value)) {
        value = 0.1;
      } else if (value < 0.1) {
        value = 0.1;
      } else if (value > 1000) {
        value = 1000;
      }
      
      const autoAppliedProperties = { ...layer.autoAppliedProperties }
      if (autoAppliedProperties[field]) {
        delete autoAppliedProperties[field]
      }
      
      const updatedLayer = {
        ...layer,
        [field]: value,
        autoAppliedProperties
      }
      this.$emit('update-layer', updatedLayer)
    },

    updateColor(layer, event) {
      const hex = event.target.value
      const rgb = this.hexToRgb(hex)
      
      const autoAppliedProperties = { ...layer.autoAppliedProperties }
      if (autoAppliedProperties.color) {
        delete autoAppliedProperties.color
      }
      
      const updatedLayer = {
        ...layer,
        color: [rgb.r, rgb.g, rgb.b],
        autoAppliedProperties
      }
      this.$emit('update-layer', updatedLayer)
    },

    rgbToHex(rgb) {
      return `#${Math.round(rgb[0] * 255).toString(16).padStart(2, '0')}${Math.round(rgb[1] * 255).toString(16).padStart(2, '0')}${Math.round(rgb[2] * 255).toString(16).padStart(2, '0')}`
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
      } : { r: 1, g: 0, b: 0 }
    },

    hexToRgbArray(hex) {
      const rgb = this.hexToRgb(hex)
      return [rgb.r, rgb.g, rgb.b]
    }
  }
}
</script>

<style scoped>
.layers-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-height: min-content;
}

.layer-title {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 16px;
}

.material-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-light);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.material-preview-color {
  width: 16px;
  height: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-color);
  flex-shrink: 0;
}

.material-preview-name {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.color-input-wrapper {
  position: relative;
  display: inline-block;
  width: 100%;
}

.auto-applied-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--success-color);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.form-input.auto-applied,
.color-picker.auto-applied {
  border-color: var(--success-color);
  background: linear-gradient(135deg, #f8fff9 0%, #e8f5e9 100%);
  box-shadow: 0 0 0 1px var(--success-color);
}

/* Специфические стили для select */
.form-select optgroup {
  font-weight: 600;
  color: var(--text-secondary);
  font-size: 12px;
}

.form-select option {
  font-weight: normal;
  padding: 8px;
}

.color-picker.full-width {
  width: 210%;
  height: 40px; /* Увеличиваем высоту для удобства */
}
</style>