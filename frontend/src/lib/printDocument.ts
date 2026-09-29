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
  name: 'DUKANOS',
  lines: ['ELECTRICAL & APPLIANCE STORE', 'Main Bazar Road, City 46000', 'Tel: 0300-1234567'],
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

  const dash = '<div class="dash">- - - - - - - - - - - - - - - -</div>';

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

  return `<!doctype html><html><head><title>${escapeHtml(number)}</title>
<style>
  body { font-family: monospace; width: 320px; margin: 24px auto; color: #000; font-size: 12px; }
  .center { text-align: center; }
  .dash { text-align: center; margin: 8px 0; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; gap: 8px; }
  .row > span:first-child { flex: 0 0 auto; }
  .num { text-align: right; }
  table { width: 100%; border-collapse: collapse; }
  .muted { color: #666; font-size: 10px; }
  .bold { font-weight: bold; }
  .big { font-size: 13px; }
  .note { white-space: pre-wrap; word-break: break-word; }
  th { text-align: left; }
  td { padding: 2px 0; vertical-align: top; }
</style></head><body>
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
  <div class="row bold" style="font-size:13px"><span>TOTAL</span><span class="num">${escapeHtml(formatCurrency(totalAmount))}</span></div>
  ${payment}
  ${notesBlock}
  <div class="dash">* * *</div>
  <div class="center muted">THANK YOU FOR YOUR PURCHASE!<br/>Goods once sold will not be taken back.</div>
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
