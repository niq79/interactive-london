import type { StyleSpecification } from 'maplibre-gl';

export const imperialAttribution = '<a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> &copy; <a href="https://openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

// Style the features themselves: no image inversion or SVG filters. Labels remain
// sharp on high-density screens, independently of the road and building colours.
export const imperialStyle: StyleSpecification = {
  version: 8,
  name: 'London Imperial',
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: imperialAttribution,
    },
  },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#2d2a26' } },
    {
      id: 'parks', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse',
      filter: ['in', ['get', 'class'], ['literal', ['park', 'forest', 'cemetery']]],
      paint: { 'fill-color': '#30332c', 'fill-opacity': .65 },
    },
    {
      id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'fill-color': '#1e1f20' },
    },
    {
      id: 'buildings', type: 'fill', source: 'openmaptiles', 'source-layer': 'building', minzoom: 14,
      paint: { 'fill-color': '#34312d', 'fill-opacity': .35 },
    },
    {
      id: 'paths', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 14,
      filter: ['==', ['get', 'class'], 'path'],
      paint: { 'line-color': '#7b7f83', 'line-opacity': .35, 'line-width': 1, 'line-dasharray': [2, 2] },
    },
    {
      id: 'minor-roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 10,
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#6d6e71', 'line-opacity': .85,
        'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, .5, 13, 1.4, 18, 7],
      },
    },
    {
      id: 'main-roads', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']]],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#7b7f83',
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
      paint: { 'text-color': '#f4f1e1', 'text-halo-color': '#2d2a26', 'text-halo-width': 1.5 },
    },
    {
      id: 'water-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'water_name', minzoom: 10,
      layout: {
        'symbol-placement': 'line', 'symbol-spacing': 500,
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': 13,
      },
      paint: { 'text-color': '#c6c6c6', 'text-halo-color': '#1e1f20', 'text-halo-width': 1.5 },
    },
    {
      id: 'area-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', minzoom: 11,
      filter: ['in', ['get', 'class'], ['literal', ['suburb', 'quarter', 'neighbourhood']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': 13, 'text-padding': 12,
        'text-letter-spacing': .06,
      },
      paint: { 'text-color': '#c6c6c6', 'text-halo-color': '#2d2a26', 'text-halo-width': 1.5 },
    },
    {
      id: 'city-labels', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', maxzoom: 12,
      filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
      layout: {
        'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']],
        'text-font': ['Noto Sans Regular'], 'text-size': 15, 'text-padding': 16,
      },
      paint: { 'text-color': '#f4f1e1', 'text-halo-color': '#2d2a26', 'text-halo-width': 1.5 },
    },
  ],
};
