import React, { useState, useEffect } from 'react';
import {
  X,
  Link2,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Trash2,
  WifiOff,
  Image as ImageIcon,
} from 'lucide-react';
import { TierEntity, Screen, EntryEntity } from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic } from '../../services/imageUtils';

interface AddFromLinkPageProps {
  folderId: string;
  targetTierId?: string | null;
  returnToForm?: boolean;
  onBack: () => void;
  onSuccess: () => void;
}

interface BatchUrlItem {
  id: string;
  url: string;
  title: string;
  status: 'WAITING' | 'DOWNLOADING' | 'READY' | 'FAILED' | 'DUPLICATE';
  previewUrl?: string;
  errorMessage?: string;
}

export const AddFromLinkPage: React.FC<AddFromLinkPageProps> = ({
  folderId,
  targetTierId = null,
  returnToForm = false,
  onBack,
  onSuccess,
}) => {
  const tiers = storage.getTiers(folderId);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(targetTierId);
  const [mode, setMode] = useState<'single' | 'multi'>('single');

  // Single link state
  const [singleUrl, setSingleUrl] = useState('');
  const [singleTitle, setSingleTitle] = useState('');
  const [singlePreviewLoading, setSinglePreviewLoading] = useState(false);
  const [singlePreviewError, setSinglePreviewError] = useState('');
  const [singlePreviewUrl, setSinglePreviewUrl] = useState<string | null>(null);

  // Multi link state
  const [multiUrlText, setMultiUrlText] = useState('');
  const [batchItems, setBatchItems] = useState<BatchUrlItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Clipboard suggestion chip
  const [clipboardSuggestion, setClipboardSuggestion] = useState<string | null>(null);

  // Online check
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Check clipboard on mount
  useEffect(() => {
    async function checkClip() {
      try {
        const text = await navigator.clipboard.readText();
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
          setClipboardSuggestion(text.trim());
        }
      } catch {
        // clipboard access might be denied
      }
    }
    checkClip();
  }, []);

  // Single link preview fetcher (debounced)
  useEffect(() => {
    if (!singleUrl.trim()) {
      setSinglePreviewUrl(null);
      setSinglePreviewError('');
      return;
    }

    if (!singleUrl.startsWith('http://') && !singleUrl.startsWith('https://')) {
      setSinglePreviewError('URL harus diawali dengan http:// atau https://');
      setSinglePreviewUrl(null);
      return;
    }

    setSinglePreviewLoading(true);
    setSinglePreviewError('');

    // Guess title from URL
    try {
      const urlObj = new URL(singleUrl);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || 'Gambar Link';
      const cleanName = decodeURIComponent(lastPart.replace(/\.[^/.]+$/, ''));
      if (!singleTitle) {
        setSingleTitle(cleanName);
      }
    } catch {
      // ignore
    }

    const testImg = new Image();
    testImg.onload = () => {
      setSinglePreviewUrl(singleUrl);
      setSinglePreviewLoading(false);
    };
    testImg.onerror = () => {
      // Might be blocked by CORS or not a direct image URL, but let user still proceed
      setSinglePreviewUrl(singleUrl);
      setSinglePreviewLoading(false);
    };
    testImg.src = singleUrl;
  }, [singleUrl]);

  // Handle Multi-link inspection
  const handleCheckBatch = () => {
    const rawLines = multiUrlText.split('\n').map((l) => l.trim()).filter(Boolean);
    const validUrls = Array.from(new Set(rawLines)).filter(
      (l) => l.startsWith('http://') || l.startsWith('https://')
    );

    if (validUrls.length === 0) {
      alert('Tidak ada URL valid yang ditemukan. Tempel satu URL per baris (http/https).');
      return;
    }

    const newItems: BatchUrlItem[] = validUrls.map((url, idx) => {
      let guessedTitle = `Entri ${idx + 1}`;
      try {
        const urlObj = new URL(url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          guessedTitle = decodeURIComponent(parts[parts.length - 1].replace(/\.[^/.]+$/, ''));
        }
      } catch {
        // ignore
      }

      return {
        id: `batch_${idx}_${Date.now()}`,
        url,
        title: guessedTitle,
        status: 'READY',
        previewUrl: url,
      };
    });

    setBatchItems(newItems);
    triggerHaptic('light');
  };

  const handleAddSingle = () => {
    if (!singleUrl.trim()) return;
    storage.createEntry(folderId, {
      title: singleTitle.trim() || 'Entri dari Link',
      imagePath: singleUrl.trim(),
      sourceUrl: singleUrl.trim(),
      imageStatus: 'OK',
      note: '',
      position: Date.now(),
      tierId: selectedTierId,
    });
    triggerHaptic('medium');
    onSuccess();
  };

  const handleAddBatch = () => {
    const readyItems = batchItems.filter((item) => item.status === 'READY');
    if (readyItems.length === 0) return;

    readyItems.forEach((item, idx) => {
      storage.createEntry(folderId, {
        title: item.title.trim() || `Entri ${idx + 1}`,
        imagePath: item.url,
        sourceUrl: item.url,
        imageStatus: 'OK',
        note: '',
        position: Date.now() + idx,
        tierId: selectedTierId,
      });
    });

    triggerHaptic('medium');
    onSuccess();
  };

  const readyCount = batchItems.filter((i) => i.status === 'READY').length;
  const failedCount = batchItems.filter((i) => i.status === 'FAILED').length;

  return (
    <div id="add-from-link-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium text-[#E6E1DC]">Tambah dari Link</h1>
        </div>

        <button
          onClick={mode === 'single' ? handleAddSingle : handleAddBatch}
          disabled={mode === 'single' ? !singleUrl.trim() : readyCount === 0}
          className={`px-5 py-1.5 rounded-full font-medium text-sm transition-colors shadow-sm ${
            (mode === 'single' && singleUrl.trim()) || (mode === 'multi' && readyCount > 0)
              ? 'bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100]'
              : 'bg-[#2B2926] text-[#9A8F84] cursor-not-allowed'
          }`}
        >
          Tambah
        </button>
      </header>

      {/* Offline Banner if disconnected */}
      {!isOnline && (
        <div className="bg-[#6B3F00] text-[#FFDDB3] px-4 py-2 flex items-center gap-2 text-xs">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Anda sedang offline. Sambungkan internet untuk memuat gambar dari tautan.</span>
        </div>
      )}

      {/* Segmented Button (Satu link | Banyak link) */}
      <div className="max-w-xl w-full mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#211F1C] border border-[#363430]">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              mode === 'single'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            Satu Link
          </button>
          <button
            type="button"
            onClick={() => setMode('multi')}
            className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              mode === 'multi'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            Banyak Link (Batch)
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-5">
        {mode === 'single' ? (
          /* Single Link Mode */
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <input
                  id="input-single-url"
                  type="url"
                  value={singleUrl}
                  onChange={(e) => setSingleUrl(e.target.value)}
                  placeholder="Tempel URL gambar (https://...)"
                  className="flex-1 p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
                />
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setSingleUrl(text.trim());
                    } catch {
                      // ignore
                    }
                  }}
                  className="px-4 py-3 bg-[#2B2926] hover:bg-[#363430] text-[#E0A458] rounded-xl text-sm font-medium border border-[#363430] flex items-center gap-1.5 shrink-0"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Tempel
                </button>
              </div>

              {/* Clipboard Suggestion Chip */}
              {clipboardSuggestion && !singleUrl && (
                <button
                  type="button"
                  onClick={() => setSingleUrl(clipboardSuggestion)}
                  className="mt-2 text-xs text-[#E0A458] bg-[#2B2926] hover:bg-[#363430] px-3 py-1.5 rounded-full border border-[#363430] flex items-center gap-1.5 max-w-full truncate"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Gunakan dari clipboard: {clipboardSuggestion}</span>
                </button>
              )}

              {singlePreviewError && (
                <span className="text-xs text-[#FFB4AB] mt-1 block">{singlePreviewError}</span>
              )}
            </div>

            {/* Preview Card */}
            <div className="w-full h-64 rounded-2xl bg-[#211F1C] border border-[#363430] overflow-hidden flex items-center justify-center relative">
              {singlePreviewLoading ? (
                <div className="text-xs text-[#9A8F84] flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin text-[#E0A458]" />
                  <span>Memuat pratinjau gambar...</span>
                </div>
              ) : singlePreviewUrl ? (
                <img
                  src={singlePreviewUrl}
                  alt="Pratinjau"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center text-[#9A8F84] text-xs">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span>Pratinjau gambar akan muncul di sini</span>
                </div>
              )}
            </div>

            {/* Title Field */}
            <div>
              <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
                Judul Entri
              </label>
              <input
                type="text"
                value={singleTitle}
                onChange={(e) => setSingleTitle(e.target.value)}
                placeholder="Judul entri..."
                className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              />
            </div>
          </div>
        ) : (
          /* Multi Link Mode */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
                Daftar URL (Satu URL per baris)
              </label>
              <textarea
                rows={5}
                value={multiUrlText}
                onChange={(e) => setMultiUrlText(e.target.value)}
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-xs font-mono text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              />
              <div className="flex justify-between items-center mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setMultiUrlText(text);
                    } catch {
                      // ignore
                    }
                  }}
                  className="text-xs text-[#E0A458] hover:underline flex items-center gap-1"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Tempel dari clipboard
                </button>

                <button
                  type="button"
                  onClick={handleCheckBatch}
                  className="px-4 py-1.5 bg-[#2B2926] hover:bg-[#363430] text-[#E6E1DC] rounded-xl text-xs font-medium border border-[#363430]"
                >
                  Periksa URL
                </button>
              </div>
            </div>

            {/* Batch items list */}
            {batchItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[#D1C4B8]">
                  <span>Hasil Pemeriksaan ({batchItems.length})</span>
                  <span>{readyCount} siap • {failedCount} gagal</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#211F1C] border border-[#363430] flex items-center gap-3"
                    >
                      <img
                        src={item.url}
                        alt=""
                        className="w-12 h-12 rounded object-cover bg-black/40 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchItems((prev) =>
                              prev.map((it, i) => (i === idx ? { ...it, title: val } : it))
                            );
                          }}
                          className="w-full bg-transparent text-xs font-medium text-[#E6E1DC] border-b border-transparent hover:border-[#363430] focus:border-[#E0A458] focus:outline-none truncate"
                        />
                        <p className="text-[11px] text-[#9A8F84] truncate mt-0.5">{item.url}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setBatchItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1.5 text-[#9A8F84] hover:text-[#FFB4AB]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Target Tier Selector (Applies to single or batch) */}
        <div className="pt-2 border-t border-[#211F1C]">
          <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
            Tier Tujuan
          </label>
          <select
            value={selectedTierId || ''}
            onChange={(e) => setSelectedTierId(e.target.value ? e.target.value : null)}
            className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          >
            <option value="">Belum diberi tier (Pool)</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                Tier {t.label}
              </option>
            ))}
          </select>
        </div>
      </main>
    </div>
  );
};
