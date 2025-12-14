// Use Next.js recommended ESLint config to avoid serialization issues
// This ensures parser is handled correctly by Next.js
import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/out/**"],
  },
  ...compat.extends("next/core-web-vitals"),
];
