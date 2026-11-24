import { CONFERENCES, DIVISIONS, TEAMS, TEAM_BY_ID, divisionTeams } from '../data/teams';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { currentWeek } from '../lib/season';
import { TeamBadge } from './TeamBadge';

/** One team / Division / Week mode cards. Remembers the last team and division you looked at. */
export function ModeCards() {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const lastTeamId = useStore((s) => s.lastTeamId);
  const lastDivision = useStore((s) => s.lastDivision);
  const games = useStore((s) => s.season!.games);

  const toTeam = () => {
    if (selection.kind === 'division') {
      const inDivision = divisionTeams(selection.conference, selection.division);
      const keep = inDivision.find((t) => t.id === lastTeamId) ?? inDivision[0];
      setSelection({ kind: 'team', teamId: keep.id });
    } else if (selection.kind === 'week') {
      setSelection({ kind: 'team', teamId: lastTeamId });
    }
  };
  const toDivision = () => {
    if (selection.kind === 'team') {
      const t = TEAM_BY_ID[selection.teamId];
      setSelection({ kind: 'division', conference: t.conference, division: t.division });
    } else if (selection.kind === 'week') {
      setSelection({ kind: 'division', ...lastDivision });
    }
  };
  const toWeek = () => {
    if (selection.kind !== 'week') setSelection({ kind: 'week', week: currentWeek(games) });
  };

  const modes = [
    { kind: 'team', label: 'One team', blurb: "Plan one team's road — all 17 games.", exports: 'Team card', onClick: toTeam },
    { kind: 'division', label: 'Division', blurb: 'Settle a 4-team division race.', exports: 'Standings image', onClick: toDivision },
    { kind: 'week', label: 'Week', blurb: "Call every game on one week's slate.", exports: 'Week picks image', onClick: toWeek },
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Prediction mode">
      {modes.map(({ kind, label, blurb, exports, onClick }) => {
        const active = selection.kind === kind;
        return (
          <button key={kind} type="button" role="tab" aria-selected={active} onClick={onClick}
            className={`flex flex-col rounded-xl border p-2.5 text-left transition-colors sm:p-3.5 ${
              active ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
            }`}>
            <span className={`font-display text-lg leading-none font-black uppercase italic sm:text-2xl ${active ? 'text-emerald-300' : 'text-white'}`}>{label}</span>
            <span className="mt-1.5 text-[11px] leading-snug text-gray-400 sm:text-sm">{blurb}</span>
            <span className="mt-auto hidden pt-2 text-[11px] font-semibold tracking-wider text-gray-500 uppercase sm:block">Exports: {exports}</span>
          </button>
        );
      })}
    </div>
  );
}

const TEAMS_BY_CITY = [...TEAMS].sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

/** One-team mode: every team as its own color tile, grouped only by conference, A–Z by city.
 *  On phones the grid collapses to a "Change team" bar after a pick, so the games aren't pushed far down. */
