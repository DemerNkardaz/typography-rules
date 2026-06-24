import { PUNCTUATION, CHARACTERS } from '@nkardaz/typography-rules/glyphs';

import { PARTS as COMMON_PARTS, EXPRESSIONS as COMMON_EXPRESSIONS } from './common';

const SI_PREFIX = 'Y|Z|E|P|T|G|M|k|h|da|d|c|m|μ|n|p|f|a|z|y';

const SI_BASE = [
	'g|t',
	'm',
	's|min|h',
	'N',
	'Pa',
	'J',
	'W',
	'A|V|Ω|F|H|C|T|Wb',
	'Hz',
	'mol|cd|rad|sr',
].join('|');

const SI_UNIT = `(?:${SI_PREFIX})?(?:${SI_BASE})`;
const SI_OPERAND = `(?:${SI_UNIT})(?:\\^[\\d]+)?`;

const PARTS = {
	...COMMON_PARTS,
	leftPunctuation: RegExp.escape(PUNCTUATION.get('en', 'leftSided').join('')),
	rightPunctuation: RegExp.escape(PUNCTUATION.get('en', 'rightSided').join('')),

	get leftChars(): string {
		const value = PARTS.leftPunctuation + PARTS.leftBrackets;
		Object.defineProperty(this, 'leftChars', { value, enumerable: true, configurable: false });
		return value;
	},
	get rightChars(): string {
		const value = PARTS.rightPunctuation + PARTS.rightBrackets;
		Object.defineProperty(this, 'rightChars', { value, enumerable: true, configurable: false });
		return value;
	},
} as const;

const EXPRESSIONS = {
	...COMMON_EXPRESSIONS,
	numberNumeral: new RegExp(`(${CHARACTERS.number})\\s*(${PARTS.numerals})`, 'g'),
	invalidPunctuationSpacing: new RegExp(
		`(?<=[${PARTS.leftChars}])\\s+|(?<!\\s)\\s(?=[${PARTS.rightChars}])`,
		'g'
	),
	siUnitMul: new RegExp(`(${SI_OPERAND})\\*(${SI_OPERAND}(?:\\/${SI_OPERAND})*)`, 'g'),
	siUnitDiv: new RegExp(`(${SI_OPERAND}(?:\\/${SI_OPERAND})*)\\*(${SI_OPERAND})`, 'g'),
	siUnitBase: new RegExp(`(\\d+)\\s*(${SI_UNIT})(?![/*])`, 'g'),
	siUnitPowAfterNum: new RegExp(`(\\d+)\\s*(${SI_UNIT})(\\d+)`, 'g'),
	siUnitPow: new RegExp(`(?<!\\d\\s*)(${SI_UNIT})(\\d+)`, 'g'),
} as const;

export default EXPRESSIONS;
