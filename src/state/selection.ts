import type { Conference, Selection } from '../types/nfl';
import { TEAM_BY_ID, divisionTeams } from '../data/teams';
import { divisionKey } from '../engine/standings';

export const selectedTeamIds = (s: Selection): string[] =>
  s.kind === 'team' ? [s.teamId] : divisionTeams(s.conference, s.division).map((t) => t.id);

export const selectionConference = (s: Selection): Conference =>
  s.kind === 'team' ? TEAM_BY_ID[s.teamId].conference : s.conference;

export const selectionDivisionKey = (s: Selection): string =>
  s.kind === 'team' ? divisionKey(TEAM_BY_ID[s.teamId].conference, TEAM_BY_ID[s.teamId].division) : divisionKey(s.conference, s.division);

export const selectionLabel = (s: Selection): string =>
  s.kind === 'team' ? `${TEAM_BY_ID[s.teamId].city} ${TEAM_BY_ID[s.teamId].name}` : `${s.conference} ${s.division}`;
