import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'mint' | 'warning' | 'destructive' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full tracking-tight select-none';

  const variants = {
    default: 'bg-[#000000] text-[#FFFFFF]',
    mint: 'bg-[#C1FBD4] text-[#064E3B] font-semibold',
    warning: 'bg-[#FEF3C7] text-[#92400E]',
    destructive: 'bg-[#FEE2E2] text-[#991B1B]',
    outline: 'border border-[#E4E4E7] text-[#18181B] bg-transparent',
    neutral: 'bg-[#F4F4F5] text-[#52525B]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
