import { CHARACTERS, DASHES, PUNCTUATION } from '@/glyphs';
import { PARTS as COMMON_PARTS, EXPRESSIONS as COMMON_EXPRESSIONS } from './common';

const SI_PREFIX = 'Й|З|Э|П|Т|Г|М|к|г|М|к|д|с|м|мк|н|п|ф|а|з|й';

const SI_BASE = [
	'г|т',
	'м',
	'с|мин|ч',
	'Н',
	'Па',
	'Дж',
	'Вт',
	'А|В|Ом|Ф|Гн|Кл|Тл|Вб',
	'Гц',
	'моль|кд|рад|ср',
].join('|');

const SI_UNIT = `(?:${SI_PREFIX})?(?:${SI_BASE})`;
const SI_OPERAND = `(?:${SI_UNIT})(?:\\^[\\d]+)?`;

const PARTS = {
	...COMMON_PARTS,
	leftPunctuation: RegExp.escape(PUNCTUATION.get('ru', 'leftSided').join('')),
	rightPunctuation: RegExp.escape(PUNCTUATION.get('ru', 'rightSided').join('')),

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
	numeroNumeral: new RegExp(`(${CHARACTERS.numero})\\s*((?:${PARTS.numerals}\\s*)*)`, 'g'),
	invalidPunctuationSpacing: new RegExp(
		`(?<=[${PARTS.leftChars}])\\s+|(?<!\\s)\\s(?=[${PARTS.rightChars}])`,
		'g'
	),
	dialogEmDash: new RegExp(`(^${DASHES.em})\\s*`, 'gm'),
	attributionEmDash: new RegExp(
		`([${PARTS.rightPunctuation}])\\s*(${DASHES.em})\\s*([а-яА-ЯёЁa-zA-Z]+)`,
		'gi'
	),
	subjectPredicateEmDash: new RegExp(
		`([а-яА-ЯёЁa-zA-Z]+)\\s+(${DASHES.em})\\s+([а-яА-ЯёЁa-zA-Z]+)`,
		'gi'
	),
	siUnitMul: new RegExp(`(${SI_OPERAND})\\*(${SI_OPERAND}(?:\\/${SI_OPERAND})*)`, 'g'),
	siUnitDiv: new RegExp(`(${SI_OPERAND}(?:\\/${SI_OPERAND})*)\\*(${SI_OPERAND})`, 'g'),
	siUnitBase: new RegExp(`(\\d+)\\s*(${SI_UNIT})(?![/*])`, 'g'),
	siUnitPowAfterNum: new RegExp(`(\\d+)\\s*(${SI_UNIT})(\\d+)`, 'g'),
	siUnitPow: new RegExp(`(?<!\\d\\s*)(${SI_UNIT})(\\d+)`, 'g'),
	date: new RegExp(`(${PARTS.numerals})\\s(вв|в|гг|г|мес|нед|дн|д)\\.`, 'gi'),
} as const;

export default EXPRESSIONS;
