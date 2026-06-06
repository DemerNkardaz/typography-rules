import type { GlyphStringMap, GlyphData, GlyphSet, GlyphSetInterface, ProtoSet } from './types';

export type * from './types';

const proto = {
	join(this: GlyphStringMap, joiner = '|'): string {
		return Object.values(this).join(joiner);
	},
};

/**
 * Creates a glyph set with prototype utilities attached.
 *
 * This function wraps a plain glyph dictionary and attaches shared
 * prototype methods (e.g. `join`) without modifying the original data.
 *
 * Used as the base building block for all character registries.
 *
 * @template T - Glyph dictionary shape
 * @param data - Raw glyph key-value map
 * @returns A glyph set with prototype methods enabled
 */
export function createCharacters<T extends GlyphData>(data: T): GlyphSet<T> {
	return Object.assign(Object.create(proto), data) as GlyphSet<T>;
}

/**
 * Creates a prototype set for grouped glyph access.
 *
 * Provides a `get` method that merges:
 * - shared `common` glyphs
 * - locale-specific glyph overrides
 *
 * This enables hierarchical glyph resolution:
 * common → locale → final glyph set
 *
 * @template T - Structure containing optional `common` and locale groups
 * @returns Prototype object with grouped access logic
 */
export function createProtoSet<
	T extends { common?: Record<string, GlyphSetInterface> },
>(): ProtoSet<T> {
	return {
		get(dataSet, key) {
			const commonEntry = (this.common as Record<string, object>)?.[key as string] ?? {};
			const localeEntry = (this[dataSet] as Record<string, object>)?.[key as string] ?? {};

			return createCharacters({ ...commonEntry, ...localeEntry } as GlyphData);
		},
	};
}

/**
 * Creates a full character registry with grouped access support.
 *
 * Combines:
 * - raw character data groups (e.g. common, en, ru, fr)
 * - prototype-based access layer
 * - hierarchical resolution via ProtoSet
 *
 * This is the main entry point for building locale-aware
 * glyph/typography registries.
 *
 * @template T - Character set structure with optional `common` group
 * and locale-specific groups
 *
 * @param data - Structured glyph registry
 * @returns Character set with grouped access methods
 */
export function createCharacterSet<
	T extends { common?: Record<string, GlyphSetInterface> } & Record<
		string,
		Record<string, GlyphSetInterface>
	>,
>(data: T) {
	return Object.assign(Object.create(createProtoSet<T>()), data) as T & ProtoSet<T>;
}

/**
 * Uncategorized set of characters.
 */
export const CHARACTERS = createCharacters({
	dagger: '\u2020', // †
	daggerLeftGuard: '\u2E36', // ⸶
	daggerRightGuard: '\u2E37', // ⸷
	doubleDagger: '\u2021', // ‡
	tripleDagger: '\u2E4B', // ⹋
	turnedDagger: '\u2E38', // ⸸
	numero: '\u2116', // №
	number: '#',
	section: '\u00A7', // §
	sectionTopHalf: '\u2E39', // ⸹
	at: '@',
} as const);

/**
 * Ligatures and extended typographic characters.
 *
 * These characters are used for:
 * - typographic replacement (fi → ﬁ)
 * - historical / extended Latin orthography
 * - improved text rendering in typography pipelines
 */
export const LIGATURES = createCharacters({
	fi: '\uFB01', // fi
	fl: '\uFB02', // fl
	ffi: '\uFB03', // ffi
	ffl: '\uFB04', // ffl
	AA: '\uA732', // Ꜳ
	aa: '\uA733', // ꜳ
	AE: '\u00C6', // Æ
	ae: '\u00E6', // æ
	AO: '\uA734', // Ꜵ
	ao: '\uA735', // ꜵ
	AU: '\uA736', // Ꜷ
	au: '\uA737', // ꜷ
	AV: '\uA738', // Ꜹ
	av: '\uA739', // ꜹ
	AY: '\uA73C', // Ꜽ
	ay: '\uA73D', // ꜽ
	OE: '\u0152', // Œ
	oe: '\u0153', // œ
} as const);

/**
 * Typographic dash and hyphen variants.
 *
 * Includes:
 * - standard dashes (em/en)
 * - historical extended dashes
 * - soft hyphenation control
 * - non-breaking and figure-specific variants
 *
 * Used in:
 * - typography normalization
 * - text formatting pipelines
 * - language-specific hyphen rules
 */
