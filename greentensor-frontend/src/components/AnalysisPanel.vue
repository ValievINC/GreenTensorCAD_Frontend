<template>
<div class="analysis-panel-root">
 <h2 class="panel-title">Анализ линзы</h2>

 <div class="panel-section">
   <label class="form-group">
     <span class="form-label">Точность:</span>
     <input
       type="number"
       v-model.number="seriesTerms"
       min="10"
       max="200"
       step="5"
       class="form-input"
     />
   </label>

   <label class="form-group">
     <span class="form-label">Угол φ (градусы):</span>
     <input
       type="number"
       v-model.number="azimuthAngleDeg"
       min="0"
       max="360"
       step="1"
       class="form-input"
     />
   </label>
 </div>

 <div class="panel-section buttons-row">
   <button
     class="btn btn-primary"
     :disabled="isLoading || !canBuildConfig"
     @click="requestPlot"
   >
     {{ isLoading ? 'Считаем...' : 'Рассчитать и построить' }}
   </button>

   <button
     class="btn btn-secondary"
     :disabled="isAnalysisLoading || !canBuildConfig"
     @click="requestAnalysis"
   >
     {{ isAnalysisLoading ? 'Формируем...' : 'Скачать ZIP-анализ' }}
   </button>
 </div>

 <p v-if="!canBuildConfig" class="hint-text">
   Добавьте хотя бы один слой с ненулевым радиусом, чтобы выполнить расчёт.
 </p>

 <p v-if="error" class="error-text">
   {{ error }}
 </p>

 <div class="panel-section" v-if="plotUrl">
   <h3 class="panel-subtitle">Диаграмма направленности</h3>
   <div class="image-wrapper">
     <img :src="plotUrl" alt="Полярная диаграмма" />
   </div>
 </div>

 <div class="panel-section" v-if="analysisUrl">
   <a :href="analysisUrl" download="lens_analysis.zip" class="download-link">
     Скачать последний ZIP c анализом
   </a>
 </div>

 <!-- CSV: загрузка для сравнения -->
 <div class="panel-section">
   <label class="form-group">
     <span class="form-label">CSV файл для сравнения:</span>
     <input
       type="file"
       @change="onCsvSelect"
       accept=".csv"
       class="form-input"
     />
   </label>
   <button class="btn btn-secondary" @click="compareCsv" :disabled="!csvFile">
     Сравнить с CSV
   </button>
 </div>

 <!-- Картинка сравнения -->
 <div class="panel-section" v-if="comparisonUrl">
   <h3 class="panel-subtitle">Сравнение с CSV</h3>
   <div class="image-wrapper">
     <img :src="comparisonUrl" alt="Сравнение с CSV" />
   </div>
 </div>
</div>
</template>

