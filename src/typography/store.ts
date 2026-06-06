import type { Rule } from '@/types';

/**
 * Global typography rule registry.
 *
 * Stores rule pipelines grouped by locale key.
 *
 * Structure:
 * - "common": rules applied to all locales
 * - "[locale]": locale-specific rule overrides
 *
 * Each entry contains a list of transformation rules
 * executed during typography processing.
 */
export const typographyRules: Record<string, Rule[] | undefined> = { common: [] };

/**
 * Returns a merged and weight-sorted rule pipeline.
 *
 * Combines:
 * - common rules
 * - locale-specific rules
 *
 * Sorting:
 * - rules are ordered by `weight` (ascending)
 * - rules without weight default to 0
 * - stable order is preserved for equal weights
 *
 * @param locale - Target locale key
 * @returns Flattened and sorted rule pipeline
 */
export function getWeightedRules(locale: string): Rule[] {
	const common = typographyRules['common'] ?? [];
	const localized = typographyRules[locale] ?? [];

	if (common.length === 0 && localized.length === 0) {
		return [];
	}

	return [...common, ...localized].sort((a, b) => {
		const weightA = a.weight ?? 0;
		const weightB = b.weight ?? 0;

		if (weightA !== weightB) {
			return weightA - weightB;
		}

		return 0;
	});
}

/**
 * Resets all typography rules in the registry.
 *
 * Clears all locale-specific pipelines including "common".
 * After reset, all rule groups become empty arrays.
 *
 * Useful for:
 * - testing
 * - reinitialization
 * - dynamic rule reloading
 */
export function resetTypographyRules(): void {
	for (const key in typographyRules) {
		typographyRules[key] = [];
	}
}

/**
 * Checks if a locale-specific rule pipeline exists.
 *
 * @param locale - Target locale key
 * @returns `true` if pipeline exists, `false` otherwise
 */
export function rulesHas(locale: string): boolean {
	return !!typographyRules[locale];
}

/**
 * Returns the number of rules in a locale-specific rule pipeline.
 *
 * @param locale - Target locale key
 * @returns Number of rules in the pipeline
 */
export function rulesCount(locale: string): number {
	return typographyRules[locale]?.length ?? 0;
}
