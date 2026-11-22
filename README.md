# Clinch

Mobile-first NFL playoff scenario builder. Pick the remaining games for a team or division, watch standings and
seeds update with the full NFL tiebreaker procedure, predict the bracket, share via URL, export a PNG.
100% client-side; see [SPEC.md](SPEC.md).

## Develop

```sh
npm install
npm run dev            # http://localhost:5173
npm test               # engine, bracket, URL-state and data-script tests
npm run build          # type-check + production build to dist/
npm run fetch-schedule # refresh public/data/nfl-2026.json from ESPN
```

## Pages

- `/` — landing page with how-it-works and a team/division quick start.
- `/predict` — pick games in **One team** mode (team summary + exportable team card) or **Whole division** mode.
- `/bracket` — playoff bracket; tabbed with sideways-scrolling rounds below 1280px, AFC → Super Bowl ← NFC above.

Old share links (`/?s=…`) forward to `/predict`.

## Layout

- `src/engine/` — pure standings logic: `records.ts` (tallies), `tiebreakers/` (division + wild-card procedures),
  `standings.ts` (division ranks, seeds 1–16), `bracket.ts` (reseeding, pick invalidation).
  Validated against the official 2023 and 2024 seeds (`__fixtures__/`).
- `src/state/` — Zustand store, lz-string URL encoding (`?s=`).
- `scripts/fetch-schedule.ts` — ESPN scoreboard → season JSON, validated (272 games, 17 per team).

## Deploy (Cloudflare Pages)

Connect the repo with build command `npm run build` and output directory `dist`. `public/_redirects` provides the SPA
fallback for `/bracket`. `.github/workflows/update-schedule.yml` refreshes the schedule on a cron and commits only when
the data changed, which triggers a Pages redeploy.

## Tiebreaker notes

- Coin tosses are replaced by a deterministic hash so a shared link always renders identically.
- Points-based steps only use real final scores (predicted games have none); net touchdowns is skipped because the
  feed does not include touchdown counts.
