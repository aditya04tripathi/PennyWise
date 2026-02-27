import 'dart:async';
import 'dart:io';
import 'package:get/get.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

class AdService extends GetxService {
  final bannerAd = Rxn<BannerAd>();
  final isBannerReady = false.obs;
  InterstitialAd? _interstitialAd;
  bool _isInterstitialReady = false;
  Timer? _bannerRetryTimer;
  Timer? _interstitialRetryTimer;

  Future<AdService> init() async {
    await MobileAds.instance.initialize();
    await _loadBanner();
    await _loadInterstitial();
    return this;
  }

  Future<void> _loadBanner() async {
    final bannerUnitId = Platform.isAndroid
        ? 'ca-app-pub-5931956401636205/9610387398'
        : 'ca-app-pub-3940256099942544/2934735716';
    Get.log('Loading BannerAd: $bannerUnitId');
    final ad = BannerAd(
      adUnitId: bannerUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          bannerAd.value = ad as BannerAd;
          isBannerReady.value = true;
          Get.log('BannerAd loaded: ${bannerAd.value?.size}');
          _bannerRetryTimer?.cancel();
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          isBannerReady.value = false;
          Get.log('BannerAd failed to load: ${error.code} ${error.message}');
          _bannerRetryTimer?.cancel();
          _bannerRetryTimer = Timer(const Duration(seconds: 30), _loadBanner);
        },
      ),
    );
    await ad.load();
  }

  Future<void> _loadInterstitial() async {
    final interstitialUnitId = Platform.isAndroid
        ? 'ca-app-pub-5931956401636205/2210970871'
        : 'ca-app-pub-3940256099942544/4411468910';
    Get.log('Loading InterstitialAd: $interstitialUnitId');
    await InterstitialAd.load(
      adUnitId: interstitialUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          _interstitialAd = ad;
          _isInterstitialReady = true;
          ad.setImmersiveMode(false);
          ad.fullScreenContentCallback = FullScreenContentCallback(
            onAdDismissedFullScreenContent: (ad) {
              ad.dispose();
              _interstitialAd = null;
              _isInterstitialReady = false;
              _loadInterstitial();
            },
            onAdFailedToShowFullScreenContent: (ad, error) {
              ad.dispose();
              _interstitialAd = null;
              _isInterstitialReady = false;
              _loadInterstitial();
            },
          );
          _interstitialRetryTimer?.cancel();
          Get.log('InterstitialAd loaded');
        },
        onAdFailedToLoad: (error) {
          _interstitialAd = null;
          _isInterstitialReady = false;
          Get.log(
            'InterstitialAd failed to load: ${error.code} ${error.message}',
          );
          _interstitialRetryTimer?.cancel();
          _interstitialRetryTimer = Timer(
            const Duration(seconds: 45),
            _loadInterstitial,
          );
        },
      ),
    );
  }

  void showInterstitial() {
    if (_isInterstitialReady && _interstitialAd != null) {
      _interstitialAd!.show();
    }
  }

  @override
  void onClose() {
    bannerAd.value?.dispose();
    _interstitialAd?.dispose();
    _bannerRetryTimer?.cancel();
    _interstitialRetryTimer?.cancel();
    super.onClose();
  }
}
