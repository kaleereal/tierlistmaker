package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "snapshots")
data class SnapshotEntity(
    @PrimaryKey val id: String,
    val folderId: String,
    val name: String,
    val createdAt: Long = System.currentTimeMillis(),
    val dataJson: String
)
