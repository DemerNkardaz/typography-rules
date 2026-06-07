import { newRule, smartNumberSpaces, smartQuotes } from '@/functions';
import { PUNCTUATION, WALLET, LIGATURES } from '@/glyphs';

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
	// Adds a comma as a thousands separator, e.g. 1,234,567
	newRule(smartNumberSpaces, [{ separator: PUNCTUATION.common.rightSided.comma }]),

	newRule(
		smartQuotes,
		[
			{
				outer: [PUNCTUATION.en.leftSided.outerQuoteOpen, PUNCTUATION.en.rightSided.outerQuoteClose],
				inner: [PUNCTUATION.en.leftSided.innerQuoteOpen, PUNCTUATION.en.rightSided.innerQuoteClose],
			},
		],
		100
	),
	newRule(
		new RegExp(
			`(?<=[${PUNCTUATION.get('en', 'leftSided').join('')}“‘\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('en', 'rightSided').join('')}”’\\)\\]])`,
			'g'
		),
		'',
		1000
	),
	newRule(new RegExp(`([${WALLET.join()}])\\s?(\\d+)`, 'g'), `$1$2`),
	newRule(/fi/g, LIGATURES.fi),
	newRule(/fl/g, LIGATURES.fl),
	newRule(/ffi/g, LIGATURES.ffi),
	newRule(/ffl/g, LIGATURES.ffl),
];
