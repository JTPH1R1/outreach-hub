import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Eye, ArrowLeft, UserPlus } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { LineItem, Client } from '../types';
import { generateId, formatCurrency, SERVICES, PAYMENT_METHODS, today, addDays } from '../lib/utils';

function ClientModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Client) => void }) {
  const { addClient } = useStore();
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '', city: '', country: 'Malawi', notes: '' });
  function save() {
    if (!form.name.trim()) return;
    const c = addClient(form);
    onSave(c);
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">Add New Client</h2>
        <div className="space-y-3">
          {[['name','Full Name / Contact Person *'],['company','Company Name'],['email','Email'],['phone','Phone'],['address','Address'],['city','City']].map(([k,l]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" value={(form as Record<string,string>)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1" disabled={!form.name.trim()}>Save Client</button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocument, updateDocument, data } = useStore();
  const [showClientModal, setShowClientModal] = useState(false);

  const doc = getDocument(id!);

  useEffect(() => {
    if (!doc) navigate('/documents');
  }, [doc, navigate]);

  const set = useCallback((updates: Partial<typeof doc>) => {
    if (!doc) return;
    updateDocument(doc.id, updates as Parameters<typeof updateDocument>[1]);
  }, [doc, updateDocument]);

  function recalculate(items: LineItem[], discountPct: number, vatRate: number) {
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const discountAmount = Math.round(subtotal * discountPct / 100);
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = Math.round(afterDiscount * vatRate / 100);
    const total = afterDiscount + vatAmount;
    return { subtotal, discountAmount, vatAmount, total };
  }

  function updateItem(itemId: string, field: keyof LineItem, value: string | number) {
    if (!doc) return;
    const items = doc.lineItems.map(item => {
      if (item.id !== itemId) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = Math.round(Number(updated.quantity) * Number(updated.unitPrice));
      }
      return updated;
    });
    const calcs = recalculate(items, doc.discountPercent, doc.vatRate);
    updateDocument(doc.id, { lineItems: items, ...calcs });
  }

  function addItem() {
    if (!doc) return;
    const newItem: LineItem = { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 };
    const items = [...doc.lineItems, newItem];
    const calcs = recalculate(items, doc.discountPercent, doc.vatRate);
    updateDocument(doc.id, { lineItems: items, ...calcs });
  }

  function removeItem(itemId: string) {
    if (!doc) return;
    const items = doc.lineItems.filter(i => i.id !== itemId);
    const calcs = recalculate(items, doc.discountPercent, doc.vatRate);
    updateDocument(doc.id, { lineItems: items, ...calcs });
  }

  function updateDiscount(pct: number) {
    if (!doc) return;
    const calcs = recalculate(doc.lineItems, pct, doc.vatRate);
    updateDocument(doc.id, { discountPercent: pct, ...calcs });
  }

  function updateVat(rate: number) {
    if (!doc) return;
    const calcs = recalculate(doc.lineItems, doc.discountPercent, rate);
    updateDocument(doc.id, { vatRate: rate, ...calcs });
  }

  if (!doc) return null;

  const sym = data.business.currencySymbol;
  const typeLabel = doc.type === 'quotation' ? 'Quotation' : doc.type === 'invoice' ? 'Invoice' : 'Receipt';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} /></button>
          <div>
            <p className="text-sm font-bold text-gray-900">{doc.number}</p>
            <p className="text-xs text-gray-400">{typeLabel} · {doc.status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={doc.status}
            onChange={e => set({ status: e.target.value as typeof doc.status })}
            className="input !w-auto text-xs py-1.5"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={() => navigate(`/documents/${doc.id}`)} className="btn-secondary gap-2">
            <Eye size={15} /> Preview & PDF
          </button>
          <button onClick={() => navigate(`/documents/${doc.id}`)} className="btn-primary gap-2">
            <Save size={15} /> Save & View
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-5">
        {/* Client + Meta */}
        <div className="card p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="label">Bill To *</label>
            <div className="flex gap-2">
              <select
                className="input"
                value={doc.clientId}
                onChange={e => set({ clientId: e.target.value })}
              >
                <option value="">— Select client —</option>
                {data.clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
                ))}
              </select>
              <button
                onClick={() => setShowClientModal(true)}
                className="btn-secondary !px-2.5 shrink-0"
                title="Add new client"
              >
                <UserPlus size={15} />
              </button>
            </div>
            {doc.clientId && (() => {
              const cl = data.clients.find(c => c.id === doc.clientId);
              return cl ? (
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {cl.company && <p className="font-medium text-gray-700">{cl.company}</p>}
                  {cl.email && <p>{cl.email}</p>}
                  {cl.phone && <p>{cl.phone}</p>}
                  {cl.address && <p>{cl.address}{cl.city ? `, ${cl.city}` : ''}</p>}
                </div>
              ) : null;
            })()}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{typeLabel} Number</label>
              <input className="input" value={doc.number} onChange={e => set({ number: e.target.value })} />
            </div>
            <div>
              <label className="label">Issue Date</label>
              <input type="date" className="input" value={doc.issueDate} onChange={e => set({ issueDate: e.target.value })} />
            </div>
            {doc.type !== 'receipt' && (
              <div>
                <label className="label">{doc.type === 'quotation' ? 'Valid Until' : 'Due Date'}</label>
                <input type="date" className="input"
                  value={doc.type === 'quotation' ? doc.validUntil : doc.dueDate}
                  onChange={e => set(doc.type === 'quotation' ? { validUntil: e.target.value } : { dueDate: e.target.value })}
                />
              </div>
            )}
            {doc.type === 'receipt' && (
              <div>
                <label className="label">Payment Date</label>
                <input type="date" className="input" value={doc.paymentDate} onChange={e => set({ paymentDate: e.target.value })} />
              </div>
            )}
            {doc.type === 'receipt' && (
              <div>
                <label className="label">Payment Method</label>
                <select className="input" value={doc.paymentMethod} onChange={e => set({ paymentMethod: e.target.value })}>
                  <option value="">— Select —</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Services / Items</p>
            <button onClick={addItem} className="btn-primary !py-1.5 !text-xs">
              <Plus size={13} /> Add Item
            </button>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-right">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="divide-y divide-gray-50">
            {doc.lineItems.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                No items yet — click "Add Item" to get started
              </div>
            )}
            {doc.lineItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center">
                <div className="col-span-5">
                  <input
                    list={`services-${item.id}`}
                    className="input !text-sm"
                    placeholder="Service or item description"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                  />
                  <datalist id={`services-${item.id}`}>
                    {SERVICES.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0.01" step="0.01"
                    className="input !text-sm text-right"
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number" min="0" step="1"
                    className="input !text-sm text-right"
                    value={item.unitPrice}
                    onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(item.total, sym)}</p>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatCurrency(doc.subtotal, sym)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-500 shrink-0">Discount (%)</span>
                <input
                  type="number" min="0" max="100" step="0.5"
                  className="input !w-20 !text-sm text-right !py-1"
                  value={doc.discountPercent}
                  onChange={e => updateDiscount(parseFloat(e.target.value) || 0)}
                />
                <span className="font-medium text-red-600 shrink-0">-{formatCurrency(doc.discountAmount, sym)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <span className="text-gray-500 shrink-0">VAT (%)</span>
                <input
                  type="number" min="0" max="100" step="0.5"
                  className="input !w-20 !text-sm text-right !py-1"
                  value={doc.vatRate}
                  onChange={e => updateVat(parseFloat(e.target.value) || 0)}
                />
                <span className="font-medium shrink-0">+{formatCurrency(doc.vatAmount, sym)}</span>
              </div>
              <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                <span>TOTAL</span>
                <span className="text-brand-red">{formatCurrency(doc.total, sym)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <label className="label">Notes to Client</label>
            <textarea
              rows={4}
              className="input !resize-none"
              placeholder="Any additional info for the client..."
              value={doc.notes}
              onChange={e => set({ notes: e.target.value })}
            />
          </div>
          <div className="card p-5">
            <label className="label">Terms & Conditions</label>
            <textarea
              rows={4}
              className="input !resize-none"
              placeholder="Payment terms, cancellation policy..."
              value={doc.termsAndConditions}
              onChange={e => set({ termsAndConditions: e.target.value })}
            />
          </div>
        </div>

        {/* Payment reference for receipts */}
        {doc.type === 'receipt' && (
          <div className="card p-5">
            <label className="label">Payment Reference</label>
            <input className="input" placeholder="Transaction ID, M-Pesa code, bank ref..." value={doc.paymentReference} onChange={e => set({ paymentReference: e.target.value })} />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button onClick={() => navigate('/documents')} className="btn-secondary">Cancel</button>
          <button onClick={() => navigate(`/documents/${doc.id}`)} className="btn-primary">
            <Eye size={15} /> Preview & Generate PDF
          </button>
        </div>
      </div>

      {showClientModal && (
        <ClientModal
          onClose={() => setShowClientModal(false)}
          onSave={c => { set({ clientId: c.id }); setShowClientModal(false); }}
        />
      )}
    </div>
  );
}
