import React from 'react';
import { cn } from '../../lib/utils';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ className, children, ...props }) => {
  return (
    <div className={cn('p-4 rounded-xl border border-[#E4E4E7] bg-[#FAFAF8]', className)} {...props}>
      {children}
    </div>
  );
};
