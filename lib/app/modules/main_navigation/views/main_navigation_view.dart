import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/main_navigation_controller.dart';
import '../../dashboard/views/dashboard_view.dart';
import '../../calendar/views/calendar_view.dart';
import '../../planning/views/planning_view.dart';
import '../../settings/views/settings_view.dart';
import '../../transactions/views/transactions_view.dart';
import '../../../../core/values/spacing.dart';

class MainNavigationView extends GetView<MainNavigationController> {
  const MainNavigationView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Obx(
        () => IndexedStack(
          index: controller.currentIndex.value,
          children: const [
            DashboardView(),
            TransactionsView(),
            CalendarView(),
            PlanningView(),
            SettingsView(),
          ],
        ),
      ),
      bottomNavigationBar: Obx(
        () => BottomAppBar(
          padding: EdgeInsets.zero,
          height: 64,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                0,
                Icons.dashboard_outlined,
                Icons.dashboard,
                'Home',
                theme,
              ),
              _buildNavItem(
                1,
                Icons.receipt_long_outlined,
                Icons.receipt_long,
                'History',
                theme,
              ),
              _buildNavItem(
                2,
                Icons.calendar_today_outlined,
                Icons.calendar_today,
                'Calendar',
                theme,
              ),
              _buildNavItem(
                3,
                Icons.pie_chart_outline,
                Icons.pie_chart,
                'Planning',
                theme,
              ),
              _buildNavItem(
                4,
                Icons.settings_outlined,
                Icons.settings,
                'Settings',
                theme,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData outlineIcon,
    IconData solidIcon,
    String label,
    ThemeData theme,
  ) {
    final isSelected = controller.currentIndex.value == index;
    return GestureDetector(
      onTap: () => controller.changeIndex(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isSelected ? solidIcon : outlineIcon,
            color: isSelected
                ? theme.colorScheme.primary
                : theme.colorScheme.onSurface.withOpacity(0.5),
            size: 24,
          ),
          AppSpacing.vXS,
          Text(
            label.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: isSelected
                  ? theme.colorScheme.primary
                  : theme.colorScheme.onSurface.withOpacity(0.5),
              fontSize: 9,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}
