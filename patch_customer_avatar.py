with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { Avatar } from '../../../components/ui/Avatar';\n"
content = content.replace("import { Dialog } from '../../../components/ui/Dialog';", "import { Dialog } from '../../../components/ui/Dialog';\n" + import_stmt)

old_avatar = """          <div className="w-14 h-14 rounded-full bg-[#000000] text-white flex items-center justify-center font-semibold text-lg shrink-0">
            {initials}
          </div>"""

new_avatar = """          <Avatar name={customer.name} className="w-14 h-14 shrink-0" />"""

content = content.replace(old_avatar, new_avatar)

# Remove the unused initials calculation if present
import re
content = re.sub(r'const initials = customer\?.name\s+.*?;\n', '', content, flags=re.DOTALL)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
