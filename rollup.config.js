import replace from 'rollup-plugin-replace'
import typescript from 'rollup-plugin-typescript2'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/browser/index.js',
    format: 'cjs'
  },
  plugins: [
    replace({'process.browser': Boolean(process.env.BROWSER)}),
    typescript({
      typescript: require('typescript'),
      tsconfig: './tsconfig.browser.json',
    }),
  ],
}
