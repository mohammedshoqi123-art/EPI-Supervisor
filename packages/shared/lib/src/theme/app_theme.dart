import 'package:flutter/material.dart';

/// EPI Supervisor Design System — Teal + Glassmorphism + RTL
class AppTheme {
  AppTheme._();

  // ─── Brand Colors — Premium Teal ═══════════════════════════════════════════
  static const Color primaryColor = Color(0xFF00897B); // Teal 600
  static const Color primaryDark = Color(0xFF00695C); // Teal 800
  static const Color primaryDarker = Color(0xFF004D40); // Teal 900
  static const Color primaryLight = Color(0xFF4DB6AC); // Teal 300
  static const Color primarySurface = Color(0xFFE0F2F1); // Teal 50

  static const Color secondaryColor = Color(0xFF5C6BC0); // Indigo 400
  static const Color secondaryDark = Color(0xFF3949AB); // Indigo 600
  static const Color secondaryLight = Color(0xFF9FA8DA); // Indigo 200

  // ─── Accent Colors ═══════════════════════════════════════════════════════
  static const Color accentAmber = Color(0xFFFF8F00); // Amber 800
  static const Color accentCoral = Color(0xFFFF6B6B);
  static const Color accentMint = Color(0xFF00E5A0);

  // ─── Semantic Colors ═════════════════════════════════════════════════════
  static const Color successColor = Color(0xFF2E7D32);
  static const Color successLight = Color(0xFFE8F5E9);
  static const Color warningColor = Color(0xFFE65100);
  static const Color warningLight = Color(0xFFFFF3E0);
  static const Color errorColor = Color(0xFFC62828);
  static const Color errorLight = Color(0xFFFFEBEE);
  static const Color infoColor = Color(0xFF1565C0);
  static const Color infoLight = Color(0xFFE3F2FD);

  // ─── Severity Colors ═════════════════════════════════════════════════════
  static const Color criticalColor = Color(0xFFB71C1C);
  static const Color highColor = Color(0xFFE53935);
  static const Color mediumColor = Color(0xFFFB8C00);
  static const Color lowColor = Color(0xFF43A047);

  // ─── Neutral Colors ══════════════════════════════════════════════════════
  static const Color backgroundLight = Color(0xFFF8FAFB);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceWarm = Color(0xFFFAFAF8);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textHint = Color(0xFF94A3B8);
  static const Color dividerColor = Color(0xFFF1F5F9);

  // ─── Gradients ═══════════════════════════════════════════════════════════
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryColor, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient heroGradient = LinearGradient(
    colors: [Color(0xFF00897B), Color(0xFF004D40)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  static const LinearGradient premiumGradient = LinearGradient(
    colors: [Color(0xFF00897B), Color(0xFF5C6BC0)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cardGradient = LinearGradient(
    colors: [Color(0xFFF0FDFA), Color(0xFFFFFFFF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient warmGradient = LinearGradient(
    colors: [Color(0xFFFFF8E1), Color(0xFFFFFFFF)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ─── Shadows ════════════════════════════════════════════════════════════
  static List<BoxShadow> get cardShadow => [
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.04),
          blurRadius: 16,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.02),
          blurRadius: 4,
          offset: const Offset(0, 1),
        ),
      ];

  static List<BoxShadow> get elevatedShadow => [
        BoxShadow(
          color: primaryColor.withValues(alpha: 0.15),
          blurRadius: 24,
          offset: const Offset(0, 8),
        ),
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.06),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  static List<BoxShadow> get subtleShadow => [
        BoxShadow(
          color: const Color(0xFF0F172A).withValues(alpha: 0.03),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ];

  // ─── Border Radius ────────────────────────────────────────────────────────
  static const BorderRadius radiusSmall = BorderRadius.all(Radius.circular(8));
  static const BorderRadius radiusMedium = BorderRadius.all(
    Radius.circular(12),
  );
  static const BorderRadius radiusLarge = BorderRadius.all(Radius.circular(16));
  static const BorderRadius radiusXL = BorderRadius.all(Radius.circular(24));
  static const BorderRadius radiusCircle = BorderRadius.all(
    Radius.circular(1000),
  );

  // ─── Glassmorphism ────────────────────────────────────────────────────────
  static BoxDecoration get glassmorphism => BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: radiusLarge,
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.25), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 20,
            spreadRadius: -2,
          ),
        ],
      );

  static BoxDecoration get glassmorphismDark => BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: radiusLarge,
        border:
            Border.all(color: Colors.white.withValues(alpha: 0.1), width: 1),
      );

  // ─── Text Styles ──────────────────────────────────────────────────────────
  static const String fontPrimary = 'Cairo';
  static const String fontSecondary = 'Tajawal';

  static const TextStyle headingXL = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 28,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1.3,
  );

  static const TextStyle headingL = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: textPrimary,
    height: 1.3,
  );

