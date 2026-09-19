package com.tierlist.maker.data.dao

import androidx.room.*
import com.tierlist.maker.data.models.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AppDao {

    // --- Folders ---
    @Query("SELECT * FROM folders WHERE deletedAt IS NULL AND isArchived = 0 ORDER BY sortOrder ASC, updatedAt DESC")
    fun getActiveFoldersFlow(): Flow<List<FolderEntity>>

    @Query("SELECT * FROM folders WHERE deletedAt IS NULL AND isArchived = 0 ORDER BY sortOrder ASC, updatedAt DESC")
    suspend fun getActiveFolders(): List<FolderEntity>

    @Query("SELECT * FROM folders WHERE id = :folderId LIMIT 1")
    suspend fun getFolderById(folderId: String): FolderEntity?

    @Query("SELECT * FROM folders WHERE id = :folderId LIMIT 1")
    fun getFolderByIdFlow(folderId: String): Flow<FolderEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertFolder(folder: FolderEntity)

    @Update
    suspend fun updateFolder(folder: FolderEntity)

    @Query("DELETE FROM folders WHERE id = :folderId")
    suspend fun deleteFolderPermanently(folderId: String)

    @Query("SELECT * FROM folders WHERE deletedAt IS NOT NULL")
    suspend fun getTrashedFolders(): List<FolderEntity>

    @Query("SELECT * FROM folders WHERE isArchived = 1 AND deletedAt IS NULL")
    suspend fun getArchivedFolders(): List<FolderEntity>

    // --- Tiers ---
    @Query("SELECT * FROM tiers WHERE folderId = :folderId ORDER BY sortOrder ASC")
    fun getTiersByFolderFlow(folderId: String): Flow<List<TierEntity>>

    @Query("SELECT * FROM tiers WHERE folderId = :folderId ORDER BY sortOrder ASC")
    suspend fun getTiersByFolder(folderId: String): List<TierEntity>

    @Query("SELECT * FROM tiers WHERE id = :tierId LIMIT 1")
    suspend fun getTierById(tierId: String): TierEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTiers(tiers: List<TierEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTier(tier: TierEntity)

    @Update
    suspend fun updateTier(tier: TierEntity)

    @Query("DELETE FROM tiers WHERE id = :tierId")
    suspend fun deleteTier(tierId: String)

    @Query("DELETE FROM tiers WHERE folderId = :folderId")
    suspend fun deleteTiersByFolder(folderId: String)

    // --- Entries ---
    @Query("SELECT * FROM entries WHERE folderId = :folderId AND deletedAt IS NULL ORDER BY position ASC, updatedAt DESC")
    fun getActiveEntriesByFolderFlow(folderId: String): Flow<List<EntryEntity>>

    @Query("SELECT * FROM entries WHERE folderId = :folderId AND deletedAt IS NULL ORDER BY position ASC, updatedAt DESC")
    suspend fun getActiveEntriesByFolder(folderId: String): List<EntryEntity>

    @Query("SELECT * FROM entries WHERE id = :entryId LIMIT 1")
    suspend fun getEntryById(entryId: String): EntryEntity?

    @Query("SELECT * FROM entries WHERE id = :entryId LIMIT 1")
    fun getEntryByIdFlow(entryId: String): Flow<EntryEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntry(entry: EntryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntries(entries: List<EntryEntity>)

    @Update
    suspend fun updateEntry(entry: EntryEntity)

    @Query("DELETE FROM entries WHERE id = :entryId")
    suspend fun deleteEntryPermanently(entryId: String)

    @Query("DELETE FROM entries WHERE folderId = :folderId")
    suspend fun deleteEntriesByFolder(folderId: String)

    @Query("SELECT * FROM entries WHERE deletedAt IS NOT NULL")
    suspend fun getTrashedEntries(): List<EntryEntity>

    // --- Tags ---
    @Query("SELECT * FROM tags WHERE folderId = :folderId")
    fun getTagsByFolderFlow(folderId: String): Flow<List<TagEntity>>

    @Query("SELECT * FROM tags WHERE folderId = :folderId")
    suspend fun getTagsByFolder(folderId: String): List<TagEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTag(tag: TagEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTags(tags: List<TagEntity>)

    @Query("DELETE FROM tags WHERE id = :tagId")
    suspend fun deleteTag(tagId: String)

    // --- Entry Tag Cross Ref ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEntryTagCrossRefs(refs: List<EntryTagCrossRef>)

    @Query("DELETE FROM entry_tag_cross_ref WHERE entryId = :entryId")
    suspend fun deleteEntryTagCrossRefsByEntry(entryId: String)

    @Query("SELECT tagId FROM entry_tag_cross_ref WHERE entryId = :entryId")
    suspend fun getTagIdsForEntry(entryId: String): List<String>

    @Query("SELECT entryId FROM entry_tag_cross_ref WHERE tagId = :tagId")
    suspend fun getEntryIdsForTag(tagId: String): List<String>

    // --- History ---
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMoveHistory(history: MoveHistoryEntity)

    @Query("SELECT * FROM move_history WHERE entryId = :entryId ORDER BY movedAt DESC")
    suspend fun getMoveHistory(entryId: String): List<MoveHistoryEntity>

    // --- Snapshots ---
    @Query("SELECT * FROM snapshots WHERE folderId = :folderId ORDER BY createdAt DESC")
    fun getSnapshotsByFolderFlow(folderId: String): Flow<List<SnapshotEntity>>

    @Query("SELECT * FROM snapshots WHERE folderId = :folderId ORDER BY createdAt DESC")
    suspend fun getSnapshotsByFolder(folderId: String): List<SnapshotEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSnapshot(snapshot: SnapshotEntity)

    @Query("DELETE FROM snapshots WHERE id = :snapshotId")
    suspend fun deleteSnapshot(snapshotId: String)

    // --- Templates ---
    @Query("SELECT * FROM tier_templates")
    fun getTemplatesFlow(): Flow<List<TierTemplateEntity>>

    @Query("SELECT * FROM tier_templates")
    suspend fun getTemplates(): List<TierTemplateEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplate(template: TierTemplateEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTemplates(templates: List<TierTemplateEntity>)

    @Query("DELETE FROM tier_templates WHERE id = :templateId AND isBuiltIn = 0")
    suspend fun deleteTemplate(templateId: String)

    // --- Settings ---
    @Query("SELECT * FROM app_settings WHERE id = 1 LIMIT 1")
    fun getSettingsFlow(): Flow<AppSettingsEntity?>

    @Query("SELECT * FROM app_settings WHERE id = 1 LIMIT 1")
    suspend fun getSettings(): AppSettingsEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSettings(settings: AppSettingsEntity)
}
