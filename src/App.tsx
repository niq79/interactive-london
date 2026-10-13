import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CarFront, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, ExternalLink, Footprints, Info, List, Map as MapIcon, Navigation, Share2, TrainFront, WifiOff, X } from 'lucide-react';
import { days, homeCoordinates, type Stop } from './data';
import { isTheme, themeOrder, themes, type Theme } from './theme';
import { directionsUrl, initialDay, londonDate, readSaved } from './utils';
import TripMap from './Map';
import { syncStandaloneViewport } from './viewport';

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
  const [theme, setTheme] = useState<Theme>(() => readSaved('london-theme-v1', 'dark', isTheme));
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const currentDayButton = useRef<HTMLButtonElement>(null);
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

  useEffect(syncStandaloneViewport, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themes[theme].themeColor);
    try { localStorage.setItem('london-theme-v1', JSON.stringify(theme)); }
    catch { /* Theme still works when browser storage is unavailable. */ }
  }, [theme]);
  useEffect(() => {
    if (!menuOpen) return;
    currentDayButton.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuTrigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [menuOpen]);
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
    setMenuOpen(false);
    menuTrigger.current?.focus();
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
    <header className="app-header" ref={headerRef}>
      <button className={`trip-menu-trigger ${menuOpen ? 'open' : ''}`} ref={menuTrigger} onClick={() => setMenuOpen(value => !value)} aria-label={`Choose a day · ${day.weekday} ${day.date} October selected`} aria-expanded={menuOpen} aria-controls="trip-menu"><span className="brand-mark">L<span /></span><span className="brand-name">London<span>, together.</span></span><span className="current-day">{day.weekday.slice(0, 3)} <strong>{day.date}</strong></span><ChevronDown size={16} className="menu-chevron" /></button>
      <div className="header-caption">YOUR FAMILY FIELD GUIDE <span>13—17 OCTOBER 2026</span></div>
      <div className="view-toggle" role="group" aria-label="View mode"><button className={view === 'map' ? 'active' : ''} onClick={() => { setView('map'); setExpanded(false); setMenuOpen(false); }} aria-pressed={view === 'map'}><MapIcon size={16} />Map</button><button className={view === 'list' ? 'active' : ''} onClick={() => { setView('list'); setExpanded(false); setMenuOpen(false); }} aria-pressed={view === 'list'}><List size={17} />List</button></div>
      {menuOpen && <div id="trip-menu" className="trip-menu">
        <div className="menu-intro"><span className="eyebrow">13—17 OCTOBER · LONDON TIME</span><h2>Five days. Your London.</h2></div>
        <nav className="menu-days" aria-label="Choose a trip day">{days.map(item => <button key={item.id} ref={item.id === day.id ? currentDayButton : undefined} className={`menu-day ${item.id === day.id ? 'active' : ''}`} onClick={() => chooseDay(item.id)} aria-current={item.id === day.id ? 'date' : undefined}><span className="menu-day-date">{item.date}</span><span className="menu-day-text"><strong>{item.weekday}{item.id === today && <small>Today</small>}</strong><span>{item.title}</span></span>{item.id === day.id ? <Check size={17} /> : <ChevronRight size={16} />}</button>)}</nav>
        <div className="menu-day-summary"><h3>{day.title}</h3><p>{day.subtitle}</p><div className="reminder"><Clock3 size={15} /><span>{day.reminder}</span></div><span className="menu-progress"><Check size={13} />{completed} of {required.length} planned stops visited</span></div>
        <div className="theme-picker"><span className="theme-picker-label">COLOUR THEME</span><div className="theme-options" role="radiogroup" aria-label="Colour theme">{themeOrder.map(option => <button key={option} className={theme === option ? 'active' : ''} onClick={() => setTheme(option)} role="radio" aria-checked={theme === option}><span className={`theme-swatch ${option}`} aria-hidden="true"><span /></span><span>{themes[option].label}</span>{theme === option && <Check size={14} />}</button>)}</div></div>
        <div className="menu-tools"><button onClick={() => { setMenuOpen(false); void share(); }}><Share2 size={17} /><span>Share stop</span></button><button onClick={() => { setMenuOpen(false); setGuideOpen(true); }}><Info size={18} /><span>Trip guide & install</span></button></div>
      </div>}
    </header>
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
        <div className="map-wrapper" style={{ visibility: view === 'map' ? 'visible' : 'hidden' }}><TripMap stops={mapStops} selected={selected} visited={visited} onSelect={selectStop} online={online} onNotice={setToast} theme={theme} /></div>
        {view === 'list' && <div className="mobile-list"><div className="list-day-summary"><span className="eyebrow">{day.weekday.toUpperCase()} · {day.date} OCTOBER</span><h1>{day.title}</h1><h2>{day.subtitle}</h2><div className="reminder"><Clock3 size={17} /><span>{day.reminder}</span></div><p>{day.note}</p>{day.stops.some(item => item.optional) && <label className="optional-switch"><input type="checkbox" checked={showOptional} onChange={toggleOptional} /><span>Show optional stops</span></label>}</div>{stopRows()}{day.alternatives && <div className="list-alternatives"><h3>Alternative afternoons</h3><p>Choose one instead of Barbican and Brick Lane.</p>{day.alternatives.map(stop => <button key={stop.id} onClick={() => { selectStop(stop); setExpanded(true); }}>{stop.title}<ArrowUpRight size={17} /></button>)}</div>}<a className="back-to-base" href={directionsUrl(baseStop, 'transit')} target="_blank" rel="noopener noreferrer">Back to the Edgware Road area<ArrowUpRight size={16} /></a></div>}
        {(!online || !storageAvailable) && <div className="connection-banner" role="status"><WifiOff size={14} />{!online ? 'Offline · stories & itinerary available' : 'Progress stays in this session; browser storage is unavailable'}</div>}
        <section className={`stop-sheet ${expanded ? 'expanded' : ''} ${view === 'list' && !expanded ? 'hide-on-mobile' : ''}`} aria-label={`${selected.title} pocket guide`}>
          <button className="sheet-handle" onClick={() => { if (!handleDragged.current) setExpanded(value => !value); handleDragged.current = false; }} aria-label={expanded ? 'Collapse stop details' : 'Expand stop details'} aria-expanded={expanded}
            onPointerDown={event => { handleDragged.current = false; handleStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerUp={event => { if (handleStart.current !== null && Math.abs(event.clientY - handleStart.current) > 35) { handleDragged.current = true; setExpanded(event.clientY < handleStart.current); event.preventDefault(); } handleStart.current = null; }}><span /></button>
          <div className="sheet-body" ref={sheetBody}>
            <div className="sheet-topline"><span className="eyebrow">{labels[selected.category]}</span><div className="sheet-pagination"><button onClick={() => jump(-1)} disabled={currentIndex <= 0} aria-label="Previous stop"><ChevronLeft size={20} /></button><span>{currentIndex < 0 ? 'ALT' : String(currentIndex + 1).padStart(2, '0')}<span> / {String(stops.length).padStart(2, '0')}</span></span><button onClick={() => jump(1)} disabled={currentIndex < 0 || currentIndex === stops.length - 1} aria-label="Next stop"><ChevronRight size={20} /></button></div></div>
            <div className="sheet-title"><h2><button onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-label={`${expanded ? 'Collapse' : 'Read'} ${selected.title} story`}>{selected.title}</button></h2><button className={`visited-button ${visited.includes(selected.id) ? 'checked' : ''}`} onClick={markVisited} aria-label={visited.includes(selected.id) ? `Mark ${selected.title} unvisited` : `Mark ${selected.title} visited`} aria-pressed={visited.includes(selected.id)}><Check size={20} /></button></div>
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
      <button className="dialog-close icon-button" onClick={() => setGuideOpen(false)} aria-label="Close guide"><X size={21} /></button><span className="eyebrow">YOUR POCKET GUIDE</span><h2>A city of stories.<br />Ready when you are.</h2><p>Tap the L/day button to choose a day, switch themes, or share a stop. Tap a pin and open its story. Directions open Google Maps from your current location when available.</p><div className="guide-status"><span className={`status-dot ${offlineReady ? 'ready' : ''}`} /><strong>{offlineReady ? 'Itinerary & stories saved for offline use' : 'Offline copy is not ready yet'}</strong></div><p className="guide-small">{offlineReady ? 'The map tiles and Google Maps directions need connectivity. Open List view when offline.' : 'Keep this page open online briefly after publication to save the guide. Offline saving requires a supported browser.'}</p><div className="guide-divider" /><h3>More map. No address bar.</h3><p className="guide-small">On iPhone, open this site in Safari. Choose Share → Add to Home Screen, turn on Open as Web App if shown, then launch the London icon. This opens the guide without Safari’s address bar.</p><p className="guide-small">In a normal Safari tab, use Page Menu → Hide Toolbar if available. The website cannot hide browser controls automatically.</p><h3>Made for your trip</h3><p className="guide-small">13–17 October 2026 · all times are in London time. Your three fixed visits follow plan.txt. Optional rooftops and afternoon swaps are suggestions, not additional bookings.</p><p className="guide-small">Visited checkmarks and your theme choice are saved only on this device. The base pin shows the Edgware Road area; use your accommodation’s exact address for the final leg.</p><a className="guide-link" href="https://tfl.gov.uk/tube-dlr-overground/status/" target="_blank" rel="noopener noreferrer">Check current TfL services<ArrowUpRight size={16} /></a><button className="guide-done" onClick={() => setGuideOpen(false)}>Let’s explore<ArrowRight size={17} /></button>
    </dialog>
  </div>;
}
