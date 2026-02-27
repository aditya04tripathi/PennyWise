import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/data_store_service.dart';
import '../../../services/security_service.dart';
import '../../../services/snackbar_service.dart';

class OnboardingController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final securityService = Get.find<SecurityService>();

  final nameController = TextEditingController();
  final selectedCurrency = 'USD'.obs;
  final currentPage = 0.obs;
  final pageController = PageController();

  final List<String> currencies = [
    'USD',
    'EUR',
    'GBP',
    'INR',
    'JPY',
    'AUD',
    'CAD',
  ];

  Future<void> setupBiometrics() async {
    final supported = await securityService.isBiometricSupported();
    if (supported) {
      await securityService.toggleBiometrics(true);
      if (securityService.isBiometricEnabled.value) {
        AppSnackbar.show(
          title: 'Success',
          message: 'Biometric login enabled',
          type: SnackbarType.success,
        );
      }
    } else {
      AppSnackbar.show(
        title: 'Error',
        message: 'Biometrics not supported on this device',
        type: SnackbarType.error,
      );
    }
  }

  void setupPin() {
    // Show a simple dialog for PIN setup in this demo
    String pin = '';
    final theme = Get.theme;
    Get.defaultDialog(
      title: 'SETUP PIN',
      titleStyle: theme.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
      ),
      titlePadding: const EdgeInsets.only(top: 24, left: 24, right: 24),
      contentPadding: const EdgeInsets.all(24),
      radius: 0,
      backgroundColor: theme.colorScheme.surface,
      content: Column(
        children: [
          Text(
            'ENTER A 4-DIGIT PIN TO SECURE YOUR ACCOUNT.',
            style: theme.textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          TextField(
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            maxLength: 4,
            obscureText: true,
            onChanged: (v) => pin = v,
            style: theme.textTheme.displaySmall?.copyWith(
              fontWeight: FontWeight.w900,
              letterSpacing: 16,
              color: theme.colorScheme.primary,
            ),
            onSubmitted: (_) async {
              if (pin.length == 4) {
                await securityService.savePin(pin);
                Get.back();
                AppSnackbar.show(
                  title: 'Success',
                  message: 'PIN setup successfully',
                  type: SnackbarType.success,
                );
              } else {
                AppSnackbar.show(
                  title: 'Error',
                  message: 'PIN must be 4 digits',
                  type: SnackbarType.error,
            );
          }
        },
            decoration: const InputDecoration(
              hintText: '****',
              hintStyle: TextStyle(letterSpacing: 16),
              counterText: '',
            ),
          ),
        ],
      ),
      confirm: ElevatedButton(
        onPressed: () async {
          if (pin.length == 4) {
            await securityService.savePin(pin);
            Get.back();
            AppSnackbar.show(
              title: 'Success',
              message: 'PIN setup successfully',
              type: SnackbarType.success,
            );
          } else {
            AppSnackbar.show(
              title: 'Error',
              message: 'PIN must be 4 digits',
              type: SnackbarType.error,
            );
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          minimumSize: const Size(120, 44),
        ),
        child: const Text('SETUP PIN', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
      cancel: TextButton(
        onPressed: () => Get.back(),
        style: TextButton.styleFrom(
          foregroundColor: theme.colorScheme.onSurface,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          minimumSize: const Size(120, 44),
        ),
        child: const Text('CANCEL', style: TextStyle(fontWeight: FontWeight.w900)),
      ),
    );
  }

  void next() {
    if (currentPage.value < 1) {
      pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      completeOnboarding();
    }
  }

  Future<void> completeOnboarding() async {
    if (nameController.text.isEmpty) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Please enter your name',
        type: SnackbarType.error,
      );
      return;
    }

    final newUser = User(
      name: nameController.text,
      primaryCurrency: selectedCurrency.value,
      isBiometricEnabled: securityService.isBiometricEnabled.value,
      isOnboardingCompleted: true,
    );

    await store.saveUser(newUser);
    Get.offAllNamed('/pin-setup');
  }

  @override
  void onClose() {
    nameController.dispose();
    pageController.dispose();
    super.onClose();
  }
}
