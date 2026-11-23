import type { Game } from '../types/nfl';

/** First week that still has an unplayed game (18 once the regular season is over). */
export function currentWeek(games: Game[]): number {
  const open = games.filter((g) => !g.isFinal);
  return open.length ? Math.min(...open.map((g) => g.week)) : 18;
}

export const gamesInWeek = (games: Game[], week: number) =>
  games.filter((g) => g.week === week).sort((a, b) => a.kickoffIso.localeCompare(b.kickoffIso) || a.id.localeCompare(b.id));

/** "Nov 26 – Dec 1" for the span of a week's kickoffs. */
export function weekDateRange(games: Game[]): string {
  if (!games.length) return '';
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const first = fmt(games[0].kickoffIso);
  const last = fmt(games[games.length - 1].kickoffIso);
  return first === last ? first : `${first} – ${last}`;
}
