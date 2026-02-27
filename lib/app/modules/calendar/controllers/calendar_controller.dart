import 'package:get/get.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/data_store_service.dart';

class CalendarController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  
  final focusedDay = DateTime.now().obs;
  final selectedDay = DateTime.now().obs;
  final transactionsForSelectedDay = <Transaction>[].obs;

  @override
  void onInit() {
    super.onInit();
    _loadTransactionsForSelectedDay();
    
    // Listen for changes
    store.transactions.watch().listen((_) => _loadTransactionsForSelectedDay());
    
    // Listen for selected day changes
    ever(selectedDay, (_) => _loadTransactionsForSelectedDay());
  }

  void _loadTransactionsForSelectedDay() {
    final all = store.transactions.getAll();
    transactionsForSelectedDay.assignAll(
      all.where((tx) => 
        tx.date.year == selectedDay.value.year &&
        tx.date.month == selectedDay.value.month &&
        tx.date.day == selectedDay.value.day
      ).toList(),
    );
  }

  List<Transaction> getTransactionsForDay(DateTime day) {
    return store.transactions.getAll().where((tx) => 
      tx.date.year == day.year &&
      tx.date.month == day.month &&
      tx.date.day == day.day
    ).toList();
  }

  bool hasIncome(DateTime day) {
    final transactions = getTransactionsForDay(day);
    return transactions.any((tx) => tx.type == TransactionType.income);
  }

  bool hasExpense(DateTime day) {
    final transactions = getTransactionsForDay(day);
    return transactions.any((tx) => tx.type == TransactionType.expense);
  }
}
