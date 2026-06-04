export interface BaseRule {
	weight?: number;
}

export type RegExpReplaceRule = BaseRule & {
	kind: 'replace';
	rule: RegExp;
	replacement: string;
};

export type RegExpTransformRule = BaseRule & {
	kind: 'transform';
	rule: RegExp;
	transform: (match: RegExpExecArray) => string;
};

export type FunctionRule<
	TArgs extends unknown[] = unknown[],
	TFn extends (text: string, ...args: TArgs) => string = (text: string, ...args: TArgs) => string,
> = BaseRule & {
	kind: 'function';
	rule: TFn;
	args?: TArgs;
};

export type RuleFunction = (text: string, ...args: never[]) => string;

export type Rule = RegExpReplaceRule | RegExpTransformRule | FunctionRule;

export interface QuoteSettings {
	outer: [string, string];
	inner: [string, string];
}

export interface NumberSpaceSettings {
	minLength?: number;
	separateFloat?: boolean;
}
