import type { Stop } from './data.ts';

export function directionsUrl(stop: Stop, mode: 'walking' | 'transit' | 'driving' = stop.mode ?? 'walking') {
  const params = new URLSearchParams({ api: '1', destination: stop.coordinates.join(','), travelmode: mode });
  return `https://www.google.com/maps/dir/?${params}`;
}

export function londonDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function initialDay(ids: string[], date = new Date()): string {
  const today = londonDate(date);
  return ids.includes(today) ? today : '2026-10-14';
}

export function readSaved<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return isValid(value) ? value : fallback;
  } catch { return fallback; }
}