export const DASHES = createCharacters({
	em: '\u2014', // — Em dash
	en: '\u2013', // – En dash
	twm: '\u2E3A', // ⸺ Two-em dash
	thm: '\u2E3B', // ⸻ Three-em dash
	sh: '\u00AD', // Soft hyphen
	fig: '\u2012', // ‒ Figure dash
	h: '\u2010', // ‐ Hyphen
	dh: '\u2E40', // ⹀ Double hyphen
	nbh: '\u2011', // ‑ Non-breaking hyphen
	hb: '\u2015', // ― Horizontal bar
	hm: '-', // Hyphen minus
	u: '_', // Underscore
} as const);

/**
 * Typographic space characters used in advanced text formatting.
 *
 * This registry includes:
 * - standard Unicode spaces (en/em/etc.)
 * - punctuation and figure spacing
 * - zero-width and non-breaking variants
 *
 * Used for:
 * - smart number formatting
 * - typography normalization
 * - locale-aware spacing rules
 * - text layout control
 */
export const SPACES = createCharacters({
	_: '\u0020', // Space
	nb: '\u00A0', // Non-breaking space
	en: '\u2002', // En space
	em: '\u2003', // Em space
	tem: '\u2004', // Three-per-em
	fem: '\u2005', // Four-per-em
	sem: '\u2006', // Six-per-em
	fig: '\u2007', // Figure space
	punct: '\u2008', // Punctuation space
	thin: '\u2009', // Thin space
	hair: '\u200A', // Hair space
	zw: '\u200B', // Zero-width
	nnb: '\u202F', // Narrow non-breaking space
	mm: '\u205F', // Medium mathematical space
	id: '\u3000', // Ideographic space
	zwnb: '\uFEFF', // Zero-width non-breaking space
} as const);

/**
 * Mathematical symbols used in typography processing.
 *
 * Includes:
 * - arithmetic operators (e.g. minus sign)
 * - mathematical punctuation (e.g. fraction slash)
 *
 * These characters are used for:
 * - normalization of math expressions
 * - typographic correction of ASCII math symbols
 */
export const MATHS = createCharacters({
	minus: '\u2212', // −
	fractionSlash: '\u2044', // ⁄
} as const);

/**
 * Temperature unit symbols in both scientific and typographic forms.
 *
 * Includes:
 * - SI and Unicode-prefixed temperature units (℃, ℉, K)
 * - textual temperature formats (°C, °F, etc.)
 * - historical and non-standard scale representations
 *
 * Used for:
 * - text normalization
 * - unit standardization
 * - scientific text formatting
 */
export const TEMPERATURES = createCharacters({
	celsiusSolid: '\u2103', // ℃
	fahrenheitSolid: '\u2109', // ℉
	kelvin: '\u212A', // K
	celsius: '°C',
	fahrenheit: '°F',
	delisle: '°D',
	leiden: '°L',
	newton: '°N',
	wedgewood: '°W',
	dalton: '°Da',
	hooke: '°H',
	rankine: '°R',
	reaumur: '°R[eé]',
	romer: '°R[oø]',
} as const);

/**
 * Multi-language punctuation character registry.
 *
 * Organized by:
 * - common punctuation (shared across languages)
 * - language-specific punctuation rules (ru, en, fr, is)
 *
 * Includes:
 * - quotes (outer / inner)
 * - inverted punctuation
 * - extended punctuation marks (medieval, interrobang, etc.)
 *
 * Used for:
 * - smart quote replacement
 * - typographic normalization
 * - locale-aware punctuation transformation
 */
