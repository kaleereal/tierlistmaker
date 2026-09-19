import React, { useState } from 'react';
import { GripVertical } from 'lucide-react';
import { TierEntity, EntryEntity, ThumbnailSize, TitleDisplayMode, RowLayoutMode } from '../../types';
import { EntryCard } from './EntryCard';
import { getAutoTextColor } from '../../services/imageUtils';

interface TierRowProps {
  tier: TierEntity;
  entries: EntryEntity[];
  thumbnailSize: ThumbnailSize;
  titleDisplayMode: TitleDisplayMode;
  rowLayoutMode?: RowLayoutMode;
  selectedEntryIds: Set<string>;
  draggingEntryId: string | null;
  draggingTierId: string | null;
  onEntryClick: (entry: EntryEntity) => void;
  onLabelClick: (tier: TierEntity) => void;
  // Drag & Drop for entries
  onEntryDragStart: (e: React.DragEvent, entry: EntryEntity) => void;
  onEntryDropInTier: (targetTierId: string, insertAtIndex: number) => void;
  // Drag & Drop for tier reordering
  onTierDragStart: (e: React.DragEvent, tierId: string) => void;
  onTierDragOver: (e: React.DragEvent, tierId: string) => void;
  onTierDrop: (targetTierId: string) => void;
  isTierDropTarget?: boolean;
}

export const TierRow: React.FC<TierRowProps> = ({
  tier,
  entries,
  thumbnailSize,
  titleDisplayMode,
  rowLayoutMode = 'scroll',
  selectedEntryIds,
  draggingEntryId,
  draggingTierId,
  onEntryClick,
  onLabelClick,
  onEntryDragStart,
  onEntryDropInTier,
  onTierDragStart,
  onTierDragOver,
  onTierDrop,
  isTierDropTarget = false,
}) => {
  const [isEntryHovered, setIsEntryHovered] = useState(false);
  const [hoveredEntryIndex, setHoveredEntryIndex] = useState<number | null>(null);
  const [hoverSide, setHoverSide] = useState<'left' | 'right' | null>(null);

  // Auto text color calculation
  const { textColor } = getAutoTextColor(tier.colorHex);

  // Font size scaling based on length
  const labelLen = tier.label.trim().length;
  let fontClass = 'text-2xl font-bold'; // 28sp
  if (labelLen >= 2 && labelLen <= 3) fontClass = 'text-xl font-bold'; // 22sp
  else if (labelLen >= 4 && labelLen <= 6) fontClass = 'text-sm font-bold'; // 16sp
  else if (labelLen > 6) fontClass = 'text-xs font-semibold leading-tight'; // 14sp

  // Row height
  const minHeightClass = {
    small: 'min-h-[88px]',
    medium: 'min-h-[112px]',
    large: 'min-h-[144px]',
  }[thumbnailSize];

  // Drag over empty/body tier row
  const handleTierRowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingTierId) {
      onTierDragOver(e, tier.id);
      return;
    }
    if (draggingEntryId) {
      e.dataTransfer.dropEffect = 'move';
      setIsEntryHovered(true);
    }
  };

  const handleTierRowDragLeave = () => {
    setIsEntryHovered(false);
    setHoveredEntryIndex(null);
    setHoverSide(null);
  };

  const handleTierRowDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEntryHovered(false);

    if (draggingTierId) {
      onTierDrop(tier.id);
      return;
    }

    if (draggingEntryId) {
      if (hoveredEntryIndex !== null && hoverSide !== null) {
        const insertIndex = hoverSide === 'left' ? hoveredEntryIndex : hoveredEntryIndex + 1;
        onEntryDropInTier(tier.id, insertIndex);
      } else {
        // Drop at end of tier
        onEntryDropInTier(tier.id, entries.length);
      }
      setHoveredEntryIndex(null);
      setHoverSide(null);
    }
  };

  // Card specific drag over (for calculating left or right insertion indicator)
  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingEntryId) return;

    const targetEl = e.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;
    const side = e.clientX < midpoint ? 'left' : 'right';

    setHoveredEntryIndex(index);
    setHoverSide(side);
  };

  return (
    <div
      id={`tier-row-${tier.id}`}
      className={`relative flex items-stretch border-b-2 border-[#9A8F84]/20 transition-all ${
        isTierDropTarget ? 'border-t-4 border-t-[#E0A458] shadow-lg' : ''
      }`}
      onDragOver={handleTierRowDragOver}
      onDragLeave={handleTierRowDragLeave}
      onDrop={handleTierRowDrop}
    >
      {/* Label Box (80dp wide, draggable for tier reordering) */}
      <div
        id={`tier-label-${tier.id}`}
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onTierDragStart(e, tier.id);
        }}
        onClick={() => onLabelClick(tier)}
        title="Klik untuk ubah tier, atau seret untuk atur urutan tier"
        className={`w-20 min-w-20 sm:w-24 sm:min-w-24 shrink-0 flex flex-col items-center justify-center p-2 text-center select-none cursor-grab active:cursor-grabbing group relative transition-transform ${minHeightClass}`}
        style={{
          backgroundColor: tier.colorHex,
          color: textColor,
        }}
      >
        {/* Tier Drag Handle Icon */}
        <div className="absolute top-1 right-1 opacity-40 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4" />
        </div>

        <span className={`${fontClass} break-words max-w-full px-1 line-clamp-2`}>
          {tier.label}
        </span>
      </div>

      {/* Entries Area */}
      <div
        id={`tier-entries-${tier.id}`}
        className={`flex-1 bg-[#211F1C] p-2 transition-colors relative flex items-center ${
          isEntryHovered ? 'bg-[#E0A458]/10 ring-2 ring-[#E0A458] ring-inset' : ''
        } ${minHeightClass}`}
      >
        {entries.length === 0 ? (
          <div className="w-full flex items-center justify-center py-4 text-[#D1C4B8]/60 text-sm italic pointer-events-none select-none">
            Seret entri ke sini
          </div>
        ) : rowLayoutMode === 'wrap' ? (
          <div className="flex flex-wrap items-start gap-2 w-full">
            {entries.map((entry, index) => {
              const isHoveredTarget = hoveredEntryIndex === index && draggingEntryId !== null;
              const indicatorPos = isHoveredTarget ? hoverSide : null;
              return (
                <div
                  key={entry.id}
                  onDragOver={(e) => handleCardDragOver(e, index)}
                >
                  <EntryCard
                    entry={entry}
                    thumbnailSize={thumbnailSize}
                    titleDisplayMode={titleDisplayMode}
                    isSelected={selectedEntryIds.has(entry.id)}
                    isDragging={draggingEntryId === entry.id}
                    dropIndicatorPosition={indicatorPos}
                    onClick={() => onEntryClick(entry)}
                    onDragStart={(e) => onEntryDragStart(e, entry)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto w-full py-1 scroll-smooth">
            {entries.map((entry, index) => {
              const isHoveredTarget = hoveredEntryIndex === index && draggingEntryId !== null;
              const indicatorPos = isHoveredTarget ? hoverSide : null;
              return (
                <div
                  key={entry.id}
                  className="shrink-0"
                  onDragOver={(e) => handleCardDragOver(e, index)}
                >
                  <EntryCard
                    entry={entry}
                    thumbnailSize={thumbnailSize}
                    titleDisplayMode={titleDisplayMode}
                    isSelected={selectedEntryIds.has(entry.id)}
                    isDragging={draggingEntryId === entry.id}
                    dropIndicatorPosition={indicatorPos}
                    onClick={() => onEntryClick(entry)}
                    onDragStart={(e) => onEntryDragStart(e, entry)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
