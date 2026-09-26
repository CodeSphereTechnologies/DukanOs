import React from 'react';
import { SEEDED_ACCOUNTS } from '../../../lib/constants';
import { UserCheck } from 'lucide-react';

export interface DemoAccountPickerProps {
  onSelectAccount: (email: string) => void;
  isLoading?: boolean;
}

export const DemoAccountPicker: React.FC<DemoAccountPickerProps> = ({ onSelectAccount, isLoading = false }) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
        <span>1-Click Seeded Demo Roles</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SEEDED_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectAccount(acc.email)}
            className="p-2.5 rounded-xl bg-[#F4F4F5] border border-transparent hover:border-[#059669]/20 hover:bg-[#F4F4F5] text-left transition-all text-xs group disabled:opacity-50"
          >
            <div className="font-semibold text-[#18181B] group-hover:text-[#059669]">{acc.role}</div>
            <div className="text-[11px] text-neutral-500 truncate">{acc.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
