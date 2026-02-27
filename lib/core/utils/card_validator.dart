class CardValidator {
  /// Validates a card number using the Luhn algorithm.
  static bool validateCardNumber(String input) {
    if (input.isEmpty) return false;

    // Remove all non-digit characters
    input = input.replaceAll(RegExp(r'\D'), '');

    if (input.length < 10 || input.length > 19) return false;

    int sum = 0;
    bool alternate = false;
    for (int i = input.length - 1; i >= 0; i--) {
      int n = int.parse(input[i]);
      if (alternate) {
        n *= 2;
        if (n > 9) {
          n -= 9;
        }
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 == 0;
  }

  /// Validates the expiration date (MM/YY format).
  /// Ensures the date is in the future.
  static bool validateExpiryDate(String input) {
    if (input.isEmpty || !input.contains('/')) return false;

    final parts = input.split('/');
    if (parts.length != 2) return false;

    final month = int.tryParse(parts[0]);
    final yearPart = int.tryParse(parts[1]);

    if (month == null || yearPart == null || month < 1 || month > 12)
      return false;

    final now = DateTime.now();
    final currentYear = now.year % 100;
    final currentMonth = now.month;

    final year = 2000 + yearPart;
    final fullCurrentYear = now.year;

    if (year < fullCurrentYear) return false;
    if (year == fullCurrentYear && month < currentMonth) return false;

    return true;
  }

  /// Validates the cardholder name.
  static bool validateCardHolderName(String input) {
    return input.isNotEmpty && input.trim().split(' ').length >= 2;
  }

  /// Determines the card type from the card number.
  static String getCardType(String input) {
    input = input.replaceAll(RegExp(r'\D'), '');
    if (input.startsWith(RegExp(r'4'))) return 'Visa';
    if (input.startsWith(
      RegExp(
        r'((5[1-5])|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720))',
      ),
    ))
      return 'Mastercard';
    if (input.startsWith(RegExp(r'((34)|(37))'))) return 'Amex';
    if (input.startsWith(RegExp(r'((6011)|(65)|(64[4-9])|(622[1-9]))')))
      return 'Discover';
    return 'Other';
  }
}