  static const TextStyle headingM = TextStyle(
    fontFamily: fontPrimary,
    fontSize: 18,
    fontWeight: FontWeight.w600,
    color: textPrimary,
  );

  static const TextStyle bodyL = TextStyle(
    fontFamily: fontSecondary,
    fontSize: 16,
    fontWeight: FontWeight.w400,
    color: textPrimary,
  );

  static const TextStyle bodyM = TextStyle(
    fontFamily: fontSecondary,
    fontSize: 14,
    color: textPrimary,
  );

  static const TextStyle bodyS = TextStyle(
    fontFamily: fontSecondary,
    fontSize: 12,
    color: textSecondary,
  );

  static const TextStyle labelM = TextStyle(
    fontFamily: fontSecondary,
    fontSize: 13,
    fontWeight: FontWeight.w500,
    color: textSecondary,
  );

  static const TextStyle caption = TextStyle(
    fontFamily: fontSecondary,
    fontSize: 11,
    color: textHint,
  );

  // ─── Theme Data ═══════════════════════════════════════════════════════════
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.light,
        primary: primaryColor,
        secondary: secondaryColor,
        tertiary: const Color(0xFF5C6BC0),
        error: errorColor,
        surface: surfaceLight,
        surfaceContainerLow: const Color(0xFFF8FAFB),
        surfaceContainerHigh: const Color(0xFFF1F5F9),
      ),
      fontFamily: fontSecondary,
      scaffoldBackgroundColor: backgroundLight,
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: fontPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      cardTheme: CardTheme(
        color: surfaceLight,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: radiusMedium),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: radiusMedium),
          textStyle: const TextStyle(
            fontFamily: fontPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          minimumSize: const Size(double.infinity, 48),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryColor,
          side: const BorderSide(color: borderLight),
          shape: RoundedRectangleBorder(borderRadius: radiusMedium),
          textStyle: const TextStyle(
            fontFamily: fontPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: backgroundLight,
        border: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: borderLight),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: borderLight),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: errorColor),
        ),
        labelStyle: labelM,
        hintStyle: const TextStyle(fontFamily: fontSecondary, color: textHint),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        space: 1,
        thickness: 1,
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: radiusSmall),
        backgroundColor: surfaceWarm,
        selectedColor: primarySurface,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceLight,
        selectedItemColor: primaryColor,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontFamily: fontSecondary, fontSize: 11),
        unselectedLabelStyle: TextStyle(
          fontFamily: fontSecondary,
          fontSize: 11,
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: radiusMedium),
        backgroundColor: textPrimary,
      ),
    );
  }

  // ─── Dark Mode Colors ─────────────────────────────────────────────────
  static const Color darkBackground = Color(0xFF0F172A);
  static const Color darkSurface = Color(0xFF1E293B);
  static const Color darkSurfaceHigh = Color(0xFF334155);
  static const Color darkBorder = Color(0xFF334155);
  static const Color darkTextPrimary = Color(0xFFF1F5F9);
  static const Color darkTextSecondary = Color(0xFF94A3B8);
  static const Color darkTextHint = Color(0xFF64748B);

  // ─── Dark Theme ══════════════════════════════════════════════════════
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryColor,
        brightness: Brightness.dark,
        primary: primaryLight,
        secondary: secondaryLight,
        tertiary: const Color(0xFF9FA8DA),
        error: const Color(0xFFEF4444),
        surface: darkSurface,
        surfaceContainerLow: darkBackground,
        surfaceContainerHigh: darkSurfaceHigh,
      ),
      fontFamily: fontSecondary,
      scaffoldBackgroundColor: darkBackground,
      appBarTheme: const AppBarTheme(
        backgroundColor: darkSurface,
        foregroundColor: darkTextPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          fontFamily: fontPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: darkTextPrimary,
        ),
      ),
      cardTheme: CardTheme(
        color: darkSurface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: radiusMedium),
        margin: EdgeInsets.zero,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: radiusMedium),
          textStyle: const TextStyle(
            fontFamily: fontPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
          minimumSize: const Size(double.infinity, 48),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryLight,
          side: const BorderSide(color: darkBorder),
          shape: RoundedRectangleBorder(borderRadius: radiusMedium),
          textStyle: const TextStyle(
            fontFamily: fontPrimary,
            fontSize: 15,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurfaceHigh,
        border: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: primaryLight, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: radiusMedium,
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
        labelStyle: const TextStyle(
            fontFamily: fontSecondary, color: darkTextSecondary),
        hintStyle:
            const TextStyle(fontFamily: fontSecondary, color: darkTextHint),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      dividerTheme: const DividerThemeData(
        color: darkBorder,
        space: 1,
        thickness: 1,
      ),
      chipTheme: ChipThemeData(
        shape: RoundedRectangleBorder(borderRadius: radiusSmall),
        backgroundColor: darkSurfaceHigh,
        selectedColor: primaryDark,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkSurface,
        selectedItemColor: primaryLight,
        unselectedItemColor: darkTextSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontFamily: fontSecondary, fontSize: 11),
        unselectedLabelStyle:
            TextStyle(fontFamily: fontSecondary, fontSize: 11),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: radiusMedium),
        backgroundColor: darkSurfaceHigh,
      ),
    );
  }

  // ─── Severity Helper ──────────────────────────────────────────────────────
  static Color severityColor(String? severity) {
    switch (severity) {
      case 'critical':
        return criticalColor;
      case 'high':
        return highColor;
      case 'medium':
        return mediumColor;
      case 'low':
        return lowColor;
      default:
        return textSecondary;
    }
  }

  // ─── Status Color ─────────────────────────────────────────────────────────
  static Color statusColor(String? status) {
    switch (status) {
      case 'submitted':
        return infoColor;
      case 'approved':
        return successColor;
      case 'rejected':
        return errorColor;
      case 'reviewed':
        return warningColor;
      case 'pending_sync':
        return accentAmber;
      case 'draft':
        return textSecondary;
      default:
        return textSecondary;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DESIGN TOKENS — spacing, durations, radii (M3 standard)
  // ═══════════════════════════════════════════════════════════

  /// Spacing scale — use these instead of raw numbers
  static const double spaceXS = 4;
  static const double spaceSM = 8;
  static const double spaceMD = 16;
  static const double spaceLG = 24;
  static const double spaceXL = 32;
  static const double spaceXXL = 48;

  /// Animation durations
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationNormal = Duration(milliseconds: 300);
  static const Duration durationSlow = Duration(milliseconds: 500);

  /// Standard border radii (double values — use with BorderRadius.circular())
  static const double radiusSDouble = 8;
  static const double radiusMDouble = 12;
  static const double radiusLDouble = 16;
  static const double radiusXLDouble = 24;

  /// Touch target size (M3 minimum)
  static const double minTouchTarget = 48;
}
