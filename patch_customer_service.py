import re

with open('frontend/src/services/customer.service.ts', 'r') as f:
    content = f.read()

new_method = """  async adjustLedger(customerId: number, payload: { amount: number; type: 'add' | 'subtract'; description: string }): Promise<ApiResponse<CustomerLedgerEntry>> {
    try {
      const res = await apiClient.post<any>(`/customers/${customerId}/ledger-entries`, payload);
      const r = res.data.entry || {};
      const debit = asNumber(r.debit);
      const credit = asNumber(r.credit);
      const entry: CustomerLedgerEntry = {
        id: asNumber(r.id),
        customer_id: customerId,
        invoice_id: null,
        transaction_type: (debit > 0 ? 'debit' : 'credit') as CustomerLedgerEntry['transaction_type'],
        amount: debit > 0 ? debit : credit,
        running_balance: asNumber(r.balance),
        description: asString(r.notes, asString(r.entry_type, 'Ledger entry')),
        date: asString(r.entry_date, asString(r.date, new Date().toISOString().split('T')[0])),
      };
      
      // Update local storage customer balance instantly
      const list = getStoredCustomers();
      const idx = list.findIndex(c => c.id === customerId);
      if (idx >= 0) {
         list[idx].current_balance = asNumber(r.balance);
         saveStoredCustomers(list);
      }
      
      return { success: true, data: entry };
    } catch (e: any) {
      throw e;
    }
  },"""

# Insert before closing brace of `export const customerService = { ... };`
content = re.sub(r'};\s*$', new_method + '\n};\n', content)

with open('frontend/src/services/customer.service.ts', 'w') as f:
    f.write(content)
