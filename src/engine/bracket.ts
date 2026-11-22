import type { BracketPicks, Conference, PlayoffMatchup } from '../types/nfl';

export interface BracketResult {
  matchups: PlayoffMatchup[];
  byId: Record<string, PlayoffMatchup>;
  /** Picks that are still valid (winner is a participant of its matchup). */
  picks: BracketPicks;
  champion?: string;
}

const WC_PAIRS: [number, number][] = [[2, 7], [3, 6], [4, 5]];

/**
 * Builds the 13-game bracket from conference seeds (index 0 = seed 1) and user picks.
 * The divisional round reseeds: seed 1 hosts the lowest remaining seed.
 * Any pick whose winner is not in its matchup is dropped, which clears dependent later rounds.
 */
export function buildBracket(seeds: Record<Conference, string[]>, picks: BracketPicks): BracketResult {
  const matchups: PlayoffMatchup[] = [];
  const valid: BracketPicks = {};

  const add = (m: PlayoffMatchup): string | undefined => {
    const pick = picks[m.id];
    if (pick && m.highSeedTeamId && m.lowSeedTeamId && (pick === m.highSeedTeamId || pick === m.lowSeedTeamId)) {
      m.winnerTeamId = pick;
      valid[m.id] = pick;
    }
    matchups.push(m);
    return m.winnerTeamId;
  };

  const champs: Partial<Record<Conference, string>> = {};
  for (const conference of ['AFC', 'NFC'] as const) {
    const s = seeds[conference];
    const seedOf = (id: string) => s.indexOf(id) + 1;
    const bySeed = (a: string, b: string) => seedOf(a) - seedOf(b);

    const wcWinners = WC_PAIRS.map(([hi, lo]) =>
      add({ id: `${conference}_WC_${hi}v${lo}`, round: 'WC', conference, highSeedTeamId: s[hi - 1], lowSeedTeamId: s[lo - 1] }),
    );

    let div1: PlayoffMatchup = { id: `${conference}_DIV_1`, round: 'DIV', conference, highSeedTeamId: s[0] };
    let div2: PlayoffMatchup = { id: `${conference}_DIV_2`, round: 'DIV', conference };
    if (wcWinners.every(Boolean)) {
      const [a, b, c] = (wcWinners as string[]).sort(bySeed);
      div1 = { ...div1, lowSeedTeamId: c };
      div2 = { ...div2, highSeedTeamId: a, lowSeedTeamId: b };
    }
    const d1 = add(div1);
    const d2 = add(div2);

    const conf: PlayoffMatchup = { id: `${conference}_CONF`, round: 'CONF', conference };
    if (d1 && d2) [conf.highSeedTeamId, conf.lowSeedTeamId] = [d1, d2].sort(bySeed);
    champs[conference] = add(conf);
  }

  const champion = add({ id: 'SB', round: 'SB', highSeedTeamId: champs.AFC, lowSeedTeamId: champs.NFC });
  return { matchups, byId: Object.fromEntries(matchups.map((m) => [m.id, m])), picks: valid, champion };
}
