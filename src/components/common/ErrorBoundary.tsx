import { Component, type ErrorInfo, type ReactNode } from 'react';
import GlassCard from './GlassCard';
import Button from './Button';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Chromatica v2:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('chromatica_v2_achievements_state');
    localStorage.removeItem('chromatica-settings');
    window.location.href = '/';
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-screen__orb error-boundary-screen__orb--1" />
          <div className="error-boundary-screen__orb error-boundary-screen__orb--2" />
          
          <GlassCard className="error-boundary-card" glowColor="failure" padding="xl">
            <h1 className="error-boundary-title">Alchemy Experiment Failed</h1>
            <p className="error-boundary-desc">
              An unexpected reaction occurred in the potion vials, causing a system instability.
            </p>
            {this.state.error && (
              <pre className="error-boundary-stack">
                {this.state.error.name}: {this.state.error.message}
              </pre>
            )}
            <div className="error-boundary-actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => window.location.reload()}
              >
                Re-distill (Reload)
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={this.handleReset}
              >
                Reset Lab (Clear Cache)
              </Button>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
