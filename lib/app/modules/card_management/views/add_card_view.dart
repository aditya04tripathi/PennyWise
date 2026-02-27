import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:flutter_credit_card/flutter_credit_card.dart';
import '../controllers/card_management_controller.dart';
import '../../../../core/utils/card_validator.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';

class AddCardView extends GetView<CardManagementController> {
  const AddCardView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('ADD CARD')),
      body: SafeArea(
        child: Column(
          children: [
            SizedBox(
              child: Obx(
                () => CreditCardWidget(
                  cardNumber: controller.cardNumber.value,
                  expiryDate: '',
                  cardHolderName: controller.cardHolderName.value,
                  cvvCode: '',
                  showBackView: false,
                  obscureCardNumber: true,
                  obscureCardCvv: true,
                  isHolderNameVisible: true,
                  cardBgColor: theme.colorScheme.primary,
                  onCreditCardWidgetChange: (CreditCardBrand brand) {},
                ),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: AppSpacing.pM,
                child: Form(
                  key: controller.formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'We only collect card details to help you track your spending across different accounts. CVV and Expiry are not required.',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      AppSpacing.vL,
                      _buildTextField(
                        label: 'BANK NAME',
                        hint: 'e.g. Axis Bank',
                        onChanged: (v) => controller.bankName.value = v,
                        validator: (v) => (v == null || v.isEmpty)
                            ? 'Bank name is required'
                            : null,
                        autofillHints: [AutofillHints.creditCardName],
                        textInputAction: TextInputAction.next,
                        theme: theme,
                      ),
                      AppSpacing.vL,
                      _buildTextField(
                        label: 'CARDHOLDER NAME',
                        hint: 'FULL NAME',
                        onChanged: (v) => controller.cardHolderName.value = v,
                        validator: (v) =>
                            CardValidator.validateCardHolderName(v ?? '')
                            ? null
                            : 'Enter full name as on card',
                        textCapitalization: TextCapitalization.characters,
                        autofillHints: [AutofillHints.name],
                        textInputAction: TextInputAction.next,
                        theme: theme,
                      ),
                      AppSpacing.vL,
                      _buildTextField(
                        label: 'CARD NUMBER',
                        hint: 'XXXX XXXX XXXX XXXX',
                        onChanged: (v) => controller.cardNumber.value = v,
                        validator: (v) =>
                            CardValidator.validateCardNumber(v ?? '')
                            ? null
                            : 'Invalid card number',
                        keyboardType: TextInputType.number,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(16),
                          _CardNumberFormatter(),
                        ],
                        autofillHints: [AutofillHints.creditCardNumber],
                        textInputAction: TextInputAction.done,
                        theme: theme,
                      ),
                      AppSpacing.vXL,
                      Obx(
                        () => ElevatedButton(
                          onPressed: controller.isLoading.value
                              ? null
                              : controller.addCard,
                          child: controller.isLoading.value
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text('ADD CARD FOR TRACKING'),
                        ),
                      ),
                      AppSpacing.vL,
                      _buildSecurityInfo(theme),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required void Function(String) onChanged,
    required ThemeData theme,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    bool obscureText = false,
    TextCapitalization textCapitalization = TextCapitalization.none,
    void Function(bool)? onFocusChange,
    List<String>? autofillHints,
    TextInputAction? textInputAction,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Focus(
          onFocusChange: onFocusChange,
          child: TextFormField(
            onChanged: onChanged,
            validator: validator,
            autofillHints: autofillHints,
            textInputAction: textInputAction,
            keyboardType: keyboardType,
            inputFormatters: inputFormatters,
            obscureText: obscureText,
            textCapitalization: textCapitalization,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w900,
            ),
            decoration: InputDecoration(hintText: hint),
          ),
        ),
      ],
    );
  }

  Widget _buildSecurityInfo(ThemeData theme) {
    return Container(
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary.withOpacity(0.05),
        border: Border.all(color: theme.colorScheme.primary.withOpacity(0.1)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(
                Icons.verified_user,
                color: AppColors.success,
                size: 20,
              ),
              AppSpacing.hM,
              Expanded(
                child: Text(
                  'ENCRYPTED STORAGE',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: AppColors.success,
                  ),
                ),
              ),
            ],
          ),
          AppSpacing.vS,
          Text(
            'We use industry-standard encryption to protect your data. Card details are stored locally and securely on your device.',
            style: theme.textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text.replaceAll(' ', '');
    if (text.length > 16) text = text.substring(0, 16);

    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex % 4 == 0 && nonZeroIndex != text.length) {
        buffer.write(' ');
      }
    }

    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

class _ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text.replaceAll('/', '');
    if (text.length > 4) text = text.substring(0, 4);

    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex == 2 && nonZeroIndex != text.length) {
        buffer.write('/');
      }
    }

    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}
