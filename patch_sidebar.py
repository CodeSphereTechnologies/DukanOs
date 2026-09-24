import re

with open('frontend/src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

# insert the RotateCcw icon import
content = content.replace("  Receipt,", "  Receipt,\n  RotateCcw,")

# insert Returns nav item
nav_item_find = "{ label: 'Invoices', path: '/invoices', icon: <Receipt className=\"w-4 h-4\" />, allowedRoles: ['owner', 'manager', 'cashier', 'accountant'] },"
nav_item_replace = "{ label: 'Invoices', path: '/invoices', icon: <Receipt className=\"w-4 h-4\" />, allowedRoles: ['owner', 'manager', 'cashier', 'accountant'] },\n  { label: 'Returns', path: '/returns', icon: <RotateCcw className=\"w-4 h-4\" />, allowedRoles: ['owner', 'manager', 'cashier', 'accountant'] },"
content = content.replace(nav_item_find, nav_item_replace)

with open('frontend/src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)
