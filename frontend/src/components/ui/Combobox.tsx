import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Search, Check, ChevronDown } from 'lucide-react';

export interface ComboboxOption {
  label: string;
  value: string | number;
  sublabel?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase()) ||
    (opt.sublabel && opt.sublabel.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[44px] px-3.5 py-2 text-sm bg-white text-[#18181B] rounded-lg border border-[#E4E4E7] flex items-center justify-between transition-all focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-[#FAFAFA]"
      >
        <span className={cn('truncate', !selectedOption && 'text-[#A1A1AA]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-[#71717A] shrink-0 ml-2" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-[#E4E4E7] rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col animate-in fade-in-0 duration-100">
          <div className="p-2 border-b border-[#E4E4E7] flex items-center gap-2">
            <Search className="w-4 h-4 text-[#71717A] ml-1" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs bg-transparent border-none outline-none text-[#18181B] placeholder:text-[#A1A1AA]"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-48 p-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-xs text-center text-[#71717A]">No options found.</div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between hover:bg-[#F4F4F5] transition-colors',
                    opt.value === value && 'bg-[#F4F4F5] font-semibold text-black'
                  )}
                >
                  <div>
                    <div>{opt.label}</div>
                    {opt.sublabel && <div className="text-[11px] text-[#71717A]">{opt.sublabel}</div>}
                  </div>
                  {opt.value === value && <Check className="w-3.5 h-3.5 text-black" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
