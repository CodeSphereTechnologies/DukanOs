import React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  className,
  children,
  id,
}) => {
  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[#18181B] flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-[#DC2626] ml-0.5">*</span>}
          </span>
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-[#DC2626]">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#71717A]">{helperText}</p>
      ) : null}
    </div>
  );
};
