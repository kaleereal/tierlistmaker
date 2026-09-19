package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.EntryEntity
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.utils.ColorUtils
import com.tierlist.maker.ui.viewmodel.MainViewModel
import kotlinx.coroutines.launch

@Composable
fun EntryFormScreen(
    folderId: String,
    entryId: String? = null,
    prefillTierId: String? = null,
    prefillTitle: String? = null,
    prefillImageUrl: String? = null,
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val tiers by dao.getTiersByFolderFlow(folderId).collectAsState(initial = emptyList())

    var title by remember { mutableStateOf(prefillTitle ?: "") }
    var selectedTierId by remember { mutableStateOf<String?>(prefillTierId) }
    var imageUrl by remember { mutableStateOf(prefillImageUrl ?: "") }
    var note by remember { mutableStateOf("") }
    var score by remember { mutableFloatStateOf(80f) }
    var hasScore by remember { mutableStateOf(false) }
    var tagText by remember { mutableStateOf("") }

    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(entryId) {
        if (entryId != null) {
            val existing = dao.getEntryById(entryId)
            if (existing != null) {
                title = existing.title
                selectedTierId = existing.tierId
                imageUrl = existing.imagePath ?: ""
                note = existing.note
                if (existing.score != null) {
                    score = existing.score.toFloat()
                    hasScore = true
                }
            }
        }
    }

    Scaffold(
        topBar = {
            AppTopBar(
                title = if (entryId == null) "Tambah Entri Baru" else "Edit Entri",
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
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Judul / Nama Entri") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Text("Pilih Tier Target:", style = MaterialTheme.typography.labelMedium, color = TextMuted)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = selectedTierId == null,
                    onClick = { selectedTierId = null },
                    label = { Text("Pool (Belum ada)") }
                )
                tiers.forEach { tier ->
                    FilterChip(
                        selected = selectedTierId == tier.id,
                        onClick = { selectedTierId = tier.id },
                        label = { Text(tier.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = ColorUtils.parseColorHex(tier.colorHex),
                            selectedLabelColor = ColorUtils.getAutoTextColor(tier.colorHex)
                        )
                    )
                }
            }

            OutlinedTextField(
                value = imageUrl,
                onValueChange = { imageUrl = it },
                label = { Text("URL Gambar (Opsional)") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = note,
                onValueChange = { note = it },
                label = { Text("Catatan / Alasan Ranking") },
                minLines = 3,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = hasScore,
                    onCheckedChange = { hasScore = it },
                    colors = CheckboxDefaults.colors(checkedColor = PrimaryGold)
                )
                Text("Beri Skor Numerical (0 - 100): ${score.toInt()}", color = TextLight)
            }

            if (hasScore) {
                Slider(
                    value = score,
                    onValueChange = { score = it },
                    valueRange = 0f..100f,
                    colors = SliderDefaults.colors(thumbColor = PrimaryGold, activeTrackColor = PrimaryGold)
                )
            }

            OutlinedTextField(
                value = tagText,
                onValueChange = { tagText = it },
                label = { Text("Tag (pisahkan dengan koma)") },
                placeholder = { Text("Contoh: RPG, Open World") },
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

            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        val tags = tagText.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                        val entry = EntryEntity(
                            id = entryId ?: "entry_${System.currentTimeMillis()}",
                            folderId = folderId,
                            tierId = selectedTierId,
                            title = title.trim(),
                            imagePath = imageUrl.ifBlank { null },
                            sourceUrl = imageUrl.ifBlank { null },
                            note = note.trim(),
                            score = if (hasScore) score.toInt() else null
                        )
                        viewModel.saveEntry(entry, tags) {
                            onBackClick()
                        }
                    }
                },
                enabled = title.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Simpan Entri", style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}
