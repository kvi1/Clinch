import { describe, expect, it } from 'vitest';
import type { Game } from '../types/nfl';
import { teamSchedule } from './teamSchedule';

const g = (id: string, week: number, away: string, home: string, extra: Partial<Game> = {}): Game => ({
  id, week, kickoffIso: '2026-09-10T00:00:00Z', awayTeamId: away, homeTeamId: home, isFinal: false, actualOutcome: 'UNPLAYED', ...extra,
});

describe('teamSchedule', () => {
  const games = [
    g('b', 2, 'NYG', 'DAL'),
    g('a', 1, 'DAL', 'NYG', { isFinal: true, actualOutcome: 'AWAY_WIN', homeScore: 17, awayScore: 24 }),
    g('c', 3, 'PHI', 'NYG'),
    g('x', 1, 'KC', 'BUF'),
  ];

  it("lists the team's games by week from its own point of view", () => {
    const s = teamSchedule(games, { b: 'AWAY_WIN', c: 'TIE' }, 'NYG');
    expect(s.map((x) => [x.game.week, x.opponent, x.home, x.result, x.predicted, x.score])).toEqual([
      [1, 'DAL', true, 'L', false, '17-24'],
      [2, 'DAL', false, 'W', true, undefined],
      [3, 'PHI', true, 'T', true, undefined],
    ]);
  });

  it('leaves unpicked games empty', () => {
    expect(teamSchedule(games, {}, 'NYG')[1].result).toBeNull();
  });
});
