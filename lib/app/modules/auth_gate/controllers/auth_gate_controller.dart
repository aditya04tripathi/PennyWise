import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import '../../../services/security_service.dart';
import '../../../data/services/data_store_service.dart';
import '../../../routes/app_routes.dart';

class AuthGateController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final security = Get.find<SecurityService>();

  @override
  void onInit() {
    super.onInit();
    // Defer navigation/auth to the next frame to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _authenticate();
    });
  }

  Future<void> _authenticate() async {
    await security.refresh();
    final user = store.user.value;
    if (user == null || user.isOnboardingCompleted != true) {
      Get.offAllNamed(AppRoutes.ONBOARDING);
      return;
    }

    final bioEnabled = security.isBiometricEnabled.value;
    if (bioEnabled) {
      final ok = await security.authenticateWithBiometrics();
      if (ok) {
        Get.offAllNamed(AppRoutes.HOME);
        return;
      }
    }

    if (security.isPinEnabled.value) {
      Get.offAllNamed(AppRoutes.PIN_UNLOCK);
    } else {
      Get.offAllNamed(AppRoutes.PIN_SETUP);
    }
  }
}
