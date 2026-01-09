import AppErrorBoundary from './error-boundary/error-boundary';
import { ThemeProvider } from './components/theme-provider';
import { useTheme } from './components/theme-provider';
import AppRoutes from './routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
// Lazy pages

export default function App() {
  const { theme } = useTheme();
  return (
    <ThemeProvider defaultTheme={theme} storageKey='vite-ui-theme'>
      <AppErrorBoundary>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
          <AppRoutes />
        </GoogleOAuthProvider>
      </AppErrorBoundary>
    </ThemeProvider>
  );
}
