import 'package:hive/hive.dart';

part 'category_model.g.dart';

@HiveType(typeId: 3)
class Category extends HiveObject {
  @HiveField(0)
  String id;

  @HiveField(1)
  String name;

  @HiveField(2)
  int iconCode;

  @HiveField(3)
  int colorValue;

  @HiveField(4)
  double? budgetLimit;

  Category({
    required this.id,
    required this.name,
    required this.iconCode,
    required this.colorValue,
    this.budgetLimit,
  });
}
