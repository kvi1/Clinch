import type { RecordsContext } from '../records';
import {
  commonGames, conferenceRecord, divisionRecord, headToHead, netPointsAll, netPointsCommon,
  pointsRankAll, pointsRankConference, resolveBest, strengthOfSchedule, strengthOfVictory,
  type Resolution, type Step,
} from './common';

/**
 * NFL division tiebreaker (same order for two clubs and three-or-more clubs).
 * Net touchdowns is omitted: the data feed does not carry touchdown counts.
 */
export const DIVISION_STEPS: Step[] = [
  headToHead,
  divisionRecord,
  commonGames(0),
  conferenceRecord,
  strengthOfVictory,
  strengthOfSchedule,
  pointsRankConference,
  pointsRankAll,
  netPointsCommon,
  netPointsAll,
];

export const divisionPickBest = (group: string[], ctx: RecordsContext): Resolution =>
  resolveBest(group, ctx, () => DIVISION_STEPS);
