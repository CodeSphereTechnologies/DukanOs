with open('frontend/src/components/layout/UserMenu.tsx', 'r') as f:
    content = f.read()

import_stmt = "import { Avatar } from '../ui/Avatar';\n"
content = content.replace("import { ChevronDown, LogOut, Shield } from 'lucide-react';", "import { ChevronDown, LogOut, Shield } from 'lucide-react';\n" + import_stmt)

old_avatar = """        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
          {user.name.charAt(0)}
        </div>"""

new_avatar = """        <Avatar name={user.name} className="w-8 h-8" />"""

content = content.replace(old_avatar, new_avatar)

with open('frontend/src/components/layout/UserMenu.tsx', 'w') as f:
    f.write(content)
