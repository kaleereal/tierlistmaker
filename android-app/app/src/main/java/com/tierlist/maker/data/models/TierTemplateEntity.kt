package com.tierlist.maker.data.models

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tier_templates")
data class TierTemplateEntity(
    @PrimaryKey val id: String,
    val name: String,
    val tiersJson: String,
    val isBuiltIn: Boolean = false
)
