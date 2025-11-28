import AppErrorBoundary from "./error-boundary/error-boundary";
import { ThemeProvider } from "./components/theme-provider";
import { useTheme } from "./components/theme-provider";
import AppRoutes from "./routes";

// Lazy pages

export default function App() {
  const { theme } = useTheme();
  return (
    <ThemeProvider defaultTheme={theme} storageKey="vite-ui-theme">
      <AppErrorBoundary>
        <AppRoutes />
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
