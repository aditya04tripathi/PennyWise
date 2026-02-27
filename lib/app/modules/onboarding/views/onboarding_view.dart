import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/onboarding_controller.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';

class OnboardingView extends GetView<OnboardingController> {
  const OnboardingView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: PageView(
                controller: controller.pageController,
                onPageChanged: (index) {
                  controller.currentPage.value = index;
                  if (index == 1) {
                    FocusScope.of(context).unfocus();
                  }
                },
                children: [_buildWelcomePage(theme), _buildPrivacyPage(theme)],
              ),
            ),
            _buildBottomNav(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomePage(ThemeData theme) {
    return Padding(
      padding: AppSpacing.pL,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.9),
                  spreadRadius: 10,
                  blurRadius: 10,
                  offset: const Offset(0, 0), // changes position of shadow
                ),
              ],
            ),
            child: Image.asset("assets/images/logo.png", height: 200),
          ),
          AppSpacing.vXL,
          Text(
            'Welcome to PennyWise'.toUpperCase(),
            style: theme.textTheme.displayLarge,
          ),
          AppSpacing.vS,
          Text(
            'Let\'s set up your financial profile.',
            style: theme.textTheme.bodyLarge,
          ),
          AppSpacing.vXL,
          TextField(
            controller: controller.nameController,
            textInputAction: TextInputAction.next,
            textCapitalization: TextCapitalization.words,
            onSubmitted: (_) => controller.next(),
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(0),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(0),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(0),
                borderSide: BorderSide.none,
              ),
              labelText: 'What\'s your name?',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacyPage(ThemeData theme) {
    return Padding(
      padding: AppSpacing.pL,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 64, color: theme.colorScheme.primary),
          AppSpacing.vS,
          Text(
            'Your Data is Private'.toUpperCase(),
            style: theme.textTheme.displaySmall,
            textAlign: TextAlign.center,
          ),
          AppSpacing.vS,
          Text(
            'PennyWise uses a local-only storage model. Your financial data never leaves your device.',
            style: theme.textTheme.bodyLarge?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            textAlign: TextAlign.center,
          ),
          AppSpacing.vL,
          _buildInfoItem(
            Icons.storage_rounded,
            'Local Storage',
            'All data is stored securely on your device.',
            theme,
          ),
          _buildInfoItem(
            Icons.cloud_off_rounded,
            'No Cloud',
            'We don\'t have servers that store your financial history.',
            theme,
          ),
          _buildInfoItem(
            Icons.shield_rounded,
            'Full Privacy',
            'Your financial data is never shared with anyone.',
            theme,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(
    IconData icon,
    String title,
    String description,
    ThemeData theme,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      margin: const EdgeInsets.only(top: AppSpacing.s),
      child: Padding(
        padding: AppSpacing.pM,
        child: Row(
          children: [
            Icon(icon, color: theme.colorScheme.primary, size: 24),
            AppSpacing.hM,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title.toUpperCase(), style: theme.textTheme.labelLarge),
                  Text(description, style: theme.textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomNav(ThemeData theme) {
    return Padding(
      padding: AppSpacing.pL,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Obx(
            () => Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                2,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: controller.currentPage.value == index ? 24 : 8,
                  height: 4,
                  decoration: BoxDecoration(
                    color: controller.currentPage.value == index
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline,
                  ),
                ),
              ),
            ),
          ),
          AppSpacing.vXL,
          ElevatedButton(
            onPressed: controller.next,
            child: Obx(
              () => Text(
                controller.currentPage.value == 1 ? 'GET STARTED' : 'NEXT',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
