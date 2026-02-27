import 'package:hive/hive.dart';

part 'user_model.g.dart';

@HiveType(typeId: 0)
class User extends HiveObject {
  @HiveField(0)
  String name;

  @HiveField(1)
  String primaryCurrency;

  @HiveField(2)
  String? pin;

  @HiveField(3)
  bool isBiometricEnabled;

  @HiveField(4)
  bool isOnboardingCompleted;

  @HiveField(5)
  double? monthlyBudget;

  @HiveField(6)
  double budgetAlertLimitPercent;

  @HiveField(7)
  bool budgetAlertsEnabled;

  User({
    required this.name,
    required this.primaryCurrency,
    this.pin,
    this.isBiometricEnabled = false,
    this.isOnboardingCompleted = false,
    this.monthlyBudget,
    this.budgetAlertLimitPercent = 80.0,
    this.budgetAlertsEnabled = true,
  });
}
