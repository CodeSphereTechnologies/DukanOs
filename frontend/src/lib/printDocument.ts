import { formatCurrency, formatDate } from './formatters';

/**
 * Builds the standalone, thermal-printer friendly document that the POS receipt,
 * the invoice "Print / PDF" action and the quotation "Print" action all aim to
 * produce. It is rendered into a blank window so the surrounding app chrome
 * (sidebar, tables, buttons) never ends up on the paper.
 *
 * Notes are free text typed at checkout, so they are HTML-escaped and printed
 * with `white-space: pre-wrap` to preserve the line breaks the user typed.
 */

export interface PrintLineItem {
  name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  total_price?: number;
}

export interface PrintKeyValue {
  label: string;
  value: string;
}

export interface PrintSalesDocumentOptions {
  /** Document heading, e.g. `INVOICE` or `QUOTATION`. */
  title: string;
  /** Document number shown next to the title. */
  number: string;
  date?: string | null;
  customerName?: string;
  customerPhone?: string;
  /** Extra header rows such as `Valid Until`. */
  extraRows?: PrintKeyValue[];
  items: PrintLineItem[];
  subtotal: number;
  discountAmount?: number;
  totalAmount: number;
  /** Rows printed under the total, e.g. Paid / Balance / Added to ledger. */
  paymentRows?: PrintKeyValue[];
  /** Free-text description / order notes entered at checkout. */
  notes?: string;
  header?: { name: string; lines?: string[] };
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

const DEFAULT_HEADER = {
  name: 'PUNJAB ELECTRIC STORE',
  lines: ['HUSSAINI CHOWK BAHAWALPUR', 'Ch Tariq, Hamza Tariq 03084046062'],
};

const row = (label: string, value: string, bold = false) =>
  `<div class="row${bold ? ' bold' : ''}"><span>${escapeHtml(label)}</span><span class="num">${escapeHtml(value)}</span></div>`;

export function buildSalesDocumentHtml(options: PrintSalesDocumentOptions): string {
  const {
    title,
    number,
    date,
    customerName,
    customerPhone,
    extraRows = [],
    items,
    subtotal,
    discountAmount = 0,
    totalAmount,
    paymentRows = [],
    notes,
    header = DEFAULT_HEADER,
  } = options;

  const storeHeader = [header.name, ...(header.lines || [])]
    .map((line, index) =>
      index === 0
        ? `<div class="bold" style="font-size:16px;letter-spacing:2px">${escapeHtml(line)}</div>`
        : `<div>${escapeHtml(line)}</div>`
    )
    .join('');

  const itemRows = items
    .map((item, index) => {
      const name = escapeHtml(item.name || `Item ${index + 1}`);
      const sku = item.sku ? `<div class="muted">${escapeHtml(item.sku)}</div>` : '';
      const lineTotal = item.total_price ?? item.unit_price * item.quantity;
      const discount =
        item.discount_amount && item.discount_amount > 0
          ? `<div class="muted">- ${escapeHtml(formatCurrency(item.discount_amount))} line discount</div>`
          : '';
      return `
        <tr>
          <td>${name}${sku}${discount}</td>
          <td class="num">${escapeHtml(String(item.quantity))} x ${escapeHtml(formatCurrency(item.unit_price))}</td>
          <td class="num">${escapeHtml(formatCurrency(lineTotal))}</td>
        </tr>`;
    })
    .join('');

  const dash = '<div class="dash"></div>';

  const headerRows = [
    row('Date', date ? formatDate(date) : formatDate(new Date()), false),
    customerName ? row('Customer', customerName) : '',
    customerPhone ? row('Phone', customerPhone) : '',
    ...extraRows.map((entry) => row(entry.label, entry.value)),
  ]
    .filter(Boolean)
    .join('');

  const payment = paymentRows.map((entry) => row(entry.label, entry.value)).join('');

  const trimmedNotes = notes?.trim();
  const notesBlock = trimmedNotes
    ? `${dash}<div class="bold">Note:</div><div class="note">${escapeHtml(trimmedNotes)}</div>`
    : '';

  const logoSvg = `<svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M13 10L10 15h3l-1 4 4-6h-3l1-3z" fill="currentColor" /></svg>`;

  return `<!doctype html><html><head><title>${escapeHtml(number)}</title>
<style>
  @page { margin: 0; }
  @media print { html, body { height: auto; } body { width: 100%; margin: 0; padding: 10px; } }
  body { font-family: system-ui, -apple-system, sans-serif; width: 80mm; margin: 0 auto; color: #000; font-size: 14px; font-weight: 600; line-height: 1.3; }
  .center { text-align: center; }
  .dash { border-top: 2px dashed #000; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .row > span:first-child { flex: 0 0 auto; }
  .num { text-align: right; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .muted { color: #000; font-size: 12px; font-weight: 500; }
  .bold { font-weight: 800; font-size: 15px; }
  .big { font-size: 18px; font-weight: 900; }
  .note { white-space: pre-wrap; word-break: break-word; font-weight: 500; font-size: 13px; }
  th { text-align: left; padding-bottom: 6px; border-bottom: 2px solid #000; font-weight: 800; font-size: 15px; }
  td { padding: 6px 0; vertical-align: top; }
  td.num { font-weight: 700; font-size: 14px; }
  .logo { width: 48px; height: 48px; margin: 0 auto 10px auto; display: block; }
  .footer-branding { text-align: center; margin-top: 24px; font-size: 12px; font-weight: 800; border-top: 2px solid #000; padding-top: 8px; padding-bottom: 20px;}
</style></head><body>
  ${logoSvg}
  <div class="center">${storeHeader}</div>
  ${dash}
  <div class="row"><span>${escapeHtml(title)}</span><span class="bold">#${escapeHtml(number)}</span></div>
  ${headerRows}
  ${dash}
  <table><thead><tr><th>ITEM</th><th class="num">QTY x RATE</th><th class="num">AMOUNT</th></tr></thead>
  <tbody>${itemRows}</tbody></table>
  ${dash}
  ${row('Subtotal', formatCurrency(subtotal))}
  ${discountAmount > 0 ? row('Discount', `- ${formatCurrency(discountAmount)}`) : ''}
  <div class="row bold" style="font-size:18px; margin-top: 4px;"><span>TOTAL</span><span class="num">${escapeHtml(formatCurrency(totalAmount))}</span></div>
  ${payment}
  ${notesBlock}
  <div class="dash"></div>
  <div class="dash"></div>
  <div class="center bold" style="font-size:14px; margin-bottom: 4px;">Timings 9:30 AM To 8:00 PM</div>
  <div class="center" style="font-size:13px; font-weight: 500; font-family: 'Jameel Noori Nastaleeq', 'Noto Nastaliq Urdu', 'Urdu Typesetting', Tahoma, sans-serif; line-height: 1.8; margin-top: 8px;">
    سامان واپسی یا تبدیلی کے لئے بل ساتھ لائیں ۔ چائنا مال اور ڈی سی آئٹم کی کوئی گارنٹی واپسی نا ہے موقع پر تسلی کر یں ۔ اپنی مرضی سے کٹوائی ہوئی تار، روف لائٹ کی واپسی نہیں ہے۔
  </div>
  
  <div class="footer-branding">
    Software Developed By DukanOS By ThinkCode<br/>
    +920370825484
  </div>
</body></html>`;
}

/**
 * Renders the document into a blank window and opens the browser print dialog.
 * Returns false when the popup was blocked.
 */
export function printSalesDocument(options: PrintSalesDocumentOptions): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(buildSalesDocumentHtml(options));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}

