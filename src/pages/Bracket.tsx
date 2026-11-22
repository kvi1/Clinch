import { useState } from 'react';
import type { Conference, PlayoffMatchup } from '../types/nfl';
import { TEAM_BY_ID } from '../data/teams';
import { useBracket, useStandings, useStore } from '../state/store';
import { fmtRecord } from '../lib/format';
import { TeamBadge } from '../components/TeamBadge';
import { Trophy } from '../components/Trophy';
import { ActionBar } from '../components/ActionBar';

type Round = 'WC' | 'DIV' | 'CONF';
const ROUNDS: [Round, string][] = [['WC', 'Wild Card'], ['DIV', 'Divisional'], ['CONF', 'Championship']];

function TeamRow({ m, id, ready }: { m: PlayoffMatchup; id?: string; ready: boolean }) {
  const setPick = useStore((s) => s.setBracketPick);
  const standings = useStandings()!;
  const won = Boolean(id && m.winnerTeamId === id);
  const lost = Boolean(m.winnerTeamId && id && !won);
  const team = id ? TEAM_BY_ID[id] : undefined;
  const r = id ? standings.byTeam[id] : undefined;

  if (!team || !r) {
    return (
      <div className="flex h-12 items-center gap-2 px-3 text-sm text-gray-500">
        <span className="h-6 w-8 rounded-md border border-dashed border-white/15" />
        TBD
      </div>
    );
  }
  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={won}
      onClick={() => setPick(m.id, won ? null : team.id)}
      className={`group relative flex h-12 w-full items-center gap-2 px-3 text-left xl:gap-1.5 xl:px-2 transition-all ${
        lost ? 'opacity-35 hover:opacity-70' : ''
      } ${won ? '' : 'hover:bg-white/[0.06]'}`}
      style={won ? { background: `linear-gradient(90deg, ${team.primaryColor} 0%, ${team.primaryColor}55 70%, transparent 100%)` } : undefined}
    >
      {m.round !== 'SB' && <span className="w-4 text-right text-xs font-bold text-white/45 tabular-nums">{r.conferenceSeed}</span>}
      <TeamBadge teamId={team.id} size="xs" />
      <span className={`min-w-0 flex-1 truncate text-sm ${won ? 'font-bold text-white' : 'text-gray-200'}`}>{team.name}</span>
      <span className="text-[11px] text-white/40 tabular-nums xl:hidden">{fmtRecord(r.wins, r.losses, r.ties)}</span>
      {won && (
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white xl:hidden" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
          <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function MatchupCard({ m }: { m: PlayoffMatchup }) {
  const ready = Boolean(m.highSeedTeamId && m.lowSeedTeamId);
  const awaiting = ready && !m.winnerTeamId;
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gray-900/60 shadow-lg shadow-black/30 backdrop-blur ${
      awaiting ? 'border-emerald-400/40' : 'border-white/[0.08]'
    }`}>
      {awaiting && <span className="absolute top-2 right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-label="Pick a winner" />}
      <TeamRow m={m} id={m.highSeedTeamId} ready={ready} />
      <div className="h-px bg-white/[0.06]" />
      <TeamRow m={m} id={m.lowSeedTeamId} ready={ready} />
    </div>
  );
}

function ByeCard({ teamId }: { teamId: string }) {
  const team = TEAM_BY_ID[teamId];
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] px-3 py-2 text-xs text-gray-300"
      style={{ background: `linear-gradient(90deg, ${team.primaryColor}55, transparent)` }}>
      <span className="font-bold text-white/50">1</span>
      <TeamBadge teamId={teamId} size="xs" />
      <span className="flex-1 truncate font-semibold">{team.name}</span>
      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">Bye</span>
    </div>
  );
}

function RoundColumn({ conference, round, label }: { conference: Conference; round: Round; label: string }) {
  const bracket = useBracket()!;
  const standings = useStandings()!;
  const matchups = bracket.matchups.filter((m) => m.conference === conference && m.round === round);
  return (
    <div className="flex w-[15.5rem] shrink-0 snap-start flex-col xl:w-auto xl:shrink">
      <div className="mb-3 text-center text-[11px] font-bold tracking-[0.2em] text-gray-400 uppercase">{label}</div>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {round === 'WC' && <ByeCard teamId={standings.seeds[conference][0]} />}
        {matchups.map((m) => <MatchupCard key={m.id} m={m} />)}
      </div>
    </div>
  );
}

function SuperBowl() {
  const bracket = useBracket()!;
  const champ = bracket.champion ? TEAM_BY_ID[bracket.champion] : undefined;
  return (
    <div className="flex flex-col justify-center gap-4">
      <div className="text-center text-[11px] font-bold tracking-[0.2em] text-amber-300 uppercase">Super Bowl</div>
      <div className="flex justify-between px-1 text-[10px] font-bold tracking-widest text-gray-500">
        <span>AFC</span><span>NFC</span>
      </div>
      <MatchupCard m={bracket.byId.SB} />
      <div
        className="relative overflow-hidden rounded-2xl border border-amber-300/30 p-4 text-center"
        style={{ background: champ ? `radial-gradient(circle at 50% 0%, ${champ.primaryColor}, rgba(7,10,16,.9) 80%)` : 'rgba(255,255,255,.03)' }}
      >
        <Trophy className={`mx-auto h-10 w-10 ${champ ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,.6)]' : 'text-white/20'}`} />
        {champ ? (
          <>
            <div className="mt-2 text-[10px] font-bold tracking-[0.25em] text-amber-200 uppercase">Champions</div>
            <div className="text-lg font-black text-white">{champ.city} {champ.name}</div>
          </>
        ) : (
          <div className="mt-2 text-xs text-gray-400">Pick both conference champions, then the winner.</div>
        )}
      </div>
    </div>
  );
}

export function Bracket() {
  const bracket = useBracket()!;
  const resetBracket = useStore((s) => s.resetBracket);
  const [tab, setTab] = useState<Conference | 'SB'>('AFC');
  const picked = Object.keys(bracket.picks).length;

  const seg = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-white text-gray-950 shadow' : 'text-gray-300 hover:text-white'}`;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Playoff bracket</h1>
          <p className="text-sm text-gray-400">Seeded from your projected standings. Tap a team to advance it — the divisional round reseeds.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${(picked / 13) * 100}%` }} />
            </div>
            {picked}/13
          </div>
          <button type="button" onClick={resetBracket} disabled={!picked} className="chip disabled:opacity-40">Reset</button>
        </div>
      </div>

      {/* Below 1280px: one conference at a time, rounds side by side (scrolling on phones). */}
      <div className="xl:hidden">
        <div className="mb-4 flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10" role="tablist">
          {(['AFC', 'NFC', 'SB'] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={seg(tab === t)} onClick={() => setTab(t)}>
              {t === 'SB' ? 'Super Bowl' : t}
            </button>
          ))}
        </div>
        {tab === 'SB' ? (
          <div className="mx-auto max-w-sm"><SuperBowl /></div>
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2">
            {ROUNDS.map(([round, label]) => <RoundColumn key={round} conference={tab} round={round} label={label} />)}
            <button type="button" onClick={() => setTab(tab === 'AFC' ? 'NFC' : 'SB')}
              className="flex w-32 shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-white/15 text-xs font-semibold text-gray-400 hover:text-white">
              Next: {tab === 'AFC' ? 'NFC' : 'Super Bowl'} →
            </button>
          </div>
        )}
      </div>

      {/* Desktop: AFC → Super Bowl ← NFC. */}
      <div className="hidden min-h-[34rem] grid-cols-[repeat(3,minmax(0,1fr))_minmax(13rem,1fr)_repeat(3,minmax(0,1fr))] gap-3 xl:grid">
        {ROUNDS.map(([round, label]) => <RoundColumn key={`A${round}`} conference="AFC" round={round} label={`AFC ${label}`} />)}
        <SuperBowl />
        {[...ROUNDS].reverse().map(([round, label]) => <RoundColumn key={`N${round}`} conference="NFC" round={round} label={`NFC ${label}`} />)}
      </div>

      <ActionBar variant="bracket" />
    </div>
  );
}
