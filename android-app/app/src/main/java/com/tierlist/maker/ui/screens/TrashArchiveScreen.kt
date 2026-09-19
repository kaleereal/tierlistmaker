package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.FolderEntity
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel
import kotlinx.coroutines.launch

@Composable
fun TrashArchiveScreen(
    initialTab: String = "trash",
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    var trashedFolders by remember { mutableStateOf<List<FolderEntity>>(emptyList()) }
    var archivedFolders by remember { mutableStateOf<List<FolderEntity>>(emptyList()) }
    var currentTab by remember { mutableStateOf(initialTab) }

    val coroutineScope = rememberCoroutineScope()

    fun refreshData() {
        coroutineScope.launch {
            trashedFolders = dao.getTrashedFolders()
            archivedFolders = dao.getArchivedFolders()
        }
    }

    LaunchedEffect(Unit) {
        refreshData()
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = if (currentTab == "trash") "Sampah" else "Arsip",
                onBackClick = onBackClick
            )
        },
        containerColor = BgDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
        ) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = currentTab == "trash",
                    onClick = { currentTab = "trash" },
                    label = { Text("Sampah (${trashedFolders.size})") },
                    modifier = Modifier.weight(1f)
                )
                FilterChip(
                    selected = currentTab == "archive",
                    onClick = { currentTab = "archive" },
                    label = { Text("Arsip (${archivedFolders.size})") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val currentList = if (currentTab == "trash") trashedFolders else archivedFolders

            if (currentList.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        if (currentTab == "trash") "Sampah kosong." else "Arsip kosong.",
                        color = TextMuted
                    )
                }
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(currentList, key = { it.id }) { folder ->
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
                                Text(
                                    folder.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = TextLight,
                                    modifier = Modifier.weight(1f)
                                )

                                if (currentTab == "trash") {
                                    IconButton(onClick = {
                                        coroutineScope.launch {
                                            viewModel.repository.restoreFolder(folder.id)
                                            refreshData()
                                        }
                                    }) {
                                        Icon(Icons.Default.Restore, contentDescription = "Pulihkan", tint = PrimaryGold)
                                    }
                                    IconButton(onClick = {
                                        coroutineScope.launch {
                                            viewModel.repository.deleteFolderPermanently(folder.id)
                                            refreshData()
                                        }
                                    }) {
                                        Icon(Icons.Default.Delete, contentDescription = "Hapus Permanen", tint = Color(0xFFFFB4AB))
                                    }
                                } else {
                                    IconButton(onClick = {
                                        viewModel.toggleArchiveFolder(folder.id)
                                        refreshData()
                                    }) {
                                        Icon(Icons.Default.Restore, contentDescription = "Buka Arsip", tint = PrimaryGold)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
