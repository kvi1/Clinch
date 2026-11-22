import { CONFERENCES, DIVISIONS, TEAM_BY_ID, divisionTeams } from '../data/teams';
import { useStore } from '../state/store';
import { TeamBadge } from './TeamBadge';

/** "One team" / "Whole division" segmented control. */
export function ModeSwitch() {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const toTeam = () => {
    if (selection.kind === 'team') return;
    setSelection({ kind: 'team', teamId: divisionTeams(selection.conference, selection.division)[0].id });
  };
  const toDivision = () => {
    if (selection.kind === 'division') return;
    const t = TEAM_BY_ID[selection.teamId];
    setSelection({ kind: 'division', conference: t.conference, division: t.division });
  };
  const seg = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${active ? 'bg-white text-gray-950 shadow' : 'text-gray-300 hover:text-white'}`;
  return (
    <div className="flex rounded-xl bg-white/[0.06] p-1 ring-1 ring-white/10" role="tablist" aria-label="Prediction mode">
      <button type="button" role="tab" aria-selected={selection.kind === 'team'} className={seg(selection.kind === 'team')} onClick={toTeam}>
        One team
      </button>
      <button type="button" role="tab" aria-selected={selection.kind === 'division'} className={seg(selection.kind === 'division')} onClick={toDivision}>
        Whole division
      </button>
    </div>
  );
}

/** Team mode: tap a team badge. Division mode: tap a division card. */
export function SelectionPicker() {
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const teamMode = selection.kind === 'team';

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
