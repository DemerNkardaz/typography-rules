import { newRule } from '@/api';
import { smartNumberGrouping, smartQuotes, wrapWithTag } from '@nkardaz/typography-rules/functions';
import {
	PUNCTUATION,
	LIGATURES,
	SPACES,
	NONE,
	CHARACTERS,
	MATHS,
} from '@nkardaz/typography-rules/glyphs';

import EXPRESSIONS from '../expressions/en';

const locale = 'en-US';

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

	newRule('/english/number/groups', smartNumberGrouping, [{ locale }]),

	newRule('/english/metric/si-unit/base', EXPRESSIONS.siUnitBase, `$1${SPACES.noBreakNarrow}$2`),
	newRule('/english/metric/si-unit/n*n-n', EXPRESSIONS.siUnitMul, `$1${CHARACTERS.middleDot}$2`),
	newRule('/english/metric/si-unit/n-n*n', EXPRESSIONS.siUnitDiv, `$1${CHARACTERS.middleDot}$2`),
	newRule(
		'/english/metric/si-unit/pow-after-value',
		wrapWithTag,
		[
			{
				expression: EXPRESSIONS.siUnitPowAfterNum,
				tag: 'sup',
				placement: `$1${SPACES.noBreakNarrow}$2<TAG>$3</TAG>`,
			},
		],
		-1
	),
	newRule(
		'/english/metric/si-unit/pow',
		wrapWithTag,
		[
			{
				expression: EXPRESSIONS.siUnitPow,
				tag: 'sup',
				placement: `$1<TAG>$2</TAG>`,
			},
		],
		-1
	),
	newRule('/english/scientific/temperature/value', EXPRESSIONS.temperature, `$1$2`),

	newRule('/english/symbol/percent-like/value', EXPRESSIONS.percentValue, `$1$2`),
	newRule('/english/symbol/hash/value', EXPRESSIONS.numberNumeral, `$1$2`),
	newRule('/english/number/division', /(\d+\s*)(?:\/)(\s*\d+)/g, `$1${MATHS.obelus}$2`),
	newRule(
		'/english/number/division-times',
		/(\d+\s*)(?:\/\*)(\s*\d+)/g,
		`$1${MATHS.divisionTimes}$2`
	),

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
