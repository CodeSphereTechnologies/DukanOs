import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../../components/ui/PageContainer';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DataTable, type Column } from '../../../components/ui/DataTable';
import { formatCurrency, formatDate } from '../../../lib/formatters';
import { returnService } from '../../../services/return.service';
import type { SaleReturn, SaleReturnItem } from '../../../types/invoice.types';
import { ArrowLeft, RotateCcw, User, ExternalLink, Printer } from 'lucide-react';

export const ReturnDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [saleReturn, setSaleReturn] = useState<SaleReturn | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      returnService.getById(id)
        .then((res) => setSaleReturn(res.data || null))
        .catch(() => setSaleReturn(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrintReturn = () => {
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
  };

  if (loading) {
    return (
      <PageContainer title="Loading Return...">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        </div>
      </PageContainer>
    );
  }

  if (!saleReturn) {
    return (
      <PageContainer title="Return Not Found">
        <div className="text-center py-12 text-[#71717A]">
          The return record could not be found.
        </div>
      </PageContainer>
    );
  }

  const columns: Column<SaleReturnItem>[] = [
    {
      key: 'product_id',
      header: 'Product ID',
      render: (item) => <span className="text-[#71717A] text-xs">#{item.product_id}</span>,
    },
    {
      key: 'product_name',
      header: 'Product',
      render: (item) => (
        <span className="font-medium text-black">
          {item.product_name || `Unknown Product (${item.product_id})`}
        </span>
      ),
    },
    {
      key: 'unit_price',
      header: 'Original Price',
      render: (item) => formatCurrency(item.unit_price),
    },
    {
      key: 'quantity',
      header: 'Qty Returned',
      align: 'center',
      render: (item) => <span className="font-bold">{item.quantity}</span>,
    },
    {
      key: 'amount',
      header: 'Refund Value',
      align: 'right',
      render: (item) => (
        <span className="font-bold text-[#DC2626]">
          {formatCurrency(item.amount || (item.quantity * item.unit_price))}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-5 shadow-subtle border-[#E4E4E7]">
          <h3 className="text-sm font-medium text-[#71717A] mb-4 uppercase tracking-wider">Overview</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-[#A1A1AA] mb-1">Original Invoice</div>
              <Link to={`/invoices/${saleReturn.invoice_id}`} className="font-medium text-black hover:underline flex items-center gap-1">
                View Invoice <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div>
              <div className="text-xs text-[#A1A1AA] mb-1">Return Date</div>
              <div className="font-medium">{formatDate(saleReturn.return_date)}</div>
            </div>
            <div>
              <div className="text-xs text-[#A1A1AA] mb-1">Refund Method</div>
              <div className="font-medium capitalize">{saleReturn.refund_type.replace('_', ' ')}</div>
            </div>
            {saleReturn.reason && (
              <div>
                <div className="text-xs text-[#A1A1AA] mb-1">Reason</div>
                <div className="text-sm">{saleReturn.reason}</div>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-5 shadow-subtle border-[#E4E4E7] lg:col-span-2">
          <h3 className="text-sm font-medium text-[#71717A] mb-4 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4" /> Customer
          </h3>
          {saleReturn.customer ? (
            <div>
              <div className="text-lg font-bold text-black mb-1">{saleReturn.customer.name}</div>
              <div className="text-sm text-[#52525B]">{saleReturn.customer.phone || 'No phone provided'}</div>
              <Link to={`/customers/${saleReturn.customer.id}`} className="inline-block mt-4 text-sm text-[#2563EB] hover:underline">
                View Customer Ledger &rarr;
              </Link>
            </div>
          ) : (
            <div className="text-[#71717A]">Walk-in Customer (No profile)</div>
          )}
        </Card>
      </div>

      <Card className="shadow-subtle border-[#E4E4E7] overflow-hidden">
        <div className="p-5 border-b border-[#F4F4F5] bg-[#FAFAF8]">
          <h3 className="font-medium text-[#18181B]">Returned Items</h3>
        </div>
        <DataTable
          data={saleReturn.items || []}
          columns={columns}
          keyExtractor={(item) => String(item.id)}
        />
        <div className="bg-[#FAFAF8] p-6 border-t border-[#E4E4E7] flex justify-end">
          <div className="w-64">
            <div className="flex justify-between text-base font-bold text-black">
              <span>Total Refunded</span>
              <span className="text-[#DC2626]">{formatCurrency(saleReturn.total_amount)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
