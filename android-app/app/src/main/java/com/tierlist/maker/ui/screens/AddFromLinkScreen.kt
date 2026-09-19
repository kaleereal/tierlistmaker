package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tierlist.maker.data.models.EntryEntity
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun AddFromLinkScreen(
    folderId: String,
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    var url by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Tambah dari Link / Image URL",
                onBackClick = onBackClick
            )
        },
        containerColor = BgDark
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("URL Gambar Direct") },
                placeholder = { Text("https://example.com/image.jpg") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Judul Entri (Opsional)") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = PrimaryGold,
                    unfocusedBorderColor = CardBorderDark,
                    focusedTextColor = TextLight,
                    unfocusedTextColor = TextLight
                ),
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    if (url.isNotBlank()) {
                        val newEntry = EntryEntity(
                            id = "entry_${System.currentTimeMillis()}",
                            folderId = folderId,
                            tierId = null,
                            title = title.ifBlank { "Entri Gambar" },
                            imagePath = url.trim(),
                            sourceUrl = url.trim()
                        )
                        viewModel.saveEntry(newEntry, emptyList()) {
                            onBackClick()
                        }
                    }
                },
                enabled = url.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Tambahkan ke Pool")
            }
        }
    }
}
