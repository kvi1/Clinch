import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Conference, DivisionName, Game } from '../types/nfl';
import { NFL } from '../routes';
import { CONFERENCES, DIVISIONS, TEAM_BY_ID, divisionTeams } from '../data/teams';
import { computeStandings } from '../engine/standings';
import { useStore } from '../state/store';
import { fmtRecord } from '../lib/format';

const STEPS = [
  ['Pick your team', 'One team to plan its run, or a whole division to settle the race.'],
  ['Call the games', 'W, L or T for every game left. "Pick favorites" fills the rest off the betting line.'],
  ['Let the tiebreakers fall', 'Seeds update on every tap using the official tiebreaker rules — and we show which one decided it.'],
  ['Share it', 'Fill the bracket, then send a link or post a graphic of your team, division or bracket.'],
] as const;

const kickoff = (g: Game) =>
  g.timeTbd
    ? 'TBD'
    : new Date(g.kickoffIso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).toUpperCase();

function spread(g: Game) {
  if (g.vegasSpread == null) return null;
  if (g.vegasSpread === 0) return 'PK';
  return `${g.vegasSpread < 0 ? g.homeTeamId : g.awayTeamId} -${Math.abs(g.vegasSpread)}`;
}

/** Scrolling strip of last week's final scores. */
function ScoreTicker({ games }: { games: Game[] }) {
  if (!games.length) return null;
  const items = games.map((g) => {
    const awayWon = (g.awayScore ?? 0) > (g.homeScore ?? 0);
    const homeWon = (g.homeScore ?? 0) > (g.awayScore ?? 0);
    return (
      <span key={g.id} className="flex items-center gap-2 px-5 font-display text-base font-semibold tracking-wide whitespace-nowrap">
        <span className={awayWon ? 'text-white' : 'text-gray-500'}>{g.awayTeamId} {g.awayScore}</span>
        <span className="text-gray-600">@</span>
        <span className={homeWon ? 'text-white' : 'text-gray-500'}>{g.homeTeamId} {g.homeScore}</span>
        <span className="text-[11px] text-gray-500">WK {g.week}</span>
      </span>
    );
  });
  return (
    <div className="-mx-4 -mt-5 flex items-stretch overflow-hidden border-b border-white/10 bg-black/60">
      <div className="z-10 flex shrink-0 items-center bg-amber-400 px-3 font-display text-sm font-black tracking-wider text-gray-950 italic">
        LATEST SCORES
      </div>
      <div className="relative flex-1 overflow-hidden py-2">
        <div className="flex w-max animate-ticker">{items}{items}</div>
      </div>
    </div>
  );
}

