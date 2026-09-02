import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className,
}) => {
  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#065F46]" />,
    error: <AlertCircle className="w-4 h-4 text-[#991B1B]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#92400E]" />,
    info: <Info className="w-4 h-4 text-[#18181B]" />,
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3.5 rounded-xl border bg-white shadow-lg text-xs text-[#18181B] border-[#E4E4E7] min-w-[280px] max-w-sm',
        className
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <div className="font-semibold text-[#18181B] mb-0.5">{title}</div>}
        <div className="text-[#52525B] leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[#A1A1AA] hover:text-[#18181B] p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
