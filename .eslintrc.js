module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:eslint-plugin-prettier/recommended',
        'eslint-config-prettier'
    ],
    rules: {
        '@typescript-eslint/ban-ts-ignore':1,
        "@typescript-eslint/member-delimiter-style": 0,
        // 禁止使用 var
        'no-var': "error",
    }
}