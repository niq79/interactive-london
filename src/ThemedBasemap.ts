import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { createBasemapStyle, basemapAttribution, type VectorTheme } from './basemapStyle';

setWorkerUrl(workerUrl);

export function createThemedBasemap(theme: VectorTheme) {
  const options = {
    style: createBasemapStyle(theme),
    attributionControl: { customAttribution: basemapAttribution },
    // This separate pane is never passed through the raster theme filters.
    pane: 'themedBasemap',
    fadeDuration: 0,
  };
  return maplibreGL(options);
}
