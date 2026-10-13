import assert from 'node:assert/strict';
import test from 'node:test';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { imperialStyle } from '../src/imperialStyle.ts';

function luminance(hex: string) {
  const rgb = hex.slice(1).match(/../g)!.map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}

function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + .05) / (values[1] + .05);
}

test('Imperial basemap is a valid renderable MapLibre style', () => {
  assert.deepEqual(validateStyleMin(imperialStyle).map(error => error.message), []);
});

test('all Imperial map labels remain readable against their background halo', () => {
  const labels = imperialStyle.layers.filter(layer => layer.type === 'symbol');
  assert.ok(labels.length > 0);
  for (const label of labels) {
    if (label.type !== 'symbol') continue;
    const text = label.paint?.['text-color'];
    const halo = label.paint?.['text-halo-color'];
    assert.equal(typeof text, 'string', label.id);
    assert.equal(typeof halo, 'string', label.id);
    assert.ok(contrast(text as string, halo as string) >= 4.5, `${label.id} must have readable contrast`);
    assert.ok(Number(label.paint?.['text-halo-width']) >= 1, `${label.id} must retain a background halo`);
  }
});