/** "If the season ended today": current real seeds, scoreboard style. */
function SeedBoard({ seeds, byTeam }: { seeds: Record<Conference, string[]>; byTeam: ReturnType<typeof computeStandings>['byTeam'] }) {
  return (
    <div className="border border-white/15 bg-black/70 shadow-2xl shadow-black/60 backdrop-blur">
      <div className="flex items-center justify-between border-b border-white/15 bg-white/[0.06] px-4 py-2">
        <span className="font-display text-lg font-black tracking-wide text-white italic">IF THE SEASON ENDED TODAY</span>
        <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-rose-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> LIVE
        </span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/10">
        {CONFERENCES.map((c) => (
          <div key={c} className="p-2">
            <div className="px-1 pb-1 font-display text-sm font-bold tracking-[0.2em] text-gray-400">{c}</div>
            {seeds[c].slice(0, 7).map((id, i) => {
              const r = byTeam[id];
              return (
                <div key={id} className={`flex items-center gap-2 px-1 py-[3px] ${i === 3 ? 'mb-1.5 border-b border-dashed border-white/15 pb-1.5' : ''}`}>
                  <span className="w-3 text-right font-display text-sm font-bold text-amber-300">{i + 1}</span>
                  <span className="h-4 w-1" style={{ backgroundColor: TEAM_BY_ID[id].primaryColor }} />
                  <span className="flex-1 font-display text-[15px] font-bold tracking-wide text-white">{id}</span>
                  <span className="font-display text-[15px] font-semibold text-gray-300 tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-1.5 text-[10px] tracking-wide text-gray-500">Seeds 1–4 division leaders · 5–7 wild cards · real results only</div>
    </div>
  );
}

export function Landing() {
  const season = useStore((s) => s.season)!;
  const setSelection = useStore((s) => s.setSelection);
  const lastTeamId = useStore((s) => s.lastTeamId);
  const lastDivision = useStore((s) => s.lastDivision);
  const navigate = useNavigate();

  const { current, remaining, currentWeek, lastFinals, slate } = useMemo(() => {
    const remaining = season.games.filter((g) => !g.isFinal);
    const finals = season.games.filter((g) => g.isFinal);
    const currentWeek = remaining.length ? Math.min(...remaining.map((g) => g.week)) : 18;
    // Ticker: the latest finished week plus anything already final this week, newest first.
    const tickerWeeks = new Set([currentWeek - 1, currentWeek]);
    const lastFinals = finals
      .filter((g) => tickerWeeks.has(g.week))
      .sort((a, b) => b.kickoffIso.localeCompare(a.kickoffIso));
    return {
      current: computeStandings(season.games, {}),
      remaining,
      currentWeek,
      lastFinals,
      slate: remaining.filter((g) => g.week === currentWeek),
    };
  }, [season]);

  const goTeam = (teamId: string) => {
    setSelection({ kind: 'team', teamId });
    navigate(NFL.predict);
  };
  const goWeek = () => setSelection({ kind: 'week', week: currentWeek });
  const goDivision = (conference: Conference, division: DivisionName) => {
    setSelection({ kind: 'division', conference, division });
    navigate(NFL.predict);
  };

  return (
    <div>
      <ScoreTicker games={lastFinals} />

      {/* Hero */}
      <section className="arena relative -mx-4 overflow-hidden border-b border-white/10 px-4 py-10 sm:py-14">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="mb-3 font-display text-base font-bold tracking-[0.18em] text-amber-300 sm:text-lg sm:tracking-[0.25em]">
              {season.season} · {remaining.length ? `WEEK ${currentWeek} · ${remaining.length} GAMES LEFT` : 'REGULAR SEASON FINAL'}
            </div>
            <h1 className="font-display text-[3.6rem] leading-[0.85] font-black text-white uppercase italic sm:text-[5.5rem]">
              Clinch
              <span className="block text-emerald-400">Where You make the call.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-gray-300">
              Pick every game, watch the standings and tiebreakers sort themselves out, and share your predictions.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link to={NFL.predict} className="group inline-block -skew-x-12 bg-emerald-400 px-7 py-3 shadow-[6px_6px_0_0_rgba(0,0,0,.5)] transition hover:bg-emerald-300">
                <span className="block skew-x-12 font-display text-xl font-black tracking-wide text-gray-950 uppercase italic">Make your picks ›</span>
              </Link>
              <Link to={NFL.bracket} className="font-display text-lg font-bold tracking-wide text-white uppercase underline decoration-emerald-400 decoration-2 underline-offset-4 hover:text-emerald-300">
                Jump to the bracket
              </Link>
            </div>
          </div>
          <SeedBoard seeds={current.seeds} byTeam={current.byTeam} />
        </div>
      </section>

      <div className="mx-auto max-w-6xl">
        {/* How it works */}
        <section className="mt-12">
          <h2 className="mb-5 font-display text-3xl font-black text-white uppercase italic">How it works</h2>
          <ol className="grid border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
            {STEPS.map(([title, body], i) => (
              <li key={title} className={`relative py-5 lg:px-5 lg:first:pl-0 ${i ? 'border-t border-white/10 sm:border-t-0' : ''} ${i >= 2 ? 'sm:border-t lg:border-t-0' : ''}`}>
                <span className="font-display text-6xl leading-none font-black text-emerald-400 italic">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 font-display text-2xl font-bold text-white uppercase">{title}</h3>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-gray-400">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Three ways to predict */}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-black text-white uppercase italic">Three ways to predict</h2>
          <p className="mt-1 mb-5 text-sm text-gray-400">Every pick feeds the same standings and bracket — choose whichever view fits what you're arguing about.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                key: 'team', title: 'One team', blurb: "Plan your team's road. Call all of its remaining games and see where it finishes.",
                exports: 'Team card with all 17 games',
                onClick: () => { setSelection({ kind: 'team', teamId: lastTeamId }); navigate(NFL.predict); },
                preview: (
                  <div className="grid grid-cols-[repeat(17,minmax(0,1fr))] gap-0.5">
                    {'WWLWTLWWLLWWLWLLW'.split('').map((r, i) => (
                      <span key={i} className={`h-5 rounded-sm ${r === 'W' ? 'bg-emerald-500' : r === 'L' ? 'bg-rose-500' : 'bg-amber-400'} ${i > 9 ? 'opacity-60 ring-1 ring-white/50 ring-inset' : ''}`} />
                    ))}
                  </div>
                ),
              },
              {
                key: 'division', title: 'Division', blurb: 'Settle a four-team race. Every game those teams have left, with live division standings.',
                exports: 'Standings image',
                onClick: () => { setSelection({ kind: 'division', ...lastDivision }); navigate(NFL.predict); },
                preview: (
                  <div className="flex flex-col gap-0.5">
                    {divisionTeams(lastDivision.conference, lastDivision.division).map((t, i) => (
                      <div key={t.id} className="flex h-[18px] items-center gap-1.5 pl-1.5" style={{ width: `${100 - i * 14}%`, background: `linear-gradient(90deg, ${t.primaryColor}, ${t.primaryColor}55)` }}>
                        <span className="font-display text-xs font-black text-white italic">{t.id}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                key: 'week', title: 'Week', blurb: `Call a whole slate — every game in Week ${currentWeek}, from Thursday night to Monday.`,
                exports: 'Week picks image',
                onClick: () => { goWeek(); navigate(NFL.predict); },
                preview: (
                  <div className="grid grid-cols-2 gap-1">
                    {remaining.slice(0, 4).map((g) => (
                      <div key={g.id} className="flex h-[22px] items-center justify-between rounded-sm bg-white/[0.06] px-1.5 font-display text-xs font-bold">
                        <span className="text-white">{g.awayTeamId}</span>
                        <span className="text-gray-600">@</span>
                        <span className="text-gray-400">{g.homeTeamId}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
            ].map((m) => (
              <button key={m.key} type="button" onClick={m.onClick}
                className="group flex flex-col border border-white/10 bg-white/[0.02] p-5 text-left transition-colors hover:border-emerald-400/60 hover:bg-white/[0.04]">
                <div className="mb-4 flex h-[78px] flex-col justify-center">{m.preview}</div>
                <h3 className="font-display text-3xl leading-none font-black text-white uppercase italic group-hover:text-emerald-300">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{m.blurb}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="font-semibold tracking-wider text-gray-500 uppercase">Exports: {m.exports}</span>
                  <span className="shrink-0 pl-3 font-display text-base font-black tracking-wide whitespace-nowrap text-emerald-400 uppercase italic">Start ›</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* This week's slate */}
        {slate.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between">
              <h2 className="font-display text-3xl font-black text-white uppercase italic">Week {currentWeek} slate</h2>
              <Link to={NFL.predict} onClick={goWeek} className="font-display text-base font-bold tracking-wide text-emerald-400 uppercase hover:text-emerald-300">Call these games ›</Link>
            </div>
            <div className="grid gap-1 max-sm:[&>*:nth-child(n+7)]:hidden sm:grid-cols-2 lg:grid-cols-4">
              {slate.map((g) => (
                <div key={g.id} className="flex items-center gap-3 border border-white/10 bg-[#0b0f17] px-3 py-2.5">
                  <div className="flex flex-1 flex-col gap-1">
                    {[g.awayTeamId, g.homeTeamId].map((id) => (
                      <button key={id} type="button" onClick={() => goTeam(id)} className="flex items-center gap-2 text-left hover:brightness-125">
                        <span className="h-5 w-1" style={{ backgroundColor: TEAM_BY_ID[id].primaryColor }} />
                        <span className="w-10 font-display text-lg leading-none font-bold text-white">{id}</span>
                        <span className="font-display text-sm text-gray-500 tabular-nums">
                          {fmtRecord(current.byTeam[id].wins, current.byTeam[id].losses, current.byTeam[id].ties)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="text-right font-display leading-tight">
                    <div className="text-sm font-semibold text-gray-400">{kickoff(g)}</div>
                    {spread(g) && <div className="text-sm font-bold text-amber-300">{spread(g)}</div>}
                  </div>
                </div>
              ))}
            </div>
            {slate.length > 6 && (
              <Link to={NFL.predict} onClick={goWeek} className="mt-2 block border border-white/10 py-2 text-center font-display text-sm font-bold tracking-wide text-gray-300 uppercase sm:hidden">
                + {slate.length - 6} more games
              </Link>
            )}
          </section>
        )}

        {/* Pick your team */}
        <section className="mt-12">
          <h2 className="font-display text-3xl font-black text-white uppercase italic">Pick your team</h2>
          <p className="mt-1 mb-5 text-sm text-gray-400">Tap a team to plan its run, or a division header to run the whole race.</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-4">
            {CONFERENCES.flatMap((c) =>
              DIVISIONS.map((d) => (
                <div key={c + d}>
                  <button type="button" onClick={() => goDivision(c, d)}
                    className="mb-2 flex w-full items-center justify-between border-b-2 border-white/20 pb-1 font-display text-base font-black tracking-wide text-gray-300 uppercase italic transition-colors hover:border-emerald-400 hover:text-emerald-300">
                    {c} {d} <span aria-hidden>›</span>
                  </button>
                  <div className="flex flex-col gap-1">
                    {divisionTeams(c, d).map((t) => {
                      const r = current.byTeam[t.id];
                      return (
                        <button key={t.id} type="button" onClick={() => goTeam(t.id)}
                          className="group flex items-center gap-2 overflow-hidden text-left transition-transform hover:translate-x-1"
                          style={{ background: `linear-gradient(90deg, ${t.primaryColor} 0%, ${t.primaryColor}40 60%, transparent 100%)` }}>
                          <span className="h-9 w-1.5 shrink-0" style={{ backgroundColor: t.secondaryColor }} />
                          <span className="w-10 font-display text-xl leading-none font-black text-white italic drop-shadow">{t.id}</span>
                          <span className="hidden flex-1 truncate text-xs font-semibold text-white/80 sm:block">{t.name}</span>
                          <span className="ml-auto pr-2 font-display text-sm font-semibold text-white/70 tabular-nums">{fmtRecord(r.wins, r.losses, r.ties)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )),
            )}
          </div>
        </section>

        <p className="mt-12 border-t border-white/10 pt-5 text-xs leading-relaxed text-gray-500">
          Ties count as half a win. Games already played are locked. Your picks live in the link — no account, nothing stored on a server.
        </p>
      </div>
    </div>
  );
}

