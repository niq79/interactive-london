import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Compass, ExternalLink, Footprints, Info, List, Map as MapIcon, Navigation, Share2, TrainFront, WifiOff, X } from 'lucide-react';
import { days, homeCoordinates, type Stop } from './data';
import { directionsUrl, initialDay, londonDate, readSaved } from './utils';
import TripMap from './Map';

const labels = { landmark: 'History & landmarks', park: 'A little green space', shopping: 'Browse & discover', food: 'Food & a pause', transport: 'The next journey', film: 'Behind the screen', show: 'An evening on stage', museum: 'Objects & stories' };
const isStrings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
function startingSelection() {
  const [dayId, stopId] = location.hash.slice(1).split('/');
  const day = days.find(item => item.id === dayId) ?? days.find(item => item.id === initialDay(days.map(item => item.id)))!;
  const stop = [...day.stops, ...(day.alternatives ?? [])].find(item => item.id === stopId) ?? day.stops.find(item => !item.optional)!;
  return { dayId: day.id, stopId: stop.id };
}

export default function App() {
  const [selection, setSelection] = useState(startingSelection);
  const [visited, setVisited] = useState<string[]>(() => readSaved('london-visited-v1', [], isStrings));
  const [view, setView] = useState<'map' | 'list'>('map');
  const [expanded, setExpanded] = useState(false);
  const [showOptional, setShowOptional] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const sheetBody = useRef<HTMLDivElement>(null);
  const handleStart = useRef<number | null>(null);
  const handleDragged = useRef(false);
  const guideRef = useRef<HTMLDialogElement>(null);
  const day = days.find(item => item.id === selection.dayId)!;
  const selected = [...day.stops, ...(day.alternatives ?? [])].find(item => item.id === selection.stopId)!;
  const stops = useMemo(() => day.stops.filter(item => showOptional || !item.optional), [day, showOptional]);
  const mapStops = useMemo(() => stops.some(item => item.id === selected.id) ? stops : [...stops, selected], [stops, selected]);
  const currentIndex = stops.findIndex(item => item.id === selected.id);
  const required = day.stops.filter(item => !item.optional);
  const completed = required.filter(item => visited.includes(item.id)).length;
  const today = londonDate();

  useEffect(() => {
    try { localStorage.setItem('london-visited-v1', JSON.stringify(visited)); }
    catch { setStorageAvailable(false); }
  }, [visited]);
  useEffect(() => {
    history.replaceState(null, '', `#${selection.dayId}/${selection.stopId}`);
    sheetBody.current?.scrollTo({ top: 0 });
  }, [selection]);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  useEffect(() => {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      let disposed = false;
      const checkVersion = (worker: ServiceWorker | null) => {
        if (!worker) return;
        const channel = new MessageChannel();
        channel.port1.onmessage = event => {
          if (!disposed) setOfflineReady(event.data === __OFFLINE_VERSION__);
          channel.port1.close();
        };
        worker.postMessage('OFFLINE_VERSION', [channel.port2]);
      };
      const controllerChanged = () => checkVersion(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener('controllerchange', controllerChanged);
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
        .then(() => navigator.serviceWorker.ready).then(registration => checkVersion(registration.active)).catch(() => setOfflineReady(false));
      return () => { disposed = true; navigator.serviceWorker.removeEventListener('controllerchange', controllerChanged); };
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 6500);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (guideOpen) guideRef.current?.showModal();
    else guideRef.current?.close();
  }, [guideOpen]);

  function selectStop(stop: Stop) { setSelection({ dayId: day.id, stopId: stop.id }); }
  function chooseDay(id: string) {
    const next = days.find(item => item.id === id)!;
    const stop = next.stops.find(item => !item.optional && !visited.includes(item.id)) ?? next.stops.find(item => !item.optional)!;
    setSelection({ dayId: id, stopId: stop.id });
    setExpanded(false);
  }
  function markVisited() {
    setVisited(items => items.includes(selected.id) ? items.filter(id => id !== selected.id) : [...items, selected.id]);
  }
  function toggleOptional() {
    if (showOptional && selected.optional && day.stops.some(item => item.id === selected.id)) selectStop(day.stops.find(item => !item.optional)!);
    setShowOptional(value => !value);
  }
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'London, together', text: `${day.weekday} · ${selected.title}`, url: location.href });
      else { await navigator.clipboard.writeText(location.href); setToast('Link copied. Send it to the family.'); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setToast('Copy the address from your browser to share this stop.');
    }
  }
  function jump(direction: -1 | 1) {
    const index = currentIndex < 0 ? 0 : currentIndex + direction;
    if (stops[index]) selectStop(stops[index]);
  }
  function stopRows(compact = false) {
    return <div className={compact ? 'stop-rows compact' : 'stop-rows'}>{stops.map((stop, index) => <button key={stop.id} className={`stop-row ${selected.id === stop.id ? 'selected' : ''} ${visited.includes(stop.id) ? 'visited' : ''}`} onClick={() => { selectStop(stop); if (!compact) setExpanded(true); }} aria-pressed={selected.id === stop.id}>
      <span className={`stop-number ${stop.optional ? 'optional' : ''}`}>{visited.includes(stop.id) ? <Check size={16} /> : String(index + 1).padStart(2, '0')}</span>
      <span className="stop-row-content"><span className="stop-time">{stop.time}</span><strong>{stop.title}</strong><span className="stop-row-description">{stop.description}</span>{stop.booking && <span className="small-booking">{stop.booking}</span>}{stop.optional && <span className="small-optional">Optional</span>}</span>
      <ChevronRight size={16} className="row-chevron" />
    </button>)}</div>;
  }
  const baseStop: Stop = { ...selected, title: 'Edgware Road area', coordinates: homeCoordinates };

  return <div className="app-shell">
    <header className="app-header">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); chooseDay(initialDay(days.map(item => item.id))); }} aria-label="London together · today’s itinerary"><span className="brand-mark">L<span /></span><span className="brand-name">London<span>, together.</span></span></a>
      <div className="trip-date"><span>THE FAMILY FIELD GUIDE</span><strong>13—17 October 2026</strong></div>
      <div className="header-actions"><button onClick={share} className="icon-button" aria-label="Share this stop"><Share2 size={19} /></button><button onClick={() => setGuideOpen(true)} className="icon-button" aria-label="Open trip guide and offline information"><Info size={20} /></button></div>
    </header>
    <nav className="day-nav" aria-label="Choose a trip day">
      <div className="nav-intro"><Compass size={18} /><span>Five days.<br /><strong>A city of stories.</strong></span></div>
      {days.map(item => <button key={item.id} className={`day-tab ${item.id === day.id ? 'active' : ''}`} onClick={() => chooseDay(item.id)} aria-current={item.id === day.id ? 'date' : undefined}><span className="day-short">{item.weekday.slice(0, 3)}</span><span className="day-long">{item.weekday}</span><strong>{item.date}<span> OCT</span></strong>{item.id === today && <span className="today-dot" aria-label="Today" />}</button>)}
    </nav>
    <div className="workspace">
      <aside className="itinerary-sidebar">
        <div className="day-intro"><span className="eyebrow">DAY {days.indexOf(day) + 1} / 05 · {day.weekday.toUpperCase()}</span><h1>{day.title}</h1><p>{day.subtitle}</p><div className="reminder"><Clock3 size={17} /><span>{day.reminder}</span></div>
          <div className="progress-line"><span>{completed} of {required.length} planned stops visited</span><span>{Math.round(completed / required.length * 100)}%</span></div><div className="progress-track"><span style={{ width: `${completed / required.length * 100}%` }} /></div>
        </div>
        <div className="list-heading"><span>THE DAY’S ADVENTURE</span>{day.stops.some(item => item.optional) && <label className="optional-switch"><input type="checkbox" checked={showOptional} onChange={toggleOptional} /><span>Optional stops</span></label>}</div>
        {stopRows(true)}
        <div className="day-note"><BookOpen size={18} /><p>{day.note}</p></div>
        {day.alternatives && <details className="alternatives"><summary>Fancy a different afternoon?<ChevronDown size={16} /></summary><p>Choose one instead of Barbican and Brick Lane.</p>{day.alternatives.map(stop => <button key={stop.id} onClick={() => { selectStop(stop); setExpanded(true); }}><span>{stop.title}</span><ArrowUpRight size={16} /></button>)}</details>}
        <a className="back-to-base" href={directionsUrl(baseStop, 'transit')} target="_blank" rel="noopener noreferrer">Directions to Edgware Road area<ArrowUpRight size={16} /></a>
        <div className="sidebar-footer">A little history. A lot to discover.</div>
      </aside>
      <main className={`main-stage ${view === 'list' ? 'list-view' : ''}`}>
        <div className="mobile-day-title"><div><span className="eyebrow">DAY {days.indexOf(day) + 1} / 05</span><h1>{day.title}</h1></div><span className="mobile-progress" aria-label={`${completed} of ${required.length} planned stops visited`}><Check size={14} />{completed}/{required.length}</span></div>
        <div className="view-toggle" role="group" aria-label="View mode"><button className={view === 'map' ? 'active' : ''} onClick={() => { setView('map'); setExpanded(false); }} aria-pressed={view === 'map'}><MapIcon size={16} />Map</button><button className={view === 'list' ? 'active' : ''} onClick={() => { setView('list'); setExpanded(false); }} aria-pressed={view === 'list'}><List size={17} />List</button></div>
        <div className="map-wrapper" style={{ visibility: view === 'map' ? 'visible' : 'hidden' }}><TripMap stops={mapStops} selected={selected} visited={visited} onSelect={selectStop} online={online} onNotice={setToast} /></div>
        {view === 'list' && <div className="mobile-list"><div className="list-day-summary"><span className="eyebrow">{day.weekday.toUpperCase()} · {day.date} OCTOBER</span><h2>{day.subtitle}</h2><div className="reminder"><Clock3 size={17} /><span>{day.reminder}</span></div><p>{day.note}</p>{day.stops.some(item => item.optional) && <label className="optional-switch"><input type="checkbox" checked={showOptional} onChange={toggleOptional} /><span>Show optional stops</span></label>}</div>{stopRows()}{day.alternatives && <div className="list-alternatives"><h3>Alternative afternoons</h3><p>Choose one instead of Barbican and Brick Lane.</p>{day.alternatives.map(stop => <button key={stop.id} onClick={() => { selectStop(stop); setExpanded(true); }}>{stop.title}<ArrowUpRight size={17} /></button>)}</div>}<a className="back-to-base" href={directionsUrl(baseStop, 'transit')} target="_blank" rel="noopener noreferrer">Back to the Edgware Road area<ArrowUpRight size={16} /></a></div>}
        {(!online || !storageAvailable) && <div className="connection-banner" role="status"><WifiOff size={14} />{!online ? 'Offline · stories & itinerary available' : 'Progress stays in this session; browser storage is unavailable'}</div>}
        <section className={`stop-sheet ${expanded ? 'expanded' : ''} ${view === 'list' && !expanded ? 'hide-on-mobile' : ''}`} aria-label={`${selected.title} pocket guide`}>
          <button className="sheet-handle" onClick={() => { if (!handleDragged.current) setExpanded(value => !value); handleDragged.current = false; }} aria-label={expanded ? 'Collapse stop details' : 'Expand stop details'} aria-expanded={expanded}
            onPointerDown={event => { handleDragged.current = false; handleStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerUp={event => { if (handleStart.current !== null && Math.abs(event.clientY - handleStart.current) > 35) { handleDragged.current = true; setExpanded(event.clientY < handleStart.current); event.preventDefault(); } handleStart.current = null; }}><span /></button>
          <div className="sheet-body" ref={sheetBody}>
            <div className="sheet-topline"><span className="eyebrow">{labels[selected.category]}</span><div className="sheet-pagination"><button onClick={() => jump(-1)} disabled={currentIndex <= 0} aria-label="Previous stop"><ChevronLeft size={20} /></button><span>{currentIndex < 0 ? 'ALT' : String(currentIndex + 1).padStart(2, '0')}<span> / {String(stops.length).padStart(2, '0')}</span></span><button onClick={() => jump(1)} disabled={currentIndex < 0 || currentIndex === stops.length - 1} aria-label="Next stop"><ChevronRight size={20} /></button></div></div>
            <div className="sheet-title"><h2>{selected.title}</h2><button className={`visited-button ${visited.includes(selected.id) ? 'checked' : ''}`} onClick={markVisited} aria-label={visited.includes(selected.id) ? `Mark ${selected.title} unvisited` : `Mark ${selected.title} visited`} aria-pressed={visited.includes(selected.id)}><Check size={20} /></button></div>
            <div className="stop-meta"><span><Clock3 size={14} />{selected.time}</span>{selected.optional && <span className="optional-badge">Optional</span>}</div>
            {selected.booking && <div className="booking-badge"><span />{selected.booking} · from your itinerary</div>}
            <p className="sheet-description">{selected.description}</p>
            <div className="story-content"><div className="story-heading"><BookOpen size={17} /><span>THE STORY IN A MINUTE</span></div><p>{selected.story}</p>{selected.lookFor && <div className="look-for"><span className="eyebrow">TAKE A CLOSER LOOK</span><p>{selected.lookFor}</p></div>}<div className="practical-note"><span className="eyebrow">GOOD TO KNOW</span><p>{selected.tip}</p></div><div className="sources"><span className="eyebrow">KEEP EXPLORING</span>{selected.sources.map(item => <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}<ExternalLink size={13} /></a>)}</div><p className="source-note">Times are your planned London times. Travel notes checked 13 October 2026; follow live operator updates.</p></div>
          </div>
          <div className="sheet-footer"><button className="story-toggle" onClick={() => setExpanded(value => !value)}>{expanded ? <ArrowDown size={17} /> : <BookOpen size={17} />}<span>{expanded ? view === 'map' ? 'Back to map' : 'Close story' : 'Read the story'}</span></button><a className="directions-button" href={directionsUrl(selected)} target="_blank" rel="noopener noreferrer">{selected.mode === 'driving' ? <CarFront size={17} /> : <Navigation size={17} />}<span>Directions</span><ArrowUpRight size={15} /></a>{selected.mode !== 'driving' && <a className="transit-button" href={directionsUrl(selected, selected.mode === 'transit' ? 'walking' : 'transit')} target="_blank" rel="noopener noreferrer" title={selected.mode === 'transit' ? 'Walking directions' : 'Public transport directions'} aria-label={selected.mode === 'transit' ? 'Walking directions in Google Maps' : 'Public transport directions in Google Maps'}>{selected.mode === 'transit' ? <Footprints size={19} /> : <TrainFront size={19} />}</a>}</div>
        </section>
      </main>
    </div>
    {toast && <div className="toast" role="status">{toast}<button onClick={() => setToast('')} aria-label="Dismiss message"><X size={16} /></button></div>}
    <dialog ref={guideRef} className="guide-dialog" onCancel={() => setGuideOpen(false)} onClick={event => { if (event.target === event.currentTarget) setGuideOpen(false); }}>
      <button className="dialog-close icon-button" onClick={() => setGuideOpen(false)} aria-label="Close guide"><X size={21} /></button><span className="eyebrow">YOUR POCKET GUIDE</span><h2>A city of stories.<br />Ready when you are.</h2><p>Choose a day, tap a pin, and read the story. Directions open Google Maps from your current location when available.</p><div className="guide-status"><span className={`status-dot ${offlineReady ? 'ready' : ''}`} /><strong>{offlineReady ? 'Itinerary & stories saved for offline use' : 'Offline copy is not ready yet'}</strong></div><p className="guide-small">{offlineReady ? 'The map tiles and Google Maps directions need connectivity. Open List view when offline.' : 'Keep this page open online briefly after publication to save the guide. Offline saving requires a supported browser.'}</p><div className="guide-divider" /><h3>Made for your trip</h3><p className="guide-small">13–17 October 2026 · all times are in London time. Your three fixed visits follow plan.txt. Optional rooftops and afternoon swaps are suggestions, not additional bookings.</p><p className="guide-small">Visited checkmarks are saved only on this device. The base pin shows the Edgware Road area; use your accommodation’s exact address for the final leg.</p><p className="guide-small">Add this page to your phone’s home screen using your browser’s menu or Share → Add to Home Screen.</p><a className="guide-link" href="https://tfl.gov.uk/tube-dlr-overground/status/" target="_blank" rel="noopener noreferrer">Check current TfL services<ArrowUpRight size={16} /></a><button className="guide-done" onClick={() => setGuideOpen(false)}>Let’s explore<ArrowRight size={17} /></button>
    </dialog>
  </div>;
}
