import { addWLT, pct, type RecordsContext, type WLT } from '../records';

/**
 * A tiebreaker step scores every team in the group (higher = better),
 * or returns null when the step does not apply to this group.
 */
export interface Step {
  name: string;
  score: (group: string[], ctx: RecordsContext) => number[] | null;
}

export interface Resolution {
  teamId: string;
  /** Name of the step that separated this team, or undefined if it won outright on record. */
  reason: string;
}

const sumWLT = (rs: WLT[]): WLT => rs.reduce(addWLT, { w: 0, l: 0, t: 0 });

/** Head-to-head win% among all group members. Not applicable if they never met. */
export const headToHead: Step = {
  name: 'Head-to-head',
  score: (group, { records }) => {
    const recs = group.map((id) => sumWLT(group.filter((o) => o !== id).map((o) => records[id].vs[o] ?? { w: 0, l: 0, t: 0 })));
    if (recs.every((r) => r.w + r.l + r.t === 0)) return null;
    return recs.map(pct);
  },
};

/**
 * Wild-card head-to-head for 3+ clubs: only applies if one club beat every other club
 * (that club advances), or one club lost to every other club (that club is eliminated).
 */
export const headToHeadSweep: Step = {
  name: 'Head-to-head sweep',
  score: (group, { records }) => {
    const beatAll = (id: string) =>
      group.every((o) => o === id || ((records[id].vs[o]?.w ?? 0) > 0 && (records[id].vs[o]?.l ?? 0) === 0 && (records[id].vs[o]?.t ?? 0) === 0));
    const lostToAll = (id: string) =>
      group.every((o) => o === id || ((records[id].vs[o]?.l ?? 0) > 0 && (records[id].vs[o]?.w ?? 0) === 0 && (records[id].vs[o]?.t ?? 0) === 0));
    const sweeper = group.find(beatAll);
    if (sweeper) return group.map((id) => (id === sweeper ? 1 : 0));
    if (group.some(lostToAll)) return group.map((id) => (lostToAll(id) ? -1 : 0));
    return null;
  },
};

export const divisionRecord: Step = {
  name: 'Division record',
  score: (group, { records }) => group.map((id) => pct(records[id].div)),
};

export const conferenceRecord: Step = {
  name: 'Conference record',
  score: (group, { records }) => group.map((id) => pct(records[id].conf)),
};

function commonOpponents(group: string[], ctx: RecordsContext): string[] {
  const sets = group.map((id) => new Set(Object.keys(ctx.records[id].vs)));
  return [...sets[0]].filter((o) => !group.includes(o) && sets.every((s) => s.has(o)));
}

const commonRecords = (group: string[], ctx: RecordsContext) => {
  const opps = commonOpponents(group, ctx);
  return group.map((id) => opps.map((o) => ctx.records[id].vs[o]));
};

export const commonGames = (minGames: number): Step => ({
  name: 'Common games',
  score: (group, ctx) => {
    const recs = commonRecords(group, ctx).map(sumWLT);
    if (recs.some((r) => r.w + r.l + r.t < Math.max(1, minGames))) return null;
    return recs.map(pct);
  },
});

/** Combined win% of the teams a club defeated (one entry per win). */
export const strengthOfVictory: Step = {
  name: 'Strength of victory',
  score: (group, { records }) => group.map((id) => pct(sumWLT(records[id].beaten.map((o) => records[o].overall)))),
};

/** Combined win% of every scheduled opponent. */
export const strengthOfSchedule: Step = {
  name: 'Strength of schedule',
  score: (group, { records }) => group.map((id) => pct(sumWLT(records[id].scheduled.map((o) => records[o].overall)))),
};

export const pointsRankConference: Step = {
  name: 'Conference points ranking',
  score: (group, ctx) => group.map((id) => -ctx.pointsRankConf[id]),
};

export const pointsRankAll: Step = {
  name: 'League points ranking',
  score: (group, ctx) => group.map((id) => -ctx.pointsRankAll[id]),
};

export const netPointsCommon: Step = {
  name: 'Net points (common games)',
  score: (group, ctx) => commonRecords(group, ctx).map((rs) => rs.reduce((s, r) => s + r.pf - r.pa, 0)),
};

export const netPointsConference: Step = {
  name: 'Net points (conference games)',
  score: (group, { records }) => group.map((id) => records[id].confPf - records[id].confPa),
};

export const netPointsAll: Step = {
  name: 'Net points (all games)',
  score: (group, { records }) => group.map((id) => records[id].pf - records[id].pa),
};

/** FNV-1a — a stable stand-in for the coin toss so shared links always render identically. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function coinToss(group: string[]): string {
  const key = [...group].sort().join(',');
  return [...group].sort((a, b) => hash(key + a) - hash(key + b))[0];
}

/**
 * Picks the single best team from a group of teams with identical records, applying the steps in order.
 * When a step separates some teams but leaves 2+ tied at the top, the procedure restarts at step 1
 * with the remaining teams, using the step list for that group size (NFL "revert to step 1" rule).
 */
export function resolveBest(group: string[], ctx: RecordsContext, stepsFor: (size: number) => Step[]): Resolution {
  if (group.length === 1) return { teamId: group[0], reason: '' };
  for (const step of stepsFor(group.length)) {
    const scores = step.score(group, ctx);
    if (!scores) continue;
    const max = Math.max(...scores);
    const top = group.filter((_, i) => scores[i] === max);
    if (top.length === 1) return { teamId: top[0], reason: step.name };
    if (top.length < group.length) {
      const inner = resolveBest(top, ctx, stepsFor);
      return { teamId: inner.teamId, reason: inner.reason || step.name };
    }
  }
  return { teamId: coinToss(group), reason: 'Coin toss' };
}

/**
 * Orders teams: by overall win%, then within each set of identical records by repeatedly
 * applying `pickBest` (remaining teams restart the procedure after each pick).
 */
export function orderTeams(
  teamIds: string[],
  ctx: RecordsContext,
  pickBest: (group: string[]) => Resolution,
): Resolution[] {
  const byPct = [...teamIds].sort((a, b) => pct(ctx.records[b].overall) - pct(ctx.records[a].overall));
  const out: Resolution[] = [];
  let i = 0;
  while (i < byPct.length) {
    const p = pct(ctx.records[byPct[i]].overall);
    let j = i;
    while (j < byPct.length && pct(ctx.records[byPct[j]].overall) === p) j++;
    let remaining = byPct.slice(i, j);
    while (remaining.length) {
      const best = remaining.length === 1 ? { teamId: remaining[0], reason: '' } : pickBest(remaining);
      out.push(best);
      remaining = remaining.filter((id) => id !== best.teamId);
    }
    i = j;
  }
  return out;
}
