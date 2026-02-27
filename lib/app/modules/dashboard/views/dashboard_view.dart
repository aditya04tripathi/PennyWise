import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:pennywise/app/modules/main_navigation/controllers/main_navigation_controller.dart';
import '../controllers/dashboard_controller.dart';
import '../../card_management/controllers/card_management_controller.dart';
import '../../../data/models/card_model.dart';
import '../../../data/models/transaction_model.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import '../../../../app/routes/app_routes.dart';
import '../../main_navigation/views/responsive_wrapper.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    final cardController = Get.find<CardManagementController>();
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: Obx(
          () => Text(
            'Hello, ${controller.store.user.value?.name ?? "User"}'
                .toUpperCase(),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Get.toNamed(AppRoutes.ADD_TRANSACTION),
        backgroundColor: theme.colorScheme.primary,
        shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: SafeArea(
        child: ResponsiveWrapper(
          child: RefreshIndicator(
            onRefresh: () async {
              controller.onInit();
              await Future.delayed(const Duration(milliseconds: 500));
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppSpacing.pM,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildBalanceCard(theme),
                  AppSpacing.vL,
                  _buildHeaderWithAction(
                    'My Cards',
                    'Add Card',
                    () => Get.toNamed(AppRoutes.ADD_CARD),
                    theme,
                  ),
                  AppSpacing.vS,
                  _buildCardsList(cardController, theme),
                  AppSpacing.vL,
                  _buildSummaryRow(theme),
                  AppSpacing.vXL,
                  _buildHeaderWithAction('Recent Activity', 'See All', () {
                    final mainNavController =
                        Get.find<MainNavigationController>();
                    mainNavController.changeIndex(1);
                  }, theme),
                  AppSpacing.vS,
                  _buildRecentTransactions(theme),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBalanceCard(ThemeData theme) {
    return Container(
      width: double.infinity,
      padding: AppSpacing.pL,
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.zero,
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Total Balance',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onPrimary.withOpacity(0.8),
            ),
          ),
          AppSpacing.vS,
          Obx(
            () => Text(
              '\$${controller.totalBalance.value.toStringAsFixed(2)}',
              style: theme.textTheme.displayLarge?.copyWith(
                color: theme.colorScheme.onPrimary,
                fontSize: 32,
              ),
            ),
          ),
          AppSpacing.vL,
          Row(
            children: [
              Obx(
                () => _buildMiniSummary(
                  Icons.arrow_upward,
                  'Income',
                  '\$${controller.income.value.toStringAsFixed(2)}',
                  theme.colorScheme.onPrimary,
                  theme,
                ),
              ),
              AppSpacing.hXL,
              Obx(
                () => _buildMiniSummary(
                  Icons.arrow_downward,
                  'Expenses',
                  '\$${controller.expenses.value.toStringAsFixed(2)}',
                  theme.colorScheme.onPrimary,
                  theme,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniSummary(
    IconData icon,
    String label,
    String amount,
    Color color,
    ThemeData theme,
  ) {
    return Row(
      children: [
        Container(
          padding: AppSpacing.pS,
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.zero,
          ),
          child: Icon(icon, color: color, size: 16),
        ),
        AppSpacing.hS,
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: color.withOpacity(0.7),
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              amount,
              style: theme.textTheme.titleMedium?.copyWith(
                color: color,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildHeaderWithAction(
    String title,
    String action,
    VoidCallback onTap,
    ThemeData theme,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title.toUpperCase(), style: theme.textTheme.headlineLarge),
        TextButton(onPressed: onTap, child: Text(action.toUpperCase())),
      ],
    );
  }

  Widget _buildCardsList(
    CardManagementController cardController,
    ThemeData theme,
  ) {
    return Obx(() {
      if (cardController.cards.isEmpty) {
        return _buildEmptyCardsState(theme);
      }
      return SizedBox(
        height: 180,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          itemCount: cardController.cards.length,
          separatorBuilder: (context, index) => AppSpacing.hM,
          itemBuilder: (context, index) {
            final card = cardController.cards[index];
            return _buildCardItem(card, theme);
          },
        ),
      );
    });
  }

  Widget _buildEmptyCardsState(ThemeData theme) {
    return Container(
      width: double.infinity,
      height: 180,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.credit_card_off_outlined,
            size: 48,
            color: theme.colorScheme.onSurface.withOpacity(0.5),
          ),
          AppSpacing.vS,
          Text(
            'No cards added yet',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardItem(PaymentCard card, ThemeData theme) {
    final color = Color(card.colorValue);
    return Container(
      width: 300,
      padding: AppSpacing.pL,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.zero,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                card.bankName.toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 14,
                  letterSpacing: 1.2,
                ),
              ),
              _buildCardIcon(card.cardType),
            ],
          ),
          Text(
            card.maskedNumber,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              letterSpacing: 2,
              fontWeight: FontWeight.w700,
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'HOLDER',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    card.cardHolderName.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCardIcon(CardType type) {
    IconData icon;
    switch (type) {
      case CardType.visa:
        icon = Icons.credit_card;
        break;
      case CardType.mastercard:
        icon = Icons.credit_card;
        break;
      default:
        icon = Icons.credit_card;
    }
    return Icon(icon, color: Colors.white, size: 24);
  }

  Widget _buildSummaryRow(ThemeData theme) {
    return Row(
      children: [
        Expanded(
          child: Obx(
            () => _buildSummaryCard(
              'Monthly Budget',
              '\$${controller.monthlyBudget.value.toStringAsFixed(0)}',
              theme.colorScheme.primary,
              Icons.account_balance_wallet,
              theme,
              onTap: () => Get.toNamed(AppRoutes.BUDGET_SETUP),
            ),
          ),
        ),
        AppSpacing.hM,
        Expanded(
          child: Obx(
            () => _buildSummaryCard(
              'Daily Average',
              '\$${controller.averageDailySpending.value.toStringAsFixed(2)}',
              theme.colorScheme.secondary,
              Icons.trending_up,
              theme,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(
    String title,
    String value,
    Color color,
    IconData icon,
    ThemeData theme, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: AppSpacing.pM,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: AppSpacing.pS,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.zero,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            AppSpacing.vM,
            Text(title.toUpperCase(), style: theme.textTheme.labelSmall),
            AppSpacing.vXS,
            Text(
              value,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentTransactions(ThemeData theme) {
    return Obx(() {
      if (controller.recentTransactions.isEmpty) {
        return _buildEmptyTransactionsState(theme);
      }
      return Column(
        children: controller.recentTransactions
            .map((tx) => _buildRecentTransactionItem(tx, theme))
            .toList(),
      );
    });
  }

  Widget _buildRecentTransactionItem(Transaction tx, ThemeData theme) {
    final isIncome = tx.type == TransactionType.income;
    final color = isIncome ? AppColors.success : AppColors.error;

    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.s),
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Row(
        children: [
          Container(
            padding: AppSpacing.pS,
            decoration: BoxDecoration(color: color.withOpacity(0.1)),
            child: Icon(
              isIncome ? Icons.arrow_upward : Icons.arrow_downward,
              color: color,
              size: 16,
            ),
          ),
          AppSpacing.hM,
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  (tx.note ?? 'Transaction').toUpperCase(),
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  controller.store.categories.getById(tx.categoryId)?.name ??
                      'Other',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          Text(
            '${isIncome ? '+' : '-'}\$${tx.amount.toStringAsFixed(2)}',
            style: theme.textTheme.titleMedium?.copyWith(
              color: color,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyTransactionsState(ThemeData theme) {
    return Container(
      width: double.infinity,
      padding: AppSpacing.pXL,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 48,
            color: theme.colorScheme.onSurface.withOpacity(0.3),
          ),
          AppSpacing.vM,
          Text(
            'No recent activity',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }
}
