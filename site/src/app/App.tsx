import { ThemeProvider, useTheme } from "@/components/theme-provider";
import AppErrorBoundary from "./error-boundary/error-boundary";
import AppRoutes from "./routes-config";

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
