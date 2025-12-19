const esbuild = require('esbuild');
const stylePlugin = require('esbuild-style-plugin');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const isMinify = process.argv.includes('--minify');

const buildOptions = {
  entryPoints: ['src/webview/index.tsx'],
  bundle: true,
  outfile: 'out/webview/index.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  sourcemap: !isMinify,
  minify: isMinify,
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  define: { 'process.env.NODE_ENV': isMinify ? '"production"' : '"development"' },
  logLevel: 'info',
  plugins: [
    stylePlugin({
      postcss: {
        plugins: [
          require('tailwindcss')(path.resolve(__dirname, '../tailwind.config.js')),
          require('autoprefixer'),
        ],
      },
    }),
  ],
};

async function build() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('Watching webview...');
  } else {
    await esbuild.build(buildOptions);
    console.log('Webview built');
  }
}

build().catch(() => process.exit(1));
