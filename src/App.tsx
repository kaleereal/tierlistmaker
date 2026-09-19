import React, { useState } from 'react';
import { Screen } from './types';
import { HomePage } from './components/home/HomePage';
import { TierListPage } from './components/tierlist/TierListPage';
import { EntryFormPage } from './components/entry/EntryFormPage';
import { EntryDetailSheet } from './components/entry/EntryDetailSheet';
import { AddFromLinkPage } from './components/link/AddFromLinkPage';
import { TierSettingsPage } from './components/tier/TierSettingsPage';
import { QuickRankPage } from './components/quickrank/QuickRankPage';
import { StatsPage } from './components/stats/StatsPage';
import { ExportSharePage } from './components/export/ExportSharePage';
import { TrashArchivePage } from './components/trash/TrashArchivePage';
import { AppSettingsPage } from './components/settings/AppSettingsPage';
import { SnapshotComparePage } from './components/snapshot/SnapshotComparePage';

export default function App() {
  const [history, setHistory] = useState<Screen[]>([{ type: 'home' }]);
  const [detailEntryId, setDetailEntryId] = useState<string | null>(null);

  const currentScreen = history[history.length - 1] || { type: 'home' };

  const navigateTo = (screen: Screen) => {
    setHistory((prev) => [...prev, screen]);
  };

  const handleBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    } else {
      setHistory([{ type: 'home' }]);
    }
  };

  return (
    <div className="min-h-screen bg-[#141311] text-[#E6E1DC] font-sans antialiased selection:bg-[#E0A458] selection:text-[#4A2A00]">
      {currentScreen.type === 'home' && (
        <HomePage onNavigate={navigateTo} />
      )}

      {currentScreen.type === 'tierlist' && (
        <TierListPage
          folderId={currentScreen.folderId}
          highlightEntryId={currentScreen.highlightEntryId}
          onNavigate={navigateTo}
          onBack={handleBack}
          onOpenEntryDetail={(id) => setDetailEntryId(id)}
        />
      )}

      {currentScreen.type === 'entry_form' && (
        <EntryFormPage
          folderId={currentScreen.folderId}
          entryId={currentScreen.entryId}
          prefillTierId={currentScreen.prefillTierId}
          prefillImageUrl={currentScreen.prefillImageUrl}
          prefillTitle={currentScreen.prefillTitle}
          onBack={handleBack}
          onSaved={(entry) => {
            handleBack();
          }}
        />
      )}

      {currentScreen.type === 'add_from_link' && (
        <AddFromLinkPage
          folderId={currentScreen.folderId}
          targetTierId={currentScreen.targetTierId}
          returnToForm={currentScreen.returnToForm}
          onBack={handleBack}
          onSuccess={() => {
            handleBack();
          }}
        />
      )}

      {currentScreen.type === 'tier_settings' && (
        <TierSettingsPage
          folderId={currentScreen.folderId}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'quick_rank' && (
        <QuickRankPage
          folderId={currentScreen.folderId}
          initialMode={currentScreen.initialMode}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'folder_stats' && (
        <StatsPage
          folderId={currentScreen.folderId}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'export_share' && (
        <ExportSharePage
          folderId={currentScreen.folderId}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'snapshot_compare' && (
        <SnapshotComparePage
          folderId={currentScreen.folderId}
          initialTab={currentScreen.tab}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'trash_archive' && (
        <TrashArchivePage
          initialTab={currentScreen.initialTab}
          onBack={handleBack}
        />
      )}

      {currentScreen.type === 'app_settings' && (
        <AppSettingsPage onBack={handleBack} />
      )}

      {/* Global Entry Detail Modal Sheet */}
      <EntryDetailSheet
        entryId={detailEntryId}
        onClose={() => setDetailEntryId(null)}
        onNavigate={navigateTo}
      />
    </div>
  );
}
