import { ref, type Ref } from 'vue'
import * as Cesium from 'cesium'

export interface CesiumGlobeOptions {
  container: Ref<HTMLElement | null>
  interactive?: boolean
  showAtmosphere?: boolean
  initialView?: { lat: number; lng: number; height: number }
}

export function useCesium(options: CesiumGlobeOptions) {
  const viewer = ref<Cesium.Viewer | null>(null)
  const ready = ref(false)

  const initialize = () => {
    if (!options.container.value) return

    // Hide default credits in a detached element
    const creditContainer = document.createElement('div')

    const v = new Cesium.Viewer(options.container.value, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      creditContainer,
      requestRenderMode: !options.interactive,
      maximumRenderTimeChange: options.interactive ? undefined : Infinity,
    })

    // Dark globe styling
    v.scene.backgroundColor = Cesium.Color.fromCssColorString('#0A0A0A')
    v.scene.globe.baseColor = Cesium.Color.fromCssColorString('#111111')
    v.scene.globe.enableLighting = false
    v.scene.fog.enabled = false
    if (v.scene.skyBox) v.scene.skyBox.show = false
    if (v.scene.sun) v.scene.sun.show = false
    if (v.scene.moon) v.scene.moon.show = false

    if (options.showAtmosphere === false && v.scene.skyAtmosphere) {
      v.scene.skyAtmosphere.show = false
    }

    // Disable interaction for background/static globes
    if (!options.interactive) {
      const controller = v.scene.screenSpaceCameraController
      controller.enableRotate = false
      controller.enableZoom = false
      controller.enableTranslate = false
      controller.enableTilt = false
      controller.enableLook = false
    }

    if (options.initialView) {
      v.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          options.initialView.lng,
          options.initialView.lat,
          options.initialView.height
        ),
      })
    }

    viewer.value = v
    ready.value = true
  }

  const destroy = () => {
    if (viewer.value && !viewer.value.isDestroyed()) {
      viewer.value.destroy()
      viewer.value = null
      ready.value = false
    }
  }

  const flyTo = (lat: number, lng: number, height: number = 5000000, duration: number = 2) => {
    viewer.value?.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
      duration,
    })
  }

  const addFlightArc = (
    dep: { lat: number; lng: number },
    arr: { lat: number; lng: number },
    color: string = '#FBBF24'
  ) => {
    if (!viewer.value) return null
    return viewer.value.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
          dep.lng, dep.lat, arr.lng, arr.lat
        ]),
        width: 2,
        material: new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.2,
          color: Cesium.Color.fromCssColorString(color),
        }),
        clampToGround: false,
        arcType: Cesium.ArcType.GEODESIC,
      },
    })
  }

  const addAirportMarker = (airport: { iata: string; lat: number; lng: number }, color: string = '#FBBF24') => {
    if (!viewer.value) return null
    return viewer.value.entities.add({
      position: Cesium.Cartesian3.fromDegrees(airport.lng, airport.lat),
      point: {
        pixelSize: 8,
        color: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.fromCssColorString(color + '40'),
        outlineWidth: 4,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `  ${airport.iata}`,
        font: '13px JetBrains Mono, monospace',
        fillColor: Cesium.Color.WHITE,
        style: Cesium.LabelStyle.FILL,
        pixelOffset: new Cesium.Cartesian2(8, -2),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('#FBBF24').withAlpha(0.15),
        backgroundPadding: new Cesium.Cartesian2(6, 4),
      },
    })
  }

  const clearEntities = () => {
    viewer.value?.entities.removeAll()
  }

  const autoRotate = (speed: number = 0.5) => {
    if (!viewer.value) return null
    const removeListener = viewer.value.clock.onTick.addEventListener(() => {
      if (viewer.value) {
        viewer.value.scene.camera.rotateRight(Cesium.Math.toRadians(speed * 0.016))
      }
    })
    return removeListener
  }

  return {
    viewer, ready,
    initialize, destroy,
    flyTo, addFlightArc, addAirportMarker, clearEntities, autoRotate,
  }
}
