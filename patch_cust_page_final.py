with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

# Add the states and methods
states = """  const [loading, setLoading] = useState(true);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('subtract');
  const [adjustDesc, setAdjustDesc] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const loadData = async () => {
    const cust = await customerService.getById(customerId);
    const ledg = await customerService.getLedger(customerId);
    const inv = await invoiceService.getAll();
    const quo = await invoiceService.getQuotations();
    const ret = await returnService.getAll();
    setCustomer(cust);
    setLedger(ledg.data || []);
    setInvoices(inv.data || []);
    setQuotations(quo.data || []);
    setReturns(ret.data || []);
    setLoading(false);
  };

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
      loadData();
    } catch (error) {
      console.error(error);
      alert('Failed to adjust ledger');
    } finally {
      setIsAdjusting(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      await loadData();
    })();
    return () => { active = false; };
  }, [customerId]);
"""

old_effect = """  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const cust = await customerService.getById(customerId);
      const ledg = await customerService.getLedger(customerId);
      const inv = await invoiceService.getAll();
      const quo = await invoiceService.getQuotations();
      const ret = await returnService.getAll();
      if (!active) return;
      setCustomer(cust);
      setLedger(ledg.data || []);
      setInvoices(inv.data || []);
      setQuotations(quo.data || []);
      setReturns(ret.data || []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [customerId]);"""

content = content.replace(old_effect, states)


# Add the Button
old_edit_button = """          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>"""

new_edit_button = """          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Balance
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>"""

content = content.replace(old_edit_button, new_edit_button)

# Add the Dialog
dialog = """
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

if "<Dialog" not in content:
    content = content.replace("    </PageContainer>", dialog + "    </PageContainer>")

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