export interface PrintLedgerReceiptOptions {
  receiptNumber: string;
  date: string;
  customerName: string;
  type: 'add' | 'subtract';
  amount: number;
  newBalance: number;
  description: string;
  header?: { name: string; lines?: string[] };
}

export function buildLedgerReceiptHtml(options: PrintLedgerReceiptOptions): string {
  const {
    receiptNumber,
    date,
    customerName,
    type,
    amount,
    newBalance,
    description,
    header = DEFAULT_HEADER,
  } = options;

  const storeHeader = [header.name, ...(header.lines || [])]
    .map((line, index) =>
      index === 0
        ? `<div class="bold" style="font-size:16px;letter-spacing:2px">${escapeHtml(line)}</div>`
        : `<div>${escapeHtml(line)}</div>`
    )
    .join('');

  const dash = '<div class="dash"></div>';

  const logoSvg = `<svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><path d="M13 10L10 15h3l-1 4 4-6h-3l1-3z" fill="currentColor" /></svg>`;

  return `<!doctype html><html><head><title>Receipt ${escapeHtml(receiptNumber)}</title>
<style>
  @page { margin: 0; }
  @media print { html, body { height: auto; } body { width: 100%; margin: 0; padding: 10px; } }
  body { font-family: system-ui, -apple-system, sans-serif; width: 80mm; margin: 0 auto; color: #000; font-size: 14px; font-weight: 600; line-height: 1.3; }
  .center { text-align: center; }
  .dash { border-top: 2px dashed #000; margin: 12px 0; }
  .row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .row > span:first-child { flex: 0 0 auto; }
  .num { text-align: right; font-weight: 700; }
  .bold { font-weight: 800; font-size: 15px; }
  .muted { color: #000; font-size: 12px; font-weight: 500; }
  .note { white-space: pre-wrap; word-break: break-word; font-weight: 500; font-size: 13px; }
  .logo { width: 48px; height: 48px; margin: 0 auto 10px auto; display: block; }
  .footer-branding { text-align: center; margin-top: 24px; font-size: 12px; font-weight: 800; border-top: 2px solid #000; padding-top: 8px; padding-bottom: 20px;}
</style></head><body>
  ${logoSvg}
  <div class="center">${storeHeader}</div>
  ${dash}
  <div class="center bold" style="font-size:18px">LEDGER VOUCHER</div>
  ${dash}
  ${row('Receipt No', receiptNumber)}
  ${row('Date', formatDate(date))}
  ${row('Customer', customerName)}
  ${dash}
  <div class="bold mb-2">Description:</div>
  <div class="note" style="margin-bottom:12px">${escapeHtml(description)}</div>
  ${row(type === 'subtract' ? 'Amount Received' : 'Amount Added', formatCurrency(amount), true)}
  ${dash}
  ${row('New Ledger Balance', formatCurrency(Math.abs(newBalance)), true)}
  <div class="num" style="font-size:12px">${newBalance === 0 ? 'Settled' : newBalance > 0 ? 'Customer Owes Us' : 'We Owe Customer'}</div>
  ${dash}
  <div class="center bold" style="font-size:15px">THANK YOU!</div>
  
  <div class="footer-branding">
    Software Developed By DukanOS By ThinkCode<br/>
    +920370825484
  </div>
</body></html>`;
}

export function printLedgerReceipt(options: PrintLedgerReceiptOptions): boolean {
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.write(buildLedgerReceiptHtml(options));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 250);
  return true;
}
