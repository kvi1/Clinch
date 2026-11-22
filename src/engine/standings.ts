import type { Conference, DivisionName, Game, Outcomes, TeamStanding } from '../types/nfl';
import { CONFERENCES, DIVISIONS, divisionTeams, TEAMS } from '../data/teams';
import { buildRecords, pct, type RecordsContext } from './records';
import { orderTeams } from './tiebreakers/common';
import { divisionPickBest } from './tiebreakers/division';
import { wildcardPickBest } from './tiebreakers/wildcard';

export interface StandingRow extends TeamStanding {
  /** Tiebreaker that placed this team above an equal-record team, if any. */
  divisionTiebreak?: string;
  seedTiebreak?: string;
}

export interface StandingsResult {
  byTeam: Record<string, StandingRow>;
  /** Team ids ordered 1–4 per division, keyed "AFC-East". */
  divisions: Record<string, string[]>;
  /** Team ids ordered by seed 1–16 per conference. */
  seeds: Record<Conference, string[]>;
  ctx: RecordsContext;
}

export const divisionKey = (c: Conference, d: DivisionName) => `${c}-${d}`;

export function computeStandings(games: Game[], outcomes: Outcomes): StandingsResult {
  const ctx = buildRecords(games, outcomes);
  const byTeam: Record<string, StandingRow> = {};
  for (const t of TEAMS) {
    const r = ctx.records[t.id];
    byTeam[t.id] = {
      teamId: t.id,
      wins: r.overall.w, losses: r.overall.l, ties: r.overall.t, winPct: pct(r.overall),
      divWins: r.div.w, divLosses: r.div.l, divTies: r.div.t,
      confWins: r.conf.w, confLosses: r.conf.l, confTies: r.conf.t,
      divisionRank: 0,
    };
  }

  const divisions: Record<string, string[]> = {};
  const divisionRank: Record<string, number> = {};
  for (const c of CONFERENCES) {
    for (const d of DIVISIONS) {
      const ordered = orderTeams(divisionTeams(c, d).map((t) => t.id), ctx, (g) => divisionPickBest(g, ctx));
      divisions[divisionKey(c, d)] = ordered.map((o) => o.teamId);
      ordered.forEach((o, i) => {
        divisionRank[o.teamId] = i + 1;
        byTeam[o.teamId].divisionRank = i + 1;
        if (o.reason) byTeam[o.teamId].divisionTiebreak = o.reason;
      });
    }
  }

  const seeds = {} as Record<Conference, string[]>;
  for (const c of CONFERENCES) {
    const winners = DIVISIONS.map((d) => divisions[divisionKey(c, d)][0]);
    const rest = DIVISIONS.flatMap((d) => divisions[divisionKey(c, d)].slice(1));
    const pick = (g: string[]) => wildcardPickBest(g, ctx, divisionRank);
    const ordered = [...orderTeams(winners, ctx, pick), ...orderTeams(rest, ctx, pick)];
    seeds[c] = ordered.map((o) => o.teamId);
    ordered.forEach((o, i) => {
      byTeam[o.teamId].conferenceSeed = i + 1;
      if (o.reason) byTeam[o.teamId].seedTiebreak = o.reason;
    });
  }

  return { byTeam, divisions, seeds, ctx };
}
