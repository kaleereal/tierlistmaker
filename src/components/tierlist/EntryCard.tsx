import React from 'react';
import { CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { EntryEntity, ThumbnailSize, TitleDisplayMode } from '../../types';
import { getTitleColorHash } from '../../services/imageUtils';

interface EntryCardProps {
  entry: EntryEntity;
  thumbnailSize: ThumbnailSize;
  titleDisplayMode: TitleDisplayMode;
  isSelected?: boolean;
  isDragging?: boolean;
  dropIndicatorPosition?: 'left' | 'right' | null;
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const EntryCard: React.FC<EntryCardProps> = ({
  entry,
  thumbnailSize,
  titleDisplayMode,
  isSelected = false,
  isDragging = false,
  dropIndicatorPosition = null,
  onClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  // Height & width calculation based on 2:3 ratio
  // Small: 72dp height (48dp width)
  // Medium: 96dp height (64dp width)
  // Large: 128dp height (85dp width)
  const dimensions = {
    small: { w: 'w-[48px] min-w-[48px]', h: 'h-[72px]', imgH: 'h-[72px]' },
    medium: { w: 'w-[64px] min-w-[64px]', h: 'h-[96px]', imgH: 'h-[96px]' },
    large: { w: 'w-[85px] min-w-[85px]', h: 'h-[128px]', imgH: 'h-[128px]' },
  }[thumbnailSize];

  const hasImage = Boolean(entry.imagePath && entry.imageStatus !== 'FAILED' && entry.imageStatus !== 'NONE');
  const bgFallback = getTitleColorHash(entry.title);

  return (
    <div
      id={`entry-card-wrap-${entry.id}`}
      className="relative flex flex-col items-center select-none group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      {/* Left drop insertion line indicator */}
      {dropIndicatorPosition === 'left' && (
        <div
          className="absolute -left-1.5 top-0 bottom-0 w-[3px] bg-[#E0A458] z-30 rounded-full drop-indicator-pulse shadow-[0_0_8px_#E0A458]"
          style={{ height: thumbnailSize === 'small' ? '72px' : thumbnailSize === 'large' ? '128px' : '96px' }}
        />
      )}

      {/* Main card box */}
      <div
        id={`entry-card-${entry.id}`}
        className={`relative ${dimensions.w} ${dimensions.imgH} rounded rounded-sm overflow-hidden transition-all duration-150 ${
          isDragging ? 'opacity-30 scale-95' : 'hover:scale-[1.03]'
        } ${
          isSelected
            ? 'ring-3 ring-[#E0A458] brightness-75'
            : 'ring-1 ring-black/40 shadow-sm'
        }`}
        style={{
          backgroundColor: hasImage ? '#211F1C' : bgFallback,
        }}
      >
        {/* Image or Text-only representation */}
        {hasImage ? (
          <img
            src={entry.imagePath!}
            alt={entry.title}
            className="w-full h-full object-cover pointer-events-none"
            loading="lazy"
            onError={(e) => {
              // fallback
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full p-1.5 flex items-center justify-center text-center">
            <span className="text-[11px] font-medium leading-tight text-white line-clamp-4 break-words">
              {entry.title}
            </span>
          </div>
        )}

        {/* Overlay Title (if mode === 'overlay') */}
        {titleDisplayMode === 'overlay' && hasImage && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1 pt-3">
            <span className="text-[10px] font-medium text-white line-clamp-2 leading-tight block">
              {entry.title}
            </span>
          </div>
        )}

        {/* Score Badge (capsule top-right) */}
        {entry.score !== null && entry.score !== undefined && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-[#141311]/85 backdrop-blur-xs flex items-center gap-0.5 shadow">
            <Star className="w-2.5 h-2.5 text-[#FFC107] fill-[#FFC107]" />
            <span className="text-[9px] font-bold text-[#E6E1DC]">{entry.score}</span>
          </div>
        )}

        {/* Failed image warning icon */}
        {entry.imageStatus === 'FAILED' && (
          <div className="absolute bottom-1 left-1 p-0.5 rounded bg-[#141311]/85 text-[#FFB4AB]">
            <AlertTriangle className="w-3 h-3" />
          </div>
        )}

        {/* Selection tick checkmark */}
        {isSelected && (
          <div className="absolute top-1 left-1 bg-[#141311]/90 rounded-full p-0.5 shadow text-[#E0A458]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Title Below Image (if mode === 'below') */}
      {titleDisplayMode === 'below' && (
        <div className={`mt-1 ${dimensions.w} text-center`}>
          <span className="text-[11px] text-[#D1C4B8] font-normal line-clamp-2 leading-tight break-words">
            {entry.title}
          </span>
        </div>
      )}

      {/* Right drop insertion line indicator */}
      {dropIndicatorPosition === 'right' && (
        <div
          className="absolute -right-1.5 top-0 bottom-0 w-[3px] bg-[#E0A458] z-30 rounded-full drop-indicator-pulse shadow-[0_0_8px_#E0A458]"
          style={{ height: thumbnailSize === 'small' ? '72px' : thumbnailSize === 'large' ? '128px' : '96px' }}
        />
      )}
    </div>
  );
};
