export type ImageStatus = 'OK' | 'PENDING' | 'FAILED' | 'NONE';

export type ThumbnailSize = 'small' | 'medium' | 'large'; // 72dp, 96dp, 128dp
export type TitleDisplayMode = 'below' | 'overlay' | 'hidden';
export type RowLayoutMode = 'scroll' | 'wrap';

export interface FolderEntity {
  id: string;
  name: string;
  coverEntryId?: string | null;
  coverColor?: string | null;
  isPinned: boolean;
  isArchived: boolean;
  deletedAt?: number | null; // epoch ms
  createdAt: number;
  updatedAt: number;
  thumbnailSize: ThumbnailSize;
  titleDisplayMode: TitleDisplayMode;
  rowLayoutMode?: RowLayoutMode;
  backgroundColor?: string | null;
  backgroundImagePath?: string | null;
  sortOrder: number;
}

export interface TierEntity {
  id: string;
  folderId: string;
  label: string;
  colorHex: string;
  sortOrder: number;
  iconName?: string | null;
}

export interface EntryEntity {
  id: string;
  folderId: string;
  tierId: string | null; // null = pool ("Belum diberi tier")
  title: string;
  imagePath?: string | null;
  sourceUrl?: string | null;
  imageStatus: ImageStatus;
  note: string;
  score?: number | null; // 0 - 100
  position: number; // For ordering within tier or pool
  imageHash?: string | null;
  deletedAt?: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TagEntity {
  id: string;
  folderId: string;
  name: string;
  colorHex: string;
}

export interface EntryTagCrossRef {
  entryId: string;
  tagId: string;
}

export interface MoveHistoryEntity {
  id: string;
  entryId: string;
  fromTierId?: string | null;
  toTierId?: string | null;
  movedAt: number;
}

export interface SnapshotTierItem {
  id: string;
  label: string;
  colorHex: string;
  sortOrder: number;
}

export interface SnapshotEntryItem {
  id: string;
  title: string;
  tierId: string | null;
  position: number;
  score?: number | null;
}

export interface SnapshotDataJson {
  tiers: SnapshotTierItem[];
  entries: SnapshotEntryItem[];
}

export interface SnapshotEntity {
  id: string;
  folderId: string;
  name: string;
  createdAt: number;
  dataJson: string; // JSON of SnapshotDataJson
}

export interface TierTemplateEntity {
  id: string;
  name: string;
  tiersJson: string; // JSON array of { label: string; colorHex: string }
  isBuiltIn: boolean;
}

export interface DownloadJobEntity {
  id: string;
  folderId: string;
  url: string;
  targetTierId?: string | null;
  state: 'WAITING' | 'DOWNLOADING' | 'READY' | 'FAILED' | 'DUPLICATE';
  errorCode?: string | null;
  entryId?: string | null;
  title?: string;
  progress?: number;
  previewUrl?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  dynamicColor: boolean;
  language: 'id' | 'en';
  homeViewMode: 'grid' | 'list';
  defaultThumbnailSize: ThumbnailSize;
  defaultTitleDisplayMode: TitleDisplayMode;
  defaultRowLayoutMode: RowLayoutMode;
  hapticFeedback: boolean;
  defaultTierPreset: string;
  swipeInQuickRank: boolean;
  imageQuality: 'save_space' | 'balanced' | 'high';
  maxImageDimension: number;
  downloadWifiOnly: boolean;
  allowHttpLinks: boolean;
  trashRetentionDays: number;
}

// Navigation & Screen definitions
export type Screen =
  | { type: 'home' }
  | { type: 'tierlist'; folderId: string; highlightEntryId?: string }
  | { type: 'entry_form'; folderId: string; entryId?: string; prefillTierId?: string | null; prefillImageUrl?: string; prefillTitle?: string }
  | { type: 'add_from_link'; folderId: string; targetTierId?: string | null; returnToForm?: boolean }
  | { type: 'tier_settings'; folderId: string }
  | { type: 'quick_rank'; folderId: string; initialMode?: 'rate' | 'duel' }
  | { type: 'export_share'; folderId: string }
  | { type: 'snapshot_compare'; folderId: string; tab?: 'snapshots' | 'compare' }
  | { type: 'folder_stats'; folderId: string }
  | { type: 'trash_archive'; initialTab?: 'trash' | 'archive' }
  | { type: 'app_settings' };

// Filters for Tier List
export interface TierListFilter {
  tierIds: string[]; // empty = all
  tagIds: string[];
  tagMatchMode: 'all' | 'any';
  hasNoteOnly: boolean;
  unassignedOnly: boolean;
}

// Undo/Redo Action
export type UndoAction =
  | {
      type: 'MOVE_ENTRY';
      entryId: string;
      prevTierId: string | null;
      prevPosition: number;
      newTierId: string | null;
      newPosition: number;
    }
  | {
      type: 'DELETE_ENTRY';
      entry: EntryEntity;
    }
  | {
      type: 'REORDER_TIERS';
      prevTiers: TierEntity[];
      newTiers: TierEntity[];
    }
  | {
      type: 'SHUFFLE_POOL';
      prevPositions: { id: string; position: number }[];
    };
