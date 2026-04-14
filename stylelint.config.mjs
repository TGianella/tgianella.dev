/** @type {import("stylelint").Config} */
export default {
  plugins: ["stylelint-plugin-defensive-css"],
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html",
    "stylelint-plugin-defensive-css/configs/recommended",
    "stylelint-config-idiomatic-order",
  ],
  rules: {
    "defensive-css/require-pure-selectors": null,
    "defensive-css/require-system-font-fallback": null,
    "custom-property-pattern": null,
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: ["global"] },
    ],
    "selector-class-pattern": [
      "^[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)?$",
      { message: "Expected BEM class name (e.g. block__element--modifier)" },
    ],
  },
};
