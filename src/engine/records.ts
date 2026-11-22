import type { Game, GameOutcome, Outcomes } from '../types/nfl';
import { TEAMS, sameConference, sameDivision } from '../data/teams';

export interface WLT { w: number; l: number; t: number }
export interface VsRecord extends WLT { pf: number; pa: number }

export interface TeamRecord {
  teamId: string;
  overall: WLT;
  div: WLT;
  conf: WLT;
  /** Results per opponent (decided games only). */
  vs: Record<string, VsRecord>;
  /** Every scheduled opponent, one entry per game (for SOS). */
  scheduled: string[];
  /** Opponents defeated, one entry per win (for SOV). */
  beaten: string[];
  /** Points only exist for games final in real life. */
  pf: number;
  pa: number;
  confPf: number;
  confPa: number;
}

export interface RecordsContext {
  records: Record<string, TeamRecord>;
  /** Sum of a team's rank in points scored + points allowed among its conference (lower = better). */
  pointsRankConf: Record<string, number>;
  /** Same, among all 32 teams. */
  pointsRankAll: Record<string, number>;
}

const emptyWLT = (): WLT => ({ w: 0, l: 0, t: 0 });

export const pct = (r: WLT): number => {
  const g = r.w + r.l + r.t;
  return g === 0 ? 0 : (2 * r.w + r.t) / (2 * g);
};

export const addWLT = (a: WLT, b: WLT): WLT => ({ w: a.w + b.w, l: a.l + b.l, t: a.t + b.t });

/** Real result if final, else the user's pick, else unplayed. */
export const effectiveOutcome = (g: Game, outcomes: Outcomes): GameOutcome =>
  g.isFinal ? g.actualOutcome : outcomes[g.id] ?? 'UNPLAYED';

function tally(r: WLT, result: 'w' | 'l' | 't') {
  r[result]++;
}

/** Rank values (1 = best) with ties sharing the best rank. */
function rankBy(teamIds: string[], value: (id: string) => number, higherIsBetter: boolean): Record<string, number> {
  const sorted = [...teamIds].sort((a, b) => (higherIsBetter ? value(b) - value(a) : value(a) - value(b)));
  const out: Record<string, number> = {};
  sorted.forEach((id, i) => {
    const prev = sorted[i - 1];
    out[id] = i > 0 && value(prev) === value(id) ? out[prev] : i + 1;
  });
  return out;
}

export function buildRecords(games: Game[], outcomes: Outcomes): RecordsContext {
  const records: Record<string, TeamRecord> = {};
  for (const t of TEAMS) {
    records[t.id] = {
      teamId: t.id, overall: emptyWLT(), div: emptyWLT(), conf: emptyWLT(), vs: {},
      scheduled: [], beaten: [], pf: 0, pa: 0, confPf: 0, confPa: 0,
    };
  }

  for (const g of games) {
    const home = records[g.homeTeamId];
    const away = records[g.awayTeamId];
    if (!home || !away) continue;
    home.scheduled.push(g.awayTeamId);
    away.scheduled.push(g.homeTeamId);

    const outcome = effectiveOutcome(g, outcomes);
    if (outcome === 'UNPLAYED') continue;

    const homeRes = outcome === 'HOME_WIN' ? 'w' : outcome === 'AWAY_WIN' ? 'l' : 't';
    const awayRes = outcome === 'HOME_WIN' ? 'l' : outcome === 'AWAY_WIN' ? 'w' : 't';
    const div = sameDivision(g.homeTeamId, g.awayTeamId);
    const conf = sameConference(g.homeTeamId, g.awayTeamId);
    const hasScore = g.isFinal && g.homeScore != null && g.awayScore != null;
    const hs = hasScore ? g.homeScore! : 0;
    const as = hasScore ? g.awayScore! : 0;

    for (const [me, opp, res, pf, pa] of [
      [home, g.awayTeamId, homeRes, hs, as],
      [away, g.homeTeamId, awayRes, as, hs],
    ] as const) {
      tally(me.overall, res);
      if (div) tally(me.div, res);
      if (conf) tally(me.conf, res);
      const vs = (me.vs[opp] ??= { ...emptyWLT(), pf: 0, pa: 0 });
      tally(vs, res);
      vs.pf += pf;
      vs.pa += pa;
      me.pf += pf;
      me.pa += pa;
      if (conf) {
        me.confPf += pf;
        me.confPa += pa;
      }
      if (res === 'w') me.beaten.push(opp);
    }
  }

  const pointsRankConf: Record<string, number> = {};
  for (const c of ['AFC', 'NFC'] as const) {
    const ids = TEAMS.filter((t) => t.conference === c).map((t) => t.id);
    const scored = rankBy(ids, (id) => records[id].pf, true);
    const allowed = rankBy(ids, (id) => records[id].pa, false);
    for (const id of ids) pointsRankConf[id] = scored[id] + allowed[id];
  }
  const allIds = TEAMS.map((t) => t.id);
  const scoredAll = rankBy(allIds, (id) => records[id].pf, true);
  const allowedAll = rankBy(allIds, (id) => records[id].pa, false);
  const pointsRankAll = Object.fromEntries(allIds.map((id) => [id, scoredAll[id] + allowedAll[id]]));

  return { records, pointsRankConf, pointsRankAll };
}
