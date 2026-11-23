import { describe, expect, it } from 'vitest';
import { carryForwardSpreads, mapEvent, validate } from './fetch-schedule';
import season from '../src/engine/__fixtures__/nfl-2024.json';
import type { SeasonData } from '../src/types/nfl';

const event = (completed: boolean, home: string, away: string, hs?: string, as?: string, spread?: number) => ({
  date: '2026-11-27T01:20Z',
  status: { type: { completed, name: completed ? 'STATUS_FINAL' : 'STATUS_SCHEDULED' } },
  competitions: [{
    competitors: [
      { homeAway: 'home' as const, score: hs, team: { abbreviation: home } },
      { homeAway: 'away' as const, score: as, team: { abbreviation: away } },
    ],
    odds: spread == null ? undefined : [{ spread }],
  }],
});

describe('fetch-schedule mapping', () => {
  it('maps a final game and normalizes ESPN abbreviations', () => {
    expect(mapEvent(event(true, 'WSH', 'PHI', '17', '24'), 2026, 12)).toEqual({
      id: '2026_W12_PHI_WAS', week: 12, kickoffIso: '2026-11-27T01:20:00.000Z',
      homeTeamId: 'WAS', awayTeamId: 'PHI', isFinal: true, actualOutcome: 'AWAY_WIN', homeScore: 17, awayScore: 24,
    });
  });

  it('maps an upcoming game with a home-relative spread', () => {
    const g = mapEvent(event(false, 'DAL', 'PHI', '0', '0', -8.5), 2026, 12);
    expect(g).toMatchObject({ isFinal: false, actualOutcome: 'UNPLAYED', vegasSpread: -8.5 });
    expect(g.homeScore).toBeUndefined();
  });

  it('detects ties', () => {
    expect(mapEvent(event(true, 'NYG', 'DAL', '20', '20'), 2026, 3).actualOutcome).toBe('TIE');
  });

  it('validates a real season and rejects a broken one', () => {
    const games = (season as SeasonData).games;
    expect(validate(games)).toEqual([]);
    expect(validate(games.slice(1)).length).toBeGreaterThan(0);
  });

  it('keeps the last known spread when ESPN drops odds, but not for finals', () => {
    const prev = [
      mapEvent(event(false, 'DAL', 'PHI', '0', '0', -8.5), 2026, 12),
      mapEvent(event(false, 'KC', 'BUF', '0', '0', -3), 2026, 12),
      mapEvent(event(false, 'NYG', 'WSH', '0', '0', 2), 2026, 12),
    ];
    const next = [
      mapEvent(event(false, 'DAL', 'PHI', '0', '0'), 2026, 12), // odds missing → carry -8.5
      mapEvent(event(false, 'KC', 'BUF', '0', '0', -2.5), 2026, 12), // line moved → keep new
      mapEvent(event(true, 'NYG', 'WSH', '20', '17'), 2026, 12), // final → no spread
    ];
    carryForwardSpreads(prev, next);
    expect(next.map((g) => g.vegasSpread)).toEqual([-8.5, -2.5, undefined]);
  });
});
