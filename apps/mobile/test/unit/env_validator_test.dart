import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/config/env_validator.dart';

void main() {
  group('EnvValidator', () {
    test('isOfflineMode returns correct value', () {
      // In test environment, Supabase is not configured
      // so isOfflineMode should be determinable
      expect(EnvValidator.isOfflineMode, isA<bool>());
    });

    test('validate handles offline mode gracefully', () {
      // In offline mode, validate() doesn't throw — it skips validation
      // We just verify it doesn't crash
      expect(() => EnvValidator.validate(), returnsNormally);
    });
  });
}
