import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { readdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

const externalImportsPlugin = (format, relative = './') => ({
	name: 'external-glyphs',
	setup(build) {
		build.onResolve({ filter: /.*/ }, (args) => {
			if (args.importer && args.path.includes('/glyphs')) {
				return {
					path: format === 'esm' ? relative + 'glyphs/index.mjs' : relative + 'glyphs/index.cjs',
					external: true,
				};
			}
			if (args.importer && args.path.includes('/helpers')) {
				return {
					path: format === 'esm' ? relative + 'helpers/index.mjs' : relative + 'helpers/index.cjs',
					external: true,
				};
			}
			if (args.importer && args.path.includes('/functions')) {
				return {
					path:
						format === 'esm' ? relative + 'functions/index.mjs' : relative + 'functions/index.cjs',
					external: true,
				};
			}
		});
	},
});

const common = {
	bundle: true,
	treeShaking: true,
	sourcemap: true,
	metafile: true,
	platform: 'neutral',
	target: 'es2022',
	tsconfig: 'tsconfig.build.json',
};

await build({
	...common,
	entryPoints: ['src/style/main.css'],
	outfile: 'dist/style/main.css',
	loader: { '.css': 'css' },
	bundle: true,
});

const glyphsMJS = await build({
	...common,
	entryPoints: ['src/glyphs/index.ts'],
	format: 'esm',
	outfile: 'dist/glyphs/index.mjs',
	plugins: [externalImportsPlugin('esm', '../')],
});
const glyphsCJS = await build({
	...common,
	entryPoints: ['src/glyphs/index.ts'],
	format: 'cjs',
	outfile: 'dist/glyphs/index.cjs',
	plugins: [externalImportsPlugin('cjs', '../')],
});

await writeFile('dist/glyphs/meta-esm.json', JSON.stringify(glyphsMJS.metafile));
await writeFile('dist/glyphs/meta-cjs.json', JSON.stringify(glyphsCJS.metafile));

const helpersMJS = await build({
	...common,
	entryPoints: ['src/helpers/index.ts'],
	format: 'esm',
	outfile: 'dist/helpers/index.mjs',
	plugins: [externalImportsPlugin('esm', '../')],
});
const helpersCJS = await build({
	...common,
	entryPoints: ['src/helpers/index.ts'],
	format: 'cjs',
	outfile: 'dist/helpers/index.cjs',
	plugins: [externalImportsPlugin('cjs', '../')],
});

await writeFile('dist/helpers/meta-esm.json', JSON.stringify(helpersMJS.metafile));
await writeFile('dist/helpers/meta-cjs.json', JSON.stringify(helpersCJS.metafile));

const functionsMJS = await build({
	...common,
	entryPoints: ['src/functions/index.ts'],
	format: 'esm',
	outfile: 'dist/functions/index.mjs',
	plugins: [externalImportsPlugin('esm', '../')],
});
const functionsCJS = await build({
	...common,
	entryPoints: ['src/functions/index.ts'],
	format: 'cjs',
	outfile: 'dist/functions/index.cjs',
	plugins: [externalImportsPlugin('cjs', '../')],
});

await writeFile('dist/functions/meta-esm.json', JSON.stringify(functionsMJS.metafile));
await writeFile('dist/functions/meta-cjs.json', JSON.stringify(functionsCJS.metafile));

const resultMJS = await build({
	...common,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	outfile: 'dist/index.mjs',
	plugins: [externalImportsPlugin('esm')],
});
const resultCJS = await build({
	...common,
	entryPoints: ['src/index.ts'],
	format: 'cjs',
	outfile: 'dist/index.cjs',
	plugins: [externalImportsPlugin('cjs')],
});

await writeFile('dist/meta-esm.json', JSON.stringify(resultMJS.metafile));
await writeFile('dist/meta-cjs.json', JSON.stringify(resultCJS.metafile));

function getDirSize(dir) {
	return readdirSync(dir).reduce((sum, f) => {
		const full = `${dir}/${f}`;
		if (statSync(full).isDirectory()) return sum + getDirSize(full);
		if (f.endsWith('.map') || f.endsWith('.json')) return sum;
		return sum + statSync(full).size;
	}, 0);
}
function sizeToKB(size) {
	return size / 1024;
}

import pkg from './package.json' with { type: 'json' };
const totalSize = sizeToKB(getDirSize('dist'));
const limit = sizeToKB(pkg.bundleSizeLimit ?? 102400);

if (totalSize > limit) {
	console.log('\x1b[33m%s\x1b[0m', `Bundle too large: ${totalSize}KB > ${limit}KB`);
	process.exit(1);
} else {
	console.log('\x1b[32m%s\x1b[0m', `Bundle size: ${totalSize}KB < ${limit}KB`);
}
