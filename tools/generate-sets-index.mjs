import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const directories = ['sets', 'markup'];

for (const dir of directories) {
	const targetDir = join(process.cwd(), 'src', 'typography', dir);

	const files = readdirSync(targetDir)
		.filter((file) => file.endsWith('.ts'))
		.filter((file) => file !== 'index.ts');

	const exports = files
		.map((file) => {
			const name = file.replace(/\.ts$/, '');
			return `export { default as ${name} } from './${name}';`;
		})
		.join('\n');

	const content = '// AUTO-GENERATED FILE. DO NOT EDIT.\n\n' + exports + '\n';

	writeFileSync(join(targetDir, 'index.ts'), content);

	console.log(`Generated ${dir}/index.ts (${files.length} files)`);
}

console.log('Done.');
