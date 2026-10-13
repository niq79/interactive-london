type ViewportSize = { width: number; height: number; screenWidth: number; screenHeight: number };

// Some iOS Home Screen apps report a viewport shorter than the display. Only
// use screen dimensions when the app spans its width, including after rotation.
// This avoids stretching an iPad app that is in Split View or Stage Manager.
export function standaloneHeight({ width, height, screenWidth, screenHeight }: ViewportSize): number {
  if (screenWidth <= 0 || screenHeight <= 0) return height;
  if (Math.abs(width - screenWidth) <= 2) return Math.max(height, screenHeight);
  if (Math.abs(width - screenHeight) <= 2) return Math.max(height, screenWidth);
  return height;
}

export function syncStandaloneViewport() {
  const root = document.documentElement;
  const displayMode = window.matchMedia('(display-mode: standalone)');
  const appleNavigator = navigator as Navigator & { standalone?: boolean };
  let frame = 0;

  const update = () => {
    frame = 0;
    const installed = appleNavigator.standalone === true || displayMode.matches;
    if (installed) root.dataset.standalone = 'true';
    else delete root.dataset.standalone;

    const isIOS = appleNavigator.standalone === true
      || /iPhone|iPad|iPod/.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (installed && isIOS) {
      root.style.setProperty('--standalone-height', `${standaloneHeight({
        width: window.innerWidth, height: window.innerHeight,
        screenWidth: window.screen.width, screenHeight: window.screen.height,
      })}px`);
    } else root.style.removeProperty('--standalone-height');
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };
  const onVisibility = () => { if (!document.hidden) schedule(); };

  update();
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', onVisibility);
  displayMode.addEventListener('change', schedule);
  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    window.removeEventListener('pageshow', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', onVisibility);
    displayMode.removeEventListener('change', schedule);
    delete root.dataset.standalone;
    root.style.removeProperty('--standalone-height');
  };
}
