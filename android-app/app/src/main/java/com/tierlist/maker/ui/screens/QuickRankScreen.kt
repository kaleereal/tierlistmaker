package com.tierlist.maker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.EntryEntity
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.utils.ColorUtils
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun QuickRankScreen(
    folderId: String,
    initialMode: String = "rate",
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val tiers by dao.getTiersByFolderFlow(folderId).collectAsState(initial = emptyList())
    val entries by dao.getActiveEntriesByFolderFlow(folderId).collectAsState(initial = emptyList())

    val unrankedEntries = remember(entries) { entries.filter { it.tierId == null } }
    var currentIndex by remember { mutableIntStateOf(0) }

    val currentEntry = remember(unrankedEntries, currentIndex) {
        if (unrankedEntries.isNotEmpty() && currentIndex < unrankedEntries.size) unrankedEntries[currentIndex] else null
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Ranking Cepat",
                onBackClick = onBackClick
            )
        },
        containerColor = BgDark
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            contentAlignment = Alignment.Center
        ) {
            if (currentEntry == null) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Check, contentDescription = null, tint = PrimaryGold, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Semua item telah di-rank!", style = MaterialTheme.typography.titleMedium, color = TextLight)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = onBackClick, colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold)) {
                        Text("Kembali ke Tier List")
                    }
                }
            } else {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardDark),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.fillMaxWidth().padding(16.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            "Progres: ${currentIndex + 1} / ${unrankedEntries.size}",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextMuted
                        )
                        Spacer(modifier = Modifier.height(12.dp))

                        if (!currentEntry.imagePath.isNull_or_blank()) {
                            AsyncImage(
                                model = currentEntry.imagePath,
                                contentDescription = currentEntry.title,
                                contentScale = ContentScale.Crop,
                                modifier = Modifier.size(160.dp).clip(RoundedCornerShape(12.dp))
                            )
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = currentEntry.title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = TextLight
                        )

                        Spacer(modifier = Modifier.height(24.dp))
                        Text("Pilih Tier untuk item ini:", style = MaterialTheme.typography.labelMedium, color = TextMuted)
                        Spacer(modifier = Modifier.height(12.dp))

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            tiers.forEach { tier ->
                                Button(
                                    onClick = {
                                        viewModel.moveEntry(currentEntry.id, tier.id)
                                        currentIndex++
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = ColorUtils.parseColorHex(tier.colorHex),
                                        contentColor = ColorUtils.getAutoTextColor(tier.colorHex)
                                    ),
                                    modifier = Modifier.fillMaxWidth()
                                ) {
                                    Text(tier.label, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun String?.isNull_or_blank(): Boolean = this == null || this.trim().isEmpty()
