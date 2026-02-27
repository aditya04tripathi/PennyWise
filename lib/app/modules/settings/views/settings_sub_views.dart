import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:pennywise/app/services/backup_service.dart';
import '../controllers/settings_controller.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import 'package:url_launcher/url_launcher.dart';

class DeleteAccountView extends GetView<SettingsController> {
  const DeleteAccountView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('DELETE ACCOUNT')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              Container(
                padding: AppSpacing.pM,
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.heart_broken_rounded,
                  size: 64,
                  color: theme.colorScheme.error,
                ),
              ),
              AppSpacing.vXL,
              Text(
                "WE'RE SAD TO SEE YOU GO",
                style: theme.textTheme.headlineLarge,
                textAlign: TextAlign.center,
              ),
              AppSpacing.vM,
              Text(
                "Deleting your account will permanently remove your transaction history, custom categories, and all financial goals. You've worked hard to track your progress—are you sure you want to start from scratch?",
                style: theme.textTheme.bodyLarge?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              _buildPersuasionPoint(
                Icons.auto_graph_rounded,
                "Lose your financial insights and trends.",
                theme,
              ),
              AppSpacing.vM,
              _buildPersuasionPoint(
                Icons.history_rounded,
                "Your transaction history will be gone forever.",
                theme,
              ),
              AppSpacing.vM,
              _buildPersuasionPoint(
                Icons.security_rounded,
                "All your secure data will be wiped instantly.",
                theme,
              ),
              const SizedBox(height: 64),
              ElevatedButton(
                onPressed: () => Get.back(),
                child: const Text('I WANT TO STAY'),
              ),
              AppSpacing.vM,
              TextButton(
                onPressed: () => _showFinalConfirmation(theme),
                style: TextButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                ),
                child: Text(
                  'PROCEED WITH DELETION',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    color: theme.colorScheme.error,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showFinalConfirmation(ThemeData theme) {
    Get.defaultDialog(
      title: 'FINAL WARNING',
      titlePadding: const EdgeInsets.only(top: 24),
      contentPadding: const EdgeInsets.all(24),
      radius: 0,
      titleStyle: theme.textTheme.headlineLarge,
      middleText:
          'This is your last chance. All data will be wiped and cannot be recovered. Continue?',
      confirm: ElevatedButton(
        onPressed: () => controller.deleteAccount(),
        style: ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.error,
          foregroundColor: Colors.white,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          elevation: 0,
        ),
        child: const Text(
          'DELETE FOREVER',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      cancel: TextButton(
        onPressed: () => Get.back(),
        style: TextButton.styleFrom(
          foregroundColor: theme.colorScheme.onSurface,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        ),
        child: const Text(
          'NEVERMIND',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
    );
  }

  Widget _buildPersuasionPoint(IconData icon, String text, ThemeData theme) {
    return Row(
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.primary),
        AppSpacing.hM,
        Expanded(
          child: Text(
            text,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class AccountView extends GetView<SettingsController> {
  const AccountView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('ACCOUNT')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PROFILE NAME', style: theme.textTheme.labelSmall),
              AppSpacing.vS,
              TextField(
                controller: controller.nameController,
                onSubmitted: (v) => controller.updateName(v),
                decoration: const InputDecoration(hintText: 'Enter your name'),
              ),
              AppSpacing.vXL,
              ElevatedButton(
                onPressed: () =>
                    controller.updateName(controller.nameController.text),
                child: const Text('UPDATE PROFILE'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class CurrencyView extends GetView<SettingsController> {
  const CurrencyView({super.key});

  @override
  Widget build(BuildContext context) {
    final currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('CURRENCY')),
      body: SafeArea(
        child: ListView.separated(
          padding: AppSpacing.pM,
          itemCount: currencies.length,
          separatorBuilder: (context, index) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final currency = currencies[index];
            return Obx(
              () => ListTile(
                title: Text(currency, style: theme.textTheme.labelLarge),
                trailing: controller.selectedCurrency.value == currency
                    ? Icon(Icons.check, color: theme.colorScheme.primary)
                    : null,
                onTap: () {
                  controller.updateCurrency(currency);
                  Get.back();
                },
              ),
            );
          },
        ),
      ),
    );
  }
}

class BudgetSetupView extends GetView<SettingsController> {
  const BudgetSetupView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final budgetController = TextEditingController(
      text:
          controller.store.user.value?.monthlyBudget?.toStringAsFixed(0) ?? '0',
    );

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('MONTHLY BUDGET')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'SET YOUR MONTHLY BUDGET',
                style: theme.textTheme.labelSmall,
              ),
              AppSpacing.vS,
              TextField(
                controller: budgetController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                style: theme.textTheme.displaySmall?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
                decoration: const InputDecoration(
                  prefixText: '\$ ',
                  hintText: '0.00',
                ),
              ),
              AppSpacing.vM,
              Text(
                'This budget will be used to track your spending and show your remaining balance for the month.',
                style: theme.textTheme.bodySmall,
              ),
              AppSpacing.vXL,
              ElevatedButton(
                onPressed: () {
                  final budget = double.tryParse(budgetController.text) ?? 0;
                  controller.updateBudget(budget);
                  Get.back();
                },
                child: const Text('SAVE BUDGET'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AddCategoryView extends GetView<SettingsController> {
  const AddCategoryView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final nameController = TextEditingController();
    final selectedIcon = Icons.category_outlined.obs;
    final selectedColor = AppColors.primary.obs;

    final List<IconData> icons = [
      Icons.shopping_bag_outlined,
      Icons.restaurant_outlined,
      Icons.directions_car_outlined,
      Icons.home_outlined,
      Icons.electric_bolt_outlined,
      Icons.movie_outlined,
      Icons.fitness_center_outlined,
      Icons.medical_services_outlined,
      Icons.school_outlined,
      Icons.flight_outlined,
      Icons.pets_outlined,
      Icons.card_giftcard_outlined,
    ];

    final List<Color> colors = [
      AppColors.primary,
      AppColors.incomeGreen,
      AppColors.expenseRed,
      Colors.blue,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.pink,
      Colors.indigo,
      Colors.brown,
    ];

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('ADD CATEGORY')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('CATEGORY NAME', style: theme.textTheme.labelSmall),
              AppSpacing.vS,
              TextField(
                controller: nameController,
                textCapitalization: TextCapitalization.characters,
                decoration: const InputDecoration(
                  hintText: 'e.g. ENTERTAINMENT',
                ),
              ),
              AppSpacing.vXL,
              Text('SELECT ICON', style: theme.textTheme.labelSmall),
              AppSpacing.vM,
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 6,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                ),
                itemCount: icons.length,
                itemBuilder: (context, index) {
                  return Obx(
                    () => GestureDetector(
                      onTap: () => selectedIcon.value = icons[index],
                      child: Container(
                        decoration: BoxDecoration(
                          color: selectedIcon.value == icons[index]
                              ? theme.colorScheme.primary.withOpacity(0.1)
                              : theme.colorScheme.surface,
                          border: Border.all(
                            color: selectedIcon.value == icons[index]
                                ? theme.colorScheme.primary
                                : theme.colorScheme.outline,
                            width: 2,
                          ),
                        ),
                        child: Icon(
                          icons[index],
                          color: selectedIcon.value == icons[index]
                              ? theme.colorScheme.primary
                              : theme.colorScheme.onSurface,
                        ),
                      ),
                    ),
                  );
                },
              ),
              AppSpacing.vXL,
              Text('SELECT COLOR', style: theme.textTheme.labelSmall),
              AppSpacing.vM,
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                ),
                itemCount: colors.length,
                itemBuilder: (context, index) {
                  return Obx(
                    () => GestureDetector(
                      onTap: () => selectedColor.value = colors[index],
                      child: Container(
                        decoration: BoxDecoration(
                          color: colors[index],
                          border: Border.all(
                            color: selectedColor.value == colors[index]
                                ? theme.colorScheme.onSurface
                                : Colors.transparent,
                            width: 3,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
              AppSpacing.vXL,
              ElevatedButton(
                onPressed: () {
                  if (nameController.text.isNotEmpty) {
                    controller.addCategory(
                      nameController.text.toUpperCase(),
                      selectedIcon.value.codePoint,
                      selectedColor.value.value,
                    );
                    Get.back();
                  }
                },
                child: const Text('CREATE CATEGORY'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BudgetAlertsView extends GetView<SettingsController> {
  const BudgetAlertsView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('BUDGET ALERTS')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Obx(
                () => Container(
                  padding: AppSpacing.pM,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    border: Border.all(color: theme.colorScheme.outline),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.notifications_active_outlined,
                        color: theme.colorScheme.primary,
                      ),
                      AppSpacing.hM,
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'ENABLE ALERTS',
                              style: theme.textTheme.labelLarge,
                            ),
                            Text(
                              'Get notified when budget is low',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: controller.budgetAlertsEnabled.value,
                        onChanged: controller.toggleBudgetAlerts,
                        activeColor: theme.colorScheme.primary,
                      ),
                    ],
                  ),
                ),
              ),
              AppSpacing.vXL,
              Text('ALERT THRESHOLD', style: theme.textTheme.labelSmall),
              AppSpacing.vM,
              Obx(
                () => Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'NOTIFY AT ${controller.budgetAlertLimitPercent.value.toInt()}%',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        Text(
                          'OF TOTAL BUDGET',
                          style: theme.textTheme.labelSmall,
                        ),
                      ],
                    ),
                    Slider(
                      value: controller.budgetAlertLimitPercent.value,
                      min: 50,
                      max: 100,
                      divisions: 10,
                      label:
                          '${controller.budgetAlertLimitPercent.value.toInt()}%',
                      onChanged: controller.updateBudgetAlertLimit,
                      activeColor: theme.colorScheme.primary,
                    ),
                  ],
                ),
              ),
              AppSpacing.vM,
              Text(
                'We will send you a push notification when your monthly spending reaches this percentage of your total budget.',
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BackupRestoreView extends GetView<SettingsController> {
  const BackupRestoreView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final encryptEnabled = false.obs;
    final passwordController = TextEditingController();

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('BACKUP & RESTORE')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: AppSpacing.pM,
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withOpacity(0.08),
                  border: Border.all(color: theme.colorScheme.error),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      color: theme.colorScheme.error,
                    ),
                    AppSpacing.hM,
                    Expanded(
                      child: Text(
                        'Exported files may contain sensitive personal financial data. Keep backups secure and confidential.',
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
              AppSpacing.vXL,
              Obx(
                () => SwitchListTile.adaptive(
                  title: Text(
                    'Enable Encryption',
                    style: theme.textTheme.labelLarge,
                  ),
                  subtitle: Text(
                    'Encrypt CSV with a password (AES-GCM)',
                    style: theme.textTheme.bodySmall,
                  ),
                  value: encryptEnabled.value,
                  onChanged: (v) => encryptEnabled.value = v,
                  activeColor: theme.colorScheme.primary,
                ),
              ),
              Obx(
                () => encryptEnabled.value
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'ENCRYPTION PASSWORD',
                            style: theme.textTheme.labelSmall,
                          ),
                          AppSpacing.vS,
                          TextField(
                            controller: passwordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              hintText: 'Enter a strong password',
                            ),
                          ),
                          AppSpacing.vM,
                        ],
                      )
                    : const SizedBox.shrink(),
              ),
              AppSpacing.vXL,
              ElevatedButton(
                onPressed: () async {
                  final pwd = encryptEnabled.value
                      ? passwordController.text
                      : null;
                  await Get.find<BackupService>().exportAndShare(password: pwd);
                },
                child: const Text('EXPORT DATA TO CSV'),
              ),
              AppSpacing.vM,
              OutlinedButton(
                onPressed: () async {
                  await Get.find<BackupService>().importFromCsv();
                },
                child: const Text('IMPORT DATA FROM CSV'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AboutView extends StatelessWidget {
  const AboutView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('ABOUT')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 40),
              Container(
                padding: AppSpacing.pM,
                decoration: BoxDecoration(color: theme.colorScheme.primary),
                child: const Icon(
                  Icons.wallet_rounded,
                  size: 64,
                  color: Colors.white,
                ),
              ),
              AppSpacing.vL,
              Text(
                'PENNYWISE',
                style: theme.textTheme.displayMedium?.copyWith(
                  fontWeight: FontWeight.w900,
                ),
              ),
              Text('VERSION 1.0.0', style: theme.textTheme.labelSmall),
              AppSpacing.vXL,
              Text(
                'A minimalist, brutalist financial tracker built for privacy and speed. Your data never leaves your device.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyLarge,
              ),
              AppSpacing.vXL,
              _buildDeveloperProfile(theme),
              const Spacer(),
              Text(
                'MADE WITH ♥ IN FLUTTER',
                style: theme.textTheme.labelSmall?.copyWith(letterSpacing: 2),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDeveloperProfile(ThemeData theme) {
    return Container(
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline, width: 2),
      ),
      child: Column(
        children: [
          Row(
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: ClipRect(
                  child: Image.asset(
                    'assets/images/aditya.jpg',
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              AppSpacing.hM,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ADITYA TRIPATHI',
                      style: theme.textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text(
                      'LEAD DEVELOPER',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          AppSpacing.vM,
          Text(
            'Passionately building tools that empower users with full control over their personal data.',
            style: theme.textTheme.bodySmall?.copyWith(height: 1.4),
          ),
          AppSpacing.vM,
          Row(
            children: [
              _buildSocialIcon(Icons.code_rounded, theme),
              AppSpacing.hS,
              _buildSocialIcon(Icons.language_rounded, theme),
              AppSpacing.hS,
              _buildSocialIcon(Icons.mail_outline_rounded, theme),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSocialIcon(IconData icon, ThemeData theme) {
    return GestureDetector(
      onTap: () async {
        final url = icon == Icons.code_rounded
            ? 'https://github.com/aditya04tripathi'
            : icon == Icons.language_rounded
            ? 'https://adityatripathi.dev'
            : 'mailto:me@adityatripathi.dev';
        if (await canLaunchUrl(Uri.parse(url))) {
          await launchUrl(Uri.parse(url));
        }
      },
      child: Container(
        padding: AppSpacing.pS,
        decoration: BoxDecoration(
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Icon(icon, size: 16, color: theme.colorScheme.onSurface),
      ),
    );
  }
}
