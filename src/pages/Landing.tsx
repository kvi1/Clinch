import { Link, useNavigate } from 'react-router-dom';
import type { Conference, DivisionName } from '../types/nfl';
import { CONFERENCES, DIVISIONS, divisionTeams } from '../data/teams';
import { useStore } from '../state/store';
import { TeamBadge } from '../components/TeamBadge';

const STEPS = [
  {
    title: 'Choose who to follow',
    body: 'Pick one team to plan its run, or a whole division to settle a title race. Every game in the 2026 schedule is here.',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  },
  {
    title: 'Call the remaining games',
    body: 'Tap W, L or T for every game left. Not sure? “Pick favorites” fills the rest using the betting line. Games already played are locked in.',
    icon: 'M9 12.5 11 14.5 15.5 10M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  },
  {
    title: 'Watch the standings resolve',
    body: 'Division ranks and playoff seeds update instantly using the official NFL tiebreakers — and we tell you which rule broke each tie.',
    icon: 'M4 19h16M7 16V9m5 7V5m5 11v-4',
  },
  {
    title: 'Fill the bracket & share',
    body: 'Advance teams through a reseeding playoff bracket, then copy a link or export a ready-to-post image of your team, division or bracket.',
    icon: 'M8 7h8M8 12h8m-8 5h5M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
  },
];

const TIPS = [
  ['Ties count as half a win', 'Just like the NFL, a tie is worth half a win in the standings.'],
  ['One game, one result', 'When two of your teams play each other, one pick updates both records.'],
  ['Links remember everything', 'Your picks and bracket live in the URL — send it and friends see exactly your scenario.'],
  ['Nothing to sign up for', 'It all runs in your browser. No account, no tracking of your picks.'],
];

export function Landing() {
  const season = useStore((s) => s.season)!;
  const setSelection = useStore((s) => s.setSelection);
  const navigate = useNavigate();
  const remaining = season.games.filter((g) => !g.isFinal);
  const currentWeek = remaining.length ? Math.min(...remaining.map((g) => g.week)) : 18;

  const goTeam = (teamId: string) => {
    setSelection({ kind: 'team', teamId });
    navigate('/predict');
  };
  const goDivision = (conference: Conference, division: DivisionName) => {
    setSelection({ kind: 'division', conference, division });
    navigate('/predict');
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Hero */}
      <section className="pt-6 pb-12 text-center sm:pt-14">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {season.season} season · {remaining.length ? `Week ${currentWeek} · ${remaining.length} games left` : 'Regular season complete'}
        </div>
        <h1 className="text-4xl leading-[1.05] font-black tracking-tight text-white sm:text-6xl">
          Map every path to
          <span className="block bg-gradient-to-r from-emerald-300 via-teal-300 to-sky-400 bg-clip-text text-transparent">the playoffs.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-gray-400 sm:text-lg">
          Predict the rest of the NFL season, let the tiebreakers sort themselves out, and share a clean graphic
          instead of a scribbled screenshot.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/predict" className="rounded-xl bg-emerald-400 px-6 py-3 text-sm font-bold text-gray-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300">
            Start predicting →
          </Link>
          <Link to="/bracket" className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-gray-100 transition hover:bg-white/10">
            Go to the bracket
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mb-14">
        <h2 className="mb-5 text-center text-xs font-bold tracking-[0.25em] text-gray-500 uppercase">How it works</h2>
        <ol className="grid gap-3 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="card flex gap-4 p-5">
              <div className="relative shrink-0">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-emerald-400/25 to-sky-500/10 text-emerald-300 ring-1 ring-emerald-300/20">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={s.icon} />
                  </svg>
                </span>
                <span className="absolute -top-1.5 -left-1.5 grid h-5 w-5 place-items-center rounded-full bg-gray-950 text-[10px] font-black text-emerald-300 ring-1 ring-emerald-300/40">{i + 1}</span>
              </div>
              <div>
                <h3 className="font-bold text-white">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-400">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Quick start */}
      <section className="mb-14">
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-black text-white">Start with your team</h2>
          <p className="mt-1 text-sm text-gray-400">Tap a team to predict its remaining games, or a division name to run the whole race.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONFERENCES.map((c) => (
            <div key={c} className="card p-4">
              <div className="mb-3 text-sm font-black tracking-widest text-gray-300">{c}</div>
              <div className="grid grid-cols-2 gap-2">
                {DIVISIONS.map((d) => (
                  <div key={d} className="rounded-xl bg-white/[0.03] p-2 ring-1 ring-white/[0.06]">
                    <button type="button" onClick={() => goDivision(c, d)}
                      className="mb-2 flex w-full items-center justify-between text-[11px] font-bold tracking-wider text-gray-400 uppercase hover:text-emerald-300">
                      {d} <span aria-hidden>→</span>
                    </button>
                    <div className="grid grid-cols-4 gap-1">
                      {divisionTeams(c, d).map((t) => (
                        <button key={t.id} type="button" onClick={() => goTeam(t.id)} aria-label={`${t.city} ${t.name}`}
                          className="rounded-md transition hover:-translate-y-0.5 hover:brightness-125">
                          <TeamBadge teamId={t.id} size="xs" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {TIPS.map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-white/[0.06] p-4">
            <div className="text-sm font-bold text-gray-100">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-gray-400">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
