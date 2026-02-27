import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/transaction_list_controller.dart';
import '../../../../core/values/spacing.dart';
import '../widgets/lazy_transaction_list.dart';

class TransactionsView extends GetView<TransactionListController> {
  const TransactionsView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('TRANSACTIONS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download_outlined),
            onPressed: () => controller.exportToCsv(),
            tooltip: 'Export CSV',
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(theme),
            const Expanded(child: LazyTransactionList()),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(ThemeData theme) {
    return Padding(
      padding: AppSpacing.pM,
      child: Row(
        children: [
          Expanded(
            child: TextField(
              onChanged: (v) => controller.searchQuery.value = v,
              textInputAction: TextInputAction.search,
              decoration: const InputDecoration(
                hintText: 'SEARCH TRANSACTIONS...',
                prefixIcon: Icon(Icons.search, size: 20),
              ),
            ),
          ),
          AppSpacing.hM,
          Container(
            height: 56,
            width: 56,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                final lazyController =
                    Get.find<LazyTransactionListController>();
                lazyController.onInit();
              },
              tooltip: 'Refresh',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 64,
            color: theme.colorScheme.onSurface.withOpacity(0.1),
          ),
          AppSpacing.vM,
          Text('NO TRANSACTIONS FOUND', style: theme.textTheme.headlineLarge),
          AppSpacing.vS,
          Text('TRY ADJUSTING YOUR FILTERS', style: theme.textTheme.bodySmall),
        ],
      ),
    );
  }
}
