import re

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("addToast({ title: 'Notice', message: 'Returns module is currently under development.', type: 'info' })", "navigate(`/returns/new?invoice_id=${invoice?.id}`)")

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'w') as f:
    f.write(content)
