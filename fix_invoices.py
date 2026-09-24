import re

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'const itemCount = \(inv: Invoice\).*?return \{ subtotal: inv\.subtotal, discount: inv\.discount_amount, total: inv\.total_amount \};\n  \};\n', '', content, flags=re.DOTALL)

with open('frontend/src/features/invoices/pages/InvoicesPage.tsx', 'w') as f:
    f.write(content)
