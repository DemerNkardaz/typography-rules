import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const setsDir = join(process.cwd(), 'src', 'typography', 'sets');

const files = readdirSync(setsDir)
	.filter((file) => file.endsWith('.ts'))
	.filter((file) => file !== 'index.ts');

const exports = files
	.map((file) => {
		const name = file.replace(/\.ts$/, '');
		return `export { default as ${name} } from './${name}';`;
	})
	.join('\n');

const content = '// AUTO-GENERATED FILE. DO NOT EDIT.\n\n' + exports + '\n';

writeFileSync(join(setsDir, 'index.ts'), content);

console.log(`Generated index.ts (${files.length} locales)`);
