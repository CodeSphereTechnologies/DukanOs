import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <section className={cn('space-y-3', className)} {...props}>
      {(title || action) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-sm font-semibold text-[#18181B] font-display">{title}</h3>}
            {description && <p className="text-xs text-[#71717A] mt-0.5">{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
