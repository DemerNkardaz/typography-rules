import { typographyRules } from '@/typography/store';
import type { Rule } from '@/types';

import * as sets from '@/typography/sets';
import * as markupSets from '@/typography/markup';

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
const defaultTypographyRules: Record<string, Rule[]> = {};
const defaultMarkupRules: Record<string, Rule[]> = {};

for (const [locale, rules] of Object.entries(sets)) {
	defaultTypographyRules[locale] = rules;
}

for (const [locale, rules] of Object.entries(markupSets)) {
	defaultMarkupRules[locale] = rules;
}

/**
 * Available typography rule groups.
 *
 * Represents all supported locale keys in the default ruleset.
 */
export type defaultRuleKeys = keyof typeof defaultTypographyRules;

/**
 * Runtime list of available typography rule groups.
 */
export const defaultRuleKeys = Object.keys(
	defaultTypographyRules
) as (keyof typeof defaultTypographyRules)[];

function initRules(defaults: Record<string, Rule[]>, from: string[]): void {
	const keys = from.length === 0 ? Object.keys(defaults) : from;

	for (const key of keys) {
		if (!typographyRules[key]) {
			typographyRules[key] = [];
		}
		typographyRules[key].push(...(defaults[key] ?? []));
	}
}

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
 * @param from Optional locale keys to apply specific rule group
 */
export function initTypographyRules(...from: (keyof typeof defaultTypographyRules)[]): void {
	initRules(defaultTypographyRules, from);
}

export function initMarkupRules(...from: (keyof typeof defaultMarkupRules)[]): void {
	initRules(defaultMarkupRules, from);
}
