package com.tierlist.maker.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryGold,
    onPrimary = Color(0xFF4A2A00),
    primaryContainer = PrimaryDarkGold,
    onPrimaryContainer = TextGold,
    background = BgDark,
    onBackground = TextLight,
    surface = CardDark,
    onSurface = TextLight,
    surfaceVariant = CardBorderDark,
    onSurfaceVariant = TextMuted
)

@Composable
fun TierListMakerTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
