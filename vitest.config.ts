import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Default to node for fast, DOM-free unit tests. Component tests opt
    // into jsdom per-file with a `// @vitest-environment jsdom` comment.
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["**/*.e2e.test.ts", "e2e/**"],
  },
});
