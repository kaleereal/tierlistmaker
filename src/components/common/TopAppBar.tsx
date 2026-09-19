import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, MoreVertical, X, Check, ChevronDown, ChevronRight } from 'lucide-react';

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  children?: MenuItem[];
}

interface TopAppBarProps {
  title: string;
  onBack?: () => void;
  actions?: ActionItem[];
  menuItems?: MenuItem[];
  // Search integration
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchClose?: () => void;
  // Multi-select Contextual bar mode
  isContextual?: boolean;
  selectedCount?: number;
  onContextualClose?: () => void;
  contextualActions?: ActionItem[];
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  onBack,
  actions = [],
  menuItems = [],
  showSearch = false,
  searchPlaceholder = 'Cari...',
  searchValue = '',
  onSearchChange,
  onSearchClose,
  isContextual = false,
  selectedCount = 0,
  onContextualClose,
  contextualActions = [],
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setExpandedItemId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching]);

  // Contextual Bar Mode (multi-select)
  if (isContextual) {
    return (
      <header className="sticky top-0 z-40 h-16 w-full bg-[#2B2926] border-b border-[#363430] flex items-center justify-between px-3 text-[#E6E1DC] transition-all">
        <div className="flex items-center gap-3">
          <button
            id="btn-contextual-close"
            type="button"
            onClick={onContextualClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#363430] transition-colors"
            title="Batal seleksi"
          >
            <X className="w-6 h-6 text-[#E6E1DC]" />
          </button>
          <span className="text-lg font-medium tracking-wide">
            {selectedCount} dipilih
          </span>
        </div>
        <div className="flex items-center gap-1">
          {contextualActions.map((action) => (
            <button
              id={`btn-ctx-${action.id}`}
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              title={action.label}
              className={`p-2 rounded-full hover:bg-[#363430] transition-colors ${
                action.disabled ? 'opacity-40 cursor-not-allowed' : 'text-[#E6E1DC]'
              }`}
            >
              {action.icon}
            </button>
          ))}
        </div>
      </header>
    );
  }

  // Active in-bar Search Mode
  if (isSearching) {
    return (
      <header className="sticky top-0 z-40 h-16 w-full bg-[#211F1C] border-b border-[#363430] flex items-center px-3 gap-2 text-[#E6E1DC]">
        <button
          id="btn-search-back"
          type="button"
          onClick={() => {
            setIsSearching(false);
            if (onSearchClose) onSearchClose();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#2B2926] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#D1C4B8]" />
        </button>
        <div className="flex-1 flex items-center bg-[#2B2926] rounded-full px-4 py-1.5 border border-[#363430]">
          <Search className="w-4 h-4 text-[#9A8F84] mr-2 shrink-0" />
          <input
            id="input-top-search"
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full bg-transparent text-sm text-[#E6E1DC] placeholder-[#9A8F84] focus:outline-none"
          />
          {searchValue && (
            <button
              id="btn-search-clear"
              type="button"
              onClick={() => onSearchChange && onSearchChange('')}
              className="p-1 text-[#9A8F84] hover:text-[#E6E1DC]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 h-16 w-full bg-[#141311]/90 backdrop-blur-md border-b border-[#211F1C] flex items-center justify-between px-3 text-[#E6E1DC] transition-colors">
      <div className="flex items-center gap-2 overflow-hidden max-w-[65%] sm:max-w-[75%]">
        {onBack && (
          <button
            id="btn-top-back"
            type="button"
            onClick={onBack}
            className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center hover:bg-[#211F1C] transition-colors text-[#D1C4B8]"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl font-normal truncate tracking-tight text-[#E6E1DC]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {showSearch && (
          <button
            id="btn-top-search-open"
            type="button"
            onClick={() => setIsSearching(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#211F1C] transition-colors text-[#D1C4B8]"
            title="Cari"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {actions.map((act) => (
          <button
            id={`btn-act-${act.id}`}
            key={act.id}
            type="button"
            disabled={act.disabled}
            onClick={act.onClick}
            title={act.label}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              act.disabled
                ? 'opacity-35 cursor-not-allowed'
                : 'hover:bg-[#211F1C] text-[#D1C4B8] hover:text-[#E6E1DC]'
            }`}
          >
            {act.icon}
          </button>
        ))}

        {menuItems.length > 0 && (
          <div className="relative" ref={menuRef}>
            <button
              id="btn-top-overflow-menu"
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#211F1C] transition-colors text-[#D1C4B8]"
              title="Menu lainnya"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                id="dropdown-top-menu"
                className="absolute right-0 mt-1 w-60 bg-[#2B2926] border border-[#363430] rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-y-auto"
              >
                {menuItems.map((item) => {
                  const hasChildren = Boolean(item.children && item.children.length > 0);
                  const isExpanded = expandedItemId === item.id;

                  return (
                    <div key={item.id} className="w-full">
                      <button
                        id={`menu-item-${item.id}`}
                        type="button"
                        onClick={() => {
                          if (hasChildren) {
                            setExpandedItemId(isExpanded ? null : item.id);
                          } else {
                            setMenuOpen(false);
                            setExpandedItemId(null);
                            item.onClick?.();
                          }
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                          item.destructive
                            ? 'text-[#FFB4AB] hover:bg-[#93000A]/30'
                            : isExpanded
                            ? 'text-[#FFDDB3] bg-[#363430]'
                            : 'text-[#E6E1DC] hover:bg-[#363430]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.icon && <span className="w-5 h-5 shrink-0 opacity-80">{item.icon}</span>}
                          <span className="truncate">{item.label}</span>
                        </div>
                        {hasChildren && (
                          <span className="text-[#9A8F84] shrink-0 ml-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>
                        )}
                      </button>

                      {hasChildren && isExpanded && (
                        <div className="bg-[#1C1B18] py-1 border-y border-[#363430]/70 space-y-0.5">
                          {item.children!.map((sub) => (
                            <button
                              id={`menu-item-${sub.id}`}
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                setExpandedItemId(null);
                                sub.onClick?.();
                              }}
                              className="w-full flex items-center gap-3 pl-8 pr-4 py-2 text-sm text-left text-[#E6E1DC] hover:text-[#FFDDB3] hover:bg-[#2B2926] transition-colors"
                            >
                              {sub.icon && <span className="w-4 h-4 shrink-0 opacity-80">{sub.icon}</span>}
                              <span className="truncate">{sub.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
