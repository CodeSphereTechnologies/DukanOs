import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { ShoppingCart, Eye, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Invoice } from '../../../types/invoice.types';

const STATUS_VARIANT: Record<Invoice['payment_status'], 'mint' | 'warning' | 'destructive'> = {
  paid: 'mint',
  partial: 'warning',
  unpaid: 'destructive',
  ledger: 'destructive',
};

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await invoiceService.getAll();
      if (!active) return;
      if (res.data) setInvoices(res.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openDetail = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsDetailOpen(true);
  };

  const printInvoice = (inv: Invoice) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    const rows = (inv.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.product_name}${item.discount_amount > 0 ? `<br/><span class="muted">- ${formatCurrency(item.discount_amount)} line discount</span>` : ''}</td>
            <td class="num">${item.quantity} x ${formatCurrency(item.unit_price)}</td>
            <td class="num">${formatCurrency(item.total_price)}</td>
          </tr>`
      )
      .join('');
    const t = returnTotals(inv);
    w.document.write(`<!doctype html><html><head><title>${inv.invoice_number}</title>
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
    <div>Main Bazar Road, City 46000 · Tel: 0300-1234567</div>
  </div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>INVOICE</span><span class="bold">#${inv.invoice_number}</span></div>
  <div class="row"><span>Date</span><span>${formatDate(inv.invoice_date)}</span></div>
  <div class="row"><span>Customer</span><span class="bold">${inv.customer?.name || 'Walk-in Customer'}</span></div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <table><thead><tr><th>ITEM</th><th class="num">QTY x RATE</th><th class="num">AMOUNT</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>Subtotal</span><span class="num">${formatCurrency(t.subtotal)}</span></div>
  ${t.discount > 0 ? `<div class="row"><span>Discount</span><span class="num">- ${formatCurrency(t.discount)}</span></div>` : ''}
  <div class="row bold" style="font-size:13px"><span>TOTAL</span><span class="num">${formatCurrency(t.total)}</span></div>
  <div class="row"><span>Paid</span><span class="num">${formatCurrency(inv.paid_amount)}</span></div>
  ${inv.balance_amount > 0 ? `<div class="row"><span>Balance</span><span class="num">${formatCurrency(inv.balance_amount)}</span></div>` : ''}
  <div class="dash">* * *</div>
  <div class="center muted">THANK YOU FOR YOUR PURCHASE!<br/>Goods once sold will not be taken back.</div>
