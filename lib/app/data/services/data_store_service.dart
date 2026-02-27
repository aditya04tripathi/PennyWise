import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/transaction_model.dart';
import '../models/category_model.dart';
import '../models/card_model.dart';
import '../models/user_model.dart';
import '../repositories/base_repository.dart';

class TransactionRepository extends BaseRepository<Transaction> {
  TransactionRepository() : super('transactionBox');
}

class CategoryRepository extends BaseRepository<Category> {
  CategoryRepository() : super('categoryBox');
}

class CardRepository extends BaseRepository<PaymentCard> {
  CardRepository() : super('paymentCards');
}

class UserRepository extends BaseRepository<User> {
  UserRepository() : super('userBox');
}

class CacheEntry<T> {
  final T data;
  final DateTime expiry;

  CacheEntry(this.data, this.expiry);
  bool get isExpired => DateTime.now().isAfter(expiry);
}

class PennyWiseStore extends GetxService {
  late final TransactionRepository transactions;
  late final CategoryRepository categories;
  late final CardRepository cards;
  late final UserRepository users;

  final isReady = false.obs;

  // Reactive User Profile
  final user = Rxn<User>();

  // Caching layer
  final Map<String, CacheEntry<dynamic>> _cache = {};
  final Duration defaultTTL = const Duration(minutes: 5);

  Future<PennyWiseStore> init() async {
    try {
      transactions = TransactionRepository();
      categories = CategoryRepository();
      cards = CardRepository();
      users = UserRepository();

      await Future.wait([
        transactions.init(),
        categories.init(),
        cards.init(),
        users.init(),
      ]);

      _loadUser();
      isReady.value = true;
      return this;
    } catch (e) {
      debugPrint('DataStore initialization error: $e');
      rethrow;
    }
  }

  void _loadUser() {
    final allUsers = users.getAll();
    if (allUsers.isNotEmpty) {
      user.value = allUsers.first;
    }
  }

  // Generic Cache management
  void _setCache(String key, dynamic data, {Duration? ttl}) {
    _cache[key] = CacheEntry(data, DateTime.now().add(ttl ?? defaultTTL));
  }

  T? _getCache<T>(String key) {
    final entry = _cache[key];
    if (entry != null && !entry.isExpired) {
      return entry.data as T;
    }
    _cache.remove(key);
    return null;
  }

  void invalidateCache(String key) => _cache.remove(key);
  void clearCache() => _cache.clear();

  // Optimized Data Access
  List<Transaction> getTransactions() {
    const cacheKey = 'all_transactions';
    final cached = _getCache<List<Transaction>>(cacheKey);
    if (cached != null) return cached;

    final data = transactions.getAll();
    _setCache(cacheKey, data);
    return data;
  }

  // Reactive Streams
  Stream<List<Transaction>> watchTransactions() {
    return transactions.watch().map((_) => transactions.getAll());
  }

  Stream<List<Category>> watchCategories() {
    return categories.watch().map((_) => categories.getAll());
  }

  Stream<List<PaymentCard>> watchCards() {
    return cards.watch().map((_) => cards.getAll());
  }

  // CRUD Wrapper with automatic cache invalidation
  Future<void> saveTransaction(Transaction tx) async {
    try {
      await transactions.save(tx);
      invalidateCache('all_transactions');
      debugPrint('DataStore: Saved transaction ${tx.id}');
    } catch (e) {
      debugPrint('DataStore: Error saving transaction: $e');
      Get.snackbar('Database Error', 'Failed to save transaction');
      rethrow;
    }
  }

  Future<void> deleteTransaction(Transaction tx) async {
    try {
      await transactions.delete(tx);
      invalidateCache('all_transactions');
      debugPrint('DataStore: Deleted transaction ${tx.id}');
    } catch (e) {
      debugPrint('DataStore: Error deleting transaction: $e');
      Get.snackbar('Database Error', 'Failed to delete transaction');
      rethrow;
    }
  }

  Future<void> saveCategory(Category cat) async {
    try {
      await categories.save(cat);
      invalidateCache('all_categories');
      debugPrint('DataStore: Saved category ${cat.name}');
    } catch (e) {
      debugPrint('DataStore: Error saving category: $e');
      rethrow;
    }
  }

  Future<void> saveCard(PaymentCard card) async {
    try {
      await cards.save(card);
      invalidateCache('all_cards');
      debugPrint('DataStore: Saved card ${card.lastFourDigits}');
    } catch (e) {
      debugPrint('DataStore: Error saving card: $e');
      Get.snackbar('Database Error', 'Failed to save card');
      rethrow;
    }
  }

  Future<void> saveUser(User newUser) async {
    try {
      await users.save(newUser);
      user.value = newUser;
      debugPrint('DataStore: Saved user profile for ${newUser.name}');
    } catch (e) {
      debugPrint('DataStore: Error saving user: $e');
      Get.snackbar('Database Error', 'Failed to save user profile');
      rethrow;
    }
  }
}
