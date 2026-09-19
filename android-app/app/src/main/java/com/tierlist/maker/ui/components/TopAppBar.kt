package com.tierlist.maker.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.tierlist.maker.ui.theme.TextGold
import com.tierlist.maker.ui.theme.TextLight

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppTopBar(
    title: String,
    onBackClick: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    showSearch: Boolean = false,
    searchQuery: String = "",
    onSearchQueryChange: (String) -> Unit = {},
    searchPlaceholder: String = "Cari..."
) {
    var isSearchActive by remember { mutableStateOf(false) }

    if (isSearchActive && showSearch) {
        TopAppBar(
            title = {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchQueryChange,
                    placeholder = { Text(searchPlaceholder, color = Color.Gray) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = TextGold,
                        unfocusedBorderColor = Color.Transparent,
                        focusedTextColor = TextLight,
                        unfocusedTextColor = TextLight
                    ),
                    modifier = Modifier.fillMaxWidth()
                )
            },
            navigationIcon = {
                IconButton(onClick = {
                    isSearchActive = false
                    onSearchQueryChange("")
                }) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = TextLight)
                }
            },
            actions = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchQueryChange("") }) {
                        Icon(Icons.Default.Close, contentDescription = "Hapus", tint = TextLight)
                    }
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF141311))
        )
    } else {
        TopAppBar(
            title = {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = TextLight
                )
            },
            navigationIcon = {
                if (onBackClick != null) {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Kembali", tint = TextLight)
                    }
                }
            },
            actions = {
                if (showSearch) {
                    IconButton(onClick = { isSearchActive = true }) {
                        Icon(Icons.Default.Search, contentDescription = "Cari", tint = TextLight)
                    }
                }
                actions()
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF141311))
        )
    }
}
