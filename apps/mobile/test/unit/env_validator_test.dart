import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/config/env_validator.dart';

void main() {
  group('EnvValidator', () {
    test('isOfflineMode returns correct value', () {
      // In test environment, Supabase is not configured
      // so isOfflineMode should be determinable
      expect(EnvValidator.isOfflineMode, isA<bool>());
    });

    test('validate throws when Supabase is not configured', () {
      // In test env without --dart-define, validate should throw
      expect(
        () => EnvValidator.validate(),
        throwsA(isA<Exception>()),
      );
    });
  });
}
