import 'package:get/get.dart';
import '../controllers/auth_gate_controller.dart';

class AuthGateBinding extends Bindings {
  @override
  void dependencies() {
    Get.put(AuthGateController());
  }
}
