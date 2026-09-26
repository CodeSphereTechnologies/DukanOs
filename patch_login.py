import re

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'r') as f:
    content = f.read()

find_block = """      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Welcome to DukanOS
        </h1>"""

replace_block = """      <div className="text-center space-y-4 flex flex-col items-center">
        <img src="/logo-light-rect-nobg.png" alt="DukanOS" className="h-10 object-contain mx-auto mb-2" />
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Welcome to DukanOS
        </h1>"""

content = content.replace(find_block, replace_block)

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'w') as f:
    f.write(content)
