import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../data/models/card_model.dart';
import '../../../data/services/data_store_service.dart';
import '../../../../core/utils/card_validator.dart';
import '../../../services/snackbar_service.dart';

class CardManagementController extends GetxController {
  final store = Get.find<PennyWiseStore>();
  final cards = <PaymentCard>[].obs;

  // Form Fields
  final bankName = ''.obs;
  final cardNumber = ''.obs;
  final cardHolderName = ''.obs;

  final isLoading = false.obs;
  final formKey = GlobalKey<FormState>();

  @override
  void onInit() {
    super.onInit();
    _loadCards();

    // Listen for changes
    store.cards.watch().listen((_) => _loadCards());
  }

  @override
  void onClose() {
    super.onClose();
    bankName.value = '';
    cardNumber.value = '';
    cardHolderName.value = '';
  }

  void _loadCards() {
    cards.assignAll(store.cards.getAll());
  }

  void onCreditCardModelChange(dynamic creditCardModel) {
    cardNumber.value = creditCardModel.cardNumber;
    cardHolderName.value = creditCardModel.cardHolderName;
  }

  Future<void> addCard() async {
    if (!formKey.currentState!.validate()) return;

    isLoading.value = true;
    try {
      // Simulate small delay
      await Future.delayed(const Duration(milliseconds: 500));

      final type = _getCardType(cardNumber.value);
      final cleanNumber = cardNumber.value.replaceAll(' ', '');
      final last4 = cleanNumber.substring(cleanNumber.length - 4);
      final masked = '**** **** **** $last4';

      final newCard = PaymentCard(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        bankName: bankName.value,
        cardHolderName: cardHolderName.value,
        lastFourDigits: last4,
        cardType: type,
        maskedNumber: masked,
        colorValue: Colors.blueAccent.value,
      );

      await store.saveCard(newCard);

      Get.back();
      AppSnackbar.show(
        title: 'Success',
        message: 'Card added successfully',
        type: SnackbarType.success,
      );

      _resetForm();
    } catch (e) {
      AppSnackbar.show(
        title: 'Error',
        message: 'Failed to add card: $e',
        type: SnackbarType.error,
      );
    } finally {
      isLoading.value = false;
    }
  }

  CardType _getCardType(String number) {
    final typeStr = CardValidator.getCardType(number);
    switch (typeStr) {
      case 'Visa':
        return CardType.visa;
      case 'Mastercard':
        return CardType.mastercard;
      case 'Amex':
        return CardType.amex;
      case 'Discover':
        return CardType.discover;
      default:
        return CardType.other;
    }
  }

  void _resetForm() {
    bankName.value = '';
    cardNumber.value = '';
    cardHolderName.value = '';
  }

  Future<void> deleteCard(PaymentCard card) async {
    await card.delete();
    cards.remove(card);
  }
}
