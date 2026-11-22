import { TEAM_BY_ID } from '../data/teams';
import { useStandings, useStore } from '../state/store';
import { fmtRecord } from '../lib/format';
import { RESULT_STYLE, teamSchedule } from '../lib/teamSchedule';
import { TeamBadge } from './TeamBadge';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

/** Headline card for single-team mode: projected record, playoff status and a 17-game strip. */
export function TeamSummary({ teamId }: { teamId: string }) {
  const season = useStore((s) => s.season)!;
  const outcomes = useStore((s) => s.outcomes);
  const standings = useStandings()!;
  const team = TEAM_BY_ID[teamId];
  const r = standings.byTeam[teamId];
  const schedule = teamSchedule(season.games, outcomes, teamId);
  const open = schedule.filter((g) => !g.game.isFinal);
  const picked = open.filter((g) => g.result).length;
  const seed = r.conferenceSeed!;

  const status =
    seed === 1 ? 'No. 1 seed · first-round bye'
      : seed <= 4 ? `Wins the ${team.conference} ${team.division} · No. ${seed} seed`
        : seed <= 7 ? `Wild card · No. ${seed} seed`
          : `Misses the playoffs · ${ordinal(seed)} in the ${team.conference}`;

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-white/10 p-5"
      style={{ background: `linear-gradient(135deg, ${team.primaryColor}cc 0%, ${team.primaryColor}55 45%, rgba(7,10,16,.6) 100%)` }}
    >
      <div className="pointer-events-none absolute -top-10 -right-6 text-[9rem] leading-none font-black tracking-tighter text-white/[0.06] select-none">{team.id}</div>
      <div className="relative flex items-start gap-4">
        <TeamBadge teamId={teamId} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold tracking-wider text-white/70 uppercase">{team.city}</div>
          <h1 className="truncate text-2xl font-black text-white">{team.name}</h1>
          <div className="mt-1 text-sm font-medium" style={{ color: seed <= 7 ? '#6ee7b7' : '#fda4af' }}>{status}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Projected</div>
          <div className="text-3xl font-black text-white tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</div>
          <div className="text-xs text-white/60">{ordinal(r.divisionRank)} in division</div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-[11px] text-white/60">
          <span>Season · weeks 1–18</span>
          <span>{picked}/{open.length} remaining games picked</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${schedule.length}, minmax(0, 1fr))` }}>
          {schedule.map((g) => (
            <div key={g.game.id} title={`Week ${g.game.week} ${g.home ? 'vs' : '@'} ${g.opponent}${g.result ? ` — ${g.result}` : ''}`}
              className={`flex h-7 items-center justify-center rounded text-[10px] font-black ${
                g.result ? RESULT_STYLE[g.result] : 'bg-white/10 text-white/40'
              } ${g.predicted ? 'opacity-80 ring-1 ring-white/50 ring-inset' : ''}`}>
              {g.result ?? '·'}
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-white/70" /> played</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm ring-1 ring-white/70" /> your pick</span>
        </div>
      </div>
    </section>
  );
}
