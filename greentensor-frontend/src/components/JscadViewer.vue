<template>
  <div class="jscad-viewer">
    <div ref="viewerContainer" class="viewer-container"></div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

export default {
  name: 'JscadViewer',
  props: {
    layers: {
      type: Array,
      required: true
    },
    slicePosition: {
      type: Number,
      default: 180
    },
    sliceEnabled: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const viewerContainer = ref(null)
    let scene = null
    let camera = null
    let renderer = null
    let controls = null
    let animationId = null
    const meshes = []
    const sliceFaces = [] // Отдельный массив для slice faces
    let clippingPlane = null
    let gridHelper = null
    let axesHelper = null
    
    let cameraInitialized = false
    let currentMaxRadius = 10

    const initRenderer = () => {
      if (!viewerContainer.value) return

      if (renderer) {
        viewerContainer.value.removeChild(renderer.domElement)
        renderer.dispose()
      }

      // Сцена
      scene = new THREE.Scene()

      // Камера
      camera = new THREE.PerspectiveCamera(
        75,
        viewerContainer.value.clientWidth / viewerContainer.value.clientHeight,
        0.1,
        100000
      )
      
      if (!cameraInitialized) {
        camera.position.set(30, 30, 30)
        camera.lookAt(0, 0, 0)
        cameraInitialized = true
      }

      // Рендеринг
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
      })
      renderer.setSize(viewerContainer.value.clientWidth, viewerContainer.value.clientHeight)
      renderer.localClippingEnabled = true
      viewerContainer.value.appendChild(renderer.domElement)

      // Кручение-верчение
      controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.05
      controls.screenSpacePanning = false

      // Мягкое освещение, чтоб неосвещенная сторона не была супертёмной
      const ambientLight = new THREE.AmbientLight(0x404040, 10)
      scene.add(ambientLight)

      // Основной направленный свет
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
      directionalLight.position.set(1, 1, 1)
      directionalLight.intensity = 1
      scene.add(directionalLight)

      clippingPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)
    }

    const createHelpers = (maxRadius) => {
      if (gridHelper) scene.remove(gridHelper)
      if (axesHelper) scene.remove(axesHelper)

      const gridSize = Math.max(20, Math.ceil(maxRadius * 2.5))
      const divisions = Math.max(10, Math.ceil(gridSize / (maxRadius > 50 ? 20 : 10)))
      const axesSize = Math.max(10, Math.ceil(maxRadius * 1.5))

      gridHelper = new THREE.GridHelper(gridSize, divisions)
      axesHelper = new THREE.AxesHelper(axesSize)

      gridHelper.material.opacity = 0.15
      gridHelper.material.transparent = true
      gridHelper.material.depthWrite = false
      gridHelper.material.color = new THREE.Color(0x6c757d)

      axesHelper.material.depthWrite = false
      axesHelper.material.depthTest = true
      axesHelper.material.linewidth = 1.5
      
      const axesColors = [
        new THREE.Color(0xcc3333),
        new THREE.Color(0x33cc33),
        new THREE.Color(0x3333cc)
      ]
      
      axesHelper.setColors(axesColors[0], axesColors[1], axesColors[2])

      scene.add(gridHelper)
      scene.add(axesHelper)
      
      gridHelper.renderOrder = 999
      axesHelper.renderOrder = 1000
    }

    const updateCameraPosition = (maxRadius) => {
      if (!camera || !controls) return
      
      const radiusChanged = Math.abs(currentMaxRadius - maxRadius) > 1
      
      if (!cameraInitialized || radiusChanged) {
        currentMaxRadius = maxRadius
        
        const cameraDistance = Math.max(maxRadius * 2, 50)
        const currentDistance = camera.position.length()
        
        if (radiusChanged || currentDistance < maxRadius || currentDistance > maxRadius * 10) {
          const normalizedPosition = camera.position.clone().normalize()
          camera.position.copy(normalizedPosition.multiplyScalar(cameraDistance))
        }
        
        cameraInitialized = true
      }
      
      controls.update()
    }

    // Обновление плоскости среза при операциях над срезом
    const updateClippingPlane = () => {
      if (!clippingPlane) return

      const angle = THREE.MathUtils.degToRad(props.slicePosition)
      const normal = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      )

      clippingPlane.normal.copy(normal)
      clippingPlane.constant = 0
    }

    // Обновление ориентации всех slice faces
    const updateSliceFacesOrientation = () => {
      const angle = THREE.MathUtils.degToRad(props.slicePosition)
      const normal = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      )

      sliceFaces.forEach(face => {
        face.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          normal
        )
      })
    }

    const createRingGeometry = (outerRadius, innerRadius) => {
      const outerCircle = new THREE.Shape()
      outerCircle.moveTo(outerRadius, 0)
      outerCircle.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)

      if (innerRadius > 0) {
        const innerCircle = new THREE.Path()
        innerCircle.moveTo(innerRadius, 0)
        innerCircle.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
        outerCircle.holes.push(innerCircle)
      }

      const geometry = new THREE.ShapeGeometry(outerCircle, 64)
      return geometry
    }

    const createSliceFace = (outerRadius, innerRadius, color) => {
      const geometry = createRingGeometry(outerRadius, innerRadius)
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color().setRGB(color[0], color[1], color[2]),
        side: THREE.DoubleSide,
        clippingPlanes: [],
        depthWrite: true,
        depthTest: true,
        transparent: false,
        opacity: 1.0,
        shininess: 30,
        specular: new THREE.Color(0x222222)
      })

      const mesh = new THREE.Mesh(geometry, material)

      // Устанавливаем начальную ориентацию
      const angle = THREE.MathUtils.degToRad(props.slicePosition)
      const normal = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      )

      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        normal
      )

      return mesh
    }

    // Очистка всех slice faces
    const clearSliceFaces = () => {
      sliceFaces.forEach(face => {
        scene.remove(face)
        if (face.geometry) face.geometry.dispose()
        if (face.material) face.material.dispose()
      })
      sliceFaces.length = 0
    }

    // Создание slice faces
    const createSliceFaces = () => {
      clearSliceFaces()

      if (!props.sliceEnabled) return

      const layersWithRadii = props.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.normalizedRadius - b.normalizedRadius)
        .map(layer => {
          return {
            ...layer,
            outerRadius: layer.physicalRadius * 2
          }
        })

      const allLayers = [...layersWithRadii].sort((a, b) => a.outerRadius - b.outerRadius)
      
      for (let i = allLayers.length - 1; i >= 0; i--) {
        const layer = allLayers[i]
        const innerRadius = i > 0 ? allLayers[i - 1].outerRadius : 0
        
        if (innerRadius >= layer.outerRadius) continue

        const face = createSliceFace(layer.outerRadius, innerRadius, layer.color)
        face.material.visible = layer.visible

        scene.add(face)
        sliceFaces.push(face)
      }
    }

    // Создание/обновление самих сфер 
    const createSpheres = () => {
      meshes.forEach(mesh => {
        scene.remove(mesh)
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose())
          } else {
            mesh.material.dispose()
          }
        }
      })
      meshes.length = 0

      const layersWithRadii = props.layers
        .filter(layer => layer.visible)
        .sort((a, b) => a.normalizedRadius - b.normalizedRadius)
        .map(layer => {
          return {
            ...layer,
            outerRadius: layer.physicalRadius * 2
          }
        })

      const allLayers = [...layersWithRadii].sort((a, b) => a.outerRadius - b.outerRadius)

      let maxRadius = 10
      if (allLayers.length > 0) {
        maxRadius = Math.max(...allLayers.map(layer => layer.outerRadius))
      }

      maxRadius = Math.max(maxRadius, 5)

      createHelpers(maxRadius)
      updateCameraPosition(maxRadius)

      allLayers.forEach((layer, index) => {
        try {
          const innerRadius = index > 0 ? allLayers[index - 1].outerRadius : 0
          
          if (innerRadius >= layer.outerRadius) return

          const segments = Math.max(32, Math.min(128, Math.ceil(layer.outerRadius / 2)))
          
          const geometry = new THREE.SphereGeometry(
            layer.outerRadius, 
            segments, 
            segments,
            0, 
            Math.PI * 2,
            0, 
            Math.PI
          )
          
          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setRGB(layer.color[0], layer.color[1], layer.color[2]),
            wireframe: false,
            clippingPlanes: props.sliceEnabled ? [clippingPlane] : [],
            side: THREE.DoubleSide,
            depthWrite: true,
            depthTest: true,
            transparent: false,
            opacity: 1.0,
            visible: layer.visible,
            shininess: 40,
            specular: new THREE.Color(0x333333)
          })

          const sphere = new THREE.Mesh(geometry, material)
          
          if (innerRadius > 0) {
            const innerGeometry = new THREE.SphereGeometry(
              innerRadius,
              segments,
              segments,
              0,
              Math.PI * 2,
              0,
              Math.PI
            )
            
            const innerMaterial = new THREE.MeshPhongMaterial({
              color: new THREE.Color().setRGB(layer.color[0], layer.color[1], layer.color[2]),
              side: THREE.BackSide,
              clippingPlanes: props.sliceEnabled ? [clippingPlane] : [],
              depthWrite: true,
              depthTest: true,
              transparent: false,
              opacity: 1.0,
              visible: layer.visible,
              shininess: 40,
              specular: new THREE.Color(0x333333)
            })
            
            const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial)
            scene.add(innerSphere)
            meshes.push(innerSphere)
          }

          scene.add(sphere)
          meshes.push(sphere)

        } catch (error) {
          console.error('Error creating sphere:', error)
        }
      })

      updateClippingPlane()
      createSliceFaces()
    }

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      if (controls) {
        controls.update()
      }

      renderer.render(scene, camera)
    }

    const handleResize = () => {
      if (!camera || !renderer || !viewerContainer.value) return

      camera.aspect = viewerContainer.value.clientWidth / viewerContainer.value.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(viewerContainer.value.clientWidth, viewerContainer.value.clientHeight)
    }

    onMounted(() => {
      initRenderer()
      createSpheres()
      animate()

      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (renderer) {
        renderer.dispose()
      }
      if (controls) {
        controls.dispose()
      }
      meshes.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose()
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose())
          } else {
            mesh.material.dispose()
          }
        }
      })
      clearSliceFaces()
      window.removeEventListener('resize', handleResize)
    })

    watch(() => props.layers, () => {
      createSpheres()
    }, { deep: true })

    watch(() => [props.slicePosition, props.sliceEnabled], () => {
      updateClippingPlane()
      
      // Обновляем clipping planes для всех sphere meshes
      meshes.forEach(mesh => {
        if (mesh.material && Array.isArray(mesh.material.clippingPlanes)) {
          mesh.material.clippingPlanes = props.sliceEnabled ? [clippingPlane] : []
          mesh.material.needsUpdate = true
        }
      })

      // Обновляем или пересоздаём slice faces
      if (props.sliceEnabled) {
        // Если faces уже существуют, просто обновляем их ориентацию
        if (sliceFaces.length > 0) {
          updateSliceFacesOrientation()
        } else {
          // Иначе создаём заново
          createSliceFaces()
        }
        
        // Обновляем видимость
        sliceFaces.forEach(face => {
          face.visible = true
        })
      } else {
        // Скрываем faces когда slice отключён
        sliceFaces.forEach(face => {
          face.visible = false
        })
      }
    })

    return {
      viewerContainer
    }
  }
}
</script>

<style scoped>
.jscad-viewer {
  width: 100%;
  height: 100%;
  cursor: grab;
}

.jscad-viewer:active {
  cursor: grabbing;
}

.viewer-container {
  width: 100%;
  height: 100%;
  background: #f8f9fa;
  position: relative;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}

.viewer-container canvas {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 4px;
}
</style>