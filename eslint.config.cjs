module.exports = [
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**", "public/**"]
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: {
      react: require("eslint-plugin-react"),
      "jsx-a11y": require("eslint-plugin-jsx-a11y"),
      "react-hooks": require("eslint-plugin-react-hooks")
    },
    settings: { react: { version: "detect" } },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react/prop-types": "off",
      "jsx-a11y/anchor-is-valid": "off"
    }
  }
];
