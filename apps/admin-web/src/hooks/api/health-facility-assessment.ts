import { useQuery } from '@tanstack/react-query'
import { supabase, isConfigured } from '@/lib/supabase'

// Health Facility Assessment Form ID
const HEALTH_FACILITY_ASSESSMENT_FORM_ID = '606b5093-9a8f-47d6-a6c9-b0429ce4a9f6'

export interface HealthFacilityAssessment {
  id: string
  form_id: string
  submitted_by: string
  governorate_id: string | null
  district_id: string | null
  status: string
  data: Record<string, any>
  created_at: string
  profiles?: { full_name: string; email: string }
  governorates?: { name_ar: string }
  districts?: { name_ar: string }
}

export function useHealthFacilityAssessments(filters?: {
  status?: string
  governorateId?: string
  campaignRound?: number
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['health-facility-assessments', filters],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 50

      let query = supabase
        .from('form_submissions')
        .select(`
          id, form_id, submitted_by, governorate_id, district_id,
          status, data, created_at,
          profiles:submitted_by(full_name, email),
          governorates(name_ar),
          districts(name_ar)
        `, { count: 'exact' })
        .eq('form_id', HEALTH_FACILITY_ASSESSMENT_FORM_ID)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.governorateId) query = query.eq('governorate_id', filters.governorateId)
      if (filters?.campaignRound && filters.campaignRound > 0) {
        query = query.eq('campaign_round', filters.campaignRound)
      }

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data as any[]) || [], count: count || 0 }
    },
    enabled: isConfigured,
    staleTime: 60000,
  })
}

export function useHealthFacilityAssessmentStats() {
  return useQuery({
    queryKey: ['health-facility-assessment-stats'],
    queryFn: async () => {
      // Get all submissions for this form
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select('id, governorate_id, district_id, status, data')
        .eq('form_id', HEALTH_FACILITY_ASSESSMENT_FORM_ID)
        .is('deleted_at', null)

      if (error) throw error

      const total = submissions?.length || 0
      const submitted = submissions?.filter(s => s.status === 'submitted').length || 0
      const draft = submissions?.filter(s => s.status === 'draft').length || 0

      // Calculate key metrics from the data
      let defaulterListCount = 0
      let villageListCount = 0
      let updatedPlanCount = 0
      let populationDataCount = 0
      let coveragePlanCount = 0
      let planReviewedCount = 0
      let reverseCoverageCount = 0
      let higherVisitCount = 0
      let routineCoverageAbove85Count = 0

      submissions?.forEach(sub => {
        const d = sub.data || {}
        if (d.has_defaulter_list === true || d.has_defaulter_list === 'yes') defaulterListCount++
        if (d.has_village_list === true || d.has_village_list === 'yes') villageListCount++
        if (d.has_updated_plan === true || d.has_updated_plan === 'yes') updatedPlanCount++
        if (d.has_population_data === true || d.has_population_data === 'yes') populationDataCount++
        if (d.has_coverage_plan === true || d.has_coverage_plan === 'yes') coveragePlanCount++
        if (d.plan_reviewed_by_higher_level === true || d.plan_reviewed_by_higher_level === 'yes') planReviewedCount++
        if (d.has_reverse_coverage === true || d.has_reverse_coverage === 'yes') reverseCoverageCount++
        if (d.has_higher_level_visit === true || d.has_higher_level_visit === 'yes') higherVisitCount++
        if (d.routine_coverage_above_85 === true || d.routine_coverage_above_85 === 'yes') routineCoverageAbove85Count++
      })

      // Governorate distribution
      const govDistribution: Record<string, number> = {}
      submissions?.forEach(sub => {
        const govId = sub.governorate_id
        if (govId) {
          govDistribution[govId] = (govDistribution[govId] || 0) + 1
        }
      })

      return {
        total,
        submitted,
        draft,
        metrics: {
          defaulterList: { count: defaulterListCount, total, percentage: total > 0 ? (defaulterListCount / total) * 100 : 0 },
          villageList: { count: villageListCount, total, percentage: total > 0 ? (villageListCount / total) * 100 : 0 },
          updatedPlan: { count: updatedPlanCount, total, percentage: total > 0 ? (updatedPlanCount / total) * 100 : 0 },
          populationData: { count: populationDataCount, total, percentage: total > 0 ? (populationDataCount / total) * 100 : 0 },
          coveragePlan: { count: coveragePlanCount, total, percentage: total > 0 ? (coveragePlanCount / total) * 100 : 0 },
          planReviewed: { count: planReviewedCount, total, percentage: total > 0 ? (planReviewedCount / total) * 100 : 0 },
          reverseCoverage: { count: reverseCoverageCount, total, percentage: total > 0 ? (reverseCoverageCount / total) * 100 : 0 },
          higherVisit: { count: higherVisitCount, total, percentage: total > 0 ? (higherVisitCount / total) * 100 : 0 },
          routineCoverageAbove85: { count: routineCoverageAbove85Count, total, percentage: total > 0 ? (routineCoverageAbove85Count / total) * 100 : 0 },
        },
        govDistribution,
      }
    },
    enabled: isConfigured,
    staleTime: 60000,
  })
}
