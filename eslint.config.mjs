import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/client/**/*.{ts,tsx}"],
    ignores: ["src/client/utils/http.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "axios", importNames: ["default"], message: "Use @/client/utils/http for application requests so writes include CSRF tokens. Named Axios helpers and types are allowed." }],
      }],
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.name='fetch'] > ObjectExpression > Property[key.name='method'][value.value=/^(POST|PUT|PATCH|DELETE)$/i]",
        message: "Use csrfFetch from @/client/utils/http for application writes so the request includes its CSRF token.",
      }],
    },
  },
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
