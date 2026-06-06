import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { execSync } from 'child_process';

let commitHash: string;
if (process.env.VERCEL_GIT_COMMIT_SHA) {
	commitHash = process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
} else {
	try {
		commitHash = execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		commitHash = 'dev';
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	define: {
		__APP_VERSION__: JSON.stringify(commitHash)
	},
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts']
	}
});
