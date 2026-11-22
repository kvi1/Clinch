export function Trophy({ className = 'h-14 w-14 text-amber-300' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm10 1h2a2 2 0 0 1 0 4h-2M7 5H5a2 2 0 0 0 0 4h2" />
    </svg>
  );
}
