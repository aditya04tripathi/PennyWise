import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/models/category_model.dart';
import '../../../data/services/data_store_service.dart';

class PlanningController extends GetxController {
  final store = Get.find<PennyWiseStore>();

  final categorySpending = <String, double>{}.obs;
  final netTrend = <DateTime, double>{}.obs;
  final monthlyIncome = 0.0.obs;
  final monthlyExpenses = 0.0.obs;
  final recurringTransactions = <Transaction>[].obs;

  @override
  void onInit() {
    super.onInit();
    _loadPlanningData();

    // Listen for changes
    store.transactions.watch().listen((_) => _loadPlanningData());
    store.categories.watch().listen((_) => _loadPlanningData());
  }

  void _loadPlanningData() {
    final all = store.transactions.getAll();
    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 30));

    // Current Month Data
    double inc = 0;
    double exp = 0;
    final Map<String, double> catSpending = {};
    final Map<DateTime, double> trend = {};

    // Initialize trend map with 0 for all 30 days
    for (int i = 0; i <= 30; i++) {
      final date = DateTime(now.year, now.month, now.day - i);
      trend[date] = 0;
    }

    for (var tx in all) {
      final txDate = DateTime(tx.date.year, tx.date.month, tx.date.day);

      // Categorical Spending (Current Month)
      if (tx.date.year == now.year && tx.date.month == now.month) {
        if (tx.type == TransactionType.income) {
          inc += tx.amount;
        } else {
          exp += tx.amount;
          final catName =
              store.categories.getById(tx.categoryId)?.name ?? 'Other';
          catSpending[catName] = (catSpending[catName] ?? 0) + tx.amount;
        }
      }

      // 30-Day Trend (Net: Income - Expense)
      if (txDate.isAfter(thirtyDaysAgo.subtract(const Duration(days: 1))) &&
          txDate.isBefore(now.add(const Duration(days: 1)))) {
        if (tx.type == TransactionType.income) {
          trend[txDate] = (trend[txDate] ?? 0) + tx.amount;
        } else {
          trend[txDate] = (trend[txDate] ?? 0) - tx.amount;
        }
      }
    }

    monthlyIncome.value = inc;
    monthlyExpenses.value = exp;
    categorySpending.assignAll(catSpending);

    // Sort trend by date ascending
    final sortedTrend = Map.fromEntries(
      trend.entries.toList()..sort((a, b) => a.key.compareTo(b.key)),
    );
    netTrend.assignAll(sortedTrend);

    // Recurring Transactions
    recurringTransactions.assignAll(all.where((tx) => tx.isRecurring).toList());
  }

  Future<void> addCategory(String name, int iconCode, int colorValue) async {
    final newCategory = Category(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: name,
      iconCode: iconCode,
      colorValue: colorValue,
    );
    await store.saveCategory(newCategory);
  }
}