<script>
export default {
name: 'AnalysisPanel',
props: {
 layers: {
   type: Array,
   required: true
 },
 lensRadiusCoeff: {
   type: Number,
   required: true
 }
},
data() {
 return {
   csvFile: null,          // файл CSV
   seriesTerms: 50,
   azimuthAngleDeg: 0,
   plotUrl: null,
   analysisUrl: null,      // ZIP-анализ
   comparisonUrl: null,    // Картинка сравнения
   isLoading: false,
   isAnalysisLoading: false,
   error: null
 }
},
computed: {
 azimuthAngleRad() {
   return (this.azimuthAngleDeg * Math.PI) / 180
 },
 canBuildConfig() {
   return this.visibleLayers.length > 0
 },
 visibleLayers() {
   return this.layers
     .filter(l => l && l.visible !== false && (l.physicalRadius || 0) > 0)
     .slice()
     .sort((a, b) => (a.physicalRadius || 0) - (b.physicalRadius || 0))
 },
 apiLensConfig() {
   const radii = this.visibleLayers.map(l => Number(l.physicalRadius || 0))
   const dielectric_constants = this.visibleLayers.map(l =>
     Number(l.dielectricConstant || 1)
   )
   const magnetic_permeabilities = this.visibleLayers.map(l =>
     Number(l.magneticPermeability || 1)
   )

   return {
     wave_number: this.lensRadiusCoeff * Math.PI,
     series_terms: this.seriesTerms,
     layers_count: this.visibleLayers.length,
     azimuth_angle: this.azimuthAngleRad,
     radii,
     dielectric_constants,
     magnetic_permeabilities,
     alternative_wave_number: null
   }
 }
},
methods: {
 onCsvSelect(event) {
   const file = event.target.files[0]
   this.csvFile = file || null
 },

 async compareCsv() {
   if (!this.csvFile) return
   this.error = null

   try {
     const formData = new FormData()
     formData.append('file', this.csvFile)
     formData.append(
       'request',
       JSON.stringify({
         lens_config: this.apiLensConfig,
         normalize: true
       })
     )

     const response = await fetch('http://localhost:8000/compare-csv/', {
       method: 'POST',
       body: formData
     })

     if (!response.ok) {
       const text = await response.text()
       throw new Error(text || 'Ошибка сравнения')
     }

     const blob = await response.blob()

     if (this.comparisonUrl) {
       URL.revokeObjectURL(this.comparisonUrl)
     }
     this.comparisonUrl = URL.createObjectURL(blob)
   } catch (e) {
     console.error(e)
     // Если backend вернул JSON с detail — красиво покажем
     try {
       const parsed = JSON.parse(e.message)
       if (parsed.detail) {
         this.error =
           typeof parsed.detail === 'string'
             ? parsed.detail
             : JSON.stringify(parsed.detail)
         return
       }
     } catch (_) {
       /* ignore JSON parse error */
     }
     this.error = e.message || 'Не удалось выполнить сравнение'
   }
 },

 async requestPlot() {
   if (!this.canBuildConfig) return
   this.error = null
   this.isLoading = true

   try {
     const response = await fetch('http://localhost:8000/generate-plot/', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         lens_config: this.apiLensConfig,
         normalize: true
       })
     })

     if (!response.ok) {
       const text = await response.text()
       throw new Error(text || 'Ошибка ответа от API')
     }

     const blob = await response.blob()
     if (this.plotUrl) {
       URL.revokeObjectURL(this.plotUrl)
     }
     this.plotUrl = URL.createObjectURL(blob)
   } catch (e) {
     console.error(e)
     this.error = e.message || 'Не удалось выполнить расчёт'
   } finally {
     this.isLoading = false
   }
 },

 async requestAnalysis() {
   if (!this.canBuildConfig) return
   this.error = null
   this.isAnalysisLoading = true

   try {
     const response = await fetch('http://localhost:8000/generate-analysis/', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         lens_config: this.apiLensConfig,
         normalize: true
       })
     })

     if (!response.ok) {
       const text = await response.text()
       throw new Error(text || 'Ошибка ответа от API')
     }

     const blob = await response.blob()
     if (this.analysisUrl) {
       URL.revokeObjectURL(this.analysisUrl)
     }
     this.analysisUrl = URL.createObjectURL(blob)
   } catch (e) {
     console.error(e)
     this.error = e.message || 'Не удалось сформировать ZIP-анализ'
   } finally {
     this.isAnalysisLoading = false
   }
 }
},
beforeUnmount() {
 if (this.plotUrl) {
   URL.revokeObjectURL(this.plotUrl)
 }
 if (this.analysisUrl) {
   URL.revokeObjectURL(this.analysisUrl)
 }
 if (this.comparisonUrl) {
   URL.revokeObjectURL(this.comparisonUrl)
 }
}
}
</script>

<style scoped>
.analysis-panel-root {
display: flex;
flex-direction: column;
height: 100%;
}

.panel-title {
font-size: 18px;
margin-bottom: 12px;
}

.panel-subtitle {
font-size: 16px;
margin-bottom: 8px;
}

.panel-section {
margin-bottom: 12px;
}

.buttons-row {
display: flex;
gap: 8px;
flex-wrap: wrap;
}

.form-group {
display: flex;
flex-direction: column;
margin-bottom: 8px;
}

.form-label {
font-size: 13px;
margin-bottom: 4px;
}

.form-input {
padding: 6px 8px;
border-radius: 4px;
border: 1px solid #ced4da;
font-size: 13px;
}

.image-wrapper {
width: 100%;
max-height: 320px;
overflow: auto;
border-radius: 4px;
border: 1px solid #dee2e6;
background: #fff;
padding: 4px;
}

.image-wrapper img {
max-width: 100%;
display: block;
}

.btn {
padding: 6px 10px;
border-radius: 4px;
border: none;
cursor: pointer;
font-size: 13px;
white-space: nowrap;
}

.btn-primary {
background: #3498db;
color: #fff;
}

.btn-secondary {
background: #6c757d;
color: #fff;
}

.btn:disabled {
opacity: 0.6;
cursor: default;
}

.hint-text {
font-size: 12px;
color: #6c757d;
}

.error-text {
font-size: 12px;
color: #e74c3c;
}

.download-link {
font-size: 13px;
color: #3498db;
text-decoration: none;
}

.download-link:hover {
text-decoration: underline;
}
</style>