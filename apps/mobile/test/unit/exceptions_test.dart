import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/errors/app_exceptions.dart';

void main() {
  group('AppException — Base', () {
    test('stores message and code', () {
      const e = AppException('Test error', code: 'TEST_001');
      expect(e.message, equals('Test error'));
      expect(e.code, equals('TEST_001'));
    });

    test('toString includes message and code', () {
      const e = AppException('Something failed', code: 'ERR_42');
      expect(e.toString(), contains('Something failed'));
      expect(e.toString(), contains('[ERR_42]'));
    });

    test('toString without code omits brackets', () {
      const e = AppException('No code');
      expect(e.toString(), equals('AppException: No code'));
    });

    test('stores details', () {
      const e = AppException('Error', details: {'field': 'email'});
      expect(e.details, isNotNull);
    });
  });

  group('API Exceptions', () {
    test('ApiException is AppException', () {
      const e = ApiException('API failed');
      expect(e, isA<AppException>());
      expect(e.message, equals('API failed'));
    });

    test('NotFoundException has code 404', () {
      const e = NotFoundException('Not found');
      expect(e.code, equals('404'));
    });

    test('UnauthorizedException has code 401', () {
      const e = UnauthorizedException();
      expect(e.code, equals('401'));
      expect(e.message, equals('Unauthorized'));
    });

    test('ForbiddenException has code 403', () {
      const e = ForbiddenException();
      expect(e.code, equals('403'));
    });

    test('ConflictException has code 409', () {
      const e = ConflictException('Duplicate');
      expect(e.code, equals('409'));
    });

    test('ServerException has code 500', () {
      const e = ServerException();
      expect(e.code, equals('500'));
    });

    test('NetworkException has code NETWORK', () {
      const e = NetworkException();
      expect(e.code, equals('NETWORK'));
    });
  });

  group('Auth Exceptions', () {
    test('InvalidCredentialsException has correct code', () {
      const e = InvalidCredentialsException();
      expect(e.code, equals('INVALID_CREDENTIALS'));
      expect(e, isA<AuthException>());
    });

    test('SessionExpiredException has correct code', () {
      const e = SessionExpiredException();
      expect(e.code, equals('SESSION_EXPIRED'));
    });
  });

  group('PermissionException', () {
    test('has PERMISSION_DENIED code', () {
      const e = PermissionException('Cannot edit');
      expect(e.code, equals('PERMISSION_DENIED'));
      expect(e.message, equals('Cannot edit'));
    });
  });

  group('ValidationException', () {
    test('stores field errors', () {
      const e = ValidationException(
        'Validation failed',
        fieldErrors: {'email': 'Invalid format', 'phone': 'Too short'},
      );
      expect(e.fieldErrors, isNotNull);
      expect(e.fieldErrors!['email'], equals('Invalid format'));
      expect(e.fieldErrors!['phone'], equals('Too short'));
    });

    test('has VALIDATION_ERROR code', () {
      const e = ValidationException('Bad input');
      expect(e.code, equals('VALIDATION_ERROR'));
    });
  });

  group('Offline Exceptions', () {
    test('OfflineException has OFFLINE code', () {
      const e = OfflineException();
      expect(e.code, equals('OFFLINE'));
      expect(e.message, equals('Device is offline'));
    });

    test('SyncException stores message and code', () {
      const e = SyncException('Sync failed', code: 'SYNC_TIMEOUT');
      expect(e.code, equals('SYNC_TIMEOUT'));
    });

    test('ConflictResolutionException has SYNC_CONFLICT code', () {
      const e = ConflictResolutionException('Data conflict');
      expect(e.code, equals('SYNC_CONFLICT'));
    });
  });

  group('Exception Hierarchy', () {
    test('all API exceptions are AppException', () {
      expect(ApiException(''), isA<AppException>());
      expect(NotFoundException(''), isA<AppException>());
      expect(const UnauthorizedException(), isA<AppException>());
      expect(const ForbiddenException(), isA<AppException>());
      expect(ConflictException(''), isA<AppException>());
      expect(const ServerException(), isA<AppException>());
      expect(const NetworkException(), isA<AppException>());
    });

    test('auth exceptions are AppException', () {
      expect(const InvalidCredentialsException(), isA<AppException>());
      expect(const SessionExpiredException(), isA<AppException>());
    });

    test('offline exceptions are AppException', () {
      expect(const OfflineException(), isA<AppException>());
      expect(const SyncException(''), isA<AppException>());
    });
  });
}
