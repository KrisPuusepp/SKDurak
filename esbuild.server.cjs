const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  target: ['node18'],
  outfile: 'dist/server.cjs',
  sourcemap: false,
  minify: true,
}).catch(() => process.exit(1));
