package com.tierlist.maker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.EntryEntity
import com.tierlist.maker.data.models.FolderEntity
import com.tierlist.maker.data.models.TierEntity
import com.tierlist.maker.ui.components.AppBottomSheet
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.utils.ColorUtils
import com.tierlist.maker.ui.viewmodel.MainViewModel
import kotlinx.coroutines.flow.map

@Composable
fun TierListScreen(
    folderId: String,
    highlightEntryId: String? = null,
    viewModel: MainViewModel,
    onBackClick: () -> Unit,
    onNavigateToEntryForm: (String, String?) -> Unit,
    onNavigateToAddFromLink: (String) -> Unit,
    onNavigateToTierSettings: (String) -> Unit,
    onNavigateToQuickRank: (String) -> Unit,
    onNavigateToSnapshots: (String) -> Unit,
    onNavigateToStats: (String) -> Unit,
    onNavigateToExport: (String) -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val folderState by dao.getFolderByIdFlow(folderId).collectAsState(initial = null)
    val tiersState by dao.getTiersByFolderFlow(folderId).collectAsState(initial = emptyList())
    val entriesState by dao.getActiveEntriesByFolderFlow(folderId).collectAsState(initial = emptyList())

    val poolEntries = remember(entriesState) { entriesState.filter { it.tierId == null } }
    var selectedEntryForMove by remember { mutableStateOf<EntryEntity?>(null) }
    var searchQuery by remember { mutableStateOf("") }

    val filteredEntries = remember(entriesState, searchQuery) {
        if (searchQuery.isBlank()) entriesState else entriesState.filter { it.title.contains(searchQuery, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = folderState?.name ?: "Tier List",
                onBackClick = onBackClick,
                showSearch = true,
                searchQuery = searchQuery,
                onSearchQueryChange = { searchQuery = it },
                actions = {
                    IconButton(onClick = { onNavigateToQuickRank(folderId) }) {
                        Icon(Icons.Default.FlashOn, contentDescription = "Quick Rank", tint = TextLight)
                    }
                    IconButton(onClick = { onNavigateToSnapshots(folderId) }) {
                        Icon(Icons.Default.CameraAlt, contentDescription = "Snapshot", tint = TextLight)
                    }
                    IconButton(onClick = { onNavigateToStats(folderId) }) {
                        Icon(Icons.Default.BarChart, contentDescription = "Statistik", tint = TextLight)
                    }
                    IconButton(onClick = { onNavigateToTierSettings(folderId) }) {
                        Icon(Icons.Default.Tune, contentDescription = "Pengaturan Tier", tint = TextLight)
                    }
                    IconButton(onClick = { onNavigateToExport(folderId) }) {
                        Icon(Icons.Default.Share, contentDescription = "Ekspor", tint = TextLight)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { onNavigateToEntryForm(folderId, null) },
                containerColor = PrimaryDarkGold,
                contentColor = TextGold
            ) {
                Icon(Icons.Default.Add, contentDescription = "Tambah Entri")
            }
        },
        containerColor = BgDark
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 80.dp, top = 8.dp)
        ) {
            // Tiers
            items(tiersState, key = { it.id }) { tier ->
                val tierEntries = filteredEntries.filter { it.tierId == tier.id }
                TierRowItem(
                    tier = tier,
                    entries = tierEntries,
                    onEntryClick = { entry -> selectedEntryForMove = entry }
                )
            }

            // Pool ("Belum diberi tier")
            item {
                Spacer(modifier = Modifier.height(16.dp))
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardDark),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().border(1.dp, CardBorderDark, RoundedCornerShape(12.dp))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Belum diberi tier (${poolEntries.size})",
                                style = MaterialTheme.typography.titleSmall,
                                color = TextMuted,
                                fontWeight = FontWeight.Bold
                            )
                            Row {
                                IconButton(onClick = { viewModel.shufflePool(folderId) }) {
                                    Icon(Icons.Default.Shuffle, contentDescription = "Acak Pool", tint = TextMuted)
                                }
                                IconButton(onClick = { onNavigateToAddFromLink(folderId) }) {
                                    Icon(Icons.Default.Link, contentDescription = "Tambah dari Link", tint = TextMuted)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        if (poolEntries.isEmpty()) {
                            Text("Semua entri telah ditempatkan di tier!", style = MaterialTheme.typography.bodySmall, color = TextSubtle)
                        } else {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                poolEntries.forEach { entry ->
                                    EntryCardMini(
                                        entry = entry,
                                        onClick = { selectedEntryForMove = entry }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Move Entry Sheet
    selectedEntryForMove?.let { entry ->
        AppBottomSheet(
            onDismissRequest = { selectedEntryForMove = null },
            title = entry.title
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Pindahkan ke Tier:", style = MaterialTheme.typography.labelMedium, color = TextMuted)

                tiersState.forEach { tier ->
                    val isCurrent = entry.tierId == tier.id
                    Button(
                        onClick = {
                            viewModel.moveEntry(entry.id, tier.id)
                            selectedEntryForMove = null
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = ColorUtils.parseColorHex(tier.colorHex),
                            contentColor = ColorUtils.getAutoTextColor(tier.colorHex)
                        ),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(tier.label + if (isCurrent) " (Saat ini)" else "")
                    }
                }

                if (entry.tierId != null) {
                    OutlinedButton(
                        onClick = {
                            viewModel.moveEntry(entry.id, null)
                            selectedEntryForMove = null
                        },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Kembalikan ke Pool", color = TextLight)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = {
                            val eId = entry.id
                            selectedEntryForMove = null
                            onNavigateToEntryForm(folderId, eId)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Edit, contentDescription = null, tint = TextLight)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Edit", color = TextLight)
                    }

                    OutlinedButton(
                        onClick = {
                            viewModel.softDeleteEntry(entry.id)
                            selectedEntryForMove = null
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFFB4AB))
                    ) {
                        Icon(Icons.Default.Delete, contentDescription = null, tint = Color(0xFFFFB4AB))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Hapus")
                    }
                }
            }
        }
    }
}

@Composable
fun TierRowItem(
    tier: TierEntity,
    entries: List<EntryEntity>,
    onEntryClick: (EntryEntity) -> Unit
) {
    val bgCol = ColorUtils.parseColorHex(tier.colorHex)
    val textCol = ColorUtils.getAutoTextColor(tier.colorHex)

    Card(
        colors = CardDefaults.cardColors(containerColor = CardDark),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .fillMaxWidth()
            .heightIn(min = 80.dp)
            .border(1.dp, CardBorderDark, RoundedCornerShape(8.dp))
    ) {
        Row(modifier = Modifier.fillMaxWidth()) {
            // Label Header Box
            Box(
                modifier = Modifier
                    .width(72.dp)
                    .fillMaxHeight()
                    .background(bgCol)
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = tier.label,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = textCol,
                    textAlign = TextAlign.Center
                )
            }

            // Entries Horizontal Row
            Row(
                modifier = Modifier
                    .weight(1f)
                    .padding(8.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (entries.isEmpty()) {
                    Text("Kosong", style = MaterialTheme.typography.bodySmall, color = TextSubtle)
                } else {
                    entries.forEach { entry ->
                        EntryCardMini(entry = entry, onClick = { onEntryClick(entry) })
                    }
                }
            }
        }
    }
}

@Composable
fun EntryCardMini(
    entry: EntryEntity,
    onClick: () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2B2926)),
        shape = RoundedCornerShape(8.dp),
        modifier = Modifier
            .size(72.dp)
            .clickable { onClick() }
    ) {
        Box(modifier = Modifier.fillMaxSize()) {
            if (!entry.imagePath.isNull_or_blank()) {
                AsyncImage(
                    model = entry.imagePath,
                    contentDescription = entry.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(PrimaryDarkGold),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = entry.title.take(2).uppercase(),
                        style = MaterialTheme.typography.titleSmall,
                        color = TextGold,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Overlay Title
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .background(Color.Black.copy(alpha = 0.7f))
                    .padding(vertical = 2.dp, horizontal = 4.dp)
            ) {
                Text(
                    text = entry.title,
                    fontSize = 9.sp,
                    color = TextLight,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

private fun String?.isNull_or_blank(): Boolean = this == null || this.trim().isEmpty()
