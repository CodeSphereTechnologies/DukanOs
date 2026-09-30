with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

# Restore imports
content = content.replace("import { Button } from '../../../components/ui/Button';", "import { Button } from '../../../components/ui/Button';\nimport { Select } from '../../../components/ui/Select';\nimport { Alert } from '../../../components/ui/Alert';\nimport { formatError } from '../../../lib/utils';")

# Restore state variables
state_vars_old = """  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCust = await customerService.saveCustomer({
      name,
      phone: phone || undefined,
      address: address || undefined,
      current_balance: Number(openingBalance) || 0,
      status: 'active',
    });

    setCustomers([newCust, ...customers]);
    setIsAddOpen(false);
    setName('');
    setPhone('');
    setAddress('');
    setOpeningBalance(0);
  };"""

state_vars_new = """  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [status, setStatus] = useState<Customer['status']>('active');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const resetAddForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setOpeningBalance(0);
    setStatus('active');
    setFormError(null);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('Customer name is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const newCust = await customerService.saveCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        current_balance: Number(openingBalance) || 0,
        status,
      });

      setCustomers((prev) => [newCust, ...prev]);
      setIsAddOpen(false);
      resetAddForm();
    } catch (err) {
      setFormError(formatError(err));
    } finally {
      setIsSaving(false);
    }
  };"""

content = content.replace(state_vars_old, state_vars_new)

# Restore render column for email
render_old = """      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-semibold text-[#18181B]">{c.name}</div>
            <div className="text-xs text-[#71717A]">{c.phone || 'No phone'}</div>
          </div>
        </div>
      ),"""

render_new = """      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-semibold text-[#18181B]">{c.name}</div>
            <div className="text-xs text-[#71717A]">
              {[c.phone || 'No phone', c.email].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
      ),"""

content = content.replace(render_old, render_new)

# Restore form Dialog
dialog_old = """      <Dialog
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Customer Profile"
        description="Create an account to track on-account credit sales and payment histories."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCustomer}>
              Create Customer
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          <FormField label="Full Name / Business Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chaudhry Bilal (Contractor)"
              autoFocus
            />
          </FormField>
          <FormField label="Mobile Phone Number">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +92 300 1234567"
            />
          </FormField>
          <FormField label="Shop / Site Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Shop #4, Model Town Market"
            />
          </FormField>
          <FormField label="Opening Outstanding Balance (PKR)">
            <Input
              type="number"
              value={openingBalance || ''}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              placeholder="Enter positive if they owe you, negative if you owe them"
            />
          </FormField>
        </form>
      </Dialog>"""

dialog_new = """      <Dialog
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          resetAddForm();
        }}
        title="Add Customer Profile"
        description="Create an account to track on-account credit sales and payment histories."
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsAddOpen(false);
                resetAddForm();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAddCustomer} disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCustomer} className="space-y-4">
          {formError && (
            <Alert variant="error" title="Validation Error" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name / Business Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chaudhry Bilal (Contractor)"
                autoFocus
              />
            </FormField>
            <FormField label="Mobile Phone Number">
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
              />
            </FormField>
            <FormField label="Email Address">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. bilal@contractors.pk"
              />
            </FormField>
            <FormField label="Shop / Site Address">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop #4, Model Town Market"
              />
            </FormField>
            <FormField label="Opening Outstanding Balance (PKR)">
              <Input
                type="number"
                min={0}
                value={openingBalance || ''}
                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                placeholder="0"
              />
            </FormField>
            <FormField label="Account Status">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Customer['status'])}
                options={[
                  { label: 'Active - can purchase on account', value: 'active' },
                  { label: 'Inactive - ledger kept for records', value: 'inactive' },
                ]}
              />
            </FormField>
          </div>
        </form>
      </Dialog>"""

content = content.replace(dialog_old, dialog_new)

# Add search placeholder
search_old = 'searchPlaceholder="Search customers by name or phone..."'
search_new = 'searchPlaceholder="Search customers by name, phone, or email..."'
content = content.replace(search_old, search_new)

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)
