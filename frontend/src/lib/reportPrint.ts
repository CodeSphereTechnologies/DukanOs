import { formatCurrency } from './formatters';
import { escapeHtml } from './printDocument';

/**
 * Standalone print documents for the "Executive Financial & Operational
 * Report" on the Reports page.
 *
 * The report is rendered into its own window rather than printed from the
 * page, because the preview lives in a `position: fixed` Dialog: printing the
 * page directly lays the clipped dialog over the report page behind it and
 * runs the content off the right edge of the paper.
 *
 * Two formats are offered because they serve different jobs:
 *  - A4: the full signed audit statement, for the file and for the board.
 *  - Thermal: an 80mm summary slip for the counter, same figures, no tables.
 */

export interface ReportCustomerRow {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  current_balance?: number | null;
}

export interface ExecutiveReportData {
  periodLabel: string;
  reportNumber: string;
  reportDate: string;
  grossSales: number;
  customerRecoveries: number;
  payrollDisbursed: number;
  rentExpenses: number;
  utilityExpenses: number;
  otherExpenses: number;
  totalOperatingExpenses: number;
  netOperatingProfit: number;
  profitMarginPercent: string;
  totalReceivables: number;
  totalInventoryValuation: number;
  customers: ReportCustomerRow[];
}

const COMPANY = {
  name: 'PUNJAB ELECTRIC STORE',
  tagline: 'ELECTRICAL & APPLIANCE STORE',
  address: 'HUSSAINI CHOWK BAHAWALPUR · Ch Tariq, Hamza Tariq 03084046062',
};

const money = (value: number) => escapeHtml(formatCurrency(value));

/** P&L lines shared by both formats so the numbers can never drift apart. */
function profitAndLossRows(d: ExecutiveReportData): Array<{ label: string; value: string; tone?: 'in' | 'out' }> {
  return [
    { label: '1. Gross Invoiced Commercial Sales', value: money(d.grossSales) },
    { label: '2. Customer Credit Recoveries (Vasooli)', value: `+${money(d.customerRecoveries)}`, tone: 'in' },
    { label: '3. Staff Salaries & Payroll Disbursed', value: `-${money(d.payrollDisbursed)}`, tone: 'out' },
    { label: '4. Store Plaza Commercial Rent', value: `-${money(d.rentExpenses)}`, tone: 'out' },
    { label: '5. Electricity & Utilities (LESCO)', value: `-${money(d.utilityExpenses)}`, tone: 'out' },
    { label: '6. Freight, Supplies & Misc Maintenance', value: `-${money(d.otherExpenses)}`, tone: 'out' },
  ];
}

function kpis(d: ExecutiveReportData) {
  return [
    { label: 'Total Revenue', value: money(d.grossSales), tone: '' },
    { label: 'Operating Costs', value: money(d.totalOperatingExpenses), tone: 'out' },
    { label: 'Net Profit', value: money(d.netOperatingProfit), tone: 'in' },
    { label: 'Customer Debt', value: money(d.totalReceivables), tone: 'out' },
  ];
}

/* ------------------------------------------------------------------ */
/* A4                                                                  */
/* ------------------------------------------------------------------ */

