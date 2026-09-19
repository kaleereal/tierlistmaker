import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Tags,
  Check,
} from 'lucide-react';
import { TagEntity } from '../../types';
import { storage } from '../../services/storage';
import { SWATCH_COLORS, triggerHaptic } from '../../services/imageUtils';
import { ModalBottomSheet } from '../common/ModalBottomSheet';

interface TagManagementSheetProps {
  folderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectFilterTag?: (tagId: string) => void;
}

export const TagManagementSheet: React.FC<TagManagementSheetProps> = ({
  folderId,
  isOpen,
  onClose,
  onSelectFilterTag,
}) => {
  const [tags, setTags] = useState<TagEntity[]>(() => storage.getTags(folderId));

  // Edit / Add Tag Dialog
  const [editingTag, setEditingTag] = useState<TagEntity | null>(null);
  const [isNewTag, setIsNewTag] = useState(false);
  const [tagNameInput, setTagNameInput] = useState('');
  const [tagColorInput, setTagColorInput] = useState('#E0A458');

  // Refresh tags
  const refresh = () => {
    setTags(storage.getTags(folderId));
  };

  const handleOpenAdd = () => {
    setIsNewTag(true);
    setTagNameInput('');
    setTagColorInput(SWATCH_COLORS[tags.length % SWATCH_COLORS.length]);
    setEditingTag({
      id: `new_${Date.now()}`,
      folderId,
      name: '',
      colorHex: '#E0A458',
    });
  };

  const handleOpenEdit = (tag: TagEntity) => {
    setIsNewTag(false);
    setTagNameInput(tag.name);
    setTagColorInput(tag.colorHex || '#E0A458');
    setEditingTag(tag);
  };

  const handleSaveTag = () => {
    if (!tagNameInput.trim() || !editingTag) return;

    if (isNewTag) {
      storage.createTag(folderId, tagNameInput.trim(), tagColorInput);
    } else {
      storage.updateTag(editingTag.id, tagNameInput.trim(), tagColorInput);
    }

    setEditingTag(null);
    refresh();
    triggerHaptic('light');
  };

  const handleDeleteTag = (tag: TagEntity) => {
    const entryCount = storage.getEntriesByTag(folderId, tag.id).length;
    if (confirm(`Hapus tag "#${tag.name}"? Digunakan oleh ${entryCount} entri.`)) {
      storage.deleteTag(tag.id);
      refresh();
      triggerHaptic('medium');
    }
  };

  return (
    <>
      <ModalBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Kelola Tag"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9A8F84]">Daftar Tag ({tags.length})</span>
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-[#6B3F00] text-[#FFDDB3] hover:bg-[#8A5100] text-xs font-medium flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tag Baru</span>
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#9A8F84] italic">
              Belum ada tag di folder ini.
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {tags.map((tag) => {
                const count = storage.getEntriesByTag(folderId, tag.id).length;
                return (
                  <div
                    key={tag.id}
                    className="p-2.5 rounded-xl bg-[#211F1C] border border-[#2B2926] flex items-center justify-between gap-3"
                  >
                    <div
                      onClick={() => {
                        if (onSelectFilterTag) {
                          onSelectFilterTag(tag.id);
                          onClose();
                        }
                      }}
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                    >
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: tag.colorHex || '#E0A458' }}
                      />
                      <span className="text-sm font-medium text-[#E6E1DC] truncate">
                        #{tag.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#2B2926] text-[10px] text-[#D1C4B8]">
                        {count}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tag)}
                        className="p-1.5 rounded-full text-[#9A8F84] hover:text-[#E6E1DC] hover:bg-[#2B2926]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTag(tag)}
                        className="p-1.5 rounded-full text-[#9A8F84] hover:text-[#FFB4AB] hover:bg-[#93000A]/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ModalBottomSheet>

      {/* Edit / Add Tag Dialog */}
      <ModalBottomSheet
        isOpen={Boolean(editingTag)}
        onClose={() => setEditingTag(null)}
        title={isNewTag ? 'Tambah Tag Baru' : 'Ubah Tag'}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-1.5">
              Nama Tag
            </label>
            <input
              type="text"
              value={tagNameInput}
              onChange={(e) => setTagNameInput(e.target.value)}
              placeholder="Contoh: Horror, Wajib Main..."
              className="w-full p-3 rounded-xl bg-[#2B2926] border border-[#363430] text-sm text-[#E6E1DC] focus:outline-none focus:border-[#E0A458]"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[#D1C4B8] block mb-2">
              Warna Penanda Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {SWATCH_COLORS.slice(0, 12).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTagColorInput(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${
                    tagColorInput === c ? 'scale-115 border-white shadow' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#2B2926]">
            <button
              onClick={() => setEditingTag(null)}
              className="px-4 py-2 text-sm text-[#D1C4B8]"
            >
              Batal
            </button>
            <button
              onClick={handleSaveTag}
              disabled={!tagNameInput.trim()}
              className="px-5 py-2 rounded-xl bg-[#6B3F00] text-[#FFDDB3] font-medium text-sm disabled:opacity-40"
            >
              Simpan
            </button>
          </div>
        </div>
      </ModalBottomSheet>
    </>
  );
};
