import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  fullPage = false,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 p-8 text-xs text-[#71717A]',
        fullPage && 'fixed inset-0 bg-[#FAFAF8] z-50',
        className
      )}
    >
      <Loader2 className="w-6 h-6 animate-spin text-black" />
      {message && <p className="font-medium">{message}</p>}
    </div>
  );
};
