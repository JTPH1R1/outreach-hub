import {
  createContext, useContext, useState, useCallback,
  useEffect, useRef, ReactNode, createElement,
} from 'react';
import { AppData, Business, Client, Document, Booking, DocumentType } from '../types';
import { loadData, saveData, defaultBusiness } from '../lib/storage';
import { generateId, generateDocNumber, today, addDays } from '../lib/utils';
import { supabase } from '../lib/supabase';

// ─── DB mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function clientToDb(c: Client, uid: string) {
  return { id: c.id, user_id: uid, name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, city: c.city, country: c.country, notes: c.notes };
}
function clientFromDb(r: Row): Client {
  return { id: r.id, name: r.name ?? '', company: r.company ?? '', email: r.email ?? '', phone: r.phone ?? '', address: r.address ?? '', city: r.city ?? '', country: r.country ?? '', notes: r.notes ?? '', createdAt: r.created_at ?? '' };
}

function docToDb(d: Document, uid: string) {
  return {
    id: d.id, user_id: uid, type: d.type, status: d.status, number: d.number,
    client_id: d.clientId, issue_date: d.issueDate, due_date: d.dueDate, valid_until: d.validUntil,
    line_items: d.lineItems, subtotal: d.subtotal, discount_percent: d.discountPercent,
    discount_amount: d.discountAmount, vat_rate: d.vatRate, vat_amount: d.vatAmount, total: d.total,
    notes: d.notes, terms_and_conditions: d.termsAndConditions, payment_method: d.paymentMethod,
    payment_date: d.paymentDate, payment_reference: d.paymentReference,
    related_document_id: d.relatedDocumentId, updated_at: new Date().toISOString(),
  };
}
function docFromDb(r: Row): Document {
  return {
    id: r.id, type: r.type, status: r.status, number: r.number,
    clientId: r.client_id ?? '', issueDate: r.issue_date ?? '', dueDate: r.due_date ?? '',
    validUntil: r.valid_until ?? '', lineItems: r.line_items ?? [],
    subtotal: Number(r.subtotal) || 0, discountPercent: Number(r.discount_percent) || 0,
    discountAmount: Number(r.discount_amount) || 0, vatRate: Number(r.vat_rate) || 0,
    vatAmount: Number(r.vat_amount) || 0, total: Number(r.total) || 0,
    notes: r.notes ?? '', termsAndConditions: r.terms_and_conditions ?? '',
    paymentMethod: r.payment_method ?? '', paymentDate: r.payment_date ?? '',
    paymentReference: r.payment_reference ?? '', relatedDocumentId: r.related_document_id ?? '',
    createdAt: r.created_at ?? '', updatedAt: r.updated_at ?? '',
  };
}

function bookingToDb(b: Booking, uid: string) {
  return {
    id: b.id, user_id: uid, title: b.title, client_id: b.clientId, service: b.service,
    date: b.date, start_time: b.startTime, end_time: b.endTime, location: b.location,
    status: b.status, notes: b.notes, document_id: b.documentId, fee: b.fee,
  };
}
function bookingFromDb(r: Row): Booking {
  return {
    id: r.id, title: r.title ?? '', clientId: r.client_id ?? '', service: r.service ?? '',
    date: r.date ?? '', startTime: r.start_time ?? '', endTime: r.end_time ?? '',
    location: r.location ?? '', status: r.status ?? 'pending', notes: r.notes ?? '',
    documentId: r.document_id ?? '', fee: Number(r.fee) || 0, createdAt: r.created_at ?? '',
  };
}

// ─── Load all data from Supabase ─────────────────────────────────────────────

