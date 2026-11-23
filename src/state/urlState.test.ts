import { describe, expect, it } from 'vitest';
import type { SeasonData } from '../types/nfl';
import season from '../engine/__fixtures__/nfl-2024.json';
import { decodeState, encodeState, selectionFromString } from './urlState';

const games = (season as SeasonData).games.map((g, i) => (i < 200 ? g : { ...g, isFinal: false, actualOutcome: 'UNPLAYED' as const }));

describe('url state', () => {
  it('round-trips outcomes, selection and bracket picks', () => {
    const open = games.filter((g) => !g.isFinal);
    const state = {
      outcomes: { [open[0].id]: 'HOME_WIN' as const, [open[5].id]: 'TIE' as const, [open[71].id]: 'AWAY_WIN' as const },
      selection: { kind: 'team' as const, teamId: 'NYG' },
      bracketPicks: { AFC_WC_2v7: 'BUF' },
    };
    const encoded = encodeState(games, state);
    expect(encoded).toMatch(/^[A-Za-z0-9+\-$]+$/);
    expect(decodeState(games, encoded)).toEqual(state);
  });

  it('round-trips a week selection and rejects bad weeks', () => {
    const encoded = encodeState(games, { outcomes: {}, selection: { kind: 'week', week: 12 }, bracketPicks: {} });
    expect(decodeState(games, encoded)?.selection).toEqual({ kind: 'week', week: 12 });
    expect(selectionFromString('w:19')).toBeNull();
    expect(selectionFromString('w:abc')).toBeNull();
  });

  it('ignores garbage and picks on games that are now final', () => {
    expect(decodeState(games, 'not-valid')).toBeNull();
    const final = games.find((g) => g.isFinal)!;
    const encoded = encodeState(games, { outcomes: { [final.id]: 'TIE' }, selection: { kind: 'team', teamId: 'KC' }, bracketPicks: {} });
    expect(decodeState(games, encoded)?.outcomes).toEqual({});
  });
});
