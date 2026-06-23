import { useState, useRef } from 'react';
import { Save, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { Business } from '../types';
import logoDefault from '../assets/logo.png';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-gray-800 mb-4 pb-3 border-b border-gray-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const { data, updateBusiness } = useStore();
  const [form, setForm] = useState<Business>({ ...data.business });
  const [saved, setSaved] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  function set(key: keyof Business, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleSave() {
    updateBusiness(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const b64 = ev.target?.result as string;
      setForm(f => ({ ...f, logo: b64 }));
    };
    reader.readAsDataURL(file);
  }

  function handleClearData() {
    if (!confirm('This will PERMANENTLY delete all clients, documents, and bookings. Are you absolutely sure?')) return;
    if (!confirm('Second confirmation: delete everything?')) return;
    localStorage.clear();
    window.location.reload();
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure your business profile and document defaults</p>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save size={15} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl font-medium">
          ✓ Settings saved successfully
        </div>
      )}

      {/* Logo */}
      <Section title="Business Logo">
        <div className="flex items-start gap-6">
          <div className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
            {form.logo ? (
              <img src={form.logo} alt="Logo" className="max-h-20 max-w-full object-contain" />
            ) : (
              <img src={logoDefault} alt="Default logo" className="max-h-20 max-w-full object-contain opacity-50" />
            )}
          </div>
          <div className="space-y-2">
            <button onClick={() => logoRef.current?.click()} className="btn-secondary">
              <Upload size={14} /> Upload Logo
            </button>
            {form.logo && (
              <button onClick={() => setForm(f => ({ ...f, logo: '' }))} className="btn-ghost text-red-500 hover:bg-red-50 block">
                <Trash2 size={14} /> Remove
              </button>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            <p className="text-xs text-gray-400">PNG or JPG. Will appear on all documents.</p>
          </div>
        </div>
      </Section>

      {/* Business info */}
      <Section title="Business Information">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Business Name">
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Tagline / Description">
            <input className="input" value={form.tagline} onChange={e => set('tagline', e.target.value)} />
          </Field>
          <Field label="Email Address">
            <input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} />
          </Field>
          <Field label="Phone Number">
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Physical Address">
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="City">
            <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
          </Field>
          <Field label="Country">
            <input className="input" value={form.country} onChange={e => set('country', e.target.value)} />
          </Field>
          <Field label="Website">
            <input className="input" value={form.website} onChange={e => set('website', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Financial settings */}
      <Section title="Financial Settings">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Currency Code" hint="e.g. MWK, USD, ZAR">
            <input className="input" value={form.currency} onChange={e => set('currency', e.target.value)} />
          </Field>
          <Field label="Currency Symbol" hint="e.g. MK, $, R">
            <input className="input" value={form.currencySymbol} onChange={e => set('currencySymbol', e.target.value)} />
          </Field>
          <Field label="Default VAT Rate (%)" hint="Applied to new documents">
            <input type="number" min="0" max="100" step="0.5" className="input" value={form.vatRate} onChange={e => set('vatRate', parseFloat(e.target.value) || 0)} />
          </Field>
          <Field label="VAT / Tax Number">
            <input className="input" value={form.vatNumber} onChange={e => set('vatNumber', e.target.value)} />
          </Field>
          <Field label="Payment Terms (days)" hint="Default days until payment due">
            <input type="number" min="1" className="input" value={form.paymentTermsDays} onChange={e => set('paymentTermsDays', parseInt(e.target.value) || 14)} />
          </Field>
        </div>
      </Section>

      {/* Document numbering */}
      <Section title="Document Numbering">
        <div className="grid grid-cols-3 gap-4">
          <Field label="Invoice Prefix" hint="e.g. OMG-INV-001">
            <input className="input" value={form.invoicePrefix} onChange={e => set('invoicePrefix', e.target.value)} />
          </Field>
          <Field label="Quotation Prefix" hint="e.g. OMG-Q-001">
            <input className="input" value={form.quotationPrefix} onChange={e => set('quotationPrefix', e.target.value)} />
          </Field>
          <Field label="Receipt Prefix" hint="e.g. OMG-REC-001">
            <input className="input" value={form.receiptPrefix} onChange={e => set('receiptPrefix', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Payment details */}
      <Section title="Payment Details (shown on invoices)">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bank Name">
            <input className="input" value={form.bankName} onChange={e => set('bankName', e.target.value)} />
          </Field>
          <Field label="Account Number">
            <input className="input" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)} />
          </Field>
          <Field label="Branch / Sort Code">
            <input className="input" value={form.bankBranch} onChange={e => set('bankBranch', e.target.value)} />
          </Field>
          <Field label="Mobile Money Number" hint="Airtel Money / TNM Mpamba">
            <input className="input" value={form.mobileMoneyNumber} onChange={e => set('mobileMoneyNumber', e.target.value)} />
          </Field>
        </div>
      </Section>

      {/* Document defaults */}
      <Section title="Document Defaults">
        <Field label="Footer Thank-you Note">
          <input className="input" value={form.footerNote} onChange={e => set('footerNote', e.target.value)} />
        </Field>
        <Field label="Default Terms & Conditions" hint="Pre-filled on every new document">
          <textarea rows={5} className="input !resize-none" value={form.termsAndConditions} onChange={e => set('termsAndConditions', e.target.value)} />
        </Field>
      </Section>

      {/* Save button */}
      <div className="flex justify-end">
        <button onClick={handleSave} className="btn-primary px-8">
          <Save size={15} /> {saved ? '✓ Saved' : 'Save All Settings'}
        </button>
      </div>

      {/* Danger zone */}
      <div className="card p-5 border-red-100">
        <button
          onClick={() => setShowDanger(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-red-600"
        >
          <AlertTriangle size={16} /> Danger Zone
        </button>
        {showDanger && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-500">These actions are irreversible. Proceed with extreme caution.</p>
            <button onClick={handleClearData} className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
              Delete All Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
