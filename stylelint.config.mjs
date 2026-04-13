/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-html"],
  rules: {
    "custom-property-pattern": null,
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    "selector-class-pattern": [
      "^[a-z][a-z0-9-]*(__[a-z][a-z0-9-]*)?(--[a-z][a-z0-9-]*)?$",
      { message: "Expected BEM class name (e.g. block__element--modifier)" },
    ],
  },
};
