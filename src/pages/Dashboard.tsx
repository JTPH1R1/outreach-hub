import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, FileText, Users, Clock, CheckCircle, AlertCircle, Calendar, LucideIcon } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS } from '../lib/utils';
import { format, parseISO, startOfMonth, isValid } from 'date-fns';

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: LucideIcon; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="text-lg lg:text-2xl font-bold text-gray-900 mt-1 break-all">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#CC1F27','#3B82F6','#10B981','#F59E0B','#8B5CF6'];

export default function Dashboard() {
  const { data } = useStore();
  const { documents, clients, bookings, business } = data;
  const sym = business.currencySymbol;

  const stats = useMemo(() => {
    const paid = documents.filter(d => d.status === 'paid');
    const pending = documents.filter(d => d.status === 'sent' || d.status === 'accepted');
    const overdue = documents.filter(d => d.status === 'overdue');
    const totalRevenue = paid.reduce((s, d) => s + d.total, 0);
    const totalPending = pending.reduce((s, d) => s + d.total, 0);
    const thisMonth = format(new Date(), 'yyyy-MM');
    const monthRevenue = paid
      .filter(d => d.paymentDate?.startsWith(thisMonth) || d.issueDate?.startsWith(thisMonth))
      .reduce((s, d) => s + d.total, 0);
    return { paid: paid.length, pending: pending.length, overdue: overdue.length, totalRevenue, totalPending, monthRevenue };
  }, [documents]);

  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    documents.filter(d => d.status === 'paid').forEach(d => {
      const dateStr = d.paymentDate || d.issueDate;
      if (!dateStr) return;
      try {
        const d2 = parseISO(dateStr);
        if (!isValid(d2)) return;
        const key = format(startOfMonth(d2), 'yyyy-MM');
        map[key] = (map[key] || 0) + d.total;
      } catch { /* skip */ }
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = format(d, 'yyyy-MM');
      return { month: MONTH_NAMES[d.getMonth()], revenue: map[key] || 0 };
    });
  }, [documents]);

  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    documents.forEach(d => { map[d.status] = (map[d.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name: STATUS_LABELS[name as keyof typeof STATUS_LABELS] || name, value }));
  }, [documents]);

  const recentDocs = useMemo(() =>
    [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [documents]
  );

  const upcomingBookings = useMemo(() =>
    bookings
      .filter(b => b.status !== 'cancelled' && b.date >= format(new Date(), 'yyyy-MM-dd'))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4),
    [bookings]
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's your business overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue, sym)} sub={`${sym} ${(stats.monthRevenue/100).toLocaleString()} this month`} icon={TrendingUp} color="bg-brand-red" />
        <StatCard label="Pending Payment" value={formatCurrency(stats.totalPending, sym)} sub={`${stats.pending} document${stats.pending !== 1 ? 's' : ''}`} icon={Clock} color="bg-amber-500" />
        <StatCard label="Paid Invoices" value={String(stats.paid)} sub="All time" icon={CheckCircle} color="bg-green-500" />
        <StatCard label="Overdue" value={String(stats.overdue)} sub={stats.overdue > 0 ? 'Needs attention' : 'All clear'} icon={AlertCircle} color={stats.overdue > 0 ? 'bg-red-500' : 'bg-gray-400'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Secondary stats */}
        <div className="grid grid-cols-2 gap-3 lg:col-span-1 lg:grid-cols-1 content-start">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500"><Users size={18} className="text-white" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Clients</p>
                <p className="text-xl font-bold">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500"><FileText size={18} className="text-white" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Documents</p>
                <p className="text-xl font-bold">{documents.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500"><Calendar size={18} className="text-white" /></div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Bookings</p>
                <p className="text-xl font-bold">{bookings.length}</p>
              </div>
            </div>
          </div>
          {/* Pie chart */}
          {statusBreakdown.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">By Status</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} paddingAngle={2}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Legend iconSize={8} iconType="circle" formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue chart */}
        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-gray-700 mb-4">Revenue — Last 6 Months</p>
          {monthlyRevenue.every(m => m.revenue === 0) ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No paid invoices yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={monthlyRevenue} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => `${sym} ${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, sym), 'Revenue']}
                  contentStyle={{ border: 'none', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#CC1F27" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
        {/* Recent documents */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">Recent Documents</p>
            <Link to="/documents" className="text-xs text-brand-red hover:underline font-medium">View all</Link>
          </div>
          {recentDocs.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No documents yet. Create your first one!</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentDocs.map(doc => {
                const client = data.clients.find(c => c.id === doc.clientId);
                return (
                  <Link key={doc.id} to={`/documents/${doc.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{doc.number}</p>
                      <p className="text-xs text-gray-400">{client?.name || 'Unknown Client'} · {TYPE_LABELS[doc.type]}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">{formatCurrency(doc.total, sym)}</p>
                      <span className={`badge ${STATUS_COLORS[doc.status]}`}>{STATUS_LABELS[doc.status]}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming bookings */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">Upcoming Bookings</p>
            <Link to="/schedule" className="text-xs text-brand-red hover:underline font-medium">View all</Link>
          </div>
          {upcomingBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No upcoming bookings scheduled</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {upcomingBookings.map(booking => {
                const client = data.clients.find(c => c.id === booking.clientId);
                const statusColors = { pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-400' };
                return (
                  <div key={booking.id} className="px-5 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{booking.title}</p>
                        <p className="text-xs text-gray-400">{client?.name} · {booking.service}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(booking.date)} {booking.startTime && `@ ${booking.startTime}`}</p>
                      </div>
                      <span className={`badge ${statusColors[booking.status]}`}>{booking.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
