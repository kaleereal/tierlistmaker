package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val theme: String = "dark",
    val dynamicColor: Boolean = false,
    val language: String = "id",
    val homeViewMode: String = "grid",
    val defaultThumbnailSize: String = "medium",
    val defaultTitleDisplayMode: String = "below",
    val defaultRowLayoutMode: String = "scroll",
    val hapticFeedback: Boolean = true,
    val defaultTierPreset: String = "S-F",
    val swipeInQuickRank: Boolean = true,
    val imageQuality: String = "balanced",
    val maxImageDimension: Int = 1200,
    val downloadWifiOnly: Boolean = false,
    val allowHttpLinks: Boolean = false,
    val trashRetentionDays: Int = 30
)
