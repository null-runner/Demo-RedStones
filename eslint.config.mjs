import { dirname } from "path";
import { fileURLToPath } from "url";
import tseslint from "typescript-eslint";
import nextVitals from "eslint-config-next/core-web-vitals";
import importPlugin from "eslint-plugin-import-x";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default tseslint.config(
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  {
    plugins: { "import-x": importPlugin },
    rules: {
      "import-x/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"]],
          "newlines-between": "always",
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  eslintConfigPrettier,
  {
    ignores: [".next/**", "out/**", "build/**", "drizzle/**", "node_modules/**"],
  },
);
