import { forwardRef } from 'react';
import type { Conference, Game, Outcomes, PlayoffMatchup, Selection } from '../../types/nfl';
import { TEAM_BY_ID } from '../../data/teams';
import type { StandingsResult } from '../../engine/standings';
import type { BracketResult } from '../../engine/bracket';
import { selectedTeamIds, selectionDivisionKey, selectionLabel } from '../../state/selection';
import { TeamBadge } from '../TeamBadge';
import { Trophy } from '../Trophy';
import logo from '../../assets/logo-256.png';
import { fmtRecord } from '../../lib/format';
import { RESULT_STYLE, teamSchedule } from '../../lib/teamSchedule';

export type ShareVariant = 'team' | 'standings' | 'bracket';

interface Props {
  variant: ShareVariant;
  selection: Selection;
  standings: StandingsResult;
  bracket: BracketResult;
  season: number;
  games: Game[];
  outcomes: Outcomes;
}

const FONT = '"Inter Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const BG = 'radial-gradient(900px 500px at 50% -120px, rgba(16,185,129,.22), transparent 70%), linear-gradient(160deg, #0b1220 0%, #070a10 60%)';

function seedStatus(seed: number, conference: Conference, division: string) {
  if (seed === 1) return `No. 1 seed · bye`;
  if (seed <= 4) return `${conference} ${division} champs · No. ${seed} seed`;
  if (seed <= 7) return `Wild card · No. ${seed} seed`;
  return `Out of the playoffs`;
}

function Header({ eyebrow, title, season }: { eyebrow: string; title: string; season: number }) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-8">
      <div className="min-w-0 flex-1">
        <div className="text-2xl font-bold tracking-[0.25em] whitespace-nowrap text-emerald-300 uppercase">My {season} {eyebrow}</div>
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
  return <div className="mt-auto pt-6 text-center text-xl text-white/40">Make your own scenario at clinch · not affiliated with the NFL</div>;
}

/** Single-team card: big projected record + all 17 games. */
function TeamCard({ teamId, standings, season, games, outcomes }: { teamId: string; standings: StandingsResult; season: number; games: Game[]; outcomes: Outcomes }) {
  const team = TEAM_BY_ID[teamId];
  const r = standings.byTeam[teamId];
  const schedule = teamSchedule(games, outcomes, teamId);
  const seed = r.conferenceSeed!;
  const half = Math.ceil(schedule.length / 2);
  const columns = [schedule.slice(0, half), schedule.slice(half)];

  return (
    <div className="flex h-full flex-col p-16" style={{ background: `radial-gradient(1000px 700px at 85% -10%, ${team.primaryColor}, transparent 70%), linear-gradient(160deg, #0b1220 0%, #070a10 70%)` }}>
      <div className="flex items-start justify-between">
        <div className="text-2xl font-bold tracking-[0.25em] whitespace-nowrap text-white/80 uppercase">My {season} projection</div>
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

function StandingsCard({ selection, standings, season }: { selection: Selection; standings: StandingsResult; season: number }) {
  const highlight = selectedTeamIds(selection);
  const divIds = standings.divisions[selectionDivisionKey(selection)];
  const seedColumn = (c: Conference) => (
    <div className="flex-1">
      <div className="mb-3 text-2xl font-bold tracking-widest text-white/50">{c}</div>
      {standings.seeds[c].slice(0, 7).map((id, i) => {
        const r = standings.byTeam[id];
        return (
          <div key={id} className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2 ${highlight.includes(id) ? 'bg-emerald-400/20 ring-1 ring-emerald-300/40' : 'bg-white/[0.06]'}`}>
            <span className="w-8 text-right text-3xl font-black text-emerald-300">{i + 1}</span>
            <TeamBadge teamId={id} size="lg" />
            <span className="flex-1 text-2xl font-semibold text-gray-100">{TEAM_BY_ID[id].name}</span>
            <span className="text-2xl text-gray-300 tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</span>
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="flex h-full flex-col p-14" style={{ background: BG }}>
      <Header eyebrow="projection" title={selectionLabel(selection)} season={season} />
      <div className="mt-10 rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
        {divIds.map((id) => {
          const r = standings.byTeam[id];
          return (
            <div key={id} className="flex items-center gap-4 rounded-xl px-3 py-2">
              <span className="w-8 text-3xl font-black text-white/40">{r.divisionRank}</span>
              <TeamBadge teamId={id} size="lg" />
              <span className="flex-1 text-3xl font-semibold">{TEAM_BY_ID[id].city} {TEAM_BY_ID[id].name}</span>
              <span className="text-4xl font-black tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</span>
              <span className={`w-28 text-right text-2xl font-bold ${r.conferenceSeed! <= 7 ? 'text-emerald-300' : 'text-white/40'}`}>
                {r.conferenceSeed! <= 7 ? `#${r.conferenceSeed} seed` : 'out'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-10 flex gap-8">{seedColumn('AFC')}{seedColumn('NFC')}</div>
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

function BracketCard({ standings, bracket, season }: { standings: StandingsResult; bracket: BracketResult; season: number }) {
  const seedOf = (id?: string) => (id ? standings.byTeam[id].conferenceSeed : undefined);
  const rounds = [['WC', 'Wild Card'], ['DIV', 'Divisional'], ['CONF', 'Championship']] as const;
  const sb = bracket.byId.SB;
  const champ = bracket.champion ? TEAM_BY_ID[bracket.champion] : undefined;
  return (
    <div className="flex h-full flex-col p-14" style={{ background: BG }}>
      <Header eyebrow="playoff bracket" title={champ ? `${champ.name} win it all` : 'Playoff bracket'} season={season} />
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
          ) : <span className="text-4xl text-white/40">Champion TBD</span>}
        </div>
      </div>
      <Footer />
    </div>
  );
}

/** Fixed 1080×1350 (4:5) social graphic, rendered off-screen and captured with html-to-image. */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(props, ref) {
  const { variant, selection, standings, bracket, season, games, outcomes } = props;
  return (
    <div ref={ref} style={{ width: 1080, height: 1350, fontFamily: FONT }} className="overflow-hidden text-white">
      {variant === 'team' && selection.kind === 'team' ? (
        <TeamCard teamId={selection.teamId} standings={standings} season={season} games={games} outcomes={outcomes} />
      ) : variant === 'bracket' ? (
        <BracketCard standings={standings} bracket={bracket} season={season} />
      ) : (
        <StandingsCard selection={selection} standings={standings} season={season} />
      )}
    </div>
  );
});
