import { describe, it, expect } from 'vitest';
import { buildSalesDocumentHtml, escapeHtml } from '../../lib/printDocument';

const base = {
  title: 'INVOICE',
  number: 'INV-0100',
  date: '2026-09-29',
  customerName: 'Walk-in Customer',
  items: [
    { name: 'Extension Board', sku: 'CLP-EXT-4', quantity: 2, unit_price: 650, total_price: 1300 },
  ],
  subtotal: 1300,
  totalAmount: 1300,
};

describe('printDocument', () => {
  it('includes the order notes in the printed document', () => {
    const html = buildSalesDocumentHtml({ ...base, notes: 'Deliver before 5pm' });
    expect(html).toContain('Note:');
    expect(html).toContain('Deliver before 5pm');
  });

  it('omits the note block when there are no notes', () => {
    expect(buildSalesDocumentHtml(base)).not.toContain('Note:');
    expect(buildSalesDocumentHtml({ ...base, notes: '' })).not.toContain('Note:');
    expect(buildSalesDocumentHtml({ ...base, notes: '   ' })).not.toContain('Note:');
  });

  it('preserves multi-line notes via a pre-wrap block', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      notes: 'Site survey done.\nInstallation Friday.\nUse rear entrance.',
    });
    expect(html).toContain('class="note"');
    expect(html).toContain('.note { white-space: pre-wrap');
    expect(html).toContain('Site survey done.\nInstallation Friday.\nUse rear entrance.');
  });

  it('escapes HTML in notes so checkout text cannot inject markup', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      notes: '<script>alert(1)</script> & "quoted"',
    });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot;');
  });

  it('escapes HTML in product names and customer names', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      customerName: '<b>Bobby</b>',
      items: [{ name: 'Cable <2mm>', quantity: 1, unit_price: 100, total_price: 100 }],
    });
    expect(html).not.toContain('<b>Bobby</b>');
    expect(html).toContain('&lt;b&gt;Bobby&lt;/b&gt;');
    expect(html).toContain('Cable &lt;2mm&gt;');
  });

  it('renders invoice-only rows (Paid / Balance)', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      paymentRows: [
        { label: 'Paid', value: 'PKR 1,000.00' },
        { label: 'Balance', value: 'PKR 300.00' },
      ],
    });
    expect(html).toContain('Paid');
    expect(html).toContain('PKR 300.00');
  });

  it('renders quotation-only rows (Valid Until) and its own heading', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      title: 'QUOTATION',
      number: 'QUO-0009',
      extraRows: [{ label: 'Valid Until', value: '13 Oct 2026' }],
      header: { name: 'PUNJAB ELECTRIC STORE', lines: ['Hall Road, Lahore'] },
    });
    expect(html).toContain('QUOTATION');
    expect(html).toContain('QUO-0009');
    expect(html).toContain('Valid Until');
    expect(html).toContain('PUNJAB ELECTRIC STORE');
  });

  it('prints the line discount and totals when present', () => {
    const html = buildSalesDocumentHtml({
      ...base,
      discountAmount: 100,
      items: [
        { name: 'Fan', quantity: 1, unit_price: 5000, discount_amount: 250, total_price: 4750 },
      ],
    });
    expect(html).toContain('line discount');
    expect(html).toContain('- PKR 100.00');
  });

  it('escapeHtml handles the full entity set', () => {
    expect(escapeHtml(`<>&"'`)).toBe('&lt;&gt;&amp;&quot;&#39;');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
