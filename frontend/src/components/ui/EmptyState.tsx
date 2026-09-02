import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <Inbox className="w-10 h-10 text-[#A1A1AA]" />,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-[#E4E4E7] bg-white', className)}>
      <div className="p-3 bg-[#FAFAF8] rounded-full mb-3">{icon}</div>
      <h4 className="text-sm font-semibold text-[#18181B] font-display">{title}</h4>
      {description && <p className="text-xs text-[#71717A] max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
};