export function TeamPicker({ selectedId }: { selectedId: string }) {
  const setSelection = useStore((s) => s.setSelection);
  const [open, setOpen] = useState(true);
  const current = TEAM_BY_ID[selectedId];

  return (
    <div>
      {!open && (
        <button type="button" onClick={() => setOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2 pr-4 text-left sm:hidden">
          <span className="flex h-11 w-16 items-center justify-center rounded-lg font-display text-2xl font-black text-white italic"
            style={{ background: current.primaryColor, boxShadow: `inset 0 -3px 0 ${current.secondaryColor}` }}>{current.id}</span>
          <span className="flex-1 text-sm font-semibold text-gray-100">{current.city} {current.name}</span>
          <span className="text-xs font-bold tracking-wider text-emerald-300 uppercase">Change team ▾</span>
        </button>
      )}
      <div className={`flex flex-col gap-4 ${open ? '' : 'max-sm:hidden'}`}>
        {CONFERENCES.map((conference) => (
          <div key={conference}>
            <div className="mb-2 font-display text-sm font-bold tracking-[0.25em] text-gray-400">{conference}</div>
            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
              {TEAMS_BY_CITY.filter((t) => t.conference === conference).map((t) => {
                const selected = t.id === selectedId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${t.city} ${t.name}`}
                    onClick={() => {
                      setSelection({ kind: 'team', teamId: t.id });
                      setOpen(false);
                    }}
                    className={`relative flex h-14 flex-col justify-center overflow-hidden rounded-lg px-2.5 text-left transition hover:-translate-y-0.5 hover:brightness-110 ${
                      selected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#070a10]' : 'opacity-75 hover:opacity-100'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${t.primaryColor} 0%, ${t.primaryColor}cc 55%, ${t.primaryColor}77 100%)`,
                      boxShadow: `inset 0 -3px 0 ${t.secondaryColor}`,
                    }}
                  >
                    <span className="font-display text-2xl leading-none font-black text-white italic drop-shadow">{t.id}</span>
                    <span className="mt-0.5 truncate text-[10px] font-semibold text-white/85">{t.name}</span>
                    {selected && (
                      <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-400 text-[10px] font-black text-gray-950">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Week mode: prev/next plus a scrollable row of weeks 1–18 (played / current / upcoming). */
export function WeekPicker({ week }: { week: number }) {
  const setSelection = useStore((s) => s.setSelection);
  const games = useStore((s) => s.season!.games);
  const now = currentWeek(games);
  const activeRef = useRef<HTMLButtonElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Center the selected week in the row (without scrolling the page itself).
  useEffect(() => {
    const row = rowRef.current;
    const el = activeRef.current;
    if (row && el) row.scrollTo({ left: el.offsetLeft - row.offsetLeft - row.clientWidth / 2 + el.clientWidth / 2 });
  }, [week]);

  const go = (w: number) => setSelection({ kind: 'week', week: Math.min(18, Math.max(1, w)) });
  const arrow = 'grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-lg text-gray-200 hover:bg-white/10 disabled:opacity-30';

  return (
    <div className="flex items-center gap-2">
      <button type="button" className={arrow} onClick={() => go(week - 1)} disabled={week <= 1} aria-label="Previous week">‹</button>
      <div ref={rowRef} className="no-scrollbar relative flex flex-1 gap-1.5 overflow-x-auto py-1">
        {Array.from({ length: 18 }, (_, i) => i + 1).map((w) => {
          const active = w === week;
          const played = w < now;
          return (
            <button key={w} ref={active ? activeRef : undefined} type="button" onClick={() => go(w)} aria-pressed={active}
              className={`flex h-11 min-w-11 shrink-0 flex-col items-center justify-center rounded-xl border px-2 leading-none transition-colors ${
                active ? 'border-emerald-400 bg-emerald-400 text-gray-950'
                  : played ? 'border-white/5 bg-white/[0.02] text-gray-500 hover:text-gray-200'
                    : 'border-white/10 bg-white/[0.05] text-gray-200 hover:bg-white/10'
              }`}>
              <span className="font-display text-lg font-black">{w}</span>
              {w === now && <span className={`text-[8px] font-bold tracking-wider ${active ? 'text-gray-950' : 'text-emerald-300'}`}>NOW</span>}
            </button>
          );
        })}
      </div>
      <button type="button" className={arrow} onClick={() => go(week + 1)} disabled={week >= 18} aria-label="Next week">›</button>
    </div>
  );
}

/** Picker for the current mode: team tiles, division cards, or week row. */
export function SelectionPicker() {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  if (selection.kind === 'week') return <WeekPicker week={selection.week} />;
  if (selection.kind === 'team') return <TeamPicker selectedId={selection.teamId} />;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CONFERENCES.flatMap((conference) =>
        DIVISIONS.map((division) => {
          const selected = selection.conference === conference && selection.division === division;
          return (
            <button key={`${conference}${division}`} type="button" aria-pressed={selected}
              onClick={() => setSelection({ kind: 'division', conference, division })}
              className={`rounded-xl border p-2 text-left transition-colors ${selected ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'}`}>
              <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <span>{conference} {division}</span>
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {divisionTeams(conference, division).map((t) => <TeamBadge key={t.id} teamId={t.id} size="xs" />)}
              </div>
            </button>
          );
        }),
      )}
    </div>
  );
}
