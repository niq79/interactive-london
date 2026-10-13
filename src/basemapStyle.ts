import type { StyleSpecification } from 'maplibre-gl';

export type VectorTheme = 'imperial' | 'rebel';

export const basemapAttribution = '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const palettes = {
  imperial: {
    name: 'London Imperial', background: '#2d2a26', park: '#30332c', water: '#1e1f20',
    building: '#34312d', path: '#7b7f83', minorRoad: '#6d6e71', mainRoad: '#7b7f83',
    text: '#f4f1e1', areaText: '#c6c6c6', waterText: '#c6c6c6',
  },
  rebel: {
    name: 'London Rebel', background: '#f4ead5', park: '#e4e5d0', water: '#d6dedb',
    building: '#efe3cc', path: '#78858d', minorRoad: '#a8a79c', mainRoad: '#8a9090',
    text: '#20313d', areaText: '#465763', waterText: '#35505d',
  },
};

// Style the features themselves: no image inversion or SVG filters. Labels remain
// sharp on high-density screens, independently of the road and building colours.
export function createBasemapStyle(theme: VectorTheme): StyleSpecification {
  const palette = palettes[theme];
  return {
    version: 8,
    name: palette.name,
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
        attribution: basemapAttribution,
      },
    },
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': palette.background } },
      {
        id: 'parks', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['park', 'forest', 'cemetery']]],
        paint: { 'fill-color': palette.park, 'fill-opacity': .65 },
      },
      {
        id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
        paint: { 'fill-color': palette.water },
      },
      {
        id: 'buildings', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
        paint: { 'fill-color': palette.building, 'fill-opacity': .35 },
      },
      {
        id: 'paths', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 14,
        filter: ['==', ['get', 'class'], 'path'],
        paint: { 'line-color': palette.path, 'line-opacity': .35, 'line-width': 1, 'line-dasharray': [2, 2] },
      },
      {
        id: 'minor-roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 10,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.minorRoad, 'line-opacity': .85,
          'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, .5, 13, 1.4, 18, 7],
        },
      },
      {
        id: 'main-roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': palette.mainRoad,
          'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 6, .6, 13, 2.5, 18, 12],
        },
      },
      {
        id: 'road-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', minzoom: 11,
        filter: ['has', 'name'],
        layout: {
          'symbol-placement': 'line', 'symbol-spacing': 350,
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 11, 16, 14],
          'text-max-angle': 30, 'text-padding': 4,
        },
        paint: { 'text-color': palette.text, 'text-halo-color': palette.background, 'text-halo-width': 1.5 },
      },
      {
        id: 'water-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name', minzoom: 10,
        layout: {
          'symbol-placement': 'line', 'symbol-spacing': 500,
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'], 'text-size': 13,
        },
        paint: { 'text-color': palette.waterText, 'text-halo-color': palette.water, 'text-halo-width': 1.5 },
      },
      {
        id: 'area-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', minzoom: 11,
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-padding': 12,
          'text-letter-spacing': .06,
        },
        paint: { 'text-color': palette.areaText, 'text-halo-color': palette.background, 'text-halo-width': 1.5 },
      },
      {
        id: 'city-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', maxzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'], 'text-size': 15, 'text-padding': 16,
        },
        paint: { 'text-color': palette.text, 'text-halo-color': palette.background, 'text-halo-width': 1.5 },
      },
    ],
  };
}
