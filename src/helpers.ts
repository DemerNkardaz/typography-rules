export const NODE_MARKER = '\uE000\uEDFD\uF43E';
export const PROTECTION_MARKER = '\uE001\uEDF1\uF111';

export const PROTECTED_PATTERNS = {
	email: /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g,
	url: /https?:\/\/[^\s]+/g,
	unixPath: /\/[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+/g,
	windowsPath: /[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g,
	xmlTag: /<\/?[a-zA-Z][^>]*>/g,
	inlineCode: /`[^`\n]+`/g,
	blockCode: /```[\s\S]*?```/g,
	uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
	hash: /\b[0-9a-f]{7,40}\b/gi,
	ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
	ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
	mac: /\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\b/g,
	selector: /[.#][A-Za-z_][\w-]*/g,
	cliOption: /--?[a-zA-Z][\w-]*/g, //
	version: /\bv?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/g,
	isbn: /\b(?:97[89][- ]?)?(?:\d[- ]?){9}[\dX]\b/g,
	issn: /\b\d{4}-\d{3}[\dX]\b/g,
	doi: /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi,
	orcid: /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/g,

	get values(): RegExp[] {
		const keys = Object.keys(this) as (keyof typeof PROTECTED_PATTERNS)[];

		return keys
			.filter(
				(key): key is Exclude<typeof key, 'values' | typeof Symbol.iterator> =>
					key !== 'values' && typeof key !== 'symbol'
			)
			.map((key) => this[key] as RegExp);
	},

	*[Symbol.iterator]() {
		const keys = Object.keys(this) as (keyof typeof PROTECTED_PATTERNS)[];
		for (const key of keys) {
			if (key !== 'values' && typeof key !== 'symbol') {
				yield this[key];
			}
		}
	},
} as const;
