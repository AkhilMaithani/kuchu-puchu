import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this app from https://<username>.github.io/<repo-name>/
// — a subpath, not the domain root. Vite's default base ("/") would make
// every built asset URL wrong once deployed (e.g. requesting
// https://<username>.github.io/main.js instead of
// https://<username>.github.io/<repo-name>/main.js), causing a blank page
// with 404s in the console.
//
// Replace REPO_NAME below with your actual GitHub repository name.
export default defineConfig({
	base: "/REPO_NAME/",
	plugins: [react()],
});
