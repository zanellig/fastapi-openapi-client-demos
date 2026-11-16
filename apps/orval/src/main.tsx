import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { AppShell, RouteError } from './app-shell';
import { ContractPage } from './pages/contract';
import { DashboardPage } from './pages/dashboard';
import { DispatchDetailPage } from './pages/dispatch-detail';
import { DispatchesPage } from './pages/dispatches';
import { ForecastPage } from './pages/forecast';
import './styles.css';

// Orval's fetch client resolves non-2xx responses as `{ data, status, headers }`
// instead of throwing, so TanStack Query caches them as successful data. Keep
// only 2xx responses fresh; anything else goes stale immediately.
const isSuccessfulResponse = (data: unknown): boolean => {
  if (typeof data !== 'object' || data === null || !('status' in data)) {
    return false;
  }
  const { status } = data;
  return typeof status === 'number' && status >= 200 && status < 300;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: (query) =>
        isSuccessfulResponse(query.state.data) ? 30_000 : 0,
    },
  },
});

const router = createBrowserRouter([
  {
    path: '/',
    Component: AppShell,
    errorElement: <RouteError />,
    children: [
      { index: true, Component: DashboardPage },
      { path: 'dispatches', Component: DispatchesPage },
      { path: 'dispatches/:dispatchId', Component: DispatchDetailPage },
      { path: 'forecast', Component: ForecastPage },
      { path: 'contract', Component: ContractPage },
    ],
  },
]);

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Application root element is missing');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
