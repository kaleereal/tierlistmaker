import React, { useState } from 'react';
import { Plus, Image, Camera, Link2, ClipboardPaste, Type } from 'lucide-react';
import { triggerHaptic } from '../../services/imageUtils';

export interface SpeedDialAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface SpeedDialFABProps {
  onSelectFromGallery: () => void;
  onTakePhoto: () => void;
  onFromLink: () => void;
  onPasteClipboard: () => void;
  onTextOnly: () => void;
}

export const SpeedDialFAB: React.FC<SpeedDialFABProps> = ({
  onSelectFromGallery,
  onTakePhoto,
  onFromLink,
  onPasteClipboard,
  onTextOnly,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => {
    triggerHaptic('light');
    setIsOpen(!isOpen);
  };

  const actions = [
    {
      id: 'gallery',
      label: 'Dari galeri',
      icon: <Image className="w-5 h-5 text-[#FFDDB3]" />,
      onClick: () => {
        setIsOpen(false);
        onSelectFromGallery();
      },
    },
    {
      id: 'camera',
      label: 'Ambil foto',
      icon: <Camera className="w-5 h-5 text-[#FFDDB3]" />,
      onClick: () => {
        setIsOpen(false);
        onTakePhoto();
      },
    },
    {
      id: 'link',
      label: 'Dari link',
      icon: <Link2 className="w-5 h-5 text-[#FFDDB3]" />,
      onClick: () => {
        setIsOpen(false);
        onFromLink();
      },
    },
    {
      id: 'clipboard',
      label: 'Tempel dari clipboard',
      icon: <ClipboardPaste className="w-5 h-5 text-[#FFDDB3]" />,
      onClick: () => {
        setIsOpen(false);
        onPasteClipboard();
      },
    },
    {
      id: 'text',
      label: 'Hanya teks',
      icon: <Type className="w-5 h-5 text-[#FFDDB3]" />,
      onClick: () => {
        setIsOpen(false);
        onTextOnly();
      },
    },
  ];

  return (
    <>
      {/* Scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Speed Dial Menu Container */}
      <div className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="flex flex-col items-end gap-3 mb-1 animate-in fade-in slide-in-from-bottom-5 duration-200">
            {actions.map((act, index) => (
              <div
                key={act.id}
                className="flex items-center gap-3 group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Chip label on the left */}
                <div
                  onClick={act.onClick}
                  className="px-3 py-1.5 bg-[#2B2926] text-[#E6E1DC] text-sm font-medium rounded-lg shadow-md border border-[#363430] cursor-pointer hover:bg-[#363430] transition-colors whitespace-nowrap"
                >
                  {act.label}
                </div>

                {/* Small FAB 40dp */}
                <button
                  id={`btn-speeddial-${act.id}`}
                  type="button"
                  onClick={act.onClick}
                  className="w-10 h-10 rounded-full bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100] flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  {act.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB 56x56dp */}
        <button
          id="btn-main-fab"
          type="button"
          onClick={toggle}
          aria-label="Tambah entri"
          className="w-14 h-14 rounded-2xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] flex items-center justify-center shadow-xl transition-all duration-200 active:scale-95"
        >
          <Plus
            className={`w-6 h-6 transition-transform duration-200 ${
              isOpen ? 'rotate-45 text-[#FFDDB3]' : 'rotate-0'
            }`}
          />
        </button>
      </div>
    </>
  );
};
