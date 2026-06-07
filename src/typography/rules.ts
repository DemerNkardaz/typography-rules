import { typographyRules } from './store';
import type { Rule } from '@/types';

import * as sets from './sets';

/**
 * Default typography transformation rules grouped by locale.
 *
 * Each group defines a pipeline of RegExp and functional rules
 * applied during text normalization and typographic processing.
 *
 * Structure:
 * — common: rules applied to all locales
 * — ru: Russian-specific typography rules
 * — en: English-specific typography rules
 *
 * Rules include:
 * — whitespace normalization
 * — dash and punctuation correction
 * — smart quotes processing
 * — currency spacing rules
 * — ligature substitution
 */
const defaultRules: Record<string, Rule[]> = {};

for (const [locale, rules] of Object.entries(sets)) {
	defaultRules[locale] = rules;
}

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
 * — all rule groups are applied
 *
 * If locale is specified:
 * — only that group is applied
 *
 * This function initializes the typography pipeline
 * before processing text transformations.
 *
 * @param from — Optional locale key to apply specific rule group
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
