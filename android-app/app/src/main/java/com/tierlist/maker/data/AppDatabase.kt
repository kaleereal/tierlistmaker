package com.tierlist.maker.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.tierlist.maker.data.dao.AppDao
import com.tierlist.maker.data.models.*

@Database(
    entities = [
        FolderEntity::class,
        TierEntity::class,
        EntryEntity::class,
        TagEntity::class,
        EntryTagCrossRef::class,
        MoveHistoryEntity::class,
        SnapshotEntity::class,
        TierTemplateEntity::class,
        AppSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {

    abstract fun appDao(): AppDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "tier_list_maker.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
