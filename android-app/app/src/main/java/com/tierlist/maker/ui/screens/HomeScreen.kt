package com.tierlist.maker.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tierlist.maker.data.models.FolderEntity
import com.tierlist.maker.ui.components.AppBottomSheet
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.components.ColorPickerSwatches
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.utils.ColorUtils
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun HomeScreen(
    viewModel: MainViewModel,
    onNavigateToTierList: (String) -> Unit,
    onNavigateToTrashArchive: (String) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToExportShare: (String) -> Unit
) {
    val folders by viewModel.activeFolders.collectAsState()
    var viewMode by remember { mutableStateOf("grid") } // grid / list
    var searchQuery by remember { mutableStateOf("") }
    var isCreateOpen by remember { mutableStateOf(false) }
    var activeFolderForMenu by remember { mutableStateOf<FolderEntity?>(null) }

    val filteredFolders = remember(folders, searchQuery) {
        if (searchQuery.isBlank()) folders else folders.filter { it.name.contains(searchQuery, ignoreCase = true) }
    }

    val pinnedFolders = remember(filteredFolders) { filteredFolders.filter { it.isPinned } }
    val otherFolders = remember(filteredFolders) { filteredFolders.filter { !it.isPinned } }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Tier List Saya",
                showSearch = true,
                searchQuery = searchQuery,
                onSearchQueryChange = { searchQuery = it },
                searchPlaceholder = "Cari folder...",
                actions = {
                    IconButton(onClick = { viewMode = if (viewMode == "grid") "list" else "grid" }) {
                        Icon(
                            imageVector = if (viewMode == "grid") Icons.Default.List else Icons.Default.GridView,
                            contentDescription = "Tampilan",
                            tint = TextLight
                        )
                    }
                    var menuExpanded by remember { mutableStateOf(false) }
                    IconButton(onClick = { menuExpanded = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "Menu", tint = TextLight)
                    }
                    DropdownMenu(
                        expanded = menuExpanded,
                        onDismissRequest = { menuExpanded = false },
                        modifier = Modifier.background(CardDark)
                    ) {
                        DropdownMenuItem(
                            text = { Text("Sampah", color = TextLight) },
                            leadingIcon = { Icon(Icons.Default.Delete, contentDescription = null, tint = TextMuted) },
                            onClick = {
                                menuExpanded = false
                                onNavigateToTrashArchive("trash")
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Arsip", color = TextLight) },
                            leadingIcon = { Icon(Icons.Default.Archive, contentDescription = null, tint = TextMuted) },
                            onClick = {
                                menuExpanded = false
                                onNavigateToTrashArchive("archive")
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Pengaturan", color = TextLight) },
                            leadingIcon = { Icon(Icons.Default.Settings, contentDescription = null, tint = TextMuted) },
                            onClick = {
                                menuExpanded = false
                                onNavigateToSettings()
                            }
                        )
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isCreateOpen = true },
                containerColor = PrimaryDarkGold,
                contentColor = TextGold
            ) {
                Icon(Icons.Default.Add, contentDescription = "Folder Baru")
            }
        },
        containerColor = BgDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp)
        ) {
            if (filteredFolders.isEmpty()) {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        Icons.Default.Layers,
                        contentDescription = null,
                        tint = TextSubtle,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "Belum ada tier list",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextLight
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Buat folder pertama Anda untuk mulai meranking.",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextMuted
                    )
                    Spacer(modifier = Modifier.height(20.dp))
                    Button(
                        onClick = { isCreateOpen = true },
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Buat Folder Baru")
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(bottom = 80.dp, top = 8.dp)
                ) {
                    if (pinnedFolders.isNotEmpty()) {
                        item {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.PushPin, contentDescription = null, tint = PrimaryGold, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("DISEMATKAN", style = MaterialTheme.typography.labelMedium, color = PrimaryGold, fontWeight = FontWeight.Bold)
                            }
                        }
                        items(pinnedFolders, key = { it.id }) { folder ->
                            FolderCardItem(
                                folder = folder,
                                viewMode = viewMode,
                                onClick = { onNavigateToTierList(folder.id) },
                                onMoreClick = { activeFolderForMenu = folder }
                            )
                        }
                    }

                    if (otherFolders.isNotEmpty()) {
                        item {
                            Text("SEMUA FOLDER (${folders.size})", style = MaterialTheme.typography.labelMedium, color = TextMuted, fontWeight = FontWeight.Bold)
                        }
                        items(otherFolders, key = { it.id }) { folder ->
                            FolderCardItem(
                                folder = folder,
                                viewMode = viewMode,
                                onClick = { onNavigateToTierList(folder.id) },
                                onMoreClick = { activeFolderForMenu = folder }
                            )
                        }
                    }
                }
            }
        }
    }

    // Create Folder Sheet
    if (isCreateOpen) {
        var name by remember { mutableStateOf("") }
        var preset by remember { mutableStateOf("S-F") }
        var colorHex by remember { mutableStateOf("#E0A458") }

        AppBottomSheet(
            onDismissRequest = { isCreateOpen = false },
            title = "Folder Baru"
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Nama Folder") },
                placeholder = { Text("Contoh: Game Favorit 2024") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))
            Text("Preset Tier", style = MaterialTheme.typography.labelMedium, color = TextMuted)
            Spacer(modifier = Modifier.height(8.dp))

            val presets = listOf(
                "S-F" to "S, A, B, C, D, E, F",
                "A-F" to "A, B, C, D, E, F",
                "1-5" to "⭐⭐⭐⭐⭐ (1 - 5)",
                "opinion" to "Suka / Netral / Kurang"
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                presets.take(2).forEach { (pKey, pLabel) ->
                    FilterChip(
                        selected = preset == pKey,
                        onClick = { preset = pKey },
                        label = { Text(pKey, fontSize = 12.sp) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                presets.drop(2).forEach { (pKey, pLabel) ->
                    FilterChip(
                        selected = preset == pKey,
                        onClick = { preset = pKey },
                        label = { Text(pKey, fontSize = 12.sp) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            Text("Warna Cover", style = MaterialTheme.typography.labelMedium, color = TextMuted)
            Spacer(modifier = Modifier.height(8.dp))
            ColorPickerSwatches(selectedColorHex = colorHex, onColorSelected = { colorHex = it })

            Spacer(modifier = Modifier.height(24.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = { isCreateOpen = false }) {
                    Text("Batal", color = TextMuted)
                }
                Spacer(modifier = Modifier.width(8.dp))
                Button(
                    onClick = {
                        if (name.isNotBlank()) {
                            viewModel.createFolder(name, preset, colorHex) { newFolder ->
                                isCreateOpen = false
                                onNavigateToTierList(newFolder.id)
                            }
                        }
                    },
                    enabled = name.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold)
                ) {
                    Text("Buat")
                }
            }
        }
    }

    // Folder Actions Menu
    activeFolderForMenu?.let { folder ->
        AppBottomSheet(
            onDismissRequest = { activeFolderForMenu = null },
            title = folder.name
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                TextButton(
                    onClick = {
                        viewModel.togglePinFolder(folder.id)
                        activeFolderForMenu = null
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(if (folder.isPinned) Icons.Default.PushPin else Icons.Default.PushPin, contentDescription = null, tint = TextMuted)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(if (folder.isPinned) "Lepas Sematan" else "Sematkan ke Atas", color = TextLight, modifier = Modifier.weight(1f))
                }

                TextButton(
                    onClick = {
                        viewModel.duplicateFolder(folder.id)
                        activeFolderForMenu = null
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null, tint = TextMuted)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Duplikat Folder", color = TextLight, modifier = Modifier.weight(1f))
                }

                TextButton(
                    onClick = {
                        val fId = folder.id
                        activeFolderForMenu = null
                        onNavigateToExportShare(fId)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, tint = TextMuted)
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Ekspor & Bagikan", color = TextLight, modifier = Modifier.weight(1f))
                }

                TextButton(
                    onClick = {
                        viewModel.softDeleteFolder(folder.id)
                        activeFolderForMenu = null
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFFFB4AB))
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Hapus Folder", color = Color(0xFFFFB4AB), modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun FolderCardItem(
    folder: FolderEntity,
    viewMode: String,
    onClick: () -> Unit,
    onMoreClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardDark),
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, CardBorderDark, RoundedCornerShape(12.dp))
            .combinedClickable(
                onClick = onClick,
                onLongClick = onMoreClick
            )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(56.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(ColorUtils.parseColorHex(folder.coverColor))
            ) {
                Icon(
                    Icons.Default.Layers,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.8f),
                    modifier = Modifier
                        .size(28.dp)
                        .align(Alignment.Center)
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = folder.name,
                    style = MaterialTheme.typography.titleSmall,
                    color = TextLight,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = if (folder.isPinned) "Disematkan" else "Folder Tier List",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextMuted
                )
            }

            IconButton(onClick = onMoreClick) {
                Icon(Icons.Default.MoreVert, contentDescription = "Aksi", tint = TextSubtle)
            }
        }
    }
}
