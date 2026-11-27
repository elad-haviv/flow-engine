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
      include: [
        "packages/model/src/**",
        "packages/catalog/src/**",
        "packages/engine/src/**",
        "packages/scene/src/**",
        "packages/symbols/src/**",
        "packages/editor/src/**",
        "packages/views/src/**",
        "packages/io/src/**",
      ],
      thresholds: {
        "packages/model/src/**": { branches: 85 },
        "packages/catalog/src/**": { branches: 85 },
        "packages/engine/src/**": { branches: 85 },
        "packages/scene/src/**": { branches: 85 },
        "packages/editor/src/**": { branches: 85 },
        "packages/views/src/**": { branches: 85 },
        "packages/io/src/**": { branches: 85 },
      },
    },
  },
});
