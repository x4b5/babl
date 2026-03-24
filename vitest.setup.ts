/**
 * Vitest setup file - runs before all tests.
 * Provides browser API mocks for cleanup utilities.
 */

// Mock cancelAnimationFrame (not available in jsdom by default)
if (typeof global.cancelAnimationFrame === 'undefined') {
	global.cancelAnimationFrame = (id: number) => {
		// No-op in test environment
	};
}
