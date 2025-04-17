// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { babel } from '@rollup/plugin-babel';
// import { terser } from 'rollup-plugin-terser'; // For minification
// import esbuild from 'rollup-plugin-esbuild'; // Alternative minifier

export default {
  input: 'src/index.js', // Entry point of your library
  output: [
    {
      file: 'dist/index.cjs.js', // CommonJS format (for Node.js)
      format: 'cjs',
    },
    {
      file: 'dist/index.esm.js', // ES Modules format (for modern browsers and bundlers)
      format: 'es',
    },
    {
      name: 'MyPackage', // Global variable name (for browser UMD build)
      file: 'dist/index.umd.js', // Universal Module Definition (for browsers)
      format: 'umd',
    },
  ],
  plugins: [
    resolve(), // Locate and bundle dependencies in node_modules
    commonjs(), // Convert CommonJS modules to ES modules
    babel({ babelHelpers: 'bundled' }), // Transpile with Babel
    // terser(), // Minify the output
    // esbuild(), // Alternative minifier
  ],
};
