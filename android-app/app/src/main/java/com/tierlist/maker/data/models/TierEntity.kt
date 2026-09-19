package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tiers")
data class TierEntity(
    @PrimaryKey val id: String,
    val folderId: String,
    val label: String,
    val colorHex: String,
    val sortOrder: Int,
    val iconName: String? = null
)
