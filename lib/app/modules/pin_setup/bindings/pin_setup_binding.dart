import 'package:get/get.dart';
import '../controllers/pin_setup_controller.dart';

class PinSetupBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<PinSetupController>(() => PinSetupController());
  }
}
