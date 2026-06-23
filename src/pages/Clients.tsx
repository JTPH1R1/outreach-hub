import { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, FileText, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, formatDate } from '../lib/utils';
import { Client } from '../types';

const empty: Omit<Client, 'id' | 'createdAt'> = {
  name: '', company: '', email: '', phone: '',
  address: '', city: '', country: 'Malawi', notes: '',
};

function ClientModal({ existing, onClose, onSave }: {
  existing?: Client;
  onClose: () => void;
  onSave: () => void;
}) {
  const { addClient, updateClient } = useStore();
  const [form, setForm] = useState<Omit<Client, 'id' | 'createdAt'>>(
    existing ? { name: existing.name, company: existing.company, email: existing.email, phone: existing.phone, address: existing.address, city: existing.city, country: existing.country, notes: existing.notes } : { ...empty }
  );
  const [error, setError] = useState('');

  function save() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    if (existing) updateClient(existing.id, form);
    else addClient(form);
    onSave();
  }

  const fields: [keyof typeof form, string, string?][] = [
    ['name', 'Full Name / Contact Person *'],
    ['company', 'Company / Business Name'],
    ['email', 'Email Address'],
    ['phone', 'Phone Number'],
    ['address', 'Physical Address'],
    ['city', 'City'],
    ['country', 'Country'],
    ['notes', 'Internal Notes'],
  ];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{existing ? 'Edit Client' : 'Add Client'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <div className="space-y-3">
          {fields.map(([k, l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              {k === 'notes' ? (
                <textarea rows={2} className="input !resize-none" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              ) : (
                <input className="input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">{existing ? 'Save Changes' : 'Add Client'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Clients() {
  const { data, deleteClient } = useStore();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | undefined>();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === '1') setShowModal(true);
  }, [location.search]);

  const filtered = useMemo(() =>
    data.clients.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.clients, search]
  );

  function handleDelete(id: string) {
    const linked = data.documents.filter(d => d.clientId === id).length;
    if (linked > 0 && !confirm(`This client has ${linked} document(s). Delete anyway?`)) return;
    deleteClient(id);
    if (selected === id) setSelected(null);
  }

  const selectedClient = selected ? data.clients.find(c => c.id === selected) : null;
  const clientDocs = selected ? data.documents.filter(d => d.clientId === selected).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const sym = data.business.currencySymbol;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{data.clients.length} client{data.clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input className="input !pl-9 max-w-sm" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-5">
        {/* Client list */}
        <div className="flex-1 card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">{data.clients.length === 0 ? 'No clients yet. Add your first client to get started.' : 'No clients match your search.'}</p>
              {data.clients.length === 0 && (
                <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
                  <Plus size={16} /> Add First Client
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(client => {
                const docCount = data.documents.filter(d => d.clientId === client.id).length;
                const revenue = data.documents.filter(d => d.clientId === client.id && d.status === 'paid').reduce((s, d) => s + d.total, 0);
                return (
                  <div
                    key={client.id}
                    onClick={() => setSelected(s => s === client.id ? null : client.id)}
                    className={`flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${selected === client.id ? 'bg-red-50 border-l-2 border-brand-red' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{client.name}</p>
                        {client.company && <p className="text-xs text-gray-400">{client.company}</p>}
                        {client.email && <p className="text-xs text-gray-400">{client.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{docCount} doc{docCount !== 1 ? 's' : ''}</p>
                        <p className="text-xs font-semibold text-gray-700">{formatCurrency(revenue, sym)}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setEditing(client); setShowModal(true); }} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Client detail */}
        {selectedClient && (
          <div className="w-72 space-y-4 shrink-0">
            <div className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-brand-red flex items-center justify-center text-white text-xl font-bold">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(selectedClient); setShowModal(true); }} className="btn-ghost !px-2 !py-1"><Edit size={14} /></button>
                  <button onClick={() => handleDelete(selectedClient.id)} className="btn-ghost !px-2 !py-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
              <h3 className="font-bold text-gray-900">{selectedClient.name}</h3>
              {selectedClient.company && <p className="text-sm text-gray-500">{selectedClient.company}</p>}
              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                {selectedClient.email && <p>✉ {selectedClient.email}</p>}
                {selectedClient.phone && <p>📞 {selectedClient.phone}</p>}
                {selectedClient.address && <p>📍 {selectedClient.address}{selectedClient.city ? `, ${selectedClient.city}` : ''}</p>}
                {selectedClient.notes && <p className="mt-2 text-gray-400 italic">{selectedClient.notes}</p>}
              </div>
              <p className="text-xs text-gray-300 mt-3">Client since {formatDate(selectedClient.createdAt)}</p>
            </div>

            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Documents</p>
                <span className="text-xs text-gray-400">{clientDocs.length}</span>
              </div>
              {clientDocs.length === 0 ? (
                <p className="text-xs text-gray-400 p-4">No documents yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {clientDocs.slice(0, 5).map(doc => (
                    <Link key={doc.id} to={`/documents/${doc.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{doc.number}</p>
                        <p className="text-xs text-gray-400">{doc.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{formatCurrency(doc.total, sym)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ClientModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
          onSave={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}
