import { newRule, smartNumberSpaces } from '@/functions';
import { MATHS, DASHES, PUNCTUATION } from '@/glyphs';

/**
 * Shared typography rules applied across all locales.
 *
 * Handles:
 * - whitespace normalization
 * - dash normalization (hyphens, en/em dashes)
 * - ellipsis conversion
 * - math symbol normalization
 * - number spacing rules
 * - apostrophe normalization
 *
 * This layer forms the base typography pipeline
 * before locale-specific transformations.
 */
export default [
	// Whitespace cleanup
	newRule(/\s+/g, ' '),
	newRule(/^\s|\s$/g, ''),

	// Dashes and special chars
	newRule(/(?<!\d)-(\d+)/g, `${MATHS.minus}$1`),
	newRule(/(\d+)-(\d+)/g, `$1${DASHES.en}$2`),
	newRule(/(\d+|[XIVCMLDZ\u2160-\u2188]+)-(\d+|[XIVCMLDZ\u2160-\u2188]+)/g, `$1${DASHES.en}$2`),
	newRule(
		new RegExp(
			`([${MATHS.minus}${DASHES.em}-])(\\d+)[${MATHS.minus}${DASHES.en}\\-]([${MATHS.minus}${DASHES.en}\\-]?\\d+)`,
			'g'
		),
		`$1$2${PUNCTUATION.common.rightSided.ellipsis}$3`
	),
	newRule(/--/g, DASHES.em),
	newRule(/\.\.\./g, PUNCTUATION.common.rightSided.ellipsis),

	newRule(smartNumberSpaces),
	newRule(/'/g, PUNCTUATION.common.generic.apostrophe, 200),
];
