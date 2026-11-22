import { TEAM_BY_ID } from '../data/teams';
import type { StandingRow } from '../engine/standings';
import { TeamBadge } from './TeamBadge';
import { fmtRecord } from '../lib/format';


export function StandingsTable({ title, teamIds, rows, highlight = [] }: {
  title: string;
  teamIds: string[];
  rows: Record<string, StandingRow>;
  highlight?: string[];
}) {
  return (
    <section className="card p-4">
      <h2 className="mb-2 text-sm font-semibold text-gray-200">{title}</h2>
      <table className="w-full text-sm tabular-nums [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-gray-400">
            <th className="w-6 text-left font-medium">#</th>
            <th className="text-left font-medium">Team</th>
            <th className="text-right font-medium">W-L-T</th>
            <th className="text-right font-medium">Div</th>
            <th className="text-right font-medium">Conf</th>
            <th className="w-10 text-right font-medium">Seed</th>
          </tr>
        </thead>
        <tbody>
          {teamIds.map((id) => {
            const r = rows[id];
            return (
              <tr key={id} className={`border-t border-white/5 ${highlight.includes(id) ? 'bg-emerald-400/10' : ''}`}>
                <td className="py-1.5 text-gray-400">{r.divisionRank}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    <TeamBadge teamId={id} size="xs" />
                    <div className="min-w-0">
                      <div className="max-w-[7.5rem] truncate text-gray-100">{TEAM_BY_ID[id].name}</div>
                      {r.divisionTiebreak && <div className="truncate text-[10px] text-amber-300">wins tiebreak: {r.divisionTiebreak}</div>}
                    </div>
                  </div>
                </td>
                <td className="pl-2 text-right font-semibold text-gray-100">{fmtRecord(r.wins, r.losses, r.ties)}</td>
                <td className="pl-2 text-right text-gray-300">{fmtRecord(r.divWins, r.divLosses, r.divTies)}</td>
                <td className="pl-2 text-right text-gray-300">{fmtRecord(r.confWins, r.confLosses, r.confTies)}</td>
                <td className={`text-right font-semibold ${r.conferenceSeed! <= 7 ? 'text-emerald-300' : 'text-gray-500'}`}>{r.conferenceSeed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
