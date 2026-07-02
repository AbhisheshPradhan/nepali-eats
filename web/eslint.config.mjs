import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Deliberate downgrade (2026-07-03): this strict React Compiler-era rule
      // flags legitimate patterns we use on purpose (mount-time clock tick in
      // OpenStatusBadge, fetch-in-effect in SearchBox/MapView, localStorage
      // read in useUserLocation). Keep it visible as a warning; don't let it
      // fail lint. Genuine render-phase ref/state bugs still error via
      // react-hooks/rules-of-hooks and "Cannot access refs during render".
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
