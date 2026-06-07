import { clearSpaces, newRule, runt } from '@/functions';
import { MATHS, DASHES, PUNCTUATION, RANGES } from '@/glyphs';

const RAW = {
	numerals: `[${RANGES.common.DIGITS.join('')}]+`,
	interNumber: `[${MATHS.minus}${DASHES.en}]`,
} as const;

const PARTS = {
	...RAW,
	number: `([${MATHS.minus}]?${RAW.numerals})`,
} as const;

const EXPRESSIONS = {
	numeralsRange: new RegExp(`(${PARTS.numerals})-(${PARTS.numerals})`, 'g'),
	ellipsisRange: new RegExp(`${PARTS.number}${PARTS.interNumber}${PARTS.number}`, 'g'),
	multipleEllipsis: new RegExp(`${PUNCTUATION.common.rightSided.ellipsis}{2,}`, 'g'),
} as const;

/**
 * Shared typography rules applied across all locales.
 *
 * Handles:
 * — whitespace normalization
 * — dash normalization (hyphens, en/em dashes)
 * — ellipsis conversion
 * — math symbol normalization
 * — number spacing rules
 * — apostrophe normalization
 *
 * This layer forms the base typography pipeline
 * before locale-specific transformations.
 */
export default [
	// Whitespace cleanup
	// newRule(/\s+/g, SPACES._),
	newRule('/common/space/cleanup/default', clearSpaces),
	newRule('/common/space/cleanup/trim', /^\s|\s$/g, ''),

	// Math
	// Minus sign for negative numbers
	newRule('/common/math/negative-number', /(?<!\d)-(\d+)/g, `${MATHS.minus}$1`),

	// En dash for ranges, e.g. 1–2
	newRule('/common/math/number-range/default', EXPRESSIONS.numeralsRange, `$1${DASHES.en}$2`),

	// Ellipsis for ranges, e.g. −2…3
	newRule(
		'/common/math/number-range/ellipsis',
		EXPRESSIONS.ellipsisRange,
		`$1${PUNCTUATION.common.rightSided.ellipsis}$2`
	),

	// Generic Typography
	// Em dash replacing double hyphen
	newRule('/common/typography/dashes', /--/g, DASHES.em),

	// Fix too large dots count
	newRule('/common/typography/dots/dots-overload', /\.{4,}/g, '...'),

	// Ellipsis replacing three dots
	newRule('/common/typography/dots/ellipsis', /\.\.\./g, PUNCTUATION.common.rightSided.ellipsis),

	// Fix multiple ellipses
	newRule(
		'/common/typography/dots/ellipsis-overload',
		EXPRESSIONS.multipleEllipsis,
		PUNCTUATION.common.rightSided.ellipsis
	),

	// Apostrophe replacing single straight quote
	newRule('/common/typography/apostrophe', /'/g, PUNCTUATION.common.generic.apostrophe, 200),

	newRule('/common/typography/runt', runt),
];
