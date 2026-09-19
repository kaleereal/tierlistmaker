package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "entries")
data class EntryEntity(
    @PrimaryKey val id: String,
    val folderId: String,
    val tierId: String? = null,
    val title: String,
    val imagePath: String? = null,
    val sourceUrl: String? = null,
    val imageStatus: String = "OK", // OK, PENDING, FAILED, NONE
    val note: String = "",
    val score: Int? = null,
    val position: Double = 0.0,
    val imageHash: String? = null,
    val deletedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
