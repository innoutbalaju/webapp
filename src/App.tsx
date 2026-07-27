import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { isSupabaseConfigured } from '@/lib/env';
import RootRedirect from '@/pages/RootRedirect';
import SetupPage from '@/pages/SetupPage';
import CheckoutPage from '@/pages/CheckoutPage';
import LoginPage from '@/pages/LoginPage';
import MenuPage from '@/pages/MenuPage';
import StatusPage from '@/pages/StatusPage';
import AdminMenuPage from '@/pages/admin/AdminMenuPage';
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage';
import AdminReportsPage from '@/pages/admin/AdminReportsPage';
import AdminRoomsPage from '@/pages/admin/AdminRoomsPage';
import DocsPage from '@/pages/DocsPage';
import { useSessionStore } from '@/store/sessionStore';

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="rounded-[28px] border border-white/10 bg-slate-900/80 px-6 py-5 text-sm text-slate-300">
        Restoring secure session...
      </div>
    </main>
  );
}

export default function App() {
  useSupabaseAuth();

  const isHydrated = useSessionStore((state) => state.isHydrated);

  if (!isSupabaseConfigured()) {
    return <SetupPage />;
  }

  if (!isHydrated) {
    return <LoadingScreen />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<RootRedirect />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<MenuPage />} path="/menu" />
        <Route element={<CheckoutPage />} path="/checkout" />
        <Route element={<StatusPage />} path="/status" />
        <Route element={<AdminOrdersPage />} path="/admin/orders" />
        <Route element={<AdminRoomsPage />} path="/admin/rooms" />
        <Route element={<AdminMenuPage />} path="/admin/menu" />
        <Route element={<AdminReportsPage />} path="/admin/reports" />
        <Route element={<DocsPage />} path="/docs" />
        <Route element={<Navigate replace to="/admin/orders" />} path="/admin" />
      </Routes>
    </HashRouter>
  );
}
