import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log error details
        console.error('🔴 Error Boundary Caught:', {
            error: error,
            errorMessage: error.message,
            errorStack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString()
        });

        // Update state with error details
        this.setState(prevState => ({
            error: error,
            errorInfo: errorInfo,
            errorCount: prevState.errorCount + 1
        }));

        // Send error to monitoring service (optional)
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message,
                fatal: true
            });
        }
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            const isDevelopment = import.meta.env.DEV;

            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <AlertTriangle className="text-white" size={32} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">
                                        Oops! Something went wrong
                                    </h1>
                                    <p className="text-red-100 text-sm mt-1">
                                        Error #{this.state.errorCount}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                                <p className="font-semibold text-red-800 mb-1">Error Message:</p>
                                <p className="text-red-700 text-sm font-mono">
                                    {this.state.error?.message || 'Unknown error occurred'}
                                </p>
                            </div>

                            {isDevelopment && this.state.error?.stack && (
                                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                                        🔍 Stack Trace (Development Only)
                                    </summary>
                                    <pre className="text-xs text-gray-600 overflow-auto max-h-64 mt-2 p-2 bg-gray-100 rounded">
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}

                            {isDevelopment && this.state.errorInfo?.componentStack && (
                                <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                                        🧩 Component Stack (Development Only)
                                    </summary>
                                    <pre className="text-xs text-gray-600 overflow-auto max-h-64 mt-2 p-2 bg-gray-100 rounded">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </details>
                            )}

                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                <p className="font-semibold text-blue-800 mb-2">💡 What you can do:</p>
                                <ul className="text-blue-700 text-sm space-y-1 ml-4 list-disc">
                                    <li>Try refreshing the page</li>
                                    <li>Clear your browser cache</li>
                                    <li>Go back to home page</li>
                                    <li>If problem persists, contact support</li>
                                </ul>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-gray-50 flex flex-wrap gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 min-w-[140px] bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Try Again
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 min-w-[140px] bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex-1 min-w-[140px] bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                <Home size={20} />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
