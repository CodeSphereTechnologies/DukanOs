with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

# Replace StatCards in CustomersPage
old_stats = """      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Receivables"
          value={formatCurrency(stats.totalReceivable)}
          trend={`${stats.oweUsCount} customers in debt`}
          trendUp={true}
          icon="Wallet"
          accentColor="#DC2626"
        />
        <StatCard
          title="Total Payables (Advances)"
          value={formatCurrency(stats.totalPayable)}
          trend="Advance payments received"
          trendUp={false}
          icon="Banknote"
          accentColor="#059669"
        />
        <StatCard
          title="Customers in Debt"
          value={stats.oweUsCount.toString()}
          trend="Owe us money"
          icon="Users"
        />
        <StatCard
          title="Total Customers"
          value={stats.total.toString()}
          trend="Active profiles"
          icon="Contact"
        />
      </div>"""

new_stats = """      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Receivables"
          value={formatCurrency(stats.totalReceivable)}
          change={{ value: `${stats.oweUsCount} customers in debt`, trend: 'neutral' }}
        />
        <StatCard
          title="Total Payables (Advances)"
          value={formatCurrency(stats.totalPayable)}
          change={{ value: "Advance payments received", trend: 'neutral' }}
        />
        <StatCard
          title="Customers in Debt"
          value={stats.oweUsCount.toString()}
          change={{ value: "Owe us money", trend: 'neutral' }}
        />
        <StatCard
          title="Total Customers"
          value={stats.total.toString()}
          change={{ value: "Active profiles", trend: 'neutral' }}
        />
      </div>"""

content = content.replace(old_stats, new_stats)

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)


with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    cdp = f.read()

if "import { ArrowUpRight" not in cdp:
    # Safely insert the import at the top
    import_statement = "import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';\n"
    cdp = import_statement + cdp

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(cdp)
