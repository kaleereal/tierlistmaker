import React, { useState } from 'react';
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertTriangle,
  BookmarkPlus,
} from 'lucide-react';
import { TierEntity, TierTemplateEntity } from '../../types';
import { storage } from '../../services/storage';
import {
  PRESET_TIERS_SF,
  PRESET_TIERS_AF,
  PRESET_TIERS_1_TO_5,
  PRESET_TIERS_OPINION,
  SWATCH_COLORS,
  getAutoTextColor,
  triggerHaptic,
} from '../../services/imageUtils';
import { ModalBottomSheet } from '../common/ModalBottomSheet';

interface TierSettingsPageProps {
  folderId: string;
  onBack: () => void;
}

interface DraftTier {
  id: string;
  label: string;
  colorHex: string;
  sortOrder: number;
  isNew?: boolean;
}

export const TierSettingsPage: React.FC<TierSettingsPageProps> = ({ folderId, onBack }) => {
  const [draftTiers, setDraftTiers] = useState<DraftTier[]>(() => {
    return storage.getTiers(folderId).map((t) => ({ ...t }));
  });

  const templates = storage.getTemplates();

  // Edit / Add Tier Dialog
  const [editingTier, setEditingTier] = useState<DraftTier | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('#F44336');

  // Preset Dialog
  const [selectedPreset, setSelectedPreset] = useState<{
    name: string;
    tiers: Array<{ label: string; colorHex: string }>;
  } | null>(null);
  const [presetKeepEntries, setPresetKeepEntries] = useState(true);

  // Save Template Dialog
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Drag reorder state
  const [draggedTierIdx, setDraggedTierIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleOpenEdit = (tier: DraftTier) => {
    setEditingTier(tier);
    setEditLabel(tier.label);
    setEditColor(tier.colorHex);
  };

  const handleOpenAdd = () => {
    const nextColor = SWATCH_COLORS[draftTiers.length % SWATCH_COLORS.length];
    const newTier: DraftTier = {
      id: `draft_${Date.now()}`,
      label: `Tier ${draftTiers.length + 1}`,
      colorHex: nextColor,
      sortOrder: draftTiers.length,
      isNew: true,
    };
    setEditingTier(newTier);
    setEditLabel('');
    setEditColor(nextColor);
  };

  const handleSaveEditDialog = () => {
    if (!editLabel.trim() || !editingTier) return;

    if (editingTier.isNew) {
      setDraftTiers([
        ...draftTiers,
        {
          ...editingTier,
          label: editLabel.trim().slice(0, 12),
          colorHex: editColor,
          sortOrder: draftTiers.length,
        },
      ]);
    } else {
      setDraftTiers(
        draftTiers.map((t) =>
          t.id === editingTier.id
            ? { ...t, label: editLabel.trim().slice(0, 12), colorHex: editColor }
            : t
        )
      );
    }
    setEditingTier(null);
    triggerHaptic('light');
  };

  const handleDeleteTier = (id: string) => {
    if (draftTiers.length <= 1) {
      alert('Minimal harus ada 1 tier!');
      return;
    }
    setDraftTiers(draftTiers.filter((t) => t.id !== id));
    triggerHaptic('light');
  };

  // Reorder draft tiers
  const handleDragStart = (idx: number) => {
    setDraggedTierIdx(idx);
    triggerHaptic('light');
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };

  const handleDrop = (idx: number) => {
    if (draggedTierIdx === null || draggedTierIdx === idx) {
      setDraggedTierIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reordered = [...draftTiers];
    const [moved] = reordered.splice(draggedTierIdx, 1);
    reordered.splice(idx, 0, moved);

    setDraftTiers(reordered.map((t, i) => ({ ...t, sortOrder: i })));
    setDraggedTierIdx(null);
    setDragOverIdx(null);
    triggerHaptic('medium');
  };

  // Commit all changes
  const handleSaveAll = () => {
    storage.applyTierPreset(
      folderId,
      draftTiers.map((t) => ({ label: t.label, colorHex: t.colorHex })),
      true
    );
    triggerHaptic('medium');
    onBack();
  };

  // Apply Preset
  const handleConfirmApplyPreset = () => {
    if (!selectedPreset) return;
    setDraftTiers(
      selectedPreset.tiers.map((t, idx) => ({
        id: `preset_tier_${idx}_${Date.now()}`,
        label: t.label,
        colorHex: t.colorHex,
        sortOrder: idx,
      }))
    );
    setSelectedPreset(null);
    triggerHaptic('medium');
  };

  const { textColor: previewTextColor, hasWarning: previewWarning } = getAutoTextColor(editColor);

  return (
    <div id="tier-settings-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-medium text-[#E6E1DC]">Pengaturan Tier</h1>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-1.5 rounded-full bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] font-medium text-sm transition-colors shadow-sm"
        >
          Simpan
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-6">
        {/* Tier Reorder List */}
        <section className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
              Urutan & Label Tier ({draftTiers.length})
            </span>
            <span className="text-[11px] text-[#9A8F84]">Seret ikon ⠿ untuk mengatur urutan</span>
          </div>

          <div className="space-y-1.5">
            {draftTiers.map((tier, idx) => {
              const { textColor } = getAutoTextColor(tier.colorHex);
              const isDragging = draggedTierIdx === idx;
              const isOver = dragOverIdx === idx;

              return (
                <div
                  key={tier.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => {
                    setDraggedTierIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`h-16 px-3 rounded-xl bg-[#211F1C] border flex items-center gap-3 select-none transition-all ${
                    isOver ? 'border-[#E0A458] bg-[#2B2926] shadow-md' : 'border-[#2B2926]'
                  } ${isDragging ? 'opacity-40 scale-98' : ''}`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing p-1 text-[#9A8F84] hover:text-[#E6E1DC]">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Tier Color Box */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                    style={{ backgroundColor: tier.colorHex, color: textColor }}
                  >
                    {tier.label.slice(0, 3)}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[#E6E1DC] truncate block">
                      {tier.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tier)}
                      className="p-2 rounded-full text-[#D1C4B8] hover:text-[#E6E1DC] hover:bg-[#2B2926]"
                      title="Ubah tier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTier(tier.id)}
                      disabled={draftTiers.length <= 1}
                      className={`p-2 rounded-full ${
                        draftTiers.length <= 1
                          ? 'text-[#9A8F84]/30 cursor-not-allowed'
                          : 'text-[#D1C4B8] hover:text-[#FFB4AB] hover:bg-[#93000A]/20'
                      }`}
                      title="Hapus tier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Tier Button */}
          {draftTiers.length < 20 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="w-full h-12 mt-2 rounded-xl border border-dashed border-[#363430] hover:border-[#E0A458] text-[#D1C4B8] hover:text-[#E0A458] flex items-center justify-center gap-2 text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Tier
            </button>
          )}
        </section>

        {/* Preset & Template Section */}
        <section className="space-y-3 pt-4 border-t border-[#211F1C]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
              Preset & Template
            </h2>
            <button
              type="button"
              onClick={() => setIsSaveTemplateOpen(true)}
              className="text-xs text-[#E0A458] hover:underline flex items-center gap-1"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Simpan sebagai template
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { name: 'S - F Standar', tiers: PRESET_TIERS_SF },
              { name: 'A - F Tradisional', tiers: PRESET_TIERS_AF },
              { name: '⭐⭐⭐⭐⭐ (1 - 5)', tiers: PRESET_TIERS_1_TO_5 },
              { name: 'Suka / Netral / Kurang', tiers: PRESET_TIERS_OPINION },
            ].map((preset) => (
              <div
                key={preset.name}
                onClick={() => setSelectedPreset(preset)}
                className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] hover:bg-[#2B2926] cursor-pointer transition-colors space-y-2"
              >
                {/* Color Strip */}
                <div className="h-6 rounded-md overflow-hidden flex">
                  {preset.tiers.map((pt, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full"
                      style={{ backgroundColor: pt.colorHex }}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-[#E6E1DC] block truncate">
                  {preset.name}
                </span>
              </div>
            ))}
          </div>

          {/* Custom Templates List */}
          {templates.filter((t) => !t.isBuiltIn).length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] text-[#9A8F84] block mb-2">Template Kustom Anda</span>
              <div className="grid grid-cols-2 gap-2.5">
                {templates
                  .filter((t) => !t.isBuiltIn)
                  .map((t) => {
                    const parsedTiers = JSON.parse(t.tiersJson);
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedPreset({ name: t.name, tiers: parsedTiers })}
                        className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] hover:bg-[#2B2926] cursor-pointer transition-colors space-y-2"
                      >
                        <div className="h-6 rounded-md overflow-hidden flex">
                          {parsedTiers.map((pt: any, i: number) => (
                            <div
                              key={i}
                              className="flex-1 h-full"
                              style={{ backgroundColor: pt.colorHex }}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-[#E6E1DC] block truncate">
                          {t.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Edit Tier Dialog */}
      <ModalBottomSheet
        isOpen={Boolean(editingTier)}
        onClose={() => setEditingTier(null)}
        title={editingTier?.isNew ? 'Tambah Tier Baru' : 'Ubah Tier'}
      >
        <div className="space-y-4">
          {/* Label Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#D1C4B8]">Label Tier</label>
              <span className="text-[11px] text-[#9A8F84]">{editLabel.length} / 12</span>
            </div>
            <input
              type="text"
              maxLength={12}
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="S, A, Masterpiece..."
              className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
            />
          </div>

          {/* Color Preview Box */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#1C1B18] border border-[#2B2926]">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm shrink-0"
              style={{ backgroundColor: editColor, color: previewTextColor }}
            >
              {editLabel || '?'}
            </div>
            <div>
              <span className="text-xs font-medium text-[#E6E1DC] block">Pratinjau Kotak Tier</span>
              <span className="text-[11px] text-[#9A8F84]">
                Warna teks otomatis disesuaikan dengan kontras
              </span>
              {previewWarning && (
                <div className="flex items-center gap-1 text-[11px] text-[#FFB4AB] mt-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Warna ini membuat teks agak sulit dibaca</span>
                </div>
              )}
            </div>
          </div>

          {/* 16-Swatch Color Palette Grid */}
          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-2">Pilih Warna</label>
            <div className="grid grid-cols-6 gap-2">
              {SWATCH_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setEditColor(color)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                    editColor.toLowerCase() === color.toLowerCase()
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {editColor.toLowerCase() === color.toLowerCase() && (
                    <Check className="w-4 h-4 text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Hex Input */}
          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-1">Kode Hex Kustom</label>
            <input
              type="text"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              placeholder="#F44336"
              className="w-full p-2.5 rounded-xl bg-[#2B2926] border border-[#363430] text-xs font-mono text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2B2926]">
            <button
              type="button"
              onClick={() => setEditingTier(null)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveEditDialog}
              disabled={!editLabel.trim()}
              className="px-5 py-2 rounded-xl bg-[#6B3F00] text-[#FFDDB3] font-medium text-sm disabled:opacity-40"
            >
              Selesai
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Terapkan Preset Dialog */}
      <ModalBottomSheet
        isOpen={Boolean(selectedPreset)}
        onClose={() => setSelectedPreset(null)}
        title={`Terapkan Preset "${selectedPreset?.name}"?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#D1C4B8]">
            Pilih cara menangani entri yang sudah ada di dalam folder ini:
          </p>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#2B2926] cursor-pointer">
              <input
                type="radio"
                name="preset_mode"
                checked={presetKeepEntries}
                onChange={() => setPresetKeepEntries(true)}
                className="mt-0.5 accent-[#E0A458]"
              />
              <div className="text-xs">
                <span className="font-medium text-[#E6E1DC] block">
                  Pertahankan entri berdasarkan urutan tier
                </span>
                <span className="text-[#9A8F84]">
                  Entri di Tier 1 lama pindah ke Tier 1 baru, dan seterusnya.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#2B2926] cursor-pointer">
              <input
                type="radio"
                name="preset_mode"
                checked={!presetKeepEntries}
                onChange={() => setPresetKeepEntries(false)}
                className="mt-0.5 accent-[#E0A458]"
              />
              <div className="text-xs">
                <span className="font-medium text-[#E6E1DC] block">
                  Ganti semua tier (Pindahkan semua entri ke Pool)
                </span>
                <span className="text-[#9A8F84]">
                  Semua entri akan kembali ke area &quot;Belum diberi tier&quot;.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2B2926]">
            <button
              onClick={() => setSelectedPreset(null)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              onClick={handleConfirmApplyPreset}
              className="px-5 py-2 bg-[#6B3F00] text-[#FFDDB3] font-medium rounded-xl text-sm"
            >
              Terapkan
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Simpan Sebagai Template Dialog */}
      <ModalBottomSheet
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        title="Simpan Sebagai Template"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Nama template saya..."
            className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsSaveTemplateOpen(false)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (templateName.trim()) {
                  storage.createTemplate(
                    templateName.trim(),
                    draftTiers.map((t) => ({ label: t.label, colorHex: t.colorHex }))
                  );
                  setIsSaveTemplateOpen(false);
                  setTemplateName('');
                  triggerHaptic('medium');
                }
              }}
              className="px-5 py-2 bg-[#6B3F00] text-[#FFDDB3] font-medium rounded-xl text-sm"
            >
              Simpan Template
            </button>
          </div>
        </div>
      </ModalBottomSheet>
    </div>
  );
};
