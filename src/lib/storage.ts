import { AppData, Business } from '../types';

const STORAGE_KEY = 'omg_hub_v1';

export const defaultBusiness: Business = {
  name: 'Outreach Media Group',
  tagline: 'Media Production & Image Consultancy',
  email: 'info@outreachmediagroup.com',
  phone: '+265 xxx xxx xxx',
  address: 'Lilongwe, Malawi',
  city: 'Lilongwe',
  country: 'Malawi',
  website: 'www.outreachmediagroup.com',
  logo: '',
  vatNumber: '',
  currency: 'MWK',
  currencySymbol: 'MK',
  vatRate: 16.5,
  paymentTermsDays: 14,
  bankName: '',
  bankAccount: '',
  bankBranch: '',
  mobileMoneyNumber: '',
  footerNote: 'Thank you for choosing Outreach Media Group. We look forward to serving you.',
  termsAndConditions:
    '1. Payment is due within the agreed terms.\n2. All creative assets remain property of Outreach Media Group until full payment is received.\n3. Cancellations must be made 48 hours in advance.\n4. Prices are subject to change without prior notice.',
  invoicePrefix: 'OMG-INV',
  quotationPrefix: 'OMG-Q',
  receiptPrefix: 'OMG-REC',
};

const defaultData: AppData = {
  business: defaultBusiness,
  clients: [],
  documents: [],
  bookings: [],
  counters: { quotation: 0, invoice: 0, receipt: 0 },
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      // merge in any new default fields
      return {
        ...defaultData,
        ...parsed,
        business: { ...defaultBusiness, ...parsed.business },
        counters: { ...defaultData.counters, ...parsed.counters },
      };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultData };
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
