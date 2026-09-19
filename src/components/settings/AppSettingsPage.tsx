import React, { useState } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Vibrate,
  ShieldAlert,
  Database,
  Download,
  Upload,
  RotateCcw,
  Info,
  Check,
  Smartphone,
  Layers,
} from 'lucide-react';
import { AppSettings, ThumbnailSize, TitleDisplayMode, RowLayoutMode } from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic } from '../../services/imageUtils';

interface AppSettingsPageProps {
  onBack: () => void;
}

export const AppSettingsPage: React.FC<AppSettingsPageProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [importStatus, setImportStatus] = useState<string>('');

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    storage.updateSettings({ [key]: value });
    setSettings(storage.getSettings());
    triggerHaptic('light');
  };

  const storageStats = storage.calculateStorageStats();

  const handleExportAll = () => {
    const backup = storage.exportFullBackup();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tierlist_maker_full_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerHaptic('medium');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importFullBackup(content, 'merge');
      if (success) {
        setImportStatus('Data berhasil diimpor!');
        triggerHaptic('medium');
        setTimeout(() => setImportStatus(''), 3000);
      } else {
        alert('File JSON tidak valid atau format rusak.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('PERINGATAN: Semua folder dan entri Anda akan dihapus dan diganti dengan data awal default. Lanjutkan?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div id="app-settings-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base sm:text-lg font-medium text-[#E6E1DC]">
            Pengaturan Aplikasi
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-6">
        {/* Group: Tampilan */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
            Tampilan & Ukuran Kartu Default
          </h2>

          <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-4">
            {/* Ukuran Thumbnail Default */}
            <div>
              <label className="text-xs text-[#D1C4B8] block mb-2">
                Ukuran Thumbnail Entri Default
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'small' as ThumbnailSize, label: 'Kecil (72dp)' },
                  { id: 'medium' as ThumbnailSize, label: 'Sedang (96dp)' },
                  { id: 'large' as ThumbnailSize, label: 'Besar (128dp)' },
                ].map((size) => (
                  <button
                    key={size.id}
                    onClick={() => updateSetting('defaultThumbnailSize', size.id)}
                    className={`py-2 px-1 text-xs rounded-xl border text-center transition-all ${
                      settings.defaultThumbnailSize === size.id
                        ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3] font-medium'
                        : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Tampilan Judul */}
            <div className="pt-2 border-t border-[#2B2926]">
              <label className="text-xs text-[#D1C4B8] block mb-2">
                Tampilan Judul pada Kartu
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'below' as TitleDisplayMode, label: 'Di Bawah Foto' },
                  { id: 'overlay' as TitleDisplayMode, label: 'Teks Melayang' },
                  { id: 'hidden' as TitleDisplayMode, label: 'Sembunyikan' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateSetting('defaultTitleDisplayMode', m.id)}
                    className={`py-2 px-1 text-xs rounded-xl border text-center transition-all ${
                      settings.defaultTitleDisplayMode === m.id
                        ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3] font-medium'
                        : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Mode Baris */}
            <div className="pt-2 border-t border-[#2B2926]">
              <label className="text-xs text-[#D1C4B8] block mb-2">
                Tata Letak Baris Tier
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'scroll' as RowLayoutMode, label: 'Gulir Horizontal' },
                  { id: 'wrap' as RowLayoutMode, label: 'Bungkus Baris (Wrap)' },
                ].map((lm) => (
                  <button
                    key={lm.id}
                    onClick={() => updateSetting('defaultRowLayoutMode', lm.id)}
                    className={`py-2 px-1 text-xs rounded-xl border text-center transition-all ${
                      settings.defaultRowLayoutMode === lm.id
                        ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3] font-medium'
                        : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                    }`}
                  >
                    {lm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Group: Perilaku & Interaksi */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
            Perilaku & Interaksi
          </h2>

          <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3.5 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Vibrate className="w-4 h-4 text-[#E0A458]" />
                <div>
                  <span className="text-[#E6E1DC] block font-medium">Umpan Balik Haptik (Getar)</span>
                  <span className="text-[#9A8F84] text-[11px]">Getar halus saat mengangkat kartu dan memindahkan tier</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => updateSetting('hapticFeedback', e.target.checked)}
                className="w-4 h-4 accent-[#E0A458]"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#2B2926]">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-[#E0A458]" />
                <div>
                  <span className="text-[#E6E1DC] block font-medium">Swipe di Ranking Cepat</span>
                  <span className="text-[#9A8F84] text-[11px]">Dukungan geser kartu untuk memutuskan tier secara cepat</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.swipeInQuickRank}
                onChange={(e) => updateSetting('swipeInQuickRank', e.target.checked)}
                className="w-4 h-4 accent-[#E0A458]"
              />
            </label>
          </div>
        </section>

        {/* Group: Penyimpanan & Backup */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
            Data & Penyimpanan Offline
          </h2>

          <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#D1C4B8]">
                <Database className="w-4 h-4 text-[#E0A458]" />
                <span>Penggunaan Memori Lokal:</span>
              </div>
              <span className="font-bold text-[#E6E1DC]">
                {storageStats.dataMB} MB Data • {storageStats.imagesMB} MB Gambar
              </span>
            </div>

            {importStatus && (
              <div className="p-2.5 rounded-lg bg-[#1D3220] border border-[#2E5E35] text-xs text-[#A6E6AB] flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{importStatus}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportAll}
                className="py-2.5 px-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#E0A458]" />
                <span>Ekspor Backup JSON</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#E0A458]" />
                <span>Pulihkan dari File</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            <div className="pt-2 border-t border-[#2B2926]">
              <button
                type="button"
                onClick={handleResetData}
                className="w-full py-2.5 text-xs text-[#FFB4AB] hover:bg-[#93000A]/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Demo Awal</span>
              </button>
            </div>
          </div>
        </section>

        {/* Group: Info & About */}
        <section className="p-4 rounded-xl bg-[#1C1B18] border border-[#2B2926] flex items-center gap-3 text-xs text-[#9A8F84]">
          <Info className="w-5 h-5 text-[#E0A458] shrink-0" />
          <div>
            <span className="font-semibold text-[#E6E1DC] block">
              Tier List Maker v1.0.0
            </span>
            <span>
              Aplikasi pembuat tier list offline-first dengan dukungan drag & drop horizontal untuk mengurutkan ke kanan atau ke kiri dalam tier, drag & drop urutan tier, impor dari tautan, dan ekspor kanvas resolusi tinggi.
            </span>
          </div>
        </section>
      </main>
    </div>
  );
};
