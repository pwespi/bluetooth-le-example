module.exports = {
  parserOptions: {
    project: "./tsconfig.json",
  },
  extends: ["plugin:@stencil/recommended", "@ionic/eslint-config/recommended"],
  rules: {
    "react/jsx-no-bind": [
      "warn",
      {
        allowArrowFunctions: true,
      },
    ],
  },
};
