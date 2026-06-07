import type { Rule } from '@/types';
import { typographyRules } from '@/typography/store';

/**
 * Registers one or more typography rules for a locale.
 *
 * Automatically invalidates the weighted rules cache
 * for the affected locale and “common”.
 *
 * @param locale Locale code (e.g. "en", "de", "fr").
 * @param rules A sequence of rules[].
 */
function registerRule(locale: string, ...rules: Rule[]): void;

function registerRule(locale: string, ...rules: Rule[]): void {
	if (!typographyRules[locale]) {
		typographyRules[locale] = [];
	}

	const target = typographyRules[locale]!;

	target.push(...rules);

	typographyRules[locale] = target;
}

export { registerRule };
