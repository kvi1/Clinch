import { create } from 'zustand';
import type { BracketPicks, Game, GameOutcome, Outcomes, SeasonData, Selection } from '../types/nfl';
import { computeStandings, type StandingsResult } from '../engine/standings';
import { buildBracket, type BracketResult } from '../engine/bracket';
import { DEFAULT_SELECTION, decodeState, encodeState } from './urlState';
import { MAX_NAME_LENGTH } from '../lib/format';

interface AppState {
  season: SeasonData | null;
  error: string | null;
  outcomes: Outcomes;
  selection: Selection;
  bracketPicks: BracketPicks;
  /** Name shown on exported images. Per-device (localStorage), never put in share links. */
  displayName: string;
  setDisplayName: (name: string) => void;
  load: () => Promise<void>;
  setOutcome: (gameId: string, outcome: GameOutcome | null) => void;
  setOutcomes: (updates: Outcomes) => void;
  clearOutcomes: (gameIds: string[]) => void;
  setSelection: (selection: Selection) => void;
  setBracketPick: (matchupId: string, teamId: string | null) => void;
  resetBracket: () => void;
}

const SEASON_URL = '/data/nfl-2026.json';
const NAME_KEY = 'clinch.displayName';

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/* Memoized derivations: recomputed only when games or outcomes change. */
let standingsCache: { games: Game[]; outcomes: Outcomes; result: StandingsResult } | null = null;
export function getStandings(games: Game[], outcomes: Outcomes): StandingsResult {
  if (!standingsCache || standingsCache.games !== games || standingsCache.outcomes !== outcomes) {
    standingsCache = { games, outcomes, result: computeStandings(games, outcomes) };
  }
  return standingsCache.result;
}

let bracketCache: { standings: StandingsResult; picks: BracketPicks; result: BracketResult } | null = null;
export function getBracket(standings: StandingsResult, picks: BracketPicks): BracketResult {
  if (!bracketCache || bracketCache.standings !== standings || bracketCache.picks !== picks) {
    bracketCache = { standings, picks, result: buildBracket(standings.seeds, picks) };
  }
  return bracketCache.result;
}

/** After any change, keep only bracket picks that are still valid. */
const cleanPicks = (games: Game[], outcomes: Outcomes, picks: BracketPicks) =>
  buildBracket(getStandings(games, outcomes).seeds, picks).picks;

export const useStore = create<AppState>((set, get) => ({
  season: null,
  error: null,
  outcomes: {},
  selection: DEFAULT_SELECTION,
  bracketPicks: {},
  displayName: readName(),

  setDisplayName: (name) => {
    const clean = name.slice(0, MAX_NAME_LENGTH);
    set({ displayName: clean });
    try {
      if (clean.trim()) localStorage.setItem(NAME_KEY, clean.trim());
      else localStorage.removeItem(NAME_KEY);
    } catch {
      /* storage unavailable (private mode) — name just won't persist */
    }
  },

  load: async () => {
    try {
      const res = await fetch(SEASON_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const season = (await res.json()) as SeasonData;
      if (!Array.isArray(season.games)) throw new Error('malformed season file');
      const param = new URLSearchParams(window.location.search).get('s');
      const shared = param ? decodeState(season.games, param) : null;
      if (shared) {
        set({ season, ...shared, bracketPicks: cleanPicks(season.games, shared.outcomes, shared.bracketPicks) });
      } else {
        set({ season });
      }
    } catch (err) {
      set({ error: `Couldn't load the schedule (${(err as Error).message}).` });
    }
  },

  setOutcomes: (updates) => {
    const { season, outcomes, bracketPicks } = get();
    if (!season) return;
    const finals = new Set(season.games.filter((g) => g.isFinal).map((g) => g.id));
    const next = { ...outcomes };
    for (const [id, o] of Object.entries(updates)) if (!finals.has(id)) next[id] = o;
    set({ outcomes: next, bracketPicks: cleanPicks(season.games, next, bracketPicks) });
  },

  setOutcome: (gameId, outcome) => {
    if (outcome) return get().setOutcomes({ [gameId]: outcome });
    get().clearOutcomes([gameId]);
  },

  clearOutcomes: (gameIds) => {
    const { season, outcomes, bracketPicks } = get();
    if (!season) return;
    const next = { ...outcomes };
    for (const id of gameIds) delete next[id];
    set({ outcomes: next, bracketPicks: cleanPicks(season.games, next, bracketPicks) });
  },

  setSelection: (selection) => set({ selection }),

  setBracketPick: (matchupId, teamId) => {
    const { season, outcomes, bracketPicks } = get();
    if (!season) return;
    const next = { ...bracketPicks };
    if (teamId) next[matchupId] = teamId;
    else delete next[matchupId];
    set({ bracketPicks: cleanPicks(season.games, outcomes, next) });
  },

  resetBracket: () => set({ bracketPicks: {} }),
}));

/** Favorite per the spread (negative = home favored); falls back to the better current record, then home. */
export function favoriteOutcome(game: Game, standings: StandingsResult): GameOutcome {
  if (game.vegasSpread != null && game.vegasSpread !== 0) return game.vegasSpread < 0 ? 'HOME_WIN' : 'AWAY_WIN';
  const home = standings.byTeam[game.homeTeamId].winPct;
  const away = standings.byTeam[game.awayTeamId].winPct;
  return away > home ? 'AWAY_WIN' : 'HOME_WIN';
}

export function useStandings(): StandingsResult | null {
  const season = useStore((s) => s.season);
  const outcomes = useStore((s) => s.outcomes);
  return season ? getStandings(season.games, outcomes) : null;
}

export function useBracket(): BracketResult | null {
  const standings = useStandings();
  const picks = useStore((s) => s.bracketPicks);
  return standings ? getBracket(standings, picks) : null;
}

export function useShareQuery(): string {
  const season = useStore((s) => s.season);
  const outcomes = useStore((s) => s.outcomes);
  const selection = useStore((s) => s.selection);
  const bracketPicks = useStore((s) => s.bracketPicks);
  if (!season) return '';
  return `?s=${encodeState(season.games, { outcomes, selection, bracketPicks })}`;
}
