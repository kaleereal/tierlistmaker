import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Camera,
  GitCompare,
  Plus,
  RotateCcw,
  Trash2,
  Edit2,
  Eye,
  Check,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Clock,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { SnapshotEntity, SnapshotDataJson } from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic } from '../../services/imageUtils';

interface SnapshotComparePageProps {
  folderId: string;
  initialTab?: 'snapshots' | 'compare';
  onBack: () => void;
}

export const SnapshotComparePage: React.FC<SnapshotComparePageProps> = ({
  folderId,
  initialTab = 'snapshots',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'snapshots' | 'compare'>(initialTab);
  const [snapshots, setSnapshots] = useState<SnapshotEntity[]>(() => storage.getSnapshots(folderId));
  const folder = storage.getFolderById(folderId);

  // Modals & Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [renamingSnapshot, setRenamingSnapshot] = useState<SnapshotEntity | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [previewSnapshot, setPreviewSnapshot] = useState<SnapshotEntity | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Compare selectors
  // 'current' represents live folder state, or snapshot ID
  const [selectedA, setSelectedA] = useState<string>('current');
  const [selectedB, setSelectedB] = useState<string>(() => {
    const list = storage.getSnapshots(folderId);
    return list.length > 0 ? list[0].id : 'current';
  });
  const [diffFilter, setDiffFilter] = useState<'all' | 'changed' | 'up' | 'down'>('all');
  const [diffSearch, setDiffSearch] = useState('');

  const refreshSnapshots = () => {
    setSnapshots(storage.getSnapshots(folderId));
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Create Snapshot
  const handleOpenCreateModal = () => {
    const dateStr = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    setNewSnapshotName(`Snapshot ${dateStr}`);
    setIsCreateModalOpen(true);
  };

  const handleConfirmCreate = () => {
    if (!newSnapshotName.trim()) return;
    storage.createSnapshot(folderId, newSnapshotName.trim());
    refreshSnapshots();
    setIsCreateModalOpen(false);
    triggerHaptic('medium');
    showToast(`Snapshot "${newSnapshotName.trim()}" berhasil disimpan.`);
  };

  // Restore Snapshot
  const handleRestore = (snap: SnapshotEntity) => {
    if (
      confirm(
        `Pulihkan tier list ke versi "${snap.name}"?\n\nPerubahan saat ini akan otomatis dicadangkan sebagai snapshot baru sebelum pemulihan.`
      )
    ) {
      const result = storage.restoreSnapshot(folderId, snap.id);
      refreshSnapshots();
      triggerHaptic('medium');
      showToast(
        `Berhasil dipulihkan! ${result.restoredCount} entri ditempatkan sesuai snapshot.`
      );
    }
  };

  // Rename Snapshot
  const handleStartRename = (snap: SnapshotEntity) => {
    setRenamingSnapshot(snap);
    setRenameValue(snap.name);
  };

  const handleConfirmRename = () => {
    if (!renamingSnapshot || !renameValue.trim()) return;
    storage.renameSnapshot(renamingSnapshot.id, renameValue.trim());
    refreshSnapshots();
    setRenamingSnapshot(null);
    triggerHaptic('light');
    showToast('Nama snapshot berhasil diperbarui.');
  };

  // Delete Snapshot
  const handleDelete = (snap: SnapshotEntity) => {
    if (confirm(`Hapus snapshot "${snap.name}"?`)) {
      storage.deleteSnapshot(snap.id);
      refreshSnapshots();
      if (selectedB === snap.id) setSelectedB('current');
      if (selectedA === snap.id) setSelectedA('current');
      triggerHaptic('medium');
      showToast('Snapshot telah dihapus.');
    }
  };

  // Helper to extract SnapshotDataJson
  const getSnapshotData = (id: string): SnapshotDataJson | null => {
    if (id === 'current') {
      const liveTiers = storage.getTiers(folderId).map((t) => ({
        id: t.id,
        label: t.label,
        colorHex: t.colorHex,
        sortOrder: t.sortOrder,
      }));
      const liveEntries = storage.getEntries(folderId).map((e) => ({
        id: e.id,
        title: e.title,
        tierId: e.tierId,
        position: e.position,
        score: e.score,
      }));
      return { tiers: liveTiers, entries: liveEntries };
    }

    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return null;
    try {
      return JSON.parse(snap.dataJson);
    } catch {
      return null;
    }
  };

  // Comparison logic between A (before) and B (after)
  const comparisonResults = useMemo(() => {
    const dataA = getSnapshotData(selectedA);
    const dataB = getSnapshotData(selectedB);

    if (!dataA || !dataB) return [];

    const tierMapA = new Map(dataA.tiers.map((t) => [t.id, t]));
    const tierMapB = new Map(dataB.tiers.map((t) => [t.id, t]));

    const entryMapA = new Map(dataA.entries.map((e) => [e.id, e]));
    const entryMapB = new Map(dataB.entries.map((e) => [e.id, e]));

    // All unique entry IDs
    const allEntryIds = Array.from(new Set([...entryMapA.keys(), ...entryMapB.keys()]));

    return allEntryIds.map((id) => {
      const eA = entryMapA.get(id);
      const eB = entryMapB.get(id);
      const title = eB?.title || eA?.title || 'Entri';

      const tierA = eA?.tierId ? tierMapA.get(eA.tierId) : null;
      const tierB = eB?.tierId ? tierMapB.get(eB.tierId) : null;

      // Determine movement status
      // Lower sortOrder = higher tier rank (0 is highest e.g. S, 1 is A)
      let status: 'up' | 'down' | 'same' | 'added' | 'removed' | 'unranked' = 'same';

      if (!eA && eB) {
        status = 'added';
      } else if (eA && !eB) {
        status = 'removed';
      } else if (tierA && !tierB) {
        status = 'unranked';
      } else if (!tierA && tierB) {
        status = 'up';
      } else if (tierA && tierB) {
        if (tierA.id === tierB.id) {
          status = 'same';
        } else if (tierB.sortOrder < tierA.sortOrder) {
          status = 'up'; // Rank improved
        } else {
          status = 'down'; // Rank dropped
        }
      }

      return {
        id,
        title,
        status,
        tierA,
        tierB,
        scoreA: eA?.score,
        scoreB: eB?.score,
      };
    });
  }, [selectedA, selectedB, snapshots]);

  // Filtered comparison
  const filteredComparison = useMemo(() => {
    return comparisonResults.filter((item) => {
      if (diffFilter === 'changed' && item.status === 'same') return false;
      if (diffFilter === 'up' && item.status !== 'up') return false;
      if (diffFilter === 'down' && item.status !== 'down') return false;

      if (diffSearch.trim()) {
        const q = diffSearch.toLowerCase();
        return item.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [comparisonResults, diffFilter, diffSearch]);

  const diffCounts = useMemo(() => {
    let up = 0;
    let down = 0;
    let same = 0;
    let changed = 0;

    comparisonResults.forEach((c) => {
      if (c.status === 'up') {
        up++;
        changed++;
      } else if (c.status === 'down') {
        down++;
        changed++;
      } else if (c.status === 'added' || c.status === 'removed' || c.status === 'unranked') {
        changed++;
      } else if (c.status === 'same') {
        same++;
      }
    });

    return { up, down, same, changed, total: comparisonResults.length };
  }, [comparisonResults]);

  return (
    <div id="snapshot-compare-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
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
            <h1 className="text-base sm:text-lg font-medium text-[#E6E1DC]">
              Snapshot & Bandingkan
            </h1>
            <span className="text-xs text-[#9A8F84] truncate block max-w-[200px]">
              {folder?.name}
            </span>
          </div>
        </div>

        {activeTab === 'snapshots' && (
          <button
            onClick={handleOpenCreateModal}
            className="px-3.5 py-1.5 rounded-full bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Snapshot</span>
          </button>
        )}
      </header>

      {/* Notification Banner */}
      {notification && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-[#1D3220] border border-[#2E5E35] text-xs text-[#A6E6AB] flex items-center gap-2 shadow-md animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Tab Selector */}
      <div className="max-w-3xl w-full mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#211F1C] border border-[#2B2926]">
          <button
            onClick={() => {
              setActiveTab('snapshots');
              triggerHaptic('light');
            }}
            className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'snapshots'
                ? 'bg-[#6B3F00] text-[#FFDDB3] font-bold shadow-sm'
                : 'text-[#9A8F84] hover:text-[#E6E1DC]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Daftar Snapshot ({snapshots.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('compare');
              triggerHaptic('light');
            }}
            className={`py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'compare'
                ? 'bg-[#6B3F00] text-[#FFDDB3] font-bold shadow-sm'
                : 'text-[#9A8F84] hover:text-[#E6E1DC]'
            }`}
          >
            <GitCompare className="w-4 h-4" />
            <span>Bandingkan Versi</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-4">
        {/* TAB 1: DAFTAR SNAPSHOT */}
        {activeTab === 'snapshots' && (
          <div className="space-y-4">
            {snapshots.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#211F1C] border border-[#2B2926] text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#2B2926] flex items-center justify-center mx-auto text-[#E0A458]">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-[#E6E1DC]">Belum Ada Snapshot</h3>
                <p className="text-xs text-[#9A8F84] max-w-sm mx-auto">
                  Snapshot menyimpan kondisi tier list saat ini sehingga Anda dapat membandingkan evolusi ranking atau memulihkannya kapan saja.
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-4 py-2 rounded-xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] text-xs font-bold inline-flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ambil Snapshot Pertama</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#9A8F84] px-1">
                  <span>Maksimal 30 snapshot tersimpan otomatis</span>
                  <span>{snapshots.length}/30</span>
                </div>

                {snapshots.map((snap) => {
                  let snapData: SnapshotDataJson | null = null;
                  try {
                    snapData = JSON.parse(snap.dataJson);
                  } catch {}

                  const rankedCount =
                    snapData?.entries.filter((e) => e.tierId !== null).length || 0;
                  const poolCount =
                    snapData?.entries.filter((e) => e.tierId === null).length || 0;

                  return (
                    <div
                      key={snap.id}
                      className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] hover:border-[#363430] transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-[#E6E1DC] truncate">
                            {snap.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9A8F84]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {new Date(snap.createdAt).toLocaleString('id-ID', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewSnapshot(snap)}
                            className="p-2 rounded-lg bg-[#2B2926] hover:bg-[#363430] text-[#D1C4B8] hover:text-[#E6E1DC]"
                            title="Pratinjau Snapshot"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartRename(snap)}
                            className="p-2 rounded-lg bg-[#2B2926] hover:bg-[#363430] text-[#D1C4B8] hover:text-[#E6E1DC]"
                            title="Ubah Nama"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRestore(snap)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#6B3F00]/40 hover:bg-[#6B3F00] text-[#FFDDB3] text-xs font-medium flex items-center gap-1.5 transition-colors"
                            title="Pulihkan Versi Ini"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(snap)}
                            className="p-2 rounded-lg hover:bg-[#93000A]/30 text-[#FFB4AB]"
                            title="Hapus Snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Tier Distribution Preview Chips */}
                      {snapData && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#2B2926]/70">
                          {snapData.tiers.map((t) => {
                            const count =
                              snapData!.entries.filter((e) => e.tierId === t.id).length;
                            return (
                              <span
                                key={t.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                                style={{
                                  backgroundColor: `${t.colorHex}22`,
                                  color: t.colorHex,
                                  border: `1px solid ${t.colorHex}44`,
                                }}
                              >
                                <span>{t.label}:</span>
                                <span className="font-bold">{count}</span>
                              </span>
                            );
                          })}
                          <span className="text-[11px] text-[#9A8F84] ml-auto">
                            {rankedCount} ditempatkan • {poolCount} di pool
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BANDINGKAN VERSI */}
        {activeTab === 'compare' && (
          <div className="space-y-4">
            {/* Version Selectors */}
            <div className="p-4 rounded-xl bg-[#211F1C] border border-[#2B2926] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Selector A (Sebelum) */}
                <div>
                  <label className="text-xs text-[#9A8F84] block mb-1.5 font-medium">
                    Versi Asal (Sebelum)
                  </label>
                  <select
                    value={selectedA}
                    onChange={(e) => setSelectedA(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#2B2926] border border-[#363430] text-xs text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
                  >
                    <option value="current">Versi Saat Ini (Live)</option>
                    {snapshots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({new Date(s.createdAt).toLocaleDateString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selector B (Sesudah) */}
                <div>
                  <label className="text-xs text-[#9A8F84] block mb-1.5 font-medium">
                    Versi Target (Sesudah)
                  </label>
                  <select
                    value={selectedB}
                    onChange={(e) => setSelectedB(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg bg-[#2B2926] border border-[#363430] text-xs text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
                  >
                    <option value="current">Versi Saat Ini (Live)</option>
                    {snapshots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({new Date(s.createdAt).toLocaleDateString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] text-center">
                <span className="text-[10px] text-[#9A8F84] block uppercase font-semibold">
                  Berubah
                </span>
                <span className="text-base sm:text-lg font-bold text-[#E0A458]">
                  {diffCounts.changed}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] text-center">
                <span className="text-[10px] text-[#A6E6AB] block uppercase font-semibold flex items-center justify-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>Naik</span>
                </span>
                <span className="text-base sm:text-lg font-bold text-[#A6E6AB]">
                  {diffCounts.up}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] text-center">
                <span className="text-[10px] text-[#FFB4AB] block uppercase font-semibold flex items-center justify-center gap-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>Turun</span>
                </span>
                <span className="text-base sm:text-lg font-bold text-[#FFB4AB]">
                  {diffCounts.down}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] text-center">
                <span className="text-[10px] text-[#9A8F84] block uppercase font-semibold flex items-center justify-center gap-1">
                  <Minus className="w-3 h-3" />
                  <span>Tetap</span>
                </span>
                <span className="text-base sm:text-lg font-bold text-[#D1C4B8]">
                  {diffCounts.same}
                </span>
              </div>
            </div>

            {/* Diff Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
              <div className="flex items-center gap-1 w-full sm:w-auto">
                {[
                  { id: 'all' as const, label: `Semua (${comparisonResults.length})` },
                  { id: 'changed' as const, label: `Berubah (${diffCounts.changed})` },
                  { id: 'up' as const, label: `Naik (${diffCounts.up})` },
                  { id: 'down' as const, label: `Turun (${diffCounts.down})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setDiffFilter(f.id)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      diffFilter === f.id
                        ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3] font-semibold'
                        : 'bg-[#211F1C] border-[#2B2926] text-[#9A8F84] hover:text-[#E6E1DC]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9A8F84]" />
                <input
                  type="text"
                  placeholder="Cari entri..."
                  value={diffSearch}
                  onChange={(e) => setDiffSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#211F1C] border border-[#2B2926] text-xs text-[#E6E1DC] placeholder-[#9A8F84] focus:outline-none focus:border-[#E0A458]"
                />
              </div>
            </div>

            {/* Comparison Items List */}
            <div className="space-y-2">
              {filteredComparison.length === 0 ? (
                <div className="p-6 rounded-xl bg-[#211F1C] border border-[#2B2926] text-center text-xs text-[#9A8F84]">
                  Tidak ada entri yang cocok dengan filter perbandingan.
                </div>
              ) : (
                filteredComparison.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#E6E1DC] truncate">
                        {item.title}
                      </h4>
                      {item.scoreA !== undefined && item.scoreB !== undefined && (
                        <span className="text-[10px] text-[#9A8F84]">
                          Skor: {item.scoreA ?? '-'} → {item.scoreB ?? '-'}
                        </span>
                      )}
                    </div>

                    {/* Tier Transition Indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* From Tier */}
                      {item.tierA ? (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            backgroundColor: `${item.tierA.colorHex}22`,
                            color: item.tierA.colorHex,
                            border: `1px solid ${item.tierA.colorHex}66`,
                          }}
                        >
                          {item.tierA.label}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#2B2926] text-[#9A8F84]">
                          Pool
                        </span>
                      )}

                      {/* Direction Arrow */}
                      <span className="text-xs font-bold">
                        {item.status === 'up' && (
                          <span className="text-[#A6E6AB] flex items-center gap-0.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>→</span>
                          </span>
                        )}
                        {item.status === 'down' && (
                          <span className="text-[#FFB4AB] flex items-center gap-0.5">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>→</span>
                          </span>
                        )}
                        {item.status === 'same' && (
                          <span className="text-[#9A8F84] flex items-center gap-0.5">
                            <Minus className="w-3.5 h-3.5" />
                            <span>→</span>
                          </span>
                        )}
                        {item.status === 'added' && (
                          <span className="text-[#80D4FF] text-[11px]">+ Baru</span>
                        )}
                        {item.status === 'removed' && (
                          <span className="text-[#FFB4AB] text-[11px]">Dihapus</span>
                        )}
                        {item.status === 'unranked' && (
                          <span className="text-[#E0A458] text-[11px]">Ke Pool</span>
                        )}
                      </span>

                      {/* To Tier */}
                      {item.tierB ? (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold"
                          style={{
                            backgroundColor: `${item.tierB.colorHex}22`,
                            color: item.tierB.colorHex,
                            border: `1px solid ${item.tierB.colorHex}66`,
                          }}
                        >
                          {item.tierB.label}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs bg-[#2B2926] text-[#9A8F84]">
                          Pool
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* CREATE SNAPSHOT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl bg-[#211F1C] border border-[#2B2926] space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#E6E1DC]">Simpan Snapshot Baru</h3>
            <p className="text-xs text-[#9A8F84]">
              Simpan seluruh susunan tier dan posisi entri saat ini sebagai versi tersimpan.
            </p>
            <input
              type="text"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              placeholder="Nama snapshot..."
              className="w-full p-2.5 rounded-xl bg-[#141311] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#D1C4B8] hover:bg-[#2B2926]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={!newSnapshotName.trim()}
                className="px-4 py-2 rounded-xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] text-xs font-bold disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renamingSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-5 rounded-2xl bg-[#211F1C] border border-[#2B2926] space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#E6E1DC]">Ubah Nama Snapshot</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#141311] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingSnapshot(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#D1C4B8] hover:bg-[#2B2926]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameValue.trim()}
                className="px-4 py-2 rounded-xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] text-xs font-bold disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW SNAPSHOT MODAL */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-5 rounded-2xl bg-[#211F1C] border border-[#2B2926] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#2B2926]">
              <div>
                <h3 className="text-base font-bold text-[#E6E1DC]">{previewSnapshot.name}</h3>
                <span className="text-xs text-[#9A8F84]">
                  {new Date(previewSnapshot.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="p-1 rounded-full text-[#9A8F84] hover:text-[#E6E1DC] hover:bg-[#2B2926]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Snapshot Tier Breakdown */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {(() => {
                let data: SnapshotDataJson | null = null;
                try {
                  data = JSON.parse(previewSnapshot.dataJson);
                } catch {}

                if (!data) return <p className="text-xs text-[#9A8F84]">Data rusak.</p>;

                return data.tiers.map((tier) => {
                  const tierEntries = data!.entries.filter((e) => e.tierId === tier.id);
                  return (
                    <div
                      key={tier.id}
                      className="p-3 rounded-xl bg-[#141311] border border-[#2B2926] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2.5 py-0.5 rounded text-xs font-bold"
                          style={{
                            backgroundColor: `${tier.colorHex}25`,
                            color: tier.colorHex,
                            border: `1px solid ${tier.colorHex}66`,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span className="text-xs text-[#9A8F84]">
                          {tierEntries.length} entri
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tierEntries.map((e) => (
                          <span
                            key={e.id}
                            className="px-2 py-1 rounded bg-[#211F1C] text-xs text-[#E6E1DC] border border-[#2B2926]"
                          >
                            {e.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-3 border-t border-[#2B2926] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewSnapshot(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#D1C4B8] hover:bg-[#2B2926]"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewSnapshot;
                  setPreviewSnapshot(null);
                  handleRestore(target);
                }}
                className="px-4 py-2 rounded-xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Pulihkan Versi Ini</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
