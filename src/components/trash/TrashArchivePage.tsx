import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Trash2,
  Archive,
  RotateCcw,
  AlertTriangle,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { FolderEntity, EntryEntity } from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic } from '../../services/imageUtils';

interface TrashArchivePageProps {
  initialTab?: 'trash' | 'archive';
  onBack: () => void;
}

export const TrashArchivePage: React.FC<TrashArchivePageProps> = ({
  initialTab = 'trash',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'trash' | 'archive'>(initialTab);

  const [trashFolders, setTrashFolders] = useState<FolderEntity[]>(() =>
    storage.getFolders(true, false)
  );
  const [trashEntries, setTrashEntries] = useState<EntryEntity[]>(() =>
    storage.getDeletedEntries()
  );
  const [archivedFolders, setArchivedFolders] = useState<FolderEntity[]>(() =>
    storage.getFolders(false, true)
  );

  const refresh = () => {
    setTrashFolders(storage.getFolders(true, false));
    setTrashEntries(storage.getDeletedEntries());
    setArchivedFolders(storage.getFolders(false, true));
  };

  useEffect(() => {
    const unsub = storage.subscribe(refresh);
    return unsub;
  }, []);

  const handleEmptyTrash = () => {
    if (confirm('Kosongkan semua item di sampah? Tindakan ini tidak dapat dibatalkan.')) {
      storage.emptyTrash();
      refresh();
      triggerHaptic('medium');
    }
  };

  return (
    <div id="trash-archive-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
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
            Sampah & Arsip
          </h1>
        </div>

        {activeTab === 'trash' && (trashFolders.length > 0 || trashEntries.length > 0) && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-1.5 rounded-full bg-[#93000A]/30 text-[#FFB4AB] hover:bg-[#93000A]/50 text-xs font-medium border border-[#FFB4AB]/20"
          >
            Kosongkan Sampah
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="max-w-xl w-full mx-auto px-4 pt-4">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-[#211F1C] border border-[#363430]">
          <button
            onClick={() => setActiveTab('trash')}
            className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'trash'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Sampah ({trashFolders.length + trashEntries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('archive')}
            className={`py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'archive'
                ? 'bg-[#6B3F00] text-[#FFDDB3] shadow-xs'
                : 'text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>Arsip ({archivedFolders.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 space-y-4">
        {activeTab === 'trash' ? (
          /* Trash View */
          <div className="space-y-4">
            {trashFolders.length === 0 && trashEntries.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#9A8F84] italic">
                Sampah kosong. Tidak ada item yang dihapus.
              </div>
            ) : (
              <>
                {/* Trash Folders */}
                {trashFolders.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
                      Folder ({trashFolders.length})
                    </span>
                    {trashFolders.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: f.coverColor || '#6B3F00' }}
                          >
                            <Layers className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-[#E6E1DC] truncate">{f.name}</h4>
                            <span className="text-[11px] text-[#9A8F84]">
                              Dihapus {f.deletedAt ? new Date(f.deletedAt).toLocaleDateString('id-ID') : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              storage.restoreFolder(f.id);
                              refresh();
                              triggerHaptic('light');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus permanen folder "${f.name}" beserta isinya?`)) {
                                storage.permanentlyDeleteFolder(f.id);
                                refresh();
                                triggerHaptic('medium');
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#93000A]/30 text-[#FFB4AB]"
                            title="Hapus permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Trash Entries */}
                {trashEntries.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#9A8F84]">
                      Entri ({trashEntries.length})
                    </span>
                    {trashEntries.map((e) => (
                      <div
                        key={e.id}
                        className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {e.imagePath ? (
                            <img
                              src={e.imagePath}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#363430] flex items-center justify-center text-xs font-bold text-white shrink-0">
                              {e.title.slice(0, 2)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium text-[#E6E1DC] truncate">{e.title}</h4>
                            <span className="text-[11px] text-[#9A8F84]">
                              Dihapus {e.deletedAt ? new Date(e.deletedAt).toLocaleDateString('id-ID') : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              storage.restoreEntry(e.id);
                              refresh();
                              triggerHaptic('light');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Pulihkan</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus permanen entri "${e.title}"?`)) {
                                storage.permanentlyDeleteEntry(e.id);
                                refresh();
                                triggerHaptic('medium');
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#93000A]/30 text-[#FFB4AB]"
                            title="Hapus permanen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Archive View */
          <div className="space-y-3">
            {archivedFolders.length === 0 ? (
              <div className="py-20 text-center text-xs text-[#9A8F84] italic">
                Tidak ada folder yang diarsipkan.
              </div>
            ) : (
              archivedFolders.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: f.coverColor || '#6B3F00' }}
                    >
                      <FolderArchive className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-[#E6E1DC] truncate">{f.name}</h4>
                      <span className="text-[11px] text-[#9A8F84]">
                        Diarsipkan {new Date(f.updatedAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      storage.toggleArchiveFolder(f.id);
                      refresh();
                      triggerHaptic('light');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2B2926] hover:bg-[#363430] text-xs font-medium text-[#E6E1DC] flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Batal Arsip</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};
