import 'package:get/get.dart';
import '../../../data/services/data_store_service.dart';
import '../../../services/security_service.dart';

class PinSetupController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final securityService = Get.find<SecurityService>();

  final pin = ''.obs;
  final isBiometricEnabled = false.obs;

  @override
  void onInit() {
    super.onInit();
    isBiometricEnabled.value = securityService.isBiometricEnabled.value;
  }

  void toggleBiometrics(bool value) async {
    if (value) {
      final supported = await securityService.isBiometricSupported();
      if (supported) {
        await securityService.toggleBiometrics(true);
        isBiometricEnabled.value = securityService.isBiometricEnabled.value;
      } else {
        Get.snackbar('Error', 'Biometrics not supported');
      }
    } else {
      await securityService.toggleBiometrics(false);
      isBiometricEnabled.value = false;
    }
  }

  Future<void> saveAndContinue() async {
    if (pin.value.length == 4) {
      await securityService.savePin(pin.value);
    }

    if (pin.value.length < 4 && !isBiometricEnabled.value) {
      Get.snackbar('Security Required', 'Please set a PIN or enable Biometrics');
      return;
    }

    // Update user profile
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.isBiometricEnabled = isBiometricEnabled.value;
      await store.saveUser(updatedUser);
    }

    Get.offAllNamed('/home');
  }
}
