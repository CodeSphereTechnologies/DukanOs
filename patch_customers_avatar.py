import re

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { Avatar } from '../../../components/ui/Avatar';\n"
content = content.replace("import { DataTable } from '../../../components/ui/DataTable';", "import { DataTable } from '../../../components/ui/DataTable';\n" + import_stmt)

old_render = """      render: (c) => (
        <div>
          <div className="font-semibold text-[#18181B]">{c.name}</div>
          <div className="text-xs text-[#71717A]">{c.phone || 'No phone'}</div>
        </div>
      ),"""

new_render = """      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} className="w-8 h-8 shrink-0" />
          <div>
            <div className="font-semibold text-[#18181B]">{c.name}</div>
            <div className="text-xs text-[#71717A]">{c.phone || 'No phone'}</div>
          </div>
        </div>
      ),"""

content = content.replace(old_render, new_render)

with open('frontend/src/features/customers/pages/CustomersPage.tsx', 'w') as f:
    f.write(content)
