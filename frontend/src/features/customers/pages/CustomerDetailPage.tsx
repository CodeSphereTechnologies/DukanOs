import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  History,
  ShoppingCart,
  RotateCcw,
  CornerDownRight,
  Pencil,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { LoadingState } from '../../../components/ui/LoadingState';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import type { Customer, CustomerLedgerEntry } from '../../../types/customer.types';
import type { Invoice, Quotation } from '../../../types/invoice.types';
import { customerService } from '../../../services/customer.service';
import { invoiceService } from '../../../services/invoice.service';
import { returnService } from '../../../services/return.service';
import type { SaleReturn } from '../../../types/invoice.types';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const cust = await customerService.getById(customerId);
      const ledg = await customerService.getLedger(customerId);
      const inv = await invoiceService.getAll();
      const quo = await invoiceService.getQuotations();
      const ret = await returnService.getAll();
      if (!active) return;
      setCustomer(cust);
      setLedger(ledg.data || []);
      setInvoices(inv.data || []);
      setQuotations(quo.data || []);
      setReturns(ret.data || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [customerId]);

  const stats = useMemo(() => {
    const customerInvoices = invoices.filter((i) => i.customer_id === customerId);
    const customerReturns = returns.filter((r) => r.customer?.id === customerId || r.customer_id === customerId);
    const totalRefunded = customerReturns.reduce((sum, r) => sum + r.total_amount, 0);
    const customerQuotations = quotations.filter((q) => q.customer_id === customerId);
    const totalBilled = customerInvoices.reduce((sum, i) => sum + i.total_amount, 0);
    const totalPaid = customerInvoices.reduce(
      (sum, i) => sum + (i.payment_status === 'paid' ? i.total_amount : i.paid_amount || 0),
      0
    );
    const ledgerActivity = ledger.reduce(
      (acc, e) => {
        if (e.transaction_type === 'debit') acc.debits += e.amount;
        else acc.credits += e.amount;
        return acc;
      },
      { debits: 0, credits: 0 }
    );
    return {
      invoices: customerInvoices.length,
      returns: customerReturns.length,
      totalRefunded,
      quotations: customerQuotations.length,
      totalBilled,
      totalPaid,
      ledgerActivity,
    };
  }, [invoices, quotations, ledger, customerId]);

  if (loading) {
    return <LoadingState fullPage message="Loading customer..." />;
  }

  if (!customer) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <EmptyState
          title="Customer not found"
          description="This customer may have been deleted. Go back to the customer list to continue."
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/customers')}>
              Back to Customers
            </Button>
          }
        />
      </div>
    );
  }

  const initials = customer.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const ledgerRows = [...ledger].sort((a, b) =>
    b.date > a.date ? 1 : b.date < a.date ? -1 : b.id - a.id
  );

  const customerInvoices = invoices
    .filter((i) => i.customer_id === customerId)
    .sort((a, b) => b.invoice_date > a.invoice_date ? 1 : -1);

  const customerReturns = returns
    .filter((r) => r.customer?.id === customerId || r.customer_id === customerId)
    .sort((a, b) => b.return_date > a.return_date ? 1 : -1);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            to="/customers"
            className="mt-0.5 p-2 rounded-full bg-white hover:bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] transition-colors shrink-0"
            aria-label="Back to customers"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-display truncate">
                {customer.name}
              </h1>
              <Badge variant={customer.status === 'active' ? 'mint' : 'neutral'}>
                {customer.status}
              </Badge>
            </div>
            <p className="text-xs text-[#71717A] mt-1 font-mono">
              Customer #{String(customer.id).padStart(4, '0')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Pencil className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="w-full">
        <div className="p-4 bg-[#FAFAF8] rounded-2xl border border-[#E4E4E7] flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#000000] text-white flex items-center justify-center font-semibold text-lg shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-semibold text-[#18181B] truncate">{customer.name}</h4>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#71717A]">
              {customer.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {customer.phone}
                </span>
              )}
              {customer.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {customer.email}
                </span>
              )}
              {customer.address && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {customer.address}
                </span>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-[11px] uppercase tracking-wide text-[#71717A] mb-1">
              Outstanding Balance
            </div>
            {(customer.current_balance || 0) === 0 ? (
              <div className="inline-flex items-center gap-1.5 text-[#71717A]">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xl font-bold">Settled (0)</span>
              </div>
            ) : (customer.current_balance || 0) > 0 ? (
              <div className="flex flex-col items-start sm:items-end">
                <div className="inline-flex items-center gap-1.5 text-[#DC2626]" title="Customer Owes Us">
                  <ArrowUpRight className="w-5 h-5" />
                  <span className="text-xl font-bold">{formatCurrency(Math.abs(customer.current_balance || 0))}</span>
                </div>
                <div className="text-[10px] text-[#DC2626] font-medium uppercase tracking-wider mt-0.5">Customer Owes Us</div>
              </div>
            ) : (
              <div className="flex flex-col items-start sm:items-end">
                <div className="inline-flex items-center gap-1.5 text-[#059669]" title="We Owe Customer (Advance)">
                  <ArrowDownLeft className="w-5 h-5" />
                  <span className="text-xl font-bold">{formatCurrency(Math.abs(customer.current_balance || 0))}</span>
                </div>
                <div className="text-[10px] text-[#059669] font-medium uppercase tracking-wider mt-0.5">We Owe Customer</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Member Since" value={customer.created_at ? formatDate(customer.created_at) : 'N/A'} />
        <Stat label="Invoices" value={String(stats.invoices)} sub={`${stats.quotations} quotation(s)`} />
        <Stat label="Total Billed" value={formatCurrency(stats.totalBilled)} />
        <Stat label="Total Paid" value={formatCurrency(stats.totalPaid)} accent="#065F46" />
        <Stat label="Total Refunded" value={formatCurrency(stats.totalRefunded)} accent="#DC2626" />
      </div>

      {/* Ledger Transactions */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#71717A]" /> Ledger Transactions
        </h3>
        {ledgerRows.length === 0 ? (
          <EmptyState
            title="No ledger activity"
            description="On-account transactions for this customer will appear here once sales or payments are recorded."
          />
        ) : (
          <div className="border border-[#E4E4E7] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#FAFAF8] text-[#71717A] font-semibold">
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Debit / Credit</th>
                  <th className="px-3 py-2.5 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {ledgerRows.slice(0, 12).map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#FAFAF8]">
                    <td className="px-3 py-2.5 text-[#71717A] whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-3 py-2.5 text-[#18181B]">{entry.description}</td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {entry.transaction_type === 'debit' ? (
                        <div className="inline-flex items-center gap-1 text-[#DC2626] font-semibold" title="Added to what customer owes (Debit)">
                           <ArrowUpRight className="w-3.5 h-3.5" />
                           {formatCurrency(Math.abs(entry.amount))}
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 text-[#059669] font-semibold" title="Paid by customer (Credit)">
                           <ArrowDownLeft className="w-3.5 h-3.5" />
                           {formatCurrency(Math.abs(entry.amount))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {entry.running_balance === 0 ? (
                        <span className="font-bold text-[#71717A]">PKR 0.00</span>
                      ) : entry.running_balance > 0 ? (
                        <span className="font-bold text-[#DC2626]" title="Customer Owes Us">{formatCurrency(Math.abs(entry.running_balance))} <span className="text-[9px] uppercase ml-1">Dr</span></span>
                      ) : (
                        <span className="font-bold text-[#059669]" title="We Owe Customer">{formatCurrency(Math.abs(entry.running_balance))} <span className="text-[9px] uppercase ml-1">Cr</span></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Returns */}
      {customerReturns.length > 0 && (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
          <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-[#DC2626]" /> Sales Returns
          </h3>
          <div className="border border-[#E4E4E7] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="bg-[#FAFAF8] text-[#71717A] uppercase font-medium border-b border-[#E4E4E7]">
                  <th className="px-3 py-2.5">Return #</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Method</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {customerReturns.slice(0, 8).map((ret) => (
                  <tr key={ret.id} className="hover:bg-[#FAFAF8] cursor-pointer" onClick={() => navigate(`/returns/${ret.id}`)}>
                    <td className="px-3 py-2.5 font-mono text-[#2563EB] hover:underline">
                      {ret.return_number}
                    </td>
                    <td className="px-3 py-2.5 text-[#52525B]">{formatDate(ret.return_date)}</td>
                    <td className="px-3 py-2.5 capitalize text-[#52525B]">{ret.refund_type.replace('_', ' ')}</td>
                    <td className="px-3 py-2.5 text-right font-medium text-[#DC2626]">
                      {formatCurrency(ret.total_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant={ret.status === 'processed' || ret.status === 'completed' ? 'mint' : 'warning'}>
                        {ret.status || 'Completed'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-subtle">
        <h3 className="text-sm font-semibold text-[#18181B] mb-4 flex items-center gap-1.5">
          <ShoppingCart className="w-4 h-4 text-[#71717A]" /> Purchase History
        </h3>
        {customerInvoices.length === 0 ? (
          <EmptyState
            title="No purchases yet"
            description="Invoices for this customer will appear here once a sale is completed on the POS."
          />
        ) : (
          <div className="border border-[#E4E4E7] rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[520px]">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#FAFAF8] text-[#71717A] font-semibold">
                  <th className="px-3 py-2.5">Invoice</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Items</th>
                  <th className="px-3 py-2.5 text-right">Amount</th>
                  <th className="px-3 py-2.5 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7]/60">
                {customerInvoices.slice(0, 8).map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAFAF8]">
                    <td className="px-3 py-2.5 font-mono text-[#18181B]">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#A1A1AA]" />
                        {inv.invoice_number}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[#52525B] whitespace-nowrap">
                      {formatDate(inv.invoice_date)}
                    </td>
                    <td className="px-3 py-2.5 text-[#52525B]">
                      {inv.items.reduce((sum, i) => sum + i.quantity, 0)} item(s)
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant={
                          inv.payment_status === 'paid'
                            ? 'mint'
                            : inv.payment_status === 'ledger'
                              ? 'warning'
                              : 'neutral'
                        }
                        size="sm"
                      >
                        {inv.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes footer link */}
      <div className="flex items-center justify-center pt-2">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<CornerDownRight className="w-3.5 h-3.5" />}
          onClick={() => navigate('/customers')}
        >
          Back to All Customers
        </Button>
      </div>
    </div>
  );
};

function Stat({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#E4E4E7]">
      <div className="text-[11px] uppercase tracking-wide text-[#71717A]">{label}</div>
      <div className="mt-1 text-sm sm:text-base font-bold text-[#18181B]" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-[#A1A1AA]">{sub}</div>}
    </div>
  );
}