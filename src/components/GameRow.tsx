import type { Game, GameOutcome } from '../types/nfl';
import { useStore } from '../state/store';
import { TeamBadge } from './TeamBadge';

const fmtKickoff = (g: Game) =>
  g.timeTbd
    ? `${new Date(g.kickoffIso).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' })} · TBD`
    : new Date(g.kickoffIso).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' });

function spreadLabel(g: Game): string | null {
  if (g.vegasSpread == null) return null;
  if (g.vegasSpread === 0) return 'PK';
  const fav = g.vegasSpread < 0 ? g.homeTeamId : g.awayTeamId;
  return `${fav} -${Math.abs(g.vegasSpread)}`;
}

interface Props {
  game: Game;
  /** When set, buttons read W / L / T from this team's point of view. */
  perspective?: string;
}

/**
 * One game with three tap targets. Each game is stored once, so a pick here is automatically
 * reflected for the opponent too (that is how cross-team conflicts are resolved).
 */
export function GameRow({ game, perspective }: Props) {
  const pick = useStore((s) => s.outcomes[game.id]);
  const setOutcome = useStore((s) => s.setOutcome);
  const toggle = (o: GameOutcome) => setOutcome(game.id, pick === o ? null : o);
  const spread = spreadLabel(game);

  const btn = (o: GameOutcome, label: React.ReactNode, tone: string) => (
    <button
      type="button"
      aria-pressed={pick === o}
      onClick={() => toggle(o)}
      className={`flex h-11 min-w-11 flex-1 items-center justify-center rounded-xl border text-sm font-bold transition-all ${
        pick === o ? `${tone} shadow-md` : 'border-white/10 bg-white/[0.04] text-gray-300 hover:border-white/25 hover:bg-white/[0.09] active:bg-white/10'
      }`}
    >
      {label}
    </button>
  );

  const meta = (
    <div className="text-[11px] leading-tight text-gray-400">
      <span className="whitespace-nowrap">{fmtKickoff(game)}</span>
      {spread && <span className="ml-1.5 inline-block whitespace-nowrap rounded-md bg-white/[0.08] px-1.5 py-px text-[10px] font-semibold text-gray-300">{spread}</span>}
    </div>
  );

  if (perspective) {
    const isHome = game.homeTeamId === perspective;
    const opp = isHome ? game.awayTeamId : game.homeTeamId;
    const win: GameOutcome = isHome ? 'HOME_WIN' : 'AWAY_WIN';
    const loss: GameOutcome = isHome ? 'AWAY_WIN' : 'HOME_WIN';
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamBadge teamId={perspective} size="xs" />
          <span className="text-xs text-gray-400">{isHome ? 'vs' : '@'}</span>
          <TeamBadge teamId={opp} size="sm" />
          <div className="min-w-0">{meta}</div>
        </div>
        <div className="flex w-36 shrink-0 gap-1.5">
          {btn(win, 'W', 'border-emerald-400 bg-emerald-500 text-white shadow-emerald-500/30')}
          {btn(loss, 'L', 'border-rose-400 bg-rose-500 text-white shadow-rose-500/30')}
          {btn('TIE', 'T', 'border-amber-300 bg-amber-400 text-gray-900')}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      {meta}
      <div className="mt-1 flex gap-1.5">
        {btn('AWAY_WIN', <span className="flex items-center gap-1.5"><TeamBadge teamId={game.awayTeamId} size="xs" /> wins</span>, 'border-emerald-400 bg-emerald-500/25 text-white')}
        <div className="w-12 shrink-0">{btn('TIE', 'T', 'border-amber-300 bg-amber-400 text-gray-900')}</div>
        {btn('HOME_WIN', <span className="flex items-center gap-1.5"><TeamBadge teamId={game.homeTeamId} size="xs" /> wins</span>, 'border-emerald-400 bg-emerald-500/25 text-white')}
      </div>
      <div className="mt-0.5 flex justify-between px-1 text-[10px] text-gray-500"><span>away</span><span>home</span></div>
    </div>
  );
}
