import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { SearchToolbar } from '../../../components/ui/SearchToolbar';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog } from '../../../components/ui/Dialog';
import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Alert } from '../../../components/ui/Alert';
import {
  Plus,
  ArrowRight,
  Printer,
  Trash2,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Eye,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { invoiceService } from '../../../services/invoice.service';
import type { Quotation, InvoiceItem } from '../../../types/invoice.types';

const CATALOG_ITEMS = [
  { id: 1, name: 'Royal Deluxe Fan 56"', sku: 'ROY-FAN-56', price: 9500 },
  { id: 2, name: 'Pakistan Cables 7/29 Single Core Red 90m', sku: 'PAK-CAB-729R', price: 14500 },
  { id: 3, name: 'Philips LED Bulb 18W Cool Daylight E27', sku: 'PHI-LED-18W', price: 650 },
  { id: 4, name: 'Schneider MCB 32A Double Pole 6kA', sku: 'SCH-MCB-32DP', price: 2200 },
  { id: 5, name: 'Pak Fan Bracket Fan 18" Remote Control', sku: 'PAK-FAN-18B', price: 12800 },
  { id: 6, name: 'Osaka Tube Light LED 36W Complete Set', sku: 'OSK-TUB-36W', price: 1850 },
];

const PRESET_CUSTOMERS = [
  { id: 1, name: 'Chaudhry Bilal (Contractor)', phone: '+92 300 1234567' },
  { id: 2, name: 'Tariq Electric Works', phone: '+92 321 9876543' },
  { id: 3, name: 'Al-Madina Construction', phone: '+92 300 7654321' },
  { id: 4, name: 'Walk-in Customer', phone: '' },
];

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Create Form State
  const [customerMode, setCustomerMode] = useState<'preset' | 'custom'>('preset');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('1');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<Quotation['status']>('sent');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('50% advance upon confirmation. Validity: 14 days.');
  const [error, setError] = useState<string | null>(null);

  // Line items for form
  const [formItems, setFormItems] = useState<
    {
      product_id: number;
      product_name: string;
      sku: string;
      unit_price: number;
      quantity: number;
      discount_amount: number;
    }[]
  >([
    {
      product_id: 1,
      product_name: 'Royal Deluxe Fan 56"',
      sku: 'ROY-FAN-56',
      unit_price: 9500,
      quantity: 5,
      discount_amount: 0,
    },
  ]);

  const loadQuotations = async () => {
    const res = await invoiceService.getQuotations();
    if (res.data) setQuotations(res.data);
  };

  useEffect(() => {
    loadQuotations();
  }, []);

  const subtotal = useMemo(() => {
    return formItems.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [formItems]);

  const estimatedTotal = useMemo(() => {
    return Math.max(0, subtotal - Number(discountAmount || 0));
  }, [subtotal, discountAmount]);

  const handleAddItem = () => {
    setFormItems((prev) => [
      ...prev,
      {
        product_id: 3,
        product_name: 'Philips LED Bulb 18W Cool Daylight E27',
        sku: 'PHI-LED-18W',
        unit_price: 650,
        quantity: 10,
        discount_amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductSelect = (index: number, productId: number) => {
    const found = CATALOG_ITEMS.find((c) => c.id === productId);
    if (!found) return;
    setFormItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              product_id: found.id,
              product_name: found.name,
              sku: found.sku,
              unit_price: found.price,
            }
          : item
      )
    );
  };

  const handleItemQuantityChange = (index: number, qty: number) => {
    setFormItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: Math.max(1, qty) } : item
      )
    );
  };

  const handleItemPriceChange = (index: number, price: number) => {
    setFormItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, unit_price: price } : item))
    );
  };

  const handleResetForm = () => {
    setSelectedCustomerId('1');
    setCustomerMode('preset');
    setCustomCustomerName('');
    setCustomCustomerPhone('');
    setQuotationDate(new Date().toISOString().split('T')[0]);
    setValidUntil(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    setStatus('sent');
    setDiscountAmount(0);
    setNotes('50% advance upon confirmation. Validity: 14 days.');
    setError(null);
    setFormItems([
      {
        product_id: 1,
        product_name: 'Royal Deluxe Fan 56"',
        sku: 'ROY-FAN-56',
        unit_price: 9500,
        quantity: 5,
        discount_amount: 0,
      },
    ]);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let customerName = '';
    let customerId: number | undefined = undefined;

    if (customerMode === 'preset') {
      const found = PRESET_CUSTOMERS.find((c) => c.id === Number(selectedCustomerId));
      if (found) {
        customerName = found.name;
        customerId = found.id;
      }
    } else {
      if (!customCustomerName.trim()) {
        setError('Please enter a customer name.');
        return;
      }
      customerName = customCustomerName.trim();
    }

    if (formItems.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    const items: InvoiceItem[] = formItems.map((item, idx) => ({
      id: idx + 1,
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      unit_price: item.unit_price,
      quantity: item.quantity,
      discount_amount: item.discount_amount,
      total_price: item.unit_price * item.quantity,
    }));

    try {
      const res = await invoiceService.createQuotation({
        customer_id: customerId,
        customer: {
          id: customerId || 0,
          name: customerName,
          status: 'active',
          current_balance: 0,
          phone: customCustomerPhone || undefined,
        },
        quotation_date: quotationDate,
        valid_until: validUntil,
        status,
        subtotal,
        discount_amount: Number(discountAmount) || 0,
        total_amount: estimatedTotal,
        notes,
        items,
      });

      if (res.data) {
        setQuotations((prev) => [res.data!, ...prev.filter((q) => q.id !== res.data!.id)]);
        setSuccessBanner(
          `Quotation ${res.data.quotation_number} created for ${customerName} (${formatCurrency(
            estimatedTotal
          )})`
        );
      }

      setIsCreateOpen(false);
      handleResetForm();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create quotation');
    }
  };

  const handleConvertToInvoice = async (q: Quotation) => {
    try {
      const res = await invoiceService.convertQuotationToInvoice(q.id);
      setQuotations((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, status: 'converted' } : item))
      );
      setSuccessBanner(
        `Quotation ${q.quotation_number} converted to Invoice #${res.data?.invoice_number}! Ledger & stock reservation updated.`
      );
    } catch {
      alert('Failed to convert quotation.');
    }
  };

  const handleOpenPreview = (q: Quotation) => {
    setSelectedQuote(q);
    setIsPreviewOpen(true);
  };

  const filtered = quotations.filter(
    (q) =>
      q.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer?.name && q.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (q.notes && q.notes.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: Column<Quotation>[] = [
    {
      key: 'quotation_number',
      header: 'Quotation #',
      render: (q) => (
        <div>
          <span className="font-semibold text-black">{q.quotation_number}</span>
          <div className="text-[11px] text-[#71717A]">Issued: {formatDate(q.quotation_date)}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (q) => (
        <div>
          <span className="font-medium text-[#18181B]">{q.customer?.name || 'Walk-in'}</span>
          {q.customer?.phone && (
            <div className="text-[11px] text-[#71717A]">{q.customer.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Estimated Total',
      align: 'right',
      render: (q) => (
        <div>
          <span className="font-bold text-black">{formatCurrency(q.total_amount)}</span>
          {q.discount_amount > 0 && (
            <div className="text-[11px] text-[#DC2626]">
              - {formatCurrency(q.discount_amount)} disc.
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (q) => {
        const variants: Record<string, 'mint' | 'default' | 'neutral' | 'warning' | 'destructive'> = {
          accepted: 'mint',
          sent: 'default',
          draft: 'neutral',
          converted: 'mint',
          rejected: 'destructive',
        };
        return (
          <Badge variant={variants[q.status] || 'neutral'}>
            {q.status.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      key: 'valid_until',
      header: 'Valid Until',
      align: 'right',
      render: (q) => (
        <span className="text-xs text-[#52525B] font-mono">{formatDate(q.valid_until)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (q) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Preview & print quotation"
            onClick={() => handleOpenPreview(q)}
          >
            <Eye className="w-4 h-4 text-[#52525B]" />
          </Button>

          {q.status !== 'converted' ? (
            <Button
              variant="secondary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              onClick={() => handleConvertToInvoice(q)}
            >
              Convert
            </Button>
          ) : (
            <Badge variant="neutral" className="text-[11px] bg-[#F4F4F5] text-[#71717A]">
              Converted
            </Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Estimates & Quotations"
      subtitle="Non-financial draft estimates. Converting automatically generates sales invoices and deducts inventory."
      primaryAction={
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Create Quotation
        </Button>
      }
    >
      <div className="space-y-4">
        {successBanner && (
          <Alert variant="success" onClose={() => setSuccessBanner(null)}>
            {successBanner}
          </Alert>
        )}

        <SearchToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search quotations by number, customer, or terms..."
        />

        <DataTable columns={columns} data={filtered} keyExtractor={(item) => item.id} />
      </div>

      {/* Create Quotation Modal */}
      <Dialog
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          handleResetForm();
        }}
        maxWidth="xl"
        title="Create Price Estimate / Quotation"
        description="Draft a formal commercial pricing proposal. Non-binding until converted to invoice."
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <div className="text-xs">
              <span className="text-[#71717A]">Estimated Total: </span>
              <span className="font-extrabold text-base text-black font-mono">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCreateOpen(false);
                  handleResetForm();
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateQuotation}>
                Save Quotation
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleCreateQuotation} className="space-y-5">
          {error && (
            <Alert variant="error" title="Required Information">
              {error}
            </Alert>
          )}

          {/* Customer Selection */}
          <div className="space-y-3 p-4 bg-[#FAFAF8] rounded-xl border border-[#E4E4E7]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#18181B] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#065F46]" />
                Customer Details
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('preset')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    customerMode === 'preset'
                      ? 'bg-black text-white font-medium'
                      : 'text-[#71717A] hover:bg-[#E4E4E7]'
                  }`}
                >
                  Existing Account
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('custom')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer transition-colors ${
                    customerMode === 'custom'
                      ? 'bg-black text-white font-medium'
                      : 'text-[#71717A] hover:bg-[#E4E4E7]'
                  }`}
                >
                  New / Walk-in
                </button>
              </div>
            </div>

            {customerMode === 'preset' ? (
              <FormField label="Select Customer Account" required>
                <Select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  options={PRESET_CUSTOMERS.map((c) => ({
                    label: `${c.name} ${c.phone ? `(${c.phone})` : ''}`,
                    value: String(c.id),
                  }))}
                />
              </FormField>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Customer / Business Name" required>
                  <Input
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    placeholder="e.g. Kasur Construction Co."
                    autoFocus
                  />
                </FormField>
                <FormField label="Contact Phone">
                  <Input
                    value={customCustomerPhone}
                    onChange={(e) => setCustomCustomerPhone(e.target.value)}
                    placeholder="e.g. +92 300 9876543"
                  />
                </FormField>
              </div>
            )}
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Quotation Date">
              <Input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
              />
            </FormField>

            <FormField label="Validity Period Until">
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </FormField>

            <FormField label="Proposal Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Quotation['status'])}
                options={[
                  { label: 'Sent (Delivered to client)', value: 'sent' },
                  { label: 'Draft (Internal review)', value: 'draft' },
                  { label: 'Accepted (Agreed by client)', value: 'accepted' },
                ]}
              />
            </FormField>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#18181B]">
                Appliance Items & Pricing ({formItems.length})
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-3 h-3" />}
                onClick={handleAddItem}
              >
                Add Line Item
              </Button>
            </div>

            <div className="space-y-2 border border-[#E4E4E7] rounded-xl p-3 bg-white">
              {formItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:items-center py-2.5 border-b border-[#F4F4F5] last:border-0"
                >
                  <div className="w-full sm:col-span-5">
                    <label className="text-[10px] text-[#71717A] block mb-0.5">Product</label>
                    <Select
                      value={String(item.product_id)}
                      onChange={(e) => handleProductSelect(idx, Number(e.target.value))}
                      options={CATALOG_ITEMS.map((c) => ({
                        label: `${c.name} (${formatCurrency(c.price)})`,
                        value: String(c.id),
                      }))}
                    />
                  </div>

                  <div className="w-full grid grid-cols-2 sm:contents gap-2">
                    <div className="sm:col-span-3">
                      <label className="text-[10px] text-[#71717A] block mb-0.5">Unit Rate (PKR)</label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => handleItemPriceChange(idx, Number(e.target.value))}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-[#71717A] block mb-0.5">Quantity</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(idx, Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="w-full sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-3">
                    <span className="text-xs font-bold text-black font-mono">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </span>
                    {formItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-[#A1A1AA] hover:text-[#DC2626] rounded cursor-pointer"
                        title="Remove line item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount & Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormField label="Commercial Discount (PKR)">
              <Input
                type="number"
                min={0}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                placeholder="e.g. 5000"
              />
            </FormField>

            <FormField label="Payment Terms / Conditions">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 50% advance, validity 14 days."
              />
            </FormField>
          </div>
        </form>
      </Dialog>

      {/* Preview / Print Quotation Dialog */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Quotation Document Preview"
        description="Formal pricing document ready for customer submission or PDF print."
        footer={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Printer className="w-4 h-4" />}
              onClick={() => window.print()}
              className="w-full sm:w-auto"
            >
              Print Quotation
            </Button>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Close
              </Button>
              {selectedQuote && selectedQuote.status !== 'converted' && (
                <Button
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleConvertToInvoice(selectedQuote);
                  }}
                >
                  Convert to Invoice
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedQuote && (
          <div className="space-y-4 p-4 bg-white border border-[#E4E4E7] rounded-xl text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-[#E4E4E7]">
              <div>
                <h4 className="text-base font-bold text-black font-display">
                  PUNJAB ELECTRIC STORE
                </h4>
                <div className="text-[11px] text-[#71717A]">
                  Main Market, Hall Road, Lahore · Tel: +92 42 37210099
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-sm text-black">{selectedQuote.quotation_number}</div>
                <Badge variant="default" className="mt-1">
                  ESTIMATE ({selectedQuote.status.toUpperCase()})
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 p-3 bg-[#FAFAF8] rounded-lg">
              <div>
                <span className="text-[#71717A] block">Customer:</span>
                <span className="font-semibold text-black text-sm">
                  {selectedQuote.customer?.name || 'Walk-in'}
                </span>
                {selectedQuote.customer?.phone && (
                  <div className="text-[11px] text-[#52525B]">{selectedQuote.customer.phone}</div>
                )}
              </div>
              <div className="text-right">
                <div>
                  <span className="text-[#71717A]">Issue Date: </span>
                  <span className="font-medium">{formatDate(selectedQuote.quotation_date)}</span>
                </div>
                <div>
                  <span className="text-[#71717A]">Valid Until: </span>
                  <span className="font-bold text-black">{formatDate(selectedQuote.valid_until)}</span>
                </div>
              </div>
            </div>

            <div className="border border-[#E4E4E7] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F4F4F5] text-[#71717A] text-[11px]">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Rate</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {selectedQuote.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-black">
                        {item.product_name}
                        {item.sku && <div className="text-[10px] text-[#71717A] font-mono">{item.sku}</div>}
                      </td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="p-2.5 text-center">{item.quantity}</td>
                      <td className="p-2.5 text-right font-bold font-mono">
                        {formatCurrency(item.total_price || item.unit_price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <div className="w-60 space-y-1.5">
                <div className="flex justify-between text-[#71717A]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCurrency(selectedQuote.subtotal)}</span>
                </div>
                {selectedQuote.discount_amount > 0 && (
                  <div className="flex justify-between text-[#DC2626]">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrency(selectedQuote.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-black pt-1 border-t border-black">
                  <span>Grand Total:</span>
                  <span className="font-mono text-[#065F46]">
                    {formatCurrency(selectedQuote.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {selectedQuote.notes && (
              <div className="p-2.5 bg-[#FAFAF8] rounded-md text-[11px] text-[#52525B]">
                <strong>Terms:</strong> {selectedQuote.notes}
              </div>
            )}
          </div>
        )}
      </Dialog>
    </PageContainer>
  );
};

