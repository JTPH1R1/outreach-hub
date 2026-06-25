import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { StoreProvider } from './hooks/useStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import DocumentEditor from './pages/DocumentEditor';
import DocumentView from './pages/DocumentView';
import Clients from './pages/Clients';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import logoWhite from './assets/logo-white.png';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export default function App() {
  const [auth, setAuth] = useState<AuthState>('loading');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session ? 'authenticated' : 'unauthenticated');
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setAuth(session ? 'authenticated' : 'unauthenticated');
    });
    return () => subscription.unsubscribe();
  }, []);

  // Checking session
  if (auth === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-black gap-4">
        <img src={logoWhite} alt="OMG" className="h-12 object-contain animate-pulse" />
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  // Not logged in
  if (auth === 'unauthenticated') {
    return <Login />;
  }

  // Logged in — full app
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"                    element={<Dashboard />} />
            <Route path="/documents"           element={<Documents />} />
            <Route path="/documents/:id"       element={<DocumentView />} />
            <Route path="/documents/:id/edit"  element={<DocumentEditor />} />
            <Route path="/clients"             element={<Clients />} />
            <Route path="/schedule"            element={<Schedule />} />
            <Route path="/settings"            element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
