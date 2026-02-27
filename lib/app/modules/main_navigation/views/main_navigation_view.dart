import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controllers/main_navigation_controller.dart';
import '../../dashboard/views/dashboard_view.dart';
import '../../calendar/views/calendar_view.dart';
import '../../planning/views/planning_view.dart';
import '../../settings/views/settings_view.dart';
import '../../transactions/views/transactions_view.dart';
import '../../../../core/values/spacing.dart';
import '../../../services/ad_service.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class MainNavigationView extends GetView<MainNavigationController> {
  const MainNavigationView({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final maxWidth = 768.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > maxWidth;
        final adService = Get.find<AdService>();

        return Scaffold(
          backgroundColor: theme.scaffoldBackgroundColor,
          body: Row(
            children: [
              if (isWide)
                Obx(
                  () => NavigationRail(
                    leadingAtTop: true,
                    leading: Image.asset(
                      "assets/images/logo.png",
                      width: 56,
                      height: 56,
                    ),
                    trailing: _buildRailAdButton(theme),
                    selectedIndex: controller.currentIndex.value,
                    onDestinationSelected: controller.changeIndex,
                    labelType: NavigationRailLabelType.all,
                    backgroundColor: theme.scaffoldBackgroundColor,
                    indicatorColor: theme.colorScheme.primary.withOpacity(0.1),
                    selectedIconTheme: IconThemeData(
                      color: theme.colorScheme.primary,
                    ),
                    unselectedIconTheme: IconThemeData(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                    selectedLabelTextStyle: TextStyle(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                    unselectedLabelTextStyle: TextStyle(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                      fontSize: 12,
                    ),
                    destinations: const [
                      NavigationRailDestination(
                        icon: Icon(Icons.dashboard_outlined),
                        selectedIcon: Icon(Icons.dashboard),
                        label: Text('Home'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.receipt_long_outlined),
                        selectedIcon: Icon(Icons.receipt_long),
                        label: Text('History'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.calendar_today_outlined),
                        selectedIcon: Icon(Icons.calendar_today),
                        label: Text('Calendar'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.pie_chart_outline),
                        selectedIcon: Icon(Icons.pie_chart),
                        label: Text('Planning'),
                      ),
                      NavigationRailDestination(
                        icon: Icon(Icons.settings_outlined),
                        selectedIcon: Icon(Icons.settings),
                        label: Text('Settings'),
                      ),
                    ],
                  ),
                ),
              if (isWide)
                SafeArea(
                  child: VerticalDivider(
                    thickness: 1,
                    width: 1,
                    color: theme.colorScheme.outlineVariant.withOpacity(0.5),
                  ),
                ),
              Expanded(
                child: Obx(
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
              ),
            ],
          ),
          bottomNavigationBar: isWide
              ? Obx(
                  () => SafeArea(
                    child: adService.isBannerReady.value
                        ? SizedBox(
                            height: adService.bannerAd.value!.size.height
                                .toDouble(),
                            width: adService.bannerAd.value!.size.width
                                .toDouble(),
                            child: AdWidget(ad: adService.bannerAd.value!),
                          )
                        : const SizedBox.shrink(),
                  ),
                )
              : Obx(
                  () => Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      BottomAppBar(
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
                            _buildAdButton(theme),
                          ],
                        ),
                      ),
                      SafeArea(
                        child: Obx(
                          () => adService.isBannerReady.value
                              ? SizedBox(
                                  height: adService.bannerAd.value!.size.height
                                      .toDouble(),
                                  width: adService.bannerAd.value!.size.width
                                      .toDouble(),
                                  child: AdWidget(
                                    ad: adService.bannerAd.value!,
                                  ),
                                )
                              : const SizedBox.shrink(),
                        ),
                      ),
                    ],
                  ),
                ),
        );
      },
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

  Widget _buildAdButton(ThemeData theme) {
    final adService = Get.find<AdService>();
    return GestureDetector(
      onTap: () {
        print("Interstitial Ad Tapped");
        adService.showInterstitial();
        print("Interstitial Ad Showed");
      },
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.play_circle_outline,
            color: theme.colorScheme.onSurface.withOpacity(0.5),
            size: 24,
          ),
          AppSpacing.vXS,
          Text(
            'Ad'.toUpperCase(),
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
              fontSize: 9,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRailAdButton(ThemeData theme) {
    final adService = Get.find<AdService>();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: GestureDetector(
        onTap: () => adService.showInterstitial(),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.play_circle_outline,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
              size: 24,
            ),
            AppSpacing.vXS,
            Text(
              'AD'.toUpperCase(),
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.5),
                fontSize: 9,
                letterSpacing: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
