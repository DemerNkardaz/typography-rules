import { build } from 'esbuild';
import { rm } from 'node:fs/promises';
import { readdirSync, statSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

await rm('dist', { recursive: true, force: true });

const common = {
	bundle: true,
	treeShaking: true,
	sourcemap: true,
	metafile: true,
	platform: 'neutral',
	target: 'es2022',
	tsconfig: 'tsconfig.build.json',
	external: ['@nkardaz/typography-rules/*'],
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
});

await writeFile('dist/glyphs/meta-esm.json', JSON.stringify(glyphsMJS.metafile));

const helpersMJS = await build({
	...common,
	entryPoints: ['src/helpers/index.ts'],
	format: 'esm',
	outfile: 'dist/helpers/index.mjs',
});

await writeFile('dist/helpers/meta-esm.json', JSON.stringify(helpersMJS.metafile));

const functionsMJS = await build({
	...common,
	entryPoints: ['src/functions/index.ts'],
	format: 'esm',
	outfile: 'dist/functions/index.mjs',
});

await writeFile('dist/functions/meta-esm.json', JSON.stringify(functionsMJS.metafile));

const resultMJS = await build({
	...common,
	entryPoints: ['src/index.ts'],
	format: 'esm',
	outfile: 'dist/index.mjs',
});

await writeFile('dist/meta-esm.json', JSON.stringify(resultMJS.metafile));

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
