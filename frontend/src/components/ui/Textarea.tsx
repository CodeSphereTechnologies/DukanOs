import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full p-3 text-sm bg-white text-[#18181B] placeholder:text-[#A1A1AA] rounded-lg border border-[#E4E4E7] transition-all focus:outline-none focus:border-black focus:ring-1 focus:ring-black disabled:bg-[#FAFAFA]',
          error && 'border-[#DC2626]',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
