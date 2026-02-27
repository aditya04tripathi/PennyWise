import 'package:get/get.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/data_store_service.dart';

class RecurringController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final recurringTransactions = <Transaction>[].obs;

  @override
  void onInit() {
    super.onInit();
    _loadRecurring();
    
    // Listen for changes in the store
    store.transactions.watch().listen((event) {
      _loadRecurring();
    });
  }

  void _loadRecurring() {
    recurringTransactions.assignAll(
      store.transactions.getAll().where((tx) => tx.isRecurring).toList(),
    );
  }

  Future<void> deleteRecurring(Transaction transaction) async {
    await store.deleteTransaction(transaction);
  }
}
