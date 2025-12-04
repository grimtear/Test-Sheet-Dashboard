import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface RouteErrorBoundaryProps {
    children: ReactNode;
}

/**
 * Specialized Error Boundary for route-level errors.
 * Provides a simpler fallback UI suitable for page-level errors.
 */
export function RouteErrorBoundary({ children }: RouteErrorBoundaryProps) {
    return (
        <ErrorBoundary
            fallback={
                <div className="container mx-auto p-8">
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Page Error</AlertTitle>
                        <AlertDescription>
                            This page encountered an error and cannot be displayed.
                        </AlertDescription>
                    </Alert>
                    <div className="flex gap-2">
                        <Button onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reload Page
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/'}>
                            Go to Home
                        </Button>
                    </div>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

interface FormErrorBoundaryProps {
    children: ReactNode;
    onReset?: () => void;
}

/**
 * Specialized Error Boundary for form-level errors.
 * Provides a minimal fallback UI that allows users to retry form submission.
 */
export function FormErrorBoundary({ children, onReset }: FormErrorBoundaryProps) {
    const handleReset = () => {
        if (onReset) {
            onReset();
        }
        window.location.reload();
    };

    return (
        <ErrorBoundary
            fallback={
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Form Error</AlertTitle>
                    <AlertDescription>
                        An error occurred while processing the form.
                    </AlertDescription>
                    <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                    >
                        Reset Form
                    </Button>
                </Alert>
            }
        >
            {children}
        </ErrorBoundary>
    );
}
