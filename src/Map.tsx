import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocateFixed, Maximize, MapPin } from 'lucide-react';
import type { Stop } from './data';
import { homeCoordinates } from './data';

type Props = { stops: Stop[]; selected: Stop; visited: string[]; onSelect: (stop: Stop) => void; online: boolean; onNotice: (message: string) => void; theme: 'dark' | 'light' };
export default function TripMap({ stops, selected, visited, onSelect, online, onNotice, theme }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.LayerGroup | null>(null);
  const userLocation = useRef<L.CircleMarker | null>(null);
  const lastFit = useRef('');
  const currentStops = useRef(stops);
  currentStops.current = stops;
  const [locating, setLocating] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [tileAttempt, setTileAttempt] = useState(0);
  const selection = useRef(onSelect);
  selection.current = onSelect;

  function padding(): { paddingTopLeft: L.PointExpression; paddingBottomRight: L.PointExpression } {
    const height = map.current?.getSize().y ?? 700;
    return window.innerWidth < 768
      ? { paddingTopLeft: [30, Math.min(100, height * 0.20)], paddingBottomRight: [58, Math.min(205, height * 0.32)] }
      : { paddingTopLeft: [44, 64], paddingBottomRight: [Math.min(440, (map.current?.getSize().x ?? 1000) * 0.45), 64] };
  }

  function fit() {
    if (!map.current || !currentStops.current.length) return;
    map.current.fitBounds(L.latLngBounds(currentStops.current.map(stop => stop.coordinates)), { ...padding(), maxZoom: 15 });
  }

  useEffect(() => {
    if (!container.current) return;
    const instance = L.map(container.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: true }).setView([51.5105, -0.123], 13);
    map.current = instance;
    lastFit.current = '';
    L.control.zoom({ position: 'topright' }).addTo(instance);
    markers.current = L.layerGroup().addTo(instance);
    let previousWidth = 0;
    const resize = new ResizeObserver(() => {
      instance.invalidateSize();
      const width = container.current?.clientWidth ?? 0;
      if (Math.abs(width - previousWidth) > 20) { previousWidth = width; fit(); }
    });
    resize.observe(container.current);
    return () => { resize.disconnect(); instance.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !online) return;
    setTilesFailed(false);
    // Only on-screen tiles are requested. No prefetching or offline map downloads.
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map.current);
    tiles.on('tileerror', () => setTilesFailed(true));
    return () => { tiles.remove(); };
  }, [online, tileAttempt]);

  useEffect(() => {
    if (!map.current || !markers.current) return;
    markers.current.clearLayers();
    const regular = stops.filter(stop => !stop.optional);
    if (regular.length > 1) {
      const points = regular.map(stop => stop.coordinates);
      L.polyline(points, { color: theme === 'dark' ? '#111914' : '#ffffff', weight: 8, opacity: 0.9, interactive: false }).addTo(markers.current);
      L.polyline(points, { color: theme === 'dark' ? '#ffc36a' : '#a95712', weight: 4, dashArray: '12 9', opacity: 1, interactive: false }).addTo(markers.current);
    }
    L.marker(homeCoordinates, { icon: L.divIcon({ className: 'base-marker', html: '<span aria-hidden="true">⌂</span>', iconSize: [28, 28], iconAnchor: [14, 14] }), title: 'Edgware Road area · approximate base', keyboard: false }).bindTooltip('Edgware Road · approximate base').addTo(markers.current);
    stops.forEach((stop, index) => {
      const active = stop.id === selected.id;
      const done = visited.includes(stop.id);
      const marker = L.marker(stop.coordinates, {
        icon: L.divIcon({ className: `trip-pin${active ? ' active' : ''}${done ? ' done' : ''}${stop.optional ? ' optional' : ''}`, html: `<span>${done ? '✓' : index + 1}</span>`, iconSize: [36, 36], iconAnchor: [18, 18] }),
        title: `${index + 1}. ${stop.title}${stop.optional ? ' (optional)' : ''}`,
        alt: stop.title,
        zIndexOffset: active ? 1000 : 100,
        keyboard: true,
      }).on('click', () => selection.current(stop)).bindTooltip(stop.title, { direction: 'top', offset: [0, -16] }).addTo(markers.current!);
      const element = marker.getElement();
      element?.setAttribute('role', 'button');
      element?.setAttribute('aria-label', `Select ${stop.title}`);
      element?.setAttribute('aria-pressed', String(active));
    });
    const key = stops.map(stop => stop.id).join(',');
    if (lastFit.current !== key) { fit(); lastFit.current = key; }
  }, [stops, selected.id, visited, theme]);

  useEffect(() => {
    map.current?.panInside(selected.coordinates, { ...padding(), animate: true });
  }, [selected.id]);

  function locate() {
    if (!navigator.geolocation) { onNotice('Location is unavailable in this browser. You can still open directions.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setLocating(false);
      const point: [number, number] = [position.coords.latitude, position.coords.longitude];
      if (map.current) {
        userLocation.current?.remove();
        userLocation.current = L.circleMarker(point, { radius: 8, color: '#fff', weight: 3, fillColor: '#427cc3', fillOpacity: 1 }).bindTooltip('You are here').addTo(map.current);
        map.current.setView(point, 15);
      }
    }, error => {
      setLocating(false);
      onNotice(error.code === 1 ? 'Location access was declined. You can still choose a stop and open Google Maps.' : 'Could not find your location. Try again or open directions.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  }

  return <div className="map-stage">
    <div ref={container} className="london-map" aria-label="Interactive London itinerary map" />
    <div className="map-label"><span className="live-dot" /> YOUR LONDON, MAPPED</div>
    <div className="map-actions">
      <button className="map-action" onClick={fit} aria-label="Show all stops"><Maximize size={19} /></button>
      <button className="map-action" onClick={locate} disabled={locating} aria-label={locating ? 'Finding your location' : 'Show my location'}><LocateFixed size={20} className={locating ? 'spin' : ''} /></button>
    </div>
    {(!online || tilesFailed) && <div className="map-offline" role="status"><MapPin size={22} /><strong>{online ? 'Map tiles could not load' : 'You’re offline'}</strong><span>Your itinerary and stories are still here. Use the List view to explore.</span>{online && <button onClick={() => setTileAttempt(value => value + 1)}>Retry map</button>}</div>}
    <div className="map-legend"><span className="legend-line" /> Stop order · use Directions for routes</div>
  </div>;
}
