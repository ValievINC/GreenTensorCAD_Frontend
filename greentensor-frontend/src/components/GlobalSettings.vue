<template>
  <div class="global-settings component-section">
    <div class="section-header">
      <h2>Глобальные настройки</h2>
    </div>
    
    <div class="settings-grid">
      <label class="form-group">
        <span class="form-label">Радиус линзы (коэффициент):</span>
        <input
            type="number"
            v-model.number="localLensRadiusCoeff"
            min="1"
            max="100"
            step="1"
            @input="updateLensRadius"
            class="form-input"
        >
        <div class="form-hint">
          k₀ = {{ localLensRadiusCoeff }} ≈ {{ (localLensRadiusCoeff).toFixed(3) }}
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
      localLensRadiusCoeff: this.lensRadiusCoeff
    }
  },
  watch: {
    lensRadiusCoeff(newVal) {
      this.localLensRadiusCoeff = newVal
    }
  },
  methods: {
    updateLensRadius() {
      let value = parseFloat(this.localLensRadiusCoeff)
      
      if (isNaN(value)) {
        value = 6
      } else if (value < 0) {
        value = 0
      } else if (value > 100) {
        value = 100
      }
      
      this.localLensRadiusCoeff = value
      this.$emit('update-lens-radius', value)
    }
  }
}
</script>