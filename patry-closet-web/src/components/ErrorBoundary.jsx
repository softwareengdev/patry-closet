import { Component } from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                        >
                            Try again
                        </button>
                        <Link
                            to="/"
                            className="px-5 py-2.5 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Go home
                        </Link>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
