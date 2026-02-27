import 'package:get/get.dart';
import '../controllers/transaction_list_controller.dart';

class TransactionsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TransactionListController>(() => TransactionListController());
  }
}
