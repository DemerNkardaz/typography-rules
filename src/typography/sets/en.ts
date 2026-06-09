import { newRule } from '@/api';
import { smartNumberGrouping, smartQuotes } from '@/functions';
import { PUNCTUATION, LIGATURES, CHARACTERS, SPACES } from '@/glyphs';
import { PARTS as COMMON_PARTS, EXPRESSIONS as COMMON_EXPRESSIONS } from './common';

const RAW = {
	...COMMON_PARTS,
	leftPunctuation: `${RegExp.escape(PUNCTUATION.get('en', 'leftSided').join(''))}`,
	rightPunctuation: `${RegExp.escape(PUNCTUATION.get('en', 'rightSided').join(''))}`,
};

const PARTS = {
	...RAW,
	leftChars: `${RAW.leftPunctuation + RAW.leftBrackets}`,
	rightChars: `${RAW.rightPunctuation + RAW.rightBrackets}`,
} as const;

const EXPRESSIONS = {
	...COMMON_EXPRESSIONS,
	numberNumeral: new RegExp(`(${CHARACTERS.number})\\s+(${PARTS.numerals})`, 'g'),
	invalidPunctuationSpacing: new RegExp(
		`(?<=[${PARTS.leftChars}])\\s+|(?<!\\s)\\s(?=[${PARTS.rightChars}])`,
		'g'
	),
} as const;

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
	newRule('/english/currency/wallet-symbol-flip', EXPRESSIONS.walletSymbolAfterValue, `$2$1`),
	newRule('/english/currency/wallet-iso-flip', EXPRESSIONS.walletISOBeforeValue, `$2$1`),
	newRule('/english/currency/wallet-symbol-value', EXPRESSIONS.walletSymbolBeforeValue, `$1$2`),
	newRule(
		'/english/currency/wallet-iso-value',
		EXPRESSIONS.walletISOAfterValue,
		`$1${SPACES.noBreak}$2`
	),

	newRule('/english/number/groups', smartNumberGrouping, [
		{ separator: PUNCTUATION.common.rightSided.comma },
	]),
	newRule(
		'/english/number/number-sign-value',
		EXPRESSIONS.numberNumeral,
		`$1${SPACES.noBreakNarrow}$2`
	),

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
	newRule(
		'/english/typography/invalid-punctuation-spacing',
		EXPRESSIONS.invalidPunctuationSpacing,
		'',
		1000
	),

	newRule('/english/ligatures/fi', /fi/g, LIGATURES.fi),
	newRule('/english/ligatures/fl', /fl/g, LIGATURES.fl),
	newRule('/english/ligatures/ffi', /ffi/g, LIGATURES.ffi),
	newRule('/english/ligatures/ffl', /ffl/g, LIGATURES.ffl),
];
