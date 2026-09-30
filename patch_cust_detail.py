import re

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

# Fix the import
content = content.replace("import { CornerDownRight, FileText, RotateCcw, ShoppingCart } from 'lucide-react';", "import { CornerDownRight, FileText, RotateCcw, ShoppingCart, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';")

# 1. Update the 'Dashboard Cards' part of CustomerDetailPage
# Replace old dashboard cards block
old_dashboard = """      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Stat
          label="Outstanding Balance"
          value={formatCurrency(customer.current_balance)}
          accent={(customer.current_balance || 0) > 0 ? '#DC2626' : '#065F46'}
        />"""

new_dashboard = """      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="p-3 sm:p-4 bg-white rounded-xl border border-[#E4E4E7]">
          <div className="text-[11px] uppercase tracking-wide text-[#71717A]">Ledger Balance</div>
          {(customer.current_balance || 0) === 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-[#71717A]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm sm:text-base font-bold">Settled (0)</span>
            </div>
          ) : (customer.current_balance || 0) > 0 ? (
            <div>
              <div className="mt-1 flex items-center gap-1.5 text-[#DC2626]">
                <ArrowUpRight className="w-5 h-5" />
                <span className="text-sm sm:text-base font-bold">{formatCurrency(Math.abs(customer.current_balance || 0))}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#DC2626] font-medium uppercase tracking-wider">Customer Owes Us</div>
            </div>
          ) : (
            <div>
              <div className="mt-1 flex items-center gap-1.5 text-[#059669]">
                <ArrowDownLeft className="w-5 h-5" />
                <span className="text-sm sm:text-base font-bold">{formatCurrency(Math.abs(customer.current_balance || 0))}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-[#059669] font-medium uppercase tracking-wider">We Owe Customer</div>
            </div>
          )}
        </div>"""
content = content.replace(old_dashboard, new_dashboard)

# 2. Fix the ledger table rows
old_ledger_amount = """                    <td
                      className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${
                        entry.transaction_type === 'debit' ? 'text-[#DC2626]' : 'text-[#065F46]'
                      }`}
                    >
                      {entry.transaction_type === 'debit' ? '+' : '-'}
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap">
                      {formatCurrency(entry.running_balance)}
                    </td>"""

new_ledger_amount = """                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
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
                    </td>"""

content = content.replace(old_ledger_amount, new_ledger_amount)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
