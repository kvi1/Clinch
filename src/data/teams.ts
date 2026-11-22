import type { Conference, DivisionName, Team } from '../types/nfl';

const t = (id: string, city: string, name: string, conference: Conference, division: DivisionName, primaryColor: string, secondaryColor: string): Team =>
  ({ id, city, name, conference, division, primaryColor, secondaryColor });

export const TEAMS: Team[] = [
  t('BUF', 'Buffalo', 'Bills', 'AFC', 'East', '#00338D', '#C60C30'),
  t('MIA', 'Miami', 'Dolphins', 'AFC', 'East', '#008E97', '#FC4C02'),
  t('NE', 'New England', 'Patriots', 'AFC', 'East', '#002244', '#C60C30'),
  t('NYJ', 'New York', 'Jets', 'AFC', 'East', '#125740', '#FFFFFF'),
  t('BAL', 'Baltimore', 'Ravens', 'AFC', 'North', '#241773', '#9E7C0C'),
  t('CIN', 'Cincinnati', 'Bengals', 'AFC', 'North', '#FB4F14', '#000000'),
  t('CLE', 'Cleveland', 'Browns', 'AFC', 'North', '#311D00', '#FF3C00'),
  t('PIT', 'Pittsburgh', 'Steelers', 'AFC', 'North', '#101820', '#FFB612'),
  t('HOU', 'Houston', 'Texans', 'AFC', 'South', '#03202F', '#A71930'),
  t('IND', 'Indianapolis', 'Colts', 'AFC', 'South', '#002C5F', '#A2AAAD'),
  t('JAX', 'Jacksonville', 'Jaguars', 'AFC', 'South', '#006778', '#D7A22A'),
  t('TEN', 'Tennessee', 'Titans', 'AFC', 'South', '#0C2340', '#4B92DB'),
  t('DEN', 'Denver', 'Broncos', 'AFC', 'West', '#FB4F14', '#002244'),
  t('KC', 'Kansas City', 'Chiefs', 'AFC', 'West', '#E31837', '#FFB81C'),
  t('LV', 'Las Vegas', 'Raiders', 'AFC', 'West', '#000000', '#A5ACAF'),
  t('LAC', 'Los Angeles', 'Chargers', 'AFC', 'West', '#0080C6', '#FFC20E'),
  t('DAL', 'Dallas', 'Cowboys', 'NFC', 'East', '#003594', '#869397'),
  t('NYG', 'New York', 'Giants', 'NFC', 'East', '#0B2265', '#A71930'),
  t('PHI', 'Philadelphia', 'Eagles', 'NFC', 'East', '#004C54', '#A5ACAF'),
  t('WAS', 'Washington', 'Commanders', 'NFC', 'East', '#5A1414', '#FFB612'),
  t('CHI', 'Chicago', 'Bears', 'NFC', 'North', '#0B162A', '#C83803'),
  t('DET', 'Detroit', 'Lions', 'NFC', 'North', '#0076B6', '#B0B7BC'),
  t('GB', 'Green Bay', 'Packers', 'NFC', 'North', '#203731', '#FFB612'),
  t('MIN', 'Minnesota', 'Vikings', 'NFC', 'North', '#4F2683', '#FFC62F'),
  t('ATL', 'Atlanta', 'Falcons', 'NFC', 'South', '#A71930', '#000000'),
  t('CAR', 'Carolina', 'Panthers', 'NFC', 'South', '#0085CA', '#101820'),
  t('NO', 'New Orleans', 'Saints', 'NFC', 'South', '#D3BC8D', '#101820'),
  t('TB', 'Tampa Bay', 'Buccaneers', 'NFC', 'South', '#D50A0A', '#34302B'),
  t('ARI', 'Arizona', 'Cardinals', 'NFC', 'West', '#97233F', '#FFB612'),
  t('LAR', 'Los Angeles', 'Rams', 'NFC', 'West', '#003594', '#FFA300'),
  t('SF', 'San Francisco', '49ers', 'NFC', 'West', '#AA0000', '#B3995D'),
  t('SEA', 'Seattle', 'Seahawks', 'NFC', 'West', '#002244', '#69BE28'),
];

export const TEAM_BY_ID: Record<string, Team> = Object.fromEntries(TEAMS.map((x) => [x.id, x]));
export const TEAM_IDS = new Set(TEAMS.map((x) => x.id));
export const CONFERENCES: Conference[] = ['AFC', 'NFC'];
export const DIVISIONS: DivisionName[] = ['East', 'North', 'South', 'West'];

export const divisionTeams = (conference: Conference, division: DivisionName) =>
  TEAMS.filter((x) => x.conference === conference && x.division === division);
export const conferenceTeams = (conference: Conference) => TEAMS.filter((x) => x.conference === conference);
export const sameDivision = (a: string, b: string) =>
  TEAM_BY_ID[a].conference === TEAM_BY_ID[b].conference && TEAM_BY_ID[a].division === TEAM_BY_ID[b].division;
export const sameConference = (a: string, b: string) => TEAM_BY_ID[a].conference === TEAM_BY_ID[b].conference;
