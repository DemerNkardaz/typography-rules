import { newRule } from '@/api';
import { smartNumberGrouping, smartQuotes } from '@/functions';
import { PUNCTUATION, LIGATURES, SPACES, NONE } from '@/glyphs';

import EXPRESSIONS from '../expressions/en';

/**
 * English typography ruleset.
 *
 * Includes:
 * - smart quote replacement (US style)
 * - ligature substitution (fi, fl, ffi, ffl)
 * - currency formatting normalization
 * - spacing cleanup for punctuation
 *
 * Designed for Latin-script typography processing.
 */
export default [
	newRule('/english/currency/wallet/symbol-flip', EXPRESSIONS.walletSymbolAfterValue, `$2$1`),
	newRule('/english/currency/wallet/iso-flip', EXPRESSIONS.walletISOBeforeValue, `$2$1`),
	newRule('/english/currency/wallet/symbol-value', EXPRESSIONS.walletSymbolBeforeValue, `$1$2`),
	newRule(
		'/english/currency/wallet/iso-value',
		EXPRESSIONS.walletISOAfterValue,
		`$1${SPACES.noBreak}$2`
	),

	newRule('/english/number/groups', smartNumberGrouping, [
		{ separator: PUNCTUATION.common.rightSided.comma },
	]),

	newRule('/english/symbol/hash/value', EXPRESSIONS.numberNumeral, `$1${SPACES.noBreakNarrow}$2`),

	newRule(
		'/english/punctuation/quotes',
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
		'/english/punctuation/dot-before-expression',
		EXPRESSIONS.expressiveAposiopesis,
		PUNCTUATION.common.rightSided.ellipsis + '$1'
	),
	newRule(
		'/english/punctuation/dot-before-expression',
		EXPRESSIONS.backwardsExpressiveAposiopesis,
		PUNCTUATION.common.rightSided.ellipsis + '$1'
	),
	newRule(
		'/english/punctuation/invalid-spacing',
		EXPRESSIONS.invalidPunctuationSpacing,
		NONE,
		1000
	),

	newRule('/english/ligatures/fi', /fi/g, LIGATURES.fi),
	newRule('/english/ligatures/fl', /fl/g, LIGATURES.fl),
	newRule('/english/ligatures/ffi', /ffi/g, LIGATURES.ffi),
	newRule('/english/ligatures/ffl', /ffl/g, LIGATURES.ffl),
];