export function buildExecutiveReportHtml(d: ExecutiveReportData): string {
  const kpiCards = kpis(d)
    .map(
      (k) => `
      <div class="kpi ${k.tone}">
        <span class="kpi-label">${escapeHtml(k.label)}</span>
        <span class="kpi-value">${k.value}</span>
      </div>`
    )
    .join('');

  const pnlRows = profitAndLossRows(d)
    .map(
      (r) => `
      <tr>
        <td>${escapeHtml(r.label)}</td>
        <td class="num ${r.tone || ''}">${r.value}</td>
      </tr>`
    )
    .join('');

  const receivableRows = d.customers.length
    ? d.customers
        .map(
          (c) => `
      <tr>
        <td>${escapeHtml(c.name)}</td>
        <td class="dim">${escapeHtml(c.phone || 'N/A')}</td>
        <td class="dim">${escapeHtml(c.address || 'Local')}</td>
        <td class="num out">${money(c.current_balance || 0)}</td>
      </tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="dim">No customer accounts.</td></tr>';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(d.reportNumber)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #18181B; font-size: 11px; margin: 0; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #E4E4E7; padding-bottom: 12px; }
  .co-name { font-size: 18px; font-weight: 800; letter-spacing: -0.01em; }
  .co-tag { color: #52525B; margin-top: 2px; }
  .co-addr { color: #71717A; font-size: 10px; margin-top: 2px; }
  .meta { text-align: right; }
  .badge { display: inline-block; background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; border-radius: 999px; padding: 2px 10px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; }
  .meta-num { font-family: ui-monospace, monospace; font-weight: 700; margin-top: 6px; }
  .meta-date { color: #71717A; font-size: 10px; margin-top: 2px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
  .kpi { border: 1px solid #E4E4E7; border-radius: 8px; padding: 10px 12px; background: #FAFAF8; }
  .kpi.in { background: #F0FDF4; border-color: #BBF7D0; }
  .kpi.out { background: #FEF2F2; border-color: #FECACA; }
  .kpi-label { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717A; font-weight: 600; }
  .kpi-value { display: block; margin-top: 4px; font-family: ui-monospace, monospace; font-size: 14px; font-weight: 700; white-space: nowrap; }
  .kpi.in .kpi-value { color: #065F46; }
  .kpi.out .kpi-value { color: #B91C1C; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  caption { text-align: left; background: #F4F4F5; font-weight: 700; padding: 7px 10px; border: 1px solid #E4E4E7; border-bottom: 0; border-radius: 8px 8px 0 0; }
  th, td { padding: 6px 10px; border-bottom: 1px solid #F4F4F5; }
  thead th { background: #FAFAF8; color: #71717A; font-size: 10px; text-align: left; border-bottom: 1px solid #E4E4E7; }
  .num { text-align: right; font-family: ui-monospace, monospace; font-weight: 600; white-space: nowrap; }
  .num.in, td.in { color: #065F46; }
  .num.out, td.out { color: #B91C1C; }
  .dim { color: #71717A; }
  .net td { background: #FAFAF8; font-weight: 700; font-size: 12px; border-top: 1px solid #E4E4E7; border-bottom: 1px solid #E4E4E7; }
  .signs { display: flex; gap: 48px; margin-top: 40px; font-size: 10px; color: #71717A; }
  .sign { flex: 1; border-top: 1px solid #D4D4D8; padding-top: 6px; text-align: center; }
  .sign b { color: #18181B; }
  .foot { margin-top: 24px; text-align: center; color: #A1A1AA; font-size: 9px; }
</style></head><body>
  <div class="head">
    <div>
      <div class="co-name">${escapeHtml(COMPANY.name)}</div>
      <div class="co-tag">${escapeHtml(COMPANY.tagline)}</div>
      <div class="co-addr">${escapeHtml(COMPANY.address)}</div>
    </div>
    <div class="meta">
      <span class="badge">EXECUTIVE AUDIT REPORT</span>
      <div class="meta-num">${escapeHtml(d.reportNumber)}</div>
      <div class="meta-date">Date: ${escapeHtml(d.reportDate)}</div>
      <div class="meta-date">Period: ${escapeHtml(d.periodLabel)}</div>
    </div>
  </div>

  <div class="kpis">${kpiCards}</div>

  <table>
    <caption>Profit &amp; Loss Summary Breakdown</caption>
    <tbody>
      ${pnlRows}
      <tr class="net">
        <td>NET OPERATING PROFIT / SURPLUS</td>
        <td class="num ${d.netOperatingProfit >= 0 ? 'in' : 'out'}">${money(d.netOperatingProfit)} (${escapeHtml(d.profitMarginPercent)}%)</td>
      </tr>
    </tbody>
  </table>

  <table>
    <caption>Customer Receivables (Khata) Ageing — Top Accounts</caption>
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Phone</th>
        <th>Market / Area</th>
        <th style="text-align:right">Outstanding Debt</th>
      </tr>
    </thead>
    <tbody>${receivableRows}</tbody>
  </table>

  <table>
    <caption>Asset Position</caption>
    <tbody>
      <tr>
        <td>Total Inventory Valuation (at selling price)</td>
        <td class="num">${money(d.totalInventoryValuation)}</td>
      </tr>
      <tr>
        <td>Total Outstanding Customer Receivables</td>
        <td class="num out">${money(d.totalReceivables)}</td>
      </tr>
    </tbody>
  </table>

  <div class="signs">
    <div class="sign"><b>Prepared by:</b> Chief Accountant</div>
    <div class="sign"><b>Verified &amp; Approved by:</b> Managing Partner / Owner</div>
  </div>

  <div class="foot">Generated by DukanOS · ${escapeHtml(new Date().toLocaleString('en-PK'))}</div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Thermal (80mm)                                                      */
/* ------------------------------------------------------------------ */

export function buildExecutiveReportThermalHtml(d: ExecutiveReportData): string {
  const pnl = profitAndLossRows(d)
    .map(
      (r) => `<div class="row"><span>${escapeHtml(r.label.replace(/^\d+\.\s*/, ''))}</span><span class="num ${r.tone || ''}">${r.value}</span></div>`
    )
    .join('');

  const receivables = d.customers.length
    ? d.customers
        .map(
          (c) =>
            `<div class="row"><span>${escapeHtml(c.name)}</span><span class="num out">${money(c.current_balance || 0)}</span></div>`
        )
        .join('')
    : '<div class="row"><span>No customer accounts</span><span class="num">-</span></div>';

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(d.reportNumber)}</title>
<style>
  @page { margin: 0; }
  @media print { html, body { height: auto; } body { width: 100%; margin: 0; padding: 0 4mm; } }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; width: 72mm; margin: 0 auto; color: #000; font-size: 12px; line-height: 1.45; font-weight: 600; }
  .center { text-align: center; }
  .dash { text-align: center; margin: 6px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; gap: 6px; }
  .row > span:first-child { flex: 1 1 auto; }
  .num { text-align: right; white-space: nowrap; }
  .bold { font-weight: 700; }
  .big { font-size: 13px; }
  .muted { color: #555; font-size: 9px; }
  .in { font-weight: 700; }
  .out { font-weight: 700; }
  .sec { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #000; padding-bottom: 2px; margin: 8px 0 4px; }
  .total { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 4px 0; margin: 6px 0; font-size: 11px; }
</style></head><body>
  <div class="center">
    <div class="bold big">${escapeHtml(COMPANY.name)}</div>
    <div>${escapeHtml(COMPANY.tagline)}</div>
    <div class="muted">${escapeHtml(COMPANY.address)}</div>
  </div>
  <div class="dash">- - - - - - - - - - - - - - - -</div>
  <div class="center bold">EXECUTIVE FINANCIAL SUMMARY</div>
  <div class="row"><span>Report</span><span>${escapeHtml(d.reportNumber)}</span></div>
  <div class="row"><span>Date</span><span>${escapeHtml(d.reportDate)}</span></div>
  <div class="row"><span>Period</span><span>${escapeHtml(d.periodLabel)}</span></div>

  <div class="sec">Key Figures</div>
  <div class="row"><span>Total Revenue</span><span class="num bold">${money(d.grossSales)}</span></div>
  <div class="row"><span>Operating Costs</span><span class="num out">${money(d.totalOperatingExpenses)}</span></div>
  <div class="row"><span>Customer Debt</span><span class="num out">${money(d.totalReceivables)}</span></div>
  <div class="row total"><span class="bold">NET PROFIT</span><span class="num ${d.netOperatingProfit >= 0 ? 'in' : 'out'}">${money(d.netOperatingProfit)}</span></div>
  <div class="row"><span>Margin</span><span class="num">${escapeHtml(d.profitMarginPercent)}%</span></div>
  <div class="row"><span>Inventory Value</span><span class="num">${money(d.totalInventoryValuation)}</span></div>

  <div class="sec">Profit &amp; Loss Breakdown</div>
  ${pnl}

  <div class="sec">Receivables (Khata)</div>
  ${receivables}

  <div class="dash">* * *</div>
  <div class="center muted">
    Executive audit copy — figures subject to ledger review.<br/>
    Generated by DukanOS · ${escapeHtml(new Date().toLocaleString('en-PK'))}
  </div>
</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Window plumbing                                                     */
/* ------------------------------------------------------------------ */

function openPrintWindow(html: string, size: string): boolean {
  const win = window.open('', '_blank', size);
  if (!win) return false;
  win.document.write(html);
  win.document.close();
  win.focus();
  // Give the renderer a tick to lay the document out before the print dialog.
  setTimeout(() => win.print(), 250);
  return true;
}

export function printExecutiveReport(data: ExecutiveReportData): boolean {
  return openPrintWindow(buildExecutiveReportHtml(data), 'width=900,height=1100');
}

export function printExecutiveReportThermal(data: ExecutiveReportData): boolean {
  return openPrintWindow(buildExecutiveReportThermalHtml(data), 'width=400,height=600');
}
