import { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { useShareQuery, useStore } from './state/store';
import { Landing } from './pages/Landing';
import { Predict } from './pages/Predict';
import { Bracket } from './pages/Bracket';

/** Mirrors the scenario into ?s= so the address bar is always a shareable link (not on the landing page). */
function UrlSync() {
  const query = useShareQuery();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!query || pathname === '/') return;
    const id = setTimeout(() => {
      const url = `${window.location.pathname}${query}`;
      if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, '', url);
    }, 300);
    return () => clearTimeout(id);
  }, [query, pathname]);
  return null;
}

function Header() {
  const query = useShareQuery();
  const tab = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-gray-100'}`;
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-5 border-b border-white/[0.06] bg-[#070a10]/80 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 text-sm text-gray-950">C</span>
          CLINCH
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to={{ pathname: '/predict', search: query }} className={tab}>Predict</NavLink>
          <NavLink to={{ pathname: '/bracket', search: query }} className={tab}>Bracket</NavLink>
        </nav>
      </div>
    </header>
  );
}

/** Old share links pointed at "/?s=…" — forward them to the predictor. */
function LandingOrRedirect() {
  const { search } = useLocation();
  return new URLSearchParams(search).has('s') ? <Navigate to={`/predict${search}`} replace /> : <Landing />;
}

export default function App() {
  const season = useStore((s) => s.season);
  const error = useStore((s) => s.error);
  const load = useStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <BrowserRouter>
      <div className="min-h-dvh px-4 pb-32">
        <Header />
        <main className="mx-auto max-w-7xl">
          {error && <p className="card p-4 text-sm text-rose-200">{error}</p>}
          {!season && !error && (
            <div className="flex flex-col items-center gap-3 py-24 text-sm text-gray-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
              Loading schedule…
            </div>
          )}
          {season && (
            <>
              <UrlSync />
              <Routes>
                <Route path="/" element={<LandingOrRedirect />} />
                <Route path="/predict" element={<Predict />} />
                <Route path="/bracket" element={<Bracket />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </>
          )}
        </main>
        <footer className="mx-auto mt-14 max-w-7xl text-center text-[11px] text-gray-600">
          Unofficial fan tool · not affiliated with the NFL · team names and colors used for identification only
          {season && <> · data updated {new Date(season.updatedAt).toLocaleString()}</>}
        </footer>
      </div>
    </BrowserRouter>
  );
}
