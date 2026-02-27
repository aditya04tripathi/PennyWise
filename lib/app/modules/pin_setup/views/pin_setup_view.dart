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
}
