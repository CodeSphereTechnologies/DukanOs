import React from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  description?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  description,
  className,
  labelClassName,
  children,
  id,
}) => {
  const note = helperText || description;
  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            'text-xs font-medium text-[#18181B] flex items-center justify-between',
            labelClassName
          )}
        >
          <span>
            {label}
            {required && <span className="text-[#DC2626] ml-0.5">*</span>}
          </span>
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-[#DC2626]">{error}</p>
      ) : note ? (
        <p className="text-xs text-[#71717A]">{note}</p>
      ) : null}
    </div>
  );
};
