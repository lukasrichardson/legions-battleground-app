import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // Preserve existing lint coverage during the security upgrade. Adopting these
    // new React Compiler checks requires separate effect/ref cleanup; Rules of Hooks
    // and exhaustive-deps remain enabled.
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", ".next-e2e/**", "dist/**", "coverage/**", "playwright-report/**", "test-results/**", "output/**", ".scratch/**", "next-env.d.ts"]),
]);
