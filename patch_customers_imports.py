with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

if "import { formatError" not in content:
    content = "import { formatError } from '../../../lib/utils';\n" + content

if "import { Select" not in content:
    content = content.replace("import { Input } from '../../../components/ui/Input';", "import { Input } from '../../../components/ui/Input';\nimport { Select } from '../../../components/ui/Select';\nimport { Alert } from '../../../components/ui/Alert';")

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)
