import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useStore } from '../../state/store';
import { MAX_NAME_LENGTH } from '../../lib/format';

const PREVIEW_WIDTH = 260;
const SCALE = PREVIEW_WIDTH / 1080;

interface Props {
  open: boolean;
  busy: boolean;
  title: string;
  onClose: () => void;
  onExport: () => void;
  /** A ShareCard element; rendered scaled down as a live preview. */
  preview: ReactNode;
}

/** Bottom sheet (phones) / centered dialog (desktop): name the card, preview it, export it. */
export function ExportDialog({ open, busy, title, onClose, onExport, preview }: Props) {
  const name = useStore((s) => s.displayName);
  const setName = useStore((s) => s.setDisplayName);
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-gray-900 p-5 shadow-2xl outline-none sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-black text-white uppercase italic">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-white/10 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mx-auto mb-4 overflow-hidden rounded-xl ring-1 ring-white/10" style={{ width: PREVIEW_WIDTH, height: 1350 * SCALE }} aria-hidden>
          <div style={{ width: 1080, height: 1350, transform: `scale(${SCALE})`, transformOrigin: 'top left' }}>{preview}</div>
        </div>

        <label htmlFor={inputId} className="mb-1.5 block text-xs font-semibold tracking-wider text-gray-400 uppercase">
          Your name <span className="font-normal text-gray-500 normal-case">(optional)</span>
        </label>
        <input
          id={inputId}
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && onExport()}
          placeholder="e.g. Kartik or @giantsfan"
          autoComplete="nickname"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-gray-600 focus:border-emerald-400 focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-gray-500">Shown at the top of the image. Saved on this device only — never in shared links.</p>

        <button
          type="button"
          onClick={onExport}
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-emerald-400 py-3 font-display text-lg font-black tracking-wide text-gray-950 uppercase italic transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {busy ? 'Rendering…' : 'Save image'}
        </button>
      </div>
    </div>
  );
}
