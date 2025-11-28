import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="p-6 text-center">
      <h2 className="text-xl font-semibold text-red-600">
        Something went wrong.
      </h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>

      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Try again
      </button>
    </div>
  );
}

export default function AppErrorBoundary({ children }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, info) => {
        console.error("App Error Boundary caught:", error, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
