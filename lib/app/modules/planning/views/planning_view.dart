import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:pennywise/app/data/models/transaction_model.dart';
import '../controllers/planning_controller.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import '../../../../app/routes/app_routes.dart';
import '../../main_navigation/views/responsive_wrapper.dart';

class PlanningView extends GetView<PlanningController> {
  const PlanningView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('PLANNING'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => Get.toNamed(AppRoutes.ADD_TRANSACTION),
          ),
        ],
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
                  _buildSectionHeader('Monthly Overview', theme),
                  AppSpacing.vM,
                  _buildMonthlySummary(theme),
                  AppSpacing.vXL,
                  _buildSectionHeader('Spending Trend', theme),
                  AppSpacing.vM,
                  _buildSpendingTrends(theme),
                  AppSpacing.vXL,
                  _buildHeaderWithAction(
                    'Spending by Category',
                    'Add Category',
                    () => Get.toNamed(AppRoutes.ADD_CATEGORY),
                    theme,
                  ),
                  AppSpacing.vM,
                  _buildCategorySpendingList(theme),
                  AppSpacing.vXL,
                  _buildSectionHeader('Recurring Transactions', theme),
                  AppSpacing.vM,
                  _buildRecurringList(theme),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, ThemeData theme) {
    return Text(title.toUpperCase(), style: theme.textTheme.headlineLarge);
  }

  Widget _buildHeaderWithAction(
    String title,
    String actionButtonTitle,
    VoidCallback onActionButtonPressed,
    ThemeData theme,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Text(
            title.toUpperCase(),
            style: theme.textTheme.headlineLarge,
          ),
        ),
        AppSpacing.hM,
        TextButton(
          onPressed: onActionButtonPressed,
          child: Text(actionButtonTitle.toUpperCase()),
        ),
      ],
    );
  }

  Widget _buildMonthlySummary(ThemeData theme) {
    return Obx(
      () => Container(
        padding: AppSpacing.pL,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          border: Border.all(color: theme.colorScheme.outline),
        ),
        child: Column(
          children: [
            _buildSummaryItem(
              'INCOME',
              controller.monthlyIncome.value,
              AppColors.success,
              theme,
            ),
            AppSpacing.vM,
            _buildSummaryItem(
              'EXPENSES',
              controller.monthlyExpenses.value,
              AppColors.error,
              theme,
            ),
            const Divider(height: 32),
            _buildSummaryItem(
              'REMAINING',
              controller.monthlyIncome.value - controller.monthlyExpenses.value,
              theme.colorScheme.primary,
              theme,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpendingTrends(ThemeData theme) {
    return Obx(() {
      final hasCategorySpending = controller.categorySpending.isNotEmpty;
      final hasNetTrendData = controller.netTrend.values.any(
        (v) => v.abs() > 0.001,
      );

      if (!hasCategorySpending && !hasNetTrendData) {
        return _buildEmptyState('No data for trends', theme);
      }

      return Column(
        children: [
          _buildBarChartContainer(theme),
          AppSpacing.vM,
          _buildLineChartContainer(theme),
        ],
      );
    });
  }

  Widget _buildBarChartContainer(ThemeData theme) {
    final sortedEntries = controller.categorySpending.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final barGroups = sortedEntries.asMap().entries.map((e) {
      return BarChartGroupData(
        x: e.key,
        barRods: [
          BarChartRodData(
            toY: e.value.value,
            color: theme.colorScheme.secondary,
            width: 16,
            borderRadius: BorderRadius.zero,
          ),
        ],
      );
    }).toList();

    return Container(
      width: double.infinity,
      height: 250,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('BY CATEGORY', style: theme.textTheme.labelSmall),
          AppSpacing.vM,
          Expanded(
            child: BarChart(
              BarChartData(
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < sortedEntries.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              sortedEntries[index].key
                                  .substring(0, 3)
                                  .toUpperCase(),
                              style: const TextStyle(fontSize: 8),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: barGroups,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLineChartContainer(ThemeData theme) {
    final trendEntries = controller.netTrend.entries.toList();
    final spots = trendEntries.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.value);
    }).toList();

    return Container(
      width: double.infinity,
      height: 250,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('30-DAY NET TREND', style: theme.textTheme.labelSmall),
          AppSpacing.vM,
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (value) {
                    if (value == 0) {
                      return FlLine(
                        color: theme.colorScheme.primary,
                        strokeWidth: 2,
                      );
                    }
                    return FlLine(
                      color: theme.colorScheme.outlineVariant,
                      strokeWidth: 0.5,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 7, // Show every 7 days
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index >= 0 && index < trendEntries.length) {
                          final date = trendEntries[index].key;
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              '${date.day}/${date.month}',
                              style: const TextStyle(fontSize: 8),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    color: theme.colorScheme.secondary,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySpendingList(ThemeData theme) {
    return Obx(() {
      if (controller.categorySpending.isEmpty) {
        return _buildEmptyState('No spending data for this month', theme);
      }
      return Column(
        children: controller.categorySpending.entries.map((entry) {
          return _buildCategoryItem(entry.key, entry.value, theme);
        }).toList(),
      );
    });
  }

  Widget _buildCategoryItem(String category, double amount, ThemeData theme) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.s),
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(category.toUpperCase(), style: theme.textTheme.titleSmall),
          Text(
            '\$${amount.toStringAsFixed(2)}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecurringList(ThemeData theme) {
    return Obx(() {
      if (controller.recurringTransactions.isEmpty) {
        return _buildEmptyState('No recurring transactions found', theme);
      }
      return Column(
        children: controller.recurringTransactions.map((tx) {
          return _buildRecurringItem(
            tx.note ?? 'Subscription',
            tx.amount,
            tx.type == TransactionType.income
                ? AppColors.success
                : AppColors.error,
            theme,
          );
        }).toList(),
      );
    });
  }

  Widget _buildRecurringItem(
    String title,
    double amount,
    Color color,
    ThemeData theme,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.s),
      padding: AppSpacing.pM,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border.all(color: theme.colorScheme.outline),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title.toUpperCase(), style: theme.textTheme.titleSmall),
          Text(
            '\$${amount.toStringAsFixed(2)}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(
    String label,
    double amount,
    Color color,
    ThemeData theme,
  ) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.labelMedium),
        Text(
          '\$${amount.toStringAsFixed(2)}',
          style: theme.textTheme.titleMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.w900,
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(String message, ThemeData theme) {
    return Center(
      child: Padding(
        padding: AppSpacing.pXL,
        child: Column(
          children: [
            Icon(
              Icons.analytics_outlined,
              size: 48,
              color: theme.colorScheme.onSurface.withValues(alpha: 0.3),
            ),
            AppSpacing.vM,
            Text(
              message,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
