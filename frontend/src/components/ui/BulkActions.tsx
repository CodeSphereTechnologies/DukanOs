import React from 'react';
import { Button } from './Button';

export interface BulkActionsProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: React.ReactNode;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  onClearSelection,
  actions,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#000000] text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom duration-200">
      <span className="text-xs font-semibold">{selectedCount} items selected</span>
      <div className="h-4 w-px bg-neutral-700" />
      <div className="flex items-center gap-2">{actions}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearSelection}
        className="text-neutral-400 hover:text-white h-7 text-xs px-2"
      >
        Deselect
      </Button>
    </div>
  );
};
