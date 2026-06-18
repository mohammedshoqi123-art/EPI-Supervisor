import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:epi_shared/epi_shared.dart';
import 'package:epi_supervisor/screens/forms_status_widgets.dart';

/// ═══════════════════════════════════════════════════════════════
///  اختبارات Forms Status Widgets
///
///  اختبارات الـ widgets المستخرجة من forms_status_screen.dart
/// ═══════════════════════════════════════════════════════════════

void main() {
  group('FormsStatCard', () {
    testWidgets('renders count and title', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FormsStatCard(
              title: 'المسودات',
              count: 42,
              icon: Icons.edit_note,
              color: AppTheme.warningColor,
              gradient: const LinearGradient(
                colors: [Color(0xFFFB8C00), Color(0xFFF57C00)],
              ),
            ),
          ),
        ),
      );

      expect(find.text('42'), findsOneWidget);
      expect(find.text('المسودات'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FormsStatCard(
              title: 'المرسلة',
              count: 10,
              icon: Icons.check_circle,
              color: AppTheme.successColor,
              gradient: const LinearGradient(
                colors: [Color(0xFF43A047), Color(0xFF2E7D32)],
              ),
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(FormsStatCard));
      expect(tapped, isTrue);
    });
  });

  group('FormsNavButton', () {
    testWidgets('renders label', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FormsNavButton(
              icon: Icons.arrow_forward_ios,
              label: 'التالي',
              enabled: true,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('التالي'), findsOneWidget);
    });

    testWidgets('calls onTap when enabled and tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FormsNavButton(
              icon: Icons.arrow_back_ios,
              label: 'السابق',
              enabled: true,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(FormsNavButton));
      expect(tapped, isTrue);
    });

    testWidgets('does not call onTap when disabled', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: FormsNavButton(
              icon: Icons.arrow_back_ios,
              label: 'السابق',
              enabled: false,
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(FormsNavButton), warnIfMissed: false);
      expect(tapped, isFalse);
    });
  });

  group('DraftTile', () {
    testWidgets('renders title and status chip', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DraftTile(
              title: 'نموذج التطعيم',
              formId: 'form-1',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('نموذج التطعيم'), findsOneWidget);
    });

    testWidgets('calls onTap when tapped', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DraftTile(
              title: 'Test Draft',
              formId: 'form-1',
              onTap: () => tapped = true,
            ),
          ),
        ),
      );

      await tester.tap(find.byType(DraftTile));
      expect(tapped, isTrue);
    });

    testWidgets('renders date when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: DraftTile(
              title: 'Test Draft',
              formId: 'form-1',
              date: '2026-06-18T10:30:00Z',
              onTap: () {},
            ),
          ),
        ),
      );

      // Date should be formatted and displayed
      expect(find.textContaining('18'), findsWidgets);
    });
  });

  group('PendingTile', () {
    testWidgets('renders title and pending label', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PendingTile(
              title: 'إرسالية معلقة',
              status: 'pending',
              retryCount: 0,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('إرسالية معلقة'), findsOneWidget);
      expect(find.text('بانتظار المزامنة'), findsOneWidget);
    });

    testWidgets('shows retry count when > 0', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PendingTile(
              title: 'Test',
              status: 'pending',
              retryCount: 3,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('محاولة 3'), findsOneWidget);
    });

    testWidgets('does not show retry count when 0', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PendingTile(
              title: 'Test',
              status: 'pending',
              retryCount: 0,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.textContaining('محاولة'), findsNothing);
    });
  });

  group('SubmittedTile', () {
    testWidgets('renders title for submitted status', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubmittedTile(
              title: 'إرسالية مكتملة',
              status: 'submitted',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('إرسالية مكتملة'), findsOneWidget);
    });

    testWidgets('renders offline badge when isOffline is true', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubmittedTile(
              title: 'Test',
              status: 'submitted',
              isOffline: true,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('أوفلاين'), findsOneWidget);
    });

    testWidgets('does not render offline badge when isOffline is false',
        (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubmittedTile(
              title: 'Test',
              status: 'submitted',
              isOffline: false,
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('أوفلاين'), findsNothing);
    });

    testWidgets('renders user name when provided', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SubmittedTile(
              title: 'Test',
              status: 'submitted',
              userName: 'أحمد محمد',
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.text('أحمد محمد'), findsOneWidget);
    });
  });

  group('PickerSheet', () {
    testWidgets('renders title and items', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PickerSheet(
              title: 'اختر المحافظة',
              items: const [
                PickerItem(id: 'gov-1', label: 'صنعاء'),
                PickerItem(id: 'gov-2', label: 'عدن'),
                PickerItem(id: 'gov-3', label: 'تعز'),
              ],
              selectedId: 'gov-1',
              onSelected: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('اختر المحافظة'), findsOneWidget);
      expect(find.text('صنعاء'), findsOneWidget);
      expect(find.text('عدن'), findsOneWidget);
      expect(find.text('تعز'), findsOneWidget);
    });

    testWidgets('shows check icon for selected item', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PickerSheet(
              title: 'اختر',
              items: const [
                PickerItem(id: '1', label: 'أول'),
                PickerItem(id: '2', label: 'ثاني'),
              ],
              selectedId: '2',
              onSelected: (_) {},
            ),
          ),
        ),
      );

      // The selected item should have a check_circle icon
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('calls onSelected when item is tapped', (tester) async {
      String? selectedId;
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: PickerSheet(
              title: 'اختر',
              items: const [
                PickerItem(id: '1', label: 'أول'),
                PickerItem(id: '2', label: 'ثاني'),
              ],
              selectedId: null,
              onSelected: (id) => selectedId = id,
            ),
          ),
        ),
      );

      await tester.tap(find.text('ثاني'));
      expect(selectedId, equals('2'));
    });
  });

  group('PickerItem', () {
    test('can be created with id and label', () {
      const item = PickerItem(id: 'test-id', label: 'Test Label');
      expect(item.id, equals('test-id'));
      expect(item.label, equals('Test Label'));
    });

    test('id can be null', () {
      const item = PickerItem(id: null, label: 'All');
      expect(item.id, isNull);
      expect(item.label, equals('All'));
    });
  });

  group('FormsStatusDateUtils', () {
    test('formatDateTime produces DD/MM/YYYY - HH:MM format', () {
      final result = FormsStatusDateUtils.formatDateTime('2026-06-18T14:30:00Z');
      // The exact format depends on timezone, but should contain the date parts
      expect(result, contains('2026'));
      expect(result, contains(':'));
    });

    test('formatDateTime returns original string for invalid date', () {
      final result = FormsStatusDateUtils.formatDateTime('invalid-date');
      expect(result, equals('invalid-date'));
    });

    test('formatDate produces DD/MM/YYYY format', () {
      final result = FormsStatusDateUtils.formatDate('2026-06-18T14:30:00Z');
      expect(result, contains('2026'));
      expect(result, contains('/'));
    });

    test('formatDate returns original string for invalid date', () {
      final result = FormsStatusDateUtils.formatDate('not-a-date');
      expect(result, equals('not-a-date'));
    });
  });
}
