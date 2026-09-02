import React from 'react';
import { cn } from '../../lib/utils';

export interface PageContainerProps {
  title?: string;
  subtitle?: string;
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryActions,
  children,
  className,
}) => {
  return (
    <div className={cn('w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6', className)}>
      {(title || primaryAction || secondaryActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h1 className="text-xl font-bold tracking-tight text-[#18181B] font-display">{title}</h1>}
            {subtitle && <p className="text-xs text-[#71717A] mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
