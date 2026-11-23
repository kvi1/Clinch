/**
 * Fetches the NFL regular-season schedule + results from ESPN's public scoreboard JSON
 * and writes public/data/nfl-<season>.json.
 *
 * Usage: npm run fetch-schedule [-- --season 2026] [--out path.json]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Game, GameOutcome, SeasonData } from '../src/types/nfl';
import { TEAMS, TEAM_IDS } from '../src/data/teams';

const ESPN_ABBR: Record<string, string> = { WSH: 'WAS', JAC: 'JAX', LA: 'LAR' };
const normalize = (abbr: string) => ESPN_ABBR[abbr] ?? abbr;

/* Minimal shape of the ESPN response fields we read. */
interface EspnCompetitor { homeAway: 'home' | 'away'; score?: string; team: { abbreviation: string } }
interface EspnEvent {
  date: string;
  status: { type: { completed: boolean; name: string } };
  competitions: { competitors: EspnCompetitor[]; odds?: { spread?: number }[]; timeValid?: boolean }[];
}

export function mapEvent(ev: EspnEvent, season: number, week: number): Game {
  const comp = ev.competitions[0];
  const home = comp.competitors.find((c) => c.homeAway === 'home')!;
  const away = comp.competitors.find((c) => c.homeAway === 'away')!;
  const homeTeamId = normalize(home.team.abbreviation);
  const awayTeamId = normalize(away.team.abbreviation);
  const isFinal = ev.status.type.completed;
  const game: Game = {
    id: `${season}_W${week}_${awayTeamId}_${homeTeamId}`,
    week,
    kickoffIso: new Date(ev.date).toISOString(),
    homeTeamId,
    awayTeamId,
    isFinal,
    actualOutcome: 'UNPLAYED',
  };
  if (isFinal) {
    const hs = Number(home.score);
    const as = Number(away.score);
    game.homeScore = hs;
    game.awayScore = as;
    game.actualOutcome = (hs > as ? 'HOME_WIN' : hs < as ? 'AWAY_WIN' : 'TIE') satisfies GameOutcome;
  }
  const spread = comp.odds?.[0]?.spread;
  if (!isFinal && typeof spread === 'number') game.vegasSpread = spread;
  if (!isFinal && comp.timeValid === false) game.timeTbd = true;
  return game;
}

/**
 * ESPN intermittently omits odds. For games still to be played, keep the last known spread
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

async function fetchWeek(season: number, week: number): Promise<EspnEvent[]> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${season}&seasontype=2&week=${week}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = (await res.json()) as { events?: EspnEvent[] };
      return body.events ?? [];
    } catch (err) {
      if (attempt >= 3) throw new Error(`week ${week}: ${(err as Error).message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

async function main() {
  const idx = process.argv.indexOf('--season');
  const season = idx > 0 ? Number(process.argv[idx + 1]) : 2026;
  // Sequential with a small delay: ESPN rate-limits bursts of parallel requests.
  const weeks: EspnEvent[][] = [];
  for (let week = 1; week <= 18; week++) {
    weeks.push(await fetchWeek(season, week));
    await new Promise((r) => setTimeout(r, 250));
  }
  const games = weeks.flatMap((events, i) => events.map((ev) => mapEvent(ev, season, i + 1)));
  games.sort((a, b) => a.week - b.week || a.kickoffIso.localeCompare(b.kickoffIso) || a.id.localeCompare(b.id));

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
