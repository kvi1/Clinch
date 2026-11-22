import { TEAM_BY_ID } from '../data/teams';

const SIZES = {
  xs: 'h-6 min-w-8 text-[10px] px-1',
  sm: 'h-8 min-w-10 text-xs px-1.5',
  md: 'h-10 min-w-12 text-sm px-2',
  lg: 'h-14 min-w-16 text-lg px-3',
} as const;

/** Typographic team badge: abbreviation on primary color with a secondary-color stripe. No logos. */
export function TeamBadge({ teamId, size = 'sm', dim = false }: { teamId: string; size?: keyof typeof SIZES; dim?: boolean }) {
  const team = TEAM_BY_ID[teamId];
  if (!team) return null;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md font-black tracking-tight text-white shadow-sm ${SIZES[size]} ${dim ? 'opacity-40' : ''}`}
      style={{ backgroundColor: team.primaryColor, boxShadow: `inset 0 -3px 0 ${team.secondaryColor}`, textShadow: '0 1px 1px rgba(0,0,0,.45)' }}
      title={`${team.city} ${team.name}`}
    >
      {team.id}
    </span>
  );
}
