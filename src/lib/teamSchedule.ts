import type { Game, Outcomes } from '../types/nfl';
import { effectiveOutcome } from '../engine/records';

export type TeamResult = 'W' | 'L' | 'T' | null;

export interface TeamGame {
  game: Game;
  opponent: string;
  home: boolean;
  result: TeamResult;
  /** True when the result is the user's prediction rather than a real final. */
  predicted: boolean;
  /** "24-17" from this team's side, for real finals. */
  score?: string;
}

/** A team's full schedule from its own point of view, including real results and the user's picks. */
export function teamSchedule(games: Game[], outcomes: Outcomes, teamId: string): TeamGame[] {
  return games
    .filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
    .sort((a, b) => a.week - b.week)
    .map((game) => {
      const home = game.homeTeamId === teamId;
      const o = effectiveOutcome(game, outcomes);
      const result: TeamResult =
        o === 'UNPLAYED' ? null : o === 'TIE' ? 'T' : (o === 'HOME_WIN') === home ? 'W' : 'L';
      const score =
        game.isFinal && game.homeScore != null && game.awayScore != null
          ? home ? `${game.homeScore}-${game.awayScore}` : `${game.awayScore}-${game.homeScore}`
          : undefined;
      return { game, opponent: home ? game.awayTeamId : game.homeTeamId, home, result, predicted: !game.isFinal && result != null, score };
    });
}

export const RESULT_STYLE: Record<'W' | 'L' | 'T', string> = {
  W: 'bg-emerald-500 text-white',
  L: 'bg-rose-500 text-white',
  T: 'bg-amber-400 text-gray-900',
};
