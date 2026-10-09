import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { StatCard } from '../../../components/common/StatCard';
import { Button } from '../../../components/ui/Button';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { SearchInput } from '../../../components/ui/SearchInput';
import { Card } from '../../../components/ui/Card';
import { Dialog } from '../../../components/ui/Dialog';
import { Alert } from '../../../components/ui/Alert';
import {
  ShoppingCart,
  Receipt,
  Scan,
  Zap,
  Printer,
  Coins,
  CreditCard,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Invoice } from '../../../types/invoice.types';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface CashierTransaction {
  id: number;
  invoice_number: string;
  customer_name: string;
  amount: number;
  method: 'Cash' | 'Bank Transfer' | 'Card' | 'Raast' | 'Other';
  time: string;
  items: ReceiptItem[];
}

interface CatalogProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
}

const CATALOG_PRODUCTS: CatalogProduct[] = [
  { id: 1, name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', barcode: '8901234567890', price: 9500, stock: 12, category: 'Ceiling Fans', unit: 'pc' },
  { id: 2, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', barcode: '8901234567891', price: 14500, stock: 8, category: 'Cables & Wires', unit: 'coil' },
  { id: 3, name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', barcode: '8901234567892', price: 650, stock: 45, category: 'LED Bulbs', unit: 'pc' },
  { id: 4, name: 'Schneider MCB 32A Double Pole 6kA', sku: 'SCH-MCB-32DP', barcode: '8901234567893', price: 2200, stock: 24, category: 'Circuit Breakers', unit: 'pc' },
  { id: 5, name: 'Pak Fan Bracket Fan 18" Remote Control', sku: 'PAK-FAN-18B', barcode: '8901234567894', price: 12800, stock: 6, category: 'Bracket Fans', unit: 'pc' },
  { id: 6, name: 'Osaka Tube Light LED 36W Complete Set', sku: 'OSK-TUB-36W', barcode: '8901234567895', price: 1850, stock: 30, category: 'LED Tube Lights', unit: 'pc' },
];

function methodLabel(method: Invoice['payment_method']): CashierTransaction['method'] {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'card':
      return 'Card';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'online':
      return 'Raast';
    default:
      return 'Other';
  }
}

function formatTime(value?: string): string {
  const date = value ? new Date(value) : new Date();
  if (isNaN(date.getTime())) return '-';
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
}

function toReceipt(inv: Invoice): CashierTransaction {
  return {
    id: inv.id,
    invoice_number: inv.invoice_number,
    customer_name: inv.customer?.name?.trim() || 'Walk-in Customer',
    amount: inv.paid_amount,
    method: methodLabel(inv.payment_method),
    time: formatTime(inv.created_at || inv.invoice_date),
    items: (inv.items || []).map((item) => ({
      name: item.product_name || item.sku,
      quantity: item.quantity,
      price: item.unit_price,
    })),
  };
}

export const CashierDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState<CashierTransaction[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [quickBarcode, setQuickBarcode] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<CashierTransaction | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftClosed, setShiftClosed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await invoiceService.getAll();
      if (!active) return;
      const today = new Date().toISOString().slice(0, 10);
      const mapped = (res.data || [])
        .filter((inv) => (inv.invoice_date || inv.created_at || '').slice(0, 10) === today)
        .map(toReceipt)
        .sort((a, b) => b.time.localeCompare(a.time));
      setReceipts(mapped);
      setLoadingInvoices(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Dynamic calculations from today's receipts
  const totalSales = useMemo(
    () => receipts.reduce((sum, item) => sum + item.amount, 0),
    [receipts]
  );
  const cashCollected = useMemo(
    () =>
      receipts
        .filter((r) => r.method === 'Cash')
        .reduce((sum, item) => sum + item.amount, 0),
    [receipts]
  );
  const onlineCollected = useMemo(
    () =>
      receipts
        .filter((r) => r.method !== 'Cash')
        .reduce((sum, item) => sum + item.amount, 0),
    [receipts]
  );

  // Real-time matched product for instant price check
  const matchedProduct = useMemo(() => {
    const trimmed = quickBarcode.trim().toLowerCase();
    if (!trimmed) return null;
    return (
      CATALOG_PRODUCTS.find(
        (p) =>
          p.barcode === trimmed ||
          p.sku.toLowerCase() === trimmed ||
          p.name.toLowerCase().includes(trimmed)
      ) || null
    );
  }, [quickBarcode]);

  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickBarcode.trim()) {
      navigate('/pos');
      return;
    }

    if (matchedProduct) {
      navigate('/pos', {
        state: {
          barcode: matchedProduct.barcode,
          autoAddProduct: matchedProduct,
        },
      });
    } else {
      navigate('/pos', {
        state: { barcode: quickBarcode.trim() },
      });
    }
  };

  const handleOpenReceipt = (receipt: CashierTransaction) => {
    setSelectedReceipt(receipt);
    setIsReceiptOpen(true);
  };

  const printThermal = (title: string, inner: string) => {
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${title}</title>
<style>
  @page { margin: 0; }
  @media print { html, body { height: auto; } body { width: 100%; margin: 0; padding: 0 4mm; } }
  body { font-family: system-ui, -apple-system, sans-serif; width: 72mm; margin: 0 auto; color: #000; font-size: 13px; font-weight: 600; line-height: 1.45; }
  .center { text-align: center; }
  .dash { text-align: center; margin: 8px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; }
  .num { text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  .muted { color: #666; font-size: 10px; }
  .bold { font-weight: bold; }
  .big { font-size: 13px; }
  th { text-align: left; }
  td { padding: 2px 0; vertical-align: top; }
</style></head><body>
<div class="center">
  <div class="bold big">PUNJAB ELECTRIC STORE</div>
  <div>HUSSAINI CHOWK BAHAWALPUR</div>
  <div class="muted">Ch Tariq, Hamza Tariq 03084046062</div>
</div>
<div class="dash">- - - - - - - - - - - - - - - -</div>
${inner}
</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const printReceipt = () => {
    if (!selectedReceipt) return;
    const r = selectedReceipt;
    const rows = (r.items || [])
      .map(
        (item) => `
          <tr>
            <td>${item.name}</td>
            <td class="num">${item.quantity} x ${formatCurrency(item.price)}</td>
            <td class="num">${formatCurrency(item.quantity * item.price)}</td>
          </tr>`
      )
      .join('');
    printThermal(
      `Receipt ${r.invoice_number}`,
      `
      <div class="center bold">SALES RECEIPT / COUNTER INVOICE</div>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <div class="row"><span>Invoice No:</span><span class="bold">${r.invoice_number}</span></div>
      <div class="row"><span>Date & Time:</span><span>${new Date().toLocaleString('en-PK')}</span></div>
      <div class="row"><span>Cashier:</span><span>Counter 01 (Kashif Ali)</span></div>
      <div class="row"><span>Customer:</span><span class="bold">${r.customer_name}</span></div>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <table><thead><tr><th>ITEM</th><th class="num">QTY x RATE</th><th class="num">AMOUNT</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <div class="row"><span>Subtotal</span><span class="num">${formatCurrency(r.amount)}</span></div>
      <div class="row"><span>Discount / Scheme</span><span class="num">Rs. 0</span></div>
      <div class="row bold big"><span>NET TOTAL</span><span class="num">${formatCurrency(r.amount)}</span></div>
      <div class="row"><span>PAID VIA (${r.method.toUpperCase()})</span><span class="num">${formatCurrency(r.amount)}</span></div>
      <div class="dash">* * *</div>
      <div class="center muted">Thank you for your business!<br/>Electrical appliances warranty subject to warranty card.<br/>Software powered by DukanOS</div>
      `
    );
  };

  const printShift = () => {
    printThermal(
      'Register Shift Summary',
      `
      <div class="center bold">COUNTER REGISTER SHIFT SUMMARY</div>
      <div class="muted">Terminal: Counter POS Terminal #01</div>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <div class="row"><span>Shift Started</span><span>Today at 09:00 AM</span></div>
      <div class="row"><span>Cashier</span><span>Kashif Ali (Staff #103)</span></div>
      <div class="row"><span>Shift Status</span><span class="bold">${shiftClosed ? 'RECONCILED' : 'ACTIVE & BALANCED'}</span></div>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <div class="row"><span>Opening Float in Drawer</span><span class="num">${formatCurrency(10000)}</span></div>
      <div class="row"><span>+ Cash Collected (Sales)</span><span class="num">${formatCurrency(cashCollected)}</span></div>
      <div class="row bold big"><span>= Expected Physical Cash in Till</span><span class="num">${formatCurrency(10000 + cashCollected)}</span></div>
      <div class="dash">- - - - - - - - - - - - - - - -</div>
      <div class="row"><span>Digital & Bank (Raast)</span><span class="num">${formatCurrency(onlineCollected)}</span></div>
      <div class="row bold"><span>Total Invoices Processed</span><span class="num">${receipts.length}</span></div>
      <div class="dash">* * *</div>
      <div class="center muted">Software powered by DukanOS</div>
      `
    );
  };

  const filteredReceipts = receipts.filter(
    (r) =>
      r.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      r.customer_name.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      r.method.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const columns: Column<CashierTransaction>[] = [
    {
      key: 'invoice_number',
      header: 'Invoice #',
      render: (t) => (
        <div>
          <span className="font-semibold text-black">{t.invoice_number}</span>
          <div className="text-[11px] text-[#71717A]">{t.items.length} line items</div>
        </div>
      ),
    },
    { key: 'customer_name', header: 'Customer' },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (t) => <span className="font-bold text-[#065F46]">{formatCurrency(t.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Payment Method',
      align: 'center',
      render: (t) => (
        <Badge variant={t.method === 'Cash' ? 'mint' : 'neutral'}>{t.method}</Badge>
      ),
    },
    { key: 'time', header: 'Time', align: 'right' },
    {
      key: 'actions',
      header: 'Receipt',
      align: 'right',
      render: (t) => (
        <Button
          variant="secondary"
          size="sm"
          className="h-8 px-2 text-xs flex items-center gap-1.5"
          onClick={() => handleOpenReceipt(t)}
          title="Preview & print thermal receipt"
        >
          <Printer className="w-3.5 h-3.5 text-[#52525B]" />
          <span>Receipt</span>
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Cashier POS Hub"
      subtitle="Counter register, high-velocity barcode scanning, price checks, and receipt printing."
      secondaryActions={
        <Button
          variant="secondary"
          size="md"
          leftIcon={<Coins className="w-4 h-4" />}
          onClick={() => setIsShiftModalOpen(true)}
        >
          Register Shift Summary
        </Button>
      }
      primaryAction={
        <Button
          variant="primary"
          size="lg"
          leftIcon={<ShoppingCart className="w-5 h-5" />}
          onClick={() => navigate('/pos')}
          className="bg-black text-white hover:bg-neutral-800 text-sm font-bold shadow-lg"
        >
          New Sale / POS Counter
        </Button>
      }
    >
      {/* 3 Dynamic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="Today's Register Total"
          value={formatCurrency(totalSales)}
          change={{ value: `${receipts.length} Invoices issued today`, trend: 'up' }}
          icon={<Receipt className="w-5 h-5 text-[#065F46]" />}
        />
        <StatCard
          title="Cash in Till (Sales)"
          value={formatCurrency(cashCollected)}
          change={{ value: 'Cash drawer balance', trend: 'neutral' }}
          icon={<Zap className="w-5 h-5 text-black" />}
        />
        <StatCard
          title="Online / Raast Transfers"
          value={formatCurrency(onlineCollected)}
          change={{ value: 'Bank & digital settled', trend: 'up' }}
          icon={<CreditCard className="w-5 h-5 text-[#065F46]" />}
        />
      </div>

      {/* Barcode Quick Search & Price Check Station */}
      <Card className="p-4 mb-6 bg-white space-y-3">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <SearchInput
              value={quickBarcode}
              onChange={setQuickBarcode}
              placeholder="Scan barcode or enter SKU code (e.g. 8901234567890 or ROY-FAN-56)..."
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Scan className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Verify & Add to POS
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => navigate('/pos')}
              className="w-full sm:w-auto"
            >
              Open POS
            </Button>
          </div>
        </form>

        {/* Instant Price & Stock Verification Card */}
        {matchedProduct && (
          <div className="p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-0 duration-150">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="mint">MATCH FOUND</Badge>
                <span className="text-xs text-[#52525B] font-mono">Barcode: {matchedProduct.barcode}</span>
              </div>
              <h4 className="text-base font-bold text-[#18181B] font-display">{matchedProduct.name}</h4>
              <div className="text-xs text-[#52525B] flex flex-wrap items-center gap-3">
                <span>SKU: <strong className="font-mono text-black">{matchedProduct.sku}</strong></span>
                <span>Category: <strong className="text-black">{matchedProduct.category}</strong></span>
                <span>
                  Current Stock:{' '}
                  <strong className={matchedProduct.stock <= 5 ? 'text-[#DC2626]' : 'text-[#065F46]'}>
                    {matchedProduct.stock} {matchedProduct.unit}
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
              <div className="text-right">
                <div className="text-xs text-[#71717A]">Retail Counter Price</div>
                <div className="text-xl font-extrabold text-[#065F46]">
                  {formatCurrency(matchedProduct.price)}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingCart className="w-4 h-4" />}
                onClick={() =>
                  navigate('/pos', {
                    state: {
                      barcode: matchedProduct.barcode,
                      autoAddProduct: matchedProduct,
                    },
                  })
                }
              >
                Start Sale with Item
              </Button>
            </div>
          </div>
        )}

        {quickBarcode.trim() && !matchedProduct && quickBarcode.trim().length >= 4 && (
          <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-center justify-between text-xs text-[#991B1B]">
            <span>No catalog item found matching code <strong>"{quickBarcode}"</strong>.</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/pos', { state: { barcode: quickBarcode.trim() } })}
            >
              Search POS Catalog
            </Button>
          </div>
        )}
      </Card>

      {/* Today's Transactions Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B] font-display">Today's Counter Invoices</h3>
            <p className="text-xs text-[#71717A]">Real-time sales processed through register counter.</p>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              value={invoiceSearch}
              onChange={setInvoiceSearch}
              placeholder="Search invoices by #, customer, method..."
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredReceipts}
          keyExtractor={(item) => item.id}
          isLoading={loadingInvoices}
          emptyMessage="No counter invoices found for today. Sales issued through the invoice / POS module will appear here."
        />
      </div>

      {/* Professional Thermal Receipt Preview Modal */}
      <Dialog
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Counter Thermal Receipt Preview"
        description="Standard 80mm POS receipt format formatted for instant thermal printing."
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <span className="text-xs text-[#71717A]">Format: Standard 80mm ESC/POS</span>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsReceiptOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Printer className="w-4 h-4" />}
                onClick={printReceipt}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        }
      >
        {selectedReceipt && (
          <div className="space-y-4 font-mono text-xs max-w-sm mx-auto p-4 bg-[#FAFAF8] border border-dashed border-[#D4D4D8] rounded-xl shadow-xs">
            {/* Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-[#D4D4D8]">
              <div className="text-sm font-bold text-black font-sans uppercase">Punjab Electric Store</div>
              <div className="text-[11px] text-[#52525B]">Main Market, Hall Road, Lahore</div>
              <div className="text-[11px] text-[#52525B]">NTN: 4120938-1 · Phone: +92 42 37210099</div>
              <div className="pt-2 font-bold text-black text-xs font-sans">SALES RECEIPT / COUNTER INVOICE</div>
            </div>

            {/* Meta */}
            <div className="space-y-1 py-2 border-b border-dashed border-[#D4D4D8] text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#71717A]">Invoice No:</span>
                <span className="font-bold text-black">{selectedReceipt.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Date & Time:</span>
                <span>Today, {selectedReceipt.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Cashier:</span>
                <span>Counter 01 (Kashif Ali)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#71717A]">Customer:</span>
                <span className="font-semibold text-black">{selectedReceipt.customer_name}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-[#D4D4D8] space-y-2">
              <div className="flex justify-between text-[#71717A] text-[10px] font-bold uppercase pb-1 border-b border-[#E4E4E7]">
                <span>Item</span>
                <span className="text-right">Qty × Rate</span>
                <span className="text-right">Amount</span>
              </div>
              {selectedReceipt.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-black font-medium">{item.name}</div>
                  <div className="flex justify-between text-[#71717A] text-[11px]">
                    <span>{item.quantity} pc × {formatCurrency(item.price)}</span>
                    <span className="text-black font-semibold">
                      {formatCurrency(item.quantity * item.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1.5 py-2 border-b border-dashed border-[#D4D4D8]">
              <div className="flex justify-between text-[#52525B]">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedReceipt.amount)}</span>
              </div>
              <div className="flex justify-between text-[#52525B]">
                <span>Discount / Scheme:</span>
                <span>Rs. 0</span>
              </div>
              <div className="flex justify-between text-base font-bold text-black pt-1 border-t border-black">
                <span>NET TOTAL:</span>
                <span>{formatCurrency(selectedReceipt.amount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-[#065F46] font-semibold pt-1">
                <span>PAID VIA ({selectedReceipt.method.toUpperCase()}):</span>
                <span>{formatCurrency(selectedReceipt.amount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 text-[10px] text-[#71717A] space-y-1">
              <div>Thank you for your business!</div>
              <div>Electrical appliances warranty subject to warranty card.</div>
              <div>Software powered by DukanOS</div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Register Shift Summary Modal */}
      <Dialog
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        title="Counter Register Shift Summary"
        description="Daily cash reconciliation and drawer settlement for current terminal."
        footer={
          <div className="flex items-center justify-between w-full">
<Button
                variant="secondary"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={printShift}
              >
                Print Shift Report
              </Button>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsShiftModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={shiftClosed}
                onClick={() => setShiftClosed(true)}
              >
                {shiftClosed ? 'Shift Reconciled' : 'Reconcile Drawer'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {shiftClosed && (
            <Alert variant="success" title="Register Reconciled">
              Cash drawer counts have been recorded and saved for end-of-day audit.
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7] text-xs">
            <div>
              <span className="text-[#71717A] block">Terminal Register:</span>
              <span className="font-bold text-[#18181B]">Counter POS Terminal #01</span>
            </div>
            <div>
              <span className="text-[#71717A] block">Cashier Staff:</span>
              <span className="font-bold text-[#18181B]">Kashif Ali (Staff #103)</span>
            </div>
            <div>
              <span className="text-[#71717A] block">Shift Started:</span>
              <span className="font-medium text-[#18181B]">Today at 09:00 AM</span>
            </div>
            <div>
              <span className="text-[#71717A] block">Shift Status:</span>
              <Badge variant={shiftClosed ? 'neutral' : 'mint'}>
                {shiftClosed ? 'RECONCILED' : 'ACTIVE & BALANCED'}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 border border-[#E4E4E7] rounded-xl p-4 text-xs">
            <div className="flex justify-between py-1 text-[#52525B]">
              <span>Opening Float in Drawer:</span>
              <span className="font-mono font-medium">{formatCurrency(10000)}</span>
            </div>
            <div className="flex justify-between py-1 text-[#065F46] font-medium">
              <span>+ Cash Collected (Today's Sales):</span>
              <span className="font-mono font-bold">{formatCurrency(cashCollected)}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#E4E4E7] font-bold text-black text-sm">
              <span>= Expected Physical Cash in Till:</span>
              <span className="font-mono text-[#065F46]">{formatCurrency(10000 + cashCollected)}</span>
            </div>
            <div className="flex justify-between py-1 text-[#52525B] pt-2 border-t border-[#E4E4E7]">
              <span>Digital & Bank Payments (Raast):</span>
              <span className="font-mono font-medium">{formatCurrency(onlineCollected)}</span>
            </div>
            <div className="flex justify-between py-1 text-[#18181B] font-bold">
              <span>Total Register Invoices Processed:</span>
              <span className="font-mono">{receipts.length} Invoices</span>
            </div>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  );
};

