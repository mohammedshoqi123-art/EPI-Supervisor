import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/utils/geo_utils.dart';

void main() {
  group('GeoUtils — Distance', () {
    test('same point has zero distance', () {
      final dist = GeoUtils.distanceKm(15.35, 44.2, 15.35, 44.2);
      expect(dist, equals(0.0));
    });

    test('calculates Sanaa to Aden distance correctly', () {
      // Sanaa: 15.3694, 44.1910 — Aden: 12.7855, 45.0187
      final dist = GeoUtils.distanceKm(15.3694, 44.1910, 12.7855, 45.0187);
      // Actual distance is ~300km
      expect(dist, greaterThan(250));
      expect(dist, lessThan(350));
    });

    test('distanceMeters converts correctly', () {
      final meters = GeoUtils.distanceMeters(15.0, 44.0, 15.0, 44.0);
      expect(meters, equals(0.0));
    });
  });

  group('GeoUtils — Validation', () {
    test('valid coordinates pass', () {
      expect(GeoUtils.isValidCoordinate(15.35, 44.2), isTrue);
      expect(GeoUtils.isValidCoordinate(0, 0), isTrue);
      expect(GeoUtils.isValidCoordinate(-90, -180), isTrue);
      expect(GeoUtils.isValidCoordinate(90, 180), isTrue);
    });

    test('invalid coordinates fail', () {
      expect(GeoUtils.isValidCoordinate(91, 44), isFalse);
      expect(GeoUtils.isValidCoordinate(-91, 44), isFalse);
      expect(GeoUtils.isValidCoordinate(15, 181), isFalse);
      expect(GeoUtils.isValidCoordinate(15, -181), isFalse);
      expect(GeoUtils.isValidCoordinate(null, 44), isFalse);
      expect(GeoUtils.isValidCoordinate(15, null), isFalse);
    });

    test('isWithinYemen detects Yemen coordinates', () {
      // Sanaa
      expect(GeoUtils.isWithinYemen(15.3694, 44.1910), isTrue);
      // Aden
      expect(GeoUtils.isWithinYemen(12.7855, 45.0187), isTrue);
    });

    test('isWithinYemen rejects non-Yemen coordinates', () {
      // Cairo
      expect(GeoUtils.isWithinYemen(30.0444, 31.2357), isFalse);
      // London
      expect(GeoUtils.isWithinYemen(51.5074, -0.1278), isFalse);
    });
  });

  group('GeoUtils — Formatting', () {
    test('formatCoordinates produces expected output', () {
      final formatted = GeoUtils.formatCoordinates(15.3694, 44.1910, decimals: 4);
      expect(formatted, equals('15.3694, 44.1910'));
    });

    test('formatDistance shows meters for short distances', () {
      expect(GeoUtils.formatDistance(500), equals('500 م'));
    });

    test('formatDistance shows km for long distances', () {
      expect(GeoUtils.formatDistance(1500), equals('1.5 كم'));
    });

    test('toPostGISPoint formats correctly', () {
      final point = GeoUtils.toPostGISPoint(15.35, 44.2);
      expect(point, equals('POINT(44.2 15.35)'));
    });

    test('fromPostGISPoint parses correctly', () {
      final result = GeoUtils.fromPostGISPoint('POINT(44.2 15.35)');
      expect(result, isNotNull);
      expect(result!.$1, closeTo(15.35, 0.001));
      expect(result.$2, closeTo(44.2, 0.001));
    });

    test('fromPostGISPoint returns null for invalid input', () {
      expect(GeoUtils.fromPostGISPoint(null), isNull);
      expect(GeoUtils.fromPostGISPoint('invalid'), isNull);
      expect(GeoUtils.fromPostGISPoint(''), isNull);
    });
  });

  group('GeoUtils — Bounding Box', () {
    test('bounding box returns valid bounds', () {
      final box = GeoUtils.boundingBox(15.35, 44.2, 10);
      expect(box.north, greaterThan(15.35));
      expect(box.south, lessThan(15.35));
      expect(box.east, greaterThan(44.2));
      expect(box.west, lessThan(44.2));
    });

    test('bounding box is symmetric', () {
      final box = GeoUtils.boundingBox(15.35, 44.2, 10);
      final latDelta = box.north - 15.35;
      final southDelta = 15.35 - box.south;
      expect(latDelta, closeTo(southDelta, 0.001));
    });
  });
}
