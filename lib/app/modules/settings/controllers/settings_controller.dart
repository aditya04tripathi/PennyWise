import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../services/security_service.dart';
import '../../../data/services/data_store_service.dart';
import '../../../data/models/user_model.dart';
import '../../../data/models/category_model.dart';
import '../../../services/snackbar_service.dart';

class SettingsController extends GetxController {
  final securityService = Get.find<SecurityService>();
  final store = Get.find<PennyWiseStore>();

  final nameController = TextEditingController();
  final selectedCurrency = ''.obs;
  final budgetAlertsEnabled = true.obs;
  final budgetAlertLimitPercent = 80.0.obs;

  @override
  void onInit() {
    super.onInit();
    if (store.user.value != null) {
      nameController.text = store.user.value!.name;
      selectedCurrency.value = store.user.value!.primaryCurrency;
      budgetAlertsEnabled.value = store.user.value!.budgetAlertsEnabled;
      budgetAlertLimitPercent.value = store.user.value!.budgetAlertLimitPercent;
    }
  }

  void toggleBiometrics(bool value) async {
    final success = await securityService.toggleBiometrics(value);
    if (value && !securityService.isBiometricEnabled.value) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Could not enable biometric authentication. Please ensure you have biometrics set up on your device.',
        type: SnackbarType.error,
      );
    }
  }

  void updateName(String name) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.name = name;
      await store.saveUser(updatedUser);
      AppSnackbar.show(
        title: 'Success',
        message: 'Name updated successfully',
        type: SnackbarType.success,
      );
    }
  }

  void updateCurrency(String currency) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.primaryCurrency = currency;
      selectedCurrency.value = currency;
      await store.saveUser(updatedUser);
      AppSnackbar.show(
        title: 'Success',
        message: 'Currency updated to $currency',
        type: SnackbarType.success,
      );
    }
  }

  void updateBudget(double amount) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.monthlyBudget = amount;
      await store.saveUser(updatedUser);

      // Explicitly update the reactive user to trigger listeners
      store.user.value = updatedUser;
      store.user.refresh();

      AppSnackbar.show(
        title: 'Success',
        message: 'Budget updated successfully',
        type: SnackbarType.success,
      );
    }
  }

  Future<void> addCategory(String name, int iconCode, int colorValue) async {
    final newCategory = Category(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      iconCode: iconCode,
      colorValue: colorValue,
    );
    await store.saveCategory(newCategory);
    AppSnackbar.show(
      title: 'Success',
      message: 'Category added successfully',
      type: SnackbarType.success,
    );
  }

  void toggleBudgetAlerts(bool value) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.budgetAlertsEnabled = value;
      budgetAlertsEnabled.value = value;
      await store.saveUser(updatedUser);
    }
  }

  void updateBudgetAlertLimit(double value) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.budgetAlertLimitPercent = value;
      budgetAlertLimitPercent.value = value;
      await store.saveUser(updatedUser);
    }
  }

  void changePin() {
    Get.toNamed('/pin-setup');
  }

  Future<void> deleteAccount() async {
    try {
      // Clear security settings (PIN and Biometrics)
      await securityService.resetAll();

      // Clear Hive data
      await store.transactions.clear();
      await store.categories.clear();
      await store.cards.clear();
      await store.users.clear();
      store.user.value = null;

      Get.offAllNamed('/onboarding');
      AppSnackbar.show(
        title: 'Account Deleted',
        message:
            'Your data and security settings have been permanently removed.',
        type: SnackbarType.success,
      );
    } catch (e) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Failed to delete account: $e',
        type: SnackbarType.error,
      );
    }
  }

  @override
  void onClose() {
    nameController.dispose();
    super.onClose();
  }
}
