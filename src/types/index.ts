export type DocumentType = 'quotation' | 'invoice' | 'receipt';
export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'paid' | 'overdue' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Business {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  logo: string;
  vatNumber: string;
  currency: string;
  currencySymbol: string;
  vatRate: number;
  paymentTermsDays: number;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  mobileMoneyNumber: string;
  footerNote: string;
  termsAndConditions: string;
  invoicePrefix: string;
  quotationPrefix: string;
  receiptPrefix: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  createdAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Document {
  id: string;
  type: DocumentType;
  status: DocumentStatus;
  number: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  validUntil: string;
  lineItems: LineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  total: number;
  notes: string;
  termsAndConditions: string;
  paymentMethod: string;
  paymentDate: string;
  paymentReference: string;
  relatedDocumentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  title: string;
  clientId: string;
  service: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: BookingStatus;
  notes: string;
  documentId: string;
  fee: number;
  createdAt: string;
}

export interface AppCounters {
  quotation: number;
  invoice: number;
  receipt: number;
}

export interface AppData {
  business: Business;
  clients: Client[];
  documents: Document[];
  bookings: Booking[];
  counters: AppCounters;
}
