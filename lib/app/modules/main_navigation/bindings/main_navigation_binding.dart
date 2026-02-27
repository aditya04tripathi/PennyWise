import 'package:get/get.dart';
import '../controllers/main_navigation_controller.dart';
import '../../dashboard/controllers/dashboard_controller.dart';
import '../../calendar/controllers/calendar_controller.dart';
import '../../planning/controllers/planning_controller.dart';
import '../../settings/controllers/settings_controller.dart';
import '../../card_management/controllers/card_management_controller.dart';
import '../../../controllers/transaction_controller.dart';
import '../../recurring/controllers/recurring_controller.dart';
import '../../transactions/controllers/transaction_list_controller.dart';

class MainNavigationBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainNavigationController>(() => MainNavigationController());
    Get.lazyPut<DashboardController>(() => DashboardController());
    Get.lazyPut<CalendarController>(() => CalendarController());
    Get.lazyPut<PlanningController>(() => PlanningController());
    Get.lazyPut<SettingsController>(() => SettingsController());
    Get.lazyPut<CardManagementController>(() => CardManagementController());
    Get.lazyPut<TransactionController>(() => TransactionController());
    Get.lazyPut<RecurringController>(() => RecurringController());
    Get.lazyPut<TransactionListController>(() => TransactionListController());
  }
}
