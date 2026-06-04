import type { Rule } from '@/types';
export const typographyRules: Record<string, Rule[] | undefined> = {};

export function getRules() {
	return typographyRules;
}

export function getWeightedRules(locale: string): Rule[] {
	const common = typographyRules.common ?? [];
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

export function resetTypographyRules(): void {
	for (const key in typographyRules) {
		typographyRules[key] = [];
	}
}
