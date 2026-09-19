package com.tierlist.maker.ui.utils

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import kotlin.math.pow

object ColorUtils {

    val SWATCH_COLORS = listOf(
        "#F44336", "#E91E63", "#FF5722", "#FF9800", "#FFC107", "#FFEB3B",
        "#CDDC39", "#8BC34A", "#4CAF50", "#009688", "#00BCD4", "#2196F3",
        "#3F51B5", "#673AB7", "#9C27B0", "#607D8B", "#9E9E9E"
    )

    fun parseColorHex(hex: String?, fallback: Color = Color(0xFFE0A458)): Color {
        if (hex.isNullOrBlank()) return fallback
        return try {
            val cleanHex = hex.removePrefix("#")
            val argb = if (cleanHex.length == 6) {
                0xFF000000.toInt() or cleanHex.toLong(16).toInt()
            } else if (cleanHex.length == 8) {
                cleanHex.toLong(16).toInt()
            } else {
                fallback.toArgb()
            }
            Color(argb)
        } catch (e: Exception) {
            fallback
        }
    }

    private fun getRelativeLuminance(color: Color): Double {
        val r = color.red.toDouble()
        val g = color.green.toDouble()
        val b = color.blue.toDouble()

        fun toLinear(c: Double) = if (c <= 0.03928) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
        return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
    }

    private fun getContrastRatio(lum1: Double, lum2: Double): Double {
        val lighter = maxOf(lum1, lum2)
        val darker = minOf(lum1, lum2)
        return (lighter + 0.05) / (darker + 0.05)
    }

    fun getAutoTextColor(bgHex: String): Color {
        val bgColor = parseColorHex(bgHex)
        val bgLum = getRelativeLuminance(bgColor)
        val whiteContrast = getContrastRatio(bgLum, 1.0)
        return if (whiteContrast >= 4.5) Color.White else Color.Black
    }
}
