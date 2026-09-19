import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Image as ImageIcon,
  Camera,
  Link2,
  ClipboardPaste,
  Trash2,
  Minus,
  Plus,
  ExternalLink,
  RotateCw,
  Crop,
} from 'lucide-react';
import { EntryEntity, TierEntity, TagEntity, Screen } from '../../types';
import { storage } from '../../services/storage';
import { compressImageToDataUrl, triggerHaptic } from '../../services/imageUtils';
import { ModalBottomSheet } from '../common/ModalBottomSheet';

interface EntryFormPageProps {
  folderId: string;
  entryId?: string;
  prefillTierId?: string | null;
  prefillImageUrl?: string;
  prefillTitle?: string;
  onBack: () => void;
  onSaved: (entry: EntryEntity) => void;
}

export const EntryFormPage: React.FC<EntryFormPageProps> = ({
  folderId,
  entryId,
  prefillTierId,
  prefillImageUrl,
  prefillTitle,
  onBack,
  onSaved,
}) => {
  const isEditing = Boolean(entryId);
  const existingEntry = entryId ? storage.getEntryById(entryId) : undefined;
  const tiers = storage.getTiers(folderId);
  const allTags = storage.getTags(folderId);

  // Form states
  const [title, setTitle] = useState(existingEntry?.title || prefillTitle || '');
  const [tierId, setTierId] = useState<string | null>(
    existingEntry ? existingEntry.tierId : prefillTierId !== undefined ? prefillTierId : null
  );
  const [imagePath, setImagePath] = useState<string | null>(
    existingEntry?.imagePath || prefillImageUrl || null
  );
  const [sourceUrl, setSourceUrl] = useState(existingEntry?.sourceUrl || '');
  const [note, setNote] = useState(existingEntry?.note || '');
  const [useScore, setUseScore] = useState(existingEntry?.score !== null && existingEntry?.score !== undefined);
  const [score, setScore] = useState<number>(existingEntry?.score ?? 80);

  // Tags
  const [tagNames, setTagNames] = useState<string[]>(() => {
    if (entryId) {
      return storage.getEntryTags(entryId).map((t) => t.name);
    }
    return [];
  });
  const [newTagInput, setNewTagInput] = useState('');

  // Modals & Webcam
  const [isSourceSheetOpen, setIsSourceSheetOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Errors & Saving
  const [titleError, setTitleError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartCamera = async () => {
    setIsSourceSheetOpen(false);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Tidak dapat mengakses kamera perangkat.');
      setIsCameraActive(false);
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setImagePath(dataUrl);
        triggerHaptic('light');
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageToDataUrl(file);
        setImagePath(compressed);
        if (!title.trim()) {
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          setTitle(baseName);
        }
        triggerHaptic('light');
      } catch (err) {
        alert('Gagal memproses gambar');
      }
    }
    setIsSourceSheetOpen(false);
  };

  const handleAddTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !tagNames.includes(trimmed)) {
      setTagNames([...tagNames, trimmed]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagName: string) => {
    setTagNames(tagNames.filter((t) => t !== tagName));
  };

  const handleSave = () => {
    if (!title.trim()) {
      setTitleError('Judul tidak boleh kosong');
      return;
    }
    setTitleError('');
    setIsSaving(true);

    const finalScore = useScore ? Math.max(0, Math.min(100, Math.round(score))) : null;

    if (isEditing && entryId) {
      storage.updateEntry(
        entryId,
        {
          title: title.trim(),
          tierId,
          imagePath,
          sourceUrl: sourceUrl.trim() || null,
          imageStatus: imagePath ? 'OK' : 'NONE',
          note: note.trim(),
          score: finalScore,
        },
        tagNames
      );
      const updated = storage.getEntryById(entryId)!;
      triggerHaptic('medium');
      onSaved(updated);
    } else {
      const created = storage.createEntry(
        folderId,
        {
          title: title.trim(),
          tierId,
          imagePath,
          sourceUrl: sourceUrl.trim() || null,
          imageStatus: imagePath ? 'OK' : 'NONE',
          note: note.trim(),
          score: finalScore,
          position: Date.now(),
        },
        tagNames
      );
      triggerHaptic('medium');
      onSaved(created);
    }
  };

  return (
    <div id="entry-form-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-20 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <X className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium text-[#E6E1DC]">
            {isEditing ? 'Ubah Entri' : 'Entri Baru'}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-1.5 rounded-full bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] font-medium text-sm transition-colors shadow-sm"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </header>

      {/* Form Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Big Image Preview Box (2:3 aspect ratio) */}
        <div className="flex flex-col items-center">
          <div
            id="box-entry-image-preview"
            onClick={() => !isCameraActive && setIsSourceSheetOpen(true)}
            className="relative w-48 h-72 sm:w-56 sm:h-84 rounded-xl overflow-hidden bg-[#211F1C] border border-[#363430] flex flex-col items-center justify-center cursor-pointer group shadow-md"
          >
            {isCameraActive ? (
              <div className="w-full h-full relative bg-black flex flex-col items-center justify-between p-2">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCapturePhoto();
                  }}
                  className="absolute bottom-4 px-4 py-2 bg-[#E0A458] text-[#4A2A00] font-bold text-xs rounded-full shadow-lg"
                >
                  Ambil Foto
                </button>
              </div>
            ) : imagePath ? (
              <>
                <img
                  src={imagePath}
                  alt={title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                  Ketuk untuk ganti
                </div>
                {/* Overlay Action Buttons */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImagePath(null);
                    }}
                    className="p-2 rounded-full bg-[#141311]/80 text-[#FFB4AB] hover:bg-[#141311] shadow"
                    title="Hapus gambar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-[#2B2926] flex items-center justify-center mb-2 text-[#E0A458]">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-xs text-[#D1C4B8] font-medium">
                  Ketuk untuk menambahkan gambar
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Field Judul */}
        <div>
          <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
            Judul Entri <span className="text-[#FFB4AB]">*</span>
          </label>
          <input
            id="input-entry-title"
            type="text"
            maxLength={120}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError('');
            }}
            placeholder="Contoh: The Legend of Zelda..."
            className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
          {titleError && (
            <span className="text-xs text-[#FFB4AB] mt-1 block">{titleError}</span>
          )}
        </div>

        {/* Dropdown Tier */}
        <div>
          <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
            Pilih Tier
          </label>
          <select
            id="select-entry-tier"
            value={tierId || ''}
            onChange={(e) => setTierId(e.target.value ? e.target.value : null)}
            className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          >
            <option value="">Belum diberi tier (Pool)</option>
            {tiers.map((t) => (
              <option key={t.id} value={t.id}>
                Tier {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Input */}
        <div>
          <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
            Tag
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tagNames.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2B2926] text-[#E6E1DC] border border-[#363430]"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#9A8F84] hover:text-[#FFB4AB]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Tambah tag baru..."
              className="flex-1 p-2.5 rounded-xl bg-[#211F1C] border border-[#363430] text-xs text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2.5 bg-[#2B2926] hover:bg-[#363430] text-[#E6E1DC] text-xs font-medium rounded-xl border border-[#363430]"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Blok Skor */}
        <div className="p-4 rounded-xl bg-[#1C1B18] border border-[#2B2926] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#E6E1DC]">Gunakan Skor</span>
            <input
              type="checkbox"
              checked={useScore}
              onChange={(e) => setUseScore(e.target.checked)}
              className="w-5 h-5 accent-[#E0A458] rounded"
            />
          </div>

          {useScore && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-center">
                <span className="text-3xl font-bold text-[#E0A458]">{Math.round(score)}</span>
                <span className="text-sm text-[#9A8F84] ml-1">/ 100</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setScore((s) => Math.max(0, s - 5))}
                  className="w-10 h-10 rounded-full bg-[#2B2926] flex items-center justify-center text-[#E6E1DC] hover:bg-[#363430]"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="flex-1 accent-[#E0A458] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setScore((s) => Math.min(100, s + 5))}
                  className="w-10 h-10 rounded-full bg-[#2B2926] flex items-center justify-center text-[#E6E1DC] hover:bg-[#363430]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Catatan Multi-Baris */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-[#D1C4B8]">
              Catatan / Ulasan
            </label>
            <span className="text-[11px] text-[#9A8F84]">
              {note.length} / 2000
            </span>
          </div>
          <textarea
            maxLength={2000}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis ulasan, alasan ranking, atau catatan penting..."
            className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
        </div>

        {/* Sumber URL */}
        <div>
          <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
            Sumber (URL)
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full p-3 rounded-xl bg-[#211F1C] border border-[#363430] text-xs text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
        </div>
      </main>

      {/* Bottom Sheet Sumber Gambar */}
      <ModalBottomSheet
        isOpen={isSourceSheetOpen}
        onClose={() => setIsSourceSheetOpen(false)}
        title="Pilih Sumber Gambar"
      >
        <div className="space-y-1">
          {/* File input hidden */}
          <input
            id="file-input-gallery"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => document.getElementById('file-input-gallery')?.click()}
            className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
          >
            <ImageIcon className="w-5 h-5 text-[#E0A458]" />
            <span>Pilih dari galeri</span>
          </button>

          <button
            type="button"
            onClick={handleStartCamera}
            className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
          >
            <Camera className="w-5 h-5 text-[#E0A458]" />
            <span>Ambil foto (Kamera)</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text.startsWith('http://') || text.startsWith('https://')) {
                  setImagePath(text);
                  setSourceUrl(text);
                  setIsSourceSheetOpen(false);
                  triggerHaptic('light');
                } else {
                  alert('Clipboard tidak berisi tautan gambar yang valid.');
                }
              } catch {
                alert('Gagal membaca clipboard.');
              }
            }}
            className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
          >
            <ClipboardPaste className="w-5 h-5 text-[#E0A458]" />
            <span>Tempel dari clipboard</span>
          </button>

          {imagePath && (
            <button
              type="button"
              onClick={() => {
                setImagePath(null);
                setIsSourceSheetOpen(false);
              }}
              className="w-full p-3 rounded-xl hover:bg-[#93000A]/20 flex items-center gap-3 text-sm text-[#FFB4AB] border-t border-[#2B2926] mt-2 pt-3"
            >
              <Trash2 className="w-5 h-5 text-[#FFB4AB]" />
              <span>Hapus gambar</span>
            </button>
          )}
        </div>
      </ModalBottomSheet>
    </div>
  );
};
