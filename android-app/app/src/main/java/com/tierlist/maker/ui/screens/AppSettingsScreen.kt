package com.tierlist.maker.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tierlist.maker.ui.components.AppTopBar
import com.tierlist.maker.ui.theme.*
import com.tierlist.maker.ui.viewmodel.MainViewModel

@Composable
fun AppSettingsScreen(
    viewModel: MainViewModel,
    onBackClick: () -> Unit
) {
    val settings by viewModel.appSettings.collectAsState()

    Scaffold(
        topBar = {
            AppTopBar(
                title = "Pengaturan Aplikasi",
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
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Getaran Haptic Feedback", color = TextLight)
                        Switch(
                            checked = settings.hapticFeedback,
                            onCheckedChange = { viewModel.updateSettings(settings.copy(hapticFeedback = it)) },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryGold)
                        )
                    }

                    Divider(color = CardBorderDark)

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Retensi Sampah (Hari)", color = TextLight)
                        Text("${settings.trashRetentionDays} Hari", color = TextMuted)
                    }
                }
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = CardDark),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Tentang Aplikasi", style = MaterialTheme.typography.titleMedium, color = TextGold)
                    Text("Tier List Maker v1.0.0 (Native Android)", color = TextLight)
                    Text("Aplikasi pembuat tier list offline lengkap dengan Jetpack Compose dan Material 3.", color = TextMuted)
                }
            }
        }
    }
}
