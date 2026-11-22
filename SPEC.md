## 1. Product Goal & Core Value Proposition
Build a fast, mobile-first, shareable web application where NFL fans can select a single team or an entire 4-team division, click through remaining games (W / L / T), automatically resolve cross-team game conflicts and NFL tiebreakers in real time, and export a high-resolution, social-media-ready graphic (replacing messy phone-screenshot markups).

## 2. Architecture & Hosting Constraints
- **100% Client-Side Computation:** Zero backend database or per-user API calls. The entire 272-game regular season is stored in a static JSON file (public/data/nfl-2026.json) updated via a scheduled script (GitHub Actions / Cloudflare Cron).
- **Frontend Stack:** React 18+, TypeScript, Vite, Tailwind CSS, Zustand (for state management), html-to-image (for client-side PNG export), and lz-string (for stateless URL query-param state sharing).
- **Deployment Target:** Cloudflare Pages (static SPA).
- **Trademark / IP Safety:** Do NOT use official NFL logos. Represent teams using official 2–3 letter abbreviations (NYG, DAL, PHI, WAS), primary & secondary team hex colors, and clean typographic badges/helmets.

## 3. Core Data Models (src/types/nfl.ts)

```typescript
export type Conference = 'AFC' | 'NFC';
export type DivisionName = 'East' | 'North' | 'South' | 'West';
export type GameOutcome = 'HOME_WIN' | 'AWAY_WIN' | 'TIE' | 'UNPLAYED';

export interface Team {
  id: string;              // e.g., "NYG"
  city: string;            // e.g., "New York"
  name: string;            // e.g., "Giants"
  conference: Conference;
  division: DivisionName;
  primaryColor: string;    // Hex code, e.g., "#0B2265"
  secondaryColor: string;  // Hex code, e.g., "#A71930"
}

export interface Game {
  id: string;              // Unique ID, e.g., "2026_W18_PHI_NYG"
  week: number;            // 1 to 18
  kickoffIso: string;      // ISO 8601 timestamp
  homeTeamId: string;
  awayTeamId: string;
  isFinal: boolean;        // True if already played in real life
  actualOutcome: GameOutcome;
  homeScore?: number;
  awayScore?: number;
  vegasSpread?: number;    // Negative means home team favored (e.g., -3.5)
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
  divisionRank: number;    // 1 to 4
  conferenceSeed?: number; // 1 to 16
}

## 4. Playoff Bracket Page (`/bracket`)
- Seeds come from the predicted standings: 7 teams per conference
  (4 division winners seeded 1–4 by record, then 3 wild cards seeded 5–7).
- Wild Card round: 2v7, 3v6, 4v5; seed 1 gets a bye.
- Divisional round RESEEDS: seed 1 plays the lowest remaining seed.
- User clicks a winner in each matchup; later rounds update automatically.
  Changing an earlier pick clears any later picks it affects.
- Bracket picks are part of the shared URL state (lz-string) and the PNG export.
- Super Bowl: AFC champion vs NFC champion, neutral site.

export interface PlayoffMatchup {
  id: string;            // e.g. "AFC_WC_2v7"
  round: 'WC' | 'DIV' | 'CONF' | 'SB';
  conference?: Conference;
  highSeedTeamId?: string;
  lowSeedTeamId?: string;
  winnerTeamId?: string;
}