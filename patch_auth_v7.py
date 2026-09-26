with open('frontend/src/layouts/AuthLayout.tsx', 'r') as f:
    content = f.read()

# Add rounded corners to the image container
# Current: <div className="relative hidden lg:flex flex-col w-1/2 h-full overflow-hidden p-12 xl:p-16 justify-between items-start group">
content = content.replace('w-1/2 h-full overflow-hidden', 'w-1/2 h-full overflow-hidden rounded-[40px] m-4 shadow-2xl')

# Change overlay text
content = content.replace('You can get everything you want if you work hard, trust the process, and stick to the plan.', 'اپنی دکان دماغ کے ساتھ چلاؤ۔')
# We need to make sure the text renders in Urdu properly
content = content.replace('className="text-base text-white/80 max-w-sm leading-relaxed drop-shadow-md"', 'className="text-2xl text-[#C1FBD4] leading-relaxed drop-shadow-md font-urdu" style={{ fontFamily: "\'Noto Nastaliq Urdu\', serif" }} dir="rtl"')

with open('frontend/src/layouts/AuthLayout.tsx', 'w') as f:
    f.write(content)

with open('frontend/src/routes/index.tsx', 'r') as f:
    routes = f.read()

routes = routes.replace('return <Navigate to="/login" replace />;\n    return <LandingPage />;', 'return <LandingPage />;')

with open('frontend/src/routes/index.tsx', 'w') as f:
    f.write(routes)
