import { describe, it, expect } from 'vitest';
import {
	newRule,
	registerRule,
	smartQuotes,
	smartNumberSpaces,
	CHARACTERS,
	typographyRules,
	getRules,
	getWeightedRules,
	resetTypographyRules,
} from './index';

describe('typography-rules plugin', () => {
	it('creates replace rules with newRule()', () => {
		const rule = newRule(/foo/g, 'bar', 5);

		expect(rule).toEqual({
			kind: 'replace',
			rule: expect.any(RegExp),
			replacement: 'bar',
			weight: 5,
		});

		if (rule.kind === 'replace') {
			expect(rule.rule.source).toBe('foo');
		}
	});

	it('creates transform rules with newRule()', () => {
		const rule = newRule(/(\d+)/g, (match) => `#${match[1]}`);

		expect(rule.kind).toBe('transform');

		if (rule.kind === 'transform') {
			expect(rule.rule).toEqual(/(\d+)/g);
			expect(rule.transform).toBeInstanceOf(Function);

			const match = rule.rule.exec('123');
			expect(match).not.toBeNull();
			if (match) {
				expect(rule.transform(match)).toBe('#123');
			}
		}
	});

	it('creates function rules with newRule()', () => {
		const rule = newRule(smartQuotes, [{ outer: ['«', '»'], inner: ['‹', '›'] }], 10);

		expect(rule.kind).toBe('function');

		if (rule.kind === 'function') {
			expect(rule.rule).toBe(smartQuotes);
			expect(rule.args).toEqual([{ outer: ['«', '»'], inner: ['‹', '›'] }]);
			expect(rule.weight).toBe(10);
		}
	});

	// newRule.ts line 26 — function rule without args defaults to []
	it('creates function rule with default empty args when none passed', () => {
		const rule = newRule(smartQuotes);

		expect(rule.kind).toBe('function');
		if (rule.kind === 'function') {
			expect(rule.args).toEqual([]);
			expect(rule.weight).toBe(0);
		}
	});

	it('registerRule adds a locale rule array', () => {
		const locale = `test-locale-${Date.now()}`;
		const rule = newRule(/test/g, 'ok');

		registerRule(locale, rule);

		expect(typographyRules[locale]).toBeDefined();
		expect(typographyRules[locale]).toContain(rule);
	});

	// registerRule.ts line 5 — locale already exists, should push
	it('registerRule appends to existing locale array', () => {
		const locale = `test-locale-append-${Date.now()}`;
		const rule1 = newRule(/a/g, 'b');
		const rule2 = newRule(/c/g, 'd');

		registerRule(locale, rule1);
		registerRule(locale, rule2);

		expect(typographyRules[locale]).toHaveLength(2);
		expect(typographyRules[locale]).toContain(rule1);
		expect(typographyRules[locale]).toContain(rule2);
	});

	it('formats smart quotes and preserves apostrophes', () => {
		expect(smartQuotes('"Привет \'мир\'"')).toBe('«Привет „мир“»');
		expect(
			smartQuotes('"Hello \'world\'"', { outer: ['\u201C', '\u201D'], inner: ['\u2018', '\u2019'] })
		).toBe('\u201CHello \u2018world\u2019\u201D');
		expect(smartQuotes("It's fine")).toBe("It's fine");
	});

	// smartQuotes.ts line 27 — afterSpace && !beforeSpace inside nested quotes
	// т.е. открывающая кавычка внутри уже открытой (вложенная): "word "nested text" end"
	it('handles opening inner double-quote after space inside outer quote', () => {
		// " открывается (стек пуст → outer), затем встречаем " после пробела — inner open
		const result = smartQuotes('"outer "inner" end"');
		expect(result).toBe('«outer „inner“ end»');
	});

	// smartQuotes.ts lines 30-33 — !afterSpace && !beforeSpace (closing, surrounded by text)
	it('treats double-quote surrounded by non-space chars as closing', () => {
		// Ситуация: кавычка прямо между буквами без пробелов — должна закрыться
		const result = smartQuotes('"word"end');
		expect(result).toBe('«word»end');
	});

	// smartQuotes.ts — " at end of string (next === '') → beforeSpace true → closing
	it('closes quote at end of string correctly', () => {
		expect(smartQuotes('"текст"')).toBe('«текст»');
	});

	// smartQuotes.ts — одиночная кавычка внутри двойных (inner quote flow)
	it('handles single quotes inside double quotes as inner quotes', () => {
		const result = smartQuotes('"She said \'hi\'"', {
			outer: ['\u201C', '\u201D'],
			inner: ['\u2018', '\u2019'],
		});
		expect(result).toBe('\u201CShe said \u2018hi\u2019\u201D');
	});

	it('inserts non-breaking spaces for large numbers', () => {
		expect(smartNumberSpaces('12345')).toBe(`12${CHARACTERS.no_break_space}345`);
		expect(smartNumberSpaces('1000000.1234', { separateFloat: true })).toBe(
			`1${CHARACTERS.no_break_space}000${CHARACTERS.no_break_space}000.123${CHARACTERS.no_break_space}4`
		);
	});

	// smartNumberSpaces.ts line 13 — число короче minLength, возвращается match без изменений
	it('does not format numbers shorter than minLength', () => {
		expect(smartNumberSpaces('1234')).toBe('1234');
		expect(smartNumberSpaces('999')).toBe('999');
	});

	it('respects custom minLength option', () => {
		// minLength=4: 1234 должно форматироваться
		expect(smartNumberSpaces('1234', { minLength: 4 })).toBe(`1${CHARACTERS.no_break_space}234`);
		// minLength=7: 123456 не должно
		expect(smartNumberSpaces('123456', { minLength: 7 })).toBe('123456');
	});

	it('handles signed numbers', () => {
		expect(smartNumberSpaces('+12345')).toBe(`+12${CHARACTERS.no_break_space}345`);
		expect(smartNumberSpaces('-12345')).toBe(`-12${CHARACTERS.no_break_space}345`);
	});

	it('includes common locales in typographyRules', () => {
		expect(typographyRules).toHaveProperty('common');
		expect(typographyRules).toHaveProperty('ru');
		expect(typographyRules).toHaveProperty('en');
		expect(Array.isArray(typographyRules['common'])).toBe(true);
	});

	// store.ts — getRules()
	it('getRules returns the typographyRules object', () => {
		expect(getRules()).toBe(typographyRules);
	});

	// store.ts — getWeightedRules: сортировка по weight
	it('getWeightedRules returns rules sorted by weight', () => {
		const locale = `weighted-${Date.now()}`;
		const heavy = newRule(/b/g, 'B', 100);
		const light = newRule(/a/g, 'A', 1);

		registerRule(locale, heavy);
		registerRule(locale, light);

		const result = getWeightedRules(locale);
		// common идут первыми (weight 0), затем locale-правила по весу
		const localeRules = result.filter((r) => r === heavy || r === light);
		expect(localeRules.indexOf(light)).toBeLessThan(localeRules.indexOf(heavy));
	});

	// store.ts — getWeightedRules: пустой locale и пустой common → []
	it('getWeightedRules returns empty array when no rules exist for locale', () => {
		// Используем resetTypographyRules чтобы изолировать тест
		const saved = { ...typographyRules };

		resetTypographyRules();
		const result = getWeightedRules('nonexistent-locale-xyz');
		expect(result).toEqual([]);

		// Восстанавливаем (reset зануляет массивы, но не удаляет ключи)
		Object.assign(typographyRules, saved);
	});

	// store.ts — getWeightedRules: правила с одинаковым весом сохраняют порядок (return 0)
	it('getWeightedRules preserves order for equal-weight rules', () => {
		const locale = `equal-weight-${Date.now()}`;
		const r1 = newRule(/x/g, 'X', 5);
		const r2 = newRule(/y/g, 'Y', 5);

		registerRule(locale, r1);
		registerRule(locale, r2);

		const result = getWeightedRules(locale);
		const localeRules = result.filter((r) => r === r1 || r === r2);
		expect(localeRules[0]).toBe(r1);
		expect(localeRules[1]).toBe(r2);
	});

	// store.ts — resetTypographyRules очищает массивы
	it('resetTypographyRules empties all rule arrays', () => {
		const locale = `reset-test-${Date.now()}`;
		registerRule(locale, newRule(/z/g, 'Z'));

		resetTypographyRules();

		for (const key of Object.keys(typographyRules)) {
			expect(typographyRules[key]).toEqual([]);
		}
	});
});
