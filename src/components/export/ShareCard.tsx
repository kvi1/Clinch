import { createContext, forwardRef, useContext } from 'react';
import type { Conference, Game, Outcomes, PlayoffMatchup, Selection } from '../../types/nfl';
import { TEAM_BY_ID } from '../../data/teams';
import type { StandingsResult } from '../../engine/standings';
import type { BracketResult } from '../../engine/bracket';
import { selectedTeamIds, selectionDivisionKey, selectionLabel } from '../../state/selection';
import { TeamBadge } from '../TeamBadge';
import { Trophy } from '../Trophy';
import logo from '../../assets/logo-256.png';
import { MAX_NAME_LENGTH, fmtRecord, possessive } from '../../lib/format';
import { RESULT_STYLE, teamSchedule } from '../../lib/teamSchedule';
import { gamesInWeek, weekDateRange } from '../../lib/season';

export type ShareVariant = 'team' | 'standings' | 'bracket' | 'week';
export type DivisionScope = 'remaining' | 'season';

/** Optional name for the "<Name>'s Predictions" label, provided once by ShareCard. */
const NameContext = createContext('');

interface Props {
  variant: ShareVariant;
  selection: Selection;
  standings: StandingsResult;
  bracket: BracketResult;
  games: Game[];
  outcomes: Outcomes;
  /** Shown as "<Name>'s 2026 projection"; blank → "My". */
  name?: string;
  /** Division card only: unplayed games vs the full season. */
  divisionScope?: DivisionScope;
}

const FONT = '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const BG = 'radial-gradient(900px 500px at 50% -120px, rgba(16,185,129,.22), transparent 70%), linear-gradient(160deg, #0b1220 0%, #070a10 60%)';

function seedStatus(seed: number, conference: Conference, division: string) {
  if (seed === 1) return `No. 1 seed · bye`;
  if (seed <= 4) return `${conference} ${division} champs · No. ${seed} seed`;
  if (seed <= 7) return `Wild card · No. ${seed} seed`;
  return `Out of the playoffs`;
}

function Header({ eyebrow, title }: { eyebrow: string; title: string }) {
  const name = useContext(NameContext);
  return (
    <div className="flex shrink-0 items-start justify-between gap-8">
      <div className="min-w-0 flex-1">
        <div className="text-2xl leading-snug font-bold tracking-[0.2em] break-words text-emerald-300 uppercase">{name ? `${possessive(name)} ${eyebrow}` : eyebrow}</div>
        <div className={`mt-3 leading-[1.05] font-black tracking-tight ${title.length > 16 ? 'text-6xl' : 'text-7xl'}`}>{title}</div>
      </div>
      <Wordmark />
    </div>
  );
}

function Wordmark() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <img src={logo} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl" />
      <span className="-skew-x-12 bg-emerald-400 px-3 py-1">
        <span className="block skew-x-12 font-display text-4xl leading-none font-black text-gray-950 italic">CLINCH</span>
      </span>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-auto flex shrink-0 items-end justify-between gap-6 pt-6">
      <div className="text-2xl whitespace-nowrap text-white/60">
        Make yours at <span className="font-display text-3xl font-black tracking-wide text-emerald-300 italic">CLINCHAPP.IO</span>
      </div>
      <div className="min-w-0 text-right">
        <div className="text-base whitespace-nowrap text-white/30">Not affiliated with the NFL</div>
      </div>
    </div>
  );
}

