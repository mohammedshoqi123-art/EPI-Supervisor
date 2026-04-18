import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/config/app_config.dart';

void main() {
  group('AppConfig — Constants', () {
    test('app metadata is set', () {
      expect(AppConfig.appName, isNotEmpty);
      expect(AppConfig.appVersion, isNotEmpty);
      expect(AppConfig.buildNumber, greaterThan(0));
    });

    test('pagination limits are sensible', () {
      expect(AppConfig.defaultPageSize, greaterThan(0));
      expect(AppConfig.maxPageSize, greaterThanOrEqualTo(AppConfig.defaultPageSize));
    });

    test('cache expiry is positive', () {
      expect(AppConfig.cacheExpiry.inSeconds, greaterThan(0));
      expect(AppConfig.shortCacheExpiry.inSeconds, greaterThan(0));
      expect(AppConfig.maxOfflineRetention.inDays, greaterThan(0));
    });

    test('sync configuration is valid', () {
      expect(AppConfig.syncInterval.inSeconds, greaterThan(0));
      expect(AppConfig.maxRetries, greaterThan(0));
      expect(AppConfig.maxQueueSize, greaterThan(0));
    });

    test('photo limits are reasonable', () {
      expect(AppConfig.maxPhotoSizeMb, greaterThan(0));
      expect(AppConfig.maxPhotosPerSubmission, greaterThan(0));
      expect(AppConfig.allowedImageExtensions, isNotEmpty);
    });

    test('GPS timeout is positive', () {
      expect(AppConfig.gpsTimeout.inSeconds, greaterThan(0));
    });

    test('session timeout is reasonable (not too short)', () {
      expect(AppConfig.sessionTimeoutMinutes, greaterThanOrEqualTo(30));
    });

    test('max login attempts is reasonable', () {
      expect(AppConfig.maxLoginAttempts, greaterThan(0));
      expect(AppConfig.maxLoginAttempts, lessThanOrEqualTo(10));
    });
  });
}
