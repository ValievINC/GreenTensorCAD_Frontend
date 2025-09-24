<template>
  <div class="layer-controls">
    <div class="section-header">
      <h2>Настройка слоёв</h2>
      <button @click="$emit('add-layer')" class="add-btn">Добавить слой</button>
    </div>

    <div class="layers-list">
      <div v-for="(layer, index) in layers" :key="layer.id" class="layer-item">
        <div class="layer-header">
          <span>Слой {{ index + 1 }}</span>
          <button
              @click="$emit('remove-layer', layer.id)"
              class="remove-btn"
              :disabled="layers.length <= 1"
          >
            ×
          </button>
        </div>

        <div class="layer-controls-grid">
          <label class="checkbox-control">
            <input
                type="checkbox"
                v-model="layer.visible"
                @change="updateLayer(layer)"
                class="checkbox-input"
            >
            <span class="control-text">Видимость</span>
          </label>

          <label class="input-control">
            <span class="control-text">{{ index === 0 ? 'Радиус (мм):' : 'Толщина (мм):' }}</span>
            <input
                type="number"
                v-model.number="layer.thickness"
                min="0.1"
                max="1000"
                step="0.1"
                @input="updateLayerWithValidation(layer, $event, 'thickness')"
                class="number-input"
            >
          </label>

          <label class="input-control">
            <span class="control-text">Магнитная проницаемость</span>
            <input
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                class="number-input"
            >
          </label>

          <label class="input-control">
            <span class="control-text">Диэлектрическая проницаемость</span>
            <input
                type="number"
                min="0.1"
                max="1000"
                step="0.1"
                class="number-input"
            >
          </label>

          <label class="color-control">
            <span class="control-text">Цвет:</span>
            <input
                type="color"
                :value="rgbToHex(layer.color)"
                @input="updateColor(layer, $event)"
                class="color-input"
            >
          </label>
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
    }
  },
  methods: {
    updateLayer(layer) {
      this.$emit('update-layer', { ...layer })
    },

    updateLayerWithValidation(layer, event, field) {
      let value = parseFloat(event.target.value);
      
      // Валидация значений
      if (isNaN(value)) {
        value = 0.1;
      } else if (value < 0.1) {
        value = 0.1;
      } else if (value > 1000) {
        value = 1000;
      }
      
      const updatedLayer = {
        ...layer,
        [field]: value
      }
      this.$emit('update-layer', updatedLayer)
    },

    updateColor(layer, event) {
      const hex = event.target.value
      const rgb = this.hexToRgb(hex)
      const updatedLayer = {
        ...layer,
        color: [rgb.r, rgb.g, rgb.b]
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
    }
  }
}
</script>

<style scoped>
.layer-controls {
  margin-bottom: 30px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.add-btn:hover {
  background: #218838;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.layers-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.layer-item {
  background: #ffffff;
  padding: 18px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s ease;
}

.layer-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.remove-btn {
  background: #dc3545;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
}

.remove-btn:hover:not(:disabled) {
  background: #c82333;
  transform: scale(1.05);
}

/* Новая структура с использованием CSS Grid */
.layer-controls-grid {
  display: grid;
  grid-template-columns: 1fr 200px; /* Фиксированная ширина для инпутов */
  gap: 12px 15px;
  align-items: center;
}

/* Общие стили для всех контролов */
.checkbox-control,
.input-control,
.color-control {
  display: contents; /* Позволяет элементам быть частью grid */
}

.control-text {
  word-wrap: break-word;
  font-size: 14px;
  color: #495057;
  font-weight: 500;
  line-height: 1.4;
  align-self: center;
}

/* Специфические стили для чекбокса */
.checkbox-control {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 10px;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  margin: 0;
  accent-color: #3498db;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-input:focus {
  outline: 2px solid #3498db;
  outline-offset: 2px;
}

/* Стили для числового ввода */
.number-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  background: #ffffff;
  color: #2c3e50;
  font-size: 14px;
  transition: border-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.number-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.number-input:hover {
  border-color: #adb5bd;
}

/* Стили для цветового ввода */
.color-input {
  width: 100%;
  height: 32px;
  border: 1px solid #ced4da;
  border-radius: 3px;
  cursor: pointer;
  padding: 3px;
  background: #ffffff;
  box-sizing: border-box;
}

.color-input:hover {
  border-color: #adb5bd;
}

.color-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .layer-controls-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .control-text {
    margin-bottom: 4px;
  }
  
  .section-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
}
</style>