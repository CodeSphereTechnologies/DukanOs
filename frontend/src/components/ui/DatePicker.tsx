import React from 'react';
import { cn } from '../../lib/utils';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-[#71717A]">
          <Calendar className="w-4 h-4" />
        </div>
        <input
          type="date"
          ref={ref}
          className={cn(
            'w-full h-[44px] pl-10 pr-3.5 py-2 text-sm bg-white text-[#18181B] rounded-lg border border-[#E4E4E7] transition-all focus:outline-none focus:border-black focus:ring-1 focus:ring-black',
            error && 'border-[#DC2626]',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
