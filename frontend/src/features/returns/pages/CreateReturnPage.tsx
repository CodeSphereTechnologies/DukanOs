import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import { returnService } from '../../../services/return.service';
import type { Invoice, InvoiceItem } from '../../../types/invoice.types';
import { ArrowLeft, Save } from 'lucide-react';

export const CreateReturnPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const { addToast } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(!!invoiceId);
  const [submitting, setSubmitting] = useState(false);
  
  // The item quantities the user wants to return
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [refundType, setRefundType] = useState('cash');
  const [reason, setReason] = useState('');
  
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');

  useEffect(() => {
    if (invoiceId) {
      invoiceService.getById(invoiceId)
        .then(res => setInvoice(res.data || null))
        .catch(() => addToast({ title: 'Error', message: 'Invoice not found', type: 'error' }))
        .finally(() => setLoading(false));
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!searchInvoiceNumber.trim()) return;
    setLoading(true);
    try {
      // Very naive search - realistically you'd have an API endpoint to search by number.
      // We will just fetch all and find, or just use the ID if they entered an ID.
      const res = await invoiceService.getAll();
      const found = res.data?.find(i => i.invoice_number.toLowerCase() === searchInvoiceNumber.toLowerCase() || String(i.id) === searchInvoiceNumber);
      if (found) {
        setInvoice(found);
      } else {
        addToast({ title: 'Not Found', message: 'Could not find that invoice.', type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const maxQuantity = (item: InvoiceItem) => {
    // If we had already Returned quantities tracked on InvoiceItem we'd subtract them.
    // For now, assume full quantity is available.
    return item.quantity;
  };

  const handleQuantityChange = (itemId: number, qtyStr: string, max: number) => {
    const qty = Math.max(0, Math.min(max, Number(qtyStr) || 0));
    setReturnQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  const totalRefundAmount = invoice?.items.reduce((sum, item) => {
    const qty = returnQuantities[item.id] || 0;
    return sum + (qty * item.unit_price);
  }, 0) || 0;

  const handleSubmit = async () => {
    if (!invoice) return;
    const itemsToReturn = invoice.items
      .filter(item => (returnQuantities[item.id] || 0) > 0)
      .map(item => ({
        invoice_item_id: item.id,
        quantity: returnQuantities[item.id],
        reason: reason,
      }));

    if (itemsToReturn.length === 0) {
      addToast({ title: 'Validation', message: 'Please select at least one item to return.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await returnService.create({
        invoice_id: invoice.id,
        refund_type: refundType,
        reason: reason,
        items: itemsToReturn,
      });
      addToast({ title: 'Success', message: 'Return processed successfully.', type: 'success' });
      navigate(`/returns/${res.data?.id || ''}`);
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Failed to process return', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!invoice && !loading) {
    return (
      <PageContainer title="Create Return">
        <Card className="max-w-md mx-auto mt-12 p-6 shadow-subtle border-[#E4E4E7]">
          <h3 className="text-lg font-medium text-black mb-4">Find Invoice</h3>
          <p className="text-sm text-[#71717A] mb-4">Enter the invoice number or ID to initiate a return.</p>
          <div className="flex gap-2">
            <Input 
              placeholder="e.g. INV-2026-005" 
              value={searchInvoiceNumber} 
              onChange={(e) => setSearchInvoiceNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadInvoice()}
            />
            <Button variant="primary" onClick={loadInvoice}>Search</Button>
          </div>
        </Card>
      </PageContainer>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-[#71717A] hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-black">
            New Return {invoice ? `for ${invoice.invoice_number}` : ''}
          </h1>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Save className="w-4 h-4" />}
          onClick={handleSubmit}
          disabled={submitting || totalRefundAmount === 0}
        >
          Process Return
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div></div>
      ) : invoice && (
        <div className="space-y-6">
          <Card className="p-5 shadow-subtle border-[#E4E4E7]">
            <h3 className="font-medium text-[#18181B] mb-4">Select Items to Return</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#71717A] uppercase bg-[#FAFAF8] border-y border-[#F4F4F5]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Unit Price</th>
                    <th className="px-4 py-3 font-medium">Max Qty</th>
                    <th className="px-4 py-3 font-medium w-32">Return Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F4F4F5]">
                  {invoice.items.map(item => {
                    const max = maxQuantity(item);
                    const current = returnQuantities[item.id] || 0;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-black">{item.product_name}</div>
                          <div className="text-xs text-[#A1A1AA]">{item.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-[#52525B]">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-3 text-[#52525B]">{max}</td>
                        <td className="px-4 py-3">
                          <Input 
                            type="number" 
                            min="0" 
                            max={max} 
                            value={current === 0 ? '' : current}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value, max)}
                            placeholder="0"
                            className="h-8"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-black">
                          {formatCurrency(current * item.unit_price)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 shadow-subtle border-[#E4E4E7]">
              <h3 className="font-medium text-[#18181B] mb-4">Return Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1.5">Refund Method</label>
                  <Select 
                    options={[
                      { label: 'Cash Refund', value: 'cash' },
                      { label: 'Store Credit / Ledger', value: 'credit' },
                      { label: 'Bank Transfer', value: 'bank_transfer' },
                      { label: 'Exchange', value: 'exchange' },
                    ]}
                    value={refundType}
                    onChange={(e) => setRefundType(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#52525B] mb-1.5">Reason for Return</label>
                  <Input 
                    placeholder="e.g. Defective, Not needed..." 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 shadow-subtle border-[#E4E4E7] flex flex-col justify-center bg-[#FAFAF8]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[#52525B]">Items Returning:</span>
                <span className="font-medium">{Object.values(returnQuantities).reduce((a,b)=>a+b, 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg mt-4 pt-4 border-t border-[#E4E4E7]">
                <span className="font-bold text-black">Total Refund</span>
                <span className="font-bold text-[#DC2626]">{formatCurrency(totalRefundAmount)}</span>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
