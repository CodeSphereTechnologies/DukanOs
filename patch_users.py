with open('frontend/src/features/users/pages/UsersPage.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { Avatar } from '../../../components/ui/Avatar';\n"
content = content.replace("import { DataTable } from '../../../components/ui/DataTable';", "import { DataTable } from '../../../components/ui/DataTable';\n" + import_stmt)

old_avatar = """          <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xs shrink-0 font-display">
            {u.name.charAt(0)}
          </div>"""

new_avatar = """          <Avatar name={u.name} className="w-8 h-8 shrink-0" />"""

content = content.replace(old_avatar, new_avatar)

with open('frontend/src/features/users/pages/UsersPage.tsx', 'w') as f:
    f.write(content)
