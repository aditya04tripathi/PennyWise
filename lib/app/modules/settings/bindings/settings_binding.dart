import 'package:get/get.dart';
import '../controllers/settings_controller.dart';
import '../../../services/backup_service.dart';

class SettingsBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SettingsController>(() => SettingsController());
    Get.lazyPut<BackupService>(() => BackupService());
  }
}
