import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/**
 * EmptyState — displays a friendly message when there's no data.
 * Uses consistent styling across all pages.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-base font-heading font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
