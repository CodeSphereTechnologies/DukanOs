with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'r') as f:
    content = f.read()

import re
content = re.sub(r'const initials = [^;]+;\n', '', content)

with open('frontend/src/features/customers/pages/CustomerDetailPage.tsx', 'w') as f:
    f.write(content)
