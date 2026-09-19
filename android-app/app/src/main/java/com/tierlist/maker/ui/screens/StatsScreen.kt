package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun StatsScreen(
    folderId: String,
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val tiers by dao.getTiersByFolderFlow(folderId).collectAsState(initial = emptyList())
    val entries by dao.getActiveEntriesByFolderFlow(folderId).collectAsState(initial = emptyList())

    val totalEntries = entries.size
    val rankedEntries = entries.count { it.tierId != null }
    val unrankedEntries = entries.count { it.tierId == null }
    val scores = entries.mapNotNull { it.score }
    val avgScore = if (scores.isNotEmpty()) scores.average() else 0.0

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Statistik Folder",
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
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ringkasan Entri", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = TextGold)
                    Text("Total Entri: $totalEntries", color = TextLight)
                    Text("Di-rank di Tier: $rankedEntries", color = TextLight)
                    Text("Di Pool: $unrankedEntries", color = TextLight)
                    if (scores.isNotEmpty()) {
                        Text("Rata-rata Skor: ${String.format("%.1f", avgScore)} / 100", color = TextLight)
                    }
                }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Distribusi per Tier", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = TextGold)
                    tiers.forEach { tier ->
                        val count = entries.count { it.tierId == tier.id }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(tier.label, color = TextLight)
                            Text("$count entri", color = TextMuted)
                        }
                    }
                }
            }
        }
    }
}
