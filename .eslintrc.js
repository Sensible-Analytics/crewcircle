module.exports = {
  root: true,
  extends: "@react-native",
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ["e2e/**/*.e2e.js"],
      globals: {
        device: "readonly",
        element: "readonly",
        expect: "readonly",
        by: "readonly",
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        jest: "readonly",
      },
    },
  ],
  rules: {
    quotes: "off",
    curly: "off",
    "react-native/no-inline-styles": "off",
    "no-useless-escape": "off",
  },
};
