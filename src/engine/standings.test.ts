import { describe, expect, it } from 'vitest';
import type { Game, GameOutcome, SeasonData } from '../types/nfl';
import { computeStandings } from './standings';
import { buildRecords } from './records';
import { coinToss } from './tiebreakers/common';
import { wildcardPickBest } from './tiebreakers/wildcard';
import season2023 from './__fixtures__/nfl-2023.json';
import season2024 from './__fixtures__/nfl-2024.json';

let n = 0;
/** A final game where `winner` beats `loser` (winner at home), or a tie when outcome is 'TIE'. */
function game(winner: string, loser: string, outcome: GameOutcome = 'HOME_WIN'): Game {
  n++;
  return {
    id: `T_${n}_${loser}_${winner}`, week: 1, kickoffIso: '2026-09-10T00:00:00Z',
    homeTeamId: winner, awayTeamId: loser, isFinal: true, actualOutcome: outcome,
  };
}

describe('division tiebreakers', () => {
  it('two-team tie broken by head-to-head', () => {
    const games = [game('NYG', 'DAL'), game('DAL', 'WAS'), game('PHI', 'NYG')];
    const s = computeStandings(games, {});
    expect(s.divisions['NFC-East']).toEqual(['PHI', 'NYG', 'DAL', 'WAS']);
    expect(s.byTeam.NYG.divisionTiebreak).toBe('Head-to-head');
  });

  it('three-team tie: division record eliminates one, then restarts at 2-team head-to-head', () => {
    // H2H circle: NYG>DAL, DAL>PHI, PHI>NYG. All finish 2-1.
    // NYG and DAL each beat WAS (division); PHI beats ARI (non-division) → PHI worse division record.
    const games = [
      game('NYG', 'DAL'), game('DAL', 'PHI'), game('PHI', 'NYG'),
      game('NYG', 'WAS'), game('DAL', 'WAS'), game('PHI', 'ARI'),
    ];
    const s = computeStandings(games, {});
    expect(s.divisions['NFC-East']).toEqual(['NYG', 'DAL', 'PHI', 'WAS']);
    // NYG beats DAL via H2H after the restart, not via a later step.
    expect(s.byTeam.NYG.divisionTiebreak).toBe('Head-to-head');
    expect(s.byTeam.DAL.divisionTiebreak).toBe('Head-to-head');
  });

  it('user picks count like results and ties count as half a win', () => {
    const games: Game[] = [
      { ...game('NYG', 'DAL'), isFinal: false, actualOutcome: 'UNPLAYED', id: 'P1' },
    ];
    expect(computeStandings(games, { P1: 'AWAY_WIN' }).divisions['NFC-East'][0]).toBe('DAL');
    const tie = computeStandings(games, { P1: 'TIE' });
    expect(tie.byTeam.NYG.winPct).toBe(0.5);
    expect(tie.byTeam.NYG.ties).toBe(1);
  });
});

describe('wild-card tiebreakers', () => {
  const rank = (ids: string[]) => Object.fromEntries(ids.map((id) => [id, 2]));

  it('3+ teams: head-to-head applies only on a sweep', () => {
    const ctx = buildRecords([game('BUF', 'PIT'), game('BUF', 'HOU')], {});
    expect(wildcardPickBest(['PIT', 'HOU', 'BUF'], ctx, rank(['PIT', 'HOU', 'BUF']))).toEqual({
      teamId: 'BUF', reason: 'Head-to-head sweep',
    });
  });

  it('3+ teams without a sweep skip head-to-head and use conference record', () => {
    // BUF beat PIT, HOU beat BUF (no sweep). PIT has the best conference record.
    const games = [game('BUF', 'PIT'), game('HOU', 'BUF'), game('PIT', 'DEN'), game('PIT', 'KC'), game('NYG', 'HOU')];
    const ctx = buildRecords(games, {});
    expect(wildcardPickBest(['BUF', 'PIT', 'HOU'], ctx, rank(['BUF', 'PIT', 'HOU'])).reason).toBe('Conference record');
  });

  it('division pre-pass keeps only the highest-ranked club per division', () => {
    // MIA beat PIT head-to-head, but MIA is ranked below BUF in the AFC East, so it is removed first.
    const ctx = buildRecords([game('MIA', 'PIT'), game('PIT', 'BUF')], {});
    const r = wildcardPickBest(['BUF', 'MIA', 'PIT'], ctx, { BUF: 2, MIA: 3, PIT: 2 });
    expect(r).toEqual({ teamId: 'PIT', reason: 'Head-to-head' });
  });

  it('common games need at least four for wild card', () => {
    // BUF and PIT share 3 common opponents; BUF is 3-0 vs them, PIT 0-3. Not enough games, so the
    // step is skipped and strength of victory decides instead.
    const games = [
      game('BUF', 'DEN'), game('BUF', 'KC'), game('BUF', 'LV'),
      game('DEN', 'PIT'), game('KC', 'PIT'), game('LV', 'PIT'),
    ];
    const ctx = buildRecords(games, {});
    const r = wildcardPickBest(['BUF', 'PIT'], ctx, { BUF: 2, PIT: 2 });
    expect(r.reason).not.toBe('Common games');
  });

  it('coin toss is deterministic regardless of input order', () => {
    expect(coinToss(['KC', 'BUF', 'BAL'])).toBe(coinToss(['BAL', 'KC', 'BUF']));
  });
});

describe('real seasons reproduce official playoff seeds', () => {
  it('2024', () => {
    const s = computeStandings((season2024 as SeasonData).games, {});
    expect(s.seeds.AFC.slice(0, 7)).toEqual(['KC', 'BUF', 'BAL', 'HOU', 'LAC', 'PIT', 'DEN']);
    expect(s.seeds.NFC.slice(0, 7)).toEqual(['DET', 'PHI', 'TB', 'LAR', 'MIN', 'WAS', 'GB']);
  });

  it('2023', () => {
    const s = computeStandings((season2023 as SeasonData).games, {});
    expect(s.seeds.AFC.slice(0, 7)).toEqual(['BAL', 'BUF', 'KC', 'HOU', 'CLE', 'MIA', 'PIT']);
    expect(s.seeds.NFC.slice(0, 7)).toEqual(['SF', 'DAL', 'DET', 'TB', 'PHI', 'LAR', 'GB']);
    expect(s.divisions['AFC-South'][0]).toBe('HOU');
  });

  it('every team gets a unique seed 1–16 and division rank 1–4', () => {
    const s = computeStandings((season2024 as SeasonData).games, {});
    for (const c of ['AFC', 'NFC'] as const) expect(new Set(s.seeds[c]).size).toBe(16);
    for (const ids of Object.values(s.divisions)) expect(ids.map((id) => s.byTeam[id].divisionRank)).toEqual([1, 2, 3, 4]);
  });
});
