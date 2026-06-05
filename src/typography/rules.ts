import { newRule, smartNumberSpaces, smartQuotes } from '@/functions';
import { DASHES, MATHS, PUNCTUATION, SPACES, WALLET } from '@/glyphs';
import { typographyRules } from './store';
import type { Rule } from '@/types';

export function applyDefaultRules(from: string): void {
	if (defaultRules[from]) {
		typographyRules[from] = defaultRules[from];
	}
}

const defaultRules: Record<string, Rule[]> = {};

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

	// Numbers
	newRule(smartNumberSpaces, []),

	// Apostrophe
	newRule(/'/g, '\u2019', 200),
];

defaultRules['ru'] = [
	// 0::Разное
	newRule(/(\d+)[\s\u00A0](%|\u2030|\u2031)/g, '$1$2'),
	newRule(smartQuotes, [], 100),
	newRule(
		new RegExp(
			`(?<=[${PUNCTUATION.get('ru', 'leftSided').join('')}«„\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('ru', 'rightSided').join('')}»“\\)\\]])`,
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

defaultRules['en'] = [
	newRule(smartQuotes, [{ outer: ['“', '”'], inner: ['‘', '’'] }], 100),
	newRule(
		new RegExp(
			`(?<=[${PUNCTUATION.get('en', 'leftSided').join('')}“‘\\(\\[])\\s+|(?<!\\s)\\s(?=[${PUNCTUATION.get('en', 'rightSided').join('')}”’\\)\\]])`,
			'g'
		),
		'',
		1000
	),
	newRule(new RegExp(`([${WALLET.join()}])\\s?(\\d+)`, 'g'), `$1$2`),
	newRule(/fi/g, '\uFB01'),
	newRule(/fl/g, '\uFB02'),
	newRule(/ffi/g, '\uFB03'),
	newRule(/ffl/g, '\uFB04'),
];

export type defaultRuleKeys = keyof typeof defaultRules;
export const defaultRuleKeys = Object.keys(defaultRules) as (keyof typeof defaultRules)[];
