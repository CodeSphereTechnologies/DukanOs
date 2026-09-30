import re

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

# Fix imports
content = re.sub(
    r'<<<<<<< Updated upstream.*?=======',
    "import { Select } from '../../../components/ui/Select';\nimport { Alert } from '../../../components/ui/Alert';\nimport { UserPlus, Eye, Edit, Trash, FileText, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';",
    content,
    flags=re.DOTALL,
    count=1
)
content = re.sub(
    r'>>>>>>> Stashed changes\n',
    '',
    content,
    flags=re.DOTALL,
    count=1
)

# Fix filtered logic
new_filtered = """  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            (c.phone && c.phone.includes(search)) || 
                            (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;
      
      const bal = c.current_balance || 0;
      if (filter === 'receivable') return bal > 0;
      if (filter === 'payable') return bal < 0;
      if (filter === 'settled') return bal === 0;
      return true;
    });
  }, [customers, search, filter]);"""

content = re.sub(
    r'<<<<<<< Updated upstream.*?=======.*?>>>>>>> Stashed changes\n',
    new_filtered,
    content,
    flags=re.DOTALL,
    count=1
)

# Fix form area
# Wait, for the form area, they added formError and grid layout. 
# My stash just had my old form structure. So we should keep THEIR form structure completely.
content = re.sub(
    r'<<<<<<< Updated upstream\n(.*?)\n=======(.*?)\n>>>>>>> Stashed changes\n',
    r'\1',
    content,
    flags=re.DOTALL
)

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)
