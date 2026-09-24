import re

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'r') as f:
    content = f.read()

# Replace the broken title section
bad_pattern = r'title={`Invoice \${invoice.invoice_number}`}.*?</span>\n        </div>\n      }'
good_replacement = r'title={`Invoice ${invoice.invoice_number}`}'
content = re.sub(bad_pattern, good_replacement, content, flags=re.DOTALL)

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'w') as f:
    f.write(content)
