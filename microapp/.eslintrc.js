module.exports = {
    'env': {
      'browser': true,
      'es2021': true,
    },
    'extends': [
      'plugin:react/recommended',
      'google',
    ],
    'overrides': [
    ],
    'parserOptions': {
      'ecmaVersion': 2020,
      'sourceType': 'module',
    },
    'plugins': [
      'react',
    ],
    'rules': {
      'max-len': {
        'code': 120,
      },
  
      "react/jsx-filename-extension": 0,
          "no-param-reassign": 0,
          "react/prop-types": 1,
          "react/require-default-props": 0,
          "react/no-array-index-key": 0,
          "react/jsx-props-no-spreading": 0,
          "react/forbid-prop-types": 0,
          "import/order": 0,
          "no-console": 0,
          "jsx-a11y/anchor-is-valid": 0,
          "prefer-destructuring": 0,
          "no-shadow": 0,
          "no-unused-vars": [
              1,
              {
                  "ignoreRestSiblings": false
              }
          ],
    },
  };
