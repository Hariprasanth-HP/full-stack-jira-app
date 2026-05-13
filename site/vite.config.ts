import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		base: env.VITE_BASE_PATH || "/",
		plugins: [react(), tailwindcss()],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		server: {
			proxy: {
				"/api": {
					target: "http://localhost:4000", // Your backend URL
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api/, ""), // Remove /api prefix
				},
			},
		},
	};
});