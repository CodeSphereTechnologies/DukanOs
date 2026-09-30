import re

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

# Add imports for modal and print
imports_to_add = """import { FormField } from '../../../components/ui/FormField';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { printLedgerReceipt } from '../../../lib/printDocument';
"""
content = content.replace("import { Button } from '../../../components/ui/Button';", imports_to_add + "import { Button } from '../../../components/ui/Button';")
content = content.replace("import { Dialog } from '../../../components/ui/Dialog';", "") # Ensure no dup
content = content.replace("import { Button } from '../../../components/ui/Button';", "import { Dialog } from '../../../components/ui/Dialog';\nimport { Button } from '../../../components/ui/Button';")

# Add state variables inside CustomerDetailPage
state_vars = """
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('subtract');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleAdjustLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !adjustAmount || Number(adjustAmount) <= 0 || !adjustDesc) return;
    setIsAdjusting(true);
    try {
      const amount = Number(adjustAmount);
      await customerService.adjustLedger(customer.id, {
        amount,
        type: adjustType,
        description: adjustDesc
      });
      
      const newBal = (customer.current_balance || 0) + (adjustType === 'add' ? amount : -amount);
      
      printLedgerReceipt({
        receiptNumber: 'VOUCHER-' + Math.floor(Date.now() / 1000),
        date: new Date().toISOString(),
        customerName: customer.name,
        type: adjustType,
        amount,
        newBalance: newBal,
        description: adjustDesc
      });
      
      setIsAdjustOpen(false);
      setAdjustAmount('');
      setAdjustDesc('');
      fetchData(); // reload page data
    } catch (error) {
      console.error(error);
      alert('Failed to adjust ledger');
    } finally {
      setIsAdjusting(false);
    }
  };
"""

content = re.sub(r'(const fetchData = async \(\) => {)', state_vars + r'\1', content)

# Add "Adjust Ledger" button next to Edit
buttons_block = """          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Balance
          </Button>
          <Button"""
content = content.replace("""          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}""", buttons_block + """
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}""")

# Add the Dialog at the bottom inside PageContainer
dialog_block = """
      <Dialog
        isOpen={isAdjustOpen}
        onClose={() => !isAdjusting && setIsAdjustOpen(false)}
        title="Adjust Ledger Balance"
        description={`Record a manual transaction for ${customer?.name}. This will update their balance and print a voucher.`}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAdjustOpen(false)} disabled={isAdjusting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAdjustLedger} isLoading={isAdjusting}>
              Confirm & Print
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjustLedger} className="space-y-4">
          <FormField label="Transaction Type" required>
            <Select
              value={adjustType}
              onChange={(e) => setAdjustType(e.target.value as 'add' | 'subtract')}
              options={[
                { label: 'Receive Payment (Subtract Debt)', value: 'subtract' },
                { label: 'Add Charge (Increase Debt)', value: 'add' }
              ]}
            />
          </FormField>
          
          <FormField label="Amount (PKR)" required>
            <Input
              type="number"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              placeholder="e.g. 5000"
              min="0"
              step="0.01"
              autoFocus
            />
          </FormField>

          <FormField label="Description / Reason" required>
            <Input
              value={adjustDesc}
              onChange={(e) => setAdjustDesc(e.target.value)}
              placeholder="e.g. Received cash payment"
            />
          </FormField>
        </form>
      </Dialog>
"""

content = content.replace("    </PageContainer>", dialog_block + "    </PageContainer>")

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
