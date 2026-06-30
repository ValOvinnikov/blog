import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Shared Vitest preset.
 *
 * Component packages (ui, web) merge this with a jsdom environment and a
 * setup file that loads `@testing-library/jest-dom`. Pure logic packages
 * (service) can use it as-is with the default `node` environment by passing
 * `environment: "node"`.
 *
 *   // packages/ui/vitest.config.ts
 *   import preset from "@blog/config/vitest/preset";
 *   import { mergeConfig, defineConfig } from "vitest/config";
 *   export default mergeConfig(preset, defineConfig({
 *     test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
 *   }));
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
  },
});
