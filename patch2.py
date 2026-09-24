import re

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("const { showToast } = useToast();", "const { addToast } = useToast();")
content = content.replace(
    "onClick={() => showToast('Returns module is currently under development.', 'info')}",
    "onClick={() => addToast({ title: 'Notice', message: 'Returns module is currently under development.', type: 'info' })}"
)

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'w') as f:
    f.write(content)
