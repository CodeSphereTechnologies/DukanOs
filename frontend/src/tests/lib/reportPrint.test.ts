import { describe, it, expect } from 'vitest';
import {
  buildExecutiveReportHtml,
  buildExecutiveReportThermalHtml,
  type ExecutiveReportData,
} from '../../lib/reportPrint';

const data: ExecutiveReportData = {
  periodLabel: 'Current Month (Sep 2026)',
  reportNumber: 'REPORT-29-SEP-2026',
  reportDate: '29 Sept 2026',
  grossSales: 1297569.6,
  customerRecoveries: 85000,
  payrollDisbursed: 245000,
  rentExpenses: 120000,
  utilityExpenses: 38000,
  otherExpenses: 62110.4,
  totalOperatingExpenses: 465110.4,
  netOperatingProfit: 832459.2,
  profitMarginPercent: '64.2',
  totalReceivables: 412300.75,
  totalInventoryValuation: 2874500,
  customers: [
    { id: 1, name: 'Al-Madina Traders', phone: '0300-1234567', address: 'Shah Alam Market', current_balance: 182450.25 },
    { id: 2, name: "O'Brien & Sons", phone: null, address: null, current_balance: 125000 },
  ],
};

describe('reportPrint', () => {
  describe('A4 document', () => {
    it('renders every executive figure', () => {
      const html = buildExecutiveReportHtml(data);
      expect(html).toContain('Total Revenue');
      expect(html).toContain('PKR 1,297,569.60');
      expect(html).toContain('PKR 465,110.40');
      expect(html).toContain('PKR 832,459.20');
      expect(html).toContain('PKR 412,300.75');
      expect(html).toContain('PKR 2,874,500.00');
    });

    it('prints all six P&L lines plus the net surplus', () => {
      const html = buildExecutiveReportHtml(data);
      expect(html).toContain('Gross Invoiced Commercial Sales');
      expect(html).toContain('Customer Credit Recoveries (Vasooli)');
      expect(html).toContain('Staff Salaries &amp; Payroll Disbursed');
      expect(html).toContain('Store Plaza Commercial Rent');
      expect(html).toContain('Electricity &amp; Utilities (LESCO)');
      expect(html).toContain('Freight, Supplies &amp; Misc Maintenance');
      expect(html).toContain('NET OPERATING PROFIT / SURPLUS');
      expect(html).toContain('64.2');
    });

    it('lists customers and falls back when contact details are missing', () => {
      const html = buildExecutiveReportHtml(data);
      expect(html).toContain('Al-Madina Traders');
      expect(html).toContain("O&#39;Brien &amp; Sons");
      // Missing phone/address become readable placeholders, not "null".
      expect(html).toContain('N/A');
      expect(html).toContain('Local');
      expect(html).not.toContain('null');
    });

    it('states the row when there are no customer accounts', () => {
      const html = buildExecutiveReportHtml({ ...data, customers: [] });
      expect(html).toContain('No customer accounts.');
    });

    it('is a self-contained A4 page and carries no app chrome', () => {
      const html = buildExecutiveReportHtml(data);
      expect(html).toContain('@page');
      expect(html).toContain('size: A4');
      expect(html).toContain('<style>');
      expect(html).not.toMatch(/Owner Dashboard|POS Terminal|Products &amp; Stock/);
    });

    it('keeps the signature blocks for the audit trail', () => {
      const html = buildExecutiveReportHtml(data);
      expect(html).toContain('Prepared by:');
      expect(html).toContain('Verified &amp; Approved by:');
    });
  });

  describe('thermal document', () => {
    it('renders the same key figures in a narrow monospace layout', () => {
      const html = buildExecutiveReportThermalHtml(data);
      expect(html).toContain('width: 72mm');
      expect(html).toContain('monospace');
      expect(html).toContain('PKR 1,297,569.60');
      expect(html).toContain('PKR 832,459.20');
      expect(html).toContain('PKR 412,300.75');
      expect(html).toContain('PKR 2,874,500.00');
    });

    it('drops the table numbering that is meaningless on a slip', () => {
      const html = buildExecutiveReportThermalHtml(data);
      expect(html).toContain('Gross Invoiced Commercial Sales');
      expect(html).not.toContain('1. Gross Invoiced');
    });

    it('lists customers and states when there are none', () => {
      expect(buildExecutiveReportThermalHtml(data)).toContain('Al-Madina Traders');
      expect(buildExecutiveReportThermalHtml({ ...data, customers: [] })).toContain('No customer accounts');
    });
  });

  describe('escaping', () => {
    it('escapes customer names so checkout data cannot inject markup', () => {
      const html = buildExecutiveReportHtml({
        ...data,
        customers: [{ id: 1, name: '<script>alert(1)</script> & <b>x</b>', current_balance: 1 }],
      });
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<b>x</b>');
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;x&lt;/b&gt;');
    });

    it('escapes customer names in the thermal slip too', () => {
      const html = buildExecutiveReportThermalHtml({
        ...data,
        customers: [{ id: 1, name: '<img src=x onerror=alert(1)>', current_balance: 1 }],
      });
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });

    it('escapes the period label', () => {
      const html = buildExecutiveReportHtml({ ...data, periodLabel: 'Q3 & <Q4>' });
      expect(html).toContain('Q3 &amp; &lt;Q4&gt;');
    });
  });
});
