import { describe, expect, it } from 'vitest';
import { buildSeason, carryForwardSpreads, easternToIso, mapRow, markTbdWeeks, parseCsv, validate } from './fetch-schedule';
import season from '../src/engine/__fixtures__/nfl-2024.json';
import type { SeasonData } from '../src/types/nfl';

const row = (over: Partial<Record<string, string>> = {}): Record<string, string> => ({
  season: '2026', game_type: 'REG', week: '12', gameday: '2026-11-26', gametime: '16:30',
  away_team: 'PHI', home_team: 'DAL', away_score: '', home_score: '', spread_line: '8.5', ...over,
});

describe('fetch-schedule (nflverse)', () => {
  it('parses CSV with quoted fields, escaped quotes and CRLF', () => {
    const rows = parseCsv('a,b,c\r\n1,"x, y","say ""hi"""\r\n2,,z\n');
    expect(rows).toEqual([
      { a: '1', b: 'x, y', c: 'say "hi"' },
      { a: '2', b: '', c: 'z' },
    ]);
  });

  it('converts US Eastern kickoffs to UTC across daylight saving', () => {
    expect(easternToIso('2026-09-13', '13:00')).toBe('2026-09-13T17:00:00.000Z'); // EDT, UTC-4
    expect(easternToIso('2026-11-26', '16:30')).toBe('2026-11-26T21:30:00.000Z'); // EST, UTC-5
  });

  it('maps an upcoming game, flipping the spread sign (ours: negative = home favored)', () => {
    expect(mapRow(row())).toEqual({
      id: '2026_W12_PHI_DAL', week: 12, kickoffIso: '2026-11-26T21:30:00.000Z',
      homeTeamId: 'DAL', awayTeamId: 'PHI', isFinal: false, actualOutcome: 'UNPLAYED', vegasSpread: -8.5,
    });
    expect(mapRow(row({ spread_line: '-3' })).vegasSpread).toBe(3);
    expect(mapRow(row({ spread_line: '' })).vegasSpread).toBeUndefined();
  });

  it('maps finals (no spread), ties, and the LA → LAR abbreviation', () => {
    const final = mapRow(row({ away_team: 'LA', home_team: 'WAS', away_score: '24', home_score: '17' }));
    expect(final).toMatchObject({ id: '2026_W12_LAR_WAS', isFinal: true, actualOutcome: 'AWAY_WIN', homeScore: 17, awayScore: 24 });
    expect(final.vegasSpread).toBeUndefined();
    expect(mapRow(row({ away_score: '20', home_score: '20' })).actualOutcome).toBe('TIE');
  });

  it('marks a week TBD only when every open game shares one placeholder kickoff', () => {
    const wk = (n: number, time: string, i: number) =>
      mapRow(row({ week: String(n), gameday: '2027-01-10', gametime: time, away_team: `A${i}`, home_team: `H${i}` }));
    const placeholder = Array.from({ length: 16 }, (_, i) => wk(18, '13:00', i));
    const mixed = Array.from({ length: 16 }, (_, i) => wk(17, i < 8 ? '13:00' : '16:25', i));
    markTbdWeeks([...placeholder, ...mixed]);
    expect(placeholder.every((g) => g.timeTbd)).toBe(true);
    expect(mixed.some((g) => g.timeTbd)).toBe(false);
  });

  it('keeps the last known spread when the feed drops it, but not for finals', () => {
    const prev = [mapRow(row()), mapRow(row({ away_team: 'KC', home_team: 'BUF', spread_line: '3' }))];
    const next = [
      mapRow(row({ spread_line: '' })), // line missing → carry -8.5
      mapRow(row({ away_team: 'KC', home_team: 'BUF', away_score: '20', home_score: '17' })), // final → no spread
    ];
    carryForwardSpreads(prev, next);
    expect(next.map((g) => g.vegasSpread)).toEqual([-8.5, undefined]);
  });

  it('builds only the requested regular season, sorted by week then kickoff', () => {
    const games = buildSeason(
      [row({ week: '2' }), row({ week: '1', away_team: 'NYG' }), row({ season: '2025' }), row({ game_type: 'WC' })],
      2026,
    );
    expect(games.map((g) => g.id)).toEqual(['2026_W1_NYG_DAL', '2026_W2_PHI_DAL']);
  });

  it('validates a real season and rejects a broken one', () => {
    const games = (season as SeasonData).games;
    expect(validate(games)).toEqual([]);
    expect(validate(games.slice(1)).length).toBeGreaterThan(0);
  });
});
