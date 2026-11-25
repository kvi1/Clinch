# Clinch

Live at **https://clinchapp.io**

Mobile-first NFL playoff scenario builder. Pick the remaining games for a team or division, watch standings and
seeds update with the full NFL tiebreaker procedure, predict the bracket, share via URL, export a PNG.
100% client-side; see [SPEC.md](SPEC.md).

## Develop

```sh
npm install
npm run dev            # http://localhost:5173
npm test               # engine, bracket, URL-state and data-script tests
npm run build          # type-check + production build to dist/
npm run fetch-schedule # refresh public/data/nfl-2026.json from nflverse
```

## Pages

- `/nfl` — NFL home: live score ticker, current playoff picture, this week's slate, team/division quick start.
- `/nfl/predict` — pick games in **One team** mode (team summary + exportable team card) or **Whole division** mode.
- `/nfl/bracket` — playoff bracket; tabbed with sideways-scrolling rounds below 1280px, AFC → Super Bowl ← NFC above.

`/` redirects to `/nfl` (future sport picker). Older paths (`/predict`, `/bracket`, `/?s=…`) forward to their `/nfl` equivalents with the scenario intact.

## Layout

- `src/engine/` — pure standings logic: `records.ts` (tallies), `tiebreakers/` (division + wild-card procedures),
  `standings.ts` (division ranks, seeds 1–16), `bracket.ts` (reseeding, pick invalidation).
  Validated against the official 2023 and 2024 seeds (`__fixtures__/`).
- `src/state/` — Zustand store, lz-string URL encoding (`?s=`).
- `scripts/fetch-schedule.ts` — nflverse schedules release (`games.csv.gz`) → season JSON, validated (272 games, 17 per team).

## Data & attribution

Schedule, scores and betting lines come from the [nflverse](https://github.com/nflverse/nflverse-data) `schedules` release,
licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The license requires credit, which the site footer provides —
keep it if you change the footer. nflverse updates every ~10–30 minutes; the GitHub Action polls every 30 minutes on game days.

## Deploy (Vercel)

Import the GitHub repo at vercel.com/new — `vercel.json` sets the Vite build (`npm run build` → `dist`), the SPA
rewrite so deep links like `/bracket?s=…` load the app, and caching (hashed assets cached forever, schedule JSON
always revalidated). `.github/workflows/update-schedule.yml` refreshes the schedule on a cron and commits only when the
data changed, which triggers a Vercel redeploy.

## Tiebreaker notes

- Coin tosses are replaced by a deterministic hash so a shared link always renders identically.
- Points-based steps only use real final scores (predicted games have none); net touchdowns is skipped because the
  feed does not include touchdown counts.
