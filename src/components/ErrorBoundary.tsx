import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Catches any rendering error anywhere in the app and shows a recovery screen
 * instead of a blank white page. This is a last-resort safety net — the goal
 * is still to fix the root cause of any error, but a single bad recipe/event/
 * chore should never be able to take down the entire app for everyone.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Something went wrong' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
          background: '#0f172a',
          color: 'white',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏠</div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '8px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '20px', maxWidth: '400px' }}>
            The app hit an unexpected error and couldn't continue. Your data is safe — it's saved on this
            device and in the cloud. Reloading usually fixes this.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '10px 24px',
              background: '#f59e0b',
              color: '#0f172a',
              fontWeight: 800,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Reload App
          </button>
          <p style={{ fontSize: '11px', color: '#475569', marginTop: '24px' }}>
            {this.state.errorMessage}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

