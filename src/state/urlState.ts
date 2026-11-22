import LZString from 'lz-string';
import type { BracketPicks, Conference, DivisionName, Game, GameOutcome, Outcomes, Selection } from '../types/nfl';

export interface SharedState {
  outcomes: Outcomes;
  selection: Selection;
  bracketPicks: BracketPicks;
}

interface PayloadV1 {
  v: 1;
  /** One char per game in season-file order of sorted ids: . unset, h home win, a away win, t tie. */
  o: string;
  s: string;
  b: BracketPicks;
}

const TO_CHAR: Partial<Record<GameOutcome, string>> = { HOME_WIN: 'h', AWAY_WIN: 'a', TIE: 't' };
const FROM_CHAR: Record<string, GameOutcome> = { h: 'HOME_WIN', a: 'AWAY_WIN', t: 'TIE' };

const sortedIds = (games: Game[]) => games.map((g) => g.id).sort();

export const selectionToString = (s: Selection) =>
  s.kind === 'team' ? `t:${s.teamId}` : `d:${s.conference}:${s.division}`;

export function selectionFromString(str: string): Selection | null {
  const [kind, a, b] = str.split(':');
  if (kind === 't' && a) return { kind: 'team', teamId: a };
  if (kind === 'd' && (a === 'AFC' || a === 'NFC') && ['East', 'North', 'South', 'West'].includes(b))
    return { kind: 'division', conference: a as Conference, division: b as DivisionName };
  return null;
}

export function encodeState(games: Game[], state: SharedState): string {
  const ids = sortedIds(games);
  const o = ids.map((id) => TO_CHAR[state.outcomes[id]] ?? '.').join('').replace(/\.+$/, '');
  const payload: PayloadV1 = { v: 1, o, s: selectionToString(state.selection), b: state.bracketPicks };
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload));
}

export function decodeState(games: Game[], encoded: string): SharedState | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    const p = JSON.parse(json) as PayloadV1;
    if (p.v !== 1 || typeof p.o !== 'string') return null;
    const ids = sortedIds(games);
    const finals = new Set(games.filter((g) => g.isFinal).map((g) => g.id));
    const outcomes: Outcomes = {};
    for (let i = 0; i < Math.min(p.o.length, ids.length); i++) {
      const outcome = FROM_CHAR[p.o[i]];
      if (outcome && !finals.has(ids[i])) outcomes[ids[i]] = outcome;
    }
    const selection = selectionFromString(p.s) ?? DEFAULT_SELECTION;
    const bracketPicks = p.b && typeof p.b === 'object' ? p.b : {};
    return { outcomes, selection, bracketPicks };
  } catch {
    return null;
  }
}

export const DEFAULT_SELECTION: Selection = { kind: 'division', conference: 'NFC', division: 'East' };
