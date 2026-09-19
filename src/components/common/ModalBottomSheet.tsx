import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
  fullWidth?: boolean;
}

export const ModalBottomSheet: React.FC<ModalBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Sheet / Modal Container */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full sm:max-w-xl bg-[#211F1C] text-[#E6E1DC] rounded-t-[28px] sm:rounded-[28px] border border-[#363430] shadow-2xl flex flex-col ${maxHeight} overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out`}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-2 flex items-center justify-center cursor-pointer select-none" onClick={onClose}>
          <div className="w-8 h-1 rounded-full bg-[#D1C4B8]/40" />
        </div>

        {/* Header if title provided */}
        {title && (
          <div className="px-6 py-2 flex items-center justify-between border-b border-[#2B2926]">
            <h2 className="text-lg font-medium text-[#E6E1DC]">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#2B2926] hover:text-[#E6E1DC] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Sheet Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