export const PUNCTUATION = createCharacterSet({
	common: {
		// Shared
		generic: createCharacters({
			apostrophe: '\u2019', // ’
		} as const),
		leftSided: createCharacters({
			invertedExclamation: '\u00A1', // ¡
			invertedQuestion: '\u00BF', // ¿
			invertedInterrobang: '\u2E18', // ⸘
		} as const),
		rightSided: createCharacters({
			exclamation: '!',
			doubleExclamation: '\u203C', // ‼
			exclamationQuestion: '\u2049', // ⁉
			exclamationMedieval: '\u2E53', // ⹓
			question: '?',
			doubleQuestion: '\u2047', // ⁇
			questionExclamation: '\u2048', // ⁈
			questionMedieval: '\u2E54', // ⹔
			reversedQuestion: '\u2E2E', // ⸮
			interrobang: '\u203D', // ‽
			dot: '.',
			comma: ',',
			commaMedieval: '\u2E4C', // ⹌
			ellipsis: '\u2026', // …
		} as const),
		colons: createCharacters({
			colon: ':',
			semicolon: ';',
			punctusElevatus: '\u2E4E', // ⹎
		} as const),
	},
	ru: {
		// Russian
		leftSided: createCharacters({
			outerQuoteOpen: '\u00AB', // «
			innerQuoteOpen: '\u201E', // „
		} as const),
		rightSided: createCharacters({
			outerQuoteClose: '\u00BB', // »
			innerQuoteClose: '\u201D', // “
		} as const),
	},
	en: {
		// English
		leftSided: createCharacters({
			outerQuoteOpen: '\u201C', // “
			innerQuoteOpen: '\u2018', // ‘
		} as const),
		rightSided: createCharacters({
			outerQuoteClose: '\u201D', // ”
			innerQuoteClose: '\u2019', // ’
		} as const),
	},
	fr: {
		// Français
		leftSided: createCharacters({
			outerQuoteOpen: '\u00AB', // «
			innerQuoteOpen: '\u2039', // ‹
		} as const),
		rightSided: createCharacters({
			outerQuoteClose: '\u00BB', // »
			innerQuoteClose: '\u203A', // ›
		} as const),
	},
	is: {
		// Íslenska
		leftSided: createCharacters({
			outerQuoteOpen: '\u201E', // „
			innerQuoteOpen: '\u201A', // ‚
		} as const),
		rightSided: createCharacters({
			outerQuoteClose: '\u201C', // “
			innerQuoteClose: '\u2018', // ‘
		} as const),
	},
});

/**
 * Numeric and numeral character set including:
 * - ASCII digits (0–9)
 * - Roman numeral Unicode characters (capital and small forms)
 *
 * Used for:
 * - digit normalization
 * - roman numeral processing
 * - typography-aware number rendering
 */
export const DIGITS = createCharacters({
	zero: '0',
	one: '1',
	two: '2',
	three: '3',
	four: '4',
	five: '5',
	six: '6',
	seven: '7',
	eight: '8',
	nine: '9',

	roman_capital_one: '\u2160',
	roman_capital_two: '\u2161',
	roman_capital_three: '\u2162',
	roman_capital_four: '\u2163',
	roman_capital_five: '\u2164',
	roman_capital_six: '\u2165',
	roman_capital_six_late_form: '\u2185',
	roman_capital_seven: '\u2166',
	roman_capital_eight: '\u2167',
	roman_capital_nine: '\u2168',
	roman_capital_ten: '\u2169',

	roman_capital_eleven: '\u216A',
	roman_capital_twelve: '\u216B',
	roman_capital_fifty: '\u216C',
	roman_capital_fifty_early_form: '\u2186',
	roman_capital_one_hundred: '\u216D',
	roman_capital_one_hundred_reversed: '\u2183',
	roman_capital_five_hundred: '\u216E',

	roman_capital_one_thousand: '\u216F',
	roman_capital_five_thousand: '\u2181',
	roman_capital_ten_thousand: '\u2182',
	roman_capital_fifty_thousand: '\u2187',
	roman_capital_one_hundred_thousand: '\u2188',

	roman_small_one: '\u2170',
	roman_small_two: '\u2171',
	roman_small_three: '\u2172',
	roman_small_four: '\u2173',
	roman_small_five: '\u2174',
	roman_small_six: '\u2175',
	roman_small_seven: '\u2176',
	roman_small_eight: '\u2177',
	roman_small_nine: '\u2178',
	roman_small_ten: '\u2179',

	roman_small_eleven: '\u217A',
	roman_small_twelve: '\u217B',
} as const);

/**
 * Currency and monetary symbols registry.
 *
 * Includes:
 * - Unicode currency symbols (€, $, ₿, ₴, etc.)
 * - historical and regional currency signs
 * - roman and archaic monetary units
 * - ISO 4217 currency codes (e.g. USD, EUR, JPY)
 *
 * This registry is used for:
 * - currency normalization in text
 * - typography-aware financial formatting
 * - currency symbol replacement in parsed text
 *
 * Note:
 * Some entries represent ISO codes rather than glyphs,
 * depending on context of usage in formatting pipelines.
 */
