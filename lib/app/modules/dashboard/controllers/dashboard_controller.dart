import 'package:get/get.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/models/card_model.dart';
import '../../../data/services/data_store_service.dart';

class DashboardController extends GetxController {
  final store = Get.find<PennyWiseStore>();

  final totalBalance = 0.0.obs;
  final income = 0.0.obs;
  final expenses = 0.0.obs;
  final averageDailySpending = 0.0.obs;
  final monthlyBudget = 0.0.obs;
  final recentTransactions = <Transaction>[].obs;
  final cards = <PaymentCard>[].obs;

  @override
  void onInit() {
    super.onInit();
    _loadDashboardData();

    // Listen for changes in transactions and cards
    store.transactions.watch().listen((_) => _loadDashboardData());
    store.cards.watch().listen((_) => _loadDashboardData());

    // Listen for user changes (budget)
    ever(store.user, (_) => _loadDashboardData());
  }

  void _loadDashboardData() {
    final allTransactions = store.transactions.getAll();
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);

    // Calculate Balance, Income, Expenses
    double inc = 0;
    double exp = 0;
    double monthExp = 0;

    for (var tx in allTransactions) {
      if (tx.date.isAfter(now)) continue;

      if (tx.type == TransactionType.income) {
        inc += tx.amount;
      } else {
        exp += tx.amount;
        if (tx.date.isAfter(
          startOfMonth.subtract(const Duration(seconds: 1)),
        )) {
          monthExp += tx.amount;
        }
      }
    }

    income.value = inc;
    expenses.value = exp;
    totalBalance.value = inc - exp;

    // Monthly Budget from User
    monthlyBudget.value = store.user.value?.monthlyBudget ?? 0.0;

    // Calculate Average Daily Spending for current month
    final daysInMonth = now.day;
    averageDailySpending.value = daysInMonth > 0 ? monthExp / daysInMonth : 0.0;

    // Get 5 most recent transactions
    allTransactions.sort((a, b) => b.date.compareTo(a.date));
    recentTransactions.assignAll(allTransactions.take(5).toList());

    // Load cards
    cards.assignAll(store.cards.getAll());
  }

  void updateBudget(double newBudget) async {
    if (store.user.value != null) {
      final updatedUser = store.user.value!;
      updatedUser.monthlyBudget = newBudget;
      await store.saveUser(updatedUser);
    }
  }
}
