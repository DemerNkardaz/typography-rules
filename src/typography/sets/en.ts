import { newRule, smartNumberGrouping, smartQuotes } from '@/functions';
import { PUNCTUATION, LIGATURES } from '@/glyphs';

/**
 * English typography ruleset.
 *
 * Includes:
 * — smart quote replacement (US style)
 * — ligature substitution (fi, fl, ffi, ffl)
 * — currency formatting normalization
 * — spacing cleanup for punctuation
 *
 * Designed for Latin-script typography processing.
 */
export default [
	newRule('/english/number/groups', smartNumberGrouping, [
		{ separator: PUNCTUATION.common.rightSided.comma },
	]),
	newRule(
		'/english/typography/quotes',
		smartQuotes,
		[
			{
				outer: [PUNCTUATION.en.leftSided.outerQuoteOpen, PUNCTUATION.en.rightSided.outerQuoteClose],
				inner: [PUNCTUATION.en.leftSided.innerQuoteOpen, PUNCTUATION.en.rightSided.innerQuoteClose],
			},
		],
		100
	),
	newRule('/english/ligatures/fi', /fi/g, LIGATURES.fi),
	newRule('/english/ligatures/fl', /fl/g, LIGATURES.fl),
	newRule('/english/ligatures/ffi', /ffi/g, LIGATURES.ffi),
	newRule('/english/ligatures/ffl', /ffl/g, LIGATURES.ffl),
	/*
	// Adds a comma as a thousands separator, e.g. 1,234,567

	newRule(
		new RegExp(
			`(?<=[${PUNCTUATION.get('en', 'leftSided').join('')}“‘\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('en', 'rightSided').join('')}”’\\)\\]])`,
			'g'
		),
		'',
		1000
	),
	newRule(new RegExp(`([${WALLET.join()}])\\s?(\\d+)`, 'g'), `$1$2`),
*/
];
