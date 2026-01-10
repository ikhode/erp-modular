import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  // Configuración específica para archivos de Supabase Edge Functions (Deno)
  {
    files: ['supabase/functions/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        Deno: 'readonly', // Agregar objeto global Deno
        console: 'readonly', // Console está disponible en Deno
      },
    },
    rules: {
      // Deshabilitar reglas que no aplican en Deno
      '@typescript-eslint/no-unused-vars': 'off', // Deno maneja imports de forma diferente
      '@typescript-eslint/no-explicit-any': 'off', // Permitir any en funciones de Deno por flexibilidad
      'no-undef': 'off', // Deno tiene APIs globales no definidas en ESLint
    },
  }
);
