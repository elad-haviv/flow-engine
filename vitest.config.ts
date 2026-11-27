import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "packages/*/tests/**/*.test.ts",
      "apps/*/tests/**/*.test.ts",
      "tests/**/*.test.ts",
      "tools/*/tests/**/*.test.ts",
    ],
    testTimeout: 60000,
    coverage: {
      provider: "v8",
      include: ["packages/model/src/**", "packages/catalog/src/**", "packages/engine/src/**"],
      thresholds: { branches: 85 },
    },
  },
});
