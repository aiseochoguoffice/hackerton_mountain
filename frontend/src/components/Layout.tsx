import { NavLink, Outlet } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';

const navItems = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/mountains', label: '산 목록', icon: '🏔️' },
  { to: '/checklist', label: '체크', icon: '✅' },
  { to: '/risk-map', label: '지도', icon: '🗺️' },
];

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <span>🏔️</span>
            <span>산행 안전 지도</span>
          </NavLink>
          <nav className="hidden gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/accident-types"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              사고 유형
            </NavLink>
            <NavLink
              to="/stats"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              통계
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-28 md:pb-6">
        <Outlet />
      </main>

      <div className="hidden md:block">
        <SiteFooter />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
        <nav>
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center px-3 py-1 text-xs ${
                    isActive ? 'text-emerald-700' : 'text-slate-500'
                  }`
                }
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <SiteFooter />
      </div>
    </div>
  );
}
