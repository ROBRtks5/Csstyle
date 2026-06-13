package com.example.ui.theme

import android.app.Activity
import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme =
  darkColorScheme(
    primary = Red600,
    secondary = Zinc400,
    tertiary = Red500,
    background = BgDark,
    surface = SurfaceDark,
    onPrimary = Zinc100,
    onSecondary = Zinc100,
    onTertiary = Zinc100,
    onBackground = Zinc100,
    onSurface = Zinc100,
    surfaceVariant = SurfaceLight,
    onSurfaceVariant = Zinc300
  )

@Composable
fun MyApplicationTheme(
  darkTheme: Boolean = true, // Force dark theme for Sleek Interface
  // Dynamic color is available on Android 12+
  dynamicColor: Boolean = false, // Disable dynamic color to enforce our palette
  content: @Composable () -> Unit,
) {
  val colorScheme = DarkColorScheme
  
  val view = LocalView.current
  if (!view.isInEditMode) {
    SideEffect {
      val window = (view.context as Activity).window
      window.statusBarColor = colorScheme.surface.toArgb()
      window.navigationBarColor = colorScheme.background.toArgb()
      WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
    }
  }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
