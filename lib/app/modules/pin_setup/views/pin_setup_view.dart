import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/pin_setup_controller.dart';
import '../../../../core/values/spacing.dart';

class PinSetupView extends GetView<PinSetupController> {
  const PinSetupView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SafeArea(
      bottom: true,
      top: false,
      child: Scaffold(
        backgroundColor: theme.scaffoldBackgroundColor,
        appBar: AppBar(title: const Text('SETUP SECURITY')),
        body: Padding(
          padding: AppSpacing.pM,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('PROTECT YOUR DATA', style: theme.textTheme.displaySmall),
              AppSpacing.vS,
              Text(
                'Set a 4-digit PIN and/or enable Biometrics to secure your financial information.',
                style: theme.textTheme.bodyMedium,
              ),
              const SizedBox(height: 48),
              _buildPinField(theme),
              AppSpacing.vXL,
              _buildBiometricToggle(theme),
              const Spacer(),
              Obx(
                () => ElevatedButton(
                  onPressed:
                      (controller.pin.value.length == 4 ||
                          controller.isBiometricEnabled.value)
                      ? controller.saveAndContinue
                      : null,
                  child: const Text('CONTINUE'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPinField(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('4-DIGIT PIN', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        TextField(
          onChanged: (v) => controller.pin.value = v,
          keyboardType: TextInputType.number,
          textInputAction: TextInputAction.done,
          onSubmitted: (_) => controller.saveAndContinue(),
          maxLength: 4,
          obscureText: true,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w900,
          ),
          decoration: const InputDecoration(hintText: '****', counterText: ''),
        ),
      ],
    );
  }

  Widget _buildBiometricToggle(ThemeData theme) {
    return Obx(
      () => Container(
        padding: AppSpacing.pM,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Row(
          children: [
            Icon(Icons.fingerprint, color: theme.colorScheme.primary),
            AppSpacing.hM,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BIOMETRIC LOGIN', style: theme.textTheme.labelLarge),
                  Text(
                    'Use FaceID/TouchID to login',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Switch(
              value: controller.isBiometricEnabled.value,
              onChanged: (v) => controller.isBiometricEnabled.value = v,
              activeColor: theme.colorScheme.primary,
            ),
          ],
        ),
      ),
    );
  }
}
