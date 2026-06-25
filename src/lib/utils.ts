import { format, parseISO, isValid } from 'date-fns';
import { DocumentStatus, DocumentType } from '../types';

export function formatCurrency(amount: number, symbol = 'MK'): string {
  return `${symbol} ${amount.toLocaleString('en-MW', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function today(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function addDays(dateStr: string, days: number): string {
  const d = parseISO(dateStr);
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateDocNumber(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(3, '0')}`;
}

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  paid: 'Paid',
  partial: 'Partly Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  accepted: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export const TYPE_LABELS: Record<DocumentType, string> = {
  quotation: 'Quotation',
  invoice: 'Invoice',
  receipt: 'Receipt',
};

export const TYPE_COLORS: Record<DocumentType, string> = {
  quotation: 'bg-amber-100 text-amber-700',
  invoice: 'bg-blue-100 text-blue-700',
  receipt: 'bg-green-100 text-green-700',
};

export const SERVICES = [
  'Photography Session',
  'Videography Production',
  'Graphic Design',
  'Brand Activation Package',
  'Social Media Management',
  'Event Coverage',
  'Image Consultancy',
  'Corporate Photography',
  'Product Photography',
  'Portrait Session',
  'Wedding Coverage',
  'Music Video Production',
  'Commercial Video',
  'Logo Design',
  'Print Design',
  'Digital Marketing',
  'Promotional Campaign',
  'Content Creation',
  'Custom Package',
];

export const PAYMENT_METHODS = [
  'Mobile Money (Airtel Money)',
  'Mobile Money (TNM Mpamba)',
  'Bank Transfer',
  'Cash',
  'Cheque',
  'Other',
];

export function clsx(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
