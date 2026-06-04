import type {
	FunctionRule,
	RegExpReplaceRule,
	RegExpTransformRule,
	Rule,
	RuleFunction,
} from '@/types';

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

export default newRule;
export { newRule };
