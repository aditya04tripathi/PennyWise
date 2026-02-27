import 'package:hive/hive.dart';

part 'card_model.g.dart';

@HiveType(typeId: 4)
enum CardType {
  @HiveField(0)
  visa,
  @HiveField(1)
  mastercard,
  @HiveField(2)
  amex,
  @HiveField(3)
  discover,
  @HiveField(4)
  other,
}

@HiveType(typeId: 5)
class PaymentCard extends HiveObject {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String bankName;

  @HiveField(2)
  final String cardHolderName;

  @HiveField(3)
  final String lastFourDigits;

  @HiveField(5)
  final CardType cardType;

  @HiveField(6)
  final String maskedNumber; // e.g. **** **** **** 1234

  @HiveField(7)
  final int colorValue;

  PaymentCard({
    required this.id,
    required this.bankName,
    required this.cardHolderName,
    required this.lastFourDigits,
    required this.cardType,
    required this.maskedNumber,
    required this.colorValue,
  });
}
