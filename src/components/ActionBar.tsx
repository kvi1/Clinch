import { useCallback, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBracket, useShareQuery, useStandings, useStore } from '../state/store';
import { ShareCard, type ShareVariant } from './export/ShareCard';
import { exportPng } from './export/exportPng';
import { ExportDialog } from './export/ExportDialog';
import { NFL } from '../routes';

const EXPORT_LABEL: Record<ShareVariant, string> = {
  team: 'Export card',
  standings: 'Export image',
  bracket: 'Export bracket',
  week: 'Export week',
};

const DIALOG_TITLE: Record<ShareVariant, string> = {
  team: 'Export team card',
  standings: 'Export standings',
  bracket: 'Export bracket',
  week: 'Export week picks',
};

/** Floating bottom bar: copy share link, export PNG, switch page. */
export function ActionBar({ variant }: { variant: ShareVariant }) {
  const season = useStore((s) => s.season)!;
  const selection = useStore((s) => s.selection);
  const outcomes = useStore((s) => s.outcomes);
  const displayName = useStore((s) => s.displayName);
  const divisionScope = useStore((s) => s.divisionCardScope);
  const setDivisionScope = useStore((s) => s.setDivisionCardScope);
  const standings = useStandings()!;
  const bracket = useBracket()!;
  const query = useShareQuery();
  const location = useLocation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const closeDialog = useCallback(() => setDialogOpen(false), []);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${location.pathname}${query}`;
    try {
      await navigator.clipboard.writeText(url);
      flash('Link copied — paste it anywhere');
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  const doExport = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const name =
        variant === 'team' && selection.kind === 'team' ? `clinch-${selection.teamId.toLowerCase()}`
          : variant === 'week' && selection.kind === 'week' ? `clinch-week-${selection.week}`
            : `clinch-${variant}`;
      await exportPng(cardRef.current, `${name}.png`);
      setDialogOpen(false);
    } catch (err) {
      flash(`Export failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const cardProps = {
    variant, selection, standings, bracket, games: season.games, outcomes, name: displayName, divisionScope,
  };
  const options = variant === 'standings' && (
    <div className="mb-4">
      <div className="mb-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase">Show</div>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Games to show">
        {([['remaining', 'Remaining games'], ['season', 'Full season']] as const).map(([value, label]) => {
          const active = divisionScope === value;
          return (
            <button key={value} type="button" role="radio" aria-checked={active} onClick={() => setDivisionScope(value)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                active ? 'border-emerald-400 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/[0.03] text-gray-300 hover:border-white/25'
              }`}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
  const btn = 'flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors';
  const onBracket = variant === 'bracket';
  return (
    <>
      <div aria-hidden className="pointer-events-none fixed top-0 -left-[99999px]">
        <ShareCard ref={cardRef} {...cardProps} />
      </div>
      <ExportDialog open={dialogOpen} busy={busy} title={DIALOG_TITLE[variant]} onClose={closeDialog} onExport={doExport}
        preview={<ShareCard {...cardProps} />} options={options} />
      {toast && (
        <div role="status" className="fixed inset-x-0 bottom-24 z-40 mx-auto w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-xl">
          {toast}
        </div>
      )}
      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pt-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-xl gap-1.5 rounded-2xl border border-white/10 bg-gray-900/85 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <button type="button" onClick={copyLink} className={`${btn} text-gray-100 hover:bg-white/10`}>
            <Icon d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
            Share link
          </button>
          <button type="button" onClick={() => setDialogOpen(true)} disabled={busy} className={`${btn} text-gray-100 hover:bg-white/10 disabled:opacity-50`}>
            <Icon d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
            {busy ? 'Rendering…' : EXPORT_LABEL[variant]}
          </button>
          <Link to={{ pathname: onBracket ? NFL.predict : NFL.bracket, search: query }} className={`${btn} bg-emerald-400 text-gray-950 hover:bg-emerald-300`}>
            {onBracket ? '← Games' : 'Bracket →'}
          </Link>
        </div>
      </nav>
    </>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
