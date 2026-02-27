import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/settings_controller.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import '../../../routes/app_routes.dart';

class SettingsView extends GetView<SettingsController> {
  const SettingsView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('SETTINGS')),
      body: SafeArea(
        child: ListView(
          padding: AppSpacing.pM,
          children: [
          _buildSettingsSection('Account', [
            _buildSettingsItem(
              Icons.person_outline,
              'Profile',
              'Edit your information',
              theme,
              onTap: () => Get.toNamed(AppRoutes.ACCOUNT),
            ),
            Obx(
              () => _buildSettingsItem(
                Icons.currency_exchange,
                'Currency',
                controller.selectedCurrency.value,
                theme,
                onTap: () => Get.toNamed(AppRoutes.CURRENCY),
              ),
            ),
          ], theme),
          AppSpacing.vXL,
          _buildSettingsSection('Security', [
            _buildSettingsItem(
              Icons.lock_outline,
              'Change PIN',
              'Change your 4-digit PIN',
              theme,
              onTap: controller.changePin,
            ),
            Obx(
              () => _buildSettingsItem(
                Icons.fingerprint,
                'Biometric Login',
                controller.securityService.isBiometricEnabled.value
                    ? 'Enabled'
                    : 'Disabled',
                theme,
                trailing: Switch(
                  value: controller.securityService.isBiometricEnabled.value,
                  onChanged: controller.toggleBiometrics,
                  activeColor: theme.colorScheme.primary,
                ),
              ),
            ),
          ], theme),
          AppSpacing.vXL,
          _buildSettingsSection('Notifications', [
            _buildSettingsItem(
              Icons.warning_amber_outlined,
              'Budget Alerts',
              'Notify me when I reach a limit',
              theme,
              onTap: () => Get.toNamed(AppRoutes.BUDGET_ALERTS),
            ),
          ], theme),
          AppSpacing.vXL,
          _buildSettingsSection('Data', [
            _buildSettingsItem(
              Icons.ios_share_outlined,
              'Backup & Restore',
              'Export or import your data securely',
              theme,
              onTap: () => Get.toNamed(AppRoutes.BACKUP_RESTORE),
            ),
            _buildSettingsItem(
              Icons.delete_outline,
              'Delete Account',
              'Permanently remove all your data',
              theme,
              color: AppColors.error,
              onTap: () => Get.toNamed(AppRoutes.DELETE_ACCOUNT),
            ),
            _buildSettingsItem(
              Icons.info_outline,
              'About',
              'Version 1.0.0',
              theme,
              onTap: () => Get.toNamed(AppRoutes.ABOUT),
            ),
          ], theme),
          ],
        ),
      ),
    );
  }

  Widget _buildSettingsSection(
    String title,
    List<Widget> items,
    ThemeData theme,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title.toUpperCase(), style: theme.textTheme.headlineLarge),
        AppSpacing.vS,
        Container(
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.zero,
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Column(children: items),
        ),
      ],
    );
  }

  Widget _buildSettingsItem(
    IconData icon,
    String title,
    String subtitle,
    ThemeData theme, {
    Widget? trailing,
    Color? color,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: ListTile(
        leading: Icon(icon, color: color ?? theme.colorScheme.primary),
        title: Text(title, style: theme.textTheme.titleMedium),
        subtitle: Text(subtitle, style: theme.textTheme.bodySmall),
        trailing:
            trailing ??
            Icon(
              Icons.chevron_right,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
      ),
    );
  }
}
