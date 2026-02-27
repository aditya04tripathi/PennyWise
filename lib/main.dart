import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'app/data/models/user_model.dart';
import 'app/data/models/transaction_model.dart';
import 'app/data/models/category_model.dart';
import 'app/data/models/card_model.dart';
import 'app/services/security_service.dart';
import 'app/services/notification_service.dart';
import 'app/data/services/data_store_service.dart';
import 'core/theme/app_theme.dart';
import 'app/services/dev_seed_service.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'app/services/ad_service.dart';

import 'app/routes/app_routes.dart';
import 'package:flutter/services.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  await Hive.initFlutter();

  // Register Adapters
  Hive.registerAdapter(UserAdapter());
  Hive.registerAdapter(TransactionAdapter());
  Hive.registerAdapter(TransactionTypeAdapter());
  Hive.registerAdapter(RecurringFrequencyAdapter());
  Hive.registerAdapter(CategoryAdapter());
  Hive.registerAdapter(PaymentCardAdapter());
  Hive.registerAdapter(CardTypeAdapter());

  // Initialize Services
  final store = await Get.put(PennyWiseStore()).init();
  Get.put(SecurityService());
  await Get.put(NotificationService()).init();
  await MobileAds.instance.initialize();
  await Get.put(AdService()).init();

  // Seed initial categories if empty
  if (store.categories.getAll().isEmpty) {
    await store.categories.addAll([
      Category(id: '1', name: 'Food', iconCode: 0xe527, colorValue: 0xFFF59E0B),
      Category(
        id: '2',
        name: 'Transport',
        iconCode: 0xe1d1,
        colorValue: 0xFF2563EB,
      ),
      Category(
        id: '3',
        name: 'Shopping',
        iconCode: 0xe59c,
        colorValue: 0xFFDC2626,
      ),
      Category(
        id: '4',
        name: 'Income',
        iconCode: 0xe040,
        colorValue: 0xFF16A34A,
      ),
      Category(
        id: '5',
        name: 'Housing',
        iconCode: 0xe318,
        colorValue: 0xFF94A3B8,
      ),
    ]);
  }

  await Get.put(DevSeedService()).seedIfEmpty(store);

  final initialRoute = store.user.value?.isOnboardingCompleted == true
      ? AppRoutes.AUTH_GATE
      : AppRoutes.ONBOARDING;

  runApp(PennyWise(initialRoute: initialRoute));
}

class PennyWise extends StatelessWidget {
  final String initialRoute;
  const PennyWise({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return GetMaterialApp(
      title: 'PennyWise',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: ThemeMode.system,
      initialRoute: initialRoute,
      getPages: AppRoutes.routes,
    );
  }
}
