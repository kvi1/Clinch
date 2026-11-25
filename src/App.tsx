import { useEffect } from 'react';
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/react';
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { useShareQuery, useStore } from './state/store';
import { Landing } from './pages/Landing';
import { Predict } from './pages/Predict';
import { Bracket } from './pages/Bracket';
import { NFL } from './routes';
import logo from './assets/logo.png';

/** New page → start at the top. Back/forward (POP) keeps the browser's restored scroll position. */
function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    if (navType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navType]);
  return null;
}

/** Mirrors the scenario into ?s= so the address bar is always a shareable link (not on the landing page). */
function UrlSync() {
  const query = useShareQuery();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!query || pathname === NFL.home) return;
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
        <div className="flex items-center gap-2.5">
          <Link to={NFL.home} className="flex items-center gap-2" aria-label="Clinch home">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
            <span className="-skew-x-12 bg-emerald-400 px-2 py-0.5">
              <span className="block skew-x-12 font-display text-2xl leading-none font-black text-gray-950 italic">CLINCH</span>
            </span>
          </Link>
          <span className="rounded border border-white/15 px-1.5 py-0.5 font-display text-xs font-bold tracking-widest text-gray-300">NFL</span>
        </div>
        <nav className="flex items-center gap-1">
          <NavLink to={{ pathname: NFL.predict, search: query }} className={tab}>Predict</NavLink>
          <NavLink to={{ pathname: NFL.bracket, search: query }} className={tab}>Bracket</NavLink>
        </nav>
      </div>
    </header>
  );
}

/** A link carrying a scenario (?s=…) to a landing page opens the predictor; otherwise show the NFL home. */
function LandingOrRedirect() {
  const { search } = useLocation();
  return new URLSearchParams(search).has('s') ? <Navigate to={`${NFL.predict}${search}`} replace /> : <Landing />;
}

/** Redirect that keeps the query string (so shared scenarios survive). */
function Forward({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

/** Report pages without their ?s= scenario so analytics groups by page and never stores anyone's picks. */
const stripQuery = (event: BeforeSendEvent): BeforeSendEvent => {
  const url = new URL(event.url);
  url.search = '';
  url.hash = '';
  return { ...event, url: url.toString() };
};

export default function App() {
  const season = useStore((s) => s.season);
  const error = useStore((s) => s.error);
  const load = useStore((s) => s.load);
  useEffect(() => {
    load();
  }, [load]);

  return (
    <BrowserRouter>
      <Analytics beforeSend={stripQuery} />
      <ScrollToTop />
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
                {/* "/" becomes a sport picker once there's more than one league. */}
                <Route path="/" element={<Forward to={NFL.home} />} />
                <Route path={NFL.home} element={<LandingOrRedirect />} />
                <Route path={NFL.predict} element={<Predict />} />
                <Route path={NFL.bracket} element={<Bracket />} />
                {/* Pre-/nfl paths. */}
                <Route path="/predict" element={<Forward to={NFL.predict} />} />
                <Route path="/bracket" element={<Forward to={NFL.bracket} />} />
                <Route path="*" element={<Navigate to={NFL.home} replace />} />
              </Routes>
            </>
          )}
        </main>
        <footer className="mx-auto mt-14 max-w-7xl text-center text-[11px] text-gray-600">
          Unofficial fan tool · not affiliated with the NFL · team names and colors used for identification only.
          Made by Kartik
          {season && <> · data updated {new Date(season.updatedAt).toLocaleString()}</>}
          <div className="mt-1">
            Schedule &amp; scores from{' '}
            <a href="https://github.com/nflverse/nflverse-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">nflverse</a>
            {' '}(<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">CC BY 4.0</a>)
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
