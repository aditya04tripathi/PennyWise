import 'package:hive/hive.dart';

part 'transaction_model.g.dart';

@HiveType(typeId: 1)
enum TransactionType {
  @HiveField(0)
  income,
  @HiveField(1)
  expense,
}

@HiveType(typeId: 6)
enum RecurringFrequency {
  @HiveField(0)
  daily,
  @HiveField(1)
  weekly,
  @HiveField(2)
  monthly,
  @HiveField(3)
  yearly,
}

@HiveType(typeId: 2)
class Transaction extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  double amount;

  @HiveField(2)
  String categoryId;

  @HiveField(3)
  TransactionType type;

  @HiveField(4)
  DateTime date;

  @HiveField(5)
  String? note;

  @HiveField(6)
  bool isRecurring;

  @HiveField(7)
  RecurringFrequency? frequency;

  @HiveField(8)
  int? recurringDay; // 1-7 for Weekly, 1-31 for Monthly/Yearly

  @HiveField(9)
  int? recurringMonth; // 1-12 for Yearly

  @HiveField(10)
  String? imagePath;

  @HiveField(11)
  String? cardId;

  Transaction({
    required this.id,
    required this.amount,
    required this.categoryId,
    required this.type,
    required this.date,
    this.note,
    this.isRecurring = false,
    this.frequency,
    this.recurringDay,
    this.recurringMonth,
    this.imagePath,
    this.cardId,
  });
}
