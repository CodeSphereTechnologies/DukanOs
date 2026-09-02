import React from 'react';
import { Badge } from './Badge';
import { X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterBarProps {
  activeFilters: { key: string; label: string; value: string }[];
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilters,
  onRemoveFilter,
  onClearAll,
}) => {
  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-xs text-[#71717A] font-medium">Active Filters:</span>
      {activeFilters.map((f) => (
        <Badge key={f.key} variant="neutral" className="gap-1 pr-1">
          <span>{f.label}: {f.value}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(f.key)}
            className="hover:text-black p-0.5 rounded-full"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-[#71717A] hover:text-black underline ml-1"
      >
        Clear All
      </button>
    </div>
  );
};
