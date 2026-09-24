import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Invoice, InvoiceItem, SaleReturn } from '../../../types/invoice.types';
import { ArrowLeft, Printer, Download, RotateCcw, User, Mail, Receipt, ExternalLink } from 'lucide-react';
import { useToast } from '../../../hooks/useToast';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const printInvoice = () => {
    if (!invoice) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const t = { subtotal: invoice.subtotal, discount: invoice.discount_amount, total: invoice.total_amount };
    const rows = (invoice.items || []).map(item => `
          <tr>
            <td>${item.product_name}${item.discount_amount > 0 ? `<br/><span class="muted">- ${formatCurrency(item.discount_amount)} line discount</span>` : ''}</td>
            <td class="num">${item.quantity} x ${formatCurrency(item.unit_price)}</td>
            <td class="num">${formatCurrency(item.total_price)}</td>
          </tr>
    `).join('');

    w.document.write(`<!doctype html><html><head><title>${invoice.invoice_number}</title>
<style>
  body { font-family: monospace; width: 320px; margin: 24px auto; color: #000; font-size: 12px; }
  .center { text-align: center; }
  .dash { text-align: center; margin: 8px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; }
  .num { text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  .muted { color: #666; font-size: 10px; }
  .bold { font-weight: bold; }
  th { text-align: left; }
</style></head><body>
  <div class="center">
    <div class="bold" style="font-size:16px;letter-spacing:2px">DUKANOS</div>
    <div>ELECTRICAL &amp; APPLIANCE STORE</div>
    <div>Main Bazar Road, City 46000 &middot; Tel: 0300-1234567</div>
  </div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>INVOICE</span><span class="bold">#${invoice.invoice_number}</span></div>
  <div class="row"><span>Date</span><span>${formatDate(invoice.invoice_date)}</span></div>
  <div class="row"><span>Customer</span><span class="bold">${invoice.customer?.name || 'Walk-in Customer'}</span></div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <table><thead><tr><th>ITEM</th><th class="num">QTY x RATE</th><th class="num">AMOUNT</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>Subtotal</span><span class="num">${formatCurrency(t.subtotal)}</span></div>
  ${t.discount > 0 ? `<div class="row"><span>Discount</span><span class="num">- ${formatCurrency(t.discount)}</span></div>` : ''}
  <div class="row bold" style="font-size:13px"><span>TOTAL</span><span class="num">${formatCurrency(t.total)}</span></div>
  <div class="row"><span>Paid</span><span class="num">${formatCurrency(invoice.paid_amount)}</span></div>
  ${invoice.balance_amount > 0 ? `<div class="row"><span>Balance</span><span class="num">${formatCurrency(invoice.balance_amount)}</span></div>` : ''}
  <div class="dash">* * *</div>
  <div class="center muted">THANK YOU FOR YOUR PURCHASE!<br/>Goods once sold will not be taken back.</div>
</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 250);
  };


  useEffect(() => {
    if (id) {
      invoiceService.getById(id)
        .then((res) => setInvoice(res.data || null))
        .catch(() => setInvoice(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <PageContainer title="Loading Invoice...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      </PageContainer>
    );
  }

  if (!invoice) {
    return (
      <PageContainer title="Invoice Not Found">
        <div className="text-center py-12">
          <p className="text-[#71717A] mb-4">The invoice you are looking for does not exist.</p>
          <Button variant="secondary" onClick={() => navigate('/invoices')}>
            Back to Invoices
          </Button>
        </div>
      </PageContainer>
    );
  }

  const columns: Column<InvoiceItem>[] = [
    {
      key: 'product_name',
      header: 'Product',
      render: (item) => (
        <div>
          <Link to={`/products/${item.product_id}`} className="font-medium text-black hover:underline inline-flex items-center gap-1">
            {item.product_name}
            <ExternalLink className="w-3 h-3 text-[#A1A1AA]" />
          </Link>
          <div className="text-xs text-[#71717A]">{item.sku}</div>
        </div>
      ),
    },
    {
      key: 'unit_price',
      header: 'Unit Price',
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      key: 'quantity',
      header: 'Quantity',
    },
    {
      key: 'discount_amount',
      header: 'Discount',
      render: (item) => item.discount_amount > 0 ? formatCurrency(item.discount_amount) : '-',
    },
    {
      key: 'total_price',
      header: 'Total',
      render: (item) => <span className="font-medium">{formatCurrency(item.total_price)}</span>,
    },
  ];

  const returnColumns: Column<SaleReturn>[] = [
    {
      key: 'return_number',
      header: 'Return #',
      render: (ret) => (
        <span className="font-medium text-black">{ret.return_number}</span>
      ),
    },
    {
      key: 'return_date',
      header: 'Date',
      render: (ret) => formatDate(ret.return_date),
    },
    {
      key: 'refund_type',
      header: 'Type',
      render: (ret) => <span className="capitalize">{ret.refund_type.replace('_', ' ')}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (ret) => (
        <Badge variant={ret.status === 'processed' ? 'mint' : ret.status === 'rejected' ? 'destructive' : 'warning'}>
          {ret.status}
        </Badge>
      ),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (ret) => <span className="font-medium">{formatCurrency(ret.total_amount)}</span>,
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/invoices')} className="text-[#71717A] hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-black">
            Invoice {invoice.invoice_number}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Printer className="w-4 h-4" />} onClick={printInvoice}>
            Print
          </Button>
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={printInvoice}>
            PDF
          </Button>
          <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={() => addToast({ title: 'Notice', message: 'Returns module is currently under development.', type: 'info' })}>
            Create Return
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 flex flex-col gap-4 shadow-subtle border-[#E4E4E7]">
          <div className="flex items-center gap-2 text-[#52525B] font-medium border-b border-[#F4F4F5] pb-3">
            <Receipt className="w-4 h-4" />
            <h3>Invoice Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <div className="text-xs text-[#71717A] mb-1">Status</div>
              <Badge variant={invoice.status === 'paid' ? 'mint' : invoice.status === 'cancelled' || invoice.status === 'voided' ? 'destructive' : 'default'}>
                {invoice.status}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Payment Status</div>
              <Badge variant={invoice.payment_status === 'paid' ? 'mint' : invoice.payment_status === 'unpaid' ? 'destructive' : 'warning'}>
                {invoice.payment_status}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Date Issued</div>
              <div className="text-sm font-medium">{formatDate(invoice.invoice_date)}</div>
            </div>
            <div>
              <div className="text-xs text-[#71717A] mb-1">Payment Method</div>
              <div className="text-sm font-medium capitalize">{invoice.payment_method.replace('_', ' ')}</div>
            </div>
          </div>
        </Card>

        <Card className="p-5 flex flex-col gap-4 shadow-subtle border-[#E4E4E7] lg:col-span-2">
          <div className="flex items-center gap-2 text-[#52525B] font-medium border-b border-[#F4F4F5] pb-3">
            <User className="w-4 h-4" />
            <h3>Customer Details</h3>
          </div>
          {invoice.customer && invoice.customer_id ? (
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold text-black mb-1">{invoice.customer.name}</div>
                {invoice.customer.phone && (
                  <div className="text-sm text-[#52525B] flex items-center gap-1.5 mb-1">
                    {invoice.customer.phone}
                  </div>
                )}
                {invoice.customer.email && (
                  <div className="text-sm text-[#52525B] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {invoice.customer.email}
                  </div>
                )}
              </div>
              <Link to={`/customers/${invoice.customer_id}`}>
                <Button variant="secondary" size="sm" leftIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                  View Ledger
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-[#52525B]">
              <div className="w-10 h-10 bg-[#F4F4F5] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#A1A1AA]" />
              </div>
              <div>
                <div className="font-medium text-black">Walk-in Customer</div>
                <div className="text-xs text-[#71717A]">No ledger account attached</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card className="mb-6 shadow-subtle border-[#E4E4E7] overflow-hidden">
        <div className="p-5 border-b border-[#F4F4F5]">
          <h3 className="font-medium text-[#18181B]">Order Items</h3>
        </div>
        {invoice.items && invoice.items.length > 0 ? (
          <DataTable
            data={invoice.items}
            columns={columns}
            keyExtractor={(item) => String(item.id)}
          />
        ) : (
          <div className="p-8 text-center text-[#71717A] text-sm bg-[#FAFAF8]">
            This invoice was recorded with summary totals only.
          </div>
        )}
        
        <div className="bg-[#FAFAF8] p-6 border-t border-[#E4E4E7] flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            {invoice.notes && (
              <div>
                <div className="text-xs font-medium text-[#71717A] uppercase tracking-wider mb-2">Notes</div>
                <p className="text-sm text-[#52525B] leading-relaxed max-w-md">{invoice.notes}</p>
              </div>
            )}
          </div>
          <div className="w-full md:w-72 flex flex-col gap-3">
            <div className="flex justify-between text-sm text-[#52525B]">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-sm text-[#10B981]">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            {invoice.tax_amount ? (
              <div className="flex justify-between text-sm text-[#52525B]">
                <span>Tax</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-base font-bold text-black border-t border-[#E4E4E7] pt-3 mt-1">
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#52525B] pt-2">
              <span>Paid</span>
              <span>{formatCurrency(invoice.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-black">
              <span>Balance Due</span>
              <span className={invoice.balance_amount > 0 ? "text-[#DC2626]" : "text-[#059669]"}>
                {formatCurrency(invoice.balance_amount)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {invoice.returns && invoice.returns.length > 0 && (
        <Card className="shadow-subtle border-[#E4E4E7] overflow-hidden">
          <div className="p-5 border-b border-[#F4F4F5] flex justify-between items-center bg-[#FEF2F2]/30">
            <h3 className="font-medium text-[#DC2626] flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Returns Linked to Invoice
            </h3>
          </div>
          <DataTable
            data={invoice.returns}
            columns={returnColumns}
            keyExtractor={(ret) => String(ret.id)}
          />
        </Card>
      )}
    </div>
  );
};
