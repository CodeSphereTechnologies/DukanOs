import re

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('  };\n\n\n  };\n\n  const columns: Column<Invoice>[] = [', '  const itemCount = (inv: Invoice) => inv.items?.length || 0;\n  const hasItems = (inv: Invoice) => itemCount(inv) > 0;\n\n  const columns: Column<Invoice>[] = [')

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'w') as f:
    f.write(content)
