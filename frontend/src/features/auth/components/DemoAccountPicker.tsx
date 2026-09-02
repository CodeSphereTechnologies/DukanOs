import React from 'react';
import { SEEDED_ACCOUNTS } from '../../../lib/constants';
import { UserCheck } from 'lucide-react';

export interface DemoAccountPickerProps {
  onSelectAccount: (email: string) => void;
  isLoading?: boolean;
}

export const DemoAccountPicker: React.FC<DemoAccountPickerProps> = ({ onSelectAccount, isLoading = false }) => {
  return (
    <div className="space-y-3 pt-4 border-t border-neutral-800">
      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
        <UserCheck className="w-3.5 h-3.5 text-[#C1FBD4]" />
        <span>1-Click Seeded Demo Roles</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SEEDED_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            disabled={isLoading}
            onClick={() => onSelectAccount(acc.email)}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/80 text-left transition-all text-xs group disabled:opacity-50"
          >
            <div className="font-semibold text-white group-hover:text-[#C1FBD4]">{acc.role}</div>
            <div className="text-[11px] text-neutral-400 truncate">{acc.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
