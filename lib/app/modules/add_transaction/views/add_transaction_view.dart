import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import '../../../controllers/transaction_controller.dart';
import '../../../data/models/transaction_model.dart';
import '../../../data/models/card_model.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';

class AddTransactionView extends GetView<TransactionController> {
  const AddTransactionView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return DefaultTabController(
      length: 2,
      child: Builder(
        builder: (context) {
          final tabController = DefaultTabController.of(context);
          tabController.addListener(() {
            if (!tabController.indexIsChanging) {
              controller.setRecurring(tabController.index == 1);
            }
          });
          return Scaffold(
            backgroundColor: theme.scaffoldBackgroundColor,
            appBar: AppBar(
              leading: IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Get.back(),
              ),
              title: Obx(
                () => Text(
                  controller.isEditing.value
                      ? 'EDIT TRANSACTION'
                      : 'ADD TRANSACTION',
                ),
              ),
              bottom: TabBar(
                tabs: const [
                  Tab(child: Text('ONE-TIME')),
                  Tab(child: Text('RECURRING')),
                ],
                labelStyle: theme.textTheme.labelLarge,
                unselectedLabelStyle: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w400,
                ),
                labelColor: theme.colorScheme.primary,
                unselectedLabelColor: theme.colorScheme.onSurface.withOpacity(
                  0.5,
                ),
                indicatorColor: theme.colorScheme.primary,
                indicatorWeight: 4,
                indicatorSize: TabBarIndicatorSize.tab,
              ),
            ),
            body: SafeArea(
              child: TabBarView(
                children: [
                  _buildTransactionForm(isRecurring: false, theme: theme),
                  _buildTransactionForm(isRecurring: true, theme: theme),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTransactionForm({
    required bool isRecurring,
    required ThemeData theme,
  }) {
    return SingleChildScrollView(
      padding: AppSpacing.pL,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTypeSelector(theme),
          AppSpacing.vL,
          _buildTextField(
            textController: controller.amountController,
            label: 'AMOUNT',
            hint: '0.00',
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            textInputAction: TextInputAction.next,
            prefixIcon: Icons.attach_money,
            theme: theme,
          ),
          AppSpacing.vL,
          _buildCategoryDropdown(theme),
          AppSpacing.vL,
          _buildCardDropdown(theme),
          AppSpacing.vL,
          if (isRecurring) ...[
            _buildFrequencyDropdown(theme),
            AppSpacing.vL,
            _buildRecurringInputs(theme),
            AppSpacing.vL,
          ],
          _buildDatePicker(theme),
          AppSpacing.vL,
          _buildImagePicker(theme),
          AppSpacing.vL,
          _buildTextField(
            textController: controller.noteController,
            label: 'NOTE (OPTIONAL)',
            hint: 'What was this for?',
            textInputAction: TextInputAction.done,
            prefixIcon: Icons.notes,
            theme: theme,
          ),
          AppSpacing.vXL,
          ElevatedButton(
            onPressed: controller.saveTransaction,
            child: const Text('SAVE TRANSACTION'),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeSelector(ThemeData theme) {
    return Obx(
      () => Row(
        children: [
          Expanded(
            child: _buildTypeButton(
              TransactionType.expense,
              'EXPENSE',
              Icons.arrow_downward,
              AppColors.error,
              theme,
            ),
          ),
          AppSpacing.hM,
          Expanded(
            child: _buildTypeButton(
              TransactionType.income,
              'INCOME',
              Icons.arrow_upward,
              AppColors.success,
              theme,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeButton(
    TransactionType type,
    String label,
    IconData icon,
    Color color,
    ThemeData theme,
  ) {
    final isSelected = controller.selectedType.value == type;
    return GestureDetector(
      onTap: () => controller.setType(type),
      child: Container(
        padding: AppSpacing.pM,
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.zero,
          border: Border.all(
            color: isSelected ? color : theme.colorScheme.outline,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected
                  ? color
                  : theme.colorScheme.onSurface.withOpacity(0.5),
            ),
            AppSpacing.vS,
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: isSelected
                    ? color
                    : theme.colorScheme.onSurface.withOpacity(0.5),
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController textController,
    required String label,
    required String hint,
    required ThemeData theme,
    TextInputType keyboardType = TextInputType.text,
    TextInputAction textInputAction = TextInputAction.next,
    IconData? prefixIcon,
    bool autofocus = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        TextField(
          controller: textController,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          autofocus: autofocus,
          autocorrect: true,
          enableSuggestions: true,
          textCapitalization: TextCapitalization.sentences,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w900,
          ),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon, color: theme.colorScheme.primary)
                : null,
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryDropdown(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('CATEGORY', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Obx(
          () => DropdownButtonFormField<String>(
            dropdownColor: theme.colorScheme.surface,
            value: controller.selectedCategory.value?.id,
            items: controller.categories
                .map(
                  (c) => DropdownMenuItem(
                    value: c.id,
                    child: Row(
                      children: [
                        Icon(
                          IconData(c.iconCode, fontFamily: 'MaterialIcons'),
                          color: Color(c.colorValue),
                          size: 20,
                        ),
                        AppSpacing.hM,
                        Text(c.name, style: theme.textTheme.bodyLarge),
                      ],
                    ),
                  ),
                )
                .toList(),
            onChanged: (val) {
              if (val != null) {
                controller.selectedCategory.value = controller.categories
                    .firstWhere((c) => c.id == val);
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildCardDropdown(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('SELECT CARD (OPTIONAL)', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Obx(
          () => DropdownButtonFormField<String?>(
            dropdownColor: theme.colorScheme.surface,
            value: controller.selectedCard.value?.id,
            hint: const Text('NONE'),
            items: [
              const DropdownMenuItem<String?>(value: null, child: Text('NONE')),
              ...controller.cards.map((card) {
                return DropdownMenuItem<String?>(
                  value: card.id,
                  child: Row(
                    children: [
                      Icon(
                        card.cardType == CardType.visa
                            ? Icons.credit_card
                            : Icons.account_balance_wallet,
                        size: 20,
                        color: theme.colorScheme.primary,
                      ),
                      AppSpacing.hM,
                      Text(
                        "${card.bankName} - **** ${card.lastFourDigits}",
                        style: theme.textTheme.bodyLarge,
                      ),
                    ],
                  ),
                );
              }),
            ],
            onChanged: (String? value) {
              if (value == null) {
                controller.selectedCard.value = null;
              } else {
                controller.selectedCard.value = controller.cards.firstWhere(
                  (c) => c.id == value,
                );
              }
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFrequencyDropdown(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('FREQUENCY', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Obx(
          () => DropdownButtonFormField<RecurringFrequency>(
            dropdownColor: theme.colorScheme.surface,
            value: controller.selectedFrequency.value,
            items: RecurringFrequency.values
                .where((f) => f != RecurringFrequency.daily)
                .map(
                  (f) => DropdownMenuItem(
                    value: f,
                    child: Text(f.name.toUpperCase()),
                  ),
                )
                .toList(),
            onChanged: (val) {
              if (val != null) controller.selectedFrequency.value = val;
            },
          ),
        ),
      ],
    );
  }

  Widget _buildRecurringInputs(ThemeData theme) {
    return Obx(() {
      final freq = controller.selectedFrequency.value;
      if (freq == RecurringFrequency.daily) return const SizedBox();

      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (freq == RecurringFrequency.weekly) ...[
            Text('SELECT DAY OF WEEK', style: theme.textTheme.labelSmall),
            AppSpacing.vS,
            DropdownButtonFormField<int>(
              dropdownColor: theme.colorScheme.surface,
              value: controller.selectedRecurringDay.value,
              items: List.generate(7, (i) => i + 1).map((i) {
                final days = [
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday',
                ];
                return DropdownMenuItem(value: i, child: Text(days[i - 1]));
              }).toList(),
              onChanged: (val) => controller.selectedRecurringDay.value = val!,
            ),
          ],
          if (freq == RecurringFrequency.monthly) ...[
            Text('SELECT DAY OF MONTH', style: theme.textTheme.labelSmall),
            AppSpacing.vS,
            DropdownButtonFormField<int>(
              dropdownColor: theme.colorScheme.surface,
              value: controller.selectedRecurringDay.value > 31
                  ? 1
                  : controller.selectedRecurringDay.value,
              items: List.generate(31, (i) => i + 1)
                  .map((i) => DropdownMenuItem(value: i, child: Text('$i')))
                  .toList(),
              onChanged: (val) => controller.selectedRecurringDay.value = val!,
            ),
          ],
          if (freq == RecurringFrequency.yearly) ...[
            Text('SELECT MONTH', style: theme.textTheme.labelSmall),
            AppSpacing.vS,
            DropdownButtonFormField<int>(
              dropdownColor: theme.colorScheme.surface,
              value: controller.selectedRecurringMonth.value,
              items: List.generate(12, (i) => i + 1).map((i) {
                final months = [
                  'January',
                  'February',
                  'March',
                  'April',
                  'May',
                  'June',
                  'July',
                  'August',
                  'September',
                  'October',
                  'November',
                  'December',
                ];
                return DropdownMenuItem(value: i, child: Text(months[i - 1]));
              }).toList(),
              onChanged: (val) =>
                  controller.selectedRecurringMonth.value = val!,
            ),
            AppSpacing.vL,
            Text('SELECT DAY', style: theme.textTheme.labelSmall),
            AppSpacing.vS,
            DropdownButtonFormField<int>(
              dropdownColor: theme.colorScheme.surface,
              value: controller.selectedRecurringDay.value > 31
                  ? 1
                  : controller.selectedRecurringDay.value,
              items: List.generate(31, (i) => i + 1)
                  .map((i) => DropdownMenuItem(value: i, child: Text('$i')))
                  .toList(),
              onChanged: (val) => controller.selectedRecurringDay.value = val!,
            ),
          ],
        ],
      );
    });
  }

  Widget _buildDatePicker(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('DATE', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        InkWell(
          onTap: () async {
            final date = await showDatePicker(
              context: Get.context!,
              initialDate: controller.selectedDate.value,
              firstDate: DateTime(2000),
              lastDate: DateTime(2100),
              builder: (context, child) {
                return Theme(
                  data: theme.copyWith(
                    colorScheme: theme.colorScheme.copyWith(
                      primary: theme.colorScheme.primary,
                      onPrimary: Colors.white,
                      surface: theme.colorScheme.surface,
                      onSurface: theme.colorScheme.onSurface,
                    ),
                    dialogTheme: DialogThemeData(
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      backgroundColor: theme.colorScheme.surface,
                    ),
                  ),
                  child: child!,
                );
              },
            );
            if (date != null) controller.selectedDate.value = date;
          },
          child: Container(
            padding: AppSpacing.pM,
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border.all(color: theme.colorScheme.outline),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.calendar_today,
                  size: 20,
                  color: theme.colorScheme.primary,
                ),
                AppSpacing.hM,
                Obx(
                  () => Text(
                    DateFormat(
                      'EEEE, MMM dd, yyyy',
                    ).format(controller.selectedDate.value),
                    style: theme.textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildImagePicker(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('ATTACHMENT (OPTIONAL)', style: theme.textTheme.labelSmall),
        AppSpacing.vS,
        Obx(() {
          final imagePath = controller.selectedImagePath.value;
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (imagePath != null)
                Stack(
                  children: [
                    Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        border: Border.all(color: theme.colorScheme.outline),
                      ),
                      child: Image.file(File(imagePath), fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.black54,
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                        ),
                        onPressed: () =>
                            controller.selectedImagePath.value = null,
                      ),
                    ),
                  ],
                ),
              AppSpacing.vS,
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () =>
                          controller.pickImage(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library_outlined),
                      label: const Text('ADD FROM GALLERY'),
                    ),
                  ),
                  AppSpacing.hM,
                  Expanded(
                    child: Obx(
                      () => ElevatedButton.icon(
                        onPressed: controller.isCapturing.value
                            ? null
                            : () => controller.capturePhotoWithConfirm(
                                Get.context!,
                              ),
                        icon: controller.isCapturing.value
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.camera_alt_outlined),
                        label: Text(
                          controller.isCapturing.value
                              ? 'OPENING CAMERA...'
                              : 'CAPTURE RECEIPT',
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          );
        }),
      ],
    );
  }
}
