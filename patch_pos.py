with open('frontend/src/layouts/POSLayout.tsx', 'r') as f:
    content = f.read()

# Import Store
content = content.replace('ArrowLeft, Zap } from \'lucide-react\';', 'ArrowLeft, Zap, Store } from \'lucide-react\';')

# The header is currently:
# <header className="h-14 bg-black text-white px-4 flex items-center justify-between shrink-0 print:hidden">
# We need to make it `relative` to allow absolute centering.
content = content.replace('<header className="h-14 bg-black text-white px-4 flex items-center justify-between shrink-0 print:hidden">', '<header className="h-16 bg-black text-white px-4 flex items-center justify-between shrink-0 print:hidden relative">')

# We can remove the tenant name from the right side because it's going in the center.
# Find the right side div
old_right_side = """        <div className="flex items-center gap-3 text-xs">
          {user?.tenant && (
            <span className="text-neutral-400 hidden sm:inline">{user.tenant.name}</span>
          )}
          <span className="px-2.5 py-1 bg-neutral-800 rounded-full text-white font-medium flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#C1FBD4]" />
            {user?.name}
          </span>
        </div>"""

new_right_side = """        <div className="flex items-center gap-3 text-xs">
          <span className="px-2.5 py-1 bg-neutral-800 rounded-full text-white font-medium flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-[#C1FBD4]" />
            {user?.name}
          </span>
        </div>"""

content = content.replace(old_right_side, new_right_side)

# Now add the center div right before the right side div.
center_div = """
        {/* Center Logo & Vendor */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-4 hidden md:flex">
          <img src="/logo-dark-rect-nobg.png" alt="DukanOS" className="h-6 object-contain" />
          <div className="h-5 w-px bg-neutral-800" />
          <div className="flex items-center gap-2 bg-neutral-900/50 pr-3 pl-1.5 py-1.5 rounded-lg border border-neutral-800/50">
            <div className="w-6 h-6 rounded bg-[#059669]/20 text-[#C1FBD4] flex items-center justify-center">
              <Store className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-[13px] text-white tracking-tight">{user?.tenant?.name || 'Vendor'}</span>
          </div>
        </div>

"""

content = content.replace('        <div className="flex items-center gap-3 text-xs">', center_div + '        <div className="flex items-center gap-3 text-xs">')

with open('frontend/src/layouts/POSLayout.tsx', 'w') as f:
    f.write(content)
