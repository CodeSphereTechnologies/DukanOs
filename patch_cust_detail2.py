with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

old_header_balance = """            <div className="text-[11px] uppercase tracking-wide text-[#71717A]">
              Outstanding Balance
            </div>
            <div
              className={`text-xl font-bold ${
                (customer.current_balance || 0) > 0 ? 'text-[#DC2626]' : 'text-[#065F46]'
              }`}
            >
              {formatCurrency(customer.current_balance || 0)}
            </div>"""

new_header_balance = """            <div className="text-[11px] uppercase tracking-wide text-[#71717A] mb-1">
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
            )}"""

content = content.replace(old_header_balance, new_header_balance)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
