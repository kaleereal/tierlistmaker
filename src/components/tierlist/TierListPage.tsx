import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Undo2,
  Redo2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  FolderInput,
  Tag as TagIcon,
  Trash2,
  Eye,
  SlidersHorizontal,
  Shuffle,
  BarChart2,
  Camera,
  Layers,
  Share2,
  X,
  Check,
  Filter as FilterIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  FolderEntity,
  TierEntity,
  EntryEntity,
  TagEntity,
  TierListFilter,
  UndoAction,
  Screen,
  ThumbnailSize,
  TitleDisplayMode,
  RowLayoutMode,
} from '../../types';
import { storage } from '../../services/storage';
import { triggerHaptic } from '../../services/imageUtils';
import { TopAppBar, ActionItem, MenuItem } from '../common/TopAppBar';
import { SpeedDialFAB } from '../common/SpeedDialFAB';
import { ModalBottomSheet } from '../common/ModalBottomSheet';
import { TierRow } from './TierRow';
import { EntryCard } from './EntryCard';

interface TierListPageProps {
  folderId: string;
  highlightEntryId?: string;
  onNavigate: (screen: Screen) => void;
  onBack: () => void;
  onOpenEntryDetail: (entryId: string) => void;
}

export const TierListPage: React.FC<TierListPageProps> = ({
  folderId,
  highlightEntryId,
  onNavigate,
  onBack,
  onOpenEntryDetail,
}) => {
  const [folder, setFolder] = useState<FolderEntity | undefined>(() => storage.getFolderById(folderId));
  const [tiers, setTiers] = useState<TierEntity[]>(() => storage.getTiers(folderId));
  const [entries, setEntries] = useState<EntryEntity[]>(() => storage.getEntries(folderId));
  const [tags, setTags] = useState<TagEntity[]>(() => storage.getTags(folderId));

  // Presentation Mode
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Pool collapsed state
  const [isPoolCollapsed, setIsPoolCollapsed] = useState(false);

  // Search state inside folder
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);

  // Multi-select state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());

  // Filter state
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [showTagCloud, setShowTagCloud] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`folder_show_tags_${folderId}`) === 'true';
    } catch {
      return false;
    }
  });
  const [filters, setFilters] = useState<TierListFilter>({
    tierIds: [],
    tagIds: [],
    tagMatchMode: 'any',
    hasNoteOnly: false,
    unassignedOnly: false,
  });

  // Display Settings dialog
  const [isDisplayDialogOpen, setIsDisplayDialogOpen] = useState(false);
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>(folder?.thumbnailSize || 'medium');
  const [titleDisplayMode, setTitleDisplayMode] = useState<TitleDisplayMode>(folder?.titleDisplayMode || 'below');
  const [rowLayoutMode, setRowLayoutMode] = useState<RowLayoutMode>(folder?.rowLayoutMode || 'scroll');

  // Move To Tier dialog (for multi-select or single move)
  const [isMoveToDialogOpen, setIsMoveToDialogOpen] = useState(false);

  // Rename folder dialog
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Undo / Redo history stacks (in-memory per session up to 50 items)
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);

  // Drag & Drop states for entries
  const [draggingEntryId, setDraggingEntryId] = useState<string | null>(null);
  const [poolHovered, setPoolHovered] = useState(false);
  const [poolHoverIndex, setPoolHoverIndex] = useState<number | null>(null);

  // Drag & Drop state for tiers
  const [draggingTierId, setDraggingTierId] = useState<string | null>(null);
  const [tierDropTargetId, setTierDropTargetId] = useState<string | null>(null);

  // Subscribe to storage updates
  useEffect(() => {
    const unsub = storage.subscribe(() => {
      setFolder(storage.getFolderById(folderId));
      setTiers(storage.getTiers(folderId));
      setEntries(storage.getEntries(folderId));
      setTags(storage.getTags(folderId));
    });
    return unsub;
  }, [folderId]);

  if (!folder) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <p className="text-lg text-[#D1C4B8] mb-4">Folder tidak ditemukan atau telah dihapus.</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-[#6B3F00] text-[#FFDDB3] rounded-xl font-medium"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Filter and Search calculations
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Filter by tier
      if (filters.tierIds.length > 0 && (!entry.tierId || !filters.tierIds.includes(entry.tierId))) {
        return false;
      }
      // Filter by unassigned
      if (filters.unassignedOnly && entry.tierId !== null) {
        return false;
      }
      // Filter by notes
      if (filters.hasNoteOnly && !entry.note?.trim()) {
        return false;
      }
      // Filter by tags
      if (filters.tagIds.length > 0) {
        const entryTagIds = storage.getEntryTags(entry.id).map((t) => t.id);
        if (filters.tagMatchMode === 'all') {
          const hasAll = filters.tagIds.every((id) => entryTagIds.includes(id));
          if (!hasAll) return false;
        } else {
          const hasAny = filters.tagIds.some((id) => entryTagIds.includes(id));
          if (!hasAny) return false;
        }
      }
      return true;
    });
  }, [entries, filters]);

  // Matches for in-folder search
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return filteredEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.note && e.note.toLowerCase().includes(q))
    );
  }, [filteredEntries, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.tierIds.length > 0) count++;
    if (filters.tagIds.length > 0) count++;
    if (filters.hasNoteOnly) count++;
    if (filters.unassignedOnly) count++;
    return count;
  }, [filters]);

  // Entries grouped by tier
  const entriesByTier = useMemo(() => {
    const map = new Map<string, EntryEntity[]>();
    tiers.forEach((t) => map.set(t.id, []));
    const pool: EntryEntity[] = [];

    filteredEntries.forEach((e) => {
      if (e.tierId && map.has(e.tierId)) {
        map.get(e.tierId)!.push(e);
      } else {
        pool.push(e);
      }
    });

    // Sort by position
    map.forEach((arr) => arr.sort((a, b) => a.position - b.position));
    pool.sort((a, b) => a.position - b.position);

    return { map, pool };
  }, [filteredEntries, tiers]);

  // Push undo action
  const pushUndo = (action: UndoAction) => {
    setUndoStack((prev) => [action, ...prev.slice(0, 49)]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const [action, ...rest] = undoStack;
    triggerHaptic('light');

    if (action.type === 'MOVE_ENTRY') {
      const entry = storage.getEntryById(action.entryId);
      if (entry) {
        storage.moveEntry(action.entryId, action.prevTierId, action.prevPosition);
        setRedoStack((r) => [action, ...r]);
      }
    } else if (action.type === 'DELETE_ENTRY') {
      storage.restoreEntry(action.entry.id);
      setRedoStack((r) => [action, ...r]);
    } else if (action.type === 'REORDER_TIERS') {
      storage.reorderTiers(folderId, action.prevTiers.map((t) => t.id));
      setRedoStack((r) => [action, ...r]);
    } else if (action.type === 'SHUFFLE_POOL') {
      action.prevPositions.forEach((p) => {
        const e = storage.getEntryById(p.id);
        if (e) storage.updateEntry(p.id, { position: p.position });
      });
      setRedoStack((r) => [action, ...r]);
    }
    setUndoStack(rest);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [action, ...rest] = redoStack;
    triggerHaptic('light');

    if (action.type === 'MOVE_ENTRY') {
      storage.moveEntry(action.entryId, action.newTierId, action.newPosition);
      setUndoStack((u) => [action, ...u]);
    } else if (action.type === 'DELETE_ENTRY') {
      storage.softDeleteEntry(action.entry.id);
      setUndoStack((u) => [action, ...u]);
    } else if (action.type === 'REORDER_TIERS') {
      storage.reorderTiers(folderId, action.newTiers.map((t) => t.id));
      setUndoStack((u) => [action, ...u]);
    }
    setRedoStack(rest);
  };

  // --- Entry Drag and Drop Handlers (Left/Right reordering & between tiers) ---
  const handleEntryDragStart = (e: React.DragEvent, entry: EntryEntity) => {
    e.dataTransfer.setData('text/plain', entry.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingEntryId(entry.id);
    triggerHaptic('light');
  };

  const handleEntryDropInTier = (targetTierId: string, insertAtIndex: number) => {
    if (!draggingEntryId) return;
    const movingEntry = storage.getEntryById(draggingEntryId);
    if (!movingEntry) {
      setDraggingEntryId(null);
      return;
    }

    const prevTierId = movingEntry.tierId;
    const prevPosition = movingEntry.position;

    // Get current items in target tier
    const targetItems = [...(entriesByTier.map.get(targetTierId) || [])].filter(
      (e) => e.id !== draggingEntryId
    );

    // Insert at specified index
    const clampedIndex = Math.max(0, Math.min(insertAtIndex, targetItems.length));
    targetItems.splice(clampedIndex, 0, movingEntry);

    // Persist new order
    const orderedIds = targetItems.map((e) => e.id);
    storage.reorderEntriesInTier(folderId, targetTierId, orderedIds);

    pushUndo({
      type: 'MOVE_ENTRY',
      entryId: draggingEntryId,
      prevTierId,
      prevPosition,
      newTierId: targetTierId,
      newPosition: clampedIndex,
    });

    triggerHaptic('medium');
    setDraggingEntryId(null);
  };

  const handleEntryDropInPool = (insertAtIndex: number) => {
    if (!draggingEntryId) return;
    const movingEntry = storage.getEntryById(draggingEntryId);
    if (!movingEntry) {
      setDraggingEntryId(null);
      return;
    }

    const prevTierId = movingEntry.tierId;
    const prevPosition = movingEntry.position;

    const poolItems = [...entriesByTier.pool].filter((e) => e.id !== draggingEntryId);
    const clampedIndex = Math.max(0, Math.min(insertAtIndex, poolItems.length));
    poolItems.splice(clampedIndex, 0, movingEntry);

    storage.reorderEntriesInTier(folderId, null, poolItems.map((e) => e.id));

    pushUndo({
      type: 'MOVE_ENTRY',
      entryId: draggingEntryId,
      prevTierId,
      prevPosition,
      newTierId: null,
      newPosition: clampedIndex,
    });

    triggerHaptic('medium');
    setDraggingEntryId(null);
    setPoolHovered(false);
  };

  // --- Tier Reordering Drag and Drop Handlers ---
  const handleTierDragStart = (e: React.DragEvent, tierId: string) => {
    e.dataTransfer.setData('application/tier-id', tierId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTierId(tierId);
    triggerHaptic('light');
  };

  const handleTierDragOver = (e: React.DragEvent, targetTierId: string) => {
    e.preventDefault();
    if (draggingTierId && draggingTierId !== targetTierId) {
      setTierDropTargetId(targetTierId);
    }
  };

  const handleTierDrop = (targetTierId: string) => {
    if (!draggingTierId || draggingTierId === targetTierId) {
      setDraggingTierId(null);
      setTierDropTargetId(null);
      return;
    }

    const prevTiers = [...tiers];
    const tierList = [...tiers];
    const sourceIdx = tierList.findIndex((t) => t.id === draggingTierId);
    const targetIdx = tierList.findIndex((t) => t.id === targetTierId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      const [movedTier] = tierList.splice(sourceIdx, 1);
      tierList.splice(targetIdx, 0, movedTier);

      storage.reorderTiers(folderId, tierList.map((t) => t.id));
      pushUndo({
        type: 'REORDER_TIERS',
        prevTiers,
        newTiers: tierList,
      });
      triggerHaptic('medium');
    }

    setDraggingTierId(null);
    setTierDropTargetId(null);
  };

  // Top App Bar Actions
  const topActions: ActionItem[] = [
    {
      id: 'undo',
      label: 'Batalkan aksi',
      icon: <Undo2 className="w-5 h-5" />,
      onClick: handleUndo,
      disabled: undoStack.length === 0,
    },
    {
      id: 'redo',
      label: 'Ulangi aksi',
      icon: <Redo2 className="w-5 h-5" />,
      onClick: handleRedo,
      disabled: redoStack.length === 0,
    },
  ];

  // Sort entries within tiers
  const handleSortEntriesInTiers = (mode: 'score_desc' | 'score_asc' | 'name_asc') => {
    const currentEntries = storage.getEntries(folderId);
    const tiers = storage.getTiers(folderId);

    tiers.forEach((tier) => {
      const tierEntries = currentEntries.filter((e) => e.tierId === tier.id && !e.deletedAt);
      if (tierEntries.length <= 1) return;

      const sorted = [...tierEntries];
      if (mode === 'score_desc') {
        sorted.sort((a, b) => {
          const sA = a.score !== null && a.score !== undefined ? a.score : -1;
          const sB = b.score !== null && b.score !== undefined ? b.score : -1;
          if (sB !== sA) return sB - sA;
          return a.title.localeCompare(b.title, 'id', { sensitivity: 'base' });
        });
      } else if (mode === 'score_asc') {
        sorted.sort((a, b) => {
          const sA = a.score !== null && a.score !== undefined ? a.score : 9999;
          const sB = b.score !== null && b.score !== undefined ? b.score : 9999;
          if (sA !== sB) return sA - sB;
          return a.title.localeCompare(b.title, 'id', { sensitivity: 'base' });
        });
      } else if (mode === 'name_asc') {
        sorted.sort((a, b) => a.title.localeCompare(b.title, 'id', { sensitivity: 'base' }));
      }

      storage.reorderEntriesInTier(
        folderId,
        tier.id,
        sorted.map((e) => e.id)
      );
    });

    setEntries(storage.getEntries(folderId));
    triggerHaptic('medium');
  };

  // Overflow Menu Items
  const menuItems: MenuItem[] = [
    {
      id: 'sort',
      label: 'Urutkan',
      icon: <ArrowUpDown className="w-4 h-4" />,
      children: [
        {
          id: 'sort_score_desc',
          label: 'Nilai Tinggi',
          onClick: () => handleSortEntriesInTiers('score_desc'),
        },
        {
          id: 'sort_score_asc',
          label: 'Nilai Rendah',
          onClick: () => handleSortEntriesInTiers('score_asc'),
        },
        {
          id: 'sort_name_asc',
          label: 'Nama',
          onClick: () => handleSortEntriesInTiers('name_asc'),
        },
      ],
    },
    {
      id: 'quick_rank',
      label: 'Mode Ranking Cepat',
      icon: <Layers className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'quick_rank', folderId }),
    },
    {
      id: 'tier_settings',
      label: 'Pengaturan Tier',
      icon: <SlidersHorizontal className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'tier_settings', folderId }),
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: <FilterIcon className="w-4 h-4" />,
      onClick: () => setIsFilterSheetOpen(true),
    },
    {
      id: 'display',
      label: 'Ukuran & Tampilan',
      icon: <Eye className="w-4 h-4" />,
      onClick: () => setIsDisplayDialogOpen(true),
    },
    {
      id: 'stats',
      label: 'Statistik',
      icon: <BarChart2 className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'folder_stats', folderId }),
    },
    {
      id: 'snapshot',
      label: 'Snapshot & Bandingkan',
      icon: <Camera className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'snapshot_compare', folderId }),
    },
    {
      id: 'export',
      label: 'Ekspor & Bagikan',
      icon: <Share2 className="w-4 h-4" />,
      onClick: () => onNavigate({ type: 'export_share', folderId }),
    },
    {
      id: 'shuffle_pool',
      label: 'Acak Pool',
      icon: <Shuffle className="w-4 h-4" />,
      onClick: () => {
        const poolBefore = entriesByTier.pool.map((e) => ({ id: e.id, position: e.position }));
        storage.shufflePool(folderId);
        pushUndo({ type: 'SHUFFLE_POOL', prevPositions: poolBefore });
        triggerHaptic('medium');
      },
    },
    {
      id: 'rename',
      label: 'Ubah Nama Folder',
      onClick: () => {
        setNewFolderName(folder.name);
        setIsRenameDialogOpen(true);
      },
    },
    {
      id: 'presentation',
      label: 'Mode Presentasi (Layar Penuh)',
      onClick: () => setIsPresentationMode(true),
    },
    {
      id: 'delete_folder',
      label: 'Hapus Folder',
      destructive: true,
      onClick: () => {
        if (confirm(`Pindahkan folder "${folder.name}" ke Sampah?`)) {
          storage.softDeleteFolder(folderId);
          onBack();
        }
      },
    },
  ];

  // Multi-select actions
  const contextualActions: ActionItem[] = [
    {
      id: 'move_to',
      label: 'Pindahkan ke...',
      icon: <FolderInput className="w-5 h-5" />,
      onClick: () => setIsMoveToDialogOpen(true),
    },
    {
      id: 'delete',
      label: 'Hapus terpilih',
      icon: <Trash2 className="w-5 h-5 text-[#FFB4AB]" />,
      onClick: () => {
        if (confirm(`Hapus ${selectedEntryIds.size} entri yang dipilih?`)) {
          selectedEntryIds.forEach((id) => storage.softDeleteEntry(id));
          setSelectedEntryIds(new Set());
          setIsSelectionMode(false);
          triggerHaptic('medium');
        }
      },
    },
  ];

  const handleEntryClick = (entry: EntryEntity) => {
    if (isSelectionMode) {
      const next = new Set(selectedEntryIds);
      if (next.has(entry.id)) next.delete(entry.id);
      else next.add(entry.id);
      setSelectedEntryIds(next);
    } else {
      onOpenEntryDetail(entry.id);
    }
  };

  // Presentation Mode Toggle back
  if (isPresentationMode) {
    return (
      <div
        id="presentation-view"
        className="min-h-screen bg-[#141311] text-[#E6E1DC] flex flex-col select-none cursor-pointer"
        onClick={() => setIsPresentationMode(false)}
        title="Ketuk layar untuk keluar dari Mode Presentasi"
      >
        <div className="p-4 flex items-center justify-between border-b border-[#211F1C] opacity-40 hover:opacity-100 transition-opacity">
          <h1 className="text-xl font-bold">{folder.name}</h1>
          <span className="text-xs text-[#D1C4B8]">Mode Presentasi • Ketuk di mana saja untuk keluar</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {tiers.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              entries={entriesByTier.map.get(tier.id) || []}
              thumbnailSize={thumbnailSize}
              titleDisplayMode={titleDisplayMode}
              rowLayoutMode={rowLayoutMode}
              selectedEntryIds={new Set()}
              draggingEntryId={null}
              draggingTierId={null}
              onEntryClick={() => {}}
              onLabelClick={() => {}}
              onEntryDragStart={() => {}}
              onEntryDropInTier={() => {}}
              onTierDragStart={() => {}}
              onTierDragOver={() => {}}
              onTierDrop={() => {}}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="tier-list-page" className="min-h-screen bg-[#141311] text-[#E6E1DC] pb-28 flex flex-col">
      {/* Top App Bar */}
      <TopAppBar
        title={folder.name}
        onBack={onBack}
        actions={topActions}
        menuItems={menuItems}
        showSearch={true}
        searchPlaceholder="Cari entri di folder ini..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        isContextual={isSelectionMode}
        selectedCount={selectedEntryIds.size}
        onContextualClose={() => {
          setIsSelectionMode(false);
          setSelectedEntryIds(new Set());
        }}
        contextualActions={contextualActions}
      />

      {/* Tag Cloud (Di bagian paling atas halaman folder rank maker ketika Tampilkan Tag aktif) */}
      {showTagCloud && (
        <div
          id="folder-tag-cloud"
          className="bg-[#1C1B18] px-4 py-2.5 border-b border-[#2B2926] flex items-center gap-2 overflow-x-auto scrollbar-none"
        >
          <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#9A8F84] font-medium mr-1">
            <TagIcon className="w-3.5 h-3.5 text-[#E0A458]" />
            <span>Tag:</span>
          </div>
          {tags.length === 0 ? (
            <span className="text-xs text-[#9A8F84] italic">Belum ada tag di folder ini</span>
          ) : (
            <div className="flex items-center flex-wrap gap-1.5">
              {tags.map((tag) => {
                const isSelected = filters.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    id={`tag-cloud-pill-${tag.id}`}
                    type="button"
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        tagIds: isSelected
                          ? prev.tagIds.filter((id) => id !== tag.id)
                          : [...prev.tagIds, tag.id],
                      }));
                      triggerHaptic('light');
                    }}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all shadow-sm ${
                      isSelected
                        ? 'bg-[#E0A458] text-[#361E00] font-bold ring-1 ring-[#FFDDB3]'
                        : 'bg-[#2B2926] text-[#D1C4B8] hover:text-[#E6E1DC] hover:bg-[#363430] border border-[#363430]'
                    }`}
                  >
                    <span>#{tag.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active In-Folder Search Navigation Bar */}
      {searchQuery && (
        <div className="bg-[#2B2926] px-4 py-2 border-b border-[#363430] flex items-center justify-between text-sm">
          <span className="text-[#D1C4B8]">
            {searchMatches.length > 0
              ? `${searchMatchIndex + 1} dari ${searchMatches.length} cocok`
              : 'Tidak ada kecocokan'}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setSearchMatchIndex((prev) =>
                  prev > 0 ? prev - 1 : Math.max(0, searchMatches.length - 1)
                )
              }
              className="p-1 rounded hover:bg-[#363430]"
              disabled={searchMatches.length <= 1}
            >
              <ArrowUp className="w-4 h-4 text-[#D1C4B8]" />
            </button>
            <button
              onClick={() =>
                setSearchMatchIndex((prev) =>
                  prev < searchMatches.length - 1 ? prev + 1 : 0
                )
              }
              className="p-1 rounded hover:bg-[#363430]"
              disabled={searchMatches.length <= 1}
            >
              <ArrowDown className="w-4 h-4 text-[#D1C4B8]" />
            </button>
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded hover:bg-[#363430] ml-2 text-[#9A8F84]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Chips Bar (Shown when active filters exist) */}
      {activeFilterCount > 0 && (
        <div className="h-12 bg-[#1C1B18] px-4 flex items-center gap-2 overflow-x-auto border-b border-[#2B2926]">
          <span className="text-xs text-[#9A8F84] font-medium shrink-0">Filter aktif:</span>
          {filters.tierIds.map((tId) => {
            const t = tiers.find((x) => x.id === tId);
            return (
              <span
                key={tId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#2B2926] text-[#E6E1DC] border border-[#363430] shrink-0"
              >
                Tier: {t?.label}
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, tierIds: f.tierIds.filter((x) => x !== tId) }))
                  }
                >
                  <X className="w-3 h-3 text-[#9A8F84] hover:text-white" />
                </button>
              </span>
            );
          })}
          {filters.tagIds.map((tagId) => {
            const tag = tags.find((x) => x.id === tagId);
            return (
              <span
                key={tagId}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#E0A458]/20 text-[#FFDDB3] border border-[#E0A458]/40 shrink-0"
              >
                #{tag?.name || 'Tag'}
                <button
                  onClick={() =>
                    setFilters((f) => ({ ...f, tagIds: f.tagIds.filter((x) => x !== tagId) }))
                  }
                >
                  <X className="w-3 h-3 text-[#FFDDB3] hover:text-white" />
                </button>
              </span>
            );
          })}
          {filters.hasNoteOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#2B2926] text-[#E6E1DC] border border-[#363430] shrink-0">
              Ada catatan
              <button onClick={() => setFilters((f) => ({ ...f, hasNoteOnly: false }))}>
                <X className="w-3 h-3 text-[#9A8F84] hover:text-white" />
              </button>
            </span>
          )}
          {filters.unassignedOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#2B2926] text-[#E6E1DC] border border-[#363430] shrink-0">
              Belum bertier
              <button onClick={() => setFilters((f) => ({ ...f, unassignedOnly: false }))}>
                <X className="w-3 h-3 text-[#9A8F84] hover:text-white" />
              </button>
            </span>
          )}
          <button
            onClick={() =>
              setFilters({
                tierIds: [],
                tagIds: [],
                tagMatchMode: 'any',
                hasNoteOnly: false,
                unassignedOnly: false,
              })
            }
            className="text-xs text-[#E0A458] hover:underline shrink-0 ml-1"
          >
            Reset Semua
          </button>
        </div>
      )}

      {/* Main Tier Rows List */}
      <main className="flex-1 flex flex-col">
        {tiers.map((tier) => {
          const tierEntries = entriesByTier.map.get(tier.id) || [];
          return (
            <TierRow
              key={tier.id}
              tier={tier}
              entries={tierEntries}
              thumbnailSize={thumbnailSize}
              titleDisplayMode={titleDisplayMode}
              rowLayoutMode={rowLayoutMode}
              selectedEntryIds={selectedEntryIds}
              draggingEntryId={draggingEntryId}
              draggingTierId={draggingTierId}
              isTierDropTarget={tierDropTargetId === tier.id}
              onEntryClick={handleEntryClick}
              onLabelClick={() => onNavigate({ type: 'tier_settings', folderId })}
              onEntryDragStart={handleEntryDragStart}
              onEntryDropInTier={handleEntryDropInTier}
              onTierDragStart={handleTierDragStart}
              onTierDragOver={handleTierDragOver}
              onTierDrop={handleTierDrop}
            />
          );
        })}

        {/* POOL Section ("Belum diberi tier") */}
        <section
          id="pool-section"
          className="mt-6 mx-2 sm:mx-4 rounded-xl bg-[#1C1B18] border border-[#2B2926] overflow-hidden"
          onDragOver={(e) => {
            e.preventDefault();
            if (draggingEntryId) {
              e.dataTransfer.dropEffect = 'move';
              setPoolHovered(true);
            }
          }}
          onDragLeave={() => setPoolHovered(false)}
          onDrop={(e) => {
            e.preventDefault();
            setPoolHovered(false);
            if (draggingEntryId) {
              handleEntryDropInPool(poolHoverIndex !== null ? poolHoverIndex : entriesByTier.pool.length);
              setPoolHoverIndex(null);
            }
          }}
        >
          <div
            onClick={() => setIsPoolCollapsed(!isPoolCollapsed)}
            className="h-12 px-4 flex items-center justify-between cursor-pointer select-none bg-[#211F1C] hover:bg-[#2B2926] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm sm:text-base text-[#E6E1DC]">
                Belum diberi tier ({entriesByTier.pool.length})
              </span>
              <span className="text-xs text-[#9A8F84] hidden sm:inline">
                • Seret item ke sini untuk mengembalikannya ke Pool
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedEntryIds(new Set());
                }}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  isSelectionMode
                    ? 'bg-[#E0A458] text-[#4A2A00] font-bold'
                    : 'bg-[#2B2926] text-[#D1C4B8] hover:bg-[#363430]'
                }`}
              >
                {isSelectionMode ? 'Selesai Pilih' : 'Pilih Banyak'}
              </button>
              {isPoolCollapsed ? (
                <ChevronDown className="w-5 h-5 text-[#9A8F84]" />
              ) : (
                <ChevronUp className="w-5 h-5 text-[#9A8F84]" />
              )}
            </div>
          </div>

          {!isPoolCollapsed && (
            <div
              className={`p-3 min-h-[110px] transition-colors ${
                poolHovered ? 'bg-[#E0A458]/10 ring-2 ring-[#E0A458] ring-inset' : ''
              }`}
            >
              {entriesByTier.pool.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#9A8F84] italic">
                  Semua entri sudah ditempatkan di dalam tier.
                </div>
              ) : (
                <div className="flex flex-wrap items-start gap-2.5">
                  {entriesByTier.pool.map((entry, idx) => (
                    <div
                      key={entry.id}
                      onDragOver={(e) => {
                        e.stopPropagation();
                        setPoolHoverIndex(idx);
                      }}
                    >
                      <EntryCard
                        entry={entry}
                        thumbnailSize={thumbnailSize}
                        titleDisplayMode={titleDisplayMode}
                        isSelected={selectedEntryIds.has(entry.id)}
                        isDragging={draggingEntryId === entry.id}
                        onClick={() => handleEntryClick(entry)}
                        onDragStart={(e) => handleEntryDragStart(e, entry)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Floating Speed-Dial FAB */}
      <SpeedDialFAB
        onSelectFromGallery={() => {
          // File input trigger for gallery
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.multiple = true;
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
              Array.from(files).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (re) => {
                  const baseName = file.name.replace(/\.[^/.]+$/, '');
                  storage.createEntry(folderId, {
                    title: baseName || 'Gambar Baru',
                    imagePath: re.target?.result as string,
                    imageStatus: 'OK',
                    note: '',
                    position: Date.now(),
                    tierId: null,
                  });
                };
                reader.readAsDataURL(file);
              });
              triggerHaptic('medium');
            }
          };
          input.click();
        }}
        onTakePhoto={() => onNavigate({ type: 'entry_form', folderId })}
        onFromLink={() => onNavigate({ type: 'add_from_link', folderId })}
        onPasteClipboard={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text.startsWith('http://') || text.startsWith('https://')) {
              onNavigate({ type: 'add_from_link', folderId });
            } else if (text.trim()) {
              storage.createEntry(folderId, {
                title: text.slice(0, 40),
                note: text,
                imageStatus: 'NONE',
                position: Date.now(),
                tierId: null,
              });
              triggerHaptic('light');
            }
          } catch {
            onNavigate({ type: 'entry_form', folderId });
          }
        }}
        onTextOnly={() => onNavigate({ type: 'entry_form', folderId })}
      />

      {/* Filter Bottom Sheet */}
      <ModalBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Entri"
      >
        <div className="space-y-5">
          {/* Tiers Filter */}
          <div>
            <h3 className="text-sm font-medium text-[#D1C4B8] mb-2">Berdasarkan Tier</h3>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => {
                const active = filters.tierIds.includes(tier.id);
                return (
                  <button
                    key={tier.id}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        tierIds: active
                          ? prev.tierIds.filter((id) => id !== tier.id)
                          : [...prev.tierIds, tier.id],
                      }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      active
                        ? 'border-[#E0A458] text-[#141311] font-bold'
                        : 'border-[#363430] text-[#E6E1DC]'
                    }`}
                    style={{ backgroundColor: active ? tier.colorHex : 'transparent' }}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Filter */}
          {tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[#D1C4B8] mb-2">Berdasarkan Tag</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const active = filters.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          tagIds: active
                            ? prev.tagIds.filter((id) => id !== tag.id)
                            : [...prev.tagIds, tag.id],
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        active
                          ? 'bg-[#E0A458] border-[#E0A458] text-[#4A2A00]'
                          : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#2B2926]">
            <label
              id="filter-toggle-show-tags-container"
              className="flex items-center justify-between cursor-pointer py-1"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-[#E6E1DC]">Tampilkan Tag</span>
                <span className="text-xs text-[#9A8F84]">Tampilkan tag cloud di bagian atas halaman</span>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  id="filter-toggle-show-tags"
                  type="checkbox"
                  checked={showTagCloud}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setShowTagCloud(checked);
                    try {
                      localStorage.setItem(`folder_show_tags_${folderId}`, String(checked));
                    } catch {}
                    triggerHaptic('light');
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#363430] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#E6E1DC] after:border-[#363430] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E0A458] peer-checked:after:bg-[#141311]"></div>
              </div>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[#E6E1DC]">Hanya yang punya catatan</span>
              <input
                type="checkbox"
                checked={filters.hasNoteOnly}
                onChange={(e) => setFilters((f) => ({ ...f, hasNoteOnly: e.target.checked }))}
                className="w-5 h-5 accent-[#E0A458] rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-[#E6E1DC]">Hanya yang belum bertier (Pool)</span>
              <input
                type="checkbox"
                checked={filters.unassignedOnly}
                onChange={(e) => setFilters((f) => ({ ...f, unassignedOnly: e.target.checked }))}
                className="w-5 h-5 accent-[#E0A458] rounded"
              />
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2B2926]">
            <button
              onClick={() => {
                setFilters({
                  tierIds: [],
                  tagIds: [],
                  tagMatchMode: 'any',
                  hasNoteOnly: false,
                  unassignedOnly: false,
                });
                setIsFilterSheetOpen(false);
              }}
              className="px-4 py-2 text-sm text-[#D1C4B8] hover:text-[#E6E1DC]"
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterSheetOpen(false)}
              className="px-5 py-2 text-sm font-medium bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100] rounded-xl transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Ukuran & Tampilan Dialog */}
      <ModalBottomSheet
        isOpen={isDisplayDialogOpen}
        onClose={() => setIsDisplayDialogOpen(false)}
        title="Ukuran & Tampilan"
      >
        <div className="space-y-5">
          {/* Thumbnail Size */}
          <div>
            <label className="text-sm font-medium text-[#D1C4B8] block mb-2">
              Ukuran Thumbnail
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as ThumbnailSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setThumbnailSize(size);
                    storage.updateFolder(folderId, { thumbnailSize: size });
                  }}
                  className={`py-2 rounded-xl text-sm capitalize font-medium border transition-all ${
                    thumbnailSize === size
                      ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3]'
                      : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                  }`}
                >
                  {size === 'small' ? 'Kecil (72dp)' : size === 'medium' ? 'Sedang (96dp)' : 'Besar (128dp)'}
                </button>
              ))}
            </div>
          </div>

          {/* Title Display Mode */}
          <div>
            <label className="text-sm font-medium text-[#D1C4B8] block mb-2">
              Tampilan Judul
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['below', 'overlay', 'hidden'] as TitleDisplayMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setTitleDisplayMode(mode);
                    storage.updateFolder(folderId, { titleDisplayMode: mode });
                  }}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                    titleDisplayMode === mode
                      ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3]'
                      : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                  }`}
                >
                  {mode === 'below' ? 'Di Bawah' : mode === 'overlay' ? 'Overlay' : 'Sembunyi'}
                </button>
              ))}
            </div>
          </div>

          {/* Row Layout Mode */}
          <div>
            <label className="text-sm font-medium text-[#D1C4B8] block mb-2">
              Tata Letak Baris
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['scroll', 'wrap'] as RowLayoutMode[]).map((layout) => (
                <button
                  key={layout}
                  onClick={() => {
                    setRowLayoutMode(layout);
                    storage.updateFolder(folderId, { rowLayoutMode: layout });
                  }}
                  className={`py-2 rounded-xl text-sm font-medium border transition-all ${
                    rowLayoutMode === layout
                      ? 'bg-[#6B3F00] border-[#E0A458] text-[#FFDDB3]'
                      : 'bg-[#2B2926] border-[#363430] text-[#D1C4B8]'
                  }`}
                >
                  {layout === 'scroll' ? 'Scroll Horizontal' : 'Wrap (Turun Baris)'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => setIsDisplayDialogOpen(false)}
              className="px-5 py-2.5 bg-[#6B3F00] text-[#FFDDB3] rounded-xl text-sm font-medium"
            >
              Selesai
            </button>
          </div>
        </div>
      </ModalBottomSheet>

      {/* Pindahkan Ke Tier Dialog (for multi-select) */}
      <ModalBottomSheet
        isOpen={isMoveToDialogOpen}
        onClose={() => setIsMoveToDialogOpen(false)}
        title="Pindahkan ke Tier"
      >
        <div className="space-y-2">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => {
                selectedEntryIds.forEach((id) => {
                  storage.moveEntry(id, tier.id);
                });
                setSelectedEntryIds(new Set());
                setIsSelectionMode(false);
                setIsMoveToDialogOpen(false);
                triggerHaptic('medium');
              }}
              className="w-full p-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] flex items-center gap-3 transition-colors text-left"
            >
              <div
                className="w-6 h-6 rounded font-bold text-xs flex items-center justify-center text-black"
                style={{ backgroundColor: tier.colorHex }}
              >
                {tier.label.slice(0, 2)}
              </div>
              <span className="text-sm font-medium text-[#E6E1DC]">{tier.label}</span>
            </button>
          ))}

          <button
            onClick={() => {
              selectedEntryIds.forEach((id) => {
                storage.moveEntry(id, null);
              });
              setSelectedEntryIds(new Set());
              setIsSelectionMode(false);
              setIsMoveToDialogOpen(false);
              triggerHaptic('medium');
            }}
            className="w-full p-3 rounded-xl bg-[#2B2926] hover:bg-[#363430] flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-6 h-6 rounded bg-[#9A8F84]/40 text-xs flex items-center justify-center font-bold text-[#E6E1DC]">
              P
            </div>
            <span className="text-sm font-medium text-[#D1C4B8]">
              Belum diberi tier (Pool)
            </span>
          </button>
        </div>
      </ModalBottomSheet>

      {/* Ubah Nama Folder Dialog */}
      <ModalBottomSheet
        isOpen={isRenameDialogOpen}
        onClose={() => setIsRenameDialogOpen(false)}
        title="Ubah Nama Folder"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nama folder..."
            className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsRenameDialogOpen(false)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                if (newFolderName.trim()) {
                  storage.updateFolder(folderId, { name: newFolderName.trim() });
                  setIsRenameDialogOpen(false);
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
