import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // TODO: Send to Sentry here
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <div className="rounded-lg border border-alert/30 bg-alert/5 p-8">
            <p className="font-display text-2xl font-bold text-alert mb-2">Something went wrong</p>
            <p className="text-smoke mb-4">We encountered an unexpected error. Please try refreshing.</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-amber px-6 py-2 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}