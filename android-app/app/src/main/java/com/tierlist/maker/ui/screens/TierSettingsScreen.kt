package com.tierlist.maker.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.data.models.TierEntity
import com.tierlist.maker.ui.components.AppBottomSheet
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.components.ColorPickerSwatches
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.utils.ColorUtils
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun TierSettingsScreen(
    folderId: String,
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    val tiers by dao.getTiersByFolderFlow(folderId).collectAsState(initial = emptyList())

    var isAddOpen by remember { mutableStateOf(false) }
    var editingTier by remember { mutableStateOf<TierEntity?>(null) }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Pengaturan Tier",
                onBackClick = onBackClick
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { isAddOpen = true },
                containerColor = PrimaryDarkGold,
                contentColor = TextGold
            ) {
                Icon(Icons.Default.Add, contentDescription = "Tambah Tier")
            }
        },
        containerColor = BgDark
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(tiers, key = { it.id }) { tier ->
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
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .background(ColorUtils.parseColorHex(tier.colorHex), RoundedCornerShape(6.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = tier.label,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = ColorUtils.getAutoTextColor(tier.colorHex)
                            )
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Text(
                            text = tier.label,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextLight,
                            modifier = Modifier.weight(1f)
                        )

                        IconButton(onClick = { editingTier = tier }) {
                            Icon(Icons.Default.Edit, contentDescription = "Edit", tint = TextMuted)
                        }

                        IconButton(onClick = { viewModel.deleteTier(tier.id) }) {
                            Icon(Icons.Default.Delete, contentDescription = "Hapus", tint = Color(0xFFFFB4AB))
                        }
                    }
                }
            }
        }
    }

    // Add Tier Sheet
    if (isAddOpen) {
        var label by remember { mutableStateOf("") }
        var colorHex by remember { mutableStateOf("#F44336") }

        AppBottomSheet(
            onDismissRequest = { isAddOpen = false },
            title = "Tambah Tier Baru"
        ) {
            OutlinedTextField(
                value = label,
                onValueChange = { label = it },
                label = { Text("Label Tier (misal: S+, God Tier)") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))
            ColorPickerSwatches(selectedColorHex = colorHex, onColorSelected = { colorHex = it })

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    if (label.isNotBlank()) {
                        viewModel.addTier(folderId, label, colorHex)
                        isAddOpen = false
                    }
                },
                enabled = label.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Tambah Tier")
            }
        }
    }

    // Edit Tier Sheet
    editingTier?.let { tier ->
        var label by remember { mutableStateOf(tier.label) }
        var colorHex by remember { mutableStateOf(tier.colorHex) }

        AppBottomSheet(
            onDismissRequest = { editingTier = null },
            title = "Edit Tier ${tier.label}"
        ) {
            OutlinedTextField(
                value = label,
                onValueChange = { label = it },
                label = { Text("Label Tier") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))
            ColorPickerSwatches(selectedColorHex = colorHex, onColorSelected = { colorHex = it })

            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    if (label.isNotBlank()) {
                        viewModel.updateTier(tier.copy(label = label.trim(), colorHex = colorHex))
                        editingTier = null
                    }
                },
                enabled = label.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Simpan Perubahan")
            }
        }
    }
}
