import type { Conference } from '../types/nfl';
import { TEAM_BY_ID } from '../data/teams';
import type { StandingsResult } from '../engine/standings';
import { TeamBadge } from './TeamBadge';
import { fmtRecord } from '../lib/format';

export function SeedList({ conference, standings, highlight = [] }: { conference: Conference; standings: StandingsResult; highlight?: string[] }) {
  const seeds = standings.seeds[conference];
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-sm font-semibold text-gray-200">{conference} playoff picture</h2>
      <ol className="flex flex-col">
        {seeds.map((id, i) => {
          const r = standings.byTeam[id];
          const seed = i + 1;
          return (
            <li key={id}
              className={`flex items-center gap-2 py-1 text-sm ${seed === 8 ? 'mt-2 border-t border-dashed border-white/20 pt-2' : ''} ${highlight.includes(id) ? 'rounded bg-emerald-400/10' : ''}`}>
              <span className={`w-5 text-right font-bold tabular-nums ${seed <= 7 ? 'text-emerald-300' : 'text-gray-500'}`}>{seed}</span>
              <TeamBadge teamId={id} size="xs" dim={seed > 7} />
              <span className={`min-w-0 flex-1 truncate ${seed <= 7 ? 'text-gray-100' : 'text-gray-400'}`}>
                {TEAM_BY_ID[id].name}
                {seed <= 4 && <span className="ml-1.5 text-[10px] uppercase text-gray-400">{seed === 1 ? 'bye · div' : 'div'}</span>}
                {r.seedTiebreak && <span className="ml-1.5 text-[10px] text-amber-300">{r.seedTiebreak}</span>}
              </span>
              <span className="tabular-nums text-gray-300">{fmtRecord(r.wins, r.losses, r.ties)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
