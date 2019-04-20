// adopted from:
// - https://github.com/rollup/rollup-starter-lib/blob/typescript/rollup.config.js
// - https://hackernoon.com/building-and-publishing-a-module-with-typescript-and-rollup-js-faa778c85396
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

const typescriptPluginOptions = {
	tsconfigDefaults: { compilerOptions: { declaration: true } },
	verbosity: 3,
};

export default [
	// no browser-friendly UMD build for now?
	{
		input: 'src/query-state-core.ts',
		output: {
			name: 'QueryStateCore',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(),   // so Rollup can find `ms`
			commonjs(),  // so Rollup can convert `ms` to an ES module
			typescript(typescriptPluginOptions) // so Rollup can convert TypeScript to JavaScript
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	{
		input: 'src/query-state-core.ts',
		external: Object.keys(pkg.dependencies),
		plugins: [
			typescript(typescriptPluginOptions) // so Rollup can convert TypeScript to JavaScript
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
