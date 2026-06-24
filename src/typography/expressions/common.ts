import {
	RANGES,
	MATHS,
	DASHES,
	WALLET,
	BRACKETS,
	CHARACTERS,
	PUNCTUATION,
	TEMPERATURES,
} from '@nkardaz/typography-rules/glyphs';

export const PARTS = {
	numerals: '[' + RANGES.common.DIGITS.join('') + ']+',
	interNumber: '[' + MATHS.minus + DASHES.en + ']',
	walletSymbols: WALLET.SYMBOL.values()
		.map((s) => RegExp.escape(s))
		.join('|'),
	walletISO: WALLET.ISO.join('|'),
	leftBrackets: RegExp.escape(BRACKETS.common.left.join('')),
	rightBrackets: RegExp.escape(BRACKETS.common.right.join('')),
	percentLike: '[' + CHARACTERS.find('percent', 'permil', 'perTenThousand')?.join('') + ']',
	expressivePunctuation:
		'[' +
		PUNCTUATION.common.rightSided
			.find(
				'exclamation',
				'doubleExclamation',
				'exclamationQuestion',
				'question',
				'doubleQuestion',
				'questionExclamation',
				'reversedQuestion',
				'interrobang'
			)
			?.join('') +
		']',

	get number(): string {
		const value = `([${MATHS.minus}]?${PARTS.numerals})`;
		Object.defineProperty(this, 'number', { value, enumerable: true, configurable: false });
		return value;
	},
} as const;

export const EXPRESSIONS = {
	plusMinus: new RegExp(`(\\+[-${MATHS.minus}])`, 'g'),
	minusPlus: new RegExp(`([-${MATHS.minus}]\\+)`, 'g'),
	sectionNumeral: new RegExp(`(${CHARACTERS.section})\\s*((?:${PARTS.numerals}\\s*)*)`, 'g'),
	percentValue: new RegExp(`${PARTS.number}\\s*(${PARTS.percentLike})`, 'g'),
	numeralsRange: new RegExp(`(${PARTS.numerals})-(${PARTS.numerals})`, 'g'),
	ellipsisRange: new RegExp(`${PARTS.number + PARTS.interNumber + PARTS.number}`, 'g'),
	multipleEllipsis: new RegExp(`${PUNCTUATION.common.rightSided.ellipsis}{2,}`, 'g'),
	walletSymbolBeforeValue: new RegExp(`(${PARTS.walletSymbols})\\s*(\\d[\\d.]*)`, 'g'),
	walletSymbolAfterValue: new RegExp(`(\\d+)\\s*(${PARTS.walletSymbols})`, 'g'),
	walletISOBeforeValue: new RegExp(`(${PARTS.walletISO})\\s*(\\d[\\d.]*)`, 'g'),
	walletISOAfterValue: new RegExp(`(\\d+)\\s*(${PARTS.walletISO})`, 'g'),
	expressiveAposiopesis: new RegExp(
		`(${PARTS.expressivePunctuation})\\s*(?:${PUNCTUATION.common.rightSided.ellipsis}|\\.{1,})[.${PUNCTUATION.common.rightSided.ellipsis}]*`,
		'g'
	),
	backwardsExpressiveAposiopesis: new RegExp(
		`(?:${PUNCTUATION.common.rightSided.ellipsis}|\\.{1,})[.${PUNCTUATION.common.rightSided.ellipsis}]*\\s*(${PARTS.expressivePunctuation})`,
		'g'
	),
	temperature: new RegExp(`(\\d+)\\s*(${TEMPERATURES.join()})`, 'g'),
} as const;

export default EXPRESSIONS;
