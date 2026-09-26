import re

with open('frontend/src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

# Expanded Mobile
content = content.replace(
'''              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                  D
                </div>
                <span className="font-bold text-base tracking-tight font-display text-[#18181B]">
                  Dukan<span className="text-[#059669]">OS</span>
                </span>
              </div>''',
'''              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/logo-dark-rect-nobg.png" alt="DukanOS" className="h-7 object-contain" />
              </div>'''
)

# Expanded Desktop
content = content.replace(
'''            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
                D
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-sm tracking-tight font-display text-[#18181B] truncate">
                  Dukan<span className="text-[#059669]">OS</span>
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full leading-none">
                  Pro
                </span>
              </div>
            </div>''',
'''            <div className="flex items-center gap-2 min-w-0">
              <img src="/logo-dark-rect-nobg.png" alt="DukanOS" className="h-6 object-contain" />
              <span className="text-[9px] font-semibold uppercase tracking-wider bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full leading-none">
                Pro
              </span>
            </div>'''
)

# Collapsed Desktop
content = content.replace(
'''            <div className="w-8 h-8 bg-[#18181B] rounded-lg flex items-center justify-center text-white font-bold text-sm tracking-tight shadow-xs shrink-0">
              D
            </div>''',
'''            <img src="/logo_nobg.png" alt="D" className="w-8 h-8 object-contain" />'''
)

with open('frontend/src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)