</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const itemCount = (inv: Invoice) => inv.items?.length || 0;
  const hasItems = (inv: Invoice) => itemCount(inv) > 0;

  const returnTotals = (inv: Invoice) => {
    if (hasItems(inv)) {
      const subtotal = inv.items.reduce((s, i) => s + i.total_price, 0);
      return { subtotal, discount: inv.discount_amount, total: inv.total_amount };
    }
    return { subtotal: inv.subtotal, discount: inv.discount_amount, total: inv.total_amount };
  };

  const columns: Column<Invoice>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice Number',
      render: (inv) => <span className="font-semibold text-black">{inv.invoice_number}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (inv) => <span>{inv.customer?.name || 'Walk-in Customer'}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      align: 'center',
      render: (inv) => (
        <span className={hasItems(inv) ? 'text-[#52525B] font-medium' : 'text-[#A1A1AA]'}>
          {hasItems(inv) ? `${itemCount(inv)} line${itemCount(inv) === 1 ? '' : 's'}` : '—'}
        </span>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Bill',
      align: 'right',
      render: (inv) => <span className="font-bold text-black">{formatCurrency(inv.total_amount)}</span>,
    },
    {
      key: 'paid_amount',
      header: 'Paid Amount',
      align: 'right',
      render: (inv) => <span className="text-[#065F46] font-medium">{formatCurrency(inv.paid_amount)}</span>,
    },
    {
      key: 'balance_amount',
      header: 'Remaining Balance',
      align: 'right',
      render: (inv) => (
        <span className={inv.balance_amount > 0 ? 'text-[#DC2626] font-bold' : 'text-[#71717A]'}>
          {formatCurrency(inv.balance_amount)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      header: 'Status',
      align: 'center',
      render: (inv) => (
        <Badge variant={STATUS_VARIANT[inv.payment_status] || 'destructive'}>
          {inv.payment_status.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'invoice_date',
      header: 'Date',
      align: 'right',
      render: (inv) => formatDate(inv.invoice_date),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          title="View invoice"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(inv);
          }}
        >
          <Eye className="w-4 h-4 text-[#52525B]" />
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Sales Invoices"
      subtitle="Complete financial invoice history, payment statuses, and customer ledger balances."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<ShoppingCart className="w-4 h-4" />}
          onClick={() => navigate('/pos')}
        >
          Create POS Invoice
        </Button>
      }
    >
      <div className="space-y-4">
        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by invoice number or customer name..."
        />

        <div className="flex items-center gap-2 text-xs text-[#71717A] px-1">
          <span>
            Showing <strong className="text-black">{filtered.length}</strong> invoices
            {invoices.length !== filtered.length && (
              <>
                {' '}
                of <strong className="text-black">{invoices.length}</strong>
              </>
            )}
          </span>
          <span className="mx-1 text-[#D4D4D8]">•</span>
          <span>
            Collected:{' '}
            <strong className="text-[#065F46]">
              {formatCurrency(invoices.reduce((s, i) => s + (i.paid_amount || 0), 0))}
            </strong>
          </span>
          <span className="mx-1 text-[#D4D4D8]">•</span>
          <span>
            Outstanding:{' '}
            <strong className="text-[#DC2626]">
              {formatCurrency(invoices.reduce((s, i) => s + (i.balance_amount || 0), 0))}
            </strong>
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          onRowClick={openDetail}
        />
      </div>

      {/* Invoice Detail Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Invoice Details"
        description={selectedInvoice ? `${selectedInvoice.invoice_number} · ${selectedInvoice.customer?.name || 'Walk-in Customer'}` : ''}
        maxWidth="lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => printInvoice(selectedInvoice!)}
            >
              Print Invoice
            </Button>
          </>
        }
      >
        {selectedInvoice &&
          (hasItems(selectedInvoice) ? (
            <div className="space-y-4">
              <div className="border border-[#E4E4E7] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F4F4F5] text-[#71717A] text-[11px]">
                    <tr>
                      <th className="p-2.5">Item</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4E4E7]">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 font-medium text-black">
                          {item.product_name}
                          {item.discount_amount > 0 && (
                            <div className="text-[10px] text-[#DC2626]">
                              - {formatCurrency(item.discount_amount)} line discount
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                        <td className="p-2.5 text-center">{item.quantity}</td>
                        <td className="p-2.5 text-right font-semibold font-mono">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  {(() => {
                    const t = returnTotals(selectedInvoice);
                    return (
                      <>
                        <div className="flex justify-between text-[#71717A]">
                          <span>Subtotal:</span>
                          <span className="font-mono">{formatCurrency(t.subtotal)}</span>
                        </div>
                        {t.discount > 0 && (
                          <div className="flex justify-between text-[#DC2626]">
                            <span>Discount:</span>
                            <span className="font-mono">- {formatCurrency(t.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-black pt-1 border-t border-[#E4E4E7]">
                          <span>Total:</span>
                          <span className="font-mono">{formatCurrency(t.total)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[#065F46]">
                          <span>Paid:</span>
                          <span className="font-mono">{formatCurrency(selectedInvoice.paid_amount)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-[#DC2626]">
                          <span>Balance:</span>
                          <span className="font-mono">{formatCurrency(selectedInvoice.balance_amount)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] text-[#52525B] pt-3 border-t border-[#E4E4E7]">
                <Badge variant={STATUS_VARIANT[selectedInvoice.payment_status] || 'destructive'} size="sm">
                  {selectedInvoice.payment_status.toUpperCase()}
                </Badge>
                <span className="bg-[#F4F4F5] rounded-full px-2.5 py-0.5 capitalize">
                  {selectedInvoice.payment_method.replace('_', ' ')}
                </span>
                <span className="bg-[#F4F4F5] rounded-full px-2.5 py-0.5">
                  {formatDate(selectedInvoice.invoice_date)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#52525B] leading-relaxed">
              This invoice was recorded with summary totals only (no line items captured).
              Subtotal <strong>{formatCurrency(selectedInvoice.subtotal)}</strong>
            </p>
          ))}
      </Dialog>
    </PageContainer>
  );
};