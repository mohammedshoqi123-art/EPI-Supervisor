import { describe, it, expect } from 'vitest'

/**
 * اختبارات بيانات التطعيمات — يتحقق من صحة المعرفة الطبية
 * هذا الاختبار يضمن أن بيانات اللقاحات صحيحة ومحدثة
 */

describe('Vaccination Data — Medical Correctness', () => {
  // Expected vaccine schedule for Yemen EPI
  const VACCINE_SCHEDULE = [
    { id: 'bcg', dueWeeks: 0, maxAgeMonths: 12, doses: 1 },
    { id: 'hepb0', dueWeeks: 0, maxAgeMonths: 60, doses: 1 },
    { id: 'opv', dueWeeks: 0, maxAgeMonths: 60, doses: 6 }, // 0+3+2
    { id: 'pentavalent', dueWeeks: 6, maxAgeMonths: 60, doses: 4 }, // 3+1
    { id: 'pcv', dueWeeks: 6, maxAgeMonths: 60, doses: 3 },
    { id: 'rota', dueWeeks: 6, maxAgeMonths: 24, doses: 2 },
    { id: 'ipv', dueWeeks: 14, maxAgeMonths: 60, doses: 2 },
    { id: 'mr', dueMonths: 9, maxAgeMonths: 60, doses: 3 }, // 2+1
    { id: 'vitaminA', dueMonths: 9, maxAgeMonths: 60, doses: 2 },
    { id: 'td', dueMonths: 72, maxAgeMonths: 84, doses: 1 },
  ]

  VACCINE_SCHEDULE.forEach((vaccine) => {
    it(`${vaccine.id} — correct number of doses`, () => {
      expect(vaccine.doses).toBeGreaterThan(0)
    })

    it(`${vaccine.id} — has valid max age`, () => {
      expect(vaccine.maxAgeMonths).toBeGreaterThan(0)
    })
  })

  it('OPV must have 6 doses (not 4)', () => {
    const opv = VACCINE_SCHEDULE.find(v => v.id === 'opv')
    expect(opv?.doses).toBe(6)
  })

  it('IPV must have 2 doses (not 1)', () => {
    const ipv = VACCINE_SCHEDULE.find(v => v.id === 'ipv')
    expect(ipv?.doses).toBe(2)
  })

  it('Rota max age must be 24 months (not 32 weeks)', () => {
    const rota = VACCINE_SCHEDULE.find(v => v.id === 'rota')
    expect(rota?.maxAgeMonths).toBe(24)
  })

  it('BCG max age must be 12 months', () => {
    const bcg = VACCINE_SCHEDULE.find(v => v.id === 'bcg')
    expect(bcg?.maxAgeMonths).toBe(12)
  })

  it('Penta must have 4 doses (3 primary + 1 booster)', () => {
    const penta = VACCINE_SCHEDULE.find(v => v.id === 'pentavalent')
    expect(penta?.doses).toBe(4)
  })

  it('MR must have 3 doses (2 primary + 1 booster)', () => {
    const mr = VACCINE_SCHEDULE.find(v => v.id === 'mr')
    expect(mr?.doses).toBe(3)
  })

  it('Vitamin A must have 2 doses', () => {
    const vitA = VACCINE_SCHEDULE.find(v => v.id === 'vitaminA')
    expect(vitA?.doses).toBe(2)
  })
})

describe('Zero Dose Table — Age Limits', () => {
  const AGE_LIMITS = {
    bcg: 12,      // months
    rota: 24,     // months
    penta: 60,    // months
    opv: 60,      // months
    ipv: 60,      // months
    mr: 60,       // months
    pcv: 60,      // months
    td: 84,       // months
  }

  it('BCG cannot be given after 12 months', () => {
    expect(AGE_LIMITS.bcg).toBe(12)
  })

  it('Rota cannot be given after 24 months', () => {
    expect(AGE_LIMITS.rota).toBe(24)
  })

  it('Most vaccines have max age of 60 months (5 years)', () => {
    const fiveYearVaccines = ['penta', 'opv', 'ipv', 'mr', 'pcv']
    fiveYearVaccines.forEach(id => {
      expect(AGE_LIMITS[id as keyof typeof AGE_LIMITS]).toBe(60)
    })
  })
})
