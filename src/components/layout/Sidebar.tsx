import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Users, Calendar, Settings,
  Receipt, Plus, ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import logoWhite from '../../assets/logo-white.png';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { addDocument, data } = useStore();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);

  function handleNew(type: 'quotation' | 'invoice' | 'receipt') {
    setShowNew(false);
    if (data.clients.length === 0) {
      navigate('/clients?new=1');
      return;
    }
    const firstClient = data.clients[0];
    const doc = addDocument(type, firstClient.id);
    navigate(`/documents/${doc.id}/edit`);
  }

  return (
    <aside className="w-60 min-h-screen bg-brand-black flex flex-col fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/10">
        <img src={logoWhite} alt="Outreach Media Group" className="h-10 object-contain" />
      </div>

      {/* New Document */}
      <div className="px-3 pt-4 pb-2 relative">
        <button
          onClick={() => setShowNew(v => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors"
        >
          <span className="flex items-center gap-2"><Plus size={15} /> New Document</span>
          <ChevronDown size={14} className={`transition-transform ${showNew ? 'rotate-180' : ''}`} />
        </button>
        {showNew && (
          <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50">
            {(['quotation', 'invoice', 'receipt'] as const).map(type => (
              <button
                key={type}
                onClick={() => handleNew(type)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 capitalize font-medium transition-colors"
              >
                {type === 'quotation' ? '📋 Quotation' : type === 'invoice' ? '🧾 Invoice' : '✅ Receipt'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-red text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-gray-500">OMG Hub v1.0</p>
        <p className="text-xs text-gray-600 mt-0.5">Outreach Media Group</p>
      </div>
    </aside>
  );
}