export const WALLET = createCharacters({
	// symbols
	anis: '\u00A4', // ¤
	european_currency_unit: '\u20A0', // ₠
	austral: '\u20B3', // ₳
	cent: '\u00A2', // ¢
	cedi: '\u20B5', // ₵
	colon: '\u20A1', // ₡
	dollar: '\\$',
	drachma: '\u20AF', // ₯
	dram: '\u058F', // ֏
	doromi: '\u07FE',

	euro: '\u20AC', // €
	franc: '\u20A3', // ₣
	guarani: '\u20B2', // ₲
	kip: '\u20AD', // ₭
	lari: '\u20BE', // ₾
	naira: '\u20A6', // ₦
	pound: '\u00A3', // £
	tournois: '\u20B6', // ₶
	spesmillo: '\u20B7', // ₷
	ruble_symbol: '\u20BD', // ₽

	hryvnia: '\u20B4', // ₴
	lira: '\u20A4', // ₤
	lira_turkish: '\u20BA', // ₺
	baht: '\u0E3F', // ฿
	rupee: '\u20B9', // ₹
	won: '\u20A9', // ₩
	yen: '\u00A5', // ¥
	yen_kanji: '\u5186', // 円
	yuan_hanzi: '\u5143', // 元
	dong: '\u20AB', // ₫
	tugrik: '\u20AE', // ₮

	tenge: '\u20B8', // ₸
	shekel: '\u20AA', // ₪
	manat: '\u20BC', // ₼
	rupee_alt: '\u20A8', // ₨
	peseta: '\u20A7', // ₧
	peso: '\u20B1', // ₱
	riyal: '\uFDFC',
	bitcoin_symbol: '\u20BF', // ₿

	taka: '\u09F3', // ৳
	tamil_rupee: '\u0BF9', // ௹
	sinhala_rupee: '\u0DBB\u0DD4', // රු

	roman_sextans: '\u{10190}',
	roman_uncia: '\u{10191}',
	roman_semuncia: '\u{10192}',
	roman_sextula: '\u{10193}',
	roman_dimida_sextula: '\u{10194}',
	roman_siliqua: '\u{10195}',
	roman_denarius: '\u{10196}',
	roman_quinarius: '\u{10197}',
	roman_sestertius: '\u{10198}',
	roman_dupondius: '\u{10199}',
	roman_as: '\u{1019A}',

	// codes / ISO / crypto
	rub: 'RUB',
	usd: 'USD',
	eur: 'EUR',
	gbp: 'GBP',
	jpy: 'JPY',
	chf: 'CHF',
	cad: 'CAD',
	aud: 'AUD',
	nzd: 'NZD',
	pln: 'PLN',
	huf: 'HUF',

	brl: 'BRL',
	cny: 'CNY',
	twd: 'TWD',
	sgd: 'SGD',
	myr: 'MYR',
	idr: 'IDR',
	thb: 'THB',
	vnd: 'VND',
	krw: 'KRW',
	pkr: 'PKR',

	inr: 'INR',
	ils: 'ILS',
	qar: 'QAR',
	sar: 'SAR',
	aed: 'AED',
	omr: 'OMR',
	yem: 'YER',
	jod: 'JOD',
	iqd: 'IQD',
	kwd: 'KWD',

	bhd: 'BHD',
	tnd: 'TND',
	egp: 'EGP',
	syp: 'SYP',
	lbp: 'LBP',
	czk: 'CZK',
	sek: 'SEK',
	nok: 'NOK',
	dkk: 'DKK',
	hrk: 'HRK',

	rsd: 'RSD',
	bgn: 'BGN',
	ron: 'RON',
	uah: 'UAH',
	kzt: 'KZT',
	gel: 'GEL',
	amd: 'AMD',
	mxn: 'MXN',
	clp: 'CLP',
	cop: 'COP',

	ars: 'ARS',
	zar: 'ZAR',
	try: 'TRY',
	php: 'PHP',
	ngn: 'NGN',

	lkr: 'LKR',
	bdt: 'BDT',

	usdt: 'USDT',
	btc: 'BTC',
	eth: 'ETH',
	xrp: 'XRP',
	sol: 'SOL',
	bnb: 'BNB',
	usdc: 'USDC',
} as const);

// Glyph Types

export type GlyphValues<T> = {
	[K in keyof T]: T[K] extends string ? T[K] : never;
}[keyof T & string];

export type GlyphGroupValues<T> = {
	[K in keyof T]: GlyphValues<T[K]>;
}[keyof T];

export type Characters = GlyphValues<typeof CHARACTERS>;

export type Dashes = GlyphValues<typeof DASHES>;

export type Spaces = GlyphValues<typeof SPACES>;

export type Maths = GlyphValues<typeof MATHS>;

export type Temperature = GlyphValues<typeof TEMPERATURES>;

export type Punctuation = GlyphGroupValues<typeof PUNCTUATION>;

export type Digits = GlyphGroupValues<typeof DIGITS>;

export type Wallet = GlyphValues<typeof WALLET>;
