/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild');
const path = require('path');

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const base = {
  entryPoints: [path.join(__dirname, 'src', 'extension.ts')],
  bundle: true,
  platform: 'node',
  target: 'node16',
  outfile: path.join(__dirname, 'dist', 'extension.js'),
  sourcemap: true,
  external: ['vscode'],
  format: 'cjs',
  logLevel: 'info',
};

if (watch) {
  esbuild.context(base).then(ctx => ctx.watch());
} else {
  esbuild.build(base).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
