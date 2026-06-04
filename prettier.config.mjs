export default {
	useTabs: true,
	tabWidth: 2,
	semi: true,
	singleQuote: true,
	trailingComma: 'all',
	bracketSpacing: true,
	printWidth: 100,
	arrowParens: 'always',
	endOfLine: 'lf',

	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			options: {
				parser: 'typescript',
			},
		},
	],
};
