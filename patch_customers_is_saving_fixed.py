import re

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

# 1. Insert new state variables
content = re.sub(
    r"const \[openingBalance, setOpeningBalance\] = useState<number>\(0\);",
    "const [openingBalance, setOpeningBalance] = useState<number>(0);\n  const [email, setEmail] = useState('');\n  const [status, setStatus] = useState<Customer['status']>('active');\n  const [formError, setFormError] = useState<string | null>(null);\n  const [isSaving, setIsSaving] = useState(false);",
    content
)

# 2. Add resetAddForm
content = re.sub(
    r"const handleAddCustomer = async \(e: React.FormEvent\) => \{",
    "const resetAddForm = () => {\n    setName('');\n    setPhone('');\n    setEmail('');\n    setAddress('');\n    setOpeningBalance(0);\n    setStatus('active');\n    setFormError(null);\n  };\n\n  const handleAddCustomer = async (e: React.FormEvent) => {",
    content
)

# 3. Update handleAddCustomer
old_handle_add = """  const handleAddCustomer = async (e: React.FormEvent) => {
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

new_handle_add = """  const handleAddCustomer = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setFormError(formatError(err));
    } finally {
      setIsSaving(false);
    }
  };"""

content = content.replace(old_handle_add, new_handle_add)

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)
