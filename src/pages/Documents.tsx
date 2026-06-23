import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Edit, Eye, ChevronDown } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TYPE_LABELS } from '../lib/utils';
import { DocumentType, DocumentStatus } from '../types';

export default function Documents() {
  const { data, addDocument, deleteDocument } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [showNewMenu, setShowNewMenu] = useState(false);

  const sym = data.business.currencySymbol;

  const filtered = useMemo(() => {
    return [...data.documents]
      .filter(doc => {
        if (typeFilter !== 'all' && doc.type !== typeFilter) return false;
        if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
        if (search) {
          const client = data.clients.find(c => c.id === doc.clientId);
          const q = search.toLowerCase();
          return doc.number.toLowerCase().includes(q) ||
            client?.name.toLowerCase().includes(q) ||
            client?.company?.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.documents, data.clients, search, typeFilter, statusFilter]);

  function handleNew(type: DocumentType) {
    setShowNewMenu(false);
    if (data.clients.length === 0) {
      navigate('/clients?new=1');
      return;
    }
    const doc = addDocument(type, data.clients[0].id);
    navigate(`/documents/${doc.id}/edit`);
  }

  function handleDelete(id: string, e: React.MouseEvent) {
    e.preventDefault();
    if (confirm('Delete this document? This cannot be undone.')) deleteDocument(id);
  }

  const totals = useMemo(() => {
    const paid = data.documents.filter(d => d.status === 'paid').reduce((s, d) => s + d.total, 0);
    const pending = data.documents.filter(d => ['sent','accepted'].includes(d.status)).reduce((s, d) => s + d.total, 0);
    const overdue = data.documents.filter(d => d.status === 'overdue').reduce((s, d) => s + d.total, 0);
    return { paid, pending, overdue };
  }, [data.documents]);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">{data.documents.length} total · {filtered.length} shown</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowNewMenu(v => !v)}
            className="btn-primary"
          >
            <Plus size={16} /> New <ChevronDown size={14} className={`transition-transform ${showNewMenu ? 'rotate-180' : ''}`} />
          </button>
          {showNewMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-20 w-44">
              {(['quotation','invoice','receipt'] as DocumentType[]).map(type => (
                <button key={type} onClick={() => handleNew(type)} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 font-medium capitalize transition-colors">
                  {type === 'quotation' ? '📋' : type === 'invoice' ? '🧾' : '✅'} {TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Revenue (Paid)', value: totals.paid, color: 'border-l-4 border-green-500' },
          { label: 'Awaiting Payment', value: totals.pending, color: 'border-l-4 border-amber-400' },
          { label: 'Overdue', value: totals.overdue, color: 'border-l-4 border-red-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`card p-4 ${color}`}>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(value, sym)}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input !pl-9"
            placeholder="Search by number or client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input !w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}>
          <option value="all">All types</option>
          <option value="quotation">Quotations</option>
          <option value="invoice">Invoices</option>
          <option value="receipt">Receipts</option>
        </select>
        <select className="input !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABELS) as DocumentStatus[]).map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    {data.documents.length === 0
                      ? 'No documents yet. Create your first quotation or invoice!'
                      : 'No documents match your filters.'
                    }
                  </td>
                </tr>
              )}
              {filtered.map(doc => {
                const client = data.clients.find(c => c.id === doc.clientId);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-4 py-3">
                      <Link to={`/documents/${doc.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-red transition-colors">
                        {doc.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-800 font-medium">{client?.name || '—'}</p>
                      {client?.company && <p className="text-xs text-gray-400">{client.company}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${TYPE_COLORS[doc.type]}`}>{TYPE_LABELS[doc.type]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[doc.status]}`}>{STATUS_LABELS[doc.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(doc.issueDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(doc.total, sym)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/documents/${doc.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                          <Eye size={14} />
                        </Link>
                        <Link to={`/documents/${doc.id}/edit`} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                          <Edit size={14} />
                        </Link>
                        <button onClick={e => handleDelete(doc.id, e)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
