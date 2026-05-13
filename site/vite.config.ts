import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
// https://vite.dev/config/
export default defineConfig({
	base: process.env.VITE_BASE_PATH || "/",
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
});
