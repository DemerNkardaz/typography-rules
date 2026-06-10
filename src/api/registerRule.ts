import type { Rule } from '@/types';
import { typographyRules } from '@/typography/store';

interface LabelTransform {
	expression: RegExp;
	replacement: string;
}

/**
 * Registers one or more typography rules for a locale.
 *
 * Automatically invalidates the weighted rules cache
 * for the affected locale and “common”.
 *
 * @param locale Locale code (e.g. “en”, “de”, “fr”).
 * @param rules A sequence of rules[].
 */
function registerRule(locale: string, ...rules: Rule[]): void;

/**
 * Registers one or more typography rules for a locale,
 * inheriting all rules from a base locale.
 *
 * @param locale Locale code (e.g. “fr”, “de”).
 * @param withBase Locale code to inherit rules from (e.g. “en”).
 * @param rules A sequence of rules[] to add on top of the base.
 *
 * @example
 * // Inherit all “en” rules and add French-specific ones
 * registerRule('fr', 'en', frenchQuoteRule, frenchSpaceRule);
 */
function registerRule(locale: string, withBase: string, ...rules: Rule[]): void;
function registerRule(
	locale: string,
	withBase: string,
	label: LabelTransform,
	...rules: Rule[]
): void;

function registerRule(
	locale: string,
	...args: [string, LabelTransform?, ...Rule[]] | [string, ...Rule[]] | Rule[]
): void {
	if (!typographyRules[locale]) {
		typographyRules[locale] = [];
	}

	const target = typographyRules[locale]!;

	if (args.length > 0 && typeof args[0] === 'string') {
		const [withBase, maybeLabel, ...rest] = args as [
			string,
			LabelTransform | Rule | undefined,
			...Rule[],
		];

		const hasLabel =
			maybeLabel != null &&
			typeof maybeLabel === 'object' &&
			'expression' in maybeLabel &&
			'replacement' in maybeLabel;

		const label = hasLabel ? (maybeLabel as LabelTransform) : null;
		const rules = hasLabel ? (rest as Rule[]) : ([maybeLabel, ...rest].filter(Boolean) as Rule[]);

		const baseRules = (typographyRules[withBase] ?? []).map((rule) => {
			if (!label) return rule;

			const shallow = { ...rule };
			if (shallow.label) {
				shallow.label = shallow.label.replace(label.expression, label.replacement);
			}

			return shallow;
		});

		target.push(...baseRules, ...rules);
	} else {
		target.push(...(args as Rule[]));
	}

	typographyRules[locale] = target;
}

/**
 * Registers one or more typography rules for a locale,
 * inheriting all rules from a base locale.
 *
 * @param locale Locale code (e.g. “fr”, “de”).
 * @param base Locale code to inherit rules from (e.g. “en”).
 */
function rulesBase(
	locale: string,
	base: string,
	label: { expression: RegExp; replacement: string }
): void {
	registerRule(locale, base, label);
}

export { registerRule, rulesBase };
