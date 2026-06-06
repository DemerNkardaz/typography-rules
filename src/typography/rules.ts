import { newRule, smartNumberSpaces, smartQuotes } from '@/functions';
import { DASHES, LIGATURES, MATHS, PUNCTUATION, SPACES, WALLET } from '@/glyphs';
import { typographyRules } from './store';
import type { Rule } from '@/types';

/**
 * Default typography transformation rules grouped by locale.
 *
 * Each group defines a pipeline of RegExp and functional rules
 * applied during text normalization and typographic processing.
 *
 * Structure:
 * - common: rules applied to all locales
 * - ru: Russian-specific typography rules
 * - en: English-specific typography rules
 *
 * Rules include:
 * - whitespace normalization
 * - dash and punctuation correction
 * - smart quotes processing
 * - currency spacing rules
 * - ligature substitution
 */
const defaultRules: Record<string, Rule[]> = {};

/**
 * Shared typography rules applied across all locales.
 *
 * Handles:
 * - whitespace normalization
 * - dash normalization (hyphens, en/em dashes)
 * - ellipsis conversion
 * - math symbol normalization
 * - number spacing rules
 * - apostrophe normalization
 *
 * This layer forms the base typography pipeline
 * before locale-specific transformations.
 */
defaultRules['common'] = [
	// Whitespace cleanup
	newRule(/\s+/g, ' '),
	newRule(/^\s|\s$/g, ''),

	// Dashes and special chars
	newRule(/(?<!\d)-(\d+)/g, `${MATHS.minus}$1`),
	newRule(/(\d+)-(\d+)/g, `$1${DASHES.en}$2`),
	newRule(/(\d+|[XIVCMLDZ\u2160-\u2188]+)-(\d+|[XIVCMLDZ\u2160-\u2188]+)/g, `$1${DASHES.en}$2`),
	newRule(
		new RegExp(
			`([${MATHS.minus}${DASHES.em}-])(\\d+)[${MATHS.minus}${DASHES.en}\\-]([${MATHS.minus}${DASHES.en}\\-]?\\d+)`,
			'g'
		),
		`$1$2${PUNCTUATION.common.rightSided.ellipsis}$3`
	),
	newRule(/--/g, DASHES.em),
	newRule(/\.\.\./g, PUNCTUATION.common.rightSided.ellipsis),

	newRule(smartNumberSpaces),
	newRule(/'/g, PUNCTUATION.common.generic.apostrophe, 200),
];

/**
 * Russian typography ruleset.
 *
 * Extends common rules with:
 * - Russian-style smart quotes
 * - spacing normalization for punctuation
 * - em-dash formatting rules
 * - currency formatting (RUB and others)
 * - abbreviation spacing rules
 * - grammatical particle spacing rules
 *
 * Designed for Cyrillic text normalization.
 */
defaultRules['ru'] = [
	// 0::Разное
	newRule(/(\d+)[\s\u00A0](%|\u2030|\u2031)/g, '$1$2'),
	newRule(
		smartQuotes,
		[
			{
				outer: [PUNCTUATION.ru.leftSided.outerQuoteOpen, PUNCTUATION.ru.rightSided.outerQuoteClose],
				inner: [PUNCTUATION.ru.leftSided.innerQuoteOpen, PUNCTUATION.ru.rightSided.innerQuoteClose],
			},
		],
		100
	),
	newRule(
		new RegExp(
			`(?<=[${PUNCTUATION.get('ru', 'leftSided').join('')}\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('ru', 'rightSided').join('')}\\)\\]])`,
			'g'
		),
		'',
		1000
	),
	newRule(/\.»/g, '».', 1000),
	newRule(
		new RegExp(
			`(?<!\\d\\s)([${WALLET.join()}])\\s(\\d{1,3}(?:\\d{3})*(?:,\\d+)?|\\d+(?:,\\d+)?)`,
			'g'
		),
		`$2${SPACES.nb}$1`
	),
	newRule(new RegExp(`(\\d+)\\s([${WALLET.join()}])`, 'g'), `$1${SPACES.nb}$2`),

	// 1::Тире
	newRule(new RegExp(`^(${DASHES.em})\\s`, 'gm'), `$1${SPACES.nb}`),
	newRule(
		new RegExp(`(?<=[${PUNCTUATION.get('ru', 'rightSided').join('')}])\\s${DASHES.em}\\s`, 'g'),
		`${SPACES.nb}${DASHES.em}${SPACES.nb}`
	),
	newRule(
		new RegExp(`(?<![${PUNCTUATION.get('ru', 'rightSided').join('')}])\\s${DASHES.em}\\s`, 'g'),
		`${SPACES.nb}${DASHES.em} `
	),

	// 3::Инициалы
	newRule(
		/([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ][a-zа-яё]+)/g,
		`$1${SPACES.thin}$2${SPACES.thin}$3`
	),
	newRule(
		/([A-ZА-ЯЁ][a-zа-яё]+)[\s]([A-ZА-ЯЁ]\.)[\s]([A-ZА-ЯЁ]\.)/g,
		`$1${SPACES.thin}$2${SPACES.thin}$3`
	),

	// 4::Союзы и прочее
	newRule(/\s(б|бы|ж|же|ли|ль)(?![а-яА-Я])/gi, `${SPACES.nb}$1`),
	newRule(
		/\s(за|из|до|об|на|но|не|ни|то|от|по|со|или|для|над|под|при|что|если|через|после|перед|г\.|обл\.|кр\.|ст\.|пос\.|с\.|д\.|ул\.|пер\.|пр\.|пр-т\.|просп\.|пл\.|бул\.|б-р\.|наб\.|ш\.|туп\.|оф\.|кв\.|комн\.|под\.|мкр\.|уч\.|вл\.|влад\.|стр\.|корп\.|литер|эт\.|пгт\.|гл\.|рис\.|илл\.|п\.|c\.|№|§|АО|ОАО|ЗАО|ООО|ПАО)\s/gi,
		` $1${SPACES.nb}`
	),

	// 5::Одиночные буквы
	newRule(/(?<![а-яА-ЯёЁa-zA-Z])([а-яА-ЯёЁa-zA-Z])\s/g, `$1${SPACES.nb}`),

	// 6::Конец абзаца
	newRule(
		new RegExp(
			`(?<=[а-яА-ЯёЁa-zA-Z])\\s(?=[а-яА-ЯёЁa-zA-Z]{1,12}[${PUNCTUATION.get('ru', 'rightSided').join('')}]*$)`,
			'gm'
		),
		SPACES.nb
	),
];

/**
 * English typography ruleset.
 *
 * Includes:
 * - smart quote replacement (US/UK style)
 * - ligature substitution (fi, fl, ffi, ffl)
 * - currency formatting normalization
 * - spacing cleanup for punctuation
 *
 * Designed for Latin-script typography processing.
 */
defaultRules['en'] = [
	newRule(
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
		new RegExp(
			`(?<=[${PUNCTUATION.get('en', 'leftSided').join('')}“‘\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('en', 'rightSided').join('')}”’\\)\\]])`,
			'g'
		),
		'',
		1000
	),
	newRule(new RegExp(`([${WALLET.join()}])\\s?(\\d+)`, 'g'), `$1$2`),
	newRule(/fi/g, LIGATURES.fi),
	newRule(/fl/g, LIGATURES.fl),
	newRule(/ffi/g, LIGATURES.ffi),
	newRule(/ffl/g, LIGATURES.ffl),
];

/**
 * Available typography rule groups.
 *
 * Represents all supported locale keys in the default ruleset.
 */
export type defaultRuleKeys = keyof typeof defaultRules;

/**
 * Runtime list of available typography rule groups.
 */
export const defaultRuleKeys = Object.keys(defaultRules) as (keyof typeof defaultRules)[];

/**
 * Applies default typography rules to the global typography registry.
 *
 * If no locale is specified:
 * - all rule groups are applied
 *
 * If locale is specified:
 * - only that group is applied
 *
 * This function initializes the typography pipeline
 * before processing text transformations.
 *
 * @param from - Optional locale key to apply specific rule group
 */
export function applyDefaultRules(from?: string): void {
	if (!from) {
		for (const key of defaultRuleKeys) {
			typographyRules[key] = defaultRules[key];
		}
		return;
	}

	if (defaultRules[from]) {
		typographyRules[from] = defaultRules[from];
	}
}
