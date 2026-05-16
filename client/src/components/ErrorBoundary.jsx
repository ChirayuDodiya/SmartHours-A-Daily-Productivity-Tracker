import React from 'react'
import { Button } from '@/components/ui/button'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('SmartHours caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-6 text-center">
          <div>
            <p className="text-lg font-bold text-primary">SmartHours</p>
            <h1 className="mt-4 text-2xl font-semibold text-foreground">
              Something went wrong
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              We hit an unexpected error. Your data is safe — try reloading or return to the
              dashboard.
            </p>
          </div>
          <Button type="button" onClick={this.handleReload}>
            Reload dashboard
          </Button>
        </main>
      )
    }

    return this.props.children
  }
}
