import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div
        className={cn(
          'relative w-full bg-white rounded-xl sm:rounded-2xl shadow-xl border border-[#E4E4E7] overflow-hidden z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in fade-in-0 zoom-in-95 duration-150',
          widthClasses[maxWidth]
        )}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex items-start justify-between border-b border-[#E4E4E7]/60">
          <div className="min-w-0 pr-2">
            {title && <h3 className="text-sm sm:text-base font-semibold text-[#18181B] font-display truncate sm:whitespace-normal">{title}</h3>}
            {description && <p className="text-[11px] sm:text-xs text-[#71717A] mt-0.5 sm:mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        {/* @container so that multi-column layouts inside a dialog can key off
            the dialog's own width. Plain `sm:`/`md:` variants resolve against
            the viewport, which laid a 2-column form out inside a 460px modal. */}
        <div className="@container px-4 sm:px-6 py-3.5 sm:py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-[#FAFAF8] border-t border-[#E4E4E7] flex flex-wrap items-center justify-end gap-2 sm:gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
