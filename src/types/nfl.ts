export type Conference = 'AFC' | 'NFC';
export type DivisionName = 'East' | 'North' | 'South' | 'West';
export type GameOutcome = 'HOME_WIN' | 'AWAY_WIN' | 'TIE' | 'UNPLAYED';

export interface Team {
  id: string;
  city: string;
  name: string;
  conference: Conference;
  division: DivisionName;
  primaryColor: string;
  secondaryColor: string;
}

export interface Game {
  id: string;
  week: number;
  kickoffIso: string;
  homeTeamId: string;
  awayTeamId: string;
  isFinal: boolean;
  actualOutcome: GameOutcome;
  homeScore?: number;
  awayScore?: number;
  vegasSpread?: number;
  /** Kickoff time not yet set by the league (date only is meaningful). */
  timeTbd?: boolean;
}

export interface TeamStanding {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  divWins: number;
  divLosses: number;
  divTies: number;
  confWins: number;
  confLosses: number;
  confTies: number;
  divisionRank: number;
  conferenceSeed?: number;
}

export interface PlayoffMatchup {
  id: string;
  round: 'WC' | 'DIV' | 'CONF' | 'SB';
  conference?: Conference;
  highSeedTeamId?: string;
  lowSeedTeamId?: string;
  winnerTeamId?: string;
}

export interface SeasonData {
  season: number;
  updatedAt: string;
  games: Game[];
}

/** User picks for non-final games. */
export type Outcomes = Record<string, GameOutcome>;

export type Selection =
  | { kind: 'team'; teamId: string }
  | { kind: 'division'; conference: Conference; division: DivisionName };

export type BracketPicks = Record<string, string>;
