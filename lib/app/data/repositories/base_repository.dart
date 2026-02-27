import 'package:hive_flutter/hive_flutter.dart';

abstract class BaseRepository<T extends HiveObject> {
  final String boxName;
  late Box<T> box;

  BaseRepository(this.boxName);

  Future<void> init() async {
    box = Hive.isBoxOpen(boxName)
        ? Hive.box<T>(boxName)
        : await Hive.openBox<T>(boxName);
  }

  // Reactive access to all values
  Stream<BoxEvent> watch() => box.watch();

  List<T> getAll() => box.values.toList();

  T? getById(String id) {
    try {
      return box.values.firstWhere((item) {
        // We assume models have an 'id' field as per existing implementations
        try {
          return (item as dynamic).id == id;
        } catch (_) {
          return false;
        }
      });
    } catch (_) {
      return null;
    }
  }

  Future<void> save(T item) async {
    if (item.isInBox) {
      await item.save();
    } else {
      await box.add(item);
    }
  }

  Future<void> delete(T item) async {
    await item.delete();
  }

  Future<void> clear() async {
    await box.clear();
  }

  Future<void> addAll(List<T> items) async {
    await box.addAll(items);
  }
}
