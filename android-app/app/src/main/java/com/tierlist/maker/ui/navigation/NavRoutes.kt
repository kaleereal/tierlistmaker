package com.tierlist.maker.ui.navigation

sealed class NavRoute(val route: String) {
    object Home : NavRoute("home")
    object TierList : NavRoute("tierlist/{folderId}?highlightEntryId={highlightEntryId}") {
        fun createRoute(folderId: String, highlightEntryId: String? = null): String {
            return if (highlightEntryId != null) {
                "tierlist/$folderId?highlightEntryId=$highlightEntryId"
            } else {
                "tierlist/$folderId"
            }
        }
    }
    object EntryForm : NavRoute("entry_form/{folderId}?entryId={entryId}&prefillTierId={prefillTierId}&prefillTitle={prefillTitle}&prefillImageUrl={prefillImageUrl}") {
        fun createRoute(
            folderId: String,
            entryId: String? = null,
            prefillTierId: String? = null,
            prefillTitle: String? = null,
            prefillImageUrl: String? = null
        ): String {
            var r = "entry_form/$folderId?"
            if (entryId != null) r += "entryId=$entryId&"
            if (prefillTierId != null) r += "prefillTierId=$prefillTierId&"
            if (prefillTitle != null) r += "prefillTitle=$prefillTitle&"
            if (prefillImageUrl != null) r += "prefillImageUrl=$prefillImageUrl&"
            return r.trimEnd('&', '?')
        }
    }
    object AddFromLink : NavRoute("add_from_link/{folderId}?targetTierId={targetTierId}") {
        fun createRoute(folderId: String, targetTierId: String? = null): String {
            return if (targetTierId != null) "add_from_link/$folderId?targetTierId=$targetTierId" else "add_from_link/$folderId"
        }
    }
    object TierSettings : NavRoute("tier_settings/{folderId}") {
        fun createRoute(folderId: String) = "tier_settings/$folderId"
    }
    object QuickRank : NavRoute("quick_rank/{folderId}?mode={mode}") {
        fun createRoute(folderId: String, mode: String = "rate") = "quick_rank/$folderId?mode=$mode"
    }
    object SnapshotCompare : NavRoute("snapshot_compare/{folderId}?tab={tab}") {
        fun createRoute(folderId: String, tab: String = "snapshots") = "snapshot_compare/$folderId?tab=$tab"
    }
    object FolderStats : NavRoute("folder_stats/{folderId}") {
        fun createRoute(folderId: String) = "folder_stats/$folderId"
    }
    object ExportShare : NavRoute("export_share/{folderId}") {
        fun createRoute(folderId: String) = "export_share/$folderId"
    }
    object TrashArchive : NavRoute("trash_archive?tab={tab}") {
        fun createRoute(tab: String = "trash") = "trash_archive?tab=$tab"
    }
    object AppSettings : NavRoute("app_settings")
}