async function loadFromCloud(uid: string): Promise<AppData> {
  const [bizRes, clientsRes, docsRes, bkRes, cntRes] = await Promise.all([
    supabase.from('omg_business').select('data').eq('user_id', uid).maybeSingle(),
    supabase.from('omg_clients').select('*').eq('user_id', uid),
    supabase.from('omg_documents').select('*').eq('user_id', uid),
    supabase.from('omg_bookings').select('*').eq('user_id', uid),
    supabase.from('omg_counters').select('*').eq('user_id', uid).maybeSingle(),
  ]);
  return {
    business:  { ...defaultBusiness, ...(bizRes.data?.data ?? {}) },
    clients:   (clientsRes.data ?? []).map(clientFromDb),
    documents: (docsRes.data ?? []).map(docFromDb),
    bookings:  (bkRes.data ?? []).map(bookingFromDb),
    counters: {
      quotation: cntRes.data?.quotation ?? 0,
      invoice:   cntRes.data?.invoice   ?? 0,
      receipt:   cntRes.data?.receipt   ?? 0,
    },
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface StoreContextValue {
  data: AppData;
  loading: boolean;
  updateBusiness:  (updates: Partial<Business>) => void;
  addClient:       (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient:    (id: string, updates: Partial<Client>) => void;
  deleteClient:    (id: string) => void;
  addDocument:     (type: DocumentType, clientId: string) => Document;
  updateDocument:  (id: string, updates: Partial<Document>) => void;
  deleteDocument:  (id: string) => void;
  addBooking:      (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  updateBooking:   (id: string, updates: Partial<Booking>) => void;
  deleteBooking:   (id: string) => void;
  getClient:       (id: string) => Client | undefined;
  getDocument:     (id: string) => Document | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData]       = useState<AppData>(() => loadData());
  const [loading, setLoading] = useState(true);
  // undefined = auth check in progress | null = logged out | string = user id
  const [userId, setUserId]   = useState<string | null | undefined>(undefined);
  const uidRef                = useRef<string | null>(null);

  useEffect(() => { uidRef.current = userId ?? null; }, [userId]);

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Pull from cloud when user is known ────────────────────────────────────
  useEffect(() => {
    if (userId === undefined) return;
    if (userId === null)      { setLoading(false); return; }
    loadFromCloud(userId)
      .then(cloud => { setData(cloud); saveData(cloud); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  // Synchronously compute next state, persist locally, return it for cloud sync
  function mutate(updater: (prev: AppData) => AppData): AppData {
    let next!: AppData;
    setData(prev => { next = updater(prev); saveData(next); return next; });
    return next;
  }

  function cloudSync(fn: () => PromiseLike<unknown>) {
    Promise.resolve(fn()).catch(e => console.error('cloud sync:', e));
  }

  // ── Business ───────────────────────────────────────────────────────────────
  const updateBusiness = useCallback((updates: Partial<Business>) => {
    const next = mutate(prev => ({ ...prev, business: { ...prev.business, ...updates } }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_business').upsert({ user_id: uid, data: next.business, updated_at: new Date().toISOString() }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Clients ────────────────────────────────────────────────────────────────
  const addClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt'>) => {
    const client: Client = { ...clientData, id: generateId(), createdAt: today() };
    mutate(prev => ({ ...prev, clients: [...prev.clients, client] }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_clients').insert(clientToDb(client, uid)));
    return client;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    mutate(prev => ({ ...prev, clients: prev.clients.map(c => c.id === id ? { ...c, ...updates } : c) }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_clients').update(updates).eq('id', id).eq('user_id', uid));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteClient = useCallback((id: string) => {
    mutate(prev => ({ ...prev, clients: prev.clients.filter(c => c.id !== id) }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_clients').delete().eq('id', id).eq('user_id', uid));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Documents ──────────────────────────────────────────────────────────────
  const addDocument = useCallback((type: DocumentType, clientId: string) => {
    let doc!: Document;
    const next = mutate(prev => {
      const newCounter = prev.counters[type] + 1;
      const biz = prev.business;
      const prefix = type === 'quotation' ? biz.quotationPrefix : type === 'invoice' ? biz.invoicePrefix : biz.receiptPrefix;
      doc = {
        id: generateId(), type, status: 'draft',
        number: generateDocNumber(prefix, newCounter),
        clientId, issueDate: today(),
        dueDate: type === 'invoice' ? addDays(today(), biz.paymentTermsDays) : '',
        validUntil: type === 'quotation' ? addDays(today(), 30) : '',
        lineItems: [], subtotal: 0, discountPercent: 0, discountAmount: 0,
        vatRate: biz.vatRate, vatAmount: 0, total: 0,
        notes: biz.footerNote, termsAndConditions: biz.termsAndConditions,
        paymentMethod: '', paymentDate: '', paymentReference: '', relatedDocumentId: '',
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      return { ...prev, documents: [...prev.documents, doc], counters: { ...prev.counters, [type]: newCounter } };
    });
    const uid = uidRef.current;
    if (uid) {
      cloudSync(() => supabase.from('omg_documents').insert(docToDb(doc, uid)));
      cloudSync(() => supabase.from('omg_counters').upsert({ user_id: uid, ...next.counters }));
    }
    return doc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    let updated!: Document;
    mutate(prev => {
      const docs = prev.documents.map(d => {
        if (d.id !== id) return d;
        updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      });
      return { ...prev, documents: docs };
    });
    const uid = uidRef.current;
    if (uid && updated) cloudSync(() =>
      supabase.from('omg_documents').update(docToDb(updated, uid)).eq('id', id).eq('user_id', uid)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteDocument = useCallback((id: string) => {
    mutate(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_documents').delete().eq('id', id).eq('user_id', uid));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bookings ───────────────────────────────────────────────────────────────
  const addBooking = useCallback((bookingData: Omit<Booking, 'id' | 'createdAt'>) => {
    const booking: Booking = { ...bookingData, id: generateId(), createdAt: today() };
    mutate(prev => ({ ...prev, bookings: [...prev.bookings, booking] }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_bookings').insert(bookingToDb(booking, uid)));
    return booking;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    mutate(prev => ({ ...prev, bookings: prev.bookings.map(b => b.id === id ? { ...b, ...updates } : b) }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_bookings').update(updates).eq('id', id).eq('user_id', uid));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteBooking = useCallback((id: string) => {
    mutate(prev => ({ ...prev, bookings: prev.bookings.filter(b => b.id !== id) }));
    const uid = uidRef.current;
    if (uid) cloudSync(() => supabase.from('omg_bookings').delete().eq('id', id).eq('user_id', uid));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getClient   = useCallback((id: string) => data.clients.find(c => c.id === id),   [data.clients]);
  const getDocument = useCallback((id: string) => data.documents.find(d => d.id === id), [data.documents]);

  return createElement(StoreContext.Provider, {
    value: {
      data, loading,
      updateBusiness, addClient, updateClient, deleteClient,
      addDocument, updateDocument, deleteDocument,
      addBooking, updateBooking, deleteBooking,
      getClient, getDocument,
    },
  }, children);
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
