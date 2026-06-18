// Barrel file — re-exports everything from domain modules
// This ensures backward compatibility: import { useAuth } from '@/hooks/useApi' still works

export { getCampaignFormIds, applyCampaignFilter, applyShortageCampaignFilter } from './campaign'
export { useAuth, useSignIn, useSignOut } from './auth'
export { useDashboardStats, useDashboardRealtime, useSubmissionsChart, useGovernorateStats, useRoleDistribution } from './dashboard'
export { useUsers, useCreateUser, useUpdateUserRole, useToggleUserActive, useDeleteUser, useUpdateUserProfile, useResetUserPassword } from './users'
export { useForms, useFormSubmissionCounts, useCreateForm, useUpdateForm, useDeleteForm } from './forms'
export { useSubmissions, useUpdateSubmissionStatus, useBulkUpdateSubmissionStatus } from './submissions'
export { useGovernorates, useDistricts } from './governorates'
export { useAuditLogs } from './audit'
export { useShortages, useResolveShortage } from './shortages'
export { useChatMessages, useSendChatMessage } from './chat'
export {
  useNotifications,
  useNotificationRealtime,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
  useToggleNotificationRead,
  useSendNotification,
  useNotificationStats,
  useNotificationTemplates,
} from './notifications'
