<template>
  <div class="global-settings component-section">
    <div class="section-header">
      <h2>Глобальные настройки</h2>
    </div>
    
    <div class="settings-grid">
      <label class="form-group">
        <span class="form-label">Волновое число (k₀):</span>
        <input
            type="text"
            v-model="inputValue"
            @blur="handleBlur"
            @keydown.enter="handleBlur"
            class="form-input"
            placeholder="Введите число"
        >
        <div class="form-hint-group">
          <label class="checkbox-hint">
            <input
              type="checkbox"
              v-model="multiplyByPi"
              @change="handleMultiplyChange"
              class="checkbox-input-small"
            >
            <span>Умножить на π</span>
          </label>
          <div class="form-hint">
            <template v-if="multiplyByPi">
              k₀ = {{ displayValue }} × π ≈ {{ (displayValue * Math.PI).toFixed(3) }}
            </template>
            <template v-else>
              k₀ = {{ displayValue }}
            </template>
          </div>
        </div>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlobalSettings',
  props: {
    lensRadiusCoeff: {
      type: Number,
      required: true
    },
    usesPiMultiplier: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      inputValue: String(this.lensRadiusCoeff),
      localValue: this.lensRadiusCoeff,
      multiplyByPi: this.usesPiMultiplier,
      Math: Math
    }
  },
  computed: {
    displayValue() {
      return this.localValue
    }
  },
  watch: {
    lensRadiusCoeff(newVal) {
      this.localValue = newVal
      // Обновляем input только если он не в фокусе
      if (document.activeElement !== this.$el?.querySelector('input')) {
        this.inputValue = String(newVal)
      }
    },
    usesPiMultiplier(newVal) {
      this.multiplyByPi = newVal
    }
  },
  methods: {
    handleBlur() {
      // Заменяем запятую на точку для корректного парсинга
      const normalizedValue = this.inputValue.replace(',', '.')
      const parsed = parseFloat(normalizedValue)
      
      if (isNaN(parsed)) {
        // Если введено некорректное значение, возвращаем предыдущее
        this.inputValue = String(this.localValue)
        return
      }
      
      // Обновляем значение без ограничений
      this.localValue = parsed
      this.inputValue = String(parsed)
      this.emitUpdate()
    },
    
    handleMultiplyChange() {
      this.$emit('update-pi-multiplier', this.multiplyByPi)
      this.emitUpdate()
    },
    
    emitUpdate() {
      this.$emit('update-lens-radius', this.localValue)
    }
  }
}
</script>

<style scoped>
.global-settings {
  padding: 16px;
}

.section-header h2 {
  font-size: 18px;
  margin-bottom: 16px;
}

.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
}

.form-input {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-hint-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #495057;
  cursor: pointer;
  user-select: none;
}

.checkbox-input-small {
  width: 16px;
  height: 16px;
  cursor: pointer;
  margin: 0;
}

.form-hint {
  font-size: 12px;
  color: #6c757d;
  font-family: 'Courier New', monospace;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.component-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>