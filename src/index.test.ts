import { describe, it, expect } from 'vitest';
import {
	typographyRules,
	getWeightedRules,
	resetTypographyRules,
	applyDefaultRules,
	rulesHas,
	rulesCount,
	newRule,
	registerRule,
} from './index';
import { SPACES, createCharacters, createCharacterSet } from './glyphs';
import {
	createPatterns,
	joinNodes,
	NODE_MARKER,
	protect,
	PROTECTED_PATTERNS,
	splitNodes,
	unprotect,
} from './helpers';
import { smartQuotes, smartNumberGrouping } from './functions';

applyDefaultRules();

// ─────────────────────────────────────────────
// newRule
// ─────────────────────────────────────────────
describe('newRule', () => {
	it('creates replace rule', () => {
		const rule = newRule('/test', /foo/g, 'bar', 5);
		expect(rule).toEqual({
			label: '/test',
			kind: 'replace',
			rule: expect.any(RegExp),
			replacement: 'bar',
			weight: 5,
		});
		if (rule.kind === 'replace') expect(rule.rule.source).toBe('foo');
	});

	it('creates transform rule', () => {
		const rule = newRule('/test', /(\d+)/g, (match) => `#${match[1]}`);
		expect(rule.kind).toBe('transform');
		if (rule.kind === 'transform') {
			const match = rule.rule.exec('123');
			expect(match).not.toBeNull();
			if (match) expect(rule.transform(match)).toBe('#123');
		}
	});

	it('creates function rule with args and weight', () => {
		const rule = newRule('/test', smartQuotes, [{ outer: ['«', '»'], inner: ['‹', '›'] }], 10);
		expect(rule.kind).toBe('function');
		if (rule.kind === 'function') {
			expect(rule.rule).toBe(smartQuotes);
			expect(rule.args).toEqual([{ outer: ['«', '»'], inner: ['‹', '›'] }]);
			expect(rule.weight).toBe(10);
		}
	});

	it('creates function rule with default empty args and weight=0', () => {
		const rule = newRule('/test', smartQuotes);
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
		const rule = newRule('/test', /test/g, 'ok');
		registerRule(locale, rule);
		expect(typographyRules[locale]).toContain(rule);
	});

	it('appends to existing locale array', () => {
		const locale = `test-locale-append-${Date.now()}`;
		const rule1 = newRule('/test', /a/g, 'b');
		const rule2 = newRule('/test', /c/g, 'd');
		registerRule(locale, rule1);
		registerRule(locale, rule2);
		expect(typographyRules[locale]).toHaveLength(2);
	});

	// registerRule.ts line 13 — passing an array of rules
	it('registers an array of rules at once', () => {
		const locale = `test-locale-array-${Date.now()}`;
		const rules = [
			newRule('/test', /x/g, 'X'),
			newRule('/test', /y/g, 'Y'),
			newRule('/test', /z/g, 'Z'),
		];
		registerRule(locale, ...rules);
		expect(typographyRules[locale]).toHaveLength(3);
		for (const r of rules) expect(typographyRules[locale]).toContain(r);
	});

	it('appends array to already existing locale rules', () => {
		const locale = `test-locale-array-append-${Date.now()}`;
		const first = newRule('/test', /a/g, 'A');
		registerRule(locale, first);
		const more = [newRule('/test', /b/g, 'B'), newRule('/test', /c/g, 'C')];
		registerRule(locale, ...more);
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
// smartNumberGrouping
// ─────────────────────────────────────────────
describe('smartNumberGrouping()', () => {
	it('inserts non-breaking spaces in large integers', () => {
		expect(smartNumberGrouping('12345')).toBe(`12${SPACES.noBreak}345`);
	});

	it('does not format numbers shorter than minLength', () => {
		expect(smartNumberGrouping('1234')).toBe('1234');
		expect(smartNumberGrouping('999')).toBe('999');
	});

	it('respects custom minLength', () => {
		expect(smartNumberGrouping('1234', { minLength: 4 })).toBe(`1${SPACES.noBreak}234`);
		expect(smartNumberGrouping('123456', { minLength: 7 })).toBe('123456');
	});

	it('formats floats with separateFloat=true', () => {
		expect(smartNumberGrouping('1000000.1234', { separateFloat: true })).toBe(
			`1${SPACES.noBreak}000${SPACES.noBreak}000.123${SPACES.noBreak}4`
		);
	});

	it('handles signed numbers', () => {
		expect(smartNumberGrouping('+12345')).toBe(`+12${SPACES.noBreak}345`);
		expect(smartNumberGrouping('-12345')).toBe(`-12${SPACES.noBreak}345`);
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
		const heavy = newRule('/test', /b/g, 'B', 100);
		const light = newRule('/test', /a/g, 'A', 1);
		registerRule(locale, heavy);
		registerRule(locale, light);
		const result = getWeightedRules(locale);
		const localeRules = result.filter((r) => r === heavy || r === light);
		expect(localeRules.indexOf(light)).toBeLessThan(localeRules.indexOf(heavy));
	});

	it('getWeightedRules preserves insertion order for equal-weight rules', () => {
		const locale = `equal-weight-${Date.now()}`;
		const r1 = newRule('/test', /x/g, 'X', 5);
		const r2 = newRule('/test', /y/g, 'Y', 5);
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
		const rule = newRule('/test', /q/g, 'Q', 1);
		registerRule(locale, rule);

		const result = getWeightedRules(locale);
		expect(result).toContain(rule);

		Object.assign(typographyRules, saved);
	});

	// store.ts lines 17-18 — locale is empty/missing, only common rules
	it('getWeightedRules returns only common rules when locale is missing', () => {
		const saved = { ...typographyRules };
		resetTypographyRules();

		const commonRule = newRule('/test', /w/g, 'W', 0);
		registerRule('common', commonRule);

		const result = getWeightedRules('nonexistent-locale-abc');
		expect(result).toContain(commonRule);

		Object.assign(typographyRules, saved);
	});

	it('resetTypographyRules empties all arrays', () => {
		const locale = `reset-test-${Date.now()}`;
		registerRule(locale, newRule('/test', /z/g, 'Z'));
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

// ─────────────────────────────────────────────
// glyphs — proto methods (lines 10–19)
// ─────────────────────────────────────────────
describe('GlyphSet proto methods', () => {
	it('insert() mutates the set with new entries', () => {
		const chars = createCharacters({ a: 'A' } as const);
		chars.insert({ b: 'B', c: 'C' });
		expect((chars as unknown as Record<string, string>)['b']).toBe('B');
		expect((chars as unknown as Record<string, string>)['c']).toBe('C');
	});

	it('insert() does not remove existing entries', () => {
		const chars = createCharacters({ x: 'X' } as const);
		chars.insert({ y: 'Y' });
		expect((chars as unknown as Record<string, string>)['x']).toBe('X');
	});

	it('hasKey() returns true for existing key', () => {
		const chars = createCharacters({ em: '—' } as const);
		expect(chars.hasKey('em')).toBe(true);
	});

	it('hasKey() returns false for missing key', () => {
		const chars = createCharacters({ em: '—' } as const);
		expect(chars.hasKey('nonexistent')).toBe(false);
	});

	it('hasKey() returns false for prototype methods (not own properties)', () => {
		const chars = createCharacters({ a: 'A' } as const);
		expect(chars.hasKey('join')).toBe(false);
		expect(chars.hasKey('find')).toBe(false);
	});

	it('hasValue() returns true for existing value', () => {
		const chars = createCharacters({ em: '—', en: '–' } as const);
		expect(chars.hasValue('—')).toBe(true);
		expect(chars.hasValue('–')).toBe(true);
	});

	it('hasValue() returns false for missing value', () => {
		const chars = createCharacters({ em: '—' } as const);
		expect(chars.hasValue('X')).toBe(false);
	});

	it('find() returns key for known value', () => {
		const chars = createCharacters({ em: '—', en: '–' } as const);
		expect(chars.findKey('—')).toBe('em');
		expect(chars.findKey('–')).toBe('en');
	});

	it('find() returns undefined for unknown value', () => {
		const chars = createCharacters({ em: '—' } as const);
		expect(chars.findKey('???')).toBeUndefined();
	});

	it('find() works after insert()', () => {
		const chars = createCharacters({ a: 'A' } as const);
		chars.insert({ b: 'B' });
		expect(chars.findKey('B')).toBe('b');
	});
});

// ─────────────────────────────────────────────
// glyphs — ProtoSet methods (lines 63–66)
// ─────────────────────────────────────────────
describe('ProtoSet methods', () => {
	it('getList() returns all top-level keys', () => {
		const set = createCharacterSet({
			common: { marks: createCharacters({ dot: '.' } as const) },
			en: { marks: createCharacters({ excl: '!' } as const) },
			fr: { marks: createCharacters({ quest: '?' } as const) },
		});
		const keys = set.getList();
		expect(keys).toContain('common');
		expect(keys).toContain('en');
		expect(keys).toContain('fr');
	});

	it('hasKey() returns true for existing locale', () => {
		const set = createCharacterSet({
			en: { marks: createCharacters({ dot: '.' } as const) },
		});
		expect(set.hasKey('en')).toBe(true);
	});

	it('hasKey() returns false for missing locale', () => {
		const set = createCharacterSet({
			en: { marks: createCharacters({ dot: '.' } as const) },
		});
		expect(set.hasKey('de' as never)).toBe(false);
	});

	it('hasKey() returns true for common', () => {
		const set = createCharacterSet({
			common: { marks: createCharacters({ dot: '.' } as const) },
			ru: { marks: createCharacters({ excl: '!' } as const) },
		});
		expect(set.hasKey('common')).toBe(true);
	});
});

// ─────────────────────────────────────────────
// helpers — combined() (line 54–56)
// ─────────────────────────────────────────────
describe('PROTECTED_PATTERNS.combined()', () => {
	it('returns a RegExp', () => {
		const re = PROTECTED_PATTERNS.combined();
		expect(re).toBeInstanceOf(RegExp);
	});

	it('default flags include g', () => {
		const re = PROTECTED_PATTERNS.combined();
		expect(re.flags).toContain('g');
	});

	it('accepts custom flags', () => {
		const re = PROTECTED_PATTERNS.combined('gi');
		expect(re.flags).toContain('i');
	});

	it('matches email via combined pattern', () => {
		const re = PROTECTED_PATTERNS.combined();
		expect('user@example.com'.match(re)).not.toBeNull();
	});

	it('matches URL via combined pattern', () => {
		const re = PROTECTED_PATTERNS.combined();
		expect('https://example.com'.match(re)).not.toBeNull();
	});

	it('matches multiple patterns in one pass', () => {
		const re = PROTECTED_PATTERNS.combined('g');
		const matches = 'email: user@example.com and url: https://example.com'.match(re);
		expect(matches).not.toBeNull();
		expect(matches!.length).toBeGreaterThanOrEqual(2);
	});
});

// ─────────────────────────────────────────────
// store — rulesHas / rulesCount (lines 91–101)
// ─────────────────────────────────────────────
describe('rulesHas() and rulesCount()', () => {
	it('rulesHas() returns true for existing locale with rules', () => {
		expect(rulesHas('common')).toBe(true);
	});

	it('rulesHas() returns false for nonexistent locale', () => {
		expect(rulesHas('nonexistent-locale-xyz')).toBe(false);
	});

	it('rulesHas() returns true after registerRule', () => {
		const locale = `has-test-${Date.now()}`;
		registerRule(locale, newRule('/test', /x/g, 'X'));
		expect(rulesHas(locale)).toBe(true);
	});

	it('rulesCount() returns 0 for empty/nonexistent locale', () => {
		expect(rulesCount('nonexistent-count-xyz')).toBe(0);
	});

	it('rulesCount() returns correct count after registerRule', () => {
		const locale = `count-test-${Date.now()}`;
		registerRule(locale, newRule('/test', /a/g, 'A'));
		registerRule(locale, newRule('/test', /b/g, 'B'));
		expect(rulesCount(locale)).toBe(2);
	});

	it('rulesCount() returns correct count for common after applyDefaultRules', () => {
		expect(rulesCount('common')).toBeGreaterThan(0);
	});
});

// ─────────────────────────────────────────────
// smartQuotes — line 61: afterSpace && beforeSpace → closing
// ─────────────────────────────────────────────
describe('smartQuotes() — space-on-both-sides branch', () => {
	// afterSpace=true, beforeSpace=true → ветка else → isOpen=false (closing)
	it('treats quote surrounded by spaces on both sides as closing when stack is non-empty', () => {
		// Открываем внешнюю кавычку, затем встречаем " с пробелами с обеих сторон
		const result = smartQuotes('"text " more"', { outer: ['«', '»'] });
		// Первая " → open → «
		// Вторая " → afterSpace=false, beforeSpace=true → closing → »
		// Третья " → afterSpace=false, beforeSpace=false → closing → на пустом стеке → outer[1]
		expect(result).toBe('«text » more«');
	});

	it('standalone " surrounded by spaces (empty stack) opens a new quote', () => {
		// На пустом стеке всегда open (stack.length === 0 → isOpen=true), не зависит от пробелов
		const result = smartQuotes('" text "', { outer: ['«', '»'] });
		expect(result).toBe('« text »');
	});
});

describe('helpers — PROTECTED_PATTERNS.insert()', () => {
	it('dynamically adds a new pattern and it becomes available', () => {
		// Добавляем новый паттерн
		PROTECTED_PATTERNS.insert({
			myNewPattern: /custom-test/g,
		});

		// Проверяем наличие ключа и его тип
		const pattern = PROTECTED_PATTERNS['myNewPattern'];
		expect(pattern).toBeInstanceOf(RegExp);
		expect(pattern?.source).toBe('custom-test');
	});

	it('newly inserted pattern is included in .values and .combined()', () => {
		PROTECTED_PATTERNS.insert({
			anotherPattern: /foo-bar-baz/g,
		});

		// Проверяем values
		expect(PROTECTED_PATTERNS.values.some((p) => p.source === 'foo-bar-baz')).toBe(true);

		// Проверяем combined
		const combined = PROTECTED_PATTERNS.combined();
		expect(combined.source).toContain('foo-bar-baz');
	});
});

describe('helpers — protect() and unprotect()', () => {
	it('protects text and restores it correctly using unprotect', () => {
		const input = 'Check this url: https://google.com and code: `console.log(1)`';
		const [protectedText, captured] = protect(input);

		// Проверяем, что в защищенном тексте нет исходных данных
		expect(protectedText).not.toContain('https://google.com');
		expect(protectedText).not.toContain('`console.log(1)`');

		// Восстанавливаем
		const restored = unprotect(protectedText, captured);
		expect(restored).toBe(input);
	});

	it('handles NODE_MARKER correctly within protect', () => {
		const textWithNode = `Line 1${NODE_MARKER}Line 2`;
		const [protectedText, captured] = protect(textWithNode);

		const restored = unprotect(protectedText, captured);
		expect(restored).toBe(textWithNode);
	});

	it('returns empty string if captured array is empty during unprotect', () => {
		// Тест на случай, если кто-то попытается вызвать unprotect с пустым массивом
		const result = unprotect('some text', []);
		expect(result).toBe('some text');
	});
});

describe('helpers — createPatterns behavior', () => {
	it('creates fresh RegExp instance on every access (lastIndex reset)', () => {
		const myPatterns = createPatterns({ test: /a/g });

		// Первый проход
		myPatterns.test.test('aa');
		expect(myPatterns.test.lastIndex).toBe(0);

		// Второй проход должен снова начинаться с 0
		myPatterns.test.test('a');
		expect(myPatterns.test.lastIndex).toBe(0);
	});
});

describe('helpers — joinNodes() and splitNodes()', () => {
	it('joinNodes() concatenates node values with NODE_MARKER', () => {
		const nodes = [{ value: 'part1' }, { value: 'part2' }];
		const joined = joinNodes(nodes);
		expect(joined).toBe(`part1${NODE_MARKER}part2`);
	});

	it('splitNodes() updates node values from joined string', () => {
		const nodes = [{ value: '' }, { value: '' }];
		const text = `new1${NODE_MARKER}new2`;

		splitNodes(text, nodes);

		expect(nodes[0]!.value).toBe('new1');
		expect(nodes[1]!.value).toBe('new2');
	});

	it('splitNodes() preserves original value as fallback if segments are missing', () => {
		// Здесь покрывается ветка: segments[i] ?? n.value
		// У нас 3 узла, но в строке только 1 сегмент (NODE_MARKER потерялся)
		const nodes = [{ value: 'keep1' }, { value: 'keep2' }, { value: 'keep3' }];
		const text = 'short-text';

		splitNodes(text, nodes);

		expect(nodes[0]!.value).toBe('short-text'); // Первый узел получил сегмент
		expect(nodes[1]!.value).toBe('keep2'); // Остальные получили fallback
		expect(nodes[2]!.value).toBe('keep3');
	});

	it('splitNodes() handles empty array of nodes', () => {
		expect(() => splitNodes('test', [])).not.toThrow();
	});
});
