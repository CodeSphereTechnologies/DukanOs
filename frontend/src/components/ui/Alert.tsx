import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#065F46] shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-[#92400E] shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-[#991B1B] shrink-0" />,
    info: <Info className="w-5 h-5 text-[#18181B] shrink-0" />,
  };

  const styles = {
    success: 'bg-[#E6FDF0] border-[#C1FBD4] text-[#064E3B]',
    warning: 'bg-[#FEF3C7] border-[#FDE68A] text-[#92400E]',
    error: 'bg-[#FEE2E2] border-[#FECACA] text-[#991B1B]',
    info: 'bg-[#F4F4F5] border-[#E4E4E7] text-[#18181B]',
  };

  return (
    <div className={cn('p-4 rounded-xl border flex items-start gap-3 relative', styles[type], className)}>
      {icons[type]}
      <div className="flex-1 text-xs">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full hover:bg-black/5 transition-colors opacity-70 hover:opacity-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
