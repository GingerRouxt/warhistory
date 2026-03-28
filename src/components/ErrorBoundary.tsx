import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[WarHistory] Render error:', error)
    console.error('[WarHistory] Component stack:', info.componentStack)
  }

  private handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children
    }

    if (this.props.fallback) {
      return this.props.fallback
    }

    return (
      <div
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
        style={{
          background: 'var(--color-war-dark, #0a0a0f)',
          fontFamily: 'var(--font-family-body, Inter, sans-serif)',
        }}
      >
        <h1
          className="mb-4 text-3xl tracking-widest"
          style={{
            fontFamily: 'var(--font-family-display, Cinzel, serif)',
            color: 'var(--color-war-gold, #d4a017)',
          }}
        >
          Something went wrong
        </h1>

        <p className="mb-8 max-w-md text-center text-sm text-gray-500">
          {this.state.error?.message || 'An unexpected error occurred while rendering.'}
        </p>

        <button
          onClick={this.handleReload}
          className="cursor-pointer rounded-lg px-8 py-3 text-sm tracking-wider uppercase transition-all duration-300 hover:scale-105"
          style={{
            fontFamily: 'var(--font-family-display, Cinzel, serif)',
            color: 'var(--color-war-gold, #d4a017)',
            border: '1px solid var(--color-war-gold, #d4a017)',
            background: 'rgba(212, 160, 23, 0.08)',
          }}
        >
          Reload
        </button>
      </div>
    )
  }
}
