with open('frontend/src/layouts/AuthLayout.tsx', 'r') as f:
    content = f.read()

content = content.replace('className="min-h-screen w-full', 'className="h-screen w-full')
content = content.replace('w-1/2 min-h-screen overflow-hidden', 'w-1/2 h-full overflow-hidden')
content = content.replace('src="/hero-v2.jpg"', 'src="/pattern.jpg"')
content = content.replace('bg-white min-h-screen overflow-y-auto"', 'bg-white h-full overflow-hidden"')

with open('frontend/src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'r') as f:
    content2 = f.read()

content2 = content2.replace('src="/logo-dark-rect-nobg.png"', 'src="/logo-light-rect-nobg.png"')
content2 = content2.replace('h-12 sm:h-14', 'h-16 sm:h-20') # Make logo even bigger as per previous request? Or maybe it's fine. Wait, user said "the logo is also not big and prominent". It's already big but let's make it h-16 sm:h-20 just in case.

with open('frontend/src/features/auth/pages/LoginPage.tsx', 'w') as f:
    f.write(content2)
