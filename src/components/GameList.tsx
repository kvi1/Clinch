import { useState } from 'react';
import type { Game } from '../types/nfl';
import { TEAM_BY_ID } from '../data/teams';
import { favoriteOutcome, useStandings, useStore } from '../state/store';
import { selectedTeamIds } from '../state/selection';
import { gamesInWeek } from '../lib/season';
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

/** A game that has already been played: locked, shows the real score. */
function FinalRow({ game }: { game: Game }) {
  const side = (id: string, score: number | undefined, won: boolean) => (
    <div className={`flex flex-1 items-center gap-2 rounded-xl border border-white/5 px-3 py-2 ${won ? 'bg-white/[0.06]' : 'opacity-50'}`}>
      <TeamBadge teamId={id} size="xs" />
      <span className="flex-1 truncate text-sm text-gray-200">{TEAM_BY_ID[id].name}</span>
      <span className={`text-sm tabular-nums ${won ? 'font-bold text-white' : 'text-gray-400'}`}>{score}</span>
    </div>
  );
  return (
    <div className="py-2">
      <div className="mb-1 text-[11px] font-semibold tracking-wider text-amber-300/80 uppercase">Final</div>
      <div className="flex gap-1.5">
        {side(game.awayTeamId, game.awayScore, game.actualOutcome === 'AWAY_WIN')}
        {side(game.homeTeamId, game.homeScore, game.actualOutcome === 'HOME_WIN')}
      </div>
    </div>
  );
}

const dayLabel = (g: Game) =>
  g.timeTbd ? 'Time TBD' : new Date(g.kickoffIso).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

/** Games for the current selection: a team's or division's remaining games by week, or a whole week's slate by day. */
export function GameList() {
  const season = useStore((s) => s.season)!;
  const selection = useStore((s) => s.selection);
  const outcomes = useStore((s) => s.outcomes);
  const setOutcomes = useStore((s) => s.setOutcomes);
  const clearOutcomes = useStore((s) => s.clearOutcomes);
  const standings = useStandings()!;
  const [showPlayed, setShowPlayed] = useState(false);

  const weekMode = selection.kind === 'week';
  const teamIds = selectedTeamIds(selection);
  const ids = new Set(teamIds);
  const mine = weekMode
    ? gamesInWeek(season.games, selection.week)
    : season.games.filter((g) => ids.has(g.homeTeamId) || ids.has(g.awayTeamId));
  const remaining = mine.filter((g) => !g.isFinal);
  const played = mine.length - remaining.length;

  // Team/division: remaining games by week. Week: every game (finals included) by day.
  const groups = new Map<string, Game[]>();
  for (const g of weekMode ? mine : remaining) {
    const key = weekMode ? dayLabel(g) : `Week ${g.week}`;
    groups.set(key, [...(groups.get(key) ?? []), g]);
  }

  const picked = remaining.filter((g) => outcomes[g.id]).length;
  const perspectiveFor = (g: Game) => {
    if (selection.kind === 'team') return selection.teamId;
    if (selection.kind === 'week') return undefined;
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
          <h2 className="text-base font-bold text-white">{weekMode ? `Week ${selection.week} games` : 'Remaining games'}</h2>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${remaining.length ? (picked / remaining.length) * 100 : 100}%` }} />
            </div>
            {picked}/{remaining.length} picked{weekMode && played > 0 && ` · ${played} final`}
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
      {remaining.length === 0 && (
        <p className="card mb-3 p-4 text-sm text-gray-400">
          {weekMode ? 'Every game this week has been played — results are shown below.' : 'No games left — the regular season is complete.'}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {[...groups.entries()].map(([label, games]) => (
          <div key={label} className="card px-4 py-1">
            <div className="flex items-center gap-2 pt-3 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              {label}
              <span className="h-px flex-1 bg-gradient-to-r from-emerald-300/30 to-transparent" />
            </div>
            <div className="divide-y divide-white/5">
              {games.map((g) => (g.isFinal ? <FinalRow key={g.id} game={g} /> : <GameRow key={g.id} game={g} perspective={perspectiveFor(g)} />))}
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
