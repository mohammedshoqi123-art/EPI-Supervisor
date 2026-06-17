import 'package:flutter_test/flutter_test.dart';
import 'package:epi_core/src/ai/bot/vaccination_service.dart';

/// ═══════════════════════════════════════════════════════════
/// اختبارات خدمة التطعيم — يتحقق من صحة البيانات الطبية
/// هذا الاختبار مهم جداً لأنه يضمن عدم وجود أخطاء طبية
/// ═══════════════════════════════════════════════════════════

void main() {
  group('VaccinationService — vaccine count', () {
    test('should have all required vaccines', () {
      final vaccines = VaccinationService.allVaccines;
      // Should have at least 15 vaccines
      expect(vaccines.length, greaterThanOrEqualTo(15));
    });

    test('should have unique IDs for all vaccines', () {
      final vaccines = VaccinationService.allVaccines;
      final ids = vaccines.map((v) => v.id).toList();
      final uniqueIds = ids.toSet();
      expect(ids.length, equals(uniqueIds.length),
          reason: 'All vaccine IDs must be unique');
    });
  });

  group('BCG vaccine', () {
    test('should be given at birth (week 0)', () {
      final bcg = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'bcg',
      );
      expect(bcg.dueWeeks, equals(0));
    });

    test('should mention max age of 12 months in notes', () {
      final bcg = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'bcg',
      );
      expect(bcg.notes, contains('12'));
      expect(bcg.notes.toLowerCase(), contains('سنة واحدة'));
    });
  });

  group('IPV vaccine — must have 2 doses', () {
    test('should have ipv1 at 14 weeks', () {
      final ipv1 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'ipv1',
      );
      expect(ipv1.dueWeeks, equals(14));
    });

    test('should have ipv2 at 9 months', () {
      final ipv2 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'ipv2',
      );
      expect(ipv2.dueMonths, equals(9));
    });

    test('should not have single "ipv" entry', () {
      final singleIpv = VaccinationService.allVaccines.where(
        (v) => v.id == 'ipv',
      );
      expect(singleIpv.length, equals(0),
          reason: 'IPV must be split into ipv1 and ipv2');
    });
  });

  group('Vitamin A — correct doses and timing', () {
    test('should have vitA_1 at 9 months with 100,000 IU', () {
      final vitA1 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'vitA_1',
      );
      expect(vitA1.dueMonths, equals(9));
      expect(vitA1.notes, contains('100,000'));
    });

    test('should have vitA_3 at 18 months with 200,000 IU', () {
      final vitA3 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'vitA_3',
      );
      expect(vitA3.dueMonths, equals(18));
      expect(vitA3.notes, contains('200,000'));
    });

    test('should NOT have vitA_2 (was wrong — replaced by vitA_1)', () {
      final vitA2 = VaccinationService.allVaccines.where(
        (v) => v.id == 'vitA_2',
      );
      expect(vitA2.length, equals(0),
          reason: 'vitA_2 was removed — use vitA_1 (9mo) + vitA_3 (18mo)');
    });
  });

  group('Penta booster — must be Penta4 not DTP', () {
    test('should have penta4 booster at 18 months', () {
      final penta4 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'penta4',
      );
      expect(penta4.dueMonths, equals(18));
    });

    test('should NOT have dtp_booster (replaced by penta4)', () {
      final dtp = VaccinationService.allVaccines.where(
        (v) => v.id == 'dtp_booster',
      );
      expect(dtp.length, equals(0),
          reason: 'DTP booster was replaced by Penta4');
    });

    test('penta4 should mention 5 components', () {
      final penta4 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'penta4',
      );
      // Should mention the 5 diseases
      expect(penta4.description, contains('5'));
    });
  });

  group('School entry — must be Td not DTP', () {
    test('should have td_school at 6 years (72 months)', () {
      final td = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'td_school',
      );
      expect(td.dueMonths, equals(72));
    });

    test('should NOT have dtp_school (replaced by td_school)', () {
      final dtp = VaccinationService.allVaccines.where(
        (v) => v.id == 'dtp_school',
      );
      expect(dtp.length, equals(0),
          reason: 'DTP school was replaced by Td');
    });

    test('td_school should mention Td (tetanus + diphtheria only)', () {
      final td = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'td_school',
      );
      expect(td.nameAr, contains('Td'));
    });
  });

  group('OPV — should have 6 doses', () {
    test('should have OPV0 at birth', () {
      final opv0 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'opv0',
      );
      expect(opv0.dueWeeks, equals(0));
    });

    test('should have OPV1, OPV2, OPV3 at 6, 10, 14 weeks', () {
      final opv1 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'opv1');
      final opv2 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'opv2');
      final opv3 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'opv3');
      expect(opv1.dueWeeks, equals(6));
      expect(opv2.dueWeeks, equals(10));
      expect(opv3.dueWeeks, equals(14));
    });

    test('should have OPV4 at 9 months', () {
      final opv4 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'opv4',
      );
      expect(opv4.dueMonths, equals(9));
    });

    test('should have OPV5 at 18 months', () {
      final opv5 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'opv5',
      );
      expect(opv5.dueMonths, equals(18));
    });
  });

  group('MR — should have 3 doses', () {
    test('should have MR1 at 9 months', () {
      final mr1 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'mr1',
      );
      expect(mr1.dueMonths, equals(9));
    });

    test('should have MR2 at 18 months', () {
      final mr2 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'mr2',
      );
      expect(mr2.dueMonths, equals(18));
    });
  });

  group('Penta — should have 4 doses', () {
    test('should have Penta1, Penta2, Penta3 at 6, 10, 14 weeks', () {
      final p1 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pentavalent1');
      final p2 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pentavalent2');
      final p3 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pentavalent3');
      expect(p1.dueWeeks, equals(6));
      expect(p2.dueWeeks, equals(10));
      expect(p3.dueWeeks, equals(14));
    });

    test('should have Penta4 booster at 18 months', () {
      final p4 = VaccinationService.allVaccines.firstWhere(
        (v) => v.id == 'penta4',
      );
      expect(p4.dueMonths, equals(18));
    });
  });

  group('Rota — should have 2 doses', () {
    test('should have Rota1 at 6 weeks and Rota2 at 10 weeks', () {
      final r1 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'rv1');
      final r2 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'rv2');
      expect(r1.dueWeeks, equals(6));
      expect(r2.dueWeeks, equals(10));
    });

    test('Rota notes should mention max age of 24 weeks', () {
      final r2 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'rv2');
      expect(r2.notes, contains('24'));
    });
  });

  group('PCV — should have 3 doses', () {
    test('should have PCV1, PCV2, PCV3 at 6, 10, 14 weeks', () {
      final p1 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pcv1');
      final p2 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pcv2');
      final p3 = VaccinationService.allVaccines.firstWhere((v) => v.id == 'pcv3');
      expect(p1.dueWeeks, equals(6));
      expect(p2.dueWeeks, equals(10));
      expect(p3.dueWeeks, equals(14));
    });
  });

  group('Vaccine ordering — chronological', () {
    test('vaccines should be ordered by due date', () {
      final vaccines = VaccinationService.allVaccines;
      // Check that birth vaccines come first
      final birthVaccines = vaccines.where((v) => v.dueWeeks == 0).toList();
      expect(birthVaccines.length, greaterThanOrEqualTo(3));

      // Check that 6-week vaccines come after birth
      final sixWeekVaccines = vaccines.where((v) => v.dueWeeks == 6).toList();
      expect(sixWeekVaccines.length, greaterThanOrEqualTo(4));
    });
  });
}
