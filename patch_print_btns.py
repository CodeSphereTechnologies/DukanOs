with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

imports = """import { Printer, Receipt } from 'lucide-react';
import { printCustomerLedgerA4, printCustomerLedgerThermal } from '../../../lib/customerPrint';
"""
content = content.replace("import { Button } from '../../../components/ui/Button';", imports + "import { Button } from '../../../components/ui/Button';")

old_buttons = """          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Balance
          </Button>"""

new_buttons = """          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => customer && printCustomerLedgerA4({ customer, entries: ledger })}
          >
            A4 Statement
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Receipt className="w-3.5 h-3.5" />}
            onClick={() => customer && printCustomerLedgerThermal({ customer, entries: ledger })}
          >
            Thermal
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Balance
          </Button>"""

content = content.replace(old_buttons, new_buttons)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
