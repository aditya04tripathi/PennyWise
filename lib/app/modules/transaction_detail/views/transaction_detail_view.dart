import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../transactions/controllers/transaction_list_controller.dart';
import '../controllers/transaction_detail_controller.dart';
import '../../../data/models/transaction_model.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';

class TransactionDetailView extends GetView<TransactionDetailController> {
  const TransactionDetailView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('TRANSACTION DETAILS'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
      ),
      body: SafeArea(
        child: Obx(() {
          final tx = controller.transaction.value;
          if (controller.isLoading.value) {
            return const Center(child: CircularProgressIndicator());
          }
          if (tx == null) {
            return const Center(child: Text('Transaction not found'));
          }
          final isIncome = tx.type == TransactionType.income;
          final cat = controller.store.categories.getById(tx.categoryId);
          final card = tx.cardId != null
              ? controller.store.cards.getById(tx.cardId!)
              : null;
          final cardDisplay = card != null
              ? '${card.bankName} (${card.maskedNumber})'
              : null;
          return SingleChildScrollView(
            padding: AppSpacing.pL,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderAmount(theme, isIncome, tx),
                AppSpacing.vL,
                _buildMeta(theme, tx, cat?.name, cardDisplay),
                AppSpacing.vL,
                if (tx.imagePath != null) _buildImage(tx.imagePath!, theme),
                AppSpacing.vL,
                _buildNotes(theme, tx.note),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _buildHeaderAmount(ThemeData theme, bool isIncome, Transaction tx) {
    final color = isIncome ? AppColors.incomeGreen : AppColors.expenseRed;
    return Container(
      padding: AppSpacing.pL,
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
              borderRadius: BorderRadius.zero,
            ),
            child: Icon(
              isIncome ? Icons.arrow_upward : Icons.arrow_downward,
              color: color,
              size: 20,
            ),
          ),
          AppSpacing.hM,
          Text(
            '${isIncome ? "+" : "-"}\$${tx.amount.toStringAsFixed(2)}',
            style: theme.textTheme.displayMedium?.copyWith(
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeta(
    ThemeData theme,
    Transaction tx,
    String? categoryName,
    String? cardName,
  ) {
    return Container(
      padding: AppSpacing.pL,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _metaRow(
            theme,
            'DATE',
            DateFormat('EEEE, MMM dd, yyyy').format(tx.date),
          ),
          AppSpacing.vM,
          _metaRow(theme, 'CATEGORY', categoryName ?? '—'),
          AppSpacing.vM,
          _metaRow(theme, 'CARD', cardName ?? '—'),
          if (tx.isRecurring) ...[
            AppSpacing.vM,
            _metaRow(theme, 'RECURRING', 'Yes'),
          ],
        ],
      ),
    );
  }

  Widget _metaRow(ThemeData theme, String label, String value) {
    return Row(
      children: [
        Expanded(child: Text(label, style: theme.textTheme.labelSmall)),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImage(String path, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ATTACHED PHOTO', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Container(
          height: 200,
          width: double.infinity,
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Image.file(File(path), fit: BoxFit.cover),
        ),
      ],
    );
  }

  Widget _buildNotes(ThemeData theme, String? note) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('NOTES', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Container(
          width: double.infinity,
          padding: AppSpacing.pM,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            border: Border.all(color: theme.colorScheme.outline),
          ),
          child: Text(
            note?.isNotEmpty == true ? note! : '—',
            style: theme.textTheme.bodyLarge,
          ),
        ),
      ],
    );
  }
}
