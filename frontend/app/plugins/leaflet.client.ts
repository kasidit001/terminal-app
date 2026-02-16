import 'leaflet/dist/leaflet.css'
import {
  LMap,
  LTileLayer,
  LMarker,
  LIcon,
  LPolyline,
  LCircleMarker,
} from '@vue-leaflet/vue-leaflet'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('LMap', LMap)
  nuxtApp.vueApp.component('LTileLayer', LTileLayer)
  nuxtApp.vueApp.component('LMarker', LMarker)
  nuxtApp.vueApp.component('LIcon', LIcon)
  nuxtApp.vueApp.component('LPolyline', LPolyline)
  nuxtApp.vueApp.component('LCircleMarker', LCircleMarker)
})
