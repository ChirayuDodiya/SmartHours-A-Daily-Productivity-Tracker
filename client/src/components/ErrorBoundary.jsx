import React from 'react'

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
        <main className="loading-shell" style={{ flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '24px' }}>
          <div>
            <div className="loading-mark" style={{ marginBottom: '24px', fontSize: '24px' }}>SmartHours</div>
            <h1 style={{ color: 'var(--text-h)', margin: '0 0 12px', fontSize: '32px' }}>Oops! Something went wrong.</h1>
            <p style={{ color: 'var(--text)', margin: '0 0 32px', maxWidth: '400px', lineHeight: '1.5' }}>
              We've encountered an unexpected error. Don't worry, your data is safe. Please refresh the page or return to the dashboard.
            </p>
            <button 
              type="button" 
              className="primary-action" 
              style={{ width: 'auto', padding: '0 32px' }} 
              onClick={this.handleReload}
            >
              Reload Dashboard
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
