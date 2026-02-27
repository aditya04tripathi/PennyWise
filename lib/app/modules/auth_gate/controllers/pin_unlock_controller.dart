import 'package:get/get.dart';
import '../../../services/security_service.dart';
import '../../../routes/app_routes.dart';

class PinUnlockController extends GetxController {
  final security = Get.find<SecurityService>();

  final isVerifying = false.obs;
  final error = ''.obs;
  final enteredPin = ''.obs;
  final showPin = false.obs;
  final shouldResetUI = false.obs;

  @override
  void onInit() {
    super.onInit();
    _tryBiometricFirst();
  }

  Future<void> _tryBiometricFirst() async {
    await security.refresh();
    if (security.isBiometricEnabled.value) {
      try {
        final ok = await security.authenticateWithBiometrics();
        if (ok) {
          Get.offAllNamed(AppRoutes.HOME);
          return;
        }
      } catch (e) {
        error.value = 'Biometric error: $e';
      }
    }
    showPin.value = true;
  }

  Future<void> retryBiometric() async {
    error.value = '';
    await _tryBiometricFirst();
  }

  Future<void> verifyWithPinString(String pin) async {
    enteredPin.value = pin;
    await verify();
  }

  Future<void> verify() async {
    final pin = enteredPin.value;
    if (pin.length != 4) {
      error.value = 'PIN must be 4 digits';
      return;
    }
    isVerifying.value = true;
    final ok = await security.verifyPin(pin);
    isVerifying.value = false;
    if (ok) {
      error.value = '';
      Get.offAllNamed(AppRoutes.HOME);
    } else {
      error.value = 'Incorrect PIN';
      enteredPin.value = '';
      shouldResetUI.value = !shouldResetUI.value; // Trigger UI reset
    }
  }
}
