<template>
  <div class="slice-controls">
    <h2>Управление срезом</h2>

    <div class="slice-controls-group">
      <label class="checkbox-label">
        <input
            type="checkbox"
            :checked="sliceEnabled"
            @change="handleSliceEnabledChange"
        >
        Включить срез
      </label>

      <label v-if="sliceEnabled" class="slider-label">
        Положение среза: {{ slicePosition }}°
        <input
            type="range"
            :value="slicePosition"
            min="-180"
            max="180"
            step="1"
            @input="handleSlicePositionChange"
            class="slider"
        >
      </label>
    </div>

    <button type="button" class="calculate-button" @click="handleCalculateClick">
      Рассчитать диаграмму (API)
    </button>
  </div>
</template>

<script>
export default {
  name: 'SliceControls',
  props: {
    slicePosition: {
      type: Number,
      default: 180
    },
    sliceEnabled: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    handleSliceEnabledChange(event) {
      this.$emit('update-slice', {
        position: this.slicePosition,
        enabled: event.target.checked
      })
    },

    handleSlicePositionChange(event) {
      this.$emit('update-slice', {
        position: Number(event.target.value),
        enabled: this.sliceEnabled
      })
    },

    handleCalculateClick() {
      this.$emit('calculate-lens')
    }
  }
}
</script>

<style scoped>
.slice-controls {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.slice-controls h2 {
  margin-bottom: 15px;
  color: #2c3e50;
  font-size: 18px;
}

.slice-controls-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  cursor: pointer;
}

.slider-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-weight: 500;
}

.slider {
  width: 100%;
  margin-top: 5px;
}

input[type="checkbox"] {
  margin: 0;
  width: 16px;
  height: 16px;
}

.calculate-button {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #3498db;
  background: #3498db;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.calculate-button:hover {
  background: #2980b9;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.calculate-button:active {
  transform: translateY(1px);
  box-shadow: none;
}
</style>