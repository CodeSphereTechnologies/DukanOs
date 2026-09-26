with open('frontend/src/features/auth/pages/LoginPage.tsx', 'r') as f:
    content = f.read()

content = content.replace('mb-16', 'mb-10')
content = content.replace('mb-12', 'mb-8')
content = content.replace('mt-8 pt-6', 'mt-6 pt-4')
content = content.replace('mt-10', 'mt-6')

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/layouts/AuthLayout.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace('py-10', 'py-4')

with open('frontend/src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(content2)
