import { createContext, useContext, useState, useCallback, ReactNode, createElement } from 'react';
import { AppData, Business, Client, Document, Booking, DocumentType } from '../types';
import { loadData, saveData } from '../lib/storage';
import { generateId, generateDocNumber, today, addDays } from '../lib/utils';

interface StoreContextValue {
  data: AppData;
  updateBusiness: (updates: Partial<Business>) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addDocument: (type: DocumentType, clientId: string) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Booking;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  getClient: (id: string) => Client | undefined;
  getDocument: (id: string) => Document | undefined;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData());

  const persist = useCallback((updater: (prev: AppData) => AppData) => {
    setData(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  const updateBusiness = useCallback((updates: Partial<Business>) => {
    persist(d => ({ ...d, business: { ...d.business, ...updates } }));
  }, [persist]);

  const addClient = useCallback((client: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = { ...client, id: generateId(), createdAt: new Date().toISOString() };
    persist(d => ({ ...d, clients: [...d.clients, newClient] }));
    return newClient;
  }, [persist]);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    persist(d => ({ ...d, clients: d.clients.map(c => c.id === id ? { ...c, ...updates } : c) }));
  }, [persist]);

  const deleteClient = useCallback((id: string) => {
    persist(d => ({ ...d, clients: d.clients.filter(c => c.id !== id) }));
  }, [persist]);

  const addDocument = useCallback((type: DocumentType, clientId: string): Document => {
    let newDoc!: Document;
    persist(d => {
      const counter = d.counters[type] + 1;
      const prefixMap = { quotation: d.business.quotationPrefix, invoice: d.business.invoicePrefix, receipt: d.business.receiptPrefix };
      const prefix = prefixMap[type];
      const issueDate = today();
      const dueDate = type === 'quotation' ? addDays(issueDate, 14) : addDays(issueDate, d.business.paymentTermsDays);
      newDoc = {
        id: generateId(),
        type,
        status: 'draft',
        number: generateDocNumber(prefix, counter),
        clientId,
        issueDate,
        dueDate,
        validUntil: type === 'quotation' ? addDays(issueDate, 30) : '',
        lineItems: [],
        subtotal: 0,
        discountPercent: 0,
        discountAmount: 0,
        vatRate: d.business.vatRate,
        vatAmount: 0,
        total: 0,
        notes: '',
        termsAndConditions: d.business.termsAndConditions,
        paymentMethod: '',
        paymentDate: type === 'receipt' ? today() : '',
        paymentReference: '',
        relatedDocumentId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...d, documents: [...d.documents, newDoc], counters: { ...d.counters, [type]: counter } };
    });
    return newDoc;
  }, [persist]);

  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    persist(d => ({
      ...d,
      documents: d.documents.map(doc =>
        doc.id === id ? { ...doc, ...updates, updatedAt: new Date().toISOString() } : doc
      ),
    }));
  }, [persist]);

  const deleteDocument = useCallback((id: string) => {
    persist(d => ({ ...d, documents: d.documents.filter(doc => doc.id !== id) }));
  }, [persist]);

  const addBooking = useCallback((booking: Omit<Booking, 'id' | 'createdAt'>): Booking => {
    const newBooking: Booking = { ...booking, id: generateId(), createdAt: new Date().toISOString() };
    persist(d => ({ ...d, bookings: [...d.bookings, newBooking] }));
    return newBooking;
  }, [persist]);

  const updateBooking = useCallback((id: string, updates: Partial<Booking>) => {
    persist(d => ({ ...d, bookings: d.bookings.map(b => b.id === id ? { ...b, ...updates } : b) }));
  }, [persist]);

  const deleteBooking = useCallback((id: string) => {
    persist(d => ({ ...d, bookings: d.bookings.filter(b => b.id !== id) }));
  }, [persist]);

  const getClient = useCallback((id: string) => data.clients.find(c => c.id === id), [data.clients]);
  const getDocument = useCallback((id: string) => data.documents.find(d => d.id === id), [data.documents]);

  const value: StoreContextValue = {
    data, updateBusiness, addClient, updateClient, deleteClient,
    addDocument, updateDocument, deleteDocument,
    addBooking, updateBooking, deleteBooking,
    getClient, getDocument,
  };

  return createElement(StoreContext.Provider, { value }, children);
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
