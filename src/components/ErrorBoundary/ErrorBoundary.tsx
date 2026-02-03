import { Component, type ErrorInfo, type ReactNode } from 'react';
import Button from '../Button/Button';
import './ErrorBoundary.css';

/** Types */

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/** Component */
/** Catches JavaScript errors in child components and displays a fallback UI. */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className='error-boundary' role='alert'>
          <h2 className='error-boundary-title'>Something went wrong</h2>
          <p className='error-boundary-message'>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={this.handleReset}>Try again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Exports */

export default ErrorBoundary;
