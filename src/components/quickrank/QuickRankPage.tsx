import React, { useState, useMemo } from 'react';
import {
  X,
  Undo2,
  SkipForward,
  CheckCircle,
  PartyPopper,
  RotateCcw,
  Swords,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { EntryEntity, TierEntity } from '../../types';
import { storage } from '../../services/storage';
import { getAutoTextColor, triggerHaptic } from '../../services/imageUtils';

interface QuickRankPageProps {
  folderId: string;
  initialMode?: 'rate' | 'duel';
  onBack: () => void;
}

export const QuickRankPage: React.FC<QuickRankPageProps> = ({
  folderId,
  initialMode = 'rate',
  onBack,
}) => {
  const tiers = storage.getTiers(folderId);
  const [mode, setMode] = useState<'rate' | 'duel'>(initialMode);

  // --- State for "Beri Tier" mode ---
  const [queue, setQueue] = useState<EntryEntity[]>(() => {
    // Start with Pool entries (unassigned) first, then others
    const entries = storage.getEntries(folderId);
    const pool = entries.filter((e) => e.tierId === null);
    return pool.length > 0 ? pool : entries;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [historyPlacements, setHistoryPlacements] = useState<
    Array<{ entryId: string; prevTierId: string | null }>
  >([]);

  // --- State for "Duel" mode ---
  const [selectedDuelTierId, setSelectedDuelTierId] = useState<string | null>(
    tiers[0]?.id || null
  );

  // Duel items inside selected tier
  const duelEntries = useMemo(() => {
    if (!selectedDuelTierId) return [];
    return storage
      .getEntries(folderId)
      .filter((e) => e.tierId === selectedDuelTierId);
  }, [folderId, selectedDuelTierId]);

  const [duelAIndex, setDuelAIndex] = useState(0);
  const [duelBIndex, setDuelBIndex] = useState(1);
  const [duelComparisonsCount, setDuelComparisonsCount] = useState(0);

  // Completed State
  const [isFinished, setIsFinished] = useState(false);

  const currentEntry = queue[currentIndex];
  const totalInQueue = queue.length;

  // Rate action: place entry into a tier
  const handleAssignTier = (tierId: string) => {
    if (!currentEntry) return;
    triggerHaptic('light');

    const prevTierId = currentEntry.tierId;
    storage.moveEntry(currentEntry.id, tierId);

    setHistoryPlacements((h) => [{ entryId: currentEntry.id, prevTierId }, ...h]);

    if (currentIndex + 1 >= totalInQueue) {
      setIsFinished(true);
    } else {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  const handleSkip = () => {
    triggerHaptic('light');
    if (currentIndex + 1 >= totalInQueue) {
      setIsFinished(true);
    } else {
      setCurrentIndex((idx) => idx + 1);
    }
  };

  const handleUndoPlacement = () => {
    if (historyPlacements.length === 0 || currentIndex === 0) return;
    triggerHaptic('light');
    const [last, ...rest] = historyPlacements;
    storage.moveEntry(last.entryId, last.prevTierId);
    setHistoryPlacements(rest);
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  };

  // Duel winner decision: card A or B wins
  const handlePickDuelWinner = (winner: 'A' | 'B') => {
    triggerHaptic('medium');
    setDuelComparisonsCount((c) => c + 1);

    if (duelEntries.length >= 2) {
      const entryA = duelEntries[duelAIndex];
      const entryB = duelEntries[duelBIndex];

      if (entryA && entryB) {
        if (winner === 'B' && entryB.position > entryA.position) {
          // Swap positions
          const temp = entryA.position;
          entryA.position = entryB.position;
          entryB.position = temp;
          storage.updateEntry(entryA.id, { position: entryA.position });
          storage.updateEntry(entryB.id, { position: entryB.position });
        }
      }
    }

    // Advance to next pair
    if (duelBIndex + 1 < duelEntries.length) {
      setDuelBIndex((b) => b + 1);
    } else if (duelAIndex + 2 < duelEntries.length) {
      setDuelAIndex((a) => a + 1);
      setDuelBIndex(duelAIndex + 2);
    } else {
      setIsFinished(true);
    }
  };

  const handleResetSession = () => {
    const entries = storage.getEntries(folderId);
    setQueue(entries);
    setCurrentIndex(0);
    setHistoryPlacements([]);
    setDuelAIndex(0);
    setDuelBIndex(1);
    setDuelComparisonsCount(0);
    setIsFinished(false);
  };

  // If session finished
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#141311] text-[#E6E1DC] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-20 h-20 rounded-full bg-[#6B3F00] text-[#FFDDB3] flex items-center justify-center mb-4 shadow-xl">
          <PartyPopper className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Sesi Selesai!</h2>
        <p className="text-sm text-[#D1C4B8] max-w-sm mb-6">
          {mode === 'rate'
            ? `${historyPlacements.length} entri berhasil diberi tier.`
            : `${duelComparisonsCount} perbandingan duel telah diselesaikan.`}
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSession}
            className="px-5 py-2.5 rounded-xl border border-[#363430] hover:bg-[#211F1C] text-sm font-medium text-[#E6E1DC] flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Ulangi Sesi
          </button>
          <button
            onClick={onBack}
            className="px-6 py-2.5 rounded-xl bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100] text-sm font-medium shadow-md"
          >
            Selesai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="quick-rank-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-16 flex flex-col justify-between">
      {/* Top App Bar */}
      <header className="h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-medium text-[#E6E1DC]">Ranking Cepat</h1>
            <span className="text-xs text-[#9A8F84]">
              {mode === 'rate'
                ? `${currentIndex + 1} dari ${totalInQueue}`
                : `Duel (${duelComparisonsCount} perbandingan)`}
            </span>
          </div>
        </div>
      </header>

      {/* Mode Segmented Button */}
      <div className="max-w-md w-full mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#211F1C] border border-[#363430]">
          <button
            type="button"
            onClick={() => setMode('rate')}
            className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'rate'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Beri Tier Satu per Satu
          </button>
          <button
            type="button"
            onClick={() => setMode('duel')}
            className={`py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mode === 'duel'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Duel (Bandingkan)
          </button>
        </div>
      </div>

      {/* Main Body */}
      {mode === 'rate' ? (
        /* MODE 1: Beri Tier Satu per Satu */
        currentEntry ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-sm w-full mx-auto p-4 space-y-5">
            {/* Big Card in Center */}
            <div className="w-64 h-92 sm:w-72 sm:h-100 rounded-2xl overflow-hidden bg-[#211F1C] border border-[#363430] shadow-xl flex flex-col relative group">
              {currentEntry.imagePath ? (
                <img
                  src={currentEntry.imagePath}
                  alt={currentEntry.title}
                  className="w-full flex-1 object-cover"
                />
              ) : (
                <div className="w-full flex-1 bg-[#363430] flex items-center justify-center text-4xl font-bold text-white/50">
                  {currentEntry.title.slice(0, 2)}
                </div>
              )}

              {/* Title & Notes */}
              <div className="p-3 bg-[#211F1C] border-t border-[#363430]">
                <h3 className="font-semibold text-sm text-[#E6E1DC] truncate">
                  {currentEntry.title}
                </h3>
                {currentEntry.note && (
                  <p className="text-xs text-[#9A8F84] line-clamp-2 italic mt-0.5">
                    {currentEntry.note}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Tier Buttons */}
            <div className="w-full space-y-3">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {tiers.map((tier) => {
                  const { textColor } = getAutoTextColor(tier.colorHex);
                  return (
                    <button
                      key={tier.id}
                      onClick={() => handleAssignTier(tier.id)}
                      className="h-12 rounded-xl font-bold text-sm shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                      style={{ backgroundColor: tier.colorHex, color: textColor }}
                    >
                      {tier.label}
                    </button>
                  );
                })}
              </div>

              {/* Secondary Controls (Kembali & Lewati) */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleUndoPlacement}
                  disabled={currentIndex === 0}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#D1C4B8] hover:text-[#E6E1DC] flex items-center gap-1.5 disabled:opacity-30"
                >
                  <Undo2 className="w-4 h-4" />
                  Kembali
                </button>

                <button
                  onClick={handleSkip}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#D1C4B8] hover:text-[#E6E1DC] flex items-center gap-1.5"
                >
                  <span>Lewati</span>
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-[#9A8F84]">
            Tidak ada entri untuk diranking.
          </div>
        )
      ) : (
        /* MODE 2: Duel / Bandingkan */
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl w-full mx-auto p-4 space-y-4">
          {/* Tier selector for Duel */}
          <div className="w-full flex items-center justify-between bg-[#211F1C] px-3 py-2 rounded-xl border border-[#363430]">
            <span className="text-xs text-[#D1C4B8]">Pilih Tier untuk Diurutkan:</span>
            <select
              value={selectedDuelTierId || ''}
              onChange={(e) => {
                setSelectedDuelTierId(e.target.value);
                setDuelAIndex(0);
                setDuelBIndex(1);
              }}
              className="bg-[#2B2926] text-xs font-medium text-[#E6E1DC] p-1.5 rounded-lg border border-[#363430] focus:outline-none"
            >
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  Tier {t.label} ({storage.getEntries(folderId).filter((e) => e.tierId === t.id).length} entri)
                </option>
              ))}
            </select>
          </div>

          {duelEntries.length < 2 ? (
            <div className="py-12 text-center text-sm text-[#9A8F84] italic">
              Duel membutuhkan minimal 2 entri dalam tier ini untuk dibandingkan.
            </div>
          ) : duelEntries[duelAIndex] && duelEntries[duelBIndex] ? (
            <div className="w-full space-y-4">
              <p className="text-center text-xs text-[#D1C4B8]">
                Pilih yang lebih Anda sukai:
              </p>

              <div className="grid grid-cols-2 gap-3 items-center relative">
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#6B3F00] text-[#FFDDB3] font-black text-xs flex items-center justify-center shadow-2xl z-20 border-2 border-[#141311]">
                  VS
                </div>

                {/* Card A */}
                <div
                  onClick={() => handlePickDuelWinner('A')}
                  className="rounded-2xl overflow-hidden bg-[#211F1C] border-2 border-[#363430] hover:border-[#E0A458] cursor-pointer transition-all shadow-md group active:scale-95"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden bg-black/30 relative">
                    {duelEntries[duelAIndex].imagePath ? (
                      <img
                        src={duelEntries[duelAIndex].imagePath}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-white/60">
                        {duelEntries[duelAIndex].title.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 text-center">
                    <h4 className="text-xs font-semibold text-[#E6E1DC] truncate">
                      {duelEntries[duelAIndex].title}
                    </h4>
                  </div>
                </div>

                {/* Card B */}
                <div
                  onClick={() => handlePickDuelWinner('B')}
                  className="rounded-2xl overflow-hidden bg-[#211F1C] border-2 border-[#363430] hover:border-[#E0A458] cursor-pointer transition-all shadow-md group active:scale-95"
                >
                  <div className="aspect-[2/3] w-full overflow-hidden bg-black/30 relative">
                    {duelEntries[duelBIndex].imagePath ? (
                      <img
                        src={duelEntries[duelBIndex].imagePath}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-white/60">
                        {duelEntries[duelBIndex].title.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 text-center">
                    <h4 className="text-xs font-semibold text-[#E6E1DC] truncate">
                      {duelEntries[duelBIndex].title}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Bottom Duel Actions */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => handlePickDuelWinner('A')}
                  className="px-5 py-2 bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] rounded-xl border border-[#363430]"
                >
                  Seri (Sama Bagusnya)
                </button>
                <button
                  onClick={() => {
                    if (duelBIndex + 1 < duelEntries.length) {
                      setDuelBIndex((b) => b + 1);
                    } else if (duelAIndex + 2 < duelEntries.length) {
                      setDuelAIndex((a) => a + 1);
                      setDuelBIndex(duelAIndex + 2);
                    } else {
                      setIsFinished(true);
                    }
                  }}
                  className="px-4 py-2 text-xs text-[#9A8F84] hover:text-[#E6E1DC]"
                >
                  Lewati Pasangan
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-[#9A8F84]">Semua duel selesai.</div>
          )}
        </div>
      )}
    </div>
  );
};
