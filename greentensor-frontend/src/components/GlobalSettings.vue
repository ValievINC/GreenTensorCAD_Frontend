<template>
  <div class="global-settings component-section">
    <div class="section-header">
      <h2>Глобальные настройки</h2>
    </div>
    
    <div class="settings-grid">
      <label class="form-group">
        <span class="form-label">Радиус линзы (коэффициент):</span>
        <input
            type="text"
            v-model="inputValue"
            @blur="handleBlur"
            @keydown.enter="handleBlur"
            class="form-input"
            placeholder="Введите число"
        >
        <div class="form-hint">
          k₀ = {{ displayValue }} ≈ {{ numericDisplayValue }}
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
    }
  },
  data() {
    return {
      inputValue: String(this.lensRadiusCoeff),
      localValue: this.lensRadiusCoeff
    }
  },
  computed: {
    displayValue() {
      return this.localValue
    },
    numericDisplayValue() {
      return this.localValue.toFixed(3)
    }
  },
  watch: {
    lensRadiusCoeff(newVal) {
      this.localValue = newVal
      // Обновляем input только если он не в фокусе
      if (document.activeElement !== this.$el?.querySelector('input')) {
        this.inputValue = String(newVal)
      }
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
      this.$emit('update-lens-radius', parsed)
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

.form-hint {
  font-size: 12px;
  color: #6c757d;
  font-family: 'Courier New', monospace;
}

.component-section {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>