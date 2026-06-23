import { useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Download, Edit, CheckCircle } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { formatCurrency, formatDate, STATUS_COLORS, STATUS_LABELS } from '../lib/utils';
import logoWhite from '../assets/logo-white.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function DocumentTemplate({ docId }: { docId: string }) {
  const { data, getDocument } = useStore();
  const doc = getDocument(docId);
  if (!doc) return null;

  const client = data.clients.find(c => c.id === doc.clientId);
  const { business } = data;
  const sym = business.currencySymbol;
  // Use white logo variant on the dark PDF header; fall back to user-uploaded logo if set
  const logoSrc = business.logo || logoWhite;

  const typeLabel = doc.type === 'quotation' ? 'QUOTATION' : doc.type === 'invoice' ? 'INVOICE' : 'RECEIPT';

  return (
    <div
      id="document-template"
      style={{ fontFamily: 'Inter, Arial, sans-serif', backgroundColor: '#fff', width: '794px', minHeight: '1123px', position: 'relative', color: '#111' }}
    >
      {/* Header */}
      <div style={{ background: '#0F0F0F', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={logoSrc} alt="Outreach Media Group" style={{ height: 48, objectFit: 'contain' }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#CC1F27', fontSize: 28, fontWeight: 800, letterSpacing: 2 }}>{typeLabel}</div>
          <div style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>{doc.number}</div>
        </div>
      </div>

      {/* Red accent bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #CC1F27 0%, #FF5258 100%)' }} />

      {/* Meta */}
      <div style={{ padding: '28px 40px', display: 'flex', justifyContent: 'space-between', background: '#FAFAFA', borderBottom: '1px solid #F0F0F0' }}>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Bill To</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{client?.name || 'Client Name'}</div>
          {client?.company && <div style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{client.company}</div>}
          {client?.email && <div style={{ fontSize: 12, color: '#777', marginTop: 2 }}>{client.email}</div>}
          {client?.phone && <div style={{ fontSize: 12, color: '#777', marginTop: 1 }}>{client.phone}</div>}
          {client?.address && <div style={{ fontSize: 12, color: '#777', marginTop: 1 }}>{client.address}{client.city ? `, ${client.city}` : ''}</div>}
        </div>
        <div style={{ textAlign: 'right', minWidth: 180 }}>
          <table style={{ fontSize: 12, borderCollapse: 'collapse', marginLeft: 'auto' }}>
            <tbody>
              <tr><td style={{ color: '#9CA3AF', paddingRight: 16, paddingBottom: 6, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Issue Date</td><td style={{ fontWeight: 600, paddingBottom: 6 }}>{formatDate(doc.issueDate)}</td></tr>
              {doc.type === 'invoice' && doc.dueDate && <tr><td style={{ color: '#CC1F27', paddingRight: 16, paddingBottom: 6, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Due Date</td><td style={{ fontWeight: 600, color: '#CC1F27', paddingBottom: 6 }}>{formatDate(doc.dueDate)}</td></tr>}
              {doc.type === 'quotation' && doc.validUntil && <tr><td style={{ color: '#9CA3AF', paddingRight: 16, paddingBottom: 6, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Valid Until</td><td style={{ fontWeight: 600, paddingBottom: 6 }}>{formatDate(doc.validUntil)}</td></tr>}
              {doc.type === 'receipt' && doc.paymentDate && <tr><td style={{ color: '#9CA3AF', paddingRight: 16, paddingBottom: 6, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Paid On</td><td style={{ fontWeight: 600, color: '#16A34A', paddingBottom: 6 }}>{formatDate(doc.paymentDate)}</td></tr>}
              {doc.paymentMethod && <tr><td style={{ color: '#9CA3AF', paddingRight: 16, paddingBottom: 6, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Via</td><td style={{ fontWeight: 500, paddingBottom: 6 }}>{doc.paymentMethod}</td></tr>}
            </tbody>
          </table>
          {business.vatNumber && (
            <div style={{ fontSize: 11, color: '#999', marginTop: 8 }}>VAT No: {business.vatNumber}</div>
          )}
        </div>
      </div>

      {/* Items table */}
      <div style={{ padding: '0 40px 24px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr style={{ background: '#0F0F0F' }}>
              <th style={{ color: '#fff', textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, borderRadius: '0' }}>#</th>
              <th style={{ color: '#fff', textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Description</th>
              <th style={{ color: '#fff', textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Qty</th>
              <th style={{ color: '#fff', textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Unit Price</th>
              <th style={{ color: '#fff', textAlign: 'right', padding: '10px 12px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {doc.lineItems.map((item, idx) => (
              <tr key={item.id} style={{ background: idx % 2 === 0 ? '#fff' : '#F9F9F9', borderBottom: '1px solid #F0F0F0' }}>
                <td style={{ padding: '12px', fontSize: 12, color: '#999', width: 32 }}>{idx + 1}</td>
                <td style={{ padding: '12px', fontSize: 13, color: '#222' }}>{item.description}</td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', color: '#555' }}>{item.quantity}</td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', color: '#555' }}>{formatCurrency(item.unitPrice, sym)}</td>
                <td style={{ padding: '12px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total, sym)}</td>
              </tr>
            ))}
            {doc.lineItems.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>No items</td></tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <div style={{ minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#555', borderBottom: '1px solid #F0F0F0' }}>
              <span>Subtotal</span><span>{formatCurrency(doc.subtotal, sym)}</span>
            </div>
            {doc.discountPercent > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#CC1F27', borderBottom: '1px solid #F0F0F0' }}>
                <span>Discount ({doc.discountPercent}%)</span><span>-{formatCurrency(doc.discountAmount, sym)}</span>
              </div>
            )}
            {doc.vatRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: '#555', borderBottom: '1px solid #F0F0F0' }}>
                <span>VAT ({doc.vatRate}%)</span><span>{formatCurrency(doc.vatAmount, sym)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 17, fontWeight: 800, color: '#0F0F0F' }}>
              <span>TOTAL</span><span style={{ color: '#CC1F27' }}>{formatCurrency(doc.total, sym)}</span>
            </div>
            {doc.type === 'receipt' && (
              <div style={{ marginTop: 8, background: '#F0FFF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#16A34A', fontSize: 13, fontWeight: 600 }}>✓ PAYMENT RECEIVED IN FULL</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment details / Notes */}
      {(business.bankName || business.mobileMoneyNumber || doc.notes || doc.paymentReference) && (
        <div style={{ margin: '0 40px', borderTop: '2px solid #F0F0F0', paddingTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {(business.bankName || business.mobileMoneyNumber) && doc.type !== 'receipt' && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#CC1F27', marginBottom: 8 }}>Payment Details</div>
              {business.bankName && (
                <div style={{ fontSize: 12, color: '#444', lineHeight: 1.8 }}>
                  <div><strong>Bank:</strong> {business.bankName}</div>
                  {business.bankAccount && <div><strong>Account:</strong> {business.bankAccount}</div>}
                  {business.bankBranch && <div><strong>Branch:</strong> {business.bankBranch}</div>}
                </div>
              )}
              {business.mobileMoneyNumber && (
                <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
                  <strong>Mobile Money:</strong> {business.mobileMoneyNumber}
                </div>
              )}
            </div>
          )}
          {doc.paymentReference && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 8 }}>Payment Reference</div>
              <div style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>{doc.paymentReference}</div>
            </div>
          )}
          {doc.notes && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 8 }}>Notes</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{doc.notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Terms */}
      {doc.termsAndConditions && (
        <div style={{ margin: '20px 40px 0', borderTop: '1px solid #F0F0F0', paddingTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#9CA3AF', marginBottom: 6 }}>Terms & Conditions</div>
          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{doc.termsAndConditions}</div>
        </div>
      )}

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#0F0F0F', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{business.name}</div>
          <div style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>{business.tagline}</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
          {business.email && <div>{business.email}</div>}
          {business.phone && <div>{business.phone}</div>}
          {business.website && <div>{business.website}</div>}
        </div>
      </div>
    </div>
  );
}

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, getDocument, updateDocument } = useStore();
  const templateRef = useRef<HTMLDivElement>(null);

  const docMaybe = getDocument(id!);
  if (!docMaybe) return <div className="p-8 text-gray-500">Document not found.</div>;
  const doc = docMaybe;

  const client = data.clients.find(c => c.id === doc.clientId);
  const sym = data.business.currencySymbol;

  async function downloadPDF() {
    const el = document.getElementById('document-template');
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save(`${doc.number}.pdf`);
  }

  function markAsPaid() {
    updateDocument(doc.id, { status: 'paid', paymentDate: doc.paymentDate || new Date().toISOString().split('T')[0] });
  }

  const typeLabel = doc.type === 'quotation' ? 'Quotation' : doc.type === 'invoice' ? 'Invoice' : 'Receipt';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost"><ArrowLeft size={16} /></button>
          <div>
            <p className="text-sm font-bold text-gray-900">{doc.number}</p>
            <p className="text-xs text-gray-400">{typeLabel} · {client?.name || 'No client'}</p>
          </div>
          <span className={`badge ${STATUS_COLORS[doc.status]}`}>{STATUS_LABELS[doc.status]}</span>
        </div>
        <div className="flex items-center gap-2">
          {doc.status !== 'paid' && doc.type === 'invoice' && (
            <button onClick={markAsPaid} className="btn-secondary gap-2 text-green-700 border-green-200 hover:bg-green-50">
              <CheckCircle size={15} /> Mark Paid
            </button>
          )}
          <Link to={`/documents/${doc.id}/edit`} className="btn-secondary gap-2">
            <Edit size={15} /> Edit
          </Link>
          <button onClick={downloadPDF} className="btn-primary gap-2">
            <Download size={15} /> Download PDF
          </button>
        </div>
      </div>

      {/* Document preview */}
      <div className="py-8 flex justify-center">
        <div className="relative" ref={templateRef}>
          <DocumentTemplate docId={id!} />
        </div>
      </div>

      {/* Summary strip */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between no-print">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">Subtotal <strong className="text-gray-800">{formatCurrency(doc.subtotal, sym)}</strong></span>
          {doc.vatAmount > 0 && <span className="text-gray-500">VAT <strong className="text-gray-800">{formatCurrency(doc.vatAmount, sym)}</strong></span>}
          <span className="text-gray-900 font-bold text-base">Total: <span className="text-brand-red">{formatCurrency(doc.total, sym)}</span></span>
        </div>
        <button onClick={downloadPDF} className="btn-primary gap-2">
          <Download size={15} /> Save as PDF
        </button>
      </div>
    </div>
  );
}
