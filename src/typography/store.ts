import type { Rule } from '@/types';

const _rules: Record<string, Rule[] | undefined> = { common: [] };
const _cache = new Map<string, Rule[]>();

/**
 * Global typography rule registry.
 *
 * Stores rule pipelines grouped by locale key.
 *
 * Structure:
 * — "common": rules applied to all locales
 * — "[locale]": locale-specific rule overrides
 *
 * Each entry contains a list of transformation rules
 * executed during typography processing.
 *
 * Direct assignment (e.g. typographyRules['en'] = [...]) automatically
 * invalidates the weighted rules cache for the affected locale.
 */
export const typographyRules: Record<string, Rule[] | undefined> = new Proxy(_rules, {
	set(target, locale: string, value: Rule[] | undefined) {
		target[locale] = value;
		_cache.delete(locale);
		if (locale !== 'common') _cache.delete('common');
		return true;
	},
});

/**
 * Returns a merged and weight-sorted rule pipeline.
 *
 * Combines:
 * — common rules
 * — locale-specific rules
 *
 * Result is cached per locale and invalidated automatically
 * when rules are registered or reset for that locale.
 *
 * Sorting:
 * — rules are ordered by `weight` (ascending)
 * — rules without weight default to 0
 * — stable order is preserved for equal weights
 *
 * @param locale — Target locale key
 * @returns Flattened and sorted rule pipeline
 */
export function getWeightedRules(locale: string): Rule[] {
	if (_cache.has(locale)) return _cache.get(locale)!;

	const common = _rules['common'] ?? [];
	const localized = _rules[locale] ?? [];

	if (common.length === 0 && localized.length === 0) return [];

	const result = [...common, ...localized].sort((a, b) => {
		const weightA = a.weight ?? 0;
		const weightB = b.weight ?? 0;
		return weightA !== weightB ? weightA - weightB : 0;
	});

	_cache.set(locale, result);
	return result;
}

/**
 * Resets all typography rules in the registry.
 *
 * Clears all locale-specific pipelines including "common".
 * After reset, all rule groups become empty arrays.
 *
 * Useful for:
 * — testing
 * — reinitialization
 * — dynamic rule reloading
 */
export function resetTypographyRules(): void {
	for (const key in _rules) {
		_rules[key] = [];
	}
	_cache.clear();
}

/**
 * Checks if a locale-specific rule pipeline exists.
 *
 * @param locale — Target locale key
 * @returns `true` if pipeline exists and non-empty, `false` otherwise
 */
export function rulesHas(locale: string): boolean {
	return !!_rules[locale];
}

/**
 * Returns the number of rules in a locale-specific rule pipeline.
 *
 * @param locale — Target locale key
 * @returns Number of rules in the pipeline
 */
export function rulesCount(locale: string): number {
	return _rules[locale]?.length ?? 0;
}
