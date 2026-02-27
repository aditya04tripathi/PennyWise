import 'package:get/get.dart';
import 'package:pennywise/app/modules/auth_gate/views/pin_unlock_view.dart';
import '../modules/card_management/bindings/card_management_binding.dart';
import '../modules/card_management/views/add_card_view.dart';
import '../modules/add_transaction/bindings/add_transaction_binding.dart';
import '../modules/add_transaction/views/add_transaction_view.dart';
import '../modules/transactions/bindings/transactions_binding.dart';
import '../modules/transactions/views/transactions_view.dart';
import '../modules/main_navigation/bindings/main_navigation_binding.dart';
import '../modules/pin_setup/bindings/pin_setup_binding.dart';
import '../modules/pin_setup/views/pin_setup_view.dart';
import '../modules/main_navigation/views/main_navigation_view.dart';
import '../modules/settings/bindings/settings_binding.dart';
import '../modules/settings/views/settings_sub_views.dart';
import '../modules/onboarding/bindings/onboarding_binding.dart';
import '../modules/onboarding/views/onboarding_view.dart';
import '../modules/auth_gate/bindings/auth_gate_binding.dart';
import '../modules/auth_gate/views/auth_gate_view.dart';
import '../modules/auth_gate/bindings/pin_unlock_binding.dart';

class AppRoutes {
  static const ONBOARDING = '/onboarding';
  static const AUTH_GATE = '/auth-gate';
  static const PIN_UNLOCK = '/pin-unlock';
  static const HOME = '/home';
  static const ADD_CARD = '/add-card';
  static const ADD_TRANSACTION = '/add-transaction';
  static const TRANSACTIONS = '/transactions';
  static const PIN_SETUP = '/pin-setup';
  static const ACCOUNT = '/account';
  static const CURRENCY = '/currency';
  static const BACKUP_RESTORE = '/backup-restore';
  static const BUDGET_SETUP = '/budget-setup';
  static const ADD_CATEGORY = '/add-category';
  static const BUDGET_ALERTS = '/budget-alerts';
  static const DELETE_ACCOUNT = '/delete-account';
  static const ABOUT = '/about';

  static final routes = [
    GetPage(
      name: ONBOARDING,
      page: () => const OnboardingView(),
      binding: OnboardingBinding(),
    ),
    GetPage(
      name: AUTH_GATE,
      page: () => const AuthGateView(),
      binding: AuthGateBinding(),
    ),
    GetPage(
      name: PIN_UNLOCK,
      page: () => const PinUnlockView(),
      binding: PinUnlockBinding(),
    ),
    GetPage(
      name: HOME,
      page: () => const MainNavigationView(),
      binding: MainNavigationBinding(),
    ),
    GetPage(
      name: ADD_CARD,
      page: () => const AddCardView(),
      binding: CardManagementBinding(),
    ),
    GetPage(
      name: ADD_TRANSACTION,
      page: () => const AddTransactionView(),
      binding: AddTransactionBinding(),
      fullscreenDialog: true,
    ),
    GetPage(
      name: TRANSACTIONS,
      page: () => const TransactionsView(),
      binding: TransactionsBinding(),
    ),
    GetPage(
      name: PIN_SETUP,
      page: () => const PinSetupView(),
      binding: PinSetupBinding(),
    ),
    GetPage(
      name: ACCOUNT,
      page: () => const AccountView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: CURRENCY,
      page: () => const CurrencyView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: BACKUP_RESTORE,
      page: () => const BackupRestoreView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: BUDGET_SETUP,
      page: () => const BudgetSetupView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: ADD_CATEGORY,
      page: () => const AddCategoryView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: BUDGET_ALERTS,
      page: () => const BudgetAlertsView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: DELETE_ACCOUNT,
      page: () => const DeleteAccountView(),
      binding: SettingsBinding(),
    ),
    GetPage(
      name: ABOUT,
      page: () => const AboutView(),
      binding: SettingsBinding(),
    ),
  ];
}
