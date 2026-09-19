package com.tierlist.maker.data.models

import androidx.room.Entity

@Entity(tableName = "entry_tag_cross_ref", primaryKeys = ["entryId", "tagId"])
data class EntryTagCrossRef(
    val entryId: String,
    val tagId: String
)
