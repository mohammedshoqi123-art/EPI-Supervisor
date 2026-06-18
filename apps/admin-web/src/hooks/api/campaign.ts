import { supabase } from '@/lib/supabase'

// ═══ CAMPAIGN HELPER ═══
// form_submissions doesn't have campaign_type — it's on the forms table.
// To filter submissions by campaign, we first resolve form IDs.

/**
 * Get form IDs that belong to a specific campaign type.
 * Returns null if no campaign filter (meaning "all").
 */
export async function getCampaignFormIds(campaignType?: string): Promise<string[] | null> {
  if (!campaignType || campaignType === 'all') return null

  const { data, error } = await supabase
    .from('forms')
    .select('id')
    .eq('campaign_type', campaignType)
    .is('deleted_at', null)

  if (error || !data) return null
  return data.map(f => f.id)
}

/**
 * Apply campaign filter to a Supabase query on form_submissions.
 * Uses the form_id foreign key to filter by campaign.
 */
// Supabase query builder type — too complex to inline, using generic any is pragmatic here
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function applyCampaignFilter(
  query: any,
  campaignType?: string
): Promise<{ query: any; formIds: string[] | null }> {
  const formIds = await getCampaignFormIds(campaignType)
  if (formIds && formIds.length > 0) {
    return { query: query.in('form_id', formIds), formIds }
  }
  return { query, formIds: null }
}

/**
 * Apply campaign filter to supply_shortages via form_submissions → forms.
 * shortages link to submissions, which link to forms with campaign_type.
 */
export async function applyShortageCampaignFilter(
  query: any,
  campaignType?: string
): Promise<any> {
  if (!campaignType || campaignType === 'all') return query

  // Get submission IDs that belong to the campaign
  const formIds = await getCampaignFormIds(campaignType)
  if (!formIds || formIds.length === 0) return query

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('id')
    .in('form_id', formIds)
    .is('deleted_at', null)
    .limit(10000)

  if (!submissions || submissions.length === 0) {
    // No submissions for this campaign → return empty result
    return query.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const submissionIds = submissions.map(s => s.id)
  return query.in('submission_id', submissionIds)
}
