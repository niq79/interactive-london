# London, together

A mobile family field guide for 13–17 October 2026: a day-by-day Leaflet map, sourced stories, Google Maps directions, and visited stops saved on each device.

The map opens in dark mode. Tap the floating L/day control to choose a day, select London Dark, London Light, Imperial, or Rebel colours, share a stop, or read the installation guide. Theme choice is saved on the device. The themed dashed line shows itinerary order, not a calculated walking route.

On iPhone, use Safari → Share → Add to Home Screen, enable Open as Web App if shown, and launch the London icon for an experience without the address bar. The site includes standalone app metadata and an Apple touch icon. Browser toolbar visibility in a normal tab is controlled by Safari.

## Run locally

```sh
npm install
npm run dev
```

Open the printed URL under `/interactive-london/`.

```sh
npm test
npm run build
npm run preview
```

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` tests, builds and deploys every push to `main`. Enable **Settings → Pages → Source: GitHub Actions**. The Vite base path is `/interactive-london/`; change it in `vite.config.ts` if the repository name changes.

## Edit the trip

`src/data.ts` contains all days, coordinates, planned times, stories and source links. The Edgware Road base is deliberately approximate. No ticket numbers, exact accommodation address or credentials are included.

Optional stops are marked separately. Sky Garden and The Garden at 120 are alternatives. Friday's stadium and Madame Tussauds options replace the planned afternoon.

## Offline and privacy

The production build generates a service worker that caches the app, itinerary and stories. The guide dialog confirms when the offline copy is ready. Map tiles, operator links, and Google Maps directions require internet. Google Fonts is optional; system fonts work offline.

Imperial uses a custom vector style on OpenFreeMap/OpenMapTiles data, with buildings, roads, and crisp labels styled independently. Its MapLibre renderer loads when Imperial is selected. The other themes use OpenStreetMap raster tiles. Both sources carry visible attribution; no map prefetch or bulk offline download is performed. GPS is requested only when the location button is pressed; it stays in the browser. Visited checkmarks are local to each device and are not synced. There is no analytics, backend or account requirement.

Historical content links to the relevant sources in each stop card. Timings come from `plan.txt`, with travel notes checked on 13 October 2026. Coach departures from the plan are explicitly unverified; follow current operator timetables and booking confirmations.
