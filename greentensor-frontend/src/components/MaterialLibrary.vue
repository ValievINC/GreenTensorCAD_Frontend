<template>
  <div class="material-library component-section">
    <div class="section-header">
      <h2>Материалы</h2>
      <button @click="showAddModal = true" class="btn btn-success">
        <span>+ Добавить материал</span>
      </button>
    </div>

    <div class="scroll-container">
      <div class="materials-grid">
        <div 
          v-for="material in materials" 
          :key="material.id"
          class="card"
          :class="{ 'custom-material': material.custom }"
        >
          <div class="card-header">
            <div class="material-color" :style="{ backgroundColor: getMaterialColor(material) }"></div>
            <h4 class="material-name">{{ material.name }}</h4>
            <div class="material-actions">
              <button 
                @click.stop="editMaterial(material)"
                class="btn btn-warning btn-icon"
                title="Редактировать материал"
              >
                ✎
              </button>
              <button 
                v-if="material.custom"
                @click.stop="deleteMaterial(material.id)"
                class="btn btn-danger btn-icon"
                title="Удалить материал"
              >
                ×
              </button>
            </div>
          </div>
          
          <div class="material-properties">
            <div class="property">
              <span class="property-label">Магнитная проницаемость:</span>
              <span class="property-value">{{ material.magneticPermeability }}</span>
            </div>
            <div class="property">
              <span class="property-label">Диэлектрическая проницаемость:</span>
              <span class="property-value">{{ material.dielectricConstant }}</span>
            </div>
          </div>
          
          <div v-if="material.description" class="material-description">
            {{ material.description }}
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Редактировать материал' : 'Добавить новый материал' }}</h3>
          <button @click="closeModal" class="btn btn-secondary btn-icon">×</button>
        </div>
        
        <div class="form-grid grid-2cols" style="padding: 0 20px;">
          <div class="form-group">
            <label class="form-label">Название материала:</label>
            <input 
              v-model="currentMaterial.name" 
              type="text"
              class="form-input"
              placeholder="Введите название материала"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Магнитная проницаемость:</label>
            <input 
              v-model="magneticPermeabilityInput" 
              type="text" 
              class="form-input"
              placeholder="Введите значение"
              @blur="handleMagneticPermeabilityBlur"
              @keydown.enter="handleMagneticPermeabilityBlur"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Диэлектрическая проницаемость:</label>
            <input 
              v-model="dielectricConstantInput" 
              type="text" 
              class="form-input"
              placeholder="Введите значение"
              @blur="handleDielectricConstantBlur"
              @keydown.enter="handleDielectricConstantBlur"
            >
          </div>

          <div class="form-group">
            <label class="form-label">Цвет материала:</label>
            <div class="color-input-group">
              <input 
                v-model="currentMaterial.colorHex" 
                type="color" 
                class="color-picker"
              >
              <span class="color-value">{{ currentMaterial.colorHex }}</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button 
            @click="saveMaterial" 
            class="btn btn-success" 
            :disabled="!isFormValid"
          >
            {{ isEditing ? 'Обновить материал' : 'Сохранить материал' }}
          </button>
          <button @click="closeModal" class="btn btn-secondary">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialLibrary',
  props: {
    materials: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      showAddModal: false,
      showEditModal: false,
      currentMaterial: {
        id: null,
        name: '',
        magneticPermeability: 1.0,
        dielectricConstant: 1.0,
        colorHex: '#808080',
        description: ''
      },
      magneticPermeabilityInput: '1.0',
      dielectricConstantInput: '1.0'
    }
  },
  computed: {
    isFormValid() {
      return this.currentMaterial.name.trim() !== '' && 
             this.currentMaterial.magneticPermeability > 0 &&
             this.currentMaterial.dielectricConstant > 0
    },
    
    isEditing() {
      return this.currentMaterial.id !== null
    }
  },
  methods: {
    getMaterialColor(material) {
      if (Array.isArray(material.color)) {
        return `rgb(${Math.round(material.color[0] * 255)}, ${Math.round(material.color[1] * 255)}, ${Math.round(material.color[2] * 255)})`
      }
      return material.color || '#808080'
    },

    handleMagneticPermeabilityBlur() {
      const normalizedValue = this.magneticPermeabilityInput.replace(',', '.')
      const parsed = parseFloat(normalizedValue)
      
      if (isNaN(parsed) || parsed <= 0) {
        this.magneticPermeabilityInput = String(this.currentMaterial.magneticPermeability)
        return
      }
      
      this.currentMaterial.magneticPermeability = parsed
      this.magneticPermeabilityInput = String(parsed)
    },

    handleDielectricConstantBlur() {
      const normalizedValue = this.dielectricConstantInput.replace(',', '.')
      const parsed = parseFloat(normalizedValue)
      
      if (isNaN(parsed) || parsed <= 0) {
        this.dielectricConstantInput = String(this.currentMaterial.dielectricConstant)
        return
      }
      
      this.currentMaterial.dielectricConstant = parsed
      this.dielectricConstantInput = String(parsed)
    },

    editMaterial(material) {
      this.currentMaterial = {
        id: material.id,
        name: material.name,
        magneticPermeability: material.magneticPermeability,
        dielectricConstant: material.dielectricConstant,
        colorHex: this.rgbToHex(material.color),
        description: material.description || ''
      }
      this.magneticPermeabilityInput = String(material.magneticPermeability)
      this.dielectricConstantInput = String(material.dielectricConstant)
      this.showEditModal = true
    },

    deleteMaterial(materialId) {
      if (confirm('Вы уверены, что хотите удалить этот материал?')) {
        this.$emit('delete-material', materialId)
      }
    },

    saveMaterial() {
      if (!this.isFormValid) return

      const materialData = {
        name: this.currentMaterial.name.trim(),
        magneticPermeability: this.currentMaterial.magneticPermeability,
        dielectricConstant: this.currentMaterial.dielectricConstant,
        color: this.hexToRgb(this.currentMaterial.colorHex),
        description: this.currentMaterial.description.trim() || '',
        custom: true
      }

      if (this.isEditing) {
        materialData.id = this.currentMaterial.id
        this.$emit('update-material', materialData)
      } else {
        this.$emit('add-material', materialData)
      }
      
      this.closeModal()
    },

    closeModal() {
      this.showAddModal = false
      this.showEditModal = false
      this.resetCurrentMaterial()
    },

    resetCurrentMaterial() {
      this.currentMaterial = {
        id: null,
        name: '',
        magneticPermeability: 1.0,
        dielectricConstant: 1.0,
        colorHex: '#808080',
        description: ''
      }
      this.magneticPermeabilityInput = '1.0'
      this.dielectricConstantInput = '1.0'
    },

    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255
      ] : [0.5, 0.5, 0.5]
    },

    rgbToHex(rgb) {
      if (Array.isArray(rgb)) {
        const [r, g, b] = rgb.map(component => Math.round(component * 255))
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      }
      return rgb || '#808080'
    }
  },
  watch: {
    showAddModal(newVal) {
      if (newVal) {
        this.magneticPermeabilityInput = '1.0'
        this.dielectricConstantInput = '1.0'
      }
    }
  }
}
</script>

<style scoped>
.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
}

.custom-material {
  border-left: 4px solid var(--success-color);
}

.material-color {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  border: 2px solid var(--bg-white);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  flex-shrink: 0;
}

.material-name {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 600;
  flex: 1;
}

.material-actions {
  display: flex;
  gap: 5px;
}

.material-properties {
  margin-bottom: 10px;
}

.property {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 4px 0;
}

.property-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
}

.property-value {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 600;
  background: var(--bg-light);
  padding: 2px 8px;
  border-radius: 12px;
}

.material-description {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0 0 12px 0;
  line-height: 1.4;
  font-style: italic;
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

.color-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 50px;
  height: 35px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-muted);
}
</style>