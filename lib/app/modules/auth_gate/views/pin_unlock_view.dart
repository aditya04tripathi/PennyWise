import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../core/values/spacing.dart';
import '../controllers/pin_unlock_controller.dart';

class PinUnlockView extends StatefulWidget {
  const PinUnlockView({super.key});

  @override
  State<PinUnlockView> createState() => _PinUnlockViewState();
}

class _PinUnlockViewState extends State<PinUnlockView> {
  final controller = Get.find<PinUnlockController>();
  final d1 = TextEditingController();
  final d2 = TextEditingController();
  final d3 = TextEditingController();
  final d4 = TextEditingController();
  final f1 = FocusNode();
  final f2 = FocusNode();
  final f3 = FocusNode();
  final f4 = FocusNode();

  @override
  void initState() {
    super.initState();
    ever(controller.shouldResetUI, (_) {
      d1.clear();
      d2.clear();
      d3.clear();
      d4.clear();
      FocusScope.of(context).unfocus();
      FocusScope.of(context).requestFocus(f1);
    });
  }

  @override
  void dispose() {
    d1.dispose();
    d2.dispose();
    d3.dispose();
    d4.dispose();
    f1.dispose();
    f2.dispose();
    f3.dispose();
    f4.dispose();
    super.dispose();
  }

  void updateAndVerify() {
    final pin = '${d1.text}${d2.text}${d3.text}${d4.text}';
    controller.verifyWithPinString(pin);
  }

  Widget box(TextEditingController c, FocusNode f, FocusNode? next) {
    return Container(
      width: 68,
      height: 72,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        border: Border.all(color: Theme.of(context).colorScheme.outline),
      ),
      child: Center(
        child: TextField(
          controller: c,
          focusNode: f,
          maxLength: 1,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          obscureText: true,
          style: Theme.of(context).textTheme.displaySmall?.copyWith(
            fontWeight: FontWeight.w900,
            color: Theme.of(context).colorScheme.primary,
          ),
          decoration: const InputDecoration(
            counterText: '',
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
          ),
          onChanged: (v) {
            if (v.isNotEmpty) {
              if (next != null) {
                FocusScope.of(context).requestFocus(next);
              } else {
                FocusScope.of(context).unfocus();
                updateAndVerify();
              }
            }
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('UNLOCK')),
      body: SafeArea(
        child: Padding(
          padding: AppSpacing.pL,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('ENTER YOUR PIN', style: theme.textTheme.labelSmall),
              AppSpacing.vM,
              _BiometricRow(theme: theme, onRetry: controller.retryBiometric),
              AppSpacing.vL,
              Obx(() {
                if (!controller.showPin.value) {
                  return Text(
                    'Trying biometric...',
                    style: theme.textTheme.bodySmall,
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        box(d1, f1, f2),
                        AppSpacing.hL,
                        box(d2, f2, f3),
                        AppSpacing.hL,
                        box(d3, f3, f4),
                        AppSpacing.hL,
                        box(d4, f4, null),
                      ],
                    ),
                    AppSpacing.vM,
                    Obx(
                      () => controller.error.value.isNotEmpty
                          ? Text(
                              controller.error.value,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.error,
                              ),
                            )
                          : const SizedBox.shrink(),
                    ),
                  ],
                );
              }),
              const Spacer(),
              Obx(
                () => ElevatedButton(
                  onPressed: controller.isVerifying.value
                      ? null
                      : () => updateAndVerify(),
                  child: const Text('UNLOCK'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BiometricRow extends StatelessWidget {
  final ThemeData theme;
  final VoidCallback onRetry;
  const _BiometricRow({required this.theme, required this.onRetry});
  @override
  Widget build(BuildContext context) {
    final controller = Get.find<PinUnlockController>();
    return Obx(() {
      if (!controller.security.isBiometricEnabled.value) {
        return const SizedBox.shrink();
      }
      return Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.fingerprint),
              label: const Text('TRY FACE/TOUCH AGAIN'),
            ),
          ),
        ],
      );
    });
  }
}
