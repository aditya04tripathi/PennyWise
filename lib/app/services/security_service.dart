import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:get/get.dart';

class SecurityService extends GetxService {
  final LocalAuthentication _auth = LocalAuthentication();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  final isBiometricEnabled = false.obs;
  final isPinEnabled = false.obs;
  final isLoaded = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadSecuritySettings();
  }

  Future<void> refresh() async {
    await _loadSecuritySettings();
  }

  Future<void> _loadSecuritySettings() async {
    final bioEnabled = await _storage.read(key: 'biometric_enabled');
    isBiometricEnabled.value = bioEnabled == 'true';

    final pin = await _storage.read(key: 'user_pin');
    isPinEnabled.value = pin != null;
    isLoaded.value = true;
  }

  /// Check if the device supports biometric authentication
  Future<bool> isBiometricSupported() async {
    final bool canAuthenticateWithBiometrics = await _auth.canCheckBiometrics;
    final bool canAuthenticate =
        canAuthenticateWithBiometrics || await _auth.isDeviceSupported();
    return canAuthenticate;
  }

  /// Trigger the Native Biometric Authentication dialog
  Future<bool> authenticateWithBiometrics() async {
    try {
      final available = await _auth.getAvailableBiometrics();
      if (available.isEmpty) {
        return false;
      }
      final bool didAuthenticate = await _auth.authenticate(
        localizedReason: 'Please authenticate to access PennyWise',
        biometricOnly: true,
        persistAcrossBackgrounding: true,
      );
      return didAuthenticate;
    } catch (e) {
      return false;
    }
  }

  /// Toggle biometric setting and store securely
  Future<bool> toggleBiometrics(bool enabled) async {
    if (enabled) {
      final authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        await _storage.write(key: 'biometric_enabled', value: 'true');
        isBiometricEnabled.value = true;
        return true;
      }
      return false;
    } else {
      await _storage.write(key: 'biometric_enabled', value: 'false');
      isBiometricEnabled.value = false;
      return true;
    }
  }

  /// Securely save a PIN
  Future<void> savePin(String pin) async {
    await _storage.write(key: 'user_pin', value: pin);
    isPinEnabled.value = true;
  }

  /// Verify a PIN
  Future<bool> verifyPin(String inputPin) async {
    final storedPin = await _storage.read(key: 'user_pin');
    return storedPin == inputPin;
  }

  /// Reset all security settings (PIN and Biometrics)
  Future<void> resetAll() async {
    await _storage.deleteAll();
    isBiometricEnabled.value = false;
    isPinEnabled.value = false;
  }
}
