import 'dart:math';
import 'package:get/get.dart';
import '../data/services/data_store_service.dart';
import '../data/models/transaction_model.dart';

class DevSeedService extends GetxService {
  Future<void> seedIfEmpty(PennyWiseStore store) async {
    // if (store.transactions.getAll().isNotEmpty) return;

    final now = DateTime.now();
    final rnd = Random(42);

    final categoryIds = {
      'food': '1',
      'transport': '2',
      'shopping': '3',
      'income': '4',
      'housing': '5',
    };

    final List<Transaction> txs = [];

    // Seed last 30 days of expenses
    for (int i = 0; i < 30; i++) {
      final date = now.subtract(Duration(days: i));
      // Food
      txs.add(
        Transaction(
          id: 'tx_food_$i',
          amount: (rnd.nextDouble() * 25 + 5).roundToDouble(),
          categoryId: categoryIds['food']!,
          type: TransactionType.expense,
          date: date,
          note: 'Lunch - Day ${i + 1}',
        ),
      );
      // Transport
      txs.add(
        Transaction(
          id: 'tx_transport_$i',
          amount: (rnd.nextDouble() * 15 + 2).roundToDouble(),
          categoryId: categoryIds['transport']!,
          type: TransactionType.expense,
          date: date.add(const Duration(hours: 3)),
          note: 'Commute',
        ),
      );
      // Shopping occasionally
      if (i % 3 == 0) {
        txs.add(
          Transaction(
            id: 'tx_shop_$i',
            amount: (rnd.nextDouble() * 120 + 20).roundToDouble(),
            categoryId: categoryIds['shopping']!,
            type: TransactionType.expense,
            date: date.add(const Duration(hours: 6)),
            note: 'Misc purchase',
          ),
        );
      }
      // Housing monthly rent on day 1
      if (date.day == 1) {
        txs.add(
          Transaction(
            id: 'tx_rent_${date.month}',
            amount: 1200.0,
            categoryId: categoryIds['housing']!,
            type: TransactionType.expense,
            date: DateTime(date.year, date.month, 1),
            note: 'Monthly Rent',
            isRecurring: true,
            frequency: RecurringFrequency.monthly,
            recurringDay: 1,
          ),
        );
      }
    }

    // Seed weekly income for 8 weeks
    for (int w = 0; w < 8; w++) {
      final date = now.subtract(Duration(days: w * 7));
      txs.add(
        Transaction(
          id: 'tx_income_$w',
          amount: 800.0,
          categoryId: categoryIds['income']!,
          type: TransactionType.income,
          date: date,
          note: 'Salary – Week ${w + 1}',
          isRecurring: true,
          frequency: RecurringFrequency.weekly,
          recurringDay: date.weekday,
        ),
      );
    }

    for (final t in txs) {
      await store.saveTransaction(t);
    }
  }
}
