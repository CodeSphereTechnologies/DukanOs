with open('frontend/src/features/returns/pages/ReturnDetailPage.tsx', 'r') as f:
    content = f.read()

import re

# Add Printer icon to imports
content = content.replace("ArrowLeft, RotateCcw, User, ExternalLink", "ArrowLeft, RotateCcw, User, ExternalLink, Printer")
content = content.replace("import { Card } from '../../../components/ui/Card';", "import { Card } from '../../../components/ui/Card';\nimport { Button } from '../../../components/ui/Button';")

# Add print logic
print_logic = """  const handlePrintReturn = () => {
    if (!saleReturn) return;
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    
    win.document.write(`
      <html>
        <head>
          <title>Return Receipt ${saleReturn.return_number}</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; color: #000; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f4f4f5; }
            .right { text-align: right; }
            .center { text-align: center; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .totals { width: 300px; margin-left: auto; margin-top: 20px; border-top: 2px solid #000; padding-top: 10px; }
            .flex-between { display: flex; justify-content: space-between; padding: 4px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0;font-size:24px;">PUNJAB ELECTRIC STORE</h1>
              <div style="color:#666;margin-top:4px;">Main Market, Hall Road, Lahore<br/>Tel: +92 42 37210099</div>
            </div>
            <div class="right">
              <h2 style="margin:0;color:#DC2626;text-transform:uppercase;">Return Receipt</h2>
              <div style="font-size:20px;font-weight:bold;margin-top:4px;">${saleReturn.return_number}</div>
              <div style="margin-top:10px;">Date: <strong>${formatDate(saleReturn.return_date)}</strong></div>
            </div>
          </div>
          
          <div style="display:flex;justify-content:space-between;background:#f8f9fa;padding:15px;border:1px solid #ddd;">
            <div>
              <div style="color:#666;font-size:12px;">Customer:</div>
              <div style="font-weight:bold;font-size:16px;">${saleReturn.customer?.name || 'Walk-in Customer'}</div>
              <div>${saleReturn.customer?.phone || ''}</div>
            </div>
            <div class="right">
              <div style="color:#666;font-size:12px;">Original Invoice:</div>
              <div style="font-weight:bold;font-size:16px;">INV #${saleReturn.invoice_id}</div>
              <div style="color:#666;font-size:12px;margin-top:8px;">Refund Method:</div>
              <div style="font-weight:bold;text-transform:uppercase;">${saleReturn.refund_type.replace('_', ' ')}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th class="right">Rate</th>
                <th class="center">Qty Returned</th>
                <th class="right">Refund Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(saleReturn.items || []).map(i => `
                <tr>
                  <td><strong>${i.product_name}</strong></td>
                  <td class="right">${formatCurrency(i.unit_price)}</td>
                  <td class="center">${i.quantity}</td>
                  <td class="right">${formatCurrency(i.amount || (i.unit_price * i.quantity))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="flex-between" style="font-size:18px;font-weight:bold;">
              <span>Total Refunded:</span>
              <span style="color:#DC2626">${formatCurrency(saleReturn.total_amount)}</span>
            </div>
          </div>

          ${saleReturn.reason ? `
            <div style="margin-top: 40px; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; font-size: 13px;">
              <strong>Return Reason:</strong><br/>
              ${saleReturn.reason}
            </div>
          ` : ''}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };"""

content = content.replace("  if (loading) {", print_logic + "\n\n  if (loading) {")

# Add the button to the UI
old_header = """      <div className="mb-6 flex items-center gap-4">
        <button onClick={() => navigate('/returns')} className="text-[#71717A] hover:text-black transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold font-display tracking-tight text-black flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-[#DC2626]" />
          Return {saleReturn.return_number}
        </h1>
        <Badge variant={saleReturn.status === 'processed' || saleReturn.status === 'completed' ? 'mint' : 'warning'}>
          {saleReturn.status || 'Completed'}
        </Badge>
      </div>"""

new_header = """      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/returns')} className="text-[#71717A] hover:text-black transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold font-display tracking-tight text-black flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-[#DC2626]" />
            Return {saleReturn.return_number}
          </h1>
          <Badge variant={saleReturn.status === 'processed' || saleReturn.status === 'completed' ? 'mint' : 'warning'}>
            {saleReturn.status || 'Completed'}
          </Badge>
        </div>
        <Button variant="secondary" onClick={handlePrintReturn} leftIcon={<Printer className="w-4 h-4" />}>
          Print Receipt
        </Button>
      </div>"""

content = content.replace(old_header, new_header)

with open('frontend/src/features/returns/pages/ReturnDetailPage.tsx', 'w') as f:
    f.write(content)