/** Single-team card: big projected record + all 17 games. */
function TeamCard({ teamId, standings, games, outcomes }: { teamId: string; standings: StandingsResult; games: Game[]; outcomes: Outcomes }) {
  const teamName = useContext(NameContext);
  const team = TEAM_BY_ID[teamId];
  const r = standings.byTeam[teamId];
  const schedule = teamSchedule(games, outcomes, teamId);
  const seed = r.conferenceSeed!;
  const half = Math.ceil(schedule.length / 2);
  const columns = [schedule.slice(0, half), schedule.slice(half)];

  return (
    <div className="flex h-full flex-col p-16" style={{ background: `radial-gradient(1000px 700px at 85% -10%, ${team.primaryColor}, transparent 70%), linear-gradient(160deg, #0b1220 0%, #070a10 70%)` }}>
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0 flex-1 text-2xl leading-snug font-bold tracking-[0.2em] break-words text-white/80 uppercase">{teamName ? `${possessive(teamName)} Predictions` : 'Predictions'}</div>
        <Wordmark />
      </div>
      <div className="mt-8 flex items-center gap-8">
        <div className="grid h-40 w-40 shrink-0 place-items-center rounded-3xl text-6xl font-black text-white shadow-2xl"
          style={{ backgroundColor: team.primaryColor, boxShadow: `inset 0 -10px 0 ${team.secondaryColor}, 0 20px 50px rgba(0,0,0,.5)` }}>
          {team.id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-3xl font-semibold text-white/70">{team.city}</div>
          <div className="text-8xl leading-none font-black tracking-tight">{team.name}</div>
        </div>
      </div>
      <div className="mt-10 flex items-center gap-10 rounded-3xl bg-black/30 px-10 py-7 ring-1 ring-white/10">
        <div className="shrink-0">
          <div className="text-xl font-bold tracking-[0.25em] whitespace-nowrap text-white/50 uppercase">Projected record</div>
          <div className="mt-1 text-8xl leading-none font-black whitespace-nowrap">{fmtRecord(r.wins, r.losses, r.ties)}</div>
        </div>
        <div className="h-24 w-px bg-white/15" />
        <div className="min-w-0">
          <div className={`text-4xl leading-tight font-black ${seed <= 7 ? 'text-emerald-300' : 'text-rose-300'}`}>{seedStatus(seed, team.conference, team.division)}</div>
          <div className="mt-2 text-2xl whitespace-nowrap text-white/60">Div {fmtRecord(r.divWins, r.divLosses, r.divTies)} · Conf {fmtRecord(r.confWins, r.confLosses, r.confTies)}</div>
        </div>
      </div>
      <div className="mt-8 flex gap-6">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-1 flex-col gap-2">
            {col.map((g) => (
              <div key={g.game.id} className="flex h-[54px] items-center gap-3 rounded-xl bg-white/[0.06] px-4">
                <span className="w-16 text-lg font-bold text-white/40">WK {g.game.week}</span>
                <span className="w-7 text-lg text-white/50">{g.home ? 'vs' : '@'}</span>
                <TeamBadge teamId={g.opponent} size="sm" />
                <span className="flex-1 truncate text-xl font-semibold text-white/90">{TEAM_BY_ID[g.opponent].name}</span>
                <span className="text-base whitespace-nowrap text-white/45 tabular-nums">{g.score ?? (g.predicted ? 'pick' : '')}</span>
                <span className={`grid h-9 w-9 place-items-center rounded-lg text-lg font-black ${g.result ? RESULT_STYLE[g.result] : 'bg-white/10 text-white/30'} ${g.predicted ? 'ring-2 ring-white/70 ring-inset' : ''}`}>
                  {g.result ?? '–'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

/**
 * Division card: each division team's games, then a compact playoff line.
 * "remaining" shows only unplayed games (the predictions); "season" shows all 17.
 */
function StandingsCard({ selection, standings, games, outcomes, scope }: {
  selection: Selection; standings: StandingsResult; games: Game[]; outcomes: Outcomes;
  scope: DivisionScope;
}) {
  const highlight = selectedTeamIds(selection);
  // Only rendered for team/division selections, which always have a division.
  const divIds = standings.divisions[selectionDivisionKey(selection)!];
  const conference = TEAM_BY_ID[divIds[0]].conference;

  const full = Object.fromEntries(divIds.map((id) => [id, teamSchedule(games, outcomes, id)]));
  const remaining = Object.fromEntries(divIds.map((id) => [id, full[id].filter((g) => !g.game.isFinal)]));
  const anyLeft = divIds.some((id) => remaining[id].length > 0);
  const remainingMode = scope === 'remaining' && anyLeft; // season over → fall back to the full season
  const lists = remainingMode ? remaining : full;
  const cols = Math.max(...divIds.map((id) => lists[id].length));
  const weeks = divIds.flatMap((id) => remaining[id].map((g) => g.game.week));
  const weekSpan = weeks.length ? `Weeks ${Math.min(...weeks)}–${Math.max(...weeks)}` : '';

  return (
    <div className="flex h-full flex-col p-14" style={{ background: BG }}>
      <Header eyebrow="Predictions" title={selectionLabel(selection)} />

      <div className="mt-8 flex shrink-0 flex-col gap-5">
        {divIds.map((id) => {
          const r = standings.byTeam[id];
          const team = TEAM_BY_ID[id];
          const seed = r.conferenceSeed!;
          return (
            <div key={id} className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10"
              style={{ background: `linear-gradient(90deg, ${team.primaryColor}55, rgba(255,255,255,.04) 45%)` }}>
              <div className="mb-3 flex items-center gap-4">
                <span className="w-7 text-3xl font-black text-white/40">{r.divisionRank}</span>
                <TeamBadge teamId={id} size="md" />
                <span className="flex-1 truncate text-3xl font-bold">{team.city} {team.name}</span>
                <span className="shrink-0 text-4xl font-black whitespace-nowrap tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</span>
                <span className={`w-40 shrink-0 text-right whitespace-nowrap text-2xl font-bold ${seed <= 7 ? 'text-emerald-300' : 'text-white/40'}`}>
                  {seed === 1 ? 'No. 1 · bye' : seed <= 7 ? `No. ${seed} seed` : 'Out'}
                </span>
              </div>
              <div className={`grid ${remainingMode ? 'gap-2' : 'gap-1'}`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
                {lists[id].map((g) => (
                  <div key={g.game.id}
                    className={`flex flex-col items-center justify-center leading-none ${remainingMode ? 'h-[96px] rounded-lg' : 'h-[78px] rounded-md'} ${
                      g.result ? RESULT_STYLE[g.result] : 'bg-white/10 text-white/50'
                    } ${g.predicted ? 'ring-2 ring-white/80 ring-inset' : ''}`}>
                    {remainingMode && <span className="mb-1.5 text-[13px] font-bold tracking-wider opacity-70">WK {g.game.week}</span>}
                    <span className={`${remainingMode ? 'text-[15px]' : 'text-[12px]'} font-semibold opacity-70`}>{g.home ? 'vs' : '@'}</span>
                    <span className={`mt-1 font-black ${remainingMode ? 'text-[22px]' : 'text-[16px]'}`}>{g.opponent}</span>
                    <span className={`mt-1.5 font-black opacity-80 ${remainingMode ? 'text-[17px]' : 'text-[15px]'}`}>{g.result ?? '–'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex shrink-0 items-center gap-8 text-lg whitespace-nowrap text-white/50">
        {remainingMode ? (
          <>
            <span className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-emerald-500 ring-2 ring-white/80 ring-inset" /> Your pick</span>
            <span className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-white/10" /> Not picked</span>
            <span className="ml-auto">Remaining games · {weekSpan}</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-emerald-500" /> Played</span>
            <span className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded ring-2 ring-white/80 ring-inset" /> Your pick</span>
            <span className="ml-auto">Full season · Weeks 1–18</span>
          </>
        )}
      </div>

      <div className="mt-6 flex shrink-0 items-center gap-3 rounded-2xl bg-white/[0.05] px-5 py-4 ring-1 ring-white/10">
        <span className="mr-2 text-xl font-bold tracking-[0.2em] whitespace-nowrap text-white/50">{conference} PLAYOFFS</span>
        {standings.seeds[conference].slice(0, 7).map((id, i) => (
          <span key={id} className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 ${highlight.includes(id) ? 'bg-emerald-400/20 ring-1 ring-emerald-300/50' : ''}`}>
            <span className="text-xl font-black text-emerald-300">{i + 1}</span>
            <TeamBadge teamId={id} size="sm" />
          </span>
        ))}
      </div>
      <Footer />
    </div>
  );
}

/** Week card: every game of the week, your pick (or the real result) highlighted. */
function WeekCard({ week, games, outcomes }: { week: number; games: Game[]; outcomes: Outcomes }) {
  const slate = gamesInWeek(games, week);
  const open = slate.filter((g) => !g.isFinal);
  const picked = open.filter((g) => outcomes[g.id]).length;
  const finals = slate.length - open.length;
  const half = Math.ceil(slate.length / 2);
  const columns = [slate.slice(0, half), slate.slice(half)];
  const compact = slate.length > 14;

  const side = (g: Game, id: string, score: number | undefined, isHome: boolean) => {
    const outcome = g.isFinal ? g.actualOutcome : outcomes[g.id];
    const won = outcome === (isHome ? 'HOME_WIN' : 'AWAY_WIN');
    const lost = outcome === (isHome ? 'AWAY_WIN' : 'HOME_WIN');
    const team = TEAM_BY_ID[id];
    return (
      <div className={`flex items-center gap-3 px-4 ${compact ? 'h-11' : 'h-12'} ${lost ? 'opacity-35' : ''}`}
        style={won ? { background: `linear-gradient(90deg, ${team.primaryColor}dd, ${team.primaryColor}33 75%, transparent)` } : undefined}>
        <TeamBadge teamId={id} size="sm" />
        <span className={`flex-1 truncate text-2xl ${won ? 'font-black text-white' : 'text-gray-200'}`}>{team.name}</span>
        {g.isFinal ? <span className={`text-2xl tabular-nums ${won ? 'font-black' : 'text-white/60'}`}>{score}</span>
          : won ? <span className="text-xl font-black text-white">✓</span> : null}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col p-14" style={{ background: BG }}>
      <Header eyebrow="Predictions" title={`Week ${week}`} />
      <div className="mt-3 shrink-0 text-2xl text-white/55">
        {weekDateRange(slate)} · {picked}/{open.length} picked{finals ? ` · ${finals} already final` : ''}
      </div>
      <div className="mt-6 flex shrink-0 gap-10">
        {columns.map((col, ci) => (
          <div key={ci} className={`flex flex-1 flex-col ${compact ? 'gap-7' : 'gap-9'}`}>
            {col.map((g) => {
              const tie = (g.isFinal ? g.actualOutcome : outcomes[g.id]) === 'TIE';
              return (
                <div key={g.id} className="relative overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/20">
                  {side(g, g.awayTeamId, g.awayScore, false)}
                  <div className="h-px bg-white/[0.07]" />
                  {side(g, g.homeTeamId, g.homeScore, true)}
                  {(g.isFinal || tie) && (
                    <span className={`absolute top-1/2 right-20 -translate-y-1/2 rounded px-2 py-0.5 text-sm font-bold tracking-wider ${tie ? 'bg-amber-400 text-gray-900' : 'bg-gray-900 text-amber-300 ring-1 ring-amber-300/40'}`}>
                      {tie ? 'TIE' : 'FINAL'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}

function MatchupBox({ m, seedOf }: { m: PlayoffMatchup; seedOf: (id?: string) => number | undefined }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white/[0.06] ring-1 ring-white/10">
      {[m.highSeedTeamId, m.lowSeedTeamId].map((id, i) => {
        const won = id && m.winnerTeamId === id;
        const lost = m.winnerTeamId && id && !won;
        const team = id ? TEAM_BY_ID[id] : undefined;
        return (
          <div key={i} className={`flex h-12 items-center gap-2 px-3 ${i ? 'border-t border-white/5' : ''} ${lost ? 'opacity-35' : ''}`}
            style={won && team ? { background: `linear-gradient(90deg, ${team.primaryColor}cc, transparent)` } : undefined}>
            {m.round !== 'SB' && <span className="w-5 text-right text-lg text-white/50">{seedOf(id) ?? ''}</span>}
            {id ? <TeamBadge teamId={id} size="sm" /> : <span className="inline-block h-8 w-10 rounded-md bg-white/10" />}
            <span className={`flex-1 truncate text-xl ${won ? 'font-black text-white' : 'text-gray-200'}`}>{team ? team.name : 'TBD'}</span>
          </div>
        );
      })}
    </div>
  );
}

function BracketCard({ standings, bracket }: { standings: StandingsResult; bracket: BracketResult }) {
  const seedOf = (id?: string) => (id ? standings.byTeam[id].conferenceSeed : undefined);
  const rounds = [['WC', 'Wild Card'], ['DIV', 'Divisional'], ['CONF', 'Championship']] as const;
  const sb = bracket.byId.SB;
  const champ = bracket.champion ? TEAM_BY_ID[bracket.champion] : undefined;
  return (
    <div className="flex h-full flex-col p-14" style={{ background: BG }}>
      <Header eyebrow="Predictions" title={champ ? `${champ.name} win it all` : 'Playoff bracket'} />
      <div className="mt-8 flex shrink-0 gap-8">
        {(['AFC', 'NFC'] as const).map((c) => (
          <div key={c} className="flex-1">
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl font-black tracking-widest">{c}</span>
              <span className="h-px flex-1 bg-white/15" />
              <span className="text-lg text-white/50">bye:</span>
              <TeamBadge teamId={standings.seeds[c][0]} size="sm" />
            </div>
            {rounds.map(([round, label]) => (
              <div key={round} className="mb-4">
                <div className="mb-1.5 text-base font-bold tracking-[0.2em] text-emerald-300 uppercase">{label}</div>
                <div className="flex flex-col gap-2">
                  {bracket.matchups.filter((m) => m.conference === c && m.round === round).map((m) => <MatchupBox key={m.id} m={m} seedOf={seedOf} />)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-8 rounded-3xl p-6 ring-1 ring-amber-300/30"
        style={{ background: champ ? `linear-gradient(110deg, ${champ.primaryColor}, rgba(251,191,36,.15))` : 'rgba(255,255,255,.05)' }}>
        <div className="shrink-0">
          <div className="text-xl font-bold tracking-[0.25em] whitespace-nowrap text-amber-300 uppercase">Super Bowl</div>
          <div className="mt-2 flex items-center gap-3 text-2xl text-white/70">
            {sb.highSeedTeamId ? <TeamBadge teamId={sb.highSeedTeamId} size="sm" /> : 'TBD'}
            <span>vs</span>
            {sb.lowSeedTeamId ? <TeamBadge teamId={sb.lowSeedTeamId} size="sm" /> : 'TBD'}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-5">
          {champ ? (
            <>
              <Trophy />
              <span className="text-4xl leading-tight font-black">{champ.city} {champ.name}</span>
            </>
          ) : <span className="text-4xl whitespace-nowrap text-white/40">Champion TBD</span>}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/** Fixed 1080×1350 (4:5) social graphic, rendered off-screen and captured with html-to-image. */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(props, ref) {
  const { variant, selection, standings, bracket, games, outcomes, name, divisionScope = 'remaining' } = props;
  return (
    <div ref={ref} style={{ width: 1080, height: 1350, fontFamily: FONT }} className="overflow-hidden text-white">
      <NameContext.Provider value={(name ?? '').trim().slice(0, MAX_NAME_LENGTH)}>
        {variant === 'week' && selection.kind === 'week' ? (
          <WeekCard week={selection.week} games={games} outcomes={outcomes} />
        ) : variant === 'team' && selection.kind === 'team' ? (
          <TeamCard teamId={selection.teamId} standings={standings} games={games} outcomes={outcomes} />
        ) : variant === 'bracket' ? (
          <BracketCard standings={standings} bracket={bracket} />
        ) : (
          <StandingsCard selection={selection} standings={standings} games={games} outcomes={outcomes} scope={divisionScope} />
        )}
      </NameContext.Provider>
    </div>
  );
});
