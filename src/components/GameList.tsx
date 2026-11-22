import { useState } from 'react';
import type { Game } from '../types/nfl';
import { favoriteOutcome, useStandings, useStore } from '../state/store';
import { selectedTeamIds } from '../state/selection';
import { RESULT_STYLE, teamSchedule } from '../lib/teamSchedule';
import { GameRow } from './GameRow';
import { TeamBadge } from './TeamBadge';

/** Real results for a single team (read-only). */
function PlayedGames({ teamId }: { teamId: string }) {
  const season = useStore((s) => s.season)!;
  const played = teamSchedule(season.games, {}, teamId).filter((g) => g.game.isFinal);
  if (!played.length) return null;
  return (
    <div className="card mt-3 divide-y divide-white/5 px-4 py-1">
      {played.map((g) => (
        <div key={g.game.id} className="flex items-center gap-3 py-2 text-sm">
          <span className="w-10 text-[11px] font-semibold text-gray-500">WK {g.game.week}</span>
          <span className="w-5 text-xs text-gray-500">{g.home ? 'vs' : '@'}</span>
          <TeamBadge teamId={g.opponent} size="xs" />
          <span className="flex-1" />
          <span className="text-xs tabular-nums text-gray-400">{g.score}</span>
          {g.result && <span className={`grid h-6 w-6 place-items-center rounded-md text-[11px] font-black ${RESULT_STYLE[g.result]}`}>{g.result}</span>}
        </div>
      ))}
    </div>
  );
}

/** Remaining games involving the selected team(s), grouped by week. Shared games appear once. */
export function GameList() {
  const season = useStore((s) => s.season)!;
  const selection = useStore((s) => s.selection);
  const outcomes = useStore((s) => s.outcomes);
  const setOutcomes = useStore((s) => s.setOutcomes);
  const clearOutcomes = useStore((s) => s.clearOutcomes);
  const standings = useStandings()!;
  const [showPlayed, setShowPlayed] = useState(false);

  const teamIds = selectedTeamIds(selection);
  const ids = new Set(teamIds);
  const mine = season.games.filter((g) => ids.has(g.homeTeamId) || ids.has(g.awayTeamId));
  const remaining = mine.filter((g) => !g.isFinal);
  const played = mine.length - remaining.length;

  const weeks = new Map<number, Game[]>();
  for (const g of remaining) weeks.set(g.week, [...(weeks.get(g.week) ?? []), g]);
  const byWeek = [...weeks.entries()];

  const picked = remaining.filter((g) => outcomes[g.id]).length;
  const perspectiveFor = (g: Game) => {
    if (selection.kind === 'team') return selection.teamId;
    const inHome = teamIds.includes(g.homeTeamId);
    const inAway = teamIds.includes(g.awayTeamId);
    return inHome && inAway ? undefined : inHome ? g.homeTeamId : g.awayTeamId;
  };

  const fillFavorites = () => {
    const updates = Object.fromEntries(
      remaining.filter((g) => !outcomes[g.id]).map((g) => [g.id, favoriteOutcome(g, standings)]),
    );
    setOutcomes(updates);
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Remaining games</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${remaining.length ? (picked / remaining.length) * 100 : 100}%` }} />
            </div>
            {picked}/{remaining.length} picked
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={fillFavorites} disabled={picked === remaining.length} className="chip disabled:opacity-40">
            ✦ Pick favorites
          </button>
          <button type="button" onClick={() => clearOutcomes(remaining.map((g) => g.id))} disabled={!picked} className="chip disabled:opacity-40">
            Reset
          </button>
        </div>
      </div>
      {remaining.length === 0 && <p className="card p-4 text-sm text-gray-400">No games left — the regular season is complete.</p>}
      <div className="flex flex-col gap-3">
        {byWeek.map(([week, games]) => (
          <div key={week} className="card px-4 py-1">
            <div className="flex items-center gap-2 pt-3 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              Week {week}
              <span className="h-px flex-1 bg-gradient-to-r from-emerald-300/30 to-transparent" />
            </div>
            <div className="divide-y divide-white/5">
              {games.map((g) => <GameRow key={g.id} game={g} perspective={perspectiveFor(g)} />)}
            </div>
          </div>
        ))}
      </div>
      {selection.kind === 'team' && played > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowPlayed((v) => !v)} className="chip">
            {showPlayed ? 'Hide' : 'Show'} {played} played games
          </button>
          {showPlayed && <PlayedGames teamId={selection.teamId} />}
        </div>
      )}
    </section>
  );
}
