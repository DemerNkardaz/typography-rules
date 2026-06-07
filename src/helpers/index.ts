import type { PatternProto, PatternData, PatternSet } from './types';

export type * from './types';

/**
 * Private Use Area (PUA) marker sequence used to identify AST nodes.
 *
 * This marker is embedded into text during preprocessing stages
 * to preserve structural boundaries through transformations.
 *
 * Must remain unique and never appear in natural text.
 */
export const NODE_MARKER = '\uE000\uEDFD\uF43E';

/**
 * Private Use Area (PUA) marker sequence used for protected regions.
 *
 * Used to temporarily wrap substrings that must not be modified
 * during typography or text-processing pipelines.
 *
 * Typically applied before regex-based transformations.
 */
export const PROTECTION_MARKER = '\uE001\uEDF1\uF111';

/**
 * RegExp matcher for NODE_MARKER sequences.
 *
 * Used to locate and remove node markers during cleanup phase
 * of text processing pipeline.
 */
export const NODE_MARKER_REGEX = new RegExp(NODE_MARKER, 'g');

/**
 * RegExp matcher for PROTECTION_MARKER sequences.
 *
 * Used to detect protected regions in processed text
 * and restore original content where necessary.
 */
export const PROTECTION_MARKER_REGEX = new RegExp(PROTECTION_MARKER, 'g');

const patternProto: PatternProto = {
	get values(): RegExp[] {
		return Object.keys(this)
			.map((key) => {
				const desc = Object.getOwnPropertyDescriptor(this, key);
				return desc?.get
					? ((this as unknown as Record<string, unknown>)[key] as RegExp)
					: undefined;
			})
			.filter((v): v is RegExp => v !== undefined);
	},

	combined(flags = 'g'): RegExp {
		const source = this.values.map((pattern) => `(${pattern.source})`).join('|');

		return new RegExp(source, flags);
	},

	insert(patterns: PatternData): void {
		for (const key of Object.keys(patterns)) {
			const src = patterns[key]!.source;
			const flags = patterns[key]!.flags;

			Object.defineProperty(this, key, {
				get(): RegExp {
					return new RegExp(src, flags);
				},
				enumerable: true,
				configurable: true,
			});
		}
	},

	*[Symbol.iterator](): Iterator<RegExp> {
		for (const key of Object.keys(this)) {
			const desc = Object.getOwnPropertyDescriptor(this, key);
			if (desc?.get) yield (this as unknown as Record<string, unknown>)[key] as RegExp;
		}
	},
};

/**
 * Creates a pattern registry from a map of named RegExp patterns.
 *
 * Each pattern is stored as a getter that returns a new `RegExp` instance
 * on every access, ensuring `lastIndex` is always reset to `0` regardless
 * of how the pattern was previously used.
 *
 * Prototype methods (`values`, `Symbol.iterator`) are attached via
 * `Object.create` and do not appear as enumerable keys on the result.
 *
 * @template T — Shape of the source pattern map
 * @param patterns — Raw map of named RegExp patterns
 * @returns A pattern registry with per-access instantiation and prototype utilities
 *
 * @example
 * const PATTERNS = createPatterns({
 *   email: /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g,
 *   url: /https?:\/\/[^\s]+/g,
 * });
 *
 * PATTERNS.email.test('user@example.com'); // always starts from lastIndex = 0
 * [...PATTERNS];                           // [RegExp, RegExp]
 * PATTERNS.values;                         // [RegExp, RegExp]
 */
export function createPatterns<T extends PatternData>(patterns: T): PatternSet<T> {
	const result = Object.create(patternProto) as PatternSet<T>;

	for (const key of Object.keys(patterns) as (keyof T & string)[]) {
		const src = patterns[key]!.source;
		const flags = patterns[key]!.flags;
		Object.defineProperty(result, key, {
			get(): RegExp {
				return new RegExp(src, flags);
			},
			enumerable: true,
			configurable: true,
		});
	}

	return result;
}

/**
 * Registry of protected regex patterns used in text preprocessing.
 *
 * These patterns are temporarily excluded from typography transformations
 * by wrapping matches with protection markers.
 *
 * Includes:
 * — URLs and emails
 * — filesystem paths (Unix / Windows)
 * — code blocks and inline code
 * — identifiers (UUID, hashes, ORCID, DOI)
 * — network addresses (IPv4, IPv6, MAC)
 * — programming-related syntax (selectors, CLI flags, versions)
 * — publishing identifiers (ISBN, ISSN)
 *
 * This system ensures that structured technical content
 * is not corrupted by typographic transformations.
 */
export const PROTECTED_PATTERNS = createPatterns({
	email: /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g,
	url: /https?:\/\/[^\s]+/g,
	unixPath: /\/[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+/g,
	windowsPath: /[A-Za-z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*/g,
	xmlTag: /<\/?[a-zA-Z][^>]*>/g,
	inlineCode: /`[^`\n]+`/g,
	blockCode: /```[\s\S]*?```/g,
	uuid: /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
	hash: /\b(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b/gi,
	ipv4: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
	ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
	mac: /\b(?:[0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}\b/g,
	version: /\bv?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?\b/g,
	selector: /[.#][A-Za-z_][\w-]*/g,
	cliOption: /--?[a-zA-Z][\w-]*/g, //
	isbn: /\b(?:97[89][- ]?)?(?:\d[- ]?){9}[\dX]\b/g,
	issn: /\b\d{4}-\d{3}[\dX]\b/g,
	doi: /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi,
	orcid: /\b\d{4}-\d{4}-\d{4}-\d{3}[\dX]\b/g,
});

/**
 * Wraps NODE_MARKER sequences and PROTECTED_PATTERNS matches
 * with PROTECTION_MARKER, storing originals for later restoration.
 *
 * @returns Tuple of [protected text, captured matches]
 */
export function protect(text: string): [string, string[]] {
	const captured: string[] = [];

	const withNodeMarkers = text.replace(NODE_MARKER_REGEX, (match) => {
		captured.push(match);
		return PROTECTION_MARKER;
	});

	const withPatterns = withNodeMarkers.replace(PROTECTED_PATTERNS.combined(), (match) => {
		captured.push(match);
		return PROTECTION_MARKER;
	});

	return [withPatterns, captured];
}

/**
 * Restores original strings previously captured by `protect`.
 */
export function unprotect(text: string, captured: string[]): string {
	const queue = [...captured];
	return text.replace(PROTECTION_MARKER_REGEX, () => queue.shift() ?? '');
}

/**
 * Joins an array of objects with a `value: string` field
 * into a single string using NODE_MARKER as separator.
 *
 * Intended for combining sibling text nodes before rule application,
 * so that rules can operate across node boundaries when needed.
 */
export function joinNodes<T extends { value: string }>(nodes: T[]): string {
	return nodes.map((n) => n.value).join(NODE_MARKER);
}

/**
 * Splits a transformed string by NODE_MARKER and writes
 * segments back into the corresponding nodes.
 *
 * If segment count doesn't match nodes count (e.g. a rule
 * consumed a marker), original values are preserved as fallback.
 */
export function splitNodes<T extends { value: string }>(text: string, nodes: T[]): void {
	const segments = text.split(NODE_MARKER);
	nodes.forEach((n, i) => {
		n.value = segments[i] ?? n.value;
	});
}
