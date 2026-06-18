import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 p-4">
          <div className="max-w-md text-center space-y-6 p-8">
            <div className="w-20 h-20 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-gray-900 mb-2">خطأ غير متوقع</h1>
              <p className="text-gray-600 text-sm">
                حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.
              </p>
            </div>
            {this.state.error && (
              <div className="text-xs font-mono text-left bg-red-50 border border-red-200 p-3 rounded-lg text-red-700 overflow-auto max-h-32" dir="ltr">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="w-4 h-4" /> إعادة المحاولة
              </Button>
              <Button variant="outline" onClick={() => window.location.href = import.meta.env.BASE_URL}>
                العودة للرئيسية
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
