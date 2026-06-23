import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, X, MapPin, Clock, Trash2, Edit, Check } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatDate, SERVICES, today, generateId } from '../lib/utils';
import { Booking, BookingStatus } from '../types';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore, isValid } from 'date-fns';

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border border-blue-200',
  completed: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-gray-100 text-gray-400 border border-gray-200',
};

function BookingModal({ existing, onClose, onSave }: {
  existing?: Booking;
  onClose: () => void;
  onSave: () => void;
}) {
  const { addBooking, updateBooking, data } = useStore();
  const [form, setForm] = useState({
    title: existing?.title || '',
    clientId: existing?.clientId || '',
    service: existing?.service || '',
    date: existing?.date || today(),
    startTime: existing?.startTime || '09:00',
    endTime: existing?.endTime || '11:00',
    location: existing?.location || '',
    status: existing?.status || 'pending' as BookingStatus,
    notes: existing?.notes || '',
    fee: existing?.fee || 0,
    documentId: existing?.documentId || '',
  });
  const [error, setError] = useState('');

  function save() {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.date) { setError('Date is required'); return; }
    if (existing) updateBooking(existing.id, form);
    else addBooking(form);
    onSave();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{existing ? 'Edit Booking' : 'New Booking'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="label">Booking Title *</label>
            <input className="input" placeholder="e.g. Corporate Shoot — ABC Ltd" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="label">Client</label>
            <select className="input" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
              <option value="">— Select client —</option>
              {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Service Type</label>
            <input list="booking-services" className="input" value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder="Select or type..." />
            <datalist id="booking-services">{SERVICES.map(s => <option key={s} value={s} />)}</datalist>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="label">Start Time</label>
              <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="label">End Time</label>
              <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" placeholder="Venue or address" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as BookingStatus }))}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label">Fee (MK)</label>
              <input type="number" min="0" className="input" value={form.fee} onChange={e => setForm(f => ({ ...f, fee: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="label">Linked Document</label>
            <select className="input" value={form.documentId} onChange={e => setForm(f => ({ ...f, documentId: e.target.value }))}>
              <option value="">— None —</option>
              {data.documents.map(d => {
                const c = data.clients.find(cl => cl.id === d.clientId);
                return <option key={d.id} value={d.id}>{d.number} — {c?.name || 'Unknown'}</option>;
              })}
            </select>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea rows={3} className="input !resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Shoot requirements, special instructions..." />
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} className="btn-primary flex-1">{existing ? 'Save Changes' : 'Add Booking'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Schedule() {
  const { data, deleteBooking, updateBooking } = useStore();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Booking | undefined>();
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [calMonth, setCalMonth] = useState(new Date());

  const filtered = useMemo(() =>
    [...data.bookings]
      .filter(b => statusFilter === 'all' || b.status === statusFilter)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [data.bookings, statusFilter]
  );

  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    data.bookings.forEach(b => {
      map[b.date] = map[b.date] || [];
      map[b.date].push(b);
    });
    return map;
  }, [data.bookings]);

  const upcoming = data.bookings.filter(b => b.status !== 'cancelled' && b.date >= today()).length;
  const thisMonthRevenue = data.bookings
    .filter(b => b.status === 'completed' && b.date.startsWith(format(new Date(), 'yyyy-MM')))
    .reduce((s, b) => s + b.fee, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule & Bookings</h1>
          <p className="text-sm text-gray-500 mt-1">{upcoming} upcoming · MK {thisMonthRevenue.toLocaleString()} earned this month</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['list','calendar'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-sm font-medium transition-colors ${view === v ? 'bg-brand-red text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditing(undefined); setShowModal(true); }} className="btn-primary">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all','pending','confirmed','completed','cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="card p-12 text-center text-gray-400 text-sm">
              No bookings {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}. Add your first booking!
            </div>
          )}
          {filtered.map(booking => {
            const client = data.clients.find(c => c.id === booking.clientId);
            const isPast = booking.date < today();
            return (
              <div key={booking.id} className={`card p-4 flex items-start justify-between gap-4 ${isPast && booking.status !== 'completed' ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  {/* Date block */}
                  <div className={`shrink-0 w-14 rounded-xl text-center py-2 ${isToday(parseISO(booking.date)) ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-700'}`}>
                    <div className="text-xs font-medium uppercase">{format(parseISO(booking.date), 'MMM')}</div>
                    <div className="text-xl font-bold leading-none">{format(parseISO(booking.date), 'd')}</div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{booking.title}</p>
                    <p className="text-sm text-gray-500">{client?.name || 'No client'}{booking.service ? ` · ${booking.service}` : ''}</p>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-400">
                      {booking.startTime && <span className="flex items-center gap-1"><Clock size={11} />{booking.startTime}{booking.endTime ? ` – ${booking.endTime}` : ''}</span>}
                      {booking.location && <span className="flex items-center gap-1"><MapPin size={11} />{booking.location}</span>}
                      {booking.fee > 0 && <span className="font-semibold text-gray-600">MK {booking.fee.toLocaleString()}</span>}
                    </div>
                    {booking.notes && <p className="text-xs text-gray-400 mt-1 italic">{booking.notes}</p>}
                    {booking.documentId && (
                      <Link to={`/documents/${booking.documentId}`} className="text-xs text-brand-red hover:underline mt-1 inline-block">
                        View linked document →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`badge ${STATUS_STYLES[booking.status]}`}>{booking.status}</span>
                  <div className="flex gap-1">
                    {booking.status === 'confirmed' && (
                      <button onClick={() => updateBooking(booking.id, { status: 'completed' })} className="p-1.5 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-lg transition-colors" title="Mark completed">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => { setEditing(booking); setShowModal(true); }} className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => { if(confirm('Delete this booking?')) deleteBooking(booking.id); }} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar view */
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="btn-ghost">←</button>
            <p className="font-semibold text-gray-800">{format(calMonth, 'MMMM yyyy')}</p>
            <button onClick={() => setCalMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="btn-ghost">→</button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-50">
            {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
              <div key={d} className="text-center py-2 text-xs font-semibold text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {/* Empty cells for first week */}
            {Array.from({ length: (calDays[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-r border-b border-gray-50" />
            ))}
            {calDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDate[dateStr] || [];
              return (
                <div key={dateStr} className={`h-24 border-r border-b border-gray-50 p-1.5 ${isToday(day) ? 'bg-red-50' : ''}`}>
                  <p className={`text-xs font-bold mb-1 ${isToday(day) ? 'text-brand-red' : 'text-gray-500'}`}>
                    {format(day, 'd')}
                  </p>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 2).map(b => (
                      <div key={b.id} className={`text-xs px-1 py-0.5 rounded truncate font-medium ${STATUS_STYLES[b.status]}`}>
                        {b.title}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <p className="text-xs text-gray-400 pl-1">+{dayBookings.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <BookingModal
          existing={editing}
          onClose={() => { setShowModal(false); setEditing(undefined); }}
          onSave={() => { setShowModal(false); setEditing(undefined); }}
        />
      )}
    </div>
  );
}
