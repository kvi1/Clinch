import type { Conference, Selection } from '../types/nfl';
import { TEAM_BY_ID, divisionTeams } from '../data/teams';
import { divisionKey } from '../engine/standings';

/** Teams the selection is "about" (highlighted in tables). A week is about every team, so none are singled out. */
export const selectedTeamIds = (s: Selection): string[] =>
  s.kind === 'team' ? [s.teamId] : s.kind === 'division' ? divisionTeams(s.conference, s.division).map((t) => t.id) : [];

/** Conference to show, or null for a week (both conferences matter). */
export const selectionConference = (s: Selection): Conference | null =>
  s.kind === 'team' ? TEAM_BY_ID[s.teamId].conference : s.kind === 'division' ? s.conference : null;

/** Division table to show, or null for a week. */
export const selectionDivisionKey = (s: Selection): string | null =>
  s.kind === 'team'
    ? divisionKey(TEAM_BY_ID[s.teamId].conference, TEAM_BY_ID[s.teamId].division)
    : s.kind === 'division' ? divisionKey(s.conference, s.division) : null;

export const selectionLabel = (s: Selection): string =>
  s.kind === 'team' ? `${TEAM_BY_ID[s.teamId].city} ${TEAM_BY_ID[s.teamId].name}`
    : s.kind === 'division' ? `${s.conference} ${s.division}` : `Week ${s.week}`;
