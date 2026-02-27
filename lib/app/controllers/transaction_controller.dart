import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import '../data/models/transaction_model.dart';
import '../data/models/category_model.dart';
import '../data/models/card_model.dart';
import '../data/services/data_store_service.dart';
import '../services/notification_service.dart';
import '../services/snackbar_service.dart';

class TransactionController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final notificationService = Get.find<NotificationService>();

  final amountController = TextEditingController();
  final noteController = TextEditingController();

  final selectedType = TransactionType.expense.obs;
  final selectedCategory = Rxn<Category>();
  final selectedCard = Rxn<PaymentCard>();
  final selectedDate = DateTime.now().obs;
  final isRecurring = false.obs;
  final selectedFrequency = RecurringFrequency.monthly.obs;
  final selectedRecurringDay = 1.obs; // 1-7 for Weekly, 1-31 for Monthly/Yearly
  final selectedRecurringMonth = 1.obs; // 1-12 for Yearly

  final selectedImagePath = Rxn<String>();
  final _picker = ImagePicker();

  final categories = <Category>[].obs;
  final cards = <PaymentCard>[].obs;

  // Edit Mode
  final isEditing = false.obs;
  String? editingTransactionId;

  @override
  void onInit() {
    super.onInit();
    _loadInitialData();
    final args = Get.arguments;
    if (args is Transaction) {
      _loadTransactionForEdit(args);
    }
  }

  void _loadTransactionForEdit(Transaction tx) {
    isEditing.value = true;
    editingTransactionId = tx.id;
    amountController.text = tx.amount.toString();
    noteController.text = tx.note ?? '';
    selectedType.value = tx.type;
    selectedCategory.value = store.categories.getById(tx.categoryId);
    isRecurring.value = tx.isRecurring;
    selectedFrequency.value = tx.frequency ?? RecurringFrequency.monthly;
    selectedRecurringDay.value = tx.recurringDay ?? 1;
    selectedRecurringMonth.value = tx.recurringMonth ?? 1;
    selectedImagePath.value = tx.imagePath;
    selectedDate.value = tx.date;
    selectedCard.value = tx.cardId != null
        ? store.cards.getById(tx.cardId!)
        : null;
  }

  void _loadInitialData() {
    categories.assignAll(store.categories.getAll());
    if (categories.isNotEmpty) {
      selectedCategory.value = categories.first;
    }
    cards.assignAll(store.cards.getAll());
  }

  void setType(TransactionType type) {
    selectedType.value = type;
  }

  void setRecurring(bool value) {
    isRecurring.value = value;
  }

  Future<void> pickImage(ImageSource source) async {
    try {
      final XFile? image = await _picker.pickImage(source: source);
      if (image != null) {
        selectedImagePath.value = image.path;
      }
    } catch (e) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Failed to pick image: $e',
        type: SnackbarType.error,
      );
    }
  }

  Future<void> saveTransaction() async {
    if (amountController.text.isEmpty ||
        selectedCategory.value == null ||
        noteController.text.trim().isEmpty) {
      AppSnackbar.show(
        title: 'Error',
        message:
            'Please fill in all required fields (Amount, Category, and Note)',
        type: SnackbarType.error,
      );
      return;
    }

    final amount = double.tryParse(amountController.text);
    if (amount == null || amount <= 0) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Invalid amount',
        type: SnackbarType.error,
      );
      return;
    }

    final transaction = Transaction(
      id: isEditing.value
          ? editingTransactionId!
          : DateTime.now().millisecondsSinceEpoch.toString(),
      amount: amount,
      categoryId: selectedCategory.value!.id,
      type: selectedType.value,
      date: selectedDate.value,
      note: noteController.text,
      isRecurring: isRecurring.value,
      frequency: isRecurring.value ? selectedFrequency.value : null,
      recurringDay: isRecurring.value ? selectedRecurringDay.value : null,
      recurringMonth:
          isRecurring.value &&
              selectedFrequency.value == RecurringFrequency.yearly
          ? selectedRecurringMonth.value
          : null,
      imagePath: selectedImagePath.value,
      cardId: selectedCard.value?.id,
    );

    await store.saveTransaction(transaction);

    // Trigger Notifications
    try {
      // Check Budget Alert
      if (store.user.value?.budgetAlertsEnabled == true &&
          store.user.value?.monthlyBudget != null &&
          transaction.type == TransactionType.expense) {
        _checkBudgetAlert();
      }
    } catch (e) {
      Get.log('Notification trigger failed: $e');
    }

    _resetForm();
    Get.back();
    AppSnackbar.show(
      title: 'Success',
      message: isEditing.value
          ? 'Transaction updated successfully'
          : 'Transaction saved successfully',
      type: SnackbarType.success,
    );
  }

  void _checkBudgetAlert() {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    final monthExpenses = store.transactions
        .getAll()
        .where(
          (tx) =>
              tx.type == TransactionType.expense &&
              tx.date.isAfter(
                startOfMonth.subtract(const Duration(seconds: 1)),
              ),
        )
        .fold(0.0, (sum, tx) => sum + tx.amount);

    final budget = store.user.value!.monthlyBudget!;
    final limitPercent = store.user.value!.budgetAlertLimitPercent;

    if (monthExpenses >= budget * (limitPercent / 100)) {
      notificationService.showNotification(
        id: 999,
        title: 'Budget Warning',
        body:
            'You have used ${(monthExpenses / budget * 100).toStringAsFixed(0)}% of your monthly budget!',
      );
    }
  }

  void _resetForm() {
    amountController.clear();
    noteController.clear();
    selectedType.value = TransactionType.expense;
    selectedDate.value = DateTime.now();
    isRecurring.value = false;
    selectedFrequency.value = RecurringFrequency.monthly;
    selectedRecurringDay.value = 1;
    selectedRecurringMonth.value = 1;
    selectedImagePath.value = null;
    selectedCard.value = null;
    if (categories.isNotEmpty) {
      selectedCategory.value = categories.first;
    }
  }

  @override
  void onClose() {
    amountController.dispose();
    noteController.dispose();
    super.onClose();
  }
}
