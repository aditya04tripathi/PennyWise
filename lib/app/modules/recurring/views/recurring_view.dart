import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../controllers/recurring_controller.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import '../../../data/models/transaction_model.dart';

class RecurringView extends GetView<RecurringController> {
  const RecurringView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('RECURRING')),
      body: Obx(() {
        if (controller.recurringTransactions.isEmpty) {
          return _buildEmptyState(theme);
        }
        return ListView.separated(
          padding: AppSpacing.pM,
          itemCount: controller.recurringTransactions.length,
          separatorBuilder: (context, index) => AppSpacing.vS,
          itemBuilder: (context, index) {
            final tx = controller.recurringTransactions[index];
            return _buildRecurringItem(tx, theme);
          },
        );
      }),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.autorenew,
            size: 64,
            color: theme.colorScheme.onSurface.withOpacity(0.1),
          ),
          AppSpacing.vM,
          Text(
            'NO RECURRING TRANSACTIONS',
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecurringItem(Transaction tx, ThemeData theme) {
    final isIncome = tx.type == TransactionType.income;
    final color = isIncome ? AppColors.success : AppColors.error;

    return Container(
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Row(
        children: [
          Container(
            padding: AppSpacing.pS,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
            ),
            child: Icon(
              isIncome ? Icons.arrow_upward : Icons.arrow_downward,
              color: color,
              size: 16,
            ),
          ),
          AppSpacing.hM,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (tx.note ?? 'Recurring').toUpperCase(),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  '${tx.frequency?.name.toUpperCase()} - ${tx.recurringDay ?? ''}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${isIncome ? '+' : '-'}\$${tx.amount.toStringAsFixed(2)}',
                style: theme.textTheme.titleMedium?.copyWith(
                  color: color,
                  fontWeight: FontWeight.w900,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () => controller.deleteRecurring(tx),
                color: theme.colorScheme.onSurface.withOpacity(0.3),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
