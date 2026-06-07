import type {
	FunctionRule,
	RegExpReplaceRule,
	RegExpTransformRule,
	Rule,
	RuleFunction,
} from '@/types';

/**
 * Creates a typography rule from RegExp or function-based logic.
 *
 * Supports three rule types:
 *
 * 1. Replace rule — simple string replacement
 * 2. Transform rule — dynamic replacement via match function
 * 3. Function rule — custom rule with arguments
 *
 * The resulting rule is later used in typography pipelines
 * to transform text based on matching patterns.
 *
 * @param rule — Rule definition:
 *  — RegExp for replace/transform rules
 *  — Function for function-based rules
 *
 * @param second — Either:
 *  — replacement string (for replace rule)
 *  — transform function (for transform rule)
 *  — arguments array (for function rule)
 *
 * @param weight — Priority of the rule (higher = applied later or earlier depending on engine)
 *
 * @returns A normalized Rule object:
 *  — `RegExpReplaceRule` if replacement string is provided
 *  — `RegExpTransformRule` if transform function is provided
 *  — `FunctionRule` if rule is a function
 *
 * @example
 * // Replace rule
 * newRule(/--/g, '—');
 *
 * @example
 * // Transform rule
 * newRule(/\\d+/g, m => `[${m[0]}]`);
 *
 * @example
 * // Function rule
 * newRule(myRuleFn, ['arg1', 'arg2']);
 */
function newRule(rule: RegExp, replacement: string, weight?: number): Rule;
function newRule(
	rule: RegExp,
	transform: (match: RegExpExecArray) => string,
	weight?: number
): Rule;
function newRule(rule: RuleFunction, args?: unknown[], weight?: number): Rule;

function newRule(
	rule: RegExp | RuleFunction,
	second?: string | ((match: RegExpExecArray) => string) | unknown[],
	weight = 0
): Rule {
	if (typeof rule === 'function') {
		return {
			kind: 'function',
			rule,
			args: Array.isArray(second) ? second : [],
			weight,
		} as FunctionRule;
	}

	if (typeof second === 'string') {
		return {
			kind: 'replace',
			rule: rule as RegExp,
			replacement: second,
			weight,
		} as RegExpReplaceRule;
	}

	return {
		kind: 'transform',
		rule: rule as RegExp,
		transform: second as (match: RegExpExecArray) => string,
		weight,
	} as RegExpTransformRule;
}

export { newRule };
