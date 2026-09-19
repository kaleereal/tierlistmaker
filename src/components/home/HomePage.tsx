import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Pin,
  PinOff,
  Plus,
  Copy,
  Archive,
  Trash2,
  Share2,
  Edit2,
  FolderPlus,
  ArrowUpDown,
  Settings,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { FolderEntity, EntryEntity, Screen } from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic, SWATCH_COLORS } from '../../services/imageUtils';
import { TopAppBar, ActionItem, MenuItem } from '../common/TopAppBar';
import { ModalBottomSheet } from '../common/ModalBottomSheet';

interface HomePageProps {
  onNavigate: (screen: Screen) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [folders, setFolders] = useState<FolderEntity[]>(() => storage.getFolders(false, false));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<string>('updated');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());

  // Create folder dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPreset, setNewFolderPreset] = useState('S-F');
  const [newFolderColor, setNewFolderColor] = useState('#E0A458');

  // Sort dialog
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Folder actions bottom sheet
  const [activeFolder, setActiveFolder] = useState<FolderEntity | null>(null);

  // Rename folder dialog
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');

  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setFolders(storage.getFolders(false, false));
    });
    return unsub;
  }, []);

  // Sort logic
  const sortedFolders = useMemo(() => {
    const list = [...folders];
    switch (sortOption) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'created':
        return list.sort((a, b) => b.createdAt - a.createdAt);
      case 'entries_count':
        return list.sort((a, b) => storage.getEntries(b.id).length - storage.getEntries(a.id).length);
      case 'manual':
        return list.sort((a, b) => a.sortOrder - b.sortOrder);
      case 'updated':
      default:
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }, [folders, sortOption]);

  const pinnedFolders = useMemo(() => sortedFolders.filter((f) => f.isPinned), [sortedFolders]);
  const otherFolders = useMemo(() => sortedFolders.filter((f) => !f.isPinned), [sortedFolders]);

  // Global search results across all folders
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();

    const matchedFolders = folders.filter((f) => f.name.toLowerCase().includes(q));

    const matchedEntries: Array<EntryEntity & { folderName: string }> = [];
    folders.forEach((f) => {
      const fEntries = storage.getEntries(f.id);
      fEntries.forEach((e) => {
        if (e.title.toLowerCase().includes(q) || (e.note && e.note.toLowerCase().includes(q))) {
          matchedEntries.push({ ...e, folderName: f.name });
        }
      });
    });

    return { folders: matchedFolders, entries: matchedEntries };
  }, [folders, searchQuery]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const created = storage.createFolder(newFolderName.trim(), newFolderPreset, newFolderColor);
    setIsCreateOpen(false);
    setNewFolderName('');
    triggerHaptic('medium');
    onNavigate({ type: 'tierlist', folderId: created.id });
  };

  const toggleSelectFolder = (id: string) => {
    const next = new Set(selectedFolderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFolderIds(next);
  };

  // Top Bar Actions
  const topActions: ActionItem[] = [
    {
      id: 'view_toggle',
      label: viewMode === 'grid' ? 'Tampilan List' : 'Tampilan Grid',
      icon: viewMode === 'grid' ? <List className="w-5 h-5" /> : <LayoutGrid className="w-5 h-5" />,
      onClick: () => setViewMode(viewMode === 'grid' ? 'list' : 'grid'),
    },
  ];

  const menuItems: MenuItem[] = [
    {
      id: 'sort',
      label: 'Urutkan',
      icon: <ArrowUpDown className="w-4 h-4" />,
      onClick: () => setIsSortOpen(true),
    },
    {
      id: 'trash',
      label: 'Sampah',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'trash_archive', initialTab: 'trash' }),
    },
    {
      id: 'archive',
      label: 'Arsip',
      icon: <Archive className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'trash_archive', initialTab: 'archive' }),
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'app_settings' }),
    },
  ];

  // Multi-select actions
  const contextualActions: ActionItem[] = [
    {
      id: 'pin',
      label: 'Sematkan',
      icon: <Pin className="w-5 h-5" />,
      onClick: () => {
        selectedFolderIds.forEach((id) => storage.togglePinFolder(id));
        setSelectedFolderIds(new Set());
        setIsSelectionMode(false);
        triggerHaptic('light');
      },
    },
    {
      id: 'archive',
      label: 'Arsipkan',
      icon: <Archive className="w-5 h-5" />,
      onClick: () => {
        selectedFolderIds.forEach((id) => storage.toggleArchiveFolder(id));
        setSelectedFolderIds(new Set());
        setIsSelectionMode(false);
        triggerHaptic('light');
      },
    },
    {
      id: 'delete',
      label: 'Hapus ke Sampah',
      icon: <Trash2 className="w-5 h-5 text-[#FFB4AB]" />,
      onClick: () => {
        if (confirm(`Pindahkan ${selectedFolderIds.size} folder ke Sampah?`)) {
          selectedFolderIds.forEach((id) => storage.softDeleteFolder(id));
          setSelectedFolderIds(new Set());
          setIsSelectionMode(false);
          triggerHaptic('medium');
        }
      },
    },
  ];

  // Helper to render collage cover
  const renderCover = (folder: FolderEntity) => {
    const entries = storage.getEntries(folder.id).slice(0, 4);
    if (entries.length === 0) {
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: folder.coverColor || '#6B3F00' }}
        >
          <Layers className="w-10 h-10 text-white/70" />
        </div>
      );
    }

    if (entries.length < 4) {
      // 1 prominent cover
      const first = entries[0];
      return first.imagePath ? (
        <img
          src={first.imagePath}
          alt={folder.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-white text-lg font-bold"
          style={{ backgroundColor: folder.coverColor || '#E0A458' }}
        >
          {folder.name.slice(0, 2)}
        </div>
      );
    }

    // 2x2 collage
    return (
      <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px] bg-black/40">
        {entries.map((item, idx) =>
          item.imagePath ? (
            <img
              key={idx}
              src={item.imagePath}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              key={idx}
              className="w-full h-full bg-[#363430] flex items-center justify-center text-[10px] text-white/60 font-bold"
            >
              {idx + 1}
            </div>
          )
        )}
      </div>
    );
  };

  const renderFolderCard = (folder: FolderEntity) => {
    const count = storage.getEntries(folder.id).length;
    const isSelected = selectedFolderIds.has(folder.id);
    const timeAgo = new Date(folder.updatedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

    if (viewMode === 'list') {
      return (
        <div
          id={`folder-item-${folder.id}`}
          key={folder.id}
          onClick={() => {
            if (isSelectionMode) toggleSelectFolder(folder.id);
            else onNavigate({ type: 'tierlist', folderId: folder.id });
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setActiveFolder(folder);
          }}
          className={`relative h-20 p-2 rounded-xl bg-[#211F1C] border border-[#2B2926] hover:bg-[#2B2926] flex items-center gap-3 cursor-pointer transition-all ${
            isSelected ? 'ring-2 ring-[#E0A458]' : ''
          }`}
        >
          {/* Thumbnail */}
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/30">
            {renderCover(folder)}
            {folder.isPinned && (
              <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[#141311]/80 text-[#E0A458]">
                <Pin className="w-3 h-3 fill-[#E0A458]" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-[#E6E1DC] truncate">{folder.name}</h3>
            <p className="text-xs text-[#D1C4B8] truncate mt-0.5">
              {count} entri • Diubah {timeAgo}
            </p>
          </div>

          {/* Actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveFolder(folder);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#9A8F84] hover:text-[#E6E1DC] hover:bg-[#363430]"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      );
    }

    // Grid Card Mode
    return (
      <div
        id={`folder-card-${folder.id}`}
        key={folder.id}
        onClick={() => {
          if (isSelectionMode) toggleSelectFolder(folder.id);
          else onNavigate({ type: 'tierlist', folderId: folder.id });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setActiveFolder(folder);
        }}
        className={`relative rounded-xl overflow-hidden bg-[#211F1C] border border-[#2B2926] hover:border-[#363430] hover:bg-[#2B2926] flex flex-col cursor-pointer transition-all duration-200 shadow-sm ${
          isSelected ? 'ring-3 ring-[#E0A458]' : ''
        }`}
      >
        {/* Cover 16:10 ratio */}
        <div className="relative w-full aspect-[16/10] overflow-hidden bg-black/20">
          {renderCover(folder)}

          {/* Pin Badge */}
          {folder.isPinned && (
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-[#141311]/85 text-[#E0A458] shadow">
              <Pin className="w-3.5 h-3.5 fill-[#E0A458]" />
            </div>
          )}

          {/* Multi-select indicator */}
          {isSelectionMode && (
            <div
              className={`absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center border ${
                isSelected
                  ? 'bg-[#E0A458] border-[#E0A458] text-[#4A2A00]'
                  : 'bg-[#141311]/60 border-white/60'
              }`}
            >
              {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
          )}
        </div>

        {/* Text Area */}
        <div className="p-3 flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-[#E6E1DC] truncate">{folder.name}</h3>
            <p className="text-xs text-[#D1C4B8] truncate mt-0.5">
              {count} entri • Diubah {timeAgo}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveFolder(folder);
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9A8F84] hover:text-[#E6E1DC] shrink-0"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div id="home-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-24 flex flex-col">
      {/* Top App Bar */}
      <TopAppBar
        title="Tier List Saya"
        actions={topActions}
        menuItems={menuItems}
        showSearch={true}
        searchPlaceholder="Cari folder atau entri..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isContextual={isSelectionMode}
        selectedCount={selectedFolderIds.size}
        onContextualClose={() => {
          setIsSelectionMode(false);
          setSelectedFolderIds(new Set());
        }}
        contextualActions={contextualActions}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* Search Results Display if searching */}
        {searchResults ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9A8F84] mb-3">
                Folder ({searchResults.folders.length})
              </h2>
              {searchResults.folders.length === 0 ? (
                <p className="text-sm text-[#D1C4B8]/60 italic">Tidak ada folder yang cocok.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {searchResults.folders.map((f) => renderFolderCard(f))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#9A8F84] mb-3">
                Entri ({searchResults.entries.length})
              </h2>
              {searchResults.entries.length === 0 ? (
                <p className="text-sm text-[#D1C4B8]/60 italic">Tidak ada entri yang cocok.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {searchResults.entries.map((item) => (
                    <div
                      key={item.id}
                      onClick={() =>
                        onNavigate({
                          type: 'tierlist',
                          folderId: item.folderId,
                          highlightEntryId: item.id,
                        })
                      }
                      className="p-3 rounded-xl bg-[#211F1C] border border-[#2B2926] hover:bg-[#2B2926] flex items-center gap-3 cursor-pointer"
                    >
                      {item.imagePath ? (
                        <img
                          src={item.imagePath}
                          alt=""
                          className="w-12 h-16 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded bg-[#363430] flex items-center justify-center text-xs font-bold text-white">
                          T
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-[#E6E1DC] truncate">{item.title}</h4>
                        <p className="text-xs text-[#D1C4B8] truncate">Folder: {item.folderName}</p>
                        {item.note && (
                          <p className="text-xs text-[#9A8F84] truncate italic mt-0.5">{item.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : folders.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-[#2B2926] flex items-center justify-center mb-4">
              <Layers className="w-12 h-12 text-[#9A8F84]" />
            </div>
            <h2 className="text-lg font-medium text-[#E6E1DC] mb-1">Belum ada tier list</h2>
            <p className="text-sm text-[#D1C4B8] max-w-xs mb-6">
              Buat folder pertama Anda untuk mulai meranking game, film, makanan, atau apa pun.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-2.5 rounded-full bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100] font-medium text-sm flex items-center gap-2 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Folder Baru
            </button>
          </div>
        ) : (
          /* Normal Folders List / Grid */
          <div className="space-y-6">
            {/* Pinned Section */}
            {pinnedFolders.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <Pin className="w-4 h-4 text-[#E0A458] fill-[#E0A458]" />
                  <h2 className="text-sm font-medium text-[#E0A458] tracking-wide uppercase">
                    Disematkan
                  </h2>
                </div>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                      : 'space-y-2'
                  }
                >
                  {pinnedFolders.map((f) => renderFolderCard(f))}
                </div>
              </section>
            )}

            {/* All Folders Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-[#D1C4B8] tracking-wide uppercase">
                  Semua Folder ({folders.length})
                </h2>
                <button
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className="text-xs text-[#E0A458] hover:underline"
                >
                  {isSelectionMode ? 'Batal Pilih' : 'Pilih Folder'}
                </button>
              </div>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3'
                    : 'space-y-2'
                }
              >
                {otherFolders.map((f) => renderFolderCard(f))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FAB: Buat Folder Baru */}
      <button
        id="btn-fab-create-folder"
        type="button"
        onClick={() => setIsCreateOpen(true)}
        aria-label="Buat folder baru"
        className="fixed right-4 sm:right-6 bottom-4 sm:bottom-6 z-40 w-14 h-14 rounded-2xl bg-[#6B3F00] hover:bg-[#8A5100] text-[#FFDDB3] flex items-center justify-center shadow-xl active:scale-95 transition-all"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Dialog Buat Folder Baru */}
      <ModalBottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Folder Baru"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
              Nama Folder
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Contoh: Film Sci-Fi Favorit..."
              className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
              Preset Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'S-F', label: 'S, A, B, C, D, E, F' },
                { id: 'A-F', label: 'A, B, C, D, E, F' },
                { id: '1-5', label: '⭐⭐⭐⭐⭐ (1 - 5)' },
                { id: 'opinion', label: 'Suka / Netral / Kurang' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setNewFolderPreset(p.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    newFolderPreset === p.id
                      ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3]'
                      : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
              Warna Cover
            </label>
            <div className="flex flex-wrap gap-2">
              {SWATCH_COLORS.slice(0, 10).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewFolderColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    newFolderColor === c ? 'scale-115 border-white shadow' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2B2926]">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className={`px-5 py-2 rounded-xl text-sm font-medium ${
                newFolderName.trim()
                  ? 'bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100]'
                  : 'bg-[#2B2926] text-[#9A8F84] cursor-not-allowed'
              }`}
            >
              Buat
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Dialog Sort */}
      <ModalBottomSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title="Urutkan Folder"
      >
        <div className="space-y-2">
          {[
            { id: 'updated', label: 'Terakhir Diubah' },
            { id: 'name_asc', label: 'Nama (A - Z)' },
            { id: 'name_desc', label: 'Nama (Z - A)' },
            { id: 'created', label: 'Tanggal Dibuat' },
            { id: 'entries_count', label: 'Jumlah Entri Terbanyak' },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                setSortOption(opt.id);
                setIsSortOpen(false);
              }}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-colors ${
                sortOption === opt.id
                  ? 'bg-[#6B3F00] text-[#FFDDB3] font-medium'
                  : 'bg-[#2B2926] text-[#D1C4B8] hover:bg-[#363430]'
              }`}
            >
              <span className="text-sm">{opt.label}</span>
              {sortOption === opt.id && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </ModalBottomSheet>

      {/* Bottom Sheet Aksi Folder */}
      <ModalBottomSheet
        isOpen={Boolean(activeFolder)}
        onClose={() => setActiveFolder(null)}
        title={activeFolder?.name}
      >
        {activeFolder && (
          <div className="space-y-1">
            <button
              onClick={() => {
                setRenameText(activeFolder.name);
                setIsRenameOpen(true);
              }}
              className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
            >
              <Edit2 className="w-4 h-4 text-[#D1C4B8]" />
              <span>Ubah Nama Folder</span>
            </button>

            <button
              onClick={() => {
                storage.duplicateFolder(activeFolder.id);
                setActiveFolder(null);
                triggerHaptic('medium');
              }}
              className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
            >
              <Copy className="w-4 h-4 text-[#D1C4B8]" />
              <span>Duplikat Folder</span>
            </button>

            <button
              onClick={() => {
                storage.togglePinFolder(activeFolder.id);
                setActiveFolder(null);
                triggerHaptic('light');
              }}
              className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
            >
              {activeFolder.isPinned ? (
                <>
                  <PinOff className="w-4 h-4 text-[#D1C4B8]" />
                  <span>Lepas Sematan</span>
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 text-[#D1C4B8]" />
                  <span>Sematkan ke Atas</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                storage.toggleArchiveFolder(activeFolder.id);
                setActiveFolder(null);
                triggerHaptic('light');
              }}
              className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
            >
              <Archive className="w-4 h-4 text-[#D1C4B8]" />
              <span>Arsipkan</span>
            </button>

            <button
              onClick={() => {
                const fId = activeFolder.id;
                setActiveFolder(null);
                onNavigate({ type: 'export_share', folderId: fId });
              }}
              className="w-full p-3 rounded-xl hover:bg-[#2B2926] flex items-center gap-3 text-sm text-[#E6E1DC]"
            >
              <Share2 className="w-4 h-4 text-[#D1C4B8]" />
              <span>Ekspor & Bagikan</span>
            </button>

            <button
              onClick={() => {
                if (confirm(`Pindahkan folder "${activeFolder.name}" ke Sampah?`)) {
                  storage.softDeleteFolder(activeFolder.id);
                  setActiveFolder(null);
                  triggerHaptic('medium');
                }
              }}
              className="w-full p-3 rounded-xl hover:bg-[#93000A]/20 flex items-center gap-3 text-sm text-[#FFB4AB]"
            >
              <Trash2 className="w-4 h-4 text-[#FFB4AB]" />
              <span>Hapus Folder</span>
            </button>
          </div>
        )}
      </ModalBottomSheet>

      {/* Rename Dialog */}
      <ModalBottomSheet
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        title="Ubah Nama Folder"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsRenameOpen(false)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (renameText.trim() && activeFolder) {
                  storage.updateFolder(activeFolder.id, { name: renameText.trim() });
                  setIsRenameOpen(false);
                  setActiveFolder(null);
                }
              }}
              className="px-5 py-2 bg-[#6B3F00] text-[#FFDDB3] font-medium rounded-xl text-sm"
            >
              Simpan
            </button>
          </div>
        </div>
      </ModalBottomSheet>
    </div>
  );
};
