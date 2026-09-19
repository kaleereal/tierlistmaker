package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.gson.Gson
import com.tierlist.maker.data.AppDatabase
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel
import kotlinx.coroutines.launch

@Composable
fun ExportShareScreen(
    folderId: String,
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val dao = remember { AppDatabase.getInstance(viewModel.getApplication()).appDao() }
    var exportedJson by remember { mutableStateOf("") }
    val coroutineScope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Ekspor & Bagikan",
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
            Button(
                onClick = {
                    coroutineScope.launch {
                        val folder = dao.getFolderById(folderId)
                        val tiers = dao.getTiersByFolder(folderId)
                        val entries = dao.getActiveEntriesByFolder(folderId)

                        val dataMap = mapOf(
                            "folder" to folder,
                            "tiers" to tiers,
                            "entries" to entries
                        )
                        exportedJson = Gson().toJson(dataMap)
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryDarkGold, contentColor = TextGold),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Generate JSON Backup Folder")
            }

            if (exportedJson.isNotBlank()) {
                OutlinedTextField(
                    value = exportedJson,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Data JSON Export") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = PrimaryGold,
                        unfocusedBorderColor = CardBorderDark,
                        focusedTextColor = TextLight,
                        unfocusedTextColor = TextLight
                    ),
                    modifier = Modifier.fillMaxWidth().weight(1f)
                )
            }
        }
    }
}
