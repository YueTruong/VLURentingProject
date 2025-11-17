import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Bỏ qua chính file config này và thư mục build
    ignores: ['eslint.config.mjs', 'dist/'],
  },

  // 1. Các quy tắc JavaScript cơ bản
  eslint.configs.recommended,

  // 2. Quy tắc TypeScript (bản tiêu chuẩn, không cần type-check)
  ...tseslint.configs.recommended,

  // 3. Cấu hình Prettier (nên ở cuối để ghi đè style)
  eslintPluginPrettierRecommended,

  // 4. Các cấu hình chung khác
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      // Tắt các quy tắc bạn không muốn
      '@typescript-eslint/no-explicit-any': 'off',
      // Quy tắc này để sửa lỗi xuống dòng của Prettier trên Windows
      'prettier/prettier': ['error', { endOfLine: 'auto' }], 
    },
  },
);