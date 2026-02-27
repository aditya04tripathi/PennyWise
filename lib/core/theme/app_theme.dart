import 'package:flutter/material.dart';
import '../values/colors.dart';
import '../values/spacing.dart';

class AppTheme {
  static const double borderRadius = 0.0;
  static const String fontBody = 'SpaceGrotesk';

  static ThemeData get light {
    final base = ThemeData.light(useMaterial3: true);
    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.incomeGreen,
        error: AppColors.expenseRed,
        background: AppColors.background,
        surface: AppColors.surface,
        onSurface: AppColors.textPrimary,
        outline: AppColors.border,
      ),
      scaffoldBackgroundColor: AppColors.background,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: fontBody,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: 1.5,
        ),
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.5,
        ),
        displayMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        displaySmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        headlineLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: 1.2,
        ),
        headlineMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        headlineSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        titleLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        titleSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        bodyLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
        bodyMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
        bodySmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
        labelLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: 1.0,
        ),
        labelMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
        labelSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondary,
        ),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          side: BorderSide(color: AppColors.border),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surface,
        contentPadding: AppSpacing.pM,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.border),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.border),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.expenseRed),
        ),
        hintStyle: const TextStyle(
          fontFamily: fontBody,
          color: AppColors.textSecondary,
          fontWeight: FontWeight.w500,
        ),
        labelStyle: const TextStyle(
          fontFamily: fontBody,
          color: AppColors.textPrimary,
          fontWeight: FontWeight.w600,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimary,
          minimumSize: const Size(double.infinity, 56),
          side: const BorderSide(color: AppColors.textPrimary, width: 2),
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: AppSpacing.m,
      ),
      tabBarTheme: const TabBarThemeData(
        indicatorSize: TabBarIndicatorSize.tab,
      ),
      bottomAppBarTheme: const BottomAppBarThemeData(
        color: AppColors.surface,
        elevation: 0,
        height: 64,
      ),
    );
  }

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      colorScheme: ColorScheme.fromSeed(
        brightness: Brightness.dark,
        seedColor: AppColors.primary,
        primary: AppColors.primary,
        onPrimary: Colors.white,
        secondary: AppColors.incomeGreen,
        error: AppColors.expenseRed,
        background: AppColors.backgroundDark,
        surface: AppColors.surfaceDark,
        onSurface: AppColors.textPrimaryDark,
        outline: AppColors.borderDark,
      ),
      scaffoldBackgroundColor: AppColors.backgroundDark,
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.backgroundDark,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          fontFamily: fontBody,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
          letterSpacing: 1.5,
        ),
        iconTheme: IconThemeData(color: AppColors.textPrimaryDark),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
          letterSpacing: -0.5,
        ),
        displayMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
        ),
        displaySmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 24,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
        ),
        headlineLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
          letterSpacing: 1.2,
        ),
        headlineMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
        ),
        headlineSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
        ),
        titleLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryDark,
        ),
        titleMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryDark,
        ),
        titleSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimaryDark,
        ),
        bodyLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimaryDark,
        ),
        bodyMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondaryDark,
        ),
        bodySmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondaryDark,
        ),
        labelLarge: TextStyle(
          fontFamily: fontBody,
          fontSize: 14,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimaryDark,
          letterSpacing: 1.0,
        ),
        labelMedium: TextStyle(
          fontFamily: fontBody,
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondaryDark,
        ),
        labelSmall: TextStyle(
          fontFamily: fontBody,
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppColors.textSecondaryDark,
        ),
      ),
      cardTheme: const CardThemeData(
        color: AppColors.surfaceDark,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          side: BorderSide(color: AppColors.borderDark),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceDark,
        contentPadding: AppSpacing.pM,
        border: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.borderDark),
        ),
        enabledBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.borderDark),
        ),
        focusedBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: const OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          borderSide: BorderSide(color: AppColors.expenseRed),
        ),
        hintStyle: const TextStyle(
          fontFamily: fontBody,
          color: AppColors.textSecondaryDark,
          fontWeight: FontWeight.w500,
        ),
        labelStyle: const TextStyle(
          fontFamily: fontBody,
          color: AppColors.textPrimaryDark,
          fontWeight: FontWeight.w600,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.textPrimaryDark,
          minimumSize: const Size(double.infinity, 56),
          side: const BorderSide(color: AppColors.textPrimaryDark, width: 2),
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          textStyle: const TextStyle(
            fontFamily: fontBody,
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(borderRadius)),
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: AppColors.borderDark,
        thickness: 1,
        space: AppSpacing.m,
      ),
      tabBarTheme: const TabBarThemeData(
        indicatorSize: TabBarIndicatorSize.tab,
      ),
      bottomAppBarTheme: const BottomAppBarThemeData(
        color: AppColors.surfaceDark,
        elevation: 0,
        height: 64,
      ),
    );
  }
}
