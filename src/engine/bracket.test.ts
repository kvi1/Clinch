import { describe, expect, it } from 'vitest';
import { buildBracket } from './bracket';

const seeds = {
  AFC: ['KC', 'BUF', 'BAL', 'HOU', 'PIT', 'LAC', 'DEN', 'CIN', 'IND', 'MIA', 'NYJ', 'JAX', 'NE', 'LV', 'CLE', 'TEN'],
  NFC: ['DET', 'PHI', 'TB', 'LAR', 'MIN', 'WAS', 'GB', 'SEA', 'ATL', 'ARI', 'DAL', 'SF', 'CHI', 'CAR', 'NO', 'NYG'],
};

describe('bracket', () => {
  it('wild card round is 2v7, 3v6, 4v5 with seed 1 on bye', () => {
    const b = buildBracket(seeds, {});
    expect(b.byId.AFC_WC_2v7).toMatchObject({ highSeedTeamId: 'BUF', lowSeedTeamId: 'DEN' });
    expect(b.byId.AFC_WC_4v5).toMatchObject({ highSeedTeamId: 'HOU', lowSeedTeamId: 'PIT' });
    expect(b.byId.AFC_DIV_1.highSeedTeamId).toBe('KC');
    expect(b.byId.AFC_DIV_1.lowSeedTeamId).toBeUndefined();
    expect(b.matchups).toHaveLength(13);
  });

  it('divisional round reseeds: seed 1 plays the lowest remaining seed', () => {
    const b = buildBracket(seeds, { AFC_WC_2v7: 'DEN', AFC_WC_3v6: 'BAL', AFC_WC_4v5: 'PIT' });
    expect(b.byId.AFC_DIV_1).toMatchObject({ highSeedTeamId: 'KC', lowSeedTeamId: 'DEN' });
    expect(b.byId.AFC_DIV_2).toMatchObject({ highSeedTeamId: 'BAL', lowSeedTeamId: 'PIT' });
  });

  it('changing an earlier pick clears later picks it affects', () => {
    const picks = {
      AFC_WC_2v7: 'BUF', AFC_WC_3v6: 'BAL', AFC_WC_4v5: 'HOU',
      AFC_DIV_1: 'KC', AFC_DIV_2: 'BUF', AFC_CONF: 'BUF',
      NFC_WC_2v7: 'PHI', NFC_WC_3v6: 'TB', NFC_WC_4v5: 'LAR', NFC_DIV_1: 'DET', NFC_DIV_2: 'PHI', NFC_CONF: 'PHI',
      SB: 'BUF',
    };
    const full = buildBracket(seeds, picks);
    expect(full.champion).toBe('BUF');
    expect(Object.keys(full.picks)).toHaveLength(13);

    const changed = buildBracket(seeds, { ...picks, AFC_WC_2v7: 'DEN' });
    // DEN is now lowest seed → plays KC; BUF is gone so DIV_2, CONF and SB picks of BUF are cleared.
    expect(changed.byId.AFC_DIV_1.lowSeedTeamId).toBe('DEN');
    expect(changed.picks.AFC_DIV_1).toBe('KC');
    expect(changed.picks.AFC_DIV_2).toBeUndefined();
    expect(changed.picks.AFC_CONF).toBeUndefined();
    expect(changed.picks.SB).toBeUndefined();
    expect(changed.picks.NFC_CONF).toBe('PHI');
  });
});
