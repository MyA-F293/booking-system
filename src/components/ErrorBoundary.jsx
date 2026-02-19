import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ Error Boundary caught:', error, errorInfo);
    }

    handleReload = () => {
        // Clear all caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }

        // Clear session storage
        window.sessionStorage.clear();

        // Reload page
        window.location.reload(true);
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} className="text-red-500" />
                        </div>

                        <h1 className="text-2xl font-bold text-gray-800 mb-3">
                            Oops! Something went wrong
                        </h1>

                        <p className="text-gray-600 mb-6">
                            The app encountered an error. This usually happens after an update.
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                            <p className="text-sm text-gray-700 font-medium mb-2">What you can do:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Click the button below to reload</li>
                                <li>• Clear your browser cache</li>
                                <li>• Try in private/incognito mode</li>
                            </ul>
                        </div>

                        <button
                            onClick={this.handleReload}
                            className="w-full bg-gradient-to-r from-[#1F4E8C] to-[#2a5fa3] hover:from-[#183d6e] hover:to-[#1F4E8C] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                        >
                            <RefreshCw size={20} />
                            Reload App
                        </button>

                        {this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    Technical Details
                                </summary>
                                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32 text-gray-700">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
