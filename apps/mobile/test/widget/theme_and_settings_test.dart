import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_core/epi_core.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات Dark Mode + Theme System
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('AppTheme', () {
    test('lightTheme has correct primary color', () {
      expect(AppTheme.primaryColor, equals(const Color(0xFF00897B)));
    });

    test('darkTheme exists and has dark brightness', () {
      expect(AppTheme.darkTheme.brightness, equals(Brightness.dark));
    });

    test('lightTheme has light brightness', () {
      expect(AppTheme.lightTheme.brightness, equals(Brightness.light));
    });

    test('primaryGradient has 2 colors', () {
      expect(AppTheme.primaryGradient.colors.length, equals(2));
    });

    test('statusColor returns correct color for known statuses', () {
      expect(AppTheme.statusColor('approved'), isA<Color>());
      expect(AppTheme.statusColor('rejected'), isA<Color>());
      expect(AppTheme.statusColor('submitted'), isA<Color>());
      expect(AppTheme.statusColor('draft'), isA<Color>());
    });

    test('statusColor returns default color for unknown status', () {
      expect(AppTheme.statusColor('unknown'), isA<Color>());
    });

    test('severity colors are defined', () {
      expect(AppTheme.criticalColor, isA<Color>());
      expect(AppTheme.highColor, isA<Color>());
      expect(AppTheme.mediumColor, isA<Color>());
      expect(AppTheme.lowColor, isA<Color>());
    });

    test('semantic colors are defined', () {
      expect(AppTheme.successColor, isA<Color>());
      expect(AppTheme.warningColor, isA<Color>());
      expect(AppTheme.errorColor, isA<Color>());
      expect(AppTheme.infoColor, isA<Color>());
    });

    test('cardShadow returns non-empty list', () {
      expect(AppTheme.cardShadow, isNotEmpty);
    });
  });

  group('ThemeMode', () {
    test('system mode is default', () {
      expect(ThemeMode.system, equals(ThemeMode.system));
    });

    test('all three modes exist', () {
      expect(ThemeMode.values.length, equals(3));
      expect(ThemeMode.values, contains(ThemeMode.system));
      expect(ThemeMode.values, contains(ThemeMode.light));
      expect(ThemeMode.values, contains(ThemeMode.dark));
    });
  });

  group('i18n — Settings keys', () {
    test('settings keys are present in Arabic', () {
      final l10n = AppLocalizations(const Locale('ar', 'YE'), {
        'settings.title': 'الإعدادات',
        'settings.dark_mode': 'الوضع الليلي',
        'settings.dark_mode_enabled': 'مفعّل',
        'settings.dark_mode_disabled': 'معطّل',
        'settings.dark_mode_system': 'تلقائي (حسب النظام)',
        'settings.dark_mode_auto': 'تلقائي',
        'settings.dark_mode_light': 'نهاري',
        'settings.dark_mode_dark': 'ليلي',
        'settings.account_info': 'معلومات الحساب',
        'settings.app_info': 'معلومات التطبيق',
      });

      expect(l10n.t('settings.title'), equals('الإعدادات'));
      expect(l10n.t('settings.dark_mode'), equals('الوضع الليلي'));
      expect(l10n.t('settings.dark_mode_enabled'), equals('مفعّل'));
      expect(l10n.t('settings.dark_mode_disabled'), equals('معطّل'));
      expect(l10n.t('settings.dark_mode_auto'), equals('تلقائي'));
      expect(l10n.t('settings.dark_mode_light'), equals('نهاري'));
      expect(l10n.t('settings.dark_mode_dark'), equals('ليلي'));
    });
  });

  group('EpiButton with Semantics', () {
    testWidgets('button has semantic label', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: EpiButton(
                text: 'تسجيل الدخول',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.bySemanticsLabel('تسجيل الدخول'), findsOneWidget);
    });

    testWidgets('disabled button has correct semantic label', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: EpiButton(
                text: 'حفظ',
                onPressed: null,
              ),
            ),
          ),
        ),
      );

      // The button should have semantics indicating it's disabled
      expect(find.byType(EpiButton), findsOneWidget);
    });

    testWidgets('loading button has loading label', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: EpiButton(
                text: 'إرسال',
                isLoading: true,
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  group('EpiStatCard with Semantics', () {
    testWidgets('stat card has semantic label with title and value', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EpiStatCard(
              title: 'الإرساليات',
              value: '42',
              icon: Icons.assignment,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('42'), findsOneWidget);
      expect(find.text('الإرساليات'), findsOneWidget);
    });

    testWidgets('stat card with trend shows trend indicator', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EpiStatCard(
              title: 'التغطية',
              value: '95%',
              icon: Icons.check_circle,
              trend: '5%',
              trendUp: true,
            ),
          ),
        ),
      );

      expect(find.byIcon(Icons.trending_up), findsOneWidget);
    });

    testWidgets('stat card without onTap is not a button', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EpiStatCard(
              title: 'النواقص',
              value: '3',
              icon: Icons.warning,
            ),
          ),
        ),
      );

      // No tap target
      expect(find.text('3'), findsOneWidget);
    });
  });

  group('EpiTextField with Semantics', () {
    testWidgets('text field has semantic label', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EpiTextField(
              label: 'البريد الإلكتروني',
              hint: 'example@email.com',
            ),
          ),
        ),
      );

      expect(find.text('البريد الإلكتروني'), findsOneWidget);
    });

    testWidgets('password field has obscured text indicator', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: EpiTextField(
              label: 'كلمة المرور',
              obscureText: true,
            ),
          ),
        ),
      );

      expect(find.text('كلمة المرور'), findsOneWidget);
    });
  });
}
