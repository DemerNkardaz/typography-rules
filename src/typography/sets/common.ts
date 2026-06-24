import { newRule } from '@/api';
import { clearSpaces, runt } from '@nkardaz/typography-rules/functions';
import {
	MATHS,
	DASHES,
	PUNCTUATION,
	CHARACTERS,
	NONE,
	SPACES,
} from '@nkardaz/typography-rules/glyphs';

import EXPRESSIONS from '../expressions/common';

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
	// newRule(/\s+/g, SPACES._),
	newRule('/common/space/cleanup/multiple', clearSpaces),
	newRule('/common/space/cleanup/trim', /^\s|\s$/g, NONE),

	// Math
	// Minus sign for negative numbers
	newRule('/common/number/negative', /(?<!\d)-(\d+)/g, `${MATHS.minus}$1`),

	// En dash for ranges, e.g. 1–2
	newRule('/common/number/range/en-dash', EXPRESSIONS.numeralsRange, `$1${DASHES.en}$2`),

	// Ellipsis for ranges, e.g. −2…3
	newRule(
		'/common/number/range/ellipsis-on-negative',
		EXPRESSIONS.ellipsisRange,
		`$1${PUNCTUATION.common.rightSided.ellipsis}$2`
	),

	newRule('/common/number/dimension', /(\d+)\s*(?:x|х)\s*(\d+)/g, `$1${MATHS.multiply}$2`),
	newRule('/common/number/multiply', /(\d+\s*)(?:\*)(\s*\d+)/g, `$1${MATHS.multiply}$2`),
	newRule('/common/number/fraction', /(\d+)\/(\d+)/g, `$1${MATHS.fractionSlash}$2`),

	newRule('/common/symbol/copyright', /\((?:c|с)\)/g, CHARACTERS.copyright),
	newRule('/common/symbol/trademark', /\((?:tm|тм)\)/g, CHARACTERS.trademark),
	newRule('/common/symbol/registered', /\(r\)/g, CHARACTERS.registered),
	newRule('/common/symbol/section', /\(s\)/g, CHARACTERS.section),
	newRule('/common/symbol/math/plus-minus', EXPRESSIONS.plusMinus, MATHS.plusMinus),
	newRule('/common/symbol/math/minus-plus', EXPRESSIONS.minusPlus, MATHS.minusPlus),

	// Generic Typography
	// Em dash replacing double hyphen
	newRule('/common/punctuation/dashes/em-dash', /--/g, DASHES.em),

	// Fix too large dots count
	newRule('/common/punctuation/dots/overload', /\.{4,}/g, '...'),

	// Ellipsis replacing three dots
	newRule('/common/punctuation/dots/ellipsis', /\.\.\./g, PUNCTUATION.common.rightSided.ellipsis),

	// Fix multiple ellipses
	newRule(
		'/common/punctuation/dots/ellipsis-overload',
		EXPRESSIONS.multipleEllipsis,
		PUNCTUATION.common.rightSided.ellipsis
	),

	// Apostrophe replacing single straight quote
	newRule('/common/punctuation/apostrophe', /'/g, PUNCTUATION.common.generic.apostrophe, 200),

	newRule(
		'/common/symbol/section/value',
		EXPRESSIONS.sectionNumeral,
		(match): string => {
			const numero = match[1]!;
			const numeral = match[2]!.replace(/\s+/g, '');
			return `${numero}${SPACES.noBreakNarrow}${numeral}`;
		},
		1
	),

	// Runt
	newRule('/common/typography/runt', runt, undefined, Infinity),
];
