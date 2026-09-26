with open('frontend/src/features/auth/components/DemoAccountPicker.tsx', 'r') as f:
    content = f.read()

content = content.replace('pt-4 border-t border-neutral-800', 'pt-2')
content = content.replace('text-neutral-400 flex items-center', 'text-neutral-500 flex items-center')
content = content.replace('text-[#C1FBD4]', 'text-[#059669]')
content = content.replace('bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/80', 'bg-[#F4F4F5] border border-transparent hover:border-[#059669]/20 hover:bg-[#F4F4F5]')
content = content.replace('text-white group-hover:text-[#C1FBD4]', 'text-[#18181B] group-hover:text-[#059669]')
content = content.replace('text-[11px] text-neutral-400 truncate', 'text-[11px] text-neutral-500 truncate')

with open('frontend/src/features/auth/components/DemoAccountPicker.tsx', 'w') as f:
    f.write(content)
