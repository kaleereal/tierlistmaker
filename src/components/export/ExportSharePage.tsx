import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  FileJson,
  FileText,
  Copy,
  Check,
  Sparkles,
  Eye,
  Settings2,
} from 'lucide-react';
import { storage } from '../../services/storage';
import { getAutoTextColor, triggerHaptic } from '../../services/imageUtils';

interface ExportSharePageProps {
  folderId: string;
  onBack: () => void;
}

export const ExportSharePage: React.FC<ExportSharePageProps> = ({ folderId, onBack }) => {
  const folder = storage.getFolderById(folderId);
  const tiers = storage.getTiers(folderId);
  const entries = storage.getEntries(folderId);

  // Settings
  const [resolutionScale, setResolutionScale] = useState<number>(2); // 1x, 2x, 4x
  const [fileFormat, setFileFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/png');
  const [aspectRatio, setAspectRatio] = useState<'auto' | '16:9' | '9:16' | '1:1'>('auto');
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');

  // Display toggles
  const [showTitle, setShowTitle] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [showPool, setShowPool] = useState(false);
  const [hideEmptyTiers, setHideEmptyTiers] = useState(true);
  const [showItemLabels, setShowItemLabels] = useState(false);

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Visible tiers
  const visibleTiers = tiers.filter((t) => {
    if (!hideEmptyTiers) return true;
    return entries.some((e) => e.tierId === t.id);
  });

  const poolEntries = entries.filter((e) => e.tierId === null);

  // Render preview on canvas
  const renderToCanvas = async (scale: number): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const baseWidth = 1080;
    const cardWidth = 110;
    const cardHeight = 150;
    const tierLabelWidth = 140;
    const padding = 24;
    const headerHeight = showTitle ? 70 : 16;
    const watermarkHeight = showWatermark ? 40 : 16;

    // Calculate height needed
    let calculatedHeight = headerHeight + watermarkHeight;

    const activeTierRows = [...visibleTiers];
    if (showPool && poolEntries.length > 0) {
      activeTierRows.push({
        id: 'pool_tier',
        folderId,
        label: 'Pool',
        colorHex: '#363430',
        sortOrder: 999,
      });
    }

    // Estimate row heights
    const rowMetrics = activeTierRows.map((tier) => {
      const tierItems =
        tier.id === 'pool_tier'
          ? poolEntries
          : entries.filter((e) => e.tierId === tier.id);

      const itemsPerRow = Math.max(1, Math.floor((baseWidth - padding * 2 - tierLabelWidth - 12) / (cardWidth + 8)));
      const rowCount = Math.max(1, Math.ceil(tierItems.length / itemsPerRow));
      const rowHeight = rowCount * (cardHeight + (showItemLabels ? 24 : 0) + 8) + 12;

      return { tier, items: tierItems, rowHeight, itemsPerRow };
    });

    const rowsTotalHeight = rowMetrics.reduce((sum, r) => sum + r.rowHeight + 6, 0);
    calculatedHeight += rowsTotalHeight;

    // Adjust for aspect ratio if specified
    let finalWidth = baseWidth;
    let finalHeight = Math.max(calculatedHeight, 600);

    if (aspectRatio === '16:9') {
      finalHeight = Math.round((finalWidth * 9) / 16);
    } else if (aspectRatio === '9:16') {
      finalWidth = Math.round((finalHeight * 9) / 16);
    } else if (aspectRatio === '1:1') {
      const maxDim = Math.max(finalWidth, finalHeight);
      finalWidth = maxDim;
      finalHeight = maxDim;
    }

    canvas.width = finalWidth * scale;
    canvas.height = finalHeight * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#141311';
    ctx.fillRect(0, 0, finalWidth, finalHeight);

    let currentY = padding;

    // Header
    if (showTitle) {
      ctx.fillStyle = '#E6E1DC';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(folder?.name || 'Tier List', padding, currentY + 28);

      ctx.fillStyle = '#9A8F84';
      ctx.font = '14px sans-serif';
      const meta = `${entries.length} entri • ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}`;
      ctx.fillText(meta, padding, currentY + 52);

      currentY += headerHeight;
    }

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = src;
      });
    };

    // Render Tiers
    for (const { tier, items, rowHeight, itemsPerRow } of rowMetrics) {
      // Row container background
      ctx.fillStyle = '#1C1B18';
      ctx.fillRect(padding, currentY, finalWidth - padding * 2, rowHeight);

      // Label Box
      const { textColor } = getAutoTextColor(tier.colorHex);
      ctx.fillStyle = tier.colorHex;
      ctx.fillRect(padding, currentY, tierLabelWidth, rowHeight);

      // Label text
      ctx.fillStyle = textColor;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tier.label, padding + tierLabelWidth / 2, currentY + rowHeight / 2);

      // Reset text align
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      // Items inside tier
      const itemStartX = padding + tierLabelWidth + 12;
      const itemStartY = currentY + 8;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const col = i % itemsPerRow;
        const row = Math.floor(i / itemsPerRow);

        const x = itemStartX + col * (cardWidth + 8);
        const y = itemStartY + row * (cardHeight + (showItemLabels ? 24 : 0) + 8);

        // Draw card background
        ctx.fillStyle = '#2B2926';
        ctx.fillRect(x, y, cardWidth, cardHeight);

        // Draw image if available
        if (item.imagePath) {
          try {
            const img = await loadImage(item.imagePath);
            const nw = img.naturalWidth || img.width || cardWidth;
            const nh = img.naturalHeight || img.height || cardHeight;
            const imgRatio = nw / nh;
            const cardRatio = cardWidth / cardHeight;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, cardWidth, cardHeight);
            ctx.clip();

            if (imageFit === 'contain') {
              // Letterbox mode: background remains #1A1917, image scaled to fit entirely
              ctx.fillStyle = '#181715';
              ctx.fillRect(x, y, cardWidth, cardHeight);

              let dWidth = cardWidth;
              let dHeight = cardHeight;
              let dx = x;
              let dy = y;

              if (imgRatio > cardRatio) {
                dHeight = cardWidth / imgRatio;
                dy = y + (cardHeight - dHeight) / 2;
              } else {
                dWidth = cardHeight * imgRatio;
                dx = x + (cardWidth - dWidth) / 2;
              }
              ctx.drawImage(img, dx, dy, dWidth, dHeight);
            } else {
              // Cover mode: fill card completely without distortion by cropping sides symmetrically
              let sWidth = nw;
              let sHeight = nh;
              let sx = 0;
              let sy = 0;

              if (imgRatio > cardRatio) {
                sWidth = nh * cardRatio;
                sx = (nw - sWidth) / 2;
              } else {
                sHeight = nw / cardRatio;
                sy = (nh - sHeight) / 2;
              }
              ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, cardWidth, cardHeight);
            }
            ctx.restore();
          } catch {
            // fallback title text
            ctx.fillStyle = '#E6E1DC';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(item.title.slice(0, 2), x + 16, y + 36);
          }
        } else {
          ctx.fillStyle = '#E6E1DC';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(item.title.slice(0, 2), x + 16, y + 36);
        }

        // Draw label if enabled
        if (showItemLabels) {
          ctx.fillStyle = '#E6E1DC';
          ctx.font = '11px sans-serif';
          const truncated =
            item.title.length > 14 ? item.title.slice(0, 13) + '…' : item.title;
          ctx.fillText(truncated, x, y + cardHeight + 16);
        }
      }

      currentY += rowHeight + 6;
    }

    // Watermark
    if (showWatermark) {
      ctx.fillStyle = '#9A8F84';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        'Dibuat dengan Tier List Maker',
        finalWidth - padding,
        finalHeight - padding / 2
      );
      ctx.textAlign = 'start';
    }

    return canvas;
  };

  // Update canvas live preview
  useEffect(() => {
    let active = true;
    renderToCanvas(1).then((canvas) => {
      if (!active || !previewCanvasRef.current) return;
      const target = previewCanvasRef.current;
      target.width = canvas.width;
      target.height = canvas.height;
      const ctx = target.getContext('2d');
      if (ctx) {
        ctx.drawImage(canvas, 0, 0);
      }
    });
    return () => {
      active = false;
    };
  }, [
    folder,
    tiers,
    entries,
    showTitle,
    showWatermark,
    showPool,
    hideEmptyTiers,
    showItemLabels,
    aspectRatio,
    imageFit,
  ]);

  // Download image action
  const handleDownloadImage = async () => {
    setIsExporting(true);
    triggerHaptic('medium');
    try {
      const canvas = await renderToCanvas(resolutionScale);
      const ext = fileFormat === 'image/png' ? 'png' : fileFormat === 'image/jpeg' ? 'jpg' : 'webp';
      const dataUrl = canvas.toDataURL(fileFormat, 0.92);

      const link = document.createElement('a');
      link.download = `${folder?.name || 'tier_list'}_${resolutionScale}x.${ext}`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert('Gagal mengekspor gambar.');
    } finally {
      setIsExporting(false);
    }
  };

  // Web Share action
  const handleShare = async () => {
    triggerHaptic('light');
    try {
      const canvas = await renderToCanvas(2);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${folder?.name || 'tier_list'}.png`, {
          type: 'image/png',
        });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: folder?.name || 'Tier List Saya',
            text: `Lihat ranking "${folder?.name}" yang saya buat!`,
            files: [file],
          });
        } else {
          // fallback download
          handleDownloadImage();
        }
      }, 'image/png');
    } catch {
      handleDownloadImage();
    }
  };

  // Export JSON backup
  const handleExportJson = () => {
    triggerHaptic('light');
    const backupData = storage.exportBackup();
    const blob = new Blob([backupData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tier_list_backup_${folder?.name || 'data'}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Markdown Table
  const handleCopyMarkdown = () => {
    triggerHaptic('light');
    let md = `# Tier List: ${folder?.name || 'Tanpa Judul'}\n\n`;
    md += `| Tier | Entri |\n`;
    md += `|---|---|\n`;

    visibleTiers.forEach((tier) => {
      const items = entries.filter((e) => e.tierId === tier.id);
      const names = items.map((i) => i.title).join(', ') || '-';
      md += `| **${tier.label}** | ${names} |\n`;
    });

    if (showPool && poolEntries.length > 0) {
      const names = poolEntries.map((i) => i.title).join(', ');
      md += `| *Pool* | ${names} |\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  return (
    <div id="export-share-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#D1C4B8] hover:bg-[#211F1C]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-medium text-[#E6E1DC]">Ekspor & Bagikan</h1>
            <span className="text-xs text-[#9A8F84] truncate block max-w-[200px]">
              {folder?.name}
            </span>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="px-4 py-1.5 rounded-full bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          <span>Bagikan</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Canvas Live Preview */}
        <div className="lg:col-span-7 flex flex-col items-center space-y-3">
          <div className="w-full rounded-2xl bg-[#211F1C] border border-[#2B2926] p-3 overflow-hidden shadow-xl flex items-center justify-center">
            <canvas
              ref={previewCanvasRef}
              className="max-w-full max-h-[500px] w-auto h-auto object-contain rounded-xl shadow"
            />
          </div>
          <span className="text-xs text-[#9A8F84]">
            Pratinjau langsung diperbarui saat Anda mengubah pengaturan
          </span>
        </div>

        {/* Right: Export Controls & Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Download Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="w-full py-3 rounded-xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
          >
            <Download className="w-5 h-5" />
            <span>{isExporting ? 'Mengekspor...' : `Unduh Gambar (${resolutionScale}x)`}</span>
          </button>

          {/* Setting Group: Resolusi */}
          <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
              Resolusi & Skala
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { scale: 1, label: '1x (Standar)' },
                { scale: 2, label: '2x (HD)' },
                { scale: 4, label: '4x (Ultra HD)' },
              ].map((r) => (
                <button
                  key={r.scale}
                  onClick={() => setResolutionScale(r.scale)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-all ${
                    resolutionScale === r.scale
                      ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3]'
                      : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Format File */}
            <div className="pt-2">
              <label className="text-xs text-[#9A8F84] block mb-1.5">Format Gambar</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { fmt: 'image/png' as const, label: 'PNG (Lossless)' },
                  { fmt: 'image/jpeg' as const, label: 'JPEG (Kecil)' },
                  { fmt: 'image/webp' as const, label: 'WebP (Modern)' },
                ].map((f) => (
                  <button
                    key={f.fmt}
                    onClick={() => setFileFormat(f.fmt)}
                    className={`py-1.5 text-xs rounded-lg border text-center ${
                      fileFormat === f.fmt
                        ? 'bg-[#2B2926] border-[#E0A458] text-[#E0A458] font-bold'
                        : 'border-[#363430] text-[#9A8F84]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pengepasan Rasio Aspek Gambar */}
            <div className="pt-2 border-t border-[#2B2926]">
              <label className="text-xs text-[#9A8F84] block mb-1.5">Proporsi Gambar (Aspect Ratio)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { fit: 'cover' as const, label: 'Cover (Penuh Proporsional)', desc: 'Tanpa distorsi/tarikan' },
                  { fit: 'contain' as const, label: 'Contain (Tampil Utuh)', desc: 'Dengan letterbox rapi' },
                ].map((item) => (
                  <button
                    key={item.fit}
                    type="button"
                    onClick={() => setImageFit(item.fit)}
                    className={`py-2 px-2 text-xs rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      imageFit === item.fit
                        ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3] font-medium'
                        : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                    }`}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Setting Group: Opsi Tampilan */}
          <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
              Opsi Tata Letak & Elemen
            </h3>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#E6E1DC]">Tampilkan Judul Folder</span>
                <input
                  type="checkbox"
                  checked={showTitle}
                  onChange={(e) => setShowTitle(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A458]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#E6E1DC]">Sembunyikan Tier Kosong</span>
                <input
                  type="checkbox"
                  checked={hideEmptyTiers}
                  onChange={(e) => setHideEmptyTiers(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A458]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#E6E1DC]">Sertakan Entri Pool</span>
                <input
                  type="checkbox"
                  checked={showPool}
                  onChange={(e) => setShowPool(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A458]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#E6E1DC]">Tampilkan Label Nama di Gambar</span>
                <input
                  type="checkbox"
                  checked={showItemLabels}
                  onChange={(e) => setShowItemLabels(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A458]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#E6E1DC]">Tampilkan Watermark</span>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="w-4 h-4 accent-[#E0A458]"
                />
              </label>
            </div>
          </div>

          {/* Secondary Actions: Export Data (JSON) & Copy Markdown */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleCopyMarkdown}
              className="w-full py-2.5 px-4 rounded-xl bg-[#211F1C] hover:bg-[#2B2926] border border-[#2B2926] text-xs font-medium text-[#E6E1DC] flex items-center justify-center gap-2"
            >
              {copiedMarkdown ? (
                <>
                  <Check className="w-4 h-4 text-[#4CAF50]" />
                  <span>Tabel Markdown Disalin!</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[#E0A458]" />
                  <span>Salin sebagai Tabel Teks (Markdown)</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportJson}
              className="w-full py-2.5 px-4 rounded-xl bg-[#211F1C] hover:bg-[#2B2926] border border-[#2B2926] text-xs font-medium text-[#E6E1DC] flex items-center justify-center gap-2"
            >
              <FileJson className="w-4 h-4 text-[#E0A458]" />
              <span>Ekspor Backup Lengkap (.json)</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
