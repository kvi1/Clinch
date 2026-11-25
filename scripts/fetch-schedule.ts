/**
 * Builds public/data/nfl-<season>.json from the nflverse schedules release
 * (https://github.com/nflverse/nflverse-data, licensed CC BY 4.0 — credit "nflverse").
 *
 * Usage: npm run fetch-schedule [-- --season 2026] [--out path.json]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Game, GameOutcome, SeasonData } from '../src/types/nfl';
import { TEAMS, TEAM_IDS } from '../src/data/teams';

export const SOURCE_URL = 'https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv.gz';

/** nflverse abbreviations that differ from ours. */
const NFLVERSE_ABBR: Record<string, string> = { LA: 'LAR' };
const normalize = (abbr: string) => NFLVERSE_ABBR[abbr] ?? abbr;

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, CRLF). Returns rows as header-keyed objects. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

/** nflverse kickoff = local US Eastern date + "HH:MM". Convert to a UTC ISO string (DST-aware). */
export function easternToIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = (time || '13:00').split(':').map(Number);
  const asUtc = Date.UTC(y, m - 1, d, hh, mm);
  const offset = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'longOffset' })
    .formatToParts(new Date(asUtc + 5 * 3600_000))
    .find((p) => p.type === 'timeZoneName')!.value; // e.g. "GMT-05:00"
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(offset);
  const minutes = match ? (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
  return new Date(asUtc - minutes * 60_000).toISOString();
}

export function mapRow(r: Record<string, string>): Game {
  const season = Number(r.season);
  const week = Number(r.week);
  const homeTeamId = normalize(r.home_team);
  const awayTeamId = normalize(r.away_team);
  const isFinal = r.home_score !== '' && r.away_score !== '';
  const game: Game = {
    // Same id scheme as before the data-source switch — share links depend on it.
    id: `${season}_W${week}_${awayTeamId}_${homeTeamId}`,
    week,
    kickoffIso: easternToIso(r.gameday, r.gametime),
    homeTeamId,
    awayTeamId,
    isFinal,
    actualOutcome: 'UNPLAYED',
  };
  if (isFinal) {
    const hs = Number(r.home_score);
    const as = Number(r.away_score);
    game.homeScore = hs;
    game.awayScore = as;
    game.actualOutcome = (hs > as ? 'HOME_WIN' : hs < as ? 'AWAY_WIN' : 'TIE') satisfies GameOutcome;
  } else if (r.spread_line !== '' && !Number.isNaN(Number(r.spread_line))) {
    // nflverse: positive spread_line = home favored. Ours: negative = home favored.
    const line = Number(r.spread_line);
    game.vegasSpread = line === 0 ? 0 : -line;
  }
  return game;
}

/**
 * nflverse has no "time not set" flag; unscheduled games (e.g. week 18 before flexing) all carry the
 * same placeholder kickoff. If every remaining game in a week shares one kickoff, mark them TBD.
 */
export function markTbdWeeks(games: Game[]): void {
  const byWeek = new Map<number, Game[]>();
  for (const g of games) if (!g.isFinal) byWeek.set(g.week, [...(byWeek.get(g.week) ?? []), g]);
  for (const open of byWeek.values()) {
    if (open.length >= 8 && new Set(open.map((g) => g.kickoffIso)).size === 1) for (const g of open) g.timeTbd = true;
  }
}

/**
 * The feed can omit a line for a while. For games still to be played, keep the last known spread
 * instead of dropping it (mutates `next`). Finals never carry a spread.
 */
export function carryForwardSpreads(prev: Game[], next: Game[]): void {
  const before = new Map(prev.map((g) => [g.id, g.vegasSpread]));
  for (const g of next) {
    if (g.isFinal || g.vegasSpread != null) continue;
    const old = before.get(g.id);
    if (old != null) g.vegasSpread = old;
  }
}

export function validate(games: Game[]): string[] {
  const errors: string[] = [];
  if (games.length !== 272) errors.push(`expected 272 games, got ${games.length}`);
  const ids = new Set<string>();
  const count: Record<string, number> = {};
  for (const g of games) {
    if (ids.has(g.id)) errors.push(`duplicate game id ${g.id}`);
    ids.add(g.id);
    for (const t of [g.homeTeamId, g.awayTeamId]) {
      if (!TEAM_IDS.has(t)) errors.push(`unknown team ${t} in ${g.id}`);
      count[t] = (count[t] ?? 0) + 1;
    }
  }
  for (const t of TEAMS) if (count[t.id] !== 17) errors.push(`${t.id} has ${count[t.id] ?? 0} games, expected 17`);
  return errors;
}

export function buildSeason(rows: Record<string, string>[], season: number): Game[] {
  const games = rows.filter((r) => Number(r.season) === season && r.game_type === 'REG').map(mapRow);
  markTbdWeeks(games);
  games.sort((a, b) => a.week - b.week || a.kickoffIso.localeCompare(b.kickoffIso) || a.id.localeCompare(b.id));
  return games;
}

async function download(): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(SOURCE_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return gunzipSync(Buffer.from(await res.arrayBuffer())).toString('utf8');
    } catch (err) {
      if (attempt >= 3) throw new Error(`download failed: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const idx = process.argv.indexOf('--season');
  const season = idx > 0 ? Number(process.argv[idx + 1]) : 2026;
  const games = buildSeason(parseCsv(await download()), season);

  const errors = validate(games);
  if (errors.length) {
    console.error('Validation failed:\n  ' + errors.join('\n  '));
    process.exit(1);
  }
  const outIdx = process.argv.indexOf('--out');
  const out = outIdx > 0
    ? resolve(process.argv[outIdx + 1])
    : resolve(dirname(fileURLToPath(import.meta.url)), `../public/data/nfl-${season}.json`);
  // Keep the file byte-identical when nothing changed, so the scheduled job only commits real updates.
  if (existsSync(out)) {
    const prev = JSON.parse(readFileSync(out, 'utf8')) as SeasonData;
    carryForwardSpreads(prev.games, games);
    if (JSON.stringify(prev.games) === JSON.stringify(games)) {
      console.log('No changes.');
      return;
    }
  }
  const data: SeasonData = { season, updatedAt: new Date().toISOString(), games };
  writeFileSync(out, JSON.stringify(data) + '\n');
  const finals = games.filter((g) => g.isFinal).length;
  console.log(`Wrote ${games.length} games (${finals} final) to ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
