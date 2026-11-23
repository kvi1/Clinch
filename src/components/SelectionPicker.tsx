import { CONFERENCES, DIVISIONS, TEAM_BY_ID, divisionTeams } from '../data/teams';
import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import { currentWeek } from '../lib/season';
import { TeamBadge } from './TeamBadge';

/** One team / Division / Week segmented control. Remembers the last team and division you looked at. */
export function ModeSwitch() {
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

  const tabs = [
    ['team', 'One team', toTeam],
    ['division', 'Division', toDivision],
    ['week', 'Week', toWeek],
  ] as const;
  return (
    <div className="flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10" role="tablist" aria-label="Prediction mode">
      {tabs.map(([kind, label, onClick]) => {
        const active = selection.kind === kind;
        return (
          <button key={kind} type="button" role="tab" aria-selected={active} onClick={onClick}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors ${active ? 'bg-white text-gray-950 shadow' : 'text-gray-300 hover:text-white'}`}>
            {label}
          </button>
        );
      })}
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

/** Team mode: tap a team badge. Division mode: tap a division card. */
export function SelectionPicker() {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const teamMode = selection.kind === 'team';
  if (selection.kind === 'week') return <WeekPicker week={selection.week} />;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {CONFERENCES.flatMap((conference) =>
        DIVISIONS.map((division) => {
          const teams = divisionTeams(conference, division);
          const divSelected = selection.kind === 'division' && selection.conference === conference && selection.division === division;
          const containsTeam = teamMode && teams.some((t) => t.id === selection.teamId);
          const label = (
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              <span>{conference} {division}</span>
              {divSelected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </div>
          );
          const badges = (
            <div className="grid grid-cols-4 gap-1">
              {teams.map((t) => {
                const teamSelected = teamMode && selection.teamId === t.id;
                const badge = <TeamBadge teamId={t.id} size="xs" dim={teamMode && !teamSelected && containsTeam} />;
                return teamMode ? (
                  <button key={t.id} type="button" aria-pressed={teamSelected} aria-label={`${t.city} ${t.name}`}
                    onClick={() => setSelection({ kind: 'team', teamId: t.id })}
                    className={`rounded-md transition hover:-translate-y-0.5 hover:brightness-125 ${teamSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-950' : ''}`}>
                    {badge}
                  </button>
                ) : (
                  <span key={t.id}>{badge}</span>
                );
              })}
            </div>
          );
          const base = 'rounded-xl border p-2 text-left transition-colors';
          return teamMode ? (
            <div key={`${conference}${division}`} className={`${base} ${containsTeam ? 'border-emerald-400/40 bg-emerald-400/[0.06]' : 'border-white/[0.06] bg-white/[0.03]'}`}>
              {label}{badges}
            </div>
          ) : (
            <button key={`${conference}${division}`} type="button" aria-pressed={divSelected}
              onClick={() => setSelection({ kind: 'division', conference, division })}
              className={`${base} ${divSelected ? 'border-emerald-400 bg-emerald-400/10' : 'border-white/[0.06] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'}`}>
              {label}{badges}
            </button>
          );
        }),
      )}
    </div>
  );
}
