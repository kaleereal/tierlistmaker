import React, { useState } from 'react';
import {
  X,
  Edit2,
  FolderInput,
  Copy,
  Image as ImageIcon,
  Trash2,
  Star,
  ExternalLink,
  History,
  ClipboardCopy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { EntryEntity, TierEntity, TagEntity, Screen } from '../../types';
import { storage } from '../../services/storage';
import { getAutoTextColor, triggerHaptic } from '../../services/imageUtils';
import { ModalBottomSheet } from '../common/ModalBottomSheet';

interface EntryDetailSheetProps {
  entryId: string | null;
  onClose: () => void;
  onNavigate: (screen: Screen) => void;
  onFilterByTag?: (tagId: string) => void;
}

export const EntryDetailSheet: React.FC<EntryDetailSheetProps> = ({
  entryId,
  onClose,
  onNavigate,
  onFilterByTag,
}) => {
  const [isFullScreenViewer, setIsFullScreenViewer] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  if (!entryId) return null;
  const entry = storage.getEntryById(entryId);
  if (!entry) return null;

  const currentTier = entry.tierId ? storage.getTierById(entry.tierId) : undefined;
  const allTiers = storage.getTiers(entry.folderId);
  const tags = storage.getEntryTags(entry.id);
  const history = storage.getMoveHistory(entry.id);

  const { textColor: tierTextColor } = currentTier
    ? getAutoTextColor(currentTier.colorHex)
    : { textColor: '#FFFFFF' };

  const handleCopyNote = () => {
    if (entry.note) {
      navigator.clipboard.writeText(entry.note);
      setCopiedNote(true);
      triggerHaptic('light');
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  const handleMoveToTier = (targetTierId: string | null) => {
    storage.moveEntry(entry.id, targetTierId);
    setIsMoveDialogOpen(false);
    triggerHaptic('light');
  };

  return (
    <>
      <ModalBottomSheet
        isOpen={Boolean(entryId)}
        onClose={onClose}
        maxHeight="max-h-[92vh]"
      >
        <div className="space-y-5 pb-4">
          {/* Big Image (Tap to open full screen viewer) */}
          {entry.imagePath ? (
            <div
              onClick={() => setIsFullScreenViewer(true)}
              className="relative w-full max-h-[360px] rounded-2xl overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer group"
            >
              <img
                src={entry.imagePath}
                alt={entry.title}
                className="w-full max-h-[360px] object-contain"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                Ketuk untuk layar penuh
              </div>
            </div>
          ) : (
            <div className="w-full h-32 rounded-2xl bg-[#2B2926] flex items-center justify-center text-sm text-[#D1C4B8]">
              Entri tanpa gambar
            </div>
          )}

          {/* Title */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#E6E1DC] leading-snug">
              {entry.title}
            </h2>
          </div>

          {/* Meta Badges Row: Tier chip & Score badge */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tier Chip (tap to move) */}
            <button
              type="button"
              onClick={() => setIsMoveDialogOpen(true)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all"
              style={{
                backgroundColor: currentTier ? currentTier.colorHex : '#363430',
                color: currentTier ? tierTextColor : '#E6E1DC',
              }}
            >
              <span>{currentTier ? `Tier ${currentTier.label}` : 'Belum diberi tier (Pool)'}</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Score Badge */}
            {entry.score !== null && entry.score !== undefined && (
              <div className="px-3 py-1.5 rounded-full bg-[#2B2926] border border-[#363430] flex items-center gap-1.5 text-xs font-semibold text-[#E6E1DC]">
                <Star className="w-3.5 h-3.5 text-[#FFC107] fill-[#FFC107]" />
                <span>{entry.score} / 100</span>
              </div>
            )}
          </div>

          {/* Tag Chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  onClick={() => {
                    if (onFilterByTag) {
                      onFilterByTag(tag.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-1 rounded-full text-xs bg-[#2B2926] text-[#D1C4B8] border border-[#363430] cursor-pointer hover:border-[#E0A458]"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Catatan Block */}
          {entry.note && (
            <div className="p-3.5 rounded-xl bg-[#1C1B18] border border-[#2B2926] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#9A8F84] uppercase tracking-wider">
                  Catatan / Ulasan
                </span>
                <button
                  onClick={handleCopyNote}
                  className="flex items-center gap-1 text-xs text-[#E0A458] hover:underline"
                >
                  <ClipboardCopy className="w-3.5 h-3.5" />
                  {copiedNote ? 'Disalin!' : 'Salin'}
                </button>
              </div>
              <p className="text-sm text-[#E6E1DC] whitespace-pre-wrap leading-relaxed">
                {entry.note}
              </p>
            </div>
          )}

          {/* Source Link */}
          {entry.sourceUrl && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#211F1C] border border-[#2B2926] text-xs">
              <span className="text-[#9A8F84] shrink-0">Sumber:</span>
              <a
                href={entry.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#E0A458] hover:underline truncate flex-1 flex items-center gap-1"
              >
                <span className="truncate">{entry.sourceUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}

          {/* Riwayat Perpindahan (Collapsible) */}
          <div className="border-t border-[#2B2926] pt-3">
            <button
              onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium text-[#9A8F84] hover:text-[#E6E1DC]"
            >
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Riwayat Perpindahan ({history.length})
              </span>
              {isHistoryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isHistoryExpanded && (
              <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <p className="text-xs text-[#9A8F84] italic">Belum ada riwayat perpindahan.</p>
                ) : (
                  history.map((h) => {
                    const fromT = h.fromTierId ? storage.getTierById(h.fromTierId) : null;
                    const toT = h.toTierId ? storage.getTierById(h.toTierId) : null;
                    const fromLabel = fromT ? `Tier ${fromT.label}` : 'Pool';
                    const toLabel = toT ? `Tier ${toT.label}` : 'Pool';
                    const timeStr = new Date(h.movedAt).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={h.id}
                        className="text-xs text-[#D1C4B8] flex items-center justify-between py-1 border-b border-[#211F1C]"
                      >
                        <span>
                          {fromLabel} → <strong className="text-[#E6E1DC]">{toLabel}</strong>
                        </span>
                        <span className="text-[10px] text-[#9A8F84]">{timeStr}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Quick Action Bar (Ubah, Pindahkan, Duplikat, Ganti gambar, Hapus) */}
          <div className="border-t border-[#2B2926] pt-4 grid grid-cols-5 gap-1 text-center">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate({
                  type: 'entry_form',
                  folderId: entry.folderId,
                  entryId: entry.id,
                });
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#2B2926] text-[#D1C4B8] hover:text-[#E6E1DC]"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-[11px]">Ubah</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMoveDialogOpen(true)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#2B2926] text-[#D1C4B8] hover:text-[#E6E1DC]"
            >
              <FolderInput className="w-4 h-4" />
              <span className="text-[11px]">Pindah</span>
            </button>

            <button
              type="button"
              onClick={() => {
                storage.duplicateEntry(entry.id);
                triggerHaptic('medium');
                onClose();
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#2B2926] text-[#D1C4B8] hover:text-[#E6E1DC]"
            >
              <Copy className="w-4 h-4" />
              <span className="text-[11px]">Duplikat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate({
                  type: 'entry_form',
                  folderId: entry.folderId,
                  entryId: entry.id,
                });
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#2B2926] text-[#D1C4B8] hover:text-[#E6E1DC]"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-[11px]">Ganti Foto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Hapus entri "${entry.title}" ke Sampah?`)) {
                  storage.softDeleteEntry(entry.id);
                  triggerHaptic('medium');
                  onClose();
                }
              }}
              className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-[#93000A]/20 text-[#FFB4AB]"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[11px]">Hapus</span>
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Pindahkan Ke Tier Dialog */}
      <ModalBottomSheet
        isOpen={isMoveDialogOpen}
        onClose={() => setIsMoveDialogOpen(false)}
        title="Pindahkan ke Tier"
      >
        <div className="space-y-2">
          {allTiers.map((t) => (
            <button
              key={t.id}
              onClick={() => handleMoveToTier(t.id)}
              className="w-full p-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] flex items-center justify-between transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded font-bold text-xs flex items-center justify-center text-black"
                  style={{ backgroundColor: t.colorHex }}
                >
                  {t.label.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-[#E6E1DC]">Tier {t.label}</span>
              </div>
              {entry.tierId === t.id && <span className="text-xs text-[#E0A458]">Saat ini</span>}
            </button>
          ))}

          <button
            onClick={() => handleMoveToTier(null)}
            className="w-full p-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] flex items-center justify-between transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#9A8F84]/40 text-xs flex items-center justify-center font-bold text-[#E6E1DC]">
                P
              </div>
              <span className="text-sm font-medium text-[#D1C4B8]">
                Belum diberi tier (Pool)
              </span>
            </div>
            {entry.tierId === null && <span className="text-xs text-[#E0A458]">Saat ini</span>}
          </button>
        </div>
      </ModalBottomSheet>

      {/* Full Screen Image Viewer Modal */}
      {isFullScreenViewer && entry.imagePath && (
        <div
          id="fullscreen-image-viewer"
          className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center animate-in fade-in duration-200"
          onClick={() => setIsFullScreenViewer(false)}
        >
          <button
            type="button"
            onClick={() => setIsFullScreenViewer(false)}
            className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 shadow-lg z-10"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={entry.imagePath}
            alt={entry.title}
            className="max-w-full max-h-full object-contain select-none"
          />
          <div className="absolute bottom-6 px-4 py-2 rounded-full bg-black/70 text-white text-xs backdrop-blur-xs">
            {entry.title} • Ketuk untuk menutup
          </div>
        </div>
      )}
    </>
  );
};
