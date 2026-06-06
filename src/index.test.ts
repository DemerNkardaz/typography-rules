import { describe, it, expect } from 'vitest';
import {
	newRule,
	registerRule,
	smartQuotes,
	smartNumberSpaces,
	typographyRules,
	getWeightedRules,
	resetTypographyRules,
	applyDefaultRules,
} from './index';
import { SPACES, createCharacters, createCharacterSet } from './glyphs';
import { PROTECTED_PATTERNS } from './helpers';

applyDefaultRules();

// ─────────────────────────────────────────────
// newRule
// ─────────────────────────────────────────────
describe('newRule()', () => {
	it('creates replace rule', () => {
		const rule = newRule(/foo/g, 'bar', 5);
		expect(rule).toEqual({
			kind: 'replace',
			rule: expect.any(RegExp),
			replacement: 'bar',
			weight: 5,
		});
		if (rule.kind === 'replace') expect(rule.rule.source).toBe('foo');
	});

	it('creates transform rule', () => {
		const rule = newRule(/(\d+)/g, (match) => `#${match[1]}`);
		expect(rule.kind).toBe('transform');
		if (rule.kind === 'transform') {
			const match = rule.rule.exec('123');
			expect(match).not.toBeNull();
			if (match) expect(rule.transform(match)).toBe('#123');
		}
	});

	it('creates function rule with args and weight', () => {
		const rule = newRule(smartQuotes, [{ outer: ['«', '»'], inner: ['‹', '›'] }], 10);
		expect(rule.kind).toBe('function');
		if (rule.kind === 'function') {
			expect(rule.rule).toBe(smartQuotes);
			expect(rule.args).toEqual([{ outer: ['«', '»'], inner: ['‹', '›'] }]);
			expect(rule.weight).toBe(10);
		}
	});

	it('creates function rule with default empty args and weight=0', () => {
		const rule = newRule(smartQuotes);
		expect(rule.kind).toBe('function');
		if (rule.kind === 'function') {
			expect(rule.args).toEqual([]);
			expect(rule.weight).toBe(0);
		}
	});
});

// ─────────────────────────────────────────────
// registerRule
// ─────────────────────────────────────────────
describe('registerRule()', () => {
	it('adds a single rule to a new locale', () => {
		const locale = `test-locale-${Date.now()}`;
		const rule = newRule(/test/g, 'ok');
		registerRule(locale, rule);
		expect(typographyRules[locale]).toContain(rule);
	});

	it('appends to existing locale array', () => {
		const locale = `test-locale-append-${Date.now()}`;
		const rule1 = newRule(/a/g, 'b');
		const rule2 = newRule(/c/g, 'd');
		registerRule(locale, rule1);
		registerRule(locale, rule2);
		expect(typographyRules[locale]).toHaveLength(2);
	});

	// registerRule.ts line 13 — passing an array of rules
	it('registers an array of rules at once', () => {
		const locale = `test-locale-array-${Date.now()}`;
		const rules = [newRule(/x/g, 'X'), newRule(/y/g, 'Y'), newRule(/z/g, 'Z')];
		registerRule(locale, rules);
		expect(typographyRules[locale]).toHaveLength(3);
		for (const r of rules) expect(typographyRules[locale]).toContain(r);
	});

	it('appends array to already existing locale rules', () => {
		const locale = `test-locale-array-append-${Date.now()}`;
		const first = newRule(/a/g, 'A');
		registerRule(locale, first);
		const more = [newRule(/b/g, 'B'), newRule(/c/g, 'C')];
		registerRule(locale, more);
		expect(typographyRules[locale]).toHaveLength(3);
	});
});

// ─────────────────────────────────────────────
// smartQuotes
// ─────────────────────────────────────────────
describe('smartQuotes()', () => {
	it('converts outer double quotes (English default)', () => {
		expect(smartQuotes('"text"')).toBe('“text”');
	});

	it('converts nested double+single quotes', () => {
		expect(smartQuotes('"Hello \'world\'"')).toBe('“Hello ‘world’”');
	});

	it('converts outer double quotes (Russian)', () => {
		expect(smartQuotes('"текст"', { outer: ['«', '»'] })).toBe('«текст»');
	});

	it('converts nested double+single quotes (Russian)', () => {
		expect(smartQuotes('"Привет \'мир\'"', { outer: ['«', '»'], inner: ['„', '“'] })).toBe(
			'«Привет „мир“»'
		);
	});

	it('preserves apostrophes', () => {
		expect(smartQuotes("It's fine")).toBe("It's fine");
	});

	it('handles English quotes', () => {
		expect(
			smartQuotes('"Hello \'world\'"', { outer: ['\u201C', '\u201D'], inner: ['\u2018', '\u2019'] })
		).toBe('\u201CHello \u2018world\u2019\u201D');
	});

	it('opens inner double-quote after space inside outer quote', () => {
		expect(smartQuotes('"outer "inner" end"')).toBe('“outer ‘inner’ end”');
	});

	it('treats double-quote between non-space chars as closing', () => {
		expect(smartQuotes('"word"end')).toBe('“word”end');
	});

	it('closes quote at end of string', () => {
		expect(smartQuotes('"текст"', { outer: ['«', '»'] })).toBe('«текст»');
	});

	it('handles single quotes as inner quotes inside double quotes', () => {
		const result = smartQuotes('"She said \'hi\'"', {
			outer: ['\u201C', '\u201D'],
			inner: ['\u2018', '\u2019'],
		});
		expect(result).toBe('\u201CShe said \u2018hi\u2019\u201D');
	});

	it('treats quote surrounded by spaces on both sides inside outer quote as closing', () => {
		const result = smartQuotes('"text" end"', { outer: ['«', '»'] });
		expect(result).toBe('«text» end«');
	});
});

