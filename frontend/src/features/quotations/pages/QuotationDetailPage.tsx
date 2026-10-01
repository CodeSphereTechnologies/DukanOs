import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Quotation } from '../../../types/invoice.types';
import { ArrowLeft, Printer, ArrowRight, User } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export const QuotationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);

  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card' | 'online' | 'ledger'>('cash');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  useEffect(() => {
    if (!id) return;
    invoiceService.getQuotationById(Number(id)).then((res) => {
      if (res.data) {
        setQuote(res.data);
        setAmountPaid(res.data.total_amount);
      }
      setLoading(false);
    });
  }, [id]);

  const handlePrintQuotation = () => {
    if (!quote) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    
    // Minimal A4 thermal format
    win.document.write(`
      <html>
        <head>
          <title>${quote.quotation_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #000; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f4f4f5; }
            .right { text-align: right; }
            .center { text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .totals { width: 300px; margin-left: auto; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
            .flex-between { display: flex; justify-content: space-between; padding: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0;font-size:24px;">PUNJAB ELECTRIC STORE</h1>
              <div style="color:#666;margin-top:4px;">Main Market, Hall Road, Lahore<br/>Tel: +92 42 37210099</div>
            </div>
            <div class="right">
              <h2 style="margin:0;color:#666;text-transform:uppercase;">Estimate / Quotation</h2>
              <div style="font-size:20px;font-weight:bold;margin-top:4px;">${quote.quotation_number}</div>
              <div style="margin-top:10px;">Date: <strong>${formatDate(quote.quotation_date)}</strong></div>
            </div>
          </div>
          
          <div style="display:flex;justify-content:space-between;background:#f8f9fa;padding:15px;border:1px solid #ddd;">
            <div>
              <div style="color:#666;font-size:12px;">Quotation For:</div>
              <div style="font-weight:bold;font-size:16px;">${quote.customer?.name || 'Walk-in Customer'}</div>
              <div>${quote.customer?.phone || ''}</div>
            </div>
            <div class="right">
              <div style="color:#666;font-size:12px;">Valid Until:</div>
              <div style="font-weight:bold;font-size:16px;">${formatDate(quote.valid_until)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="right">Rate</th>
                <th class="center">Qty</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.map(i => `
                <tr>
                  <td>
                    <strong>${i.product_name}</strong>
                    ${i.sku ? `<br/><small style="color:#666">${i.sku}</small>` : ''}
                  </td>
                  <td class="right">${formatCurrency(i.unit_price)}</td>
                  <td class="center">${i.quantity}</td>
                  <td class="right">${formatCurrency(i.total_price || (i.unit_price * i.quantity))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="flex-between">
              <span>Subtotal:</span>
              <span>${formatCurrency(quote.subtotal)}</span>
            </div>
            ${quote.discount_amount > 0 ? `
              <div class="flex-between" style="color:red;">
                <span>Discount:</span>
                <span>- ${formatCurrency(quote.discount_amount)}</span>
              </div>
            ` : ''}
            <div class="flex-between" style="font-size:18px;font-weight:bold;margin-top:10px;padding-top:10px;border-top:1px solid #ddd;">
              <span>Grand Total:</span>
              <span>${formatCurrency(quote.total_amount)}</span>
            </div>
          </div>

          ${quote.notes ? `
            <div style="margin-top: 40px; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; font-size: 13px;">
              <strong>Terms & Conditions:</strong><br/>
              ${quote.notes}
            </div>
          ` : ''}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleConvert = async () => {
    if (!quote) return;
    setIsConverting(true);
    try {
      const res = await invoiceService.convertQuotationToInvoice(quote.id, {
        amount_paid: paymentMethod === 'ledger' ? 0 : amountPaid,
        payment_method: paymentMethod,
      });
      addToast({ title: 'Success', message: `Successfully converted to Invoice #${res.data?.invoice_number}`, type: 'success' });
      setQuote({ ...quote, status: 'converted' });
      setIsConvertOpen(false);
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Failed to convert quotation', type: 'error' });
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading quotation...</div>;
  }

  if (!quote) {
    return (
      <PageContainer title="Quotation Not Found">
        <Button variant="secondary" onClick={() => navigate('/quotations')}>Go Back</Button>
      </PageContainer>
    );
  }

  const columns: Column<any>[] = [
    {
      key: 'product',
      header: 'Product',
      render: (i) => (
        <div>
          <div className="font-semibold text-black">{i.product_name}</div>
          <div className="text-xs text-[#71717A]">{i.sku}</div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'center',
    },
    {
      key: 'unit_price',
      header: 'Rate',
      align: 'right',
      render: (i) => formatCurrency(i.unit_price),
    },
    {
      key: 'line_total',
      header: 'Total',
      align: 'right',
      render: (i) => <span className="font-bold">{formatCurrency(i.total_price || (i.unit_price * i.quantity))}</span>,
    },
  ];

  return (
    <PageContainer
      title={quote.quotation_number}
      subtitle={`Quotation Date: ${formatDate(quote.quotation_date)}`}
      primaryAction={
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => navigate('/quotations')} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
          <Button variant="secondary" onClick={handlePrintQuotation} leftIcon={<Printer className="w-4 h-4" />}>
            Print
          </Button>
          {quote.status !== 'converted' && (
            <Button variant="primary" onClick={() => setIsConvertOpen(true)} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Convert to Invoice
            </Button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5 flex flex-col gap-4 shadow-subtle border-[#E4E4E7] lg:col-span-2">
          <div className="flex items-center gap-2 text-[#52525B] font-medium border-b border-[#F4F4F5] pb-3">
            <User className="w-4 h-4" />
            <h3>Customer Details</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#71717A] mb-1">Name</div>
              <div className="text-sm font-semibold">{quote.customer?.name || 'Walk-in Customer'}</div>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Contact</div>
              <div className="text-sm">{quote.customer?.phone || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Status</div>
              <Badge variant={quote.status === 'converted' ? 'mint' : 'neutral'}>
                {quote.status.toUpperCase()}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Valid Until</div>
              <div className="text-sm">{formatDate(quote.valid_until)}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-4 shadow-subtle border-[#E4E4E7] bg-[#FAFAF8]">
          <h3 className="font-semibold text-black border-b border-[#E4E4E7] pb-2">Pricing Summary</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[#52525B]">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(quote.subtotal)}</span>
            </div>
            {quote.discount_amount > 0 && (
              <div className="flex justify-between text-[#DC2626]">
                <span>Discount</span>
                <span className="font-mono">- {formatCurrency(quote.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-3 border-t border-[#E4E4E7]">
              <span>Total</span>
              <span className="font-mono text-[#065F46]">{formatCurrency(quote.total_amount)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card className="overflow-hidden border-[#E4E4E7] shadow-subtle">
          <div className="p-4 bg-[#FAFAF8] border-b border-[#E4E4E7]">
            <h3 className="font-semibold text-black">Line Items</h3>
          </div>
          <DataTable columns={columns} data={quote.items} keyExtractor={(i) => i.toString()} />
        </Card>
      </div>

      {quote.notes && (
        <Card className="mt-6 p-5 border-[#E4E4E7] shadow-subtle bg-amber-50/50">
          <h3 className="font-semibold text-amber-900 mb-2">Terms & Conditions / Notes</h3>
          <p className="text-sm text-amber-800">{quote.notes}</p>
        </Card>
      )}

      <Dialog
        isOpen={isConvertOpen}
        onClose={() => !isConverting && setIsConvertOpen(false)}
        title="Convert Quotation to Invoice"
        description="This will lock the quotation and generate a real financial invoice and accounting records."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConvertOpen(false)} disabled={isConverting}>Cancel</Button>
            <Button variant="primary" onClick={handleConvert} disabled={isConverting}>
              {isConverting ? 'Converting...' : 'Confirm Conversion'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Grand Total">
            <div className="text-2xl font-bold text-black font-mono">
              {formatCurrency(quote.total_amount)}
            </div>
          </FormField>

          <FormField label="Payment Method" required>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { label: 'Cash Payment', value: 'cash' },
                { label: 'Bank Transfer / Online', value: 'bank_transfer' },
                { label: 'Card Payment', value: 'card' },
                ...(quote.customer_id
                  ? [{ label: 'On-Account (Add to Ledger)', value: 'ledger' }]
                  : []),
              ]}
            />
          </FormField>

          {paymentMethod === 'ledger' ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              The full amount of <strong>{formatCurrency(quote.total_amount)}</strong> will be added to {quote.customer?.name}'s ledger as a debt.
            </div>
          ) : (
            <FormField label="Amount Received (PKR)" required>
              <Input
                type="number"
                min={0}
                value={amountPaid || ''}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </FormField>
          )}
        </div>
      </Dialog>
    </PageContainer>
  );
};
