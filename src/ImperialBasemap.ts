import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { imperialStyle, imperialAttribution } from './imperialStyle';

setWorkerUrl(workerUrl);

export function createImperialBasemap() {
  const options = {
    style: imperialStyle,
    attributionControl: { customAttribution: imperialAttribution },
    // This separate pane is never passed through the raster theme filters.
    pane: 'imperialBasemap',
    fadeDuration: 0,
  };
  return maplibreGL(options);
}
