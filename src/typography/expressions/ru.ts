import { CHARACTERS } from '@/glyphs';
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
} as const;

const EXPRESSIONS = {
	...COMMON_EXPRESSIONS,
	numeroNumeral: new RegExp(`(${CHARACTERS.numero})\\s+(${PARTS.numerals})`, 'g'),
	siUnitMul: new RegExp(`(${SI_OPERAND})\\*(${SI_OPERAND}(?:\\/${SI_OPERAND})*)`, 'g'),
	siUnitDiv: new RegExp(`(${SI_OPERAND}(?:\\/${SI_OPERAND})*)\\*(${SI_OPERAND})`, 'g'),
	siUnitBase: new RegExp(`(\\d+)\\s*(${SI_UNIT})(?![/*])`, 'g'),
	siUnitPowAfterNum: new RegExp(`(\\d+)\\s*(${SI_UNIT})(\\d+)`, 'g'),
	siUnitPow: new RegExp(`(?<!\\d\\s*)(${SI_UNIT})(\\d+)`, 'g'),
} as const;

export default EXPRESSIONS;
