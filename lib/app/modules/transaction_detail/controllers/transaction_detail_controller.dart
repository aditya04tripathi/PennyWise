import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/data_store_service.dart';

class TransactionDetailController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final transaction = Rxn<Transaction>();
  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    _load();
  }

  void _load() {
    try {
      isLoading.value = true;
      final args = Get.arguments;
      if (args is Transaction) {
        transaction.value = args;
      } else {
        Get.snackbar(
          'ERROR',
          'Invalid transaction data',
          snackPosition: SnackPosition.BOTTOM,
        );
        Get.back();
      }
    } finally {
      isLoading.value = false;
    }
  }
}
