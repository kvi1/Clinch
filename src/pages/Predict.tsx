import { useStandings, useStore } from '../state/store';
import { selectedTeamIds, selectionConference, selectionDivisionKey } from '../state/selection';
import { ModeSwitch, SelectionPicker } from '../components/SelectionPicker';
import { GameList } from '../components/GameList';
import { StandingsTable } from '../components/StandingsTable';
import { SeedList } from '../components/SeedList';
import { TeamSummary } from '../components/TeamSummary';
import { ActionBar } from '../components/ActionBar';

export function Predict() {
  const selection = useStore((s) => s.selection);
  const standings = useStandings()!;
  const highlight = selectedTeamIds(selection);
  const divKey = selectionDivisionKey(selection);
  const [conf, div] = divKey.split('-');

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Predict the season</h1>
          <p className="text-sm text-gray-400">
            {selection.kind === 'team' ? 'Pick a team, then call each of its remaining games.' : 'Pick a division, then call every game its teams have left.'}
          </p>
        </div>
        <div className="sm:w-72"><ModeSwitch /></div>
      </div>

      <SelectionPicker />

      <div className="mt-5">
        {selection.kind === 'team' ? (
          <TeamSummary teamId={selection.teamId} />
        ) : (
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-black text-white">{conf} {div}</h2>
            <span className="text-sm text-gray-400">division race</span>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <GameList />
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          <StandingsTable title={`${conf} ${div} standings`} teamIds={standings.divisions[divKey]} rows={standings.byTeam} highlight={highlight} />
          <SeedList conference={selectionConference(selection)} standings={standings} highlight={highlight} />
        </aside>
      </div>
      <ActionBar variant={selection.kind === 'team' ? 'team' : 'standings'} />
    </div>
  );
}
