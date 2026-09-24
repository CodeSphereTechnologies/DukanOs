import re

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'r') as f:
    content = f.read()

# Add useToast import
content = content.replace(
    "import { ArrowLeft, Printer, Download, RotateCcw, User, Mail, Receipt, ExternalLink } from 'lucide-react';",
    "import { ArrowLeft, Printer, Download, RotateCcw, User, Mail, Receipt, ExternalLink } from 'lucide-react';\nimport { useToast } from '../../../hooks/useToast';"
)

# Add useToast hook inside component and printInvoice function
hooks_insert = """  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const printInvoice = () => {
    if (!invoice) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const t = { subtotal: invoice.subtotal, discount: invoice.discount_amount, total: invoice.total_amount };
    const rows = (invoice.items || []).map(item => `
          <tr>
            <td>${item.product_name}${item.discount_amount > 0 ? `<br/><span class="muted">- ${formatCurrency(item.discount_amount)} line discount</span>` : ''}</td>
            <td class="num">${item.quantity} x ${formatCurrency(item.unit_price)}</td>
            <td class="num">${formatCurrency(item.total_price)}</td>
          </tr>
    `).join('');

    w.document.write(`<!doctype html><html><head><title>${invoice.invoice_number}</title>
<style>
  body { font-family: monospace; width: 320px; margin: 24px auto; color: #000; font-size: 12px; }
  .center { text-align: center; }
  .dash { text-align: center; margin: 8px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; }
  .num { text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  .muted { color: #666; font-size: 10px; }
  .bold { font-weight: bold; }
  th { text-align: left; }
</style></head><body>
  <div class="center">
    <div class="bold" style="font-size:16px;letter-spacing:2px">DUKANOS</div>
    <div>ELECTRICAL &amp; APPLIANCE STORE</div>
    <div>Main Bazar Road, City 46000 &middot; Tel: 0300-1234567</div>
  </div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>INVOICE</span><span class="bold">#${invoice.invoice_number}</span></div>
  <div class="row"><span>Date</span><span>${formatDate(invoice.invoice_date)}</span></div>
  <div class="row"><span>Customer</span><span class="bold">${invoice.customer?.name || 'Walk-in Customer'}</span></div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <table><thead><tr><th>ITEM</th><th class="num">QTY x RATE</th><th class="num">AMOUNT</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="row"><span>Subtotal</span><span class="num">${formatCurrency(t.subtotal)}</span></div>
  ${t.discount > 0 ? `<div class="row"><span>Discount</span><span class="num">- ${formatCurrency(t.discount)}</span></div>` : ''}
  <div class="row bold" style="font-size:13px"><span>TOTAL</span><span class="num">${formatCurrency(t.total)}</span></div>
  <div class="row"><span>Paid</span><span class="num">${formatCurrency(invoice.paid_amount)}</span></div>
  ${invoice.balance_amount > 0 ? `<div class="row"><span>Balance</span><span class="num">${formatCurrency(invoice.balance_amount)}</span></div>` : ''}
  <div class="dash">* * *</div>
  <div class="center muted">THANK YOU FOR YOUR PURCHASE!<br/>Goods once sold will not be taken back.</div>
</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 250);
  };
"""

content = re.sub(
    r"  const { id } = useParams\s*<\s*\{\s*id:\s*string\s*\}\s*>\s*\(\);\n  const navigate = useNavigate\(\);\n  const \[invoice, setInvoice\] = useState<Invoice \| null>\(null\);\n  const \[loading, setLoading\] = useState\(true\);",
    hooks_insert,
    content
)

# Update the buttons
buttons_find = """        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Printer className="w-4 h-4" />}>
            Print
          </Button>
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>
            PDF
          </Button>
          <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />}>
            Create Return
          </Button>
        </div>"""

buttons_replace = """        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Printer className="w-4 h-4" />} onClick={printInvoice}>
            Print
          </Button>
          <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} onClick={printInvoice}>
            PDF
          </Button>
          <Button variant="primary" leftIcon={<RotateCcw className="w-4 h-4" />} onClick={() => showToast('Returns module is currently under development.', 'info')}>
            Create Return
          </Button>
        </div>"""

content = content.replace(buttons_find, buttons_replace)

with open('frontend/src/features/invoices/pages/InvoiceDetailPage.tsx', 'w') as f:
    f.write(content)
