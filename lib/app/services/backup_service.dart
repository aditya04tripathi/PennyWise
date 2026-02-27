import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:cryptography/cryptography.dart' as crypto;
import '../data/services/data_store_service.dart';
import '../data/models/user_model.dart';
import '../data/models/transaction_model.dart';
import '../data/models/category_model.dart';
import '../data/models/card_model.dart';
import '../../core/utils/csv_helper.dart';
import '../../core/values/spacing.dart';
import '../../core/values/security.dart';
import 'package:file_picker/file_picker.dart';

class BackupService extends GetxService {
  final store = Get.find<PennyWiseStore>();

  Future<void> exportAndShare({String? password}) async {
    final rows = <List<dynamic>>[];
    rows.add(['type', 'data']);

    final user = store.user.value;
    if (user != null) {
      rows.add(['user', jsonEncode(_userToMap(user))]);
    }
    for (final c in store.categories.getAll()) {
      rows.add(['category', jsonEncode(_categoryToMap(c))]);
    }
    for (final card in store.cards.getAll()) {
      rows.add(['card', jsonEncode(_cardToMap(card))]);
    }
    for (final tx in store.transactions.getAll()) {
      rows.add(['transaction', jsonEncode(_txToMap(tx))]);
    }

    final csvString = csv.encode(rows);
    if (csvString.isEmpty) {
      Get.snackbar(
        'Error',
        'No data to export',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    final dir = await getTemporaryDirectory();
    final basePath =
        '${dir.path}/pennywise_backup_${DateTime.now().millisecondsSinceEpoch}';

    String outPath;
    if (password != null && password.isNotEmpty) {
      final encrypted = await _encrypt(csvString, password);
      outPath = '$basePath.csv.enc';
      final file = File(outPath);
      await file.writeAsBytes(encrypted, flush: true);
    } else {
      outPath = '$basePath.csv';
      final file = File(outPath);
      await file.writeAsString(csvString, flush: true);
    }

    final exists = await File(outPath).exists();
    final length = exists ? await File(outPath).length() : 0;
    if (!exists || length == 0) {
      Get.snackbar(
        'Error',
        'Failed to write backup file',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    final theme = Get.theme;
    final bool? shouldProceed = await Get.defaultDialog<bool>(
      title: 'SECURITY WARNING',
      titleStyle: theme.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w900,
        letterSpacing: 1.2,
      ),
      titlePadding: const EdgeInsets.only(top: 24, left: 24, right: 24),
      contentPadding: const EdgeInsets.all(24),
      radius: 0,
      backgroundColor: theme.colorScheme.surface,
      middleText:
          'THE EXPORTED FILE MAY CONTAIN SENSITIVE FINANCIAL DATA. KEEP IT SECURE AND DO NOT SHARE IT PUBLICLY.',
      middleTextStyle: theme.textTheme.bodyMedium?.copyWith(
        fontWeight: FontWeight.w500,
      ),
      confirm: ElevatedButton(
        onPressed: () => Get.back(result: true),
        style: ElevatedButton.styleFrom(
          backgroundColor: theme.colorScheme.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          minimumSize: const Size(100, 44),
        ),
        child: const Text(
          'CONTINUE',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      cancel: TextButton(
        onPressed: () => Get.back(result: false),
        style: TextButton.styleFrom(
          foregroundColor: theme.colorScheme.onSurface,
          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          minimumSize: const Size(100, 44),
        ),
        child: const Text(
          'CANCEL',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
    );

    if (shouldProceed != true) return;

    final xfile = XFile(outPath);
    await Share.shareXFiles([xfile], text: 'PennyWise Backup');
  }

  Future<void> importFromCsv() async {
    final theme = Get.theme;
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'enc'],
    );
    if (result == null || result.files.isEmpty) return;

    final picked = result.files.first;
    final path = picked.path!;
    String content;

    if (path.endsWith('.enc')) {
      String password = '';
      await Get.defaultDialog(
        title: 'ENTER PASSWORD',
        titleStyle: theme.textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.w900,
          letterSpacing: 1.2,
        ),
        titlePadding: const EdgeInsets.only(top: 24, left: 24, right: 24),
        contentPadding: const EdgeInsets.all(24),
        radius: 0,
        backgroundColor: theme.colorScheme.surface,
        content: Column(
          children: [
            Text(
              'THIS FILE IS ENCRYPTED. PLEASE PROVIDE THE AES-GCM PASSWORD TO DECRYPT IT.',
              style: theme.textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            AppSpacing.vM,
            TextField(
              onChanged: (v) => password = v,
              obscureText: true,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w900,
              ),
              decoration: const InputDecoration(
                hintText: 'PASSWORD',
                prefixIcon: Icon(Icons.lock_outline),
              ),
            ),
          ],
        ),
        confirm: ElevatedButton(
          onPressed: () => Get.back(),
          style: ElevatedButton.styleFrom(
            backgroundColor: theme.colorScheme.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.zero,
            ),
            minimumSize: const Size(120, 44),
          ),
          child: const Text(
            'DECRYPT',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
        cancel: TextButton(
          onPressed: () {
            password = '';
            Get.back();
          },
          style: TextButton.styleFrom(
            foregroundColor: theme.colorScheme.onSurface,
            shape: const RoundedRectangleBorder(
              borderRadius: BorderRadius.zero,
            ),
            minimumSize: const Size(120, 44),
          ),
          child: const Text(
            'CANCEL',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      );
      if (password.isEmpty) return;
      final bytes = await File(path).readAsBytes();
      content = await _decrypt(bytes, password);
    } else {
      content = await File(path).readAsString();
    }

    final rows = csv.decode(content);
    if (rows.isEmpty || rows.first.length < 2) {
      Get.snackbar(
        'Error',
        'Invalid CSV file',
        snackPosition: SnackPosition.BOTTOM,
      );
      return;
    }

    await store.transactions.clear();
    await store.categories.clear();
    await store.cards.clear();
    await store.users.clear();

    for (int i = 1; i < rows.length; i++) {
      final type = rows[i][0] as String;
      final data = jsonDecode(rows[i][1] as String) as Map<String, dynamic>;
      if (type == 'user') {
        await store.saveUser(
          User(
            name: data['name'] as String,
            primaryCurrency: data['primaryCurrency'] as String,
            pin: data['pin'] as String?,
            isBiometricEnabled: (data['isBiometricEnabled'] ?? false) as bool,
            isOnboardingCompleted:
                (data['isOnboardingCompleted'] ?? false) as bool,
            monthlyBudget: (data['monthlyBudget'] as num?)?.toDouble(),
            budgetAlertLimitPercent:
                (data['budgetAlertLimitPercent'] as num?)?.toDouble() ?? 80.0,
            budgetAlertsEnabled: (data['budgetAlertsEnabled'] ?? true) as bool,
          ),
        );
      } else if (type == 'category') {
        await store.saveCategory(
          Category(
            id: data['id'] as String,
            name: data['name'] as String,
            iconCode: data['iconCode'] as int,
            colorValue: data['colorValue'] as int,
            budgetLimit: (data['budgetLimit'] as num?)?.toDouble(),
          ),
        );
      } else if (type == 'card') {
        await store.saveCard(
          PaymentCard(
            id: data['id'] as String,
            bankName: data['bankName'] as String,
            cardHolderName: data['cardHolderName'] as String,
            lastFourDigits: data['lastFourDigits'] as String,
            cardType: CardType.values[(data['cardType'] as int?) ?? 0],
            maskedNumber: data['maskedNumber'] as String,
            colorValue: data['colorValue'] as int,
          ),
        );
      } else if (type == 'transaction') {
        await store.saveTransaction(
          Transaction(
            id: data['id'] as String,
            amount: (data['amount'] as num).toDouble(),
            categoryId: data['categoryId'] as String,
            type: TransactionType.values[(data['type'] as int?) ?? 0],
            date: DateTime.parse(data['date'] as String),
            note: data['note'] as String?,
            isRecurring: (data['isRecurring'] ?? false) as bool,
            frequency: data['frequency'] != null
                ? RecurringFrequency.values[(data['frequency'] as int)]
                : null,
            recurringDay: data['recurringDay'] as int?,
            recurringMonth: data['recurringMonth'] as int?,
            imagePath: data['imagePath'] as String?,
            cardId: data['cardId'] as String?,
          ),
        );
      }
    }
  }

  Map<String, dynamic> _userToMap(User u) => {
    'name': u.name,
    'primaryCurrency': u.primaryCurrency,
    'pin': u.pin,
    'isBiometricEnabled': u.isBiometricEnabled,
    'isOnboardingCompleted': u.isOnboardingCompleted,
    'monthlyBudget': u.monthlyBudget,
    'budgetAlertLimitPercent': u.budgetAlertLimitPercent,
    'budgetAlertsEnabled': u.budgetAlertsEnabled,
  };
  Map<String, dynamic> _categoryToMap(Category c) => {
    'id': c.id,
    'name': c.name,
    'iconCode': c.iconCode,
    'colorValue': c.colorValue,
    'budgetLimit': c.budgetLimit,
  };
  Map<String, dynamic> _cardToMap(PaymentCard c) => {
    'id': c.id,
    'bankName': c.bankName,
    'cardHolderName': c.cardHolderName,
    'lastFourDigits': c.lastFourDigits,
    'expiryDate': '',
    'cardType': c.cardType.index,
    'maskedNumber': c.maskedNumber,
    'colorValue': c.colorValue,
  };
  Map<String, dynamic> _txToMap(Transaction t) => {
    'id': t.id,
    'amount': t.amount,
    'categoryId': t.categoryId,
    'type': t.type.index,
    'date': t.date.toIso8601String(),
    'note': t.note,
    'isRecurring': t.isRecurring,
    'frequency': t.frequency?.index,
    'recurringDay': t.recurringDay,
    'recurringMonth': t.recurringMonth,
    'imagePath': t.imagePath,
    'cardId': t.cardId,
  };

  Future<List<int>> _encrypt(String plain, String password) async {
    final algorithm = crypto.AesGcm.with256bits();
    final nonce = algorithm.newNonce();
    final secretKey = await _deriveKey(password);
    final secretBox = await algorithm.encrypt(
      utf8.encode(plain),
      secretKey: secretKey,
      nonce: nonce,
    );
    final header = utf8.encode('ENC');
    final out = <int>[];
    out.addAll(header);
    out.addAll(nonce);
    out.addAll(secretBox.cipherText);
    out.addAll(secretBox.mac.bytes);
    return out;
  }

  Future<String> _decrypt(List<int> bytes, String password) async {
    final algorithm = crypto.AesGcm.with256bits();
    final header = bytes.sublist(0, 3);
    if (utf8.decode(header) != 'ENC') {
      return utf8.decode(bytes);
    }
    final concatenation = bytes.sublist(3);
    final box = crypto.SecretBox.fromConcatenation(
      concatenation,
      nonceLength: algorithm.nonceLength,
      macLength: algorithm.macAlgorithm.macLength,
      copy: false,
    );
    final secretKey = await _deriveKey(password);
    final plainBytes = await algorithm.decrypt(box, secretKey: secretKey);
    return utf8.decode(plainBytes);
  }

  Future<crypto.SecretKey> _deriveKey(String password) async {
    final pbkdf2 = crypto.Pbkdf2(
      macAlgorithm: crypto.Hmac.sha256(),
      iterations: 60000,
      bits: 256,
    );
    final salt = utf8.encode(SecurityConstants.backupSalt);
    return pbkdf2.deriveKey(
      secretKey: crypto.SecretKey(utf8.encode(password)),
      nonce: salt,
    );
  }
}
