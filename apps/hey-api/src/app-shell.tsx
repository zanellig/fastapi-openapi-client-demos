import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router';

import { getHealth } from './api/generated/sdk.gen';

const navItems = [
  { to: '/', label: 'Desk', end: true },
  { to: '/dispatches', label: 'Dispatches' },
  { to: '/forecast', label: 'Forecast' },
  { to: '/contract', label: 'Contract' },
];

export function AppShell() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    getHealth()
      .then(({ data }) => {
        if (active) {
          setConnected(data?.status === 'ready');
        }
      })
      .catch(() => {
        if (active) {
          setConnected(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="side-rail">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <div>
            <p className="brand-name">Dispatch Desk</p>
            <p className="brand-subtitle">Hey API client</p>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link-active' : 'nav-link'
              }
            >
              <span className="nav-notch" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="connection-readout">
          <span
            className={connected ? 'signal signal-live' : 'signal'}
            aria-hidden="true"
          />
          <div>
            <p>{connected ? 'Contract online' : 'API unavailable'}</p>
            <span>127.0.0.1:8010</span>
          </div>
        </div>
      </aside>

      <div className="work-area">
        <div className="contract-ribbon" role="status">
          <span>FastAPI</span>
          <i aria-hidden="true" />
          <span>/openapi.json</span>
          <i aria-hidden="true" />
          <span>generated SDK</span>
          <i aria-hidden="true" />
          <strong>typed fetch</strong>
        </div>
        <main className="page-frame">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function RouteError() {
  return (
    <main className="route-error">
      <p className="eyebrow">Route not found</p>
      <h1>The desk has no record of this page.</h1>
      <NavLink className="button button-primary" to="/">
        Return to the desk
      </NavLink>
    </main>
  );
}
