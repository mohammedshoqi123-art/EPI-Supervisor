import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  title?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Lightweight error boundary for dashboard sections.
 * Wraps each section so one failure doesn't crash the whole page.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[SectionErrorBoundary] ${this.props.title || 'Section'} error:`, error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm font-medium">
              خطأ في تحميل {this.props.title || 'هذا القسم'}
            </span>
          </div>
          <p className="text-xs text-red-500">{this.state.error?.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-1.5 text-xs h-7"
          >
            <RefreshCw className="w-3 h-3" /> إعادة المحاولة
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
