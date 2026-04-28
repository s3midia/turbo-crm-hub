import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-50 text-red-900 h-screen w-full overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado (App Crachou)</h1>
          <p className="mb-4 font-mono">{this.state.error?.toString()}</p>
          <pre className="bg-white p-4 rounded text-xs overflow-auto border border-red-200">
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
