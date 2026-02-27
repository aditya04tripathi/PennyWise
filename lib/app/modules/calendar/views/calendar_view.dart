import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import '../controllers/calendar_controller.dart';
import '../../../data/models/transaction_model.dart';
import '../../../../core/values/colors.dart';
import '../../../../core/values/spacing.dart';
import '../../main_navigation/views/responsive_wrapper.dart';

class CalendarView extends GetView<CalendarController> {
  const CalendarView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(title: const Text('CALENDAR')),
      body: SafeArea(
        child: ResponsiveWrapper(
          child: Column(
            children: [
              Obx(
                () => TableCalendar(
                  firstDay: DateTime.utc(2020, 1, 1),
                  lastDay: DateTime.now(),
                  focusedDay: controller.focusedDay.value,
                  selectedDayPredicate: (day) =>
                      isSameDay(controller.selectedDay.value, day),
                  onDaySelected: (selectedDay, focusedDay) {
                    controller.selectedDay.value = selectedDay;
                    controller.focusedDay.value = focusedDay;
                  },
                  eventLoader: (day) => controller.getTransactionsForDay(day),
                  calendarBuilders: CalendarBuilders(
                    markerBuilder: (context, date, events) {
                      if (events.isEmpty) return const SizedBox.shrink();
                      final hasIncome = controller.hasIncome(date);
                      final hasExpense = controller.hasExpense(date);

                      return Positioned(
                        bottom: 4,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (hasIncome)
                              Container(
                                width: 6,
                                height: 6,
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 1,
                                ),
                                decoration: const BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            if (hasExpense)
                              Container(
                                width: 6,
                                height: 6,
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 1,
                                ),
                                decoration: const BoxDecoration(
                                  color: AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                              ),
                          ],
                        ),
                      );
                    },
                  ),
                  calendarStyle: CalendarStyle(
                    todayDecoration: BoxDecoration(
                      color: theme.colorScheme.primary.withOpacity(0.1),
                      shape: BoxShape.rectangle,
                      border: Border.all(color: theme.colorScheme.primary),
                    ),
                    selectedDecoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.rectangle,
                    ),
                    defaultTextStyle: theme.textTheme.bodyMedium!,
                    weekendTextStyle: theme.textTheme.bodyMedium!.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                    todayTextStyle: theme.textTheme.bodyMedium!.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.w900,
                    ),
                    selectedTextStyle: theme.textTheme.bodyMedium!.copyWith(
                      color: theme.colorScheme.onPrimary,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  headerStyle: HeaderStyle(
                    formatButtonVisible: false,
                    titleCentered: true,
                    titleTextStyle: theme.textTheme.headlineLarge!,
                    leftChevronIcon: Icon(
                      Icons.chevron_left,
                      color: theme.colorScheme.onSurface,
                    ),
                    rightChevronIcon: Icon(
                      Icons.chevron_right,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  daysOfWeekStyle: DaysOfWeekStyle(
                    weekdayStyle: theme.textTheme.labelSmall!,
                    weekendStyle: theme.textTheme.labelSmall!.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
              AppSpacing.vM,
              Divider(height: 1),
              Expanded(
                child: Obx(() {
                  if (controller.transactionsForSelectedDay.isEmpty) {
                    return _buildEmptyState(theme);
                  }
                  return ListView.separated(
                    padding: AppSpacing.pM,
                    itemCount: controller.transactionsForSelectedDay.length,
                    separatorBuilder: (context, index) => AppSpacing.vS,
                    itemBuilder: (context, index) {
                      final tx = controller.transactionsForSelectedDay[index];
                      return _buildTransactionItem(tx, theme);
                    },
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.event_note,
            size: 64,
            color: theme.colorScheme.onSurface.withOpacity(0.1),
          ),
          AppSpacing.vM,
          Text(
            'NO TRANSACTIONS ON THIS DAY',
            style: theme.textTheme.labelLarge?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionItem(Transaction tx, ThemeData theme) {
    final isIncome = tx.type == TransactionType.income;
    final color = isIncome ? AppColors.success : AppColors.error;

    return Container(
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
}
