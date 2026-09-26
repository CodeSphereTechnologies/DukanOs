with open('frontend/src/layouts/AuthLayout.tsx', 'r') as f:
    content = f.read()

content = content.replace('p-6 sm:p-12 lg:p-16 xl:p-24', 'p-4 sm:p-8 lg:p-16 xl:p-24')
content = content.replace('py-10', 'py-4')
# Ensure right column can center perfectly
content = content.replace('bg-white h-full overflow-hidden', 'bg-white h-full overflow-hidden relative')

with open('frontend/src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(content)
