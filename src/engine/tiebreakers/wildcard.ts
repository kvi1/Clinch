import type { RecordsContext } from '../records';
import { TEAM_BY_ID } from '../../data/teams';
import {
  commonGames, conferenceRecord, headToHead, headToHeadSweep, netPointsAll, netPointsConference,
  pointsRankAll, pointsRankConference, resolveBest, strengthOfSchedule, strengthOfVictory,
  type Resolution, type Step,
} from './common';

const TAIL: Step[] = [
  conferenceRecord,
  commonGames(4),
  strengthOfVictory,
  strengthOfSchedule,
  pointsRankConference,
  pointsRankAll,
  netPointsConference,
  netPointsAll,
];

/** NFL wild-card tiebreaker. Two clubs: plain head-to-head. Three+: head-to-head only on a sweep. */
export const wildcardSteps = (size: number): Step[] => [size === 2 ? headToHead : headToHeadSweep, ...TAIL];

/**
 * Picks the best club among teams (from different or same divisions) with identical records.
 * First reduces each division's clubs to its highest-ranked one (by division standings), then
 * applies the wild-card steps. Callers re-invoke with the remaining clubs after each pick,
 * which restarts the whole procedure including the division pre-pass.
 */
export function wildcardPickBest(
  group: string[],
  ctx: RecordsContext,
  divisionRank: Record<string, number>,
): Resolution {
  const bestPerDivision = new Map<string, string>();
  for (const id of group) {
    const key = `${TEAM_BY_ID[id].conference}-${TEAM_BY_ID[id].division}`;
    const cur = bestPerDivision.get(key);
    if (!cur || divisionRank[id] < divisionRank[cur]) bestPerDivision.set(key, id);
  }
  const survivors = [...bestPerDivision.values()];
  if (survivors.length === 1) {
    return { teamId: survivors[0], reason: group.length > 1 ? 'Division tiebreaker' : '' };
  }
  return resolveBest(survivors, ctx, wildcardSteps);
}
