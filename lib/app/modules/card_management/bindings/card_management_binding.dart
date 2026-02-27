import 'package:get/get.dart';
import '../controllers/card_management_controller.dart';

class CardManagementBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<CardManagementController>(() => CardManagementController());
  }
}
