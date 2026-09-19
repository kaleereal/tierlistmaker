package com.tierlist.maker.ui.viewmodel

import android.app.Application
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.TierListRepository
import com.tierlist.maker.data.models.*
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class MainViewModel(application: Application) : AndroidViewModel(application) {

    val repository: TierListRepository

    val activeFolders: StateFlow<List<FolderEntity>>
    val appSettings: StateFlow<AppSettingsEntity>

    init {
        val database = AppDatabase.getInstance(application)
        repository = TierListRepository(database.appDao())

        activeFolders = repository.activeFoldersFlow
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

        appSettings = repository.settingsFlow
            .map { it ?: AppSettingsEntity() }
            .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), AppSettingsEntity())

        viewModelScope.launch {
            repository.ensureInitialDataSeeded()
        }
    }

    fun triggerHaptic() {
        if (!appSettings.value.hapticFeedback) return
        try {
            val context = getApplication<Application>()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Application.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Application.VIBRATOR_SERVICE) as Vibrator
                @Suppress("DEPRECATION")
                vibrator.vibrate(20)
            }
        } catch (e: Exception) {
            // Ignore if vibration not supported or allowed
        }
    }

    // --- Folder operations ---
    fun createFolder(name: String, preset: String, colorHex: String, onCreated: (FolderEntity) -> Unit) {
        viewModelScope.launch {
            val folder = repository.createFolder(name, preset, colorHex)
            triggerHaptic()
            onCreated(folder)
        }
    }

    fun updateFolder(folder: FolderEntity) {
        viewModelScope.launch {
            repository.updateFolder(folder)
        }
    }

    fun togglePinFolder(folderId: String) {
        viewModelScope.launch {
            repository.togglePinFolder(folderId)
            triggerHaptic()
        }
    }

    fun toggleArchiveFolder(folderId: String) {
        viewModelScope.launch {
            repository.toggleArchiveFolder(folderId)
            triggerHaptic()
        }
    }

    fun softDeleteFolder(folderId: String) {
        viewModelScope.launch {
            repository.softDeleteFolder(folderId)
            triggerHaptic()
        }
    }

    fun duplicateFolder(folderId: String) {
        viewModelScope.launch {
            repository.duplicateFolder(folderId)
            triggerHaptic()
        }
    }

    // --- Tier Operations ---
    fun addTier(folderId: String, label: String, colorHex: String) {
        viewModelScope.launch {
            repository.addTier(folderId, label, colorHex)
            triggerHaptic()
        }
    }

    fun updateTier(tier: TierEntity) {
        viewModelScope.launch {
            repository.updateTier(tier)
        }
    }

    fun deleteTier(tierId: String, moveToPool: Boolean = true) {
        viewModelScope.launch {
            repository.deleteTier(tierId, moveToPool)
            triggerHaptic()
        }
    }

    fun reorderTiers(folderId: String, orderedTierIds: List<String>) {
        viewModelScope.launch {
            repository.reorderTiers(folderId, orderedTierIds)
        }
    }

    // --- Entry Operations ---
    fun saveEntry(
        entry: EntryEntity,
        tagNames: List<String>,
        onSaved: () -> Unit
    ) {
        viewModelScope.launch {
            val existing = repository.repositoryDao().getEntryById(entry.id)
            if (existing == null) {
                repository.createEntry(entry, tagNames)
            } else {
                repository.updateEntry(entry, tagNames)
            }
            triggerHaptic()
            onSaved()
        }
    }

    fun moveEntry(entryId: String, targetTierId: String?, newPosition: Double? = null) {
        viewModelScope.launch {
            repository.moveEntry(entryId, targetTierId, newPosition)
            triggerHaptic()
        }
    }

    fun softDeleteEntry(entryId: String) {
        viewModelScope.launch {
            repository.softDeleteEntry(entryId)
            triggerHaptic()
        }
    }

    fun duplicateEntry(entryId: String) {
        viewModelScope.launch {
            repository.duplicateEntry(entryId)
            triggerHaptic()
        }
    }

    fun shufflePool(folderId: String) {
        viewModelScope.launch {
            repository.shufflePool(folderId)
            triggerHaptic()
        }
    }

    fun updateSettings(settings: AppSettingsEntity) {
        viewModelScope.launch {
            repository.updateSettings(settings)
        }
    }

    private fun TierListRepository.repositoryDao() = AppDatabase.getInstance(getApplication()).appDao()
}
