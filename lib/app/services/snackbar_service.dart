import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../core/values/colors.dart';

enum SnackbarType { success, error, warning, info }

class AppSnackbar {
  static void show({
    required String title,
    required String message,
    SnackbarType type = SnackbarType.info,
    Duration duration = const Duration(seconds: 3),
    SnackPosition position = SnackPosition.BOTTOM,
  }) {
    final Color backgroundColor;
    final Color textColor;
    final IconData icon;

    switch (type) {
      case SnackbarType.success:
        backgroundColor = AppColors.success;
        textColor = Colors.white;
        icon = Icons.check_circle_outline;
        break;
      case SnackbarType.error:
        backgroundColor = AppColors.error;
        textColor = Colors.white;
        icon = Icons.error_outline;
        break;
      case SnackbarType.warning:
        backgroundColor = AppColors.warning;
        textColor = Colors.white;
        icon = Icons.warning_amber_outlined;
        break;
      case SnackbarType.info:
      default:
        backgroundColor = Get.isDarkMode ? AppColors.surfaceDark : AppColors.primary;
        textColor = Colors.white;
        icon = Icons.info_outline;
        break;
    }

    final mediaQuery = Get.context != null ? MediaQuery.of(Get.context!) : null;
    final topInset = mediaQuery?.padding.top ?? 0.0;
    final bottomInset = mediaQuery?.padding.bottom ?? 0.0;
    final safeTopMargin = topInset + kToolbarHeight + 8;
    final safeBottomMargin = bottomInset + 8;
    final EdgeInsets margin = position == SnackPosition.TOP
        ? EdgeInsets.fromLTRB(16, safeTopMargin, 16, 16)
        : EdgeInsets.fromLTRB(16, 16, 16, safeBottomMargin);

    Get.snackbar(
      title.toUpperCase(),
      message,
      snackPosition: position,
      backgroundColor: backgroundColor.withOpacity(0.9),
      colorText: textColor,
      icon: Icon(icon, color: textColor),
      duration: duration,
      margin: margin,
      borderRadius: 0,
      borderWidth: 1,
      borderColor: backgroundColor,
      titleText: Text(
        title.toUpperCase(),
        style: Get.textTheme.labelLarge?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
        ),
      ),
      messageText: Text(
        message,
        style: Get.textTheme.bodyMedium?.copyWith(
          color: textColor,
          fontWeight: FontWeight.w500,
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      shouldIconPulse: false,
      snackStyle: SnackStyle.FLOATING,
      mainButton: TextButton(
        onPressed: () => Get.back(),
        child: Text(
          'DISMISS',
          style: TextStyle(
            color: textColor,
            fontWeight: FontWeight.w900,
            fontSize: 10,
          ),
        ),
      ),
    );
  }
}