// ─────────────────────────────────────────────
// smartNumberSpaces
// ─────────────────────────────────────────────
describe('smartNumberSpaces()', () => {
	it('inserts non-breaking spaces in large integers', () => {
		expect(smartNumberSpaces('12345')).toBe(`12${SPACES.nb}345`);
	});

	it('does not format numbers shorter than minLength', () => {
		expect(smartNumberSpaces('1234')).toBe('1234');
		expect(smartNumberSpaces('999')).toBe('999');
	});

	it('respects custom minLength', () => {
		expect(smartNumberSpaces('1234', { minLength: 4 })).toBe(`1${SPACES.nb}234`);
		expect(smartNumberSpaces('123456', { minLength: 7 })).toBe('123456');
	});

	it('formats floats with separateFloat=true', () => {
		expect(smartNumberSpaces('1000000.1234', { separateFloat: true })).toBe(
			`1${SPACES.nb}000${SPACES.nb}000.123${SPACES.nb}4`
		);
	});

	it('handles signed numbers', () => {
		expect(smartNumberSpaces('+12345')).toBe(`+12${SPACES.nb}345`);
		expect(smartNumberSpaces('-12345')).toBe(`-12${SPACES.nb}345`);
	});
});

// ─────────────────────────────────────────────
// typography/store
// ─────────────────────────────────────────────
describe('typographyRules store', () => {
	it('includes common, ru, en locales after init', () => {
		expect(typographyRules).toHaveProperty('common');
		expect(typographyRules).toHaveProperty('ru');
		expect(typographyRules).toHaveProperty('en');
		expect(Array.isArray(typographyRules['common'])).toBe(true);
	});

	it('getWeightedRules sorts by weight ascending', () => {
		const locale = `weighted-${Date.now()}`;
		const heavy = newRule(/b/g, 'B', 100);
		const light = newRule(/a/g, 'A', 1);
		registerRule(locale, heavy);
		registerRule(locale, light);
		const result = getWeightedRules(locale);
		const localeRules = result.filter((r) => r === heavy || r === light);
		expect(localeRules.indexOf(light)).toBeLessThan(localeRules.indexOf(heavy));
	});

	it('getWeightedRules preserves insertion order for equal-weight rules', () => {
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

	// store.ts lines 9, 17-18 — getWeightedRules when common is empty (reset state)
	it('getWeightedRules returns [] when both common and locale are empty', () => {
		const saved = { ...typographyRules };
		resetTypographyRules();
		expect(getWeightedRules('nonexistent-locale-xyz')).toEqual([]);
		Object.assign(typographyRules, saved);
	});

	// store.ts line 9 — only locale rules exist, common is empty
	it('getWeightedRules works when only locale rules exist (no common)', () => {
		const saved = { ...typographyRules };
		resetTypographyRules();

		const locale = `only-locale-${Date.now()}`;
		const rule = newRule(/q/g, 'Q', 1);
		registerRule(locale, rule);

		const result = getWeightedRules(locale);
		expect(result).toContain(rule);

		Object.assign(typographyRules, saved);
	});

	// store.ts lines 17-18 — locale is empty/missing, only common rules
	it('getWeightedRules returns only common rules when locale is missing', () => {
		const saved = { ...typographyRules };
		resetTypographyRules();

		const commonRule = newRule(/w/g, 'W', 0);
		registerRule('common', commonRule);

		const result = getWeightedRules('nonexistent-locale-abc');
		expect(result).toContain(commonRule);

		Object.assign(typographyRules, saved);
	});

	it('resetTypographyRules empties all arrays', () => {
		const locale = `reset-test-${Date.now()}`;
		registerRule(locale, newRule(/z/g, 'Z'));
		resetTypographyRules();
		for (const key of Object.keys(typographyRules)) {
			expect(typographyRules[key]).toEqual([]);
		}
	});
});

// ─────────────────────────────────────────────
// typography/rules — applyDefaultRules
// ─────────────────────────────────────────────
describe('applyDefaultRules()', () => {
	// rules.ts line 7 — key not in defaultRules → no-op
	it('does nothing for an unknown locale key', () => {
		const before = { ...typographyRules };
		applyDefaultRules('nonexistent-locale-key-xyz');
		// store должен остаться без нового ключа
		expect(typographyRules['nonexistent-locale-key-xyz']).toBeUndefined();
		Object.assign(typographyRules, before);
	});

	it('applies known locale without throwing', () => {
		// 'common' уже применён при инициализации — повторный вызов не должен падать
		expect(() => applyDefaultRules('common')).not.toThrow();
		expect(Array.isArray(typographyRules['common'])).toBe(true);
	});
});

// ─────────────────────────────────────────────
// helpers — PROTECTED_PATTERNS
// ─────────────────────────────────────────────
describe('PROTECTED_PATTERNS', () => {
	// helpers.ts lines 26-32 — .values getter
	it('.values returns an array of RegExp', () => {
		const vals = PROTECTED_PATTERNS.values;
		expect(Array.isArray(vals)).toBe(true);
		expect(vals.length).toBeGreaterThan(0);
		for (const v of vals) expect(v).toBeInstanceOf(RegExp);
	});

	it('.values does not include the getter itself', () => {
		const vals = PROTECTED_PATTERNS.values;
		// Каждый элемент должен быть RegExp, не функцией
		for (const v of vals) expect(typeof v).not.toBe('function');
	});

	// helpers.ts lines 34-40 — Symbol.iterator
	it('is iterable via for..of and yields RegExp values', () => {
		const collected: unknown[] = [];
		for (const pattern of PROTECTED_PATTERNS) {
			collected.push(pattern);
		}
		expect(collected.length).toBeGreaterThan(0);
		for (const p of collected) expect(p).toBeInstanceOf(RegExp);
	});

	it('iterator and .values yield the same patterns', () => {
		const fromIterator: unknown[] = [];
		for (const p of PROTECTED_PATTERNS) fromIterator.push(p);
		expect(fromIterator).toEqual(PROTECTED_PATTERNS.values);
	});

	it('matches email addresses', () => {
		const re = new RegExp(PROTECTED_PATTERNS.email.source, 'g');
		expect('user@example.com'.match(re)).not.toBeNull();
	});

	it('matches URLs', () => {
		const re = new RegExp(PROTECTED_PATTERNS.url.source, 'g');
		expect('https://example.com/path'.match(re)).not.toBeNull();
	});
});

// ─────────────────────────────────────────────
// glyphs — createProtoSet / createCharacterSet
// ─────────────────────────────────────────────
describe('glyphs helpers', () => {
	it('createCharacters produces an object with join()', () => {
		const chars = createCharacters({ a: 'A', b: 'B' });
		expect(chars.a).toBe('A');
		expect(chars.join('+')).toBe('A+B');
		expect(chars.join()).toBe('A|B'); // default joiner
	});

	// glyphs/index.ts lines 19-20 — createProtoSet.get() with missing common key
	it('createProtoSet.get() merges common and locale entries, handles missing locale key', () => {
		const dotChars = createCharacters({ dot: '.' });
		const exclChars = createCharacters({ excl: '!' });

		const set = createCharacterSet({
			common: { marks: dotChars },
			en: { marks: exclChars },
			fr: { marks: createCharacters({}) }, // fr не имеет своего dot
		});

		// en: common { dot:'.' } + locale { excl:'!' } → merged
		const enMarks = set.get('en', 'marks');
		expect(Object.prototype.hasOwnProperty.call(enMarks, 'dot')).toBe(true);
		expect(Object.prototype.hasOwnProperty.call(enMarks, 'excl')).toBe(true);

		// fr: locale пустой → только common (строки 19-20: localeEntry = {})
		const frMarks = set.get('fr', 'marks');
		expect(Object.prototype.hasOwnProperty.call(frMarks, 'dot')).toBe(true);
		expect(Object.prototype.hasOwnProperty.call(frMarks, 'excl')).toBe(false);
	});

	// createProtoSet без common вовсе — commonEntry падает в {}
	it('createProtoSet.get() works when common is absent', () => {
		const openClose = createCharacters({ open: '„', close: '"' });

		const set = createCharacterSet({
			de: { quotes: openClose },
		});

		const deQuotes = set.get('de', 'quotes');
		expect(Object.prototype.hasOwnProperty.call(deQuotes, 'open')).toBe(true);
		expect(Object.prototype.hasOwnProperty.call(deQuotes, 'close')).toBe(true);
	});
});
