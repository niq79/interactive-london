import assert from 'node:assert/strict';
import test from 'node:test';
import { standaloneHeight } from '../src/viewport.ts';

test('installed iPhone recovers the screen height when iOS reports a shorter viewport', () => {
  assert.equal(standaloneHeight({ width: 402, height: 812, screenWidth: 402, screenHeight: 874 }), 874);
});

test('installed viewport handles rotated and orientation-aware screen dimensions', () => {
  assert.equal(standaloneHeight({ width: 874, height: 340, screenWidth: 402, screenHeight: 874 }), 402);
  assert.equal(standaloneHeight({ width: 874, height: 340, screenWidth: 874, screenHeight: 402 }), 402);
});

test('a full-size viewport is preserved and multitasking windows are not enlarged', () => {
  assert.equal(standaloneHeight({ width: 402, height: 874, screenWidth: 402, screenHeight: 874 }), 874);
  assert.equal(standaloneHeight({ width: 600, height: 800, screenWidth: 1024, screenHeight: 1366 }), 800);
  assert.equal(standaloneHeight({ width: 600, height: 800, screenWidth: 0, screenHeight: 0 }), 800);
});
