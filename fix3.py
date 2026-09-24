import re

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'r') as f:
    content = f.read()

# match openDetail up to columns
pattern = r'(const openDetail = \(inv: Invoice\) => \{\s+navigate\(\`/invoices/\$\{inv\.id\}\`\);\s+\};).*?(const columns: Column<Invoice>\[\] = \[)'
replacement = r'\1\n\n  const itemCount = (inv: Invoice) => inv.items?.length || 0;\n  const hasItems = (inv: Invoice) => itemCount(inv) > 0;\n\n  \2'
content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'w') as f:
    f.write(content)
