package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.SnapshotEntity
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel
import kotlinx.coroutines.launch

@Composable
fun SnapshotCompareScreen(
    folderId: String,
    initialTab: String = "snapshots",
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val snapshots by dao.getSnapshotsByFolderFlow(folderId).collectAsState(initial = emptyList())
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Snapshot & Riwayat",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = {
                    coroutineScope.launch {
                        val activeTiers = dao.getTiersByFolder(folderId)
                        val activeEntries = dao.getActiveEntriesByFolder(folderId)

                        val dataJson = "{\"tiers_count\":${activeTiers.size}, \"entries_count\":${activeEntries.size}}"
                        dao.insertSnapshot(
                            SnapshotEntity(
                                id = "snap_${System.currentTimeMillis()}",
                                folderId = folderId,
                                name = "Snapshot ${System.currentTimeMillis()}",
                                dataJson = dataJson
                            )
                        )
                    }
                },
                containerColor = PrimaryDarkGold,
                contentColor = TextGold
            ) {
                Icon(Icons.Default.Add, contentDescription = "Buat Snapshot")
            }
        },
        containerColor = BgDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            if (snapshots.isEmpty()) {
                Text(
                    "Belum ada snapshot yang disimpan. Buat snapshot untuk menyimpan versi tier list Anda.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMuted,
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(snapshots, key = { it.id }) { snap ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = CardDark),
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(snap.name, style = MaterialTheme.typography.titleSmall, color = TextLight)
                                    Text(snap.dataJson, style = MaterialTheme.typography.bodySmall, color = TextMuted)
                                }
                                IconButton(onClick = {
                                    coroutineScope.launch {
                                        dao.deleteSnapshot(snap.id)
                                    }
                                }) {
                                    Icon(Icons.Default.Restore, contentDescription = "Hapus", tint = TextMuted)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
