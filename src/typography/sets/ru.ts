import { newRule, smartNumberSpaces, smartQuotes } from '@/functions';
import { PUNCTUATION, WALLET, SPACES, DASHES } from '@/glyphs';

/**
 * Russian typography ruleset.
 *
 * Extends common rules with:
 * — Russian-style smart quotes
 * — spacing normalization for punctuation
 * — em-dash formatting rules
 * — currency formatting (RUB and others)
 * — abbreviation spacing rules
 * — grammatical particle spacing rules
 *
 * Designed for Cyrillic text normalization.
 */
export default [
	// Adds a non-breaking space as a thousands separator, e.g. 1 234 567
	// Добавляет неразрывный пробел в качестве разделителя разрядов чисел
	newRule(smartNumberSpaces, [{ separator: SPACES.noBreak }]),

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
		`$2${SPACES.noBreak}$1`
	),
	newRule(new RegExp(`(\\d+)\\s([${WALLET.join()}])`, 'g'), `$1${SPACES.noBreak}$2`),

	// 1::Тире
	newRule(new RegExp(`^(${DASHES.em})\\s`, 'gm'), `$1${SPACES.noBreak}`),
	newRule(
		new RegExp(`(?<=[${PUNCTUATION.get('ru', 'rightSided').join('')}])\\s${DASHES.em}\\s`, 'g'),
		`${SPACES.noBreak}${DASHES.em}${SPACES.noBreak}`
	),
	newRule(
		new RegExp(`(?<![${PUNCTUATION.get('ru', 'rightSided').join('')}])\\s${DASHES.em}\\s`, 'g'),
		`${SPACES.noBreak}${DASHES.em} `
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
	newRule(/\s(б|бы|ж|же|ли|ль)(?![а-яА-Я])/gi, `${SPACES.noBreak}$1`),
	newRule(
		/\s(за|из|до|об|на|но|не|ни|то|от|по|со|или|для|над|под|при|что|если|через|после|перед|г\.|обл\.|кр\.|ст\.|пос\.|с\.|д\.|ул\.|пер\.|пр\.|пр-т\.|просп\.|пл\.|бул\.|б-р\.|наб\.|ш\.|туп\.|оф\.|кв\.|комн\.|под\.|мкр\.|уч\.|вл\.|влад\.|стр\.|корп\.|литер|эт\.|пгт\.|гл\.|рис\.|илл\.|п\.|c\.|№|§|АО|ОАО|ЗАО|ООО|ПАО)\s/gi,
		` $1${SPACES.noBreak}`
	),

	// 5::Одиночные буквы
	newRule(/(?<![а-яА-ЯёЁa-zA-Z])([а-яА-ЯёЁa-zA-Z])\s/g, `$1${SPACES.noBreak}`),

	// 6::Конец абзаца
	newRule(
		new RegExp(
			`(?<=[а-яА-ЯёЁa-zA-Z])\\s(?=[а-яА-ЯёЁa-zA-Z]{1,12}[${PUNCTUATION.get('ru', 'rightSided').join('')}]*$)`,
			'gm'
		),
		SPACES.noBreak
	),
];
