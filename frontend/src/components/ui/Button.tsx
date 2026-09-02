import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'destructive' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer focus-visible:ring-black border';

    const variants = {
      primary: 'bg-[#000000] text-[#FFFFFF] hover:bg-[#27272A] border-transparent font-medium shadow-sm',
      secondary: 'bg-[#FFFFFF] text-[#18181B] hover:bg-[#F4F4F5] border-[#E4E4E7] font-medium shadow-sm',
      success: 'bg-[#C1FBD4] text-[#064E3B] hover:bg-[#A3F7BE] border-transparent font-semibold shadow-sm',
      destructive: 'bg-[#DC2626] text-[#FFFFFF] hover:bg-[#B91C1C] border-transparent font-medium shadow-sm',
      ghost: 'bg-transparent text-[#18181B] hover:bg-[#F4F4F5] border-transparent font-normal',
      link: 'bg-transparent text-[#18181B] underline-offset-4 hover:underline border-transparent p-0 h-auto font-medium',
    };

    const sizes = {
      sm: 'min-h-[36px] px-3.5 text-xs gap-1.5',
      md: 'min-h-[44px] px-5 text-sm gap-2',
      lg: 'min-h-[50px] px-6 text-base gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
