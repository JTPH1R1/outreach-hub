import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import logoWhite from '../../assets/logo-white.png';

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — always visible on lg+, slide-in drawer on mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30
          transform transition-transform duration-250 ease-in-out
          lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </aside>

      {/* Page content */}
      <div className="flex flex-col flex-1 min-h-screen lg:ml-60">

        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-10 flex items-center gap-3 h-14 px-4 bg-brand-black border-b border-white/10">
          <button
            onClick={() => setOpen(true)}
            className="text-white/80 hover:text-white p-1 -ml-1"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <img src={logoWhite} alt="Outreach Media Group" className="h-7 object-contain" />
        </header>

        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
