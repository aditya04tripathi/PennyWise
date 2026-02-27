import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/data_store_service.dart';
import '../../../services/snackbar_service.dart';
import '../../../routes/app_routes.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';

import '../controllers/transaction_list_controller.dart';

class LazyTransactionListController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final parentController = Get.find<TransactionListController>();

  final transactions = <Transaction>[].obs;
  final isLoading = false.obs;
  final hasMore = true.obs;
  final selectedType = Rxn<TransactionType>();

  int _currentPage = 0;
  final int _limit = 20;

  final ScrollController scrollController = ScrollController();

  @override
  void onInit() {
    super.onInit();
    fetchNextPage();

    scrollController.addListener(() {
      if (scrollController.position.pixels >=
          scrollController.position.maxScrollExtent - 200) {
        fetchNextPage();
      }
    });

    // Reset when filter or search changes
    ever(selectedType, (_) => _resetAndFetch());
    ever(parentController.searchQuery, (_) => _resetAndFetch());
  }

  void _resetAndFetch() {
    _currentPage = 0;
    transactions.clear();
    hasMore.value = true;
    fetchNextPage();
  }

  Future<void> fetchNextPage() async {
    if (isLoading.value || !hasMore.value) return;

    isLoading.value = true;
    try {
      // Simulate network delay
      await Future.delayed(const Duration(milliseconds: 200));

      final all = store.transactions.getAll();
      var filtered = all;

      // Filter by Type
      if (selectedType.value != null) {
        filtered = filtered
            .where((tx) => tx.type == selectedType.value)
            .toList();
      }

      // Filter by Search Query
      final query = parentController.searchQuery.value.toLowerCase();
      if (query.isNotEmpty) {
        filtered = filtered.where((tx) {
          final noteMatch = tx.note?.toLowerCase().contains(query) ?? false;
          final amountMatch = tx.amount.toString().contains(query);
          return noteMatch || amountMatch;
        }).toList();
      }

      // Sort by date descending
      filtered.sort((a, b) => b.date.compareTo(a.date));

      final startIndex = _currentPage * _limit;
      if (startIndex >= filtered.length) {
        hasMore.value = false;
      } else {
        final endIndex = (startIndex + _limit) > filtered.length
            ? filtered.length
            : (startIndex + _limit);
        final page = filtered.sublist(startIndex, endIndex);

        transactions.addAll(page);
        _currentPage++;

        if (page.length < _limit) {
          hasMore.value = false;
        }
      }
    } catch (e) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Failed to load transactions: $e',
        type: SnackbarType.error,
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deleteTransaction(Transaction tx) async {
    try {
      await store.transactions.delete(tx);
      transactions.remove(tx);
      AppSnackbar.show(
        title: 'Success',
        message: 'Transaction deleted successfully',
        type: SnackbarType.success,
      );
    } catch (e) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Failed to delete transaction: $e',
        type: SnackbarType.error,
      );
    }
  }

  @override
  void onClose() {
    scrollController.dispose();
    super.onClose();
  }
}

class LazyTransactionList extends StatelessWidget {
  const LazyTransactionList({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = Get.put(LazyTransactionListController());

    return Column(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: Obx(
            () => ListView.builder(
              controller: controller.scrollController,
              itemCount:
                  controller.transactions.length +
                  (controller.hasMore.value ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == controller.transactions.length) {
                  return _buildLoadingIndicator();
                }
                final tx = controller.transactions[index];
                return _buildTransactionItem(tx);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterHeader(LazyTransactionListController controller) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          const Text(
            'FILTER:',
            style: TextStyle(
              fontWeight: FontWeight.w900,
              fontSize: 10,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(width: 12),
          Obx(
            () => DropdownButton<TransactionType?>(
              value: controller.selectedType.value,
              underline: const SizedBox(),
              style: const TextStyle(
                fontWeight: FontWeight.w900,
                fontSize: 12,
                color: Colors.black,
              ),
              items: [
                const DropdownMenuItem(value: null, child: Text('ALL')),
                ...TransactionType.values.map(
                  (t) => DropdownMenuItem(
                    value: t,
                    child: Text(t.name.toUpperCase()),
                  ),
                ),
              ],
              onChanged: (v) => controller.selectedType.value = v,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(Transaction tx) {
    final isIncome = tx.type == TransactionType.income;
    final controller = Get.find<LazyTransactionListController>();
    final theme = Get.theme;

    return InkWell(
      onTap: () => Get.toNamed(AppRoutes.TRANSACTION_DETAIL, arguments: tx),
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.m,
          vertical: AppSpacing.xs,
        ),
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
                color: (isIncome ? AppColors.incomeGreen : AppColors.expenseRed)
                    .withOpacity(0.1),
                borderRadius: BorderRadius.zero,
              ),
              child: Icon(
                isIncome ? Icons.arrow_upward : Icons.arrow_downward,
                color: isIncome ? AppColors.incomeGreen : AppColors.expenseRed,
                size: 16,
              ),
            ),
            AppSpacing.hM,
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tx.note?.toUpperCase() ?? 'TRANSACTION',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.2,
                    ),
                  ),
                  AppSpacing.vXS,
                  Text(
                    DateFormat('MMM dd, yyyy').format(tx.date),
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  '${isIncome ? "+" : "-"}\$${tx.amount.toStringAsFixed(2)}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                    color: isIncome
                        ? AppColors.incomeGreen
                        : AppColors.expenseRed,
                  ),
                ),
                if (tx.isRecurring) ...[
                  AppSpacing.vXS,
                  Icon(
                    Icons.repeat,
                    size: 12,
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                ],
              ],
            ),
            AppSpacing.hS,
            PopupMenuButton<String>(
              icon: Icon(
                Icons.more_vert,
                size: 20,
                color: theme.colorScheme.onSurface,
              ),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              color: theme.colorScheme.surface,
              elevation: 8,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.zero,
              ),
              onSelected: (value) async {
                if (value == 'edit') {
                  Get.toNamed(AppRoutes.ADD_TRANSACTION, arguments: tx);
                } else if (value == 'delete') {
                  final confirm = await Get.defaultDialog<bool>(
                    title: 'DELETE TRANSACTION',
                    titlePadding: const EdgeInsets.only(top: 24),
                    contentPadding: const EdgeInsets.all(24),
                    radius: 0,
                    middleText:
                        'Are you sure you want to delete this transaction?',
                    confirm: ElevatedButton(
                      onPressed: () => Get.back(result: true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.expenseRed,
                        foregroundColor: Colors.white,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'DELETE',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                    cancel: TextButton(
                      onPressed: () => Get.back(result: false),
                      style: TextButton.styleFrom(
                        foregroundColor: theme.colorScheme.onSurface,
                        shape: const RoundedRectangleBorder(
                          borderRadius: BorderRadius.zero,
                        ),
                      ),
                      child: const Text(
                        'CANCEL',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  );
                  if (confirm == true) {
                    controller.deleteTransaction(tx);
                  }
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      const Icon(Icons.edit_outlined, size: 18),
                      AppSpacing.hM,
                      Text('EDIT', style: theme.textTheme.labelLarge),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      const Icon(
                        Icons.delete_outline,
                        size: 18,
                        color: AppColors.expenseRed,
                      ),
                      AppSpacing.hM,
                      Text(
                        'DELETE',
                        style: theme.textTheme.labelLarge?.copyWith(
                          color: AppColors.expenseRed,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return const Padding(
      padding: EdgeInsets.all(16.0),
      child: Center(
        child: SizedBox(
          width: 24,
          height: 24,
          child: CircularProgressIndicator(strokeWidth: 2),
        ),
      ),
    );
  }
}
