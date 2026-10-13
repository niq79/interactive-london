import assert from 'node:assert/strict';
import test from 'node:test';
import { days } from '../src/data.ts';
import { directionsUrl, initialDay, londonDate } from '../src/utils.ts';

test('London day selection handles midnight in Finland and trip dates', () => {
  assert.equal(londonDate(new Date('2026-10-14T21:30:00Z')), '2026-10-14');
  assert.equal(londonDate(new Date('2026-10-14T23:30:00Z')), '2026-10-15');
  assert.equal(initialDay(days.map(day => day.id), new Date('2026-10-15T09:00:00Z')), '2026-10-15');
  assert.equal(initialDay(days.map(day => day.id), new Date('2027-01-01T09:00:00Z')), '2026-10-14');
});

test('directions identify a precise destination and let Maps choose the current origin', () => {
  const studio = days[2].stops.find(stop => stop.id === 'studio')!;
  const url = new URL(directionsUrl(studio));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), '51.6906,-0.4173');
  assert.equal(url.searchParams.get('travelmode'), 'transit');
  assert.equal(url.searchParams.has('origin'), false);
  assert.equal(new URL(directionsUrl(studio, 'walking')).searchParams.get('travelmode'), 'walking');
});

test('the three fixed sightseeing bookings stay on their original days and times', () => {
  assert.equal(days[1].stops.find(stop => stop.id === 'lyceum')?.booking, 'Booked · 19:30');
  assert.equal(days[2].stops.find(stop => stop.id === 'studio')?.booking, 'Booked · 17:30');
  assert.equal(days[3].stops.find(stop => stop.id === 'museum')?.booking, 'Booked · 11:00');
  assert.equal(days[2].stops.find(stop => stop.id === 'euston')?.time, 'Reach by 15:15');
  assert.match(days[4].note, /No direct Stansted Express/);
});

test('every itinerary stop has unique identity, safe sources, and valid map coordinates', () => {
  const stops = days.flatMap(day => [...day.stops, ...(day.alternatives ?? [])]);
  assert.equal(new Set(stops.map(stop => stop.id)).size, stops.length);
  for (const stop of stops) {
    assert.ok(stop.coordinates[0] > 51 && stop.coordinates[0] < 52);
    assert.ok(stop.coordinates[1] > -1 && stop.coordinates[1] < 1);
    assert.ok(stop.sources.length > 0, stop.id);
    for (const source of stop.sources) assert.equal(new URL(source.url).protocol, 'https:');
  }
});
