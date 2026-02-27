import 'package:get/get.dart';
import '../controllers/pin_unlock_controller.dart';

class PinUnlockBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(PinUnlockController());
  }
}
