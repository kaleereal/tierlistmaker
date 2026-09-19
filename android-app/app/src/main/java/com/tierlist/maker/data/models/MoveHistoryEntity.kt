package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "move_history")
data class MoveHistoryEntity(
    @PrimaryKey val id: String,
    val entryId: String,
    val fromTierId: String? = null,
    val toTierId: String? = null,
    val movedAt: Long = System.currentTimeMillis()
)
