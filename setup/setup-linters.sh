#!/bin/bash

# Script to set up ESLint, Stylelint, and HTMLHint with configs for HTML5, ES6+, and CSS3 standards

echo "Installing necessary linter packages..."

# Install linters and plugins
npm install eslint eslint-plugin-import stylelint stylelint-config-standard stylelint-order stylelint-config-recommended-scss htmlhint --save-dev

# Create ESLint configuration file for JavaScript (ES6+)
cat <<EOL > .eslintrc.json
{
  "env": {
    "browser": true,
    "es2024": true,
    "node": true
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "extends": [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:prettier/recommended"
  ],
  "rules": {
    "no-var": "error",
    "prefer-const": "warn",
    "no-unused-vars": ["warn", { "args": "after-used", "ignoreRestSiblings": true }],
    "eqeqeq": ["error", "always"],
    "curly": "error",
    "quotes": ["error", "single", { "avoidEscape": true }],
    "semi": ["error", "always"],
    "arrow-body-style": ["warn", "as-needed"],
    "no-console": "warn",
    "no-debugger": "error",
    "comma-dangle": ["error", "only-multiline"]
  },
  "plugins": ["import"]
}
EOL

echo ".eslintrc.json created."

# Create Stylelint configuration file for CSS (CSS3 and latest)
cat <<EOL > .stylelintrc.json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-recommended-scss"
  ],
  "plugins": [
    "stylelint-order"
  ],
  "rules": {
    "color-hex-length": "short",
    "declaration-no-important": true,
    "block-no-empty": true,
    "color-named": "never",
    "selector-max-id": 0,
    "declaration-block-no-duplicate-properties": true,
    "declaration-colon-space-after": "always",
    "declaration-colon-space-before": "never",
    "length-zero-no-unit": true,
    "order/properties-alphabetical-order": true,
    "selector-class-pattern": "^[a-z0-9\\-]+$",
    "selector-no-qualifying-type": [true, { "ignore": ["attribute"] }],
    "selector-max-universal": 1,
    "value-list-comma-space-after": "always-single-line",
    "max-nesting-depth": 3,
    "string-quotes": "double"
  }
}
EOL

echo ".stylelintrc.json created."

# Create HTMLHint configuration file for HTML5
cat <<EOL > .htmlhintrc
{
  "tagname-lowercase": true,
  "attr-lowercase": true,
  "attr-value-double-quotes": true,
  "doctype-first": true,
  "tag-pair": true,
  "spec-char-escape": true,
  "id-unique": true,
  "src-not-empty": true,
  "alt-require": true,
  "attr-no-duplication": true,
  "title-require": true,
  "space-tab-mixed-disabled": "space",
  "tag-self-close": "never",
  "doctype-html5": true
}
EOL

echo ".htmlhintrc created."

# Add linting scripts to package.json
if [ -f "package.json" ]; then
  echo "Adding linting scripts to package.json..."
  npx json -I -f package.json -e '
    this.scripts = this.scripts || {};
    this.scripts["lint:js"] = "eslint . --ext .js";
    this.scripts["lint:css"] = "stylelint '\''**/*.css'\''";
    this.scripts["lint:html"] = "htmlhint '\''**/*.html'\''";
    this.scripts["lint"] = "npm run lint:js && npm run lint:css && npm run lint:html";
  '
else
  echo "package.json not found. Please run 'npm init' first to create it."
fi

echo "Linter setup complete. Run 'npm run lint' to lint all files, or 'npm run lint:js', 'npm run lint:css', 'npm run lint:html' for specific file types."