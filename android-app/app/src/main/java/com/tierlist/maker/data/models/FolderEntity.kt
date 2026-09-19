package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "folders")
data class FolderEntity(
    @PrimaryKey val id: String,
    val name: String,
    val coverEntryId: String? = null,
    val coverColor: String? = "#E0A458",
    val isPinned: Boolean = false,
    val isArchived: Boolean = false,
    val deletedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis(),
    val thumbnailSize: String = "medium", // small, medium, large
    val titleDisplayMode: String = "below", // below, overlay, hidden
    val rowLayoutMode: String = "scroll", // scroll, wrap
    val backgroundColor: String? = null,
    val backgroundImagePath: String? = null,
    val sortOrder: Int = 0
)
