import 'dart:io';
import 'package:csv/csv.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/services/data_store_service.dart';
import '../../../services/snackbar_service.dart';

class TransactionListController extends GetxController {
  final store = Get.find<PennyWiseStore>();

  final transactions = <Transaction>[].obs;
  final filteredTransactions = <Transaction>[].obs;
  final isLoading = false.obs;

  // Search and Filters
  final searchQuery = ''.obs;
  final filterType = Rxn<TransactionType>();
  final filterDateRange = Rxn<DateTimeRange>();
  final minAmount = Rxn<double>();
  final maxAmount = Rxn<double>();

  // Pagination
  final currentPage = 1.obs;
  final pageSize = 25.obs;
  final totalItems = 0.obs;
  final pageSizes = [10, 25, 50, 100];

  // Sorting
  final sortColumn = 'date'.obs;
  final sortAscending = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadAllTransactions();

    // Listen for changes in the store
    store.transactions.watch().listen((_) => _loadAllTransactions());

    // Setup listeners for real-time filtering
    everAll([
      searchQuery,
      filterType,
      filterDateRange,
      minAmount,
      maxAmount,
      sortColumn,
      sortAscending,
      currentPage,
      pageSize,
    ], (_) => _applyFiltersAndPagination());
  }

  void _loadAllTransactions() {
    transactions.assignAll(store.transactions.getAll());
    _applyFiltersAndPagination();
  }

  void _applyFiltersAndPagination() {
    var list = transactions.toList();

    // 1. Search
    if (searchQuery.value.isNotEmpty) {
      list = list
          .where(
            (tx) =>
                (tx.note?.toLowerCase().contains(
                  searchQuery.value.toLowerCase(),
                ) ??
                false),
          )
          .toList();
    }

    // 2. Filter by Type
    if (filterType.value != null) {
      list = list.where((tx) => tx.type == filterType.value).toList();
    }

    // 3. Filter by Date Range
    if (filterDateRange.value != null) {
      list = list
          .where(
            (tx) =>
                tx.date.isAfter(
                  filterDateRange.value!.start.subtract(
                    const Duration(seconds: 1),
                  ),
                ) &&
                tx.date.isBefore(
                  filterDateRange.value!.end.add(const Duration(days: 1)),
                ),
          )
          .toList();
    }

    // 4. Filter by Amount
    if (minAmount.value != null) {
      list = list.where((tx) => tx.amount >= minAmount.value!).toList();
    }
    if (maxAmount.value != null) {
      list = list.where((tx) => tx.amount <= maxAmount.value!).toList();
    }

    // 5. Sorting
    list.sort((a, b) {
      int cmp;
      switch (sortColumn.value) {
        case 'amount':
          cmp = a.amount.compareTo(b.amount);
          break;
        case 'note':
          cmp = (a.note ?? '').compareTo(b.note ?? '');
          break;
        case 'type':
          cmp = a.type.index.compareTo(b.type.index);
          break;
        case 'date':
        default:
          cmp = a.date.compareTo(b.date);
      }
      return sortAscending.value ? cmp : -cmp;
    });

    totalItems.value = list.length;

    // 6. Pagination
    int startIndex = (currentPage.value - 1) * pageSize.value;
    if (startIndex >= list.length) {
      startIndex = 0;
      currentPage.value = 1;
    }

    int endIndex = startIndex + pageSize.value;
    if (endIndex > list.length) endIndex = list.length;

    filteredTransactions.assignAll(list.sublist(startIndex, endIndex));
  }

  void setSort(String column) {
    if (sortColumn.value == column) {
      sortAscending.value = !sortAscending.value;
    } else {
      sortColumn.value = column;
      sortAscending.value = true;
    }
  }

  void resetFilters() {
    searchQuery.value = '';
    filterType.value = null;
    filterDateRange.value = null;
    minAmount.value = null;
    maxAmount.value = null;
    currentPage.value = 1;
  }

  Future<void> exportToCsv() async {
    try {
      List<List<dynamic>> rows = [];
      rows.add(["Date", "Type", "Category", "Amount", "Note"]);

      for (var tx in filteredTransactions) {
        final category = store.categories.getById(tx.categoryId);
        rows.add([
          DateFormat('dd-MM-yyyy').format(tx.date),
          tx.type.name.toUpperCase(),
          category?.name ?? 'Unknown',
          tx.amount,
          tx.note ?? '',
        ]);
      }

      String csvData = csv.encode(rows);
      final directory = await getApplicationDocumentsDirectory();
      final path =
          "${directory.path}/transactions_${DateTime.now().millisecondsSinceEpoch}.csv";
      final file = File(path);
      await file.writeAsString(csvData);

      final result = await SharePlus.instance.share(
        ShareParams(
          files: [XFile(path)],
          text: 'Exported transactions as CSV',
          title: 'Transaction Export',
          subject: 'PennyWise Transaction Export',
        ),
      );

      if (result.status == ShareResultStatus.success) {
        AppSnackbar.show(
          title: 'Success',
          message: 'Transactions exported and shared successfully',
          type: SnackbarType.success,
        );
      }
    } catch (e) {
      AppSnackbar.show(
        title: 'Export Error',
        message: 'Failed to export CSV: $e',
        type: SnackbarType.error,
      );
    }
  }

  String getCategoryName(String id) {
    return store.categories.getById(id)?.name ?? 'Unknown';
  }
}
