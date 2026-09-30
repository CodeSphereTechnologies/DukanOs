with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'r') as f:
    content = f.read()

# Add notes to printSalesDocument
old_print_call = """      totalAmount: invoice.total_amount,
      paymentRows: [
        { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
        ...(invoice.balance_amount > 0
          ? [{ label: 'Balance', value: formatCurrency(invoice.balance_amount) }]
          : []),
      ],
    });"""

new_print_call = """      totalAmount: invoice.total_amount,
      paymentRows: [
        { label: 'Paid', value: formatCurrency(invoice.paid_amount) },
        ...(invoice.balance_amount > 0
          ? [{ label: 'Balance', value: formatCurrency(invoice.balance_amount) }]
          : []),
      ],
      notes: invoice.notes,
    });"""

content = content.replace(old_print_call, new_print_call)

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'w') as f:
    f.write(content)
