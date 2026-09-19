package com.tierlist.maker.data

import android.content.Context
import com.google.gson.Gson
import com.tierlist.maker.data.dao.AppDao
import com.tierlist.maker.data.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext

class TierListRepository(private val dao: AppDao) {

    val activeFoldersFlow: Flow<List<FolderEntity>> = dao.getActiveFoldersFlow()
    val settingsFlow: Flow<AppSettingsEntity?> = dao.getSettingsFlow()

    suspend fun ensureInitialDataSeeded() = withContext(Dispatchers.IO) {
        val existingFolders = dao.getActiveFolders()
        if (existingFolders.isNotEmpty()) return@withContext

        val now = System.currentTimeMillis()
        val folder1Id = "folder_game_top"

        val folder1 = FolderEntity(
            id = folder1Id,
            name = "Game Terbaik Sepanjang Masa",
            coverColor = "#E0A458",
            isPinned = true,
            createdAt = now - 3600000L * 24 * 3,
            updatedAt = now,
            sortOrder = 0
        )

        val presetSF = listOf(
            Pair("S", "#F44336"),
            Pair("A", "#FF9800"),
            Pair("B", "#FFC107"),
            Pair("C", "#4CAF50"),
            Pair("D", "#2196F3"),
            Pair("E", "#3F51B5"),
            Pair("F", "#673AB7")
        )

        val tiers1 = presetSF.mapIndexed { idx, (label, color) ->
            TierEntity(
                id = "tier_${folder1Id}_$idx",
                folderId = folder1Id,
                label = label,
                colorHex = color,
                sortOrder = idx
            )
        }

        data class SampleEntry(
            val title: String,
            val tierIdx: Int?,
            val score: Int,
            val note: String,
            val imagePath: String,
            val tagNames: List<String>
        )

        val sampleEntries = listOf(
            SampleEntry("Elden Ring", 0, 98, "Masterpiece open-world dengan kebebasan eksplorasi dan boss fights yang tak tertandingi.", "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80", listOf("RPG", "Open World", "Souls")),
            SampleEntry("The Witcher 3: Wild Hunt", 0, 96, "Penceritaan terbaik, side quest luar biasa, dan soundtrack memukau.", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80", listOf("RPG", "Story Rich")),
            SampleEntry("Zelda: Breath of the Wild", 0, 97, "Fisika dan interaksi dunia yang revolusioner.", "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80", listOf("Adventure", "Nintendo")),
            SampleEntry("Red Dead Redemption 2", 1, 95, "Detail dunia paling imersif dalam sejarah video game, cerita Arthur Morgan sangat menyentuh.", "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80", listOf("Story Rich", "Open World")),
            SampleEntry("God of War Ragnarök", 1, 93, "Combat memuaskan, hubungan ayah-anak yang dieksekusi dengan sangat kuat.", "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80", listOf("Action", "Story Rich")),
            SampleEntry("Cyberpunk 2077", 2, 87, "Night City spektakuler setelah update 2.0 dan Phantom Liberty.", "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&q=80", listOf("RPG", "Sci-Fi")),
            SampleEntry("Hollow Knight", 2, 90, "Indie metroidvania dengan atmosfer misterius dan kontrol presisi.", "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80", listOf("Indie", "Metroidvania")),
            SampleEntry("Grand Theft Auto V", 3, 85, "Klasik seru untuk santai dan multiplayer, gameplay sandbox abadi.", "https://images.unsplash.com/photo-1580234811497-9df7fd2f357e?w=400&q=80", listOf("Open World", "Action")),
            SampleEntry("Monster Hunter: World", 4, 80, "Grinding seru bersama teman, tapi butuh komitmen waktu tinggi.", "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=400&q=80", listOf("Action", "Multiplayer")),
            SampleEntry("Balatro", null, 91, "Poker roguelike paling adiktif tahun ini.", "https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=400&q=80", listOf("Indie", "Roguelike")),
            SampleEntry("Starfield", null, 75, "Eksplorasi luar angkasa dengan banyak loading screen.", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80", listOf("RPG", "Sci-Fi")),
            SampleEntry("Palworld", null, 82, "Survival craft dengan monster, seru di awal.", "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&q=80", listOf("Survival", "Indie"))
        )

        val tagsMap = mapOf(
            "RPG" to TagEntity("tag_1", folder1Id, "RPG", "#E0A458"),
            "Open World" to TagEntity("tag_2", folder1Id, "Open World", "#4CAF50"),
            "Story Rich" to TagEntity("tag_3", folder1Id, "Story Rich", "#2196F3"),
            "Indie" to TagEntity("tag_4", folder1Id, "Indie", "#9C27B0"),
            "Action" to TagEntity("tag_5", folder1Id, "Action", "#F44336"),
            "Sci-Fi" to TagEntity("tag_6", folder1Id, "Sci-Fi", "#00BCD4")
        )

        val entries1 = mutableListOf<EntryEntity>()
        val crossRefs1 = mutableListOf<EntryTagCrossRef>()

        sampleEntries.forEachIndexed { idx, s ->
            val entryId = "entry_${folder1Id}_$idx"
            val tierId = if (s.tierIdx != null && s.tierIdx < tiers1.size) tiers1[s.tierIdx].id else null
            entries1.add(
                EntryEntity(
                    id = entryId,
                    folderId = folder1Id,
                    tierId = tierId,
                    title = s.title,
                    imagePath = s.imagePath,
                    sourceUrl = s.imagePath,
                    note = s.note,
                    score = s.score,
                    position = idx.toDouble(),
                    createdAt = now - (sampleEntries.size - idx) * 60000L,
                    updatedAt = now
                )
            )

            s.tagNames.forEach { tagName ->
                val tag = tagsMap[tagName]
                if (tag != null) {
                    crossRefs1.add(EntryTagCrossRef(entryId, tag.id))
                }
            }
        }

        // Folder 2
        val folder2Id = "folder_kuliner"
        val folder2 = FolderEntity(
            id = folder2Id,
            name = "Makanan Nusantara Terbaik",
            coverColor = "#F44336",
            createdAt = now - 3600000L * 24 * 7,
            updatedAt = now - 3600000L * 12,
            sortOrder = 1
        )

        val tiers2 = presetSF.mapIndexed { idx, (label, color) ->
            TierEntity(
                id = "tier_${folder2Id}_$idx",
                folderId = folder2Id,
                label = label,
                colorHex = color,
                sortOrder = idx
            )
        }

        val entries2 = listOf(
            EntryEntity(
                id = "entry_kuliner_1",
                folderId = folder2Id,
                tierId = tiers2[0].id,
                title = "Rendang Daging",
                imagePath = "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80",
                note = "Juara dunia kuliner terenak, kaya rempah dan gurih santan kelapa.",
                score = 99,
                position = 0.0,
                createdAt = now,
                updatedAt = now
            ),
            EntryEntity(
                id = "entry_kuliner_2",
                folderId = folder2Id,
                tierId = tiers2[0].id,
                title = "Sate Ayam Madura",
                imagePath = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80",
                note = "Bumbu kacang kental dengan kecap manis dan aroma bakaran arang.",
                score = 95,
                position = 1.0,
                createdAt = now,
                updatedAt = now
            ),
            EntryEntity(
                id = "entry_kuliner_3",
                folderId = folder2Id,
                tierId = tiers2[1].id,
                title = "Nasi Goreng Spesial",
                imagePath = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80",
                note = "Wajib pakai telur mata sapi dan acar segar.",
                score = 92,
                position = 0.0,
                createdAt = now,
                updatedAt = now
            ),
            EntryEntity(
                id = "entry_kuliner_4",
                folderId = folder2Id,
                tierId = null,
                title = "Bakso Malang Komplit",
                imagePath = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80",
                note = "Pangsit goreng renyah dan kuah kaldu sapi hangat.",
                score = 88,
                position = 0.0,
                createdAt = now,
                updatedAt = now
            )
        )

        // Templates
        val gson = Gson()
        val templates = listOf(
            TierTemplateEntity("tpl_sf", "S - F Standar", gson.toJson(presetSF.map { mapOf("label" to it.first, "colorHex" to it.second) }), true),
            TierTemplateEntity("tpl_af", "A - F Tradisional", gson.toJson(listOf("A" to "#F44336", "B" to "#FF9800", "C" to "#FFC107", "D" to "#4CAF50", "E" to "#2196F3", "F" to "#673AB7").map { mapOf("label" to it.first, "colorHex" to it.second) }), true),
            TierTemplateEntity("tpl_1_5", "Bintang 1 - 5", gson.toJson(listOf("⭐⭐⭐⭐⭐" to "#FFC107", "⭐⭐⭐⭐" to "#8BC34A", "⭐⭐⭐" to "#00BCD4", "⭐⭐" to "#FF9800", "⭐" to "#9E9E9E").map { mapOf("label" to it.first, "colorHex" to it.second) }), true),
            TierTemplateEntity("tpl_opinion", "Suka / Netral / Tidak Suka", gson.toJson(listOf("Suka Banget" to "#4CAF50", "Netral" to "#FFC107", "Kurang Suka" to "#F44336").map { mapOf("label" to it.first, "colorHex" to it.second) }), true)
        )

        // Settings
        val settings = AppSettingsEntity()

        dao.insertFolder(folder1)
        dao.insertFolder(folder2)
        dao.insertTiers(tiers1)
        dao.insertTiers(tiers2)
        dao.insertEntries(entries1)
        dao.insertEntries(entries2)
        dao.insertTags(tagsMap.values.toList())
        dao.insertEntryTagCrossRefs(crossRefs1)
        dao.insertTemplates(templates)
        dao.insertSettings(settings)
    }

    // --- Folder CRUD ---
    suspend fun createFolder(name: String, preset: String, colorHex: String): FolderEntity = withContext(Dispatchers.IO) {
        val now = System.currentTimeMillis()
        val id = "folder_$now"
        val currentFolders = dao.getActiveFolders()
        val settings = dao.getSettings() ?: AppSettingsEntity()

        val folder = FolderEntity(
            id = id,
            name = name.ifBlank { "Folder Baru" },
            coverColor = colorHex,
            createdAt = now,
            updatedAt = now,
            thumbnailSize = settings.defaultThumbnailSize,
            titleDisplayMode = settings.defaultTitleDisplayMode,
            rowLayoutMode = settings.defaultRowLayoutMode,
            sortOrder = currentFolders.size
        )

        val presetList = when (preset) {
            "A-F" -> listOf(
                Pair("A", "#F44336"), Pair("B", "#FF9800"), Pair("C", "#FFC107"),
                Pair("D", "#4CAF50"), Pair("E", "#2196F3"), Pair("F", "#673AB7")
            )
            "1-5" -> listOf(
                Pair("⭐⭐⭐⭐⭐", "#FFC107"), Pair("⭐⭐⭐⭐", "#8BC34A"), Pair("⭐⭐⭐", "#00BCD4"),
                Pair("⭐⭐", "#FF9800"), Pair("⭐", "#9E9E9E")
            )
            "opinion" -> listOf(
                Pair("Suka Banget", "#4CAF50"), Pair("Netral", "#FFC107"), Pair("Kurang Suka", "#F44336")
            )
            else -> listOf(
                Pair("S", "#F44336"), Pair("A", "#FF9800"), Pair("B", "#FFC107"),
                Pair("C", "#4CAF50"), Pair("D", "#2196F3"), Pair("E", "#3F51B5"), Pair("F", "#673AB7")
            )
        }

        val tiers = presetList.mapIndexed { idx, (label, col) ->
            TierEntity(
                id = "tier_${id}_$idx",
                folderId = id,
                label = label,
                colorHex = col,
                sortOrder = idx
            )
        }

        dao.insertFolder(folder)
        dao.insertTiers(tiers)
        folder
    }

    suspend fun updateFolder(folder: FolderEntity) = withContext(Dispatchers.IO) {
        dao.updateFolder(folder.copy(updatedAt = System.currentTimeMillis()))
    }

    suspend fun togglePinFolder(folderId: String) = withContext(Dispatchers.IO) {
        val folder = dao.getFolderById(folderId) ?: return@withContext
        dao.updateFolder(folder.copy(isPinned = !folder.isPinned, updatedAt = System.currentTimeMillis()))
    }

    suspend fun toggleArchiveFolder(folderId: String) = withContext(Dispatchers.IO) {
        val folder = dao.getFolderById(folderId) ?: return@withContext
        dao.updateFolder(folder.copy(isArchived = !folder.isArchived, updatedAt = System.currentTimeMillis()))
    }

    suspend fun softDeleteFolder(folderId: String) = withContext(Dispatchers.IO) {
        val folder = dao.getFolderById(folderId) ?: return@withContext
        val now = System.currentTimeMillis()
        dao.updateFolder(folder.copy(deletedAt = now))
        val entries = dao.getActiveEntriesByFolder(folderId)
        entries.forEach { dao.updateEntry(it.copy(deletedAt = now)) }
    }

    suspend fun restoreFolder(folderId: String) = withContext(Dispatchers.IO) {
        val folder = dao.getFolderById(folderId) ?: return@withContext
        dao.updateFolder(folder.copy(deletedAt = null))
    }

    suspend fun deleteFolderPermanently(folderId: String) = withContext(Dispatchers.IO) {
        dao.deleteFolderPermanently(folderId)
        dao.deleteTiersByFolder(folderId)
        dao.deleteEntriesByFolder(folderId)
    }

    suspend fun duplicateFolder(folderId: String): FolderEntity? = withContext(Dispatchers.IO) {
        val original = dao.getFolderById(folderId) ?: return@withContext null
        val now = System.currentTimeMillis()
        val newFolderId = "folder_$now"
        val duplicatedFolder = original.copy(
            id = newFolderId,
            name = "${original.name} (Salinan)",
            createdAt = now,
            updatedAt = now,
            isPinned = false,
            sortOrder = dao.getActiveFolders().size
        )

        val originalTiers = dao.getTiersByFolder(folderId)
        val tierIdMap = mutableMapOf<String, String>()
        val duplicatedTiers = originalTiers.mapIndexed { idx, t ->
            val newTierId = "tier_${newFolderId}_$idx"
            tierIdMap[t.id] = newTierId
            t.copy(id = newTierId, folderId = newFolderId)
        }

        val originalEntries = dao.getActiveEntriesByFolder(folderId)
        val duplicatedEntries = originalEntries.mapIndexed { idx, e ->
            e.copy(
                id = "entry_${newFolderId}_$idx",
                folderId = newFolderId,
                tierId = e.tierId?.let { tierIdMap[it] },
                createdAt = now,
                updatedAt = now
            )
        }

        dao.insertFolder(duplicatedFolder)
        dao.insertTiers(duplicatedTiers)
        dao.insertEntries(duplicatedEntries)
        duplicatedFolder
    }

    // --- Tier Operations ---
    suspend fun addTier(folderId: String, label: String, colorHex: String): TierEntity = withContext(Dispatchers.IO) {
        val existing = dao.getTiersByFolder(folderId)
        val newTier = TierEntity(
            id = "tier_${folderId}_${System.currentTimeMillis()}",
            folderId = folderId,
            label = label.ifBlank { "Tier" },
            colorHex = colorHex,
            sortOrder = existing.size
        )
        dao.insertTier(newTier)
        newTier
    }

    suspend fun updateTier(tier: TierEntity) = withContext(Dispatchers.IO) {
        dao.updateTier(tier)
    }

    suspend fun deleteTier(tierId: String, moveToPool: Boolean = true) = withContext(Dispatchers.IO) {
        val tier = dao.getTierById(tierId) ?: return@withContext
        if (moveToPool) {
            val entries = dao.getActiveEntriesByFolder(tier.folderId)
            entries.filter { it.tierId == tierId }.forEach {
                dao.updateEntry(it.copy(tierId = null, position = System.currentTimeMillis().toDouble()))
            }
        }
        dao.deleteTier(tierId)
    }

    suspend fun reorderTiers(folderId: String, orderedTierIds: List<String>) = withContext(Dispatchers.IO) {
        orderedTierIds.forEachIndexed { idx, id ->
            val tier = dao.getTierById(id)
            if (tier != null) {
                dao.updateTier(tier.copy(sortOrder = idx))
            }
        }
    }

    // --- Entry Operations ---
    suspend fun createEntry(entry: EntryEntity, tagNames: List<String> = emptyList()): EntryEntity = withContext(Dispatchers.IO) {
        dao.insertEntry(entry)
        setEntryTags(entry.folderId, entry.id, tagNames)
        entry
    }

    suspend fun updateEntry(entry: EntryEntity, tagNames: List<String>? = null) = withContext(Dispatchers.IO) {
        dao.updateEntry(entry.copy(updatedAt = System.currentTimeMillis()))
        if (tagNames != null) {
            setEntryTags(entry.folderId, entry.id, tagNames)
        }
    }

    suspend fun moveEntry(entryId: String, targetTierId: String?, newPosition: Double? = null) = withContext(Dispatchers.IO) {
        val entry = dao.getEntryById(entryId) ?: return@withContext
        val prevTierId = entry.tierId
        val finalPos = newPosition ?: run {
            val siblings = dao.getActiveEntriesByFolder(entry.folderId).filter { it.tierId == targetTierId && it.id != entryId }
            if (siblings.isNotEmpty()) siblings.maxOf { it.position } + 1.0 else 0.0
        }
        dao.updateEntry(entry.copy(tierId = targetTierId, position = finalPos, updatedAt = System.currentTimeMillis()))

        dao.insertMoveHistory(
            MoveHistoryEntity(
                id = "history_${System.currentTimeMillis()}",
                entryId = entryId,
                fromTierId = prevTierId,
                toTierId = targetTierId
            )
        )
    }

    suspend fun softDeleteEntry(entryId: String) = withContext(Dispatchers.IO) {
        val entry = dao.getEntryById(entryId) ?: return@withContext
        dao.updateEntry(entry.copy(deletedAt = System.currentTimeMillis()))
    }

    suspend fun restoreEntry(entryId: String) = withContext(Dispatchers.IO) {
        val entry = dao.getEntryById(entryId) ?: return@withContext
        dao.updateEntry(entry.copy(deletedAt = null))
    }

    suspend fun deleteEntryPermanently(entryId: String) = withContext(Dispatchers.IO) {
        dao.deleteEntryPermanently(entryId)
        dao.deleteEntryTagCrossRefsByEntry(entryId)
    }

    suspend fun duplicateEntry(entryId: String): EntryEntity? = withContext(Dispatchers.IO) {
        val original = dao.getEntryById(entryId) ?: return@withContext null
        val now = System.currentTimeMillis()
        val newId = "entry_${now}_${(100..999).random()}"
        val duplicated = original.copy(
            id = newId,
            title = "${original.title} (Salinan)",
            position = original.position + 0.1,
            createdAt = now,
            updatedAt = now
        )
        dao.insertEntry(duplicated)
        val tagIds = dao.getTagIdsForEntry(entryId)
        val refs = tagIds.map { EntryTagCrossRef(newId, it) }
        dao.insertEntryTagCrossRefs(refs)
        duplicated
    }

    suspend fun shufflePool(folderId: String) = withContext(Dispatchers.IO) {
        val pool = dao.getActiveEntriesByFolder(folderId).filter { it.tierId == null }.shuffled()
        pool.forEachIndexed { idx, e ->
            dao.updateEntry(e.copy(position = idx.toDouble(), updatedAt = System.currentTimeMillis()))
        }
    }

    // --- Tags ---
    suspend fun setEntryTags(folderId: String, entryId: String, tagNames: List<String>) = withContext(Dispatchers.IO) {
        dao.deleteEntryTagCrossRefsByEntry(entryId)
        val existingFolderTags = dao.getTagsByFolder(folderId).associateBy { it.name.lowercase() }
        val refs = mutableListOf<EntryTagCrossRef>()

        tagNames.forEach { raw ->
            val name = raw.trim()
            if (name.isNotEmpty()) {
                val tag = existingFolderTags[name.lowercase()] ?: run {
                    val newTag = TagEntity(
                        id = "tag_${System.currentTimeMillis()}_${(100..999).random()}",
                        folderId = folderId,
                        name = name,
                        colorHex = "#E0A458"
                    )
                    dao.insertTag(newTag)
                    newTag
                }
                refs.add(EntryTagCrossRef(entryId, tag.id))
            }
        }
        dao.insertEntryTagCrossRefs(refs)
    }

    // --- Settings ---
    suspend fun updateSettings(settings: AppSettingsEntity) = withContext(Dispatchers.IO) {
        dao.insertSettings(settings)
    }
}
