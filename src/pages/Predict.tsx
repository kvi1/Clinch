import { useStandings, useStore } from '../state/store';
import { selectedTeamIds, selectionConference, selectionDivisionKey } from '../state/selection';
import { gamesInWeek, weekDateRange } from '../lib/season';
import { ModeCards, SelectionPicker } from '../components/SelectionPicker';
import { GameList } from '../components/GameList';
import { StandingsTable } from '../components/StandingsTable';
import { SeedList } from '../components/SeedList';
import { TeamSummary } from '../components/TeamSummary';
import { ActionBar } from '../components/ActionBar';
import type { ShareVariant } from '../components/export/ShareCard';

const PICK_PROMPT = {
  team: 'Pick your team',
  division: 'Pick a division',
  week: 'Pick a week',
} as const;

export function Predict() {
  const selection = useStore((s) => s.selection);
  const games = useStore((s) => s.season!.games);
  const standings = useStandings()!;
  const highlight = selectedTeamIds(selection);
  const divKey = selectionDivisionKey(selection);
  const conference = selectionConference(selection);
  const variant: ShareVariant = selection.kind === 'team' ? 'team' : selection.kind === 'week' ? 'week' : 'standings';

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-black text-white uppercase italic">Predict the season</h1>
      <p className="mb-3 text-sm text-gray-400">Choose how you want to predict:</p>
      <ModeCards />

      <div className="mt-5">
        <div className="mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">{PICK_PROMPT[selection.kind]}</div>
        <SelectionPicker />
      </div>

      <div className="mt-5">
        {selection.kind === 'team' && <TeamSummary teamId={selection.teamId} />}
        {selection.kind === 'division' && (
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-black text-white">{selection.conference} {selection.division}</h2>
            <span className="text-sm text-gray-400">division race</span>
          </div>
        )}
        {selection.kind === 'week' && (
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-4xl font-black text-white uppercase italic">Week {selection.week}</h2>
            <span className="text-sm text-gray-400">{weekDateRange(gamesInWeek(games, selection.week))}</span>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <GameList />
        <aside className="flex flex-col gap-4 lg:sticky lg:top-20">
          {divKey && (
            <StandingsTable title={`${divKey.replace('-', ' ')} standings`} teamIds={standings.divisions[divKey]} rows={standings.byTeam} highlight={highlight} />
          )}
          {conference ? (
            <SeedList conference={conference} standings={standings} highlight={highlight} />
          ) : (
            <>
              <SeedList conference="AFC" standings={standings} />
              <SeedList conference="NFC" standings={standings} />
            </>
          )}
        </aside>
      </div>
      <ActionBar variant={variant} />
    </div>
  );
}
